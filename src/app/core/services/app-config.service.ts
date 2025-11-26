import { Injectable } from '@angular/core';

/**
 * Centralized application configuration service
 * 
 * Contains all configurable constants, thresholds, and timing values used throughout the application.
 * This service centralizes configuration to make it easier to adjust values and maintain consistency.
 * 
 * @example
 * ```typescript
 * const config = inject(AppConfigService);
 * const debounceTime = config.JSON_PROCESSING.DEBOUNCED_DEBOUNCE_MS;
 * ```
 * 
 * @since 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  // JSON Processing Configuration
  readonly JSON_PROCESSING = {
    IMMEDIATE_DEBOUNCE_MS: 10,
    DEBOUNCED_DEBOUNCE_MS: 300,
    MAX_JSON_LENGTH: 1000000,
    MAX_CARD_TITLE_LENGTH: 200,
    MAX_CARD_SUBTITLE_LENGTH: 500
  };

  // LLM Simulation Configuration
  readonly LLM_SIMULATION = {
    THINKING_DELAY_MS: 3500, // Reduced by 30% (from 5000ms) for faster generation
    CHUNK_DELAY_BASE_MS: 10,
    MIN_CHUNK_SIZE: 18,
    MAX_CHUNK_SIZE: 64,
    TOKENS_PER_SECOND: 130, // Increased by 30% (from 100) for faster generation
    CHARS_PER_TOKEN: 4,
    STREAM_TIMEOUT_MS: 30000,
    COMPLETION_BATCH_DELAY_MS: 70 // Reduced by 30% (from 100ms) for faster generation
  };

  // Section Completion Configuration
  readonly SECTION_COMPLETION = {
    BATCH_DELAY_MS: 70, // Reduced by 30% (from 100ms) for faster generation
    PROGRESS_UPDATE_THRESHOLD: 0.1,
    PLACEHOLDER_VALUE: 'Streaming…'
  };

  // Card Processing Configuration
  readonly CARD_PROCESSING = {
    PERSIST_GUARD_DELAY_MS: 300,
    MAX_SECTIONS: 100,
    MAX_FIELDS_PER_SECTION: 1000,
    MAX_ITEMS_PER_SECTION: 1000
  };

  // Performance Configuration
  readonly PERFORMANCE = {
    RAF_BATCH_DELAY_MS: 16, // ~60fps
    DEBOUNCE_DEFAULT_MS: 300,
    THROTTLE_DEFAULT_MS: 100
  };

  // UI Configuration
  readonly UI = {
    ANIMATION_DURATION_MS: 300,
    TOAST_DURATION_MS: 3000,
    SNACKBAR_DURATION_MS: 4000,
    DEBOUNCE_SEARCH_MS: 500
  };

  // Validation Configuration
  readonly VALIDATION = {
    MIN_CARD_TITLE_LENGTH: 1,
    MAX_CARD_TITLE_LENGTH: 200,
    MIN_SECTION_TITLE_LENGTH: 1,
    MAX_SECTION_TITLE_LENGTH: 100
  };

  // Caching Configuration
  readonly CACHE = {
    CARD_CACHE_TTL_MS: 300000, // 5 minutes
    SECTION_CACHE_TTL_MS: 60000, // 1 minute
    MAX_CACHE_SIZE: 100
  };

  // Error Handling Configuration
  readonly ERROR_HANDLING = {
    MAX_ERROR_MESSAGE_LENGTH: 500,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 1000
  };

  // Logging Configuration
  readonly LOGGING = {
    ENABLE_SECTION_STATE_LOGGING: true,
    ENABLE_POSITION_LOGGING: false,
    LOG_LEVEL: 'info' as 'debug' | 'info' | 'warn' | 'error'
  };
}

