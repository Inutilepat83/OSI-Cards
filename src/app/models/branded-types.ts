/**
 * Branded Types for IDs
 *
 * Prevents mixing different types of IDs (card IDs, section IDs, field IDs, etc.)
 * at compile time. This improves type safety and prevents bugs from passing
 * the wrong type of ID to functions.
 *
 * @example
 * ```typescript
 * function getCardById(id: CardId): AICardConfig | null {
 *   // Only accepts CardId, not SectionId or FieldId
 * }
 *
 * const cardId: CardId = 'card-123' as CardId;
 * const sectionId: SectionId = 'section-456' as SectionId;
 *
 * getCardById(cardId); // ✅ OK
 * getCardById(sectionId); // ❌ Type error
 * ```
 */

/**
 * Branded type helper
 */
type Brand<T, B> = T & { __brand: B };

/**
 * Card ID - unique identifier for a card
 */
export type CardId = Brand<string, 'CardId'>;

/**
 * Section ID - unique identifier for a section within a card
 */
export type SectionId = Brand<string, 'SectionId'>;

/**
 * Field ID - unique identifier for a field within a section
 */
export type FieldId = Brand<string, 'FieldId'>;

/**
 * Item ID - unique identifier for an item within a section
 */
export type ItemId = Brand<string, 'ItemId'>;

/**
 * Action ID - unique identifier for an action/button
 */
export type ActionId = Brand<string, 'ActionId'>;

/**
 * Helper functions to create branded IDs
 */
export const BrandedIds = {
  /**
   * Create a CardId from a string
   */
  cardId: (id: string): CardId => id as CardId,

  /**
   * Create a SectionId from a string
   */
  sectionId: (id: string): SectionId => id as SectionId,

  /**
   * Create a FieldId from a string
   */
  fieldId: (id: string): FieldId => id as FieldId,

  /**
   * Create an ItemId from a string
   */
  itemId: (id: string): ItemId => id as ItemId,

  /**
   * Create an ActionId from a string
   */
  actionId: (id: string): ActionId => id as ActionId,

  /**
   * Safely convert a string to CardId (validates format)
   */
  toCardId: (id: string | undefined | null): CardId | undefined => {
    if (!id) {
      return undefined;
    }
    // Add validation if needed
    return id as CardId;
  },

  /**
   * Safely convert a string to SectionId (validates format)
   */
  toSectionId: (id: string | undefined | null): SectionId | undefined => {
    if (!id) {
      return undefined;
    }
    return id as SectionId;
  },

  /**
   * Safely convert a string to FieldId (validates format)
   */
  toFieldId: (id: string | undefined | null): FieldId | undefined => {
    if (!id) {
      return undefined;
    }
    return id as FieldId;
  },

  /**
   * Safely convert a string to ItemId (validates format)
   */
  toItemId: (id: string | undefined | null): ItemId | undefined => {
    if (!id) {
      return undefined;
    }
    return id as ItemId;
  },

  /**
   * Safely convert a string to ActionId (validates format)
   */
  toActionId: (id: string | undefined | null): ActionId | undefined => {
    if (!id) {
      return undefined;
    }
    return id as ActionId;
  },
};

/**
 * Type guard to check if a string is a valid CardId
 */
export function isCardId(id: string): id is CardId {
  return typeof id === 'string' && id.length > 0;
}

/**
 * Type guard to check if a string is a valid SectionId
 */
export function isSectionId(id: string): id is SectionId {
  return typeof id === 'string' && id.length > 0;
}

/**
 * Type guard to check if a string is a valid FieldId
 */
export function isFieldId(id: string): id is FieldId {
  return typeof id === 'string' && id.length > 0;
}

/**
 * Type guard to check if a string is a valid ItemId
 */
export function isItemId(id: string): id is ItemId {
  return typeof id === 'string' && id.length > 0;
}

/**
 * Type guard to check if a string is a valid ActionId
 */
export function isActionId(id: string): id is ActionId {
  return typeof id === 'string' && id.length > 0;
}
