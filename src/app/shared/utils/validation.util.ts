import { AICardConfig, CardSection, CardField, CardItem } from '../../models';

/**
 * Validation utilities for card configurations
 * Provides comprehensive validation at multiple stages
 */
export class ValidationUtil {
  /**
   * Validate card configuration
   */
  static validateCard(card: Partial<AICardConfig>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate card title
    if (!card.cardTitle || typeof card.cardTitle !== 'string') {
      errors.push('Card title is required and must be a string');
    } else if (card.cardTitle.length < 1) {
      errors.push('Card title must be at least 1 character long');
    } else if (card.cardTitle.length > 200) {
      errors.push('Card title must be at most 200 characters long');
    }

    // Validate sections
    if (!card.sections || !Array.isArray(card.sections)) {
      errors.push('Card must have a sections array');
    } else if (card.sections.length === 0) {
      errors.push('Card must have at least one section');
    } else {
      card.sections.forEach((section, index) => {
        const sectionErrors = this.validateSection(section, index);
        errors.push(...sectionErrors);
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate section
   */
  static validateSection(section: Partial<CardSection>, index: number): string[] {
    const errors: string[] = [];
    const prefix = `Section ${index + 1}`;

    // Validate section title
    if (!section.title || typeof section.title !== 'string') {
      errors.push(`${prefix}: Title is required and must be a string`);
    } else if (section.title.length < 1) {
      errors.push(`${prefix}: Title must be at least 1 character long`);
    } else if (section.title.length > 100) {
      errors.push(`${prefix}: Title must be at most 100 characters long`);
    }

    // Validate section type
    if (!section.type || typeof section.type !== 'string') {
      errors.push(`${prefix}: Type is required and must be a string`);
    }

    // Validate fields if present
    if (section.fields && Array.isArray(section.fields)) {
      if (section.fields.length > 1000) {
        errors.push(`${prefix}: Cannot have more than 1000 fields`);
      }
      section.fields.forEach((field, fieldIndex) => {
        const fieldErrors = this.validateField(field, index, fieldIndex);
        errors.push(...fieldErrors);
      });
    }

    // Validate items if present
    if (section.items && Array.isArray(section.items)) {
      if (section.items.length > 1000) {
        errors.push(`${prefix}: Cannot have more than 1000 items`);
      }
      section.items.forEach((item, itemIndex) => {
        const itemErrors = this.validateItem(item, index, itemIndex);
        errors.push(...itemErrors);
      });
    }

    return errors;
  }

  /**
   * Validate field
   */
  static validateField(field: Partial<CardField>, sectionIndex: number, fieldIndex: number): string[] {
    const errors: string[] = [];
    const prefix = `Section ${sectionIndex + 1}, Field ${fieldIndex + 1}`;

    // Field must have at least a label or title
    if (!field.label && !field.title) {
      errors.push(`${prefix}: Field must have either a label or title`);
    }

    // Validate value type
    if (field.value !== undefined && field.value !== null) {
      const validTypes = ['string', 'number', 'boolean'];
      if (!validTypes.includes(typeof field.value)) {
        errors.push(`${prefix}: Field value must be a string, number, or boolean`);
      }
    }

    return errors;
  }

  /**
   * Validate item
   */
  static validateItem(item: Partial<CardItem>, sectionIndex: number, itemIndex: number): string[] {
    const errors: string[] = [];
    const prefix = `Section ${sectionIndex + 1}, Item ${itemIndex + 1}`;

    // Item must have a title
    if (!item.title || typeof item.title !== 'string') {
      errors.push(`${prefix}: Item must have a title string`);
    }

    return errors;
  }

  /**
   * Sanitize string input to prevent XSS
   */
  static sanitizeString(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  /**
   * Validate and sanitize card title
   */
  static sanitizeCardTitle(title: string): string {
    if (typeof title !== 'string') {
      return '';
    }
    return this.sanitizeString(title.substring(0, 200));
  }

  /**
   * Validate URL
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate email
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}


