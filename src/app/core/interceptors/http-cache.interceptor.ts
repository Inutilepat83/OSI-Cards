import { inject, Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { AppConfigService } from '../services/app-config.service';
import { CacheEntry, IndexedDBCacheService } from '../services/indexeddb-cache.service';
import { VERSION } from '../../../version';
import { isCachedVersionValid } from '../utils/version-comparison.util';

/**
 * HTTP Cache Interceptor
 *
 * HTTP interceptor that caches GET requests to improve performance and reduce
 * network traffic. Uses a two-tier caching strategy: in-memory cache for fast
 * access and IndexedDB for persistent caching across page reloads.
 *
 * Features:
 * - Two-tier caching (in-memory + IndexedDB)
 * - Configurable TTL (Time To Live) for cache entries
 * - Automatic cache invalidation
 * - Selective caching (only /assets/configs/ endpoints)
 * - Cache management utilities
 *
 * @example
 * ```typescript
 * const interceptor = inject(HttpCacheInterceptor);
 *
 * // Clear cache for specific URL
 * interceptor.clearCache('/assets/configs/cards.json');
 *
 * // Clear all cache
 * interceptor.clearAllCache();
 *
 * // Get cache size
 * const size = interceptor.getCacheSize();
 * ```
 */
@Injectable()
export class HttpCacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, CacheEntry>();
  private readonly indexedDBCache = inject(IndexedDBCacheService);
  private readonly config = inject(AppConfigService);
  // Use config service or default to 1 hour (3600000 ms)
  private readonly TTL = this.config.PERFORMANCE_ENV.CACHE_TIMEOUT || 60 * 60 * 1000; // 1 hour default
  private readonly CURRENT_VERSION = VERSION;

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only cache GET requests for card configs
    if (req.method !== 'GET' || !req.url.includes('/assets/configs/')) {
      return next.handle(req);
    }

    const now = Date.now();

    // Check in-memory cache first
    const cached = this.cache.get(req.url);
    if (cached && now - cached.timestamp < this.TTL) {
      // Check version before using cached data
      if (isCachedVersionValid(cached.version, this.CURRENT_VERSION)) {
        // Return cached response
        return of(
          new HttpResponse({
            body: cached.data,
            status: 200,
            statusText: 'OK',
            url: req.url,
          })
        );
      } else {
        // Version mismatch - invalidate cache
        console.debug(
          `HTTP cache version mismatch for ${req.url}: cached=${cached.version}, current=${this.CURRENT_VERSION}. Invalidating cache.`
        );
        this.cache.delete(req.url);
        // Fall through to IndexedDB check or HTTP request
      }
    }

    // Check IndexedDB cache
    return this.indexedDBCache.get(req.url).pipe(
      switchMap((indexedEntry: CacheEntry | null) => {
        if (indexedEntry && now - indexedEntry.timestamp < this.TTL) {
          // Check version before using cached data
          if (!isCachedVersionValid(indexedEntry.version, this.CURRENT_VERSION)) {
            // Version mismatch - invalidate cache
            console.debug(
              `IndexedDB HTTP cache version mismatch for ${req.url}: cached=${indexedEntry.version}, current=${this.CURRENT_VERSION}. Invalidating cache.`
            );
            this.indexedDBCache.delete(req.url).subscribe();
            // Fall through to HTTP request
          } else {
            // Update in-memory cache and return cached response
            this.cache.set(req.url, indexedEntry);
            return of(
              new HttpResponse({
                body: indexedEntry.data,
                status: 200,
                statusText: 'OK',
                url: req.url,
              })
            );
          }
        }

        // No valid cache, make request and cache response
        return next.handle(req).pipe(
          tap((event) => {
            if (event instanceof HttpResponse) {
              const cacheEntry: CacheEntry = {
                data: event.body,
                timestamp: now,
                version: this.CURRENT_VERSION,
              };

              // Cache in memory
              this.cache.set(req.url, cacheEntry);

              // Cache in IndexedDB (async, don't wait)
              this.indexedDBCache.set(req.url, event.body, now, this.CURRENT_VERSION).subscribe({
                error: (err) => {
                  // Silently fail IndexedDB caching - in-memory cache is sufficient
                  console.debug('Failed to cache in IndexedDB:', err);
                },
              });
            }
          })
        );
      }),
      catchError(() => {
        // If IndexedDB fails, fall back to regular request
        return next.handle(req).pipe(
          tap((event) => {
            if (event instanceof HttpResponse) {
              const cacheEntry: CacheEntry = {
                data: event.body,
                timestamp: now,
                version: this.CURRENT_VERSION,
              };
              this.cache.set(req.url, cacheEntry);
            }
          })
        );
      })
    );
  }

  /**
   * Clear cache for a specific URL
   */
  clearCache(url: string): void {
    this.cache.delete(url);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}
