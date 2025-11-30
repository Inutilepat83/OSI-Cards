/**
 * Section Error Boundary Component
 * 
 * Wraps section components to catch and handle rendering errors gracefully.
 * Displays a user-friendly error message instead of breaking the entire card.
 * 
 * @example
 * ```html
 * <app-section-error-boundary>
 *   <app-analytics-section [section]="section"></app-analytics-section>
 * </app-section-error-boundary>
 * ```
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  ErrorHandler,
  inject,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, catchError, takeUntil, of, timer, take } from 'rxjs';
import { LucideIconsModule } from '../../icons';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Error information for section rendering failures
 */
export interface SectionError {
  /** Error message */
  message: string;
  /** Error timestamp */
  timestamp: Date;
  /** Section ID if available */
  sectionId?: string;
  /** Section type if available */
  sectionType?: string;
  /** Original error object */
  originalError?: Error;
  /** Number of retry attempts */
  retryCount: number;
}

/**
 * Configuration for error boundary behavior
 */
export interface ErrorBoundaryConfig {
  /** Show error details (development mode) */
  showDetails: boolean;
  /** Allow retry */
  allowRetry: boolean;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Retry delay in milliseconds */
  retryDelayMs: number;
  /** Auto-retry on error */
  autoRetry: boolean;
}

/** Default configuration */
export const DEFAULT_ERROR_BOUNDARY_CONFIG: ErrorBoundaryConfig = {
  showDetails: false, // Should be true in development
  allowRetry: true,
  maxRetries: 3,
  retryDelayMs: 1000,
  autoRetry: false,
};

// ============================================================================
// COMPONENT
// ============================================================================

@Component({
  selector: 'app-section-error-boundary',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  template: `
    <!-- Content projection when no error -->
    <ng-container *ngIf="!hasError; else errorTemplate">
      <ng-content></ng-content>
    </ng-container>

    <!-- Error display template -->
    <ng-template #errorTemplate>
      <div 
        class="section-error-boundary"
        role="alert"
        aria-live="polite"
        [class.section-error-boundary--retrying]="isRetrying"
      >
        <div class="section-error-boundary__icon" aria-hidden="true">
          <lucide-icon 
            [name]="isRetrying ? 'loader-2' : 'alert-circle'" 
            [size]="24"
            [class.animate-spin]="isRetrying"
          ></lucide-icon>
        </div>

        <div class="section-error-boundary__content">
          <h3 class="section-error-boundary__title">
            {{ isRetrying ? 'Retrying...' : 'Unable to display section' }}
          </h3>

          <p class="section-error-boundary__message" *ngIf="!isRetrying">
            {{ errorInfo?.message || 'An unexpected error occurred' }}
          </p>

          <p class="section-error-boundary__type" *ngIf="errorInfo?.sectionType && config.showDetails">
            Section type: {{ errorInfo?.sectionType }}
          </p>

          <details *ngIf="config.showDetails && errorInfo?.originalError" class="section-error-boundary__details">
            <summary>Technical details</summary>
            <pre>{{ errorInfo?.originalError?.stack || errorInfo?.originalError?.message }}</pre>
          </details>
        </div>

        <div class="section-error-boundary__actions" *ngIf="config.allowRetry && !isRetrying && canRetry">
          <button 
            type="button"
            class="section-error-boundary__retry-btn"
            (click)="onRetry()"
            [disabled]="isRetrying"
          >
            <lucide-icon name="refresh-cw" [size]="16"></lucide-icon>
            Retry
          </button>
        </div>

        <p class="section-error-boundary__retry-exhausted" *ngIf="!canRetry && config.allowRetry">
          Maximum retry attempts reached
        </p>
      </div>
    </ng-template>
  `,
  styles: [`
    .section-error-boundary {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background: var(--osi-surface-error, #fef2f2);
      border: 1px solid var(--osi-border-error, #fecaca);
      border-radius: var(--osi-radius-md, 8px);
      text-align: center;
      min-height: 120px;
    }

    .section-error-boundary--retrying {
      opacity: 0.7;
    }

    .section-error-boundary__icon {
      color: var(--osi-text-error, #dc2626);
      margin-bottom: 0.75rem;
    }

    .section-error-boundary__icon .animate-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .section-error-boundary__content {
      max-width: 300px;
    }

    .section-error-boundary__title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--osi-text-error, #dc2626);
      margin: 0 0 0.5rem 0;
    }

    .section-error-boundary__message {
      font-size: 0.75rem;
      color: var(--osi-text-muted, #6b7280);
      margin: 0;
    }

    .section-error-boundary__type {
      font-size: 0.625rem;
      color: var(--osi-text-muted, #9ca3af);
      margin: 0.5rem 0 0 0;
      font-family: monospace;
    }

    .section-error-boundary__details {
      margin-top: 0.75rem;
      text-align: left;
      font-size: 0.625rem;
    }

    .section-error-boundary__details summary {
      cursor: pointer;
      color: var(--osi-text-muted, #6b7280);
    }

    .section-error-boundary__details pre {
      margin: 0.5rem 0 0 0;
      padding: 0.5rem;
      background: var(--osi-surface-secondary, #f3f4f6);
      border-radius: 4px;
      overflow-x: auto;
      font-size: 0.625rem;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .section-error-boundary__actions {
      margin-top: 1rem;
    }

    .section-error-boundary__retry-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--osi-text-primary, #374151);
      background: var(--osi-surface-primary, #ffffff);
      border: 1px solid var(--osi-border-primary, #d1d5db);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .section-error-boundary__retry-btn:hover:not(:disabled) {
      background: var(--osi-surface-hover, #f3f4f6);
    }

    .section-error-boundary__retry-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .section-error-boundary__retry-exhausted {
      font-size: 0.625rem;
      color: var(--osi-text-muted, #9ca3af);
      margin: 0.75rem 0 0 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.Emulated,
})
export class SectionErrorBoundaryComponent implements OnInit, OnDestroy {
  /** Section ID for error reporting */
  @Input() sectionId?: string;

  /** Section type for error reporting */
  @Input() sectionType?: string;

  /** Configuration options */
  @Input() config: ErrorBoundaryConfig = { ...DEFAULT_ERROR_BOUNDARY_CONFIG };

  /** Emitted when an error is caught */
  @Output() errorCaught = new EventEmitter<SectionError>();

  /** Emitted when retry is requested */
  @Output() retryRequested = new EventEmitter<number>();

  /** Emitted when error is cleared */
  @Output() errorCleared = new EventEmitter<void>();

  private readonly errorHandler = inject(ErrorHandler);
  private readonly destroyRef = inject(DestroyRef);
  private readonly destroy$ = new Subject<void>();

  hasError = false;
  isRetrying = false;
  errorInfo: SectionError | null = null;
  retryCount = 0;

  get canRetry(): boolean {
    return this.retryCount < this.config.maxRetries;
  }

  ngOnInit(): void {
    // Listen for errors from child components
    // Note: In a real implementation, this would need integration with
    // Angular's ErrorHandler to catch errors from projected content
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle an error from the section
   */
  handleError(error: Error): void {
    this.hasError = true;
    this.errorInfo = {
      message: this.getSafeErrorMessage(error),
      timestamp: new Date(),
      sectionId: this.sectionId,
      sectionType: this.sectionType,
      originalError: error,
      retryCount: this.retryCount,
    };

    this.errorCaught.emit(this.errorInfo);

    // Log to error handler
    this.errorHandler.handleError(error);

    // Auto-retry if configured
    if (this.config.autoRetry && this.canRetry) {
      this.scheduleRetry();
    }
  }

  /**
   * Request a retry of the section rendering
   */
  onRetry(): void {
    if (!this.canRetry || this.isRetrying) {
      return;
    }

    this.scheduleRetry();
  }

  /**
   * Clear the error state manually
   */
  clearError(): void {
    this.hasError = false;
    this.errorInfo = null;
    this.retryCount = 0;
    this.isRetrying = false;
    this.errorCleared.emit();
  }

  /**
   * Reset the error boundary for a new section
   */
  reset(): void {
    this.clearError();
  }

  private scheduleRetry(): void {
    this.isRetrying = true;
    this.retryCount++;

    timer(this.config.retryDelayMs)
      .pipe(
        take(1),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.isRetrying = false;
        this.hasError = false;
        this.errorInfo = null;
        this.retryRequested.emit(this.retryCount);
      });
  }

  private getSafeErrorMessage(error: Error): string {
    // In production, return a generic message
    if (!this.config.showDetails) {
      return 'An error occurred while rendering this section.';
    }

    // In development, show the actual error
    return error.message || 'Unknown error';
  }
}

