/**
 * OSI Cards Performance Utilities
 * 
 * Collection of performance optimization utilities including debouncing,
 * throttling, memoization, and lazy evaluation helpers.
 * 
 * @example
 * ```typescript
 * import { debounce, throttle, memoize, raf } from 'osi-cards-lib';
 * 
 * const debouncedHandler = debounce(() => recalculate(), 150);
 * const throttledScroll = throttle(() => updatePosition(), 16);
 * const memoizedCalculation = memoize(expensiveCalculation);
 * ```
 * 
 * @module utils/performance
 */

// ============================================================================
// DEBOUNCE
// ============================================================================

/**
 * Creates a debounced function that delays invoking func until after wait
 * milliseconds have elapsed since the last time the debounced function was invoked.
 * 
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @param options - Configuration options
 * @returns A debounced function with cancel and flush methods
 * 
 * @example
 * ```typescript
 * const handleResize = debounce(() => {
 *   recalculateLayout();
 * }, 150);
 * 
 * window.addEventListener('resize', handleResize);
 * 
 * // Cancel pending execution
 * handleResize.cancel();
 * 
 * // Execute immediately
 * handleResize.flush();
 * ```
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  } = {}
): T & { cancel: () => void; flush: () => void; pending: () => boolean } {
  const { leading = false, trailing = true, maxWait } = options;
  
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let maxTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: unknown = null;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;
  let result: ReturnType<T>;

  function invokeFunc(time: number): ReturnType<T> {
    const args = lastArgs!;
    const thisArg = lastThis;
    lastArgs = null;
    lastThis = null;
    lastInvokeTime = time;
    result = func.apply(thisArg, args) as ReturnType<T>;
    return result;
  }

  function shouldInvoke(time: number): boolean {
    const timeSinceLastCall = lastCallTime === undefined ? 0 : time - lastCallTime;
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
    } else {
      const remaining = remainingWait(time);
      timeoutId = setTimeout(timerExpired, remaining);
    }
  }

  function remainingWait(time: number): number {
    const timeSinceLastCall = lastCallTime === undefined ? 0 : time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;
    
    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function leadingEdge(time: number): ReturnType<T> {
    lastInvokeTime = time;
    timeoutId = setTimeout(timerExpired, wait);
    return leading ? invokeFunc(time) : result;
  }

  function trailingEdge(time: number): ReturnType<T> {
    timeoutId = null;
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = null;
    lastThis = null;
    return result;
  }

  function cancel(): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    if (maxTimeoutId !== null) {
      clearTimeout(maxTimeoutId);
    }
    lastInvokeTime = 0;
    lastArgs = null;
    lastCallTime = undefined;
    lastThis = null;
    timeoutId = null;
    maxTimeoutId = null;
  }

  function flush(): ReturnType<T> {
    if (timeoutId === null) {
      return result;
    }
    return trailingEdge(Date.now());
  }

  function pending(): boolean {
    return timeoutId !== null;
  }

  function debounced(this: unknown, ...args: Parameters<T>): ReturnType<T> {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);
    
    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === null) {
        return leadingEdge(lastCallTime);
      }
      if (maxWait !== undefined) {
        timeoutId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    
    if (timeoutId === null) {
      timeoutId = setTimeout(timerExpired, wait);
    }
    
    return result;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;
  
  return debounced as unknown as T & { cancel: () => void; flush: () => void; pending: () => boolean };
}

// ============================================================================
// THROTTLE
// ============================================================================

/**
 * Creates a throttled function that only invokes func at most once per every
 * wait milliseconds. Useful for rate-limiting event handlers.
 * 
 * @param func - The function to throttle
 * @param wait - The number of milliseconds to wait between invocations
 * @param options - Configuration options
 * @returns A throttled function with cancel and flush methods
 * 
 * @example
 * ```typescript
 * const handleScroll = throttle(() => {
 *   updateScrollPosition();
 * }, 16); // ~60fps
 * 
 * container.addEventListener('scroll', handleScroll, { passive: true });
 * ```
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
  } = {}
): T & { cancel: () => void; flush: () => void } {
  const { leading = true, trailing = true } = options;
  
  return debounce(func, wait, {
    leading,
    trailing,
    maxWait: wait,
  });
}

// ============================================================================
// RAF (RequestAnimationFrame) UTILITIES
// ============================================================================

/**
 * Wraps a function to be called on the next animation frame
 * Ensures only one call is scheduled at a time
 * 
 * @param func - The function to wrap
 * @returns A wrapped function that schedules calls via requestAnimationFrame
 * 
 * @example
 * ```typescript
 * const updateLayout = raf(() => {
 *   element.style.transform = `translateY(${position}px)`;
 * });
 * 
 * // Safe to call multiple times - only one frame scheduled
 * updateLayout();
 * updateLayout();
 * updateLayout();
 * ```
 */
export function raf<T extends (...args: unknown[]) => unknown>(
  func: T
): T & { cancel: () => void; pending: () => boolean } {
  let frameId: number | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: unknown = null;

  function wrapped(this: unknown, ...args: Parameters<T>): void {
    lastArgs = args;
    lastThis = this;

    if (frameId === null) {
      frameId = requestAnimationFrame(() => {
        frameId = null;
        if (lastArgs !== null) {
          func.apply(lastThis, lastArgs);
          lastArgs = null;
          lastThis = null;
        }
      });
    }
  }

  wrapped.cancel = (): void => {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
      lastArgs = null;
      lastThis = null;
    }
  };

  wrapped.pending = (): boolean => frameId !== null;

  return wrapped as T & { cancel: () => void; pending: () => boolean };
}

/**
 * Batches multiple DOM reads/writes to occur in the same frame
 * 
 * @example
 * ```typescript
 * const batch = createFrameBatcher();
 * 
 * // Queue reads
 * batch.read(() => {
 *   const height = element.offsetHeight;
 *   batch.write(() => {
 *     element.style.height = `${height * 2}px`;
 *   });
 * });
 * ```
 */
export function createFrameBatcher(): {
  read: (fn: () => void) => void;
  write: (fn: () => void) => void;
  flush: () => void;
} {
  const reads: Array<() => void> = [];
  const writes: Array<() => void> = [];
  let scheduled = false;

  function run(): void {
    scheduled = false;
    
    // Execute reads first
    const readBatch = [...reads];
    reads.length = 0;
    for (const fn of readBatch) {
      fn();
    }

    // Then execute writes
    const writeBatch = [...writes];
    writes.length = 0;
    for (const fn of writeBatch) {
      fn();
    }
  }

  function schedule(): void {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(run);
    }
  }

  return {
    read(fn: () => void): void {
      reads.push(fn);
      schedule();
    },
    write(fn: () => void): void {
      writes.push(fn);
      schedule();
    },
    flush(): void {
      if (scheduled) {
        run();
      }
    },
  };
}

// ============================================================================
// MEMOIZATION
// ============================================================================

/**
 * Creates a memoized function that caches results based on arguments
 * 
 * @param func - The function to memoize
 * @param options - Memoization options
 * @returns A memoized function with cache control methods
 * 
 * @example
 * ```typescript
 * const expensiveCalc = memoize((a: number, b: number) => {
 *   // Complex calculation
 *   return a * b;
 * });
 * 
 * expensiveCalc(2, 3); // Calculates
 * expensiveCalc(2, 3); // Returns cached result
 * 
 * expensiveCalc.clear(); // Clear cache
 * ```
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  func: T,
  options: {
    maxSize?: number;
    keyFn?: (...args: Parameters<T>) => string;
    ttl?: number;
  } = {}
): T & { clear: () => void; size: () => number; has: (...args: Parameters<T>) => boolean } {
  const { maxSize = 100, keyFn, ttl } = options;
  
  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>();

  function getKey(args: Parameters<T>): string {
    if (keyFn) {
      return keyFn(...args);
    }
    return JSON.stringify(args);
  }

  function isExpired(entry: { timestamp: number }): boolean {
    if (ttl === undefined) return false;
    return Date.now() - entry.timestamp > ttl;
  }

  function memoized(this: unknown, ...args: Parameters<T>): ReturnType<T> {
    const key = getKey(args);
    const cached = cache.get(key);

    if (cached !== undefined && !isExpired(cached)) {
      return cached.value;
    }

    const result = func.apply(this, args) as ReturnType<T>;
    
    cache.set(key, { value: result, timestamp: Date.now() });

    // Evict oldest entries if cache is full
    if (cache.size > maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }

    return result;
  }

  memoized.clear = (): void => {
    cache.clear();
  };

  memoized.size = (): number => cache.size;

  memoized.has = (...args: Parameters<T>): boolean => {
    const key = getKey(args);
    const cached = cache.get(key);
    return cached !== undefined && !isExpired(cached);
  };

  return memoized as T & { clear: () => void; size: () => number; has: (...args: Parameters<T>) => boolean };
}

// ============================================================================
// LAZY EVALUATION
// ============================================================================

/**
 * Creates a lazy value that is computed only on first access
 * 
 * @param factory - Factory function that creates the value
 * @returns An object with a get() method to access the value
 * 
 * @example
 * ```typescript
 * const expensiveValue = lazy(() => {
 *   return computeExpensiveValue();
 * });
 * 
 * // Value is computed here
 * const value1 = expensiveValue.get();
 * 
 * // Returns cached value
 * const value2 = expensiveValue.get();
 * ```
 */
export function lazy<T>(factory: () => T): {
  get: () => T;
  reset: () => void;
  isComputed: () => boolean;
} {
  let value: T | undefined;
  let computed = false;

  return {
    get(): T {
      if (!computed) {
        value = factory();
        computed = true;
      }
      return value!;
    },
    reset(): void {
      value = undefined;
      computed = false;
    },
    isComputed(): boolean {
      return computed;
    },
  };
}

// ============================================================================
// IDLE CALLBACK
// ============================================================================

/**
 * Schedules a callback to run during browser idle time
 * Falls back to setTimeout if requestIdleCallback is not available
 * 
 * @param callback - Function to run during idle time
 * @param options - Idle callback options
 * @returns Cancel function
 */
export function whenIdle(
  callback: () => void,
  options: { timeout?: number } = {}
): () => void {
  const { timeout = 1000 } = options;

  if (typeof requestIdleCallback !== 'undefined') {
    const id = requestIdleCallback(callback, { timeout });
    return () => cancelIdleCallback(id);
  }

  const id = setTimeout(callback, 1);
  return () => clearTimeout(id);
}

/**
 * Creates a queue that processes items during idle time
 * 
 * @example
 * ```typescript
 * const queue = createIdleQueue<() => void>();
 * 
 * queue.add(() => console.log('Task 1'));
 * queue.add(() => console.log('Task 2'));
 * 
 * queue.start(); // Processes during idle time
 * ```
 */
export function createIdleQueue<T>(): {
  add: (item: T) => void;
  start: (processor: (item: T) => void) => void;
  stop: () => void;
  clear: () => void;
  size: () => number;
} {
  const queue: T[] = [];
  let running = false;
  let cancelFn: (() => void) | null = null;
  let processor: ((item: T) => void) | null = null;

  function processNext(): void {
    if (!running || queue.length === 0) {
      return;
    }

    cancelFn = whenIdle(() => {
      const item = queue.shift();
      if (item !== undefined && processor) {
        processor(item);
      }
      processNext();
    });
  }

  return {
    add(item: T): void {
      queue.push(item);
      if (running) {
        processNext();
      }
    },
    start(proc: (item: T) => void): void {
      processor = proc;
      running = true;
      processNext();
    },
    stop(): void {
      running = false;
      if (cancelFn) {
        cancelFn();
        cancelFn = null;
      }
    },
    clear(): void {
      queue.length = 0;
    },
    size(): number {
      return queue.length;
    },
  };
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Measures execution time of a function
 * 
 * @example
 * ```typescript
 * const { result, duration } = measureTime(() => {
 *   return expensiveOperation();
 * });
 * 
 * console.log(`Took ${duration}ms`);
 * ```
 */
export function measureTime<T>(fn: () => T): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  return { result, duration };
}

/**
 * Creates a performance marker for profiling
 */
export function createMarker(name: string): {
  start: () => void;
  end: () => void;
  measure: () => number;
} {
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;

  return {
    start(): void {
      performance.mark(startMark);
    },
    end(): void {
      performance.mark(endMark);
    },
    measure(): number {
      try {
        const measure = performance.measure(name, startMark, endMark);
        return measure.duration;
      } catch {
        return 0;
      }
    },
  };
}

// ============================================================================
// OBJECT POOLING
// ============================================================================

/**
 * Creates an object pool for reusing objects
 * Reduces garbage collection pressure for frequently created/destroyed objects
 * 
 * @example
 * ```typescript
 * const pool = createObjectPool({
 *   create: () => ({ x: 0, y: 0 }),
 *   reset: (obj) => { obj.x = 0; obj.y = 0; },
 *   maxSize: 100
 * });
 * 
 * const obj = pool.acquire();
 * obj.x = 10;
 * 
 * pool.release(obj); // Returns to pool
 * ```
 */
export function createObjectPool<T>(config: {
  create: () => T;
  reset?: (obj: T) => void;
  maxSize?: number;
}): {
  acquire: () => T;
  release: (obj: T) => void;
  clear: () => void;
  size: () => number;
} {
  const { create, reset, maxSize = 50 } = config;
  const pool: T[] = [];

  return {
    acquire(): T {
      if (pool.length > 0) {
        return pool.pop()!;
      }
      return create();
    },
    release(obj: T): void {
      if (pool.length < maxSize) {
        if (reset) {
          reset(obj);
        }
        pool.push(obj);
      }
    },
    clear(): void {
      pool.length = 0;
    },
    size(): number {
      return pool.length;
    },
  };
}

