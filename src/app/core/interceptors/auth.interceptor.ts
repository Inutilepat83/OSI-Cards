import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Get authentication token from storage
    const token = this.getAuthToken();

    // Skip adding token for auth endpoints
    if (this.isAuthEndpoint(request.url)) {
      return next.handle(request);
    }

    // Clone request and add authorization header if token exists
    if (token) {
      const authRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
      return next.handle(authRequest);
    }

    return next.handle(request);
  }

  private getAuthToken(): string | null {
    // Get token from localStorage, sessionStorage, or other secure storage
    return localStorage.getItem('auth_token');
  }

  private isAuthEndpoint(url: string): boolean {
    // Define authentication endpoints that shouldn't include auth headers
    const authEndpoints = ['/auth/login', '/auth/register', '/auth/refresh'];
    return authEndpoints.some(endpoint => url.includes(endpoint));
  }
}
