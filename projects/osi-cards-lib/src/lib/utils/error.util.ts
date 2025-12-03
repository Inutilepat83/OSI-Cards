/**
 * Consolidated Error Utilities
 *
 * Merges functionality from:
 * - error-boundary.util.ts (error boundary utilities)
 * - src/app/shared/utils/error-recovery.util.ts (error recovery)
 * - src/app/shared/utils/error-messages.ts (error messages)
 * - src/app/shared/utils/improved-error-messages.util.ts (improved messages)
 *
 * Provides comprehensive error handling utilities.
 *
 * @example
 * ```typescript
 * import { ErrorUtil } from 'osi-cards-lib';
 *
 * // Error boundary
 * const boundary = ErrorUtil.createBoundary({
 *   onError: (error) => console.error(error),
 *   fallback: () => 'Error occurred'
 * });
 *
 * // Error recovery
 * const result = await ErrorUtil.withRetry(() => fetchData(), {
 *   maxAttempts: 3,
 *   backoff: 'exponential'
 * });
 *
 * // User-friendly messages
 * const message = ErrorUtil.getUserMessage(error);
 * ```
 */

// Re-export from error-boundary.util.ts
export * from './error-boundary.util';

// Additional error utilities

/**
 * Error recovery options
 */
export interface ErrorRecoveryOptions {
  maxAttempts?: number;
  backoff?: 'linear' | 'exponential';
  initialDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: ErrorRecoveryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    backoff = 'exponential',
    initialDelay = 1000,
    onRetry
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxAttempts) {
        const delay = backoff === 'exponential'
          ? initialDelay * Math.pow(2, attempt - 1)
          : initialDelay * attempt;

        onRetry?.(attempt, lastError);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

/**
 * Get user-friendly error message
 */
export function getUserMessage(error: unknown): string {
  if (!error) {
    return 'An unknown error occurred';
  }

  if (error instanceof Error) {
    // Map common error messages to user-friendly versions
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'Unable to connect. Please check your internet connection.';
    }

    if (message.includes('timeout')) {
      return 'The request took too long. Please try again.';
    }

    if (message.includes('unauthorized') || message.includes('401')) {
      return 'You need to sign in to continue.';
    }

    if (message.includes('forbidden') || message.includes('403')) {
      return 'You don\'t have permission to access this resource.';
    }

    if (message.includes('not found') || message.includes('404')) {
      return 'The requested resource was not found.';
    }

    if (message.includes('server') || message.includes('500')) {
      return 'A server error occurred. Please try again later.';
    }

    // Return the original message if no mapping found
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network errors are usually recoverable
    if (message.includes('network') || message.includes('timeout')) {
      return true;
    }

    // Server errors might be temporary
    if (message.includes('500') || message.includes('503')) {
      return true;
    }

    // Client errors are usually not recoverable
    if (message.includes('400') || message.includes('401') || message.includes('403') || message.includes('404')) {
      return false;
    }
  }

  // By default, assume errors are recoverable
  return true;
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical'
}

/**
 * Categorize error severity
 */
export function getErrorSeverity(error: unknown): ErrorSeverity {
  if (!error) {
    return ErrorSeverity.Low;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Critical errors
    if (message.includes('fatal') || message.includes('critical')) {
      return ErrorSeverity.Critical;
    }

    // High severity
    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return ErrorSeverity.High;
    }

    // Medium severity
    if (message.includes('network') || message.includes('timeout')) {
      return ErrorSeverity.Medium;
    }
  }

  return ErrorSeverity.Low;
}

/**
 * Consolidated error utilities namespace
 */
export const ErrorUtil = {
  withRetry,
  getUserMessage,
  isRecoverableError,
  getErrorSeverity,
  ErrorSeverity
};

