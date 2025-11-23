import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FeatureFlags {
  [key: string]: boolean;
}

/**
 * Service for managing feature flags
 * Allows toggling features on/off at runtime and via environment configuration
 */
@Injectable({
  providedIn: 'root'
})
export class FeatureFlagService {
  private readonly flagsSubject = new BehaviorSubject<FeatureFlags>(this.getInitialFlags());
  readonly flags$: Observable<FeatureFlags> = this.flagsSubject.asObservable();

  /**
   * Get initial feature flags from environment and localStorage
   */
  private getInitialFlags(): FeatureFlags {
    const defaultFlags: FeatureFlags = {
      llmSimulation: true,
      virtualScrolling: false,
      darkMode: false,
      advancedFilters: false,
      exportToPdf: false,
      exportToImage: false,
      cardTemplates: true,
      undoRedo: false,
      performanceMonitoring: true,
      accessibilityAudit: false
    };

    // Override with environment flags if available
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
   * @param flagName - The name of the feature flag
   * @returns True if the feature is enabled
   */
  isEnabled(flagName: string): boolean {
    return this.flagsSubject.value[flagName] === true;
  }

  /**
   * Enable a feature flag
   * @param flagName - The name of the feature flag
   * @param persist - Whether to persist to localStorage (default: true)
   */
  enable(flagName: string, persist = true): void {
    const current = this.flagsSubject.value;
    const updated = { ...current, [flagName]: true };
    this.flagsSubject.next(updated);

    if (persist) {
      this.persistFlags(updated);
    }
  }

  /**
   * Disable a feature flag
   * @param flagName - The name of the feature flag
   * @param persist - Whether to persist to localStorage (default: true)
   */
  disable(flagName: string, persist = true): void {
    const current = this.flagsSubject.value;
    const updated = { ...current, [flagName]: false };
    this.flagsSubject.next(updated);

    if (persist) {
      this.persistFlags(updated);
    }
  }

  /**
   * Toggle a feature flag
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
   * @param flags - Object with flag names and values
   * @param persist - Whether to persist to localStorage (default: true)
   */
  setFlags(flags: Partial<FeatureFlags>, persist = true): void {
    const current = this.flagsSubject.value;
    // Filter out undefined values to ensure all values are boolean
    const filteredFlags: FeatureFlags = {};
    for (const [key, value] of Object.entries(flags)) {
      if (value !== undefined) {
        filteredFlags[key] = value;
      }
    }
    const updated: FeatureFlags = { ...current, ...filteredFlags };
    this.flagsSubject.next(updated);

    if (persist) {
      this.persistFlags(updated);
    }
  }

  /**
   * Get all feature flags
   * @returns Current feature flags
   */
  getAllFlags(): FeatureFlags {
    return { ...this.flagsSubject.value };
  }

  /**
   * Reset all feature flags to defaults
   * @param persist - Whether to persist to localStorage (default: true)
   */
  reset(persist = true): void {
    const defaults = this.getInitialFlags();
    this.flagsSubject.next(defaults);

    if (persist) {
      this.persistFlags(defaults);
    }
  }

  /**
   * Persist flags to localStorage
   * @param flags - The flags to persist
   */
  private persistFlags(flags: FeatureFlags): void {
    try {
      localStorage.setItem('featureFlags', JSON.stringify(flags));
    } catch {
      // Ignore localStorage errors
    }
  }
}

