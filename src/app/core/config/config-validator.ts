/**
 * Configuration Validator
 *
 * Provides runtime validation for AppConfigService configuration.
 * Validates ranges, constraints, and required fields to ensure
 * configuration is valid before application startup.
 *
 * @example
 * ```typescript
 * import { ConfigValidator } from './config-validator';
 *
 * const validator = new ConfigValidator();
 * const result = validator.validate(config);
 *
 * if (!result.valid) {
 *   console.error('Configuration errors:', result.errors);
 * }
 * ```
 */

import { AppConfig } from './app-config.interface';

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether configuration is valid */
  valid: boolean;
  /** Array of validation errors */
  errors: ValidationError[];
  /** Array of validation warnings */
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Section where error occurred */
  section: string;
  /** Field name */
  field: string;
  /** Error message */
  message: string;
  /** Actual value */
  actual?: unknown;
  /** Expected value or range */
  expected?: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  /** Section where warning occurred */
  section: string;
  /** Field name */
  field: string;
  /** Warning message */
  message: string;
  /** Suggested value */
  suggestion?: string;
}

/**
 * Configuration Validator
 *
 * Validates AppConfig against constraints and best practices.
 */
export class ConfigValidator {
  /**
   * Validate complete configuration
   */
  validate(config: Partial<AppConfig>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate each section
    if (config.JSON_PROCESSING) {
      this.validateJsonProcessing(config.JSON_PROCESSING, errors, warnings);
    }

    if (config.LLM_SIMULATION) {
      this.validateLlmSimulation(config.LLM_SIMULATION, errors, warnings);
    }

    if (config.SECTION_COMPLETION) {
      this.validateSectionCompletion(config.SECTION_COMPLETION, errors, warnings);
    }

    if (config.CARD_PROCESSING) {
      this.validateCardProcessing(config.CARD_PROCESSING, errors, warnings);
    }

    if (config.PERFORMANCE) {
      this.validatePerformance(config.PERFORMANCE, errors, warnings);
    }

    if (config.UI) {
      this.validateUi(config.UI, errors, warnings);
    }

    if (config.VALIDATION) {
      this.validateValidation(config.VALIDATION, errors, warnings);
    }

    if (config.CACHE) {
      this.validateCache(config.CACHE, errors, warnings);
    }

    if (config.ERROR_HANDLING) {
      this.validateErrorHandling(config.ERROR_HANDLING, errors, warnings);
    }

    if (config.LOGGING) {
      this.validateLogging(config.LOGGING, errors, warnings);
    }

    if (config.DEV_WARNINGS) {
      this.validateDevWarnings(config.DEV_WARNINGS, errors, warnings);
    }

    if (config.ENV) {
      this.validateEnv(config.ENV, errors, warnings);
    }

    if (config.FEATURES) {
      this.validateFeatures(config.FEATURES, errors, warnings);
    }

    if (config.CARD_LIMITS) {
      this.validateCardLimits(config.CARD_LIMITS, errors, warnings);
    }

    if (config.PERFORMANCE_ENV) {
      this.validatePerformanceEnv(config.PERFORMANCE_ENV, errors, warnings);
    }

    if (config.DEV_TOOLS) {
      this.validateDevTools(config.DEV_TOOLS, errors, warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate JSON Processing Configuration
   */
  private validateJsonProcessing(
    config: AppConfig['JSON_PROCESSING'],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (config.IMMEDIATE_DEBOUNCE_MS < 0) {
      errors.push({
        section: 'JSON_PROCESSING',
        field: 'IMMEDIATE_DEBOUNCE_MS',
        message: 'IMMEDIATE_DEBOUNCE_MS must be >= 0',
        actual: config.IMMEDIATE_DEBOUNCE_MS,
        expected: '>= 0',
      });
    }

    if (config.DEBOUNCED_DEBOUNCE_MS < 0) {
      errors.push({
        section: 'JSON_PROCESSING',
        field: 'DEBOUNCED_DEBOUNCE_MS',
        message: 'DEBOUNCED_DEBOUNCE_MS must be >= 0',
        actual: config.DEBOUNCED_DEBOUNCE_MS,
        expected: '>= 0',
      });
    }

    if (config.MAX_JSON_LENGTH <= 0) {
      errors.push({
        section: 'JSON_PROCESSING',
        field: 'MAX_JSON_LENGTH',
        message: 'MAX_JSON_LENGTH must be > 0',
        actual: config.MAX_JSON_LENGTH,
        expected: '> 0',
      });
    }

    if (config.MAX_CARD_TITLE_LENGTH <= 0) {
      errors.push({
        section: 'JSON_PROCESSING',
        field: 'MAX_CARD_TITLE_LENGTH',
        message: 'MAX_CARD_TITLE_LENGTH must be > 0',
        actual: config.MAX_CARD_TITLE_LENGTH,
        expected: '> 0',
      });
    }

    if (config.DEBOUNCED_DEBOUNCE_MS < config.IMMEDIATE_DEBOUNCE_MS) {
      warnings.push({
        section: 'JSON_PROCESSING',
        field: 'DEBOUNCED_DEBOUNCE_MS',
        message: 'DEBOUNCED_DEBOUNCE_MS should be >= IMMEDIATE_DEBOUNCE_MS',
        suggestion: `Set to at least ${config.IMMEDIATE_DEBOUNCE_MS}`,
      });
    }
  }

  /**
   * Validate LLM Simulation Configuration
   */
  private validateLlmSimulation(
    config: AppConfig['LLM_SIMULATION'],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (config.THINKING_DELAY_MS < 0) {
      errors.push({
        section: 'LLM_SIMULATION',
        field: 'THINKING_DELAY_MS',
        message: 'THINKING_DELAY_MS must be >= 0',
        actual: config.THINKING_DELAY_MS,
        expected: '>= 0',
      });
    }

    if (config.CHUNK_DELAY_BASE_MS < 0) {
      errors.push({
        section: 'LLM_SIMULATION',
        field: 'CHUNK_DELAY_BASE_MS',
        message: 'CHUNK_DELAY_BASE_MS must be >= 0',
        actual: config.CHUNK_DELAY_BASE_MS,
        expected: '>= 0',
      });
    }

    if (config.MIN_CHUNK_SIZE <= 0) {
      errors.push({
        section: 'LLM_SIMULATION',
        field: 'MIN_CHUNK_SIZE',
        message: 'MIN_CHUNK_SIZE must be > 0',
        actual: config.MIN_CHUNK_SIZE,
        expected: '> 0',
      });
    }

    if (config.MAX_CHUNK_SIZE < config.MIN_CHUNK_SIZE) {
      errors.push({
        section: 'LLM_SIMULATION',
        field: 'MAX_CHUNK_SIZE',
        message: 'MAX_CHUNK_SIZE must be >= MIN_CHUNK_SIZE',
        actual: config.MAX_CHUNK_SIZE,
        expected: `>= ${config.MIN_CHUNK_SIZE}`,
      });
    }

    if (config.TOKENS_PER_SECOND <= 0) {
      errors.push({
        section: 'LLM_SIMULATION',
        field: 'TOKENS_PER_SECOND',
        message: 'TOKENS_PER_SECOND must be > 0',
        actual: config.TOKENS_PER_SECOND,
        expected: '> 0',
      });
    }

    if (config.CHARS_PER_TOKEN <= 0) {
      errors.push({
        section: 'LLM_SIMULATION',
        field: 'CHARS_PER_TOKEN',
        message: 'CHARS_PER_TOKEN must be > 0',
        actual: config.CHARS_PER_TOKEN,
        expected: '> 0',
      });
    }

    if (config.STREAM_TIMEOUT_MS <= 0) {
      errors.push({
        section: 'LLM_SIMULATION',
        field: 'STREAM_TIMEOUT_MS',
        message: 'STREAM_TIMEOUT_MS must be > 0',
        actual: config.STREAM_TIMEOUT_MS,
        expected: '> 0',
      });
    }
  }

  /**
   * Validate Section Completion Configuration
   */
  private validateSectionCompletion(
    config: AppConfig['SECTION_COMPLETION'],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (config.BATCH_DELAY_MS < 0) {
      errors.push({
        section: 'SECTION_COMPLETION',
        field: 'BATCH_DELAY_MS',
        message: 'BATCH_DELAY_MS must be >= 0',
        actual: config.BATCH_DELAY_MS,
        expected: '>= 0',
      });
    }

    if (config.PROGRESS_UPDATE_THRESHOLD < 0 || config.PROGRESS_UPDATE_THRESHOLD > 1) {
      errors.push({
        section: 'SECTION_COMPLETION',
        field: 'PROGRESS_UPDATE_THRESHOLD',
        message: 'PROGRESS_UPDATE_THRESHOLD must be between 0 and 1',
        actual: config.PROGRESS_UPDATE_THRESHOLD,
        expected: '0-1',
      });
    }
  }

  /**
   * Validate Card Processing Configuration
   */
  private validateCardProcessing(
    config: AppConfig['CARD_PROCESSING'],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (config.PERSIST_GUARD_DELAY_MS < 0) {
      errors.push({
        section: 'CARD_PROCESSING',
        field: 'PERSIST_GUARD_DELAY_MS',
        message: 'PERSIST_GUARD_DELAY_MS must be >= 0',
        actual: config.PERSIST_GUARD_DELAY_MS,
        expected: '>= 0',
      });
    }

    if (config.MAX_SECTIONS <= 0) {
      errors.push({
        section: 'CARD_PROCESSING',
        field: 'MAX_SECTIONS',
        message: 'MAX_SECTIONS must be > 0',
        actual: config.MAX_SECTIONS,
        expected: '> 0',
      });
    }

    if (config.MAX_FIELDS_PER_SECTION <= 0) {
      errors.push({
        section: 'CARD_PROCESSING',
        field: 'MAX_FIELDS_PER_SECTION',
        message: 'MAX_FIELDS_PER_SECTION must be > 0',
        actual: config.MAX_FIELDS_PER_SECTION,
        expected: '> 0',
      });
    }

    if (config.MAX_ITEMS_PER_SECTION <= 0) {
      errors.push({
        section: 'CARD_PROCESSING',
        field: 'MAX_ITEMS_PER_SECTION',
        message: 'MAX_ITEMS_PER_SECTION must be > 0',
        actual: config.MAX_ITEMS_PER_SECTION,
        expected: '> 0',
      });
    }
  }

  /**
   * Validate Performance Configuration
   */
  private validatePerformance(
    config: AppConfig['PERFORMANCE'],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (config.RAF_BATCH_DELAY_MS < 0) {
      errors.push({
        section: 'PERFORMANCE',
        field: 'RAF_BATCH_DELAY_MS',
        message: 'RAF_BATCH_DELAY_MS must be >= 0',
        actual: config.RAF_BATCH_DELAY_MS,
        expected: '>= 0',
      });
    }

    if (config.DEBOUNCE_DEFAULT_MS < 0) {
      errors.push({
        section: 'PERFORMANCE',
        field: 'DEBOUNCE_DEFAULT_MS',
        message: 'DEBOUNCE_DEFAULT_MS must be >= 0',
        actual: config.DEBOUNCE_DEFAULT_MS,
        expected: '>= 0',
      });
    }

    if (config.THROTTLE_DEFAULT_MS < 0) {
      errors.push({
        section: 'PERFORMANCE',
        field: 'THROTTLE_DEFAULT_MS',
        message: 'THROTTLE_DEFAULT_MS must be >= 0',
        actual: config.THROTTLE_DEFAULT_MS,
        expected: '>= 0',
      });
    }
  }

  /**
   * Validate UI Configuration
   */
  private validateUi(
    config: AppConfig['UI'],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (config.ANIMATION_DURATION_MS < 0) {
      errors.push({
        section: 'UI',
        field: 'ANIMATION_DURATION_MS',
        message: 'ANIMATION_DURATION_MS must be >= 0',
        actual: config.ANIMATION_DURATION_MS,
        expected: '>= 0',
      });
    }

    if (config.TOAST_DURATION_MS < 0) {
      errors.push({
        section: 'UI',
        field: 'TOAST_DURATION_MS',
        message: 'TOAST_DURATION_MS must be >= 0',
        actual: config.TOAST_DURATION_MS,
        expected: '>= 0',
      });
    }

    if (config.SNACKBAR_DURATION_MS < 0) {
      errors.push({
        section: 'UI',
        field: 'SNACKBAR_DURATION_MS',
        message: 'SNACKBAR_DURATION_MS must be >= 0',
        actual: config.SNACKBAR_DURATION_MS,
        expected: '>= 0',
      });
    }

    if (config.DEBOUNCE_SEARCH_MS < 0) {
      errors.push({
        section: 'UI',
        field: 'DEBOUNCE_SEARCH_MS',
        message: 'DEBOUNCE_SEARCH_MS must be >= 0',
        actual: config.DEBOUNCE_SEARCH_MS,
        expected: '>= 0',
      });
    }
  }

  /**
   * Validate Validation Configuration
   */
  private validateValidation(
    config: AppConfig['VALIDATION'],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (config.MIN_CARD_TITLE_LENGTH < 0) {
      errors.push({
        section: 'VALIDATION',
        field: 'MIN_CARD_TITLE_LENGTH',
        message: 'MIN_CARD_TITLE_LENGTH must be >= 0',
        actual: config.MIN_CARD_TITLE_LENGTH,
        expected: '>= 0',
      });
    }

    if (config.MAX_CARD_TITLE_LENGTH < config.MIN_CARD_TITLE_LENGTH) {
      errors.push({
        section: 'VALIDATION',
        field: 'MAX_CARD_TITLE_LENGTH',
        message: 'MAX_CARD_TITLE_LENGTH must be >= MIN_CARD_TITLE_LENGTH',
        actual: config.MAX_CARD_TITLE_LENGTH,
        expected: `>= ${config.MIN_CARD_TITLE_LENGTH}`,
      });
    }

    if (config.MIN_SECTION_TITLE_LENGTH < 0) {
      errors.push({
        section: 'VALIDATION',
        field: 'MIN_SECTION_TITLE_LENGTH',
        message: 'MIN_SECTION_TITLE_LENGTH must be >= 0',
        actual: config.MIN_SECTION_TITLE_LENGTH,
        expected: '>= 0',
      });
    }

    if (config.MAX_SECTION_TITLE_LENGTH < config.MIN_SECTION_TITLE_LENGTH) {
      errors.push({
        section: 'VALIDATION',
        field: 'MAX_SECTION_TITLE_LENGTH',
        message: 'MAX_SECTION_TITLE_LENGTH must be >= MIN_SECTION_TITLE_LENGTH',
        actual: config.MAX_SECTION_TITLE_LENGTH,
        expected: `>= ${config.MIN_SECTION_TITLE_LENGTH}`,
      });
    }
  }

  /**
   * Validate Cache Configuration
   */
  private validateCache(
    config: AppConfig['CACHE'],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (config.CARD_CACHE_TTL_MS < 0) {
      errors.push({
        section: 'CACHE',
        field: 'CARD_CACHE_TTL_MS',
        message: 'CARD_CACHE_TTL_MS must be >= 0',
        actual: config.CARD_CACHE_TTL_MS,
        expected: '>= 0',
      });
    }

    if (config.SECTION_CACHE_TTL_MS < 0) {
      errors.push({
        section: 'CACHE',
        field: 'SECTION_CACHE_TTL_MS',
        message: 'SECTION_CACHE_TTL_MS must be >= 0',
        actual: config.SECTION_CACHE_TTL_MS,
        expected: '>= 0',
      });
    }

    if (config.MAX_CACHE_SIZE <= 0) {
      errors.push({
        section: 'CACHE',
        field: 'MAX_CACHE_SIZE',
        message: 'MAX_CACHE_SIZE must be > 0',
        actual: config.MAX_CACHE_SIZE,
        expected: '> 0',
      });
    }
  }

  /**
   * Validate Error Handling Configuration
   */
  private validateErrorHandling(
    config: AppConfig['ERROR_HANDLING'],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (config.MAX_ERROR_MESSAGE_LENGTH <= 0) {
      errors.push({
        section: 'ERROR_HANDLING',
        field: 'MAX_ERROR_MESSAGE_LENGTH',
        message: 'MAX_ERROR_MESSAGE_LENGTH must be > 0',
        actual: config.MAX_ERROR_MESSAGE_LENGTH,
        expected: '> 0',
      });
    }

    if (config.RETRY_ATTEMPTS < 0) {
      errors.push({
        section: 'ERROR_HANDLING',
        field: 'RETRY_ATTEMPTS',
        message: 'RETRY_ATTEMPTS must be >= 0',
        actual: config.RETRY_ATTEMPTS,
        expected: '>= 0',
      });
    }

    if (config.RETRY_DELAY_MS < 0) {
      errors.push({
        section: 'ERROR_HANDLING',
        field: 'RETRY_DELAY_MS',
        message: 'RETRY_DELAY_MS must be >= 0',
        actual: config.RETRY_DELAY_MS,
        expected: '>= 0',
      });
    }
  }

  /**
   * Validate Logging Configuration
   */
  private validateLogging(
    config: AppConfig['LOGGING'],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const validLogLevels = ['debug', 'info', 'warn', 'error'];
    if (!validLogLevels.includes(config.LOG_LEVEL)) {
      errors.push({
        section: 'LOGGING',
        field: 'LOG_LEVEL',
        message: `LOG_LEVEL must be one of: ${validLogLevels.join(', ')}`,
        actual: config.LOG_LEVEL,
        expected: validLogLevels.join(' | '),
      });
    }

    if (config.LOG_SERVER_URL && !this.isValidUrl(config.LOG_SERVER_URL)) {
      warnings.push({
        section: 'LOGGING',
        field: 'LOG_SERVER_URL',
        message: 'LOG_SERVER_URL appears to be invalid',
        suggestion: 'Use a valid URL format (e.g., http://localhost:3001)',
      });
    }
  }

  /**
   * Validate Dev Warnings Configuration
   */
  private validateDevWarnings(
    config: AppConfig['DEV_WARNINGS'],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (config.MAX_WARNINGS_PER_SESSION < 0) {
      errors.push({
        section: 'DEV_WARNINGS',
        field: 'MAX_WARNINGS_PER_SESSION',
        message: 'MAX_WARNINGS_PER_SESSION must be >= 0',
        actual: config.MAX_WARNINGS_PER_SESSION,
        expected: '>= 0',
      });
    }
  }

  /**
   * Validate Environment Configuration
   */
  private validateEnv(
    config: AppConfig['ENV'],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (config.API_URL && !this.isValidUrl(config.API_URL)) {
      warnings.push({
        section: 'ENV',
        field: 'API_URL',
        message: 'API_URL appears to be invalid',
        suggestion: 'Use a valid URL format',
      });
    }

    if (config.API_TIMEOUT < 0) {
      errors.push({
        section: 'ENV',
        field: 'API_TIMEOUT',
        message: 'API_TIMEOUT must be >= 0',
        actual: config.API_TIMEOUT,
        expected: '>= 0',
      });
    }
  }

  /**
   * Validate Features Configuration
   */
  private validateFeatures(
    config: AppConfig['FEATURES'],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Features are boolean flags, no validation needed
    // But we can add warnings for production
  }

  /**
   * Validate Card Limits Configuration
   */
  private validateCardLimits(
    config: AppConfig['CARD_LIMITS'],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (config.MAX_SECTIONS <= 0) {
      errors.push({
        section: 'CARD_LIMITS',
        field: 'MAX_SECTIONS',
        message: 'MAX_SECTIONS must be > 0',
        actual: config.MAX_SECTIONS,
        expected: '> 0',
      });
    }

    if (config.MAX_ACTIONS < 0) {
      errors.push({
        section: 'CARD_LIMITS',
        field: 'MAX_ACTIONS',
        message: 'MAX_ACTIONS must be >= 0',
        actual: config.MAX_ACTIONS,
        expected: '>= 0',
      });
    }

    if (config.MAX_FIELDS_PER_SECTION <= 0) {
      errors.push({
        section: 'CARD_LIMITS',
        field: 'MAX_FIELDS_PER_SECTION',
        message: 'MAX_FIELDS_PER_SECTION must be > 0',
        actual: config.MAX_FIELDS_PER_SECTION,
        expected: '> 0',
      });
    }

    if (config.MAX_TITLE_LENGTH <= 0) {
      errors.push({
        section: 'CARD_LIMITS',
        field: 'MAX_TITLE_LENGTH',
        message: 'MAX_TITLE_LENGTH must be > 0',
        actual: config.MAX_TITLE_LENGTH,
        expected: '> 0',
      });
    }

    if (config.MAX_DESCRIPTION_LENGTH <= 0) {
      errors.push({
        section: 'CARD_LIMITS',
        field: 'MAX_DESCRIPTION_LENGTH',
        message: 'MAX_DESCRIPTION_LENGTH must be > 0',
        actual: config.MAX_DESCRIPTION_LENGTH,
        expected: '> 0',
      });
    }
  }

  /**
   * Validate Performance Environment Configuration
   */
  private validatePerformanceEnv(
    config: AppConfig['PERFORMANCE_ENV'],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (config.CACHE_TIMEOUT < 0) {
      errors.push({
        section: 'PERFORMANCE_ENV',
        field: 'CACHE_TIMEOUT',
        message: 'CACHE_TIMEOUT must be >= 0',
        actual: config.CACHE_TIMEOUT,
        expected: '>= 0',
      });
    }

    if (config.DEBOUNCE_TIME < 0) {
      errors.push({
        section: 'PERFORMANCE_ENV',
        field: 'DEBOUNCE_TIME',
        message: 'DEBOUNCE_TIME must be >= 0',
        actual: config.DEBOUNCE_TIME,
        expected: '>= 0',
      });
    }
  }

  /**
   * Validate Dev Tools Configuration
   */
  private validateDevTools(
    config: AppConfig['DEV_TOOLS'],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Dev tools are boolean flags, no validation needed
  }

  /**
   * Check if string is a valid URL
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get formatted error message
   */
  getErrorMessage(result: ValidationResult): string {
    if (result.valid) {
      return 'Configuration is valid';
    }

    const errorMessages = result.errors.map(
      (error) => `${error.section}.${error.field}: ${error.message}`
    );

    return `Configuration validation failed:\n${errorMessages.join('\n')}`;
  }

  /**
   * Get formatted warning message
   */
  getWarningMessage(result: ValidationResult): string {
    if (result.warnings.length === 0) {
      return '';
    }

    const warningMessages = result.warnings.map(
      (warning) => `${warning.section}.${warning.field}: ${warning.message}`
    );

    return `Configuration warnings:\n${warningMessages.join('\n')}`;
  }
}
