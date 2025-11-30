import { AICardConfig, CardSection, CardField, CardItem, CardAction } from '../models';

/**
 * Card Spawner Utilities
 * 
 * Helper functions for dynamically instantiating and managing card components,
 * particularly useful for agentic flows and LLM integrations.
 */

/**
 * Creates an empty card configuration for initialization
 */
export function createEmptyCard(title: string = 'Loading...'): AICardConfig {
  return {
    cardTitle: title,
    sections: [],
    actions: []
  };
}

/**
 * Creates a skeleton card configuration for loading states
 */
export function createSkeletonCard(): AICardConfig {
  return {
    cardTitle: 'Loading...',
    sections: [
      {
        id: 'skeleton-section',
        title: 'Loading',
        type: 'info',
        fields: []
      }
    ]
  };
}

/**
 * Merges a partial card configuration into an existing card configuration
 * This is useful for progressive updates during streaming
 */
export function mergeCardConfig(
  existing: AICardConfig,
  update: Partial<AICardConfig>
): AICardConfig {
  const merged: AICardConfig = {
    ...existing,
    ...update
  };

  // Merge sections intelligently
  if (update.sections) {
    merged.sections = mergeSections(existing.sections || [], update.sections);
  }

  // Merge actions
  if (update.actions) {
    merged.actions = mergeActions(existing.actions || [], update.actions);
  }

  return merged;
}

/**
 * Merges sections arrays, updating existing sections or adding new ones
 */
export function mergeSections(
  existing: CardSection[],
  updates: CardSection[]
): CardSection[] {
  const sectionMap = new Map<string, CardSection>();

  // Add existing sections to map
  existing.forEach(section => {
    const key = getSectionKey(section);
    sectionMap.set(key, { ...section });
  });

  // Merge or add updated sections
  updates.forEach(updateSection => {
    const key = getSectionKey(updateSection);
    const existingSection = sectionMap.get(key);

    if (existingSection) {
      // Merge fields and items into existing section
      sectionMap.set(key, {
        ...existingSection,
        ...updateSection,
        fields: mergeFields(
          existingSection.fields || [],
          updateSection.fields || []
        ),
        items: mergeItems(
          existingSection.items || [],
          updateSection.items || []
        )
      });
    } else {
      // Add new section
      sectionMap.set(key, { ...updateSection });
    }
  });

  return Array.from(sectionMap.values());
}

/**
 * Merges fields arrays, avoiding duplicates by ID or label
 */
function mergeFields(
  existing: CardField[],
  updates: CardField[]
): CardField[] {
  const fieldMap = new Map<string, CardField>();

  // Add existing fields
  existing.forEach(field => {
    const key = field.id ?? field.label ?? String(field);
    fieldMap.set(key, field);
  });

  // Add or update fields
  updates.forEach(update => {
    const key = update.id ?? update.label ?? String(update);
    fieldMap.set(key, update);
  });

  return Array.from(fieldMap.values());
}

/**
 * Merges items arrays, avoiding duplicates by ID or name
 */
function mergeItems(
  existing: CardItem[],
  updates: CardItem[]
): CardItem[] {
  const itemMap = new Map<string, CardItem>();

  // Add existing items
  existing.forEach(item => {
    const key = item.id ?? item.title ?? String(item);
    itemMap.set(key, item);
  });

  // Add or update items
  updates.forEach(update => {
    const key = update.id ?? update.title ?? String(update);
    itemMap.set(key, update);
  });

  return Array.from(itemMap.values());
}

/**
 * Merges actions arrays, avoiding duplicates by ID or label
 */
function mergeActions(
  existing: CardAction[],
  updates: CardAction[]
): CardAction[] {
  const actionMap = new Map<string, CardAction>();

  // Add existing actions
  existing.forEach(action => {
    const key = action.id ?? action.label ?? String(action);
    actionMap.set(key, action);
  });

  // Add or update actions
  updates.forEach(update => {
    const key = update.id ?? update.label ?? String(update);
    actionMap.set(key, update);
  });

  return Array.from(actionMap.values());
}

/**
 * Gets a unique key for a section (for merging)
 */
function getSectionKey(section: CardSection): string {
  return section.id || 
         `${section.title || 'section'}-${section.type || 'info'}`;
}

/**
 * Validates a card configuration for completeness
 */
export function validateCardConfig(card: Partial<AICardConfig>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!card.cardTitle) {
    errors.push('Card title is required');
  }

  if (!card.sections || card.sections.length === 0) {
    errors.push('At least one section is required');
  }

  if (card.sections) {
    card.sections.forEach((section, index) => {
      if (!section.title) {
        errors.push(`Section ${index} is missing a title`);
      }
      if (!section.type) {
        errors.push(`Section ${index} is missing a type`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Creates a card configuration from a partial update
 * Useful when receiving streaming updates that may be incomplete
 */
export function createCardFromPartial(
  partial: Partial<AICardConfig>,
  defaults: Partial<AICardConfig> = {}
): AICardConfig {
  return {
    cardTitle: partial.cardTitle || defaults.cardTitle || 'Card',
    sections: partial.sections || defaults.sections || [],
    actions: partial.actions || defaults.actions || []
  };
}

/**
 * Checks if a card configuration is complete (all required fields present)
 */
export function isCardComplete(card: Partial<AICardConfig>): boolean {
  return !!(
    card.cardTitle &&
    card.sections &&
    card.sections.length > 0 &&
    card.sections.every(section => 
      section.title && 
      section.type &&
      ((section.fields && section.fields.length > 0) || (section.items && section.items.length > 0))
    )
  );
}

/**
 * Creates a card configuration with error information
 */
export function createErrorCard(
  error: Error | string,
  title: string = 'Error'
): AICardConfig {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return {
    cardTitle: title,
    sections: [
      {
        id: 'error-section',
        title: 'Error Details',
        type: 'info',
        fields: [
          {
            id: 'error-message',
            label: 'Message',
            value: errorMessage,
            type: 'text'
          }
        ]
      }
    ]
  };
}

/**
 * Prepares a card configuration for streaming updates
 * Ensures the card has the necessary structure for progressive updates
 */
export function prepareCardForStreaming(
  card: Partial<AICardConfig>
): AICardConfig {
  return {
    cardTitle: card.cardTitle || 'Loading...',
    sections: card.sections || [],
    actions: card.actions || [],
    // Ensure sections have IDs for tracking during updates
    ...card
  };
}

/**
 * Updates a card configuration incrementally
 * Optimized for streaming scenarios where partial updates arrive
 */
export function updateCardIncremental(
  existing: AICardConfig,
  update: Partial<AICardConfig>
): AICardConfig {
  // Start with existing card
  const updated: AICardConfig = { ...existing };

  // Update top-level fields if provided
  if (update.cardTitle !== undefined) {
    updated.cardTitle = update.cardTitle;
  }

  // Merge sections incrementally
  if (update.sections) {
    updated.sections = mergeSections(existing.sections || [], update.sections);
  }

  // Merge actions
  if (update.actions) {
    updated.actions = [...(existing.actions || []), ...(update.actions || [])];
  }

  return updated;
}

/**
 * Creates a copy of a card configuration (deep clone)
 */
export function cloneCardConfig(card: AICardConfig): AICardConfig {
  return JSON.parse(JSON.stringify(card));
}

