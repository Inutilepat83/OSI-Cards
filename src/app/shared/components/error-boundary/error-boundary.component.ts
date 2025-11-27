import { Component, ErrorHandler, inject, Input, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorHandlingService } from '../../../core/services/error-handling.service';
import { LoggingService } from '../../../core/services/logging.service';
import { ApplicationError } from '../../../core/models/error.model';

/**
 * Error Boundary Component
 * 
 * Catches errors in child components and displays a fallback UI instead of
 * crashing the entire application. Implements Angular's error handling pattern
 * to prevent cascading failures.
 * 
 * Features:
 * - Catches component errors and displays fallback UI
 * - Logs errors with full context
 * - Provides error recovery options
 * - Prevents error propagation to parent components
 * 
 * @example
 * ```html
 * <app-error-boundary [fallbackMessage]="'Something went wrong'">
 *   <app-potentially-unsafe-component></app-potentially-unsafe-component>
 * </app-error-boundary>
 * ```
 */
@Component({
  selector: 'app-error-boundary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="!hasError; else errorTemplate">
      <ng-content></ng-content>
    </ng-container>
    
    <ng-template #errorTemplate>
      <div class="error-boundary" role="alert">
        <div class="error-boundary-content">
          <div class="error-icon">⚠️</div>
          <h3 class="error-title">{{ errorTitle }}</h3>
          <p class="error-message">{{ errorMessage }}</p>
          <div class="error-actions" *ngIf="showRecovery">
            <button 
              type="button" 
              class="recovery-button"
              (click)="handleRetry()"
              [attr.aria-label]="'Retry operation'">
              Retry
            </button>
            <button 
              type="button" 
              class="recovery-button secondary"
              (click)="handleReset()"
              [attr.aria-label]="'Reset component'">
              Reset
            </button>
          </div>
          <details class="error-details" *ngIf="showDetails && error">
            <summary>Technical Details</summary>
            <pre class="error-stack">{{ error.stack || error.message }}</pre>
          </details>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    .error-boundary {
      padding: 2rem;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 0.5rem;
      margin: 1rem 0;
    }

    .error-boundary-content {
      text-align: center;
    }

    .error-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .error-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--card-text-primary, #FFFFFF);
      margin-bottom: 0.5rem;
    }

    .error-message {
      color: var(--card-text-secondary, #B8C5D6);
      margin-bottom: 1.5rem;
    }

    .error-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .recovery-button {
      padding: 0.5rem 1rem;
      background: var(--color-brand, #FF7900);
      color: white;
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      font-size: 0.875rem;
      transition: opacity 0.2s;
    }

    .recovery-button:hover {
      opacity: 0.9;
    }

    .recovery-button.secondary {
      background: transparent;
      border: 1px solid var(--color-brand, #FF7900);
      color: var(--color-brand, #FF7900);
    }

    .error-details {
      margin-top: 1rem;
      text-align: left;
    }

    .error-details summary {
      cursor: pointer;
      color: var(--card-text-secondary, #B8C5D6);
      margin-bottom: 0.5rem;
    }

    .error-stack {
      background: rgba(0, 0, 0, 0.3);
      padding: 1rem;
      border-radius: 0.375rem;
      overflow-x: auto;
      font-size: 0.75rem;
      color: var(--card-text-secondary, #B8C5D6);
      white-space: pre-wrap;
      word-break: break-all;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorBoundaryComponent implements OnInit, OnDestroy {
  @Input() fallbackMessage = 'An error occurred while rendering this component.';
  @Input() errorTitle = 'Component Error';
  @Input() showRecovery = true;
  @Input() showDetails = false;
  @Input() onError?: (error: Error) => void;
  @Input() onRetry?: () => void;
  @Input() onReset?: () => void;

  hasError = false;
  error: Error | null = null;
  errorMessage = '';

  private readonly errorHandler = inject(ErrorHandler);
  private readonly errorHandlingService = inject(ErrorHandlingService);
  private readonly logger = inject(LoggingService);
  private readonly cdr = inject(ChangeDetectorRef);
  private originalErrorHandler?: (error: Error, stackTrace?: string) => void;

  ngOnInit(): void {
    // Store original error handler
    if (this.errorHandler && typeof (this.errorHandler as { handleError?: unknown }).handleError === 'function') {
      this.originalErrorHandler = (this.errorHandler as { handleError: (error: Error, stackTrace?: string) => void }).handleError.bind(this.errorHandler);
      
      // Override error handler to catch errors
      (this.errorHandler as { handleError: (error: Error, stackTrace?: string) => void }).handleError = (error: Error, stackTrace?: string) => {
        this.handleError(error, stackTrace);
      };
    }
  }

  ngOnDestroy(): void {
    // Restore original error handler
    if (this.originalErrorHandler && this.errorHandler) {
      (this.errorHandler as { handleError: (error: Error, stackTrace?: string) => void }).handleError = this.originalErrorHandler;
    }
  }

  /**
   * Handle error caught by boundary
   */
  private handleError(error: Error, stackTrace?: string): void {
    this.hasError = true;
    this.error = error;
    this.errorMessage = this.fallbackMessage;

    // Create application error for logging
    const appError = this.errorHandlingService.handleApplicationError(error, 'ErrorBoundaryComponent');
    this.errorMessage = appError.userAction || this.fallbackMessage;

    // Log error with full context
    this.logger.error(
      `Error boundary caught error: ${error.message}`,
      'ErrorBoundaryComponent',
      {
        error: appError,
        stack: stackTrace || error.stack,
        component: 'ErrorBoundaryComponent'
      }
    );

    // Call custom error handler if provided
    if (this.onError) {
      try {
        this.onError(error);
      } catch (handlerError) {
        this.logger.error(
          'Error in custom error handler',
          'ErrorBoundaryComponent',
          handlerError
        );
      }
    }

    this.cdr.markForCheck();
  }

  /**
   * Handle retry action
   */
  handleRetry(): void {
    this.hasError = false;
    this.error = null;
    this.errorMessage = '';

    if (this.onRetry) {
      try {
        this.onRetry();
      } catch (error) {
        this.logger.error(
          'Error in retry handler',
          'ErrorBoundaryComponent',
          error
        );
        this.handleError(error instanceof Error ? error : new Error(String(error)));
      }
    }

    this.cdr.markForCheck();
  }

  /**
   * Handle reset action
   */
  handleReset(): void {
    this.hasError = false;
    this.error = null;
    this.errorMessage = '';

    if (this.onReset) {
      try {
        this.onReset();
      } catch (error) {
        this.logger.error(
          'Error in reset handler',
          'ErrorBoundaryComponent',
          error
        );
        this.handleError(error instanceof Error ? error : new Error(String(error)));
      }
    }

    this.cdr.markForCheck();
  }
}


