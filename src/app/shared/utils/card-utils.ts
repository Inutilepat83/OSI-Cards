import { AICardConfig, CardSection, CardField, CardItem, CardAction } from '../../models';

/**
 * Recursively remove `id` properties from complex card payloads while preserving shape.
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
 * This allows users to create cards without manually specifying IDs.
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
 * @param obj - Object to validate
 * @returns true if object has required card properties
 */
export function isValidCardConfig(obj: unknown): obj is Partial<AICardConfig> {
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
export function isValidCardSection(obj: unknown): obj is Partial<CardSection> {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return false;
  }

  const section = obj as Record<string, unknown>;

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
 * @param obj - Object to validate
 * @returns true if object has required field properties
 */
export function isValidCardField(obj: unknown): obj is Partial<CardField> {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return false;
  }

  const field = obj as Record<string, unknown>;

  // Fields need at least a label or name
  return (
    (typeof field['label'] === 'string' || typeof field['name'] === 'string') &&
    (typeof field['value'] === 'string' || typeof field['value'] === 'number' || 
     typeof field['value'] === 'boolean' || typeof field['value'] === 'object')
  );
}

/**
 * Validate JSON string against AICardConfig structure
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
        ? (parseError as any).position 
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
        preview: JSON.stringify(parsed).substring(0, 200)
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
 * Sanitize card configuration to remove any potentially unsafe properties
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
      'id', 'cardTitle', 'cardType', 'sections', 'actions', 
      'metadata', 'tags', 'priority', 'complexity'
    ];

    const cleanedRoot: Record<string, unknown> = {};
    for (const key of allowedRootKeys) {
      if (key in sanitized) {
        cleanedRoot[key] = sanitized[key as keyof AICardConfig];
      }
    }

    return cleanedRoot as Partial<AICardConfig>;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`CardUtils: Error sanitizing card config: ${msg}`);
    return config; // Return original if sanitization fails
  }
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

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
