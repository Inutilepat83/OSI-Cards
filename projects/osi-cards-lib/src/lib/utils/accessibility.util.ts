/**
 * OSI Cards Accessibility Utilities
 * 
 * Provides accessibility helpers for WCAG compliance, focus management,
 * keyboard navigation, and screen reader support.
 * 
 * @example
 * ```typescript
 * import { 
 *   trapFocus, 
 *   announceToScreenReader,
 *   getContrastRatio 
 * } from 'osi-cards-lib';
 * 
 * // Trap focus in modal
 * const releaseFocus = trapFocus(modalElement);
 * 
 * // Announce changes
 * announceToScreenReader('Card loaded successfully');
 * 
 * // Check color contrast
 * const ratio = getContrastRatio('#ffffff', '#000000');
 * ```
 * 
 * @module utils/accessibility
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Focusable element selectors
 */
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
  'audio[controls]',
  'video[controls]',
  'details > summary',
].join(', ');

/**
 * WCAG contrast ratio requirements
 */
export const WCAG_CONTRAST = {
  /** AA normal text (minimum 4.5:1) */
  AA_NORMAL: 4.5,
  /** AA large text (minimum 3:1) */
  AA_LARGE: 3,
  /** AAA normal text (minimum 7:1) */
  AAA_NORMAL: 7,
  /** AAA large text (minimum 4.5:1) */
  AAA_LARGE: 4.5,
} as const;

// ============================================================================
// FOCUS MANAGEMENT
// ============================================================================

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS))
    .filter(el => {
      // Filter out hidden elements
      if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') {
        return false;
      }
      // Filter out elements with display:none
      if (getComputedStyle(el).display === 'none') {
        return false;
      }
      // Filter out elements with visibility:hidden
      if (getComputedStyle(el).visibility === 'hidden') {
        return false;
      }
      return true;
    });
}

/**
 * Trap focus within a container
 * Returns a function to release the trap
 * 
 * @param container - Element to trap focus within
 * @param options - Configuration options
 * @returns Function to release focus trap
 */
export function trapFocus(
  container: HTMLElement,
  options: {
    initialFocus?: HTMLElement | string;
    returnFocus?: HTMLElement;
    allowEscape?: boolean;
  } = {}
): () => void {
  const { initialFocus, returnFocus, allowEscape = false } = options;
  
  const previouslyFocused = document.activeElement as HTMLElement | null;
  const focusableElements = getFocusableElements(container);

  if (focusableElements.length === 0) {
    console.warn('No focusable elements found in container');
    return () => {};
  }

  // Set initial focus
  if (initialFocus) {
    const target = typeof initialFocus === 'string'
      ? container.querySelector<HTMLElement>(initialFocus)
      : initialFocus;
    target?.focus();
  } else {
    focusableElements[0]?.focus();
  }

  // Handle tab key
  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') {
      if (event.key === 'Escape' && allowEscape) {
        release();
      }
      return;
    }

    const currentFocusableElements = getFocusableElements(container);
    const firstElement = currentFocusableElements[0];
    const lastElement = currentFocusableElements[currentFocusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeydown);

  // Release function
  const release = (): void => {
    container.removeEventListener('keydown', handleKeydown);
    const returnTarget = returnFocus ?? previouslyFocused;
    returnTarget?.focus();
  };

  return release;
}

/**
 * Move focus to an element smoothly
 */
export function moveFocus(
  element: HTMLElement,
  options: { preventScroll?: boolean; select?: boolean } = {}
): void {
  const { preventScroll = false, select = false } = options;
  
  element.focus({ preventScroll });
  
  if (select && element instanceof HTMLInputElement) {
    element.select();
  }
}

/**
 * Create a roving tabindex group for keyboard navigation
 */
export function createRovingTabindex(
  container: HTMLElement,
  selector: string
): {
  handleKeydown: (event: KeyboardEvent) => void;
  setActive: (index: number) => void;
  destroy: () => void;
} {
  const elements = Array.from(container.querySelectorAll<HTMLElement>(selector));
  let currentIndex = 0;

  // Initialize tabindex
  elements.forEach((el, i) => {
    el.setAttribute('tabindex', i === 0 ? '0' : '-1');
  });

  const setActive = (index: number): void => {
    if (index < 0) index = elements.length - 1;
    if (index >= elements.length) index = 0;

    elements[currentIndex]?.setAttribute('tabindex', '-1');
    elements[index]?.setAttribute('tabindex', '0');
    elements[index]?.focus();
    currentIndex = index;
  };

  const handleKeydown = (event: KeyboardEvent): void => {
    let handled = true;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        setActive(currentIndex + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        setActive(currentIndex - 1);
        break;
      case 'Home':
        setActive(0);
        break;
      case 'End':
        setActive(elements.length - 1);
        break;
      default:
        handled = false;
    }

    if (handled) {
      event.preventDefault();
    }
  };

  container.addEventListener('keydown', handleKeydown);

  return {
    handleKeydown,
    setActive,
    destroy: () => {
      container.removeEventListener('keydown', handleKeydown);
    },
  };
}

// ============================================================================
// SCREEN READER SUPPORT
// ============================================================================

/**
 * Announce a message to screen readers using ARIA live region
 */
export function announceToScreenReader(
  message: string,
  options: {
    priority?: 'polite' | 'assertive';
    clearAfter?: number;
  } = {}
): void {
  const { priority = 'polite', clearAfter = 1000 } = options;

  // Get or create live region
  let liveRegion = document.getElementById('osi-cards-announcer');
  
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'osi-cards-announcer';
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.setAttribute('role', 'status');
    
    // Visually hidden but accessible
    Object.assign(liveRegion.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0',
    });
    
    document.body.appendChild(liveRegion);
  }

  // Update aria-live if needed
  liveRegion.setAttribute('aria-live', priority);

  // Clear and set message (forces re-announcement)
  liveRegion.textContent = '';
  
  // Use setTimeout to ensure the clear takes effect
  setTimeout(() => {
    liveRegion!.textContent = message;
    
    // Clear after delay if specified
    if (clearAfter > 0) {
      setTimeout(() => {
        liveRegion!.textContent = '';
      }, clearAfter);
    }
  }, 50);
}

/**
 * Create a live region for continuous updates
 */
export function createLiveRegion(
  id: string,
  priority: 'polite' | 'assertive' = 'polite'
): {
  announce: (message: string) => void;
  destroy: () => void;
} {
  const region = document.createElement('div');
  region.id = id;
  region.setAttribute('aria-live', priority);
  region.setAttribute('aria-atomic', 'true');
  region.setAttribute('role', 'status');
  
  Object.assign(region.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  });
  
  document.body.appendChild(region);

  return {
    announce: (message: string) => {
      region.textContent = '';
      setTimeout(() => {
        region.textContent = message;
      }, 50);
    },
    destroy: () => {
      region.remove();
    },
  };
}

// ============================================================================
// COLOR CONTRAST
// ============================================================================

/**
 * Parse a hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  
  return {
    r: parseInt(result[1]!, 16),
    g: parseInt(result[2]!, 16),
    b: parseInt(result[3]!, 16),
  };
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 formula
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(v => {
    v = v / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs! + 0.7152 * gs! + 0.0722 * bs!;
}

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 and 21
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) {
    console.warn('Invalid color format. Use hex format (#RRGGBB)');
    return 1;
  }
  
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if colors meet WCAG contrast requirements
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: keyof typeof WCAG_CONTRAST = 'AA_NORMAL'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= WCAG_CONTRAST[level];
}

/**
 * Get WCAG compliance level for a color pair
 */
export function getWCAGLevel(
  foreground: string,
  background: string
): 'AAA' | 'AA' | 'Fail' {
  const ratio = getContrastRatio(foreground, background);
  
  if (ratio >= WCAG_CONTRAST.AAA_NORMAL) return 'AAA';
  if (ratio >= WCAG_CONTRAST.AA_NORMAL) return 'AA';
  return 'Fail';
}

// ============================================================================
// ARIA HELPERS
// ============================================================================

/**
 * Set ARIA attributes on an element
 */
export function setAriaAttributes(
  element: HTMLElement,
  attributes: Record<string, string | boolean | number | null>
): void {
  Object.entries(attributes).forEach(([key, value]) => {
    const ariaKey = key.startsWith('aria-') ? key : `aria-${key}`;
    
    if (value === null || value === undefined) {
      element.removeAttribute(ariaKey);
    } else {
      element.setAttribute(ariaKey, String(value));
    }
  });
}

/**
 * Generate unique IDs for ARIA relationships
 */
export function generateAriaId(prefix = 'osi'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Link elements with ARIA attributes
 */
export function linkAriaElements(
  trigger: HTMLElement,
  target: HTMLElement,
  relationship: 'controls' | 'describedby' | 'labelledby' | 'owns'
): void {
  let targetId = target.id;
  if (!targetId) {
    targetId = generateAriaId();
    target.id = targetId;
  }
  
  trigger.setAttribute(`aria-${relationship}`, targetId);
}

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

/**
 * Register keyboard shortcuts
 */
export function registerShortcuts(
  shortcuts: Record<string, (event: KeyboardEvent) => void>,
  options: {
    scope?: HTMLElement | Document;
    preventDefault?: boolean;
  } = {}
): () => void {
  const { scope = document, preventDefault = true } = options;

  const handleKeydown = (event: KeyboardEvent): void => {
    // Build key combo string
    const combo: string[] = [];
    if (event.ctrlKey || event.metaKey) combo.push('Ctrl');
    if (event.altKey) combo.push('Alt');
    if (event.shiftKey) combo.push('Shift');
    combo.push(event.key.toUpperCase());
    
    const comboString = combo.join('+');
    const handler = shortcuts[comboString];
    
    if (handler) {
      if (preventDefault) {
        event.preventDefault();
      }
      handler(event);
    }
  };

  scope.addEventListener('keydown', handleKeydown as EventListener);

  return () => {
    scope.removeEventListener('keydown', handleKeydown as EventListener);
  };
}

// ============================================================================
// MOTION PREFERENCES
// ============================================================================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Watch for reduced motion preference changes
 */
export function watchReducedMotion(
  callback: (prefersReduced: boolean) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  const handler = (event: MediaQueryListEvent): void => {
    callback(event.matches);
  };
  
  // Initial call
  callback(mediaQuery.matches);
  
  // Watch for changes
  mediaQuery.addEventListener('change', handler);
  
  return () => {
    mediaQuery.removeEventListener('change', handler);
  };
}

// ============================================================================
// SKIP LINKS
// ============================================================================

/**
 * Create a skip link for keyboard navigation
 */
export function createSkipLink(
  targetId: string,
  text = 'Skip to content'
): HTMLAnchorElement {
  const link = document.createElement('a');
  link.href = `#${targetId}`;
  link.textContent = text;
  link.className = 'osi-skip-link';
  
  // Style to be visible only on focus
  Object.assign(link.style, {
    position: 'absolute',
    left: '-9999px',
    zIndex: '9999',
    padding: '8px 16px',
    backgroundColor: 'var(--osi-color-primary, #ff7900)',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
  });
  
  link.addEventListener('focus', () => {
    link.style.left = '8px';
    link.style.top = '8px';
  });
  
  link.addEventListener('blur', () => {
    link.style.left = '-9999px';
  });
  
  return link;
}






