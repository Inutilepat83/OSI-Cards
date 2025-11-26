import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of, from } from 'rxjs';
import { tap, switchMap, map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { IndexedDBCacheService } from '../services/indexeddb-cache.service';

interface CacheEntry {
  data: any;
  timestamp: number;
}

/**
 * HTTP cache interceptor for card configs
 * Caches GET requests to /assets/configs/ for improved performance
 * Uses both in-memory cache and IndexedDB for persistent caching
 */
@Injectable()
export class HttpCacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, CacheEntry>();
  private readonly indexedDBCache = inject(IndexedDBCacheService);
  // Use environment config or default to 1 hour (3600000 ms)
  private readonly TTL = (environment.performance?.cacheTimeout || 60 * 60 * 1000); // 1 hour default

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

