import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ErrorHandler,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';

/**
 * Error boundary component for catching and displaying component-level errors
 * Enhanced to catch async errors and provide recovery strategies
 *
 * @example
 * ```html
 * <app-error-boundary>
 *   <app-my-component></app-my-component>
 * </app-error-boundary>
 * ```
 */
@Component({
  selector: 'app-error-boundary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="hasError" class="error-boundary" role="alert" [attr.aria-live]="'assertive'">
      <div class="error-boundary-content">
        <div class="error-icon">⚠️</div>
        <div class="error-details">
          <h3 class="error-title">Something went wrong</h3>
          <p class="error-message">{{ errorMessage }}</p>
          <div class="error-actions">
            <button type="button" class="retry-button" (click)="retry()" aria-label="Retry loading">
              Retry
            </button>
            <button
              type="button"
              class="dismiss-button"
              (click)="dismiss()"
              aria-label="Dismiss error"
            >
              Dismiss
            </button>
          </div>
          <details *ngIf="errorDetails" class="error-details-expandable">
            <summary>Technical Details</summary>
            <pre class="error-stack">{{ errorDetails }}</pre>
          </details>
        </div>
      </div>
    </div>
    <ng-content *ngIf="!hasError"></ng-content>
  `,
  styles: [
    `
      .error-boundary {
        padding: 2rem;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 0.5rem;
        margin: 1rem 0;
      }

      .error-boundary-content {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
      }

      .error-icon {
        font-size: 2rem;
        flex-shrink: 0;
      }

      .error-details {
        flex: 1;
      }

      .error-title {
        margin: 0 0 0.5rem 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #ef4444;
      }

      .error-message {
        margin: 0 0 1rem 0;
        color: var(--card-text-secondary, #b8c5d6);
        font-size: 0.875rem;
      }

      .retry-button {
        padding: 0.5rem 1rem;
        background: var(--color-brand, #ff7900);
        color: white;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .retry-button:hover {
        opacity: 0.9;
      }

      .error-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
      }

      .dismiss-button {
        padding: 0.5rem 1rem;
        background: transparent;
        color: var(--card-text-secondary, #b8c5d6);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 0.375rem;
        font-size: 0.875rem;
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .dismiss-button:hover {
        opacity: 0.8;
      }

      .error-details-expandable {
        margin-top: 1rem;
        padding: 0.5rem;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 0.25rem;
      }

      .error-details-expandable summary {
        cursor: pointer;
        font-size: 0.75rem;
        color: var(--card-text-secondary, #b8c5d6);
        margin-bottom: 0.5rem;
      }

      .error-stack {
        font-size: 0.7rem;
        color: var(--card-text-secondary, #b8c5d6);
        white-space: pre-wrap;
        word-break: break-all;
        margin: 0;
        padding: 0.5rem;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 0.25rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorBoundaryComponent implements OnInit, OnDestroy {
  private readonly errorHandler = inject(ErrorHandler);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  hasError = false;
  errorMessage = 'An unexpected error occurred.';
  errorDetails: string | null = null;
  errorCount = 0;
  private readonly maxRetries = 3;

  ngOnInit(): void {
    // Catch unhandled promise rejections (async errors)
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);

    // Catch global errors
    window.addEventListener('error', this.handleGlobalError);
  }

  ngOnDestroy(): void {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('error', this.handleGlobalError);
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle error from child components
   * @param error - The error to handle
   * @param recoveryStrategy - Optional recovery strategy ('reload' | 'reset' | 'ignore')
   */
  handleError(error: Error, recoveryStrategy: 'reload' | 'reset' | 'ignore' = 'reset'): void {
    this.errorCount++;
    this.hasError = true;
    this.errorMessage = error.message || 'An unexpected error occurred.';
    this.errorDetails = error.stack || null;

    // Apply recovery strategy
    switch (recoveryStrategy) {
      case 'reload':
        if (this.errorCount <= this.maxRetries) {
          setTimeout(() => this.retry(), 1000);
        }
        break;
      case 'ignore':
        // Just log, don't show error
        this.errorHandler.handleError(error);
        this.hasError = false;
        return;
      case 'reset':
      default:
        // Default: show error, allow manual retry
        break;
    }

    this.errorHandler.handleError(error);
    this.cdr.markForCheck();
  }

  /**
   * Handle unhandled promise rejections (async errors)
   */
  private handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    this.handleError(error, 'reset');
    event.preventDefault(); // Prevent default browser error handling
  };

  /**
   * Handle global errors
   */
  private handleGlobalError = (event: ErrorEvent): void => {
    const error =
      event.error instanceof Error ? event.error : new Error(event.message || 'Unknown error');
    this.handleError(error, 'reset');
    event.preventDefault(); // Prevent default browser error handling
  };

  /**
   * Retry after error
   */
  retry(): void {
    if (this.errorCount > this.maxRetries) {
      // Too many retries, reload page
      window.location.reload();
      return;
    }

    this.hasError = false;
    this.errorMessage = '';
    this.errorDetails = null;
    this.cdr.markForCheck();
  }

  /**
   * Dismiss error without retry
   */
  dismiss(): void {
    this.hasError = false;
    this.errorMessage = '';
    this.errorDetails = null;
    this.errorCount = 0;
    this.cdr.markForCheck();
  }
}
