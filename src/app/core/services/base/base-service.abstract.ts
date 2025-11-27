import { Injectable, OnDestroy, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoggingService } from '../logging.service';
import { IBaseService, IErrorHandlingService, ILoggingService } from './base-service.interface';

/**
 * Abstract base service class
 * Provides common functionality for all services:
 * - Lifecycle management
 * - Error handling
 * - Logging
 * - Resource cleanup
 */
@Injectable()
export abstract class BaseService implements IBaseService, IErrorHandlingService, ILoggingService, OnDestroy {
  protected readonly logger = inject(LoggingService);
  protected readonly destroyRef = inject(DestroyRef);
  
  protected readonly errorHistory: Error[] = [];
  protected readonly maxErrorHistory = 100;

  /**
   * Initialize the service
   * Override in subclasses to perform initialization
   */
  initialize?(): void | Promise<void> {
    // Default: no initialization needed
  }

  /**
   * Handle an error
   */
  handleError(error: Error, context?: string): void {
    const errorWithContext = new Error(
      context ? `[${context}] ${error.message}` : error.message
    );
    errorWithContext.stack = error.stack;

    this.errorHistory.push(errorWithContext);
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory.shift();
    }

    this.logger.error(error.message, context || this.constructor.name, error);
  }

  /**
   * Get error history
   */
  getErrorHistory(): Error[] {
    return [...this.errorHistory];
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: string, data?: unknown): void {
    this.logger.debug(message, context || this.constructor.name, data);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: string, data?: unknown): void {
    this.logger.info(message, context || this.constructor.name, data);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: string, data?: unknown): void {
    this.logger.warn(message, context || this.constructor.name, data);
  }

  /**
   * Log an error message
   */
  error(message: string, context?: string, data?: unknown): void {
    this.logger.error(message, context || this.constructor.name, data);
  }

  /**
   * Clean up resources
   * Override in subclasses to perform cleanup
   */
  ngOnDestroy(): void {
    // Default: no cleanup needed
  }

  /**
   * Helper to use takeUntilDestroyed in observables
   */
  protected get takeUntilDestroyed() {
    return takeUntilDestroyed(this.destroyRef);
  }
}



