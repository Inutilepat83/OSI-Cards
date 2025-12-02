/**
 * Animation Controller
 *
 * Unified animation management for cards and sections.
 * Consolidates animation-orchestrator and section-animation services.
 *
 * Features:
 * - FLIP animations for smooth transitions
 * - Staggered entrance animations
 * - Respects reduced-motion preferences
 * - Cancelable animations
 * - Performance-optimized (RAF-based)
 *
 * @example
 * ```typescript
 * const animator = new AnimationController();
 *
 * // Animate element entrance
 * animator.animateIn(element, 'fade-up');
 *
 * // FLIP animation for layout changes
 * animator.flip(elements, () => updateLayout());
 *
 * // Staggered animations
 * animator.stagger(elements, 'fade-in', { delay: 50 });
 * ```
 */

// ============================================================================
// TYPES
// ============================================================================

export type AnimationType =
  | 'fade-in'
  | 'fade-out'
  | 'fade-up'
  | 'fade-down'
  | 'scale-in'
  | 'scale-out'
  | 'slide-left'
  | 'slide-right'
  | 'flip';

export interface AnimationOptions {
  /** Duration in ms */
  duration?: number;
  /** Easing function */
  easing?: string;
  /** Delay before start in ms */
  delay?: number;
  /** Fill mode */
  fill?: FillMode;
  /** Callback on complete */
  onComplete?: () => void;
}

export interface StaggerOptions extends AnimationOptions {
  /** Delay between items in ms */
  staggerDelay?: number;
  /** Start from index */
  startIndex?: number;
}

export interface FlipOptions {
  /** Duration in ms */
  duration?: number;
  /** Easing function */
  easing?: string;
}

export interface AnimationState {
  /** Is animation running */
  running: boolean;
  /** Can be cancelled */
  cancel: () => void;
  /** Promise that resolves when complete */
  finished: Promise<void>;
}

type FillMode = 'none' | 'forwards' | 'backwards' | 'both';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_DURATION = 300;
const DEFAULT_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';
const DEFAULT_STAGGER_DELAY = 50;

const KEYFRAMES: Record<AnimationType, Keyframe[]> = {
  'fade-in': [
    { opacity: 0 },
    { opacity: 1 },
  ],
  'fade-out': [
    { opacity: 1 },
    { opacity: 0 },
  ],
  'fade-up': [
    { opacity: 0, transform: 'translateY(20px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ],
  'fade-down': [
    { opacity: 0, transform: 'translateY(-20px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ],
  'scale-in': [
    { opacity: 0, transform: 'scale(0.9)' },
    { opacity: 1, transform: 'scale(1)' },
  ],
  'scale-out': [
    { opacity: 1, transform: 'scale(1)' },
    { opacity: 0, transform: 'scale(0.9)' },
  ],
  'slide-left': [
    { opacity: 0, transform: 'translateX(20px)' },
    { opacity: 1, transform: 'translateX(0)' },
  ],
  'slide-right': [
    { opacity: 0, transform: 'translateX(-20px)' },
    { opacity: 1, transform: 'translateX(0)' },
  ],
  'flip': [], // Handled specially
};

// ============================================================================
// ANIMATION CONTROLLER
// ============================================================================

export class AnimationController {
  private reducedMotion = false;
  private activeAnimations = new Map<Element, Animation>();

  constructor() {
    this.checkReducedMotion();
    this.listenForMotionPreference();
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Animate an element with a preset animation
   */
  animate(
    element: Element,
    type: AnimationType,
    options: AnimationOptions = {}
  ): AnimationState {
    if (this.reducedMotion) {
      return this.skipAnimation(options.onComplete);
    }

    const keyframes = KEYFRAMES[type];
    if (!keyframes || keyframes.length === 0) {
      return this.skipAnimation(options.onComplete);
    }

    return this.runAnimation(element, keyframes, options);
  }

  /**
   * Shorthand for fade-in animation
   */
  animateIn(element: Element, options?: AnimationOptions): AnimationState {
    return this.animate(element, 'fade-up', options);
  }

  /**
   * Shorthand for fade-out animation
   */
  animateOut(element: Element, options?: AnimationOptions): AnimationState {
    return this.animate(element, 'fade-out', options);
  }

  /**
   * Stagger animations across multiple elements
   */
  stagger(
    elements: Element[],
    type: AnimationType,
    options: StaggerOptions = {}
  ): AnimationState {
    if (this.reducedMotion || elements.length === 0) {
      return this.skipAnimation(options.onComplete);
    }

    const staggerDelay = options.staggerDelay ?? DEFAULT_STAGGER_DELAY;
    const startIndex = options.startIndex ?? 0;
    const animations: Animation[] = [];
    let cancelled = false;

    elements.forEach((element, index) => {
      if (cancelled) return;

      const delay = (options.delay ?? 0) + (index - startIndex) * staggerDelay;
      const state = this.animate(element, type, { ...options, delay });

      // Collect animations for cancel
      const anim = this.activeAnimations.get(element);
      if (anim) animations.push(anim);
    });

    const finished = Promise.all(
      elements.map(el => {
        const anim = this.activeAnimations.get(el);
        return anim?.finished ?? Promise.resolve();
      })
    ).then(() => {
      options.onComplete?.();
    });

    return {
      running: true,
      cancel: () => {
        cancelled = true;
        animations.forEach(a => a.cancel());
      },
      finished: finished as Promise<void>,
    };
  }

  /**
   * FLIP animation for layout changes
   * First-Last-Invert-Play technique
   */
  flip(
    elements: Element[],
    change: () => void,
    options: FlipOptions = {}
  ): AnimationState {
    if (this.reducedMotion || elements.length === 0) {
      change();
      return this.skipAnimation();
    }

    // FIRST: Record initial positions
    const firstRects = new Map<Element, DOMRect>();
    elements.forEach(el => {
      firstRects.set(el, el.getBoundingClientRect());
    });

    // Execute the change
    change();

    // LAST: Record final positions
    const animations: Animation[] = [];

    elements.forEach(el => {
      const first = firstRects.get(el);
      const last = el.getBoundingClientRect();

      if (!first) return;

      // INVERT: Calculate the delta
      const deltaX = first.left - last.left;
      const deltaY = first.top - last.top;
      const deltaW = first.width / last.width;
      const deltaH = first.height / last.height;

      // Skip if no change
      if (deltaX === 0 && deltaY === 0 && deltaW === 1 && deltaH === 1) {
        return;
      }

      // PLAY: Animate from inverted position to final
      const anim = el.animate([
        {
          transform: `translate(${deltaX}px, ${deltaY}px) scale(${deltaW}, ${deltaH})`,
        },
        {
          transform: 'translate(0, 0) scale(1, 1)',
        },
      ], {
        duration: options.duration ?? DEFAULT_DURATION,
        easing: options.easing ?? DEFAULT_EASING,
      });

      animations.push(anim);
      this.activeAnimations.set(el, anim);

      anim.onfinish = () => {
        this.activeAnimations.delete(el);
      };
    });

    const finished = Promise.all(
      animations.map(a => a.finished)
    ).then(() => {});

    return {
      running: true,
      cancel: () => animations.forEach(a => a.cancel()),
      finished,
    };
  }

  /**
   * Cancel all active animations
   */
  cancelAll(): void {
    this.activeAnimations.forEach(anim => anim.cancel());
    this.activeAnimations.clear();
  }

  /**
   * Cancel animation on specific element
   */
  cancel(element: Element): void {
    const anim = this.activeAnimations.get(element);
    if (anim) {
      anim.cancel();
      this.activeAnimations.delete(element);
    }
  }

  /**
   * Check if element has active animation
   */
  isAnimating(element: Element): boolean {
    return this.activeAnimations.has(element);
  }

  /**
   * Check reduced motion preference
   */
  prefersReducedMotion(): boolean {
    return this.reducedMotion;
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  private runAnimation(
    element: Element,
    keyframes: Keyframe[],
    options: AnimationOptions
  ): AnimationState {
    // Cancel existing animation
    this.cancel(element);

    const anim = element.animate(keyframes, {
      duration: options.duration ?? DEFAULT_DURATION,
      easing: options.easing ?? DEFAULT_EASING,
      delay: options.delay ?? 0,
      fill: options.fill ?? 'forwards',
    });

    this.activeAnimations.set(element, anim);

    const finished = anim.finished.then(() => {
      this.activeAnimations.delete(element);
      options.onComplete?.();
    }).catch(() => {
      // Animation was cancelled
      this.activeAnimations.delete(element);
    });

    return {
      running: true,
      cancel: () => {
        anim.cancel();
        this.activeAnimations.delete(element);
      },
      finished,
    };
  }

  private skipAnimation(onComplete?: () => void): AnimationState {
    onComplete?.();
    return {
      running: false,
      cancel: () => {},
      finished: Promise.resolve(),
    };
  }

  private checkReducedMotion(): void {
    if (typeof window !== 'undefined') {
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }

  private listenForMotionPreference(): void {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      mediaQuery.addEventListener('change', () => {
        this.reducedMotion = mediaQuery.matches;
      });
    }
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/** Singleton instance */
let instance: AnimationController | null = null;

/** Get or create AnimationController singleton */
export function getAnimationController(): AnimationController {
  if (!instance) {
    instance = new AnimationController();
  }
  return instance;
}

/** Create a new AnimationController instance */
export function createAnimationController(): AnimationController {
  return new AnimationController();
}



