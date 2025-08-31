import { Injectable, ErrorHandler, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { LoggingService } from './logging.service';

export interface ErrorReport {
  id: string;
  timestamp: Date;
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  userId?: string;
  componentStack?: string;
  additionalData?: any;
}

export interface ErrorReportingConfig {
  enabled: boolean;
  endpoint?: string;
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  batchInterval: number;
}

@Injectable({
  providedIn: 'root',
})
export class ErrorReportingService {
  private config: ErrorReportingConfig = {
    enabled: true,
    maxRetries: 3,
    retryDelay: 1000,
    batchSize: 10,
    batchInterval: 30000,
  };

  private errorQueue: ErrorReport[] = [];
  private batchTimer?: number;

  constructor(
    private http: HttpClient,
    private injector: Injector,
    private logger: LoggingService
  ) {
    this.initializeBatchReporting();
  }

  /**
   * Report an error
   */
  reportError(error: Error, additionalData?: any): void {
    if (!this.config.enabled) return;

    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      additionalData,
    };

    this.errorQueue.push(errorReport);

    // Report immediately for critical errors
    if (this.isCriticalError(error)) {
      this.sendErrorReport(errorReport);
    } else {
      this.scheduleBatchReport();
    }
  }

  /**
   * Report component error
   */
  reportComponentError(error: Error, componentStack?: string): void {
    this.reportError(error, { componentStack, type: 'component' });
  }

  /**
   * Report HTTP error
   */
  reportHttpError(error: any, url: string): void {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      message: `HTTP Error: ${error.status} ${error.statusText}`,
      url: url,
      userAgent: navigator.userAgent,
      additionalData: {
        status: error.status,
        statusText: error.statusText,
        type: 'http',
      },
    };

    this.errorQueue.push(errorReport);
    this.scheduleBatchReport();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ErrorReportingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get error statistics
   */
  getErrorStats(): { total: number; critical: number; recent: number } {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    return {
      total: this.errorQueue.length,
      critical: this.errorQueue.filter(e => this.isCriticalError(new Error(e.message))).length,
      recent: this.errorQueue.filter(e => e.timestamp.getTime() > oneHourAgo).length,
    };
  }

  private sendErrorReport(errorReport: ErrorReport, retryCount = 0): Observable<any> {
    if (!this.config.endpoint) {
      this.logger.warn('ErrorReportingService', 'Error reporting endpoint not configured');
      return of(null);
    }

    return this.http.post(this.config.endpoint, errorReport).pipe(
      tap(() => {
        this.logger.log('ErrorReportingService', 'Error report sent successfully');
      }),
      catchError(error => {
        this.logger.error('ErrorReportingService', 'Failed to send error report', error);

        if (retryCount < this.config.maxRetries) {
          setTimeout(
            () => {
              this.sendErrorReport(errorReport, retryCount + 1);
            },
            this.config.retryDelay * Math.pow(2, retryCount)
          );
        }

        return of(null);
      })
    );
  }

  private initializeBatchReporting(): void {
    this.batchTimer = window.setInterval(() => {
      this.sendBatchReports();
    }, this.config.batchInterval);
  }

  private scheduleBatchReport(): void {
    if (this.errorQueue.length >= this.config.batchSize) {
      this.sendBatchReports();
    }
  }

  private sendBatchReports(): void {
    if (this.errorQueue.length === 0) return;

    const batch = this.errorQueue.splice(0, this.config.batchSize);

    if (this.config.endpoint) {
      this.http
        .post(`${this.config.endpoint}/batch`, { errors: batch })
        .pipe(
          tap(() => {
            this.logger.log('ErrorReportingService', `Sent ${batch.length} error reports`);
          }),
          catchError(error => {
            this.logger.error('ErrorReportingService', 'Failed to send batch error reports', error);
            // Re-queue failed reports
            this.errorQueue.unshift(...batch);
            return of(null);
          })
        )
        .subscribe();
    }
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isCriticalError(error: Error): boolean {
    const criticalPatterns = [
      /TypeError/i,
      /ReferenceError/i,
      /SyntaxError/i,
      /RangeError/i,
      /URIError/i,
    ];

    return criticalPatterns.some(pattern => pattern.test(error.name));
  }

  /**
   * Cleanup on service destruction
   */
  ngOnDestroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
  }
}

/**
 * Global error handler that integrates with error reporting
 */
@Injectable()
export class ReportingErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: any): void {
    // Get error reporting service
    const errorReportingService = this.injector.get(ErrorReportingService);

    // Report the error
    if (error instanceof Error) {
      errorReportingService.reportError(error);
    } else {
      // Handle non-Error objects
      const syntheticError = new Error(error?.message || 'Unknown error');
      syntheticError.stack = error?.stack;
      errorReportingService.reportError(syntheticError, error);
    }

    // Log to console in development
    if (!environment.production) {
      console.error('Global error caught:', error);
    }
  }
}

// Import environment for production check
import { environment } from '../../../environments/environment';
