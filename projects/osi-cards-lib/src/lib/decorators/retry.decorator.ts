/**
 * Retry Logic Decorators
 *
 * Provides decorators for automatic retry logic with configurable
 * strategies, backoff, and error handling.
 *
 * Features:
 * - Exponential backoff
 * - Custom retry conditions
 * - Maximum attempts
 * - Delay configuration
 * - Error callbacks
 *
 * @example
 * ```typescript
 * import { Retry, RetryAsync } from '@osi-cards/decorators';
 *
 * class ApiService {
 *   @RetryAsync({ attempts: 3, delay: 1000, backoff: 2 })
 *   async fetchData(id: string) {
 *     return await this.http.get(`/api/data/${id}`);
 *   }
 *
 *   @Retry({ attempts: 5 })
 *   processData(data: any) {
 *     // May throw, will retry up to 5 times
 *     return this.transform(data);
 *   }
 * }
 * ```
 */

/**
 * Retry options
 */
export interface RetryDecoratorOptions {
  /**
   * Number of retry attempts
   * Default: 3
   */
  attempts?: number;

  /**
   * Initial delay in milliseconds
   * Default: 1000
   */
  delay?: number;

  /**
   * Exponential backoff multiplier
   * Default: 2
   */
  backoff?: number;

  /**
   * Maximum delay in milliseconds
   * Default: 30000
   */
  maxDelay?: number;

  /**
   * Function to determine if error should be retried
   * Default: all errors are retryable
   */
  shouldRetry?: (error: any, attempt: number) => boolean;

  /**
   * Callback before each retry
   */
  onRetry?: (attempt: number, error: any) => void;

  /**
   * Callback when all retries fail
   */
  onFailure?: (error: any, attempts: number) => void;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry decorator for synchronous methods
 *
 * Automatically retries method if it throws an error.
 *
 * @param options - Retry options
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * class Parser {
 *   @Retry({ attempts: 3 })
 *   parseJSON(text: string): any {
 *     return JSON.parse(text);
 *   }
 * }
 * ```
 */
export function Retry(options: RetryDecoratorOptions = {}): MethodDecorator {
  const { attempts = 3, shouldRetry = () => true, onRetry, onFailure } = options;

  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      let lastError: any;

      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          return originalMethod.apply(this, args);
        } catch (error) {
          lastError = error;

          // Check if we should retry
          if (attempt === attempts || !shouldRetry(error, attempt)) {
            if (onFailure) {
              onFailure(error, attempt);
            }
            throw error;
          }

          // Call onRetry callback
          if (onRetry) {
            onRetry(attempt, error);
          }
        }
      }

      throw lastError;
    };

    return descriptor;
  };
}

/**
 * Retry decorator for async methods
 *
 * Automatically retries async method with exponential backoff.
 *
 * @param options - Retry options
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * class DataService {
 *   @RetryAsync({ attempts: 3, delay: 1000, backoff: 2 })
 *   async loadData(id: string): Promise<Data> {
 *     return await this.api.fetch(id);
 *   }
 * }
 * ```
 */
export function RetryAsync(options: RetryDecoratorOptions = {}): MethodDecorator {
  const {
    attempts = 3,
    delay = 1000,
    backoff = 2,
    maxDelay = 30000,
    shouldRetry = () => true,
    onRetry,
    onFailure,
  } = options;

  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      let lastError: any;
      let currentDelay = delay;

      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error;

          // Check if we should retry
          if (attempt === attempts || !shouldRetry(error, attempt)) {
            if (onFailure) {
              onFailure(error, attempt);
            }
            throw error;
          }

          // Call onRetry callback
          if (onRetry) {
            onRetry(attempt, error);
          }

          // Wait before retrying
          await sleep(currentDelay);

          // Calculate next delay with exponential backoff
          currentDelay = Math.min(currentDelay * backoff, maxDelay);
        }
      }

      throw lastError;
    };

    return descriptor;
  };
}

/**
 * Retry with specific error types
 *
 * Only retries if error matches specified types.
 *
 * @param errorTypes - Array of error constructors to retry
 * @param options - Additional retry options
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * @RetryOn([NetworkError, TimeoutError], { attempts: 5 })
 * async fetchData() {
 *   return await this.api.get('/data');
 * }
 * ```
 */
export function RetryOn(
  errorTypes: Array<new (...args: any[]) => Error>,
  options: RetryDecoratorOptions = {}
): MethodDecorator {
  return RetryAsync({
    ...options,
    shouldRetry: (error: any, attempt: number) => {
      const matchesType = errorTypes.some((ErrorType) => error instanceof ErrorType);
      const originalCheck = options.shouldRetry?.(error, attempt) ?? true;
      return matchesType && originalCheck;
    },
  });
}

/**
 * Retry except for specific error types
 *
 * Retries all errors except those matching specified types.
 *
 * @param errorTypes - Array of error constructors to NOT retry
 * @param options - Additional retry options
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * @RetryExcept([ValidationError, AuthError])
 * async saveData(data: any) {
 *   return await this.api.post('/data', data);
 * }
 * ```
 */
export function RetryExcept(
  errorTypes: Array<new (...args: any[]) => Error>,
  options: RetryDecoratorOptions = {}
): MethodDecorator {
  return RetryAsync({
    ...options,
    shouldRetry: (error: any, attempt: number) => {
      const matchesType = errorTypes.some((ErrorType) => error instanceof ErrorType);
      const originalCheck = options.shouldRetry?.(error, attempt) ?? true;
      return !matchesType && originalCheck;
    },
  });
}

/**
 * Retry with HTTP status codes
 *
 * Retries based on HTTP response status codes.
 *
 * @param retryCodes - Array of status codes to retry (default: [408, 429, 500, 502, 503, 504])
 * @param options - Additional retry options
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * @RetryOnStatus([429, 503])
 * async fetchData() {
 *   return await this.http.get('/api/data');
 * }
 * ```
 */
export function RetryOnStatus(
  retryCodes: number[] = [408, 429, 500, 502, 503, 504],
  options: RetryDecoratorOptions = {}
): MethodDecorator {
  return RetryAsync({
    ...options,
    shouldRetry: (error: any, attempt: number) => {
      const statusCode = error?.status || error?.statusCode;
      const shouldRetryCode = statusCode && retryCodes.includes(statusCode);
      const originalCheck = options.shouldRetry?.(error, attempt) ?? true;
      return shouldRetryCode && originalCheck;
    },
  });
}

/**
 * Retry with linear backoff
 *
 * Uses linear delay increase instead of exponential.
 *
 * @param delay - Initial delay
 * @param increment - Delay increment per retry
 * @param options - Additional options
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * @RetryLinear(1000, 500) // 1s, 1.5s, 2s, ...
 * async operation() {
 *   return await this.doWork();
 * }
 * ```
 */
export function RetryLinear(
  delay: number,
  increment: number,
  options: Omit<RetryDecoratorOptions, 'delay' | 'backoff'> = {}
): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const {
      attempts = 3,
      maxDelay = 30000,
      shouldRetry = () => true,
      onRetry,
      onFailure,
    } = options;

    descriptor.value = async function (...args: any[]) {
      let lastError: any;
      let currentDelay = delay;

      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error;

          if (attempt === attempts || !shouldRetry(error, attempt)) {
            if (onFailure) {
              onFailure(error, attempt);
            }
            throw error;
          }

          if (onRetry) {
            onRetry(attempt, error);
          }

          await sleep(currentDelay);
          currentDelay = Math.min(currentDelay + increment, maxDelay);
        }
      }

      throw lastError;
    };

    return descriptor;
  };
}

/**
 * Retry immediately (no delay)
 *
 * @param attempts - Number of attempts
 * @param options - Additional options
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * @RetryImmediate(5)
 * readFile(path: string) {
 *   // May throw, retries immediately
 * }
 * ```
 */
export function RetryImmediate(
  attempts: number,
  options: Omit<RetryDecoratorOptions, 'attempts' | 'delay' | 'backoff'> = {}
): MethodDecorator {
  return Retry({
    ...options,
    attempts,
  });
}



