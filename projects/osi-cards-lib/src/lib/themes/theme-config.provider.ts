import { 
  Provider, 
  EnvironmentProviders, 
  makeEnvironmentProviders,
  InjectionToken
} from '@angular/core';
import { 
  OSI_THEME_CONFIG, 
  ThemeServiceConfig, 
  OSICardsThemeConfig,
  ThemePreset 
} from './theme.service';

// ============================================
// Provider Configuration Types
// ============================================

/**
 * Configuration options for provideOSICardsTheme
 */
export interface OSICardsThemeOptions {
  /**
   * Default theme to use on initialization
   * - 'system': Follow OS preference (default)
   * - 'light' | 'dark': Specific theme
   * - Custom theme name if registered in `themes`
   */
  defaultTheme?: ThemePreset | string;

  /**
   * localStorage key for persisting theme preference
   * @default 'osi-cards-theme'
   */
  persistKey?: string;

  /**
   * Whether to persist theme preference to localStorage
   * @default true
   */
  enablePersistence?: boolean;

  /**
   * Whether to enable smooth transitions between themes
   * @default true
   */
  enableTransitions?: boolean;

  /**
   * Transition duration in milliseconds
   * @default 200
   */
  transitionDuration?: number;

  /**
   * Whether to follow system color scheme when set to 'system'
   * @default true
   */
  followSystemPreference?: boolean;

  /**
   * Whether to update the color-scheme meta tag
   * @default true
   */
  updateColorSchemeMeta?: boolean;

  /**
   * Custom themes to register
   */
  themes?: Record<string, OSICardsThemeConfig>;
}

/**
 * Extended options including feature configuration
 */
export interface OSICardsThemeFullOptions extends OSICardsThemeOptions {
  /**
   * Feature flags for theming
   */
  features?: {
    /** Enable scoped theme directive */
    scopedThemes?: boolean;
    /** Enable theme composition utilities */
    themeComposition?: boolean;
    /** Enable debug logging */
    debug?: boolean;
  };
}

// ============================================
// Injection Tokens
// ============================================

/**
 * Injection token for theme feature flags
 */
export const OSI_THEME_FEATURES = new InjectionToken<OSICardsThemeFullOptions['features']>(
  'OSI_THEME_FEATURES'
);

/**
 * Injection token for registered custom themes
 */
export const OSI_CUSTOM_THEMES = new InjectionToken<Map<string, OSICardsThemeConfig>>(
  'OSI_CUSTOM_THEMES'
);

// ============================================
// Provider Functions
// ============================================

/**
 * Provide OSI Cards theming configuration
 * 
 * Use this function in your application configuration to set up
 * the theming system with your desired options.
 * 
 * @param options Theme configuration options
 * @returns Environment providers for theming
 * 
 * @example
 * ```typescript
 * // app.config.ts
 * import { ApplicationConfig } from '@angular/core';
 * import { provideOSICardsTheme } from 'osi-cards-lib';
 * 
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideOSICardsTheme({
 *       defaultTheme: 'system',
 *       enableTransitions: true,
 *       themes: {
 *         'brand': {
 *           name: 'brand',
 *           colorScheme: 'light',
 *           variables: {
 *             '--osi-card-accent': '#ff6b6b'
 *           }
 *         }
 *       }
 *     })
 *   ]
 * };
 * ```
 * 
 * @example
 * ```typescript
 * // Simple dark mode default
 * provideOSICardsTheme({ defaultTheme: 'dark' })
 * ```
 * 
 * @example
 * ```typescript
 * // Disable persistence
 * provideOSICardsTheme({ 
 *   defaultTheme: 'light',
 *   enablePersistence: false 
 * })
 * ```
 */
export function provideOSICardsTheme(
  options: OSICardsThemeOptions = {}
): EnvironmentProviders {
  const config: Partial<ThemeServiceConfig> = {
    defaultTheme: options.defaultTheme ?? 'system',
    persistKey: options.persistKey ?? 'osi-cards-theme',
    enablePersistence: options.enablePersistence ?? true,
    enableTransitions: options.enableTransitions ?? true,
    transitionDuration: options.transitionDuration ?? 200,
    followSystemPreference: options.followSystemPreference ?? true,
    updateColorSchemeMeta: options.updateColorSchemeMeta ?? true,
    customThemes: options.themes
  };

  return makeEnvironmentProviders([
    {
      provide: OSI_THEME_CONFIG,
      useValue: config
    }
  ]);
}

/**
 * Provide OSI Cards theming with full feature configuration
 * 
 * Extended version that includes feature flags and additional options.
 * 
 * @param options Full theme configuration options
 * @returns Environment providers
 */
export function provideOSICardsThemeFull(
  options: OSICardsThemeFullOptions = {}
): EnvironmentProviders {
  const config: Partial<ThemeServiceConfig> = {
    defaultTheme: options.defaultTheme ?? 'system',
    persistKey: options.persistKey ?? 'osi-cards-theme',
    enablePersistence: options.enablePersistence ?? true,
    enableTransitions: options.enableTransitions ?? true,
    transitionDuration: options.transitionDuration ?? 200,
    followSystemPreference: options.followSystemPreference ?? true,
    updateColorSchemeMeta: options.updateColorSchemeMeta ?? true,
    customThemes: options.themes
  };

  const providers: Provider[] = [
    {
      provide: OSI_THEME_CONFIG,
      useValue: config
    }
  ];

  if (options.features) {
    providers.push({
      provide: OSI_THEME_FEATURES,
      useValue: options.features
    });
  }

  if (options.themes) {
    const themesMap = new Map<string, OSICardsThemeConfig>();
    Object.entries(options.themes).forEach(([name, theme]) => {
      themesMap.set(name, { ...theme, name });
    });
    providers.push({
      provide: OSI_CUSTOM_THEMES,
      useValue: themesMap
    });
  }

  return makeEnvironmentProviders(providers);
}

/**
 * Provide a single custom theme
 * 
 * Convenience function for registering a single custom theme.
 * 
 * @param theme Theme configuration
 * @returns Provider
 */
export function provideCustomTheme(theme: OSICardsThemeConfig): Provider {
  return {
    provide: OSI_CUSTOM_THEMES,
    useFactory: () => {
      const map = new Map<string, OSICardsThemeConfig>();
      map.set(theme.name, theme);
      return map;
    },
    multi: false
  };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Create a minimal theme configuration
 * 
 * Helper for creating simple theme configs with just accent color.
 * 
 * @param name Theme name
 * @param accentColor Primary accent color
 * @param isDark Whether this is a dark theme
 * @returns Theme configuration
 */
export function createSimpleTheme(
  name: string,
  accentColor: string,
  isDark = false
): OSICardsThemeConfig {
  return {
    name,
    colorScheme: isDark ? 'dark' : 'light',
    variables: {
      '--osi-card-accent': accentColor,
      '--osi-card-accent-hover': accentColor,
      '--osi-card-ring': `${accentColor}40` // 25% opacity
    }
  };
}

/**
 * Create theme options with common presets
 */
export const ThemePresets = {
  /**
   * Follow system preference
   */
  system: (): OSICardsThemeOptions => ({
    defaultTheme: 'system',
    followSystemPreference: true
  }),

  /**
   * Always light mode
   */
  light: (): OSICardsThemeOptions => ({
    defaultTheme: 'light',
    followSystemPreference: false
  }),

  /**
   * Always dark mode
   */
  dark: (): OSICardsThemeOptions => ({
    defaultTheme: 'dark',
    followSystemPreference: false
  }),

  /**
   * No persistence, always use default
   */
  stateless: (defaultTheme: ThemePreset = 'light'): OSICardsThemeOptions => ({
    defaultTheme,
    enablePersistence: false
  }),

  /**
   * No transitions for performance
   */
  noTransitions: (defaultTheme: ThemePreset = 'system'): OSICardsThemeOptions => ({
    defaultTheme,
    enableTransitions: false
  }),

  /**
   * Accessibility-focused with high contrast
   */
  accessible: (): OSICardsThemeOptions => ({
    defaultTheme: 'high-contrast',
    enableTransitions: true,
    transitionDuration: 0 // Instant transitions for reduced motion
  })
};







