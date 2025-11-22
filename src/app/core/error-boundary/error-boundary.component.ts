import { Component, ErrorHandler, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Error boundary component for catching and displaying component-level errors
 * Implements Angular error handling pattern
 */
@Component({
  selector: 'app-error-boundary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="hasError" class="error-boundary" role="alert">
      <div class="error-boundary-content">
        <div class="error-icon">⚠️</div>
        <div class="error-details">
          <h3 class="error-title">Something went wrong</h3>
          <p class="error-message">{{ errorMessage }}</p>
          <button
            type="button"
            class="retry-button"
            (click)="retry()"
            aria-label="Retry loading"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
    <ng-content *ngIf="!hasError"></ng-content>
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
      color: var(--card-text-secondary, #B8C5D6);
      font-size: 0.875rem;
    }

    .retry-button {
      padding: 0.5rem 1rem;
      background: var(--color-brand, #FF7900);
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorBoundaryComponent {
  private readonly errorHandler = inject(ErrorHandler);

  hasError = false;
  errorMessage = 'An unexpected error occurred.';

  /**
   * Handle error from child components
   */
  handleError(error: Error): void {
    this.hasError = true;
    this.errorMessage = error.message || 'An unexpected error occurred.';
    this.errorHandler.handleError(error);
  }

  /**
   * Retry after error
   */
  retry(): void {
    this.hasError = false;
    this.errorMessage = '';
    // Reload the page or reset component state
    window.location.reload();
  }
}


