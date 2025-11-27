import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of, from } from 'rxjs';
import { tap, switchMap, map, catchError } from 'rxjs/operators';
import { AppConfigService } from '../services/app-config.service';
import { IndexedDBCacheService } from '../services/indexeddb-cache.service';

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

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

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only cache GET requests for card configs
    if (req.method !== 'GET' || !req.url.includes('/assets/configs/')) {
      return next.handle(req);
    }

    const now = Date.now();

    // Check in-memory cache first
    const cached = this.cache.get(req.url);
    if (cached && now - cached.timestamp < this.TTL) {
      // Return cached response
      return of(new HttpResponse({ 
        body: cached.data,
        status: 200,
        statusText: 'OK',
        url: req.url
      }));
    }

    // Check IndexedDB cache
    return this.indexedDBCache.get(req.url).pipe(
      switchMap((indexedEntry: CacheEntry | null) => {
        if (indexedEntry && now - indexedEntry.timestamp < this.TTL) {
          // Update in-memory cache and return cached response
          this.cache.set(req.url, indexedEntry);
          return of(new HttpResponse({ 
            body: indexedEntry.data,
            status: 200,
            statusText: 'OK',
            url: req.url
          }));
        }

        // No valid cache, make request and cache response
        return next.handle(req).pipe(
          tap(event => {
            if (event instanceof HttpResponse) {
              const cacheEntry: CacheEntry = { 
                data: event.body, 
                timestamp: now 
              };
              
              // Cache in memory
              this.cache.set(req.url, cacheEntry);
              
              // Cache in IndexedDB (async, don't wait)
              this.indexedDBCache.set(req.url, event.body, now).subscribe({
                error: (err) => {
                  // Silently fail IndexedDB caching - in-memory cache is sufficient
                  console.debug('Failed to cache in IndexedDB:', err);
                }
              });
            }
          })
        );
      }),
      catchError(() => {
        // If IndexedDB fails, fall back to regular request
        return next.handle(req).pipe(
          tap(event => {
            if (event instanceof HttpResponse) {
              const cacheEntry: CacheEntry = { 
                data: event.body, 
                timestamp: now 
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

