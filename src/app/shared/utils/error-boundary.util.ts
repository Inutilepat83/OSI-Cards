/**
 * Error Boundary Utilities
 * 
 * Provides utilities for consistent error handling and error boundary patterns
 * across the application.
 * 
 * @example
 * ```typescript
 * import { ErrorBoundaryUtil } from '@shared/utils/error-boundary.util';
 * 
 * try {
 *   // risky operation
 * } catch (error) {
 *   ErrorBoundaryUtil.handleError(error, 'ComponentName');
 * }
 * ```
 */
export class ErrorBoundaryUtil {
  /**
   * Check if an error is recoverable
   * 
   * @param error - Error to check
   * @returns true if error is recoverable
   */
  static isRecoverableError(error: unknown): boolean {
    if (error instanceof Error) {
      // Network errors are usually recoverable
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return true;
      }
      // Timeout errors are recoverable
      if (error.message.includes('timeout')) {
        return true;
      }
      // Validation errors are not recoverable (user input issue)
      if (error.message.includes('validation') || error.message.includes('invalid')) {
        return false;
      }
    }
    // Default: assume recoverable
    return true;
  }

  /**
   * Extract user-friendly error message
   * 
   * @param error - Error to extract message from
   * @returns User-friendly error message
   */
  static getUserFriendlyMessage(error: unknown): string {
    if (error instanceof Error) {
      // Map technical errors to user-friendly messages
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      }
      if (error.message.includes('timeout')) {
        return 'The request took too long. Please try again.';
      }
      if (error.message.includes('validation')) {
        return 'Please check your input and try again.';
      }
      if (error.message.includes('unauthorized') || error.message.includes('forbidden')) {
        return 'You do not have permission to perform this action.';
      }
      return error.message || 'An unexpected error occurred. Please try again.';
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Get error recovery suggestion
   * 
   * @param error - Error to get suggestion for
   * @returns Recovery suggestion or null
   */
  static getRecoverySuggestion(error: unknown): string | null {
    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return 'Check your internet connection and try again.';
      }
      if (error.message.includes('timeout')) {
        return 'The server may be busy. Please try again in a moment.';
      }
      if (error.message.includes('validation')) {
        return 'Please review your input and ensure all required fields are filled correctly.';
      }
    }
    return null;
  }

  /**
   * Check if error should be logged
   * 
   * @param error - Error to check
   * @returns true if error should be logged
   */
  static shouldLogError(error: unknown): boolean {
    if (error instanceof Error) {
      // Don't log validation errors (user input issues)
      if (error.message.includes('validation')) {
        return false;
      }
      // Log all other errors
      return true;
    }
    return true;
  }

  /**
   * Create error context for logging
   * 
   * @param error - Error to create context for
   * @param context - Additional context information
   * @returns Error context object
   */
  static createErrorContext(error: unknown, context?: Record<string, unknown>): Record<string, unknown> {
    const errorContext: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      ...context
    };

    if (error instanceof Error) {
      errorContext['errorName'] = error.name;
      errorContext['errorMessage'] = error.message;
      if (error.stack) {
        errorContext['errorStack'] = error.stack;
      }
    } else {
      errorContext['errorValue'] = String(error);
    }

    return errorContext;
  }
}

