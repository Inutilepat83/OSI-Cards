/**
 * Debounce & Throttle Utilities
 *
 * Function-based debounce and throttle utilities.
 *
 * @example
 * ```typescript
 * import { debounce, throttle } from '@osi-cards/utils';
 *
 * const debouncedFn = debounce(() => search(query), 300);
 * const throttledFn = throttle(() => updateUI(), 100);
 * ```
 */

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastRun = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastRun >= delay) {
      fn(...args);
      lastRun = now;
    }
  };
}

/**
 * Debounce with leading edge
 */
export function debounceLeading<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastRun = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastRun >= delay) {
      fn(...args);
      lastRun = now;
    }

    if (timeoutId) clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      if (now - lastRun >= delay) {
        fn(...args);
        lastRun = Date.now();
      }
    }, delay);
  };
}

/**
 * Debounce promise
 */
export function debouncePromise<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingPromise: Promise<ReturnType<T>> | null = null;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (!pendingPromise) {
      pendingPromise = new Promise<ReturnType<T>>((resolve) => {
        timeoutId = setTimeout(async () => {
          const result = await fn(...args);
          resolve(result);
          pendingPromise = null;
        }, delay);
      });
    }

    return pendingPromise;
  };
}

/**
 * Throttle with trailing edge
 */
export function throttleTrailing<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastRun = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastRun >= delay) {
      fn(...args);
      lastRun = now;
    } else {
      if (timeoutId) clearTimeout(timeoutId);

      timeoutId = setTimeout(
        () => {
          fn(...args);
          lastRun = Date.now();
        },
        delay - (now - lastRun)
      );
    }
  };
}

/**
 * Rate limit
 */
export function rateLimit<T extends (...args: any[]) => any>(
  fn: T,
  maxCalls: number,
  timeWindow: number
): (...args: Parameters<T>) => void {
  const calls: number[] = [];

  return (...args: Parameters<T>) => {
    const now = Date.now();

    // Remove old calls
    while (calls.length > 0 && calls[0]! < now - timeWindow) {
      calls.shift();
    }

    if (calls.length < maxCalls) {
      calls.push(now);
      fn(...args);
    }
  };
}

/**
 * Once function (executes only once)
 */
export function once<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let called = false;
  let result: ReturnType<T>;

  return (...args: Parameters<T>): ReturnType<T> | undefined => {
    if (!called) {
      called = true;
      result = fn(...args);
      return result;
    }
    return result;
  };
}
