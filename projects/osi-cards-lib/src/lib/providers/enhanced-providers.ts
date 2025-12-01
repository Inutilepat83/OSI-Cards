/**
 * Enhanced Providers (Improvements #93-97)
 * 
 * Advanced Angular providers for configuration, SSR support,
 * and tree-shakeable imports.
 * 
 * @example
 * ```typescript
 * import { 
 *   provideOsiCards, 
 *   withTheme, 
 *   withStreaming, 
 *   withAccessibility,
 *   withPlugins
 * } from 'osi-cards-lib';
 * 
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideOsiCards(
 *       withTheme({ defaultTheme: 'dark' }),
 *       withStreaming({ instant: false }),
 *       withAccessibility({ announceChanges: true }),
 *       withPlugins([myCustomPlugin])
 *     )
 *   ]
 * };
 * ```
 */

import {
  EnvironmentProviders,
  makeEnvironmentProviders,
  Provider,
  InjectionToken,
  inject,
  APP_INITIALIZER,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Theme configuration options
 */
export interface ThemeConfigOptions {
  /** Default theme to use */
  defaultTheme?: string;
  /** Follow system preference */
  followSystem?: boolean;
  /** Enable theme persistence */
  persist?: boolean;
  /** Custom themes to register */
  customThemes?: Record<string, Record<string, string>>;
}

/**
 * Streaming configuration options
 */
export interface StreamingConfigOptions {
  /** Stream instantly without animation */
  instant?: boolean;
  /** Characters per second for streaming */
  charsPerSecond?: number;
  /** Enable structural diffing */
  enableDiff?: boolean;
  /** Batch updates for performance */
  batchUpdates?: boolean;
  /** Update interval in ms */
  updateInterval?: number;
}

/**
 * Accessibility configuration options
 */
export interface AccessibilityConfigOptions {
  /** Announce card changes to screen readers */
  announceChanges?: boolean;
  /** Enable focus management */
  enableFocusManagement?: boolean;
  /** Reduce motion by default */
  reduceMotion?: boolean;
  /** Skip link text */
  skipLinkText?: string;
}

/**
 * Layout configuration options
 */
export interface LayoutConfigOptions {
  /** Minimum column width */
  minColumnWidth?: number;
  /** Maximum columns */
  maxColumns?: number;
  /** Gap between items */
  gap?: number;
  /** Packing algorithm */
  packingAlgorithm?: 'legacy' | 'row-first' | 'skyline';
  /** Enable Web Worker for layout */
  useWorker?: boolean;
}

/**
 * Performance configuration options
 */
export interface PerformanceConfigOptions {
  /** Enable lazy loading */
  lazyLoading?: boolean;
  /** Enable virtual scrolling */
  virtualScrolling?: boolean;
  /** Virtualization threshold (number of sections) */
  virtualizationThreshold?: number;
  /** Enable image optimization */
  imageOptimization?: boolean;
  /** Enable preconnect for known hosts */
  preconnect?: string[];
}

/**
 * Analytics configuration options
 */
export interface AnalyticsConfigOptions {
  /** Enable analytics */
  enabled?: boolean;
  /** Analytics endpoint */
  endpoint?: string;
  /** Sampling rate (0-1) */
  samplingRate?: number;
  /** Include performance metrics */
  includePerformance?: boolean;
}

/**
 * Plugin configuration
 */
export interface PluginConfigOptions {
  /** Plugins to register */
  plugins?: unknown[];
  /** Auto-initialize plugins */
  autoInit?: boolean;
}

/**
 * SSR configuration options
 */
export interface SSRConfigOptions {
  /** Enable SSR mode */
  enabled?: boolean;
  /** Hydration strategy */
  hydration?: 'full' | 'partial' | 'progressive';
  /** Pre-render static content */
  prerender?: boolean;
}

/**
 * Complete OSI Cards configuration
 */
export interface OsiCardsConfig {
  theme?: ThemeConfigOptions;
  streaming?: StreamingConfigOptions;
  accessibility?: AccessibilityConfigOptions;
  layout?: LayoutConfigOptions;
  performance?: PerformanceConfigOptions;
  analytics?: AnalyticsConfigOptions;
  plugins?: PluginConfigOptions;
  ssr?: SSRConfigOptions;
}

// ============================================================================
// INJECTION TOKENS
// ============================================================================

export const OSI_CARDS_CONFIG = new InjectionToken<OsiCardsConfig>('OSI_CARDS_CONFIG');
export const OSI_THEME_OPTIONS = new InjectionToken<ThemeConfigOptions>('OSI_THEME_OPTIONS');
export const OSI_STREAMING_OPTIONS = new InjectionToken<StreamingConfigOptions>('OSI_STREAMING_OPTIONS');
export const OSI_ACCESSIBILITY_OPTIONS = new InjectionToken<AccessibilityConfigOptions>('OSI_ACCESSIBILITY_OPTIONS');
export const OSI_LAYOUT_OPTIONS = new InjectionToken<LayoutConfigOptions>('OSI_LAYOUT_OPTIONS');
export const OSI_PERFORMANCE_OPTIONS = new InjectionToken<PerformanceConfigOptions>('OSI_PERFORMANCE_OPTIONS');
export const OSI_ANALYTICS_OPTIONS = new InjectionToken<AnalyticsConfigOptions>('OSI_ANALYTICS_OPTIONS');
export const OSI_SSR_OPTIONS = new InjectionToken<SSRConfigOptions>('OSI_SSR_OPTIONS');

// ============================================================================
// FEATURE TYPES
// ============================================================================

/**
 * Feature type for type-safe feature composition
 */
type OsiCardsFeature = {
  kind: string;
  providers: Provider[];
};

// ============================================================================
// FEATURE FACTORIES
// ============================================================================

/**
 * Configure theme options
 */
export function withTheme(options: ThemeConfigOptions): OsiCardsFeature {
  return {
    kind: 'theme',
    providers: [
      { provide: OSI_THEME_OPTIONS, useValue: options }
    ]
  };
}

/**
 * Configure streaming options
 */
export function withStreaming(options: StreamingConfigOptions): OsiCardsFeature {
  return {
    kind: 'streaming',
    providers: [
      { provide: OSI_STREAMING_OPTIONS, useValue: options }
    ]
  };
}

/**
 * Configure accessibility options
 */
export function withAccessibility(options: AccessibilityConfigOptions): OsiCardsFeature {
  return {
    kind: 'accessibility',
    providers: [
      { provide: OSI_ACCESSIBILITY_OPTIONS, useValue: options }
    ]
  };
}

/**
 * Configure layout options
 */
export function withLayout(options: LayoutConfigOptions): OsiCardsFeature {
  return {
    kind: 'layout',
    providers: [
      { provide: OSI_LAYOUT_OPTIONS, useValue: options }
    ]
  };
}

/**
 * Configure performance options
 */
export function withPerformance(options: PerformanceConfigOptions): OsiCardsFeature {
  const providers: Provider[] = [
    { provide: OSI_PERFORMANCE_OPTIONS, useValue: options }
  ];
  
  // Add preconnect hints
  if (options.preconnect && typeof document !== 'undefined') {
    providers.push({
      provide: APP_INITIALIZER,
      useFactory: () => () => {
        options.preconnect?.forEach(url => {
          const link = document.createElement('link');
          link.rel = 'preconnect';
          link.href = url;
          document.head.appendChild(link);
        });
      },
      multi: true
    });
  }
  
  return {
    kind: 'performance',
    providers
  };
}

/**
 * Configure analytics options
 */
export function withAnalytics(options: AnalyticsConfigOptions): OsiCardsFeature {
  return {
    kind: 'analytics',
    providers: [
      { provide: OSI_ANALYTICS_OPTIONS, useValue: options }
    ]
  };
}

/**
 * Configure plugins
 */
export function withPlugins(plugins: unknown[]): OsiCardsFeature {
  return {
    kind: 'plugins',
    providers: [
      // Plugin providers would be added here
      // This is a placeholder for the plugin system integration
    ]
  };
}

/**
 * Configure SSR support
 */
export function withSSR(options: SSRConfigOptions = {}): OsiCardsFeature {
  return {
    kind: 'ssr',
    providers: [
      { provide: OSI_SSR_OPTIONS, useValue: options }
    ]
  };
}

// ============================================================================
// MAIN PROVIDER FUNCTION
// ============================================================================

/**
 * Provide OSI Cards with configuration
 * 
 * @example
 * ```typescript
 * providers: [
 *   provideOsiCards(
 *     withTheme({ defaultTheme: 'dark' }),
 *     withAccessibility({ announceChanges: true })
 *   )
 * ]
 * ```
 */
export function provideOsiCards(
  ...features: OsiCardsFeature[]
): EnvironmentProviders {
  // Collect all feature providers
  const allProviders: Provider[] = [];
  const config: OsiCardsConfig = {};
  
  for (const feature of features) {
    allProviders.push(...feature.providers);
  }
  
  // Add config provider
  allProviders.push({ provide: OSI_CARDS_CONFIG, useValue: config });
  
  // Add initialization
  allProviders.push({
    provide: APP_INITIALIZER,
    useFactory: (platformId: object) => {
      return () => {
        // Browser-specific initialization
        if (isPlatformBrowser(platformId)) {
          // Initialize browser features
          console.log('[OSI Cards] Initializing in browser');
        }
        
        // Server-specific initialization
        if (isPlatformServer(platformId)) {
          console.log('[OSI Cards] Initializing for SSR');
        }
      };
    },
    deps: [PLATFORM_ID],
    multi: true
  });
  
  return makeEnvironmentProviders(allProviders);
}

// ============================================================================
// STANDALONE PROVIDERS
// ============================================================================

/**
 * Provide minimal OSI Cards configuration
 * Use when you want to configure each feature separately
 */
export function provideOsiCardsMinimal(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: OSI_CARDS_CONFIG, useValue: {} }
  ]);
}

/**
 * Provide OSI Cards with development features
 */
export function provideOsiCardsDevelopment(): EnvironmentProviders {
  return provideOsiCards(
    withTheme({ followSystem: true, persist: true }),
    withStreaming({ instant: false, charsPerSecond: 200 }),
    withAccessibility({ announceChanges: true, enableFocusManagement: true }),
    withLayout({ useWorker: false }), // Workers may complicate HMR
    withPerformance({ lazyLoading: true }),
    withAnalytics({ enabled: true, includePerformance: true })
  );
}

/**
 * Provide OSI Cards optimized for production
 */
export function provideOsiCardsProduction(): EnvironmentProviders {
  return provideOsiCards(
    withTheme({ followSystem: true, persist: true }),
    withStreaming({ instant: false, batchUpdates: true }),
    withAccessibility({ announceChanges: true, enableFocusManagement: true }),
    withLayout({ useWorker: true, packingAlgorithm: 'row-first' }),
    withPerformance({ 
      lazyLoading: true, 
      virtualScrolling: true,
      imageOptimization: true 
    }),
    withAnalytics({ enabled: true, samplingRate: 0.1 }) // Sample 10%
  );
}

/**
 * Provide OSI Cards with SSR support
 */
export function provideOsiCardsSSR(): EnvironmentProviders {
  return provideOsiCards(
    withTheme({ followSystem: false, defaultTheme: 'light' }), // Consistent SSR
    withStreaming({ instant: true }), // No streaming animation in SSR
    withAccessibility({ announceChanges: false }), // No live regions in SSR
    withLayout({ useWorker: false }), // No workers in SSR
    withSSR({ enabled: true, hydration: 'progressive' })
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Inject and merge configuration options
 */
export function injectOsiCardsConfig(): OsiCardsConfig {
  const config = inject(OSI_CARDS_CONFIG, { optional: true }) ?? {};
  const theme = inject(OSI_THEME_OPTIONS, { optional: true });
  const streaming = inject(OSI_STREAMING_OPTIONS, { optional: true });
  const accessibility = inject(OSI_ACCESSIBILITY_OPTIONS, { optional: true });
  const layout = inject(OSI_LAYOUT_OPTIONS, { optional: true });
  const performance = inject(OSI_PERFORMANCE_OPTIONS, { optional: true });
  const analytics = inject(OSI_ANALYTICS_OPTIONS, { optional: true });
  const ssr = inject(OSI_SSR_OPTIONS, { optional: true });
  
  return {
    ...config,
    theme: theme ?? config.theme,
    streaming: streaming ?? config.streaming,
    accessibility: accessibility ?? config.accessibility,
    layout: layout ?? config.layout,
    performance: performance ?? config.performance,
    analytics: analytics ?? config.analytics,
    ssr: ssr ?? config.ssr
  };
}

/**
 * Check if running in SSR mode
 */
export function isSSRMode(): boolean {
  const platformId = inject(PLATFORM_ID);
  return isPlatformServer(platformId);
}

/**
 * Check if running in browser
 */
export function isBrowserMode(): boolean {
  const platformId = inject(PLATFORM_ID);
  return isPlatformBrowser(platformId);
}

