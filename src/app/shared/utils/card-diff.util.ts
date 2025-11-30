import { AICardConfig, CardSection, CardField, CardItem } from '../../models';

export type CardChangeType = 'content' | 'structural';

export interface CardDiffResult {
  card: AICardConfig;
  changeType: CardChangeType;
}

/**
 * Simple hash function for content hashing (replaces JSON.stringify)
 * Uses MurmurHash-inspired algorithm for fast hashing
 */
function hashString(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

/**
 * Generate content hash for a field (faster than JSON.stringify)
 */
function hashField(field: CardField): string {
  const key = `${field.id || ''}|${field.label || ''}|${field.value || ''}|${field.type || ''}|${field.title || ''}`;
  return String(hashString(key));
}

/**
 * Generate content hash for an item (faster than JSON.stringify)
 */
function hashItem(item: CardItem): string {
  const key = `${item.id || ''}|${item.title || ''}|${item.value || ''}`;
  return String(hashString(key));
}

/**
 * WeakMap cache for field hashes to avoid recomputation
 */
const fieldHashCache = new WeakMap<CardField, string>();
const itemHashCache = new WeakMap<CardItem, string>();

/**
 * Deep comparison utility for card objects
 * Uses content hashing instead of JSON.stringify for better performance
 */
export class CardDiffUtil {
  /**
   * Compares two cards and returns change information
   * @param oldCard The previous card state (can be null)
   * @param newCard The new card state
   * @returns Object with changeType and hasChanges flag
   */
  static diffCards(
    oldCard: AICardConfig | null,
    newCard: AICardConfig
  ): { changeType: CardChangeType; hasChanges: boolean } {
    // If no old card, everything is new (structural change)
    if (!oldCard) {
      return { changeType: 'structural', hasChanges: true };
    }

    // Check if cards are equal
    if (this.areCardsEqual(oldCard, newCard)) {
      return { changeType: 'content', hasChanges: false };
    }

    // Check if structure changed (sections added/removed/reordered, types changed)
    const structureChanged = this.didStructureChange(oldCard.sections, newCard.sections);
    
    // Check if sections content changed
    const sectionsChanged = !this.areSectionsEqual(oldCard.sections, newCard.sections);

    // Determine change type
    const changeType: CardChangeType = structureChanged ? 'structural' : 'content';
    const hasChanges = sectionsChanged || 
                       oldCard.cardTitle !== newCard.cardTitle ||
                       oldCard.cardType !== newCard.cardType;

    return { changeType, hasChanges };
  }

  /**
   * Creates an updated card with only changed sections/fields updated
   * Preserves references to unchanged sections for optimal performance
   */
  static mergeCardUpdates(oldCard: AICardConfig, newCard: AICardConfig): CardDiffResult {
    // If cards are identical, return old card (preserve reference)
    if (this.areCardsEqual(oldCard, newCard)) {
      return { card: oldCard, changeType: 'content' };
    }

    // Check if only top-level properties changed (title, etc.)
    // Check if sections array changed
    const sectionsChanged = !this.areSectionsEqual(oldCard.sections, newCard.sections);

    // If only top-level changed, update only those
    if (!sectionsChanged) {
      return {
        card: {
          ...oldCard,
          cardTitle: newCard.cardTitle,
          cardType: newCard.cardType,
          description: newCard.description,
          columns: newCard.columns,
          actions: newCard.actions,
          // Keep same sections reference
          sections: oldCard.sections
        },
        changeType: 'content'
      };
    }

    // Merge sections incrementally
    const mergedSections = this.mergeSections(oldCard.sections, newCard.sections);

    const changeType: CardChangeType = sectionsChanged && !this.didStructureChange(oldCard.sections, newCard.sections)
      ? 'content'
      : 'structural';

    return {
      card: {
        ...oldCard,
        cardTitle: newCard.cardTitle,
        cardType: newCard.cardType,
        description: newCard.description,
        columns: newCard.columns,
        actions: newCard.actions,
        sections: mergedSections
      },
      changeType
    };
  }

  private static didStructureChange(oldSections: CardSection[], newSections: CardSection[]): boolean {
    if (oldSections.length !== newSections.length) {
      return true;
    }
    return oldSections.some((oldSection, index) => {
      const newSection = newSections[index];
      if (!newSection) {
        return true;
      }
      if ((oldSection.id || index) !== (newSection.id || index)) {
        return true;
      }
      if (oldSection.type !== newSection.type) {
        return true;
      }
      const oldFieldsLength = oldSection.fields?.length ?? 0;
      const newFieldsLength = newSection.fields?.length ?? 0;
      const oldItemsLength = oldSection.items?.length ?? 0;
      const newItemsLength = newSection.items?.length ?? 0;
      return oldFieldsLength !== newFieldsLength || newItemsLength !== oldItemsLength;
    });
  }

  /**
   * Merges sections array, preserving references to unchanged sections
   */
  private static mergeSections(oldSections: CardSection[], newSections: CardSection[]): CardSection[] {
    // If sections array length changed, we need to rebuild
    if (oldSections.length !== newSections.length) {
      return newSections.map((section, index) => {
        const oldSection = oldSections[index];
        if (oldSection && this.areSectionsEqual([oldSection], [section])) {
          return oldSection; // Preserve reference
        }
        return section;
      });
    }

    // Merge each section
    return newSections.map((newSection, index) => {
      const oldSection = oldSections[index];

      if (!oldSection) {
        return newSection;
      }

      if ((oldSection.id || index) !== (newSection.id || index)) {
        return newSection;
      }

      // Merge section fields/items
      return this.mergeSection(oldSection, newSection);
    });
  }

  /**
   * Merges a single section, preserving references to unchanged fields/items
   */
  private static mergeSection(oldSection: CardSection, newSection: CardSection): CardSection {
    // Check if only top-level section properties changed
    // Check if fields changed
    const fieldsChanged = !this.areFieldsEqual(oldSection.fields, newSection.fields);
    const itemsChanged = !this.areItemsEqual(oldSection.items, newSection.items);

    // If only top-level changed, preserve fields/items references
    if (!fieldsChanged && !itemsChanged) {
      return {
        ...oldSection,
        title: newSection.title,
        type: newSection.type,
        description: newSection.description,
        subtitle: newSection.subtitle,
        columns: newSection.columns,
        colSpan: newSection.colSpan,
        collapsed: newSection.collapsed,
        emoji: newSection.emoji,
        chartType: newSection.chartType,
        chartData: newSection.chartData,
        meta: newSection.meta,
        // Preserve fields/items references
        fields: oldSection.fields,
        items: oldSection.items
      };
    }

    // Merge fields if they exist
    const mergedFields = oldSection.fields && newSection.fields
      ? this.mergeFields(oldSection.fields, newSection.fields)
      : newSection.fields;

    // Merge items if they exist
    const mergedItems = oldSection.items && newSection.items
      ? this.mergeItems(oldSection.items, newSection.items)
      : newSection.items;

    return {
      ...oldSection,
      title: newSection.title,
      type: newSection.type,
      description: newSection.description,
      subtitle: newSection.subtitle,
      columns: newSection.columns,
      colSpan: newSection.colSpan,
      collapsed: newSection.collapsed,
      emoji: newSection.emoji,
      chartType: newSection.chartType,
      chartData: newSection.chartData,
      meta: newSection.meta,
      fields: mergedFields,
      items: mergedItems
    };
  }

  /**
   * Merges fields array, preserving references to unchanged fields
   * Uses content hashing instead of JSON.stringify for better performance
   */
  private static mergeFields(oldFields: CardField[], newFields: CardField[]): CardField[] {
    if (oldFields.length !== newFields.length) {
      return newFields;
    }

    return newFields.map((newField, index) => {
      const oldField = oldFields[index];
      if (!oldField) {
        return newField;
      }

      // Fast comparison: check key properties first
      if (oldField.id === newField.id &&
          oldField.label === newField.label &&
          oldField.value === newField.value &&
          oldField.title === newField.title) {
        // Use content hashing instead of JSON.stringify
        const oldHash = fieldHashCache.get(oldField) || hashField(oldField);
        const newHash = hashField(newField);
        
        // Cache hashes for future comparisons
        if (!fieldHashCache.has(oldField)) {
          fieldHashCache.set(oldField, oldHash);
        }
        if (!fieldHashCache.has(newField)) {
          fieldHashCache.set(newField, newHash);
        }
        
        if (oldHash === newHash) {
          return oldField; // Preserve reference
        }
      }

      return newField;
    });
  }

  /**
   * Merges items array, preserving references to unchanged items
   * Uses content hashing instead of JSON.stringify for better performance
   */
  private static mergeItems(oldItems: CardItem[], newItems: CardItem[]): CardItem[] {
    if (oldItems.length !== newItems.length) {
      return newItems;
    }

    return newItems.map((newItem, index) => {
      const oldItem = oldItems[index];
      if (!oldItem) {
        return newItem;
      }

      // Fast comparison
      if (oldItem.id === newItem.id &&
          oldItem.title === newItem.title &&
          oldItem.value === newItem.value) {
        // Use content hashing instead of JSON.stringify
        const oldHash = itemHashCache.get(oldItem) || hashItem(oldItem);
        const newHash = hashItem(newItem);
        
        // Cache hashes for future comparisons
        if (!itemHashCache.has(oldItem)) {
          itemHashCache.set(oldItem, oldHash);
        }
        if (!itemHashCache.has(newItem)) {
          itemHashCache.set(newItem, newHash);
        }
        
        if (oldHash === newHash) {
          return oldItem; // Preserve reference
        }
      }

      return newItem;
    });
  }

  /**
   * Fast equality check for cards
   */
  private static areCardsEqual(card1: AICardConfig, card2: AICardConfig): boolean {
    return card1.id === card2.id &&
           card1.cardTitle === card2.cardTitle &&
           card1.cardType === card2.cardType &&
           this.areSectionsEqual(card1.sections, card2.sections);
  }

  /**
   * Fast equality check for sections arrays
   */
  private static areSectionsEqual(sections1: CardSection[], sections2: CardSection[]): boolean {
    if (sections1.length !== sections2.length) {
      return false;
    }

    return sections1.every((section1, index) => {
      const section2 = sections2[index];
      if (!section2) return false;

      return section1.id === section2.id &&
             section1.title === section2.title &&
             section1.type === section2.type &&
             this.areFieldsEqual(section1.fields, section2.fields) &&
             this.areItemsEqual(section1.items, section2.items);
    });
  }

  /**
   * Fast equality check for fields arrays
   */
  private static areFieldsEqual(fields1?: CardField[], fields2?: CardField[]): boolean {
    if (!fields1 && !fields2) return true;
    if (!fields1 || !fields2) return false;
    if (fields1.length !== fields2.length) return false;

    return fields1.every((field1, index) => {
      const field2 = fields2[index];
      if (!field2) return false;

      return field1.id === field2.id &&
             field1.label === field2.label &&
             field1.value === field2.value &&
             field1.title === field2.title;
    });
  }

  /**
   * Fast equality check for items arrays
   */
  private static areItemsEqual(items1?: CardItem[], items2?: CardItem[]): boolean {
    if (!items1 && !items2) return true;
    if (!items1 || !items2) return false;
    if (items1.length !== items2.length) return false;

    return items1.every((item1, index) => {
      const item2 = items2[index];
      if (!item2) return false;

      return item1.id === item2.id &&
             item1.title === item2.title &&
             item1.value === item2.value;
    });
  }
}

