/**
 * Request Deduplication Utility
 *
 * Prevents duplicate HTTP requests by caching pending requests and
 * sharing the same observable for identical requests.
 *
 * Useful for:
 * - Preventing duplicate API calls
 * - Sharing pending requests
 * - Reducing server load
 * - Improving performance
 *
 * @example
 * ```typescript
 * import { RequestDeduplicator } from '@osi-cards/utils';
 *
 * class MyService {
 *   private deduplicator = new RequestDeduplicator();
 *
 *   loadData(id: string) {
 *     return this.deduplicator.deduplicate(
 *       `loadData-${id}`,
 *       () => this.http.get(`/api/data/${id}`)
 *     );
 *   }
 * }
 * ```
 */

import { Observable, share, finalize } from 'rxjs';

/**
 * Configuration options for request deduplication
 */
export interface DeduplicationOptions {
  /**
   * How long to cache the request in milliseconds
   * Default: No timeout (cache until complete)
   */
  cacheTimeout?: number;

  /**
   * Whether to share replay (emit last value to new subscribers)
   * Default: false
   */
  shareReplay?: boolean;

  /**
   * Number of values to replay if shareReplay is true
   * Default: 1
   */
  replayCount?: number;
}

/**
 * Request Deduplicator
 *
 * Manages pending requests and prevents duplicates by caching
 * observables for identical request keys.
 */
export class RequestDeduplicator {
  private pendingRequests = new Map<string, Observable<any>>();
  private timeouts = new Map<string, ReturnType<typeof setTimeout>>();

  /**
   * Deduplicate a request by key
   *
   * If a request with the same key is already pending, returns the
   * existing observable. Otherwise, executes the request factory.
   *
   * @param key - Unique identifier for the request
   * @param requestFactory - Function that creates the observable
   * @param options - Deduplication options
   * @returns Observable that will emit the request result
   *
   * @example
   * ```typescript
   * const result$ = deduplicator.deduplicate(
   *   'user-123',
   *   () => http.get('/api/users/123')
   * );
   * ```
   */
  deduplicate<T>(
    key: string,
    requestFactory: () => Observable<T>,
    options: DeduplicationOptions = {}
  ): Observable<T> {
    // Check if request is already pending
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending as Observable<T>;
    }

    // Create new request
    const request$ = requestFactory().pipe(
      share(), // Share among multiple subscribers
      finalize(() => {
        // Clean up when complete
        this.pendingRequests.delete(key);

        // Clear timeout if exists
        const timeout = this.timeouts.get(key);
        if (timeout) {
          clearTimeout(timeout);
          this.timeouts.delete(key);
        }
      })
    );

    // Cache the request
    this.pendingRequests.set(key, request$);

    // Set timeout if specified
    if (options.cacheTimeout && options.cacheTimeout > 0) {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(key);
        this.timeouts.delete(key);
      }, options.cacheTimeout);

      this.timeouts.set(key, timeout);
    }

    return request$;
  }

  /**
   * Check if a request is pending
   *
   * @param key - Request key to check
   * @returns True if request is pending
   */
  isPending(key: string): boolean {
    return this.pendingRequests.has(key);
  }

  /**
   * Cancel a pending request
   *
   * Removes the request from cache. Note: this doesn't cancel
   * the actual HTTP request, just prevents sharing.
   *
   * @param key - Request key to cancel
   * @returns True if request was found and cancelled
   */
  cancel(key: string): boolean {
    const timeout = this.timeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(key);
    }

    return this.pendingRequests.delete(key);
  }

  /**
   * Cancel all pending requests
   *
   * Clears all cached requests and timeouts.
   */
  cancelAll(): void {
    // Clear all timeouts
    this.timeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });

    this.timeouts.clear();
    this.pendingRequests.clear();
  }

  /**
   * Get count of pending requests
   *
   * @returns Number of currently pending requests
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Get all pending request keys
   *
   * @returns Array of request keys
   */
  getPendingKeys(): string[] {
    return Array.from(this.pendingRequests.keys());
  }

  /**
   * Clear specific request from cache
   *
   * @param key - Request key to clear
   */
  clear(key: string): void {
    this.cancel(key);
  }

  /**
   * Clear all cached requests
   */
  clearAll(): void {
    this.cancelAll();
  }
}

/**
 * Global request deduplicator instance
 *
 * Use this for simple cases where you don't need multiple instances.
 *
 * @example
 * ```typescript
 * import { globalDeduplicator } from '@osi-cards/utils';
 *
 * const data$ = globalDeduplicator.deduplicate(
 *   'my-request',
 *   () => http.get('/api/data')
 * );
 * ```
 */
export const globalDeduplicator = new RequestDeduplicator();

/**
 * Decorator for automatic request deduplication
 *
 * Automatically deduplicates method calls that return observables.
 * Uses method name and stringified arguments as the cache key.
 *
 * @param options - Deduplication options
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * class MyService {
 *   @Deduplicate()
 *   loadUser(id: string): Observable<User> {
 *     return this.http.get(`/api/users/${id}`);
 *   }
 * }
 * ```
 */
export function Deduplicate(options: DeduplicationOptions = {}): MethodDecorator {
  const deduplicator = new RequestDeduplicator();

  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const key = `${String(propertyKey)}-${JSON.stringify(args)}`;
      return deduplicator.deduplicate(key, () => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
}

/**
 * Create a request deduplicator with custom options
 *
 * @param defaultOptions - Default options for all requests
 * @returns New RequestDeduplicator instance
 *
 * @example
 * ```typescript
 * const deduplicator = createDeduplicator({
 *   cacheTimeout: 5000, // 5 seconds
 *   shareReplay: true
 * });
 * ```
 */
export function createDeduplicator(defaultOptions: DeduplicationOptions = {}): RequestDeduplicator {
  const deduplicator = new RequestDeduplicator();

  // Wrap deduplicate to apply default options
  const originalDeduplicate = deduplicator.deduplicate.bind(deduplicator);
  deduplicator.deduplicate = function <T>(
    key: string,
    requestFactory: () => Observable<T>,
    options: DeduplicationOptions = {}
  ) {
    return originalDeduplicate(key, requestFactory, {
      ...defaultOptions,
      ...options,
    });
  };

  return deduplicator;
}
