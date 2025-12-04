/**
 * Error Boundary Component
 *
 * Provides error boundary functionality for Angular components,
 * catching and handling errors in the component tree.
 *
 * Features:
 * - Catches component errors
 * - Custom error UI
 * - Error recovery
 * - Error reporting
 * - Fallback content
 *
 * @example
 * ```html
 * <app-error-boundary
 *   [fallbackUI]="errorTemplate"
 *   (errorCaught)="handleError($event)">
 *   <my-component></my-component>
 * </app-error-boundary>
 * ```
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ErrorHandler,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  OnInit,
  OnDestroy,
  TemplateRef,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';

/**
 * Error boundary error details
 */
export interface ErrorBoundaryError {
  error: Error;
  errorInfo?: any;
  timestamp: number;
  componentStack?: string;
  recovered: boolean;
}

/**
 * Error recovery strategy
 */
export type RecoveryStrategy = 'reload' | 'fallback' | 'retry' | 'ignore';

@Component({
  selector: 'app-error-boundary',
  template: `
    @if (hasError()) {
      <div class="error-boundary" role="alert">
        @if (fallbackUI) {
          <ng-container
            [ngTemplateOutlet]="fallbackUI"
            [ngTemplateOutletContext]="{ error: errorDetails(), retry: retry }"
          >
          </ng-container>
        } @else {
          <div class="error-boundary__default">
            <div class="error-boundary__icon">⚠️</div>
            <h3 class="error-boundary__title">Something went wrong</h3>
            <p class="error-boundary__message">{{ errorDetails()?.error?.message }}</p>
            @if (showDetails()) {
              <details class="error-boundary__details">
                <summary>Error Details</summary>
                <pre>{{ errorDetails()?.error?.stack }}</pre>
              </details>
            }
            @if (recoveryStrategy() !== 'ignore') {
              <div class="error-boundary__actions">
                @if (recoveryStrategy() === 'retry') {
                  <button (click)="retry()" class="error-boundary__button">Try Again</button>
                }
                @if (recoveryStrategy() === 'reload') {
                  <button (click)="reload()" class="error-boundary__button">Reload Page</button>
                }
                <button
                  (click)="reset()"
                  class="error-boundary__button error-boundary__button--secondary"
                >
                  Dismiss
                </button>
              </div>
            }
          </div>
        }
      </div>
    } @else {
      <ng-content></ng-content>
    }
  `,
  styles: [
    `
      .error-boundary {
        padding: 2rem;
        border: 1px solid #f87171;
        border-radius: 0.5rem;
        background-color: #fef2f2;
        color: #991b1b;
      }

      .error-boundary__default {
        text-align: center;
        max-width: 600px;
        margin: 0 auto;
      }

      .error-boundary__icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      .error-boundary__title {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
      }

      .error-boundary__message {
        margin-bottom: 1.5rem;
        color: #7f1d1d;
      }

      .error-boundary__details {
        margin-top: 1rem;
        text-align: left;
      }

      .error-boundary__details pre {
        background: #fff;
        padding: 1rem;
        border-radius: 0.25rem;
        overflow-x: auto;
        font-size: 0.875rem;
      }

      .error-boundary__actions {
        display: flex;
        gap: 0.75rem;
        justify-content: center;
        margin-top: 1.5rem;
      }

      .error-boundary__button {
        padding: 0.5rem 1.5rem;
        border: none;
        border-radius: 0.375rem;
        background-color: #dc2626;
        color: white;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .error-boundary__button:hover {
        background-color: #b91c1c;
      }

      .error-boundary__button--secondary {
        background-color: #6b7280;
      }

      .error-boundary__button--secondary:hover {
        background-color: #4b5563;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule],
})
export class ErrorBoundaryComponent implements OnInit, OnDestroy {
  /**
   * Custom fallback UI template
   */
  @Input() fallbackUI?: TemplateRef<any>;

  /**
   * Recovery strategy
   */
  @Input() recoveryStrategy = signal<RecoveryStrategy>('retry');

  /**
   * Whether to show error details
   */
  @Input() showDetails = signal(false);

  /**
   * Whether to report errors automatically
   */
  @Input() reportErrors = true;

  /**
   * Event emitted when error is caught
   */
  @Output() errorCaught = new EventEmitter<ErrorBoundaryError>();

  /**
   * Event emitted when error is recovered
   */
  @Output() errorRecovered = new EventEmitter<void>();

  /**
   * Current error state
   */
  hasError = signal(false);
  errorDetails = signal<ErrorBoundaryError | null>(null);
  retryCount = signal(0);

  private destroy$ = new Subject<void>();
  private maxRetries = 3;

  ngOnInit(): void {
    // Set up global error handler
    this.setupErrorHandler();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle caught error
   */
  handleError(error: Error, errorInfo?: any): void {
    const errorDetails: ErrorBoundaryError = {
      error,
      errorInfo,
      timestamp: Date.now(),
      componentStack: this.extractComponentStack(errorInfo),
      recovered: false,
    };

    this.hasError.set(true);
    this.errorDetails.set(errorDetails);
    this.errorCaught.emit(errorDetails);

    // Report error if enabled
    if (this.reportErrors) {
      this.reportError(errorDetails);
    }

    // Auto-recovery based on strategy
    this.attemptRecovery();
  }

  /**
   * Retry rendering
   */
  retry(): void {
    if (this.retryCount() >= this.maxRetries) {
      console.warn('Max retries reached');
      return;
    }

    this.retryCount.update((c) => c + 1);
    this.reset();
    this.errorRecovered.emit();
  }

  /**
   * Reset error state
   */
  reset(): void {
    this.hasError.set(false);
    this.errorDetails.set(null);
  }

  /**
   * Reload page
   */
  reload(): void {
    window.location.reload();
  }

  /**
   * Setup error handler
   */
  private setupErrorHandler(): void {
    // This would integrate with Angular's ErrorHandler
    // In practice, you'd use a custom ErrorHandler service
  }

  /**
   * Extract component stack from error info
   */
  private extractComponentStack(errorInfo: any): string | undefined {
    if (errorInfo && errorInfo.componentStack) {
      return errorInfo.componentStack;
    }
    return undefined;
  }

  /**
   * Report error to logging service
   */
  private reportError(error: ErrorBoundaryError): void {
    // In production, send to error tracking service (Sentry, etc.)
    console.error('[ErrorBoundary]', error);
  }

  /**
   * Attempt automatic recovery
   */
  private attemptRecovery(): void {
    const strategy = this.recoveryStrategy();

    switch (strategy) {
      case 'retry':
        // Auto-retry after delay
        setTimeout(() => {
          if (this.retryCount() < this.maxRetries) {
            this.retry();
          }
        }, 1000);
        break;

      case 'reload':
        // Auto-reload after delay
        setTimeout(() => {
          this.reload();
        }, 2000);
        break;

      case 'fallback':
        // Show fallback (default behavior)
        break;

      case 'ignore':
        // Reset immediately
        this.reset();
        break;
    }
  }
}

/**
 * Error boundary configuration
 */
export interface ErrorBoundaryConfig {
  /**
   * Recovery strategy
   */
  strategy?: RecoveryStrategy;

  /**
   * Maximum retry attempts
   */
  maxRetries?: number;

  /**
   * Whether to show error details
   */
  showDetails?: boolean;

  /**
   * Whether to report errors
   */
  reportErrors?: boolean;

  /**
   * Custom error handler
   */
  onError?: (error: ErrorBoundaryError) => void;
}

/**
 * Create error boundary config
 */
export function createErrorBoundaryConfig(
  config: Partial<ErrorBoundaryConfig> = {}
): ErrorBoundaryConfig {
  return {
    strategy: config.strategy || 'fallback',
    maxRetries: config.maxRetries || 3,
    showDetails: config.showDetails ?? false,
    reportErrors: config.reportErrors ?? true,
    onError: config.onError,
  };
}
