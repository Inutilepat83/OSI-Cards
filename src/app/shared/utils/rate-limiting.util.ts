/**
 * Rate limiting utilities
 * Implements rate limiting for API calls and user actions
 */

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Rate limiter class
 */
export class RateLimiter {
  private requests: number[] = [];

  constructor(private readonly options: RateLimitOptions) {}

  /**
   * Check if request is allowed
   */
  check(): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    // Remove old requests outside the window
    this.requests = this.requests.filter(timestamp => timestamp > windowStart);

    // Check if we're at the limit
    if (this.requests.length >= this.options.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const resetAt = oldestRequest + this.options.windowMs;
      return {
        allowed: false,
        remaining: 0,
        resetAt
      };
    }

    // Record this request
    this.requests.push(now);

    return {
      allowed: true,
      remaining: this.options.maxRequests - this.requests.length,
      resetAt: now + this.options.windowMs
    };
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.requests = [];
  }

  /**
   * Get current request count
   */
  getCurrentCount(): number {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;
    this.requests = this.requests.filter(timestamp => timestamp > windowStart);
    return this.requests.length;
  }
}

/**
 * Create a rate-limited function
 */
export function createRateLimitedFunction<T extends (...args: any[]) => any>(
  fn: T,
  options: RateLimitOptions
): T & { rateLimiter: RateLimiter } {
  const rateLimiter = new RateLimiter(options);

  const limited = ((...args: Parameters<T>): ReturnType<T> | null => {
    const result = rateLimiter.check();
    if (!result.allowed) {
      throw new Error(`Rate limit exceeded. Try again after ${new Date(result.resetAt).toISOString()}`);
    }
    return fn(...args);
  }) as T & { rateLimiter: RateLimiter };

  limited.rateLimiter = rateLimiter;

  return limited;
}


