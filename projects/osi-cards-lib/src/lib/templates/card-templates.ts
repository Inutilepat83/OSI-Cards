/**
 * Card Templates (Improvement #84)
 * 
 * Pre-built card templates for common use cases.
 * Enables quick setup with professionally designed layouts.
 * 
 * @example
 * ```typescript
 * import { CardTemplates, applyTemplate } from 'osi-cards-lib';
 * 
 * // Get a contact card template
 * const contactCard = CardTemplates.contact({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   phone: '+1 555-0100'
 * });
 * 
 * // Get a product card template
 * const productCard = CardTemplates.product({
 *   name: 'Product Name',
 *   price: 99.99,
 *   description: 'Product description'
 * });
 * ```
 */

import type { AICardConfig, CardSection, CardField, CardItem, CardAction } from '../models';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Contact information
 */
export interface ContactInfo {
  name: string;
  email?: string;
  phone?: string;
  title?: string;
  company?: string;
  avatar?: string;
  social?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
}

/**
 * Product information
 */
export interface ProductInfo {
  name: string;
  price: number;
  currency?: string;
  description?: string;
  image?: string;
  features?: string[];
  rating?: number;
  reviews?: number;
  availability?: 'in-stock' | 'low-stock' | 'out-of-stock';
  sku?: string;
}

/**
 * Company information
 */
export interface CompanyInfo {
  name: string;
  description?: string;
  logo?: string;
  industry?: string;
  size?: string;
  founded?: number;
  headquarters?: string;
  website?: string;
  revenue?: string;
  employees?: number;
  contacts?: ContactInfo[];
}

/**
 * Event information
 */
export interface EventInfo {
  title: string;
  date: Date | string;
  time?: string;
  location?: string;
  description?: string;
  organizer?: string;
  attendees?: number;
  url?: string;
}

/**
 * Article/News information
 */
export interface ArticleInfo {
  title: string;
  summary?: string;
  content?: string;
  author?: string;
  date?: Date | string;
  source?: string;
  url?: string;
  image?: string;
  category?: string;
  tags?: string[];
}

/**
 * Analytics data
 */
export interface AnalyticsInfo {
  title: string;
  metrics: Array<{
    label: string;
    value: number | string;
    change?: number;
    trend?: 'up' | 'down' | 'stable';
  }>;
  chart?: {
    type: 'line' | 'bar' | 'pie';
    data: unknown;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// ============================================================================
// CARD TEMPLATES
// ============================================================================

/**
 * Card template factory
 */
export const CardTemplates = {
  /**
   * Contact card template
   */
  contact(info: ContactInfo): AICardConfig {
    const sections: CardSection[] = [
      {
        id: generateId('section'),
        type: 'contact-card',
        title: 'Contact Information',
        fields: [
          { id: generateId('field'), label: 'Name', value: info.name },
          ...(info.title ? [{ id: generateId('field'), label: 'Title', value: info.title }] : []),
          ...(info.company ? [{ id: generateId('field'), label: 'Company', value: info.company }] : []),
          ...(info.email ? [{ id: generateId('field'), label: 'Email', value: info.email }] : []),
          ...(info.phone ? [{ id: generateId('field'), label: 'Phone', value: info.phone }] : [])
        ]
      }
    ];

    const actions: CardAction[] = [];
    
    if (info.email) {
      actions.push({
        type: 'mail',
        label: 'Send Email',
        email: {
          contact: { name: info.name, email: info.email }
        }
      });
    }

    if (info.social?.linkedin) {
      actions.push({
        type: 'website',
        label: 'LinkedIn',
        url: info.social.linkedin
      });
    }

    if (info.social?.website) {
      actions.push({
        type: 'website',
        label: 'Website',
        url: info.social.website
      });
    }

    return {
      id: generateId('card'),
      cardTitle: info.name,
      description: info.title ? `${info.title}${info.company ? ` at ${info.company}` : ''}` : undefined,
      sections,
      actions: actions.length > 0 ? actions : undefined
    };
  },

  /**
   * Product card template
   */
  product(info: ProductInfo): AICardConfig {
    const fields: CardField[] = [
      { 
        id: generateId('field'), 
        label: 'Price', 
        value: formatCurrency(info.price, info.currency) 
      }
    ];

    if (info.sku) {
      fields.push({ id: generateId('field'), label: 'SKU', value: info.sku });
    }

    if (info.availability) {
      const availabilityText = {
        'in-stock': 'In Stock',
        'low-stock': 'Low Stock',
        'out-of-stock': 'Out of Stock'
      }[info.availability];
      fields.push({ id: generateId('field'), label: 'Availability', value: availabilityText });
    }

    if (info.rating !== undefined) {
      fields.push({ 
        id: generateId('field'), 
        label: 'Rating', 
        value: `${info.rating}/5${info.reviews ? ` (${info.reviews} reviews)` : ''}` 
      });
    }

    const sections: CardSection[] = [
      {
        id: generateId('section'),
        type: 'product',
        title: 'Product Details',
        fields,
        description: info.description
      }
    ];

    if (info.features && info.features.length > 0) {
      sections.push({
        id: generateId('section'),
        type: 'list',
        title: 'Features',
        items: info.features.map(feature => ({
          id: generateId('item'),
          title: feature
        }))
      });
    }

    return {
      id: generateId('card'),
      cardTitle: info.name,
      description: info.description,
      sections
    };
  },

  /**
   * Company profile template
   */
  company(info: CompanyInfo): AICardConfig {
    const fields: CardField[] = [];

    if (info.industry) {
      fields.push({ id: generateId('field'), label: 'Industry', value: info.industry });
    }
    if (info.size) {
      fields.push({ id: generateId('field'), label: 'Company Size', value: info.size });
    }
    if (info.founded) {
      fields.push({ id: generateId('field'), label: 'Founded', value: String(info.founded) });
    }
    if (info.headquarters) {
      fields.push({ id: generateId('field'), label: 'Headquarters', value: info.headquarters });
    }
    if (info.employees) {
      fields.push({ id: generateId('field'), label: 'Employees', value: info.employees.toLocaleString() });
    }
    if (info.revenue) {
      fields.push({ id: generateId('field'), label: 'Revenue', value: info.revenue });
    }

    const sections: CardSection[] = [
      {
        id: generateId('section'),
        type: 'overview',
        title: 'Company Overview',
        description: info.description,
        fields
      }
    ];

    if (info.contacts && info.contacts.length > 0) {
      sections.push({
        id: generateId('section'),
        type: 'list',
        title: 'Key Contacts',
        items: info.contacts.map(contact => ({
          id: generateId('item'),
          title: contact.name,
          description: contact.title ? `${contact.title}${contact.company ? ` - ${contact.company}` : ''}` : undefined
        }))
      });
    }

    const actions: CardAction[] = [];
    if (info.website) {
      actions.push({
        type: 'website',
        label: 'Visit Website',
        url: info.website
      });
    }

    return {
      id: generateId('card'),
      cardTitle: info.name,
      description: info.description,
      sections,
      actions: actions.length > 0 ? actions : undefined
    };
  },

  /**
   * Event card template
   */
  event(info: EventInfo): AICardConfig {
    const fields: CardField[] = [
      { id: generateId('field'), label: 'Date', value: formatDate(info.date) }
    ];

    if (info.time) {
      fields.push({ id: generateId('field'), label: 'Time', value: info.time });
    }
    if (info.location) {
      fields.push({ id: generateId('field'), label: 'Location', value: info.location });
    }
    if (info.organizer) {
      fields.push({ id: generateId('field'), label: 'Organizer', value: info.organizer });
    }
    if (info.attendees) {
      fields.push({ id: generateId('field'), label: 'Attendees', value: info.attendees.toString() });
    }

    const sections: CardSection[] = [
      {
        id: generateId('section'),
        type: 'event',
        title: 'Event Details',
        description: info.description,
        fields
      }
    ];

    const actions: CardAction[] = [];
    if (info.url) {
      actions.push({
        type: 'website',
        label: 'Register',
        url: info.url
      });
    }

    return {
      id: generateId('card'),
      cardTitle: info.title,
      description: info.description,
      sections,
      actions: actions.length > 0 ? actions : undefined
    };
  },

  /**
   * Article/News card template
   */
  article(info: ArticleInfo): AICardConfig {
    const fields: CardField[] = [];

    if (info.author) {
      fields.push({ id: generateId('field'), label: 'Author', value: info.author });
    }
    if (info.date) {
      fields.push({ id: generateId('field'), label: 'Published', value: formatDate(info.date) });
    }
    if (info.source) {
      fields.push({ id: generateId('field'), label: 'Source', value: info.source });
    }
    if (info.category) {
      fields.push({ id: generateId('field'), label: 'Category', value: info.category });
    }

    const sections: CardSection[] = [
      {
        id: generateId('section'),
        type: 'news',
        title: info.title,
        description: info.summary || info.content,
        fields
      }
    ];

    if (info.tags && info.tags.length > 0) {
      sections.push({
        id: generateId('section'),
        type: 'list',
        title: 'Tags',
        items: info.tags.map(tag => ({
          id: generateId('item'),
          title: tag
        }))
      });
    }

    const actions: CardAction[] = [];
    if (info.url) {
      actions.push({
        type: 'website',
        label: 'Read More',
        url: info.url
      });
    }

    return {
      id: generateId('card'),
      cardTitle: info.title,
      description: info.summary,
      sections,
      actions: actions.length > 0 ? actions : undefined
    };
  },

  /**
   * Analytics dashboard template
   */
  analytics(info: AnalyticsInfo): AICardConfig {
    const fields: CardField[] = info.metrics.map(metric => ({
      id: generateId('field'),
      label: metric.label,
      value: typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value
    }));

    const sections: CardSection[] = [
      {
        id: generateId('section'),
        type: 'analytics',
        title: info.title,
        fields
      }
    ];

    if (info.chart) {
      sections.push({
        id: generateId('section'),
        type: 'chart',
        title: 'Chart',
        chartConfig: info.chart
      });
    }

    return {
      id: generateId('card'),
      cardTitle: info.title,
      sections
    };
  },

  /**
   * Empty card template (starter)
   */
  empty(title = 'New Card'): AICardConfig {
    return {
      id: generateId('card'),
      cardTitle: title,
      sections: [
        {
          id: generateId('section'),
          type: 'info',
          title: 'Section Title',
          fields: [
            { id: generateId('field'), label: 'Label', value: 'Value' }
          ]
        }
      ]
    };
  },

  /**
   * Comparison card template
   */
  comparison(
    title: string,
    items: Array<{ name: string; features: Record<string, string | boolean> }>
  ): AICardConfig {
    const sections: CardSection[] = items.map(item => ({
      id: generateId('section'),
      type: 'info',
      title: item.name,
      fields: Object.entries(item.features).map(([label, value]) => ({
        id: generateId('field'),
        label,
        value: typeof value === 'boolean' ? (value ? '✓' : '✗') : value
      }))
    }));

    return {
      id: generateId('card'),
      cardTitle: title,
      sections
    };
  }
};

// ============================================================================
// TEMPLATE UTILITIES
// ============================================================================

/**
 * Clone a card configuration
 */
export function cloneCard(card: AICardConfig): AICardConfig {
  return JSON.parse(JSON.stringify(card));
}

/**
 * Merge two card configurations
 */
export function mergeCards(
  base: AICardConfig,
  overrides: Partial<AICardConfig>
): AICardConfig {
  return {
    ...base,
    ...overrides,
    id: overrides.id ?? base.id ?? generateId('card'),
    sections: overrides.sections ?? base.sections,
    actions: overrides.actions ?? base.actions
  };
}

/**
 * Add a section to a card
 */
export function addSection(card: AICardConfig, section: CardSection): AICardConfig {
  return {
    ...card,
    sections: [
      ...card.sections,
      { ...section, id: section.id ?? generateId('section') }
    ]
  };
}

/**
 * Remove a section from a card
 */
export function removeSection(card: AICardConfig, sectionId: string): AICardConfig {
  return {
    ...card,
    sections: card.sections.filter(s => s.id !== sectionId)
  };
}

/**
 * Get all template types
 */
export function getTemplateTypes(): string[] {
  return ['contact', 'product', 'company', 'event', 'article', 'analytics', 'empty', 'comparison'];
}

