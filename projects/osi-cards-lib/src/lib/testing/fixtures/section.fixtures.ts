/**
 * Section Test Fixtures
 *
 * Factory functions for creating test section configurations.
 *
 * IMPORTANT: Sample sections are now sourced from the Section Registry.
 * Use getFixture() or SECTION_FIXTURES for pre-built examples.
 *
 * @example
 * ```typescript
 * import {
 *   createMockSection,
 *   getFixture,
 *   COMPLETE_FIXTURES
 * } from 'osi-cards-lib/testing';
 *
 * // Use registry fixture (recommended)
 * const infoSection = getFixture('info', 'complete');
 *
 * // Or create custom section with factory
 * const customSection = createMockSection({
 *   type: 'analytics',
 *   title: 'Custom Analytics',
 *   fields: [...]
 * });
 * ```
 */

import type { CardSection, CardField, CardItem } from '../../models';
import {
  COMPLETE_FIXTURES,
  MINIMAL_FIXTURES,
  EDGE_CASE_FIXTURES,
} from '../../registry/fixtures.generated';

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Creates a mock section with sensible defaults
 */
export function createMockSection(overrides: Partial<CardSection> = {}): CardSection {
  return {
    id: `section-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title: 'Test Section',
    type: 'info',
    fields: [{ id: 'field-1', label: 'Test Field', value: 'Test Value' }],
    ...overrides,
  };
}

/**
 * Creates an analytics section with metrics
 */
export function createAnalyticsSection(
  title: string,
  metrics: Array<{
    label: string;
    value: string;
    percentage?: number;
    trend?: 'up' | 'down' | 'stable';
  }>
): CardSection {
  return {
    id: `analytics-${Date.now()}`,
    title,
    type: 'analytics',
    fields: metrics.map((m, i) => ({
      id: `metric-${i}`,
      label: m.label,
      value: m.value,
      percentage: m.percentage,
      trend: m.trend,
    })),
  };
}

/**
 * Creates a list section with items
 */
export function createListSection(title: string, items: Partial<CardItem>[]): CardSection {
  return {
    id: `list-${Date.now()}`,
    title,
    type: 'list',
    items: items.map((item, i) => ({
      id: `item-${i}`,
      title: 'Item',
      ...item,
    })),
  };
}

/**
 * Creates a news section with articles
 */
export function createNewsSection(
  title: string,
  articles: Array<{ title: string; description: string; source?: string; date?: string }>
): CardSection {
  return {
    id: `news-${Date.now()}`,
    title,
    type: 'news',
    items: articles.map((article, i) => ({
      id: `article-${i}`,
      title: article.title,
      description: article.description,
      meta: { source: article.source, date: article.date },
    })),
  };
}

/**
 * Creates a contact section
 */
export function createContactSection(
  title: string,
  contacts: Array<{ name: string; role: string; email?: string; phone?: string }>
): CardSection {
  return {
    id: `contact-${Date.now()}`,
    title,
    type: 'contact-card',
    fields: contacts.map((contact, i) => ({
      id: `contact-${i}`,
      title: contact.name,
      label: contact.name,
      value: contact.role,
      role: contact.role,
      email: contact.email,
      phone: contact.phone,
    })),
  };
}

/**
 * Creates a chart section
 */
export function createChartSection(
  title: string,
  chartType: 'bar' | 'line' | 'pie' | 'doughnut',
  data: { labels: string[]; values: number[]; label?: string }
): CardSection {
  return {
    id: `chart-${Date.now()}`,
    title,
    type: 'chart',
    chartType,
    chartData: {
      labels: data.labels,
      datasets: [
        {
          label: data.label ?? 'Data',
          data: data.values,
        },
      ],
    },
  };
}

/**
 * Creates an event section
 */
export function createEventSection(
  title: string,
  events: Array<{ title: string; date: string; description?: string; status?: string }>
): CardSection {
  return {
    id: `event-${Date.now()}`,
    title,
    type: 'event',
    fields: events.map((event, i) => ({
      id: `event-${i}`,
      label: event.title,
      title: event.title,
      value: event.description ?? event.title,
      date: event.date,
      status: event.status as CardField['status'],
    })),
  };
}

// ============================================================================
// SAMPLE SECTIONS (FROM REGISTRY - SINGLE SOURCE OF TRUTH)
// ============================================================================

/**
 * Sample info section (from registry)
 * @deprecated Use getFixture('info', 'complete') instead
 */
export const SAMPLE_INFO_SECTION: CardSection = COMPLETE_FIXTURES['info']!;

/**
 * Sample analytics section (from registry)
 * @deprecated Use getFixture('analytics', 'complete') instead
 */
export const SAMPLE_ANALYTICS_SECTION: CardSection = COMPLETE_FIXTURES['analytics']!;

/**
 * Sample contact section (from registry)
 * @deprecated Use getFixture('contact-card', 'complete') instead
 */
export const SAMPLE_CONTACT_SECTION: CardSection = COMPLETE_FIXTURES['contact-card']!;

/**
 * Sample news section (from registry)
 * @deprecated Use getFixture('news', 'complete') instead
 */
export const SAMPLE_NEWS_SECTION: CardSection = COMPLETE_FIXTURES['news']!;

/**
 * Sample list section (from registry)
 * @deprecated Use getFixture('list', 'complete') instead
 */
export const SAMPLE_LIST_SECTION: CardSection = COMPLETE_FIXTURES['list']!;

/**
 * Sample chart section (from registry)
 * @deprecated Use getFixture('chart', 'complete') instead
 */
export const SAMPLE_CHART_SECTION: CardSection = COMPLETE_FIXTURES['chart']!;

/**
 * Sample event section (from registry)
 * @deprecated Use getFixture('event', 'complete') instead
 */
export const SAMPLE_EVENT_SECTION: CardSection = COMPLETE_FIXTURES['event']!;

/**
 * Collection of all sample sections (from registry)
 * @deprecated Use SECTION_FIXTURES.complete instead
 */
export const SAMPLE_SECTIONS: Record<string, CardSection> = {
  info: COMPLETE_FIXTURES['info']!,
  analytics: COMPLETE_FIXTURES['analytics']!,
  contact: COMPLETE_FIXTURES['contact-card']!,
  news: COMPLETE_FIXTURES['news']!,
  list: COMPLETE_FIXTURES['list']!,
  chart: COMPLETE_FIXTURES['chart']!,
  event: COMPLETE_FIXTURES['event']!,
};

// ============================================================================
// EDGE CASE SECTIONS (FROM REGISTRY)
// ============================================================================

/**
 * Section with empty fields
 */
export const EMPTY_FIELDS_SECTION: CardSection = {
  id: 'empty-fields',
  title: 'Empty Fields Section',
  type: 'info',
  fields: [],
};

/**
 * Section with null values (from registry edge cases)
 */
export const NULL_VALUES_SECTION: CardSection = EDGE_CASE_FIXTURES['info'] ?? {
  id: 'null-values',
  title: 'Null Values Section',
  type: 'info',
  fields: [
    { id: 'null-field', label: 'Null', value: null },
    { id: 'empty-field', label: 'Empty', value: '' },
  ],
};

/**
 * Section with many fields (for performance testing)
 */
export function createLargeSection(fieldCount: number): CardSection {
  const fields: CardField[] = [];
  for (let i = 0; i < fieldCount; i++) {
    fields.push({
      id: `field-${i}`,
      label: `Field ${i + 1}`,
      value: `Value ${i + 1}`,
    });
  }
  return {
    id: 'large-section',
    title: `Section with ${fieldCount} Fields`,
    type: 'info',
    fields,
  };
}

/**
 * Section with all possible field properties
 */
export const COMPLETE_FIELD_SECTION: CardSection = {
  id: 'complete-fields',
  title: 'All Field Properties',
  type: 'info',
  fields: [
    {
      id: 'complete-field',
      label: 'Complete Field',
      title: 'Field Title',
      value: 'Field Value',
      icon: '⭐',
      format: 'text',
      percentage: 75,
      change: 5.5,
      trend: 'up',
      performance: 'excellent',
      description: 'A field with all properties',
      status: 'active',
      priority: 'high',
      date: '2024-01-15',
      time: '14:30',
      category: 'Category A',
      clickable: true,
      link: 'https://example.com',
      valueColor: '#FF7900',
      backgroundColor: '#FFF5E6',
      meta: { custom: 'metadata' },
    },
  ],
};
