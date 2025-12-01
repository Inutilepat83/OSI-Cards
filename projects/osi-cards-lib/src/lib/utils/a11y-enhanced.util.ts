/**
 * Enhanced Accessibility Utilities (Improvements #66-75)
 * 
 * Comprehensive accessibility utilities for WCAG 2.2 compliance.
 * Provides focus management, screen reader support, keyboard navigation,
 * and contrast checking.
 * 
 * @example
 * ```typescript
 * import { A11yUtil, FocusTrap, LiveAnnouncer } from 'osi-cards-lib';
 * 
 * // Announce to screen readers
 * A11yUtil.announce('Card loaded successfully');
 * 
 * // Check color contrast
 * const ratio = A11yUtil.getContrastRatio('#ffffff', '#000000');
 * const passes = A11yUtil.meetsWCAG(ratio, 'AAA');
 * 
 * // Create focus trap
 * const trap = new FocusTrap(modalElement);
 * trap.activate();
 * ```
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * WCAG conformance levels
 */
export type WCAGLevel = 'A' | 'AA' | 'AAA';

/**
 * Contrast check result
 */
export interface ContrastCheckResult {
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
  passesAALarge: boolean;
  passesAAALarge: boolean;
}

/**
 * Focus trap options
 */
export interface FocusTrapOptions {
  /** Initial element to focus */
  initialFocus?: HTMLElement | string;
  /** Element to focus when trap is deactivated */
  returnFocus?: HTMLElement | string;
  /** Allow escape key to deactivate trap */
  escapeDeactivates?: boolean;
  /** Click outside to deactivate */
  clickOutsideDeactivates?: boolean;
  /** Callback when escape is pressed */
  onEscape?: () => void;
}

/**
 * Live region politeness levels
 */
export type LiveRegionPoliteness = 'off' | 'polite' | 'assertive';

/**
 * Keyboard navigation direction
 */
export type NavigationDirection = 'next' | 'previous' | 'first' | 'last';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * WCAG minimum contrast ratios
 */
const WCAG_CONTRAST_RATIOS = {
  AA: 4.5,
  AAA: 7,
  AA_LARGE: 3,
  AAA_LARGE: 4.5
} as const;

/**
 * Focusable element selectors
 */
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
  'audio[controls]',
  'video[controls]',
  'details > summary'
].join(', ');

/**
 * Tabbable element selectors (excludes [tabindex="-1"])
 */
const TABBABLE_SELECTORS = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]:not([tabindex="-1"])'
].join(', ');

// ============================================================================
// A11Y UTILITY CLASS
// ============================================================================

/**
 * Accessibility utility class
 */
export class A11yUtil {
  private static liveRegion: HTMLElement | null = null;
  private static announceTimeout: ReturnType<typeof setTimeout> | null = null;

  // ============================================
  // Screen Reader Announcements
  // ============================================

  /**
   * Announce a message to screen readers
   */
  static announce(
    message: string,
    politeness: LiveRegionPoliteness = 'polite',
    clearDelay = 1000
  ): void {
    if (typeof document === 'undefined') return;

    // Create live region if it doesn't exist
    if (!this.liveRegion) {
      this.liveRegion = document.createElement('div');
      this.liveRegion.setAttribute('aria-live', politeness);
      this.liveRegion.setAttribute('aria-atomic', 'true');
      this.liveRegion.setAttribute('role', 'status');
      this.liveRegion.className = 'sr-only osi-live-region';
      
      // Style for screen reader only
      Object.assign(this.liveRegion.style, {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0'
      });
      
      document.body.appendChild(this.liveRegion);
    }

    // Update politeness if different
    this.liveRegion.setAttribute('aria-live', politeness);

    // Clear any pending timeout
    if (this.announceTimeout) {
      clearTimeout(this.announceTimeout);
    }

    // Set the message
    this.liveRegion.textContent = '';
    
    // Use setTimeout to ensure the live region is cleared first
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = message;
      }
    }, 50);

    // Clear the message after delay
    this.announceTimeout = setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = '';
      }
    }, clearDelay);
  }

  /**
   * Announce an assertive message (interrupts current speech)
   */
  static announceAssertive(message: string): void {
    this.announce(message, 'assertive', 3000);
  }

  // ============================================
  // Focus Management
  // ============================================

  /**
   * Get all focusable elements within a container
   */
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS));
  }

  /**
   * Get all tabbable elements within a container
   */
  static getTabbableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(TABBABLE_SELECTORS))
      .filter(el => !this.isHidden(el));
  }

  /**
   * Check if an element is hidden
   */
  static isHidden(element: HTMLElement): boolean {
    if (element.hidden) return true;
    
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return true;
    
    // Check parent visibility
    let parent = element.parentElement;
    while (parent) {
      const parentStyle = getComputedStyle(parent);
      if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') {
        return true;
      }
      parent = parent.parentElement;
    }
    
    return false;
  }

  /**
   * Focus an element safely
   */
  static focus(element: HTMLElement | string | null, preventScroll = false): boolean {
    const el = typeof element === 'string' 
      ? document.querySelector<HTMLElement>(element)
      : element;
      
    if (!el) return false;
    
    try {
      el.focus({ preventScroll });
      return document.activeElement === el;
    } catch {
      return false;
    }
  }

  /**
   * Move focus within a container
   */
  static moveFocus(
    container: HTMLElement,
    direction: NavigationDirection
  ): HTMLElement | null {
    const focusable = this.getTabbableElements(container);
    if (focusable.length === 0) return null;

    const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
    let nextIndex: number;

    switch (direction) {
      case 'first':
        nextIndex = 0;
        break;
      case 'last':
        nextIndex = focusable.length - 1;
        break;
      case 'next':
        nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % focusable.length;
        break;
      case 'previous':
        nextIndex = currentIndex === -1 
          ? focusable.length - 1 
          : (currentIndex - 1 + focusable.length) % focusable.length;
        break;
    }

    const nextElement = focusable[nextIndex];
    if (nextElement) {
      this.focus(nextElement);
      return nextElement;
    }
    return null;
  }

  // ============================================
  // Color Contrast
  // ============================================

  /**
   * Calculate contrast ratio between two colors
   * Returns a ratio from 1 to 21
   */
  static getContrastRatio(color1: string, color2: string): number {
    const lum1 = this.getRelativeLuminance(color1);
    const lum2 = this.getRelativeLuminance(color2);
    
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Calculate relative luminance of a color
   */
  static getRelativeLuminance(color: string): number {
    const rgb = this.parseColor(color);
    if (!rgb) return 0;
    
    const [r, g, b] = rgb.map(val => {
      const sRGB = val / 255;
      return sRGB <= 0.03928
        ? sRGB / 12.92
        : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  }

  /**
   * Parse a color string to RGB values
   */
  static parseColor(color: string): [number, number, number] | null {
    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        return [
          parseInt(hex[0]! + hex[0]!, 16),
          parseInt(hex[1]! + hex[1]!, 16),
          parseInt(hex[2]! + hex[2]!, 16)
        ];
      }
      if (hex.length === 6) {
        return [
          parseInt(hex.slice(0, 2), 16),
          parseInt(hex.slice(2, 4), 16),
          parseInt(hex.slice(4, 6), 16)
        ];
      }
    }
    
    // Handle rgb/rgba
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      return [
        parseInt(rgbMatch[1]!, 10),
        parseInt(rgbMatch[2]!, 10),
        parseInt(rgbMatch[3]!, 10)
      ];
    }
    
    return null;
  }

  /**
   * Check if a contrast ratio meets WCAG requirements
   */
  static meetsWCAG(ratio: number, level: WCAGLevel, isLargeText = false): boolean {
    if (isLargeText) {
      return level === 'AAA' 
        ? ratio >= WCAG_CONTRAST_RATIOS.AAA_LARGE
        : ratio >= WCAG_CONTRAST_RATIOS.AA_LARGE;
    }
    return level === 'AAA'
      ? ratio >= WCAG_CONTRAST_RATIOS.AAA
      : ratio >= WCAG_CONTRAST_RATIOS.AA;
  }

  /**
   * Check contrast between two colors
   */
  static checkContrast(foreground: string, background: string): ContrastCheckResult {
    const ratio = this.getContrastRatio(foreground, background);
    
    return {
      ratio,
      passesAA: ratio >= WCAG_CONTRAST_RATIOS.AA,
      passesAAA: ratio >= WCAG_CONTRAST_RATIOS.AAA,
      passesAALarge: ratio >= WCAG_CONTRAST_RATIOS.AA_LARGE,
      passesAAALarge: ratio >= WCAG_CONTRAST_RATIOS.AAA_LARGE
    };
  }

  /**
   * Suggest a color adjustment to meet contrast requirements
   */
  static suggestContrastFix(
    foreground: string,
    background: string,
    targetLevel: WCAGLevel = 'AA'
  ): string | null {
    const targetRatio = targetLevel === 'AAA' 
      ? WCAG_CONTRAST_RATIOS.AAA 
      : WCAG_CONTRAST_RATIOS.AA;
    
    const currentRatio = this.getContrastRatio(foreground, background);
    
    if (currentRatio >= targetRatio) {
      return foreground; // Already passes
    }
    
    const bgLuminance = this.getRelativeLuminance(background);
    const rgb = this.parseColor(foreground);
    
    if (!rgb) return null;
    
    // Determine if we need to lighten or darken
    const shouldLighten = bgLuminance < 0.5;
    
    // Iteratively adjust until we meet the ratio
    let [r, g, b] = rgb;
    const step = shouldLighten ? 10 : -10;
    
    for (let i = 0; i < 30; i++) {
      r = Math.max(0, Math.min(255, r + step));
      g = Math.max(0, Math.min(255, g + step));
      b = Math.max(0, Math.min(255, b + step));
      
      const newColor = `rgb(${r}, ${g}, ${b})`;
      if (this.getContrastRatio(newColor, background) >= targetRatio) {
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      }
    }
    
    return null;
  }

  // ============================================
  // Motion Preferences
  // ============================================

  /**
   * Check if user prefers reduced motion
   */
  static prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Watch for reduced motion preference changes
   */
  static watchReducedMotion(callback: (prefersReduced: boolean) => void): () => void {
    if (typeof window === 'undefined') return () => {};
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => callback(e.matches);
    
    mediaQuery.addEventListener('change', handler);
    
    // Return cleanup function
    return () => mediaQuery.removeEventListener('change', handler);
  }

  // ============================================
  // High Contrast Mode
  // ============================================

  /**
   * Check if user prefers high contrast
   */
  static prefersHighContrast(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-contrast: high)').matches ||
           window.matchMedia('(forced-colors: active)').matches;
  }

  // ============================================
  // ARIA Helpers
  // ============================================

  /**
   * Generate a unique ID for ARIA relationships
   */
  static generateId(prefix = 'osi'): string {
    return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Set up ARIA relationships between elements
   */
  static setAriaRelationship(
    element: HTMLElement,
    attribute: 'describedby' | 'labelledby' | 'controls' | 'owns',
    targetId: string
  ): void {
    const attrName = `aria-${attribute}`;
    const existing = element.getAttribute(attrName);
    
    if (existing) {
      if (!existing.includes(targetId)) {
        element.setAttribute(attrName, `${existing} ${targetId}`);
      }
    } else {
      element.setAttribute(attrName, targetId);
    }
  }

  /**
   * Remove ARIA relationship
   */
  static removeAriaRelationship(
    element: HTMLElement,
    attribute: 'describedby' | 'labelledby' | 'controls' | 'owns',
    targetId: string
  ): void {
    const attrName = `aria-${attribute}`;
    const existing = element.getAttribute(attrName);
    
    if (existing) {
      const newValue = existing
        .split(' ')
        .filter(id => id !== targetId)
        .join(' ')
        .trim();
      
      if (newValue) {
        element.setAttribute(attrName, newValue);
      } else {
        element.removeAttribute(attrName);
      }
    }
  }
}

// ============================================================================
// FOCUS TRAP CLASS
// ============================================================================

/**
 * Focus trap for modals and dialogs
 */
export class FocusTrap {
  private container: HTMLElement;
  private options: FocusTrapOptions;
  private active = false;
  private previouslyFocused: HTMLElement | null = null;
  private handleKeyDown: (e: KeyboardEvent) => void;
  private handleFocusIn: (e: FocusEvent) => void;
  private handleClick: (e: MouseEvent) => void;

  constructor(container: HTMLElement, options: FocusTrapOptions = {}) {
    this.container = container;
    this.options = {
      escapeDeactivates: true,
      clickOutsideDeactivates: false,
      ...options
    };

    this.handleKeyDown = this.onKeyDown.bind(this);
    this.handleFocusIn = this.onFocusIn.bind(this);
    this.handleClick = this.onClick.bind(this);
  }

  /**
   * Activate the focus trap
   */
  activate(): void {
    if (this.active) return;
    
    this.active = true;
    this.previouslyFocused = document.activeElement as HTMLElement;

    // Add event listeners
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('focusin', this.handleFocusIn);
    
    if (this.options.clickOutsideDeactivates) {
      document.addEventListener('click', this.handleClick);
    }

    // Focus initial element
    this.focusInitial();
  }

  /**
   * Deactivate the focus trap
   */
  deactivate(): void {
    if (!this.active) return;
    
    this.active = false;

    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('focusin', this.handleFocusIn);
    document.removeEventListener('click', this.handleClick);

    // Return focus
    this.returnFocus();
  }

  /**
   * Check if trap is active
   */
  isActive(): boolean {
    return this.active;
  }

  private focusInitial(): void {
    const { initialFocus } = this.options;
    
    if (initialFocus) {
      A11yUtil.focus(initialFocus);
    } else {
      const focusable = A11yUtil.getTabbableElements(this.container);
      if (focusable.length > 0 && focusable[0]) {
        A11yUtil.focus(focusable[0]);
      } else {
        this.container.focus();
      }
    }
  }

  private returnFocus(): void {
    const { returnFocus } = this.options;
    
    if (returnFocus) {
      A11yUtil.focus(returnFocus);
    } else if (this.previouslyFocused) {
      A11yUtil.focus(this.previouslyFocused);
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (!this.active) return;

    if (e.key === 'Escape' && this.options.escapeDeactivates) {
      e.preventDefault();
      this.options.onEscape?.();
      this.deactivate();
      return;
    }

    if (e.key === 'Tab') {
      this.trapTab(e);
    }
  }

  private onFocusIn(e: FocusEvent): void {
    if (!this.active) return;
    
    const target = e.target as HTMLElement;
    if (!this.container.contains(target)) {
      e.preventDefault();
      this.focusInitial();
    }
  }

  private onClick(e: MouseEvent): void {
    if (!this.active) return;
    
    const target = e.target as HTMLElement;
    if (!this.container.contains(target)) {
      this.deactivate();
    }
  }

  private trapTab(e: KeyboardEvent): void {
    const focusable = A11yUtil.getTabbableElements(this.container);
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }

    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];
    const currentFocus = document.activeElement;

    if (e.shiftKey) {
      // Shift+Tab: moving backward
      if (currentFocus === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      // Tab: moving forward
      if (currentFocus === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  }
}

// ============================================================================
// ROVING TAB INDEX
// ============================================================================

/**
 * Roving tabindex manager for keyboard navigation
 */
export class RovingTabIndex {
  private container: HTMLElement;
  private selector: string;
  private currentIndex = 0;
  private items: HTMLElement[] = [];
  private handleKeyDown: (e: KeyboardEvent) => void;
  private vertical: boolean;
  private wrap: boolean;

  constructor(
    container: HTMLElement,
    selector: string,
    options: { vertical?: boolean; wrap?: boolean } = {}
  ) {
    this.container = container;
    this.selector = selector;
    this.vertical = options.vertical ?? true;
    this.wrap = options.wrap ?? true;
    
    this.handleKeyDown = this.onKeyDown.bind(this);
    this.refresh();
  }

  /**
   * Initialize roving tabindex
   */
  initialize(): void {
    this.container.addEventListener('keydown', this.handleKeyDown);
    this.updateTabIndices();
  }

  /**
   * Destroy roving tabindex
   */
  destroy(): void {
    this.container.removeEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Refresh the list of items
   */
  refresh(): void {
    this.items = Array.from(this.container.querySelectorAll<HTMLElement>(this.selector));
    this.updateTabIndices();
  }

  /**
   * Set focus to a specific index
   */
  setFocus(index: number): void {
    if (index >= 0 && index < this.items.length) {
      this.currentIndex = index;
      this.updateTabIndices();
      this.items[index]?.focus();
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    const { key } = e;
    
    const prevKeys = this.vertical ? ['ArrowUp'] : ['ArrowLeft'];
    const nextKeys = this.vertical ? ['ArrowDown'] : ['ArrowRight'];
    
    if (prevKeys.includes(key)) {
      e.preventDefault();
      this.movePrevious();
    } else if (nextKeys.includes(key)) {
      e.preventDefault();
      this.moveNext();
    } else if (key === 'Home') {
      e.preventDefault();
      this.setFocus(0);
    } else if (key === 'End') {
      e.preventDefault();
      this.setFocus(this.items.length - 1);
    }
  }

  private movePrevious(): void {
    let newIndex = this.currentIndex - 1;
    
    if (newIndex < 0) {
      newIndex = this.wrap ? this.items.length - 1 : 0;
    }
    
    this.setFocus(newIndex);
  }

  private moveNext(): void {
    let newIndex = this.currentIndex + 1;
    
    if (newIndex >= this.items.length) {
      newIndex = this.wrap ? 0 : this.items.length - 1;
    }
    
    this.setFocus(newIndex);
  }

  private updateTabIndices(): void {
    this.items.forEach((item, index) => {
      item.setAttribute('tabindex', index === this.currentIndex ? '0' : '-1');
    });
  }
}

// ============================================================================
// SKIP LINK HELPER
// ============================================================================

/**
 * Create a skip link for keyboard navigation
 */
export function createSkipLink(
  targetId: string,
  text = 'Skip to main content'
): HTMLAnchorElement {
  const link = document.createElement('a');
  link.href = `#${targetId}`;
  link.className = 'osi-skip-link sr-only-focusable';
  link.textContent = text;
  
  // Style for sr-only-focusable
  Object.assign(link.style, {
    position: 'absolute',
    left: '-9999px',
    zIndex: '999',
    padding: '1rem',
    backgroundColor: '#000',
    color: '#fff',
    textDecoration: 'none',
  });
  
  // Show on focus
  link.addEventListener('focus', () => {
    link.style.left = '0';
  });
  
  link.addEventListener('blur', () => {
    link.style.left = '-9999px';
  });
  
  // Handle click
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.tabIndex = -1;
      target.focus();
      target.removeAttribute('tabindex');
    }
  });
  
  return link;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { A11yUtil as default };

