import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { CacheCoordinationService } from '../services/cache-coordination.service';

/**
 * HTTP Cache Interceptor
 *
 * HTTP interceptor that caches GET requests to improve performance and reduce
 * network traffic. Uses CacheCoordinationService for unified cache management
 * across all cache layers.
 *
 * Features:
 * - Unified cache coordination
 * - Two-tier caching (in-memory + IndexedDB)
 * - Configurable TTL (Time To Live) for cache entries
 * - Automatic cache invalidation
 * - Cache versioning
 * - Selective caching (only /assets/configs/ endpoints)
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
  private readonly cacheCoord: CacheCoordinationService = inject(CacheCoordinationService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only cache GET requests for card configs
    if (req.method !== 'GET' || !req.url.includes('/assets/configs/')) {
      return next.handle(req);
    }

    // Check cache via coordination service
    return this.cacheCoord.getHttpCache(req.url).pipe(
      switchMap((cachedData) => {
        if (cachedData !== null) {
          // Return cached response
          return of(
            new HttpResponse({
              body: cachedData,
              status: 200,
              statusText: 'OK',
              url: req.url,
            })
          );
        }

        // No valid cache, make request and cache response
        return next.handle(req).pipe(
          tap((event) => {
            if (event instanceof HttpResponse) {
              // Cache via coordination service
              this.cacheCoord.setHttpCache(req.url, event.body).subscribe({
                error: (err: any) => {
                  // Silently fail caching
                  console.debug('[HttpCacheInterceptor] Failed to cache:', err);
                },
              });
            }
          })
        );
      }),
      catchError(() => {
        // If cache check fails, fall back to regular request
        return next.handle(req);
      })
    );
  }

  /**
   * Clear cache for a specific URL
   */
  clearCache(url: string): void {
    this.cacheCoord.invalidateCache(new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  /**
   * Clear all HTTP cache
   */
  clearAllCache(): void {
    this.cacheCoord.clearHttpCache().subscribe();
  }

  /**
   * Get cache size
   */
  getCacheSize(): Observable<number> {
    return this.cacheCoord.getCacheStats().pipe(switchMap((stats: any) => of(stats.http.entries)));
  }
}
