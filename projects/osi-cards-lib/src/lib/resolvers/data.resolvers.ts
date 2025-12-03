/**
 * Data Resolvers Collection
 *
 * A collection of 8 route resolvers for common data fetching patterns.
 *
 * Resolvers:
 * 1. EntityResolver - Generic entity resolver
 * 2. ListResolver - Generic list resolver
 * 3. UserResolver - User data resolver
 * 4. ConfigResolver - Configuration resolver
 * 5. CachedResolver - Cached data resolver
 * 6. PreloadResolver - Preload multiple resources
 * 7. LazyResolver - Lazy load resolver
 * 8. FallbackResolver - Resolver with fallback
 */

import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Observable, of, catchError } from 'rxjs';

/**
 * 1. Entity Resolver Factory
 */
export function createEntityResolver<T>(
  fetchFn: (id: string) => Observable<T>,
  paramName = 'id'
): ResolveFn<T | null> {
  return (route) => {
    const id = route.paramMap.get(paramName);
    if (!id) return of(null);

    return fetchFn(id).pipe(
      catchError(() => of(null))
    );
  };
}

/**
 * 2. List Resolver Factory
 */
export function createListResolver<T>(
  fetchFn: () => Observable<T[]>
): ResolveFn<T[]> {
  return () => {
    return fetchFn().pipe(
      catchError(() => of([]))
    );
  };
}

/**
 * 3. User Resolver Factory
 */
export function createUserResolver<T>(
  fetchUserFn: () => Observable<T>
): ResolveFn<T | null> {
  return () => {
    return fetchUserFn().pipe(
      catchError(() => of(null))
    );
  };
}

/**
 * 4. Config Resolver Factory
 */
export function createConfigResolver<T>(
  fetchConfigFn: () => Observable<T>,
  defaultConfig: T
): ResolveFn<T> {
  return () => {
    return fetchConfigFn().pipe(
      catchError(() => of(defaultConfig))
    );
  };
}

/**
 * 5. Cached Resolver Factory
 */
export function createCachedResolver<T>(
  fetchFn: () => Observable<T>,
  cacheKey: string,
  ttl = 60000
): ResolveFn<T | null> {
  const cache = new Map<string, { data: T; timestamp: number }>();

  return () => {
    const cached = cache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < ttl) {
      return of(cached.data);
    }

    return new Observable<T | null>(observer => {
      fetchFn().pipe(
        catchError(() => of(null as T | null))
      ).subscribe(data => {
        if (data) {
          cache.set(cacheKey, { data, timestamp: now });
        }
        observer.next(data);
        observer.complete();
      });
    });
  };
}

/**
 * 6. Preload Resolver Factory
 */
export function createPreloadResolver<T extends Record<string, any>>(
  resolvers: { [K in keyof T]: () => Observable<T[K]> }
): ResolveFn<T> {
  return () => {
    const observables: Record<string, Observable<any>> = {};

    Object.entries(resolvers).forEach(([key, resolver]) => {
      observables[key] = resolver();
    });

    return new Observable<T>(observer => {
      const results: Partial<T> = {};
      let completed = 0;
      const total = Object.keys(observables).length;

      Object.entries(observables).forEach(([key, obs]) => {
        obs.pipe(
          catchError(() => of(null))
        ).subscribe(data => {
          results[key as keyof T] = data;
          completed++;

          if (completed === total) {
            observer.next(results as T);
            observer.complete();
          }
        });
      });
    });
  };
}

/**
 * 7. Lazy Resolver Factory
 */
export function createLazyResolver<T>(
  fetchFn: () => Observable<T>
): ResolveFn<T | null> {
  let cached: T | null = null;

  return () => {
    if (cached) {
      return of(cached);
    }

    return fetchFn().pipe(
      catchError(() => of(null))
    );
  };
}

/**
 * 8. Fallback Resolver Factory
 */
export function createFallbackResolver<T>(
  fetchFn: () => Observable<T>,
  fallbackValue: T
): ResolveFn<T> {
  return () => {
    return fetchFn().pipe(
      catchError(() => of(fallbackValue))
    );
  };
}

