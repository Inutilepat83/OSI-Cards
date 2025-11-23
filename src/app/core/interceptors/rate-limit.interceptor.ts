import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, mergeMap, retryWhen } from 'rxjs/operators';
import { LoggingService } from '../services/logging.service';

/**
 * Token bucket algorithm for rate limiting
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly capacity: number,
    private readonly refillRate: number, // tokens per second
    private readonly refillInterval: number = 1000 // ms
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  /**
   * Try to consume a token
   * @returns true if token was consumed, false if rate limit exceeded
   */
  tryConsume(): boolean {
    this.refill();
    
    if (this.tokens >= 1) {
      this.tokens--;
      return true;
    }
    
    return false;
  }

  /**
   * Get time until next token is available (in ms)
   */
  getTimeUntilNextToken(): number {
    this.refill();
    
    if (this.tokens >= 1) {
      return 0;
    }
    
    const tokensNeeded = 1 - this.tokens;
    return Math.ceil((tokensNeeded / this.refillRate) * this.refillInterval);
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    
    if (elapsed >= this.refillInterval) {
      const tokensToAdd = Math.floor((elapsed / this.refillInterval) * this.refillRate);
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  capacity: number; // Maximum tokens in bucket
  refillRate: number; // Tokens per second
  enabled?: boolean;
  retryAfterHeader?: string; // Header name for retry-after (default: 'Retry-After')
}

/**
 * Default rate limit configuration
 */
const DEFAULT_CONFIG: RateLimitConfig = {
  capacity: 10,
  refillRate: 2, // 2 requests per second
  enabled: true,
  retryAfterHeader: 'Retry-After'
};

/**
 * Rate limiting HTTP interceptor
 * Implements token bucket algorithm to limit API call rate
 */
@Injectable()
export class RateLimitInterceptor implements HttpInterceptor {
  private readonly logger = inject(LoggingService);
  private readonly buckets = new Map<string, TokenBucket>();
  private config: RateLimitConfig = DEFAULT_CONFIG;

  /**
   * Configure rate limiting
   */
  configure(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.info('Rate limiting configured', 'RateLimitInterceptor', this.config);
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!this.config.enabled) {
      return next.handle(request);
    }

    const bucket = this.getBucket(request.url);
    
    if (!bucket.tryConsume()) {
      const waitTime = bucket.getTimeUntilNextToken();
      const error = new HttpErrorResponse({
        error: 'Rate limit exceeded',
        status: 429,
        statusText: 'Too Many Requests',
        headers: request.headers.set(this.config.retryAfterHeader || 'Retry-After', String(Math.ceil(waitTime / 1000)))
      });

      this.logger.warn(
        `Rate limit exceeded for ${request.url}. Retry after ${waitTime}ms`,
        'RateLimitInterceptor'
      );

      // Retry after wait time
      return timer(waitTime).pipe(
        mergeMap(() => {
          if (bucket.tryConsume()) {
            return next.handle(request);
          }
          return throwError(() => error);
        })
      );
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 429 responses from server
        if (error.status === 429) {
          const retryAfter = error.headers.get(this.config.retryAfterHeader || 'Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 1000;
          
          this.logger.warn(
            `Server rate limit exceeded. Retry after ${waitTime}ms`,
            'RateLimitInterceptor'
          );

          return timer(waitTime).pipe(
            mergeMap(() => next.handle(request))
          );
        }

        return throwError(() => error);
      })
    );
  }

  /**
   * Get or create token bucket for a URL pattern
   */
  private getBucket(url: string): TokenBucket {
    // Use domain as bucket key
    let key: string;
    try {
      const urlObj = new URL(url);
      key = urlObj.origin;
    } catch {
      // If URL parsing fails, use full URL
      key = url;
    }

    if (!this.buckets.has(key)) {
      this.buckets.set(key, new TokenBucket(this.config.capacity, this.config.refillRate));
    }

    return this.buckets.get(key)!;
  }
}



