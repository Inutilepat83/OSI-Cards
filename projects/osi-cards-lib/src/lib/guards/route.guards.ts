/**
 * Route Guards Collection
 *
 * A collection of 10 common route guards.
 *
 * Guards:
 * 1. AuthGuard
 * 2. RoleGuard
 * 3. UnsavedChangesGuard
 * 4. FeatureFlagGuard
 * 5. MaintenanceGuard
 * 6. NetworkGuard
 * 7. PermissionGuard
 * 8. TimeBasedGuard
 * 9. GeoGuard
 * 10. DeviceGuard
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn, CanDeactivateFn } from '@angular/router';

/**
 * 1. Auth Guard Factory
 */
export function createAuthGuard(isAuthenticated: () => boolean, redirectUrl = '/login'): CanActivateFn {
  return () => {
    const router = inject(Router);

    if (isAuthenticated()) {
      return true;
    }

    return router.createUrlTree([redirectUrl]);
  };
}

/**
 * 2. Role Guard Factory
 */
export function createRoleGuard(
  getUserRole: () => string | null,
  allowedRoles: string[],
  redirectUrl = '/unauthorized'
): CanActivateFn {
  return () => {
    const router = inject(Router);
    const userRole = getUserRole();

    if (userRole && allowedRoles.includes(userRole)) {
      return true;
    }

    return router.createUrlTree([redirectUrl]);
  };
}

/**
 * 3. Unsaved Changes Guard
 */
export interface CanDeactivateComponent {
  canDeactivate: () => boolean | Promise<boolean>;
}

export const unsavedChangesGuard: CanDeactivateFn<CanDeactivateComponent> = (component) => {
  if (!component.canDeactivate) return true;

  const canDeactivate = component.canDeactivate();

  if (canDeactivate === false) {
    return confirm('You have unsaved changes. Do you want to leave?');
  }

  return canDeactivate;
};

/**
 * 4. Feature Flag Guard Factory
 */
export function createFeatureFlagGuard(
  isFeatureEnabled: (flag: string) => boolean,
  featureFlag: string,
  redirectUrl = '/'
): CanActivateFn {
  return () => {
    const router = inject(Router);

    if (isFeatureEnabled(featureFlag)) {
      return true;
    }

    return router.createUrlTree([redirectUrl]);
  };
}

/**
 * 5. Maintenance Guard Factory
 */
export function createMaintenanceGuard(
  isUnderMaintenance: () => boolean,
  maintenanceUrl = '/maintenance'
): CanActivateFn {
  return () => {
    const router = inject(Router);

    if (!isUnderMaintenance()) {
      return true;
    }

    return router.createUrlTree([maintenanceUrl]);
  };
}

/**
 * 6. Network Guard
 */
export const networkGuard: CanActivateFn = () => {
  const router = inject(Router);

  if (navigator.onLine) {
    return true;
  }

  return router.createUrlTree(['/offline']);
};

/**
 * 7. Permission Guard Factory
 */
export function createPermissionGuard(
  hasPermission: (permission: string) => boolean,
  permission: string,
  redirectUrl = '/unauthorized'
): CanActivateFn {
  return () => {
    const router = inject(Router);

    if (hasPermission(permission)) {
      return true;
    }

    return router.createUrlTree([redirectUrl]);
  };
}

/**
 * 8. Time Based Guard Factory
 */
export function createTimeBasedGuard(
  isWithinHours: (start: number, end: number) => boolean,
  startHour: number,
  endHour: number,
  redirectUrl = '/unavailable'
): CanActivateFn {
  return () => {
    const router = inject(Router);

    if (isWithinHours(startHour, endHour)) {
      return true;
    }

    return router.createUrlTree([redirectUrl]);
  };
}

/**
 * 9. Geo Guard Factory
 */
export function createGeoGuard(
  isInAllowedRegion: (region: string) => boolean,
  allowedRegions: string[],
  redirectUrl = '/geo-restricted'
): CanActivateFn {
  return () => {
    const router = inject(Router);

    const allowed = allowedRegions.some(region => isInAllowedRegion(region));

    if (allowed) {
      return true;
    }

    return router.createUrlTree([redirectUrl]);
  };
}

/**
 * 10. Device Guard Factory
 */
export function createDeviceGuard(
  isMobile: () => boolean,
  mobileOnly = false,
  redirectUrl = '/desktop-only'
): CanActivateFn {
  return () => {
    const router = inject(Router);
    const mobile = isMobile();

    if (mobileOnly && mobile) {
      return true;
    }

    if (!mobileOnly && !mobile) {
      return true;
    }

    return router.createUrlTree([redirectUrl]);
  };
}

/**
 * Combine guards (AND logic)
 */
export function combineGuards(...guards: CanActivateFn[]): CanActivateFn {
  return async (route, state) => {
    for (const guard of guards) {
      const result = await guard(route, state);
      if (result !== true) {
        return result;
      }
    }
    return true;
  };
}

/**
 * Any guard (OR logic)
 */
export function anyGuard(...guards: CanActivateFn[]): CanActivateFn {
  return async (route, state) => {
    for (const guard of guards) {
      const result = await guard(route, state);
      if (result === true) {
        return true;
      }
    }
    return false;
  };
}

