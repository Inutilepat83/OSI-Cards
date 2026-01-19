/**
 * Reduced Motion Service
 *
 * Provides comprehensive support for users who prefer reduced motion.
 * This service monitors the prefers-reduced-motion media query and
 * provides utilities for adjusting animations accordingly.
 *
 * @dependencies
 * - PLATFORM_ID: For platform detection (browser vs server)
 * - NgZone: For running media query listeners in Angular zone
 *
 * @example
 * ```typescript
 * import { ReducedMotionService } from 'osi-cards-lib';
 *
 * export class MyComponent {
 *   private reducedMotion = inject(ReducedMotionService);
 *
 *   ngOnInit() {
 *     this.reducedMotion.prefersReducedMotion$.subscribe(prefers => {
 *       this.animationsEnabled = !prefers;
 *     });
 *   }
 * }
 * ```
 *
 * @module services/reduced-motion
 */

import { Injectable, inject, PLATFORM_ID, NgZone, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, fromEvent, Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged, map, startWith } from 'rxjs/operators';
import { ANIMATION_TIMING, EASING } from '@osi-cards/constants';

/** Animation configuration for reduced motion mode */
export interface ReducedMotionAnimationConfig {
  /** Duration in milliseconds (0 for instant) */
  duration: number;
  /** CSS easing function */
  easing: string;
  /** Whether to skip the animation entirely */
  skip: boolean;
}

/**
 * Service for handling reduced motion preferences
 *
 * Features:
 * - Reactive preference tracking via media query
 * - Animation configuration helpers
 * - Manual override support
 * - SSR-safe implementation
 */
@Injectable({
  providedIn: 'root',
})
export class ReducedMotionService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private readonly destroyed$ = new Subject<void>();

  /** Internal preference state */
  private readonly _prefersReducedMotion$ = new BehaviorSubject<boolean>(false);

  /** Manual override state (null = use system preference) */
  private readonly _manualOverride$ = new BehaviorSubject<boolean | null>(null);

  /** Media query list reference */
  private mediaQuery: MediaQueryList | null = null;

  constructor() {
    this.initializeMediaQuery();
  }

  /**
   * Observable of the current reduced motion preference
   *
   * Takes into account both system preference and manual override.
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
   * Initialize the media query listener
   */
  private initializeMediaQuery(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

      // Set initial value
      this.updatePreference();

      // Listen for changes
      if (this.mediaQuery.addEventListener) {
        this.mediaQuery.addEventListener('change', this.handleMediaQueryChange);
      } else {
        // Fallback for older browsers
        this.mediaQuery.addListener(this.handleMediaQueryChange);
      }
    });
  }

  /**
   * Handle media query change events
   */
  private handleMediaQueryChange = (): void => {
    this.ngZone.run(() => {
      this.updatePreference();
    });
  };

  /**
   * Update the preference based on system and override settings
   */
  private updatePreference(): void {
    const override = this._manualOverride$.value;

    if (override !== null) {
      this._prefersReducedMotion$.next(override);
      return;
    }

    if (this.mediaQuery) {
      this._prefersReducedMotion$.next(this.mediaQuery.matches);
    }
  }

  /**
   * Set a manual override for reduced motion preference
   *
   * @param value - true to force reduced motion, false to force animations, null to use system
   */
  setOverride(value: boolean | null): void {
    this._manualOverride$.next(value);
    this.updatePreference();
  }

  /**
   * Clear any manual override and use system preference
   */
  clearOverride(): void {
    this.setOverride(null);
  }

  /**
   * Get animation duration adjusted for reduced motion preference
   *
   * @param baseDuration - Base duration in milliseconds
   * @returns Adjusted duration (0 if reduced motion preferred)
   */
  getAnimationDuration(baseDuration: number): number {
    return this.prefersReducedMotion ? 0 : baseDuration;
  }

  /**
   * Get animation configuration adjusted for reduced motion
   *
   * @param baseDuration - Base duration
   * @param baseEasing - Base easing function
   * @returns Adjusted animation configuration
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
   *
   * @param baseStyles - CSS styles object
   * @returns Styles with animation properties adjusted
   */
  getAnimationStyles(baseStyles: Record<string, string>): Record<string, string> {
    if (!this.prefersReducedMotion) {
      return baseStyles;
    }

    const styles = { ...baseStyles };

    // Override animation-related properties
    if ('transition' in styles) {
      styles['transition'] = 'none';
    }
    if ('animation' in styles) {
      styles['animation'] = 'none';
    }
    if ('animation-duration' in styles) {
      styles['animation-duration'] = '0s';
    }
    if ('transition-duration' in styles) {
      styles['transition-duration'] = '0s';
    }

    return styles;
  }

  /**
   * Create a reduced motion-aware animation style string
   *
   * @param property - CSS property to animate
   * @param duration - Animation duration
   * @param easing - Easing function
   * @returns CSS transition string
   */
  createTransition(
    property: string,
    duration: number = ANIMATION_TIMING.NORMAL,
    easing: string = EASING.EASE_OUT
  ): string {
    if (this.prefersReducedMotion) {
      return 'none';
    }
    return `${property} ${duration}ms ${easing}`;
  }

  /**
   * Get the CSS class to apply based on preference
   */
  get cssClass(): string {
    return this.prefersReducedMotion ? 'osi-reduced-motion' : 'osi-full-motion';
  }

  /**
   * Observable of the CSS class to apply
   */
  get cssClass$(): Observable<string> {
    return this.prefersReducedMotion$.pipe(
      map((prefers) => (prefers ? 'osi-reduced-motion' : 'osi-full-motion'))
    );
  }

  /**
   * Execute a callback only if animations are enabled
   *
   * @param callback - Function to execute with animations
   * @param fallback - Optional fallback for reduced motion
   */
  withAnimation<T>(callback: () => T, fallback?: () => T): T | undefined {
    if (this.prefersReducedMotion) {
      return fallback?.();
    }
    return callback();
  }

  /**
   * Wrap a value with reduced motion variant
   *
   * @param fullMotion - Value when animations enabled
   * @param reducedMotion - Value when reduced motion preferred
   */
  select<T>(fullMotion: T, reducedMotion: T): T {
    return this.prefersReducedMotion ? reducedMotion : fullMotion;
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();

    // Clean up media query listener
    if (this.mediaQuery) {
      if (this.mediaQuery.removeEventListener) {
        this.mediaQuery.removeEventListener('change', this.handleMediaQueryChange);
      } else {
        this.mediaQuery.removeListener(this.handleMediaQueryChange);
      }
    }
  }
}

/**
 * Reduced motion CSS utility classes (for use in global styles)
 *
 * Include these in your global styles for automatic reduced motion support:
 *
 * ```css
 * @media (prefers-reduced-motion: reduce) {
 *   .osi-cards-container *,
 *   .osi-cards-container *::before,
 *   .osi-cards-container *::after {
 *     animation-duration: 0.01ms !important;
 *     animation-iteration-count: 1 !important;
 *     transition-duration: 0.01ms !important;
 *     scroll-behavior: auto !important;
 *   }
 * }
 *
 * .osi-reduced-motion * {
 *   animation: none !important;
 *   transition: none !important;
 * }
 *
 * .osi-full-motion {
 *   // Default animated styles
 * }
 * ```
 */
export const REDUCED_MOTION_CSS = `
@media (prefers-reduced-motion: reduce) {
  .osi-cards-container *,
  .osi-cards-container *::before,
  .osi-cards-container *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .osi-card-surface {
    transform: none !important;
  }

  .streaming-indicator {
    animation: none !important;
  }

  .skeleton-shimmer {
    animation: none !important;
    background: var(--osi-color-skeleton, #e9ecef) !important;
  }

  .particle,
  .loading-spinner {
    animation: none !important;
  }
}

.osi-reduced-motion *,
.osi-reduced-motion *::before,
.osi-reduced-motion *::after {
  animation: none !important;
  transition: none !important;
}
`;
