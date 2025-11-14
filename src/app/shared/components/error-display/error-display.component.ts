import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../store/app.state';
import { selectError } from '../../../store/cards/cards.selectors';
import * as CardActions from '../../../store/cards/cards.state';
import { ErrorHandlingService, AppError } from '../../../core/services/error-handling.service';

@Component({
  selector: 'app-error-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="error-container" *ngIf="error$ | async as error" role="alert" aria-live="assertive">
      <div class="error-content">
        <div class="error-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M10 6V10"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M10 14H10.01"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <div class="error-message">
          <h3 class="error-title">Error</h3>
          <p class="error-text">{{ error }}</p>
        </div>
        <button
          class="error-close"
          type="button"
          aria-label="Close error message"
          (click)="clearError()"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 4L4 12M4 4L12 12"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
      <div class="error-actions" *ngIf="canRetry">
        <button
          class="error-retry"
          type="button"
          (click)="retry()"
        >
          Retry
        </button>
      </div>
    </div>
  `,
  styles: [`
    .error-container {
      position: fixed;
      top: 20px;
      right: 20px;
      max-width: 400px;
      background: var(--card);
      border: 1px solid var(--destructive);
      border-radius: var(--radius-lg);
      padding: var(--spacing-4xl);
      box-shadow: var(--card-box-shadow);
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .error-content {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-2xl);
    }

    .error-icon {
      flex-shrink: 0;
      color: var(--destructive);
      margin-top: 2px;
    }

    .error-message {
      flex: 1;
      min-width: 0;
    }

    .error-title {
      margin: 0 0 var(--spacing-sm) 0;
      font-size: var(--text-base);
      font-weight: 600;
      color: var(--foreground);
    }

    .error-text {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--muted-foreground);
      word-wrap: break-word;
    }

    .error-close {
      flex-shrink: 0;
      background: transparent;
      border: none;
      color: var(--muted-foreground);
      cursor: pointer;
      padding: var(--spacing-sm);
      border-radius: var(--radius-sm);
      transition: background 0.2s ease, color 0.2s ease;
    }

    .error-close:hover {
      background: var(--muted);
      color: var(--foreground);
    }

    .error-actions {
      margin-top: var(--spacing-2xl);
      display: flex;
      justify-content: flex-end;
    }

    .error-retry {
      padding: var(--spacing-md) var(--spacing-2xl);
      background: var(--primary);
      color: var(--primary-foreground);
      border: none;
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s ease;
    }

    .error-retry:hover {
      opacity: 0.9;
    }

    .error-retry:active {
      opacity: 0.8;
    }

    @media (max-width: 768px) {
      .error-container {
        top: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorDisplayComponent {
  private readonly store = inject(Store<AppState>);
  private readonly errorHandlingService = inject(ErrorHandlingService);

  error$: Observable<string | null> = this.store.select(selectError);
  canRetry = false; // Could be enhanced to check error type

  clearError(): void {
    this.store.dispatch(CardActions.clearError());
    this.errorHandlingService.clearError();
  }

  retry(): void {
    this.clearError();
    this.store.dispatch(CardActions.loadCards());
  }
}

