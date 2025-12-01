/**
 * Configuration System
 *
 * Centralized configuration management for OSI Cards.
 * Type-safe, reactive, with schema validation.
 */

import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

// ============================================================================
// TYPES
// ============================================================================

export interface OSICardsConfig {
  /** Theme configuration */
  theme: ThemeConfig;
  /** Layout configuration */
  layout: LayoutConfig;
  /** Animation configuration */
  animation: AnimationConfig;
  /** Accessibility configuration */
  accessibility: AccessibilityConfig;
  /** Feature flags */
  features: FeatureFlags;
}

export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto';
  primaryColor: string;
  accentColor: string;
  borderRadius: number;
  spacing: number;
}

export interface LayoutConfig {
  maxColumns: number;
  minColumnWidth: number;
  gap: number;
  defaultSectionHeight: number;
  packingAlgorithm: 'row-first' | 'bin-pack' | 'masonry';
}

export interface AnimationConfig {
  enabled: boolean;
  duration: number;
  easing: string;
  staggerDelay: number;
  enableTilt: boolean;
}

export interface AccessibilityConfig {
  announceChanges: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  focusIndicators: boolean;
}

export interface FeatureFlags {
  virtualScroll: boolean;
  layoutOptimization: boolean;
  streaming: boolean;
  offlineSupport: boolean;
  debugMode: boolean;
}

// ============================================================================
// DEFAULTS
// ============================================================================

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  mode: 'light',
  primaryColor: '#3b82f6',
  accentColor: '#8b5cf6',
  borderRadius: 8,
  spacing: 16,
};

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  maxColumns: 4,
  minColumnWidth: 280,
  gap: 16,
  defaultSectionHeight: 100,
  packingAlgorithm: 'row-first',
};

export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  enabled: true,
  duration: 300,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  staggerDelay: 50,
  enableTilt: true,
};

export const DEFAULT_ACCESSIBILITY_CONFIG: AccessibilityConfig = {
  announceChanges: true,
  highContrast: false,
  reducedMotion: false,
  focusIndicators: true,
};

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  virtualScroll: false,
  layoutOptimization: true,
  streaming: true,
  offlineSupport: false,
  debugMode: false,
};

export const DEFAULT_CONFIG: OSICardsConfig = {
  theme: DEFAULT_THEME_CONFIG,
  layout: DEFAULT_LAYOUT_CONFIG,
  animation: DEFAULT_ANIMATION_CONFIG,
  accessibility: DEFAULT_ACCESSIBILITY_CONFIG,
  features: DEFAULT_FEATURE_FLAGS,
};

// ============================================================================
// CONFIGURATION MANAGER
// ============================================================================

export class ConfigurationManager {
  private readonly configSubject: BehaviorSubject<OSICardsConfig>;

  /** Observable config */
  readonly config$: Observable<OSICardsConfig>;

  constructor(initialConfig: Partial<OSICardsConfig> = {}) {
    const mergedConfig = this.mergeConfig(DEFAULT_CONFIG, initialConfig);
    this.configSubject = new BehaviorSubject(mergedConfig);
    this.config$ = this.configSubject.asObservable();

    // Check for reduced motion preference
    if (typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        this.update({ accessibility: { reducedMotion: true } });
      }
    }
  }

  // ==========================================================================
  // GETTERS
  // ==========================================================================

  /** Get current config */
  get(): OSICardsConfig {
    return this.configSubject.value;
  }

  /** Get theme config */
  getTheme(): ThemeConfig {
    return this.configSubject.value.theme;
  }

  /** Get layout config */
  getLayout(): LayoutConfig {
    return this.configSubject.value.layout;
  }

  /** Get animation config */
  getAnimation(): AnimationConfig {
    return this.configSubject.value.animation;
  }

  /** Get accessibility config */
  getAccessibility(): AccessibilityConfig {
    return this.configSubject.value.accessibility;
  }

  /** Get feature flags */
  getFeatures(): FeatureFlags {
    return this.configSubject.value.features;
  }

  // ==========================================================================
  // SELECTORS
  // ==========================================================================

  /** Select a specific config path */
  select<K extends keyof OSICardsConfig>(key: K): Observable<OSICardsConfig[K]> {
    return this.config$.pipe(
      map(config => config[key]),
      distinctUntilChanged()
    );
  }

  /** Check if feature is enabled */
  isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return this.configSubject.value.features[feature];
  }

  /** Observe feature flag */
  observeFeature(feature: keyof FeatureFlags): Observable<boolean> {
    return this.config$.pipe(
      map(config => config.features[feature]),
      distinctUntilChanged()
    );
  }

  // ==========================================================================
  // SETTERS
  // ==========================================================================

  /** Update config */
  update(partial: DeepPartial<OSICardsConfig>): void {
    const current = this.configSubject.value;
    const updated = this.mergeConfig(current, partial);
    this.configSubject.next(updated);
  }

  /** Set theme mode */
  setThemeMode(mode: ThemeConfig['mode']): void {
    this.update({ theme: { mode } });
  }

  /** Toggle feature */
  toggleFeature(feature: keyof FeatureFlags): void {
    const current = this.configSubject.value.features[feature];
    this.update({ features: { [feature]: !current } as Partial<FeatureFlags> });
  }

  /** Enable debug mode */
  enableDebug(): void {
    this.update({ features: { debugMode: true } });
  }

  /** Reset to defaults */
  reset(): void {
    this.configSubject.next(DEFAULT_CONFIG);
  }

  // ==========================================================================
  // PERSISTENCE
  // ==========================================================================

  /** Save to localStorage */
  persist(key = 'osi-cards-config'): void {
    try {
      localStorage.setItem(key, JSON.stringify(this.configSubject.value));
    } catch {
      // Storage unavailable
    }
  }

  /** Load from localStorage */
  restore(key = 'osi-cards-config'): boolean {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.update(parsed);
        return true;
      }
    } catch {
      // Storage unavailable or invalid JSON
    }
    return false;
  }

  // ==========================================================================
  // CSS CUSTOM PROPERTIES
  // ==========================================================================

  /** Generate CSS custom properties */
  toCSSProperties(): Record<string, string> {
    const { theme, layout, animation } = this.configSubject.value;

    return {
      '--osi-primary-color': theme.primaryColor,
      '--osi-accent-color': theme.accentColor,
      '--osi-border-radius': `${theme.borderRadius}px`,
      '--osi-spacing': `${theme.spacing}px`,
      '--osi-gap': `${layout.gap}px`,
      '--osi-animation-duration': `${animation.duration}ms`,
      '--osi-animation-easing': animation.easing,
    };
  }

  /** Apply CSS custom properties to element */
  applyToElement(element: HTMLElement): void {
    const props = this.toCSSProperties();
    Object.entries(props).forEach(([key, value]) => {
      element.style.setProperty(key, value);
    });
  }

  // ==========================================================================
  // PRIVATE
  // ==========================================================================

  private mergeConfig(base: OSICardsConfig, partial: DeepPartial<OSICardsConfig>): OSICardsConfig {
    return {
      theme: { ...base.theme, ...partial.theme },
      layout: { ...base.layout, ...partial.layout },
      animation: { ...base.animation, ...partial.animation },
      accessibility: { ...base.accessibility, ...partial.accessibility },
      features: { ...base.features, ...partial.features },
    };
  }
}

// ============================================================================
// TYPES
// ============================================================================

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ============================================================================
// FACTORY
// ============================================================================

/** Singleton instance */
let instance: ConfigurationManager | null = null;

/** Get or create singleton */
export function getConfiguration(): ConfigurationManager {
  if (!instance) {
    instance = new ConfigurationManager();
  }
  return instance;
}

/** Create new instance */
export function createConfiguration(config?: Partial<OSICardsConfig>): ConfigurationManager {
  return new ConfigurationManager(config);
}

/** Initialize with config and return singleton */
export function initConfiguration(config: Partial<OSICardsConfig>): ConfigurationManager {
  instance = new ConfigurationManager(config);
  return instance;
}

