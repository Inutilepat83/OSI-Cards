/**
 * Global Error Handler
 *
 * Catches all unhandled errors in the application.
 * Integrates with ErrorTrackingService and logging.
 */

import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, inject, Injectable, NgZone } from '@angular/core';
import { ErrorSeverity, ErrorTrackingService, LoggerService } from 'osi-cards-lib';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private errorTracking = inject(ErrorTrackingService);
  private logger = inject(LoggerService);
  private zone = inject(NgZone);

  handleError(error: Error | HttpErrorResponse): void {
    // Run outside Angular zone to prevent change detection issues
    this.zone.runOutsideAngular(() => {
      this.processError(error);
    });
  }

  private processError(error: Error | HttpErrorResponse): void {
    // Determine error type and severity
    const errorInfo = this.analyzeError(error);

    // Log error
    this.logger.error(
      `[${errorInfo.type}] ${errorInfo.message}`,
      errorInfo.context,
      error instanceof Error ? error : undefined
    );

    // Track error - ensure we always have an Error object
    let errorToTrack: Error;
    if (error instanceof Error) {
      errorToTrack = error;
    } else if (error instanceof HttpErrorResponse) {
      errorToTrack = new Error(`HTTP ${error.status}: ${error.message}`);
    } else {
      errorToTrack = new Error(String(error));
    }

    this.errorTracking.track(errorToTrack, {
      severity: this.mapSeverity(errorInfo.severity),
      context: errorInfo.context,
    });

    // Show user-friendly message for critical errors
    if (errorInfo.severity === 'critical') {
      this.showCriticalErrorMessage(errorInfo.message);
    }

    // Re-throw in development for debugging
    if (this.isDevelopment()) {
      console.error('🔴 Unhandled Error:', error);
    }
  }

  private analyzeError(error: Error | HttpErrorResponse): {
    type: string;
    message: string;
    severity: 'critical' | 'error' | 'warning' | 'info';
    context: Record<string, any>;
  } {
    if (error instanceof HttpErrorResponse) {
      return {
        type: 'HTTP Error',
        message: `HTTP ${error.status}: ${error.message}`,
        severity: error.status >= 500 ? 'critical' : 'error',
        context: {
          status: error.status,
          url: error.url,
          statusText: error.statusText,
        },
      };
    }

    if (error instanceof TypeError) {
      return {
        type: 'Type Error',
        message: error.message,
        severity: 'error',
        context: { stack: error.stack },
      };
    }

    if (error instanceof ReferenceError) {
      return {
        type: 'Reference Error',
        message: error.message,
        severity: 'error',
        context: { stack: error.stack },
      };
    }

    if (error.message?.includes('ExpressionChangedAfterItHasBeenCheckedError')) {
      return {
        type: 'Change Detection Error',
        message: 'Expression changed after it was checked',
        severity: 'warning',
        context: { stack: error.stack },
      };
    }

    // Default error
    return {
      type: 'Unknown Error',
      message: error.message || 'An unknown error occurred',
      severity: 'error',
      context: { stack: error.stack },
    };
  }

  private showCriticalErrorMessage(message: string): void {
    // In a real app, this would show a toast/modal
    // For now, just log to console
    console.error('🚨 CRITICAL ERROR:', message);
  }

  private isDevelopment(): boolean {
    return typeof window !== 'undefined' && window.location.hostname === 'localhost';
  }

  private mapSeverity(severity: 'critical' | 'error' | 'warning' | 'info'): ErrorSeverity {
    const map: Record<string, ErrorSeverity> = {
      critical: 'critical',
      error: 'high',
      warning: 'medium',
      info: 'low',
    };
    return map[severity] || 'medium';
  }
}
