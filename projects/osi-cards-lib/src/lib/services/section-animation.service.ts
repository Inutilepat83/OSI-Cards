/**
 * Section Animation Service
 * 
 * Centralized service for managing section animations in OSI Cards.
 * Handles entrance animations, streaming effects, and animation state tracking.
 * 
 * @example
 * ```typescript
 * import { SectionAnimationService } from 'osi-cards-lib';
 * 
 * const animationService = inject(SectionAnimationService);
 * 
 * // Track a new section
 * animationService.markSectionEntering('section-1', 0);
 * 
 * // Check animation state
 * if (animationService.shouldAnimate('section-1')) {
 *   // Apply animation
 * }
 * 
 * // Complete animation
 * animationService.markSectionAnimated('section-1');
 * ```
 */

import { Injectable, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AnimationState } from '../types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Animation configuration options
 */
export interface AnimationConfig {
  /** Stagger delay between items (ms) */
  staggerDelayMs: number;
  /** Duration of entrance animation (ms) */
  entranceDurationMs: number;
  /** Duration of exit animation (ms) */
  exitDurationMs: number;
  /** Whether to respect reduced motion preference */
  respectReducedMotion: boolean;
}

/**
 * Section animation state
 */
interface SectionAnimationState {
  state: AnimationState;
  timestamp: number;
  staggerIndex: number;
}

/** Default animation configuration */
export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  staggerDelayMs: 40,
  entranceDurationMs: 300,
  exitDurationMs: 200,
  respectReducedMotion: true,
};

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: 'root',
})
export class SectionAnimationService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private config: AnimationConfig = { ...DEFAULT_ANIMATION_CONFIG };

  // Animation state tracking
  private readonly sectionStates = new Map<string, SectionAnimationState>();
  private readonly animatedSections = new Set<string>();
  private readonly pendingAnimations = new Set<string>();

  // Reduced motion preference
  private prefersReducedMotion = false;
  private mediaQueryList?: MediaQueryList;
  private mediaQueryHandler?: (e: MediaQueryListEvent) => void;

  // Pending timeouts for cleanup
  private readonly pendingTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.setupReducedMotionDetection();
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  /**
   * Configure animation behavior
   */
  configure(config: Partial<AnimationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): AnimationConfig {
    return { ...this.config };
  }

  // ============================================================================
  // ANIMATION STATE MANAGEMENT
  // ============================================================================

  /**
   * Mark a section as entering (starting animation)
   * 
   * @param key - Unique section identifier
   * @param staggerIndex - Position in stagger sequence
   */
  markSectionEntering(key: string, staggerIndex: number): void {
    // Skip if already animated
    if (this.animatedSections.has(key)) {
      return;
    }

    const state: SectionAnimationState = {
      state: 'entering',
      timestamp: Date.now(),
      staggerIndex: Math.min(staggerIndex, 15), // Cap stagger index
    };

    this.sectionStates.set(key, state);
    this.pendingAnimations.add(key);

    // Schedule transition to 'entered' state
    this.scheduleAnimationComplete(key, staggerIndex);
  }

  /**
   * Mark a section's animation as complete
   * 
   * @param key - Unique section identifier
   */
  markSectionAnimated(key: string): void {
    this.animatedSections.add(key);
    this.pendingAnimations.delete(key);

    // Update state
    const current = this.sectionStates.get(key);
    if (current) {
      current.state = 'entered';
    }

    // Clear any pending timeout
    const timeout = this.pendingTimeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.pendingTimeouts.delete(key);
    }
  }

  /**
   * Check if a section should animate
   * 
   * @param key - Unique section identifier
   * @returns true if section should animate
   */
  shouldAnimate(key: string): boolean {
    // Respect reduced motion preference
    if (this.config.respectReducedMotion && this.prefersReducedMotion) {
      return false;
    }

    // Don't animate if already animated
    if (this.animatedSections.has(key)) {
      return false;
    }

    // Check current state
    const state = this.sectionStates.get(key);
    return state?.state === 'entering';
  }

  /**
   * Check if a section has completed its animation
   * 
   * @param key - Unique section identifier
   * @returns true if animation is complete
   */
  hasAnimated(key: string): boolean {
    return this.animatedSections.has(key);
  }

  /**
   * Get the animation state of a section
   * 
   * @param key - Unique section identifier
   * @returns Current animation state or 'none'
   */
  getAnimationState(key: string): AnimationState {
    return this.sectionStates.get(key)?.state ?? 'none';
  }

  /**
   * Get CSS class for section animation
   * 
   * @param key - Unique section identifier
   * @returns CSS class name based on animation state
   */
  getAnimationClass(key: string): string {
    const state = this.sectionStates.get(key);

    if (!state) return '';
    if (this.animatedSections.has(key)) return 'section-entered';

    switch (state.state) {
      case 'entering':
        return 'section-streaming';
      case 'entered':
        return 'section-entered';
      default:
        return '';
    }
  }

  /**
   * Get stagger delay for a section
   * 
   * @param key - Unique section identifier
   * @returns Stagger delay in milliseconds
   */
  getStaggerDelay(key: string): number {
    const state = this.sectionStates.get(key);
    if (!state) return 0;
    return state.staggerIndex * this.config.staggerDelayMs;
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  /**
   * Reset all animation states (for new card/session)
   */
  resetAll(): void {
    // Clear all pending timeouts
    for (const timeout of this.pendingTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.pendingTimeouts.clear();

    this.sectionStates.clear();
    this.animatedSections.clear();
    this.pendingAnimations.clear();
  }

  /**
   * Finalize all pending animations (streaming complete)
   */
  finalizeAllAnimations(): void {
    for (const key of this.pendingAnimations) {
      this.markSectionAnimated(key);
    }
  }

  /**
   * Check if any animations are pending
   */
  hasPendingAnimations(): boolean {
    return this.pendingAnimations.size > 0;
  }

  /**
   * Get count of pending animations
   */
  getPendingCount(): number {
    return this.pendingAnimations.size;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Check if reduced motion is preferred
   */
  isPrefersReducedMotion(): boolean {
    return this.prefersReducedMotion;
  }

  /**
   * Calculate total animation duration including stagger
   * 
   * @param staggerIndex - Position in stagger sequence
   * @returns Total duration in milliseconds
   */
  calculateTotalDuration(staggerIndex: number): number {
    const staggerDelay = Math.min(staggerIndex, 15) * this.config.staggerDelayMs;
    return staggerDelay + this.config.entranceDurationMs;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private scheduleAnimationComplete(key: string, staggerIndex: number): void {
    // Clear any existing timeout
    const existing = this.pendingTimeouts.get(key);
    if (existing) {
      clearTimeout(existing);
    }

    const totalDelay = this.calculateTotalDuration(staggerIndex);

    const timeout = setTimeout(() => {
      this.markSectionAnimated(key);
      this.pendingTimeouts.delete(key);
    }, totalDelay);

    this.pendingTimeouts.set(key, timeout);
  }

  private setupReducedMotionDetection(): void {
    if (typeof window === 'undefined') return;

    this.mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.prefersReducedMotion = this.mediaQueryList.matches;

    this.mediaQueryHandler = (e: MediaQueryListEvent) => {
      this.prefersReducedMotion = e.matches;
    };

    this.mediaQueryList.addEventListener('change', this.mediaQueryHandler);
  }

  private cleanup(): void {
    // Clear all timeouts
    for (const timeout of this.pendingTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.pendingTimeouts.clear();

    // Remove event listener
    if (this.mediaQueryList && this.mediaQueryHandler) {
      this.mediaQueryList.removeEventListener('change', this.mediaQueryHandler);
    }

    this.sectionStates.clear();
    this.animatedSections.clear();
    this.pendingAnimations.clear();
  }
}









