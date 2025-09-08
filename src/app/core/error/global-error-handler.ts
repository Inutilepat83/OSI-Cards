import { ErrorHandler, Injectable, Injector, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private injector = inject(Injector);

  handleError(error: unknown): void {
    let errorMessage = '';

    if (error instanceof HttpErrorResponse) {
      // Server error
      errorMessage = `HTTP Error: ${error.status} - ${error.message}`;
      console.error('HTTP Error:', error);
    } else if (error instanceof Error) {
      // Client error
      errorMessage = error.message;
      console.error('Client Error:', error);
    } else {
      // Unknown error
      errorMessage = 'An unknown error occurred';
      console.error('Unknown Error:', error);
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

  private logErrorToService(error: unknown, message: string): void {
    // TODO: Implement external error logging service
    console.error('Error logged to service:', { error, message, timestamp: new Date() });
  }
}

// Import environment here to avoid circular dependencies
import { environment } from '../../../environments/environment';
