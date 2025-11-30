/**
 * Test utilities and factories
 * Build reusable test utilities and factories for card data
 */

import { AICardConfig, CardSection, CardField, CardItem, CardType } from '../../models';

/**
 * Create a test card
 */
export function createTestCard(overrides: Partial<AICardConfig> = {}): AICardConfig {
  return {
    id: 'test-card-1',
    cardTitle: 'Test Card',
    cardType: 'company',
    sections: [
      {
        id: 'test-section-1',
        title: 'Test Section',
        type: 'info',
        fields: [
          {
            id: 'test-field-1',
            label: 'Test Field',
            value: 'Test Value'
          }
        ]
      }
    ],
    ...overrides
  };
}

/**
 * Create a test section
 */
export function createTestSection(overrides: Partial<CardSection> = {}): CardSection {
  return {
    id: 'test-section',
    title: 'Test Section',
    type: 'info',
    fields: [],
    ...overrides
  };
}

/**
 * Create a test field
 */
export function createTestField(overrides: Partial<CardField> = {}): CardField {
  return {
    id: 'test-field',
    label: 'Test Field',
    value: 'Test Value',
    ...overrides
  };
}

/**
 * Create a test item
 */
export function createTestItem(overrides: Partial<CardItem> = {}): CardItem {
  return {
    id: 'test-item',
    title: 'Test Item',
    description: 'Test Description',
    ...overrides
  };
}

/**
 * Create multiple test cards
 */
export function createTestCards(count: number, baseOverrides: Partial<AICardConfig> = {}): AICardConfig[] {
  return Array.from({ length: count }, (_, index) =>
    createTestCard({
      id: `test-card-${index + 1}`,
      cardTitle: `Test Card ${index + 1}`,
      ...baseOverrides
    })
  );
}

/**
 * Create a card with multiple sections
 */
export function createCardWithSections(sectionCount: number, fieldsPerSection = 3): AICardConfig {
  const sections: CardSection[] = Array.from({ length: sectionCount }, (_, sectionIndex) => ({
    id: `section-${sectionIndex + 1}`,
    title: `Section ${sectionIndex + 1}`,
    type: 'info' as const,
    fields: Array.from({ length: fieldsPerSection }, (_, fieldIndex) => ({
      id: `field-${sectionIndex + 1}-${fieldIndex + 1}`,
      label: `Field ${fieldIndex + 1}`,
      value: `Value ${fieldIndex + 1}`
    }))
  }));

  return createTestCard({
    sections,
    cardTitle: `Card with ${sectionCount} Sections`
  });
}


