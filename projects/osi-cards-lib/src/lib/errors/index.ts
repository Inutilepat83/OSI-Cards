/**
 * OSI Cards Error Classes
 *
 * Typed error classes for different error scenarios in the library.
 * Each error class includes context-specific information for debugging.
 *
 * @example
 * ```typescript
 * import { SectionRenderError, StreamingError, ValidationError } from '../../public-api';
 *
 * try {
 *   // Section rendering code
 * } catch (error) {
 *   if (error instanceof SectionRenderError) {
 *     console.log(`Section ${error.sectionId} failed: ${error.message}`);
 *   }
 * }
 * ```
 */

// ============================================================================
// BASE ERROR
// ============================================================================

/**
 * Base error class for OSI Cards library errors.
 * All custom errors should extend this class.
 */
export class OSICardsError extends Error {
  /** Error code for categorization */
  readonly code: string;

  /** Timestamp when error occurred */
  readonly timestamp: Date;

  /** Additional context data */
  readonly context?: Record<string, unknown>;

  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'OSICardsError';
    this.code = code;
    this.timestamp = new Date();
    this.context = context;

    // Maintain proper stack trace in V8 environments
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to a JSON-serializable object
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
    };
  }

  /**
   * Create a user-friendly error message
   */
  toUserMessage(): string {
    return `An error occurred: ${this.message}`;
  }
}

// ============================================================================
// SECTION ERRORS
// ============================================================================

/**
 * Error thrown when section rendering fails
 */
export class SectionRenderError extends OSICardsError {
  /** ID of the section that failed */
  readonly sectionId?: string;

  /** Type of the section that failed */
  readonly sectionType?: string;

  /** Original error that caused the failure */
  override readonly cause?: Error;

  constructor(message: string, sectionId?: string, sectionType?: string, cause?: Error) {
    super(message, 'SECTION_RENDER_ERROR', { sectionId, sectionType });
    this.name = 'SectionRenderError';
    this.sectionId = sectionId;
    this.sectionType = sectionType;
    this.cause = cause;
  }

  override toUserMessage(): string {
    const typeInfo = this.sectionType ? ` (${this.sectionType})` : '';
    return `Unable to display section${typeInfo}. Please try refreshing.`;
  }
}

/**
 * Error thrown when section type is not recognized
 */
export class UnknownSectionTypeError extends OSICardsError {
  /** The unknown section type */
  readonly unknownType: string;

  /** Available section types */
  readonly availableTypes?: string[];

  constructor(unknownType: string, availableTypes?: string[]) {
    const availableStr = availableTypes ? ` Available types: ${availableTypes.join(', ')}` : '';
    super(`Unknown section type: "${unknownType}".${availableStr}`, 'UNKNOWN_SECTION_TYPE', {
      unknownType,
      availableTypes,
    });
    this.name = 'UnknownSectionTypeError';
    this.unknownType = unknownType;
    this.availableTypes = availableTypes;
  }

  override toUserMessage(): string {
    return `The section type "${this.unknownType}" is not supported.`;
  }
}

// ============================================================================
// STREAMING ERRORS
// ============================================================================

/**
 * Error thrown during card streaming
 */
export class StreamingError extends OSICardsError {
  /** Current progress when error occurred (0-100) */
  readonly progress?: number;

  /** Current streaming stage */
  readonly stage?: string;

  /** Whether the error is recoverable */
  readonly recoverable: boolean;

  constructor(message: string, progress?: number, stage?: string, recoverable = true) {
    super(message, 'STREAMING_ERROR', { progress, stage, recoverable });
    this.name = 'StreamingError';
    this.progress = progress;
    this.stage = stage;
    this.recoverable = recoverable;
  }

  override toUserMessage(): string {
    if (this.recoverable) {
      return 'Connection interrupted. Attempting to reconnect...';
    }
    return 'Unable to load card data. Please try again.';
  }
}

/**
 * Error thrown when streaming times out
 */
export class StreamingTimeoutError extends StreamingError {
  /** Timeout duration in milliseconds */
  readonly timeoutMs: number;

  constructor(timeoutMs: number, progress?: number, stage?: string) {
    super(`Streaming timed out after ${timeoutMs}ms`, progress, stage, true);
    this.name = 'StreamingTimeoutError';
    (this as any).code = 'STREAMING_TIMEOUT';
    this.timeoutMs = timeoutMs;
  }

  override toUserMessage(): string {
    return 'Loading is taking longer than expected. Please wait or try again.';
  }
}

/**
 * Error thrown when JSON parsing fails during streaming
 */
export class StreamingParseError extends StreamingError {
  /** The malformed JSON string */
  readonly jsonFragment?: string;

  /** Parse error details */
  readonly parseError?: string;

  constructor(parseError: string, jsonFragment?: string, progress?: number) {
    super(`Failed to parse streaming data: ${parseError}`, progress, 'parsing', true);
    this.name = 'StreamingParseError';
    (this as any).code = 'STREAMING_PARSE_ERROR';
    this.jsonFragment = jsonFragment;
    this.parseError = parseError;
  }

  override toUserMessage(): string {
    return 'Received invalid data. Waiting for more data...';
  }
}

// ============================================================================
// VALIDATION ERRORS
// ============================================================================

/**
 * Error thrown when card configuration validation fails
 */
export class ValidationError extends OSICardsError {
  /** Validation errors found */
  readonly errors: string[];

  /** The invalid configuration */
  readonly invalidConfig?: Record<string, unknown>;

  constructor(errors: string[], invalidConfig?: Record<string, unknown>) {
    super(`Card configuration invalid: ${errors.join(', ')}`, 'VALIDATION_ERROR', { errors });
    this.name = 'ValidationError';
    this.errors = errors;
    this.invalidConfig = invalidConfig;
  }

  override toUserMessage(): string {
    return 'The card configuration is invalid. Please check your data.';
  }
}

/**
 * Error thrown when required field is missing
 */
export class RequiredFieldError extends ValidationError {
  /** Name of the missing field */
  readonly fieldName: string;

  /** Path to the missing field */
  readonly fieldPath?: string;

  constructor(fieldName: string, fieldPath?: string) {
    const pathStr = fieldPath ? ` at ${fieldPath}` : '';
    super([`Required field "${fieldName}" is missing${pathStr}`]);
    this.name = 'RequiredFieldError';
    (this as any).code = 'REQUIRED_FIELD_ERROR';
    this.fieldName = fieldName;
    this.fieldPath = fieldPath;
  }
}

// ============================================================================
// LAYOUT ERRORS
// ============================================================================

/**
 * Error thrown when layout calculation fails
 */
export class LayoutError extends OSICardsError {
  /** Number of sections being laid out */
  readonly sectionCount?: number;

  /** Number of columns */
  readonly columns?: number;

  /** Layout algorithm being used */
  readonly algorithm?: string;

  constructor(message: string, sectionCount?: number, columns?: number, algorithm?: string) {
    super(message, 'LAYOUT_ERROR', { sectionCount, columns, algorithm });
    this.name = 'LayoutError';
    this.sectionCount = sectionCount;
    this.columns = columns;
    this.algorithm = algorithm;
  }

  override toUserMessage(): string {
    return 'Unable to arrange sections. The layout may appear differently.';
  }
}

/**
 * Error thrown when worker fails
 */
export class WorkerError extends OSICardsError {
  /** Worker message type that failed */
  readonly messageType?: string;

  /** Worker ID if available */
  readonly workerId?: string;

  constructor(message: string, messageType?: string, workerId?: string) {
    super(message, 'WORKER_ERROR', { messageType, workerId });
    this.name = 'WorkerError';
    this.messageType = messageType;
    this.workerId = workerId;
  }

  override toUserMessage(): string {
    return 'Background processing failed. Falling back to main thread.';
  }
}

// ============================================================================
// PLUGIN ERRORS
// ============================================================================

/**
 * Error thrown when plugin registration fails
 */
export class PluginRegistrationError extends OSICardsError {
  /** Plugin ID that failed */
  readonly pluginId: string;

  /** Reason for failure */
  readonly reason: string;

  constructor(pluginId: string, reason: string) {
    super(`Failed to register plugin "${pluginId}": ${reason}`, 'PLUGIN_REGISTRATION_ERROR');
    this.name = 'PluginRegistrationError';
    this.pluginId = pluginId;
    this.reason = reason;
  }

  override toUserMessage(): string {
    return 'A component extension failed to load.';
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if an error is an OSICardsError
 */
export function isOSICardsError(error: unknown): error is OSICardsError {
  return error instanceof OSICardsError;
}

/**
 * Wrap an unknown error in an OSICardsError
 */
export function wrapError(error: unknown, code = 'UNKNOWN_ERROR'): OSICardsError {
  if (isOSICardsError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new OSICardsError(error.message, code, { originalError: error.name });
  }

  return new OSICardsError(String(error), code);
}

/**
 * Get a user-friendly message from any error
 */
export function getUserMessage(error: unknown): string {
  if (isOSICardsError(error)) {
    return error.toUserMessage();
  }

  if (error instanceof Error) {
    return 'An unexpected error occurred.';
  }

  return 'Something went wrong.';
}
