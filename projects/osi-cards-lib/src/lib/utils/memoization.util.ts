/**
 * Consolidated Memoization Utilities
 *
 * Provides comprehensive memoization with decorators, utilities, TTL, LRU, and WeakMap support.
 * This is the primary memoization module - use this instead of memo.util, lru-cache.util, etc.
 *
 * @example
 * ```typescript
 * import { memoize, Memoize, MemoizeAsync } from 'osi-cards-lib';
 *
 * // Function memoization
 * const cached = memoize((x: number) => x * 2, { ttl: 60000 });
 *
 * // Method decorators
 * class MyService {
 *   @Memoize({ ttl: 30000 })
 *   expensiveCalculation(input: string): number {
 *     return complexCalc(input);
 *   }
 * }
 * ```
 */

// Re-export core memoization utilities (avoiding duplicates)
export {
  memo,
  memoWithTTL,
  memoWeakMap,
  memoWithEquality,
  once,
  type MemoizedGetter,
} from './memo.util';

// Re-export LRU cache
export { LRUCache, type LRUCacheOptions } from './lru-cache.util';

// =============================================================================
// ADDITIONAL TYPES AND INTERFACES
// =============================================================================

export interface MemoizeDecoratorOptions {
  /** Time-to-live in milliseconds (default: Infinity) */
  ttl?: number;
  /** Maximum cache size (default: 100) */
  maxSize?: number;
  /** Custom cache key generator */
  keyGenerator?: (...args: unknown[]) => string;
  /** Whether to use WeakMap for object arguments (default: false) */
  useWeakMap?: boolean;
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
}

// =============================================================================
// CACHE IMPLEMENTATION FOR DECORATORS
// =============================================================================

/**
 * LRU Cache with TTL support (for decorators)
 */
export class MemoizeCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder: string[] = [];

  constructor(
    private readonly maxSize = 100,
    private readonly ttl = Infinity
  ) {}

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    // Check TTL
    if (this.ttl !== Infinity && Date.now() - entry.timestamp > this.ttl) {
      this.delete(key);
      return undefined;
    }

    // Update access order for LRU
    this.updateAccessOrder(key);
    entry.hits++;
    return entry.value;
  }

  set(key: string, value: T): void {
    // Evict if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 0,
    });
    this.updateAccessOrder(key);
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    // Check TTL
    if (this.ttl !== Infinity && Date.now() - entry.timestamp > this.ttl) {
      this.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  get size(): number {
    return this.cache.size;
  }

  getStats(): { size: number; hits: number; keys: string[] } {
    let totalHits = 0;
    this.cache.forEach((entry) => {
      totalHits += entry.hits;
    });
    return {
      size: this.cache.size,
      hits: totalHits,
      keys: Array.from(this.cache.keys()),
    };
  }

  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  private evictLRU(): void {
    const lruKey = this.accessOrder.shift();
    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }
}

// =============================================================================
// KEY GENERATORS
// =============================================================================

/**
 * Default key generator using JSON serialization
 */
export function defaultKeyGenerator(...args: unknown[]): string {
  if (args.length === 0) {
    return '__no_args__';
  }
  if (args.length === 1) {
    const arg = args[0];
    if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
      return String(arg);
    }
  }
  try {
    return JSON.stringify(args);
  } catch {
    // Fallback for circular references
    return args.map((a) => String(a)).join('|');
  }
}

/**
 * Key generator for single primitive argument (optimized)
 */
export function primitiveKeyGenerator(arg: string | number | boolean): string {
  return String(arg);
}

// =============================================================================
// DECORATORS
// =============================================================================

/** Symbol for storing cache on class instances */
const MEMOIZE_CACHE = Symbol('memoizeCache');

/**
 * Memoize decorator for synchronous methods
 */
export function Memoize(options: MemoizeDecoratorOptions = {}): MethodDecorator {
  const { ttl = Infinity, maxSize = 100, keyGenerator = defaultKeyGenerator } = options;

  return function (
    _target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const cacheKey = `${String(propertyKey)}_cache`;

    descriptor.value = function (this: Record<string | symbol, unknown>, ...args: unknown[]) {
      // Get or create cache for this instance
      if (!this[MEMOIZE_CACHE]) {
        this[MEMOIZE_CACHE] = {};
      }
      const instanceCaches = this[MEMOIZE_CACHE] as Record<string, MemoizeCache<unknown>>;

      if (!instanceCaches[cacheKey]) {
        instanceCaches[cacheKey] = new MemoizeCache(maxSize, ttl);
      }
      const cache = instanceCaches[cacheKey];

      const key = keyGenerator(...args);

      if (cache.has(key)) {
        return cache.get(key);
      }

      const result = originalMethod.apply(this, args);
      cache.set(key, result);
      return result;
    };

    return descriptor;
  };
}

/**
 * Memoize decorator for async methods
 */
export function MemoizeAsync(options: MemoizeDecoratorOptions = {}): MethodDecorator {
  const { ttl = Infinity, maxSize = 100, keyGenerator = defaultKeyGenerator } = options;

  return function (
    _target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const cacheKey = `${String(propertyKey)}_async_cache`;
    const pendingKey = `${String(propertyKey)}_pending`;

    descriptor.value = async function (this: Record<string | symbol, unknown>, ...args: unknown[]) {
      // Get or create cache for this instance
      if (!this[MEMOIZE_CACHE]) {
        this[MEMOIZE_CACHE] = {};
      }
      const instanceCaches = this[MEMOIZE_CACHE] as Record<
        string,
        MemoizeCache<unknown> | Map<string, Promise<unknown>>
      >;

      if (!instanceCaches[cacheKey]) {
        instanceCaches[cacheKey] = new MemoizeCache(maxSize, ttl);
      }
      if (!instanceCaches[pendingKey]) {
        instanceCaches[pendingKey] = new Map();
      }

      const cache = instanceCaches[cacheKey] as MemoizeCache<unknown>;
      const pending = instanceCaches[pendingKey] as Map<string, Promise<unknown>>;

      const key = keyGenerator(...args);

      // Return cached value if available
      if (cache.has(key)) {
        return cache.get(key);
      }

      // Return pending promise if request is in flight
      if (pending.has(key)) {
        return pending.get(key);
      }

      // Execute and cache
      const promise = originalMethod.apply(this, args);
      pending.set(key, promise);

      try {
        const result = await promise;
        cache.set(key, result);
        return result;
      } finally {
        pending.delete(key);
      }
    };

    return descriptor;
  };
}

// =============================================================================
// UTILITY FUNCTIONS (Aliases to memo.util functions)
// =============================================================================

// Import memo utilities for aliases
import { memo, memoWeakMap } from './memo.util';

/**
 * Create a memoized version of a function
 * Alias for memo() from memo.util
 */
export const memoize = memo;

/**
 * Create a memoized version of an async function
 * Uses memo() with promise handling
 */
export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: MemoizeDecoratorOptions = {}
): T {
  return memo(fn, options as any) as unknown as T;
}

/**
 * WeakMap-based memoization for object keys
 * Alias for memoWeakMap() from memo.util
 */
export const memoizeWeak = memoWeakMap;

/**
 * Clear all memoization caches on an object
 */
export function clearMemoizeCache(obj: object): void {
  const caches = (obj as Record<symbol, unknown>)[MEMOIZE_CACHE];
  if (caches && typeof caches === 'object') {
    Object.values(caches).forEach((cache) => {
      if (cache instanceof MemoizeCache) {
        cache.clear();
      } else if (cache instanceof Map) {
        cache.clear();
      }
    });
  }
}

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

/**
 * Consolidated memoization utilities namespace
 */
export const MemoizationUtil = {
  memoize,
  memoizeAsync,
  memoizeWeak,
  defaultKeyGenerator,
  primitiveKeyGenerator,
  clearMemoizeCache,
  MemoizeCache,
};
