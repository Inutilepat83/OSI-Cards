/**
 * Validation Decorators
 *
 * TypeScript decorators for validating section components and card data.
 * These decorators add runtime validation to ensure data integrity.
 *
 * @example
 * ```typescript
 * import { ValidSection, RequiredFields, ValidateOnChange } from '../../public-api';
 *
 * @ValidSection({
 *   requiredFields: ['title', 'type'],
 *   validateFields: true,
 * })
 * @Component({...})
 * export class MySectionComponent extends BaseSectionComponent {
 *   @RequiredFields(['title', 'type'])
 *   @Input() section!: CardSection;
 * }
 * ```
 */

import { ValidationError as LibValidationError, RequiredFieldError } from '../errors';
import { CardField, CardItem, CardSection } from '../models';

// Re-export for convenience
export { RequiredFieldError };

// ============================================================================
// TYPES
// ============================================================================

/**
 * Options for section validation
 */
export interface ValidSectionOptions {
  /** Fields that must be present */
  requiredFields?: string[];
  /** Whether to validate field values */
  validateFields?: boolean;
  /** Whether to validate items */
  validateItems?: boolean;
  /** Custom validation function */
  customValidator?: (section: CardSection) => ValidationResult;
  /** Whether to throw on validation failure */
  throwOnError?: boolean;
  /** Callback for validation errors */
  onError?: (errors: string[]) => void;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Field validation options
 */
export interface FieldValidationOptions {
  /** Field is required */
  required?: boolean;
  /** Minimum length for string values */
  minLength?: number;
  /** Maximum length for string values */
  maxLength?: number;
  /** Pattern for string values */
  pattern?: RegExp;
  /** Custom validation function */
  validate?: (value: unknown) => boolean;
}

// ============================================================================
// CLASS DECORATORS
// ============================================================================

/**
 * Class decorator that adds validation to a section component.
 * Validates the section input when set.
 *
 * @param options - Validation options
 */
export function ValidSection(options: ValidSectionOptions = {}) {
  return function <T extends new (...args: unknown[]) => unknown>(constructor: T): T {
    // Store validation options on the constructor
    Object.defineProperty(constructor, '__validSectionOptions', {
      value: options,
      writable: false,
      enumerable: false,
    });

    return class extends (constructor as any) {
      constructor(...args: unknown[]) {
        super(...args);

        // Override the section setter if it exists
        const originalDescriptor = Object.getOwnPropertyDescriptor(
          constructor.prototype,
          'section'
        );

        if (originalDescriptor?.set) {
          const originalSetter = originalDescriptor.set;

          Object.defineProperty(this, 'section', {
            set(value: CardSection) {
              const result = validateSection(value, options);

              if (!result.valid) {
                if (options.onError) {
                  options.onError(result.errors);
                }

                if (options.throwOnError) {
                  throw new LibValidationError(result.errors);
                }

                console.warn('Section validation failed:', result.errors);
              }

              originalSetter.call(this, value);
            },
            get: originalDescriptor.get,
            configurable: true,
          });
        }
      }
    } as T;
  };
}

// ============================================================================
// PROPERTY DECORATORS
// ============================================================================

/**
 * Property decorator that validates required fields on a section.
 *
 * @param fieldNames - Names of required fields
 */
export function RequiredFields(fieldNames: string[]) {
  return function (target: object, propertyKey: string): void {
    let value: CardSection | undefined;

    const getter = function (this: unknown): CardSection | undefined {
      return value;
    };

    const setter = function (this: unknown, newValue: CardSection): void {
      if (newValue) {
        for (const fieldName of fieldNames) {
          const fieldValue = (newValue as Record<string, unknown>)[fieldName];
          if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
            console.warn(
              `Required field "${fieldName}" is missing or empty in section "${newValue.title}"`
            );
          }
        }
      }
      value = newValue;
    };

    Object.defineProperty(target, propertyKey, {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true,
    });
  };
}

/**
 * Property decorator that validates a section on every change.
 *
 * @param validator - Custom validation function
 */
export function ValidateOnChange(validator: (section: CardSection) => ValidationResult) {
  return function (target: object, propertyKey: string): void {
    let value: CardSection | undefined;

    const getter = function (this: unknown): CardSection | undefined {
      return value;
    };

    const setter = function (this: unknown, newValue: CardSection): void {
      if (newValue) {
        const result = validator(newValue);
        if (!result.valid) {
          console.warn('Section validation failed:', result.errors);
        }
      }
      value = newValue;
    };

    Object.defineProperty(target, propertyKey, {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true,
    });
  };
}

/**
 * Parameter decorator for validating method arguments
 * Note: Requires reflect-metadata polyfill
 */
export function ValidateParam(validator: (value: unknown) => boolean, errorMessage?: string) {
  return function (target: object, propertyKey: string, parameterIndex: number): void {
    // Store validators for this method (requires reflect-metadata)
    if (typeof Reflect !== 'undefined' && (Reflect as any).getMetadata) {
      const existingValidators: Map<
        number,
        { validator: (value: unknown) => boolean; message?: string }
      > = (Reflect as any).getMetadata('paramValidators', target, propertyKey) ?? new Map();

      existingValidators.set(parameterIndex, { validator, message: errorMessage });
      (Reflect as any).defineMetadata('paramValidators', existingValidators, target, propertyKey);
    }
  };
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate a section against the given options
 */
export function validateSection(
  section: CardSection | null | undefined,
  options: ValidSectionOptions = {}
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!section) {
    errors.push('Section is null or undefined');
    return { valid: false, errors, warnings };
  }

  // Validate required fields
  if (options.requiredFields) {
    for (const fieldName of options.requiredFields) {
      const value = (section as Record<string, unknown>)[fieldName];
      if (value === undefined || value === null) {
        errors.push(`Required field "${fieldName}" is missing`);
      } else if (typeof value === 'string' && value.trim() === '') {
        warnings.push(`Field "${fieldName}" is empty`);
      }
    }
  }

  // Basic required fields
  if (!section.title) {
    errors.push('Section title is required');
  }

  if (!section.type) {
    errors.push('Section type is required');
  }

  // Validate fields if enabled
  if (options.validateFields && section.fields) {
    for (let i = 0; i < section.fields.length; i++) {
      const field = section.fields[i];
      if (field) {
        const fieldErrors = validateField(field, i);
        errors.push(...fieldErrors);
      }
    }
  }

  // Validate items if enabled
  if (options.validateItems && section.items) {
    for (let i = 0; i < section.items.length; i++) {
      const item = section.items[i];
      if (item) {
        const itemErrors = validateItem(item, i);
        errors.push(...itemErrors);
      }
    }
  }

  // Run custom validator if provided
  if (options.customValidator) {
    const customResult = options.customValidator(section);
    errors.push(...customResult.errors);
    warnings.push(...customResult.warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a single field
 */
export function validateField(field: CardField, index: number): string[] {
  const errors: string[] = [];
  const prefix = `Field[${index}]`;

  if (!field.label) {
    errors.push(`${prefix}: Label is required`);
  }

  return errors;
}

/**
 * Validate a single item
 */
export function validateItem(item: CardItem, index: number): string[] {
  const errors: string[] = [];
  const prefix = `Item[${index}]`;

  if (!item.title) {
    errors.push(`${prefix}: Title is required`);
  }

  return errors;
}

/**
 * Validate a value against field options
 */
export function validateValue(value: unknown, options: FieldValidationOptions): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (options.required) {
    if (value === undefined || value === null || value === '') {
      errors.push('Value is required');
      return { valid: false, errors, warnings };
    }
  }

  if (typeof value === 'string') {
    if (options.minLength && value.length < options.minLength) {
      errors.push(`Value must be at least ${options.minLength} characters`);
    }

    if (options.maxLength && value.length > options.maxLength) {
      errors.push(`Value must be at most ${options.maxLength} characters`);
    }

    if (options.pattern && !options.pattern.test(value)) {
      errors.push(`Value does not match required pattern`);
    }
  }

  if (options.validate && !options.validate(value)) {
    errors.push('Value failed custom validation');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// ADDITIONAL VALIDATORS FROM APP (Merged from src/app/shared/decorators/)
// ============================================================================

/**
 * Property validation error (different from lib ValidationError)
 */
export class PropertyValidationError extends Error {
  constructor(
    message: string,
    public readonly property: string,
    public readonly value: unknown
  ) {
    super(message);
    this.name = 'PropertyValidationError';
  }
}

/**
 * Validator function type for property validation
 */
export type ValidatorFn<T = unknown> = (value: T) => {
  isValid: boolean;
  error?: string;
  suggestions?: string[];
};

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
      propertyKey,
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
            throw new PropertyValidationError(
              result.error || `Validation failed for ${propertyKey}`,
              propertyKey,
              value
            );
          }
        }
        (this as any)[privateKey] = value;
      },
      enumerable: true,
      configurable: true,
    });
  };
}

/**
 * Validate card type decorator
 */
export function ValidateCardType() {
  return Validate<string>((value) => {
    const validTypes = [
      'company',
      'contact',
      'opportunity',
      'product',
      'analytics',
      'event',
      'sko',
    ];
    if (!validTypes.includes(value)) {
      return {
        isValid: false,
        error: `Invalid card type: ${value}. Must be one of: ${validTypes.join(', ')}`,
        suggestions: validTypes.filter((t) => t.startsWith(String(value).charAt(0))),
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
      'info',
      'overview',
      'analytics',
      'news',
      'social-media',
      'financials',
      'list',
      'table',
      'event',
      'timeline',
      'product',
      'solutions',
      'contact-card',
      'network-card',
      'map',
      'locations',
      'chart',
      'quotation',
      'quote',
      'text-reference',
      'reference',
      'text-ref',
      'brand-colors',
      'brands',
      'colors',
    ];
    if (!validTypes.includes(value)) {
      return {
        isValid: false,
        error: `Invalid section type: ${value}`,
        suggestions: validTypes.filter((t) => t.includes(value) || value.includes(t)),
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
export function validateObject(
  target: object
): Array<{ isValid: boolean; error?: string; suggestions?: string[] }> {
  const metadataMap = validationMetadata.get(target);
  if (!metadataMap) {
    return [];
  }

  const results: Array<{ isValid: boolean; error?: string; suggestions?: string[] }> = [];
  for (const [propertyKey, metadata] of metadataMap.entries()) {
    const value = (target as any)[propertyKey];
    const result = metadata.validator(value);
    const errorMsg = result.error ? `${propertyKey}: ${result.error}` : undefined;
    results.push({
      isValid: result.isValid,
      ...(errorMsg !== undefined && { error: errorMsg }),
      ...(result.suggestions && { suggestions: result.suggestions }),
    });
  }

  return results;
}

// ============================================================================
// UTILITY DECORATORS
// ============================================================================

/**
 * Method decorator for logging validation errors
 */
export function LogValidationErrors() {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value as (...args: unknown[]) => unknown;

    descriptor.value = function (this: unknown, ...args: unknown[]): unknown {
      try {
        return originalMethod.apply(this, args);
      } catch (error) {
        if (error instanceof LibValidationError) {
          console.error(`Validation error in ${propertyKey}:`, error.errors);
        }
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Method decorator for catching and handling validation errors
 */
export function CatchValidationErrors(handler: (errors: string[]) => void) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value as (...args: unknown[]) => unknown;

    descriptor.value = function (this: unknown, ...args: unknown[]): unknown {
      try {
        return originalMethod.apply(this, args);
      } catch (error) {
        if (error instanceof LibValidationError) {
          handler(error.errors);
          return undefined;
        }
        throw error;
      }
    };

    return descriptor;
  };
}
