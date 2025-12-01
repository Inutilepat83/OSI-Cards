import { inject, Injectable } from '@angular/core';
import { AICardConfig, CardField, CardSection } from '../../models';
import { AppConfigService } from '../../core/services/app-config.service';

/**
 * Card Validation Service
 *
 * Centralized service for validating card configurations, sections, fields, and items.
 * Extracted from card-utils.ts to improve testability and maintainability.
 *
 * Features:
 * - Card configuration validation
 * - Section validation
 * - Field validation
 * - Item validation
 * - JSON structure validation
 * - Recursive structure validation
 *
 * @example
 * ```typescript
 * const validationService = inject(CardValidationService);
 *
 * // Validate card config
 * if (validationService.isValidCardConfig(cardData)) {
 *   // Process card
 * }
 *
 * // Validate JSON string
 * const parsed = validationService.validateCardJson(jsonString);
 * if (parsed) {
 *   // Use parsed card
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class CardValidationService {
  private readonly appConfig = inject(AppConfigService);

  /**
   * Validate if an object has the required properties of an AICardConfig
   * @param obj - Object to validate
   * @returns true if object has required card properties
   */
  isValidCardConfig(obj: unknown): obj is Partial<AICardConfig> {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return false;
    }

    const config = obj as Record<string, unknown>;

    // Check required fields for a card
    // Be lenient: accept either cardTitle or title, and ensure sections is an array (even if empty)
    const hasTitle = typeof config['cardTitle'] === 'string' || typeof config['title'] === 'string';
    const hasSections = Array.isArray(config['sections']);

    // If sections is missing or not an array, try to create an empty array
    if (!hasSections && config['sections'] === undefined) {
      // This is acceptable - we can add sections later
      return hasTitle;
    }

    return hasTitle && hasSections;
  }

  /**
   * Validate if an object is a valid CardSection
   * @param obj - Object to validate
   * @returns true if object has required section properties
   */
  isValidCardSection(obj: unknown): obj is Partial<CardSection> {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return false;
    }

    const section = obj as Record<string, unknown>;

    // Check required section properties
    return (
      typeof section['type'] === 'string' &&
      ['info', 'timeline', 'table', 'list', 'analytics', 'custom'].includes(section['type'] as string)
    );
  }

  /**
   * Validate if an object is a valid CardField
   * @param obj - Object to validate
   * @returns true if object has required field properties
   */
  isValidCardField(obj: unknown): obj is Partial<CardField> {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return false;
    }

    const field = obj as Record<string, unknown>;

    // Fields need at least a label or name
    return (
      (typeof field['label'] === 'string' || typeof field['name'] === 'string') &&
      (typeof field['value'] === 'string' ||
        typeof field['value'] === 'number' ||
        typeof field['value'] === 'boolean' ||
        typeof field['value'] === 'object')
    );
  }

  /**
   * Maximum allowed JSON input size (1MB)
   */
  private readonly MAX_JSON_SIZE = 1024 * 1024; // 1MB

  /**
   * Validate JSON string against AICardConfig structure
   * @param jsonString - JSON string to validate
   * @returns Parsed object if valid, null otherwise
   */
  validateCardJson(jsonString: string): Partial<AICardConfig> | null {
    try {
      // Validate input
      if (typeof jsonString !== 'string' || jsonString.trim().length === 0) {
        console.warn('CardValidationService: Empty JSON string provided');
        return null;
      }

      // Check size limit to prevent DoS attacks
      const sizeInBytes = new Blob([jsonString]).size;
      if (sizeInBytes > this.MAX_JSON_SIZE) {
        console.error(
          `CardValidationService: JSON input size (${sizeInBytes} bytes) exceeds maximum allowed size (${this.MAX_JSON_SIZE} bytes)`
        );
        return null;
      }

      // Parse JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonString);
      } catch (parseError: unknown) {
        const msg = parseError instanceof Error ? parseError.message : 'Unknown error';
        const position =
          parseError instanceof SyntaxError && 'position' in parseError
            ? (parseError as { position?: number }).position
            : null;
        console.error(
          `CardValidationService: JSON parse failed: ${msg}${position ? ` at position ${position}` : ''}`
        );
        return null;
      }

      // Validate structure
      if (!this.isValidCardConfig(parsed)) {
        const config = parsed as Record<string, unknown>;
        const hasTitle = typeof config['cardTitle'] === 'string' || typeof config['title'] === 'string';
        const hasSections = Array.isArray(config['sections']);
        const sectionsType = config['sections'] !== undefined ? typeof config['sections'] : 'undefined';

        console.error('CardValidationService: Parsed JSON does not match AICardConfig structure', {
          hasTitle,
          hasSections,
          sectionsType,
          keys: Object.keys(config),
          preview: JSON.stringify(parsed).substring(0, 200),
        });

        // Try to fix common issues: normalize title field
        if (!hasTitle && typeof config['title'] === 'string') {
          config['cardTitle'] = config['title'];
          delete config['title'];
        }

        // Try to fix missing sections
        if (!hasSections && config['sections'] === undefined) {
          config['sections'] = [];
        }

        // Re-validate after fixes
        if (this.isValidCardConfig(config)) {
          console.warn('CardValidationService: Fixed common issues in JSON structure');
          return config as Partial<AICardConfig>;
        }

        return null;
      }

      return parsed as Partial<AICardConfig>;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`CardValidationService: Unexpected error in validateCardJson: ${msg}`, error);
      return null;
    }
  }

  /**
   * Validate entire card configuration recursively
   * @param config - Card configuration to validate
   * @returns true if all nested structures are valid
   */
  validateCardStructure(config: Partial<AICardConfig>): boolean {
    try {
      // Check root level
      if (!this.isValidCardConfig(config)) {
        return false;
      }

      // Check sections
      if (!Array.isArray(config.sections)) {
        return false;
      }

      // Validate section count
      const maxSections = this.appConfig.CARD_LIMITS.MAX_SECTIONS;
      if (config.sections.length > maxSections) {
        console.warn(
          `CardValidationService: Card has ${config.sections.length} sections, exceeding limit of ${maxSections}`
        );
        return false;
      }

      for (const section of config.sections) {
        if (!this.isValidCardSection(section)) {
          return false;
        }

        // Check fields in section
        if (Array.isArray(section.fields)) {
          const maxFields = this.appConfig.CARD_LIMITS.MAX_FIELDS_PER_SECTION;
          if (section.fields.length > maxFields) {
            console.warn(
              `CardValidationService: Section has ${section.fields.length} fields, exceeding limit of ${maxFields}`
            );
            return false;
          }

          for (const field of section.fields) {
            if (!this.isValidCardField(field)) {
              return false;
            }
          }
        }

        // Check items in section
        if (Array.isArray(section.items)) {
          for (const item of section.items) {
            if (typeof item !== 'object' || item === null) {
              return false;
            }
          }
        }
      }

      return true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`CardValidationService: Error validating card structure: ${msg}`);
      return false;
    }
  }

  /**
   * Validate card title length
   * @param title - Title to validate
   * @returns true if title is within valid length
   */
  isValidCardTitle(title: string): boolean {
    const maxLength = this.appConfig.CARD_LIMITS.MAX_TITLE_LENGTH;
    const minLength = this.appConfig.VALIDATION.MIN_CARD_TITLE_LENGTH;
    return title.length >= minLength && title.length <= maxLength;
  }

  /**
   * Validate section title length
   * @param title - Title to validate
   * @returns true if title is within valid length
   */
  isValidSectionTitle(title: string): boolean {
    const maxLength = this.appConfig.VALIDATION.MAX_SECTION_TITLE_LENGTH;
    const minLength = this.appConfig.VALIDATION.MIN_SECTION_TITLE_LENGTH;
    return title.length >= minLength && title.length <= maxLength;
  }
}
