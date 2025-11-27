import { Injectable } from '@angular/core';
import { BaseService } from './base-service.abstract';
import { ICacheableService } from './base-service.interface';

/**
 * Abstract base class for services with caching capabilities
 * Provides in-memory cache with TTL support
 */
@Injectable()
export abstract class CacheableService<T> extends BaseService implements ICacheableService<T> {
  protected cache = new Map<string, { data: T; timestamp: number }>();
  protected readonly defaultTTL: number = 60 * 60 * 1000; // 1 hour default

  /**
   * Get TTL for cache entries
   * Override to customize TTL per service
   */
  protected getTTL(): number {
    return this.defaultTTL;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    this.debug('Cache cleared', this.constructor.name);
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Check if item is cached and valid
   */
  isCached(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    const now = Date.now();
    const isValid = now - entry.timestamp < this.getTTL();

    if (!isValid) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get cached item
   */
  getCached(key: string): T | null {
    if (!this.isCached(key)) {
      return null;
    }

    const entry = this.cache.get(key);
    return entry ? entry.data : null;
  }

  /**
   * Set cached item
   */
  protected setCached(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Remove cached item
   */
  protected removeCached(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clean up expired cache entries
   */
  protected cleanupExpiredCache(): void {
    const now = Date.now();
    const ttl = this.getTTL();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.debug(`Cleaned up ${cleaned} expired cache entries`, this.constructor.name);
    }
  }

  /**
   * Clean up resources
   */
  override ngOnDestroy(): void {
    this.clearCache();
    super.ngOnDestroy();
  }
}

