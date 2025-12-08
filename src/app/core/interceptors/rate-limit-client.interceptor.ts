/**
 * Client-side Rate Limiting Interceptor
 *
 * Prevents excessive API calls from the client.
 */

import { inject, Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { RateLimiterService } from '../services/rate-limiter.service';

@Injectable()
export class RateLimitClientInterceptor implements HttpInterceptor {
  private rateLimiter = inject(RateLimiterService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Extract endpoint key
    const key = this.getEndpointKey(req.url);

    // Check rate limit
    const status = this.rateLimiter.checkLimit(key);

    if (!status.allowed) {
      // Rate limit exceeded
      const error = new HttpErrorResponse({
        error: { message: 'Rate limit exceeded' },
        headers: req.headers,
        status: 429,
        statusText: 'Too Many Requests',
        url: req.url,
      });

      console.warn(`[RateLimit] Blocked request to ${req.url}`);
      console.warn(`[RateLimit] Retry after ${status.retryAfter}ms`);

      return throwError(() => error);
    }

    return next.handle(req);
  }

  /**
   * Extract endpoint key from URL
   */
  private getEndpointKey(url: string): string {
    try {
      const urlObj = new URL(url);
      // Use pathname as key
      return `api${urlObj.pathname}`;
    } catch {
      return 'api-call';
    }
  }
}



