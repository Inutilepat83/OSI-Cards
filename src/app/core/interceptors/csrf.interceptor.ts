/**
 * CSRF Token Interceptor
 *
 * @description
 * Automatically adds CSRF tokens to outgoing HTTP requests for protection
 * against Cross-Site Request Forgery attacks.
 *
 * @example
 * ```typescript
 * import { provideHttpClient, withInterceptors } from '@angular/common/http';
 * import { csrfInterceptor } from '@core/interceptors';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideHttpClient(
 *       withInterceptors([csrfInterceptor])
 *     )
 *   ]
 * };
 * ```
 *
 * @public
 */

import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * CSRF token header name
 */
const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * CSRF token cookie name
 */
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';

/**
 * CSRF token meta tag name
 */
const CSRF_META_NAME = 'csrf-token';

/**
 * HTTP methods that require CSRF token
 */
const CSRF_REQUIRED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

/**
 * Get CSRF token from various sources
 *
 * @description
 * Attempts to retrieve CSRF token from:
 * 1. Meta tag in HTML head
 * 2. Cookie
 * 3. localStorage (fallback)
 *
 * @returns CSRF token or null if not found
 *
 * @private
 */
function getCSRFToken(): string | null {
  // Try meta tag first (most secure for SSR)
  if (typeof document !== 'undefined') {
    const metaTag = document.querySelector<HTMLMetaElement>(`meta[name="${CSRF_META_NAME}"]`);
    if (metaTag && metaTag.content) {
      return metaTag.content;
    }
  }

  // Try cookie
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`));
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  // Fallback to localStorage (least secure, only if needed)
  if (typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('csrf-token');
    if (token) {
      return token;
    }
  }

  return null;
}

/**
 * Check if request requires CSRF token
 *
 * @param req - HTTP request to check
 * @returns True if CSRF token is required
 *
 * @private
 */
function requiresCSRFToken(req: HttpRequest<unknown>): boolean {
  // Check if method requires CSRF
  if (!CSRF_REQUIRED_METHODS.includes(req.method)) {
    return false;
  }

  // Check if request is to external API (no CSRF needed)
  const url = req.url.toLowerCase();
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // External URL - only add CSRF if to same origin
    if (typeof window !== 'undefined') {
      try {
        const requestUrl = new URL(req.url);
        const currentOrigin = window.location.origin;
        return requestUrl.origin === currentOrigin;
      } catch {
        return false;
      }
    }
    return false;
  }

  // Relative URL - add CSRF
  return true;
}

/**
 * CSRF Token Interceptor Function
 *
 * @description
 * Functional interceptor that adds CSRF token to applicable requests.
 * Compatible with Angular's new functional interceptor API.
 *
 * @param req - HTTP request
 * @param next - Next handler in chain
 * @returns Observable of HTTP event
 *
 * @example
 * ```typescript
 * // In app.config.ts
 * import { csrfInterceptor } from '@core/interceptors';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideHttpClient(withInterceptors([csrfInterceptor]))
 *   ]
 * };
 * ```
 *
 * @public
 */
export const csrfInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  // Check if CSRF token is needed
  if (!requiresCSRFToken(req)) {
    return next(req);
  }

  // Get CSRF token
  const token = getCSRFToken();

  if (!token) {
    console.warn('[CSRFInterceptor] CSRF token not found. Request may be rejected by server.');
    return next(req);
  }

  // Clone request with CSRF token header
  const clonedReq = req.clone({
    headers: req.headers.set(CSRF_HEADER_NAME, token),
  });

  return next(clonedReq);
};

/**
 * Set CSRF token (for manual token management)
 *
 * @description
 * Stores CSRF token in meta tag for retrieval by interceptor.
 * Should be called after receiving token from backend.
 *
 * @param token - CSRF token to store
 *
 * @example
 * ```typescript
 * // After login or token refresh
 * setCSRFToken(response.csrfToken);
 * ```
 *
 * @public
 */
export function setCSRFToken(token: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  // Set in meta tag
  let metaTag = document.querySelector<HTMLMetaElement>(`meta[name="${CSRF_META_NAME}"]`);

  if (!metaTag) {
    metaTag = document.createElement('meta');
    metaTag.name = CSRF_META_NAME;
    document.head.appendChild(metaTag);
  }

  metaTag.content = token;

  // Also set in localStorage as backup
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('csrf-token', token);
  }
}

/**
 * Clear CSRF token (on logout)
 *
 * @description
 * Removes CSRF token from all storage locations.
 * Should be called on logout or session expiry.
 *
 * @example
 * ```typescript
 * // On logout
 * clearCSRFToken();
 * ```
 *
 * @public
 */
export function clearCSRFToken(): void {
  if (typeof document !== 'undefined') {
    const metaTag = document.querySelector<HTMLMetaElement>(`meta[name="${CSRF_META_NAME}"]`);
    if (metaTag) {
      metaTag.remove();
    }
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('csrf-token');
  }
}
