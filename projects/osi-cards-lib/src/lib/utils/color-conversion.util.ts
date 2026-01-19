/**
 * Color Conversion Utility
 *
 * Converts unsupported CSS color functions (like color-mix()) to supported formats
 * (rgb/rgba/hex) for PDF generation. html2pdf.js/html2canvas/jsPDF don't support
 * modern CSS color functions, so we need to convert them to computed values.
 */

/**
 * Check if a CSS value contains unsupported color functions
 * This checks for modern CSS color functions that html2canvas/jsPDF don't support
 */
export function isUnsupportedColorFunction(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }

  const normalized = value.trim();

  // Check for color-mix() function (case-insensitive)
  if (/color-mix\s*\(/i.test(normalized)) {
    return true;
  }

  // Check for CSS Color Module Level 4 color() function
  // Pattern: color(display-p3 1 0 0) or color(srgb 1 0 0)
  // But NOT color: red (that's a property, not a function)
  // Match "color(" followed by space and something that looks like a color function
  if (
    /color\s*\(\s*(?:display-p3|srgb|srgb-linear|a98-rgb|prophoto-rgb|rec2020|xyz|xyz-d50|xyz-d65|lab|lch|oklab|oklch)/i.test(
      normalized
    )
  ) {
    return true;
  }

  // Check for other modern color functions that might not be supported
  // oklch(), lab(), lch(), oklab(), etc.
  if (/(?:oklch|oklab|lab|lch)\s*\(/i.test(normalized)) {
    return true;
  }

  return false;
}

/**
 * Convert a color function to rgba using browser's computed styles
 * This leverages the browser's native color computation
 */
export function convertColorFunctionToRgba(value: string, element: HTMLElement): string {
  if (!isUnsupportedColorFunction(value)) {
    return value; // Already supported format
  }

  try {
    // Create a temporary element to get computed color
    const tempElement = document.createElement('div');
    tempElement.style.position = 'absolute';
    tempElement.style.visibility = 'hidden';
    tempElement.style.pointerEvents = 'none';
    tempElement.style.top = '-9999px';
    tempElement.style.left = '-9999px';
    tempElement.style.width = '1px';
    tempElement.style.height = '1px';

    // Copy relevant parent context from source element if available
    // This helps with CSS custom property resolution
    if (element.parentElement) {
      const parentComputed = window.getComputedStyle(element.parentElement);
      // Copy font and other properties that might affect color computation
      tempElement.style.fontFamily = parentComputed.fontFamily;
      tempElement.style.fontSize = parentComputed.fontSize;
    }

    // Also copy CSS custom properties from source element to ensure proper resolution
    const sourceComputed = window.getComputedStyle(element);
    // Copy a few key custom properties that might affect color resolution
    const customProps = ['--color-brand', '--foreground', '--background', '--muted-foreground'];
    for (const prop of customProps) {
      const propValue = sourceComputed.getPropertyValue(prop);
      if (propValue) {
        tempElement.style.setProperty(prop, propValue);
      }
    }

    // Set the color value we want to convert
    // Try different properties to see which one works
    tempElement.style.color = value;
    tempElement.style.backgroundColor = value;

    // Ensure body exists before appending
    if (!document.body) {
      return value; // Can't compute without body
    }

    // Append to body temporarily to get computed style
    document.body.appendChild(tempElement);

    try {
      // Force a reflow to ensure styles are computed
      void tempElement.offsetHeight;

      const computed = window.getComputedStyle(tempElement);

      // Try color property first
      let computedColor = computed.color;

      // If color is transparent/black, try backgroundColor
      if (
        !computedColor ||
        computedColor === 'rgba(0, 0, 0, 0)' ||
        computedColor === 'rgb(0, 0, 0)' ||
        computedColor === 'transparent'
      ) {
        computedColor = computed.backgroundColor;
      }

      // Extract rgba value from computed color
      // Computed color is always in rgb() or rgba() format
      if (
        computedColor &&
        computedColor !== 'rgba(0, 0, 0, 0)' &&
        computedColor !== 'rgb(0, 0, 0)' &&
        computedColor !== 'transparent' &&
        (computedColor.startsWith('rgb') || computedColor.startsWith('#'))
      ) {
        return computedColor;
      }
    } finally {
      // Clean up
      if (tempElement.parentNode === document.body) {
        document.body.removeChild(tempElement);
      }
    }
  } catch (error) {
    console.warn('[ColorConversion] Failed to convert color function:', value, error);
  }

  // Fallback: return original value or a safe default
  return value;
}

/**
 * Normalize a color value for PDF generation
 * Handles both direct color values and CSS custom properties
 */
export function normalizeColorForPdf(value: string, element: HTMLElement): string {
  if (!value || typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();

  // Handle CSS custom properties
  if (trimmed.startsWith('var(')) {
    // Extract the custom property name
    const match = trimmed.match(/var\s*\(\s*([^,)]+)(?:\s*,\s*([^)]+))?\s*\)/);
    if (match && match[1]) {
      const varName = match[1].trim();
      const fallback = match[2]?.trim();

      // Get computed value of the custom property
      // Use getPropertyValue to get the resolved value
      try {
        const computed = window.getComputedStyle(element);
        const computedValue = computed.getPropertyValue(varName).trim();

        if (computedValue) {
          // Recursively normalize the computed value
          // The computed value might still contain color functions
          return normalizeColorForPdf(computedValue, element);
        } else if (fallback) {
          // Use fallback value and normalize it
          return normalizeColorForPdf(fallback, element);
        }
      } catch (error) {
        // If we can't get computed style, try fallback
        if (fallback) {
          return normalizeColorForPdf(fallback, element);
        }
      }
    }
    return trimmed; // Return as-is if we can't parse
  }

  // Check if it contains unsupported color functions
  if (isUnsupportedColorFunction(trimmed)) {
    return convertColorFunctionToRgba(trimmed, element);
  }

  // Already in supported format (hex, rgb, rgba, hsl, hsla, named colors)
  return trimmed;
}

/**
 * Extract color values from complex CSS values (like gradients, shadows)
 * and normalize them
 */
export function normalizeComplexColorValue(value: string, element: HTMLElement): string {
  if (!value || typeof value !== 'string') {
    return value;
  }

  // Check if the entire value is a color function
  if (isUnsupportedColorFunction(value)) {
    return convertColorFunctionToRgba(value, element);
  }

  // Check for color functions within complex values (gradients, shadows, etc.)
  // Pattern: look for color-mix() or color() within the value
  const colorFunctionRegex = /(color-mix\s*\([^)]+\)|color\s*\([^)]+\))/gi;
  const matches = value.match(colorFunctionRegex);

  if (!matches) {
    return value; // No color functions found
  }

  let normalized = value;

  // Replace each color function with its computed value
  for (const match of matches) {
    try {
      const converted = convertColorFunctionToRgba(match, element);
      normalized = normalized.replace(match, converted);
    } catch (error) {
      console.warn('[ColorConversion] Failed to convert color in complex value:', match, error);
      // Keep original if conversion fails
    }
  }

  return normalized;
}
