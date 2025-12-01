/**
 * CSS optimization utilities
 * Remove unused CSS, implement critical CSS inlining, use CSS containment
 */

/**
 * Check if CSS rule is used
 */
export function isCSSRuleUsed(selector: string): boolean {
  try {
    const elements = document.querySelectorAll(selector);
    return elements.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get unused CSS rules
 */
export function getUnusedCSSRules(styleSheet: CSSStyleSheet): string[] {
  const unused: string[] = [];

  try {
    const rules = Array.from(styleSheet.cssRules);
    for (const rule of rules) {
      if (rule instanceof CSSStyleRule) {
        if (!isCSSRuleUsed(rule.selectorText)) {
          unused.push(rule.selectorText);
        }
      }
    }
  } catch (error) {
    // Cross-origin stylesheets may throw errors
    console.warn('Cannot access stylesheet rules:', error);
  }

  return unused;
}

/**
 * Apply CSS containment to element
 */
export function applyCSSContainment(
  element: HTMLElement,
  containment: 'none' | 'strict' | 'content' | 'size' | 'layout' | 'style' | 'paint'
): void {
  element.style.contain = containment;
}

/**
 * Remove CSS containment
 */
export function removeCSSContainment(element: HTMLElement): void {
  element.style.contain = '';
}

/**
 * Check if CSS containment is supported
 */
export function supportsCSSContainment(): boolean {
  return CSS.supports('contain', 'strict');
}
