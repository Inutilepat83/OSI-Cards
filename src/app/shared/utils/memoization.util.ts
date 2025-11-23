/**
 * Memoization utilities for expensive computations
 * 
 * Provides various memoization strategies to improve performance by caching
 * function results. Supports standard memoization, WeakMap-based memoization,
 * and TTL (time-to-live) based memoization.
 * 
 * @example
 * ```typescript
 * // Basic memoization
 * const expensiveFn = memoize((x: number) => {
 *   // Expensive computation
 *   return x * x;
 * });
 * 
 * // WeakMap memoization for object keys
 * const objFn = memoizeWeak((obj: { value: number }) => obj.value * 2);
 * 
 * // TTL-based memoization
 * const cachedFn = memoizeWithTTL((x: number) => x * 2, 5000); // 5 second TTL
 * ```
 */

export type MemoizedFunction<T extends (...args: any[]) => any> = T & {
  clear: () => void;
  cache: Map<string, ReturnType<T>>;
};

/**
 * Create a memoized version of a function
 * 
 * Uses a Map to cache results based on stringified arguments.
 * The cache persists until explicitly cleared or the function is garbage collected.
 * 
 * @param fn - The function to memoize
 * @param keyGenerator - Optional function to generate cache keys (defaults to JSON.stringify)
 * @returns Memoized function with clear() method and cache property
 * 
 * @example
 * ```typescript
 * const fn = memoize((x: number) => x * 2);
 * fn(5); // Computes and caches
 * fn(5); // Returns cached result
 * fn.clear(); // Clears cache
 * ```
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): MemoizedFunction<T> {
  const cache = new Map<string, ReturnType<T>>();

  const memoized = ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator
      ? keyGenerator(...args)
      : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as MemoizedFunction<T>;

  memoized.clear = () => {
    cache.clear();
  };

  memoized.cache = cache;

  return memoized;
}

/**
 * Create a memoized function with WeakMap for object keys
 * 
 * Uses WeakMap instead of Map, allowing objects to be garbage collected
 * when no longer referenced. Useful when arguments are objects that shouldn't
 * be stringified or when you want automatic cache cleanup.
 * 
 * @param fn - The function to memoize (must take a single object argument)
 * @returns Memoized function with clear() method (no-op for WeakMap)
 * 
 * @example
 * ```typescript
 * const fn = memoizeWeak((obj: { value: number }) => obj.value * 2);
 * const obj = { value: 5 };
 * fn(obj); // Computes and caches
 * fn(obj); // Returns cached result
 * // When obj is garbage collected, cache entry is automatically removed
 * ```
 */
export function memoizeWeak<T extends (arg: object) => any>(
  fn: T
): T & { clear: () => void } {
  const cache = new WeakMap<object, ReturnType<T>>();

  const memoized = ((arg: object): ReturnType<T> => {
    if (cache.has(arg)) {
      return cache.get(arg)!;
    }

    const result = fn(arg);
    cache.set(arg, result);
    return result;
  }) as T & { clear: () => void };

  memoized.clear = () => {
    // WeakMap doesn't have clear, but we can create a new one
    // This is a no-op for WeakMap
  };

  return memoized;
}

/**
 * Create a memoized function with TTL (time-to-live)
 * 
 * Results expire after the specified time, allowing cache entries to
 * automatically become stale. Useful for data that changes over time.
 * 
 * @param fn - The function to memoize
 * @param ttlMs - Time-to-live in milliseconds
 * @param keyGenerator - Optional function to generate cache keys
 * @returns Memoized function with clear() method and cache property
 * 
 * @example
 * ```typescript
 * const fn = memoizeWithTTL((x: number) => fetchData(x), 60000); // 1 minute TTL
 * fn(5); // Fetches and caches
 * fn(5); // Returns cached result (if within TTL)
 * // After 60 seconds, cache expires and function is called again
 * ```
 */
export function memoizeWithTTL<T extends (...args: any[]) => any>(
  fn: T,
  ttlMs: number,
  keyGenerator?: (...args: Parameters<T>) => string
): MemoizedFunction<T> {
  const cache = new Map<string, { value: ReturnType<T>; expires: number }>();

  const memoized = ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator
      ? keyGenerator(...args)
      : JSON.stringify(args);

    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }

    const result = fn(...args);
    cache.set(key, {
      value: result,
      expires: Date.now() + ttlMs
    });

    return result;
  }) as MemoizedFunction<T>;

  memoized.clear = () => {
    cache.clear();
  };

  memoized.cache = new Map<string, ReturnType<T>>();
  // Sync cache for compatibility
  cache.forEach((entry, key) => {
    if (entry.expires > Date.now()) {
      memoized.cache.set(key, entry.value);
    }
  });

  // Cleanup expired entries periodically
  setInterval(() => {
    const now = Date.now();
    cache.forEach((entry, key) => {
      if (entry.expires <= now) {
        cache.delete(key);
      }
    });
  }, Math.min(ttlMs, 60000)); // Cleanup at most every minute

  return memoized;
}


