/**
 * Feature Flag Service - Application Extension
 *
 * Extends the library's FeatureFlagsService with application-specific
 * flags and backward-compatible API. The library provides core feature
 * flag functionality; this service adds app-specific flags.
 *
 * @example
 * ```typescript
 * const flags = inject(FeatureFlagService);
 *
 * // Check if feature is enabled (app-specific flags)
 * if (flags.isEnabled('exportToPdf')) {
 *   this.exportToPdf();
 * }
 *
 * // Check library flags via libFlags
 * if (flags.libFlags.isEnabled('virtualScroll')) {
 *   // Use virtual scrolling
 * }
 *
 * // Toggle a feature
 * flags.toggle('darkMode');
 * ```
 */

import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  FeatureFlagKey as LibFeatureFlagKey,
  FeatureFlagsService as LibFeatureFlagsService,
  OSI_FEATURE_FLAGS,
} from '@osi-cards/services';

// Re-export library types and constants
export { OSI_FEATURE_FLAGS, FeatureFlagKey as LibFeatureFlagKey } from '@osi-cards/services';

/**
 * Application-specific feature flags type
 */
export type AppFeatureFlags = Record<string, boolean>;

/**
 * All feature flags (app + library)
 */
export type FeatureFlags = AppFeatureFlags;

/**
 * Application Feature Flag Service
 *
 * Combines library flags with app-specific flags.
 * Uses library service for core flags, manages app flags locally.
 */
@Injectable({
  providedIn: 'root',
})
export class FeatureFlagService {
  /** Access to library feature flags service */
  readonly libFlags = inject(LibFeatureFlagsService);

  private readonly appFlagsSubject = new BehaviorSubject<AppFeatureFlags>(
    this.getInitialAppFlags()
  );

  /** Observable of app-specific flags */
  readonly flags$: Observable<AppFeatureFlags> = this.appFlagsSubject.asObservable();

  /**
   * Get initial app-specific feature flags from environment and localStorage
   */
  private getInitialAppFlags(): AppFeatureFlags {
    const defaultFlags: AppFeatureFlags = {
      // App-specific features
      llmSimulation: true,
      darkMode: false,
      advancedFilters: false,
      exportToPdf: false,
      exportToImage: false,
      cardTemplates: true,
      undoRedo: false,
      performanceMonitoring: true,
      accessibilityAudit: false,
      // These mirror library flags for backward compatibility
      virtualScrolling: this.libFlags.isEnabled('virtualScroll'),
    };

    // Override with environment flags if available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const envFlags = (environment as any).featureFlags || {};
    const merged = { ...defaultFlags, ...envFlags };

    // Override with localStorage flags if available
    try {
      const stored = localStorage.getItem('featureFlags');
      if (stored) {
        const storedFlags = JSON.parse(stored);
        return { ...merged, ...storedFlags };
      }
    } catch {
      // Ignore localStorage errors
    }

    return merged;
  }

  /**
   * Check if a feature is enabled
   * Checks both app-specific and library flags
   *
   * @param flagName - The name of the feature flag
   * @returns True if the feature is enabled
   */
  isEnabled(flagName: string): boolean {
    // First check app-specific flags
    const appFlags = this.appFlagsSubject.value;
    if (flagName in appFlags) {
      return appFlags[flagName] === true;
    }

    // Check library flags
    const libFlagKey = flagName as LibFeatureFlagKey;
    if (Object.values(OSI_FEATURE_FLAGS).includes(libFlagKey)) {
      return this.libFlags.isEnabled(libFlagKey);
    }

    return false;
  }

  /**
   * Enable a feature flag
   *
   * @param flagName - The name of the feature flag
   * @param persist - Whether to persist to localStorage (default: true)
   */
  enable(flagName: string, persist = true): void {
    // Check if it's a library flag
    const libFlagKey = flagName as LibFeatureFlagKey;
    if (Object.values(OSI_FEATURE_FLAGS).includes(libFlagKey)) {
      this.libFlags.enable(libFlagKey);
      return;
    }

    // App-specific flag
    const current = this.appFlagsSubject.value;
    const updated = { ...current, [flagName]: true };
    this.appFlagsSubject.next(updated);

    if (persist) {
      this.persistFlags(updated);
    }
  }

  /**
   * Disable a feature flag
   *
   * @param flagName - The name of the feature flag
   * @param persist - Whether to persist to localStorage (default: true)
   */
  disable(flagName: string, persist = true): void {
    // Check if it's a library flag
    const libFlagKey = flagName as LibFeatureFlagKey;
    if (Object.values(OSI_FEATURE_FLAGS).includes(libFlagKey)) {
      this.libFlags.disable(libFlagKey);
      return;
    }

    // App-specific flag
    const current = this.appFlagsSubject.value;
    const updated = { ...current, [flagName]: false };
    this.appFlagsSubject.next(updated);

    if (persist) {
      this.persistFlags(updated);
    }
  }

  /**
   * Toggle a feature flag
   *
   * @param flagName - The name of the feature flag
   * @param persist - Whether to persist to localStorage (default: true)
   */
  toggle(flagName: string, persist = true): void {
    if (this.isEnabled(flagName)) {
      this.disable(flagName, persist);
    } else {
      this.enable(flagName, persist);
    }
  }

  /**
   * Set multiple feature flags at once
   *
   * @param flags - Object with flag names and values
   * @param persist - Whether to persist to localStorage (default: true)
   */
  setFlags(flags: Partial<FeatureFlags>, persist = true): void {
    const current = this.appFlagsSubject.value;
    const appUpdates: AppFeatureFlags = {};
    const libUpdates: Partial<Record<LibFeatureFlagKey, boolean>> = {};

    // Separate app and library flags
    for (const [key, value] of Object.entries(flags)) {
      if (value !== undefined) {
        const libFlagKey = key as LibFeatureFlagKey;
        if (Object.values(OSI_FEATURE_FLAGS).includes(libFlagKey)) {
          libUpdates[libFlagKey] = value;
        } else {
          appUpdates[key] = value;
        }
      }
    }

    // Update library flags
    if (Object.keys(libUpdates).length > 0) {
      this.libFlags.configure(libUpdates);
    }

    // Update app flags
    if (Object.keys(appUpdates).length > 0) {
      const updated: AppFeatureFlags = { ...current, ...appUpdates };
      this.appFlagsSubject.next(updated);

      if (persist) {
        this.persistFlags(updated);
      }
    }
  }

  /**
   * Get all feature flags (app + library)
   *
   * @returns Current feature flags
   */
  getAllFlags(): FeatureFlags {
    return {
      ...this.appFlagsSubject.value,
      ...this.libFlags.getAll(),
    };
  }

  /**
   * Get app-specific flags only
   */
  getAppFlags(): AppFeatureFlags {
    return { ...this.appFlagsSubject.value };
  }

  /**
   * Reset all feature flags to defaults
   *
   * @param persist - Whether to persist to localStorage (default: true)
   */
  reset(persist = true): void {
    // Reset library flags
    this.libFlags.reset();

    // Reset app flags
    const defaults = this.getInitialAppFlags();
    this.appFlagsSubject.next(defaults);

    if (persist) {
      this.persistFlags(defaults);
    }
  }

  /**
   * Persist app flags to localStorage
   *
   * @param flags - The flags to persist
   */
  private persistFlags(flags: AppFeatureFlags): void {
    try {
      localStorage.setItem('featureFlags', JSON.stringify(flags));
    } catch {
      // Ignore localStorage errors
    }
  }
}
