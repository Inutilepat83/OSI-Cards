/**
 * Enhanced memoization utilities
 * 
 * Provides advanced memoization functions with:
 * - Cache size limits
 * - TTL (time-to-live) support
 * - Cache invalidation
 * - Memory-efficient implementations
 * 
 * @example
 * ```typescript
 * const memoizedFn = memoizeWithTTL(
 *   (key: string) => expensiveOperation(key),
 *   { ttl: 5000, maxSize: 100 }
 * );
 * ```
 */

/**
 * Memoization options
 */
export interface MemoizeOptions {
  /** Time-to-live in milliseconds */
  ttl?: number;
  /** Maximum cache size */
  maxSize?: number;
  /** Custom key generator */
  keyGenerator?: (...args: unknown[]) => string;
}

/**
 * Cache entry with expiration
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl?: number;
}

/**
 * Memoize a function with TTL and size limits
 * 
 * @param fn - Function to memoize
 * @param options - Memoization options
 * @returns Memoized function
 */
export function memoizeWithTTL<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options: MemoizeOptions = {}
): T {
  const cache = new Map<string, CacheEntry<ReturnType<T>>>();
  const { ttl, maxSize = 1000, keyGenerator = defaultKeyGenerator } = options;

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator(...args);

    // Check cache
    const entry = cache.get(key);
    if (entry) {
      // Check if entry is still valid
      if (!entry.ttl || Date.now() - entry.timestamp < entry.ttl) {
        return entry.value;
      }
      // Entry expired, remove it
      cache.delete(key);
    }

    // Compute value
    const value = fn(...args) as ReturnType<T>;

    // Check cache size and evict if necessary
    if (cache.size >= maxSize) {
      // Remove oldest entry
      const firstKey = cache.keys().next().value;
      if (firstKey) {
        cache.delete(firstKey);
      }
    }

    // Store in cache
    cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });

    return value;
  }) as T;
}

/**
 * Memoize a function with size limit only
 * 
 * @param fn - Function to memoize
 * @param maxSize - Maximum cache size (default: 1000)
 * @returns Memoized function
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  maxSize = 1000
): T {
  return memoizeWithTTL(fn, { maxSize });
}

/**
 * Create a memoized function that clears cache after TTL
 * 
 * @param fn - Function to memoize
 * @param ttl - Time-to-live in milliseconds
 * @returns Memoized function with cache clearing
 */
export function memoizeWithExpiration<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ttl: number
): T & { clearCache: () => void } {
  const cache = new Map<string, CacheEntry<ReturnType<T>>>();
  let cleanupTimer: ReturnType<typeof setInterval> | null = null;

  const memoized = ((...args: Parameters<T>): ReturnType<T> => {
    const key = defaultKeyGenerator(...args);

    // Check cache
    const entry = cache.get(key);
    if (entry) {
      if (Date.now() - entry.timestamp < ttl) {
        return entry.value;
      }
      cache.delete(key);
    }

    // Compute value
    const value = fn(...args) as ReturnType<T>;

    // Store in cache
    cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });

    // Setup cleanup timer if not already set
    if (!cleanupTimer) {
      cleanupTimer = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of cache.entries()) {
          if (entry.ttl && now - entry.timestamp >= entry.ttl) {
            cache.delete(key);
          }
        }
        if (cache.size === 0 && cleanupTimer) {
          clearInterval(cleanupTimer);
          cleanupTimer = null;
        }
      }, Math.min(ttl, 60000)); // Check at most every minute
    }

    return value;
  }) as T & { clearCache: () => void };

  memoized.clearCache = () => {
    cache.clear();
    if (cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
  };

  return memoized;
}

/**
 * Default key generator for memoization
 */
function defaultKeyGenerator(...args: unknown[]): string {
  return JSON.stringify(args);
}

/**
 * Weak map-based memoization for object keys
 * 
 * Uses WeakMap to avoid memory leaks when keys are objects
 * 
 * @param fn - Function to memoize
 * @returns Memoized function
 */
export function weakMemoize<T extends (arg: object) => unknown>(
  fn: T
): T {
  const cache = new WeakMap<object, ReturnType<T>>();

  return ((arg: object): ReturnType<T> => {
    if (cache.has(arg)) {
      return cache.get(arg)!;
    }

    const value = fn(arg) as ReturnType<T>;
    cache.set(arg, value);
    return value;
  }) as T;
}

