/**
 * LRU (Least Recently Used) Cache Utility
 *
 * A generic, configurable LRU cache implementation for memoization
 * and caching expensive operations in the OSI Cards library.
 *
 * @example
 * ```typescript
 * import { LRUCache } from 'osi-cards-lib';
 *
 * const cache = new LRUCache<string, object>({ maxSize: 100 });
 *
 * cache.set('key1', { data: 'value1' });
 * const value = cache.get('key1');
 * ```
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * LRU Cache configuration options
 */
export interface LRUCacheOptions {
  /** Maximum number of items to store */
  maxSize: number;
  /** Time-to-live in milliseconds (optional) */
  ttl?: number;
  /** Callback when an item is evicted */
  onEvict?: (key: string, value: unknown) => void;
}

/**
 * Cache entry with metadata
 */
interface CacheEntry<V> {
  value: V;
  timestamp: number;
  size?: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
}

// ============================================================================
// LRU CACHE CLASS
// ============================================================================

/**
 * LRU Cache implementation
 *
 * Uses a Map for O(1) access and maintains insertion order for LRU tracking.
 */
export class LRUCache<K extends string | number, V> {
  private cache: Map<K, CacheEntry<V>>;
  private readonly maxSize: number;
  private readonly ttl?: number;
  private readonly onEvict?: (key: K, value: V) => void;

  // Statistics
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(options: LRUCacheOptions) {
    this.maxSize = Math.max(1, options.maxSize);
    this.ttl = options.ttl;
    this.onEvict = options.onEvict as (key: K, value: V) => void;
    this.cache = new Map();
  }

  /**
   * Get a value from the cache
   *
   * @param key - Cache key
   * @returns Value or undefined if not found/expired
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return undefined;
    }

    // Check TTL expiration
    if (this.isExpired(entry)) {
      this.delete(key);
      this.misses++;
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.hits++;
    return entry.value;
  }

  /**
   * Set a value in the cache
   *
   * @param key - Cache key
   * @param value - Value to cache
   * @returns The cache instance for chaining
   */
  set(key: K, value: V): this {
    // If key exists, delete it first to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest entries if at capacity
    while (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<V> = {
      value,
      timestamp: Date.now(),
    };

    this.cache.set(key, entry);
    return this;
  }

  /**
   * Check if a key exists in the cache
   *
   * @param key - Cache key
   * @returns true if key exists and is not expired
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from the cache
   *
   * @param key - Cache key
   * @returns true if key was deleted
   */
  delete(key: K): boolean {
    const entry = this.cache.get(key);

    if (entry) {
      this.onEvict?.(key, entry.value);
      return this.cache.delete(key);
    }

    return false;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    if (this.onEvict) {
      for (const [key, entry] of this.cache) {
        this.onEvict(key, entry.value);
      }
    }

    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      evictions: this.evictions,
    };
  }

  /**
   * Get all keys in the cache
   */
  keys(): K[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get all values in the cache
   */
  values(): V[] {
    return Array.from(this.cache.values()).map((entry) => entry.value);
  }

  /**
   * Iterate over cache entries
   */
  forEach(callback: (value: V, key: K) => void): void {
    this.cache.forEach((entry, key) => {
      if (!this.isExpired(entry)) {
        callback(entry.value, key);
      }
    });
  }

  /**
   * Get or set a value with a factory function
   *
   * @param key - Cache key
   * @param factory - Function to create value if not cached
   * @returns Cached or newly created value
   */
  getOrSet(key: K, factory: () => V): V {
    const cached = this.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const value = factory();
    this.set(key, value);
    return value;
  }

  /**
   * Get or set a value with an async factory function
   *
   * @param key - Cache key
   * @param factory - Async function to create value if not cached
   * @returns Promise resolving to cached or newly created value
   */
  async getOrSetAsync(key: K, factory: () => Promise<V>): Promise<V> {
    const cached = this.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    this.set(key, value);
    return value;
  }

  /**
   * Prune expired entries
   *
   * @returns Number of entries pruned
   */
  prune(): number {
    if (!this.ttl) return 0;

    let pruned = 0;

    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        this.delete(key);
        pruned++;
      }
    }

    return pruned;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private isExpired(entry: CacheEntry<V>): boolean {
    if (!this.ttl) return false;
    return Date.now() - entry.timestamp > this.ttl;
  }

  private evictOldest(): void {
    // Get first (oldest) entry
    const oldestKey = this.cache.keys().next().value;

    if (oldestKey !== undefined) {
      const entry = this.cache.get(oldestKey);
      if (entry) {
        this.onEvict?.(oldestKey, entry.value);
      }
      this.cache.delete(oldestKey);
      this.evictions++;
    }
  }
}

// ============================================================================
// MEMOIZATION UTILITIES
// ============================================================================

/**
 * Create a memoized version of a function using LRU cache
 *
 * @param fn - Function to memoize
 * @param options - Cache options
 * @param keyFn - Optional function to generate cache key from arguments
 * @returns Memoized function
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options: LRUCacheOptions = { maxSize: 100 },
  keyFn?: (...args: Parameters<T>) => string
): T {
  const cache = new LRUCache<string, ReturnType<T>>(options);

  const defaultKeyFn = (...args: unknown[]): string => {
    return JSON.stringify(args);
  };

  const generateKey = keyFn || defaultKeyFn;

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = generateKey(...args);

    return cache.getOrSet(key, () => fn(...args) as ReturnType<T>);
  }) as T;
}

/**
 * Create a memoized version of an async function using LRU cache
 *
 * @param fn - Async function to memoize
 * @param options - Cache options
 * @param keyFn - Optional function to generate cache key from arguments
 * @returns Memoized async function
 */
export function memoizeAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: LRUCacheOptions = { maxSize: 100 },
  keyFn?: (...args: Parameters<T>) => string
): T {
  const cache = new LRUCache<string, ReturnType<T>>(options);
  const pendingPromises = new Map<string, Promise<unknown>>();

  const defaultKeyFn = (...args: unknown[]): string => {
    return JSON.stringify(args);
  };

  const generateKey = keyFn || defaultKeyFn;

  return (async (...args: Parameters<T>): Promise<unknown> => {
    const key = generateKey(...args);

    // Check cache first
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // Check if there's a pending promise for this key
    const pending = pendingPromises.get(key);
    if (pending) {
      return pending;
    }

    // Create new promise
    const promise = fn(...args)
      .then((result) => {
        cache.set(key, result as ReturnType<T>);
        pendingPromises.delete(key);
        return result;
      })
      .catch((error) => {
        pendingPromises.delete(key);
        throw error;
      });

    pendingPromises.set(key, promise);
    return promise;
  }) as T;
}

// ============================================================================
// GLOBAL CACHE INSTANCES
// ============================================================================

/**
 * Create a shared cache instance for section normalization
 */
export function createSectionCache(): LRUCache<string, unknown> {
  return new LRUCache({
    maxSize: 500,
    ttl: 5 * 60 * 1000, // 5 minutes
    onEvict: (key) => {
      // Optional: log evictions in debug mode
      if (
        typeof window !== 'undefined' &&
        (window as unknown as Record<string, unknown>)['OSI_DEBUG']
      ) {
        console.debug(`[SectionCache] Evicted: ${key}`);
      }
    },
  });
}

/**
 * Create a shared cache instance for layout calculations
 */
export function createLayoutCache(): LRUCache<string, unknown> {
  return new LRUCache({
    maxSize: 100,
    ttl: 60 * 1000, // 1 minute
  });
}
