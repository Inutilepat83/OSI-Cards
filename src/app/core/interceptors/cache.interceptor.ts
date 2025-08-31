import { Injectable, Inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { CACHE_SERVICE } from '../interfaces/injection-tokens';
import { CacheService } from '../interfaces/services.interface';

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  constructor(@Inject(CACHE_SERVICE) private cache: CacheService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle(request);
    }

    // Skip caching for certain URLs
    if (this.shouldSkipCache(request.url)) {
      return next.handle(request);
    }

    // Check if response is in cache and not expired
    if (this.cache.has(request.url) && !this.cache.isExpired(request.url)) {
      // Return cached response
      return this.cache.get(request.url).pipe(
        switchMap(cachedData => {
          if (cachedData) {
            return [
              new HttpResponse({
                body: cachedData,
                status: 200,
                statusText: 'OK',
                url: request.url,
              }),
            ];
          }
          // If cache is empty, proceed with the request
          return next.handle(request);
        })
      );
    }

    // Make the request and cache the response
    return next.handle(request).pipe(
      tap(event => {
        if (event instanceof HttpResponse && event.status === 200) {
          // Cache successful responses with TTL
          this.cache.set(request.url, event.body, this.getCacheTTL(request.url));
        }
      })
    );
  }

  private shouldSkipCache(url: string): boolean {
    // URLs that should not be cached
    const skipPatterns = ['/auth/', '/user/profile', '/real-time/', '/analytics/'];

    return (
      skipPatterns.some(pattern => url.includes(pattern)) ||
      url.includes('timestamp=') ||
      url.includes('nocache=')
    );
  }

  private isCacheExpired(key: string): boolean {
    return !this.cache.has(key) || this.cache.isExpired(key);
  }

  private getCacheTTL(url: string): number {
    // Different TTLs for different types of data
    if (url.includes('/templates/')) {
      return 3600000; // 1 hour for templates
    }

    if (url.includes('/static/') || url.includes('/config/')) {
      return 1800000; // 30 minutes for static content
    }

    if (url.includes('/cards/')) {
      return 300000; // 5 minutes for card data
    }

    return 600000; // 10 minutes default
  }
}
