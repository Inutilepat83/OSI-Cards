import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorHandlingService } from '../services/error-handling.service';

/**
 * Error Interceptor
 * 
 * HTTP interceptor that catches and handles HTTP errors globally. Transforms HTTP
 * error responses into user-friendly error messages and integrates with the
 * ErrorHandlingService for centralized error management.
 * 
 * Features:
 * - Automatic error categorization by HTTP status code
 * - User-friendly error messages
 * - Network error detection
 * - Integration with ErrorHandlingService
 * - Client-side and server-side error handling
 * 
 * @example
 * ```typescript
 * // Automatically intercepts all HTTP errors
 * this.http.get('/api/data').subscribe({
 *   next: data => console.log(data),
 *   error: error => {
 *     // Error is already processed by interceptor
 *     console.error('Error:', error);
 *   }
 * });
 * ```
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private readonly errorHandlingService = inject(ErrorHandlingService);

  intercept<T>(req: HttpRequest<T>, next: HttpHandler): Observable<HttpEvent<T>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An error occurred';

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = error.error.message || 'A client-side error occurred';
        } else {
          // Server-side error
          switch (error.status) {
            case 0:
              errorMessage = 'Network error. Please check your connection.';
              break;
            case 400:
              errorMessage = error.error?.message || 'Invalid request. Please check your input.';
              break;
            case 401:
              errorMessage = 'Unauthorized. Please log in.';
              break;
            case 403:
              errorMessage = 'Access forbidden. You don\'t have permission.';
              break;
            case 404:
              errorMessage = error.error?.message || 'Resource not found.';
              break;
            case 500:
              errorMessage = 'Server error. Please try again later.';
              break;
            default:
              errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
          }
        }

        const appError = this.errorHandlingService.handleError(
          new Error(errorMessage),
          `HTTP ${error.status || 'Network'}`
        );

        return throwError(() => appError);
      })
    );
  }
}

