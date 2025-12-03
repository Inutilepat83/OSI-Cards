/**
 * Accessibility Testing Utilities
 * Provides utilities for testing WCAG compliance and accessibility features
 */

/**
 * ARIA role types
 */
export type AriaRole =
  | 'alert'
  | 'button'
  | 'checkbox'
  | 'dialog'
  | 'link'
  | 'listbox'
  | 'menu'
  | 'menuitem'
  | 'navigation'
  | 'region'
  | 'tab'
  | 'tablist'
  | 'tabpanel';

/**
 * Accessibility test result
 */
export interface A11yTestResult {
  passed: boolean;
  violations: A11yViolation[];
  warnings: A11yWarning[];
}

/**
 * Accessibility violation
 */
export interface A11yViolation {
  rule: string;
  description: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  element: string;
  help: string;
  helpUrl?: string;
}

/**
 * Accessibility warning
 */
export interface A11yWarning {
  rule: string;
  description: string;
  element: string;
  suggestion: string;
}

/**
 * Color contrast check result
 */
export interface ContrastCheckResult {
  passed: boolean;
  ratio: number;
  required: number;
  foreground: string;
  background: string;
}

/**
 * Accessibility Test Utils
 */
export class A11yTestUtils {
  /**
   * Check if element has accessible name
   */
  public static hasAccessibleName(element: HTMLElement): boolean {
    // Check aria-label
    if (element.hasAttribute('aria-label')) {
      const label = element.getAttribute('aria-label');
      return label !== null && label.trim().length > 0;
    }

    // Check aria-labelledby
    if (element.hasAttribute('aria-labelledby')) {
      const labelledBy = element.getAttribute('aria-labelledby');
      if (labelledBy) {
        const labelElement = document.getElementById(labelledBy);
        return labelElement !== null && labelElement.textContent?.trim().length! > 0;
      }
    }

    // Check for label element
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      const labels = element.labels;
      if (labels && labels.length > 0) {
        return labels[0].textContent?.trim().length! > 0;
      }
    }

    // Check text content
    const textContent = element.textContent?.trim();
    return textContent !== undefined && textContent.length > 0;
  }

  /**
   * Check if element is keyboard accessible
   */
  public static isKeyboardAccessible(element: HTMLElement): boolean {
    // Check if element is focusable
    const isFocusable = element.tabIndex >= 0;
    if (!isFocusable) {
      return false;
    }

    // Check if not disabled
    if (element instanceof HTMLInputElement || element instanceof HTMLButtonElement) {
      if (element.disabled) {
        return false;
      }
    }

    // Check if visible
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }

    return true;
  }

  /**
   * Get color contrast ratio
   */
  public static getContrastRatio(foreground: string, background: string): number {
    const fgLuminance = this.getLuminance(foreground);
    const bgLuminance = this.getLuminance(background);

    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check color contrast meets WCAG requirements
   */
  public static checkContrast(
    foreground: string,
    background: string,
    fontSize: number = 16,
    level: 'AA' | 'AAA' = 'AA'
  ): ContrastCheckResult {
    const ratio = this.getContrastRatio(foreground, background);
    const isLargeText = fontSize >= 18 || fontSize >= 14; // 14pt bold is considered large

    let required: number;
    if (level === 'AAA') {
      required = isLargeText ? 4.5 : 7;
    } else {
      required = isLargeText ? 3 : 4.5;
    }

    return {
      passed: ratio >= required,
      ratio,
      required,
      foreground,
      background,
    };
  }

  /**
   * Get relative luminance of a color
   */
  private static getLuminance(color: string): number {
    const rgb = this.parseColor(color);
    if (!rgb) return 0;

    const [r, g, b] = rgb.map((val) => {
      const normalized = val / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Parse color string to RGB values
   */
  private static parseColor(color: string): [number, number, number] | null {
    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        return [r, g, b];
      } else if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return [r, g, b];
      }
    }

    // Handle rgb/rgba
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
    }

    return null;
  }

  /**
   * Check if element has proper ARIA role
   */
  public static hasProperAriaRole(element: HTMLElement, expectedRole?: AriaRole): boolean {
    const role = element.getAttribute('role');

    if (expectedRole) {
      return role === expectedRole;
    }

    // Check if element needs a role (interactive elements)
    const interactiveTags = ['button', 'a', 'input', 'select', 'textarea'];
    if (interactiveTags.includes(element.tagName.toLowerCase())) {
      return true; // These have implicit roles
    }

    // For divs and spans acting as interactive elements, role should be present
    if (
      (element.tagName === 'DIV' || element.tagName === 'SPAN') &&
      (element.onclick !== null || element.tabIndex >= 0)
    ) {
      return role !== null;
    }

    return true;
  }

  /**
   * Check if element has proper focus indicator
   */
  public static hasFocusIndicator(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    const focusStyle = window.getComputedStyle(element, ':focus');

    // Check if outline is not removed
    if (focusStyle.outlineStyle === 'none' && focusStyle.outline === 'none') {
      // Check if there's an alternative focus indicator (border, box-shadow, etc.)
      const hasBorderChange =
        focusStyle.borderWidth !== style.borderWidth ||
        focusStyle.borderColor !== style.borderColor;
      const hasBoxShadowChange = focusStyle.boxShadow !== style.boxShadow;
      const hasBackgroundChange = focusStyle.backgroundColor !== style.backgroundColor;

      return hasBorderChange || hasBoxShadowChange || hasBackgroundChange;
    }

    return true;
  }

  /**
   * Check if images have alt text
   */
  public static checkImageAlt(img: HTMLImageElement): boolean {
    if (!img.hasAttribute('alt')) {
      return false;
    }

    const alt = img.getAttribute('alt');

    // Decorative images should have empty alt
    // Content images should have descriptive alt
    return alt !== null;
  }

  /**
   * Check if element is properly nested in landmarks
   */
  public static isInLandmark(element: HTMLElement): boolean {
    let current: HTMLElement | null = element;

    while (current && current !== document.body) {
      const tagName = current.tagName.toLowerCase();
      const role = current.getAttribute('role');

      // Check for HTML5 landmarks
      if (
        ['header', 'nav', 'main', 'aside', 'footer', 'section', 'article'].includes(tagName)
      ) {
        return true;
      }

      // Check for ARIA landmarks
      if (
        role &&
        ['banner', 'navigation', 'main', 'complementary', 'contentinfo', 'region'].includes(
          role
        )
      ) {
        return true;
      }

      current = current.parentElement;
    }

    return false;
  }

  /**
   * Get all focusable elements within container
   */
  public static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable]',
    ].join(',');

    return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter((el) => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }

  /**
   * Check keyboard navigation flow
   */
  public static checkTabOrder(container: HTMLElement): boolean {
    const focusable = this.getFocusableElements(container);

    // Check if tab order follows DOM order or has explicit tabindex
    const tabIndices = focusable.map((el) => el.tabIndex);

    // Check for positive tabindex values (generally not recommended)
    const hasPositiveTabIndex = tabIndices.some((index) => index > 0);
    if (hasPositiveTabIndex) {
      console.warn('Positive tabindex values found. Consider using natural DOM order.');
    }

    return focusable.length > 0;
  }

  /**
   * Generate accessibility report for element
   */
  public static generateA11yReport(element: HTMLElement): A11yTestResult {
    const violations: A11yViolation[] = [];
    const warnings: A11yWarning[] = [];

    // Check accessible name
    if (!this.hasAccessibleName(element)) {
      violations.push({
        rule: 'accessible-name',
        description: 'Element does not have an accessible name',
        impact: 'critical',
        element: element.tagName,
        help: 'Add aria-label, aria-labelledby, or text content',
      });
    }

    // Check keyboard accessibility
    if (element.onclick && !this.isKeyboardAccessible(element)) {
      violations.push({
        rule: 'keyboard-accessible',
        description: 'Interactive element is not keyboard accessible',
        impact: 'critical',
        element: element.tagName,
        help: 'Add tabindex="0" and keyboard event handlers',
      });
    }

    // Check ARIA role
    if (!this.hasProperAriaRole(element)) {
      warnings.push({
        rule: 'aria-role',
        description: 'Interactive element missing proper ARIA role',
        element: element.tagName,
        suggestion: 'Add appropriate role attribute',
      });
    }

    // Check focus indicator
    if (!this.hasFocusIndicator(element)) {
      violations.push({
        rule: 'focus-indicator',
        description: 'Element has no visible focus indicator',
        impact: 'serious',
        element: element.tagName,
        help: 'Provide visible focus indication (outline, border, etc.)',
      });
    }

    // Check images
    if (element instanceof HTMLImageElement) {
      if (!this.checkImageAlt(element)) {
        violations.push({
          rule: 'image-alt',
          description: 'Image missing alt attribute',
          impact: 'critical',
          element: 'img',
          help: 'Add alt attribute with descriptive text or empty string for decorative images',
        });
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      warnings,
    };
  }
}

/**
 * Convenience functions
 */

/**
 * Test accessibility of element
 */
export function testA11y(element: HTMLElement): A11yTestResult {
  return A11yTestUtils.generateA11yReport(element);
}

/**
 * Test color contrast
 */
export function testContrast(
  foreground: string,
  background: string,
  fontSize?: number,
  level?: 'AA' | 'AAA'
): ContrastCheckResult {
  return A11yTestUtils.checkContrast(foreground, background, fontSize, level);
}

/**
 * Get all focusable elements
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return A11yTestUtils.getFocusableElements(container);
}

