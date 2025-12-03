/**
 * Consolidated Animation Utilities
 *
 * Merges functionality from:
 * - animation-optimization.util.ts (animation performance optimization)
 * - flip-animation.util.ts (FLIP animation technique)
 * - web-animations.util.ts (Web Animations API utilities)
 *
 * Provides comprehensive animation utilities for OSI Cards.
 *
 * @example
 * ```typescript
 * import { AnimationUtil } from 'osi-cards-lib';
 *
 * // Web Animations API
 * const anim = AnimationUtil.fadeIn(element, { duration: 300 });
 *
 * // FLIP animations
 * await AnimationUtil.flipAnimate(container, () => {
 *   // Change layout
 * });
 *
 * // Stagger animations
 * await AnimationUtil.stagger(elements, fadeIn(), { delay: 50 });
 * ```
 */

// Re-export all animation utilities
export * from './animation-optimization.util';
export * from './flip-animation.util';
export * from './web-animations.util';

// Create consolidated namespace
import { FlipAnimator, flipAnimate } from './flip-animation.util';
import {
  AnimationController,
  fadeIn,
  fadeOut,
  slideUp,
  slideDown,
  slideInLeft,
  slideInRight,
  scaleIn,
  staggerAnimate
} from './web-animations.util';

// Export slideInLeft as slideIn for backwards compatibility
export { slideInLeft as slideIn } from './web-animations.util';

export const AnimationUtil = {
  // FLIP animations
  FlipAnimator,
  flipAnimate,
  createFlipAnimator: (container: HTMLElement, options?: any) =>
    new FlipAnimator(container, options),

  // Web Animations API
  AnimationController,
  fadeIn,
  fadeOut,
  slideIn: slideInLeft, // Default slide direction is left
  slideUp,
  slideDown,
  slideInLeft,
  slideInRight,
  scaleIn,
  staggerAnimate,

  // Optimization utilities
  shouldReduceMotion: (): boolean => {
    if (typeof window === 'undefined') return false;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery.matches;
  },

  // Helper to create optimized animations
  createOptimized: (element: HTMLElement, keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
    // Use will-change for better performance
    element.style.willChange = 'transform, opacity';
    const anim = element.animate(keyframes, options);
    anim.onfinish = () => {
      element.style.willChange = 'auto';
    };
    return anim;
  }
};

