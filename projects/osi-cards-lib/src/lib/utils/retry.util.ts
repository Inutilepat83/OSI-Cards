/**
 * Retry Utility
 * 
 * Provides configurable retry mechanisms for async operations.
 * Supports exponential backoff, max retries, and custom error handling.
 * 
 * @example
 * ```typescript
 * import { retryWithBackoff, RetryConfig } from 'osi-cards-lib';
 * 
 * const config: RetryConfig = {
 *   maxRetries: 3,
 *   initialDelayMs: 1000,
 *   backoffMultiplier: 2,
 * };
 * 
 * const result = await retryWithBackoff(
 *   () => fetchData(),
 *   config,
 *   (error, attempt) => console.log(`Retry ${attempt}:`, error)
 * );
 * ```
 */

import { Observable, timer, throwError, of } from 'rxjs';
import { retryWhen, mergeMap, take } from 'rxjs/operators';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay before first retry (ms) */
  initialDelayMs: number;
  /** Maximum delay between retries (ms) */
  maxDelayMs: number;
  /** Multiplier for exponential backoff */
  backoffMultiplier: number;
  /** Whether to add jitter to delay */
  useJitter: boolean;
  /** Function to determine if error is retryable */
  isRetryable?: (error: unknown) => boolean;
}

/**
 * Retry state information
 */
export interface RetryState {
  /** Current attempt number (1-based) */
  attempt: number;
  /** Total elapsed time in ms */
  elapsedMs: number;
  /** Last error encountered */
  lastError?: Error;
  /** Delay before next retry */
  nextDelayMs: number;
  /** Whether max retries reached */
  exhausted: boolean;
}

/**
 * Callback for retry events
 */
export type RetryCallback = (state: RetryState) => void;

/** Default retry configuration */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  useJitter: true,
};

// ============================================================================
// PROMISE-BASED RETRY
// ============================================================================

/**
 * Retry a Promise-returning function with exponential backoff.
 * 
 * @param fn - Async function to retry
 * @param config - Retry configuration
 * @param onRetry - Optional callback for retry events
 * @returns Promise resolving to the function's result
 * @throws Last error if all retries exhausted
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  onRetry?: RetryCallback
): Promise<T> {
  const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const startTime = Date.now();
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= fullConfig.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      if (fullConfig.isRetryable && !fullConfig.isRetryable(error)) {
        throw lastError;
      }

      // Check if we've exhausted retries
      if (attempt > fullConfig.maxRetries) {
        const state: RetryState = {
          attempt,
          elapsedMs: Date.now() - startTime,
          lastError,
          nextDelayMs: 0,
          exhausted: true,
        };
        onRetry?.(state);
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = calculateDelay(attempt, fullConfig);

      const state: RetryState = {
        attempt,
        elapsedMs: Date.now() - startTime,
        lastError,
        nextDelayMs: delay,
        exhausted: false,
      };

      onRetry?.(state);

      // Wait before retrying
      await sleep(delay);
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError ?? new Error('Retry failed');
}

/**
 * Retry a synchronous function with exponential backoff.
 * 
 * @param fn - Function to retry
 * @param config - Retry configuration
 * @param onRetry - Optional callback for retry events
 * @returns Function's result
 * @throws Last error if all retries exhausted
 */
export async function retrySync<T>(
  fn: () => T,
  config: Partial<RetryConfig> = {},
  onRetry?: RetryCallback
): Promise<T> {
  return retryWithBackoff(() => Promise.resolve(fn()), config, onRetry);
}

// ============================================================================
// OBSERVABLE-BASED RETRY
// ============================================================================

/**
 * RxJS operator for retrying Observables with exponential backoff.
 * 
 * @param config - Retry configuration
 * @param onRetry - Optional callback for retry events
 * @returns RxJS pipeable operator
 * 
 * @example
 * ```typescript
 * http.get('/api/data').pipe(
 *   retryWithBackoff$({ maxRetries: 3 })
 * ).subscribe(...)
 * ```
 */
export function retryWithBackoff$(
  config: Partial<RetryConfig> = {},
  onRetry?: RetryCallback
) {
  const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const startTime = Date.now();

  return <T>(source: Observable<T>): Observable<T> => {
    return source.pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error, attempt) => {
            const attemptNum = attempt + 1;

            // Check if error is retryable
            if (fullConfig.isRetryable && !fullConfig.isRetryable(error)) {
              return throwError(() => error);
            }

            // Check if we've exhausted retries
            if (attemptNum > fullConfig.maxRetries) {
              const state: RetryState = {
                attempt: attemptNum,
                elapsedMs: Date.now() - startTime,
                lastError: error instanceof Error ? error : new Error(String(error)),
                nextDelayMs: 0,
                exhausted: true,
              };
              onRetry?.(state);
              return throwError(() => error);
            }

            // Calculate delay
            const delay = calculateDelay(attemptNum, fullConfig);

            const state: RetryState = {
              attempt: attemptNum,
              elapsedMs: Date.now() - startTime,
              lastError: error instanceof Error ? error : new Error(String(error)),
              nextDelayMs: delay,
              exhausted: false,
            };

            onRetry?.(state);

            return timer(delay);
          })
        )
      )
    );
  };
}

// ============================================================================
// CIRCUIT BREAKER PATTERN
// ============================================================================

/**
 * Circuit breaker state
 */
export type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Number of failures to open circuit */
  failureThreshold: number;
  /** Time to wait before trying half-open (ms) */
  resetTimeoutMs: number;
  /** Number of successes to close circuit from half-open */
  successThreshold: number;
}

/**
 * Circuit breaker for preventing repeated failures
 */
export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private successes = 0;
  private lastFailureTime = 0;

  constructor(private readonly config: CircuitBreakerConfig) {}

  /**
   * Execute a function through the circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      // Check if we should try half-open
      if (Date.now() - this.lastFailureTime >= this.config.resetTimeoutMs) {
        this.state = 'half-open';
        this.successes = 0;
      } else {
        throw new CircuitOpenError('Circuit is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Reset the circuit breaker
   */
  reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
  }

  private onSuccess(): void {
    if (this.state === 'half-open') {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        this.state = 'closed';
        this.failures = 0;
      }
    } else {
      this.failures = 0;
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === 'half-open') {
      this.state = 'open';
    } else if (this.failures >= this.config.failureThreshold) {
      this.state = 'open';
    }
  }
}

/**
 * Error thrown when circuit is open
 */
export class CircuitOpenError extends Error {
  constructor(message = 'Circuit breaker is open') {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate delay for a given attempt with exponential backoff
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  // Exponential backoff: initialDelay * (multiplier ^ (attempt - 1))
  let delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);

  // Cap at max delay
  delay = Math.min(delay, config.maxDelayMs);

  // Add jitter if enabled (±25%)
  if (config.useJitter) {
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);
    delay = Math.round(delay + jitter);
  }

  return delay;
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if an error is a network error (retryable)
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('offline') ||
      message.includes('fetch')
    );
  }
  return false;
}

/**
 * Check if an HTTP error is retryable based on status code
 */
export function isRetryableHttpError(error: unknown): boolean {
  // TypeScript workaround for HTTP errors
  const httpError = error as { status?: number };
  if (typeof httpError?.status === 'number') {
    // Retry on 408 (timeout), 429 (rate limit), 500+ (server errors)
    return (
      httpError.status === 408 ||
      httpError.status === 429 ||
      httpError.status >= 500
    );
  }
  return isNetworkError(error);
}







