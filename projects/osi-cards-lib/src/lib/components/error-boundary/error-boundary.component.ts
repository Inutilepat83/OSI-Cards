/**
 * Error Boundary Component (Improvement #88)
 * 
 * Catches and displays errors gracefully within card rendering.
 * Prevents individual card/section errors from crashing the entire app.
 * 
 * @example
 * ```html
 * <osi-error-boundary [fallback]="errorTemplate">
 *   <osi-card [config]="cardConfig"></osi-card>
 * </osi-error-boundary>
 * 
 * <ng-template #errorTemplate let-error="error" let-retry="retry">
 *   <div class="error-message">
 *     <p>Something went wrong: {{ error.message }}</p>
 *     <button (click)="retry()">Try Again</button>
 *   </div>
 * </ng-template>
 * ```
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  ContentChild,
  ErrorHandler,
  Injectable,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  OnDestroy
} from '@angular/core';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Error boundary state
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  timestamp: number | null;
}

/**
 * Additional error information
 */
export interface ErrorInfo {
  componentStack?: string;
  source?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
}

/**
 * Error boundary context for templates
 */
export interface ErrorBoundaryContext {
  error: Error;
  errorInfo: ErrorInfo | null;
  retry: () => void;
  dismiss: () => void;
}

// ============================================================================
// ERROR BOUNDARY SERVICE
// ============================================================================

@Injectable()
export class ErrorBoundaryHandler extends ErrorHandler {
  private boundaries = new Map<string, ErrorBoundaryComponent>();
  
  /**
   * Register an error boundary
   */
  register(id: string, boundary: ErrorBoundaryComponent): void {
    this.boundaries.set(id, boundary);
  }
  
  /**
   * Unregister an error boundary
   */
  unregister(id: string): void {
    this.boundaries.delete(id);
  }
  
  /**
   * Handle an error within a boundary
   */
  override handleError(error: Error): void {
    // Try to find the nearest error boundary
    for (const [, boundary] of this.boundaries) {
      if (boundary.canHandle(error)) {
        boundary.handleError(error);
        return;
      }
    }
    
    // Fall back to default handler
    super.handleError(error);
  }
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

@Component({
  selector: 'osi-error-boundary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (hasError()) {
      @if (fallback) {
        <ng-container 
          [ngTemplateOutlet]="fallback"
          [ngTemplateOutletContext]="errorContext()">
        </ng-container>
      } @else {
        <div class="osi-error-boundary-fallback" role="alert">
          <div class="osi-error-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3 class="osi-error-title">Something went wrong</h3>
          <p class="osi-error-message">{{ errorMessage() }}</p>
          @if (showDetails) {
            <details class="osi-error-details">
              <summary>Technical Details</summary>
              <pre>{{ errorStack() }}</pre>
            </details>
          }
          <div class="osi-error-actions">
            @if (canRetry()) {
              <button 
                type="button" 
                class="osi-error-retry" 
                (click)="retry()">
                Try Again
              </button>
            }
            <button 
              type="button" 
              class="osi-error-dismiss" 
              (click)="dismiss()">
              Dismiss
            </button>
          </div>
        </div>
      }
    } @else {
      <ng-content></ng-content>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .osi-error-boundary-fallback {
      padding: 2rem;
      border-radius: var(--osi-card-border-radius, 12px);
      background: var(--osi-error-bg, #fef2f2);
      border: 1px solid var(--osi-error-border, #fecaca);
      color: var(--osi-error-text, #991b1b);
      text-align: center;
    }
    
    .osi-error-icon {
      width: 48px;
      height: 48px;
      margin: 0 auto 1rem;
      color: var(--osi-error-color, #dc2626);
    }
    
    .osi-error-icon svg {
      width: 100%;
      height: 100%;
    }
    
    .osi-error-title {
      margin: 0 0 0.5rem;
      font-size: 1.25rem;
      font-weight: 600;
    }
    
    .osi-error-message {
      margin: 0 0 1rem;
      color: var(--osi-error-text-secondary, #7f1d1d);
    }
    
    .osi-error-details {
      margin: 1rem 0;
      text-align: left;
    }
    
    .osi-error-details summary {
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--osi-error-text-secondary, #7f1d1d);
    }
    
    .osi-error-details pre {
      margin-top: 0.5rem;
      padding: 0.75rem;
      background: var(--osi-error-code-bg, #1f2937);
      color: var(--osi-error-code-text, #f3f4f6);
      border-radius: 4px;
      font-size: 0.75rem;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }
    
    .osi-error-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
    }
    
    .osi-error-retry,
    .osi-error-dismiss {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .osi-error-retry {
      background: var(--osi-error-button-bg, #dc2626);
      color: white;
      border: none;
    }
    
    .osi-error-retry:hover {
      background: var(--osi-error-button-hover, #b91c1c);
    }
    
    .osi-error-dismiss {
      background: transparent;
      color: var(--osi-error-text, #991b1b);
      border: 1px solid var(--osi-error-border, #fecaca);
    }
    
    .osi-error-dismiss:hover {
      background: var(--osi-error-dismiss-hover, rgba(0, 0, 0, 0.05));
    }
    
    /* Dark theme support */
    :host-context([data-theme="dark"]) .osi-error-boundary-fallback {
      background: #450a0a;
      border-color: #7f1d1d;
      color: #fecaca;
    }
    
    :host-context([data-theme="dark"]) .osi-error-message {
      color: #fca5a5;
    }
  `],
  imports: []
})
export class ErrorBoundaryComponent implements OnDestroy {
  private readonly boundaryId = `error-boundary-${Math.random().toString(36).slice(2)}`;
  private readonly handler = inject(ErrorBoundaryHandler, { optional: true });
  
  /**
   * Custom fallback template
   */
  @Input() fallback?: TemplateRef<ErrorBoundaryContext>;
  
  /**
   * Show technical details (stack trace)
   */
  @Input() showDetails = false;
  
  /**
   * Allow retry attempts
   */
  @Input() allowRetry = true;
  
  /**
   * Maximum retry attempts
   */
  @Input() maxRetries = 3;
  
  /**
   * Error types that this boundary should handle
   */
  @Input() errorTypes: Array<new (...args: any[]) => Error> = [];
  
  /**
   * Emits when an error is caught
   */
  @Output() errorCaught = new EventEmitter<Error>();
  
  /**
   * Emits when error is dismissed
   */
  @Output() errorDismissed = new EventEmitter<void>();
  
  /**
   * Emits when retry is attempted
   */
  @Output() retryAttempted = new EventEmitter<number>();
  
  // State signals
  private readonly _error = signal<Error | null>(null);
  private readonly _errorInfo = signal<ErrorInfo | null>(null);
  private readonly _retryCount = signal(0);
  
  /**
   * Whether an error has occurred
   */
  readonly hasError = computed(() => this._error() !== null);
  
  /**
   * Error message for display
   */
  readonly errorMessage = computed(() => {
    const error = this._error();
    return error?.message ?? 'An unexpected error occurred';
  });
  
  /**
   * Error stack trace
   */
  readonly errorStack = computed(() => {
    const error = this._error();
    return error?.stack ?? '';
  });
  
  /**
   * Whether retry is available
   */
  readonly canRetry = computed(() => {
    const info = this._errorInfo();
    return this.allowRetry && 
           (info?.recoverable ?? true) && 
           this._retryCount() < this.maxRetries;
  });
  
  /**
   * Context for error template
   */
  readonly errorContext = computed<ErrorBoundaryContext | null>(() => {
    const error = this._error();
    if (!error) return null;
    
    return {
      error,
      errorInfo: this._errorInfo(),
      retry: () => this.retry(),
      dismiss: () => this.dismiss()
    };
  });
  
  constructor() {
    this.handler?.register(this.boundaryId, this);
  }
  
  ngOnDestroy(): void {
    this.handler?.unregister(this.boundaryId);
  }
  
  /**
   * Check if this boundary can handle the error
   */
  canHandle(error: Error): boolean {
    if (this.errorTypes.length === 0) return true;
    return this.errorTypes.some(type => error instanceof type);
  }
  
  /**
   * Handle an error
   */
  handleError(error: Error, info?: ErrorInfo): void {
    this._error.set(error);
    this._errorInfo.set(info ?? {
      severity: 'medium',
      recoverable: true
    });
    this.errorCaught.emit(error);
  }
  
  /**
   * Retry the failed operation
   */
  retry(): void {
    const currentCount = this._retryCount();
    this._retryCount.set(currentCount + 1);
    this._error.set(null);
    this._errorInfo.set(null);
    this.retryAttempted.emit(currentCount + 1);
  }
  
  /**
   * Dismiss the error
   */
  dismiss(): void {
    this._error.set(null);
    this._errorInfo.set(null);
    this._retryCount.set(0);
    this.errorDismissed.emit();
  }
  
  /**
   * Reset the error boundary
   */
  reset(): void {
    this._error.set(null);
    this._errorInfo.set(null);
    this._retryCount.set(0);
  }
  
  /**
   * Programmatically trigger an error
   */
  setError(error: Error, info?: ErrorInfo): void {
    this.handleError(error, info);
  }
}

// ============================================================================
// SECTION ERROR BOUNDARY
// ============================================================================

@Component({
  selector: 'osi-section-error-boundary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (hasError()) {
      <div class="osi-section-error" role="alert">
        <span class="osi-section-error-icon">⚠️</span>
        <span class="osi-section-error-text">
          Failed to render section
          @if (showRetry && canRetry()) {
            <button type="button" (click)="retry()">Retry</button>
          }
        </span>
      </div>
    } @else {
      <ng-content></ng-content>
    }
  `,
  styles: [`
    .osi-section-error {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: var(--osi-section-error-bg, #fef3c7);
      border: 1px solid var(--osi-section-error-border, #fcd34d);
      border-radius: 6px;
      color: var(--osi-section-error-text, #92400e);
      font-size: 0.875rem;
    }
    
    .osi-section-error-icon {
      flex-shrink: 0;
    }
    
    .osi-section-error-text {
      flex: 1;
    }
    
    .osi-section-error button {
      margin-left: auto;
      padding: 0.25rem 0.5rem;
      background: var(--osi-section-error-button-bg, #f59e0b);
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 0.75rem;
      cursor: pointer;
    }
    
    :host-context([data-theme="dark"]) .osi-section-error {
      background: #451a03;
      border-color: #92400e;
      color: #fcd34d;
    }
  `]
})
export class SectionErrorBoundaryComponent {
  @Input() showRetry = true;
  @Input() maxRetries = 2;
  
  @Output() errorCaught = new EventEmitter<Error>();
  @Output() retryAttempted = new EventEmitter<number>();
  
  private readonly _error = signal<Error | null>(null);
  private readonly _retryCount = signal(0);
  
  readonly hasError = computed(() => this._error() !== null);
  readonly canRetry = computed(() => this._retryCount() < this.maxRetries);
  
  handleError(error: Error): void {
    this._error.set(error);
    this.errorCaught.emit(error);
  }
  
  retry(): void {
    const count = this._retryCount() + 1;
    this._retryCount.set(count);
    this._error.set(null);
    this.retryAttempted.emit(count);
  }
  
  reset(): void {
    this._error.set(null);
    this._retryCount.set(0);
  }
}

