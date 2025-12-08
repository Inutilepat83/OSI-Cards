/**
 * Validation Directives
 *
 * A collection of 10 validation directives for forms.
 *
 * Directives:
 * 1. EmailValidator
 * 2. URLValidator
 * 3. PhoneValidator
 * 4. MinLengthValidator
 * 5. MaxLengthValidator
 * 6. PatternValidator
 * 7. RangeValidator
 * 8. RequiredValidator
 * 9. MatchValidator
 * 10. CustomValidator
 */

import { Directive, Input, forwardRef } from '@angular/core';
import { NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * 1. Email Validator Directive
 */
@Directive({
  selector: '[emailValidator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => EmailValidatorDirective),
      multi: true,
    },
  ],
  standalone: true,
})
export class EmailValidatorDirective implements Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(control.value) ? null : { email: true };
  }
}

/**
 * 2. URL Validator Directive
 */
@Directive({
  selector: '[urlValidator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => URLValidatorDirective),
      multi: true,
    },
  ],
  standalone: true,
})
export class URLValidatorDirective implements Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b/;
    return urlRegex.test(control.value) ? null : { url: true };
  }
}

/**
 * 3. Phone Validator Directive
 */
@Directive({
  selector: '[phoneValidator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PhoneValidatorDirective),
      multi: true,
    },
  ],
  standalone: true,
})
export class PhoneValidatorDirective implements Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return phoneRegex.test(control.value) ? null : { phone: true };
  }
}

/**
 * 4. Min Length Validator Directive
 */
@Directive({
  selector: '[minLengthValidator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MinLengthValidatorDirective),
      multi: true,
    },
  ],
  standalone: true,
})
export class MinLengthValidatorDirective implements Validator {
  @Input() minLengthValidator!: number;

  validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const length = control.value.length;
    return length >= this.minLengthValidator
      ? null
      : {
          minLength: { required: this.minLengthValidator, actual: length },
        };
  }
}

/**
 * 5. Max Length Validator Directive
 */
@Directive({
  selector: '[maxLengthValidator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MaxLengthValidatorDirective),
      multi: true,
    },
  ],
  standalone: true,
})
export class MaxLengthValidatorDirective implements Validator {
  @Input() maxLengthValidator!: number;

  validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const length = control.value.length;
    return length <= this.maxLengthValidator
      ? null
      : {
          maxLength: { required: this.maxLengthValidator, actual: length },
        };
  }
}

/**
 * 6. Pattern Validator Directive
 */
@Directive({
  selector: '[patternValidator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PatternValidatorDirective),
      multi: true,
    },
  ],
  standalone: true,
})
export class PatternValidatorDirective implements Validator {
  @Input() patternValidator!: string | RegExp;

  validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const regex =
      typeof this.patternValidator === 'string'
        ? new RegExp(this.patternValidator)
        : this.patternValidator;

    return regex.test(control.value) ? null : { pattern: true };
  }
}

/**
 * 7. Range Validator Directive
 */
@Directive({
  selector: '[rangeValidator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => RangeValidatorDirective),
      multi: true,
    },
  ],
  standalone: true,
})
export class RangeValidatorDirective implements Validator {
  @Input() rangeMin!: number;
  @Input() rangeMax!: number;

  validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const value = parseFloat(control.value);
    if (isNaN(value)) return { number: true };

    return value >= this.rangeMin && value <= this.rangeMax
      ? null
      : {
          range: { min: this.rangeMin, max: this.rangeMax, actual: value },
        };
  }
}

/**
 * 8. Required Validator Directive
 */
@Directive({
  selector: '[requiredValidator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => RequiredValidatorDirective),
      multi: true,
    },
  ],
  standalone: true,
})
export class RequiredValidatorDirective implements Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    return value && value.trim() ? null : { required: true };
  }
}

/**
 * 9. Match Validator Directive
 */
@Directive({
  selector: '[matchValidator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MatchValidatorDirective),
      multi: true,
    },
  ],
  standalone: true,
})
export class MatchValidatorDirective implements Validator {
  @Input() matchValidator!: string;

  validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || !control.parent) return null;

    const matchControl = control.parent.get(this.matchValidator);
    if (!matchControl) return null;

    return control.value === matchControl.value ? null : { match: true };
  }
}

/**
 * 10. Custom Validator Directive
 */
@Directive({
  selector: '[customValidator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => CustomValidatorDirective),
      multi: true,
    },
  ],
  standalone: true,
})
export class CustomValidatorDirective implements Validator {
  @Input() customValidator!: (value: any) => boolean;
  @Input() customValidatorError = 'invalid';

  validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    return this.customValidator(control.value)
      ? null
      : {
          [this.customValidatorError]: true,
        };
  }
}

// Export all directives
export const VALIDATION_DIRECTIVES = [
  EmailValidatorDirective,
  URLValidatorDirective,
  PhoneValidatorDirective,
  MinLengthValidatorDirective,
  MaxLengthValidatorDirective,
  PatternValidatorDirective,
  RangeValidatorDirective,
  RequiredValidatorDirective,
  MatchValidatorDirective,
  CustomValidatorDirective,
];



