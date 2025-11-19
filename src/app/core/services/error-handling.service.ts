import { Injectable } from '@angular/core';
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
}

