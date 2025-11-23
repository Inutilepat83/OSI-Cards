import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError, timer } from 'rxjs';
import { retry, retryWhen, delayWhen, take, catchError, mergeMap } from 'rxjs/operators';
import { LoggingService } from './logging.service';

export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: unknown;
  retryable?: boolean;
  timestamp: number;
  retryCount?: number;
  maxRetries?: number;
}

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

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingService {
  private readonly logger = inject(LoggingService);
  private errorSubject = new BehaviorSubject<AppError | null>(null);
  private fallbackStrategies: FallbackStrategy[] = [];
  error$: Observable<AppError | null> = this.errorSubject.asObservable();

  constructor() {
    this.setupDefaultFallbacks();
  }

  /**
   * Handle and categorize an error
   */
  handleError(error: unknown, context?: string): AppError {
    const appError = this.createAppError(error, context);
    this.logger.error(`Error in ${context || 'ErrorHandlingService'}`, context || 'ErrorHandlingService', appError);
    this.errorSubject.next(appError);
    return appError;
  }

  /**
   * Create an AppError from various error types
   */
  private createAppError(error: unknown, context?: string): AppError {
    if (error instanceof Error) {
      return {
        type: this.categorizeError(error),
        message: error.message,
        code: this.extractErrorCode(error),
        details: { stack: error.stack, context },
        retryable: this.isRetryable(error),
        timestamp: Date.now()
      };
    }

    if (typeof error === 'string') {
      return {
        type: ErrorType.UNKNOWN,
        message: error,
        details: { context },
        retryable: false,
        timestamp: Date.now()
      };
    }

    if (this.isErrorWithMessage(error)) {
      return {
        type: ErrorType.UNKNOWN,
        message: this.normalizeMessage(error.message),
        code: this.normalizeCode(error.code),
        details: { original: error, context },
        retryable: false,
        timestamp: Date.now()
      };
    }

    return {
      type: ErrorType.UNKNOWN,
      message: 'An unknown error occurred',
      details: { original: error, context },
      retryable: false,
      timestamp: Date.now()
    };
  }

  /**
   * Categorize error type based on error properties
   */
  private categorizeError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (name.includes('network') || name.includes('http') || message.includes('network') || message.includes('fetch')) {
      return ErrorType.NETWORK;
    }

    if (name.includes('validation') || name.includes('invalid') || message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }

    if (message.includes('business') || message.includes('logic')) {
      return ErrorType.BUSINESS_LOGIC;
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * Determine if error is retryable
   */
  private isRetryable(error: Error): boolean {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Network errors are usually retryable
    if (name.includes('network') || name.includes('timeout') || message.includes('network') || message.includes('timeout')) {
      return true;
    }

    // Validation errors are not retryable
    if (name.includes('validation') || message.includes('validation')) {
      return false;
    }

    // Default: unknown errors are not retryable
    return false;
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
    this.errorSubject.next(null);
  }

  /**
   * Get current error
   */
  getCurrentError(): AppError | null {
    return this.errorSubject.value;
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
        const appError = this.createAppError(error);
        return appError.type === ErrorType.NETWORK;
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
        const appError = this.createAppError(error);
        return appError.retryable ?? false;
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

            const appError = this.createAppError(error);
            appError.retryCount = retryCount;
            appError.maxRetries = maxRetries;
            this.errorSubject.next(appError);

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
        const appError = this.createAppError(error);
        this.errorSubject.next(appError);
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
  ): AppError {
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

