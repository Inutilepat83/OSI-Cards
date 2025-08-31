import { Injectable, ErrorHandler, Inject } from '@angular/core';
import { LOGGING_SERVICE, NOTIFICATION_SERVICE } from '../interfaces/injection-tokens';
import { LoggingService } from '../interfaces/services.interface';
import { NotificationService } from '../interfaces/services.interface';

@Injectable()
export class EnhancedGlobalErrorHandler implements ErrorHandler {
  constructor(
    @Inject(LOGGING_SERVICE) private logger: LoggingService,
    @Inject(NOTIFICATION_SERVICE) private notification: NotificationService
  ) {}

  handleError(error: any): void {
    // Log the error
    this.logger.error('Global error occurred', error);

    // Extract meaningful error message
    const message = this.extractErrorMessage(error);

    // Show user-friendly notification
    if (this.isNetworkError(error)) {
      this.notification.showWarning(
        'Network connection issue. Please check your internet connection.',
        'Connection Error'
      );
    } else if (this.isValidationError(error)) {
      this.notification.showWarning(message, 'Validation Error');
    } else if (this.isAuthenticationError(error)) {
      this.notification.showError(
        'Authentication failed. Please log in again.',
        'Authentication Error'
      );
    } else {
      this.notification.showError('An unexpected error occurred. Please try again.', 'Error');
    }

    // Send to external monitoring service in production
    if (this.isProduction()) {
      this.sendToMonitoringService(error);
    }
  }

  private extractErrorMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }

    if (error?.message) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'An unknown error occurred';
  }

  private isNetworkError(error: any): boolean {
    return (
      error?.status === 0 || error?.name === 'NetworkError' || error?.message?.includes('network')
    );
  }

  private isValidationError(error: any): boolean {
    return error?.status >= 400 && error?.status < 500;
  }

  private isAuthenticationError(error: any): boolean {
    return error?.status === 401 || error?.status === 403;
  }

  private isProduction(): boolean {
    return false; // Replace with actual environment check
  }

  private sendToMonitoringService(error: any): void {
    // Implement integration with monitoring service
    // e.g., Sentry, Bugsnag, etc.
    this.logger.info('Would send to monitoring service', error);
  }
}
