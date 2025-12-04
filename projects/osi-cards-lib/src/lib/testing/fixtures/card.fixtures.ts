/**
 * Card Test Fixtures
 *
 * Factory functions for creating test card configurations.
 *
 * IMPORTANT: Sample cards are now sourced from the Section Registry.
 * Use SAMPLE_CARDS or create cards with registry fixtures for consistency.
 *
 * @example
 * ```typescript
 * import {
 *   createMockCard,
 *   SAMPLE_CARDS,
 *   getFixture
 * } from 'osi-cards-lib/testing';
 *
 * // Use pre-built sample cards (recommended)
 * const companyCard = SAMPLE_CARDS.company;
 *
 * // Or create custom card with registry fixtures
 * const customCard = createMockCard({
 *   cardTitle: 'Custom Card',
 *   sections: [
 *     getFixture('info', 'complete'),
 *     getFixture('analytics', 'complete')
 *   ]
 * });
 * ```
 */

import type { AICardConfig, CardSection, CardAction } from '../../models/card.model';
import {
  SAMPLE_CARDS as REGISTRY_SAMPLE_CARDS,
  COMPLETE_FIXTURES,
  getAllFixtures,
} from '../../registry/fixtures.generated';

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Creates a mock card configuration with sensible defaults
 */
export function createMockCard(overrides: Partial<AICardConfig> = {}): AICardConfig {
  return {
    id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    cardTitle: 'Test Card',
    sections: [
      {
        id: 'section-1',
        title: 'Test Section',
        type: 'info',
        fields: [{ id: 'field-1', label: 'Test Field', value: 'Test Value' }],
      },
    ],
    ...overrides,
  };
}

/**
 * Creates a minimal card configuration
 */
export function createMinimalCard(title: string): AICardConfig {
  return {
    cardTitle: title,
    sections: [],
  };
}

/**
 * Creates a card with multiple sections
 */
export function createMultiSectionCard(sectionCount: number): AICardConfig {
  const sections: CardSection[] = [];

  for (let i = 0; i < sectionCount; i++) {
    sections.push({
      id: `section-${i}`,
      title: `Section ${i + 1}`,
      type: 'info',
      fields: [
        { id: `field-${i}-1`, label: 'Field 1', value: `Value ${i}-1` },
        { id: `field-${i}-2`, label: 'Field 2', value: `Value ${i}-2` },
      ],
    });
  }

  return {
    id: 'multi-section-card',
    cardTitle: `Card with ${sectionCount} Sections`,
    sections,
  };
}

/**
 * Creates a card with actions
 */
export function createCardWithActions(actions: Partial<CardAction>[] = []): AICardConfig {
  const defaultActions: CardAction[] = [
    { id: 'action-1', label: 'Primary Action', variant: 'primary' } as CardAction,
    { id: 'action-2', label: 'Secondary Action', variant: 'secondary' } as CardAction,
  ];

  return createMockCard({
    actions:
      actions.length > 0
        ? actions.map((a, i) => ({ id: `action-${i}`, label: 'Action', ...a }) as CardAction)
        : defaultActions,
  });
}

/**
 * Creates a card for streaming simulation
 */
export function createStreamingCard(): AICardConfig {
  return {
    id: 'streaming-card',
    cardTitle: 'Streaming Card',
    sections: [
      {
        id: 'section-1',
        title: 'Loading...',
        type: 'info',
        fields: [
          { id: 'field-1', label: 'Field 1', value: 'Streaming...', meta: { placeholder: true } },
          { id: 'field-2', label: 'Field 2', value: 'Streaming...', meta: { placeholder: true } },
        ],
        meta: { placeholder: true },
      },
    ],
    meta: { streaming: true },
  };
}

/**
 * Creates a card using registry fixtures for specific section types
 */
export function createCardFromRegistry(
  title: string,
  sectionTypes: string[],
  options: Partial<AICardConfig> = {}
): AICardConfig {
  const sections = sectionTypes
    .map((type) => COMPLETE_FIXTURES[type as keyof typeof COMPLETE_FIXTURES])
    .filter((s): s is CardSection => s !== undefined);

  return {
    id: `registry-card-${Date.now()}`,
    cardTitle: title,
    sections,
    ...options,
  };
}

// ============================================================================
// SAMPLE CARDS (FROM REGISTRY - SINGLE SOURCE OF TRUTH)
// ============================================================================

/**
 * Sample company card (from registry)
 * @deprecated Use SAMPLE_CARDS.company instead
 */
export const SAMPLE_COMPANY_CARD: AICardConfig = REGISTRY_SAMPLE_CARDS.company;

/**
 * Sample contact card (from registry)
 */
export const SAMPLE_CONTACT_CARD: AICardConfig = {
  id: 'sample-contact',
  cardTitle: 'John Smith',
  cardType: 'contact',
  sections: [COMPLETE_FIXTURES['contact-card']!].filter(Boolean),
  actions: [
    { id: 'email', label: 'Send Email', type: 'mail', variant: 'primary' } as CardAction,
    { id: 'call', label: 'Call', variant: 'secondary' } as CardAction,
  ],
};

/**
 * Sample analytics dashboard card (from registry)
 * @deprecated Use SAMPLE_CARDS.analytics instead
 */
export const SAMPLE_ANALYTICS_CARD: AICardConfig = REGISTRY_SAMPLE_CARDS.analytics;

/**
 * Sample news card (from registry)
 * @deprecated Use SAMPLE_CARDS.news instead
 */
export const SAMPLE_NEWS_CARD: AICardConfig = REGISTRY_SAMPLE_CARDS.news;

/**
 * Collection of all sample cards (from registry)
 * @deprecated Use SAMPLE_CARDS from registry instead
 */
export const SAMPLE_CARDS: Record<string, AICardConfig> = {
  company: REGISTRY_SAMPLE_CARDS.company,
  contact: SAMPLE_CONTACT_CARD,
  analytics: REGISTRY_SAMPLE_CARDS.analytics,
  news: REGISTRY_SAMPLE_CARDS.news,
};

// ============================================================================
// EDGE CASE CARDS
// ============================================================================

/**
 * Card with empty sections
 */
export const EMPTY_SECTIONS_CARD: AICardConfig = {
  id: 'empty-sections',
  cardTitle: 'Card with Empty Sections',
  sections: [],
};

/**
 * Card with null/undefined values
 */
export const NULL_VALUES_CARD: AICardConfig = {
  id: 'null-values',
  cardTitle: 'Card with Null Values',
  sections: [
    {
      id: 'section-null',
      title: 'Null Values Section',
      type: 'info',
      fields: [
        { id: 'field-null', label: 'Null Value', value: null },
        { id: 'field-empty', label: 'Empty Value', value: '' },
        { id: 'field-undefined', label: 'Undefined Label' },
      ],
    },
  ],
};

/**
 * Card with very long content
 */
export const LONG_CONTENT_CARD: AICardConfig = {
  id: 'long-content',
  cardTitle: 'A Very Long Card Title That Should Be Truncated Properly In The UI Display',
  sections: [
    {
      id: 'section-long',
      title: 'Section With Very Long Title That Exceeds Normal Width Limits',
      type: 'info',
      fields: [
        {
          id: 'field-long',
          label: 'Long Label That Is Much Longer Than Expected',
          value:
            'This is a very long value that contains a lot of text and should be handled properly by the component without breaking the layout or causing any visual issues. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        },
      ],
    },
  ],
};

/**
 * Card with special characters
 */
export const SPECIAL_CHARS_CARD: AICardConfig = {
  id: 'special-chars',
  cardTitle: 'Card with <Special> "Characters" & Symbols',
  sections: [
    {
      id: 'section-special',
      title: "Section's Title with 'Quotes'",
      type: 'info',
      fields: [
        { id: 'html', label: 'HTML', value: '<script>alert("xss")</script>' },
        { id: 'unicode', label: 'Unicode', value: '日本語 中文 العربية 한국어 🎉🚀💡' },
        { id: 'symbols', label: 'Symbols', value: '© ® ™ € £ ¥ ° ± × ÷' },
      ],
    },
  ],
};

/**
 * Card with all section types (from registry)
 * @deprecated Use SAMPLE_CARDS.allSections instead
 */
export const ALL_SECTIONS_CARD: AICardConfig = REGISTRY_SAMPLE_CARDS.allSections;
