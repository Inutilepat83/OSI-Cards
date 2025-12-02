/**
 * Error Boundary Component
 *
 * Reusable error boundary component that catches errors in child components
 * and displays a fallback UI. Provides retry and reset functionality.
 *
 * @example
 * ```html
 * <osi-error-boundary
 *   [fallbackMessage]="'Something went wrong'"
 *   [showRecovery]="true"
 *   [showDetails]="false"
 *   (errorCaught)="onError($event)"
 *   (retry)="onRetry()"
 *   (reset)="onReset()">
 *   <app-potentially-unsafe-component></app-potentially-unsafe-component>
 * </osi-error-boundary>
 * ```
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { useErrorBoundary, ErrorBoundaryState, classifyError, ClassifiedError } from '../../utils/error-boundary.util';

/**
 * Error event emitted when an error is caught
 */
export interface ErrorBoundaryEvent {
  error: Error;
  classified: ClassifiedError;
  timestamp: Date;
}

@Component({
  selector: 'osi-error-boundary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="!errorState.hasError(); else errorTemplate">
      <ng-content></ng-content>
    </ng-container>

    <ng-template #errorTemplate>
      <div class="osi-error-boundary" role="alert" [attr.aria-live]="'assertive'">
        <div class="osi-error-boundary__content" [class.osi-error-boundary__content--centered]="centered">
          <div class="osi-error-boundary__icon" *ngIf="showIcon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" x2="12" y1="9" y2="13"/>
              <line x1="12" x2="12.01" y1="17" y2="17"/>
            </svg>
          </div>

          <h3 class="osi-error-boundary__title">{{ errorTitle }}</h3>
          <p class="osi-error-boundary__message">{{ displayMessage() }}</p>

          <div class="osi-error-boundary__actions" *ngIf="showRecovery">
            <button
              type="button"
              class="osi-error-boundary__button osi-error-boundary__button--primary"
              (click)="handleRetry()"
              [disabled]="errorState.isRecovering()"
              [attr.aria-label]="'Retry operation'">
              {{ errorState.isRecovering() ? 'Retrying...' : 'Retry' }}
            </button>
            <button
              type="button"
              class="osi-error-boundary__button osi-error-boundary__button--secondary"
              (click)="handleReset()"
              [attr.aria-label]="'Reset component'">
              Reset
            </button>
          </div>

          <div class="osi-error-boundary__retry-info" *ngIf="showRetryCount && errorState.errorCount() > 1">
            Failed {{ errorState.errorCount() }} times
          </div>

          <details class="osi-error-boundary__details" *ngIf="showDetails && errorState.error()">
            <summary>Technical Details</summary>
            <pre class="osi-error-boundary__stack">{{ errorState.error()?.stack || errorState.error()?.message }}</pre>
          </details>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    .osi-error-boundary {
      padding: var(--osi-error-padding, 2rem);
      background: var(--osi-error-bg, rgba(239, 68, 68, 0.1));
      border: 1px solid var(--osi-error-border, rgba(239, 68, 68, 0.3));
      border-radius: var(--osi-error-radius, 0.5rem);
      margin: var(--osi-error-margin, 1rem 0);
    }

    .osi-error-boundary__content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .osi-error-boundary__content--centered {
      align-items: center;
      text-align: center;
    }

    .osi-error-boundary__icon {
      color: var(--osi-error-icon-color, #ef4444);
      margin-bottom: 0.5rem;
    }

    .osi-error-boundary__title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--osi-error-title-color, var(--card-text-primary, #ffffff));
      margin: 0;
    }

    .osi-error-boundary__message {
      color: var(--osi-error-message-color, var(--card-text-secondary, #b8c5d6));
      margin: 0;
      font-size: 0.95rem;
    }

    .osi-error-boundary__actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .osi-error-boundary__button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: opacity 0.2s, transform 0.1s;
    }

    .osi-error-boundary__button:hover:not(:disabled) {
      opacity: 0.9;
    }

    .osi-error-boundary__button:active:not(:disabled) {
      transform: scale(0.98);
    }

    .osi-error-boundary__button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .osi-error-boundary__button--primary {
      background: var(--osi-error-button-primary-bg, var(--color-brand, #ff7900));
      color: var(--osi-error-button-primary-color, white);
    }

    .osi-error-boundary__button--secondary {
      background: transparent;
      border: 1px solid var(--osi-error-button-secondary-border, var(--color-brand, #ff7900));
      color: var(--osi-error-button-secondary-color, var(--color-brand, #ff7900));
    }

    .osi-error-boundary__retry-info {
      font-size: 0.75rem;
      color: var(--osi-error-info-color, var(--card-text-muted, #8a95a5));
    }

    .osi-error-boundary__details {
      margin-top: 1rem;
      text-align: left;
      width: 100%;
    }

    .osi-error-boundary__details summary {
      cursor: pointer;
      color: var(--osi-error-details-color, var(--card-text-secondary, #b8c5d6));
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .osi-error-boundary__stack {
      background: var(--osi-error-stack-bg, rgba(0, 0, 0, 0.3));
      padding: 1rem;
      border-radius: 0.375rem;
      overflow-x: auto;
      font-size: 0.75rem;
      color: var(--osi-error-stack-color, var(--card-text-secondary, #b8c5d6));
      white-space: pre-wrap;
      word-break: break-all;
      margin: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorBoundaryComponent implements OnInit, OnDestroy {
  /** Error title displayed in the boundary */
  @Input() errorTitle = 'Something went wrong';

  /** Fallback message displayed when an error occurs */
  @Input() fallbackMessage = 'An error occurred while rendering this component.';

  /** Whether to show recovery buttons */
  @Input() showRecovery = true;

  /** Whether to show error details expandable */
  @Input() showDetails = false;

  /** Whether to show the error icon */
  @Input() showIcon = true;

  /** Whether to show retry count */
  @Input() showRetryCount = true;

  /** Whether to center the content */
  @Input() centered = true;

  /** Maximum error count before disabling retry */
  @Input() maxRetries = 3;

  /** Recovery delay in milliseconds */
  @Input() recoveryDelayMs = 1000;

  /** Emitted when an error is caught */
  @Output() errorCaught = new EventEmitter<ErrorBoundaryEvent>();

  /** Emitted when retry is clicked */
  @Output() retryClicked = new EventEmitter<void>();

  /** Emitted when reset is clicked */
  @Output() resetClicked = new EventEmitter<void>();

  private readonly cdr = inject(ChangeDetectorRef);

  /** Error boundary state */
  errorState!: ErrorBoundaryState;

  /** Classified error for user-friendly messages */
  private classifiedError = signal<ClassifiedError | null>(null);

  /** Display message (uses classified error or fallback) */
  displayMessage = () => {
    const classified = this.classifiedError();
    if (classified) {
      return classified.userMessage;
    }
    return this.errorState.errorMessage() || this.fallbackMessage;
  };

  ngOnInit(): void {
    this.errorState = useErrorBoundary({
      onError: (error) => this.onErrorCaught(error),
      onRecover: () => this.cdr.markForCheck(),
      onReset: () => this.cdr.markForCheck(),
      maxErrors: this.maxRetries,
      recoveryDelayMs: this.recoveryDelayMs,
      defaultMessage: this.fallbackMessage,
    });

    // Setup global error listener for unhandled errors in children
    this.setupErrorListeners();
  }

  ngOnDestroy(): void {
    this.removeErrorListeners();
  }

  /**
   * Manually capture an error (can be called from parent)
   */
  captureError(error: Error): void {
    this.errorState.captureError(error);
  }

  /**
   * Handle retry button click
   */
  handleRetry(): void {
    this.retryClicked.emit();
    this.errorState.recover().then(() => {
      this.cdr.markForCheck();
    });
  }

  /**
   * Handle reset button click
   */
  handleReset(): void {
    this.classifiedError.set(null);
    this.errorState.reset();
    this.resetClicked.emit();
    this.cdr.markForCheck();
  }

  /**
   * Called when an error is caught
   */
  private onErrorCaught(error: Error): void {
    const classified = classifyError(error);
    this.classifiedError.set(classified);

    this.errorCaught.emit({
      error,
      classified,
      timestamp: new Date(),
    });

    this.cdr.markForCheck();
  }

  /**
   * Setup error event listeners
   */
  private setupErrorListeners(): void {
    // Note: In Angular, most errors are handled by the ErrorHandler
    // This is for catching errors that slip through
    window.addEventListener('error', this.handleWindowError);
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  /**
   * Remove error event listeners
   */
  private removeErrorListeners(): void {
    window.removeEventListener('error', this.handleWindowError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  /**
   * Handle window error events
   */
  private handleWindowError = (event: ErrorEvent): void => {
    // Only handle if we haven't already caught an error
    if (!this.errorState.hasError()) {
      const error = event.error instanceof Error ? event.error : new Error(event.message);
      this.errorState.captureError(error);
    }
  };

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    // Only handle if we haven't already caught an error
    if (!this.errorState.hasError()) {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      this.errorState.captureError(error);
    }
  };
}



