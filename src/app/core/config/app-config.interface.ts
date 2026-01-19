/**
 * Application Configuration Interfaces
 *
 * Type-safe interfaces for all configuration sections in AppConfigService.
 * Provides compile-time type checking and runtime validation support.
 *
 * @example
 * ```typescript
 * import { AppConfig } from './app-config.interface';
 *
 * const config: AppConfig = {
 *   JSON_PROCESSING: { ... },
 *   LLM_SIMULATION: { ... },
 *   // ... other sections
 * };
 * ```
 */

/**
 * JSON Processing Configuration
 */
export interface JsonProcessingConfig {
  /** Immediate debounce time in milliseconds */
  IMMEDIATE_DEBOUNCE_MS: number;
  /** Debounced debounce time in milliseconds */
  DEBOUNCED_DEBOUNCE_MS: number;
  /** Maximum JSON length in characters */
  MAX_JSON_LENGTH: number;
  /** Maximum card title length in characters */
  MAX_CARD_TITLE_LENGTH: number;
}

/**
 * LLM Simulation Configuration
 */
export interface LlmSimulationConfig {
  /** Thinking delay in milliseconds */
  THINKING_DELAY_MS: number;
  /** Base chunk delay in milliseconds */
  CHUNK_DELAY_BASE_MS: number;
  /** Minimum chunk size in characters */
  MIN_CHUNK_SIZE: number;
  /** Maximum chunk size in characters */
  MAX_CHUNK_SIZE: number;
  /** Tokens per second for streaming */
  TOKENS_PER_SECOND: number;
  /** Characters per token */
  CHARS_PER_TOKEN: number;
  /** Stream timeout in milliseconds */
  STREAM_TIMEOUT_MS: number;
  /** Completion batch delay in milliseconds */
  COMPLETION_BATCH_DELAY_MS: number;
  /** Card update throttle in milliseconds */
  CARD_UPDATE_THROTTLE_MS: number;
  /** Content update throttle in milliseconds */
  CONTENT_UPDATE_THROTTLE_MS: number;
}

/**
 * Section Completion Configuration
 */
export interface SectionCompletionConfig {
  /** Batch delay in milliseconds */
  BATCH_DELAY_MS: number;
  /** Progress update threshold (0-1) */
  PROGRESS_UPDATE_THRESHOLD: number;
  /** Placeholder value for streaming */
  PLACEHOLDER_VALUE: string;
}

/**
 * Card Processing Configuration
 */
export interface CardProcessingConfig {
  /** Persist guard delay in milliseconds */
  PERSIST_GUARD_DELAY_MS: number;
  /** Maximum number of sections */
  MAX_SECTIONS: number;
  /** Maximum fields per section */
  MAX_FIELDS_PER_SECTION: number;
  /** Maximum items per section */
  MAX_ITEMS_PER_SECTION: number;
}

/**
 * Performance Configuration
 */
export interface PerformanceConfig {
  /** RequestAnimationFrame batch delay in milliseconds */
  RAF_BATCH_DELAY_MS: number;
  /** Default debounce time in milliseconds */
  DEBOUNCE_DEFAULT_MS: number;
  /** Default throttle time in milliseconds */
  THROTTLE_DEFAULT_MS: number;
}

/**
 * UI Configuration
 */
export interface UiConfig {
  /** Animation duration in milliseconds */
  ANIMATION_DURATION_MS: number;
  /** Toast duration in milliseconds */
  TOAST_DURATION_MS: number;
  /** Snackbar duration in milliseconds */
  SNACKBAR_DURATION_MS: number;
  /** Search debounce time in milliseconds */
  DEBOUNCE_SEARCH_MS: number;
}

/**
 * Validation Configuration
 */
export interface ValidationConfig {
  /** Minimum card title length */
  MIN_CARD_TITLE_LENGTH: number;
  /** Maximum card title length */
  MAX_CARD_TITLE_LENGTH: number;
  /** Minimum section title length */
  MIN_SECTION_TITLE_LENGTH: number;
  /** Maximum section title length */
  MAX_SECTION_TITLE_LENGTH: number;
}

/**
 * Caching Configuration
 */
export interface CacheConfig {
  /** Card cache TTL in milliseconds */
  CARD_CACHE_TTL_MS: number;
  /** Section cache TTL in milliseconds */
  SECTION_CACHE_TTL_MS: number;
  /** Maximum cache size */
  MAX_CACHE_SIZE: number;
}

/**
 * Error Handling Configuration
 */
export interface ErrorHandlingConfig {
  /** Maximum error message length */
  MAX_ERROR_MESSAGE_LENGTH: number;
  /** Number of retry attempts */
  RETRY_ATTEMPTS: number;
  /** Retry delay in milliseconds */
  RETRY_DELAY_MS: number;
}

/**
 * Logging Configuration
 */
export interface LoggingConfig {
  /** Enable section state logging */
  ENABLE_SECTION_STATE_LOGGING: boolean;
  /** Enable position logging */
  ENABLE_POSITION_LOGGING: boolean;
  /** Log level */
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  /** Enable debug logging */
  ENABLE_DEBUG: boolean;
  /** Enable performance logging */
  ENABLE_PERFORMANCE_LOGGING: boolean;
  /** Enable state logging */
  ENABLE_STATE_LOGGING: boolean;
  /** Log server URL */
  LOG_SERVER_URL: string;
  /** Enable log server */
  ENABLE_LOG_SERVER: boolean;
}

/**
 * Development Warnings Configuration
 */
export interface DevWarningsConfig {
  /** Whether warnings are enabled */
  ENABLED: boolean;
  /** Maximum warnings per session */
  MAX_WARNINGS_PER_SESSION: number;
  /** Warn on missing OnPush */
  WARN_ON_MISSING_ONPUSH: boolean;
  /** Warn on performance anti-patterns */
  WARN_ON_PERFORMANCE_ANTI_PATTERNS: boolean;
}

/**
 * Environment Configuration
 */
export interface EnvConfig {
  /** Whether running in production */
  PRODUCTION: boolean;
  /** Environment name */
  ENVIRONMENT_NAME: string;
  /** API URL */
  API_URL: string;
  /** API timeout in milliseconds */
  API_TIMEOUT: number;
}

/**
 * Feature Flags Configuration
 */
export interface FeaturesConfig {
  /** Enable experimental features */
  EXPERIMENTAL: boolean;
  /** Enable beta components */
  BETA_COMPONENTS: boolean;
  /** Enable advanced analytics */
  ADVANCED_ANALYTICS: boolean;
  /** Enable offline mode */
  OFFLINE_MODE: boolean;
}

/**
 * Card Limits Configuration
 */
export interface CardLimitsConfig {
  /** Maximum sections per card */
  MAX_SECTIONS: number;
  /** Maximum actions per card */
  MAX_ACTIONS: number;
  /** Maximum fields per section */
  MAX_FIELDS_PER_SECTION: number;
  /** Maximum title length */
  MAX_TITLE_LENGTH: number;
  /** Maximum description length */
  MAX_DESCRIPTION_LENGTH: number;
}

/**
 * Performance Environment Configuration
 */
export interface PerformanceEnvConfig {
  /** Enable change detection profiling */
  ENABLE_CHANGE_DETECTION_PROFILING: boolean;
  /** Enable bundle analysis */
  ENABLE_BUNDLE_ANALYSIS: boolean;
  /** Cache timeout in milliseconds */
  CACHE_TIMEOUT: number;
  /** Debounce time in milliseconds */
  DEBOUNCE_TIME: number;
}

/**
 * Dev Tools Configuration
 */
export interface DevToolsConfig {
  /** Enable Redux DevTools */
  ENABLE_REDUX_DEVTOOLS: boolean;
  /** Enable Angular DevTools */
  ENABLE_ANGULAR_DEVTOOLS: boolean;
  /** Show performance metrics */
  SHOW_PERFORMANCE_METRICS: boolean;
}

/**
 * Complete Application Configuration
 *
 * Combines all configuration sections into a single interface.
 * This interface should be implemented by AppConfigService.
 */
export interface AppConfig {
  /** JSON Processing Configuration */
  JSON_PROCESSING: JsonProcessingConfig;
  /** LLM Simulation Configuration */
  LLM_SIMULATION: LlmSimulationConfig;
  /** Section Completion Configuration */
  SECTION_COMPLETION: SectionCompletionConfig;
  /** Card Processing Configuration */
  CARD_PROCESSING: CardProcessingConfig;
  /** Performance Configuration */
  PERFORMANCE: PerformanceConfig;
  /** UI Configuration */
  UI: UiConfig;
  /** Validation Configuration */
  VALIDATION: ValidationConfig;
  /** Caching Configuration */
  CACHE: CacheConfig;
  /** Error Handling Configuration */
  ERROR_HANDLING: ErrorHandlingConfig;
  /** Logging Configuration */
  LOGGING: LoggingConfig;
  /** Development Warnings Configuration */
  DEV_WARNINGS: DevWarningsConfig;
  /** Environment Configuration */
  ENV: EnvConfig;
  /** Feature Flags Configuration */
  FEATURES: FeaturesConfig;
  /** Card Limits Configuration */
  CARD_LIMITS: CardLimitsConfig;
  /** Performance Environment Configuration */
  PERFORMANCE_ENV: PerformanceEnvConfig;
  /** Dev Tools Configuration */
  DEV_TOOLS: DevToolsConfig;
}
