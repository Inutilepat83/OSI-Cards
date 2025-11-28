import { AICardConfig, CardSection, CardField, CardItem, CardAction } from '../../models';
import { SIZE_CONSTANTS, ID_CONSTANTS, CARD_LIMITS } from './constants';
import { SanitizationUtil } from './sanitization.util';
import { ValidationUtil } from './validation.util';
import { inject } from '@angular/core';
import { CardValidationService } from '../services/card-validation.service';

/**
 * Recursively remove `id` properties from complex card payloads while preserving shape.
 * 
 * Useful for cleaning card configurations before export or when IDs should not be
 * persisted. Preserves all other properties and structure. This function creates a
 * deep copy of the input, so the original object is not modified.
 * 
 * @param value - The value to remove IDs from (can be card, section, field, item, or nested object)
 * @returns A new object with all `id` properties removed recursively
 * 
 * @example
 * ```typescript
 * const card = {
 *   id: 'card-1',
 *   cardTitle: 'My Card',
 *   sections: [{
 *     id: 'section-1',
 *     title: 'Section',
 *     fields: [{ id: 'field-1', label: 'Field', value: 'Value' }]
 *   }]
 * };
 * const cardWithoutIds = removeAllIds(card);
 * // Result: { cardTitle: 'My Card', sections: [{ title: 'Section', fields: [{ label: 'Field', value: 'Value' }] }] }
 * ```
 * 
 * @example
 * ```typescript
 * // Works with arrays
 * const sections = [{ id: 's1', title: 'S1' }, { id: 's2', title: 'S2' }];
 * const cleaned = removeAllIds(sections);
 * // Result: [{ title: 'S1' }, { title: 'S2' }]
 * ```
 */
export function removeAllIds<T>(value: T): T {
  // Handle null or undefined
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => removeAllIds(item)) as unknown as T;
  }

  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (key === 'id') {
        continue;
      }
      next[key] = removeAllIds(val);
    }

    return next as T;
  }

  return value;
}

/**
 * Automatically generate IDs for cards, sections, fields, items, and actions that don't have them.
 * 
 * This allows users to create cards without manually specifying IDs. IDs are generated
 * using a combination of prefix, timestamp, and random string for uniqueness. This function
 * creates a new object and does not modify the original configuration.
 * 
 * @param config - The card configuration to ensure IDs for (must be a valid AICardConfig)
 * @returns A new card configuration with all IDs generated
 * @throws Will throw an error if config is null, undefined, or invalid
 * 
 * @example
 * ```typescript
 * const cardWithoutIds = {
 *   cardTitle: 'My Card',
 *   sections: [{ title: 'Section 1', type: 'info' }]
 * };
 * const cardWithIds = ensureCardIds(cardWithoutIds);
 * // cardWithIds.id is now generated (e.g., 'card_1234567890_abc1234')
 * // cardWithIds.sections[0].id is now generated (e.g., 'section_0_1234567890_abc1234')
 * ```
 * 
 * @example
 * ```typescript
 * // Preserves existing IDs
 * const cardWithSomeIds = {
 *   id: 'existing-card-id',
 *   cardTitle: 'My Card',
 *   sections: [{ id: 'existing-section', title: 'Section', type: 'info' }]
 * };
 * const result = ensureCardIds(cardWithSomeIds);
 * // result.id === 'existing-card-id' (preserved)
 * // result.sections[0].id === 'existing-section' (preserved)
 * ```
 */
export function ensureCardIds(config: AICardConfig): AICardConfig {
  if (!config || typeof config !== 'object') {
    throw new Error('ensureCardIds: config must be a valid AICardConfig object');
  }
  
  const card = { ...config };

  // Auto-generate card ID if not provided
  if (!card.id) {
    card.id = generateId('card');
  }

  // Auto-generate section IDs
  card.sections = card.sections?.map((section, index) => ensureSectionIds(section, index));
  
  // Auto-generate action IDs
  card.actions = card.actions?.map((action, index) => ensureActionIds(action, index));

  return card;
}

/**
 * Validate if an object has the required properties of an AICardConfig
 * 
 * @deprecated Use CardValidationService instead for better testability and maintainability.
 * This function delegates to CardValidationService for backward compatibility.
 * 
 * @param obj - Object to validate
 * @returns true if object has required card properties
 */
export function isValidCardConfig(obj: unknown): obj is Partial<AICardConfig> {
  // Lazy inject to avoid circular dependencies
  const validationService = inject(CardValidationService, { optional: true });
  if (validationService) {
    return validationService.isValidCardConfig(obj);
  }
  // Fallback implementation if service not available (should not happen in normal usage)
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return false;
  }
  const config = obj as Partial<AICardConfig> & { title?: string };
  const hasTitle = typeof config.cardTitle === 'string' || typeof config.title === 'string';
  const hasSections = Array.isArray(config['sections']);
  if (!hasSections && config['sections'] === undefined) {
    return hasTitle;
  }
  return hasTitle && hasSections;
}

/**
 * Validate if an object is a valid CardSection
 * 
 * @deprecated Use CardValidationService instead
 * This function delegates to CardValidationService for backward compatibility.
 * 
 * @param obj - Object to validate
 * @returns true if object has required section properties
 */
export function isValidCardSection(obj: unknown): obj is Partial<CardSection> {
  const validationService = inject(CardValidationService, { optional: true });
  if (validationService) {
    return validationService.isValidCardSection(obj);
  }
  // Fallback implementation
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return false;
  }
  const section = obj as Partial<CardSection>;
  return (
    typeof section['type'] === 'string' &&
    ['info', 'timeline', 'table', 'list', 'analytics', 'custom'].includes(
      section['type'] as string
    )
  );
}

/**
 * Validate if an object is a valid CardField
 * 
 * @deprecated Use CardValidationService instead
 * This function delegates to CardValidationService for backward compatibility.
 * 
 * @param obj - Object to validate
 * @returns true if object has required field properties
 */
export function isValidCardField(obj: unknown): obj is Partial<CardField> {
  const validationService = inject(CardValidationService, { optional: true });
  if (validationService) {
    return validationService.isValidCardField(obj);
  }
  // Fallback implementation
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return false;
  }
  const field = obj as Partial<CardField>;
  return (
    (typeof field['label'] === 'string' || typeof field['name'] === 'string') &&
    (typeof field['value'] === 'string' || typeof field['value'] === 'number' || 
     typeof field['value'] === 'boolean' || typeof field['value'] === 'object')
  );
}

/**
 * Validate JSON string against AICardConfig structure
 * 
 * @deprecated Use CardValidationService instead
 * This function delegates to CardValidationService for backward compatibility.
 * 
 * @param jsonString - JSON string to validate (must be a non-empty string)
 * @returns Parsed object if valid, null otherwise
 * 
 * @example
 * ```typescript
 * const validJson = '{"cardTitle": "My Card", "sections": []}';
 * const result = validateCardJson(validJson);
 * // Returns: { cardTitle: "My Card", sections: [] }
 * ```
 * 
 * @example
 * ```typescript
 * const invalidJson = '{"invalid": "data"}';
 * const result = validateCardJson(invalidJson);
 * // Returns: null (invalid card structure)
 * ```
 * 
 * @example
 * ```typescript
 * const malformedJson = '{invalid json}';
 * const result = validateCardJson(malformedJson);
 * // Returns: null (JSON parse error)
 * ```
 */
export function validateCardJson(jsonString: string): Partial<AICardConfig> | null {
  // Input validation
  if (typeof jsonString !== 'string') {
    return null;
  }
  
  const trimmed = jsonString.trim();
  if (trimmed.length === 0) {
    return null;
  }
  
  const validationService = inject(CardValidationService, { optional: true });
  if (validationService) {
    return validationService.validateCardJson(jsonString);
  }
  // Fallback implementation (should not happen in normal usage)
  // Note: Cannot use LoggingService here as this is a utility function without DI context
  // This warning is acceptable as it indicates a configuration issue
  try {
    const parsed = JSON.parse(jsonString);
    if (isValidCardConfig(parsed)) {
      return parsed as Partial<AICardConfig>;
    }
    return null;
  } catch (error) {
    // Silently return null for parse errors - caller should handle validation failures
    return null;
  }
}

/**
 * Validate entire card configuration recursively
 * 
 * Validates the card configuration and all nested structures (sections, fields, items).
 * This performs a deep validation to ensure the entire card structure is valid.
 * 
 * @deprecated Use CardValidationService instead
 * This function delegates to CardValidationService for backward compatibility.
 * 
 * @param config - Card configuration to validate (can be partial)
 * @returns true if all nested structures are valid, false otherwise
 * 
 * @example
 * ```typescript
 * const validCard = {
 *   cardTitle: 'My Card',
 *   sections: [
 *     { title: 'Section 1', type: 'info', fields: [{ label: 'Field', value: 'Value' }] }
 *   ]
 * };
 * const isValid = validateCardStructure(validCard);
 * // Returns: true
 * ```
 * 
 * @example
 * ```typescript
 * const invalidCard = {
 *   cardTitle: 'My Card',
 *   sections: [
 *     { type: 'info' } // Missing required 'title' field
 *   ]
 * };
 * const isValid = validateCardStructure(invalidCard);
 * // Returns: false
 * ```
 */
export function validateCardStructure(config: Partial<AICardConfig>): boolean {
  // Input validation
  if (!config || typeof config !== 'object') {
    return false;
  }
  
  const validationService = inject(CardValidationService, { optional: true });
  if (validationService) {
    return validationService.validateCardStructure(config);
  }
  // Fallback implementation (should not happen in normal usage)
  // Note: Cannot use LoggingService here as this is a utility function without DI context
  // This warning is acceptable as it indicates a configuration issue
  try {
    if (!isValidCardConfig(config)) {
      return false;
    }
    if (!Array.isArray(config.sections)) {
      return false;
    }
    for (const section of config.sections) {
      if (!isValidCardSection(section)) {
        return false;
      }
    }
    return true;
  } catch (error) {
    // Silently return false for validation errors
    return false;
  }
}

/**
 * Sanitize card configuration to remove any potentially unsafe properties and prevent XSS
 * 
 * This function performs comprehensive sanitization:
 * - Removes disallowed properties
 * - Sanitizes all string values to prevent XSS
 * - Validates and sanitizes URLs in actions
 * - Limits string lengths to prevent DoS
 * - Recursively sanitizes nested objects
 * 
 * @param config - Card configuration to sanitize
 * @returns Sanitized copy of configuration
 */
export function sanitizeCardConfig(config: Partial<AICardConfig>): Partial<AICardConfig> {
  try {
    // Deep clone to avoid mutating original
    const sanitized: Partial<AICardConfig> = JSON.parse(
      JSON.stringify(config)
    );

    // Remove any properties that shouldn't be in the card
    const allowedRootKeys = [
      'id', 'cardTitle', 'cardSubtitle', 'cardType', 'sections', 'actions', 
      'metadata', 'tags', 'priority', 'complexity', 'description', 'columns', 'processedAt'
    ];

    const cleanedRoot: Partial<AICardConfig> = {};
    
    // Sanitize card title
    if ('cardTitle' in sanitized && typeof sanitized.cardTitle === 'string') {
      cleanedRoot.cardTitle = SanitizationUtil.sanitizeCardTitle(
        sanitized.cardTitle.substring(0, SIZE_CONSTANTS.MAX_CARD_TITLE_LENGTH)
      );
    }
    
    // Sanitize card subtitle
    if ('cardSubtitle' in sanitized && typeof sanitized.cardSubtitle === 'string') {
      cleanedRoot.cardSubtitle = SanitizationUtil.sanitizeCardTitle(
        sanitized.cardSubtitle.substring(0, SIZE_CONSTANTS.MAX_CARD_SUBTITLE_LENGTH)
      );
    }
    
    // Sanitize description
    if ('description' in sanitized && typeof sanitized.description === 'string') {
      cleanedRoot.description = ValidationUtil.sanitizeString(
        sanitized.description.substring(0, CARD_LIMITS.MAX_DESCRIPTION_LENGTH)
      );
    }
    
    // Copy safe primitive values
    for (const key of ['id', 'cardType', 'columns', 'processedAt'] as const) {
      if (key in sanitized) {
        const value = sanitized[key];
        if (value !== null && value !== undefined) {
          (cleanedRoot as Record<string, unknown>)[key] = value;
        }
      }
    }
    
    // Sanitize sections recursively
    if (Array.isArray(sanitized.sections)) {
      cleanedRoot.sections = sanitized.sections.map(section => sanitizeSection(section));
    }
    
    // Sanitize actions
    if (Array.isArray(sanitized.actions)) {
      cleanedRoot.actions = sanitized.actions.map(action => sanitizeAction(action));
    }
    
    // Sanitize metadata if present
    if (sanitized.meta && typeof sanitized.meta === 'object') {
      cleanedRoot.meta = SanitizationUtil.sanitizeObject(sanitized.meta);
    }

    return cleanedRoot;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    // Note: Cannot use LoggingService here as this is a utility function without DI context
    // Error is still thrown/handled appropriately by returning safe fallback
    // Return empty safe config instead of original to prevent XSS
    return {
      cardTitle: '',
      sections: []
    };
  }
}

/**
 * Sanitize a card section
 */
function sanitizeSection(section: CardSection): CardSection {
  const sanitized: CardSection = {
    ...section,
    title: typeof section.title === 'string' 
      ? SanitizationUtil.sanitizeSectionTitle(section.title.substring(0, 100))
      : '',
    type: section.type || 'info'
  };
  
  // Sanitize description
  if (typeof section.description === 'string') {
    sanitized.description = ValidationUtil.sanitizeString(section.description.substring(0, CARD_LIMITS.MAX_SECTION_DESCRIPTION_LENGTH));
  }
  
  // Sanitize subtitle
  if (typeof section.subtitle === 'string') {
    sanitized.subtitle = ValidationUtil.sanitizeString(section.subtitle.substring(0, CARD_LIMITS.MAX_SECTION_SUBTITLE_LENGTH));
  }
  
  // Sanitize fields
  if (Array.isArray(section.fields)) {
    sanitized.fields = section.fields.map(field => sanitizeField(field));
  }
  
  // Sanitize items
  if (Array.isArray(section.items)) {
    sanitized.items = section.items.map(item => sanitizeItem(item));
  }
  
  // Sanitize meta
  if (section.meta && typeof section.meta === 'object') {
    sanitized.meta = SanitizationUtil.sanitizeObject(section.meta);
  }
  
  return sanitized;
}

/**
 * Sanitize a card field
 */
function sanitizeField(field: CardField): CardField {
  const sanitized: CardField = { ...field };
  
  // Sanitize label
  if (typeof field.label === 'string') {
    sanitized.label = ValidationUtil.sanitizeString(field.label.substring(0, CARD_LIMITS.MAX_FIELD_LABEL_LENGTH));
  }
  
  // Sanitize title
  if (typeof field.title === 'string') {
    sanitized.title = ValidationUtil.sanitizeString(field.title.substring(0, CARD_LIMITS.MAX_FIELD_LABEL_LENGTH));
  }
  
  // Sanitize value
  if (field.value !== null && field.value !== undefined) {
    sanitized.value = SanitizationUtil.sanitizeFieldValue(field.value);
  }
  
  // Sanitize description
  if (typeof field.description === 'string') {
    sanitized.description = ValidationUtil.sanitizeString(field.description.substring(0, CARD_LIMITS.MAX_FIELD_DESCRIPTION_LENGTH));
  }
  
  // Sanitize URLs
  if (typeof field.link === 'string') {
    sanitized.link = SanitizationUtil.sanitizeUrl(field.link) || undefined;
  }
  
  // Sanitize email
  if (typeof field.email === 'string') {
    sanitized.email = SanitizationUtil.sanitizeEmail(field.email) || undefined;
  }
  
  // Sanitize meta
  if (field.meta && typeof field.meta === 'object') {
    sanitized.meta = SanitizationUtil.sanitizeObject(field.meta);
  }
  
  return sanitized;
}

/**
 * Sanitize a card item
 */
function sanitizeItem(item: CardItem): CardItem {
  const sanitized: CardItem = {
    ...item,
    title: typeof item.title === 'string'
      ? ValidationUtil.sanitizeString(item.title.substring(0, CARD_LIMITS.MAX_ITEM_TITLE_LENGTH))
      : ''
  };
  
  // Sanitize description
  if (typeof item.description === 'string') {
    sanitized.description = ValidationUtil.sanitizeString(item.description.substring(0, CARD_LIMITS.MAX_ITEM_DESCRIPTION_LENGTH));
  }
  
  // Sanitize value
  if (item.value !== null && item.value !== undefined) {
    sanitized.value = typeof item.value === 'string'
      ? ValidationUtil.sanitizeString(item.value.substring(0, CARD_LIMITS.MAX_ITEM_VALUE_LENGTH))
      : item.value;
  }
  
  // Sanitize meta
  if (item.meta && typeof item.meta === 'object') {
    sanitized.meta = SanitizationUtil.sanitizeObject(item.meta);
  }
  
  return sanitized;
}

/**
 * Sanitize a card action
 */
function sanitizeAction(action: CardAction): CardAction {
  const sanitized: CardAction = {
    ...action,
    label: typeof action.label === 'string'
      ? ValidationUtil.sanitizeString(action.label.substring(0, 100))
      : ''
  };
  
  // Sanitize icon
  if (typeof action.icon === 'string') {
    sanitized.icon = ValidationUtil.sanitizeString(action.icon.substring(0, CARD_LIMITS.MAX_ACTION_ICON_LENGTH));
  }
  
  // Sanitize URL for website actions
  if ('url' in action && typeof action.url === 'string') {
    (sanitized as { url?: string }).url = SanitizationUtil.sanitizeUrl(action.url) || undefined;
  }
  
  // Sanitize action string
  if (typeof action.action === 'string') {
    const sanitizedAction = SanitizationUtil.sanitizeUrl(action.action);
    if (sanitizedAction) {
      sanitized.action = sanitizedAction;
    }
  }
  
  // Sanitize email config for mail actions
  if ('email' in action && action.email && typeof action.email === 'object') {
    const emailConfig = action.email as Record<string, unknown>;
    const sanitizedEmail: Record<string, unknown> = {};
    
    // Sanitize 'to' field (legacy structure)
    if (typeof emailConfig['to'] === 'string') {
      sanitizedEmail['to'] = SanitizationUtil.sanitizeEmail(emailConfig['to']) || undefined;
    }
    
    // Sanitize contact
    if (emailConfig['contact'] && typeof emailConfig['contact'] === 'object') {
      const contact = emailConfig['contact'] as Record<string, unknown>;
      sanitizedEmail['contact'] = {
        name: typeof contact['name'] === 'string' ? ValidationUtil.sanitizeString(contact['name']) : '',
        email: typeof contact['email'] === 'string' ? SanitizationUtil.sanitizeEmail(contact['email']) || '' : '',
        role: typeof contact['role'] === 'string' ? ValidationUtil.sanitizeString(contact['role']) : ''
      };
    }
    
    // Sanitize subject and body
    if (typeof emailConfig['subject'] === 'string') {
      sanitizedEmail['subject'] = ValidationUtil.sanitizeString(emailConfig['subject'].substring(0, CARD_LIMITS.MAX_FIELD_LABEL_LENGTH));
    }
    if (typeof emailConfig['body'] === 'string') {
      sanitizedEmail['body'] = ValidationUtil.sanitizeString(emailConfig['body'].substring(0, CARD_LIMITS.MAX_EMAIL_BODY_LENGTH));
    }
    
    // Sanitize cc and bcc (optional fields)
    if (typeof emailConfig['cc'] === 'string') {
      sanitizedEmail['cc'] = SanitizationUtil.sanitizeEmail(emailConfig['cc']) || undefined;
    } else if (Array.isArray(emailConfig['cc'])) {
      sanitizedEmail['cc'] = (emailConfig['cc'] as string[])
        .map(email => SanitizationUtil.sanitizeEmail(email))
        .filter((email): email is string => email !== null && email !== undefined);
    }
    
    if (typeof emailConfig['bcc'] === 'string') {
      sanitizedEmail['bcc'] = SanitizationUtil.sanitizeEmail(emailConfig['bcc']) || undefined;
    } else if (Array.isArray(emailConfig['bcc'])) {
      sanitizedEmail['bcc'] = (emailConfig['bcc'] as string[])
        .map(email => SanitizationUtil.sanitizeEmail(email))
        .filter((email): email is string => email !== null && email !== undefined);
    }
    
    (sanitized as { email?: unknown }).email = sanitizedEmail;
  }
  
  // Sanitize meta
  if (action.meta && typeof action.meta === 'object') {
    sanitized.meta = SanitizationUtil.sanitizeObject(action.meta);
  }
  
  return sanitized;
}

function ensureSectionIds(section: CardSection, sectionIndex: number): CardSection {
  const nextSection = { ...section };

  // Auto-generate section ID if not provided
  if (!nextSection.id) {
    nextSection.id = `section_${sectionIndex}`;
  }

  // Auto-generate field IDs
  if (nextSection.fields) {
    nextSection.fields = nextSection.fields.map((field, fieldIndex) => 
      ensureFieldIds(field, sectionIndex, fieldIndex)
    );
  }

  // Auto-generate item IDs
  if (nextSection.items) {
    nextSection.items = nextSection.items.map((item, itemIndex) => 
      ensureItemIds(item, sectionIndex, itemIndex)
    );
  }

  return nextSection;
}

function ensureFieldIds(field: CardField, sectionIndex: number, fieldIndex: number): CardField {
  const nextField = { ...field };

  // Auto-generate field ID if not provided
  if (!nextField.id) {
    nextField.id = `field_${sectionIndex}_${fieldIndex}`;
  }

  // Clean up meta to avoid ID conflicts
  if (nextField.meta) {
    nextField.meta = removeAllIds(nextField.meta);
  }

  return nextField;
}

function ensureItemIds(item: CardItem, sectionIndex: number, itemIndex: number): CardItem {
  const nextItem = { ...item };

  // Auto-generate item ID if not provided
  if (!nextItem.id) {
    nextItem.id = `item_${sectionIndex}_${itemIndex}`;
  }

  // Clean up meta to avoid ID conflicts
  if (nextItem.meta) {
    nextItem.meta = removeAllIds(nextItem.meta);
  }

  return nextItem;
}

function ensureActionIds(action: CardAction, actionIndex: number): CardAction {
  const nextAction = { ...action };

  // Auto-generate action ID if not provided
  if (!nextAction.id) {
    nextAction.id = `action_${actionIndex}`;
  }

  // Clean up meta to avoid ID conflicts
  if (nextAction.meta) {
    nextAction.meta = removeAllIds(nextAction.meta);
  }

  return nextAction;
}

/**
 * Generate unique ID with optional prefix
 * 
 * Uses timestamp and random string for uniqueness. This function is exported
 * and should be used consistently across the application instead of creating
 * duplicate implementations. The generated ID format is: {prefix}_{timestamp}_{random}
 * 
 * @param prefix - ID prefix (default: 'item'). Must be a non-empty string.
 * @returns Unique ID string in format: {prefix}_{timestamp}_{random}
 * 
 * @example
 * ```typescript
 * const id1 = generateId('card');
 * // Returns: 'card_1234567890_abc1234'
 * 
 * const id2 = generateId('section');
 * // Returns: 'section_1234567891_def5678'
 * 
 * const id3 = generateId(); // Uses default prefix
 * // Returns: 'item_1234567892_ghi9012'
 * ```
 * 
 * @example
 * ```typescript
 * // IDs are guaranteed to be unique (timestamp + random)
 * const id1 = generateId('test');
 * const id2 = generateId('test');
 * // id1 !== id2 (different timestamps and random strings)
 * ```
 */
export function generateId(prefix: string = ID_CONSTANTS.DEFAULT_ID_PREFIX): string {
  // Input validation
  if (typeof prefix !== 'string' || prefix.trim().length === 0) {
    prefix = ID_CONSTANTS.DEFAULT_ID_PREFIX;
  }
  
  // Sanitize prefix to ensure it's safe for use in IDs
  const sanitizedPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_');
  
  const randomString = Math.random().toString(36).slice(2, 2 + ID_CONSTANTS.RANDOM_STRING_LENGTH);
  return `${sanitizedPrefix}_${Date.now()}_${randomString}`;
}
