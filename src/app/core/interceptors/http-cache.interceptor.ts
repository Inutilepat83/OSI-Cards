import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

interface CacheEntry {
  data: any;
  timestamp: number;
}

/**
 * HTTP cache interceptor for card configs
 * Caches GET requests to /assets/configs/ for improved performance
 */
@Injectable()
export class HttpCacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only cache GET requests for card configs
    if (req.method !== 'GET' || !req.url.includes('/assets/configs/')) {
      return next.handle(req);
    }

    // Check cache
    const cached = this.cache.get(req.url);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      // Return cached response
      return of(new HttpResponse({ 
        body: cached.data,
        status: 200,
        statusText: 'OK',
        url: req.url
      }));
    }

    // Make request and cache response
    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          // Cache successful responses
          this.cache.set(req.url, { 
            data: event.body, 
            timestamp: Date.now() 
          });
        }
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

