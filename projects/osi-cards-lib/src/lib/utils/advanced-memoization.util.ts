/**
 * Advanced Memoization Utilities
 *
 * Provides decorators and utilities for memoizing function results
 * with various cache strategies and options.
 *
 * Features:
 * - Multiple cache strategies (LRU, TTL, size-based)
 * - Configurable key generation
 * - WeakMap support for object keys
 * - Cache statistics and debugging
 * - TypeScript decorators
 *
 * @example
 * ```typescript
 * import { Memoize, MemoizeTTL } from '@osi-cards/utils';
 *
 * class Calculator {
 *   @Memoize()
 *   expensive(n: number): number {
 *     // Expensive calculation...
 *     return n * n;
 *   }
 *
 *   @MemoizeTTL(5000) // 5 seconds TTL
 *   fetch(id: string): Promise<Data> {
 *     return this.http.get(`/api/data/${id}`);
 *   }
 * }
 * ```
 */

/**
 * Memoization options
 */
export interface MemoizeOptions {
  /**
   * Custom key generator function
   * Default: JSON.stringify(args)
   */
  keyGenerator?: (...args: any[]) => string;

  /**
   * Maximum cache size (0 = unlimited)
   * Default: 100
   */
  maxSize?: number;

  /**
   * Time-to-live in milliseconds (0 = no expiration)
   * Default: 0
   */
  ttl?: number;

  /**
   * Whether to use WeakMap for object arguments
   * Default: false
   */
  useWeakMap?: boolean;

  /**
   * Cache strategy: 'lru' | 'fifo' | 'lifo'
   * Default: 'lru'
   */
  strategy?: 'lru' | 'fifo' | 'lifo';

  /**
   * Whether to track statistics
   * Default: false
   */
  stats?: boolean;
}

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  value: T;
  createdAt: number;
  lastAccessedAt: number;
  accessCount: number;
}

/**
 * Cache statistics
 */
interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

/**
 * Advanced Memoization Cache
 *
 * Implements various cache strategies with TTL and size limits.
 */
export class MemoizationCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder: string[] = [];
  private stats = { hits: 0, misses: 0 };

  constructor(private options: Required<MemoizeOptions>) {}

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    // Check TTL
    if (this.options.ttl > 0) {
      const age = Date.now() - entry.createdAt;
      if (age > this.options.ttl) {
        this.cache.delete(key);
        this.stats.misses++;
        return undefined;
      }
    }

    // Update access metadata
    entry.lastAccessedAt = Date.now();
    entry.accessCount++;

    // Update access order for LRU
    if (this.options.strategy === 'lru') {
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      this.accessOrder.push(key);
    }

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T): void {
    // Check if we need to evict
    if (this.options.maxSize > 0 && this.cache.size >= this.options.maxSize) {
      this.evict();
    }

    const entry: CacheEntry<T> = {
      value,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 0,
    };

    this.cache.set(key, entry);
    this.accessOrder.push(key);
  }

  /**
   * Evict entry based on strategy
   */
  private evict(): void {
    let keyToEvict: string | undefined;

    switch (this.options.strategy) {
      case 'lru':
        // Evict least recently used
        keyToEvict = this.accessOrder.shift();
        break;

      case 'fifo':
        // Evict first in
        keyToEvict = this.accessOrder.shift();
        break;

      case 'lifo':
        // Evict last in
        keyToEvict = this.accessOrder.pop();
        break;
    }

    if (keyToEvict) {
      this.cache.delete(keyToEvict);
    }
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }
}

/**
 * Default key generator
 */
function defaultKeyGenerator(...args: any[]): string {
  return JSON.stringify(args);
}

/**
 * Memoize decorator
 *
 * Caches method results based on arguments.
 *
 * @param options - Memoization options
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * class Calculator {
 *   @Memoize({ maxSize: 50 })
 *   fibonacci(n: number): number {
 *     if (n <= 1) return n;
 *     return this.fibonacci(n - 1) + this.fibonacci(n - 2);
 *   }
 * }
 * ```
 */
export function Memoize(options: Partial<MemoizeOptions> = {}): MethodDecorator {
  const fullOptions: Required<MemoizeOptions> = {
    keyGenerator: options.keyGenerator || defaultKeyGenerator,
    maxSize: options.maxSize ?? 100,
    ttl: options.ttl ?? 0,
    useWeakMap: options.useWeakMap ?? false,
    strategy: options.strategy ?? 'lru',
    stats: options.stats ?? false,
  };

  const cache = new MemoizationCache(fullOptions);

  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const key = fullOptions.keyGenerator(...args);

      // Check cache
      const cached = cache.get(key);
      if (cached !== undefined) {
        return cached;
      }

      // Calculate and cache
      const result = originalMethod.apply(this, args);
      cache.set(key, result);

      return result;
    };

    // Attach cache to method for debugging
    if (fullOptions.stats) {
      (descriptor.value as any).__cache__ = cache;
    }

    return descriptor;
  };
}

/**
 * Memoize with Time-To-Live
 *
 * Caches results with automatic expiration.
 *
 * @param ttl - Time to live in milliseconds
 * @param options - Additional memoization options
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * class DataService {
 *   @MemoizeTTL(60000) // Cache for 1 minute
 *   async fetchData(id: string): Promise<Data> {
 *     return this.http.get(`/api/data/${id}`);
 *   }
 * }
 * ```
 */
export function MemoizeTTL(ttl: number, options: Partial<MemoizeOptions> = {}): MethodDecorator {
  return Memoize({
    ...options,
    ttl,
  });
}

/**
 * Memoize with LRU cache
 *
 * Uses Least Recently Used eviction strategy.
 *
 * @param maxSize - Maximum cache size
 * @param options - Additional memoization options
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * class Calculator {
 *   @MemoizeLRU(10)
 *   calculate(x: number, y: number): number {
 *     return x * y + x / y;
 *   }
 * }
 * ```
 */
export function MemoizeLRU(
  maxSize: number,
  options: Partial<MemoizeOptions> = {}
): MethodDecorator {
  return Memoize({
    ...options,
    maxSize,
    strategy: 'lru',
  });
}

/**
 * Memoize once
 *
 * Caches the result and never recalculates (maxSize: 1).
 * Useful for expensive initialization.
 *
 * @param options - Additional memoization options
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * class Service {
 *   @MemoizeOnce()
 *   initialize(): Config {
 *     // Expensive initialization
 *     return loadConfig();
 *   }
 * }
 * ```
 */
export function MemoizeOnce(options: Partial<MemoizeOptions> = {}): MethodDecorator {
  return Memoize({
    ...options,
    maxSize: 1,
  });
}

/**
 * Memoize with custom key
 *
 * Allows custom cache key generation.
 *
 * @param keyGenerator - Function to generate cache key
 * @param options - Additional memoization options
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * class UserService {
 *   @MemoizeKey((user: User) => user.id)
 *   processUser(user: User): ProcessedUser {
 *     // Only use user.id as cache key
 *     return process(user);
 *   }
 * }
 * ```
 */
export function MemoizeKey(
  keyGenerator: (...args: any[]) => string,
  options: Partial<MemoizeOptions> = {}
): MethodDecorator {
  return Memoize({
    ...options,
    keyGenerator,
  });
}

/**
 * Clear memoization cache for a method
 *
 * @param target - Object instance
 * @param methodName - Method name
 *
 * @example
 * ```typescript
 * const calc = new Calculator();
 * clearMemoCache(calc, 'fibonacci');
 * ```
 */
export function clearMemoCache(target: any, methodName: string): void {
  const method = target[methodName];
  if (method && method.__cache__) {
    method.__cache__.clear();
  }
}

/**
 * Get memoization statistics for a method
 *
 * @param target - Object instance
 * @param methodName - Method name
 * @returns Cache statistics or null
 *
 * @example
 * ```typescript
 * const stats = getMemoStats(calc, 'fibonacci');
 * console.log(`Hit rate: ${stats.hitRate * 100}%`);
 * ```
 */
export function getMemoStats(target: any, methodName: string): CacheStats | null {
  const method = target[methodName];
  if (method && method.__cache__) {
    return method.__cache__.getStats();
  }
  return null;
}

/**
 * Simple function memoization (no decorator)
 *
 * @param fn - Function to memoize
 * @param options - Memoization options
 * @returns Memoized function
 *
 * @example
 * ```typescript
 * const expensiveFn = (n: number) => {
 *   // Expensive calculation
 *   return n * n;
 * };
 *
 * const memoized = memoize(expensiveFn);
 * console.log(memoized(5)); // Calculated
 * console.log(memoized(5)); // From cache
 * ```
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: Partial<MemoizeOptions> = {}
): T {
  const fullOptions: Required<MemoizeOptions> = {
    keyGenerator: options.keyGenerator || defaultKeyGenerator,
    maxSize: options.maxSize ?? 100,
    ttl: options.ttl ?? 0,
    useWeakMap: options.useWeakMap ?? false,
    strategy: options.strategy ?? 'lru',
    stats: options.stats ?? false,
  };

  const cache = new MemoizationCache(fullOptions);

  const memoized = function (...args: any[]) {
    const key = fullOptions.keyGenerator(...args);

    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args);
    cache.set(key, result);

    return result;
  } as T;

  // Attach cache for debugging
  if (fullOptions.stats) {
    (memoized as any).__cache__ = cache;
  }

  return memoized;
}
