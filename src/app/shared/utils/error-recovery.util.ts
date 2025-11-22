/**
 * Error recovery utilities
 * Implements retry mechanisms and fallback strategies for failed operations
 */

export interface ErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
  fallback?: () => any;
}

/**
 * Recover from error with retry and fallback
 */
export async function recoverFromError<T>(
  fn: () => Promise<T>,
  options: ErrorRecoveryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
    onRetry,
    fallback
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (attempt < maxRetries && shouldRetry(lastError)) {
        if (onRetry) {
          onRetry(attempt + 1, lastError);
        }

        const delay = retryDelay * Math.pow(backoffMultiplier, attempt);
        await sleep(delay);
        continue;
      }

      // If we have a fallback, use it
      if (fallback) {
        try {
          return await Promise.resolve(fallback());
        } catch (fallbackError) {
          // Fallback also failed, throw original error
          throw lastError;
        }
      }

      // No more retries and no fallback, throw error
      throw lastError;
    }
  }

  throw lastError || new Error('Recovery failed');
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error): boolean {
  // Network errors are usually retryable
  if (error.message.includes('network') || error.message.includes('timeout')) {
    return true;
  }

  // 5xx errors are retryable
  if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
    return true;
  }

  // 4xx errors (except 400, 401, 403) might be retryable
  if (error.message.includes('429')) {
    return true; // Rate limit
  }

  return false;
}

/**
 * Create error recovery wrapper
 */
export function createErrorRecoveryWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: ErrorRecoveryOptions = {}
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return recoverFromError(() => fn(...args), options);
  }) as T;
}


