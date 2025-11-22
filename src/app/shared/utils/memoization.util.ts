/**
 * Memoization utilities for expensive computations
 * Improves performance by caching function results
 */

export type MemoizedFunction<T extends (...args: any[]) => any> = T & {
  clear: () => void;
  cache: Map<string, ReturnType<T>>;
};

/**
 * Create a memoized version of a function
 * Uses a Map to cache results based on stringified arguments
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
 * Useful when arguments are objects that shouldn't be stringified
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
 * Results expire after the specified time
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


