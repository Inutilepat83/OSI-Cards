import { Provider, EnvironmentProviders } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

/**
 * Configuration options for OSI Cards Library
 */
export interface OSICardsLibConfig {
  /**
   * Whether to enable animations. Defaults to true.
   * Set to false to use noop animations (useful for testing or when animations are not desired).
   */
  enableAnimations?: boolean;
}

/**
 * Provide OSI Cards Library with required providers
 * 
 * This function provides all necessary providers for the OSI Cards library to function
 * correctly in an Angular application. It includes:
 * - Animation providers (required for component animations)
 * - Service providers (services use providedIn: 'root' so they're automatically available)
 * 
 * @param config - Optional configuration object
 * @returns Array of providers to be added to your ApplicationConfig
 * 
 * @example
 * ```typescript
 * // In your app.config.ts
 * import { ApplicationConfig } from '@angular/core';
 * import { provideOSICards } from 'osi-cards-lib';
 * 
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideOSICards(), // Enable animations (default)
 *     // ... other providers
 *   ]
 * };
 * ```
 * 
 * @example
 * ```typescript
 * // Disable animations (for testing or performance)
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideOSICards({ enableAnimations: false }),
 *     // ... other providers
 *   ]
 * };
 * ```
 * 
 * @remarks
 * - **REQUIRED**: You must call this function in your app.config.ts providers array
 * - Animations are required for proper component behavior (entrance animations, transitions)
 * - Services (MagneticTiltService, IconService, etc.) are automatically provided via providedIn: 'root'
 * - Styles must be imported separately: @import 'osi-cards-lib/styles/_styles';
 */
export function provideOSICards(config: OSICardsLibConfig = {}): (Provider | EnvironmentProviders)[] {
  const {
    enableAnimations = true
  } = config;

  const providers: (Provider | EnvironmentProviders)[] = [
    // Animation provider is REQUIRED for component animations
    enableAnimations ? provideAnimations() : provideNoopAnimations()
  ];

  // Services are provided via providedIn: 'root' and don't need explicit providers here
  // This includes:
  // - MagneticTiltService
  // - IconService
  // - SectionNormalizationService
  // - SectionUtilsService

  return providers;
}

