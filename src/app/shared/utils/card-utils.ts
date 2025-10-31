import { AICardConfig, CardSection, CardField, CardItem, CardAction } from '../../models';

type WithOptionalId<T> = T & { id?: string };

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
 * Ensure card payloads include IDs where consumers expect them.
 */
export function ensureCardIds(config: AICardConfig): AICardConfig {
  const card: WithOptionalId<AICardConfig> = { ...config };

  if (!card.id) {
    card.id = generateId('card');
  }

  card.sections = card.sections?.map((section, index) => ensureSectionIds(section, index));
  card.actions = card.actions?.map((action, index) => ensureActionIds(action, index));

  return card as AICardConfig;
}

function ensureSectionIds(section: CardSection, sectionIndex: number): CardSection {
  const nextSection: WithOptionalId<CardSection> = { ...section };

  if (!nextSection.id) {
    nextSection.id = `section_${sectionIndex}`;
  }

  if (nextSection.fields) {
    nextSection.fields = nextSection.fields.map((field, fieldIndex) => ensureFieldIds(field, sectionIndex, fieldIndex));
  }

  if (nextSection.items) {
    nextSection.items = nextSection.items.map((item, itemIndex) => ensureItemIds(item, sectionIndex, itemIndex));
  }

  return nextSection as CardSection;
}

function ensureFieldIds(field: CardField, sectionIndex: number, fieldIndex: number): CardField {
  const nextField: WithOptionalId<CardField> = { ...field };

  if (!nextField.id) {
    nextField.id = `field_${sectionIndex}_${fieldIndex}`;
  }

  if (nextField.meta) {
    nextField.meta = removeAllIds(nextField.meta);
  }

  return nextField as CardField;
}

function ensureItemIds(item: CardItem, sectionIndex: number, itemIndex: number): CardItem {
  const nextItem: WithOptionalId<CardItem> = { ...item };

  if (!nextItem.id) {
    nextItem.id = `item_${sectionIndex}_${itemIndex}`;
  }

  if (nextItem.meta) {
    nextItem.meta = removeAllIds(nextItem.meta);
  }

  return nextItem as CardItem;
}

function ensureActionIds(action: CardAction, actionIndex: number): CardAction {
  const nextAction: WithOptionalId<CardAction> = { ...action };

  if (!nextAction.id) {
    nextAction.id = `action_${actionIndex}`;
  }

  if (nextAction.meta) {
    nextAction.meta = removeAllIds(nextAction.meta);
  }

  return nextAction as CardAction;
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
