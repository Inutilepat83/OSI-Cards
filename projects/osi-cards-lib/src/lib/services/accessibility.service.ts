/**
 * Consolidated Accessibility Service
 *
 * Comprehensive accessibility service that merges functionality from:
 * - accessibility.service.ts (basic features)
 * - focus-trap.service.ts (advanced focus management)
 * - live-announcer.service.ts (screen reader announcements)
 * - reduced-motion.service.ts (motion preference handling)
 *
 * This consolidated service provides all accessibility features in one place.
 *
 * @dependencies
 * - PLATFORM_ID: For platform detection (browser vs server)
 * - DOCUMENT: For DOM manipulation and focus management
 * - NgZone: For running operations in Angular zone
 *
 * @example
 * ```typescript
 * import { AccessibilityService } from 'osi-cards-lib';
 *
 * const a11y = inject(AccessibilityService);
 *
 * // Announcements
 * a11y.announce('Card loaded successfully');
 * await a11y.announcePolite('Processing...');
 *
 * // Focus management
 * a11y.trapFocus(modalElement);
 * a11y.releaseFocus();
 *
 * // Reduced motion
 * if (a11y.prefersReducedMotion) {
 *   // Skip animations
 * }
 * const duration = a11y.getAnimationDuration(300);
 * ```
 */

import { Injectable, OnDestroy, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { ANIMATION_TIMING, EASING } from '@osi-cards/constants';

// ============================================================================
// TYPES
// ============================================================================

export type AnnouncePolitely = 'polite' | 'assertive' | 'off';
export type AriaLivePoliteness = 'off' | 'polite' | 'assertive';

export interface FocusTrapOptions {
  initialFocus?: HTMLElement | string;
  returnFocus?: boolean;
  additionalFocusable?: string;
  escapeDeactivates?: boolean;
  onEscape?: () => void;
  onFocusOut?: () => void;
}

export interface ReducedMotionAnimationConfig {
  duration: number;
  easing: string;
  skip: boolean;
}

interface FocusTrapState {
  element: HTMLElement;
  returnFocusTo?: HTMLElement;
  config: FocusTrapOptions;
}

// ============================================================================
// CONSOLIDATED SERVICE
// ============================================================================

@Injectable({
  providedIn: 'root',
})
export class AccessibilityService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly ngZone = inject(NgZone);

  // ========== Live Region State ==========
  private liveElements = new Map<AriaLivePoliteness, HTMLElement>();
  private clearTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly clearDelay = 150;

  // ========== Focus Trap State ==========
  private activeTraps: FocusTrapState[] = [];
  private boundHandleKeydown: ((event: KeyboardEvent) => void) | null = null;
  private boundHandleFocusIn: ((event: FocusEvent) => void) | null = null;

  // ========== Reduced Motion State ==========
  private readonly _prefersReducedMotion$ = new BehaviorSubject<boolean>(false);
  private readonly _manualOverride$ = new BehaviorSubject<boolean | null>(null);
  private mediaQuery: MediaQueryList | null = null;
  private mediaQueryHandler?: () => void;

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
   */
  announce(
    message: string,
    politeness: AriaLivePoliteness = 'polite',
    duration?: number
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!isPlatformBrowser(this.platformId)) {
        resolve();
        return;
      }

      const element = this.liveElements.get(politeness);
      if (!element) {
        resolve();
        return;
      }

      // Clear any pending timeout
      if (this.clearTimeout) {
        clearTimeout(this.clearTimeout);
      }

      // Clear previous content
      element.textContent = '';

      // Set new content after brief delay
      requestAnimationFrame(() => {
        element.textContent = message;
        resolve();

        // Clear after duration
        const clearAfter = duration ?? this.clearDelay + message.length * 50;
        this.clearTimeout = setTimeout(() => {
          element.textContent = '';
        }, clearAfter);
      });
    });
  }

  announcePolite(message: string): Promise<void> {
    return this.announce(message, 'polite');
  }

  announceAssertive(message: string): Promise<void> {
    return this.announce(message, 'assertive');
  }

  announceCardLoading(title?: string): Promise<void> {
    const message = title ? `Loading ${title}...` : 'Loading card...';
    return this.announce(message, 'polite');
  }

  announceCardLoaded(title?: string): Promise<void> {
    const message = title ? `Card loaded: ${title}` : 'Card loaded';
    return this.announce(message, 'polite');
  }

  announceStreamingUpdate(sectionCount: number): Promise<void> {
    const sections = sectionCount === 1 ? 'section' : 'sections';
    return this.announce(`${sectionCount} ${sections} loaded`, 'polite');
  }

  announceError(errorMessage: string): Promise<void> {
    return this.announce(`Error: ${errorMessage}`, 'assertive');
  }

  announceLoading(itemName?: string): Promise<void> {
    const message = itemName ? `Loading ${itemName}...` : 'Loading...';
    return this.announce(message, 'polite');
  }

  announceLoaded(itemName?: string): Promise<void> {
    const message = itemName ? `${itemName} loaded` : 'Content loaded';
    return this.announce(message, 'polite');
  }

  clear(): void {
    if (this.clearTimeout) {
      clearTimeout(this.clearTimeout);
    }
    this.liveElements.forEach((element) => {
      element.textContent = '';
    });
  }

  // ============================================================================
  // FOCUS MANAGEMENT
  // ============================================================================

  /**
   * Trap focus within a container
   */
  trapFocus(container: HTMLElement, options: FocusTrapOptions = {}): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Store previous focus
    const previouslyFocused =
      options.returnFocus !== false ? (this.document.activeElement as HTMLElement) : undefined;

    // Add to trap stack
    this.activeTraps.push({
      element: container,
      returnFocusTo: previouslyFocused,
      config: options,
    });

    // Setup listeners if first trap
    if (this.activeTraps.length === 1) {
      this.setupFocusTrapListeners();
    }

    // Focus initial element
    this.focusInitialElement(container, options.initialFocus);
  }

  /**
   * Release the current focus trap
   */
  releaseFocus(): void {
    const trap = this.activeTraps.pop();

    if (trap?.returnFocusTo) {
      try {
        trap.returnFocusTo.focus();
      } catch {
        // Element may no longer exist
      }
    }

    // Remove listeners if no more traps
    if (this.activeTraps.length === 0) {
      this.removeFocusTrapListeners();
    }
  }

  /**
   * Release all focus traps
   */
  releaseAllFocusTraps(): void {
    while (this.activeTraps.length > 0) {
      this.releaseFocus();
    }
  }

  /**
   * Move focus to an element
   */
  focusElement(element: HTMLElement | null, scrollIntoView = true): void {
    if (!element || !isPlatformBrowser(this.platformId)) return;

    if (scrollIntoView) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    element.focus();
  }

  /**
   * Skip to main content
   */
  skipToContent(selector = 'main, [role="main"], .main-content'): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const mainContent = this.document.querySelector<HTMLElement>(selector);
    if (mainContent) {
      const hadTabIndex = mainContent.hasAttribute('tabindex');
      if (!hadTabIndex) {
        mainContent.setAttribute('tabindex', '-1');
      }

      mainContent.focus();

      if (!hadTabIndex) {
        mainContent.addEventListener(
          'blur',
          () => {
            mainContent.removeAttribute('tabindex');
          },
          { once: true }
        );
      }
    }
  }

  /**
   * Get focusable elements within a container
   */
  getFocusableElements(container: HTMLElement, additionalSelector?: string): HTMLElement[] {
    const baseSelectors = [
      'a[href]',
      'area[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
      'audio[controls]',
      'video[controls]',
      'details>summary:first-of-type',
      'details',
    ];

    if (additionalSelector) {
      baseSelectors.push(additionalSelector);
    }

    const selector = baseSelectors.join(', ');
    const elements = Array.from(container.querySelectorAll<HTMLElement>(selector));

    return elements.filter((el) => {
      const style = window.getComputedStyle(el);
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        !el.hasAttribute('hidden') &&
        el.offsetParent !== null
      );
    });
  }

  /**
   * Focus first focusable element
   */
  focusFirst(element: HTMLElement): void {
    const focusable = this.getFocusableElements(element);
    focusable[0]?.focus();
  }

  /**
   * Focus last focusable element
   */
  focusLast(element: HTMLElement): void {
    const focusable = this.getFocusableElements(element);
    focusable[focusable.length - 1]?.focus();
  }

  // ============================================================================
  // REDUCED MOTION
  // ============================================================================

  /**
   * Observable of reduced motion preference
   */
  get prefersReducedMotion$(): Observable<boolean> {
    return this._prefersReducedMotion$.asObservable().pipe(distinctUntilChanged());
  }

  /**
   * Current reduced motion preference (sync)
   */
  get prefersReducedMotion(): boolean {
    return this._prefersReducedMotion$.value;
  }

  /**
   * Check if animations should be enabled
   */
  get animationsEnabled(): boolean {
    return !this._prefersReducedMotion$.value;
  }

  /**
   * Observable for animation enabled state
   */
  get animationsEnabled$(): Observable<boolean> {
    return this.prefersReducedMotion$.pipe(map((prefers) => !prefers));
  }

  /**
   * Set manual override for reduced motion
   */
  setReducedMotionOverride(value: boolean | null): void {
    this._manualOverride$.next(value);
    this.updateReducedMotionPreference();
  }

  /**
   * Clear manual override
   */
  clearReducedMotionOverride(): void {
    this.setReducedMotionOverride(null);
  }

  /**
   * Get animation duration adjusted for reduced motion
   */
  getAnimationDuration(baseDuration: number): number {
    return this.prefersReducedMotion ? 0 : baseDuration;
  }

  /**
   * Get animation configuration adjusted for reduced motion
   */
  getAnimationConfig(
    baseDuration: number = ANIMATION_TIMING.NORMAL,
    baseEasing: string = EASING.EASE_OUT
  ): ReducedMotionAnimationConfig {
    if (this.prefersReducedMotion) {
      return {
        duration: 0,
        easing: EASING.LINEAR,
        skip: true,
      };
    }

    return {
      duration: baseDuration,
      easing: baseEasing,
      skip: false,
    };
  }

  /**
   * Get CSS animation styles based on preference
   */
  getAnimationStyles(baseStyles: Record<string, string>): Record<string, string> {
    if (!this.prefersReducedMotion) {
      return baseStyles;
    }

    const styles = { ...baseStyles };

    // Disable animations
    if ('transition' in styles) styles['transition'] = 'none';
    if ('animation' in styles) styles['animation'] = 'none';
    if ('animation-duration' in styles) styles['animation-duration'] = '0s';
    if ('transition-duration' in styles) styles['transition-duration'] = '0s';

    return styles;
  }

  /**
   * Create reduced motion-aware transition string
   */
  createTransition(
    property: string,
    duration: number = ANIMATION_TIMING.NORMAL,
    easing: string = EASING.EASE_OUT
  ): string {
    return this.prefersReducedMotion ? 'none' : `${property} ${duration}ms ${easing}`;
  }

  /**
   * Get CSS class for reduced motion
   */
  get cssClass(): string {
    return this.prefersReducedMotion ? 'osi-reduced-motion' : 'osi-full-motion';
  }

  /**
   * Execute callback only if animations enabled
   */
  withAnimation<T>(callback: () => T, fallback?: () => T): T | undefined {
    return this.prefersReducedMotion ? fallback?.() : callback();
  }

  /**
   * Select value based on motion preference
   */
  select<T>(fullMotion: T, reducedMotion: T): T {
    return this.prefersReducedMotion ? reducedMotion : fullMotion;
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Generate unique accessibility ID
   */
  generateId(prefix = 'osi-a11y'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if element is visible to screen readers
   */
  isVisibleToScreenReader(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);

    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }

    if (element.getAttribute('aria-hidden') === 'true') {
      return false;
    }

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
    const politenessLevels: AriaLivePoliteness[] = ['polite', 'assertive'];

    politenessLevels.forEach((politeness) => {
      const element = this.document.createElement('div');

      // Visually hidden but accessible
      Object.assign(element.style, {
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

      element.setAttribute('aria-live', politeness);
      element.setAttribute('aria-atomic', 'true');
      element.setAttribute('role', 'status');
      element.id = `osi-cards-live-${politeness}`;

      this.document.body.appendChild(element);
      this.liveElements.set(politeness, element);
    });
  }

  private setupReducedMotionDetection(): void {
    if (typeof window === 'undefined') return;

    this.mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this._prefersReducedMotion$.next(this.mediaQuery.matches);

    this.mediaQueryHandler = () => {
      this.ngZone.run(() => {
        this.updateReducedMotionPreference();
      });
    };

    if (this.mediaQuery.addEventListener) {
      this.mediaQuery.addEventListener('change', this.mediaQueryHandler);
    } else {
      this.mediaQuery.addListener(this.mediaQueryHandler);
    }
  }

  private updateReducedMotionPreference(): void {
    const override = this._manualOverride$.value;

    if (override !== null) {
      this._prefersReducedMotion$.next(override);
      return;
    }

    if (this.mediaQuery) {
      this._prefersReducedMotion$.next(this.mediaQuery.matches);
    }
  }

  private setupFocusTrapListeners(): void {
    if (!this.boundHandleKeydown) {
      this.boundHandleKeydown = this.handleKeydown.bind(this);
      this.document.addEventListener('keydown', this.boundHandleKeydown);
    }

    if (!this.boundHandleFocusIn) {
      this.boundHandleFocusIn = this.handleFocusIn.bind(this);
      this.document.addEventListener('focusin', this.boundHandleFocusIn);
    }
  }

  private removeFocusTrapListeners(): void {
    if (this.boundHandleKeydown) {
      this.document.removeEventListener('keydown', this.boundHandleKeydown);
      this.boundHandleKeydown = null;
    }

    if (this.boundHandleFocusIn) {
      this.document.removeEventListener('focusin', this.boundHandleFocusIn);
      this.boundHandleFocusIn = null;
    }
  }

  private handleKeydown(event: KeyboardEvent): void {
    const currentTrap = this.activeTraps[this.activeTraps.length - 1];
    if (!currentTrap) return;

    if (event.key === 'Tab') {
      this.handleTab(event, currentTrap);
    } else if (event.key === 'Escape' && currentTrap.config.escapeDeactivates !== false) {
      event.preventDefault();
      currentTrap.config.onEscape?.();
      this.releaseFocus();
    }
  }

  private handleTab(event: KeyboardEvent, trap: FocusTrapState): void {
    const focusable = this.getFocusableElements(trap.element, trap.config.additionalFocusable);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (!first || !last) return;

    if (event.shiftKey) {
      if (this.document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (this.document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  private handleFocusIn(event: FocusEvent): void {
    const currentTrap = this.activeTraps[this.activeTraps.length - 1];
    if (!currentTrap) return;

    const target = event.target as HTMLElement;

    if (!currentTrap.element.contains(target)) {
      event.preventDefault();
      currentTrap.config.onFocusOut?.();
      this.focusFirst(currentTrap.element);
    }
  }

  private focusInitialElement(container: HTMLElement, initialFocus?: HTMLElement | string): void {
    if (initialFocus instanceof HTMLElement) {
      initialFocus.focus();
    } else if (typeof initialFocus === 'string') {
      const element = container.querySelector<HTMLElement>(initialFocus);
      element?.focus();
    } else {
      this.focusFirst(container);
    }
  }

  private cleanup(): void {
    this.releaseAllFocusTraps();

    // Remove live regions
    this.liveElements.forEach((element) => element.remove());
    this.liveElements.clear();

    // Remove media query listener
    if (this.mediaQuery && this.mediaQueryHandler) {
      if (this.mediaQuery.removeEventListener) {
        this.mediaQuery.removeEventListener('change', this.mediaQueryHandler);
      } else {
        this.mediaQuery.removeListener(this.mediaQueryHandler);
      }
    }

    // Clear any pending timeouts
    if (this.clearTimeout) {
      clearTimeout(this.clearTimeout);
    }
  }
}
