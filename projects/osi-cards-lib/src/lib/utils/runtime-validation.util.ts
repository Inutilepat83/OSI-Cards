/**
 * Runtime Type Validation Utilities
 * Provides runtime validation for TypeScript types
 *
 * @description
 * While TypeScript provides compile-time type safety, these utilities
 * add runtime validation for data from external sources (APIs, user input, etc.)
 */

import { AICardConfig, CardSection, CardField, CardItem } from '../models/card.model';

/**
 * Validation result
 */
export interface ValidationResult<T> {
  /** Whether validation passed */
  valid: boolean;
  /** Validated data (if valid) */
  data?: T;
  /** Validation errors */
  errors?: ValidationError[];
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Field path */
  path: string;
  /** Error message */
  message: string;
  /** Expected type/value */
  expected?: string;
  /** Actual value */
  actual?: unknown;
}

/**
 * Validation context for tracking path
 */
class ValidationContext {
  private pathSegments: string[] = [];

  public pushPath(segment: string): void {
    this.pathSegments.push(segment);
  }

  public popPath(): void {
    this.pathSegments.pop();
  }

  public getCurrentPath(): string {
    return this.pathSegments.join('.');
  }
}

/**
 * Base validator class
 */
export class Validator<T> {
  protected errors: ValidationError[] = [];
  protected context = new ValidationContext();

  /**
   * Add validation error
   */
  protected addError(message: string, expected?: string, actual?: unknown): void {
    this.errors.push({
      path: this.context.getCurrentPath() || 'root',
      message,
      expected,
      actual,
    });
  }

  /**
   * Validate required field
   */
  protected validateRequired(value: unknown, fieldName: string): boolean {
    if (value === undefined || value === null) {
      this.addError(`Field "${fieldName}" is required`, 'defined value', value);
      return false;
    }
    return true;
  }

  /**
   * Validate type
   */
  protected validateType(value: unknown, expectedType: string, fieldName: string): boolean {
    const actualType = typeof value;
    if (actualType !== expectedType) {
      this.addError(
        `Field "${fieldName}" must be of type ${expectedType}`,
        expectedType,
        actualType
      );
      return false;
    }
    return true;
  }

  /**
   * Validate array
   */
  protected validateArray(value: unknown, fieldName: string): boolean {
    if (!Array.isArray(value)) {
      this.addError(`Field "${fieldName}" must be an array`, 'array', typeof value);
      return false;
    }
    return true;
  }

  /**
   * Validate string length
   */
  protected validateStringLength(
    value: string,
    fieldName: string,
    min?: number,
    max?: number
  ): boolean {
    if (min !== undefined && value.length < min) {
      this.addError(
        `Field "${fieldName}" must be at least ${min} characters`,
        `>=${min} characters`,
        `${value.length} characters`
      );
      return false;
    }
    if (max !== undefined && value.length > max) {
      this.addError(
        `Field "${fieldName}" must be at most ${max} characters`,
        `<=${max} characters`,
        `${value.length} characters`
      );
      return false;
    }
    return true;
  }

  /**
   * Validate number range
   */
  protected validateNumberRange(
    value: number,
    fieldName: string,
    min?: number,
    max?: number
  ): boolean {
    if (min !== undefined && value < min) {
      this.addError(
        `Field "${fieldName}" must be at least ${min}`,
        `>=${min}`,
        value
      );
      return false;
    }
    if (max !== undefined && value > max) {
      this.addError(
        `Field "${fieldName}" must be at most ${max}`,
        `<=${max}`,
        value
      );
      return false;
    }
    return true;
  }

  /**
   * Validate enum value
   */
  protected validateEnum(
    value: unknown,
    fieldName: string,
    allowedValues: unknown[]
  ): boolean {
    if (!allowedValues.includes(value)) {
      this.addError(
        `Field "${fieldName}" must be one of: ${allowedValues.join(', ')}`,
        allowedValues.join(' | '),
        value
      );
      return false;
    }
    return true;
  }

  /**
   * Get validation result
   */
  protected getResult(data?: T): ValidationResult<T> {
    if (this.errors.length === 0) {
      return { valid: true, data };
    }
    return { valid: false, errors: this.errors };
  }
}

/**
 * Card field validator
 */
export class CardFieldValidator extends Validator<CardField> {
  /**
   * Validate card field
   */
  public validate(field: unknown): ValidationResult<CardField> {
    this.errors = [];

    if (typeof field !== 'object' || field === null) {
      this.addError('Field must be an object', 'object', typeof field);
      return this.getResult();
    }

    const f = field as any;

    // Validate required fields
    if (!this.validateRequired(f.label, 'label')) {
      return this.getResult();
    }

    if (!this.validateType(f.label, 'string', 'label')) {
      return this.getResult();
    }

    // Validate optional fields
    if (f.value !== undefined && f.value !== null) {
      if (typeof f.value !== 'string' && typeof f.value !== 'number') {
        this.addError('Field "value" must be string or number', 'string | number', typeof f.value);
      }
    }

    if (f.percentage !== undefined) {
      if (!this.validateType(f.percentage, 'number', 'percentage')) {
        return this.getResult();
      }
      this.validateNumberRange(f.percentage, 'percentage', 0, 100);
    }

    if (f.trend !== undefined) {
      this.validateEnum(f.trend, 'trend', ['up', 'down', 'stable', 'neutral']);
    }

    return this.getResult(f as CardField);
  }
}

/**
 * Card section validator
 */
export class CardSectionValidator extends Validator<CardSection> {
  private fieldValidator = new CardFieldValidator();

  /**
   * Validate card section
   */
  public validate(section: unknown): ValidationResult<CardSection> {
    this.errors = [];

    if (typeof section !== 'object' || section === null) {
      this.addError('Section must be an object', 'object', typeof section);
      return this.getResult();
    }

    const s = section as any;

    // Validate required fields
    if (!this.validateRequired(s.type, 'type')) {
      return this.getResult();
    }

    if (!this.validateType(s.type, 'string', 'type')) {
      return this.getResult();
    }

    // Validate optional fields
    if (s.title !== undefined && s.title !== null) {
      if (!this.validateType(s.title, 'string', 'title')) {
        return this.getResult();
      }
      this.validateStringLength(s.title, 'title', 1, 200);
    }

    if (s.description !== undefined && s.description !== null) {
      if (!this.validateType(s.description, 'string', 'description')) {
        return this.getResult();
      }
      this.validateStringLength(s.description, 'description', undefined, 1000);
    }

    if (s.colSpan !== undefined) {
      if (!this.validateType(s.colSpan, 'number', 'colSpan')) {
        return this.getResult();
      }
      this.validateNumberRange(s.colSpan, 'colSpan', 1, 4);
    }

    // Validate fields array
    if (s.fields !== undefined) {
      if (!this.validateArray(s.fields, 'fields')) {
        return this.getResult();
      }

      for (let i = 0; i < s.fields.length; i++) {
        this.context.pushPath(`fields[${i}]`);
        const fieldResult = this.fieldValidator.validate(s.fields[i]);
        if (!fieldResult.valid && fieldResult.errors) {
          this.errors.push(...fieldResult.errors);
        }
        this.context.popPath();
      }
    }

    // Validate items array
    if (s.items !== undefined) {
      if (!this.validateArray(s.items, 'items')) {
        return this.getResult();
      }

      for (let i = 0; i < s.items.length; i++) {
        if (typeof s.items[i] !== 'object' || s.items[i] === null) {
          this.context.pushPath(`items[${i}]`);
          this.addError('Item must be an object', 'object', typeof s.items[i]);
          this.context.popPath();
        }
      }
    }

    return this.getResult(s as CardSection);
  }
}

/**
 * Card configuration validator
 */
export class CardConfigValidator extends Validator<AICardConfig> {
  private sectionValidator = new CardSectionValidator();

  /**
   * Validate card configuration
   */
  public validate(config: unknown): ValidationResult<AICardConfig> {
    this.errors = [];

    if (typeof config !== 'object' || config === null) {
      this.addError('Card config must be an object', 'object', typeof config);
      return this.getResult();
    }

    const c = config as any;

    // Validate required fields
    if (!this.validateRequired(c.cardTitle, 'cardTitle')) {
      return this.getResult();
    }

    if (!this.validateType(c.cardTitle, 'string', 'cardTitle')) {
      return this.getResult();
    }

    this.validateStringLength(c.cardTitle, 'cardTitle', 1, 200);

    if (!this.validateRequired(c.sections, 'sections')) {
      return this.getResult();
    }

    if (!this.validateArray(c.sections, 'sections')) {
      return this.getResult();
    }

    // Validate optional fields
    if (c.id !== undefined && c.id !== null) {
      if (!this.validateType(c.id, 'string', 'id')) {
        return this.getResult();
      }
    }

    if (c.description !== undefined && c.description !== null) {
      if (!this.validateType(c.description, 'string', 'description')) {
        return this.getResult();
      }
      this.validateStringLength(c.description, 'description', undefined, 1000);
    }

    if (c.columns !== undefined) {
      if (!this.validateType(c.columns, 'number', 'columns')) {
        return this.getResult();
      }
      this.validateEnum(c.columns, 'columns', [1, 2, 3]);
    }

    // Validate sections array
    for (let i = 0; i < c.sections.length; i++) {
      this.context.pushPath(`sections[${i}]`);
      const sectionResult = this.sectionValidator.validate(c.sections[i]);
      if (!sectionResult.valid && sectionResult.errors) {
        this.errors.push(...sectionResult.errors);
      }
      this.context.popPath();
    }

    return this.getResult(c as AICardConfig);
  }
}

/**
 * Global validators
 */
export const RuntimeValidators = {
  Field: new CardFieldValidator(),
  Section: new CardSectionValidator(),
  Card: new CardConfigValidator(),
};

/**
 * Convenience functions
 */

/**
 * Validate card configuration
 */
export function validateCard(config: unknown): ValidationResult<AICardConfig> {
  return RuntimeValidators.Card.validate(config);
}

/**
 * Validate card section
 */
export function validateSection(section: unknown): ValidationResult<CardSection> {
  return RuntimeValidators.Section.validate(section);
}

/**
 * Validate card field
 */
export function validateField(field: unknown): ValidationResult<CardField> {
  return RuntimeValidators.Field.validate(field);
}

/**
 * Assert card is valid (throws if invalid)
 */
export function assertValidCard(config: unknown): asserts config is AICardConfig {
  const result = validateCard(config);
  if (!result.valid) {
    const errorMessages = result.errors?.map(e => `${e.path}: ${e.message}`).join('\n');
    throw new Error(`Invalid card configuration:\n${errorMessages}`);
  }
}

/**
 * Assert section is valid (throws if invalid)
 */
export function assertValidSection(section: unknown): asserts section is CardSection {
  const result = validateSection(section);
  if (!result.valid) {
    const errorMessages = result.errors?.map(e => `${e.path}: ${e.message}`).join('\n');
    throw new Error(`Invalid section:\n${errorMessages}`);
  }
}

