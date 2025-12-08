/**
 * Debounce and Throttle Decorators
 *
 * Performance optimization decorators for limiting function call frequency.
 * Useful for expensive operations triggered by rapid events (scroll, resize, input).
 *
 * Features:
 * - Method and property decorators
 * - Configurable delays
 * - Leading/trailing edge control
 * - Cancellation support
 * - TypeScript type safety
 *
 * @example
 * ```typescript
 * import { Debounce, Throttle } from '@osi-cards/decorators';
 *
 * class SearchComponent {
 *   @Debounce(300)
 *   onSearchInput(query: string) {
 *     this.search(query);
 *   }
 *
 *   @Throttle(100)
 *   onScroll(event: Event) {
 *     this.updatePosition();
 *   }
 * }
 * ```
 */

/**
 * Debounce options
 */
export interface DebounceOptions {
  /**
   * Whether to invoke on the leading edge
   * Default: false
   */
  leading?: boolean;

  /**
   * Whether to invoke on the trailing edge
   * Default: true
   */
  trailing?: boolean;

  /**
   * Maximum time function can be delayed before forced invocation
   * Default: no max wait
   */
  maxWait?: number;
}

/**
 * Throttle options
 */
export interface ThrottleOptions {
  /**
   * Whether to invoke on the leading edge
   * Default: true
   */
  leading?: boolean;

  /**
   * Whether to invoke on the trailing edge
   * Default: true
   */
  trailing?: boolean;
}

/**
 * Debounce decorator
 *
 * Delays method invocation until after the specified delay has elapsed
 * since the last time it was invoked.
 *
 * @param delay - Milliseconds to delay
 * @param options - Debounce options
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * class SearchBox {
 *   @Debounce(300)
 *   onInput(value: string) {
 *     console.log('Searching for:', value);
 *   }
 * }
 * ```
 */
export function Debounce(delay: number, options: DebounceOptions = {}): MethodDecorator {
  const { leading = false, trailing = true, maxWait } = options;

  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let maxWaitTimeout: ReturnType<typeof setTimeout> | null = null;
    let lastCallTime: number | null = null;
    let lastInvokeTime = 0;
    let lastArgs: any[] | null = null;
    let lastThis: any = null;

    function invokeFunc() {
      const args = lastArgs!;
      const thisArg = lastThis;

      lastArgs = null;
      lastThis = null;
      lastInvokeTime = Date.now();

      return originalMethod.apply(thisArg, args);
    }

    function shouldInvoke(time: number): boolean {
      const timeSinceLastCall = time - (lastCallTime || 0);
      const timeSinceLastInvoke = time - lastInvokeTime;

      return (
        lastCallTime === null ||
        timeSinceLastCall >= delay ||
        (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
      );
    }

    function leadingEdge() {
      lastInvokeTime = Date.now();

      if (trailing) {
        timeout = setTimeout(timerExpired, delay);
      }

      return leading ? invokeFunc() : undefined;
    }

    function remainingWait(time: number): number {
      const timeSinceLastCall = time - (lastCallTime || 0);
      const timeSinceLastInvoke = time - lastInvokeTime;
      const timeWaiting = delay - timeSinceLastCall;

      return maxWait !== undefined
        ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
        : timeWaiting;
    }

    function timerExpired() {
      const time = Date.now();

      if (shouldInvoke(time)) {
        return trailingEdge();
      }

      timeout = setTimeout(timerExpired, remainingWait(time));
    }

    function trailingEdge() {
      timeout = null;

      if (trailing && lastArgs) {
        return invokeFunc();
      }

      lastArgs = null;
      lastThis = null;
    }

    function cancel() {
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }

      if (maxWaitTimeout !== null) {
        clearTimeout(maxWaitTimeout);
        maxWaitTimeout = null;
      }

      lastInvokeTime = 0;
      lastArgs = null;
      lastCallTime = null;
      lastThis = null;
    }

    descriptor.value = function debounced(...args: any[]) {
      const time = Date.now();
      const isInvoking = shouldInvoke(time);

      lastArgs = args;
      lastThis = this;
      lastCallTime = time;

      if (isInvoking) {
        if (timeout === null) {
          return leadingEdge();
        }

        if (maxWait !== undefined) {
          timeout = setTimeout(timerExpired, delay);
          return invokeFunc();
        }
      }

      if (timeout === null) {
        timeout = setTimeout(timerExpired, delay);
      }
    };

    // Attach cancel method
    (descriptor.value as any).cancel = cancel;

    return descriptor;
  };
}

/**
 * Throttle decorator
 *
 * Limits method invocation to once per specified interval.
 *
 * @param delay - Milliseconds between allowed invocations
 * @param options - Throttle options
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * class ScrollHandler {
 *   @Throttle(100)
 *   onScroll(event: Event) {
 *     console.log('Scroll position:', window.scrollY);
 *   }
 * }
 * ```
 */
export function Throttle(delay: number, options: ThrottleOptions = {}): MethodDecorator {
  const { leading = true, trailing = true } = options;

  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let previous = 0;
    let lastArgs: any[] | null = null;
    let lastThis: any = null;

    function invokeFunc() {
      const args = lastArgs!;
      const thisArg = lastThis;

      lastArgs = null;
      lastThis = null;

      return originalMethod.apply(thisArg, args);
    }

    function leadingEdge() {
      previous = Date.now();
      return invokeFunc();
    }

    function remainingTime(time: number): number {
      const timeSincePrev = time - previous;
      return delay - timeSincePrev;
    }

    function trailingEdge() {
      timeout = null;

      if (trailing && lastArgs) {
        previous = Date.now();
        return invokeFunc();
      }

      lastArgs = null;
      lastThis = null;
    }

    function cancel() {
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }

      previous = 0;
      lastArgs = null;
      lastThis = null;
    }

    descriptor.value = function throttled(...args: any[]) {
      const time = Date.now();

      lastArgs = args;
      lastThis = this;

      if (previous === 0 && !leading) {
        previous = time;
      }

      const remaining = remainingTime(time);

      if (remaining <= 0) {
        if (timeout !== null) {
          clearTimeout(timeout);
          timeout = null;
        }

        return leadingEdge();
      }

      if (timeout === null && trailing) {
        timeout = setTimeout(trailingEdge, remaining);
      }
    };

    // Attach cancel method
    (descriptor.value as any).cancel = cancel;

    return descriptor;
  };
}

/**
 * Debounce function (non-decorator)
 *
 * @param func - Function to debounce
 * @param delay - Milliseconds to delay
 * @param options - Debounce options
 * @returns Debounced function
 *
 * @example
 * ```typescript
 * const debouncedSave = debounce(
 *   (data) => saveToServer(data),
 *   500
 * );
 *
 * // Call repeatedly, only saves after 500ms of inactivity
 * debouncedSave(data);
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options: DebounceOptions = {}
): T & { cancel: () => void } {
  const { leading = false, trailing = true, maxWait } = options;

  let timeout: ReturnType<typeof setTimeout> | null = null;
  let maxWaitTimeout: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime: number | null = null;
  let lastInvokeTime = 0;
  let lastArgs: any[] | null = null;
  let lastThis: any = null;

  function invokeFunc() {
    const args = lastArgs!;
    const thisArg = lastThis;

    lastArgs = null;
    lastThis = null;
    lastInvokeTime = Date.now();

    return func.apply(thisArg, args);
  }

  function shouldInvoke(time: number): boolean {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === null ||
      timeSinceLastCall >= delay ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }

  function leadingEdge() {
    lastInvokeTime = Date.now();

    if (trailing) {
      timeout = setTimeout(timerExpired, delay);
    }

    return leading ? invokeFunc() : undefined;
  }

  function remainingWait(time: number): number {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = delay - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function timerExpired() {
    const time = Date.now();

    if (shouldInvoke(time)) {
      return trailingEdge();
    }

    timeout = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge() {
    timeout = null;

    if (trailing && lastArgs) {
      return invokeFunc();
    }

    lastArgs = null;
    lastThis = null;
  }

  function cancel() {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }

    if (maxWaitTimeout !== null) {
      clearTimeout(maxWaitTimeout);
      maxWaitTimeout = null;
    }

    lastInvokeTime = 0;
    lastArgs = null;
    lastCallTime = null;
    lastThis = null;
  }

  function debounced(...args: any[]) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeout === null) {
        return leadingEdge();
      }

      if (maxWait !== undefined) {
        timeout = setTimeout(timerExpired, delay);
        return invokeFunc();
      }
    }

    if (timeout === null) {
      timeout = setTimeout(timerExpired, delay);
    }
  }

  debounced.cancel = cancel;

  return debounced as T & { cancel: () => void };
}

/**
 * Throttle function (non-decorator)
 *
 * @param func - Function to throttle
 * @param delay - Milliseconds between invocations
 * @param options - Throttle options
 * @returns Throttled function
 *
 * @example
 * ```typescript
 * const throttledUpdate = throttle(
 *   (position) => updateUI(position),
 *   100
 * );
 *
 * window.addEventListener('scroll', () => {
 *   throttledUpdate(window.scrollY);
 * });
 * ```
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options: ThrottleOptions = {}
): T & { cancel: () => void } {
  const { leading = true, trailing = true } = options;

  let timeout: ReturnType<typeof setTimeout> | null = null;
  let previous = 0;
  let lastArgs: any[] | null = null;
  let lastThis: any = null;

  function invokeFunc() {
    const args = lastArgs!;
    const thisArg = lastThis;

    lastArgs = null;
    lastThis = null;

    return func.apply(thisArg, args);
  }

  function leadingEdge() {
    previous = Date.now();
    return invokeFunc();
  }

  function remainingTime(time: number): number {
    const timeSincePrev = time - previous;
    return delay - timeSincePrev;
  }

  function trailingEdge() {
    timeout = null;

    if (trailing && lastArgs) {
      previous = Date.now();
      return invokeFunc();
    }

    lastArgs = null;
    lastThis = null;
  }

  function cancel() {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }

    previous = 0;
    lastArgs = null;
    lastThis = null;
  }

  function throttled(...args: any[]) {
    const time = Date.now();

    lastArgs = args;
    lastThis = this;

    if (previous === 0 && !leading) {
      previous = time;
    }

    const remaining = remainingTime(time);

    if (remaining <= 0) {
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }

      return leadingEdge();
    }

    if (timeout === null && trailing) {
      timeout = setTimeout(trailingEdge, remaining);
    }
  }

  throttled.cancel = cancel;

  return throttled as T & { cancel: () => void };
}

/**
 * Debounce leading edge only
 *
 * Invokes function immediately on first call, then prevents
 * subsequent calls until delay has elapsed.
 *
 * @param delay - Milliseconds to wait
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * class ButtonComponent {
 *   @DebounceLeading(1000)
 *   onClick() {
 *     // Executes immediately on first click
 *     // Ignores subsequent clicks for 1 second
 *   }
 * }
 * ```
 */
export function DebounceLeading(delay: number): MethodDecorator {
  return Debounce(delay, { leading: true, trailing: false });
}

/**
 * Throttle with max wait
 *
 * Ensures function is invoked at least once per maxWait period.
 *
 * @param delay - Milliseconds between invocations
 * @param maxWait - Maximum wait time
 * @returns Method decorator
 */
export function ThrottleMax(delay: number, maxWait: number): MethodDecorator {
  return Debounce(delay, { maxWait });
}
