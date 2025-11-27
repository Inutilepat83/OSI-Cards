import { AICardConfig, CardSection, CardField, CardItem, CardAction } from '../../models';
import { SIZE_CONSTANTS, ID_CONSTANTS } from './constants';
import { SanitizationUtil } from './sanitization.util';
import { ValidationUtil } from './validation.util';

/**
 * Recursively remove `id` properties from complex card payloads while preserving shape.
 * 
 * Useful for cleaning card configurations before export or when IDs should not be
 * persisted. Preserves all other properties and structure.
 * 
 * @param value - The value to remove IDs from (can be card, section, field, item, or nested object)
 * @returns A new object with all `id` properties removed
 * 
 * @example
 * ```typescript
 * const cardWithoutIds = removeAllIds(myCard);
 * // All id properties removed recursively
 * ```
 */
export function removeAllIds<T>(value: T): T {
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
 * using a combination of prefix, timestamp, and random string for uniqueness.
 * 
 * @param config - The card configuration to ensure IDs for
 * @returns A new card configuration with all IDs generated
 * 
 * @example
 * ```typescript
 * const cardWithoutIds = {
 *   cardTitle: 'My Card',
 *   sections: [{ title: 'Section 1', type: 'info' }]
 * };
 * const cardWithIds = ensureCardIds(cardWithoutIds);
 * // cardWithIds.id, cardWithIds.sections[0].id are now generated
 * ```
 */
export function ensureCardIds(config: AICardConfig): AICardConfig {
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
 * These functions are kept for backward compatibility. For new code, inject CardValidationService directly.
 * 
 * @param obj - Object to validate
 * @returns true if object has required card properties
 */
export function isValidCardConfig(obj: unknown): obj is Partial<AICardConfig> {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return false;
  }

  // Use proper interface instead of Record<string, unknown>
  const config = obj as Partial<AICardConfig> & { title?: string };

  // Check required fields for a card
  // Be lenient: accept either cardTitle or title, and ensure sections is an array (even if empty)
  const hasTitle = typeof config.cardTitle === 'string' || typeof config.title === 'string';
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
 * 
 * @deprecated Use CardValidationService instead
 * 
 * @param obj - Object to validate
 * @returns true if object has required section properties
 */
export function isValidCardSection(obj: unknown): obj is Partial<CardSection> {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return false;
  }

  // Use proper interface instead of Record<string, unknown>
  const section = obj as Partial<CardSection>;

  // Check required section properties
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
 * 
 * @param obj - Object to validate
 * @returns true if object has required field properties
 */
export function isValidCardField(obj: unknown): obj is Partial<CardField> {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return false;
  }

  // Use proper interface instead of Record<string, unknown>
  const field = obj as Partial<CardField>;

  // Fields need at least a label or name
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
 * 
 * @param jsonString - JSON string to validate
 * @returns Parsed object if valid, null otherwise
 */
export function validateCardJson(jsonString: string): Partial<AICardConfig> | null {
  try {
    // Validate input
    if (typeof jsonString !== 'string' || jsonString.trim().length === 0) {
      console.warn('CardUtils: Empty JSON string provided');
      return null;
    }

    // Parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch (parseError: unknown) {
      const msg = parseError instanceof Error ? parseError.message : 'Unknown error';
      const position = parseError instanceof SyntaxError && 'position' in parseError 
        ? (parseError as { position?: number }).position 
        : null;
      console.error(`CardUtils: JSON parse failed: ${msg}${position ? ` at position ${position}` : ''}`);
      return null;
    }

    // Validate structure
    if (!isValidCardConfig(parsed)) {
      const config = parsed as Record<string, unknown>;
      const hasTitle = typeof config['cardTitle'] === 'string' || typeof config['title'] === 'string';
      const hasSections = Array.isArray(config['sections']);
      const sectionsType = config['sections'] !== undefined ? typeof config['sections'] : 'undefined';
      
      console.error('CardUtils: Parsed JSON does not match AICardConfig structure', {
        hasTitle,
        hasSections,
        sectionsType,
        keys: Object.keys(config),
        preview: JSON.stringify(parsed).substring(0, SIZE_CONSTANTS.JSON_PREVIEW_LENGTH)
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
      if (isValidCardConfig(config)) {
        console.warn('CardUtils: Fixed common issues in JSON structure');
        return config as Partial<AICardConfig>;
      }
      
      return null;
    }

    return parsed as Partial<AICardConfig>;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`CardUtils: Unexpected error in validateCardJson: ${msg}`, error);
    return null;
  }
}

/**
 * Validate entire card configuration recursively
 * 
 * @deprecated Use CardValidationService instead
 * 
 * @param config - Card configuration to validate
 * @returns true if all nested structures are valid
 */
export function validateCardStructure(config: Partial<AICardConfig>): boolean {
  try {
    // Check root level
    if (!isValidCardConfig(config)) {
      return false;
    }

    // Check sections
    if (!Array.isArray(config.sections)) {
      return false;
    }

    for (const section of config.sections) {
      if (!isValidCardSection(section)) {
        return false;
      }

      // Check fields in section
      if (Array.isArray(section.fields)) {
        for (const field of section.fields) {
          if (!isValidCardField(field)) {
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
    console.error(`CardUtils: Error validating card structure: ${msg}`);
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
        sanitized.description.substring(0, 1000)
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
    console.error(`CardUtils: Error sanitizing card config: ${msg}`, error);
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
    sanitized.description = ValidationUtil.sanitizeString(section.description.substring(0, 500));
  }
  
  // Sanitize subtitle
  if (typeof section.subtitle === 'string') {
    sanitized.subtitle = ValidationUtil.sanitizeString(section.subtitle.substring(0, 200));
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
    sanitized.label = ValidationUtil.sanitizeString(field.label.substring(0, 200));
  }
  
  // Sanitize title
  if (typeof field.title === 'string') {
    sanitized.title = ValidationUtil.sanitizeString(field.title.substring(0, 200));
  }
  
  // Sanitize value
  if (field.value !== null && field.value !== undefined) {
    sanitized.value = SanitizationUtil.sanitizeFieldValue(field.value);
  }
  
  // Sanitize description
  if (typeof field.description === 'string') {
    sanitized.description = ValidationUtil.sanitizeString(field.description.substring(0, 500));
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
      ? ValidationUtil.sanitizeString(item.title.substring(0, 200))
      : ''
  };
  
  // Sanitize description
  if (typeof item.description === 'string') {
    sanitized.description = ValidationUtil.sanitizeString(item.description.substring(0, 500));
  }
  
  // Sanitize value
  if (item.value !== null && item.value !== undefined) {
    sanitized.value = typeof item.value === 'string'
      ? ValidationUtil.sanitizeString(item.value.substring(0, 200))
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
    sanitized.icon = ValidationUtil.sanitizeString(action.icon.substring(0, 50));
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
      sanitizedEmail['subject'] = ValidationUtil.sanitizeString(emailConfig['subject'].substring(0, 200));
    }
    if (typeof emailConfig['body'] === 'string') {
      sanitizedEmail['body'] = ValidationUtil.sanitizeString(emailConfig['body'].substring(0, 5000));
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
 * duplicate implementations.
 * 
 * @param prefix - ID prefix (default: 'item')
 * @returns Unique ID string in format: {prefix}_{timestamp}_{random}
 */
export function generateId(prefix: string = ID_CONSTANTS.DEFAULT_ID_PREFIX): string {
  const randomString = Math.random().toString(36).slice(2, 2 + ID_CONSTANTS.RANDOM_STRING_LENGTH);
  return `${prefix}_${Date.now()}_${randomString}`;
}
