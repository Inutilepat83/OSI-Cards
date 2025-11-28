import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { AICardConfig, CardSection, CardField } from '../../models';
import { CARD_LIMITS } from '../utils/constants';

/**
 * Validation decorators and validators for card-related inputs
 * 
 * Provides reusable validators for form controls that handle card data,
 * ensuring data integrity and preventing invalid configurations.
 */

/**
 * Validator for card title input
 * Ensures title is not empty and within length limits
 */
export function cardTitleValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    
    if (!value || typeof value !== 'string') {
      return { cardTitleRequired: true };
    }
    
    const trimmed = value.trim();
    
    if (trimmed.length === 0) {
      return { cardTitleRequired: true };
    }
    
    if (trimmed.length > CARD_LIMITS.MAX_TITLE_LENGTH) {
      return { 
        cardTitleMaxLength: { 
          maxLength: CARD_LIMITS.MAX_TITLE_LENGTH,
          actualLength: trimmed.length 
        } 
      };
    }
    
    return null;
  };
}

/**
 * Validator for card subtitle input
 * Ensures subtitle is within length limits (optional field)
 */
export function cardSubtitleValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    
    if (!value || typeof value !== 'string') {
      return null; // Subtitle is optional
    }
    
    if (value.length > CARD_LIMITS.MAX_SUBTITLE_LENGTH) {
      return { 
        cardSubtitleMaxLength: { 
          maxLength: CARD_LIMITS.MAX_SUBTITLE_LENGTH,
          actualLength: value.length 
        } 
      };
    }
    
    return null;
  };
}

/**
 * Validator for card description input
 * Ensures description is within length limits (optional field)
 */
export function cardDescriptionValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    
    if (!value || typeof value !== 'string') {
      return null; // Description is optional
    }
    
    if (value.length > CARD_LIMITS.MAX_DESCRIPTION_LENGTH) {
      return { 
        cardDescriptionMaxLength: { 
          maxLength: CARD_LIMITS.MAX_DESCRIPTION_LENGTH,
          actualLength: value.length 
        } 
      };
    }
    
    return null;
  };
}

/**
 * Validator for section title input
 * Ensures section title is not empty and within length limits
 */
export function sectionTitleValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    
    if (!value || typeof value !== 'string') {
      return { sectionTitleRequired: true };
    }
    
    const trimmed = value.trim();
    
    if (trimmed.length === 0) {
      return { sectionTitleRequired: true };
    }
    
    if (trimmed.length > 200) {
      return { 
        sectionTitleMaxLength: { 
          maxLength: 200,
          actualLength: trimmed.length 
        } 
      };
    }
    
    return null;
  };
}

/**
 * Validator for field label input
 * Ensures field label is within length limits
 */
export function fieldLabelValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    
    if (!value || typeof value !== 'string') {
      return null; // Label is optional for some field types
    }
    
    if (value.length > CARD_LIMITS.MAX_FIELD_LABEL_LENGTH) {
      return { 
        fieldLabelMaxLength: { 
          maxLength: CARD_LIMITS.MAX_FIELD_LABEL_LENGTH,
          actualLength: value.length 
        } 
      };
    }
    
    return null;
  };
}

/**
 * Validator for field value input
 * Ensures field value is within length limits
 */
export function fieldValueValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    
    if (value === null || value === undefined) {
      return null; // Value can be null/undefined
    }
    
    if (typeof value === 'string' && value.length > CARD_LIMITS.MAX_FIELD_VALUE_LENGTH) {
      return { 
        fieldValueMaxLength: { 
          maxLength: CARD_LIMITS.MAX_FIELD_VALUE_LENGTH,
          actualLength: value.length 
        } 
      };
    }
    
    return null;
  };
}

/**
 * Validator for JSON input
 * Ensures JSON is valid and parseable
 */
export function jsonValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    
    if (!value || typeof value !== 'string') {
      return { jsonRequired: true };
    }
    
    if (value.trim().length === 0) {
      return { jsonRequired: true };
    }
    
    try {
      JSON.parse(value);
      return null;
    } catch (error) {
      return { 
        jsonInvalid: { 
          message: error instanceof Error ? error.message : 'Invalid JSON' 
        } 
      };
    }
  };
}

/**
 * Validator for URL input
 * Ensures URL is valid and uses allowed protocols
 */
export function urlValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    
    if (!value || typeof value !== 'string') {
      return null; // URL is optional
    }
    
    if (value.trim().length === 0) {
      return null; // Empty string is allowed
    }
    
    try {
      const url = new URL(value);
      const allowedProtocols = ['http:', 'https:', 'mailto:'];
      
      if (!allowedProtocols.includes(url.protocol)) {
        return { 
          urlInvalidProtocol: { 
            protocol: url.protocol,
            allowedProtocols 
          } 
        };
      }
      
      return null;
    } catch {
      return { urlInvalid: true };
    }
  };
}

/**
 * Validator for email input
 * Ensures email is valid format
 */
export function emailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    
    if (!value || typeof value !== 'string') {
      return null; // Email is optional
    }
    
    if (value.trim().length === 0) {
      return null; // Empty string is allowed
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(value)) {
      return { emailInvalid: true };
    }
    
    return null;
  };
}

/**
 * Validator for tag input
 * Ensures tag is within length limits
 */
export function tagValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    
    if (!value || typeof value !== 'string') {
      return null; // Tag is optional
    }
    
    if (value.length > CARD_LIMITS.MAX_TAG_LENGTH) {
      return { 
        tagMaxLength: { 
          maxLength: CARD_LIMITS.MAX_TAG_LENGTH,
          actualLength: value.length 
        } 
      };
    }
    
    return null;
  };
}

/**
 * Validator for array length (sections, fields, items, actions)
 */
export function arrayLengthValidator(maxLength: number, fieldName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    
    if (!Array.isArray(value)) {
      return null; // Not an array, let other validators handle it
    }
    
    if (value.length > maxLength) {
      return { 
        arrayMaxLength: { 
          fieldName,
          maxLength,
          actualLength: value.length 
        } 
      };
    }
    
    return null;
  };
}



