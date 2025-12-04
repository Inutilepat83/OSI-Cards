/**
 * Security Input Validator
 *
 * @description
 * Provides comprehensive input validation and sanitization to prevent
 * security vulnerabilities like XSS, SQL injection, and prototype pollution.
 *
 * @example
 * ```typescript
 * import { SecurityInputValidator } from '@osi-cards/security';
 *
 * // Validate email
 * const email = SecurityInputValidator.validateEmail(userInput);
 *
 * // Validate URL
 * const url = SecurityInputValidator.validateURL(userInput);
 *
 * // Sanitize HTML
 * const safe = SecurityInputValidator.sanitizeHTML(userInput);
 * ```
 *
 * @public
 */

/**
 * Validation error
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Security error
 */
export class SecurityError extends Error {
  constructor(
    message: string,
    public threat?: string
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}

/**
 * Input validation result
 */
export interface InputValidationResult<T = string> {
  valid: boolean;
  value?: T;
  error?: string;
}

/**
 * Security Input Validator
 */
export class SecurityInputValidator {
  /**
   * Validate email address
   *
   * @param input - Email to validate
   * @param allowEmpty - Allow empty string
   * @returns Validated email
   * @throws {ValidationError} If email is invalid
   *
   * @example
   * ```typescript
   * const email = SecurityInputValidator.validateEmail('user@example.com');
   * ```
   */
  public static validateEmail(input: string, allowEmpty: boolean = false): string {
    if (allowEmpty && !input) return '';

    const trimmed = input.trim();

    if (!trimmed) {
      throw new ValidationError('Email is required', 'email');
    }

    // RFC 5322 compliant email regex (simplified)
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(trimmed)) {
      throw new ValidationError('Invalid email format', 'email');
    }

    // Additional security checks
    if (trimmed.length > 320) {
      throw new ValidationError('Email too long (max 320 characters)', 'email');
    }

    // Check for suspicious patterns
    if (this.containsSuspiciousPatterns(trimmed)) {
      throw new SecurityError('Email contains suspicious patterns', 'xss');
    }

    return trimmed.toLowerCase();
  }

  /**
   * Validate URL
   *
   * @param input - URL to validate
   * @param allowedProtocols - Allowed protocols (default: http, https)
   * @returns Validated URL
   * @throws {ValidationError} If URL is invalid
   *
   * @example
   * ```typescript
   * const url = SecurityInputValidator.validateURL('https://example.com');
   * ```
   */
  public static validateURL(
    input: string,
    allowedProtocols: string[] = ['http:', 'https:']
  ): string {
    const trimmed = input.trim();

    if (!trimmed) {
      throw new ValidationError('URL is required', 'url');
    }

    try {
      const url = new URL(trimmed);

      // Check protocol
      if (!allowedProtocols.includes(url.protocol)) {
        throw new ValidationError(
          `Protocol not allowed. Allowed: ${allowedProtocols.join(', ')}`,
          'url'
        );
      }

      // Check for suspicious patterns
      if (this.containsSuspiciousPatterns(url.href)) {
        throw new SecurityError('URL contains suspicious patterns', 'xss');
      }

      // Prevent javascript: URLs
      if (url.protocol === 'javascript:') {
        throw new SecurityError('JavaScript URLs not allowed', 'xss');
      }

      return url.href;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof SecurityError) {
        throw error;
      }
      throw new ValidationError('Invalid URL format', 'url');
    }
  }

  /**
   * Validate and sanitize text input
   *
   * @param input - Text to validate
   * @param maxLength - Maximum length
   * @param allowHTML - Allow HTML tags
   * @returns Sanitized text
   *
   * @example
   * ```typescript
   * const safe = SecurityInputValidator.validateText(userInput, 1000);
   * ```
   */
  public static validateText(
    input: string,
    maxLength: number = 1000,
    allowHTML: boolean = false
  ): string {
    let sanitized = input.trim();

    // Length check
    if (sanitized.length > maxLength) {
      throw new ValidationError(`Text too long (max ${maxLength} characters)`, 'text');
    }

    // Remove dangerous patterns
    if (!allowHTML) {
      sanitized = this.stripHTML(sanitized);
    } else {
      sanitized = this.sanitizeHTML(sanitized);
    }

    // Check for suspicious patterns
    if (this.containsSuspiciousPatterns(sanitized)) {
      throw new SecurityError('Text contains suspicious patterns', 'xss');
    }

    return sanitized;
  }

  /**
   * Validate JSON input
   *
   * @param input - JSON string to validate
   * @param maxSize - Maximum size in characters
   * @returns Parsed JSON object
   * @throws {ValidationError} If JSON is invalid
   *
   * @example
   * ```typescript
   * const data = SecurityInputValidator.validateJSON(jsonString);
   * ```
   */
  public static validateJSON(input: string, maxSize: number = 1000000): any {
    if (input.length > maxSize) {
      throw new ValidationError(`JSON too large (max ${maxSize} characters)`, 'json');
    }

    try {
      const parsed = JSON.parse(input);

      // Check for prototype pollution
      if (this.hasPrototypePollution(parsed)) {
        throw new SecurityError('Potential prototype pollution detected', 'prototype-pollution');
      }

      return parsed;
    } catch (error) {
      if (error instanceof SecurityError) {
        throw error;
      }
      throw new ValidationError('Invalid JSON format', 'json');
    }
  }

  /**
   * Sanitize HTML
   *
   * @param html - HTML to sanitize
   * @returns Sanitized HTML
   *
   * @example
   * ```typescript
   * const safe = SecurityInputValidator.sanitizeHTML(unsafeHTML);
   * ```
   */
  public static sanitizeHTML(html: string): string {
    // Remove script tags
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');

    // Remove javascript: URLs
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Remove data: URLs (except images)
    sanitized = sanitized.replace(/src\s*=\s*["']data:(?!image\/)[^"']*["']/gi, '');

    // Remove iframe
    sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

    // Remove object and embed tags
    sanitized = sanitized.replace(/<(object|embed)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '');

    return sanitized;
  }

  /**
   * Strip all HTML tags
   *
   * @param html - HTML to strip
   * @returns Plain text
   *
   * @example
   * ```typescript
   * const text = SecurityInputValidator.stripHTML('<p>Hello</p>'); // Returns: 'Hello'
   * ```
   */
  public static stripHTML(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * Check for suspicious patterns
   *
   * @param input - Input to check
   * @returns True if suspicious patterns found
   *
   * @private
   */
  private static containsSuspiciousPatterns(input: string): boolean {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /eval\s*\(/i,
      /expression\s*\(/i,
      /vbscript:/i,
      /data:text\/html/i,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(input));
  }

  /**
   * Validate file upload
   *
   * @param file - File to validate
   * @param allowedTypes - Allowed MIME types
   * @param maxSize - Maximum size in bytes
   * @returns Validation result
   *
   * @example
   * ```typescript
   * const result = SecurityInputValidator.validateFile(
   *   file,
   *   ['image/png', 'image/jpeg'],
   *   5 * 1024 * 1024 // 5MB
   * );
   * ```
   */
  public static validateFile(
    file: File,
    allowedTypes: string[],
    maxSize: number
  ): InputValidationResult<File> {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type not allowed. Allowed: ${allowedTypes.join(', ')}`,
      };
    }

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File too large. Maximum: ${maxSize / 1024 / 1024}MB`,
      };
    }

    // Check file name
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.scr'];
    const hasSuspiciousExtension = suspiciousExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (hasSuspiciousExtension) {
      return {
        valid: false,
        error: 'File extension not allowed',
      };
    }

    return {
      valid: true,
      value: file,
    };
  }

  /**
   * Escape HTML special characters
   *
   * @param text - Text to escape
   * @returns Escaped text
   *
   * @example
   * ```typescript
   * const escaped = SecurityInputValidator.escapeHTML('<div>Test</div>');
   * // Returns: '&lt;div&gt;Test&lt;/div&gt;'
   * ```
   */
  public static escapeHTML(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };

    return text.replace(/[&<>"'/]/g, (char) => map[char]);
  }

  /**
   * Validate phone number
   *
   * @param input - Phone number to validate
   * @param country - Country code (optional)
   * @returns Validated phone number
   *
   * @example
   * ```typescript
   * const phone = SecurityInputValidator.validatePhone('+1 (555) 123-4567');
   * ```
   */
  public static validatePhone(input: string, country?: string): string {
    const trimmed = input.trim();

    // Remove common formatting characters
    const digitsOnly = trimmed.replace(/[\s\-\(\)\+\.]/g, '');

    // Basic phone number validation (10-15 digits)
    if (!/^\d{10,15}$/.test(digitsOnly)) {
      throw new ValidationError('Invalid phone number format', 'phone');
    }

    return trimmed;
  }

  /**
   * Validate number
   *
   * @param input - Number to validate
   * @param min - Minimum value
   * @param max - Maximum value
   * @returns Validated number
   *
   * @example
   * ```typescript
   * const age = SecurityInputValidator.validateNumber('25', 0, 150);
   * ```
   */
  public static validateNumber(input: string | number, min?: number, max?: number): number {
    const num = typeof input === 'string' ? parseFloat(input) : input;

    if (isNaN(num) || !isFinite(num)) {
      throw new ValidationError('Invalid number', 'number');
    }

    if (min !== undefined && num < min) {
      throw new ValidationError(`Number must be at least ${min}`, 'number');
    }

    if (max !== undefined && num > max) {
      throw new ValidationError(`Number must be at most ${max}`, 'number');
    }

    return num;
  }

  /**
   * Validate date
   *
   * @param input - Date string or Date object
   * @returns Validated Date object
   *
   * @example
   * ```typescript
   * const date = SecurityInputValidator.validateDate('2025-12-03');
   * ```
   */
  public static validateDate(input: string | Date): Date {
    const date = typeof input === 'string' ? new Date(input) : input;

    if (isNaN(date.getTime())) {
      throw new ValidationError('Invalid date format', 'date');
    }

    // Check for reasonable date range (prevent absurd dates)
    const year = date.getFullYear();
    if (year < 1900 || year > 2100) {
      throw new ValidationError('Date out of reasonable range', 'date');
    }

    return date;
  }

  /**
   * Sanitize object for safe storage/transmission
   *
   * @param obj - Object to sanitize
   * @returns Sanitized object
   *
   * @example
   * ```typescript
   * const safe = SecurityInputValidator.sanitizeObject(userInput);
   * ```
   */
  public static sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    // Check for prototype pollution
    if (this.hasPrototypePollution(obj)) {
      throw new SecurityError('Prototype pollution detected', 'prototype-pollution');
    }

    // Create safe copy
    const safe: any = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // Skip dangerous keys
        if (['__proto__', 'constructor', 'prototype'].includes(key)) {
          continue;
        }

        // Recursively sanitize nested objects
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          safe[key] = this.sanitizeObject(obj[key]);
        } else if (typeof obj[key] === 'string') {
          // Sanitize strings
          safe[key] = this.sanitizeHTML(obj[key]);
        } else {
          safe[key] = obj[key];
        }
      }
    }

    return safe;
  }

  /**
   * Check for prototype pollution
   *
   * @param obj - Object to check
   * @returns True if pollution detected
   *
   * @private
   */
  private static hasPrototypePollution(obj: any): boolean {
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];

    function check(o: any, depth: number = 0): boolean {
      if (depth > 10) return false; // Prevent infinite recursion
      if (typeof o !== 'object' || o === null) return false;

      for (const key of dangerousKeys) {
        if (key in o) {
          return true;
        }
      }

      for (const key in o) {
        if (Object.prototype.hasOwnProperty.call(o, key)) {
          if (check(o[key], depth + 1)) {
            return true;
          }
        }
      }

      return false;
    }

    return check(obj);
  }

  /**
   * Validate batch of inputs
   *
   * @param inputs - Input map with validation rules
   * @returns Validation results
   *
   * @example
   * ```typescript
   * const results = SecurityInputValidator.validateBatch({
   *   email: { value: 'user@example.com', type: 'email' },
   *   age: { value: '25', type: 'number', min: 0, max: 150 },
   * });
   * ```
   */
  public static validateBatch(inputs: Record<string, any>): Record<string, InputValidationResult> {
    const results: Record<string, InputValidationResult> = {};

    for (const [key, config] of Object.entries(inputs)) {
      try {
        let value: any;

        switch (config.type) {
          case 'email':
            value = this.validateEmail(config.value, config.allowEmpty);
            break;

          case 'url':
            value = this.validateURL(config.value, config.allowedProtocols);
            break;

          case 'text':
            value = this.validateText(config.value, config.maxLength, config.allowHTML);
            break;

          case 'number':
            value = this.validateNumber(config.value, config.min, config.max);
            break;

          case 'date':
            value = this.validateDate(config.value);
            break;

          default:
            value = config.value;
        }

        results[key] = { valid: true, value };
      } catch (error) {
        results[key] = {
          valid: false,
          error: error instanceof Error ? error.message : 'Validation failed',
        };
      }
    }

    return results;
  }
}
