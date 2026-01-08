import { inject, Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ValidationService } from '../services/validation.service';

/**
 * Input Validation Interceptor
 *
 * HTTP interceptor that validates request data before sending.
 */
@Injectable()
export class InputValidationInterceptor implements HttpInterceptor {
  private readonly validationService = inject(ValidationService);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Basic validation - can be extended as needed
    // For now, just pass through
    return next.handle(req);
  }
}
