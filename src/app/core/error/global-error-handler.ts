import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { LoggingService } from '../services/logging.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(
    private injector: Injector,
    private logger: LoggingService
  ) {}

  handleError(error: any): void {
    let errorMessage = '';

    if (error instanceof HttpErrorResponse) {
      // Server error
      errorMessage = `HTTP Error: ${error.status} - ${error.message}`;
      this.logger.error('GlobalErrorHandler', 'HTTP Error', error);
    } else if (error instanceof Error) {
      // Client error
      errorMessage = error.message;
      this.logger.error('GlobalErrorHandler', 'Client Error', error);
    } else {
      // Unknown error
      errorMessage = 'An unknown error occurred';
      this.logger.error('GlobalErrorHandler', 'Unknown Error', error);
    }

    // Log to external service in production
    if (!this.isDevelopment()) {
      this.logErrorToService(error, errorMessage);
    }

    // Re-throw error in development
    if (this.isDevelopment()) {
      throw error;
    }
  }

  private isDevelopment(): boolean {
    return !environment.production;
  }

  private logErrorToService(error: any, message: string): void {
    // TODO: Implement external error logging service
    this.logger.error('GlobalErrorHandler', 'Error logged to service', {
      error,
      message,
      timestamp: new Date(),
    });
  }
}

// Import environment here to avoid circular dependencies
import { environment } from '../../../environments/environment';
