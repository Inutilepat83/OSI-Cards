/**
 * Improved error messages utilities
 * Makes error messages more user-friendly with actionable suggestions
 */

export interface ErrorMessage {
  title: string;
  message: string;
  suggestions: string[];
  actionLabel?: string;
  action?: () => void;
}

/**
 * Generate user-friendly error message
 */
export function generateUserFriendlyError(error: Error | string, context?: string | undefined): ErrorMessage {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const lowerError = errorMessage.toLowerCase();

  // JSON parsing errors
  if (lowerError.includes('json') || lowerError.includes('parse')) {
    return {
      title: 'Invalid JSON Format',
      message: 'The JSON you entered has a syntax error. Please check the format and try again.',
      suggestions: [
        'Check for missing commas between properties',
        'Ensure all strings are properly quoted',
        'Verify all brackets and braces are closed',
        'Use the Format button to auto-format your JSON'
      ],
      actionLabel: 'Format JSON'
    };
  }

  // Network errors
  if (lowerError.includes('network') || lowerError.includes('fetch') || lowerError.includes('connection')) {
    return {
      title: 'Connection Problem',
      message: 'Unable to connect to the server. Please check your internet connection.',
      suggestions: [
        'Check your internet connection',
        'Try refreshing the page',
        'Check if the server is running',
        'Wait a moment and try again'
      ],
      actionLabel: 'Retry'
    };
  }

  // Validation errors
  if (lowerError.includes('required') || lowerError.includes('missing')) {
    return {
      title: 'Missing Information',
      message: 'Some required information is missing. Please fill in all required fields.',
      suggestions: [
        'Check that all required fields are filled',
        'Verify card title is provided',
        'Ensure at least one section is included'
      ]
    };
  }

  // Permission errors
  if (lowerError.includes('permission') || lowerError.includes('unauthorized') || lowerError.includes('forbidden')) {
    return {
      title: 'Access Denied',
      message: 'You don\'t have permission to perform this action.',
      suggestions: [
        'Check your user permissions',
        'Contact your administrator',
        'Try logging in again'
      ]
    };
  }

  // Generic error
  return {
    title: 'Something Went Wrong',
    message: errorMessage || 'An unexpected error occurred. Please try again.',
    suggestions: [
      'Try refreshing the page',
      'Check your input and try again',
      'If the problem persists, contact support'
    ],
    actionLabel: 'Retry'
  };
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: Error | string): string {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // Remove technical details for user-facing messages
  let formatted = errorMessage
    .replace(/Error: /g, '')
    .replace(/at .*$/gm, '')
    .trim();

  // Capitalize first letter
  if (formatted.length > 0) {
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  return formatted;
}


