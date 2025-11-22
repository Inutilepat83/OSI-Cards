/**
 * Caching utilities with TTL and invalidation strategies
 */

export interface CacheEntry<T> {
  value: T;
  expires: number;
  createdAt: number;
}

export interface CacheOptions {
  ttlMs?: number;
  maxSize?: number;
}

/**
 * Simple cache with TTL support
 */
export class Cache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: number;
  private readonly maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.ttlMs = options.ttlMs || 300000; // 5 minutes default
    this.maxSize = options.maxSize || 100;
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttlMs?: number): void {
    // Remove oldest entries if at max size
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const now = Date.now();
    const ttl = ttlMs || this.ttlMs;

    this.cache.set(key, {
      value,
      expires: now + ttl,
      createdAt: now
    });
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

/**
 * Create a cached function
 */
export function createCachedFunction<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  options: CacheOptions = {}
): T & { cache: Cache<ReturnType<T>>; clearCache: () => void } {
  const cache = new Cache<ReturnType<T>>(options);

  const cached = ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator(...args);
    const cachedValue = cache.get(key);

    if (cachedValue !== null) {
      return cachedValue;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T & { cache: Cache<ReturnType<T>>; clearCache: () => void };

  cached.cache = cache;
  cached.clearCache = () => cache.clear();

  return cached;
}


