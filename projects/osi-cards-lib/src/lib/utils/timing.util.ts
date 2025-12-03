/**
 * Debounce and Throttle Utilities (Point 12)
 *
 * Provides optimized debouncing and throttling for resize handling,
 * scroll events, and other high-frequency operations.
 *
 * @example
 * ```typescript
 * // Debounced resize handler
 * const handleResize = debounce(() => {
 *   recalculateLayout();
 * }, 150);
 *
 * window.addEventListener('resize', handleResize);
 *
 * // Throttled scroll handler
 * const handleScroll = throttle(() => {
 *   updateScrollPosition();
 * }, 16); // ~60fps
 *
 * window.addEventListener('scroll', handleScroll);
 * ```
 */

// =============================================================================
// TYPES
// =============================================================================

export interface DebounceOptions {
  /** Execute on leading edge */
  leading?: boolean;
  /** Execute on trailing edge */
  trailing?: boolean;
  /** Maximum wait time before forced execution */
  maxWait?: number;
}

export interface ThrottleOptions {
  /** Execute on leading edge */
  leading?: boolean;
  /** Execute on trailing edge */
  trailing?: boolean;
}

export interface DebouncedFunction<T extends (...args: Parameters<T>) => ReturnType<T>> {
  (...args: Parameters<T>): void;
  /** Cancel pending execution */
  cancel: () => void;
  /** Flush pending execution immediately */
  flush: () => ReturnType<T> | undefined;
  /** Check if there's a pending execution */
  pending: () => boolean;
}

export interface ThrottledFunction<T extends (...args: Parameters<T>) => ReturnType<T>> {
  (...args: Parameters<T>): ReturnType<T> | undefined;
  /** Cancel pending execution */
  cancel: () => void;
  /** Flush pending execution immediately */
  flush: () => ReturnType<T> | undefined;
}

// =============================================================================
// DEBOUNCE
// =============================================================================

/**
 * Creates a debounced function that delays invoking func until after
 * wait milliseconds have elapsed since the last time it was invoked.
 *
 * @param func - Function to debounce
 * @param wait - Delay in milliseconds
 * @param options - Debounce options
 * @returns Debounced function
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait = 100,
  options: DebounceOptions = {}
): DebouncedFunction<T> {
  const { leading = false, trailing = true, maxWait } = options;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let maxTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: unknown = null;
  let result: ReturnType<T> | undefined;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;

  function invokeFunc(time: number): ReturnType<T> {
    const args = lastArgs!;
    const thisArg = lastThis;

    lastArgs = null;
    lastThis = null;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function startTimer(pendingFunc: () => void, waitTime: number): ReturnType<typeof setTimeout> {
    return setTimeout(pendingFunc, waitTime);
  }

  function cancelTimer(id: ReturnType<typeof setTimeout> | null): void {
    if (id !== null) {
      clearTimeout(id);
    }
  }

  function leadingEdge(time: number): ReturnType<T> | undefined {
    lastInvokeTime = time;

    // Start the timer for the trailing edge
    timeoutId = startTimer(timerExpired, wait);

    // Invoke the leading edge
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time: number): number {
    const timeSinceLastCall = time - (lastCallTime ?? 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time: number): boolean {
    const timeSinceLastCall = time - (lastCallTime ?? 0);
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired(): void {
    const time = Date.now();

    if (shouldInvoke(time)) {
      trailingEdge(time);
      return;
    }

    // Restart the timer
    timeoutId = startTimer(timerExpired, remainingWait(time));
  }

  function trailingEdge(time: number): ReturnType<T> | undefined {
    timeoutId = null;

    // Only invoke if we have lastArgs (meaning debounced was called)
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }

    lastArgs = null;
    lastThis = null;
    return result;
  }

  function cancel(): void {
    cancelTimer(timeoutId);
    cancelTimer(maxTimeoutId);
    timeoutId = null;
    maxTimeoutId = null;
    lastArgs = null;
    lastThis = null;
    lastCallTime = undefined;
    lastInvokeTime = 0;
  }

  function flush(): ReturnType<T> | undefined {
    if (timeoutId === null) {
      return result;
    }

    return trailingEdge(Date.now());
  }

  function pending(): boolean {
    return timeoutId !== null;
  }

  function debounced(this: unknown, ...args: Parameters<T>): void {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === null) {
        leadingEdge(time);
        return;
      }

      if (maxWait !== undefined) {
        // Handle invocations in a tight loop
        cancelTimer(timeoutId);
        timeoutId = startTimer(timerExpired, wait);
        invokeFunc(time);
        return;
      }
    }

    if (timeoutId === null) {
      timeoutId = startTimer(timerExpired, wait);
    }
  }

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;

  return debounced as DebouncedFunction<T>;
}

// =============================================================================
// THROTTLE
// =============================================================================

/**
 * Creates a throttled function that only invokes func at most once
 * per every wait milliseconds.
 *
 * @param func - Function to throttle
 * @param wait - Minimum time between invocations in milliseconds
 * @param options - Throttle options
 * @returns Throttled function
 */
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait = 100,
  options: ThrottleOptions = {}
): ThrottledFunction<T> {
  const { leading = true, trailing = true } = options;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: unknown = null;
  let result: ReturnType<T> | undefined;
  let lastCallTime = 0;

  function invokeFunc(): ReturnType<T> {
    const args = lastArgs!;
    const thisArg = lastThis;

    lastArgs = null;
    lastThis = null;
    lastCallTime = Date.now();
    result = func.apply(thisArg, args);
    return result;
  }

  function trailingEdge(): void {
    timeoutId = null;

    if (trailing && lastArgs) {
      invokeFunc();
    } else {
      lastArgs = null;
      lastThis = null;
    }
  }

  function cancel(): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastThis = null;
    lastCallTime = 0;
  }

  function flush(): ReturnType<T> | undefined {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
      if (lastArgs) {
        return invokeFunc();
      }
    }
    return result;
  }

  function throttled(this: unknown, ...args: Parameters<T>): ReturnType<T> | undefined {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    lastArgs = args;
    lastThis = this;

    if (timeSinceLastCall >= wait) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (leading) {
        return invokeFunc();
      }
    }

    if (timeoutId === null && trailing) {
      const remaining = wait - timeSinceLastCall;
      timeoutId = setTimeout(trailingEdge, remaining > 0 ? remaining : wait);
    }

    return result;
  }

  throttled.cancel = cancel;
  throttled.flush = flush;

  return throttled as ThrottledFunction<T>;
}

// =============================================================================
// ANIMATION FRAME UTILITIES
// =============================================================================

/**
 * Creates a function that uses requestAnimationFrame for throttling
 * Optimal for visual updates (~60fps)
 */
export function rafThrottle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T
): DebouncedFunction<T> {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: unknown = null;
  let result: ReturnType<T> | undefined;

  function invokeFunc(): void {
    rafId = null;
    if (lastArgs) {
      result = func.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
    }
  }

  function cancel(): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastArgs = null;
    lastThis = null;
  }

  function flush(): ReturnType<T> | undefined {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
      if (lastArgs) {
        result = func.apply(lastThis, lastArgs);
        lastArgs = null;
        lastThis = null;
      }
    }
    return result;
  }

  function pending(): boolean {
    return rafId !== null;
  }

  function throttled(this: unknown, ...args: Parameters<T>): void {
    lastArgs = args;
    lastThis = this;

    if (rafId === null) {
      rafId = requestAnimationFrame(invokeFunc);
    }
  }

  throttled.cancel = cancel;
  throttled.flush = flush;
  throttled.pending = pending;

  return throttled as DebouncedFunction<T>;
}

/**
 * Animation frame pooling for multiple callbacks (Point 14)
 * Consolidates multiple rAF calls into a single frame
 */
export class AnimationFramePool {
  private callbacks = new Map<string, () => void>();
  private rafId: number | null = null;

  /**
   * Schedule a callback for the next animation frame
   * @param id - Unique identifier for the callback (overwrites existing)
   * @param callback - Function to execute
   */
  schedule(id: string, callback: () => void): void {
    this.callbacks.set(id, callback);
    this.scheduleFrame();
  }

  /**
   * Cancel a scheduled callback
   */
  cancel(id: string): void {
    this.callbacks.delete(id);
  }

  /**
   * Cancel all scheduled callbacks
   */
  cancelAll(): void {
    this.callbacks.clear();
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Get number of pending callbacks
   */
  get pendingCount(): number {
    return this.callbacks.size;
  }

  private scheduleFrame(): void {
    if (this.rafId !== null || this.callbacks.size === 0) {
      return;
    }

    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;

      // Execute all callbacks
      const callbacksToExecute = new Map(this.callbacks);
      this.callbacks.clear();

      for (const [, callback] of callbacksToExecute) {
        try {
          callback();
        } catch (error) {
          console.error('AnimationFramePool callback error:', error);
        }
      }
    });
  }
}

// Singleton instance for global use
export const animationFramePool = new AnimationFramePool();

// =============================================================================
// RESIZE OBSERVER UTILITIES
// =============================================================================

/**
 * Creates a debounced ResizeObserver callback
 * Prevents layout thrashing from rapid resize events
 */
export function createDebouncedResizeObserver(
  callback: (entries: ResizeObserverEntry[]) => void,
  wait = 150
): ResizeObserver {
  const debouncedCallback = debounce(callback, wait, {
    leading: false,
    trailing: true,
    maxWait: wait * 2,
  });

  return new ResizeObserver((entries) => {
    debouncedCallback(entries);
  });
}

/**
 * Creates a throttled ResizeObserver callback using rAF
 */
export function createRafResizeObserver(
  callback: (entries: ResizeObserverEntry[]) => void
): ResizeObserver {
  const throttledCallback = rafThrottle(callback);

  return new ResizeObserver((entries) => {
    throttledCallback(entries);
  });
}
