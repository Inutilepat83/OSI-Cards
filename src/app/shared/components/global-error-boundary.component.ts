import { Component, OnInit, OnDestroy } from '@angular/core';
import { ErrorReportingService } from '../../core/services/error-reporting.service';
import { ThemeService } from '../../core/services/theme.service';
import { LoggingService } from '../../core/services/logging.service';

@Component({
  selector: 'app-global-error-boundary',
  template: `
    <div class="global-error-boundary" *ngIf="hasGlobalError; else appContent">
      <div class="error-overlay">
        <div class="error-container">
          <div class="error-icon">
            <i class="pi pi-exclamation-triangle"></i>
          </div>

          <h1 class="error-title">Oops! Something went wrong</h1>

          <p class="error-message">
            We're sorry, but the application encountered an unexpected error. Our team has been
            notified and is working to fix this issue.
          </p>

          <div class="error-actions">
            <button type="button" class="retry-btn primary" (click)="retry()" [disabled]="retrying">
              <i class="pi pi-refresh" [class.spin]="retrying"></i>
              {{ retrying ? 'Restarting...' : 'Restart Application' }}
            </button>

            <button type="button" class="retry-btn secondary" (click)="reloadPage()">
              <i class="pi pi-replay"></i>
              Reload Page
            </button>
          </div>

          <div class="error-details" *ngIf="showDetails">
            <div class="error-info">
              <h4>Error Information:</h4>
              <p><strong>Time:</strong> {{ errorTime | date: 'medium' }}</p>
              <p><strong>URL:</strong> {{ errorUrl }}</p>
              <p><strong>Message:</strong> {{ errorMessage }}</p>
            </div>

            <div class="error-stats" *ngIf="errorStats">
              <h4>Recent Error Statistics:</h4>
              <p>Total errors in session: {{ errorStats.total }}</p>
              <p>Critical errors: {{ errorStats.critical }}</p>
              <p>Errors in last hour: {{ errorStats.recent }}</p>
            </div>
          </div>

          <button type="button" class="details-toggle" (click)="toggleDetails()">
            {{ showDetails ? 'Hide' : 'Show' }} Technical Details
          </button>
        </div>
      </div>
    </div>

    <ng-template #appContent>
      <ng-content></ng-content>
    </ng-template>
  `,
  styles: [
    `
      .global-error-boundary {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .error-overlay {
        background: var(--surface-card);
        border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        max-width: 600px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        padding: 2rem;
      }

      .error-container {
        text-align: center;
      }

      .error-icon {
        font-size: 4rem;
        color: var(--error-color, #ef4444);
        margin-bottom: 1.5rem;
        animation: pulse 2s infinite;
      }

      .error-title {
        color: var(--text-color);
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 1rem;
      }

      .error-message {
        color: var(--text-color-secondary);
        font-size: 1.1rem;
        line-height: 1.6;
        margin-bottom: 2rem;
        max-width: 500px;
        margin-left: auto;
        margin-right: auto;
      }

      .error-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-bottom: 2rem;
        flex-wrap: wrap;
      }

      .retry-btn {
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        border: none;
        min-width: 160px;
        justify-content: center;
      }

      .retry-btn.primary {
        background: var(--primary-color, #1976d2);
        color: white;
      }

      .retry-btn.primary:hover:not(:disabled) {
        background: var(--primary-color-hover, #1565c0);
        transform: translateY(-2px);
      }

      .retry-btn.secondary {
        background: transparent;
        color: var(--text-color-secondary);
        border: 2px solid var(--surface-border);
      }

      .retry-btn.secondary:hover {
        background: var(--surface-hover);
        border-color: var(--primary-color);
      }

      .retry-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }

      .spin {
        animation: spin 1s linear infinite;
      }

      .error-details {
        background: var(--surface-section);
        border: 1px solid var(--surface-border);
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        text-align: left;
      }

      .error-info h4,
      .error-stats h4 {
        color: var(--text-color);
        margin-bottom: 1rem;
        font-size: 1.1rem;
        font-weight: 600;
      }

      .error-info p,
      .error-stats p {
        color: var(--text-color-secondary);
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
      }

      .details-toggle {
        background: none;
        border: 1px solid var(--surface-border);
        color: var(--text-color-secondary);
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.2s ease;
      }

      .details-toggle:hover {
        background: var(--surface-hover);
        border-color: var(--primary-color);
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      /* Dark theme support */
      [data-theme='dark'] .error-overlay {
        background: var(--surface-card-dark, #1e1e1e);
      }

      [data-theme='dark'] .error-details {
        background: var(--surface-section-dark, #2d2d2d);
        border-color: var(--surface-border-dark, #404040);
      }

      /* Mobile responsiveness */
      @media (max-width: 768px) {
        .error-overlay {
          margin: 1rem;
          padding: 1.5rem;
        }

        .error-title {
          font-size: 1.5rem;
        }

        .error-actions {
          flex-direction: column;
          align-items: center;
        }

        .retry-btn {
          width: 100%;
          max-width: 280px;
        }
      }
    `,
  ],
})
export class GlobalErrorBoundaryComponent implements OnInit, OnDestroy {
  hasGlobalError = false;
  errorTime: Date | null = null;
  errorUrl = '';
  errorMessage = '';
  showDetails = false;
  retrying = false;
  errorStats: any = null;

  private errorSubscription: any;

  constructor(
    private errorReportingService: ErrorReportingService,
    private themeService: ThemeService,
    private logger: LoggingService
  ) {}

  ngOnInit(): void {
    // Listen for global errors
    this.errorSubscription = this.errorReportingService.getErrorStats();

    // Check for critical errors periodically
    setInterval(() => {
      this.checkForCriticalErrors();
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.errorSubscription) {
      this.errorSubscription.unsubscribe();
    }
  }

  private checkForCriticalErrors(): void {
    const stats = this.errorReportingService.getErrorStats();

    // Trigger global error boundary if too many critical errors
    if (stats.critical >= 3 && !this.hasGlobalError) {
      this.triggerGlobalError('Multiple critical errors detected', stats);
    }
  }

  private triggerGlobalError(message: string, stats?: any): void {
    this.hasGlobalError = true;
    this.errorTime = new Date();
    this.errorUrl = window.location.href;
    this.errorMessage = message;
    this.errorStats = stats;

    // Log the global error
    this.logger.error('GlobalErrorBoundaryComponent', 'Global error boundary triggered', message);
  }

  retry(): void {
    if (this.retrying) return;

    this.retrying = true;

    // Clear error state
    this.hasGlobalError = false;
    this.errorTime = null;
    this.errorMessage = '';
    this.showDetails = false;

    // Reload the application state
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  reloadPage(): void {
    window.location.reload();
  }

  toggleDetails(): void {
    this.showDetails = !this.showDetails;
  }
}
