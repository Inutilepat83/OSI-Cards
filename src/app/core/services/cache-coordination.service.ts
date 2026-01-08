import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

/**
 * Cache Coordination Service
 *
 * Coordinates caching across different cache layers (HTTP cache, memory cache, etc.)
 */
@Injectable({
  providedIn: 'root',
})
export class CacheCoordinationService {
  private readonly httpCache = new Map<string, any>();

  /**
   * Invalidate cache for a given URL pattern
   */
  invalidateCache(urlPattern: string | RegExp): void {
    if (typeof urlPattern === 'string') {
      this.httpCache.delete(urlPattern);
    } else {
      for (const key of this.httpCache.keys()) {
        if (urlPattern.test(key)) {
          this.httpCache.delete(key);
        }
      }
    }
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.httpCache.clear();
  }

  /**
   * Get HTTP cache entry
   */
  getHttpCache(url: string): Observable<any> {
    return of(this.httpCache.get(url) || null);
  }

  /**
   * Set HTTP cache entry
   */
  setHttpCache(url: string, data: any): Observable<void> {
    this.httpCache.set(url, data);
    return of(undefined);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): Observable<{ http: { entries: number; hits: number; misses: number } }> {
    return of({ http: { entries: this.httpCache.size, hits: 0, misses: 0 } });
  }

  /**
   * Clear HTTP cache
   */
  clearHttpCache(): Observable<void> {
    this.httpCache.clear();
    return of(undefined);
  }
}
