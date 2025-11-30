/**
 * Section Test Fixtures
 * 
 * Provides factory functions for creating test section configurations.
 * 
 * @example
 * ```typescript
 * import { createMockSection, SAMPLE_SECTIONS } from 'osi-cards-lib/testing';
 * 
 * const section = createMockSection({
 *   type: 'analytics',
 *   title: 'Performance',
 *   fields: [...]
 * });
 * ```
 */

import type { CardSection, CardField, CardItem } from '../../models/card.model';

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
    fields: [
      { id: 'field-1', label: 'Test Field', value: 'Test Value' },
    ],
    ...overrides,
  };
}

/**
 * Creates an info section with fields
 */
export function createInfoSection(
  title: string,
  fields: Partial<CardField>[]
): CardSection {
  return {
    id: `info-${Date.now()}`,
    title,
    type: 'info',
    fields: fields.map((f, i) => ({
      id: `field-${i}`,
      label: 'Label',
      value: 'Value',
      ...f,
    })),
  };
}

/**
 * Creates an analytics section with metrics
 */
export function createAnalyticsSection(
  title: string,
  metrics: Array<{ label: string; value: string; percentage?: number; trend?: 'up' | 'down' | 'stable' }>
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
export function createListSection(
  title: string,
  items: Partial<CardItem>[]
): CardSection {
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
// SAMPLE SECTIONS
// ============================================================================

/**
 * Sample info section
 */
export const SAMPLE_INFO_SECTION: CardSection = {
  id: 'sample-info',
  title: 'Company Information',
  type: 'info',
  emoji: '🏢',
  fields: [
    { id: 'industry', label: 'Industry', value: 'Technology', icon: '💻' },
    { id: 'founded', label: 'Founded', value: '2010' },
    { id: 'size', label: 'Company Size', value: '1,000-5,000 employees' },
    { id: 'location', label: 'Headquarters', value: 'San Francisco, CA' },
    { id: 'revenue', label: 'Annual Revenue', value: '$50-100M', trend: 'up' },
  ],
};

/**
 * Sample analytics section
 */
export const SAMPLE_ANALYTICS_SECTION: CardSection = {
  id: 'sample-analytics',
  title: 'Performance Metrics',
  type: 'analytics',
  emoji: '📊',
  fields: [
    { id: 'score', label: 'Performance Score', value: '95/100', percentage: 95, trend: 'up', change: 5 },
    { id: 'growth', label: 'Revenue Growth', value: '25%', percentage: 25, trend: 'up', change: 8 },
    { id: 'satisfaction', label: 'Customer Satisfaction', value: '4.8/5', percentage: 96, trend: 'stable' },
    { id: 'retention', label: 'Retention Rate', value: '92%', percentage: 92, trend: 'up', change: 3 },
  ],
};

/**
 * Sample contact section
 */
export const SAMPLE_CONTACT_SECTION: CardSection = {
  id: 'sample-contact',
  title: 'Key Contacts',
  type: 'contact-card',
  emoji: '👤',
  fields: [
    {
      id: 'contact-1',
      title: 'John Smith',
      label: 'John Smith',
      value: 'Chief Executive Officer',
      role: 'CEO',
      email: 'john.smith@company.com',
      phone: '+1 (555) 123-4567',
      department: 'Executive',
    },
    {
      id: 'contact-2',
      title: 'Jane Doe',
      label: 'Jane Doe',
      value: 'Chief Technology Officer',
      role: 'CTO',
      email: 'jane.doe@company.com',
      phone: '+1 (555) 987-6543',
      department: 'Technology',
    },
  ],
};

/**
 * Sample news section
 */
export const SAMPLE_NEWS_SECTION: CardSection = {
  id: 'sample-news',
  title: 'Recent News',
  type: 'news',
  emoji: '📰',
  items: [
    {
      id: 'news-1',
      title: 'Company Announces Strategic Partnership',
      description: 'New partnership expected to drive growth in emerging markets',
      meta: { source: 'Business Wire', date: '2024-01-15' },
    },
    {
      id: 'news-2',
      title: 'Q4 Earnings Exceed Expectations',
      description: 'Record revenue growth of 30% year-over-year',
      meta: { source: 'Financial Times', date: '2024-01-10' },
    },
    {
      id: 'news-3',
      title: 'New Product Launch Announcement',
      description: 'Enterprise Suite 5.0 introduces AI-powered features',
      meta: { source: 'TechCrunch', date: '2024-01-05' },
    },
  ],
};

/**
 * Sample list section
 */
export const SAMPLE_LIST_SECTION: CardSection = {
  id: 'sample-list',
  title: 'Key Products',
  type: 'list',
  emoji: '📦',
  items: [
    { id: 'product-1', title: 'Enterprise Suite', description: 'Complete business management solution', icon: '🏢' },
    { id: 'product-2', title: 'Cloud Platform', description: 'Scalable cloud infrastructure', icon: '☁️' },
    { id: 'product-3', title: 'Analytics Pro', description: 'Advanced analytics and reporting', icon: '📊' },
    { id: 'product-4', title: 'Security Shield', description: 'Enterprise-grade security', icon: '🔒' },
  ],
};

/**
 * Sample chart section
 */
export const SAMPLE_CHART_SECTION: CardSection = {
  id: 'sample-chart',
  title: 'Revenue Trend',
  type: 'chart',
  emoji: '📈',
  chartType: 'line',
  chartData: {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      {
        label: 'Revenue (M$)',
        data: [10, 12, 14, 18],
        borderColor: '#FF7900',
        backgroundColor: 'rgba(255, 121, 0, 0.1)',
      },
    ],
  },
};

/**
 * Sample event section
 */
export const SAMPLE_EVENT_SECTION: CardSection = {
  id: 'sample-event',
  title: 'Upcoming Events',
  type: 'event',
  emoji: '📅',
  fields: [
    {
      id: 'event-1',
      label: 'Annual Conference',
      title: 'Annual Conference',
      value: 'Tech Summit 2024',
      date: '2024-03-15',
      status: 'pending' as CardField['status'],
    },
    {
      id: 'event-2',
      label: 'Product Launch',
      title: 'Product Launch',
      value: 'Enterprise Suite 5.0 Launch',
      date: '2024-02-28',
      status: 'in-progress' as CardField['status'],
    },
    {
      id: 'event-3',
      label: 'Earnings Call',
      title: 'Earnings Call',
      value: 'Q4 2024 Earnings',
      date: '2024-01-25',
      status: 'completed' as CardField['status'],
    },
  ],
};

/**
 * Collection of all sample sections
 */
export const SAMPLE_SECTIONS: Record<string, CardSection> = {
  info: SAMPLE_INFO_SECTION,
  analytics: SAMPLE_ANALYTICS_SECTION,
  contact: SAMPLE_CONTACT_SECTION,
  news: SAMPLE_NEWS_SECTION,
  list: SAMPLE_LIST_SECTION,
  chart: SAMPLE_CHART_SECTION,
  event: SAMPLE_EVENT_SECTION,
};

// ============================================================================
// EDGE CASE SECTIONS
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
 * Section with null values
 */
export const NULL_VALUES_SECTION: CardSection = {
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

