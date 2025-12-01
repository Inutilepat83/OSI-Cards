import { Provider, EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { MigrationFlagsService, MIGRATION_FLAGS } from '../services/migration-flags.service';
import { MigrationFlags } from '../config/migration-flags.config';
import { SectionFactory } from '../factories/section.factory';
import { EventBusService } from '../services/event-bus.service';
import { IconService } from '../services/icon.service';
import { SectionNormalizationService } from '../services/section-normalization.service';
import { SectionUtilsService } from '../services/section-utils.service';
import { CardFacadeService } from '../services/card-facade.service';
import { SectionPluginRegistryService } from '../services/section-plugin-registry.service';
import { FeatureFlagsService } from '../services/feature-flags.service';
import { AccessibilityService } from '../services/accessibility.service';
import { ReducedMotionService } from '../services/reduced-motion.service';

/**
 * Configuration options for OSI Cards library
 */
export interface OsiCardsConfig {
  /** Enable debug mode with extra logging */
  debug?: boolean;

  /** Migration flags for gradual rollout */
  migrationFlags?: Partial<MigrationFlags>;

  /** Preload common section types */
  preloadSections?: boolean;

  /** Enable service worker caching */
  enableCaching?: boolean;

  /** Custom icon provider */
  iconProvider?: 'lucide' | 'material' | 'custom';

  /** Default theme */
  defaultTheme?: 'light' | 'dark' | 'system';
}

/**
 * Core providers required for OSI Cards functionality
 */
export function provideOsiCardsCore(): Provider[] {
  return [
    MigrationFlagsService,
    SectionFactory,
    EventBusService,
    IconService,
    SectionNormalizationService,
    SectionUtilsService,
    CardFacadeService,
    SectionPluginRegistryService,
    FeatureFlagsService,
    AccessibilityService,
    ReducedMotionService,
  ];
}

/**
 * Provide OSI Cards with default configuration
 *
 * @example
 * ```typescript
 * // app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideOsiCards(),
 *     // or with options:
 *     provideOsiCards({
 *       debug: true,
 *       preloadSections: true,
 *       defaultTheme: 'dark',
 *     }),
 *   ]
 * };
 * ```
 */
export function provideOsiCards(config?: OsiCardsConfig): EnvironmentProviders {
  const providers: Provider[] = [
    ...provideOsiCardsCore(),
  ];

  // Add migration flags if provided
  if (config?.migrationFlags) {
    providers.push({
      provide: MIGRATION_FLAGS,
      useValue: config.migrationFlags,
    });
  }

  return makeEnvironmentProviders(providers);
}

/**
 * Provide minimal OSI Cards setup (only essential services)
 * Use this for apps that only need basic functionality
 */
export function provideOsiCardsMinimal(): EnvironmentProviders {
  return makeEnvironmentProviders([
    EventBusService,
    IconService,
    SectionNormalizationService,
  ]);
}

/**
 * Additional providers for advanced features
 */
export function provideOsiCardsAdvanced(): Provider[] {
  return [
    // These are imported separately to allow tree-shaking
  ];
}

/**
 * Providers for testing OSI Cards components
 * Includes mocked versions of services
 */
export function provideOsiCardsTesting(): EnvironmentProviders {
  return makeEnvironmentProviders([
    ...provideOsiCardsCore(),
    // Override with test-friendly versions if needed
    {
      provide: MIGRATION_FLAGS,
      useValue: {
        USE_LIB_SECTIONS: true,
        USE_SECTION_REGISTRY: true,
        ENABLE_PERFORMANCE_MONITORING: false,
      } as Partial<MigrationFlags>,
    },
  ]);
}
