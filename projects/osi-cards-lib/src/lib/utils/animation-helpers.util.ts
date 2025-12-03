/**
 * Animation Helper Utilities
 *
 * Collection of utilities for creating smooth animations with
 * Web Animations API, CSS animations, and RAF-based animations.
 *
 * @example
 * ```typescript
 * import { animate, fadeIn, slideIn } from '@osi-cards/utils';
 *
 * animate(element, fadeIn(300));
 * ```
 */

/**
 * Animation options
 */
export interface AnimationOptions {
  duration?: number;
  delay?: number;
  easing?: string;
  fill?: FillMode;
  iterations?: number;
}

/**
 * Animate element
 *
 * @param element - Element to animate
 * @param keyframes - Animation keyframes
 * @param options - Animation options
 * @returns Animation instance
 */
export function animate(
  element: Element,
  keyframes: Keyframe[],
  options: AnimationOptions = {}
): Animation {
  return element.animate(keyframes, {
    duration: options.duration || 300,
    delay: options.delay || 0,
    easing: options.easing || 'ease',
    fill: options.fill || 'both',
    iterations: options.iterations || 1,
  });
}

/**
 * Fade in animation
 */
export function fadeIn(duration = 300): Keyframe[] {
  return [
    { opacity: 0 },
    { opacity: 1 }
  ];
}

/**
 * Fade out animation
 */
export function fadeOut(duration = 300): Keyframe[] {
  return [
    { opacity: 1 },
    { opacity: 0 }
  ];
}

/**
 * Slide in from left
 */
export function slideInLeft(distance = 100): Keyframe[] {
  return [
    { transform: `translateX(-${distance}px)`, opacity: 0 },
    { transform: 'translateX(0)', opacity: 1 }
  ];
}

/**
 * Slide in from right
 */
export function slideInRight(distance = 100): Keyframe[] {
  return [
    { transform: `translateX(${distance}px)`, opacity: 0 },
    { transform: 'translateX(0)', opacity: 1 }
  ];
}

/**
 * Slide up
 */
export function slideUp(distance = 100): Keyframe[] {
  return [
    { transform: `translateY(${distance}px)`, opacity: 0 },
    { transform: 'translateY(0)', opacity: 1 }
  ];
}

/**
 * Scale in
 */
export function scaleIn(from = 0): Keyframe[] {
  return [
    { transform: `scale(${from})`, opacity: 0 },
    { transform: 'scale(1)', opacity: 1 }
  ];
}

/**
 * Rotate animation
 */
export function rotate(degrees = 360): Keyframe[] {
  return [
    { transform: 'rotate(0deg)' },
    { transform: `rotate(${degrees}deg)` }
  ];
}

/**
 * Bounce animation
 */
export function bounce(): Keyframe[] {
  return [
    { transform: 'translateY(0)', offset: 0 },
    { transform: 'translateY(-30px)', offset: 0.5 },
    { transform: 'translateY(0)', offset: 1 }
  ];
}

/**
 * Pulse animation
 */
export function pulse(scale = 1.1): Keyframe[] {
  return [
    { transform: 'scale(1)', offset: 0 },
    { transform: `scale(${scale})`, offset: 0.5 },
    { transform: 'scale(1)', offset: 1 }
  ];
}

/**
 * Shake animation
 */
export function shake(): Keyframe[] {
  return [
    { transform: 'translateX(0)', offset: 0 },
    { transform: 'translateX(-10px)', offset: 0.25 },
    { transform: 'translateX(10px)', offset: 0.5 },
    { transform: 'translateX(-10px)', offset: 0.75 },
    { transform: 'translateX(0)', offset: 1 }
  ];
}

/**
 * Wait for animation to complete
 *
 * @param animation - Animation instance
 * @returns Promise that resolves when complete
 */
export async function waitForAnimation(animation: Animation): Promise<void> {
  await animation.finished;
}

/**
 * Cancel all animations on element
 *
 * @param element - Element
 */
export function cancelAnimations(element: Element): void {
  element.getAnimations().forEach(anim => anim.cancel());
}

/**
 * Pause all animations on element
 */
export function pauseAnimations(element: Element): void {
  element.getAnimations().forEach(anim => anim.pause());
}

/**
 * Resume all animations on element
 */
export function resumeAnimations(element: Element): void {
  element.getAnimations().forEach(anim => anim.play());
}

/**
 * Stagger animations
 *
 * @param elements - Elements to animate
 * @param keyframes - Animation keyframes
 * @param options - Base animation options
 * @param staggerDelay - Delay between each element
 * @returns Array of animations
 */
export function staggerAnimation(
  elements: Element[],
  keyframes: Keyframe[],
  options: AnimationOptions = {},
  staggerDelay = 50
): Animation[] {
  const animations: Animation[] = [];

  elements.forEach((element, index) => {
    const anim = animate(element, keyframes, {
      ...options,
      delay: (options.delay || 0) + (index * staggerDelay),
    });
    animations.push(anim);
  });

  return animations;
}

/**
 * Sequence animations
 *
 * @param element - Element to animate
 * @param animations - Array of animation configs
 * @returns Promise that resolves when all complete
 */
export async function sequenceAnimations(
  element: Element,
  animations: Array<{ keyframes: Keyframe[]; options?: AnimationOptions }>
): Promise<void> {
  for (const anim of animations) {
    const animation = animate(element, anim.keyframes, anim.options);
    await waitForAnimation(animation);
  }
}

/**
 * Ease functions
 */
export const Easing = {
  linear: 'linear',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  easeInCirc: 'cubic-bezier(0.6, 0.04, 0.98, 0.335)',
  easeOutCirc: 'cubic-bezier(0.075, 0.82, 0.165, 1)',
  easeInOutCirc: 'cubic-bezier(0.785, 0.135, 0.15, 0.86)',
  easeInExpo: 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
  easeOutExpo: 'cubic-bezier(0.19, 1, 0.22, 1)',
  easeInOutExpo: 'cubic-bezier(1, 0, 0, 1)',
  easeInQuad: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
  easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  easeInOutQuad: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
  easeInQuart: 'cubic-bezier(0.895, 0.03, 0.685, 0.22)',
  easeOutQuart: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
  easeInOutQuart: 'cubic-bezier(0.77, 0, 0.175, 1)',
  easeInQuint: 'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
  easeOutQuint: 'cubic-bezier(0.23, 1, 0.32, 1)',
  easeInOutQuint: 'cubic-bezier(0.86, 0, 0.07, 1)',
  easeInSine: 'cubic-bezier(0.47, 0, 0.745, 0.715)',
  easeOutSine: 'cubic-bezier(0.39, 0.575, 0.565, 1)',
  easeInOutSine: 'cubic-bezier(0.445, 0.05, 0.55, 0.95)',
  easeInBack: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
  easeOutBack: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  easeInOutBack: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

