import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingService {
  private errorSubject = new BehaviorSubject<AppError | null>(null);
  error$: Observable<AppError | null> = this.errorSubject.asObservable();

  /**
   * Handle and categorize an error
   */
  handleError(error: unknown, context?: string): AppError {
    const appError = this.createAppError(error, context);
    console.error(`[${context || 'ErrorHandlingService'}]`, appError);
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
        code: (error as any).code,
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

    if (error && typeof error === 'object' && 'message' in error) {
      return {
        type: ErrorType.UNKNOWN,
        message: String((error as any).message),
        code: (error as any).code,
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
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as any).message);
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
}

