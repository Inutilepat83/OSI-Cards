/**
 * Input Validation Utilities
 *
 * Comprehensive validation utilities for forms, APIs, and user input.
 *
 * @example
 * ```typescript
 * if (Validator.email('test@example.com')) {
 *   // Valid email
 * }
 * ```
 */

export class Validator {
  // ============================================================================
  // STRING VALIDATION
  // ============================================================================

  /**
   * Validate email address
   */
  static email(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  /**
   * Validate URL
   */
  static url(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate phone number (international format)
   */
  static phone(value: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(value.replace(/[\s-()]/g, ''));
  }

  /**
   * Validate string length
   */
  static stringLength(value: string, min: number, max?: number): boolean {
    const len = value.length;
    if (max !== undefined) {
      return len >= min && len <= max;
    }
    return len >= min;
  }

  /**
   * Validate string matches pattern
   */
  static pattern(value: string, pattern: RegExp): boolean {
    return pattern.test(value);
  }

  /**
   * Validate alphanumeric
   */
  static alphanumeric(value: string): boolean {
    return /^[a-zA-Z0-9]+$/.test(value);
  }

  /**
   * Validate alphabetic only
   */
  static alpha(value: string): boolean {
    return /^[a-zA-Z]+$/.test(value);
  }

  /**
   * Validate numeric only
   */
  static numeric(value: string): boolean {
    return /^[0-9]+$/.test(value);
  }

  // ============================================================================
  // NUMBER VALIDATION
  // ============================================================================

  /**
   * Validate number range
   */
  static range(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  /**
   * Validate positive number
   */
  static positive(value: number): boolean {
    return value > 0;
  }

  /**
   * Validate non-negative number
   */
  static nonNegative(value: number): boolean {
    return value >= 0;
  }

  /**
   * Validate integer
   */
  static integer(value: number): boolean {
    return Number.isInteger(value);
  }

  // ============================================================================
  // DATE VALIDATION
  // ============================================================================

  /**
   * Validate date string (ISO format)
   */
  static dateISO(value: string): boolean {
    const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoRegex.test(value)) {
      return false;
    }

    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  /**
   * Validate date is in the past
   */
  static pastDate(value: Date | string): boolean {
    const date = typeof value === 'string' ? new Date(value) : value;
    return date < new Date();
  }

  /**
   * Validate date is in the future
   */
  static futureDate(value: Date | string): boolean {
    const date = typeof value === 'string' ? new Date(value) : value;
    return date > new Date();
  }

  /**
   * Validate date is within range
   */
  static dateRange(value: Date | string, min: Date | string, max: Date | string): boolean {
    const date = typeof value === 'string' ? new Date(value) : value;
    const minDate = typeof min === 'string' ? new Date(min) : min;
    const maxDate = typeof max === 'string' ? new Date(max) : max;

    return date >= minDate && date <= maxDate;
  }

  // ============================================================================
  // ARRAY VALIDATION
  // ============================================================================

  /**
   * Validate array length
   */
  static arrayLength(arr: any[], min: number, max?: number): boolean {
    const len = arr.length;
    if (max !== undefined) {
      return len >= min && len <= max;
    }
    return len >= min;
  }

  /**
   * Validate array contains only unique values
   */
  static uniqueArray(arr: any[]): boolean {
    return new Set(arr).size === arr.length;
  }

  // ============================================================================
  // OBJECT VALIDATION
  // ============================================================================

  /**
   * Validate required fields exist
   */
  static requiredFields<T extends Record<string, any>>(obj: T, fields: (keyof T)[]): boolean {
    return fields.every((field) => field in obj && obj[field] !== null && obj[field] !== undefined);
  }

  /**
   * Validate object has no extra fields
   */
  static exactFields<T extends Record<string, any>>(obj: T, allowedFields: (keyof T)[]): boolean {
    const objKeys = Object.keys(obj);
    return objKeys.every((key) => allowedFields.includes(key as keyof T));
  }

  // ============================================================================
  // FILE VALIDATION
  // ============================================================================

  /**
   * Validate file type
   */
  static fileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some((type) => file.type.includes(type));
  }

  /**
   * Validate file size (in bytes)
   */
  static fileSize(file: File, maxSize: number): boolean {
    return file.size <= maxSize;
  }

  /**
   * Validate file extension
   */
  static fileExtension(file: File, allowedExtensions: string[]): boolean {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return extension ? allowedExtensions.includes(extension) : false;
  }

  // ============================================================================
  // CUSTOM VALIDATION
  // ============================================================================

  /**
   * Create custom validator
   */
  static custom(value: any, validatorFn: (val: any) => boolean): boolean {
    return validatorFn(value);
  }

  /**
   * Combine multiple validators (all must pass)
   */
  static all(value: any, validators: ((val: any) => boolean)[]): boolean {
    return validators.every((validator) => validator(value));
  }

  /**
   * Combine multiple validators (at least one must pass)
   */
  static any(value: any, validators: ((val: any) => boolean)[]): boolean {
    return validators.some((validator) => validator(value));
  }
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Form validator with detailed error messages
 */
export class FormValidator {
  private errors: string[] = [];

  /**
   * Validate field and add error if invalid
   */
  validate(
    fieldName: string,
    value: any,
    validatorFn: (val: any) => boolean,
    errorMessage: string
  ): this {
    if (!validatorFn(value)) {
      this.errors.push(`${fieldName}: ${errorMessage}`);
    }
    return this;
  }

  /**
   * Get validation result
   */
  result(): ValidationResult {
    return {
      valid: this.errors.length === 0,
      errors: [...this.errors],
    };
  }

  /**
   * Reset errors
   */
  reset(): void {
    this.errors = [];
  }
}
