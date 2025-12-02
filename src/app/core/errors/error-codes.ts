/**
 * Structured Error Codes System (Point 31)
 *
 * Provides standardized error codes with documentation links
 * for better debugging and user support.
 *
 * Error Code Format: OSI-XXXX
 * - OSI-1XXX: Configuration errors
 * - OSI-2XXX: Runtime errors
 * - OSI-3XXX: Network errors
 * - OSI-4XXX: Validation errors
 * - OSI-5XXX: Security errors
 * - OSI-9XXX: Internal errors
 *
 * @example
 * ```typescript
 * import { OsiError, ErrorCodes } from './error-codes';
 *
 * throw new OsiError(ErrorCodes.INVALID_CARD_CONFIG, {
 *   details: 'Missing required field: title',
 *   context: { cardId: 'card-123' }
 * });
 * ```
 */

// =============================================================================
// ERROR CODE DEFINITIONS
// =============================================================================

export const ErrorCodes = {
  // Configuration Errors (1XXX)
  INVALID_CARD_CONFIG: 'OSI-1001',
  INVALID_SECTION_CONFIG: 'OSI-1002',
  INVALID_THEME_CONFIG: 'OSI-1003',
  MISSING_REQUIRED_FIELD: 'OSI-1004',
  INVALID_SECTION_TYPE: 'OSI-1005',
  INVALID_FIELD_FORMAT: 'OSI-1006',
  CONFIG_PARSE_ERROR: 'OSI-1007',
  SCHEMA_VALIDATION_FAILED: 'OSI-1008',
  CIRCULAR_REFERENCE: 'OSI-1009',
  MAX_DEPTH_EXCEEDED: 'OSI-1010',

  // Runtime Errors (2XXX)
  COMPONENT_NOT_FOUND: 'OSI-2001',
  SECTION_RENDER_FAILED: 'OSI-2002',
  CARD_RENDER_FAILED: 'OSI-2003',
  LAYOUT_CALCULATION_FAILED: 'OSI-2004',
  ANIMATION_FAILED: 'OSI-2005',
  STATE_MUTATION_ERROR: 'OSI-2006',
  MEMORY_LIMIT_EXCEEDED: 'OSI-2007',
  WORKER_ERROR: 'OSI-2008',
  TIMEOUT_ERROR: 'OSI-2009',
  INITIALIZATION_FAILED: 'OSI-2010',

  // Network Errors (3XXX)
  NETWORK_ERROR: 'OSI-3001',
  FETCH_FAILED: 'OSI-3002',
  STREAMING_ERROR: 'OSI-3003',
  WEBSOCKET_ERROR: 'OSI-3004',
  CONNECTION_TIMEOUT: 'OSI-3005',
  RATE_LIMITED: 'OSI-3006',
  CORS_ERROR: 'OSI-3007',
  SSL_ERROR: 'OSI-3008',
  API_ERROR: 'OSI-3009',
  OFFLINE_ERROR: 'OSI-3010',

  // Validation Errors (4XXX)
  VALIDATION_ERROR: 'OSI-4001',
  TYPE_MISMATCH: 'OSI-4002',
  RANGE_ERROR: 'OSI-4003',
  FORMAT_ERROR: 'OSI-4004',
  CONSTRAINT_VIOLATION: 'OSI-4005',
  DUPLICATE_ID: 'OSI-4006',
  INVALID_STATE: 'OSI-4007',
  ASSERTION_FAILED: 'OSI-4008',

  // Security Errors (5XXX)
  SECURITY_ERROR: 'OSI-5001',
  XSS_DETECTED: 'OSI-5002',
  INJECTION_DETECTED: 'OSI-5003',
  UNAUTHORIZED: 'OSI-5004',
  FORBIDDEN: 'OSI-5005',
  CSP_VIOLATION: 'OSI-5006',
  INVALID_TOKEN: 'OSI-5007',
  SANITIZATION_FAILED: 'OSI-5008',

  // Internal Errors (9XXX)
  INTERNAL_ERROR: 'OSI-9001',
  NOT_IMPLEMENTED: 'OSI-9002',
  DEPRECATED_USAGE: 'OSI-9003',
  UNKNOWN_ERROR: 'OSI-9999',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// =============================================================================
// ERROR METADATA
// =============================================================================

interface ErrorMetadata {
  /** Human-readable error message */
  message: string;
  /** Detailed description */
  description: string;
  /** Documentation URL */
  docsUrl: string;
  /** Severity level */
  severity: 'error' | 'warning' | 'info';
  /** Recovery suggestions */
  suggestions: string[];
  /** Related error codes */
  related?: ErrorCode[];
}

const ERROR_METADATA: Record<ErrorCode, ErrorMetadata> = {
  // Configuration Errors
  [ErrorCodes.INVALID_CARD_CONFIG]: {
    message: 'Invalid card configuration',
    description: 'The provided card configuration object is invalid or malformed.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-1001',
    severity: 'error',
    suggestions: [
      'Ensure the configuration includes a valid cardTitle',
      'Check that sections array contains valid section objects',
      'Validate JSON syntax if loading from file',
    ],
    related: [ErrorCodes.INVALID_SECTION_CONFIG, ErrorCodes.SCHEMA_VALIDATION_FAILED],
  },
  [ErrorCodes.INVALID_SECTION_CONFIG]: {
    message: 'Invalid section configuration',
    description: 'A section in the card configuration is invalid.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-1002',
    severity: 'error',
    suggestions: [
      'Ensure each section has a valid type field',
      'Check that required fields for the section type are present',
      'Verify fields/items arrays have correct structure',
    ],
  },
  [ErrorCodes.INVALID_THEME_CONFIG]: {
    message: 'Invalid theme configuration',
    description: 'The theme configuration is invalid or contains unsupported values.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-1003',
    severity: 'warning',
    suggestions: [
      'Use a valid theme preset name',
      'Ensure custom theme tokens are valid CSS values',
      'Check theme color format (hex, rgb, hsl)',
    ],
  },
  [ErrorCodes.MISSING_REQUIRED_FIELD]: {
    message: 'Missing required field',
    description: 'A required field is missing from the configuration.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-1004',
    severity: 'error',
    suggestions: [
      'Check the documentation for required fields',
      'Ensure all required fields are present and not null',
    ],
  },
  [ErrorCodes.INVALID_SECTION_TYPE]: {
    message: 'Invalid section type',
    description: 'The specified section type is not recognized.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-1005',
    severity: 'error',
    suggestions: [
      'Use a valid section type from the section registry',
      'Check for typos in the type field',
      'Register custom section types before use',
    ],
  },
  [ErrorCodes.INVALID_FIELD_FORMAT]: {
    message: 'Invalid field format',
    description: 'A field value has an invalid format.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-1006',
    severity: 'warning',
    suggestions: [
      'Check the expected format for the field',
      'Ensure dates are in ISO 8601 format',
      'Verify URLs are properly formatted',
    ],
  },
  [ErrorCodes.CONFIG_PARSE_ERROR]: {
    message: 'Configuration parse error',
    description: 'Failed to parse the configuration (JSON syntax error).',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-1007',
    severity: 'error',
    suggestions: [
      'Validate JSON syntax using a JSON validator',
      'Check for trailing commas or missing quotes',
      'Ensure proper escaping of special characters',
    ],
  },
  [ErrorCodes.SCHEMA_VALIDATION_FAILED]: {
    message: 'Schema validation failed',
    description: 'The configuration does not match the expected schema.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-1008',
    severity: 'error',
    suggestions: [
      'Review the schema documentation',
      'Check field types match expected types',
      'Validate against the JSON schema',
    ],
  },
  [ErrorCodes.CIRCULAR_REFERENCE]: {
    message: 'Circular reference detected',
    description: 'The configuration contains circular references.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-1009',
    severity: 'error',
    suggestions: [
      'Remove circular references from the configuration',
      'Use IDs instead of nested objects for references',
    ],
  },
  [ErrorCodes.MAX_DEPTH_EXCEEDED]: {
    message: 'Maximum nesting depth exceeded',
    description: 'The configuration exceeds the maximum allowed nesting depth.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-1010',
    severity: 'error',
    suggestions: ['Flatten the configuration structure', 'Maximum nesting depth is 50 levels'],
  },

  // Runtime Errors
  [ErrorCodes.COMPONENT_NOT_FOUND]: {
    message: 'Component not found',
    description: 'The requested component could not be found.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-2001',
    severity: 'error',
    suggestions: [
      'Ensure the component is properly registered',
      'Check import statements',
      'Verify the component selector',
    ],
  },
  [ErrorCodes.SECTION_RENDER_FAILED]: {
    message: 'Section render failed',
    description: 'Failed to render a section component.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-2002',
    severity: 'error',
    suggestions: [
      'Check section data for errors',
      'Verify section component is available',
      'Check browser console for details',
    ],
  },
  [ErrorCodes.CARD_RENDER_FAILED]: {
    message: 'Card render failed',
    description: 'Failed to render the card component.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-2003',
    severity: 'error',
    suggestions: [
      'Check card configuration for errors',
      'Verify all required dependencies are loaded',
      'Check browser console for details',
    ],
  },
  [ErrorCodes.LAYOUT_CALCULATION_FAILED]: {
    message: 'Layout calculation failed',
    description: 'Failed to calculate the grid layout.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-2004',
    severity: 'warning',
    suggestions: [
      'Check container dimensions',
      'Verify section column preferences',
      'Try refreshing the page',
    ],
  },
  [ErrorCodes.ANIMATION_FAILED]: {
    message: 'Animation failed',
    description: 'An animation failed to execute.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-2005',
    severity: 'warning',
    suggestions: [
      'Check for CSS conflicts',
      'Verify animation configuration',
      'Try disabling animations temporarily',
    ],
  },
  [ErrorCodes.STATE_MUTATION_ERROR]: {
    message: 'State mutation error',
    description: 'Invalid state mutation detected.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-2006',
    severity: 'error',
    suggestions: [
      'Ensure state is updated immutably',
      'Use proper NgRx actions for state changes',
      'Check for direct state mutations',
    ],
  },
  [ErrorCodes.MEMORY_LIMIT_EXCEEDED]: {
    message: 'Memory limit exceeded',
    description: 'The application has exceeded memory limits.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-2007',
    severity: 'error',
    suggestions: [
      'Reduce the number of cards displayed',
      'Enable virtual scrolling for large lists',
      'Check for memory leaks',
    ],
  },
  [ErrorCodes.WORKER_ERROR]: {
    message: 'Web Worker error',
    description: 'An error occurred in a Web Worker.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-2008',
    severity: 'error',
    suggestions: [
      'Check worker script for errors',
      'Verify message format',
      'Check browser console for details',
    ],
  },
  [ErrorCodes.TIMEOUT_ERROR]: {
    message: 'Operation timed out',
    description: 'An operation exceeded the timeout limit.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-2009',
    severity: 'warning',
    suggestions: [
      'Check network connectivity',
      'Increase timeout if needed',
      'Retry the operation',
    ],
  },
  [ErrorCodes.INITIALIZATION_FAILED]: {
    message: 'Initialization failed',
    description: 'Failed to initialize a service or component.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-2010',
    severity: 'error',
    suggestions: [
      'Check provider configuration',
      'Verify all dependencies are available',
      'Check for circular dependencies',
    ],
  },

  // Network Errors
  [ErrorCodes.NETWORK_ERROR]: {
    message: 'Network error',
    description: 'A network error occurred.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-3001',
    severity: 'error',
    suggestions: [
      'Check internet connectivity',
      'Verify the server is accessible',
      'Check for firewall issues',
    ],
  },
  [ErrorCodes.FETCH_FAILED]: {
    message: 'Fetch failed',
    description: 'Failed to fetch a resource.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-3002',
    severity: 'error',
    suggestions: [
      'Check the URL is correct',
      'Verify the resource exists',
      'Check network connectivity',
    ],
  },
  [ErrorCodes.STREAMING_ERROR]: {
    message: 'Streaming error',
    description: 'An error occurred during streaming.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-3003',
    severity: 'error',
    suggestions: ['Check streaming endpoint', 'Verify connection is stable', 'Try reconnecting'],
  },
  [ErrorCodes.WEBSOCKET_ERROR]: {
    message: 'WebSocket error',
    description: 'A WebSocket connection error occurred.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-3004',
    severity: 'error',
    suggestions: [
      'Check WebSocket URL',
      'Verify server supports WebSocket',
      'Check for proxy issues',
    ],
  },
  [ErrorCodes.CONNECTION_TIMEOUT]: {
    message: 'Connection timeout',
    description: 'The connection timed out.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-3005',
    severity: 'warning',
    suggestions: ['Check network connectivity', 'Server may be overloaded', 'Try again later'],
  },
  [ErrorCodes.RATE_LIMITED]: {
    message: 'Rate limited',
    description: 'Request rate limit exceeded.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-3006',
    severity: 'warning',
    suggestions: [
      'Wait before making more requests',
      'Reduce request frequency',
      'Implement request batching',
    ],
  },
  [ErrorCodes.CORS_ERROR]: {
    message: 'CORS error',
    description: 'Cross-Origin Resource Sharing error.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-3007',
    severity: 'error',
    suggestions: [
      'Configure CORS on the server',
      'Use a proxy for development',
      'Check allowed origins',
    ],
  },
  [ErrorCodes.SSL_ERROR]: {
    message: 'SSL/TLS error',
    description: 'An SSL/TLS error occurred.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-3008',
    severity: 'error',
    suggestions: [
      'Check SSL certificate validity',
      'Verify HTTPS configuration',
      'Check for certificate chain issues',
    ],
  },
  [ErrorCodes.API_ERROR]: {
    message: 'API error',
    description: 'The API returned an error.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-3009',
    severity: 'error',
    suggestions: [
      'Check API response for details',
      'Verify request parameters',
      'Check API documentation',
    ],
  },
  [ErrorCodes.OFFLINE_ERROR]: {
    message: 'Offline',
    description: 'The application is offline.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-3010',
    severity: 'warning',
    suggestions: [
      'Check internet connectivity',
      'Some features may be unavailable offline',
      'Cached content is still accessible',
    ],
  },

  // Validation Errors
  [ErrorCodes.VALIDATION_ERROR]: {
    message: 'Validation error',
    description: 'Data validation failed.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-4001',
    severity: 'error',
    suggestions: ['Check input data format', 'Review validation rules', 'Correct invalid values'],
  },
  [ErrorCodes.TYPE_MISMATCH]: {
    message: 'Type mismatch',
    description: 'Value type does not match expected type.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-4002',
    severity: 'error',
    suggestions: [
      'Check expected type in documentation',
      'Convert value to correct type',
      'Verify data source',
    ],
  },
  [ErrorCodes.RANGE_ERROR]: {
    message: 'Value out of range',
    description: 'Value is outside the allowed range.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-4003',
    severity: 'error',
    suggestions: [
      'Check allowed value range',
      'Clamp value to valid range',
      'Review input constraints',
    ],
  },
  [ErrorCodes.FORMAT_ERROR]: {
    message: 'Invalid format',
    description: 'Value format is invalid.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-4004',
    severity: 'error',
    suggestions: ['Check expected format', 'Use proper date/time format', 'Verify string patterns'],
  },
  [ErrorCodes.CONSTRAINT_VIOLATION]: {
    message: 'Constraint violation',
    description: 'A constraint was violated.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-4005',
    severity: 'error',
    suggestions: [
      'Review constraint requirements',
      'Check unique constraints',
      'Verify business rules',
    ],
  },
  [ErrorCodes.DUPLICATE_ID]: {
    message: 'Duplicate ID',
    description: 'A duplicate ID was detected.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-4006',
    severity: 'error',
    suggestions: [
      'Ensure all IDs are unique',
      'Generate unique IDs automatically',
      'Check for copy-paste errors',
    ],
  },
  [ErrorCodes.INVALID_STATE]: {
    message: 'Invalid state',
    description: 'Operation not allowed in current state.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-4007',
    severity: 'error',
    suggestions: [
      'Check component lifecycle',
      'Verify initialization is complete',
      'Review state machine transitions',
    ],
  },
  [ErrorCodes.ASSERTION_FAILED]: {
    message: 'Assertion failed',
    description: 'A runtime assertion failed.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-4008',
    severity: 'error',
    suggestions: ['Check preconditions', 'Verify assumptions', 'Review logic flow'],
  },

  // Security Errors
  [ErrorCodes.SECURITY_ERROR]: {
    message: 'Security error',
    description: 'A security error occurred.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-5001',
    severity: 'error',
    suggestions: [
      'Check security configuration',
      'Review access permissions',
      'Contact administrator',
    ],
  },
  [ErrorCodes.XSS_DETECTED]: {
    message: 'XSS attempt detected',
    description: 'Potential cross-site scripting detected.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-5002',
    severity: 'error',
    suggestions: ['Input has been sanitized', 'Review input source', 'Report suspicious activity'],
  },
  [ErrorCodes.INJECTION_DETECTED]: {
    message: 'Injection attempt detected',
    description: 'Potential injection attack detected.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-5003',
    severity: 'error',
    suggestions: ['Input has been sanitized', 'Review input source', 'Report suspicious activity'],
  },
  [ErrorCodes.UNAUTHORIZED]: {
    message: 'Unauthorized',
    description: 'Authentication required.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-5004',
    severity: 'error',
    suggestions: ['Log in to continue', 'Check credentials', 'Session may have expired'],
  },
  [ErrorCodes.FORBIDDEN]: {
    message: 'Forbidden',
    description: 'Access denied.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-5005',
    severity: 'error',
    suggestions: ['You do not have permission', 'Contact administrator', 'Check access rights'],
  },
  [ErrorCodes.CSP_VIOLATION]: {
    message: 'CSP violation',
    description: 'Content Security Policy violation.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-5006',
    severity: 'error',
    suggestions: ['Resource blocked by CSP', 'Review CSP configuration', 'Use allowed sources'],
  },
  [ErrorCodes.INVALID_TOKEN]: {
    message: 'Invalid token',
    description: 'Authentication token is invalid.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-5007',
    severity: 'error',
    suggestions: ['Token may have expired', 'Log in again', 'Check token format'],
  },
  [ErrorCodes.SANITIZATION_FAILED]: {
    message: 'Sanitization failed',
    description: 'Failed to sanitize input.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-5008',
    severity: 'error',
    suggestions: ['Input could not be safely processed', 'Review input content', 'Contact support'],
  },

  // Internal Errors
  [ErrorCodes.INTERNAL_ERROR]: {
    message: 'Internal error',
    description: 'An internal error occurred.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-9001',
    severity: 'error',
    suggestions: [
      'Try refreshing the page',
      'Clear browser cache',
      'Contact support if problem persists',
    ],
  },
  [ErrorCodes.NOT_IMPLEMENTED]: {
    message: 'Not implemented',
    description: 'This feature is not yet implemented.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-9002',
    severity: 'warning',
    suggestions: [
      'Feature coming soon',
      'Check documentation for alternatives',
      'Contact support for timeline',
    ],
  },
  [ErrorCodes.DEPRECATED_USAGE]: {
    message: 'Deprecated usage',
    description: 'Using deprecated API or feature.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-9003',
    severity: 'warning',
    suggestions: [
      'Update to new API',
      'Check migration guide',
      'Feature will be removed in future version',
    ],
  },
  [ErrorCodes.UNKNOWN_ERROR]: {
    message: 'Unknown error',
    description: 'An unknown error occurred.',
    docsUrl: 'https://osi-cards.dev/docs/errors/OSI-9999',
    severity: 'error',
    suggestions: ['Try refreshing the page', 'Check browser console', 'Contact support'],
  },
};

// =============================================================================
// OSI ERROR CLASS
// =============================================================================

export interface OsiErrorOptions {
  /** Additional error details */
  details?: string;
  /** Context data */
  context?: Record<string, unknown>;
  /** Original error */
  cause?: Error;
  /** Whether to log to console */
  log?: boolean;
}

/**
 * Custom error class with structured error codes
 */
export class OsiError extends Error {
  public readonly code: ErrorCode;
  public readonly metadata: ErrorMetadata;
  public readonly details?: string;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: number;

  constructor(code: ErrorCode, options: OsiErrorOptions = {}) {
    const metadata = ERROR_METADATA[code] || ERROR_METADATA[ErrorCodes.UNKNOWN_ERROR];

    super(metadata.message);

    this.name = 'OsiError';
    this.code = code;
    this.metadata = metadata;
    this.details = options.details;
    this.context = options.context;
    this.timestamp = Date.now();

    if (options.cause) {
      this.cause = options.cause;
    }

    // Log in development mode
    if (options.log !== false && typeof console !== 'undefined') {
      this.logError();
    }

    // Capture stack trace (V8 only feature)
    const ErrorWithCaptureStack = Error as typeof Error & {
      captureStackTrace?: (target: object, constructor?: Function) => void;
    };
    if (ErrorWithCaptureStack.captureStackTrace) {
      ErrorWithCaptureStack.captureStackTrace(this, OsiError);
    }
  }

  /**
   * Get documentation URL for this error
   */
  get docsUrl(): string {
    return this.metadata.docsUrl;
  }

  /**
   * Get recovery suggestions
   */
  get suggestions(): string[] {
    return this.metadata.suggestions;
  }

  /**
   * Get error severity
   */
  get severity(): 'error' | 'warning' | 'info' {
    return this.metadata.severity;
  }

  /**
   * Get full error message with details
   */
  get fullMessage(): string {
    let message = `[${this.code}] ${this.message}`;
    if (this.details) {
      message += `: ${this.details}`;
    }
    return message;
  }

  /**
   * Log error to console
   */
  private logError(): void {
    const logMethod = this.severity === 'error' ? console.error : console.warn;

    logMethod(
      `%c${this.code}%c ${this.message}`,
      'background: #ef4444; color: white; padding: 2px 4px; border-radius: 2px;',
      'color: inherit;'
    );

    if (this.details) {
      console.log('Details:', this.details);
    }

    if (this.context) {
      console.log('Context:', this.context);
    }

    console.log('Documentation:', this.docsUrl);
    console.log('Suggestions:', this.suggestions);
  }

  /**
   * Convert to JSON for logging/reporting
   */
  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      context: this.context,
      severity: this.severity,
      docsUrl: this.docsUrl,
      suggestions: this.suggestions,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get error metadata by code
 */
export function getErrorMetadata(code: ErrorCode): ErrorMetadata {
  return ERROR_METADATA[code] || ERROR_METADATA[ErrorCodes.UNKNOWN_ERROR];
}

/**
 * Check if an error is an OsiError
 */
export function isOsiError(error: unknown): error is OsiError {
  return error instanceof OsiError;
}

/**
 * Wrap an error with an OsiError
 */
export function wrapError(
  error: unknown,
  code: ErrorCode,
  context?: Record<string, unknown>
): OsiError {
  const details = error instanceof Error ? error.message : String(error);
  const cause = error instanceof Error ? error : undefined;

  return new OsiError(code, { details, context, cause });
}

/**
 * Assert a condition and throw OsiError if false
 */
export function assert(
  condition: boolean,
  code: ErrorCode = ErrorCodes.ASSERTION_FAILED,
  details?: string
): asserts condition {
  if (!condition) {
    throw new OsiError(code, { details });
  }
}

/**
 * Assert a value is not null/undefined
 */
export function assertDefined<T>(
  value: T | null | undefined,
  code: ErrorCode = ErrorCodes.ASSERTION_FAILED,
  details?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new OsiError(code, { details: details || 'Value is null or undefined' });
  }
}
