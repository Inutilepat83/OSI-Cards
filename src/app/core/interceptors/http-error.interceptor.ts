import { Injectable, Inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
  HttpResponse,
} from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry, timeout, tap, finalize } from 'rxjs/operators';
import { NotificationService } from '../interfaces/services.interface';
import { LoggingService } from '../services/logging.service';
import { NOTIFICATION_SERVICE } from '../interfaces/injection-tokens';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  private requestsInProgress = new Set<string>();

  constructor(
    private logger: LoggingService,
    @Inject(NOTIFICATION_SERVICE) private notification: NotificationService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    const isAssetRequest = req.url.includes('/assets/');

    // Add request tracking
    this.requestsInProgress.add(requestId);

    // For asset requests, pass through with minimal modification
    if (isAssetRequest) {
      const enhancedReq = req.clone({
        setHeaders: {
          'X-Request-ID': requestId,
        },
      });

      this.logger.log('HttpErrorInterceptor', `Asset Request: ${req.method} ${req.url}`, {
        requestId,
        method: req.method,
        url: req.url,
      });

      return next.handle(enhancedReq).pipe(
        timeout(10000), // 10 second timeout for assets
        tap(event => {
          if (event instanceof HttpResponse) {
            const duration = Date.now() - startTime;
            this.logger.log(
              'HttpErrorInterceptor',
              `Asset Response: ${req.method} ${req.url} (${duration}ms) - Status: ${event.status}`,
              { requestId, status: event.status, duration }
            );
          }
        }),
        catchError((error: HttpErrorResponse) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            'HttpErrorInterceptor',
            `Asset Error: ${req.method} ${req.url} (${duration}ms) - Status: ${error.status}`,
            { requestId, status: error.status, duration, error: error.message }
          );
          return throwError(() => error);
        }),
        finalize(() => {
          this.requestsInProgress.delete(requestId);
        })
      );
    }

    // Add common headers for API requests
    const headers: { [key: string]: string } = {
      'X-Request-ID': requestId,
      'Content-Type': 'application/json',
    };

    const enhancedReq = req.clone({
      setHeaders: headers,
    });

    // Log outgoing request
    this.logger.log('HttpErrorInterceptor', `HTTP Request: ${req.method} ${req.url}`, {
      requestId,
      method: req.method,
      url: req.url,
      headers: req.headers.keys(),
    });

    // Different handling for asset requests vs API requests
    const timeoutMs = 30000; // 30 seconds for API requests
    
    const stream = next.handle(enhancedReq).pipe(
      timeout(timeoutMs),
    );

    // Add retry for API requests
    const streamWithRetry = stream.pipe(
      retry({
        count: 2,
        delay: (error, retryCount) => {
          if (this.shouldRetry(error)) {
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
            this.logger.warn(
              'HttpErrorInterceptor',
              `Retrying request ${requestId} in ${delay}ms (attempt ${retryCount + 1})`
            );
            return timer(delay);
          }
          return throwError(() => error);
        },
      })
    );

    return streamWithRetry.pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          const duration = Date.now() - startTime;
          this.logger.log(
            'HttpErrorInterceptor',
            `HTTP Response: ${req.method} ${req.url} (${duration}ms)`,
            { requestId, status: event.status, duration }
          );
        }
      }),
      catchError((error: HttpErrorResponse) => {
        const duration = Date.now() - startTime;

        this.logger.error(
          'HttpErrorInterceptor',
          `HTTP Error: ${req.method} ${req.url} (${duration}ms)`,
          error
        );

        this.handleHttpError(error);
        return throwError(() => error);
      }),
      finalize(() => {
        this.requestsInProgress.delete(requestId);
      })
    );
  }

  private generateRequestId(): string {
    return (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
  }

  private shouldRetry(error: HttpErrorResponse): boolean {
    // Only retry on network errors and 5xx server errors, not on 404 or other client errors
    return error.status === 0 || (error.status >= 500 && error.status < 600);
  }

  private handleHttpError(error: HttpErrorResponse): void {
    switch (error.status) {
      case 0:
        this.notification.showError(
          'Unable to connect to the server. Please check your internet connection.',
          'Connection Error'
        );
        break;

      case 400:
        this.notification.showWarning('Invalid request. Please check your input.', 'Bad Request');
        break;

      case 401:
        this.notification.showError('Authentication required. Please log in.', 'Unauthorized');
        // Optionally redirect to login
        break;

      case 403:
        this.notification.showError(
          'You do not have permission to perform this action.',
          'Forbidden'
        );
        break;

      case 404:
        this.notification.showWarning('The requested resource was not found.', 'Not Found');
        break;

      case 422:
        this.notification.showWarning('Please check your input data.', 'Validation Error');
        break;

      case 429:
        this.notification.showWarning(
          'Too many requests. Please wait a moment before trying again.',
          'Rate Limited'
        );
        break;

      case 500:
        this.notification.showError(
          'Server error occurred. Please try again later.',
          'Server Error'
        );
        break;

      case 502:
      case 503:
      case 504:
        this.notification.showError(
          'Service temporarily unavailable. Please try again later.',
          'Service Unavailable'
        );
        break;

      default:
        this.notification.showError(`Unexpected error occurred (${error.status}).`, 'Error');
        break;
    }
  }

  public getActiveRequestsCount(): number {
    return this.requestsInProgress.size;
  }

  public isRequestInProgress(): boolean {
    return this.requestsInProgress.size > 0;
  }
}
