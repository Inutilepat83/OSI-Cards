/**
 * Routing Helpers
 *
 * Utilities for Angular routing including navigation guards,
 * route data access, and URL manipulation.
 *
 * Features:
 * - Route guards
 * - Navigation utilities
 * - Query parameter management
 * - Route data access
 * - Breadcrumb generation
 *
 * @example
 * ```typescript
 * import { navigateWithParams, getRouteParam, createGuard } from '@osi-cards/utils';
 *
 * // Navigate with query params
 * navigateWithParams(router, ['/users'], { page: 2, filter: 'active' });
 *
 * // Get route parameter
 * const userId = getRouteParam(route, 'id');
 *
 * // Create guard
 * export const authGuard = createGuard(() => authService.isAuthenticated());
 * ```
 */

import { Router, ActivatedRoute, NavigationExtras, UrlTree, CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Navigate with query parameters
 *
 * @param router - Router instance
 * @param commands - Route commands
 * @param params - Query parameters
 * @param extras - Additional navigation extras
 * @returns Promise from router navigation
 *
 * @example
 * ```typescript
 * navigateWithParams(router, ['/users'], { page: 2, filter: 'active' });
 * ```
 */
export function navigateWithParams(
  router: Router,
  commands: any[],
  params: Record<string, any>,
  extras?: NavigationExtras
): Promise<boolean> {
  return router.navigate(commands, {
    ...extras,
    queryParams: params,
    queryParamsHandling: extras?.queryParamsHandling || 'merge',
  });
}

/**
 * Get route parameter
 *
 * @param route - Activated route
 * @param paramName - Parameter name
 * @returns Parameter value or null
 */
export function getRouteParam(route: ActivatedRoute, paramName: string): string | null {
  return route.snapshot.paramMap.get(paramName);
}

/**
 * Get query parameter
 *
 * @param route - Activated route
 * @param paramName - Parameter name
 * @returns Parameter value or null
 */
export function getQueryParam(route: ActivatedRoute, paramName: string): string | null {
  return route.snapshot.queryParamMap.get(paramName);
}

/**
 * Get all query parameters
 *
 * @param route - Activated route
 * @returns Object with all query parameters
 */
export function getAllQueryParams(route: ActivatedRoute): Record<string, string> {
  const params: Record<string, string> = {};
  route.snapshot.queryParamMap.keys.forEach(key => {
    const value = route.snapshot.queryParamMap.get(key);
    if (value) {
      params[key] = value;
    }
  });
  return params;
}

/**
 * Get route data
 *
 * @param route - Activated route
 * @param key - Data key
 * @returns Route data value
 */
export function getRouteData<T = any>(route: ActivatedRoute, key: string): T | undefined {
  return route.snapshot.data[key];
}

/**
 * Create route guard from function
 *
 * @param checkFn - Function that returns boolean or UrlTree
 * @returns CanActivateFn guard
 *
 * @example
 * ```typescript
 * export const authGuard = createGuard(() => {
 *   const auth = inject(AuthService);
 *   return auth.isAuthenticated();
 * });
 * ```
 */
export function createGuard(
  checkFn: () => boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree>
): CanActivateFn {
  return () => checkFn();
}

/**
 * Create guard that redirects on failure
 *
 * @param checkFn - Check function
 * @param redirectTo - Path to redirect to if check fails
 * @returns CanActivateFn guard
 *
 * @example
 * ```typescript
 * export const authGuard = createRedirectGuard(
 *   () => inject(AuthService).isAuthenticated(),
 *   '/login'
 * );
 * ```
 */
export function createRedirectGuard(
  checkFn: () => boolean | Observable<boolean> | Promise<boolean>,
  redirectTo: string | string[]
): CanActivateFn {
  return () => {
    const router = inject(Router);
    const result = checkFn();

    if (result instanceof Observable) {
      return result.pipe(
        map(allowed => allowed || router.createUrlTree(Array.isArray(redirectTo) ? redirectTo : [redirectTo]))
      );
    }

    if (result instanceof Promise) {
      return result.then(allowed => allowed || router.createUrlTree(Array.isArray(redirectTo) ? redirectTo : [redirectTo]));
    }

    return result || router.createUrlTree(Array.isArray(redirectTo) ? redirectTo : [redirectTo]);
  };
}

/**
 * Combine multiple guards
 *
 * @param guards - Array of guards
 * @returns Combined guard (all must pass)
 */
export function combineGuards(...guards: CanActivateFn[]): CanActivateFn {
  return (route, state) => {
    for (const guard of guards) {
      const result = guard(route, state);

      if (result === false) {
        return false;
      }

      if (result instanceof UrlTree) {
        return result;
      }
    }

    return true;
  };
}

/**
 * Get current route URL
 *
 * @param router - Router instance
 * @returns Current URL
 */
export function getCurrentUrl(router: Router): string {
  return router.url;
}

/**
 * Check if route is active
 *
 * @param router - Router instance
 * @param path - Path to check
 * @returns True if route is active
 */
export function isRouteActive(router: Router, path: string): boolean {
  return router.isActive(path, {
    paths: 'subset',
    queryParams: 'subset',
    fragment: 'ignored',
    matrixParams: 'ignored',
  });
}

/**
 * Navigate back
 *
 * @param router - Router instance
 * @param fallback - Fallback route if no history
 */
export function navigateBack(router: Router, fallback: string[] = ['/']): void {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    router.navigate(fallback);
  }
}

/**
 * Get breadcrumbs from route
 *
 * @param route - Activated route
 * @returns Array of breadcrumb items
 *
 * @example
 * ```typescript
 * const breadcrumbs = getBreadcrumbs(route);
 * // [{ label: 'Home', url: '/' }, { label: 'Users', url: '/users' }]
 * ```
 */
export function getBreadcrumbs(route: ActivatedRoute): Array<{ label: string; url: string }> {
  const breadcrumbs: Array<{ label: string; url: string }> = [];
  let currentRoute: ActivatedRoute | null = route.root;

  while (currentRoute) {
    if (currentRoute.snapshot.data['breadcrumb']) {
      const url = currentRoute.snapshot.url.map(segment => segment.path).join('/');
      breadcrumbs.push({
        label: currentRoute.snapshot.data['breadcrumb'],
        url: '/' + url,
      });
    }
    currentRoute = currentRoute.firstChild;
  }

  return breadcrumbs;
}

/**
 * Reload current route
 *
 * @param router - Router instance
 * @param route - Current route
 */
export function reloadCurrentRoute(router: Router, route: ActivatedRoute): Promise<boolean> {
  const currentUrl = router.url;
  return router.navigateByUrl('/', { skipLocationChange: true })
    .then(() => router.navigateByUrl(currentUrl));
}

