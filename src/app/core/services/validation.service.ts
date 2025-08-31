import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SecurityService } from './security.service';
import { LoggerService } from './enhanced-logging.service';
import {
  IValidationService,
  ValidationRules,
  ValidationRule as IValidationRule,
} from '../interfaces/app.interfaces';
import { ValidationError } from '../types/common.types';

export interface ValidationRule {
  name: string;
  validator: ValidatorFn;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ValidationService implements IValidationService {
  private customRules = new Map<string, IValidationRule<any>>();
  private readonly logger = this.loggerService.createChildLogger('Validation');

  constructor(
    private securityService: SecurityService,
    private loggerService: LoggerService
  ) {
    this.registerBuiltInRules();
  }

  // Enhanced validation methods implementing IValidationService
  validate<T>(data: T, rules: ValidationRules<T>): { isValid: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    for (const field in rules) {
      const fieldRules = rules[field];
      if (!fieldRules) continue;

      const value = data[field];

      for (const rule of fieldRules) {
        try {
          const isValid = rule.validate(value);
          if (isValid instanceof Promise) {
            this.logger.warn(`Synchronous validation called with async rule: ${rule.name}`);
            continue;
          }

          if (!isValid) {
            errors.push({
              field: field as string,
              message: rule.message,
              code: rule.name,
              value,
            });
          }
        } catch (error) {
          this.logger.error(`Validation rule ${rule.name} threw an error`, error);
          errors.push({
            field: field as string,
            message: 'Validation error occurred',
            code: 'validation_error',
            value,
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateAsync<T>(
    data: T,
    rules: ValidationRules<T>
  ): Observable<{ isValid: boolean; errors: ValidationError[] }> {
    const validationPromises: Promise<ValidationError | null>[] = [];

    for (const field in rules) {
      const fieldRules = rules[field];
      if (!fieldRules) continue;

      const value = data[field];

      for (const rule of fieldRules) {
        const validationPromise = this.validateSingleRule(field as string, value, rule);
        validationPromises.push(validationPromise);
      }
    }

    return of(Promise.all(validationPromises)).pipe(
      map(async promises => {
        const results = await promises;
        const errors = results.filter((error): error is ValidationError => error !== null);

        return {
          isValid: errors.length === 0,
          errors,
        };
      }),
      catchError(error => {
        this.logger.error('Async validation failed', error);
        return of({
          isValid: false,
          errors: [
            {
              field: 'unknown',
              message: 'Validation failed',
              code: 'validation_error',
              value: undefined,
            },
          ],
        });
      })
    ) as Observable<{ isValid: boolean; errors: ValidationError[] }>;
  }

  addRule<T>(name: string, rule: IValidationRule<T>): void {
    this.customRules.set(name, rule);
    this.logger.debug(`Custom validation rule added: ${name}`);
  }

  private async validateSingleRule<T>(
    field: string,
    value: T,
    rule: IValidationRule<T>
  ): Promise<ValidationError | null> {
    try {
      const result = rule.validate(value);
      const isValid = result instanceof Promise ? await result : result;

      if (!isValid) {
        return {
          field,
          message: rule.message,
          code: rule.name,
          value,
        };
      }

      return null;
    } catch (error) {
      this.logger.error(`Validation rule ${rule.name} threw an error`, error);
      return {
        field,
        message: 'Validation error occurred',
        code: 'validation_error',
        value,
      };
    }
  }

  private registerBuiltInRules(): void {
    // Register commonly used rules for easy access
    this.addRule('required', {
      name: 'required',
      message: 'This field is required',
      validate: (value: any) => value !== null && value !== undefined && value !== '',
    });

    this.addRule('email', {
      name: 'email',
      message: 'Must be a valid email address',
      validate: (value: string) => {
        if (!value) return true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      },
    });
  }

  /**
   * Email validation
   */
  static emailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const isValid = emailRegex.test(control.value);

      return isValid ? null : { email: { value: control.value } };
    };
  }

  /**
   * Password strength validation
   */
  static passwordValidator(minLength: number = 8): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const value = control.value;
      const errors: any = {};

      if (value.length < minLength) {
        errors.minLength = { requiredLength: minLength, actualLength: value.length };
      }

      if (!/(?=.*[a-z])/.test(value)) {
        errors.lowercase = true;
      }

      if (!/(?=.*[A-Z])/.test(value)) {
        errors.uppercase = true;
      }

      if (!/(?=.*\d)/.test(value)) {
        errors.number = true;
      }

      if (!/(?=.*[@$!%*?&])/.test(value)) {
        errors.special = true;
      }

      return Object.keys(errors).length > 0 ? { password: errors } : null;
    };
  }

  /**
   * URL validation
   */
  static urlValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      try {
        new URL(control.value);
        return null;
      } catch {
        return { url: { value: control.value } };
      }
    };
  }

  /**
   * Phone number validation
   */
  static phoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
      const isValid = phoneRegex.test(control.value.replace(/[\s\-()]/g, ''));

      return isValid ? null : { phone: { value: control.value } };
    };
  }

  /**
   * Credit card number validation (basic)
   */
  static creditCardValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const value = control.value.replace(/\s/g, '');
      const isValid = /^\d{13,19}$/.test(value) && this.luhnCheck(value);

      return isValid ? null : { creditCard: { value: control.value } };
    };
  }

  /**
   * Date validation
   */
  static dateValidator(minDate?: Date, maxDate?: Date): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const date = new Date(control.value);
      const errors: any = {};

      if (isNaN(date.getTime())) {
        errors.invalid = true;
      }

      if (minDate && date < minDate) {
        errors.minDate = { min: minDate, actual: date };
      }

      if (maxDate && date > maxDate) {
        errors.maxDate = { max: maxDate, actual: date };
      }

      return Object.keys(errors).length > 0 ? { date: errors } : null;
    };
  }

  /**
   * File size validation
   */
  static fileSizeValidator(maxSizeInMB: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const file = control.value;
      if (!(file instanceof File)) return null;

      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      return file.size > maxSizeInBytes
        ? { fileSize: { maxSize: maxSizeInMB, actualSize: file.size / (1024 * 1024) } }
        : null;
    };
  }

  /**
   * File type validation
   */
  static fileTypeValidator(allowedTypes: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const file = control.value;
      if (!(file instanceof File)) return null;

      const fileType = file.type.toLowerCase();
      const isValid = allowedTypes.some(type => fileType.includes(type.toLowerCase()));

      return isValid ? null : { fileType: { allowed: allowedTypes, actual: fileType } };
    };
  }

  /**
   * Custom pattern validation
   */
  static patternValidator(pattern: RegExp, errorKey: string = 'pattern'): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      return pattern.test(control.value) ? null : { [errorKey]: { value: control.value } };
    };
  }

  /**
   * Validate entire form with security checks
   */
  validateFormData(data: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Security validation
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        if (!this.securityService.validateInput(value)) {
          result.errors.push(`${key}: Contains potentially unsafe content`);
          result.isValid = false;
        }

        // Check for suspicious patterns
        if (this.containsSuspiciousPatterns(value)) {
          result.warnings.push(`${key}: Contains potentially suspicious content`);
        }
      }
    }

    return result;
  }

  /**
   * Sanitize form input
   */
  sanitizeFormInput(input: string): string {
    return this.securityService.sanitizeUserInput(input);
  }

  /**
   * Get validation error messages
   */
  getErrorMessage(error: ValidationErrors, fieldName: string): string {
    if (error['required']) {
      return `${fieldName} is required`;
    }

    if (error['email']) {
      return 'Please enter a valid email address';
    }

    if (error['password']) {
      const passwordErrors = error['password'];
      if (passwordErrors.minLength) {
        return `Password must be at least ${passwordErrors.minLength.requiredLength} characters`;
      }
      if (passwordErrors.lowercase) {
        return 'Password must contain at least one lowercase letter';
      }
      if (passwordErrors.uppercase) {
        return 'Password must contain at least one uppercase letter';
      }
      if (passwordErrors.number) {
        return 'Password must contain at least one number';
      }
      if (passwordErrors.special) {
        return 'Password must contain at least one special character';
      }
    }

    if (error['url']) {
      return 'Please enter a valid URL';
    }

    if (error['phone']) {
      return 'Please enter a valid phone number';
    }

    if (error['creditCard']) {
      return 'Please enter a valid credit card number';
    }

    if (error['date']) {
      const dateErrors = error['date'];
      if (dateErrors.invalid) {
        return 'Please enter a valid date';
      }
      if (dateErrors.minDate) {
        return `Date must be after ${dateErrors.minDate.min.toDateString()}`;
      }
      if (dateErrors.maxDate) {
        return `Date must be before ${dateErrors.maxDate.max.toDateString()}`;
      }
    }

    if (error['fileSize']) {
      return `File size must be less than ${error['fileSize'].maxSize}MB`;
    }

    if (error['fileType']) {
      return `File type must be one of: ${error['fileType'].allowed.join(', ')}`;
    }

    return `${fieldName} is invalid`;
  }

  /**
   * Luhn algorithm for credit card validation
   */
  private static luhnCheck(cardNumber: string): boolean {
    let sum = 0;
    let shouldDouble = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i), 10);

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  }

  /**
   * Check for suspicious patterns in input
   */
  private containsSuspiciousPatterns(input: string): boolean {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\(/i,
      /document\./i,
      /window\./i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(input));
  }
}
