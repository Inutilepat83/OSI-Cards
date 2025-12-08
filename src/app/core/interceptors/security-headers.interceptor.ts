import { inject, Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SecurityHeadersService } from '../services/security-headers.service';
import { LoggingService } from '../services/logging.service';

/**
 * Security Headers Interceptor
 *
 * Injects security headers into HTTP responses. Note that in a browser environment,
 * HTTP interceptors cannot modify response headers (only request headers). This interceptor
 * is primarily for logging and documentation purposes. Actual security headers should be
 * set at the server level.
 *
 * For server-side rendering or API responses, security headers should be configured in:
 * - Server configuration (nginx, Apache, etc.)
 * - API gateway
 * - CDN configuration
 *
 * @example
 * ```typescript
 * // In app.config.ts
 * provideHttpClient(
 *   withInterceptors([securityHeadersInterceptor])
 * )
 * ```
 */
@Injectable()
export class SecurityHeadersInterceptor implements HttpInterceptor {
  private readonly securityHeadersService = inject(SecurityHeadersService);
  private readonly logger = inject(LoggingService);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get security headers from service
    const securityHeaders = this.securityHeadersService.getSecurityHeaders();

    // Log security headers (for debugging)
    if (Object.keys(securityHeaders).length > 0) {
      this.logger.debug('Security headers configured', 'SecurityHeadersInterceptor', {
        headers: Object.keys(securityHeaders),
        url: req.url,
      });
    }

    // Note: In browser, we can only modify request headers, not response headers
    // Add security-related request headers if needed
    const modifiedReq = req.clone({
      setHeaders: {
        // Add any security-related request headers here
        // Example: 'X-Requested-With': 'XMLHttpRequest'
      },
    });

    return next.handle(modifiedReq).pipe(
      tap((event) => {
        // Log response for security auditing
        if (event instanceof HttpResponse) {
          // Check if response has security headers
          const responseHeaders = event.headers.keys();
          const hasSecurityHeaders = Array.from(responseHeaders).some(
            (header) =>
              header.toLowerCase().includes('x-content-type-options') ||
              header.toLowerCase().includes('x-frame-options') ||
              header.toLowerCase().includes('content-security-policy')
          );

          if (!hasSecurityHeaders && req.url.startsWith('/')) {
            // Warn if internal requests don't have security headers
            this.logger.warn('Response missing security headers', 'SecurityHeadersInterceptor', {
              url: req.url,
            });
          }
        }
      })
    );
  }
}

/**
 * Factory function to create the interceptor
 */
export function securityHeadersInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandler
): Observable<HttpEvent<unknown>> {
  const interceptor = inject(SecurityHeadersInterceptor);
  return interceptor.intercept(req, next);
}



