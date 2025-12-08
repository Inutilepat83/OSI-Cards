/**
 * Rate Limiter Service
 *
 * Implements rate limiting for API calls and user actions.
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class MyComponent {
 *   private rateLimiter = inject(RateLimiterService);
 *
 *   makeApiCall() {
 *     if (this.rateLimiter.allowRequest('api-call')) {
 *       // Make API call
 *     } else {
 *       // Show rate limit error
 *     }
 *   }
 * }
 * ```
 */

import { Injectable } from '@angular/core';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
}

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

@Injectable({
  providedIn: 'root',
})
export class RateLimiterService {
  private limits = new Map<string, RateLimitConfig>();
  private requests = new Map<string, number[]>();

  /**
   * Configure rate limit for a key
   */
  configure(key: string, config: RateLimitConfig): void {
    this.limits.set(key, config);
  }

  /**
   * Check if request is allowed
   */
  allowRequest(key: string): boolean {
    return this.checkLimit(key).allowed;
  }

  /**
   * Check rate limit status
   */
  checkLimit(key: string): RateLimitStatus {
    const config = this.limits.get(key) || {
      maxRequests: 100,
      windowMs: 60000, // 1 minute
    };

    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get recent requests
    let recentRequests = this.requests.get(key) || [];

    // Remove old requests
    recentRequests = recentRequests.filter((time) => time > windowStart);

    // Update stored requests
    this.requests.set(key, recentRequests);

    // Check if limit exceeded
    const allowed = recentRequests.length < config.maxRequests;

    if (allowed) {
      // Record this request
      recentRequests.push(now);
      this.requests.set(key, recentRequests);
    }

    // Calculate reset time
    const oldestRequest = recentRequests[0] || now;
    const resetAt = oldestRequest + config.windowMs;

    return {
      allowed,
      remaining: Math.max(0, config.maxRequests - recentRequests.length),
      resetAt,
      retryAfter: allowed ? undefined : resetAt - now,
    };
  }

  /**
   * Get rate limit headers (for HTTP responses)
   */
  getRateLimitHeaders(key: string): Record<string, string> {
    const status = this.checkLimit(key);

    return {
      'X-RateLimit-Limit': String(this.limits.get(key)?.maxRequests || 100),
      'X-RateLimit-Remaining': String(status.remaining),
      'X-RateLimit-Reset': String(status.resetAt),
      ...(status.retryAfter && {
        'Retry-After': String(Math.ceil(status.retryAfter / 1000)),
      }),
    };
  }

  /**
   * Reset rate limit for key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.requests.clear();
  }

  /**
   * Get all rate limit statuses
   */
  getAllStatuses(): Record<string, RateLimitStatus> {
    const statuses: Record<string, RateLimitStatus> = {};

    this.limits.forEach((_, key) => {
      statuses[key] = this.checkLimit(key);
    });

    return statuses;
  }

  /**
   * Cleanup old entries periodically
   */
  startCleanup(intervalMs = 300000): void {
    setInterval(() => {
      const now = Date.now();

      this.requests.forEach((requests, key) => {
        const config = this.limits.get(key);
        if (config) {
          const windowStart = now - config.windowMs;
          const filtered = requests.filter((time) => time > windowStart);

          if (filtered.length === 0) {
            this.requests.delete(key);
          } else {
            this.requests.set(key, filtered);
          }
        }
      });
    }, intervalMs);
  }
}

/**
 * Default rate limit configurations
 */
export const DEFAULT_RATE_LIMITS = {
  'api-call': {
    maxRequests: 100,
    windowMs: 60000, // 100 requests per minute
    message: 'Too many API calls. Please try again later.',
  },
  authentication: {
    maxRequests: 5,
    windowMs: 300000, // 5 attempts per 5 minutes
    message: 'Too many login attempts. Please try again later.',
  },
  search: {
    maxRequests: 30,
    windowMs: 60000, // 30 searches per minute
    message: 'Too many search requests.',
  },
  export: {
    maxRequests: 10,
    windowMs: 600000, // 10 exports per 10 minutes
    message: 'Too many export requests.',
  },
  upload: {
    maxRequests: 20,
    windowMs: 3600000, // 20 uploads per hour
    message: 'Upload limit reached.',
  },
};



