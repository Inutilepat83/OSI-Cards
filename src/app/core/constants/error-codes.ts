/**
 * Application Error Codes
 *
 * Standardized error codes for consistent error handling.
 * Format: <AREA>_<TYPE>_<NUMBER>
 *
 * @example
 * ```typescript
 * throw new ApplicationError(
 *   ERROR_CODES.LAYOUT_CALCULATION_001,
 *   'Invalid container dimensions'
 * );
 * ```
 */

export interface IErrorCodeInfo {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  userMessage?: string;
}

/**
 * Error Code Registry
 */
export const ERROR_CODES = {
  // ==========================================
  // LAYOUT ERRORS (LAY_xxx_nnn)
  // ==========================================
  LAYOUT_CALCULATION_001: {
    code: 'LAY_CALC_001',
    message: 'Invalid container dimensions provided',
    severity: 'high',
    category: 'Layout',
    userMessage: 'Unable to calculate layout. Please refresh the page.',
  },
  LAYOUT_CALCULATION_002: {
    code: 'LAY_CALC_002',
    message: 'Section height estimation failed',
    severity: 'medium',
    category: 'Layout',
    userMessage: 'Some sections may not display correctly.',
  },
  LAYOUT_STATE_001: {
    code: 'LAY_STATE_001',
    message: 'Layout state is corrupted',
    severity: 'critical',
    category: 'Layout',
    userMessage: 'Layout error occurred. Reloading...',
  },
  LAYOUT_COLUMN_001: {
    code: 'LAY_COL_001',
    message: 'Invalid column configuration',
    severity: 'high',
    category: 'Layout',
    userMessage: 'Layout configuration error.',
  },

  // ==========================================
  // API ERRORS (API_xxx_nnn)
  // ==========================================
  API_REQUEST_001: {
    code: 'API_REQ_001',
    message: 'Network request failed',
    severity: 'high',
    category: 'API',
    userMessage: 'Unable to connect to server. Please check your internet connection.',
  },
  API_REQUEST_002: {
    code: 'API_REQ_002',
    message: 'Request timeout',
    severity: 'medium',
    category: 'API',
    userMessage: 'Request took too long. Please try again.',
  },
  API_RESPONSE_001: {
    code: 'API_RES_001',
    message: 'Invalid response format',
    severity: 'high',
    category: 'API',
    userMessage: 'Received unexpected data from server.',
  },
  API_AUTH_001: {
    code: 'API_AUTH_001',
    message: 'Authentication failed',
    severity: 'critical',
    category: 'API',
    userMessage: 'Authentication error. Please log in again.',
  },

  // ==========================================
  // STREAMING ERRORS (STR_xxx_nnn)
  // ==========================================
  STREAM_CONNECTION_001: {
    code: 'STR_CONN_001',
    message: 'Stream connection failed',
    severity: 'high',
    category: 'Streaming',
    userMessage: 'Unable to establish streaming connection.',
  },
  STREAM_PARSE_001: {
    code: 'STR_PARSE_001',
    message: 'Stream parsing error',
    severity: 'medium',
    category: 'Streaming',
    userMessage: 'Error processing stream data.',
  },
  STREAM_BUFFER_001: {
    code: 'STR_BUF_001',
    message: 'Stream buffer overflow',
    severity: 'high',
    category: 'Streaming',
    userMessage: 'Stream processing error. Please refresh.',
  },

  // ==========================================
  // COMPONENT ERRORS (CMP_xxx_nnn)
  // ==========================================
  COMPONENT_RENDER_001: {
    code: 'CMP_RND_001',
    message: 'Component rendering failed',
    severity: 'high',
    category: 'Component',
    userMessage: 'Unable to display this section.',
  },
  COMPONENT_INIT_001: {
    code: 'CMP_INIT_001',
    message: 'Component initialization failed',
    severity: 'critical',
    category: 'Component',
    userMessage: 'Component failed to load.',
  },
  COMPONENT_DESTROY_001: {
    code: 'CMP_DEST_001',
    message: 'Component cleanup failed',
    severity: 'low',
    category: 'Component',
    userMessage: undefined, // No user message needed
  },

  // ==========================================
  // STATE ERRORS (STA_xxx_nnn)
  // ==========================================
  STATE_UPDATE_001: {
    code: 'STA_UPD_001',
    message: 'State update failed',
    severity: 'high',
    category: 'State',
    userMessage: 'Unable to save changes.',
  },
  STATE_SYNC_001: {
    code: 'STA_SYNC_001',
    message: 'State synchronization error',
    severity: 'medium',
    category: 'State',
    userMessage: 'Data may not be up to date.',
  },
  STATE_VALIDATION_001: {
    code: 'STA_VAL_001',
    message: 'Invalid state detected',
    severity: 'high',
    category: 'State',
    userMessage: 'Invalid data detected.',
  },

  // ==========================================
  // THEME ERRORS (THM_xxx_nnn)
  // ==========================================
  THEME_LOAD_001: {
    code: 'THM_LOAD_001',
    message: 'Theme loading failed',
    severity: 'low',
    category: 'Theme',
    userMessage: 'Unable to load theme. Using default.',
  },
  THEME_APPLY_001: {
    code: 'THM_APPLY_001',
    message: 'Theme application error',
    severity: 'low',
    category: 'Theme',
    userMessage: 'Theme may not display correctly.',
  },

  // ==========================================
  // PERFORMANCE ERRORS (PRF_xxx_nnn)
  // ==========================================
  PERFORMANCE_MEMORY_001: {
    code: 'PRF_MEM_001',
    message: 'Memory limit exceeded',
    severity: 'critical',
    category: 'Performance',
    userMessage: 'Application is using too much memory. Please reload.',
  },
  PERFORMANCE_TIMEOUT_001: {
    code: 'PRF_TIME_001',
    message: 'Operation timeout',
    severity: 'medium',
    category: 'Performance',
    userMessage: 'Operation took too long.',
  },

  // ==========================================
  // VALIDATION ERRORS (VAL_xxx_nnn)
  // ==========================================
  VALIDATION_INPUT_001: {
    code: 'VAL_INP_001',
    message: 'Invalid input provided',
    severity: 'low',
    category: 'Validation',
    userMessage: 'Please check your input.',
  },
  VALIDATION_TYPE_001: {
    code: 'VAL_TYPE_001',
    message: 'Type validation failed',
    severity: 'medium',
    category: 'Validation',
    userMessage: 'Invalid data type.',
  },

  // ==========================================
  // GENERIC ERRORS (GEN_xxx_nnn)
  // ==========================================
  GENERIC_UNKNOWN_001: {
    code: 'GEN_UNK_001',
    message: 'Unknown error occurred',
    severity: 'medium',
    category: 'Generic',
    userMessage: 'An unexpected error occurred. Please try again.',
  },
  GENERIC_NOT_IMPLEMENTED_001: {
    code: 'GEN_NIMP_001',
    message: 'Feature not implemented',
    severity: 'low',
    category: 'Generic',
    userMessage: 'This feature is not available yet.',
  },
} as const;

/**
 * Application Error Class
 */
export class ApplicationError extends Error {
  constructor(
    public readonly errorInfo: IErrorCodeInfo,
    additionalMessage?: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(additionalMessage || errorInfo.message);
    this.name = 'ApplicationError';
  }

  /**
   * Get user-friendly error message
   */
  public getUserMessage(): string {
    return this.errorInfo.userMessage || 'An error occurred. Please try again.';
  }

  /**
   * Get error code
   */
  public getCode(): string {
    return this.errorInfo.code;
  }

  /**
   * Check if error is critical
   */
  public isCritical(): boolean {
    return this.errorInfo.severity === 'critical';
  }

  /**
   * Convert to JSON for logging
   */
  public toJSON(): Record<string, unknown> {
    return {
      code: this.errorInfo.code,
      message: this.message,
      severity: this.errorInfo.severity,
      category: this.errorInfo.category,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Error Code utilities
 */
export const errorCodeUtils = {
  /**
   * Get error by code
   */
  getErrorByCode(code: string): IErrorCodeInfo | undefined {
    return Object.values(ERROR_CODES).find((e) => e.code === code);
  },

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: string): IErrorCodeInfo[] {
    return Object.values(ERROR_CODES).filter((e) => e.category === category);
  },

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: IErrorCodeInfo['severity']): IErrorCodeInfo[] {
    return Object.values(ERROR_CODES).filter((e) => e.severity === severity);
  },

  /**
   * Get all categories
   */
  getAllCategories(): string[] {
    return [...new Set(Object.values(ERROR_CODES).map((e) => e.category))];
  },

  /**
   * Create error from code
   */
  createError(
    errorInfo: IErrorCodeInfo,
    additionalMessage?: string,
    context?: Record<string, unknown>
  ): ApplicationError {
    return new ApplicationError(errorInfo, additionalMessage, context);
  },
};
