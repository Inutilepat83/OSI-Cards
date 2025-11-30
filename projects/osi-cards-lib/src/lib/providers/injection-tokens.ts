/**
 * OSI Cards Injection Tokens
 * 
 * Provides DI tokens for configuring library services.
 * Use these tokens to customize library behavior at the application level.
 * 
 * @example
 * ```typescript
 * import { 
 *   OSI_STREAMING_CONFIG, 
 *   OSI_ANIMATION_CONFIG 
 * } from 'osi-cards-lib';
 * 
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     {
 *       provide: OSI_STREAMING_CONFIG,
 *       useValue: { tokensPerSecond: 100 }
 *     },
 *     {
 *       provide: OSI_ANIMATION_CONFIG,
 *       useValue: { enabled: true, duration: 300 }
 *     }
 *   ]
 * };
 * ```
 */

import { InjectionToken } from '@angular/core';

// ============================================================================
// STREAMING CONFIGURATION
// ============================================================================

/**
 * Streaming service configuration options
 */
export interface OSIStreamingConfig {
  /** Characters per token for speed calculation */
  charsPerToken?: number;
  /** Target tokens per second */
  tokensPerSecond?: number;
  /** Card update throttle (ms) */
  updateThrottleMs?: number;
  /** Thinking delay before streaming starts (ms) */
  thinkingDelayMs?: number;
  /** Maximum buffer size before forcing parse */
  maxBufferSize?: number;
  /** Timeout for streaming operations (ms) */
  timeoutMs?: number;
}

/**
 * Default streaming configuration
 */
export const DEFAULT_STREAMING_CONFIG: OSIStreamingConfig = {
  charsPerToken: 4,
  tokensPerSecond: 80,
  updateThrottleMs: 50,
  thinkingDelayMs: 100,
  maxBufferSize: 100000,
  timeoutMs: 30000,
};

/**
 * Injection token for streaming configuration
 */
export const OSI_STREAMING_CONFIG = new InjectionToken<OSIStreamingConfig>(
  'OSI_STREAMING_CONFIG',
  {
    providedIn: 'root',
    factory: () => DEFAULT_STREAMING_CONFIG,
  }
);

// ============================================================================
// ANIMATION CONFIGURATION
// ============================================================================

/**
 * Animation configuration options
 */
export interface OSIAnimationConfig {
  /** Enable animations globally */
  enabled?: boolean;
  /** Default animation duration (ms) */
  duration?: number;
  /** Default easing function */
  easing?: string;
  /** Field stagger delay (ms) */
  fieldStaggerDelay?: number;
  /** Item stagger delay (ms) */
  itemStaggerDelay?: number;
  /** Section stagger delay (ms) */
  sectionStaggerDelay?: number;
  /** Card stagger delay (ms) */
  cardStaggerDelay?: number;
  /** Respect prefers-reduced-motion */
  respectReducedMotion?: boolean;
}

/**
 * Default animation configuration
 */
export const DEFAULT_ANIMATION_CONFIG: OSIAnimationConfig = {
  enabled: true,
  duration: 200,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  fieldStaggerDelay: 40,
  itemStaggerDelay: 40,
  sectionStaggerDelay: 80,
  cardStaggerDelay: 120,
  respectReducedMotion: true,
};

/**
 * Injection token for animation configuration
 */
export const OSI_ANIMATION_CONFIG = new InjectionToken<OSIAnimationConfig>(
  'OSI_ANIMATION_CONFIG',
  {
    providedIn: 'root',
    factory: () => DEFAULT_ANIMATION_CONFIG,
  }
);

// ============================================================================
// LAYOUT CONFIGURATION
// ============================================================================

/**
 * Layout configuration options
 */
export interface OSILayoutConfig {
  /** Default number of columns */
  defaultColumns?: number;
  /** Minimum column count */
  minColumns?: number;
  /** Maximum column count */
  maxColumns?: number;
  /** Default gap between items (px) */
  gap?: number;
  /** Packing algorithm to use */
  packingAlgorithm?: 'legacy' | 'row-first' | 'skyline';
  /** Enable virtual scrolling threshold */
  virtualScrollThreshold?: number;
  /** Resize debounce delay (ms) */
  resizeDebounceMs?: number;
  /** Enable debug mode */
  debug?: boolean;
}

/**
 * Default layout configuration
 */
export const DEFAULT_LAYOUT_CONFIG: OSILayoutConfig = {
  defaultColumns: 3,
  minColumns: 1,
  maxColumns: 4,
  gap: 16,
  packingAlgorithm: 'row-first',
  virtualScrollThreshold: 20,
  resizeDebounceMs: 150,
  debug: false,
};

/**
 * Injection token for layout configuration
 */
export const OSI_LAYOUT_CONFIG = new InjectionToken<OSILayoutConfig>(
  'OSI_LAYOUT_CONFIG',
  {
    providedIn: 'root',
    factory: () => DEFAULT_LAYOUT_CONFIG,
  }
);

// ============================================================================
// LOGGING CONFIGURATION
// ============================================================================

/**
 * Logging configuration options
 */
export interface OSILoggingConfig {
  /** Enable logging */
  enabled?: boolean;
  /** Minimum log level */
  level?: 'debug' | 'info' | 'warn' | 'error';
  /** Include timestamps */
  timestamps?: boolean;
  /** Log prefix */
  prefix?: string;
  /** Enable performance logging */
  performance?: boolean;
}

/**
 * Default logging configuration
 */
export const DEFAULT_LOGGING_CONFIG: OSILoggingConfig = {
  enabled: false,
  level: 'warn',
  timestamps: false,
  prefix: '[OSI Cards]',
  performance: false,
};

/**
 * Injection token for logging configuration
 */
export const OSI_LOGGING_CONFIG = new InjectionToken<OSILoggingConfig>(
  'OSI_LOGGING_CONFIG',
  {
    providedIn: 'root',
    factory: () => DEFAULT_LOGGING_CONFIG,
  }
);

// ============================================================================
// THEMING CONFIGURATION
// ============================================================================

/**
 * Theme configuration options
 */
export interface OSIThemeConfig {
  /** Default theme */
  defaultTheme?: string;
  /** Available themes */
  themes?: string[];
  /** Respect system color scheme */
  respectSystemScheme?: boolean;
  /** CSS variable prefix */
  cssPrefix?: string;
  /** Storage key for persistence */
  storageKey?: string;
}

/**
 * Default theme configuration
 */
export const DEFAULT_OSI_THEME_CONFIG: OSIThemeConfig = {
  defaultTheme: 'light',
  themes: ['light', 'dark', 'corporate', 'minimal'],
  respectSystemScheme: true,
  cssPrefix: 'osi',
  storageKey: 'osi-cards-theme',
};

/**
 * Injection token for theme configuration
 */
export const OSI_THEME_CONFIG_TOKEN = new InjectionToken<OSIThemeConfig>(
  'OSI_THEME_CONFIG_TOKEN',
  {
    providedIn: 'root',
    factory: () => DEFAULT_OSI_THEME_CONFIG,
  }
);

// ============================================================================
// ACCESSIBILITY CONFIGURATION
// ============================================================================

/**
 * Accessibility configuration options
 */
export interface OSIAccessibilityConfig {
  /** Enable keyboard navigation */
  keyboardNavigation?: boolean;
  /** Enable focus indicators */
  focusIndicators?: boolean;
  /** Enable screen reader announcements */
  announcements?: boolean;
  /** ARIA labels locale */
  locale?: string;
  /** High contrast mode */
  highContrast?: boolean;
}

/**
 * Default accessibility configuration
 */
export const DEFAULT_ACCESSIBILITY_CONFIG: OSIAccessibilityConfig = {
  keyboardNavigation: true,
  focusIndicators: true,
  announcements: true,
  locale: 'en',
  highContrast: false,
};

/**
 * Injection token for accessibility configuration
 */
export const OSI_ACCESSIBILITY_CONFIG = new InjectionToken<OSIAccessibilityConfig>(
  'OSI_ACCESSIBILITY_CONFIG',
  {
    providedIn: 'root',
    factory: () => DEFAULT_ACCESSIBILITY_CONFIG,
  }
);

// ============================================================================
// SECTION REGISTRY
// ============================================================================

/**
 * Custom section registration
 */
export interface OSISectionRegistration {
  /** Section type identifier */
  type: string;
  /** Component to render */
  component: unknown;
  /** Default properties */
  defaults?: Record<string, unknown>;
}

/**
 * Injection token for custom section registry
 */
export const OSI_CUSTOM_SECTIONS = new InjectionToken<OSISectionRegistration[]>(
  'OSI_CUSTOM_SECTIONS',
  {
    providedIn: 'root',
    factory: () => [],
  }
);

// ============================================================================
// ERROR HANDLING CONFIGURATION
// ============================================================================

/**
 * Error handling configuration options
 */
export interface OSIErrorConfig {
  /** Show error boundaries */
  showErrorBoundaries?: boolean;
  /** Custom error handler */
  errorHandler?: (error: Error, context?: string) => void;
  /** Retry failed operations */
  retryOnError?: boolean;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Show user-friendly error messages */
  userFriendlyMessages?: boolean;
}

/**
 * Default error handling configuration
 */
export const DEFAULT_ERROR_CONFIG: OSIErrorConfig = {
  showErrorBoundaries: true,
  retryOnError: true,
  maxRetries: 3,
  userFriendlyMessages: true,
};

/**
 * Injection token for error handling configuration
 */
export const OSI_ERROR_CONFIG = new InjectionToken<OSIErrorConfig>(
  'OSI_ERROR_CONFIG',
  {
    providedIn: 'root',
    factory: () => DEFAULT_ERROR_CONFIG,
  }
);

// ============================================================================
// COMBINED CONFIGURATION
// ============================================================================

/**
 * Complete OSI Cards configuration (extended)
 */
export interface OSICardsFullConfig {
  streaming?: OSIStreamingConfig;
  animation?: OSIAnimationConfig;
  layout?: OSILayoutConfig;
  logging?: OSILoggingConfig;
  theme?: OSIThemeConfig;
  accessibility?: OSIAccessibilityConfig;
  error?: OSIErrorConfig;
}

/**
 * Default complete configuration
 */
export const DEFAULT_OSI_CARDS_FULL_CONFIG: OSICardsFullConfig = {
  streaming: DEFAULT_STREAMING_CONFIG,
  animation: DEFAULT_ANIMATION_CONFIG,
  layout: DEFAULT_LAYOUT_CONFIG,
  logging: DEFAULT_LOGGING_CONFIG,
  theme: DEFAULT_OSI_THEME_CONFIG,
  accessibility: DEFAULT_ACCESSIBILITY_CONFIG,
  error: DEFAULT_ERROR_CONFIG,
};

/**
 * Injection token for complete OSI Cards configuration (extended)
 */
export const OSI_FULL_CONFIG = new InjectionToken<OSICardsFullConfig>(
  'OSI_FULL_CONFIG',
  {
    providedIn: 'root',
    factory: () => DEFAULT_OSI_CARDS_FULL_CONFIG,
  }
);

