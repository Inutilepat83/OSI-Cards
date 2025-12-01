/**
 * Memoization Utilities
 *
 * Provides high-performance memoization for expensive computations.
 * Supports various cache strategies including LRU, TTL, and WeakMap-based caching.
 *
 * @example
 * ```typescript
 * import { memo, memoWithTTL, createMemoizedGetter } from 'osi-cards-lib';
 *
 * // Simple memoization
 * const expensiveFn = memo((input: string) => {
 *   // expensive computation
 *   return result;
 * });
 *
 * // With TTL (Time-To-Live)
 * const cachedFetch = memoWithTTL(fetchData, 60000); // 1 minute
 * ```
 *
 * @module utils/memo
 */

/** Cache entry with timestamp for TTL-based caching */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

/** Options for memo function */
export interface MemoOptions {
  /** Maximum cache size (default: 100) */
  maxSize?: number;
  /** Key resolver function for custom cache keys */
  keyResolver?: (...args: unknown[]) => string;
  /** Enable cache statistics tracking */
  trackStats?: boolean;
}

/** Options for TTL-based memoization */
export interface MemoTTLOptions extends MemoOptions {
  /** Time-to-live in milliseconds */
  ttl: number;
  /** Whether to refresh TTL on access (sliding expiration) */
  slidingExpiration?: boolean;
}

/** Cache statistics */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

/**
 * Simple memoization with LRU cache
 *
 * Caches function results based on argument hash.
 * Uses LRU (Least Recently Used) eviction when maxSize is reached.
 *
 * @param fn - Function to memoize
 * @param options - Memoization options
 * @returns Memoized function
 *
 * @example
 * ```typescript
 * const normalizeSection = memo((section: CardSection) => {
 *   return processSection(section);
 * }, { maxSize: 50 });
 * ```
 */
export function memo<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  options: MemoOptions = {}
): ((...args: TArgs) => TResult) & { clear: () => void; getStats: () => CacheStats } {
  const { maxSize = 100, keyResolver, trackStats = false } = options;
  const cache = new Map<string, TResult>();
  const accessOrder: string[] = [];
  let hits = 0;
  let misses = 0;

  const defaultKeyResolver = (...args: unknown[]): string => {
    return JSON.stringify(args);
  };

  const getKey = keyResolver ?? defaultKeyResolver;

  const memoized = (...args: TArgs): TResult => {
    const key = getKey(...args);

    if (cache.has(key)) {
      if (trackStats) hits++;
      // Move to end of access order (most recently used)
      const index = accessOrder.indexOf(key);
      if (index > -1) {
        accessOrder.splice(index, 1);
        accessOrder.push(key);
      }
      return cache.get(key)!;
    }

    if (trackStats) misses++;
    const result = fn(...args);

    // Evict LRU entries if at capacity
    while (cache.size >= maxSize) {
      const lruKey = accessOrder.shift();
      if (lruKey) {
        cache.delete(lruKey);
      }
    }

    cache.set(key, result);
    accessOrder.push(key);

    return result;
  };

  memoized.clear = (): void => {
    cache.clear();
    accessOrder.length = 0;
    hits = 0;
    misses = 0;
  };

  memoized.getStats = (): CacheStats => ({
    hits,
    misses,
    size: cache.size,
    hitRate: hits + misses > 0 ? hits / (hits + misses) : 0
  });

  return memoized;
}

/**
 * Memoization with Time-To-Live (TTL)
 *
 * Cached values expire after the specified TTL.
 * Useful for caching API responses or frequently changing data.
 *
 * @param fn - Function to memoize
 * @param options - TTL options
 * @returns Memoized function with TTL
 *
 * @example
 * ```typescript
 * const fetchWithCache = memoWithTTL(
 *   (url: string) => fetch(url).then(r => r.json()),
 *   { ttl: 60000 } // 1 minute cache
 * );
 * ```
 */
export function memoWithTTL<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  options: MemoTTLOptions
): ((...args: TArgs) => TResult) & { clear: () => void; clearExpired: () => void } {
  const { ttl, maxSize = 100, keyResolver, slidingExpiration = false } = options;
  const cache = new Map<string, CacheEntry<TResult>>();

  const defaultKeyResolver = (...args: unknown[]): string => {
    return JSON.stringify(args);
  };

  const getKey = keyResolver ?? defaultKeyResolver;

  const isExpired = (entry: CacheEntry<TResult>): boolean => {
    return Date.now() - entry.timestamp > ttl;
  };

  const memoized = (...args: TArgs): TResult => {
    const key = getKey(...args);
    const cached = cache.get(key);

    if (cached && !isExpired(cached)) {
      if (slidingExpiration) {
        cached.timestamp = Date.now();
      }
      return cached.value;
    }

    const result = fn(...args);

    // Evict oldest entries if at capacity
    if (cache.size >= maxSize) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }

    cache.set(key, {
      value: result,
      timestamp: Date.now()
    });

    return result;
  };

  memoized.clear = (): void => {
    cache.clear();
  };

  memoized.clearExpired = (): void => {
    for (const [key, entry] of cache.entries()) {
      if (isExpired(entry)) {
        cache.delete(key);
      }
    }
  };

  return memoized;
}

/**
 * WeakMap-based memoization for object arguments
 *
 * Uses WeakMap for automatic garbage collection when objects are no longer referenced.
 * Best for memoizing computations on objects without memory leaks.
 *
 * @param fn - Function to memoize (first argument must be an object)
 * @returns Memoized function
 *
 * @example
 * ```typescript
 * const getFieldIcon = memoWeakMap((field: CardField) => {
 *   return resolveIcon(field.icon);
 * });
 * ```
 */
export function memoWeakMap<TObj extends object, TResult>(
  fn: (obj: TObj) => TResult
): ((obj: TObj) => TResult) & { delete: (obj: TObj) => boolean } {
  const cache = new WeakMap<TObj, TResult>();

  const memoized = (obj: TObj): TResult => {
    if (cache.has(obj)) {
      return cache.get(obj)!;
    }

    const result = fn(obj);
    cache.set(obj, result);
    return result;
  };

  memoized.delete = (obj: TObj): boolean => {
    return cache.delete(obj);
  };

  return memoized;
}

/**
 * Create a memoized getter for class properties
 *
 * Useful for lazy initialization of expensive computed properties.
 *
 * @param target - Class prototype
 * @param propertyKey - Property name
 * @param descriptor - Property descriptor
 * @returns Modified descriptor with memoization
 *
 * @example
 * ```typescript
 * class MyComponent {
 *   @MemoizedGetter
 *   get expensiveComputation() {
 *     return heavyCalculation();
 *   }
 * }
 * ```
 */
export function MemoizedGetter(
  _target: object,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalGetter = descriptor.get;

  if (!originalGetter) {
    throw new Error('MemoizedGetter can only be applied to getters');
  }

  const cacheKey = Symbol(`__memo_${propertyKey}`);

  descriptor.get = function (this: Record<symbol, unknown>) {
    if (!(cacheKey in this)) {
      this[cacheKey] = originalGetter.call(this);
    }
    return this[cacheKey];
  };

  return descriptor;
}

/**
 * Create a memoized function with custom equality check
 *
 * Allows using custom comparison for cache key matching.
 * Useful when JSON.stringify isn't suitable (e.g., for objects with circular refs).
 *
 * @param fn - Function to memoize
 * @param isEqual - Custom equality function
 * @returns Memoized function
 */
export function memoWithEquality<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  isEqual: (a: TArgs, b: TArgs) => boolean
): ((...args: TArgs) => TResult) & { clear: () => void } {
  let lastArgs: TArgs | null = null;
  let lastResult: TResult | undefined;

  const memoized = (...args: TArgs): TResult => {
    if (lastArgs !== null && isEqual(lastArgs, args)) {
      return lastResult!;
    }

    lastArgs = args;
    lastResult = fn(...args);
    return lastResult;
  };

  memoized.clear = (): void => {
    lastArgs = null;
    lastResult = undefined;
  };

  return memoized;
}

/**
 * Shallow equality check for arrays
 */
export function shallowArrayEquals<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Create a once-only function (memoized with single result)
 *
 * The function is only called once, subsequent calls return the cached result.
 *
 * @param fn - Function to call once
 * @returns Function that only executes once
 */
export function once<TResult>(fn: () => TResult): () => TResult {
  let called = false;
  let result: TResult;

  return (): TResult => {
    if (!called) {
      called = true;
      result = fn();
    }
    return result;
  };
}

/**
 * Debounced memoization - memoize with debounce for rapid calls
 *
 * Combines memoization with debouncing for cases where the function
 * might be called rapidly with the same arguments.
 *
 * @param fn - Function to memoize and debounce
 * @param delay - Debounce delay in milliseconds
 * @returns Debounced memoized function
 */
export function memoDebouncedAsync<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  delay: number
): (...args: TArgs) => Promise<TResult> {
  const cache = new Map<string, Promise<TResult>>();
  const timeouts = new Map<string, ReturnType<typeof setTimeout>>();

  return (...args: TArgs): Promise<TResult> => {
    const key = JSON.stringify(args);

    // Return cached promise if exists
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    // Clear any pending timeout for this key
    const existingTimeout = timeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Create a new promise that resolves after debounce
    const promise = new Promise<TResult>((resolve, reject) => {
      const timeout = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          cache.delete(key);
          reject(error);
        }
        timeouts.delete(key);
      }, delay);

      timeouts.set(key, timeout);
    });

    cache.set(key, promise);
    return promise;
  };
}


