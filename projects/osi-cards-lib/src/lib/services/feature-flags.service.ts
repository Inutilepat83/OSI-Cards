/**
 * Feature Flags Service
 * 
 * Provides a runtime feature flag system for enabling/disabling
 * experimental features and controlling library behavior.
 * 
 * @example
 * ```typescript
 * import { FeatureFlagsService, OSI_FEATURE_FLAGS } from 'osi-cards-lib';
 * 
 * const featureFlags = inject(FeatureFlagsService);
 * 
 * // Check if a feature is enabled
 * if (featureFlags.isEnabled(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL)) {
 *   // Use virtual scrolling
 * }
 * 
 * // Enable a feature
 * featureFlags.enable(OSI_FEATURE_FLAGS.SKYLINE_PACKING);
 * 
 * // Configure multiple flags at once
 * featureFlags.configure({
 *   virtualScroll: true,
 *   skylinePacking: true,
 *   webWorkers: false,
 * });
 * ```
 */

import { Injectable, inject, InjectionToken, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Available feature flags
 */
export const OSI_FEATURE_FLAGS = {
  /** Use virtual scrolling for large section lists */
  VIRTUAL_SCROLL: 'virtualScroll',
  /** Use skyline packing algorithm instead of legacy */
  SKYLINE_PACKING: 'skylinePacking',
  /** Offload layout calculations to Web Workers */
  WEB_WORKERS: 'webWorkers',
  /** Enable experimental streaming optimizations */
  STREAMING_V2: 'streamingV2',
  /** Use Angular signals for state management */
  SIGNALS: 'signals',
  /** Enable container queries for responsive layouts */
  CONTAINER_QUERIES: 'containerQueries',
  /** Use FLIP animations for section transitions */
  FLIP_ANIMATIONS: 'flipAnimations',
  /** Enable debug overlay */
  DEBUG_OVERLAY: 'debugOverlay',
  /** Log performance metrics */
  PERF_LOGGING: 'perfLogging',
  /** Strict validation mode */
  STRICT_VALIDATION: 'strictValidation',
  /** Enable plugin system */
  PLUGINS: 'plugins',
  /** Use Shadow DOM for style isolation */
  SHADOW_DOM: 'shadowDom',
} as const;

/**
 * Feature flag key type
 */
export type FeatureFlagKey = typeof OSI_FEATURE_FLAGS[keyof typeof OSI_FEATURE_FLAGS];

/**
 * Feature flags configuration object
 */
export type FeatureFlagsConfig = {
  [K in FeatureFlagKey]?: boolean;
};

/**
 * Feature flag metadata
 */
export interface FeatureFlagMeta {
  /** Flag description */
  description: string;
  /** Whether the flag is experimental */
  experimental: boolean;
  /** Default value */
  defaultValue: boolean;
  /** Whether it can be changed at runtime */
  mutable: boolean;
  /** Minimum library version for this feature */
  minVersion?: string;
  /** Dependencies (other flags that must be enabled) */
  dependencies?: FeatureFlagKey[];
}

/**
 * Feature flag registry with metadata
 */
export const FEATURE_FLAG_META: Record<FeatureFlagKey, FeatureFlagMeta> = {
  [OSI_FEATURE_FLAGS.VIRTUAL_SCROLL]: {
    description: 'Use virtual scrolling for large section lists',
    experimental: false,
    defaultValue: false,
    mutable: true,
  },
  [OSI_FEATURE_FLAGS.SKYLINE_PACKING]: {
    description: 'Use skyline packing algorithm for better space utilization',
    experimental: false,
    defaultValue: false,
    mutable: true,
  },
  [OSI_FEATURE_FLAGS.WEB_WORKERS]: {
    description: 'Offload layout calculations to Web Workers',
    experimental: true,
    defaultValue: false,
    mutable: true,
  },
  [OSI_FEATURE_FLAGS.STREAMING_V2]: {
    description: 'Use experimental streaming optimizations',
    experimental: true,
    defaultValue: false,
    mutable: false, // Requires restart
  },
  [OSI_FEATURE_FLAGS.SIGNALS]: {
    description: 'Use Angular signals for state management',
    experimental: true,
    defaultValue: false,
    mutable: false,
    minVersion: '2.0.0',
  },
  [OSI_FEATURE_FLAGS.CONTAINER_QUERIES]: {
    description: 'Use CSS container queries for responsive layouts',
    experimental: false,
    defaultValue: false,
    mutable: true,
  },
  [OSI_FEATURE_FLAGS.FLIP_ANIMATIONS]: {
    description: 'Use FLIP technique for section transition animations',
    experimental: false,
    defaultValue: true,
    mutable: true,
  },
  [OSI_FEATURE_FLAGS.DEBUG_OVERLAY]: {
    description: 'Show debug overlay with layout information',
    experimental: false,
    defaultValue: false,
    mutable: true,
  },
  [OSI_FEATURE_FLAGS.PERF_LOGGING]: {
    description: 'Log performance metrics to console',
    experimental: false,
    defaultValue: false,
    mutable: true,
  },
  [OSI_FEATURE_FLAGS.STRICT_VALIDATION]: {
    description: 'Enable strict validation for card configurations',
    experimental: false,
    defaultValue: false,
    mutable: true,
  },
  [OSI_FEATURE_FLAGS.PLUGINS]: {
    description: 'Enable plugin system for custom section types',
    experimental: false,
    defaultValue: true,
    mutable: false,
  },
  [OSI_FEATURE_FLAGS.SHADOW_DOM]: {
    description: 'Use Shadow DOM for style isolation',
    experimental: false,
    defaultValue: false,
    mutable: false,
  },
};

/**
 * Injection token for initial feature flags configuration
 */
export const INITIAL_FEATURE_FLAGS = new InjectionToken<FeatureFlagsConfig>(
  'INITIAL_FEATURE_FLAGS'
);

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: 'root',
})
export class FeatureFlagsService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly flags = new BehaviorSubject<Map<FeatureFlagKey, boolean>>(
    new Map()
  );

  /** Observable of current flags state */
  readonly flags$ = this.flags.asObservable();

  constructor() {
    this.initializeFlags();
  }

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  /**
   * Check if a feature flag is enabled
   */
  isEnabled(flag: FeatureFlagKey): boolean {
    const currentFlags = this.flags.value;
    if (currentFlags.has(flag)) {
      return currentFlags.get(flag) ?? false;
    }
    // Return default if not set
    return FEATURE_FLAG_META[flag]?.defaultValue ?? false;
  }

  /**
   * Get an observable of a specific flag's state
   */
  observe(flag: FeatureFlagKey): Observable<boolean> {
    return this.flags$.pipe(
      map(flags => flags.get(flag) ?? FEATURE_FLAG_META[flag]?.defaultValue ?? false),
      distinctUntilChanged()
    );
  }

  /**
   * Get all current flags
   */
  getAll(): FeatureFlagsConfig {
    const result: FeatureFlagsConfig = {};
    for (const [key, meta] of Object.entries(FEATURE_FLAG_META)) {
      const flagKey = key as FeatureFlagKey;
      result[flagKey] = this.isEnabled(flagKey);
    }
    return result;
  }

  /**
   * Get metadata for a flag
   */
  getMeta(flag: FeatureFlagKey): FeatureFlagMeta | undefined {
    return FEATURE_FLAG_META[flag];
  }

  /**
   * Get all experimental flags
   */
  getExperimentalFlags(): FeatureFlagKey[] {
    return Object.entries(FEATURE_FLAG_META)
      .filter(([_, meta]) => meta.experimental)
      .map(([key]) => key as FeatureFlagKey);
  }

  // ============================================================================
  // MUTATION METHODS
  // ============================================================================

  /**
   * Enable a feature flag
   */
  enable(flag: FeatureFlagKey): boolean {
    return this.setFlag(flag, true);
  }

  /**
   * Disable a feature flag
   */
  disable(flag: FeatureFlagKey): boolean {
    return this.setFlag(flag, false);
  }

  /**
   * Toggle a feature flag
   */
  toggle(flag: FeatureFlagKey): boolean {
    const current = this.isEnabled(flag);
    return this.setFlag(flag, !current);
  }

  /**
   * Set a specific flag value
   */
  setFlag(flag: FeatureFlagKey, value: boolean): boolean {
    const meta = FEATURE_FLAG_META[flag];
    
    if (!meta) {
      console.warn(`Unknown feature flag: ${flag}`);
      return false;
    }

    if (!meta.mutable) {
      console.warn(`Feature flag "${flag}" cannot be changed at runtime`);
      return false;
    }

    // Check dependencies
    if (value && meta.dependencies) {
      for (const dep of meta.dependencies) {
        if (!this.isEnabled(dep)) {
          console.warn(
            `Feature flag "${flag}" requires "${dep}" to be enabled first`
          );
          return false;
        }
      }
    }

    const newFlags = new Map(this.flags.value);
    newFlags.set(flag, value);
    this.flags.next(newFlags);

    // Persist to localStorage
    this.persistFlags();

    return true;
  }

  /**
   * Configure multiple flags at once
   */
  configure(config: FeatureFlagsConfig): void {
    const newFlags = new Map(this.flags.value);

    for (const [key, value] of Object.entries(config)) {
      const flagKey = key as FeatureFlagKey;
      const meta = FEATURE_FLAG_META[flagKey];

      if (!meta) {
        console.warn(`Unknown feature flag: ${flagKey}`);
        continue;
      }

      if (!meta.mutable && newFlags.has(flagKey)) {
        console.warn(`Feature flag "${flagKey}" cannot be changed at runtime`);
        continue;
      }

      if (value !== undefined) {
        newFlags.set(flagKey, value);
      }
    }

    this.flags.next(newFlags);
    this.persistFlags();
  }

  /**
   * Reset all flags to defaults
   */
  reset(): void {
    const newFlags = new Map<FeatureFlagKey, boolean>();
    
    for (const [key, meta] of Object.entries(FEATURE_FLAG_META)) {
      newFlags.set(key as FeatureFlagKey, meta.defaultValue);
    }

    this.flags.next(newFlags);
    this.clearPersistedFlags();
  }

  /**
   * Enable all experimental features (for testing)
   */
  enableExperimental(): void {
    const experimental = this.getExperimentalFlags();
    const config: FeatureFlagsConfig = {};
    
    for (const flag of experimental) {
      const meta = FEATURE_FLAG_META[flag];
      if (meta?.mutable) {
        config[flag] = true;
      }
    }

    this.configure(config);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private initializeFlags(): void {
    const newFlags = new Map<FeatureFlagKey, boolean>();

    // Set defaults
    for (const [key, meta] of Object.entries(FEATURE_FLAG_META)) {
      newFlags.set(key as FeatureFlagKey, meta.defaultValue);
    }

    // Load persisted flags
    if (isPlatformBrowser(this.platformId)) {
      const persisted = this.loadPersistedFlags();
      for (const [key, value] of Object.entries(persisted)) {
        const flagKey = key as FeatureFlagKey;
        const meta = FEATURE_FLAG_META[flagKey];
        if (meta?.mutable || !newFlags.has(flagKey)) {
          newFlags.set(flagKey, value);
        }
      }

      // Check URL overrides (for testing)
      this.applyUrlOverrides(newFlags);
    }

    this.flags.next(newFlags);
  }

  private loadPersistedFlags(): FeatureFlagsConfig {
    try {
      const stored = localStorage.getItem('osi-cards-feature-flags');
      return stored ? JSON.parse(stored) as FeatureFlagsConfig : {};
    } catch {
      return {};
    }
  }

  private persistFlags(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const config: FeatureFlagsConfig = {};
      for (const [key, value] of this.flags.value) {
        // Only persist mutable flags
        const meta = FEATURE_FLAG_META[key];
        if (meta?.mutable) {
          config[key] = value;
        }
      }
      localStorage.setItem('osi-cards-feature-flags', JSON.stringify(config));
    } catch {
      // localStorage not available
    }
  }

  private clearPersistedFlags(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      localStorage.removeItem('osi-cards-feature-flags');
    } catch {
      // localStorage not available
    }
  }

  private applyUrlOverrides(flags: Map<FeatureFlagKey, boolean>): void {
    try {
      const params = new URLSearchParams(window.location.search);
      
      // Check for flag overrides: ?osi_flag_virtualScroll=true
      for (const [key] of Object.entries(FEATURE_FLAG_META)) {
        const paramName = `osi_flag_${key}`;
        const value = params.get(paramName);
        
        if (value !== null) {
          flags.set(key as FeatureFlagKey, value === 'true' || value === '1');
        }
      }

      // Check for debug mode: ?osi_debug=true
      if (params.get('osi_debug') === 'true') {
        flags.set(OSI_FEATURE_FLAGS.DEBUG_OVERLAY, true);
        flags.set(OSI_FEATURE_FLAGS.PERF_LOGGING, true);
      }
    } catch {
      // URL parsing failed
    }
  }
}

// ============================================================================
// PROVIDER HELPERS
// ============================================================================

/**
 * Provide initial feature flags configuration
 */
export function provideFeatureFlags(config: FeatureFlagsConfig) {
  return {
    provide: INITIAL_FEATURE_FLAGS,
    useValue: config,
  };
}




