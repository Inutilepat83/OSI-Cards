/**
 * Error Messages and Error Code System
 *
 * Provides user-friendly error messages with error codes and recovery suggestions.
 *
 * @example
 * ```typescript
 * import { ErrorMessages } from '@shared/utils/error-messages';
 *
 * const message = ErrorMessages.getUserFriendlyMessage('NETWORK_ERROR');
 * const suggestion = ErrorMessages.getRecoverySuggestion('NETWORK_ERROR');
 * ```
 */
export class ErrorMessages {
  /**
   * Error code definitions
   */
  static readonly ErrorCodes = {
    // Network errors
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    CONNECTION_ERROR: 'CONNECTION_ERROR',

    // Validation errors
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

    // Card errors
    CARD_LOAD_ERROR: 'CARD_LOAD_ERROR',
    CARD_PARSE_ERROR: 'CARD_PARSE_ERROR',
    CARD_VALIDATION_ERROR: 'CARD_VALIDATION_ERROR',

    // Security errors
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    SECURITY_ERROR: 'SECURITY_ERROR',

    // System errors
    SYSTEM_ERROR: 'SYSTEM_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
  } as const;

  /**
   * Error message mappings
   */
  private static readonly messages: Record<string, string> = {
    [ErrorMessages.ErrorCodes.NETWORK_ERROR]:
      'Unable to connect to the server. Please check your internet connection and try again.',
    [ErrorMessages.ErrorCodes.TIMEOUT_ERROR]:
      'The request took too long to complete. Please try again.',
    [ErrorMessages.ErrorCodes.CONNECTION_ERROR]:
      'Connection to the server was lost. Please check your network and try again.',

    [ErrorMessages.ErrorCodes.VALIDATION_ERROR]:
      'Please check your input and ensure all required fields are filled correctly.',
    [ErrorMessages.ErrorCodes.INVALID_INPUT]:
      'The provided input is invalid. Please review and correct it.',
    [ErrorMessages.ErrorCodes.MISSING_REQUIRED_FIELD]:
      'One or more required fields are missing. Please fill in all required fields.',

    [ErrorMessages.ErrorCodes.CARD_LOAD_ERROR]:
      'Unable to load the card. Please try refreshing the page.',
    [ErrorMessages.ErrorCodes.CARD_PARSE_ERROR]:
      'The card data could not be parsed. Please check the format and try again.',
    [ErrorMessages.ErrorCodes.CARD_VALIDATION_ERROR]:
      'The card data is invalid. Please review the card configuration.',

    [ErrorMessages.ErrorCodes.UNAUTHORIZED]:
      'You are not authorized to perform this action. Please log in and try again.',
    [ErrorMessages.ErrorCodes.FORBIDDEN]: 'You do not have permission to access this resource.',
    [ErrorMessages.ErrorCodes.SECURITY_ERROR]:
      'A security error occurred. Please contact support if this persists.',

    [ErrorMessages.ErrorCodes.SYSTEM_ERROR]: 'A system error occurred. Please try again later.',
    [ErrorMessages.ErrorCodes.UNKNOWN_ERROR]:
      'An unexpected error occurred. Please try again or contact support.',
    [ErrorMessages.ErrorCodes.INTERNAL_ERROR]:
      'An internal error occurred. Our team has been notified.',
  };

  /**
   * Recovery suggestion mappings
   */
  private static readonly suggestions: Record<string, string> = {
    [ErrorMessages.ErrorCodes.NETWORK_ERROR]:
      'Check your internet connection, disable VPN if active, or try again in a moment.',
    [ErrorMessages.ErrorCodes.TIMEOUT_ERROR]:
      'The server may be busy. Please wait a moment and try again.',
    [ErrorMessages.ErrorCodes.CONNECTION_ERROR]:
      'Check your network connection and firewall settings.',

    [ErrorMessages.ErrorCodes.VALIDATION_ERROR]:
      'Review the highlighted fields and ensure they match the required format.',
    [ErrorMessages.ErrorCodes.INVALID_INPUT]:
      'Check the input format and ensure it matches the expected pattern.',
    [ErrorMessages.ErrorCodes.MISSING_REQUIRED_FIELD]:
      'Fill in all fields marked with an asterisk (*).',

    [ErrorMessages.ErrorCodes.CARD_LOAD_ERROR]:
      'Refresh the page or check if the card file exists.',
    [ErrorMessages.ErrorCodes.CARD_PARSE_ERROR]:
      'Verify the JSON format is valid and all required properties are present.',
    [ErrorMessages.ErrorCodes.CARD_VALIDATION_ERROR]:
      'Check the card structure against the documentation.',

    [ErrorMessages.ErrorCodes.UNAUTHORIZED]:
      'Log out and log back in, or contact your administrator.',
    [ErrorMessages.ErrorCodes.FORBIDDEN]: 'Contact your administrator to request access.',
    [ErrorMessages.ErrorCodes.SECURITY_ERROR]:
      'Clear your browser cache and cookies, then try again.',

    [ErrorMessages.ErrorCodes.SYSTEM_ERROR]:
      'Wait a few minutes and try again. If the problem persists, contact support.',
    [ErrorMessages.ErrorCodes.UNKNOWN_ERROR]:
      'Try refreshing the page. If the error continues, contact support with the error code.',
    [ErrorMessages.ErrorCodes.INTERNAL_ERROR]:
      'Our team has been automatically notified. Please try again in a few minutes.',
  };

  /**
   * Get user-friendly error message by error code
   *
   * @param errorCode - Error code from ErrorCodes
   * @param fallback - Fallback message if code not found
   * @returns User-friendly error message
   */
  static getUserFriendlyMessage(errorCode: string, fallback?: string): string {
    const message = this.messages[errorCode];
    if (message) {
      return message;
    }
    if (fallback) {
      return fallback;
    }
    const unknownMessage = this.messages[ErrorMessages.ErrorCodes.UNKNOWN_ERROR];
    return unknownMessage !== undefined ? unknownMessage : 'An unknown error occurred';
  }

  /**
   * Get recovery suggestion by error code
   *
   * @param errorCode - Error code from ErrorCodes
   * @returns Recovery suggestion or null
   */
  static getRecoverySuggestion(errorCode: string): string | null {
    return this.suggestions[errorCode] || null;
  }

  /**
   * Extract error code from error object
   *
   * @param error - Error object
   * @returns Error code or UNKNOWN_ERROR
   */
  static extractErrorCode(error: unknown): string {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (
        message.includes('network') ||
        message.includes('fetch') ||
        message.includes('connection')
      ) {
        return ErrorMessages.ErrorCodes.NETWORK_ERROR;
      }
      if (message.includes('timeout')) {
        return ErrorMessages.ErrorCodes.TIMEOUT_ERROR;
      }
      if (message.includes('validation') || message.includes('invalid')) {
        return ErrorMessages.ErrorCodes.VALIDATION_ERROR;
      }
      if (message.includes('unauthorized') || message.includes('401')) {
        return ErrorMessages.ErrorCodes.UNAUTHORIZED;
      }
      if (message.includes('forbidden') || message.includes('403')) {
        return ErrorMessages.ErrorCodes.FORBIDDEN;
      }
      if (message.includes('security')) {
        return ErrorMessages.ErrorCodes.SECURITY_ERROR;
      }
      if (message.includes('card') && message.includes('load')) {
        return ErrorMessages.ErrorCodes.CARD_LOAD_ERROR;
      }
      if (message.includes('card') && message.includes('parse')) {
        return ErrorMessages.ErrorCodes.CARD_PARSE_ERROR;
      }
    }

    return ErrorMessages.ErrorCodes.UNKNOWN_ERROR;
  }

  /**
   * Get complete error information
   *
   * @param error - Error object
   * @returns Complete error information object
   */
  static getErrorInfo(error: unknown): {
    code: string;
    message: string;
    suggestion: string | null;
  } {
    const code = this.extractErrorCode(error);
    return {
      code,
      message: this.getUserFriendlyMessage(code),
      suggestion: this.getRecoverySuggestion(code),
    };
  }
}
