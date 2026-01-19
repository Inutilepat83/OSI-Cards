/**
 * Retry Policy Service
 *
 * Provides configurable retry logic for HTTP requests and other async operations.
 * Supports exponential backoff, circuit breaker patterns, and custom retry strategies.
 *
 * @dependencies
 * - None (uses RxJS operators for retry logic)
 *
 * @example
 * ```typescript
 * import { RetryPolicyService, RetryConfig } from 'osi-cards-lib';
 *
 * @Injectable()
 * export class MyDataService {
 *   private retryPolicy = inject(RetryPolicyService);
 *
 *   async fetchData(): Promise<Data> {
 *     return this.retryPolicy.withRetry(
 *       () => this.http.get<Data>('/api/data').toPromise(),
 *       { maxRetries: 3, backoffMs: 1000 }
 *     );
 *   }
 * }
 * ```
 *
 * @module services/retry-policy
 */

import { Injectable, computed, signal } from '@angular/core';
import { Observable, throwError, timer } from 'rxjs';
import { mergeMap, retryWhen, tap } from 'rxjs/operators';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Retry configuration options
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries: number;
  /** Base delay between retries in milliseconds (default: 1000) */
  backoffMs: number;
  /** Exponential backoff multiplier (default: 2) */
  backoffMultiplier: number;
  /** Maximum delay cap in milliseconds (default: 30000) */
  maxBackoffMs: number;
  /** Add jitter to prevent thundering herd (default: true) */
  jitter: boolean;
  /** Jitter range as percentage of delay (default: 0.25) */
  jitterFactor: number;
  /** Retry only on specific error types/codes */
  retryOn?: RetryPredicate;
  /** Don't retry on specific error types/codes */
  noRetryOn?: RetryPredicate;
  /** Callback before each retry attempt */
  onRetry?: RetryCallback;
  /** Callback when all retries exhausted */
  onExhausted?: ExhaustedCallback;
}

/**
 * Predicate to determine if an error should trigger retry
 */
export type RetryPredicate = (error: Error, attempt: number) => boolean;

/**
 * Callback invoked before each retry attempt
 */
export type RetryCallback = (error: Error, attempt: number, delayMs: number) => void;

/**
 * Callback invoked when all retries are exhausted
 */
export type ExhaustedCallback = (error: Error, totalAttempts: number) => void;

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  backoffMs: 1000,
  backoffMultiplier: 2,
  maxBackoffMs: 30000,
  jitter: true,
  jitterFactor: 0.25,
};

/**
 * Retry state for monitoring
 */
export interface RetryState {
  /** Current operation being retried (if any) */
  currentOperation: string | null;
  /** Number of retries attempted */
  retryCount: number;
  /** Total operations that required retries */
  totalRetriedOperations: number;
  /** Total successful retries */
  successfulRetries: number;
  /** Total exhausted retries (all attempts failed) */
  exhaustedRetries: number;
  /** Last error encountered */
  lastError: Error | null;
  /** Last retry timestamp */
  lastRetryTime: number | null;
}

// ============================================================================
// PREDEFINED PREDICATES
// ============================================================================

/**
 * Retry on network errors (fetch failures, timeouts)
 */
export function isNetworkError(error: Error): boolean {
  return (
    error.name === 'TypeError' ||
    error.message.includes('network') ||
    error.message.includes('fetch') ||
    error.message.includes('timeout') ||
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('ETIMEDOUT')
  );
}

/**
 * Retry on HTTP status codes (5xx server errors, 429 rate limiting)
 */
export function isRetryableHttpError(error: Error & { status?: number }): boolean {
  const status = error.status;
  if (typeof status !== 'number') return false;

  // Retry on 429 (rate limited) or 5xx (server errors)
  return status === 429 || (status >= 500 && status < 600);
}

/**
 * Never retry (always returns false)
 */
export function neverRetry(): boolean {
  return false;
}

/**
 * Always retry (always returns true)
 */
export function alwaysRetry(): boolean {
  return true;
}

/**
 * Retry only for specific error types
 */
export function retryOnErrorTypes(...types: string[]): RetryPredicate {
  return (error: Error) => types.includes(error.name);
}

/**
 * Don't retry for specific error types
 */
export function noRetryOnErrorTypes(...types: string[]): RetryPredicate {
  return (error: Error) => !types.includes(error.name);
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: 'root',
})
export class RetryPolicyService {
  // State tracking
  private readonly _state = signal<RetryState>({
    currentOperation: null,
    retryCount: 0,
    totalRetriedOperations: 0,
    successfulRetries: 0,
    exhaustedRetries: 0,
    lastError: null,
    lastRetryTime: null,
  });

  /** Current retry state */
  public readonly state = this._state.asReadonly();

  /** Whether any operation is currently being retried */
  public readonly isRetrying = computed(() => this._state().currentOperation !== null);

  // ============================================================================
  // PROMISE-BASED RETRY
  // ============================================================================

  /**
   * Execute a function with retry logic (Promise-based)
   *
   * @param fn - Function to execute (should return a Promise)
   * @param config - Retry configuration
   * @param operationName - Name for tracking/logging
   * @returns Result of the function
   *
   * @example
   * ```typescript
   * const result = await retryPolicy.withRetry(
   *   () => fetch('/api/data').then(r => r.json()),
   *   { maxRetries: 3 },
   *   'fetchData'
   * );
   * ```
   */
  async withRetry<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    operationName?: string
  ): Promise<T> {
    const mergedConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: Error;
    let currentDelay = mergedConfig.backoffMs;

    // Track operation
    this._state.update((s) => ({
      ...s,
      currentOperation: operationName ?? null,
      retryCount: 0,
    }));

    for (let attempt = 0; attempt <= mergedConfig.maxRetries; attempt++) {
      try {
        const result = await fn();

        // Success - update state
        if (attempt > 0) {
          this._state.update((s) => ({
            ...s,
            currentOperation: null,
            successfulRetries: s.successfulRetries + 1,
            totalRetriedOperations: s.totalRetriedOperations + 1,
          }));
        } else {
          this._state.update((s) => ({ ...s, currentOperation: null }));
        }

        return result;
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));

        // Update state
        this._state.update((s) => ({
          ...s,
          retryCount: attempt + 1,
          lastError,
          lastRetryTime: Date.now(),
        }));

        // Check if we should retry
        if (attempt >= mergedConfig.maxRetries) {
          break;
        }

        // Check retry predicate
        if (mergedConfig.retryOn && !mergedConfig.retryOn(lastError, attempt)) {
          break;
        }

        // Check no-retry predicate
        if (mergedConfig.noRetryOn && mergedConfig.noRetryOn(lastError, attempt)) {
          break;
        }

        // Calculate delay with jitter
        const delay = this.calculateDelay(currentDelay, mergedConfig);

        // Invoke retry callback
        mergedConfig.onRetry?.(lastError, attempt + 1, delay);

        // Wait before retry
        await this.sleep(delay);

        // Increase delay for next attempt
        currentDelay = Math.min(
          currentDelay * mergedConfig.backoffMultiplier,
          mergedConfig.maxBackoffMs
        );
      }
    }

    // All retries exhausted
    this._state.update((s) => ({
      ...s,
      currentOperation: null,
      exhaustedRetries: s.exhaustedRetries + 1,
      totalRetriedOperations: s.totalRetriedOperations + 1,
    }));

    mergedConfig.onExhausted?.(lastError!, mergedConfig.maxRetries + 1);
    throw lastError!;
  }

  // ============================================================================
  // OBSERVABLE-BASED RETRY
  // ============================================================================

  /**
   * Create a retry operator for RxJS observables
   *
   * @param config - Retry configuration
   * @param operationName - Name for tracking/logging
   * @returns RxJS operator function
   *
   * @example
   * ```typescript
   * this.http.get('/api/data').pipe(
   *   retryPolicy.retryOperator({ maxRetries: 3 }, 'fetchData')
   * );
   * ```
   */
  retryOperator<T>(config: Partial<RetryConfig> = {}, operationName?: string) {
    const mergedConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

    return (source: Observable<T>): Observable<T> => {
      let currentDelay = mergedConfig.backoffMs;
      let attempt = 0;

      return source.pipe(
        retryWhen((errors) =>
          errors.pipe(
            mergeMap((error) => {
              attempt++;

              // Update state
              this._state.update((s) => ({
                ...s,
                currentOperation: operationName ?? null,
                retryCount: attempt,
                lastError: error,
                lastRetryTime: Date.now(),
              }));

              // Check if max retries reached
              if (attempt > mergedConfig.maxRetries) {
                this._state.update((s) => ({
                  ...s,
                  currentOperation: null,
                  exhaustedRetries: s.exhaustedRetries + 1,
                  totalRetriedOperations: s.totalRetriedOperations + 1,
                }));
                mergedConfig.onExhausted?.(error, attempt);
                return throwError(() => error);
              }

              // Check retry predicate
              if (mergedConfig.retryOn && !mergedConfig.retryOn(error, attempt - 1)) {
                return throwError(() => error);
              }

              // Check no-retry predicate
              if (mergedConfig.noRetryOn && mergedConfig.noRetryOn(error, attempt - 1)) {
                return throwError(() => error);
              }

              // Calculate delay
              const delayMs = this.calculateDelay(currentDelay, mergedConfig);

              // Invoke callback
              mergedConfig.onRetry?.(error, attempt, delayMs);

              // Update delay for next attempt
              currentDelay = Math.min(
                currentDelay * mergedConfig.backoffMultiplier,
                mergedConfig.maxBackoffMs
              );

              // Return timer for delay
              return timer(delayMs);
            })
          )
        ),
        tap({
          next: () => {
            if (attempt > 0) {
              this._state.update((s) => ({
                ...s,
                currentOperation: null,
                successfulRetries: s.successfulRetries + 1,
                totalRetriedOperations: s.totalRetriedOperations + 1,
              }));
            }
          },
        })
      );
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Create a default retry predicate for HTTP errors
   */
  httpRetryPredicate(): RetryPredicate {
    return (error: Error) => isNetworkError(error) || isRetryableHttpError(error as any);
  }

  /**
   * Create a retry config for API calls
   */
  apiRetryConfig(overrides: Partial<RetryConfig> = {}): RetryConfig {
    return {
      ...DEFAULT_RETRY_CONFIG,
      maxRetries: 3,
      backoffMs: 500,
      retryOn: this.httpRetryPredicate(),
      ...overrides,
    };
  }

  /**
   * Create a retry config for critical operations (more attempts, longer delays)
   */
  criticalRetryConfig(overrides: Partial<RetryConfig> = {}): RetryConfig {
    return {
      ...DEFAULT_RETRY_CONFIG,
      maxRetries: 5,
      backoffMs: 2000,
      maxBackoffMs: 60000,
      ...overrides,
    };
  }

  /**
   * Reset retry statistics
   */
  resetStats(): void {
    this._state.set({
      currentOperation: null,
      retryCount: 0,
      totalRetriedOperations: 0,
      successfulRetries: 0,
      exhaustedRetries: 0,
      lastError: null,
      lastRetryTime: null,
    });
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private calculateDelay(baseDelay: number, config: RetryConfig): number {
    if (!config.jitter) {
      return baseDelay;
    }

    // Add jitter: delay * (1 - jitterFactor/2 + random * jitterFactor)
    const jitterRange = baseDelay * config.jitterFactor;
    const jitter = (Math.random() - 0.5) * jitterRange;

    return Math.max(0, Math.round(baseDelay + jitter));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
