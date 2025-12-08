/**
 * HTTP Interceptors Collection
 *
 * A collection of 5 production-ready HTTP interceptors.
 *
 * Interceptors:
 * 1. LoadingInterceptor
 * 2. ErrorInterceptor
 * 3. CachingInterceptor
 * 4. RetryInterceptor
 * 5. HeadersInterceptor
 */

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, retry, throwError, tap, of } from 'rxjs';

/**
 * 1. Loading Interceptor Factory
 */
export function createLoadingInterceptor(
  onLoadingChange: (loading: boolean) => void
): HttpInterceptorFn {
  return (req, next) => {
    onLoadingChange(true);

    return next(req).pipe(
      tap(() => onLoadingChange(false)),
      catchError((error) => {
        onLoadingChange(false);
        return throwError(() => error);
      })
    );
  };
}

/**
 * 2. Error Interceptor Factory
 */
export function createErrorInterceptor(
  onError: (error: HttpErrorResponse) => void
): HttpInterceptorFn {
  return (req, next) => {
    return next(req).pipe(
      catchError((error: HttpErrorResponse) => {
        onError(error);
        return throwError(() => error);
      })
    );
  };
}

/**
 * 3. Caching Interceptor Factory
 */
export function createCachingInterceptor(
  cache: Map<string, any>,
  cacheable: (url: string) => boolean = () => true
): HttpInterceptorFn {
  return (req, next) => {
    if (req.method !== 'GET' || !cacheable(req.url)) {
      return next(req);
    }

    const cached = cache.get(req.url);
    if (cached) {
      return of(cached);
    }

    return next(req).pipe(
      tap((response) => {
        cache.set(req.url, response);
      })
    );
  };
}

/**
 * 4. Retry Interceptor Factory
 */
export function createRetryInterceptor(count = 3, delay = 1000): HttpInterceptorFn {
  return (req, next) => {
    return next(req).pipe(retry({ count, delay }));
  };
}

/**
 * 5. Headers Interceptor Factory
 */
export function createHeadersInterceptor(headers: Record<string, string>): HttpInterceptorFn {
  return (req, next) => {
    const modifiedReq = req.clone({
      setHeaders: headers,
    });

    return next(modifiedReq);
  };
}

/**
 * Auth Token Interceptor Factory
 */
export function createAuthTokenInterceptor(getToken: () => string | null): HttpInterceptorFn {
  return (req, next) => {
    const token = getToken();

    if (token) {
      const modifiedReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
      return next(modifiedReq);
    }

    return next(req);
  };
}

/**
 * Logging Interceptor Factory
 */
export function createLoggingInterceptor(
  log: (message: string, data?: any) => void
): HttpInterceptorFn {
  return (req, next) => {
    const started = Date.now();
    log(`HTTP ${req.method} ${req.url}`);

    return next(req).pipe(
      tap((response) => {
        const elapsed = Date.now() - started;
        log(`HTTP ${req.method} ${req.url} - ${elapsed}ms`, response);
      }),
      catchError((error) => {
        const elapsed = Date.now() - started;
        log(`HTTP ${req.method} ${req.url} - ERROR after ${elapsed}ms`, error);
        return throwError(() => error);
      })
    );
  };
}



