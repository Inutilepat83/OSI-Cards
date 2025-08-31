import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-error-boundary',
  template: `
    <div class="error-boundary" *ngIf="hasError; else content">
      <div class="error-content">
        <div class="error-icon">
          <i class="pi pi-exclamation-triangle"></i>
        </div>
        <h3 class="error-title">{{ errorTitle }}</h3>
        <p class="error-message">{{ errorMessage }}</p>

        <div class="error-actions" *ngIf="showRetry">
          <button type="button" class="retry-btn" (click)="retry()" [disabled]="retrying">
            <i class="pi pi-refresh" [class.spin]="retrying"></i>
            {{ retrying ? 'Retrying...' : 'Try Again' }}
          </button>
        </div>

        <div class="error-details" *ngIf="showDetails && error">
          <button type="button" class="details-toggle" (click)="toggleDetails()">
            {{ showErrorDetails ? 'Hide' : 'Show' }} Details
          </button>
          <pre class="error-stack" *ngIf="showErrorDetails">{{ error.stack }}</pre>
        </div>
      </div>
    </div>

    <ng-template #content>
      <ng-content></ng-content>
    </ng-template>
  `,
  styles: [
    `
      .error-boundary {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        padding: 2rem;
        background: var(--surface-section);
        border: 1px solid var(--surface-border);
        border-radius: 8px;
        margin: 1rem 0;
      }

      .error-content {
        text-align: center;
        max-width: 500px;
      }

      .error-icon {
        font-size: 3rem;
        color: var(--error-color);
        margin-bottom: 1rem;
      }

      .error-title {
        color: var(--text-color);
        margin-bottom: 0.5rem;
        font-size: 1.25rem;
        font-weight: 600;
      }

      .error-message {
        color: var(--text-color-secondary);
        margin-bottom: 1.5rem;
        line-height: 1.5;
      }

      .error-actions {
        margin-bottom: 1rem;
      }

      .retry-btn {
        background: var(--primary-color);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }

      .retry-btn:hover:not(:disabled) {
        background: var(--primary-color-hover);
        transform: translateY(-1px);
      }

      .retry-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .spin {
        animation: spin 1s linear infinite;
      }

      .error-details {
        margin-top: 1rem;
      }

      .details-toggle {
        background: none;
        border: 1px solid var(--surface-border);
        color: var(--text-color-secondary);
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85rem;
        margin-bottom: 0.5rem;
      }

      .error-stack {
        background: var(--surface-ground);
        border: 1px solid var(--surface-border);
        border-radius: 4px;
        padding: 1rem;
        text-align: left;
        font-size: 0.8rem;
        color: var(--text-color);
        overflow-x: auto;
        white-space: pre-wrap;
        max-height: 200px;
        overflow-y: auto;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      /* Dark theme */
      [data-theme='dark'] .error-boundary {
        background: var(--surface-section-dark);
        border-color: var(--surface-border-dark);
      }

      [data-theme='dark'] .error-stack {
        background: var(--surface-ground-dark);
        border-color: var(--surface-border-dark);
      }
    `,
  ],
})
export class ErrorBoundaryComponent {
  @Input() errorTitle = 'Something went wrong';
  @Input() errorMessage = 'We encountered an unexpected error. Please try again.';
  @Input() showRetry = true;
  @Input() showDetails = true;

  @Output() retryClicked = new EventEmitter<void>();

  hasError = false;
  error: Error | null = null;
  showErrorDetails = false;
  retrying = false;

  /**
   * Set error state
   */
  setError(error: Error): void {
    this.error = error;
    this.hasError = true;
    this.showErrorDetails = false;
    this.retrying = false;
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.hasError = false;
    this.error = null;
    this.showErrorDetails = false;
    this.retrying = false;
  }

  /**
   * Retry action
   */
  retry(): void {
    if (this.retrying) return;

    this.retrying = true;
    this.retryClicked.emit();

    // Reset retrying state after a delay
    setTimeout(() => {
      this.retrying = false;
    }, 1000);
  }

  /**
   * Toggle error details visibility
   */
  toggleDetails(): void {
    this.showErrorDetails = !this.showErrorDetails;
  }
}
