import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { SecurityService } from '../services/security.service';
import { AdvancedSecurityService } from '../services/advanced-security.service';
import { LoggingService } from '../services/logging.service';

@Injectable()
export class SecurityInterceptor implements HttpInterceptor {
  constructor(
    private securityService: SecurityService,
    private advancedSecurityService: AdvancedSecurityService,
    private logger: LoggingService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Generate a unique key for rate limiting (IP + endpoint)
    const clientKey = this.getClientKey(request);

    // Check rate limits
    if (!this.advancedSecurityService.isWithinRateLimit(clientKey, this.getCategory(request))) {
      this.advancedSecurityService.logSecurityEvent('rate_limit_exceeded', {
        url: request.url,
        method: request.method,
        clientKey,
      });
      return throwError(() => new Error('Rate limit exceeded. Please try again later.'));
    }

    // Validate URL against allowed domains
    if (!this.securityService.isAllowedDomain(request.url)) {
      this.advancedSecurityService.logSecurityEvent('unauthorized_domain', {
        url: request.url,
        method: request.method,
      });
      this.logger.warn(
        'SecurityInterceptor',
        `Blocked request to unauthorized domain: ${request.url}`
      );
      throw new Error(`Request to ${request.url} is not allowed`);
    }

    // Add security headers
    let secureRequest = request.clone({
      headers: request.headers
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('X-Content-Type-Options', 'nosniff')
        .set('X-Frame-Options', 'DENY')
        .set('Referrer-Policy', 'strict-origin-when-cross-origin'),
    });

    // Add CSRF token if available
    const csrfToken = this.advancedSecurityService.getCsrfToken();
    if (csrfToken) {
      secureRequest = secureRequest.clone({
        headers: secureRequest.headers.set('X-CSRF-Token', csrfToken),
      });
    }

    // Sanitize request body if it contains user input
    if (request.body && typeof request.body === 'object') {
      secureRequest = secureRequest.clone({
        body: this.sanitizeRequestBody(request.body),
      });
    }

    return next.handle(secureRequest);
  }

  /**
   * Generate a unique client key for rate limiting
   */
  private getClientKey(request: HttpRequest<any>): string {
    // In production, you'd use the actual client IP
    // For now, we'll use a combination of user agent and endpoint
    const userAgent = navigator.userAgent;
    const endpoint = request.url.split('?')[0]; // Remove query parameters
    return btoa(`${userAgent}:${endpoint}`).substring(0, 32);
  }

  /**
   * Determine the rate limit category based on the request
   */
  private getCategory(request: HttpRequest<any>): string {
    const url = request.url.toLowerCase();

    if (url.includes('/auth/') || url.includes('/login') || url.includes('/register')) {
      return 'auth';
    }

    if (url.includes('/search') || url.includes('/filter')) {
      return 'search';
    }

    if (url.includes('/assets/')) {
      return 'assets';
    }

    return 'api';
  }

  /**
   * Sanitize request body to prevent XSS
   */
  private sanitizeRequestBody(body: any): any {
    if (typeof body === 'string') {
      return this.securityService.sanitizeUserInput(body);
    }

    if (Array.isArray(body)) {
      return body.map(item => this.sanitizeRequestBody(item));
    }

    if (typeof body === 'object' && body !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(body)) {
        if (typeof value === 'string') {
          sanitized[key] = this.securityService.sanitizeUserInput(value);
        } else {
          sanitized[key] = this.sanitizeRequestBody(value);
        }
      }
      return sanitized;
    }

    return body;
  }
}
