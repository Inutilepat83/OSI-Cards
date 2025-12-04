/**
 * Error Boundary Utilities
 *
 * Provides utilities for implementing error boundaries in Angular components.
 * Helps catch and handle errors gracefully without breaking the UI.
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class MyComponent {
 *   errorBoundary = useErrorBoundary({
 *     onError: (error) => console.error('Caught:', error),
 *     fallback: 'Something went wrong'
 *   });
 * }
 * ```
 *
 * @module utils/error-boundary
 */

import { signal, computed, Signal } from '@angular/core';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Error boundary state
 */
export interface ErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: Signal<boolean>;
  /** The error that occurred */
  error: Signal<Error | null>;
  /** Error message */
  errorMessage: Signal<string>;
  /** Number of times the boundary has caught errors */
  errorCount: Signal<number>;
  /** Whether the boundary is in recovery mode */
  isRecovering: Signal<boolean>;
  /** Reset the error state */
  reset: () => void;
  /** Capture an error */
  captureError: (error: Error) => void;
  /** Try to recover from error */
  recover: () => Promise<void>;
  /** Wrap a function with error handling */
  wrap: <T>(fn: () => T) => T | null;
  /** Wrap an async function with error handling */
  wrapAsync: <T>(fn: () => Promise<T>) => Promise<T | null>;
}

/**
 * Error boundary options
 */
export interface ErrorBoundaryOptions {
  /** Callback when error is caught */
  onError?: (error: Error) => void;
  /** Callback when recovery is attempted */
  onRecover?: () => void;
  /** Callback when error is reset */
  onReset?: () => void;
  /** Maximum number of errors before giving up */
  maxErrors?: number;
  /** Recovery delay in milliseconds */
  recoveryDelayMs?: number;
  /** Default error message */
  defaultMessage?: string;
}

// ============================================================================
// ERROR BOUNDARY HOOK
// ============================================================================

/**
 * Create an error boundary state for a component
 *
 * @param options - Error boundary options
 * @returns Error boundary state object
 *
 * @example
 * ```typescript
 * const boundary = useErrorBoundary({
 *   onError: (error) => logger.error(error),
 *   maxErrors: 3
 * });
 *
 * // Use in template
 * @if (boundary.hasError()) {
 *   <error-display [message]="boundary.errorMessage()" />
 * } @else {
 *   <my-content />
 * }
 *
 * // Wrap risky operations
 * const result = boundary.wrap(() => riskyOperation());
 * ```
 */
export function useErrorBoundary(options: ErrorBoundaryOptions = {}): ErrorBoundaryState {
  const {
    onError,
    onRecover,
    onReset,
    maxErrors = 5,
    recoveryDelayMs = 1000,
    defaultMessage = 'An error occurred',
  } = options;

  const _error = signal<Error | null>(null);
  const _errorCount = signal(0);
  const _isRecovering = signal(false);

  const hasError = computed(() => _error() !== null);
  const errorMessage = computed(() => _error()?.message ?? defaultMessage);

  const captureError = (error: Error) => {
    _error.set(error);
    _errorCount.update((c) => c + 1);
    onError?.(error);
  };

  const reset = () => {
    _error.set(null);
    _isRecovering.set(false);
    onReset?.();
  };

  const recover = async () => {
    if (_errorCount() >= maxErrors) {
      return; // Don't recover if max errors reached
    }

    _isRecovering.set(true);
    onRecover?.();

    await new Promise((resolve) => setTimeout(resolve, recoveryDelayMs));

    _error.set(null);
    _isRecovering.set(false);
  };

  const wrap = <T>(fn: () => T): T | null => {
    try {
      return fn();
    } catch (e) {
      captureError(e instanceof Error ? e : new Error(String(e)));
      return null;
    }
  };

  const wrapAsync = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    try {
      return await fn();
    } catch (e) {
      captureError(e instanceof Error ? e : new Error(String(e)));
      return null;
    }
  };

  return {
    hasError,
    error: _error.asReadonly(),
    errorMessage,
    errorCount: _errorCount.asReadonly(),
    isRecovering: _isRecovering.asReadonly(),
    reset,
    captureError,
    recover,
    wrap,
    wrapAsync,
  };
}

// ============================================================================
// ERROR HELPERS
// ============================================================================

/**
 * Safe try-catch wrapper that returns a result tuple
 *
 * @param fn - Function to execute
 * @returns Tuple of [result, error]
 */
export function tryCatch<T>(fn: () => T): [T | null, Error | null] {
  try {
    return [fn(), null];
  } catch (e) {
    return [null, e instanceof Error ? e : new Error(String(e))];
  }
}

/**
 * Async try-catch wrapper that returns a result tuple
 *
 * @param fn - Async function to execute
 * @returns Promise of tuple [result, error]
 */
export async function tryCatchAsync<T>(fn: () => Promise<T>): Promise<[T | null, Error | null]> {
  try {
    return [await fn(), null];
  } catch (e) {
    return [null, e instanceof Error ? e : new Error(String(e))];
  }
}

/**
 * Create a safe version of a function that catches errors
 *
 * @param fn - Function to wrap
 * @param fallback - Fallback value on error
 * @param onError - Error callback
 * @returns Safe function
 */
export function createSafeFunction<T extends (...args: any[]) => any>(
  fn: T,
  fallback: ReturnType<T>,
  onError?: (error: Error) => void
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    try {
      return fn(...args);
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      onError?.(error);
      return fallback;
    }
  }) as T;
}

/**
 * Create a safe async version of a function that catches errors
 *
 * @param fn - Async function to wrap
 * @param fallback - Fallback value on error
 * @param onError - Error callback
 * @returns Safe async function
 */
export function createSafeAsyncFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  fallback: Awaited<ReturnType<T>>,
  onError?: (error: Error) => void
): T {
  return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    try {
      return await fn(...args);
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      onError?.(error);
      return fallback;
    }
  }) as T;
}

// ============================================================================
// ERROR CLASSIFICATION
// ============================================================================

/**
 * Error severity levels
 */
export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

/**
 * Classified error information
 */
export interface ClassifiedError {
  originalError: Error;
  severity: ErrorSeverity;
  category: string;
  isRecoverable: boolean;
  userMessage: string;
  technicalMessage: string;
}

/**
 * Classify an error by type and determine recovery strategy
 *
 * @param error - Error to classify
 * @returns Classified error information
 */
export function classifyError(error: Error): ClassifiedError {
  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      originalError: error,
      severity: 'error',
      category: 'network',
      isRecoverable: true,
      userMessage: 'Network error. Please check your connection.',
      technicalMessage: error.message,
    };
  }

  // Timeout errors
  if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
    return {
      originalError: error,
      severity: 'warning',
      category: 'timeout',
      isRecoverable: true,
      userMessage: 'The operation timed out. Please try again.',
      technicalMessage: error.message,
    };
  }

  // Validation errors
  if (error.name === 'ValidationError' || error.message.includes('validation')) {
    return {
      originalError: error,
      severity: 'warning',
      category: 'validation',
      isRecoverable: false,
      userMessage: 'Invalid data provided.',
      technicalMessage: error.message,
    };
  }

  // Permission errors
  if (error.name === 'PermissionDenied' || error.message.includes('permission')) {
    return {
      originalError: error,
      severity: 'error',
      category: 'permission',
      isRecoverable: false,
      userMessage: 'You do not have permission to perform this action.',
      technicalMessage: error.message,
    };
  }

  // Syntax/parsing errors
  if (error instanceof SyntaxError) {
    return {
      originalError: error,
      severity: 'error',
      category: 'parsing',
      isRecoverable: false,
      userMessage: 'Invalid data format received.',
      technicalMessage: error.message,
    };
  }

  // Type errors (often programming errors)
  if (error instanceof TypeError) {
    return {
      originalError: error,
      severity: 'error',
      category: 'type',
      isRecoverable: false,
      userMessage: 'An unexpected error occurred.',
      technicalMessage: error.message,
    };
  }

  // Reference errors (programming errors)
  if (error instanceof ReferenceError) {
    return {
      originalError: error,
      severity: 'fatal',
      category: 'reference',
      isRecoverable: false,
      userMessage: 'An unexpected error occurred.',
      technicalMessage: error.message,
    };
  }

  // Default classification
  return {
    originalError: error,
    severity: 'error',
    category: 'unknown',
    isRecoverable: true,
    userMessage: 'An error occurred. Please try again.',
    technicalMessage: error.message,
  };
}

// ============================================================================
// RETRY UTILITIES
// ============================================================================

/**
 * Retry options
 */
export interface RetryOptions {
  /** Maximum number of retries */
  maxRetries?: number;
  /** Delay between retries in milliseconds */
  delayMs?: number;
  /** Exponential backoff multiplier */
  backoffMultiplier?: number;
  /** Maximum delay in milliseconds */
  maxDelayMs?: number;
  /** Function to determine if error is retryable */
  shouldRetry?: (error: Error, attempt: number) => boolean;
  /** Callback on each retry attempt */
  onRetry?: (error: Error, attempt: number) => void;
}

/**
 * Execute a function with retry logic
 *
 * @param fn - Function to execute
 * @param options - Retry options
 * @returns Result of the function
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    maxDelayMs = 30000,
    shouldRetry = () => true,
    onRetry,
  } = options;

  let lastError: Error;
  let currentDelay = delayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));

      if (attempt >= maxRetries || !shouldRetry(lastError, attempt)) {
        throw lastError;
      }

      onRetry?.(lastError, attempt + 1);

      await new Promise((resolve) => setTimeout(resolve, currentDelay));
      currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelayMs);
    }
  }

  throw lastError!;
}

// ============================================================================
// ERROR AGGREGATION
// ============================================================================

/**
 * Aggregate multiple errors into one
 */
export class AggregateError extends Error {
  constructor(
    public readonly errors: Error[],
    message?: string
  ) {
    super(message ?? `${errors.length} errors occurred`);
    this.name = 'AggregateError';
  }
}

/**
 * Execute multiple promises and collect all errors
 *
 * @param promises - Promises to execute
 * @returns Results and any errors
 */
export async function executeWithErrors<T>(
  promises: Promise<T>[]
): Promise<{ results: T[]; errors: Error[] }> {
  const results: T[] = [];
  const errors: Error[] = [];

  const outcomes = await Promise.allSettled(promises);

  for (const outcome of outcomes) {
    if (outcome.status === 'fulfilled') {
      results.push(outcome.value);
    } else {
      errors.push(
        outcome.reason instanceof Error ? outcome.reason : new Error(String(outcome.reason))
      );
    }
  }

  return { results, errors };
}
