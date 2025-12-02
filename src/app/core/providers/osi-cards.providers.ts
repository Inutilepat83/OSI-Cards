/**
 * OSI Cards Providers - Application Configuration
 *
 * Unified provider function that configures both application and library services.
 * Uses library injection tokens for consistent configuration across the codebase.
 *
 * @example
 * ```typescript
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideOSICards({
 *       enableLogging: true,
 *       logLevel: 'info',
 *       streaming: { chunkSize: 100 },
 *       layout: { columns: 3 },
 *     })
 *   ]
 * };
 * ```
 */

import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { EnvironmentProviders, isDevMode, Provider } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';

// App imports
import { metaReducers, reducers } from '../../store/app.state';
import { CardsEffects } from '../../store/cards/cards.effects';
import { ErrorInterceptor } from '../interceptors/error.interceptor';
import { HttpCacheInterceptor } from '../interceptors/http-cache.interceptor';
import { RateLimitInterceptor } from '../interceptors/rate-limit.interceptor';
import { CARD_DATA_PROVIDER } from '../services/card-data/card-data.service';
import { JsonFileCardProvider } from '../services/card-data/json-file-card-provider.service';

// Library injection tokens
import {
  OSI_ACCESSIBILITY_CONFIG,
  OSI_ANIMATION_CONFIG,
  OSI_ERROR_CONFIG,
  OSI_FULL_CONFIG,
  OSI_LAYOUT_CONFIG,
  OSI_LOGGING_CONFIG,
  OSI_STREAMING_CONFIG,
  OSIAccessibilityConfig,
  OSIAnimationConfig,
  OSICardsFullConfig,
  OSIErrorConfig,
  OSILayoutConfig,
  OSILoggingConfig,
  OSIStreamingConfig,
} from '../../../../projects/osi-cards-lib/src/lib/providers/injection-tokens';
import {
  FeatureFlagsConfig,
  provideFeatureFlags,
} from '../../../../projects/osi-cards-lib/src/lib/services/feature-flags.service';

/**
 * Configuration options for OSI Cards application
 */
export interface OSICardsConfig {
  /** API URL for data fetching */
  apiUrl?: string;

  /** Enable logging */
  enableLogging?: boolean;

  /** Log level */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';

  /** Enable Redux DevTools */
  enableDevTools?: boolean;

  /** Custom card data provider class */
  cardDataProvider?: new (...args: unknown[]) => unknown;

  /** Streaming configuration */
  streaming?: Partial<OSIStreamingConfig>;

  /** Animation configuration */
  animation?: Partial<OSIAnimationConfig>;

  /** Layout configuration */
  layout?: Partial<OSILayoutConfig>;

  /** Accessibility configuration */
  accessibility?: Partial<OSIAccessibilityConfig>;

  /** Error handling configuration */
  error?: Partial<OSIErrorConfig>;

  /** Feature flags configuration */
  featureFlags?: FeatureFlagsConfig;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<Omit<OSICardsConfig, 'cardDataProvider' | 'featureFlags'>> = {
  apiUrl: '',
  enableLogging: true,
  logLevel: 'info',
  enableDevTools: isDevMode(),
  streaming: {
    charsPerToken: 4,
    tokensPerSecond: 80,
    updateThrottleMs: 50,
    maxBufferSize: 100000,
  },
  animation: {
    enabled: true,
    duration: 300,
    fieldStaggerDelay: 50,
    respectReducedMotion: true,
  },
  layout: {
    defaultColumns: 3,
    gap: 16,
    minColumns: 1,
    maxColumns: 4,
    packingAlgorithm: 'row-first',
  },
  accessibility: {
    keyboardNavigation: true,
    focusIndicators: true,
    announcements: true,
    locale: 'en',
  },
  error: {
    showErrorBoundaries: true,
    retryOnError: true,
    maxRetries: 3,
    userFriendlyMessages: true,
  },
};

/**
 * Provide OSI Cards with configuration
 *
 * This function sets up all required providers for the OSI Cards application,
 * including state management, HTTP interceptors, and library configuration.
 *
 * @param config - Configuration options
 * @returns Array of providers and environment providers
 */
export function provideOSICards(config: OSICardsConfig = {}): (Provider | EnvironmentProviders)[] {
  const mergedConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    streaming: { ...DEFAULT_CONFIG.streaming, ...config.streaming },
    animation: { ...DEFAULT_CONFIG.animation, ...config.animation },
    layout: { ...DEFAULT_CONFIG.layout, ...config.layout },
    accessibility: { ...DEFAULT_CONFIG.accessibility, ...config.accessibility },
    error: { ...DEFAULT_CONFIG.error, ...config.error },
  };

  const providers: (Provider | EnvironmentProviders)[] = [
    // Core Angular providers
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),

    // NgRx store
    provideStore(reducers, { metaReducers }),
    provideEffects([CardsEffects]),

    // Card data provider
    {
      provide: CARD_DATA_PROVIDER,
      useClass: config.cardDataProvider || JsonFileCardProvider,
    },

    // HTTP interceptors
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true,
    },
    // HTTP cache interceptor - disabled in dev mode for fresh data on every request
    ...(isDevMode()
      ? []
      : [
          {
            provide: HTTP_INTERCEPTORS,
            useClass: HttpCacheInterceptor,
            multi: true,
          },
        ]),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RateLimitInterceptor,
      multi: true,
    },

    // Library configuration tokens
    {
      provide: OSI_STREAMING_CONFIG,
      useValue: mergedConfig.streaming,
    },
    {
      provide: OSI_ANIMATION_CONFIG,
      useValue: mergedConfig.animation,
    },
    {
      provide: OSI_LAYOUT_CONFIG,
      useValue: mergedConfig.layout,
    },
    {
      provide: OSI_LOGGING_CONFIG,
      useValue: {
        enabled: mergedConfig.enableLogging,
        level: mergedConfig.logLevel,
        prefix: '[OSI Cards]',
      } satisfies OSILoggingConfig,
    },
    {
      provide: OSI_ACCESSIBILITY_CONFIG,
      useValue: mergedConfig.accessibility,
    },
    {
      provide: OSI_ERROR_CONFIG,
      useValue: mergedConfig.error,
    },
    {
      provide: OSI_FULL_CONFIG,
      useValue: {
        streaming: mergedConfig.streaming,
        animation: mergedConfig.animation,
        layout: mergedConfig.layout,
        logging: {
          enabled: mergedConfig.enableLogging,
          level: mergedConfig.logLevel,
          prefix: '[OSI Cards]',
        },
        accessibility: mergedConfig.accessibility,
        error: mergedConfig.error,
      } satisfies OSICardsFullConfig,
    },
  ];

  // Add feature flags if configured
  if (config.featureFlags) {
    providers.push(provideFeatureFlags(config.featureFlags));
  }

  // Add DevTools in development or when explicitly enabled
  if (mergedConfig.enableDevTools) {
    providers.push(
      provideStoreDevtools({
        maxAge: 25,
        logOnly: !isDevMode(),
        autoPause: true,
        trace: isDevMode(),
        traceLimit: 75,
      })
    );
  }

  return providers;
}

/**
 * Provide minimal OSI Cards configuration
 * Use this for simple setups without NgRx or advanced features
 */
export function provideOSICardsMinimal(
  config: Pick<OSICardsConfig, 'streaming' | 'animation' | 'layout' | 'accessibility'> = {}
): (Provider | EnvironmentProviders)[] {
  return [
    provideAnimations(),
    provideHttpClient(),
    {
      provide: OSI_STREAMING_CONFIG,
      useValue: { ...DEFAULT_CONFIG.streaming, ...config.streaming },
    },
    {
      provide: OSI_ANIMATION_CONFIG,
      useValue: { ...DEFAULT_CONFIG.animation, ...config.animation },
    },
    {
      provide: OSI_LAYOUT_CONFIG,
      useValue: { ...DEFAULT_CONFIG.layout, ...config.layout },
    },
    {
      provide: OSI_ACCESSIBILITY_CONFIG,
      useValue: { ...DEFAULT_CONFIG.accessibility, ...config.accessibility },
    },
  ];
}

// Re-export library tokens for convenience
export {
  OSI_ACCESSIBILITY_CONFIG,
  OSI_ANIMATION_CONFIG,
  OSI_ERROR_CONFIG,
  OSI_FULL_CONFIG,
  OSI_LAYOUT_CONFIG,
  OSI_LOGGING_CONFIG,
  OSI_STREAMING_CONFIG,
  OSIAccessibilityConfig,
  OSIAnimationConfig,
  OSICardsFullConfig,
  OSIErrorConfig,
  OSILayoutConfig,
  OSILoggingConfig,
  OSIStreamingConfig,
} from '../../../../projects/osi-cards-lib/src/lib/providers/injection-tokens';

export {
  FeatureFlagsConfig,
  FeatureFlagsService,
  provideFeatureFlags,
} from '../../../../projects/osi-cards-lib/src/lib/services/feature-flags.service';
