/**
 * Section Registry Utilities
 * 
 * Utility functions for working with the section registry.
 * These functions provide runtime access to registry data.
 */

import type { CardSection, CardField, CardItem, AICardConfig } from '../models/card.model';
import { SectionType, SectionTypeInput, resolveSectionType } from '../models/generated-section-types';

/**
 * Fixture type identifier
 */
export type FixtureType = 'complete' | 'minimal' | 'edgeCases' | 'streaming' | 'accessibility';

/**
 * Section fixture record type
 */
export type SectionFixtureRecord = Record<SectionType, CardSection>;

/**
 * Create a unique ID for a section
 */
export function createSectionId(type: SectionTypeInput, suffix?: string): string {
  const resolved = resolveSectionType(type);
  const uniquePart = suffix ?? Math.random().toString(36).substring(7);
  return `${resolved}-${uniquePart}`;
}

/**
 * Create a unique ID for a field
 */
export function createFieldId(prefix: string, index: number): string {
  return `${prefix}-field-${index}`;
}

/**
 * Create a unique ID for an item
 */
export function createItemId(prefix: string, index: number): string {
  return `${prefix}-item-${index}`;
}

/**
 * Deep clone a section with new IDs
 */
export function cloneSection(section: CardSection): CardSection {
  const cloned = JSON.parse(JSON.stringify(section)) as CardSection;
  cloned.id = createSectionId(section.type as SectionTypeInput);
  
  if (cloned.fields) {
    cloned.fields = cloned.fields.map((field, i) => ({
      ...field,
      id: createFieldId(cloned.id!, i)
    }));
  }
  
  if (cloned.items) {
    cloned.items = cloned.items.map((item, i) => ({
      ...item,
      id: createItemId(cloned.id!, i)
    }));
  }
  
  return cloned;
}

/**
 * Create a card from sections
 */
export function createCardFromSections(
  title: string,
  sections: CardSection[],
  options: Partial<AICardConfig> = {}
): AICardConfig {
  return {
    id: `card-${Math.random().toString(36).substring(7)}`,
    cardTitle: title,
    sections: sections.map(s => cloneSection(s)),
    ...options
  };
}

/**
 * Create a card with a single section type
 */
export function createSingleSectionCard(
  section: CardSection,
  options: Partial<AICardConfig> = {}
): AICardConfig {
  return createCardFromSections(
    `${section.title} Test`,
    [section],
    options
  );
}

/**
 * Merge multiple sections into one
 */
export function mergeSections(
  base: CardSection,
  overrides: Partial<CardSection>
): CardSection {
  const merged = { ...base, ...overrides };
  
  // Merge fields if both exist
  if (base.fields && overrides.fields) {
    merged.fields = [...base.fields, ...overrides.fields];
  }
  
  // Merge items if both exist
  if (base.items && overrides.items) {
    merged.items = [...base.items, ...overrides.items];
  }
  
  return merged;
}

/**
 * Create a section with placeholder data (for streaming tests)
 */
export function createPlaceholderSection(
  type: SectionTypeInput,
  fieldCount: number = 3
): CardSection {
  const resolved = resolveSectionType(type);
  const id = createSectionId(resolved);
  
  return {
    id,
    title: 'Loading...',
    type: resolved,
    fields: Array.from({ length: fieldCount }, (_, i) => ({
      id: createFieldId(id, i),
      label: `Field ${i + 1}`,
      value: 'Loading...',
      meta: { placeholder: true }
    })),
    meta: { placeholder: true }
  };
}

/**
 * Create an empty section
 */
export function createEmptySection(type: SectionTypeInput, title: string): CardSection {
  return {
    id: createSectionId(type),
    title,
    type: resolveSectionType(type),
    fields: [],
    items: []
  };
}

/**
 * Create a section with null/edge case values
 */
export function createNullValuesSection(type: SectionTypeInput): CardSection {
  const id = createSectionId(type);
  
  return {
    id,
    title: 'Null Values Test',
    type: resolveSectionType(type),
    fields: [
      { id: `${id}-null`, label: 'Null Value', value: null },
      { id: `${id}-empty`, label: 'Empty Value', value: '' },
      { id: `${id}-undefined`, label: 'Undefined Value' }
    ]
  };
}

/**
 * Create a section with very long content
 */
export function createLongContentSection(type: SectionTypeInput): CardSection {
  const id = createSectionId(type);
  const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10);
  
  return {
    id,
    title: 'Very Long Section Title That Should Be Truncated Properly In The UI Display When Rendered',
    type: resolveSectionType(type),
    fields: [
      {
        id: `${id}-long`,
        label: 'A Very Long Label That Exceeds Normal Width Expectations',
        value: longText
      }
    ]
  };
}

/**
 * Create a section with special characters
 */
export function createSpecialCharsSection(type: SectionTypeInput): CardSection {
  const id = createSectionId(type);
  
  return {
    id,
    title: "Section's Title with 'Quotes' & <Special> \"Characters\"",
    type: resolveSectionType(type),
    fields: [
      { id: `${id}-html`, label: 'HTML', value: '<script>alert("xss")</script>' },
      { id: `${id}-unicode`, label: 'Unicode', value: '日本語 中文 العربية 한국어 🎉🚀💡' },
      { id: `${id}-symbols`, label: 'Symbols', value: '© ® ™ € £ ¥ ° ± × ÷' }
    ]
  };
}

/**
 * Create a large section for performance testing
 */
export function createLargeSection(
  type: SectionTypeInput,
  fieldCount: number
): CardSection {
  const id = createSectionId(type);
  
  return {
    id,
    title: `Large Section (${fieldCount} fields)`,
    type: resolveSectionType(type),
    fields: Array.from({ length: fieldCount }, (_, i) => ({
      id: `${id}-field-${i}`,
      label: `Field ${i + 1}`,
      value: `Value ${i + 1}`
    }))
  };
}

/**
 * Validate that a section matches expected structure
 */
export function validateSectionStructure(section: CardSection): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!section.type) {
    errors.push('Section missing required "type" property');
  }
  
  if (!section.title && !section.id) {
    errors.push('Section should have "title" or "id" for identification');
  }
  
  if (section.fields && !Array.isArray(section.fields)) {
    errors.push('Section "fields" must be an array');
  }
  
  if (section.items && !Array.isArray(section.items)) {
    errors.push('Section "items" must be an array');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

