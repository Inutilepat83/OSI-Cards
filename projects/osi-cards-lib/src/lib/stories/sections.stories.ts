/**
 * Section Components Stories
 *
 * Storybook stories for individual section components.
 * Each section type demonstrates its unique capabilities.
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { SectionRendererComponent } from '../components/section-renderer/section-renderer.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { applicationConfig } from '@storybook/angular';
import type { CardSection } from '../models';
import type { InfoSection as InfoSectionType, AnalyticsSection as AnalyticsSectionType, ListSection as ListSectionType, ContactCardSection as ContactCardSectionType } from '../models';

/**
 * Meta configuration for Section Renderer stories
 */
const meta: Meta<SectionRendererComponent> = {
  title: 'Components/Sections',
  component: SectionRendererComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [provideAnimations()]
    })
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Section components are the building blocks of AI Cards.
Each section type is optimized for displaying specific kinds of data.

## Available Section Types
- **info**: General information with labeled fields
- **analytics**: Metrics with trends and progress indicators
- **list**: Lists of items with status indicators
- **contact-card**: Contact information with actions
- **network-card**: Network visualization
- **map**: Geographic location display
- **financials**: Financial data presentation
- **chart**: Data visualization charts
- **news**: News article listings
- **social-media**: Social media integration
- And more...
        `
      }
    }
  },
  argTypes: {
    section: {
      description: 'The section configuration object',
      control: 'object'
    },
    isStreaming: {
      description: 'Whether the section is currently streaming',
      control: 'boolean'
    },
    index: {
      description: 'Index of the section in the card',
      control: 'number'
    }
  }
};

export default meta;
type Story = StoryObj<SectionRendererComponent>;

// =============================================================================
// INFO SECTION STORIES
// =============================================================================

const infoSection: InfoSectionType = {
  id: 'info-demo',
  title: 'Company Information',
  type: 'info',
  fields: [
    { id: 'f1', label: 'Company Name', value: 'Acme Corporation', icon: '🏢' },
    { id: 'f2', label: 'Industry', value: 'Technology', icon: '💻' },
    { id: 'f3', label: 'Founded', value: '2010', icon: '📅' },
    { id: 'f4', label: 'Headquarters', value: 'San Francisco, CA', icon: '📍' },
    { id: 'f5', label: 'Employees', value: '5,000+', icon: '👥' },
    { id: 'f6', label: 'Website', value: 'www.acme.com', icon: '🌐', type: 'url', url: 'https://acme.com' }
  ]
};

export const InfoSection: Story = {
  args: {
    section: infoSection,
    isStreaming: false,
    index: 0
  },
  parameters: {
    docs: {
      description: {
        story: 'Info sections display key-value pairs with optional icons and formatting.'
      }
    }
  }
};

export const InfoSectionMinimal: Story = {
  args: {
    section: {
      id: 'info-minimal',
      title: 'Basic Info',
      type: 'info',
      fields: [
        { id: 'f1', label: 'Name', value: 'John Doe' },
        { id: 'f2', label: 'Role', value: 'Developer' }
      ]
    },
    isStreaming: false,
    index: 0
  }
};

// =============================================================================
// ANALYTICS SECTION STORIES
// =============================================================================

const analyticsSection: AnalyticsSectionType = {
  id: 'analytics-demo',
  title: 'Performance Metrics',
  type: 'analytics',
  fields: [
    { id: 'a1', label: 'Revenue Growth', value: '25%', percentage: 25, trend: 'up', change: 5.2 },
    { id: 'a2', label: 'Market Share', value: '12%', percentage: 12, trend: 'stable', change: 0 },
    { id: 'a3', label: 'Customer Satisfaction', value: '4.8/5', percentage: 96, trend: 'up', change: 3 },
    { id: 'a4', label: 'Cost Reduction', value: '-8%', percentage: 8, trend: 'down', change: -2.1 }
  ]
};

export const AnalyticsSection: Story = {
  args: {
    section: analyticsSection,
    isStreaming: false,
    index: 0
  },
  parameters: {
    docs: {
      description: {
        story: 'Analytics sections display metrics with trend indicators and progress visualization.'
      }
    }
  }
};

export const AnalyticsTrends: Story = {
  args: {
    section: {
      id: 'analytics-trends',
      title: 'Key Metrics',
      type: 'analytics',
      fields: [
        { id: 't1', label: 'Users', value: '10K', trend: 'up', change: 15 },
        { id: 't2', label: 'Revenue', value: '$500K', trend: 'up', change: 22 },
        { id: 't3', label: 'Churn', value: '2%', trend: 'down', change: -5 }
      ]
    },
    isStreaming: false,
    index: 0
  }
};

// =============================================================================
// LIST SECTION STORIES
// =============================================================================

const listSection: ListSectionType = {
  id: 'list-demo',
  title: 'Recent Activities',
  type: 'list',
  items: [
    { id: 'i1', title: 'Product Launch', description: 'Successfully launched new feature set', icon: '🚀', status: 'completed' },
    { id: 'i2', title: 'Partnership Agreement', description: 'Signed deal with strategic partner', icon: '🤝', status: 'in-progress' },
    { id: 'i3', title: 'Team Expansion', description: 'Hiring 50 new engineers', icon: '👥', status: 'pending' },
    { id: 'i4', title: 'Market Research', description: 'Analyzing competitor landscape', icon: '📊', status: 'in-progress' }
  ]
};

export const ListSection: Story = {
  args: {
    section: listSection,
    isStreaming: false,
    index: 0
  },
  parameters: {
    docs: {
      description: {
        story: 'List sections display items with titles, descriptions, icons, and status indicators.'
      }
    }
  }
};

export const ListWithLinks: Story = {
  args: {
    section: {
      id: 'list-links',
      title: 'Resources',
      type: 'list',
      items: [
        { id: 'l1', title: 'Documentation', url: 'https://docs.example.com', icon: '📚' },
        { id: 'l2', title: 'API Reference', url: 'https://api.example.com', icon: '🔌' },
        { id: 'l3', title: 'Support', url: 'https://support.example.com', icon: '💬' }
      ]
    },
    isStreaming: false,
    index: 0
  }
};

// =============================================================================
// CONTACT CARD SECTION STORIES
// =============================================================================

const contactSection: ContactCardSectionType = {
  id: 'contact-demo',
  title: 'Key Contacts',
  type: 'contact-card',
  fields: [
    {
      id: 'c1',
      label: 'CEO',
      title: 'Jane Smith',
      value: 'Chief Executive Officer',
      email: 'jane.smith@acme.com',
      phone: '+1 555 0100',
      avatar: 'https://i.pravatar.cc/150?u=jane'
    },
    {
      id: 'c2',
      label: 'CTO',
      title: 'John Doe',
      value: 'Chief Technology Officer',
      email: 'john.doe@acme.com',
      phone: '+1 555 0101'
    },
    {
      id: 'c3',
      label: 'Sales Lead',
      title: 'Sarah Johnson',
      value: 'VP of Sales',
      email: 'sarah.j@acme.com'
    }
  ]
};

export const ContactCardSection: Story = {
  args: {
    section: contactSection,
    isStreaming: false,
    index: 0
  },
  parameters: {
    docs: {
      description: {
        story: 'Contact card sections display person information with quick action buttons.'
      }
    }
  }
};

// =============================================================================
// FINANCIALS SECTION STORIES
// =============================================================================

export const FinancialsSection: Story = {
  args: {
    section: {
      id: 'financials-demo',
      title: 'Financial Overview',
      type: 'financials',
      fields: [
        { id: 'rev', label: 'Annual Revenue', value: '$150M', change: 25, trend: 'up' },
        { id: 'profit', label: 'Net Profit', value: '$25M', change: 12, trend: 'up' },
        { id: 'margin', label: 'Profit Margin', value: '16.7%', percentage: 16.7, trend: 'stable' },
        { id: 'growth', label: 'YoY Growth', value: '+32%', change: 32, trend: 'up' }
      ]
    },
    isStreaming: false,
    index: 0
  }
};

// =============================================================================
// NEWS SECTION STORIES
// =============================================================================

export const NewsSection: Story = {
  args: {
    section: {
      id: 'news-demo',
      title: 'Latest News',
      type: 'news',
      items: [
        {
          id: 'n1',
          title: 'Acme Announces Q4 Results',
          description: 'Record-breaking revenue growth in fiscal Q4 2024',
          date: '2024-01-15',
          source: 'Business Wire',
          url: 'https://example.com/news/1'
        },
        {
          id: 'n2',
          title: 'New Product Line Launch',
          description: 'Introducing next-generation AI solutions',
          date: '2024-01-10',
          source: 'PR Newswire',
          url: 'https://example.com/news/2'
        },
        {
          id: 'n3',
          title: 'Strategic Partnership',
          description: 'Collaboration with industry leader announced',
          date: '2024-01-05',
          source: 'Reuters',
          url: 'https://example.com/news/3'
        }
      ]
    },
    isStreaming: false,
    index: 0
  }
};

// =============================================================================
// STREAMING STATES
// =============================================================================

export const StreamingSection: Story = {
  args: {
    section: {
      ...infoSection,
      id: 'streaming-info'
    },
    isStreaming: true,
    index: 0
  },
  parameters: {
    docs: {
      description: {
        story: 'Sections during streaming state show animated field population.'
      }
    }
  }
};

// =============================================================================
// OVERVIEW SECTION STORIES
// =============================================================================

export const OverviewSection: Story = {
  args: {
    section: {
      id: 'overview-demo',
      title: 'Company Overview',
      type: 'overview',
      fields: [
        { id: 'o1', label: 'Mission', value: 'Empowering businesses through innovative technology solutions' },
        { id: 'o2', label: 'Vision', value: 'To be the leading provider of AI-powered enterprise solutions' }
      ],
      items: [
        { id: 'k1', title: 'Core Values', description: 'Innovation, Integrity, Customer Focus' },
        { id: 'k2', title: 'Market Position', description: 'Top 3 in enterprise AI solutions' }
      ]
    },
    isStreaming: false,
    index: 0
  }
};

// =============================================================================
// PRODUCT SECTION STORIES
// =============================================================================

export const ProductSection: Story = {
  args: {
    section: {
      id: 'product-demo',
      title: 'Featured Products',
      type: 'product',
      items: [
        {
          id: 'p1',
          title: 'Enterprise AI Suite',
          description: 'Complete AI toolkit for large organizations',
          icon: '🤖',
          price: '$999/mo',
          features: ['Advanced Analytics', 'Custom Models', '24/7 Support']
        },
        {
          id: 'p2',
          title: 'Data Platform',
          description: 'Unified data management solution',
          icon: '📊',
          price: '$499/mo',
          features: ['Real-time Processing', 'Scalable Storage']
        }
      ]
    },
    isStreaming: false,
    index: 0
  }
};

// =============================================================================
// SOLUTIONS SECTION STORIES
// =============================================================================

export const SolutionsSection: Story = {
  args: {
    section: {
      id: 'solutions-demo',
      title: 'Industry Solutions',
      type: 'solutions',
      items: [
        {
          id: 's1',
          title: 'Healthcare',
          description: 'AI-powered diagnostics and patient care',
          icon: '🏥'
        },
        {
          id: 's2',
          title: 'Finance',
          description: 'Fraud detection and risk analysis',
          icon: '🏦'
        },
        {
          id: 's3',
          title: 'Retail',
          description: 'Customer experience optimization',
          icon: '🛒'
        }
      ]
    },
    isStreaming: false,
    index: 0
  }
};

// =============================================================================
// TEXT REFERENCE SECTION STORIES
// =============================================================================

export const TextReferenceSection: Story = {
  args: {
    section: {
      id: 'text-ref-demo',
      title: 'Documentation Reference',
      type: 'text-reference',
      fields: [
        {
          id: 'tr1',
          label: 'Summary',
          value: 'This document provides an overview of our API capabilities and integration patterns.'
        }
      ],
      items: [
        { id: 'ref1', title: 'API Guide', description: 'Complete API documentation', url: 'https://docs.example.com/api' },
        { id: 'ref2', title: 'SDK Reference', description: 'Client library documentation', url: 'https://docs.example.com/sdk' }
      ]
    },
    isStreaming: false,
    index: 0
  }
};

// =============================================================================
// EVENT SECTION STORIES
// =============================================================================

export const EventSection: Story = {
  args: {
    section: {
      id: 'event-demo',
      title: 'Upcoming Events',
      type: 'event',
      items: [
        {
          id: 'e1',
          title: 'Tech Summit 2024',
          description: 'Annual technology conference',
          date: '2024-03-15',
          location: 'San Francisco, CA',
          icon: '🎪'
        },
        {
          id: 'e2',
          title: 'Product Webinar',
          description: 'Live demo of new features',
          date: '2024-02-20',
          location: 'Online',
          icon: '💻'
        }
      ]
    },
    isStreaming: false,
    index: 0
  }
};

// =============================================================================
// FALLBACK SECTION
// =============================================================================

export const FallbackSection: Story = {
  args: {
    section: {
      id: 'unknown-type',
      title: 'Unknown Section Type',
      type: 'unknown-custom-type' as CardSection['type'],
      fields: [
        { id: 'f1', label: 'Data', value: 'Some data here' }
      ]
    },
    isStreaming: false,
    index: 0
  },
  parameters: {
    docs: {
      description: {
        story: 'Unknown section types gracefully fallback to a generic renderer.'
      }
    }
  }
};



