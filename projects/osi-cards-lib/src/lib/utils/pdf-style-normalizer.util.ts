/**
 * PDF Style Normalizer Utility
 *
 * Normalizes CSS styles in a DOM tree to ensure PDF compatibility.
 * Converts unsupported color functions (like color-mix()) to supported formats
 * before PDF generation.
 */

import {
  normalizeColorForPdf,
  normalizeComplexColorValue,
  isUnsupportedColorFunction,
} from './color-conversion.util';

/**
 * CSS properties that can contain color values
 * These need to be normalized for PDF generation
 */
const COLOR_PROPERTIES = [
  'color',
  'background-color',
  'background',
  'border-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'outline-color',
  'outline',
  'box-shadow',
  'text-shadow',
  'fill',
  'stroke',
  'stop-color',
] as const;

/**
 * Get list of CSS properties that can contain colors
 */
export function getColorProperties(): readonly string[] {
  return COLOR_PROPERTIES;
}

/**
 * Normalize a single CSS property value for an element
 */
function normalizeComputedStyle(element: HTMLElement, property: string): void {
  try {
    const computed = window.getComputedStyle(element);
    const value = computed.getPropertyValue(property);

    if (!value || value.trim() === 'none' || value.trim() === '') {
      return; // No value to normalize
    }

    // Check if value contains unsupported color functions
    if (isUnsupportedColorFunction(value)) {
      // For simple color properties, use direct conversion
      if (property === 'color' || property === 'background-color') {
        const normalized = normalizeColorForPdf(value, element);
        if (normalized !== value) {
          element.style.setProperty(property, normalized, 'important');
        }
      } else {
        // For complex properties (background, border, box-shadow, etc.)
        // normalize any color functions within the value
        const normalized = normalizeComplexColorValue(value, element);
        if (normalized !== value) {
          element.style.setProperty(property, normalized, 'important');
        }
      }
    } else if (value.includes('var(')) {
      // Handle CSS custom properties that might resolve to color functions
      // Get the resolved value and check it
      const resolvedValue = computed.getPropertyValue(property);
      if (isUnsupportedColorFunction(resolvedValue)) {
        const normalized =
          property === 'color' || property === 'background-color'
            ? normalizeColorForPdf(resolvedValue, element)
            : normalizeComplexColorValue(resolvedValue, element);

        if (normalized !== resolvedValue) {
          element.style.setProperty(property, normalized, 'important');
        }
      }
    }
  } catch (error) {
    // Silently fail for individual properties - don't break PDF generation
    console.warn(`[PDFStyleNormalizer] Failed to normalize property ${property}:`, error);
  }
}

/**
 * Normalize all color-related styles in an element and its children
 * This ensures PDF compatibility by converting unsupported color functions
 *
 * Strategy: Inline ALL computed color-related styles to override stylesheet rules that html2canvas reads
 * html2canvas reads from stylesheets, so we need to inline computed values to override them
 */
export function normalizeStylesForPdf(element: HTMLElement): void {
  if (!element || !(element instanceof HTMLElement)) {
    return;
  }

  try {
    const computed = window.getComputedStyle(element);

    // Inline ALL color-related computed styles to override stylesheet rules
    // This ensures html2canvas uses our normalized values instead of reading from stylesheets
    // html2canvas reads from stylesheets, so we must inline computed values to override them
    for (const property of COLOR_PROPERTIES) {
      try {
        // Use getPropertyValue to get the actual computed value
        // This resolves CSS custom properties and color functions
        const computedValue = computed.getPropertyValue(property);

        if (computedValue && computedValue.trim() !== 'none' && computedValue.trim() !== '') {
          // Always inline the computed value to override stylesheet rules
          // The browser has already resolved color functions to rgb/rgba in computed styles
          // By inlining, we ensure html2canvas uses these resolved values instead of parsing stylesheets

          // Double-check: if computed value still contains color functions (shouldn't happen)
          // convert them explicitly
          if (isUnsupportedColorFunction(computedValue)) {
            // This shouldn't happen, but handle it just in case
            const normalized =
              property === 'color' || property === 'background-color'
                ? normalizeColorForPdf(computedValue, element)
                : normalizeComplexColorValue(computedValue, element);

            if (
              normalized &&
              normalized !== computedValue &&
              !isUnsupportedColorFunction(normalized)
            ) {
              element.style.setProperty(property, normalized, 'important');
            } else {
              // Fallback: inline the computed value anyway
              element.style.setProperty(property, computedValue, 'important');
            }
          } else {
            // Inline the computed value to override stylesheet rules
            // The browser has already resolved color functions to rgb/rgba
            element.style.setProperty(property, computedValue, 'important');
          }
        }
      } catch (propError) {
        // Skip this property if there's an error
        console.warn(`[PDFStyleNormalizer] Failed to normalize property ${property}:`, propError);
      }
    }

    // Also check inline styles that might contain color functions
    if (element.style && element.style.length > 0) {
      for (let i = 0; i < element.style.length; i++) {
        const property = element.style[i];
        if (property && COLOR_PROPERTIES.includes(property as any)) {
          const value = element.style.getPropertyValue(property);
          if (value && isUnsupportedColorFunction(value)) {
            const normalized =
              property === 'color' || property === 'background-color'
                ? normalizeColorForPdf(value, element)
                : normalizeComplexColorValue(value, element);

            if (normalized !== value) {
              element.style.setProperty(property, normalized, 'important');
            }
          }
        }
      }
    }

    // Recursively normalize child elements
    const children = element.querySelectorAll('*');
    for (const child of Array.from(children)) {
      if (child instanceof HTMLElement) {
        normalizeStylesForPdf(child);
      }
    }

    // Also normalize pseudo-elements by checking computed styles
    // Note: We can't directly modify pseudo-elements, but we can ensure
    // the base element's styles are normalized, which affects pseudo-elements
  } catch (error) {
    console.warn('[PDFStyleNormalizer] Error during style normalization:', error);
    // Don't throw - allow PDF generation to continue even if normalization fails
  }
}

/**
 * Normalize styles in a cloned element (for PDF generation from HTML)
 * This is useful when creating elements from HTML strings
 */
export function normalizeClonedElementForPdf(element: HTMLElement): HTMLElement {
  // Clone the element to avoid modifying the original
  const cloned = element.cloneNode(true) as HTMLElement;

  // Ensure the cloned element is in the DOM temporarily for computed styles
  const wasInDom = element.parentNode !== null;
  let tempContainer: HTMLElement | null = null;

  if (!wasInDom) {
    // Create temporary container for computed style calculation
    tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.visibility = 'hidden';
    tempContainer.style.top = '-9999px';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = element.style.width || '800px';
    document.body.appendChild(tempContainer);
    tempContainer.appendChild(cloned);
  }

  try {
    // Normalize styles now that element is in DOM
    normalizeStylesForPdf(cloned);
  } finally {
    // Clean up temporary container if we created it
    if (tempContainer && !wasInDom) {
      document.body.removeChild(tempContainer);
    }
  }

  return cloned;
}
