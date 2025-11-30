/**
 * Web Animations API Utilities
 * 
 * Programmatic animation control using the Web Animations API.
 * Provides pause/resume, playback rate control, animation sequencing,
 * and declarative animation definitions.
 * 
 * @example
 * ```typescript
 * import { AnimationController, fadeIn, slideUp } from 'osi-cards-lib';
 * 
 * const controller = new AnimationController(element);
 * await controller.play(fadeIn({ duration: 300 }));
 * await controller.play(slideUp({ duration: 200, easing: 'ease-out' }));
 * ```
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Animation timing options
 */
export interface AnimationTiming {
  duration?: number;
  delay?: number;
  easing?: string;
  iterations?: number;
  direction?: PlaybackDirection;
  fill?: FillMode;
  endDelay?: number;
}

/**
 * Animation keyframe with timing
 */
export interface AnimationDefinition {
  keyframes: Keyframe[] | PropertyIndexedKeyframes;
  timing: KeyframeAnimationOptions;
}

/**
 * Animation state
 */
export type AnimationState = 'idle' | 'pending' | 'running' | 'paused' | 'finished';

/**
 * Animation event handlers
 */
export interface AnimationEventHandlers {
  onStart?: () => void;
  onFinish?: () => void;
  onCancel?: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

/**
 * Stagger configuration
 */
export interface StaggerConfig {
  delay: number;
  curve?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'random';
  from?: 'start' | 'end' | 'center' | 'edges';
}

/**
 * Spring physics configuration
 */
export interface SpringConfig {
  tension?: number;    // Stiffness (default: 170)
  friction?: number;   // Damping (default: 26)
  mass?: number;       // Mass (default: 1)
  precision?: number;  // When to consider animation complete (default: 0.01)
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const DEFAULT_TIMING: KeyframeAnimationOptions = {
  duration: 300,
  easing: 'ease-out',
  fill: 'forwards',
};

const DEFAULT_SPRING: Required<SpringConfig> = {
  tension: 170,
  friction: 26,
  mass: 1,
  precision: 0.01,
};

// ============================================================================
// ANIMATION CONTROLLER
// ============================================================================

/**
 * Controller for managing element animations
 */
export class AnimationController {
  private element: HTMLElement;
  private currentAnimation: Animation | null = null;
  private animationQueue: AnimationDefinition[] = [];
  private isPlaying = false;
  private _playbackRate = 1;
  private handlers: AnimationEventHandlers = {};

  constructor(element: HTMLElement, handlers?: AnimationEventHandlers) {
    this.element = element;
    this.handlers = handlers ?? {};
  }

  /**
   * Current animation state
   */
  get state(): AnimationState {
    if (!this.currentAnimation) return 'idle';
    return this.currentAnimation.playState;
  }

  /**
   * Current playback rate
   */
  get playbackRate(): number {
    return this._playbackRate;
  }

  set playbackRate(rate: number) {
    this._playbackRate = rate;
    if (this.currentAnimation) {
      this.currentAnimation.playbackRate = rate;
    }
  }

  /**
   * Plays an animation
   */
  async play(definition: AnimationDefinition): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Cancel any existing animation
        this.cancel();

        this.currentAnimation = this.element.animate(
          definition.keyframes,
          definition.timing
        );

        this.currentAnimation.playbackRate = this._playbackRate;

        this.handlers.onStart?.();
        this.isPlaying = true;

        this.currentAnimation.onfinish = () => {
          this.isPlaying = false;
          this.handlers.onFinish?.();
          resolve();
        };

        this.currentAnimation.oncancel = () => {
          this.isPlaying = false;
          this.handlers.onCancel?.();
          resolve();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Queues an animation to play after current one finishes
   */
  queue(definition: AnimationDefinition): void {
    this.animationQueue.push(definition);
  }

  /**
   * Plays all queued animations in sequence
   */
  async playQueue(): Promise<void> {
    while (this.animationQueue.length > 0) {
      const next = this.animationQueue.shift();
      if (next) {
        await this.play(next);
      }
    }
  }

  /**
   * Pauses the current animation
   */
  pause(): void {
    if (this.currentAnimation && this.currentAnimation.playState === 'running') {
      this.currentAnimation.pause();
      this.handlers.onPause?.();
    }
  }

  /**
   * Resumes the current animation
   */
  resume(): void {
    if (this.currentAnimation && this.currentAnimation.playState === 'paused') {
      this.currentAnimation.play();
      this.handlers.onResume?.();
    }
  }

  /**
   * Reverses the current animation
   */
  reverse(): void {
    if (this.currentAnimation) {
      this.currentAnimation.reverse();
    }
  }

  /**
   * Cancels the current animation
   */
  cancel(): void {
    if (this.currentAnimation) {
      this.currentAnimation.cancel();
      this.currentAnimation = null;
      this.isPlaying = false;
    }
  }

  /**
   * Finishes the animation immediately
   */
  finish(): void {
    if (this.currentAnimation) {
      this.currentAnimation.finish();
    }
  }

  /**
   * Updates animation timing on the fly
   */
  updateTiming(timing: OptionalEffectTiming): void {
    if (this.currentAnimation?.effect) {
      (this.currentAnimation.effect as KeyframeEffect).updateTiming(timing);
    }
  }

  /**
   * Gets the current animation progress (0-1)
   */
  getProgress(): number {
    if (!this.currentAnimation?.effect) return 0;
    
    const timing = this.currentAnimation.effect.getComputedTiming();
    const progress = timing.progress ?? 0;
    return typeof progress === 'number' ? progress : 0;
  }

  /**
   * Seeks to a specific progress (0-1)
   */
  seekTo(progress: number): void {
    if (!this.currentAnimation?.effect) return;
    
    const timing = this.currentAnimation.effect.getComputedTiming();
    const duration = timing.duration;
    
    if (typeof duration === 'number') {
      this.currentAnimation.currentTime = progress * duration;
    }
  }
}

// ============================================================================
// ANIMATION PRESETS
// ============================================================================

/**
 * Creates a fade-in animation
 */
export function fadeIn(timing?: AnimationTiming): AnimationDefinition {
  return {
    keyframes: [
      { opacity: 0 },
      { opacity: 1 },
    ],
    timing: { ...DEFAULT_TIMING, ...timing },
  };
}

/**
 * Creates a fade-out animation
 */
export function fadeOut(timing?: AnimationTiming): AnimationDefinition {
  return {
    keyframes: [
      { opacity: 1 },
      { opacity: 0 },
    ],
    timing: { ...DEFAULT_TIMING, ...timing },
  };
}

/**
 * Creates a slide-up animation
 */
export function slideUp(
  distance: number = 20,
  timing?: AnimationTiming
): AnimationDefinition {
  return {
    keyframes: [
      { transform: `translateY(${distance}px)`, opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 },
    ],
    timing: { ...DEFAULT_TIMING, ...timing },
  };
}

/**
 * Creates a slide-down animation
 */
export function slideDown(
  distance: number = 20,
  timing?: AnimationTiming
): AnimationDefinition {
  return {
    keyframes: [
      { transform: 'translateY(0)', opacity: 1 },
      { transform: `translateY(${distance}px)`, opacity: 0 },
    ],
    timing: { ...DEFAULT_TIMING, ...timing },
  };
}

/**
 * Creates a slide-in-left animation
 */
export function slideInLeft(
  distance: number = 30,
  timing?: AnimationTiming
): AnimationDefinition {
  return {
    keyframes: [
      { transform: `translateX(-${distance}px)`, opacity: 0 },
      { transform: 'translateX(0)', opacity: 1 },
    ],
    timing: { ...DEFAULT_TIMING, ...timing },
  };
}

/**
 * Creates a slide-in-right animation
 */
export function slideInRight(
  distance: number = 30,
  timing?: AnimationTiming
): AnimationDefinition {
  return {
    keyframes: [
      { transform: `translateX(${distance}px)`, opacity: 0 },
      { transform: 'translateX(0)', opacity: 1 },
    ],
    timing: { ...DEFAULT_TIMING, ...timing },
  };
}

/**
 * Creates a scale-in animation
 */
export function scaleIn(
  fromScale: number = 0.95,
  timing?: AnimationTiming
): AnimationDefinition {
  return {
    keyframes: [
      { transform: `scale(${fromScale})`, opacity: 0 },
      { transform: 'scale(1)', opacity: 1 },
    ],
    timing: { ...DEFAULT_TIMING, ...timing },
  };
}

/**
 * Creates a scale-out animation
 */
export function scaleOut(
  toScale: number = 0.95,
  timing?: AnimationTiming
): AnimationDefinition {
  return {
    keyframes: [
      { transform: 'scale(1)', opacity: 1 },
      { transform: `scale(${toScale})`, opacity: 0 },
    ],
    timing: { ...DEFAULT_TIMING, ...timing },
  };
}

/**
 * Creates a bounce-in animation
 */
export function bounceIn(timing?: AnimationTiming): AnimationDefinition {
  return {
    keyframes: [
      { transform: 'scale(0)', opacity: 0, offset: 0 },
      { transform: 'scale(1.1)', opacity: 0.7, offset: 0.6 },
      { transform: 'scale(0.95)', opacity: 0.9, offset: 0.8 },
      { transform: 'scale(1)', opacity: 1, offset: 1 },
    ],
    timing: {
      ...DEFAULT_TIMING,
      duration: 400,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      ...timing,
    },
  };
}

/**
 * Creates a pulse animation
 */
export function pulse(scale: number = 1.05, timing?: AnimationTiming): AnimationDefinition {
  return {
    keyframes: [
      { transform: 'scale(1)' },
      { transform: `scale(${scale})` },
      { transform: 'scale(1)' },
    ],
    timing: {
      ...DEFAULT_TIMING,
      duration: 600,
      iterations: Infinity,
      ...timing,
    },
  };
}

/**
 * Creates a shimmer/skeleton loading animation
 */
export function shimmer(timing?: AnimationTiming): AnimationDefinition {
  return {
    keyframes: [
      { backgroundPosition: '-200% 0' },
      { backgroundPosition: '200% 0' },
    ],
    timing: {
      ...DEFAULT_TIMING,
      duration: 1500,
      iterations: Infinity,
      easing: 'linear',
      ...timing,
    },
  };
}

// ============================================================================
// STAGGER ANIMATIONS
// ============================================================================

/**
 * Animates multiple elements with staggered timing
 */
export async function staggerAnimate(
  elements: HTMLElement[],
  definition: AnimationDefinition,
  stagger: StaggerConfig
): Promise<Animation[]> {
  const animations: Animation[] = [];
  const delays = calculateStaggerDelays(elements.length, stagger);

  const promises = elements.map((element, index) => {
    const delay = delays[index] ?? 0;
    const animation = element.animate(definition.keyframes, {
      ...definition.timing,
      delay: (definition.timing.delay ?? 0) + delay,
    });
    animations.push(animation);
    return animation.finished;
  });

  await Promise.all(promises);
  return animations;
}

/**
 * Calculates stagger delays based on configuration
 */
export function calculateStaggerDelays(
  count: number,
  config: StaggerConfig
): number[] {
  const delays: number[] = [];
  const { delay, curve = 'linear', from = 'start' } = config;

  for (let i = 0; i < count; i++) {
    let index = i;

    // Adjust index based on 'from' direction
    switch (from) {
      case 'end':
        index = count - 1 - i;
        break;
      case 'center':
        const center = (count - 1) / 2;
        index = Math.abs(i - center);
        break;
      case 'edges':
        const mid = (count - 1) / 2;
        index = mid - Math.abs(i - mid);
        break;
    }

    // Apply easing curve
    let t = count > 1 ? index / (count - 1) : 0;

    switch (curve) {
      case 'ease-in':
        t = t * t;
        break;
      case 'ease-out':
        t = 1 - Math.pow(1 - t, 2);
        break;
      case 'ease-in-out':
        t = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        break;
      case 'random':
        t = Math.random();
        break;
    }

    delays.push(t * delay * (count - 1));
  }

  return delays;
}

// ============================================================================
// SPRING PHYSICS
// ============================================================================

/**
 * Generates spring animation keyframes
 */
export function springKeyframes(
  from: number,
  to: number,
  config?: SpringConfig,
  property: string = 'transform'
): Keyframe[] {
  const spring = { ...DEFAULT_SPRING, ...config };
  const { tension, friction, mass, precision } = spring;

  const keyframes: Keyframe[] = [];
  const omega = Math.sqrt(tension / mass);
  const zeta = friction / (2 * Math.sqrt(tension * mass));

  let t = 0;
  const dt = 1 / 60; // 60fps
  let position = from;
  let velocity = 0;
  const delta = to - from;

  // Generate keyframes until spring settles
  let maxIterations = 300; // ~5 seconds at 60fps
  while (maxIterations-- > 0) {
    // Underdamped spring
    let displacement: number;
    if (zeta < 1) {
      const omegaD = omega * Math.sqrt(1 - zeta * zeta);
      displacement = delta * (1 - Math.exp(-zeta * omega * t) * (
        Math.cos(omegaD * t) + (zeta * omega / omegaD) * Math.sin(omegaD * t)
      ));
    } else {
      // Critically damped or overdamped
      displacement = delta * (1 - Math.exp(-omega * t) * (1 + omega * t));
    }

    position = from + displacement;
    
    // Normalize offset (0-1)
    const normalizedOffset = t / 5; // Normalize to ~5 seconds
    if (normalizedOffset <= 1) {
      const value = property === 'transform' 
        ? `translateY(${position}px)` 
        : String(position);
      
      keyframes.push({
        [property]: value,
        offset: Math.min(normalizedOffset, 1),
      });
    }

    // Check if settled
    if (Math.abs(to - position) < precision && Math.abs(velocity) < precision) {
      break;
    }

    t += dt;
    velocity = (position - (keyframes[keyframes.length - 2] ? from + (keyframes[keyframes.length - 2]?.offset ?? 0) * delta : from)) / dt;
  }

  // Ensure final keyframe
  keyframes.push({
    [property]: property === 'transform' ? `translateY(${to}px)` : String(to),
    offset: 1,
  });

  return keyframes;
}

/**
 * Creates a spring animation definition
 */
export function springAnimation(
  from: Record<string, number>,
  to: Record<string, number>,
  config?: SpringConfig
): AnimationDefinition {
  // For simplicity, use the first property's spring timing
  const keys = Object.keys(from);
  const keyframes: Keyframe[] = [];

  // Generate spring motion for each property
  const springFrames = springKeyframes(
    from[keys[0]!] ?? 0,
    to[keys[0]!] ?? 0,
    config
  );

  // Use spring timing to generate keyframes for all properties
  for (const frame of springFrames) {
    const offset = frame.offset;
    const keyframe: Keyframe = { offset };

    for (const key of keys) {
      const fromVal = from[key] ?? 0;
      const toVal = to[key] ?? 0;
      const t = typeof offset === 'number' ? offset : 0;
      keyframe[key] = fromVal + (toVal - fromVal) * t;
    }

    keyframes.push(keyframe);
  }

  return {
    keyframes,
    timing: {
      duration: springFrames.length * (1000 / 60), // Convert frames to ms
      fill: 'forwards',
    },
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Checks if Web Animations API is supported
 */
export function supportsWebAnimations(): boolean {
  return typeof Element !== 'undefined' && 'animate' in Element.prototype;
}

/**
 * Waits for an animation to complete
 */
export function waitForAnimation(animation: Animation): Promise<void> {
  return new Promise((resolve) => {
    animation.onfinish = () => resolve();
    animation.oncancel = () => resolve();
  });
}

/**
 * Cancels all animations on an element
 */
export function cancelAllAnimations(element: HTMLElement): void {
  const animations = element.getAnimations();
  for (const animation of animations) {
    animation.cancel();
  }
}

/**
 * Pauses all animations on an element
 */
export function pauseAllAnimations(element: HTMLElement): void {
  const animations = element.getAnimations();
  for (const animation of animations) {
    animation.pause();
  }
}

/**
 * Resumes all animations on an element
 */
export function resumeAllAnimations(element: HTMLElement): void {
  const animations = element.getAnimations();
  for (const animation of animations) {
    animation.play();
  }
}

/**
 * Sets playback rate for all animations on an element
 */
export function setAnimationSpeed(element: HTMLElement, rate: number): void {
  const animations = element.getAnimations();
  for (const animation of animations) {
    animation.playbackRate = rate;
  }
}

/**
 * Gets all running animations on an element
 */
export function getRunningAnimations(element: HTMLElement): Animation[] {
  return element.getAnimations().filter(a => a.playState === 'running');
}

/**
 * Commits animation styles (makes them permanent)
 */
export function commitAnimationStyles(animation: Animation): void {
  animation.commitStyles();
  animation.cancel();
}

