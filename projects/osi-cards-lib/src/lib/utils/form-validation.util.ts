/**
 * Form Validation Utilities
 *
 * Collection of reusable validators for Angular Reactive Forms
 * with common validation patterns and custom validators.
 *
 * Features:
 * - Common validators (email, URL, phone, etc.)
 * - Custom validator builders
 * - Async validators
 * - Cross-field validation
 * - Error message generators
 *
 * @example
 * ```typescript
 * import { Validators } from '@osi-cards/utils';
 *
 * this.form = new FormGroup({
 *   email: new FormControl('', [
 *     Validators.required,
 *     Validators.email
 *   ]),
 *   age: new FormControl('', [
 *     Validators.required,
 *     Validators.min(18),
 *     Validators.max(120)
 *   ])
 * });
 * ```
 */

import { AbstractControl, ValidationErrors, ValidatorFn, AsyncValidatorFn } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

/**
 * Custom validators
 */
export class CustomValidators {
  /**
   * Validate email format (more strict than Angular's default)
   *
   * @returns Validator function
   */
  static email(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const emailRegex =
        /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

      if (!emailRegex.test(control.value)) {
        return { email: { value: control.value } };
      }

      return null;
    };
  }

  /**
   * Validate URL format
   *
   * @returns Validator function
   */
  static url(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      try {
        new URL(control.value);
        return null;
      } catch {
        return { url: { value: control.value } };
      }
    };
  }

  /**
   * Validate phone number (US format)
   *
   * @returns Validator function
   */
  static phone(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;

      if (!phoneRegex.test(control.value)) {
        return { phone: { value: control.value } };
      }

      return null;
    };
  }

  /**
   * Validate credit card number (Luhn algorithm)
   *
   * @returns Validator function
   */
  static creditCard(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = control.value.replace(/\D/g, '');

      if (value.length < 13 || value.length > 19) {
        return { creditCard: { value: control.value } };
      }

      // Luhn algorithm
      let sum = 0;
      let isEven = false;

      for (let i = value.length - 1; i >= 0; i--) {
        let digit = parseInt(value[i], 10);

        if (isEven) {
          digit *= 2;
          if (digit > 9) {
            digit -= 9;
          }
        }

        sum += digit;
        isEven = !isEven;
      }

      if (sum % 10 !== 0) {
        return { creditCard: { value: control.value } };
      }

      return null;
    };
  }

  /**
   * Validate string matches pattern
   *
   * @param pattern - Regular expression pattern
   * @param error - Error key
   * @returns Validator function
   */
  static pattern(pattern: RegExp, error = 'pattern'): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      if (!pattern.test(control.value)) {
        return { [error]: { value: control.value, pattern: pattern.toString() } };
      }

      return null;
    };
  }

  /**
   * Validate value is in list
   *
   * @param allowedValues - Array of allowed values
   * @returns Validator function
   */
  static oneOf(allowedValues: any[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      if (!allowedValues.includes(control.value)) {
        return { oneOf: { value: control.value, allowed: allowedValues } };
      }

      return null;
    };
  }

  /**
   * Validate string length range
   *
   * @param min - Minimum length
   * @param max - Maximum length
   * @returns Validator function
   */
  static lengthRange(min: number, max: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const length = control.value.length;

      if (length < min || length > max) {
        return { lengthRange: { value: control.value, min, max, actual: length } };
      }

      return null;
    };
  }

  /**
   * Validate number range
   *
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (inclusive)
   * @returns Validator function
   */
  static range(min: number, max: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value === null || control.value === undefined) {
        return null;
      }

      const value = parseFloat(control.value);

      if (isNaN(value) || value < min || value > max) {
        return { range: { value: control.value, min, max } };
      }

      return null;
    };
  }

  /**
   * Validate field matches another field
   *
   * @param matchControlName - Name of control to match
   * @param errorKey - Error key
   * @returns Validator function
   *
   * @example
   * ```typescript
   * this.form = new FormGroup({
   *   password: new FormControl(''),
   *   confirmPassword: new FormControl('', [
   *     CustomValidators.match('password', 'passwordMismatch')
   *   ])
   * });
   * ```
   */
  static match(matchControlName: string, errorKey = 'match'): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !control.parent) {
        return null;
      }

      const matchControl = control.parent.get(matchControlName);

      if (!matchControl) {
        return null;
      }

      if (control.value !== matchControl.value) {
        return { [errorKey]: { match: matchControlName } };
      }

      return null;
    };
  }

  /**
   * Validate at least one field in group is filled
   *
   * @param controlNames - Array of control names
   * @returns Validator function
   *
   * @example
   * ```typescript
   * this.form = new FormGroup({
   *   email: new FormControl(''),
   *   phone: new FormControl('')
   * }, {
   *   validators: CustomValidators.requireAtLeastOne(['email', 'phone'])
   * });
   * ```
   */
  static requireAtLeastOne(controlNames: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const group = control as any;

      const hasValue = controlNames.some((name) => {
        const ctrl = group.get(name);
        return ctrl && ctrl.value;
      });

      if (!hasValue) {
        return { requireAtLeastOne: { fields: controlNames } };
      }

      return null;
    };
  }

  /**
   * Async validator: check if value is unique
   *
   * @param checkFn - Function to check uniqueness
   * @param debounceTime - Debounce time in ms
   * @returns Async validator function
   *
   * @example
   * ```typescript
   * this.form = new FormGroup({
   *   username: new FormControl('', {
   *     asyncValidators: [
   *       CustomValidators.unique(
   *         (username) => this.api.checkUsername(username),
   *         500
   *       )
   *     ]
   *   })
   * });
   * ```
   */
  static unique(
    checkFn: (value: any) => Observable<boolean> | Promise<boolean>,
    debounceTime = 300
  ): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      return timer(debounceTime).pipe(
        switchMap(() => checkFn(control.value)),
        map((isUnique) => {
          return isUnique ? null : { unique: { value: control.value } };
        })
      );
    };
  }

  /**
   * Validate JSON format
   *
   * @returns Validator function
   */
  static json(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      try {
        JSON.parse(control.value);
        return null;
      } catch {
        return { json: { value: control.value } };
      }
    };
  }

  /**
   * Validate date is in future
   *
   * @returns Validator function
   */
  static futureDate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const date = new Date(control.value);
      const now = new Date();

      if (date <= now) {
        return { futureDate: { value: control.value } };
      }

      return null;
    };
  }

  /**
   * Validate date is in past
   *
   * @returns Validator function
   */
  static pastDate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const date = new Date(control.value);
      const now = new Date();

      if (date >= now) {
        return { pastDate: { value: control.value } };
      }

      return null;
    };
  }

  /**
   * Validate strong password
   *
   * Requirements:
   * - At least 8 characters
   * - Contains uppercase
   * - Contains lowercase
   * - Contains number
   * - Contains special character
   *
   * @returns Validator function
   */
  static strongPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = control.value;
      const errors: any = {};

      if (value.length < 8) {
        errors.minLength = true;
      }

      if (!/[A-Z]/.test(value)) {
        errors.uppercase = true;
      }

      if (!/[a-z]/.test(value)) {
        errors.lowercase = true;
      }

      if (!/[0-9]/.test(value)) {
        errors.number = true;
      }

      if (!/[^A-Za-z0-9]/.test(value)) {
        errors.special = true;
      }

      return Object.keys(errors).length > 0 ? { strongPassword: errors } : null;
    };
  }

  /**
   * Validate file size
   *
   * @param maxSizeBytes - Maximum size in bytes
   * @returns Validator function
   */
  static fileSize(maxSizeBytes: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const file = control.value as File;

      if (!file || !file.size) {
        return null;
      }

      if (file.size > maxSizeBytes) {
        return {
          fileSize: {
            max: maxSizeBytes,
            actual: file.size,
          },
        };
      }

      return null;
    };
  }

  /**
   * Validate file type
   *
   * @param allowedTypes - Array of allowed MIME types or extensions
   * @returns Validator function
   *
   * @example
   * ```typescript
   * CustomValidators.fileType(['image/png', 'image/jpeg', '.pdf'])
   * ```
   */
  static fileType(allowedTypes: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const file = control.value as File;

      if (!file || !file.type) {
        return null;
      }

      const isAllowed = allowedTypes.some((type) => {
        if (type.startsWith('.')) {
          return file.name.endsWith(type);
        }
        return file.type === type;
      });

      if (!isAllowed) {
        return {
          fileType: {
            allowed: allowedTypes,
            actual: file.type,
          },
        };
      }

      return null;
    };
  }
}

/**
 * Get error message for validation error
 *
 * @param errors - Validation errors object
 * @param fieldName - Field name for messages
 * @returns Error message
 *
 * @example
 * ```typescript
 * const errors = form.get('email')?.errors;
 * const message = getErrorMessage(errors, 'Email');
 * // "Email is required" or "Email must be valid"
 * ```
 */
export function getErrorMessage(
  errors: ValidationErrors | null | undefined,
  fieldName = 'Field'
): string | null {
  if (!errors) {
    return null;
  }

  if (errors['required']) {
    return `${fieldName} is required`;
  }

  if (errors['email']) {
    return `${fieldName} must be a valid email address`;
  }

  if (errors['url']) {
    return `${fieldName} must be a valid URL`;
  }

  if (errors['phone']) {
    return `${fieldName} must be a valid phone number`;
  }

  if (errors['min']) {
    return `${fieldName} must be at least ${errors['min'].min}`;
  }

  if (errors['max']) {
    return `${fieldName} must be at most ${errors['max'].max}`;
  }

  if (errors['minlength']) {
    return `${fieldName} must be at least ${errors['minlength'].requiredLength} characters`;
  }

  if (errors['maxlength']) {
    return `${fieldName} must be at most ${errors['maxlength'].requiredLength} characters`;
  }

  if (errors['pattern']) {
    return `${fieldName} format is invalid`;
  }

  if (errors['range']) {
    return `${fieldName} must be between ${errors['range'].min} and ${errors['range'].max}`;
  }

  if (errors['match']) {
    return `${fieldName} must match ${errors['match'].match}`;
  }

  if (errors['unique']) {
    return `${fieldName} is already taken`;
  }

  if (errors['strongPassword']) {
    const reqs = [];
    if (errors['strongPassword'].minLength) reqs.push('at least 8 characters');
    if (errors['strongPassword'].uppercase) reqs.push('an uppercase letter');
    if (errors['strongPassword'].lowercase) reqs.push('a lowercase letter');
    if (errors['strongPassword'].number) reqs.push('a number');
    if (errors['strongPassword'].special) reqs.push('a special character');
    return `Password must contain ${reqs.join(', ')}`;
  }

  if (errors['fileSize']) {
    const maxMB = (errors['fileSize'].max / (1024 * 1024)).toFixed(2);
    return `File size must be less than ${maxMB} MB`;
  }

  if (errors['fileType']) {
    return `File type must be one of: ${errors['fileType'].allowed.join(', ')}`;
  }

  // Default message
  return `${fieldName} is invalid`;
}

/**
 * Check if form control has error
 *
 * @param control - Form control
 * @param errorKey - Error key to check
 * @returns True if control has that error
 *
 * @example
 * ```typescript
 * if (hasError(emailControl, 'email')) {
 *   console.log('Email is invalid');
 * }
 * ```
 */
export function hasError(control: AbstractControl | null, errorKey: string): boolean {
  return !!control?.hasError(errorKey) && (control?.dirty || control?.touched);
}

/**
 * Get first error message for control
 *
 * @param control - Form control
 * @param fieldName - Field name for messages
 * @returns First error message or null
 */
export function getFirstError(control: AbstractControl | null, fieldName = 'Field'): string | null {
  if (!control || !control.errors || (!control.dirty && !control.touched)) {
    return null;
  }

  return getErrorMessage(control.errors, fieldName);
}

/**
 * Mark all controls in form as touched
 *
 * @param control - Form group or control
 *
 * @example
 * ```typescript
 * // On form submit
 * markAllAsTouched(this.form);
 * ```
 */
export function markAllAsTouched(control: AbstractControl): void {
  control.markAsTouched();

  if ('controls' in control) {
    const group = control as any;
    Object.keys(group.controls).forEach((key) => {
      markAllAsTouched(group.controls[key]);
    });
  }
}

/**
 * Reset form and clear validation
 *
 * @param control - Form group or control
 */
export function resetForm(control: AbstractControl): void {
  control.reset();
  control.markAsUntouched();
  control.markAsPristine();
}

/**
 * Validate entire form
 *
 * @param control - Form group
 * @returns True if form is valid
 *
 * @example
 * ```typescript
 * if (validateForm(this.form)) {
 *   // Form is valid, submit
 * }
 * ```
 */
export function validateForm(control: AbstractControl): boolean {
  markAllAsTouched(control);
  control.updateValueAndValidity();
  return control.valid;
}
