/**
 * Animation Optimization Utilities
 * 
 * Performance-optimized utilities for CSS animations and transforms.
 * Uses CSS transforms and will-change property for hardware acceleration.
 * 
 * @example
 * ```typescript
 * import { applyWillChange, createTransform, applyTransform, resetTransform } from 'osi-cards-lib';
 * 
 * // Prepare element for animation
 * applyWillChange(element, ['transform', 'opacity']);
 * 
 * // Apply animated transform
 * const transform = createTransform(0, -20, 1.05);
 * applyTransform(element, transform);
 * 
 * // Clean up after animation
 * resetTransform(element);
 * ```
 */

/**
 * Apply will-change property for animation optimization.
 * Use before starting animations to hint to the browser about upcoming changes.
 * 
 * @param element - The HTML element to optimize
 * @param properties - CSS properties that will be animated
 * 
 * @example
 * ```typescript
 * applyWillChange(cardElement, ['transform', 'opacity']);
 * ```
 */
export function applyWillChange(element: HTMLElement, properties: string[]): void {
  if (!element?.style) return;
  element.style.willChange = properties.join(', ');
}

/**
 * Remove will-change property after animation completes.
 * Important to call this after animations to free up GPU resources.
 * 
 * @param element - The HTML element to clean up
 * 
 * @example
 * ```typescript
 * // After animation ends
 * removeWillChange(cardElement);
 * ```
 */
export function removeWillChange(element: HTMLElement): void {
  if (!element?.style) return;
  element.style.willChange = 'auto';
}

/**
 * Create an optimized CSS transform string.
 * Combines multiple transform functions into a single string.
 * 
 * @param translateX - Horizontal translation in pixels
 * @param translateY - Vertical translation in pixels
 * @param scale - Scale factor (1 = normal, 0.5 = half, 2 = double)
 * @param rotate - Rotation in degrees
 * @returns CSS transform string
 * 
 * @example
 * ```typescript
 * const transform = createTransform(0, -20, 1.05, 5);
 * // Returns: "translate(0px, -20px) scale(1.05) rotate(5deg)"
 * ```
 */
export function createTransform(
  translateX?: number, 
  translateY?: number, 
  scale?: number, 
  rotate?: number
): string {
  const transforms: string[] = [];

  if (translateX !== undefined || translateY !== undefined) {
    const x = translateX ?? 0;
    const y = translateY ?? 0;
    // Use translate3d for GPU acceleration
    transforms.push(`translate3d(${x}px, ${y}px, 0)`);
  }

  if (scale !== undefined) {
    transforms.push(`scale(${scale})`);
  }

  if (rotate !== undefined) {
    transforms.push(`rotate(${rotate}deg)`);
  }

  return transforms.join(' ');
}

/**
 * Apply an optimized transform to an element.
 * Automatically sets will-change for performance.
 * 
 * @param element - The HTML element to transform
 * @param transform - CSS transform string
 * 
 * @example
 * ```typescript
 * const transform = createTransform(0, -20, 1.05);
 * applyTransform(cardElement, transform);
 * ```
 */
export function applyTransform(element: HTMLElement, transform: string): void {
  if (!element?.style) return;
  element.style.transform = transform;
  element.style.willChange = 'transform';
}

/**
 * Reset transform on an element.
 * Clears the transform and removes will-change hint.
 * 
 * @param element - The HTML element to reset
 * 
 * @example
 * ```typescript
 * resetTransform(cardElement);
 * ```
 */
export function resetTransform(element: HTMLElement): void {
  if (!element?.style) return;
  element.style.transform = '';
  element.style.willChange = 'auto';
}

/**
 * Check if an element is currently animating.
 * Useful for preventing animation conflicts.
 * 
 * @param element - The HTML element to check
 * @returns True if the element has active transitions or animations
 * 
 * @example
 * ```typescript
 * if (!isAnimating(cardElement)) {
 *   startAnimation(cardElement);
 * }
 * ```
 */
export function isAnimating(element: HTMLElement): boolean {
  if (!element || typeof window === 'undefined') return false;
  
  const computedStyle = window.getComputedStyle(element);
  const transition = computedStyle.transition;
  const animation = computedStyle.animation;
  
  // Check if there are active transitions (not the default "all 0s ease 0s")
  const hasActiveTransition = transition !== 'all 0s ease 0s' && 
    transition !== 'none 0s ease 0s 1 normal none running' &&
    transition !== 'none';
    
  // Check if there are active animations (not "none")
  const hasActiveAnimation = animation !== 'none 0s ease 0s 1 normal none running' &&
    animation !== 'none';
  
  return hasActiveTransition || hasActiveAnimation;
}

/**
 * Wait for an element's animations to complete.
 * Returns a promise that resolves when all animations finish.
 * 
 * @param element - The HTML element to wait on
 * @param timeout - Maximum time to wait in milliseconds (default: 2000)
 * @returns Promise that resolves when animations complete
 * 
 * @example
 * ```typescript
 * await waitForAnimations(cardElement);
 * // Now safe to remove or modify the element
 * ```
 */
export function waitForAnimations(element: HTMLElement, timeout = 2000): Promise<void> {
  return new Promise((resolve) => {
    if (!element || typeof window === 'undefined') {
      resolve();
      return;
    }
    
    // Get all running animations
    const animations = element.getAnimations?.() || [];
    
    if (animations.length === 0) {
      resolve();
      return;
    }
    
    // Wait for all animations to finish, with timeout
    const timeoutId = setTimeout(() => resolve(), timeout);
    
    Promise.all(animations.map(animation => animation.finished))
      .then(() => {
        clearTimeout(timeoutId);
        resolve();
      })
      .catch(() => {
        clearTimeout(timeoutId);
        resolve();
      });
  });
}

/**
 * Apply GPU acceleration hints to an element.
 * Forces the browser to use hardware acceleration for rendering.
 * 
 * @param element - The HTML element to accelerate
 * 
 * @example
 * ```typescript
 * enableGPUAcceleration(cardElement);
 * ```
 */
export function enableGPUAcceleration(element: HTMLElement): void {
  if (!element?.style) return;
  element.style.transform = 'translateZ(0)';
  element.style.backfaceVisibility = 'hidden';
  element.style.perspective = '1000px';
}

/**
 * Remove GPU acceleration hints from an element.
 * Call after animations complete to free up GPU resources.
 * 
 * @param element - The HTML element to clean up
 * 
 * @example
 * ```typescript
 * disableGPUAcceleration(cardElement);
 * ```
 */
export function disableGPUAcceleration(element: HTMLElement): void {
  if (!element?.style) return;
  element.style.transform = '';
  element.style.backfaceVisibility = 'visible';
  element.style.perspective = 'none';
}

/**
 * Request animation frame with automatic cancellation.
 * Returns a cancel function that can be used to stop the animation.
 * 
 * @param callback - Function to call on each frame
 * @returns Cancel function
 * 
 * @example
 * ```typescript
 * const cancel = requestAnimationLoop((timestamp) => {
 *   updateAnimation(timestamp);
 *   if (isDone) cancel();
 * });
 * 
 * // Later, to stop the loop:
 * cancel();
 * ```
 */
export function requestAnimationLoop(callback: (timestamp: number) => void): () => void {
  let rafId: number | null = null;
  let cancelled = false;
  
  const loop = (timestamp: number) => {
    if (cancelled) return;
    callback(timestamp);
    rafId = requestAnimationFrame(loop);
  };
  
  rafId = requestAnimationFrame(loop);
  
  return () => {
    cancelled = true;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
}

/**
 * Linear interpolation between two values.
 * Useful for smooth animations.
 * 
 * @param start - Starting value
 * @param end - Ending value
 * @param factor - Interpolation factor (0-1)
 * @returns Interpolated value
 * 
 * @example
 * ```typescript
 * const current = lerp(0, 100, 0.5); // Returns 50
 * ```
 */
export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

/**
 * Clamp a value between min and max.
 * 
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 * 
 * @example
 * ```typescript
 * const clamped = clamp(150, 0, 100); // Returns 100
 * ```
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}






