import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError, timer } from 'rxjs';
import { retryWhen, catchError, mergeMap } from 'rxjs/operators';
import { LoggingService } from './logging.service';
import { 
  ApplicationError, 
  ErrorFactory, 
  ErrorCategory
} from '../models/error.model';

export interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  retryable?: (error: unknown) => boolean;
}

export interface FallbackStrategy<T = unknown> {
  condition: (error: unknown) => boolean;
  fallback: () => T | Promise<T>;
  description?: string;
}

/**
 * Error Handling Service
 * 
 * Comprehensive error handling service with automatic retry logic, fallback strategies,
 * and error categorization. Provides centralized error management for the application.
 * 
 * Features:
 * - Automatic error categorization (Network, Validation, Business Logic, Unknown)
 * - Configurable retry strategies with exponential/linear backoff
 * - Fallback strategy support for graceful degradation
 * - Error observables for reactive error handling
 * - Retryable error detection
 * 
 * @example
 * ```typescript
 * const errorService = inject(ErrorHandlingService);
 * 
 * // Handle error with automatic retry
 * errorService.handleErrorWithRetry(error, {
 *   maxRetries: 3,
 *   delay: 1000,
 *   backoff: 'exponential'
 * });
 * 
 * // Subscribe to errors
 * errorService.error$.subscribe(appError => {
 *   if (appError) {
 *     console.error('Error occurred:', appError);
 *   }
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingService {
  private readonly logger = inject(LoggingService);
  private applicationErrorSubject = new BehaviorSubject<ApplicationError | null>(null);
  private fallbackStrategies: FallbackStrategy[] = [];
  error$: Observable<ApplicationError | null> = this.applicationErrorSubject.asObservable();

  constructor() {
    // Setup default fallbacks in constructor to ensure they're available immediately
    this.setupDefaultFallbacks();
  }

  /**
   * Handle and categorize an error
   * 
   * @param error - Error to handle
   * @param context - Context where error occurred
   * @returns ApplicationError with enhanced information
   */
  handleError(error: unknown, context?: string): ApplicationError {
    const applicationError = this.createApplicationError(error, context);
    this.logger.error(
      `Error in ${context || 'ErrorHandlingService'}: ${applicationError.message}`,
      context || 'ErrorHandlingService',
      {
        category: applicationError.category,
        severity: applicationError.severity,
        code: applicationError.code,
        recoveryStrategy: applicationError.recoveryStrategy,
        userAction: applicationError.userAction,
        details: applicationError.details
      }
    );
    this.applicationErrorSubject.next(applicationError);
    return applicationError;
  }

  /**
   * Handle error using ApplicationError type (alias for handleError for consistency)
   * 
   * @param error - Error to handle
   * @param context - Context where error occurred
   * @returns ApplicationError with enhanced information
   */
  handleApplicationError(error: unknown, context?: string): ApplicationError {
    return this.handleError(error, context);
  }

  /**
   * Create ApplicationError from various error types
   */
  private createApplicationError(error: unknown, context?: string): ApplicationError {
    if (error instanceof Error) {
      // Check for HTTP errors
      if ('status' in error || 'statusCode' in error) {
        const status = ('status' in error ? error.status : error.statusCode) as number;
        return ErrorFactory.networkError(
          error.message || `HTTP ${status} error`,
          {
            statusCode: status,
            originalError: error,
            context
          }
        );
      }

      // Check for validation errors
      if (error.message.includes('validation') || error.message.includes('invalid')) {
        return ErrorFactory.validationError(
          error.message,
          {
            originalError: error,
            context,
            suggestions: this.extractSuggestions(error)
          }
        );
      }

      // Check for security errors
      if (error.message.includes('security') || error.message.includes('unauthorized') || error.message.includes('forbidden')) {
        return ErrorFactory.securityError(
          error.message,
          {
            originalError: error,
            context
          }
        );
      }

      // Default to system error
      return ErrorFactory.systemError(
        error.message,
        {
          originalError: error,
          context
        }
      );
    }

    // Handle string errors
    if (typeof error === 'string') {
      return ErrorFactory.unknownError(error, { context });
    }

    // Handle unknown errors
    return ErrorFactory.unknownError(
      'An unexpected error occurred',
      {
        originalError: error,
        context
      }
    );
  }

  /**
   * Extract suggestions from error message
   */
  private extractSuggestions(error: Error): string[] {
    const suggestions: string[] = [];
    const message = error.message.toLowerCase();

    if (message.includes('required')) {
      suggestions.push('Please ensure all required fields are filled in');
    }
    if (message.includes('format')) {
      suggestions.push('Please check the format of your input');
    }
    if (message.includes('length') || message.includes('too long')) {
      suggestions.push('Please shorten your input');
    }
    if (message.includes('invalid')) {
      suggestions.push('Please check that your input is valid');
    }

    return suggestions;
  }

  /**
   * Extract user-friendly error message
   */
  extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (this.isErrorWithMessage(error)) {
      return this.normalizeMessage(error.message);
    }
    return 'An unknown error occurred';
  }

  /**
   * Clear current error
   */
  clearError(): void {
    this.applicationErrorSubject.next(null);
  }

  /**
   * Get current error
   */
  getCurrentError(): ApplicationError | null {
    return this.applicationErrorSubject.value;
  }

  private isErrorWithMessage(value: unknown): value is { message?: unknown; code?: unknown } {
    return typeof value === 'object' && value !== null && 'message' in value;
  }

  private extractErrorCode(error: Error): string | undefined {
    const candidate = (error as { code?: unknown }).code;
    return this.normalizeCode(candidate);
  }

  private normalizeMessage(message: unknown): string {
    if (typeof message === 'string') {
      return message;
    }
    if (message === undefined || message === null) {
      return 'An unknown error occurred';
    }
    try {
      return JSON.stringify(message);
    } catch {
      return String(message);
    }
  }

  private normalizeCode(code: unknown): string | undefined {
    if (typeof code === 'string') {
      return code;
    }
    if (typeof code === 'number') {
      return code.toString();
    }
    return undefined;
  }

  /**
   * Setup default fallback strategies
   */
  private setupDefaultFallbacks(): void {
    // Network error fallback - return empty data
    this.addFallbackStrategy({
      condition: (error) => {
        const appError = this.createApplicationError(error);
        return appError.category === ErrorCategory.NETWORK;
      },
      fallback: () => {
        this.logger.warn('Network error - using fallback: empty data', 'ErrorHandlingService');
        return null;
      },
      description: 'Return empty data for network errors'
    });

    // Card loading fallback - return empty array
    this.addFallbackStrategy({
      condition: (error) => {
        const message = this.extractErrorMessage(error).toLowerCase();
        return message.includes('card') && (message.includes('load') || message.includes('fetch'));
      },
      fallback: () => {
        this.logger.warn('Card loading error - using fallback: empty array', 'ErrorHandlingService');
        return [];
      },
      description: 'Return empty array for card loading errors'
    });
  }

  /**
   * Add a fallback strategy
   */
  addFallbackStrategy(strategy: FallbackStrategy): void {
    this.fallbackStrategies.push(strategy);
  }

  /**
   * Remove a fallback strategy
   */
  removeFallbackStrategy(index: number): void {
    this.fallbackStrategies.splice(index, 1);
  }

  /**
   * Execute operation with automatic retry
   */
  executeWithRetry<T>(
    operation: () => Observable<T> | Promise<T>,
    options: RetryOptions = {}
  ): Observable<T> {
    const {
      maxRetries = 3,
      delay = 1000,
      backoff = 'exponential',
      retryable = (error) => {
        const appError = this.createApplicationError(error);
        return appError.retryable;
      }
    } = options;

    // Convert operation result to Observable
    const operationResult = operation();
    const operation$ = operationResult instanceof Promise
      ? new Observable<T>(subscriber => {
          operationResult
            .then((value: T) => {
              subscriber.next(value);
              subscriber.complete();
            })
            .catch((error: unknown) => subscriber.error(error));
        })
      : operationResult;

    return operation$.pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error, index) => {
            const retryCount = index + 1;
            
            if (retryCount > maxRetries || !retryable(error)) {
              return throwError(() => error);
            }

            const appError = this.createApplicationError(error);
            this.applicationErrorSubject.next(appError);

            const delayTime = backoff === 'exponential'
              ? delay * Math.pow(2, index)
              : delay * (index + 1);

            this.logger.warn(
              `Retrying operation (${retryCount}/${maxRetries}) after ${delayTime}ms`,
              'ErrorHandlingService',
              { error: appError }
            );

            return timer(delayTime);
          })
        )
      ),
      catchError(error => {
        // Try fallback strategies
        const fallback = this.findFallbackStrategy(error);
        if (fallback) {
          this.logger.info(
            `Using fallback strategy: ${fallback.description || 'unknown'}`,
            'ErrorHandlingService'
          );
          try {
            const fallbackResult = fallback.fallback();
            return fallbackResult instanceof Promise
              ? new Observable<T>(subscriber => {
                  fallbackResult
                    .then(value => {
                      subscriber.next(value as T);
                      subscriber.complete();
                    })
                    .catch(err => subscriber.error(err));
                })
              : of(fallbackResult as T);
          } catch (fallbackError) {
            return throwError(() => fallbackError);
          }
        }

        // No fallback found, throw original error
        const appError = this.createApplicationError(error);
        this.applicationErrorSubject.next(appError);
        return throwError(() => error);
      })
    );
  }

  /**
   * Find matching fallback strategy for an error
   */
  private findFallbackStrategy(error: unknown): FallbackStrategy | undefined {
    return this.fallbackStrategies.find(strategy => strategy.condition(error));
  }

  /**
   * Handle error with recovery attempt
   */
  handleErrorWithRecovery<T>(
    error: unknown,
    context?: string,
    recoveryFn?: () => T | Promise<T>
  ): ApplicationError {
    const appError = this.handleError(error, context);

    if (recoveryFn && appError.retryable) {
      this.logger.info('Attempting error recovery', context || 'ErrorHandlingService');
      try {
        const recoveryResult = recoveryFn();
        if (recoveryResult instanceof Promise) {
          recoveryResult
            .then(() => {
              this.logger.info('Error recovery successful', context || 'ErrorHandlingService');
              this.clearError();
            })
            .catch(recoveryError => {
              this.logger.error('Error recovery failed', context || 'ErrorHandlingService', recoveryError);
            });
        } else {
          this.logger.info('Error recovery successful', context || 'ErrorHandlingService');
          this.clearError();
        }
      } catch (recoveryError) {
        this.logger.error('Error recovery failed', context || 'ErrorHandlingService', recoveryError);
      }
    }

    return appError;
  }
}

