/**
 * Cache Invalidation Utilities
 *
 * Provides strategies and utilities for cache invalidation,
 * including time-based, tag-based, and dependency-based invalidation.
 *
 * Features:
 * - Multiple invalidation strategies
 * - Tag-based cache management
 * - Dependency tracking
 * - TTL and stale-while-revalidate
 * - Observable cache updates
 *
 * @example
 * ```typescript
 * import { CacheManager } from '@osi-cards/utils';
 *
 * const cache = new CacheManager();
 *
 * // Set with TTL
 * cache.set('user-123', userData, { ttl: 60000 });
 *
 * // Tag for group invalidation
 * cache.set('post-1', postData, { tags: ['posts', 'user-123'] });
 *
 * // Invalidate by tag
 * cache.invalidateByTag('user-123');
 * ```
 */

import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Cache options
 */
export interface CacheOptions {
  /**
   * Time-to-live in milliseconds
   */
  ttl?: number;

  /**
   * Tags for group invalidation
   */
  tags?: string[];

  /**
   * Dependencies (invalidate when these change)
   */
  dependencies?: string[];

  /**
   * Stale-while-revalidate time in milliseconds
   */
  swr?: number;

  /**
   * Priority (higher priority items evicted last)
   */
  priority?: number;
}

/**
 * Cache entry
 */
interface CacheEntry<T> {
  value: T;
  createdAt: number;
  lastAccessedAt: number;
  accessCount: number;
  ttl?: number;
  tags: Set<string>;
  dependencies: Set<string>;
  swr?: number;
  priority: number;
  stale: boolean;
}

/**
 * Cache invalidation event
 */
export interface InvalidationEvent {
  key?: string;
  tag?: string;
  reason: 'ttl' | 'manual' | 'tag' | 'dependency' | 'eviction';
  timestamp: number;
}

/**
 * Cache Manager
 *
 * Manages cache with multiple invalidation strategies.
 */
export class CacheManager<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private tagIndex = new Map<string, Set<string>>();
  private dependencyIndex = new Map<string, Set<string>>();
  private invalidationSubject = new BehaviorSubject<InvalidationEvent | null>(null);

  /**
   * Observable of cache invalidation events
   */
  readonly invalidations$ = this.invalidationSubject.asObservable();

  /**
   * Maximum cache size
   */
  private maxSize = 1000;

  constructor(options: { maxSize?: number } = {}) {
    if (options.maxSize) {
      this.maxSize = options.maxSize;
    }
  }

  /**
   * Set cache value
   *
   * @param key - Cache key
   * @param value - Value to cache
   * @param options - Cache options
   *
   * @example
   * ```typescript
   * cache.set('user-123', userData, {
   *   ttl: 60000,
   *   tags: ['users', 'profile'],
   *   priority: 10
   * });
   * ```
   */
  set(key: string, value: T, options: CacheOptions = {}): void {
    // Evict if at max size
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLeastValuable();
    }

    const entry: CacheEntry<T> = {
      value,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 0,
      ttl: options.ttl,
      tags: new Set(options.tags || []),
      dependencies: new Set(options.dependencies || []),
      swr: options.swr,
      priority: options.priority || 0,
      stale: false,
    };

    // Update indexes
    entry.tags.forEach((tag) => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    });

    entry.dependencies.forEach((dep) => {
      if (!this.dependencyIndex.has(dep)) {
        this.dependencyIndex.set(dep, new Set());
      }
      this.dependencyIndex.get(dep)!.add(key);
    });

    this.cache.set(key, entry);
  }

  /**
   * Get cache value
   *
   * @param key - Cache key
   * @returns Cached value or undefined
   *
   * @example
   * ```typescript
   * const user = cache.get('user-123');
   * ```
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.delete(key, 'ttl');
      return undefined;
    }

    // Check if stale (but return anyway for SWR)
    if (this.isStale(entry)) {
      entry.stale = true;
    }

    // Update access metadata
    entry.lastAccessedAt = Date.now();
    entry.accessCount++;

    return entry.value;
  }

  /**
   * Check if cache has key
   *
   * @param key - Cache key
   * @returns True if key exists and not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return !!entry && !this.isExpired(entry);
  }

  /**
   * Delete cache entry
   *
   * @param key - Cache key
   * @param reason - Reason for deletion
   * @returns True if entry was deleted
   */
  delete(key: string, reason: InvalidationEvent['reason'] = 'manual'): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Remove from indexes
    entry.tags.forEach((tag) => {
      this.tagIndex.get(tag)?.delete(key);
    });

    entry.dependencies.forEach((dep) => {
      this.dependencyIndex.get(dep)?.delete(key);
    });

    this.cache.delete(key);

    this.invalidationSubject.next({
      key,
      reason,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Invalidate all entries with specific tag
   *
   * @param tag - Tag to invalidate
   * @returns Number of entries invalidated
   *
   * @example
   * ```typescript
   * // Invalidate all user-related caches
   * cache.invalidateByTag('users');
   * ```
   */
  invalidateByTag(tag: string): number {
    const keys = this.tagIndex.get(tag);

    if (!keys) {
      return 0;
    }

    let count = 0;
    keys.forEach((key) => {
      if (this.delete(key, 'tag')) {
        count++;
      }
    });

    this.tagIndex.delete(tag);

    this.invalidationSubject.next({
      tag,
      reason: 'tag',
      timestamp: Date.now(),
    });

    return count;
  }

  /**
   * Invalidate entries that depend on a key
   *
   * @param dependencyKey - Dependency key
   * @returns Number of entries invalidated
   *
   * @example
   * ```typescript
   * // When user data changes, invalidate dependent caches
   * cache.invalidateByDependency('user-123');
   * ```
   */
  invalidateByDependency(dependencyKey: string): number {
    const keys = this.dependencyIndex.get(dependencyKey);

    if (!keys) {
      return 0;
    }

    let count = 0;
    keys.forEach((key) => {
      if (this.delete(key, 'dependency')) {
        count++;
      }
    });

    this.dependencyIndex.delete(dependencyKey);

    return count;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.tagIndex.clear();
    this.dependencyIndex.clear();
  }

  /**
   * Cleanup expired entries
   *
   * @returns Number of entries removed
   */
  cleanup(): number {
    let count = 0;

    this.cache.forEach((entry, key) => {
      if (this.isExpired(entry)) {
        this.delete(key, 'ttl');
        count++;
      }
    });

    return count;
  }

  /**
   * Get cache statistics
   *
   * @returns Statistics object
   */
  getStats() {
    return {
      size: this.cache.size,
      tags: this.tagIndex.size,
      dependencies: this.dependencyIndex.size,
    };
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    if (!entry.ttl) {
      return false;
    }

    const age = Date.now() - entry.createdAt;
    return age > entry.ttl;
  }

  /**
   * Check if entry is stale (past TTL but within SWR window)
   */
  private isStale(entry: CacheEntry<T>): boolean {
    if (!entry.ttl || !entry.swr) {
      return false;
    }

    const age = Date.now() - entry.createdAt;
    return age > entry.ttl && age <= entry.ttl + entry.swr;
  }

  /**
   * Evict least valuable entry
   *
   * Uses combination of priority, access count, and recency
   */
  private evictLeastValuable(): void {
    let lowestScore = Infinity;
    let keyToEvict: string | null = null;

    this.cache.forEach((entry, key) => {
      // Calculate value score
      const recency = Date.now() - entry.lastAccessedAt;
      const score = entry.priority * 1000 + entry.accessCount * 100 - recency;

      if (score < lowestScore) {
        lowestScore = score;
        keyToEvict = key;
      }
    });

    if (keyToEvict) {
      this.delete(keyToEvict, 'eviction');
    }
  }
}

/**
 * Global cache manager instance
 */
export const globalCache = new CacheManager();

/**
 * Cache decorator with invalidation support
 *
 * @param options - Cache options
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * class UserService {
 *   @Cached({ ttl: 60000, tags: ['users'] })
 *   async getUser(id: string) {
 *     return await this.http.get(`/api/users/${id}`);
 *   }
 *
 *   async updateUser(id: string, data: any) {
 *     await this.http.put(`/api/users/${id}`, data);
 *     // Invalidate cache
 *     globalCache.invalidateByTag('users');
 *   }
 * }
 * ```
 */
export function Cached(options: CacheOptions = {}): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const key = `${String(propertyKey)}-${JSON.stringify(args)}`;

      // Check cache
      const cached = globalCache.get(key);
      if (cached !== undefined) {
        return cached;
      }

      // Call original and cache result
      const result = originalMethod.apply(this, args);

      // Handle promises
      if (result instanceof Promise) {
        return result.then((value) => {
          globalCache.set(key, value, options);
          return value;
        });
      }

      globalCache.set(key, result, options);
      return result;
    };

    return descriptor;
  };
}
