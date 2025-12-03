/**
 * HTTP Interceptor Helpers
 *
 * Utilities for creating and managing HTTP interceptors with common
 * patterns like authentication, caching, retry, and logging.
 *
 * Features:
 * - Token injection
 * - Request/response logging
 * - Error handling
 * - Caching strategy
 * - Request timing
 *
 * @example
 * ```typescript
 * import { createAuthInterceptor } from '@osi-cards/utils';
 *
 * export const authInterceptor = createAuthInterceptor(() => {
 *   return localStorage.getItem('token');
 * });
 * ```
 */

import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { tap, catchError, retry, timeout as rxTimeout, finalize } from 'rxjs/operators';

/**
 * Create authentication interceptor
 *
 * @param getToken - Function to get auth token
 * @param headerName - Auth header name (default: 'Authorization')
 * @param tokenPrefix - Token prefix (default: 'Bearer ')
 * @returns HTTP interceptor function
 *
 * @example
 * ```typescript
 * export const authInterceptor = createAuthInterceptor(
 *   () => localStorage.getItem('token')
 * );
 * ```
 */
export function createAuthInterceptor(
  getToken: () => string | null,
  headerName = 'Authorization',
  tokenPrefix = 'Bearer '
): HttpInterceptorFn {
  return (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    const token = getToken();

    if (token) {
      req = req.clone({
        setHeaders: {
          [headerName]: `${tokenPrefix}${token}`
        }
      });
    }

    return next(req);
  };
}

/**
 * Create logging interceptor
 *
 * @param logger - Optional custom logger function
 * @returns HTTP interceptor function
 *
 * @example
 * ```typescript
 * export const loggingInterceptor = createLoggingInterceptor(
 *   (message, data) => console.log(message, data)
 * );
 * ```
 */
export function createLoggingInterceptor(
  logger?: (message: string, data: any) => void
): HttpInterceptorFn {
  const log = logger || ((msg: string, data: any) => console.log(msg, data));

  return (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    const started = Date.now();

    log('HTTP Request', {
      method: req.method,
      url: req.url,
      headers: req.headers.keys(),
    });

    return next(req).pipe(
      tap(event => {
        if (event.type === 4) { // HttpEventType.Response
          const elapsed = Date.now() - started;
          log('HTTP Response', {
            method: req.method,
            url: req.url,
            status: (event as any).status,
            elapsed: `${elapsed}ms`,
          });
        }
      }),
      catchError(error => {
        const elapsed = Date.now() - started;
        log('HTTP Error', {
          method: req.method,
          url: req.url,
          error: error.message,
          elapsed: `${elapsed}ms`,
        });
        return throwError(() => error);
      })
    );
  };
}

/**
 * Create timing interceptor
 *
 * @param onTiming - Callback with timing info
 * @returns HTTP interceptor function
 */
export function createTimingInterceptor(
  onTiming: (url: string, duration: number) => void
): HttpInterceptorFn {
  return (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    const started = Date.now();

    return next(req).pipe(
      finalize(() => {
        const duration = Date.now() - started;
        onTiming(req.url, duration);
      })
    );
  };
}

/**
 * Create retry interceptor
 *
 * @param options - Retry options
 * @returns HTTP interceptor function
 *
 * @example
 * ```typescript
 * export const retryInterceptor = createRetryInterceptor({
 *   count: 3,
 *   delay: 1000,
 *   retryableStatuses: [408, 429, 500, 502, 503, 504]
 * });
 * ```
 */
export function createRetryInterceptor(options: {
  count?: number;
  delay?: number;
  retryableStatuses?: number[];
}): HttpInterceptorFn {
  const { count = 3, delay = 1000, retryableStatuses = [408, 429, 500, 502, 503, 504] } = options;

  return (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    return next(req).pipe(
      retry({
        count,
        delay: (error, retryCount) => {
          // Check if error is retryable
          const isRetryable = retryableStatuses.includes(error.status);

          if (!isRetryable) {
            throw error;
          }

          // Exponential backoff
          const backoffDelay = delay * Math.pow(2, retryCount - 1);
          return timer(backoffDelay);
        }
      })
    );
  };
}

/**
 * Create timeout interceptor
 *
 * @param timeoutMs - Timeout in milliseconds
 * @returns HTTP interceptor function
 *
 * @example
 * ```typescript
 * export const timeoutInterceptor = createTimeoutInterceptor(30000);
 * ```
 */
export function createTimeoutInterceptor(timeoutMs: number): HttpInterceptorFn {
  return (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    return next(req).pipe(rxTimeout(timeoutMs));
  };
}

/**
 * Create base URL interceptor
 *
 * @param baseUrl - Base URL to prepend
 * @returns HTTP interceptor function
 *
 * @example
 * ```typescript
 * export const baseUrlInterceptor = createBaseUrlInterceptor('/api/v1');
 * ```
 */
export function createBaseUrlInterceptor(baseUrl: string): HttpInterceptorFn {
  return (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    // Only prepend if URL is relative
    if (!req.url.startsWith('http')) {
      req = req.clone({
        url: `${baseUrl}${req.url}`
      });
    }

    return next(req);
  };
}

/**
 * Create header interceptor
 *
 * @param headers - Headers to add to all requests
 * @returns HTTP interceptor function
 *
 * @example
 * ```typescript
 * export const headerInterceptor = createHeaderInterceptor({
 *   'X-App-Version': '1.0.0',
 *   'X-Client-Id': 'web-app'
 * });
 * ```
 */
export function createHeaderInterceptor(
  headers: Record<string, string>
): HttpInterceptorFn {
  return (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    req = req.clone({
      setHeaders: headers
    });

    return next(req);
  };
}

/**
 * Create error handler interceptor
 *
 * @param errorHandler - Custom error handler
 * @returns HTTP interceptor function
 *
 * @example
 * ```typescript
 * export const errorInterceptor = createErrorHandlerInterceptor(
 *   (error) => {
 *     if (error.status === 401) {
 *       router.navigate(['/login']);
 *     }
 *   }
 * );
 * ```
 */
export function createErrorHandlerInterceptor(
  errorHandler: (error: any) => void
): HttpInterceptorFn {
  return (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    return next(req).pipe(
      catchError(error => {
        errorHandler(error);
        return throwError(() => error);
      })
    );
  };
}

/**
 * Create cache interceptor
 *
 * @param cacheable - Function to determine if request should be cached
 * @returns HTTP interceptor function
 */
export function createCacheInterceptor(
  cacheable: (req: HttpRequest<unknown>) => boolean = (req) => req.method === 'GET'
): HttpInterceptorFn {
  const cache = new Map<string, any>();

  return (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    // Only cache GET requests by default
    if (!cacheable(req)) {
      return next(req);
    }

    const cached = cache.get(req.url);
    if (cached) {
      return new Observable(observer => {
        observer.next(cached);
        observer.complete();
      });
    }

    return next(req).pipe(
      tap(event => {
        if (event.type === 4) { // Response
          cache.set(req.url, event);
        }
      })
    );
  };
}

/**
 * Note: In Angular 15+, use `provideHttpClient(withInterceptors([...]))`
 * to combine interceptors. This utility is provided for reference.
 *
 * @example
 * ```typescript
 * // In app.config.ts or providers:
 * provideHttpClient(
 *   withInterceptors([
 *     authInterceptor,
 *     loggingInterceptor,
 *     retryInterceptor
 *   ])
 * )
 * ```
 */

