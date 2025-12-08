/**
 * Comprehensive error type hierarchy for the application
 *
 * Provides structured error types with proper categorization,
 * context, and recovery information.
 */

/**
 * Base error type categories
 */
export enum ErrorCategory {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  SECURITY = 'SECURITY',
  SYSTEM = 'SYSTEM',
  USER_INPUT = 'USER_INPUT',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Error recovery strategies
 */
export enum RecoveryStrategy {
  NONE = 'NONE',
  RETRY = 'RETRY',
  FALLBACK = 'FALLBACK',
  USER_ACTION = 'USER_ACTION',
  AUTOMATIC = 'AUTOMATIC',
}

/**
 * Base application error interface
 */
export interface AppError {
  /** Error category */
  category: ErrorCategory;
  /** Error severity */
  severity: ErrorSeverity;
  /** Human-readable error message */
  message: string;
  /** Technical error code */
  code?: string;
  /** Original error object */
  originalError?: unknown;
  /** Additional error details */
  details?: Record<string, unknown>;
  /** Whether the error is retryable */
  retryable: boolean;
  /** Timestamp when error occurred */
  timestamp: number;
  /** Recovery strategy */
  recoveryStrategy: RecoveryStrategy;
  /** Suggested user action */
  userAction?: string;
  /** Context where error occurred */
  context?: string;
  /** Stack trace (if available) */
  stack?: string;
}

/**
 * Network error interface
 */
export interface NetworkError extends AppError {
  category: ErrorCategory.NETWORK;
  /** HTTP status code (if applicable) */
  statusCode?: number;
  /** Request URL (if applicable) */
  url?: string;
  /** Request method (if applicable) */
  method?: string;
}

/**
 * Validation error interface
 */
export interface ValidationError extends AppError {
  category: ErrorCategory.VALIDATION;
  /** Field that failed validation */
  field?: string;
  /** Validation errors for multiple fields */
  fieldErrors?: Record<string, string[]>;
  /** Suggested fixes */
  suggestions?: string[];
}

/**
 * Security error interface
 */
export interface SecurityError extends AppError {
  category: ErrorCategory.SECURITY;
  /** Security threat type */
  threatType?: 'XSS' | 'CSRF' | 'INJECTION' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'OTHER';
  /** Whether user should be logged out */
  shouldLogout?: boolean;
}

/**
 * Business logic error interface
 */
export interface BusinessLogicError extends AppError {
  category: ErrorCategory.BUSINESS_LOGIC;
  /** Business rule that was violated */
  rule?: string;
  /** Suggested alternative action */
  alternative?: string;
}

/**
 * System error interface
 */
export interface SystemError extends AppError {
  category: ErrorCategory.SYSTEM;
  /** System component that failed */
  component?: string;
  /** Whether system is in degraded state */
  degradedState?: boolean;
}

/**
 * User input error interface
 */
export interface UserInputError extends AppError {
  category: ErrorCategory.USER_INPUT;
  /** Input field that caused error */
  inputField?: string;
  /** Expected format or value */
  expectedFormat?: string;
  /** Example of correct input */
  example?: string;
}

/**
 * Union type of all error types
 */
export type ApplicationError =
  | NetworkError
  | ValidationError
  | SecurityError
  | BusinessLogicError
  | SystemError
  | UserInputError
  | AppError;

/**
 * Error factory functions
 */
export class ErrorFactory {
  /**
   * Create a network error
   */
  static networkError(
    message: string,
    options?: {
      statusCode?: number;
      url?: string;
      method?: string;
      retryable?: boolean;
      originalError?: unknown;
      context?: string;
    }
  ): NetworkError {
    return {
      category: ErrorCategory.NETWORK,
      severity:
        options?.statusCode && options.statusCode >= 500
          ? ErrorSeverity.HIGH
          : ErrorSeverity.MEDIUM,
      message,
      code: options?.statusCode ? `HTTP_${options.statusCode}` : 'NETWORK_ERROR',
      originalError: options?.originalError,
      statusCode: options?.statusCode,
      url: options?.url,
      method: options?.method,
      retryable: options?.retryable ?? (options?.statusCode ? options.statusCode >= 500 : true),
      timestamp: Date.now(),
      recoveryStrategy:
        options?.retryable !== false ? RecoveryStrategy.RETRY : RecoveryStrategy.USER_ACTION,
      userAction:
        options?.statusCode === 401
          ? 'Please log in again'
          : options?.statusCode === 403
            ? 'You do not have permission to perform this action'
            : options?.statusCode === 404
              ? 'The requested resource was not found'
              : options?.statusCode && options.statusCode >= 500
                ? 'Server error. Please try again later.'
                : 'Please check your internet connection and try again',
      context: options?.context,
      stack: options?.originalError instanceof Error ? options.originalError.stack : undefined,
    };
  }

  /**
   * Create a validation error
   */
  static validationError(
    message: string,
    options?: {
      field?: string;
      fieldErrors?: Record<string, string[]>;
      suggestions?: string[];
      originalError?: unknown;
      context?: string;
    }
  ): ValidationError {
    return {
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.MEDIUM,
      message,
      code: 'VALIDATION_ERROR',
      originalError: options?.originalError,
      field: options?.field,
      fieldErrors: options?.fieldErrors,
      suggestions: options?.suggestions,
      retryable: false,
      timestamp: Date.now(),
      recoveryStrategy: RecoveryStrategy.USER_ACTION,
      userAction:
        options?.suggestions && options.suggestions.length > 0
          ? options.suggestions[0]
          : 'Please check your input and try again',
      context: options?.context,
      stack: options?.originalError instanceof Error ? options.originalError.stack : undefined,
    };
  }

  /**
   * Create a security error
   */
  static securityError(
    message: string,
    options?: {
      threatType?: SecurityError['threatType'];
      shouldLogout?: boolean;
      originalError?: unknown;
      context?: string;
    }
  ): SecurityError {
    return {
      category: ErrorCategory.SECURITY,
      severity: ErrorSeverity.CRITICAL,
      message,
      code: 'SECURITY_ERROR',
      originalError: options?.originalError,
      threatType: options?.threatType,
      shouldLogout: options?.shouldLogout,
      retryable: false,
      timestamp: Date.now(),
      recoveryStrategy: RecoveryStrategy.USER_ACTION,
      userAction: options?.shouldLogout
        ? 'Security violation detected. Please log in again.'
        : 'This action is not allowed for security reasons.',
      context: options?.context,
      stack: options?.originalError instanceof Error ? options.originalError.stack : undefined,
    };
  }

  /**
   * Create a business logic error
   */
  static businessLogicError(
    message: string,
    options?: {
      rule?: string;
      alternative?: string;
      originalError?: unknown;
      context?: string;
    }
  ): BusinessLogicError {
    return {
      category: ErrorCategory.BUSINESS_LOGIC,
      severity: ErrorSeverity.MEDIUM,
      message,
      code: 'BUSINESS_LOGIC_ERROR',
      originalError: options?.originalError,
      rule: options?.rule,
      alternative: options?.alternative,
      retryable: false,
      timestamp: Date.now(),
      recoveryStrategy: RecoveryStrategy.USER_ACTION,
      userAction: options?.alternative || 'Please review your action and try again',
      context: options?.context,
      stack: options?.originalError instanceof Error ? options.originalError.stack : undefined,
    };
  }

  /**
   * Create a system error
   */
  static systemError(
    message: string,
    options?: {
      component?: string;
      degradedState?: boolean;
      originalError?: unknown;
      context?: string;
    }
  ): SystemError {
    return {
      category: ErrorCategory.SYSTEM,
      severity: options?.degradedState ? ErrorSeverity.HIGH : ErrorSeverity.CRITICAL,
      message,
      code: 'SYSTEM_ERROR',
      originalError: options?.originalError,
      component: options?.component,
      degradedState: options?.degradedState,
      retryable: true,
      timestamp: Date.now(),
      recoveryStrategy: RecoveryStrategy.AUTOMATIC,
      userAction: 'System error detected. The application will attempt to recover automatically.',
      context: options?.context,
      stack: options?.originalError instanceof Error ? options.originalError.stack : undefined,
    };
  }

  /**
   * Create a user input error
   */
  static userInputError(
    message: string,
    options?: {
      inputField?: string;
      expectedFormat?: string;
      example?: string;
      originalError?: unknown;
      context?: string;
    }
  ): UserInputError {
    return {
      category: ErrorCategory.USER_INPUT,
      severity: ErrorSeverity.LOW,
      message,
      code: 'USER_INPUT_ERROR',
      originalError: options?.originalError,
      inputField: options?.inputField,
      expectedFormat: options?.expectedFormat,
      example: options?.example,
      retryable: false,
      timestamp: Date.now(),
      recoveryStrategy: RecoveryStrategy.USER_ACTION,
      userAction: options?.example
        ? `Please use the correct format. Example: ${options.example}`
        : options?.expectedFormat
          ? `Expected format: ${options.expectedFormat}`
          : 'Please check your input and try again',
      context: options?.context,
      stack: options?.originalError instanceof Error ? options.originalError.stack : undefined,
    };
  }

  /**
   * Create an unknown error
   */
  static unknownError(
    message: string,
    options?: {
      originalError?: unknown;
      context?: string;
    }
  ): AppError {
    return {
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      message,
      code: 'UNKNOWN_ERROR',
      originalError: options?.originalError,
      retryable: false,
      timestamp: Date.now(),
      recoveryStrategy: RecoveryStrategy.USER_ACTION,
      userAction: 'An unexpected error occurred. Please try again or contact support.',
      context: options?.context,
      stack: options?.originalError instanceof Error ? options.originalError.stack : undefined,
    };
  }
}
