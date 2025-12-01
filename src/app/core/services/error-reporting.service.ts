import { ErrorHandler, inject, Injectable } from '@angular/core';
import { LoggingService } from './logging.service';
import { AppConfigService } from './app-config.service';

export interface ErrorContext {
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  correlationId?: string;
  component?: string;
  action?: string;
  state?: unknown;
  userActions?: string[];
}

/**
 * Error Reporting Service
 *
 * Centralized error reporting with support for external services (Sentry, LogRocket, etc.)
 * Provides error aggregation, context capture, and reporting capabilities.
 *
 * @example
 * ```typescript
 * const errorReporting = inject(ErrorReportingService);
 * errorReporting.captureError(error, { component: 'CardRenderer' });
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class ErrorReportingService {
  private readonly logger = inject(LoggingService);
  private readonly config = inject(AppConfigService);
  private readonly errorHandler = inject(ErrorHandler);

  private errorQueue: ErrorContext[] = [];
  private readonly maxQueueSize = 100;
  private reportingEnabled = true;

  /**
   * Capture and report an error
   */
  captureError(
    error: Error | unknown,
    context?: {
      component?: string;
      action?: string;
      state?: unknown;
      userActions?: string[];
    }
  ): void {
    const errorContext = this.buildErrorContext(error, context);

    // Add to queue
    this.errorQueue.push(errorContext);
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift(); // Remove oldest
    }

    // Log locally
    this.logger.error(errorContext.message, errorContext.component || 'ErrorReporting', {
      stack: errorContext.stack,
      url: errorContext.url,
      context: context,
    });

    // Report to external service if enabled
    if (this.reportingEnabled && this.config.ENV.PRODUCTION) {
      this.reportToExternalService(errorContext);
    }
  }

  /**
   * Capture exception with full context
   */
  captureException(
    error: Error,
    extra?: {
      tags?: Record<string, string>;
      level?: 'error' | 'warning' | 'info';
      fingerprint?: string;
      contexts?: Record<string, unknown>;
    }
  ): void {
    const errorContext = this.buildErrorContext(error, {
      component: extra?.tags?.['component'] as string | undefined,
      action: extra?.tags?.['action'] as string | undefined,
    });

    // Add extra context
    if (extra?.contexts) {
      Object.assign(errorContext, extra.contexts);
    }

    this.captureError(error, {
      component: extra?.tags?.['component'] as string | undefined,
      action: extra?.tags?.['action'] as string | undefined,
    });
  }

  /**
   * Build error context from error and additional context
   */
  private buildErrorContext(
    error: Error | unknown,
    context?: {
      component?: string;
      action?: string;
      state?: unknown;
      userActions?: string[];
    }
  ): ErrorContext {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    return {
      message: errorMessage,
      stack: errorStack,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      timestamp: new Date(),
      sessionId: this.logger.getSessionId(),
      correlationId: this.logger.getCorrelationId() || undefined,
      component: context?.component,
      action: context?.action,
      state: context?.state,
      userActions: context?.userActions,
    };
  }

  /**
   * Report error to external service (Sentry, LogRocket, etc.)
   */
  private reportToExternalService(errorContext: ErrorContext): void {
    // Integration point for external error reporting services
    // Example: Sentry, LogRocket, Bugsnag, etc.

    // Check if external service is configured
    // This would typically check for API keys or service configuration

    // Example Sentry integration (commented out - requires @sentry/angular):
    /*
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(new Error(errorContext.message), {
        tags: {
          component: errorContext.component,
          action: errorContext.action
        },
        extra: {
          url: errorContext.url,
          userAgent: errorContext.userAgent,
          state: errorContext.state,
          userActions: errorContext.userActions
        }
      });
    }
    */

    // For now, just log that we would report
    this.logger.debug('Error would be reported to external service', 'ErrorReporting', {
      message: errorContext.message,
      component: errorContext.component,
    });
  }

  /**
   * Get error queue for debugging
   */
  getErrorQueue(): ErrorContext[] {
    return [...this.errorQueue];
  }

  /**
   * Clear error queue
   */
  clearErrorQueue(): void {
    this.errorQueue = [];
  }

  /**
   * Enable/disable error reporting
   */
  setReportingEnabled(enabled: boolean): void {
    this.reportingEnabled = enabled;
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byComponent: Record<string, number>;
    recent: ErrorContext[];
  } {
    const byComponent: Record<string, number> = {};

    this.errorQueue.forEach((error) => {
      const component = error.component || 'unknown';
      byComponent[component] = (byComponent[component] || 0) + 1;
    });

    return {
      total: this.errorQueue.length,
      byComponent,
      recent: this.errorQueue.slice(-10), // Last 10 errors
    };
  }

  /**
   * Set user context for error reporting
   */
  setUserContext(userId: string, additionalData?: Record<string, unknown>): void {
    // This would typically set user context in external services
    this.logger.debug('User context set', 'ErrorReporting', {
      userId,
      ...additionalData,
    });
  }

  /**
   * Add breadcrumb for error tracking
   */
  addBreadcrumb(
    message: string,
    category?: string,
    level?: 'debug' | 'info' | 'warning' | 'error',
    data?: Record<string, unknown>
  ): void {
    // This would typically add breadcrumbs in external services
    this.logger.debug(`Breadcrumb: ${message}`, 'ErrorReporting', {
      category,
      level,
      ...data,
    });
  }
}
