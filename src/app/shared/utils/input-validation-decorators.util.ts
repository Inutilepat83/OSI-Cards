/**
 * Input validation decorators
 * Add input validation at compile-time (conceptual - TypeScript doesn't support runtime decorators for this)
 * This provides a pattern for validation that can be used with class-validator or similar libraries
 */

/**
 * Validation decorator metadata
 */
export interface ValidationMetadata {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message?: string;
}

/**
 * Validation metadata storage
 */
const validationMetadata = new WeakMap<any, Map<string, ValidationMetadata>>();

/**
 * Get validation metadata for a property
 */
export function getValidationMetadata(target: any, propertyKey: string): ValidationMetadata | undefined {
  const metadata = validationMetadata.get(target);
  return metadata?.get(propertyKey);
}

/**
 * Set validation metadata for a property
 */
export function setValidationMetadata(target: any, propertyKey: string, metadata: ValidationMetadata): void {
  let targetMetadata = validationMetadata.get(target);
  if (!targetMetadata) {
    targetMetadata = new Map();
    validationMetadata.set(target, targetMetadata);
  }
  targetMetadata.set(propertyKey, metadata);
}

/**
 * Validate object against metadata
 */
export function validateObject(obj: any): { isValid: boolean; errors: Record<string, string[]> } {
  const errors: Record<string, string[]> = {};
  const metadata = validationMetadata.get(obj.constructor);

  if (!metadata) {
    return { isValid: true, errors: {} };
  }

  for (const [propertyKey, rules] of metadata.entries()) {
    const value = obj[propertyKey];
    const propertyErrors: string[] = [];

    if (rules.required && (value === undefined || value === null || value === '')) {
      propertyErrors.push(rules.message || `${propertyKey} is required`);
    }

    if (value !== undefined && value !== null && value !== '') {
      if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
        propertyErrors.push(rules.message || `${propertyKey} must be at least ${rules.min}`);
      }

      if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
        propertyErrors.push(rules.message || `${propertyKey} must be at most ${rules.max}`);
      }

      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        propertyErrors.push(rules.message || `${propertyKey} does not match required pattern`);
      }

      if (rules.custom && !rules.custom(value)) {
        propertyErrors.push(rules.message || `${propertyKey} is invalid`);
      }
    }

    if (propertyErrors.length > 0) {
      errors[propertyKey] = propertyErrors;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}


