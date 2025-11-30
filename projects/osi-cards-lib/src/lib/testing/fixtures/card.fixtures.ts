/**
 * Card Test Fixtures
 * 
 * Provides factory functions for creating test card configurations.
 * 
 * @example
 * ```typescript
 * import { createMockCard, SAMPLE_CARDS } from 'osi-cards-lib/testing';
 * 
 * const card = createMockCard({
 *   cardTitle: 'Test Card',
 *   sections: [createMockSection({ type: 'info' })]
 * });
 * ```
 */

import type { AICardConfig, CardSection, CardAction } from '../../models/card.model';

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
        fields: [
          { id: 'field-1', label: 'Test Field', value: 'Test Value' },
        ],
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
    actions: actions.length > 0 
      ? actions.map((a, i) => ({ id: `action-${i}`, label: 'Action', ...a } as CardAction))
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

// ============================================================================
// SAMPLE CARDS
// ============================================================================

/**
 * Sample company card
 */
export const SAMPLE_COMPANY_CARD: AICardConfig = {
  id: 'sample-company',
  cardTitle: 'Acme Corporation',
  cardType: 'company',
  description: 'A sample company card for testing',
  sections: [
    {
      id: 'company-info',
      title: 'Company Information',
      type: 'info',
      fields: [
        { id: 'industry', label: 'Industry', value: 'Technology', icon: '🏢' },
        { id: 'founded', label: 'Founded', value: '2010', icon: '📅' },
        { id: 'employees', label: 'Employees', value: '5,000+', icon: '👥', trend: 'up' },
        { id: 'headquarters', label: 'Headquarters', value: 'San Francisco, CA', icon: '📍' },
        { id: 'website', label: 'Website', value: 'www.acme.com', icon: '🌐' },
      ],
    },
    {
      id: 'company-analytics',
      title: 'Performance Metrics',
      type: 'analytics',
      fields: [
        { id: 'revenue', label: 'Annual Revenue', value: '$50M', percentage: 85, trend: 'up', change: 15 },
        { id: 'growth', label: 'Growth Rate', value: '25%', percentage: 25, trend: 'up', change: 5 },
        { id: 'satisfaction', label: 'Customer Satisfaction', value: '4.8/5', percentage: 96, trend: 'stable' },
      ],
    },
  ],
  actions: [
    { id: 'view-profile', label: 'View Profile', variant: 'primary' } as CardAction,
    { id: 'contact', label: 'Contact', variant: 'secondary' } as CardAction,
  ],
};

/**
 * Sample contact card
 */
export const SAMPLE_CONTACT_CARD: AICardConfig = {
  id: 'sample-contact',
  cardTitle: 'John Smith',
  cardType: 'contact',
  sections: [
    {
      id: 'contact-info',
      title: 'Contact Information',
      type: 'contact-card',
      fields: [
        {
          id: 'contact-1',
          title: 'John Smith',
          label: 'Primary Contact',
          value: 'Chief Technology Officer',
          role: 'CTO',
          email: 'john.smith@acme.com',
          phone: '+1 (555) 123-4567',
          department: 'Technology',
        },
      ],
    },
  ],
  actions: [
    { id: 'email', label: 'Send Email', type: 'mail', variant: 'primary' } as CardAction,
    { id: 'call', label: 'Call', variant: 'secondary' } as CardAction,
  ],
};

/**
 * Sample analytics dashboard card
 */
export const SAMPLE_ANALYTICS_CARD: AICardConfig = {
  id: 'sample-analytics',
  cardTitle: 'Q4 2024 Performance',
  cardType: 'analytics',
  sections: [
    {
      id: 'kpis',
      title: 'Key Performance Indicators',
      type: 'analytics',
      fields: [
        { id: 'revenue', label: 'Revenue', value: '$12.5M', percentage: 92, performance: 'excellent', trend: 'up', change: 18.5 },
        { id: 'profit', label: 'Profit Margin', value: '23%', percentage: 23, performance: 'good', trend: 'up', change: 3.2 },
        { id: 'customers', label: 'New Customers', value: '1,234', percentage: 78, performance: 'good', trend: 'up', change: 12 },
        { id: 'churn', label: 'Churn Rate', value: '2.1%', percentage: 2.1, performance: 'excellent', trend: 'down', change: -0.5 },
      ],
    },
    {
      id: 'chart',
      title: 'Revenue Trends',
      type: 'chart',
      chartType: 'line',
      chartData: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Revenue',
            data: [10, 11, 12, 11.5, 12.2, 12.5],
            borderColor: '#FF7900',
          },
        ],
      },
    },
  ],
};

/**
 * Sample news card
 */
export const SAMPLE_NEWS_CARD: AICardConfig = {
  id: 'sample-news',
  cardTitle: 'Latest News',
  sections: [
    {
      id: 'news',
      title: 'Recent Headlines',
      type: 'news',
      items: [
        {
          id: 'news-1',
          title: 'Company Announces Record Q4 Earnings',
          description: 'Revenue exceeds expectations with 25% YoY growth',
          meta: { source: 'Bloomberg', date: '2024-01-15' },
        },
        {
          id: 'news-2',
          title: 'New Product Launch Scheduled for Q2',
          description: 'Enterprise Suite 5.0 to include AI features',
          meta: { source: 'Press Release', date: '2024-01-10' },
        },
      ],
    },
  ],
};

/**
 * Collection of all sample cards for testing
 */
export const SAMPLE_CARDS: Record<string, AICardConfig> = {
  company: SAMPLE_COMPANY_CARD,
  contact: SAMPLE_CONTACT_CARD,
  analytics: SAMPLE_ANALYTICS_CARD,
  news: SAMPLE_NEWS_CARD,
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
          value: 'This is a very long value that contains a lot of text and should be handled properly by the component without breaking the layout or causing any visual issues. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
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
 * Card with all section types
 */
export const ALL_SECTIONS_CARD: AICardConfig = {
  id: 'all-sections',
  cardTitle: 'Card with All Section Types',
  sections: [
    { id: 'info', title: 'Info', type: 'info', fields: [{ label: 'Key', value: 'Value' }] },
    { id: 'analytics', title: 'Analytics', type: 'analytics', fields: [{ label: 'Metric', value: '100%', percentage: 100 }] },
    { id: 'list', title: 'List', type: 'list', items: [{ title: 'Item 1' }, { title: 'Item 2' }] },
    { id: 'news', title: 'News', type: 'news', items: [{ title: 'Headline', description: 'Summary' }] },
    { id: 'event', title: 'Events', type: 'event', fields: [{ label: 'Event', value: 'Conference', date: '2024-01-15' }] },
    { id: 'contact', title: 'Contact', type: 'contact-card', fields: [{ title: 'Name', email: 'test@example.com' }] },
  ],
};

