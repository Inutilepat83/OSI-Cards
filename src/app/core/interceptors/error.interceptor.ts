import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorHandlingService, ErrorType } from '../services/error-handling.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private readonly errorHandlingService = inject(ErrorHandlingService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An error occurred';
        let errorType = ErrorType.UNKNOWN;

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = error.error.message || 'A client-side error occurred';
          errorType = ErrorType.NETWORK;
        } else {
          // Server-side error
          switch (error.status) {
            case 0:
              errorMessage = 'Network error. Please check your connection.';
              errorType = ErrorType.NETWORK;
              break;
            case 400:
              errorMessage = error.error?.message || 'Invalid request. Please check your input.';
              errorType = ErrorType.VALIDATION;
              break;
            case 401:
              errorMessage = 'Unauthorized. Please log in.';
              errorType = ErrorType.BUSINESS_LOGIC;
              break;
            case 403:
              errorMessage = 'Access forbidden. You don\'t have permission.';
              errorType = ErrorType.BUSINESS_LOGIC;
              break;
            case 404:
              errorMessage = error.error?.message || 'Resource not found.';
              errorType = ErrorType.BUSINESS_LOGIC;
              break;
            case 500:
              errorMessage = 'Server error. Please try again later.';
              errorType = ErrorType.NETWORK;
              break;
            default:
              errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
              errorType = ErrorType.UNKNOWN;
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

