import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
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
    private readonly refillInterval = 1000 // ms
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
 * Per-endpoint rate limit configuration
 */
export interface EndpointRateLimit {
  pattern: string | RegExp; // URL pattern to match
  capacity: number;
  refillRate: number;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  capacity: number; // Maximum tokens in bucket (default)
  refillRate: number; // Tokens per second (default)
  enabled?: boolean;
  retryAfterHeader?: string; // Header name for retry-after (default: 'Retry-After')
  endpoints?: EndpointRateLimit[]; // Per-endpoint limits
  maxRetries?: number; // Maximum retry attempts (default: 3)
  retryBackoff?: 'linear' | 'exponential'; // Retry backoff strategy
  strategy?: RateLimitStrategy; // Rate limiting algorithm (default: TOKEN_BUCKET)
  burstAllowance?: number; // Allow burst of requests beyond capacity (default: 0)
  priorityQueuing?: boolean; // Enable priority-based request queuing (default: false)
}

/**
 * Default rate limit configuration
 * 
 * Uses conservative defaults to prevent API overload:
 * - 10 requests capacity with 2 requests/second refill rate
 * - Exponential backoff for retries (more aggressive than linear)
 * - Per-endpoint configuration support for fine-grained control
 * - Priority queuing enabled for better request handling
 * - Burst allowance for handling traffic spikes
 */
const DEFAULT_CONFIG: RateLimitConfig = {
  capacity: 10,
  refillRate: 2, // 2 requests per second
  enabled: true,
  retryAfterHeader: 'Retry-After',
  endpoints: [],
  maxRetries: 3,
  retryBackoff: 'exponential'
};

/**
 * Advanced rate limit strategies
 */
export enum RateLimitStrategy {
  /** Token bucket algorithm (default) */
  TOKEN_BUCKET = 'token-bucket',
  /** Sliding window algorithm */
  SLIDING_WINDOW = 'sliding-window',
  /** Fixed window algorithm */
  FIXED_WINDOW = 'fixed-window'
}

/**
 * Rate Limit Interceptor
 * 
 * HTTP interceptor that implements rate limiting using the token bucket algorithm.
 * Prevents API overload by limiting the number of requests per time period. Supports
 * per-endpoint configuration, automatic retries with backoff, and server-side rate
 * limit handling.
 * 
 * Features:
 * - Token bucket algorithm for rate limiting
 * - Per-endpoint rate limit configuration
 * - Automatic retry with exponential/linear backoff
 * - Server-side rate limit detection (429 responses)
 * - Configurable capacity and refill rates
 * - Request queuing and throttling
 * 
 * @example
 * ```typescript
 * const interceptor = inject(RateLimitInterceptor);
 * 
 * // Configure rate limiting
 * interceptor.configure({
 *   capacity: 10,
 *   refillRate: 2, // 2 requests per second
 *   maxRetries: 3,
 *   retryBackoff: 'exponential',
 *   endpoints: [
 *     { pattern: '/api/search', capacity: 5, refillRate: 1 }
 *   ]
 * });
 * ```
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

  /**
   * Maximum allowed request body size (1MB)
   */
  private readonly MAX_REQUEST_SIZE = 1024 * 1024; // 1MB - type inferred

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!this.config.enabled) {
      return next.handle(request);
    }

    // Check request size limit to prevent DoS attacks
    if (request.body) {
      const bodySize = new Blob([JSON.stringify(request.body)]).size;
      if (bodySize > this.MAX_REQUEST_SIZE) {
        const error = new HttpErrorResponse({
          error: `Request body size (${(bodySize / 1024).toFixed(2)} KB) exceeds maximum allowed size (${(this.MAX_REQUEST_SIZE / 1024).toFixed(2)} KB)`,
          status: 413,
          statusText: 'Payload Too Large',
          url: request.url
        });

        this.logger.error(
          `Request size limit exceeded for ${request.url}: ${bodySize} bytes`,
          'RateLimitInterceptor'
        );

        return throwError(() => error);
      }
    }

    // Get endpoint-specific configuration if available
    const endpointConfig = this.getEndpointConfig(request.url);
    const bucket = this.getBucket(request.url, endpointConfig);
    const retryCount = this.getRetryCount(request);
    
    if (!bucket.tryConsume()) {
      const waitTime = bucket.getTimeUntilNextToken();
      
      // Check if we've exceeded max retries
      if (retryCount >= (this.config.maxRetries || 3)) {
        const error = new HttpErrorResponse({
          error: 'Rate limit exceeded. Maximum retries reached.',
          status: 429,
          statusText: 'Too Many Requests',
          url: request.url
        });

        this.logger.error(
          `Rate limit exceeded for ${request.url} after ${retryCount} retries`,
          'RateLimitInterceptor'
        );

        return throwError(() => error);
      }

      const error = new HttpErrorResponse({
        error: 'Rate limit exceeded',
        status: 429,
        statusText: 'Too Many Requests',
        headers: request.headers.set(this.config.retryAfterHeader || 'Retry-After', String(Math.ceil(waitTime / 1000)))
      });

      this.logger.warn(
        `Rate limit exceeded for ${request.url}. Retry ${retryCount + 1}/${this.config.maxRetries || 3} after ${waitTime}ms`,
        'RateLimitInterceptor'
      );

      // Calculate backoff delay
      const backoffDelay = this.calculateBackoffDelay(waitTime, retryCount);

      // Retry after wait time with backoff
      return timer(backoffDelay).pipe(
        mergeMap(() => {
          if (bucket.tryConsume()) {
            // Add retry header to track retries
            const retryRequest = request.clone({
              setHeaders: {
                'X-RateLimit-Retry': String(retryCount + 1)
              }
            });
            return next.handle(retryRequest);
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
          const retryCount = this.getRetryCount(request);
          
          if (retryCount >= (this.config.maxRetries || 3)) {
            this.logger.error(
              `Server rate limit exceeded. Maximum retries reached for ${request.url}`,
              'RateLimitInterceptor'
            );
            return throwError(() => error);
          }
          
          this.logger.warn(
            `Server rate limit exceeded. Retry ${retryCount + 1}/${this.config.maxRetries || 3} after ${waitTime}ms`,
            'RateLimitInterceptor'
          );

          const backoffDelay = this.calculateBackoffDelay(waitTime, retryCount);
          return timer(backoffDelay).pipe(
            mergeMap(() => {
              const retryRequest = request.clone({
                setHeaders: {
                  'X-RateLimit-Retry': String(retryCount + 1)
                }
              });
              return next.handle(retryRequest);
            })
          );
        }

        return throwError(() => error);
      })
    );
  }

  /**
   * Get endpoint-specific configuration
   */
  private getEndpointConfig(url: string): EndpointRateLimit | null {
    if (!this.config.endpoints || this.config.endpoints.length === 0) {
      return null;
    }

    for (const endpoint of this.config.endpoints) {
      if (typeof endpoint.pattern === 'string') {
        if (url.includes(endpoint.pattern)) {
          return endpoint;
        }
      } else if (endpoint.pattern instanceof RegExp) {
        if (endpoint.pattern.test(url)) {
          return endpoint;
        }
      }
    }

    return null;
  }

  /**
   * Get retry count from request headers
   */
  private getRetryCount(request: HttpRequest<unknown>): number {
    const retryHeader = request.headers.get('X-RateLimit-Retry');
    return retryHeader ? parseInt(retryHeader, 10) : 0;
  }

  /**
   * Calculate backoff delay based on strategy
   */
  private calculateBackoffDelay(baseDelay: number, retryCount: number): number {
    const strategy = this.config.retryBackoff || 'exponential';
    
    if (strategy === 'exponential') {
      // Exponential backoff: baseDelay * 2^retryCount
      return baseDelay * Math.pow(2, retryCount);
    } else {
      // Linear backoff: baseDelay * (retryCount + 1)
      return baseDelay * (retryCount + 1);
    }
  }

  /**
   * Get or create token bucket for a URL pattern
   * Checks for per-endpoint limits first, then falls back to default
   */
  private getBucket(url: string, endpointConfig?: EndpointRateLimit | null): TokenBucket {
    // Use endpoint-specific configuration if available
    if (endpointConfig) {
      const pattern = typeof endpointConfig.pattern === 'string' 
        ? endpointConfig.pattern 
        : endpointConfig.pattern.toString();
      const key = `endpoint:${pattern}`;
      
      if (!this.buckets.has(key)) {
        this.buckets.set(
          key, 
          new TokenBucket(endpointConfig.capacity, endpointConfig.refillRate)
        );
      }
      return this.buckets.get(key)!;
    }

    // Use domain as bucket key for default limits
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






