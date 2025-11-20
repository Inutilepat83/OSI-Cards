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
