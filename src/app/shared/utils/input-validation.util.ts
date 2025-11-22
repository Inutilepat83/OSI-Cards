/**
 * Input validation utilities
 * Validates all user inputs on client side
 */

export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate required field
 */
export function validateRequired(value: any): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return true;
}

/**
 * Validate string length
 */
export function validateLength(value: string, min: number, max: number): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  const length = value.length;
  return length >= min && length <= max;
}

/**
 * Validate number range
 */
export function validateRange(value: number, min: number, max: number): boolean {
  if (typeof value !== 'number' || isNaN(value)) {
    return false;
  }
  return value >= min && value <= max;
}

/**
 * Validate pattern (regex)
 */
export function validatePattern(value: string, pattern: RegExp): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  return pattern.test(value);
}

/**
 * Create validator with multiple rules
 */
export function createValidator(rules: ValidationRule[]) {
  return (value: any): ValidationResult => {
    const errors: string[] = [];

    for (const rule of rules) {
      if (!rule.validate(value)) {
        errors.push(rule.message);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };
}

/**
 * Validate card title
 */
export function validateCardTitle(title: string): ValidationResult {
  const validator = createValidator([
    {
      validate: (v) => validateRequired(v),
      message: 'Card title is required'
    },
    {
      validate: (v) => validateLength(v, 1, 200),
      message: 'Card title must be between 1 and 200 characters'
    }
  ]);

  return validator(title);
}

/**
 * Validate JSON string
 */
export function validateJsonString(json: string): ValidationResult {
  const errors: string[] = [];

  if (!validateRequired(json)) {
    return { isValid: false, errors: ['JSON is required'] };
  }

  try {
    JSON.parse(json);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Invalid JSON format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}


