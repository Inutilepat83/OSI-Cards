import { Provider, EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { MIGRATION_FLAGS_TOKEN } from '@osi-cards/services';
import { MigrationFlags } from '@osi-cards/lib/config/migration-flags.config';
import { SectionFactory } from '@osi-cards/lib/factories';
import { EventBusService } from '@osi-cards/services';
import { IconService } from '@osi-cards/services';
import { SectionNormalizationService } from '@osi-cards/services';
import { SectionUtilsService } from '@osi-cards/services';
import { CardFacadeService } from '@osi-cards/services';
import { SectionPluginRegistry } from '@osi-cards/services';
import { FeatureFlagsService } from '@osi-cards/services';
import { AccessibilityService } from '@osi-cards/services';
import { VERSION } from '@osi-cards/lib/version';
import { checkVersionRequirement } from '@osi-cards/utils';
// Removed - animation.service deleted
// Use animation utilities instead
// import { LayoutOptimizerService } from '@osi-cards/services';  // Service disabled due to type errors

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

  /** Minimum required library version (semver format, e.g., ">=1.5.0" or "^1.5.0") */
  minVersion?: string;
}

/**
 * Core providers required for OSI Cards functionality
 * Updated with consolidated services (Phase 3)
 */
export function provideOsiCardsCore(): Provider[] {
  return [
    // Core services
    SectionFactory,
    EventBusService,
    IconService,
    SectionNormalizationService,
    SectionUtilsService,
    CardFacadeService,
    SectionPluginRegistry,

    // Consolidated services (Phase 3)
    FeatureFlagsService, // Now includes migration flags
    AccessibilityService, // Now includes focus-trap, live-announcer, reduced-motion
    // AnimationService, // Removed // Now includes orchestrator + section animation
    // LayoutOptimizerService,      // Disabled: service has type errors
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
  // Perform version check if minimum version is specified
  checkVersionRequirement(VERSION, config?.minVersion);

  const providers: Provider[] = [...provideOsiCardsCore()];

  // Add migration flags if provided
  if (config?.migrationFlags) {
    providers.push({
      provide: MIGRATION_FLAGS_TOKEN,
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
  return makeEnvironmentProviders([EventBusService, IconService, SectionNormalizationService]);
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
      provide: MIGRATION_FLAGS_TOKEN,
      useValue: {
        USE_LIB_SECTIONS: true,
        USE_SECTION_REGISTRY: true,
        ENABLE_PERFORMANCE_MONITORING: false,
      } as Partial<MigrationFlags>,
    },
  ]);
}
