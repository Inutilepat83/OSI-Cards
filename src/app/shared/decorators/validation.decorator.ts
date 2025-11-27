/**
 * Input validation decorators for runtime validation
 * Provides property decorators for validating card inputs, section types, and field values
 */

import { CardType, CardSection, CardField, CardItem } from '../../models';

/**
 * Validation error
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly property: string,
    public readonly value: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  suggestions?: string[];
}

/**
 * Validator function type
 */
export type ValidatorFn<T = unknown> = (value: T) => ValidationResult;

/**
 * Property metadata for validation
 */
interface ValidationMetadata {
  validator: ValidatorFn;
  propertyKey: string;
}

/**
 * Storage for validation metadata
 */
const validationMetadata = new WeakMap<object, Map<string, ValidationMetadata>>();

/**
 * Validate decorator - adds runtime validation to a property
 * 
 * @example
 * ```typescript
 * class MyComponent {
 *   @Validate((value: string) => {
 *     if (!value || value.trim().length === 0) {
 *       return { isValid: false, error: 'Value cannot be empty' };
 *     }
 *     return { isValid: true };
 *   })
 *   cardTitle: string = '';
 * }
 * ```
 */
export function Validate<T = unknown>(validator: ValidatorFn<T>) {
  return function (target: object, propertyKey: string) {
    let metadataMap = validationMetadata.get(target);
    if (!metadataMap) {
      metadataMap = new Map();
      validationMetadata.set(target, metadataMap);
    }

    metadataMap.set(propertyKey, {
      validator: validator as ValidatorFn,
      propertyKey
    });

    // Create getter/setter with validation
    const privateKey = `_${propertyKey}`;
    (target as any)[privateKey] = (target as any)[propertyKey];

    Object.defineProperty(target, propertyKey, {
      get() {
        return (this as any)[privateKey];
      },
      set(value: T) {
        const metadata = metadataMap?.get(propertyKey);
        if (metadata) {
          const result = metadata.validator(value);
          if (!result.isValid) {
            throw new ValidationError(
              result.error || `Validation failed for ${propertyKey}`,
              propertyKey,
              value
            );
          }
        }
        (this as any)[privateKey] = value;
      },
      enumerable: true,
      configurable: true
    });
  };
}

/**
 * Validate card type decorator
 */
export function ValidateCardType() {
  return Validate<CardType>((value) => {
    const validTypes: CardType[] = ['company', 'contact', 'opportunity', 'product', 'analytics', 'event', 'sko'];
    if (!validTypes.includes(value)) {
      return {
        isValid: false,
        error: `Invalid card type: ${value}. Must be one of: ${validTypes.join(', ')}`,
        suggestions: validTypes.filter(t => t.startsWith(String(value).charAt(0)))
      };
    }
    return { isValid: true };
  });
}

/**
 * Validate section type decorator
 */
export function ValidateSectionType() {
  return Validate<string>((value) => {
    const validTypes = [
      'info', 'overview', 'analytics', 'news', 'social-media', 'financials',
      'list', 'table', 'event', 'timeline', 'product', 'solutions',
      'contact-card', 'network-card', 'map', 'locations', 'chart',
      'quotation', 'quote', 'text-reference', 'reference', 'text-ref',
      'brand-colors', 'brands', 'colors'
    ];
    if (!validTypes.includes(value)) {
      return {
        isValid: false,
        error: `Invalid section type: ${value}`,
        suggestions: validTypes.filter(t => t.includes(value) || value.includes(t))
      };
    }
    return { isValid: true };
  });
}

/**
 * Validate non-empty string decorator
 */
export function ValidateNonEmpty(message = 'Value cannot be empty') {
  return Validate<string>((value) => {
    if (!value || value.trim().length === 0) {
      return { isValid: false, error: message };
    }
    return { isValid: true };
  });
}

/**
 * Validate array non-empty decorator
 */
export function ValidateNonEmptyArray(message = 'Array cannot be empty') {
  return Validate<unknown[]>((value) => {
    if (!Array.isArray(value) || value.length === 0) {
      return { isValid: false, error: message };
    }
    return { isValid: true };
  });
}

/**
 * Validate positive number decorator
 */
export function ValidatePositiveNumber(message = 'Value must be a positive number') {
  return Validate<number>((value) => {
    if (typeof value !== 'number' || value <= 0 || !isFinite(value)) {
      return { isValid: false, error: message };
    }
    return { isValid: true };
  });
}

/**
 * Validate URL decorator
 */
export function ValidateUrl(message = 'Value must be a valid URL') {
  return Validate<string>((value) => {
    try {
      new URL(value);
      return { isValid: true };
    } catch {
      return { isValid: false, error: message };
    }
  });
}

/**
 * Validate email decorator
 */
export function ValidateEmail(message = 'Value must be a valid email address') {
  return Validate<string>((value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { isValid: false, error: message };
    }
    return { isValid: true };
  });
}

/**
 * Validate card section decorator
 */
export function ValidateCardSection() {
  return Validate<CardSection>((value) => {
    if (!value || typeof value !== 'object') {
      return { isValid: false, error: 'Section must be an object' };
    }
    if (!value.title || typeof value.title !== 'string') {
      return { isValid: false, error: 'Section must have a title' };
    }
    if (!value.type || typeof value.type !== 'string') {
      return { isValid: false, error: 'Section must have a type' };
    }
    return { isValid: true };
  });
}

/**
 * Validate card field decorator
 */
export function ValidateCardField() {
  return Validate<CardField>((value) => {
    if (!value || typeof value !== 'object') {
      return { isValid: false, error: 'Field must be an object' };
    }
    if (value.label === undefined && value.value === undefined) {
      return { isValid: false, error: 'Field must have at least a label or value' };
    }
    return { isValid: true };
  });
}

/**
 * Validate card item decorator
 */
export function ValidateCardItem() {
  return Validate<CardItem>((value) => {
    if (!value || typeof value !== 'object') {
      return { isValid: false, error: 'Item must be an object' };
    }
    if (!value.title || typeof value.title !== 'string') {
      return { isValid: false, error: 'Item must have a title' };
    }
    return { isValid: true };
  });
}

/**
 * Get validation metadata for an object
 */
export function getValidationMetadata(target: object): Map<string, ValidationMetadata> | undefined {
  return validationMetadata.get(target);
}

/**
 * Validate an object's properties
 */
export function validateObject(target: object): ValidationResult[] {
  const metadataMap = validationMetadata.get(target);
  if (!metadataMap) {
    return [];
  }

  const results: ValidationResult[] = [];
  for (const [propertyKey, metadata] of metadataMap.entries()) {
    const value = (target as any)[propertyKey];
    const result = metadata.validator(value);
    results.push({
      ...result,
      error: result.error ? `${propertyKey}: ${result.error}` : undefined
    });
  }

  return results;
}







