/**
 * Accessibility Service
 * 
 * Provides utilities for managing accessibility features including:
 * - Live region announcements for screen readers
 * - Focus management for keyboard navigation
 * - Reduced motion preference detection
 * 
 * @example
 * ```typescript
 * import { AccessibilityService } from 'osi-cards-lib';
 * 
 * const a11y = inject(AccessibilityService);
 * 
 * // Announce a message to screen readers
 * a11y.announce('Card loaded successfully');
 * 
 * // Manage focus
 * a11y.trapFocus(containerElement);
 * a11y.releaseFocus();
 * ```
 */

import { Injectable, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Politeness level for live announcements
 */
export type AnnouncePolitely = 'polite' | 'assertive' | 'off';

/**
 * Focus trap options
 */
export interface FocusTrapOptions {
  /** Element to focus initially */
  initialFocus?: HTMLElement | string;
  /** Whether to return focus to trigger element on release */
  returnFocus?: boolean;
  /** Additional focusable selector query */
  additionalFocusable?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: 'root'
})
export class AccessibilityService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  
  // Live region elements
  private politeRegion: HTMLElement | null = null;
  private assertiveRegion: HTMLElement | null = null;
  
  // Focus trap state
  private trapContainer: HTMLElement | null = null;
  private previousFocus: HTMLElement | null = null;
  private boundKeydownHandler: ((e: KeyboardEvent) => void) | null = null;
  
  // Reduced motion preference
  private _prefersReducedMotion = false;
  private mediaQueryList?: MediaQueryList;
  private mediaQueryHandler?: (e: MediaQueryListEvent) => void;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.setupLiveRegions();
      this.setupReducedMotionDetection();
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  // ============================================================================
  // LIVE REGION ANNOUNCEMENTS
  // ============================================================================

  /**
   * Announce a message to screen readers
   * 
   * @param message - Message to announce
   * @param politeness - Announcement priority ('polite' or 'assertive')
   * @param clearDelay - Time in ms before clearing the announcement (default: 1000)
   */
  announce(message: string, politeness: AnnouncePolitely = 'polite', clearDelay = 1000): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const region = politeness === 'assertive' ? this.assertiveRegion : this.politeRegion;
    if (!region) return;

    // Clear previous content
    region.textContent = '';

    // Use setTimeout to ensure screen readers pick up the change
    setTimeout(() => {
      region.textContent = message;
    }, 50);

    // Clear after delay to prevent re-announcement on focus
    setTimeout(() => {
      region.textContent = '';
    }, clearDelay);
  }

  /**
   * Announce card loading started
   */
  announceCardLoading(): void {
    this.announce('Loading card content, please wait...', 'polite');
  }

  /**
   * Announce card loading complete
   */
  announceCardLoaded(title?: string): void {
    const message = title 
      ? `Card loaded: ${title}` 
      : 'Card content loaded successfully';
    this.announce(message, 'polite');
  }

  /**
   * Announce card streaming update
   */
  announceStreamingUpdate(sectionCount: number): void {
    const sections = sectionCount === 1 ? 'section' : 'sections';
    this.announce(`${sectionCount} ${sections} loaded so far`, 'polite');
  }

  /**
   * Announce card action executed
   */
  announceActionExecuted(actionLabel: string): void {
    this.announce(`${actionLabel} action triggered`, 'assertive');
  }

  /**
   * Announce error
   */
  announceError(errorMessage: string): void {
    this.announce(`Error: ${errorMessage}`, 'assertive');
  }

  // ============================================================================
  // FOCUS MANAGEMENT
  // ============================================================================

  /**
   * Trap focus within a container element
   * 
   * @param container - Container element to trap focus within
   * @param options - Focus trap options
   */
  trapFocus(container: HTMLElement, options: FocusTrapOptions = {}): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.releaseFocus();

    this.trapContainer = container;
    this.previousFocus = document.activeElement as HTMLElement;

    // Set initial focus
    if (options.initialFocus) {
      const initialElement = typeof options.initialFocus === 'string'
        ? container.querySelector<HTMLElement>(options.initialFocus)
        : options.initialFocus;
      
      initialElement?.focus();
    } else {
      // Focus first focusable element
      const firstFocusable = this.getFocusableElements(container, options.additionalFocusable)[0];
      firstFocusable?.focus();
    }

    // Add keydown handler for Tab key
    this.boundKeydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        this.handleTabKey(e, container, options.additionalFocusable);
      }
    };

    container.addEventListener('keydown', this.boundKeydownHandler);
  }

  /**
   * Release focus trap and optionally return focus
   */
  releaseFocus(): void {
    if (!this.trapContainer) return;

    if (this.boundKeydownHandler) {
      this.trapContainer.removeEventListener('keydown', this.boundKeydownHandler);
      this.boundKeydownHandler = null;
    }

    if (this.previousFocus && this.previousFocus.focus) {
      this.previousFocus.focus();
    }

    this.trapContainer = null;
    this.previousFocus = null;
  }

  /**
   * Move focus to an element
   * 
   * @param element - Element to focus
   * @param scrollIntoView - Whether to scroll element into view
   */
  focusElement(element: HTMLElement | null, scrollIntoView = true): void {
    if (!element || !isPlatformBrowser(this.platformId)) return;

    if (scrollIntoView) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    element.focus();
  }

  /**
   * Skip to main content (for skip links)
   * 
   * @param selector - Selector for main content area
   */
  skipToContent(selector = 'main, [role="main"], .main-content'): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const mainContent = document.querySelector<HTMLElement>(selector);
    if (mainContent) {
      // Add temporary tabindex if not focusable
      const hadTabIndex = mainContent.hasAttribute('tabindex');
      if (!hadTabIndex) {
        mainContent.setAttribute('tabindex', '-1');
      }

      mainContent.focus();

      // Remove tabindex after focus
      if (!hadTabIndex) {
        mainContent.addEventListener('blur', () => {
          mainContent.removeAttribute('tabindex');
        }, { once: true });
      }
    }
  }

  // ============================================================================
  // REDUCED MOTION
  // ============================================================================

  /**
   * Check if user prefers reduced motion
   */
  get prefersReducedMotion(): boolean {
    return this._prefersReducedMotion;
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Get all focusable elements within a container
   * 
   * @param container - Container element
   * @param additionalSelector - Additional selector to include
   */
  getFocusableElements(container: HTMLElement, additionalSelector?: string): HTMLElement[] {
    const baseSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
      additionalSelector
    ].filter(Boolean).join(', ');

    return Array.from(container.querySelectorAll<HTMLElement>(baseSelector))
      .filter(el => {
        // Filter out hidden elements
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
  }

  /**
   * Generate a unique ID for accessibility purposes
   * 
   * @param prefix - Prefix for the ID
   */
  generateId(prefix = 'osi-a11y'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if element is visible to screen readers
   * 
   * @param element - Element to check
   */
  isVisibleToScreenReader(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    
    // Check if hidden
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }

    // Check aria-hidden
    if (element.getAttribute('aria-hidden') === 'true') {
      return false;
    }

    // Check if clipped off-screen
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      return false;
    }

    return true;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private setupLiveRegions(): void {
    // Create polite live region
    this.politeRegion = this.createLiveRegion('polite');
    this.assertiveRegion = this.createLiveRegion('assertive');

    document.body.appendChild(this.politeRegion);
    document.body.appendChild(this.assertiveRegion);
  }

  private createLiveRegion(politeness: 'polite' | 'assertive'): HTMLElement {
    const region = document.createElement('div');
    region.setAttribute('aria-live', politeness);
    region.setAttribute('aria-atomic', 'true');
    region.setAttribute('role', 'status');
    region.className = 'sr-only';
    
    // Visually hide but keep accessible
    Object.assign(region.style, {
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

    return region;
  }

  private setupReducedMotionDetection(): void {
    if (typeof window === 'undefined') return;

    this.mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
    this._prefersReducedMotion = this.mediaQueryList.matches;

    this.mediaQueryHandler = (e: MediaQueryListEvent) => {
      this._prefersReducedMotion = e.matches;
    };

    this.mediaQueryList.addEventListener('change', this.mediaQueryHandler);
  }

  private handleTabKey(e: KeyboardEvent, container: HTMLElement, additionalSelector?: string): void {
    const focusableElements = this.getFocusableElements(container, additionalSelector);
    
    if (focusableElements.length === 0) return;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  }

  private cleanup(): void {
    this.releaseFocus();

    // Remove live regions
    this.politeRegion?.remove();
    this.assertiveRegion?.remove();

    // Remove media query listener
    if (this.mediaQueryList && this.mediaQueryHandler) {
      this.mediaQueryList.removeEventListener('change', this.mediaQueryHandler);
    }
  }
}









