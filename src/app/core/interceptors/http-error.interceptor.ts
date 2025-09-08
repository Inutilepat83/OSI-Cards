import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = '';

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Client Error: ${error.error.message}`;
        } else {
          // Server-side error
          errorMessage = `Server Error: ${error.status} - ${error.message}`;
        }

        console.error('HTTP Error:', errorMessage);

        // Handle specific error codes
        switch (error.status) {
          case 401:
            // Handle unauthorized
            console.warn('Unauthorized access - redirecting to login');
            break;
          case 403:
            // Handle forbidden
            console.warn('Access forbidden');
            break;
          case 404:
            // Handle not found
            console.warn('Resource not found');
            break;
          case 500:
            // Handle server error
            console.error('Server error occurred');
            break;
          default:
            console.error('An error occurred:', error);
        }

        return throwError(() => error);
      })
    );
  }
}
