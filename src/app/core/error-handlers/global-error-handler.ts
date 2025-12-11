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
  private recoveryAttempted = false; // Prevent multiple recovery attempts

  constructor() {
    // Set up window-level error listener for module loading errors
    // that might occur before Angular error handler is ready
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.handleWindowError(event);
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.handleUnhandledRejection(event);
      });
    }
  }

  handleError(error: Error | HttpErrorResponse): void {
    // Run outside Angular zone to prevent change detection issues
    this.zone.runOutsideAngular(() => {
      this.processError(error);
    });
  }

  private processError(error: Error | HttpErrorResponse): void {
    // Check for module loading errors FIRST, before analysis
    // This ensures we catch them even if analysis fails
    const isModuleLoadingError = this.isModuleLoadingError(error);

    if (isModuleLoadingError && !this.recoveryAttempted) {
      console.warn('🚨 Module loading error detected - triggering immediate recovery');
      this.recoveryAttempted = true;
      this.zone.runOutsideAngular(() => {
        this.handleModuleLoadingError();
      });
      // Continue with normal error processing for logging
    }

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

      // Handle module loading errors with automatic recovery (backup check)
      if (
        errorInfo.type === 'Module Loading Error' &&
        errorInfo.context?.recoveryAction === 'reload' &&
        !this.recoveryAttempted
      ) {
        console.warn('🚀 Triggering module loading error recovery (backup)...');
        this.recoveryAttempted = true;
        // Use zone.runOutsideAngular to avoid change detection issues during reload
        this.zone.runOutsideAngular(() => {
          this.handleModuleLoadingError();
        });
      }
    }

    // Re-throw in development for debugging
    if (this.isDevelopment()) {
      console.error('🔴 Unhandled Error:', error);
    }
  }

  /**
   * Quick check if error is a module loading error
   * Used for early detection before full analysis
   */
  private isModuleLoadingError(error: Error | HttpErrorResponse): boolean {
    if (error instanceof HttpErrorResponse) {
      // Check for 404 on JS or CSS chunk files
      return (
        error.status === 404 &&
        error.url !== undefined &&
        error.url !== null &&
        (error.url.includes('.js') || error.url.includes('.css')) &&
        error.url.includes('chunk')
      );
    }

    if (error instanceof Error) {
      const errorMessage = error.message || '';
      return (
        errorMessage.includes('Importing a module script failed') ||
        errorMessage.includes('Failed to fetch dynamically imported module') ||
        errorMessage.includes('Loading chunk') ||
        errorMessage.includes('Loading CSS chunk') ||
        errorMessage.includes('Failed to load CSS chunk') ||
        (errorMessage.includes('chunk') &&
          (errorMessage.includes('failed') ||
            errorMessage.includes('error') ||
            errorMessage.includes('404')))
      );
    }

    return false;
  }

  private analyzeError(error: Error | HttpErrorResponse): {
    type: string;
    message: string;
    severity: 'critical' | 'error' | 'warning' | 'info';
    context: Record<string, any>;
  } {
    if (error instanceof HttpErrorResponse) {
      // Check for missing chunk files (404 errors for .js files)
      if (error.status === 404 && error.url?.includes('.js')) {
        return {
          type: 'Module Loading Error',
          message: `Failed to load module chunk: ${error.url}. This may be due to a stale cache.`,
          severity: 'critical',
          context: {
            status: error.status,
            url: error.url,
            statusText: error.statusText,
            recoveryAction: 'reload',
          },
        };
      }

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

    // Check for module loading errors
    if (error instanceof TypeError || error instanceof Error) {
      const errorMessage = error.message || '';

      // Detect module/chunk loading failures (JS and CSS)
      // More specific checks to avoid false positives
      if (
        errorMessage.includes('Importing a module script failed') ||
        errorMessage.includes('Failed to fetch dynamically imported module') ||
        (errorMessage.includes('chunk') &&
          (errorMessage.includes('failed') ||
            errorMessage.includes('error') ||
            errorMessage.includes('404'))) ||
        errorMessage.includes('Loading chunk') ||
        errorMessage.includes('Loading CSS chunk') ||
        errorMessage.includes('Failed to load CSS chunk')
      ) {
        console.warn('🔍 Module loading error detected in analyzeError:', errorMessage);

        return {
          type: 'Module Loading Error',
          message:
            'Failed to load application module. This may be due to a stale cache or outdated build.',
          severity: 'critical',
          context: {
            originalMessage: errorMessage,
            stack: error.stack,
            recoveryAction: 'reload',
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
    }

    if (error instanceof ReferenceError) {
      return {
        type: 'Reference Error',
        message: error.message,
        severity: 'error',
        context: { stack: error.stack },
      };
    }

    if (
      error instanceof Error &&
      error.message?.includes('ExpressionChangedAfterItHasBeenCheckedError')
    ) {
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
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      severity: 'error',
      context: { stack: error instanceof Error ? error.stack : undefined },
    };
  }

  private showCriticalErrorMessage(message: string): void {
    // In a real app, this would show a toast/modal
    // For now, just log to console
    console.error('🚨 CRITICAL ERROR:', message);
  }

  /**
   * Handle window-level errors (including module loading failures)
   * Catches errors that occur before Angular error handler is ready
   */
  private handleWindowError(event: ErrorEvent): void {
    const error = event.error || event.message || '';
    const errorMessage = error instanceof Error ? error.message : String(error);
    const source = event.filename || '';

    // Check for chunk/module loading errors
    if (
      errorMessage.includes('Importing a module script failed') ||
      errorMessage.includes('Failed to fetch dynamically imported module') ||
      source.includes('chunk-') ||
      (event.target && (event.target as any).src?.includes('chunk-'))
    ) {
      console.error('🔴 Module loading error detected:', {
        message: errorMessage,
        source,
        filename: event.filename,
      });

      if (!this.recoveryAttempted) {
        this.recoveryAttempted = true;
        this.handleModuleLoadingError();
      }
    }
  }

  /**
   * Handle unhandled promise rejections (including dynamic import failures)
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const reason = event.reason;
    const errorMessage = reason instanceof Error ? reason.message : String(reason || '');

    // Check for module loading errors in promise rejections
    if (
      errorMessage.includes('Importing a module script failed') ||
      errorMessage.includes('Failed to fetch dynamically imported module') ||
      errorMessage.includes('chunk')
    ) {
      console.error('🔴 Unhandled module loading rejection:', errorMessage);

      if (!this.recoveryAttempted) {
        this.recoveryAttempted = true;
        this.handleModuleLoadingError();
      }
    }
  }

  private handleModuleLoadingError(): void {
    // Check recovery attempts to prevent infinite loops
    const recoveryKey = 'osi-recovery-attempted';
    const attempts = sessionStorage.getItem(recoveryKey);
    const maxAttempts = 3;

    if (attempts) {
      const count = parseInt(attempts, 10);
      if (count >= maxAttempts) {
        console.error('❌ Max recovery attempts reached. Please manually refresh the page.');
        // Show user-friendly message
        alert(
          'Application failed to load. Please:\n\n' +
            '1. Clear your browser cache\n' +
            '2. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)\n' +
            '3. If problem persists, contact support'
        );
        return;
      }
    }

    console.warn('🚀 IMMEDIATE RECOVERY: Clearing cache and reloading...');

    // IMMEDIATE recovery - minimal delay
    const performRecovery = () => {
      // Clear service workers but don't wait
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .getRegistrations()
          .then((registrations) => {
            if (registrations.length > 0) {
              console.log(`Clearing ${registrations.length} service worker(s)...`);
              return Promise.all(registrations.map((registration) => registration.unregister()));
            }
            return undefined;
          })
          .catch((err) => {
            console.warn('Service worker unregister failed (continuing anyway):', err);
          })
          .then(() => undefined);
      }

      // Reload IMMEDIATELY after very short delay (just enough for logs)
      setTimeout(() => {
        console.log('✅ Reloading page NOW...');
        // Clear query params and reload
        const currentHref = window.location?.href;
        if (currentHref && typeof currentHref === 'string' && currentHref.length > 0) {
          const parts = currentHref.split('?')[0]?.split('#')[0];
          const url = parts && parts.length > 0 ? parts : currentHref;
          if (url && url.length > 0) {
            window.location.replace(url);
          } else {
            window.location.reload();
          }
        } else {
          window.location.reload();
        }
      }, 500); // Reduced to 500ms for faster recovery
    };

    // Execute immediately
    performRecovery();
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
