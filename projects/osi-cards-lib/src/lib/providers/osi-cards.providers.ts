import { Provider, EnvironmentProviders, InjectionToken } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideLucideIcons } from '../icons/lucide-icons.module';

/**
 * CSS isolation mode for the library
 * - 'standard': Uses CSS Layers for encapsulation (default)
 * - 'strict': Adds additional CSS containment properties
 */
export type CSSIsolationMode = 'standard' | 'strict';

/**
 * Animation preset configuration
 * - 'full': All animations enabled (default)
 * - 'minimal': Only essential entrance animations
 * - 'none': All animations disabled (respects prefers-reduced-motion)
 */
export type AnimationPreset = 'full' | 'minimal' | 'none';

/**
 * Animation timing configuration
 */
export interface AnimationTimingConfig {
  /** Duration multiplier (1 = default, 0.5 = half speed, 2 = double speed) */
  durationMultiplier?: number;
  /** Entrance animation duration in ms */
  entranceDuration?: number;
  /** Hover animation duration in ms */
  hoverDuration?: number;
  /** Streaming animation duration in ms */
  streamingDuration?: number;
}

/**
 * Animation feature flags
 */
export interface AnimationFeatures {
  /** Enable card entrance animations */
  entrance?: boolean;
  /** Enable section streaming animations */
  streaming?: boolean;
  /** Enable hover effects and transitions */
  hover?: boolean;
  /** Enable skeleton shimmer animations */
  skeleton?: boolean;
  /** Enable 3D tilt effects */
  tilt?: boolean;
  /** Enable particle animations in empty state */
  particles?: boolean;
  /** Enable stagger delays for section entrance */
  stagger?: boolean;
}

/**
 * Complete animation configuration
 */
export interface AnimationConfig {
  /** Animation preset (shorthand for common configurations) */
  preset?: AnimationPreset;
  /** Individual animation feature toggles */
  features?: AnimationFeatures;
  /** Timing configuration */
  timing?: AnimationTimingConfig;
  /** Respect prefers-reduced-motion media query */
  respectReducedMotion?: boolean;
}

/**
 * Configuration options for OSI Cards Library
 */
export interface OSICardsLibConfig {
  /**
   * Whether to enable Angular animations. Defaults to true.
   * Set to false to use noop animations (useful for testing or when animations are not desired).
   */
  enableAnimations?: boolean;

  /**
   * Detailed animation configuration.
   * Provides fine-grained control over animation behavior.
   */
  animationConfig?: AnimationConfig;

  /**
   * CSS isolation mode for the library.
   * - 'standard': Uses CSS Layers for encapsulation (default)
   *   Styles are wrapped in @layer osi-cards, making them easy to override
   * - 'strict': Adds CSS containment properties for maximum isolation
   *   Uses contain: content and isolation: isolate for stronger CSS boundaries
   * 
   * @default 'standard'
   */
  cssIsolation?: CSSIsolationMode;

  /**
   * Default theme for the library.
   * Can be 'day' (light) or 'night' (dark).
   * 
   * @default 'day'
   */
  defaultTheme?: 'day' | 'night';
}

/**
 * Injection token for OSI Cards library configuration
 */
export const OSI_CARDS_CONFIG = new InjectionToken<OSICardsLibConfig>('OSI_CARDS_CONFIG');

/**
 * Injection token for CSS isolation mode
 */
export const CSS_ISOLATION_MODE = new InjectionToken<CSSIsolationMode>('CSS_ISOLATION_MODE');

/**
 * Injection token for default theme
 */
export const DEFAULT_THEME = new InjectionToken<'day' | 'night'>('DEFAULT_THEME');

/**
 * Injection token for animation configuration
 */
export const ANIMATION_CONFIG = new InjectionToken<AnimationConfig>('ANIMATION_CONFIG');

/**
 * Default animation features (all enabled)
 */
const DEFAULT_ANIMATION_FEATURES: AnimationFeatures = {
  entrance: true,
  streaming: true,
  hover: true,
  skeleton: true,
  tilt: true,
  particles: true,
  stagger: true
};

/**
 * Animation preset configurations
 */
const ANIMATION_PRESETS: Record<AnimationPreset, AnimationFeatures> = {
  full: DEFAULT_ANIMATION_FEATURES,
  minimal: {
    entrance: true,
    streaming: false,
    hover: false,
    skeleton: true,
    tilt: false,
    particles: false,
    stagger: false
  },
  none: {
    entrance: false,
    streaming: false,
    hover: false,
    skeleton: false,
    tilt: false,
    particles: false,
    stagger: false
  }
};

/**
 * Resolves animation configuration from preset and feature overrides
 */
function resolveAnimationConfig(config?: AnimationConfig): AnimationConfig {
  const preset = config?.preset ?? 'full';
  const presetFeatures = ANIMATION_PRESETS[preset];
  
  return {
    preset,
    features: {
      ...presetFeatures,
      ...config?.features
    },
    timing: {
      durationMultiplier: 1,
      entranceDuration: 220,
      hoverDuration: 200,
      streamingDuration: 300,
      ...config?.timing
    },
    respectReducedMotion: config?.respectReducedMotion ?? true
  };
}

/**
 * Provide OSI Cards Library with required providers
 * 
 * This function provides all necessary providers for the OSI Cards library to function
 * correctly in an Angular application. It includes:
 * - Animation providers (required for component animations)
 * - Lucide icons (required for icons in Shadow DOM components)
 * - Configuration injection tokens
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
 * // Full configuration
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideOSICards({
 *       enableAnimations: true,
 *       cssIsolation: 'strict',
 *       defaultTheme: 'night'
 *     }),
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
 * - Styles must be imported separately: @import 'osi-cards-lib/styles/_styles-scoped';
 * 
 * ## CSS Isolation Modes
 * 
 * The library uses CSS Layers (@layer) for style encapsulation:
 * - Library styles are in the 'osi-cards' layer
 * - Your styles (outside any layer) automatically have higher priority
 * - No need for !important to override library styles
 * 
 * For strict isolation:
 * - Use cssIsolation: 'strict' to enable CSS containment
 * - The container will use contain: content and isolation: isolate
 * - This creates a new stacking context and paint containment
 */
export function provideOSICards(config: OSICardsLibConfig = {}): (Provider | EnvironmentProviders)[] {
  const {
    enableAnimations = true,
    animationConfig,
    cssIsolation = 'standard',
    defaultTheme = 'day'
  } = config;

  // Resolve animation configuration
  const resolvedAnimationConfig = resolveAnimationConfig(animationConfig);
  
  // Determine if Angular animations should be enabled
  // Disable if explicitly set to false OR if animation preset is 'none'
  const shouldEnableAngularAnimations = enableAnimations && 
    resolvedAnimationConfig.preset !== 'none';

  const providers: (Provider | EnvironmentProviders)[] = [
    // Animation provider is REQUIRED for component animations
    shouldEnableAngularAnimations ? provideAnimations() : provideNoopAnimations(),
    
    // Lucide icons provider - REQUIRED for icons in Shadow DOM components
    // This ensures icons are registered at the application root injector level
    ...provideLucideIcons(),
    
    // Provide configuration through injection tokens
    { provide: OSI_CARDS_CONFIG, useValue: config },
    { provide: CSS_ISOLATION_MODE, useValue: cssIsolation },
    { provide: DEFAULT_THEME, useValue: defaultTheme },
    { provide: ANIMATION_CONFIG, useValue: resolvedAnimationConfig }
  ];

  // Services are provided via providedIn: 'root' and don't need explicit providers here
  // This includes:
  // - MagneticTiltService
  // - IconService
  // - SectionNormalizationService
  // - SectionUtilsService

  return providers;
}

/**
 * Utility function to check if a specific animation feature is enabled
 * @param config The resolved animation configuration
 * @param feature The feature to check
 * @returns true if the feature is enabled
 */
export function isAnimationFeatureEnabled(
  config: AnimationConfig | null | undefined,
  feature: keyof AnimationFeatures
): boolean {
  if (!config || !config.features) {
    return true; // Default to enabled if no config
  }
  return config.features[feature] ?? true;
}

/**
 * Get CSS custom properties for animation timing
 * Use this to inject timing values into component styles
 */
export function getAnimationTimingCSSVars(config: AnimationConfig | null | undefined): Record<string, string> {
  const timing = config?.timing ?? {};
  const multiplier = timing.durationMultiplier ?? 1;
  
  return {
    '--osi-anim-entrance-duration': `${(timing.entranceDuration ?? 220) * multiplier}ms`,
    '--osi-anim-hover-duration': `${(timing.hoverDuration ?? 200) * multiplier}ms`,
    '--osi-anim-streaming-duration': `${(timing.streamingDuration ?? 300) * multiplier}ms`,
    '--osi-anim-duration-multiplier': String(multiplier)
  };
}
