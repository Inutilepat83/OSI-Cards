# Section Types Reference

This document provides comprehensive code examples for all section types available in the OSI Cards library.

## Table of Contents

- [Overview](#overview)
- [Info Section](#info-section)
- [Overview Section](#overview-section)
- [Analytics Section](#analytics-section)
- [Chart Section](#chart-section)
- [List Section](#list-section)
- [Contact Card Section](#contact-card-section)
- [Network Card Section](#network-card-section)
- [Map Section](#map-section)
- [Event Section](#event-section)
- [Product Section](#product-section)
- [Solutions Section](#solutions-section)
- [Financials Section](#financials-section)
- [Quotation Section](#quotation-section)
- [Text Reference Section](#text-reference-section)
- [News Section](#news-section)
- [Brand Colors Section](#brand-colors-section)

---

## Overview

Each section type has specific fields and configurations. Sections can be combined in a card to create rich, interactive content.

### Basic Card Structure

```typescript
import { AICardConfig, CardSection } from 'osi-cards-lib';

const cardConfig: AICardConfig = {
  cardTitle: 'Example Card',
  sections: [
    // Add sections here
  ]
};
```

---

## Info Section

Displays key-value pairs in a clean, scannable format. Best for general information.

### Configuration

```typescript
import { CardSection } from 'osi-cards-lib';

const infoSection: CardSection = {
  type: 'info',
  title: 'Company Information',
  description: 'General details about the company',
  fields: [
    { label: 'Company Name', value: 'Acme Corp' },
    { label: 'Industry', value: 'Technology' },
    { label: 'Founded', value: '2010' },
    { label: 'Employees', value: '5,000+' },
    {
      label: 'Revenue',
      value: '$2.5B',
      change: 15.5,
      description: 'YoY growth'
    },
    {
      label: 'Market Cap',
      value: '$10B',
      trend: 'up'
    }
  ],
  // Optional layout hints
  preferredColumns: 1,
  priority: 'standard'
};
```

### With Click Actions

```typescript
const interactiveInfoSection: CardSection = {
  type: 'info',
  title: 'Quick Links',
  fields: [
    {
      id: 'website',
      label: 'Website',
      value: 'www.example.com',
      action: {
        type: 'link',
        url: 'https://example.com'
      }
    },
    {
      id: 'contact',
      label: 'Contact',
      value: 'sales@example.com',
      action: {
        type: 'email',
        email: 'sales@example.com'
      }
    }
  ]
};
```

---

## Overview Section

Extended info section with support for more fields and multiple columns.

### Configuration

```typescript
const overviewSection: CardSection = {
  type: 'overview',
  title: 'Company Overview',
  description: 'Comprehensive company profile',
  fields: [
    { label: 'Legal Name', value: 'Acme Corporation Inc.' },
    { label: 'Trading Name', value: 'Acme Corp' },
    { label: 'Stock Symbol', value: 'ACME' },
    { label: 'Exchange', value: 'NYSE' },
    { label: 'Sector', value: 'Information Technology' },
    { label: 'Industry', value: 'Software & Services' },
    { label: 'Headquarters', value: 'San Francisco, CA' },
    { label: 'CEO', value: 'Jane Smith' },
    { label: 'Fiscal Year End', value: 'December' },
    { label: 'Website', value: 'https://acme.com' }
  ],
  // Overview sections work well with 2-3 columns
  preferredColumns: 2,
  priority: 'important'
};
```

---

## Analytics Section

Displays metrics with visual indicators for trends and progress.

### Configuration

```typescript
const analyticsSection: CardSection = {
  type: 'analytics',
  title: 'Key Metrics',
  description: 'Performance indicators',
  fields: [
    {
      label: 'Monthly Active Users',
      value: '1.2M',
      change: 23.5,
      trend: 'up',
      percentage: 85
    },
    {
      label: 'Customer Satisfaction',
      value: '4.8/5',
      change: 0.2,
      trend: 'up',
      percentage: 96
    },
    {
      label: 'Churn Rate',
      value: '2.1%',
      change: -0.5,
      trend: 'down', // down is good for churn
      percentage: 21
    },
    {
      label: 'Net Promoter Score',
      value: '72',
      change: 5,
      trend: 'up',
      percentage: 72
    }
  ],
  preferredColumns: 2
};
```

### With Progress Bars

```typescript
const progressAnalytics: CardSection = {
  type: 'analytics',
  title: 'Q4 Goals Progress',
  fields: [
    { label: 'Revenue Target', value: '$10M', percentage: 78 },
    { label: 'New Customers', value: '500', percentage: 92 },
    { label: 'Team Growth', value: '25 hires', percentage: 60 },
    { label: 'Product Launches', value: '3 products', percentage: 100 }
  ]
};
```

---

## Chart Section

Renders data visualizations including bar charts, pie charts, and line charts.

### Bar Chart

```typescript
const barChartSection: CardSection = {
  type: 'chart',
  title: 'Quarterly Revenue',
  chartType: 'bar',
  fields: [
    { label: 'Q1 2024', value: 2500000 },
    { label: 'Q2 2024', value: 3100000 },
    { label: 'Q3 2024', value: 2800000 },
    { label: 'Q4 2024', value: 3500000 }
  ],
  // Charts typically span 2 columns
  preferredColumns: 2
};
```

### Pie Chart

```typescript
const pieChartSection: CardSection = {
  type: 'chart',
  title: 'Revenue by Region',
  chartType: 'pie',
  fields: [
    { label: 'North America', value: 45 },
    { label: 'Europe', value: 30 },
    { label: 'Asia Pacific', value: 18 },
    { label: 'Rest of World', value: 7 }
  ],
  preferredColumns: 2
};
```

### Line Chart

```typescript
const lineChartSection: CardSection = {
  type: 'chart',
  title: 'Stock Price History',
  chartType: 'line',
  fields: [
    { label: 'Jan', value: 125 },
    { label: 'Feb', value: 130 },
    { label: 'Mar', value: 128 },
    { label: 'Apr', value: 145 },
    { label: 'May', value: 152 },
    { label: 'Jun', value: 148 }
  ]
};
```

---

## List Section

Displays items in a list format with optional status indicators.

### Configuration

```typescript
const listSection: CardSection = {
  type: 'list',
  title: 'Recent Projects',
  description: 'Active initiatives',
  items: [
    {
      title: 'Cloud Migration',
      value: 'In Progress',
      status: 'active',
      description: 'Migrating to AWS infrastructure'
    },
    {
      title: 'Mobile App v2.0',
      value: 'Planning',
      status: 'pending',
      description: 'Next generation mobile experience'
    },
    {
      title: 'Data Analytics Platform',
      value: 'Completed',
      status: 'complete',
      description: 'Real-time analytics dashboard'
    },
    {
      title: 'Security Audit',
      value: 'Scheduled',
      status: 'pending',
      description: 'Annual security compliance review'
    }
  ]
};
```

### With Icons

```typescript
const iconListSection: CardSection = {
  type: 'list',
  title: 'Services',
  items: [
    {
      title: 'Cloud Computing',
      value: 'Enterprise',
      icon: 'cloud'
    },
    {
      title: 'Data Analytics',
      value: 'Professional',
      icon: 'bar-chart'
    },
    {
      title: 'Cybersecurity',
      value: 'Advanced',
      icon: 'shield'
    }
  ]
};
```

---

## Contact Card Section

Displays contact information for people or organizations.

### Configuration

```typescript
const contactSection: CardSection = {
  type: 'contact-card',
  title: 'Key Contacts',
  contacts: [
    {
      name: 'Jane Smith',
      role: 'CEO',
      email: 'jane.smith@example.com',
      phone: '+1 (555) 123-4567',
      avatar: 'https://example.com/avatars/jane.jpg'
    },
    {
      name: 'John Doe',
      role: 'CFO',
      email: 'john.doe@example.com',
      phone: '+1 (555) 234-5678',
      linkedin: 'https://linkedin.com/in/johndoe'
    },
    {
      name: 'Alice Johnson',
      role: 'CTO',
      email: 'alice.johnson@example.com',
      twitter: '@alicejohnson'
    }
  ],
  // Contact cards work well in single column
  preferredColumns: 1,
  orientation: 'horizontal'
};
```

---

## Network Card Section

Shows relationship networks and connections.

### Configuration

```typescript
const networkSection: CardSection = {
  type: 'network-card',
  title: 'Key Relationships',
  primaryContact: {
    name: 'Acme Corporation',
    type: 'company',
    avatar: 'https://example.com/logos/acme.png'
  },
  connections: [
    {
      name: 'Global Partners Inc.',
      relationship: 'Strategic Partner',
      strength: 'strong'
    },
    {
      name: 'Tech Solutions Ltd.',
      relationship: 'Vendor',
      strength: 'moderate'
    },
    {
      name: 'Innovation Labs',
      relationship: 'Investment',
      strength: 'strong'
    }
  ]
};
```

---

## Map Section

Displays location data on an interactive map.

### Configuration

```typescript
const mapSection: CardSection = {
  type: 'map',
  title: 'Office Locations',
  description: 'Global presence',
  locations: [
    {
      name: 'Headquarters',
      address: '123 Market St, San Francisco, CA',
      lat: 37.7749,
      lng: -122.4194,
      type: 'headquarters'
    },
    {
      name: 'European Office',
      address: '10 Downing St, London, UK',
      lat: 51.5074,
      lng: -0.1278,
      type: 'office'
    },
    {
      name: 'Asia Pacific Hub',
      address: '1 Raffles Place, Singapore',
      lat: 1.3521,
      lng: 103.8198,
      type: 'office'
    }
  ],
  // Maps benefit from wider display
  preferredColumns: 2,
  mapOptions: {
    zoom: 2,
    center: { lat: 20, lng: 0 }
  }
};
```

---

## Event Section

Displays timeline of events or milestones.

### Configuration

```typescript
const eventSection: CardSection = {
  type: 'event',
  title: 'Upcoming Events',
  events: [
    {
      title: 'Q4 Earnings Call',
      date: '2024-01-15',
      time: '4:00 PM EST',
      type: 'earnings',
      description: 'Quarterly financial results presentation'
    },
    {
      title: 'Annual Shareholder Meeting',
      date: '2024-02-20',
      type: 'meeting',
      location: 'San Francisco, CA'
    },
    {
      title: 'Product Launch',
      date: '2024-03-01',
      type: 'launch',
      description: 'New enterprise platform release'
    },
    {
      title: 'Industry Conference',
      date: '2024-03-15',
      type: 'conference',
      location: 'Las Vegas, NV',
      description: 'Tech Summit 2024'
    }
  ]
};
```

---

## Product Section

Showcases products or services.

### Configuration

```typescript
const productSection: CardSection = {
  type: 'product',
  title: 'Products & Services',
  products: [
    {
      name: 'Enterprise Cloud Suite',
      description: 'Complete cloud infrastructure solution',
      category: 'Cloud',
      price: 'From $999/mo',
      features: ['Auto-scaling', 'Global CDN', '24/7 Support'],
      icon: 'cloud'
    },
    {
      name: 'Data Analytics Pro',
      description: 'Advanced business intelligence platform',
      category: 'Analytics',
      price: 'From $499/mo',
      features: ['Real-time dashboards', 'ML insights', 'Custom reports'],
      icon: 'trending-up'
    },
    {
      name: 'SecureShield',
      description: 'Enterprise-grade cybersecurity',
      category: 'Security',
      price: 'Custom pricing',
      features: ['Threat detection', 'Compliance', 'Incident response'],
      icon: 'shield'
    }
  ],
  preferredColumns: 2
};
```

---

## Solutions Section

Describes solution offerings or capabilities.

### Configuration

```typescript
const solutionsSection: CardSection = {
  type: 'solutions',
  title: 'Industry Solutions',
  solutions: [
    {
      title: 'Financial Services',
      description: 'Regulatory-compliant solutions for banks and fintech',
      benefits: ['SOC 2 certified', 'Real-time transactions', 'Fraud detection'],
      icon: 'building-bank'
    },
    {
      title: 'Healthcare',
      description: 'HIPAA-compliant healthcare technology',
      benefits: ['EHR integration', 'Telehealth', 'Patient analytics'],
      icon: 'heart-pulse'
    },
    {
      title: 'Retail & E-commerce',
      description: 'Omnichannel commerce solutions',
      benefits: ['Inventory sync', 'Personalization', 'Payment processing'],
      icon: 'shopping-cart'
    }
  ]
};
```

---

## Financials Section

Displays financial data and metrics.

### Configuration

```typescript
const financialsSection: CardSection = {
  type: 'financials',
  title: 'Financial Highlights',
  description: 'FY 2024 Summary',
  fields: [
    {
      label: 'Total Revenue',
      value: '$2.5B',
      change: 18.5,
      trend: 'up',
      period: 'YoY'
    },
    {
      label: 'Gross Profit',
      value: '$1.2B',
      change: 22.3,
      trend: 'up',
      percentage: 48 // Gross margin
    },
    {
      label: 'Operating Income',
      value: '$450M',
      change: 15.2,
      trend: 'up'
    },
    {
      label: 'Net Income',
      value: '$320M',
      change: 12.8,
      trend: 'up'
    },
    {
      label: 'EPS',
      value: '$3.25',
      change: 0.45,
      trend: 'up'
    },
    {
      label: 'Free Cash Flow',
      value: '$280M',
      change: -5.2,
      trend: 'down'
    }
  ],
  preferredColumns: 2
};
```

---

## Quotation Section

Displays quotes, testimonials, or key statements.

### Configuration

```typescript
const quotationSection: CardSection = {
  type: 'quotation',
  title: 'Customer Testimonials',
  quotes: [
    {
      text: 'Implementing Acme\'s solution reduced our operational costs by 40% in the first year.',
      author: 'Michael Chen',
      role: 'VP of Operations',
      company: 'Global Logistics Inc.',
      avatar: 'https://example.com/avatars/michael.jpg'
    },
    {
      text: 'The support team is exceptional. They helped us solve complex integration challenges within days.',
      author: 'Sarah Williams',
      role: 'CTO',
      company: 'TechStart Corp.'
    }
  ]
};
```

---

## Text Reference Section

Displays referenced text, citations, or source material.

### Configuration

```typescript
const textReferenceSection: CardSection = {
  type: 'text-reference',
  title: 'Source Documents',
  references: [
    {
      title: 'Annual Report 2024',
      excerpt: 'The company achieved record revenue growth of 18.5% year-over-year, driven by strong performance in cloud services...',
      source: 'SEC Filing 10-K',
      date: '2024-01-15',
      url: 'https://sec.gov/example'
    },
    {
      title: 'Market Analysis',
      excerpt: 'Industry analysts project the cloud services market to grow at 22% CAGR through 2028...',
      source: 'Gartner Research',
      date: '2024-02-01'
    }
  ]
};
```

---

## News Section

Displays news articles or announcements.

### Configuration

```typescript
const newsSection: CardSection = {
  type: 'news',
  title: 'Latest News',
  articles: [
    {
      title: 'Acme Corp Announces Strategic Partnership',
      summary: 'New collaboration to expand cloud services in EMEA region',
      date: '2024-01-20',
      source: 'PR Newswire',
      url: 'https://example.com/news/partnership',
      image: 'https://example.com/images/partnership.jpg'
    },
    {
      title: 'Q4 2024 Results Exceed Expectations',
      summary: 'Company reports 25% revenue growth and raises guidance',
      date: '2024-01-15',
      source: 'Business Wire',
      category: 'earnings'
    },
    {
      title: 'New AI-Powered Analytics Platform Launched',
      summary: 'Revolutionary ML capabilities for enterprise customers',
      date: '2024-01-10',
      source: 'TechCrunch',
      category: 'product'
    }
  ]
};
```

---

## Brand Colors Section

Displays brand color palette and guidelines.

### Configuration

```typescript
const brandColorsSection: CardSection = {
  type: 'brand-colors',
  title: 'Brand Palette',
  colors: [
    {
      name: 'Primary Blue',
      hex: '#0066CC',
      rgb: 'rgb(0, 102, 204)',
      usage: 'Primary brand color, CTAs'
    },
    {
      name: 'Secondary Green',
      hex: '#00A86B',
      rgb: 'rgb(0, 168, 107)',
      usage: 'Success states, accents'
    },
    {
      name: 'Neutral Gray',
      hex: '#6B7280',
      rgb: 'rgb(107, 114, 128)',
      usage: 'Text, borders'
    },
    {
      name: 'Alert Red',
      hex: '#DC2626',
      rgb: 'rgb(220, 38, 38)',
      usage: 'Errors, warnings'
    }
  ]
};
```

---

## Complete Card Example

Here's a complete example combining multiple section types:

```typescript
import { AICardConfig } from 'osi-cards-lib';

const completeCard: AICardConfig = {
  cardTitle: 'Acme Corporation Profile',
  sections: [
    {
      type: 'overview',
      title: 'Company Overview',
      priority: 'critical',
      fields: [
        { label: 'Name', value: 'Acme Corporation' },
        { label: 'Ticker', value: 'ACME' },
        { label: 'Sector', value: 'Technology' },
        { label: 'Employees', value: '5,000+' }
      ]
    },
    {
      type: 'analytics',
      title: 'Key Metrics',
      priority: 'important',
      fields: [
        { label: 'Revenue', value: '$2.5B', change: 18.5, trend: 'up' },
        { label: 'Growth', value: '18.5%', percentage: 85 },
        { label: 'NPS', value: '72', change: 5, trend: 'up' }
      ]
    },
    {
      type: 'chart',
      title: 'Revenue Trend',
      chartType: 'bar',
      fields: [
        { label: 'Q1', value: 550 },
        { label: 'Q2', value: 620 },
        { label: 'Q3', value: 580 },
        { label: 'Q4', value: 750 }
      ]
    },
    {
      type: 'contact-card',
      title: 'Key Contacts',
      contacts: [
        {
          name: 'Jane Smith',
          role: 'CEO',
          email: 'jane@acme.com'
        }
      ]
    },
    {
      type: 'event',
      title: 'Upcoming Events',
      events: [
        {
          title: 'Earnings Call',
          date: '2024-01-15',
          type: 'earnings'
        }
      ]
    }
  ]
};
```

---

## Section Layout Options

All sections support these common layout options:

```typescript
interface SectionLayoutOptions {
  /** Preferred number of columns (1-4) */
  preferredColumns?: 1 | 2 | 3 | 4;
  
  /** Minimum columns (won't shrink below this) */
  minColumns?: number;
  
  /** Maximum columns (won't expand beyond this) */
  maxColumns?: number;
  
  /** Section priority for layout ordering */
  priority?: 'critical' | 'important' | 'standard' | 'optional';
  
  /** Orientation hint */
  orientation?: 'vertical' | 'horizontal' | 'auto';
  
  /** Whether section should stick to top */
  sticky?: boolean;
  
  /** Whether section can expand to fill space */
  flexGrow?: boolean;
  
  /** Group ID for related sections */
  groupId?: string;
}
```

---

## TypeScript Types

All types are exported from the library:

```typescript
import {
  AICardConfig,
  CardSection,
  CardField,
  CardContact,
  CardEvent,
  CardProduct,
  CardLocation,
  SectionRenderEvent
} from 'osi-cards-lib';
```

For the complete type definitions, see the [API Documentation](./api/).




