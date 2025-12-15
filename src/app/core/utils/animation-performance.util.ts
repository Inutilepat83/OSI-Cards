/**
 * Animation Performance Monitoring Utilities
 *
 * Provides utilities for monitoring and optimizing animation performance.
 *
 * @example
 * ```typescript
 * import { monitorAnimation, getAnimationFPS } from './animation-performance.util';
 *
 * const stopMonitoring = monitorAnimation(element, (fps) => {
 *   if (fps < 55) {
 *     console.warn('Animation performance degraded');
 *   }
 * });
 *
 * // Later...
 * stopMonitoring();
 * ```
 */

/**
 * Monitor animation frame rate for an element
 */
export function monitorAnimation(
  element: HTMLElement,
  callback: (fps: number) => void,
  intervalMs = 1000
): () => void {
  let lastTime = performance.now();
  let frames = 0;
  let monitoring = true;

  function measureFrame(): void {
    if (!monitoring) {
      return;
    }

    frames++;
    const currentTime = performance.now();
    const delta = currentTime - lastTime;

    if (delta >= intervalMs) {
      const fps = Math.round((frames * 1000) / delta);
      callback(fps);
      frames = 0;
      lastTime = currentTime;
    }

    requestAnimationFrame(measureFrame);
  }

  requestAnimationFrame(measureFrame);

  return () => {
    monitoring = false;
  };
}

/**
 * Get current animation frame rate
 */
export async function getAnimationFPS(sampleDuration = 1000): Promise<number> {
  return new Promise((resolve) => {
    const lastTime = performance.now();
    let frames = 0;

    function measureFrame(): void {
      frames++;
      const currentTime = performance.now();
      const delta = currentTime - lastTime;

      if (delta >= sampleDuration) {
        const fps = Math.round((frames * 1000) / delta);
        resolve(fps);
      } else {
        requestAnimationFrame(measureFrame);
      }
    }

    requestAnimationFrame(measureFrame);
  });
}

/**
 * Check if animation is running smoothly (60fps)
 */
export async function isAnimationSmooth(threshold = 55): Promise<boolean> {
  const fps = await getAnimationFPS();
  return fps >= threshold;
}

/**
 * Detect animation jank (frame drops)
 */
export function detectAnimationJank(
  callback: (jankDetected: boolean, droppedFrames: number) => void
): () => void {
  let lastFrameTime = performance.now();
  let monitoring = true;
  let droppedFrames = 0;

  function checkFrame(): void {
    if (!monitoring) {
      return;
    }

    const currentTime = performance.now();
    const frameDelta = currentTime - lastFrameTime;

    // If frame took longer than 20ms (should be ~16.67ms for 60fps), we dropped frames
    if (frameDelta > 20) {
      const framesDropped = Math.floor((frameDelta - 16.67) / 16.67);
      droppedFrames += framesDropped;
      callback(true, droppedFrames);
    } else {
      callback(false, droppedFrames);
    }

    lastFrameTime = currentTime;
    requestAnimationFrame(checkFrame);
  }

  requestAnimationFrame(checkFrame);

  return () => {
    monitoring = false;
  };
}

/**
 * Measure animation duration
 */
export function measureAnimationDuration(animation: Animation): Promise<number> {
  return new Promise((resolve) => {
    const startTime = performance.now();

    animation.onfinish = () => {
      const duration = performance.now() - startTime;
      resolve(duration);
    };

    animation.oncancel = () => {
      const duration = performance.now() - startTime;
      resolve(duration);
    };
  });
}

/**
 * Check if element has active animations
 */
export function hasActiveAnimations(element: HTMLElement): boolean {
  return element.getAnimations().length > 0;
}

/**
 * Get all active animations on an element
 */
export function getActiveAnimations(element: HTMLElement): Animation[] {
  return element.getAnimations();
}

/**
 * Pause all animations on an element
 */
export function pauseAllAnimations(element: HTMLElement): void {
  element.getAnimations().forEach((anim) => anim.pause());
}

/**
 * Resume all animations on an element
 */
export function resumeAllAnimations(element: HTMLElement): void {
  element.getAnimations().forEach((anim) => anim.play());
}

/**
 * Cancel all animations on an element
 */
export function cancelAllAnimations(element: HTMLElement): void {
  element.getAnimations().forEach((anim) => anim.cancel());
}

