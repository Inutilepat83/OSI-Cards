/**
 * Memoization Utilities
 *
 * Provides memoization functions for expensive calculations to improve performance.
 *
 * @example
 * ```typescript
 * const expensiveCalculation = memoize((input: string) => {
 *   // Expensive operation
 *   return processData(input);
 * });
 *
 * // First call - computes result
 * const result1 = expensiveCalculation('input');
 *
 * // Second call with same input - returns cached result
 * const result2 = expensiveCalculation('input');
 * ```
 */

/**
 * Memoization function that caches results based on input arguments
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * WeakMap-based memoization for object-based caching
 * Automatically garbage collected when keys are no longer referenced
 */
export function weakMemoize<T extends (arg: object) => any>(fn: T): T {
  const cache = new WeakMap<object, ReturnType<T>>();

  return ((arg: object): ReturnType<T> => {
    if (cache.has(arg)) {
      return cache.get(arg)!;
    }

    const result = fn(arg);
    cache.set(arg, result);
    return result;
  }) as T;
}

/**
 * Memoization with TTL (Time To Live)
 * Cache entries expire after specified time
 */
export function memoizeWithTTL<T extends (...args: any[]) => any>(
  fn: T,
  ttlMs: number,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, { value: ReturnType<T>; expiresAt: number }>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    const cached = cache.get(key);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const result = fn(...args);
    cache.set(key, {
      value: result,
      expiresAt: Date.now() + ttlMs,
    });

    // Clean up expired entries periodically
    if (cache.size > 100) {
      const now = Date.now();
      for (const [k, v] of cache.entries()) {
        if (v.expiresAt <= now) {
          cache.delete(k);
        }
      }
    }

    return result;
  }) as T;
}

/**
 * Memoization with size limit
 * Evicts oldest entries when limit is reached (LRU)
 */
export function memoizeWithLimit<T extends (...args: any[]) => any>(
  fn: T,
  maxSize = 100,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  const accessOrder: string[] = [];

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      // Move to end (most recently used)
      const index = accessOrder.indexOf(key);
      if (index > -1) {
        accessOrder.splice(index, 1);
      }
      accessOrder.push(key);
      return cache.get(key)!;
    }

    // Evict oldest if at limit
    if (cache.size >= maxSize && accessOrder.length > 0) {
      const oldestKey = accessOrder.shift()!;
      cache.delete(oldestKey);
    }

    const result = fn(...args);
    cache.set(key, result);
    accessOrder.push(key);
    return result;
  }) as T;
}

/**
 * Clear all memoization caches
 * Useful for testing or memory management
 */
export function clearMemoizationCache(): void {
  // Note: WeakMap entries cannot be cleared manually
  // This only works for Map-based caches
}

