#!/usr/bin/env node
/**
 * Regenerate all documentation page components to use DocPageComponent
 * This removes NgDoc dependency for Angular 20 compatibility
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '../src/app/features/documentation');

// Page content templates for different doc types
const PAGE_CONTENTS = {
  // Section types from registry
  'section-types/info': {
    title: 'Info Section',
    content: `# Info Section

The Info section displays structured key-value information in a clean, readable format.

## Use Cases

- Company information
- Profile details
- Product specifications
- Configuration display

## Schema

\`\`\`typescript
interface InfoSection {
  type: 'info';
  title: string;
  fields: Array<{
    label: string;
    value: string;
    icon?: string;
    link?: string;
  }>;
}
\`\`\`

## Example

\`\`\`typescript
const infoSection = {
  title: 'Company Details',
  type: 'info',
  fields: [
    { label: 'Name', value: 'Acme Corporation' },
    { label: 'Industry', value: 'Technology' },
    { label: 'Founded', value: '2010' },
    { label: 'Website', value: 'acme.com', link: 'https://acme.com' }
  ]
};
\`\`\`

## Styling

The Info section uses a two-column grid layout on larger screens and stacks vertically on mobile.

### CSS Custom Properties

- \`--osi-info-label-color\`: Label text color
- \`--osi-info-value-color\`: Value text color
- \`--osi-info-gap\`: Spacing between fields

## Best Practices

1. Keep labels concise
2. Group related fields together
3. Use icons for visual scanning
4. Limit to 10-12 fields per section
`
  },
  'section-types/analytics': {
    title: 'Analytics Section',
    content: `# Analytics Section

Display key metrics and KPIs with optional trend indicators.

## Use Cases

- Dashboard metrics
- Performance indicators
- Business KPIs
- Statistics display

## Schema

\`\`\`typescript
interface AnalyticsSection {
  type: 'analytics';
  title: string;
  metrics: Array<{
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'neutral';
    change?: string;
    icon?: string;
  }>;
}
\`\`\`

## Example

\`\`\`typescript
const analyticsSection = {
  title: 'Key Metrics',
  type: 'analytics',
  metrics: [
    { label: 'Revenue', value: '$1.2M', trend: 'up', change: '+15%' },
    { label: 'Users', value: '12.5K', trend: 'up', change: '+8%' },
    { label: 'Churn', value: '2.3%', trend: 'down', change: '-0.5%' }
  ]
};
\`\`\`

## Styling

Metrics are displayed in a responsive grid with visual trend indicators.

### CSS Custom Properties

- \`--osi-metric-bg\`: Metric card background
- \`--osi-trend-up\`: Positive trend color (default: green)
- \`--osi-trend-down\`: Negative trend color (default: red)

## Best Practices

1. Show 3-6 metrics per section
2. Use consistent number formatting
3. Include trend context with change percentages
4. Choose meaningful metric names
`
  },
  'section-types/contact-card': {
    title: 'Contact Card Section',
    content: `# Contact Card Section

Display contact information with photo, name, role, and communication options.

## Use Cases

- Team member profiles
- Support contacts
- Sales representatives
- Executive profiles

## Schema

\`\`\`typescript
interface ContactCardSection {
  type: 'contact-card';
  title: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  imageUrl?: string;
  actions?: CardAction[];
}
\`\`\`

## Example

\`\`\`typescript
const contactSection = {
  title: 'Primary Contact',
  type: 'contact-card',
  name: 'Sarah Johnson',
  role: 'Account Manager',
  email: 'sarah@company.com',
  phone: '+1 555-0123',
  imageUrl: '/images/sarah.jpg',
  actions: [
    { type: 'mail', label: 'Email' },
    { type: 'website', label: 'LinkedIn', url: 'https://linkedin.com/in/sarah' }
  ]
};
\`\`\`

## Features

- Avatar with fallback initials
- Click-to-call phone numbers
- Click-to-email links
- Custom action buttons

## Best Practices

1. Include high-quality profile images
2. Verify contact information is current
3. Provide multiple contact methods
4. Use consistent image dimensions
`
  },
  'section-types/chart': {
    title: 'Chart Section',
    content: `# Chart Section

Render interactive charts using Chart.js integration.

## Use Cases

- Data visualization
- Trend analysis
- Comparative metrics
- Financial data

## Schema

\`\`\`typescript
interface ChartSection {
  type: 'chart';
  title: string;
  chartType: 'line' | 'bar' | 'pie' | 'doughnut' | 'radar';
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string;
    }>;
  };
  options?: ChartOptions;
}
\`\`\`

## Example

\`\`\`typescript
const chartSection = {
  title: 'Revenue Trend',
  type: 'chart',
  chartType: 'line',
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [{
      label: '2024 Revenue',
      data: [100, 120, 115, 140, 160],
      borderColor: '#6366f1'
    }]
  }
};
\`\`\`

## Chart Types

- **Line**: Trends over time
- **Bar**: Comparisons
- **Pie/Doughnut**: Proportions
- **Radar**: Multi-dimensional data

## Requirements

Install Chart.js:
\`\`\`bash
npm install chart.js
\`\`\`

## Best Practices

1. Choose appropriate chart types
2. Use consistent colors
3. Include legends for multiple datasets
4. Consider accessibility (patterns, not just colors)
`
  },
  'section-types/list': {
    title: 'List Section',
    content: `# List Section

Display items in a scrollable list with optional actions.

## Use Cases

- Feature lists
- Task lists
- Search results
- Related items

## Schema

\`\`\`typescript
interface ListSection {
  type: 'list';
  title: string;
  items: Array<{
    title: string;
    description?: string;
    icon?: string;
    badge?: string;
    actions?: CardAction[];
  }>;
  showBullets?: boolean;
}
\`\`\`

## Example

\`\`\`typescript
const listSection = {
  title: 'Key Features',
  type: 'list',
  items: [
    { title: 'Fast Performance', description: 'Optimized rendering' },
    { title: 'Type Safe', description: 'Full TypeScript support' },
    { title: 'Accessible', description: 'WCAG compliant' },
    { title: 'Themeable', description: 'CSS custom properties' }
  ],
  showBullets: true
};
\`\`\`

## Styling

- Clean, scannable layout
- Optional bullet points
- Hover states for interactive items

## Best Practices

1. Keep items concise
2. Group related items
3. Use consistent formatting
4. Consider virtual scrolling for long lists
`
  },
  'section-types/map': {
    title: 'Map Section',
    content: `# Map Section

Display location information with an interactive map.

## Use Cases

- Office locations
- Event venues
- Store locators
- Geographic data

## Schema

\`\`\`typescript
interface MapSection {
  type: 'map';
  title: string;
  locations: Array<{
    name: string;
    address: string;
    lat: number;
    lng: number;
    marker?: string;
  }>;
  zoom?: number;
  center?: { lat: number; lng: number };
}
\`\`\`

## Example

\`\`\`typescript
const mapSection = {
  title: 'Our Offices',
  type: 'map',
  locations: [
    { 
      name: 'Headquarters',
      address: '123 Main St, San Francisco, CA',
      lat: 37.7749,
      lng: -122.4194
    }
  ],
  zoom: 12
};
\`\`\`

## Features

- Multiple markers
- Custom marker icons
- Zoom controls
- Info windows on click

## Map Provider

By default uses OpenStreetMap. Configure in providers:

\`\`\`typescript
provideOSICards({
  mapProvider: 'openstreetmap' // or 'google', 'mapbox'
})
\`\`\`

## Best Practices

1. Provide fallback for map failures
2. Include text addresses
3. Use appropriate zoom levels
4. Consider static map images for print
`
  },
  'section-types/financials': {
    title: 'Financials Section',
    content: `# Financials Section

Display financial data with formatted currency values.

## Use Cases

- Company financials
- Pricing information
- Budget breakdowns
- Investment data

## Schema

\`\`\`typescript
interface FinancialsSection {
  type: 'financials';
  title: string;
  currency?: string;
  items: Array<{
    label: string;
    value: number;
    format?: 'currency' | 'percentage' | 'number';
    trend?: 'up' | 'down' | 'neutral';
  }>;
}
\`\`\`

## Example

\`\`\`typescript
const financialsSection = {
  title: 'Financial Summary',
  type: 'financials',
  currency: 'USD',
  items: [
    { label: 'Revenue', value: 1200000, format: 'currency', trend: 'up' },
    { label: 'Profit Margin', value: 0.23, format: 'percentage' },
    { label: 'YoY Growth', value: 0.15, format: 'percentage', trend: 'up' }
  ]
};
\`\`\`

## Formatting

- Automatic currency formatting
- Locale-aware number formats
- Percentage conversion
- Trend indicators

## Best Practices

1. Use consistent currency codes
2. Include relevant time periods
3. Show trends where meaningful
4. Consider significant figures
`
  },
  'section-types/event': {
    title: 'Event Section',
    content: `# Event Section

Display events or timeline items with dates.

## Use Cases

- Event schedules
- Milestones
- History timelines
- Agenda items

## Schema

\`\`\`typescript
interface EventSection {
  type: 'event';
  title: string;
  events: Array<{
    title: string;
    date: string;
    time?: string;
    location?: string;
    description?: string;
  }>;
  layout?: 'list' | 'timeline';
}
\`\`\`

## Example

\`\`\`typescript
const eventSection = {
  title: 'Upcoming Events',
  type: 'event',
  layout: 'timeline',
  events: [
    { 
      title: 'Product Launch',
      date: '2024-03-15',
      time: '10:00 AM',
      location: 'Virtual'
    },
    { 
      title: 'Q1 Review',
      date: '2024-04-01',
      time: '2:00 PM'
    }
  ]
};
\`\`\`

## Layouts

- **List**: Simple chronological list
- **Timeline**: Visual timeline with connecting line

## Best Practices

1. Sort events chronologically
2. Include all relevant details
3. Use consistent date formats
4. Mark past vs future events
`
  },
  'section-types/product': {
    title: 'Product Section',
    content: `# Product Section

Display product information with images and pricing.

## Use Cases

- Product showcases
- E-commerce displays
- Service offerings
- Feature highlights

## Schema

\`\`\`typescript
interface ProductSection {
  type: 'product';
  title: string;
  products: Array<{
    name: string;
    description?: string;
    price?: string;
    imageUrl?: string;
    features?: string[];
    actions?: CardAction[];
  }>;
}
\`\`\`

## Example

\`\`\`typescript
const productSection = {
  title: 'Our Products',
  type: 'product',
  products: [
    {
      name: 'Pro Plan',
      description: 'For growing teams',
      price: '$49/month',
      features: ['Unlimited users', 'Priority support', 'Advanced analytics'],
      actions: [{ type: 'website', label: 'Get Started', url: '/signup' }]
    }
  ]
};
\`\`\`

## Features

- Product cards with images
- Feature highlights
- Call-to-action buttons
- Price display

## Best Practices

1. Use high-quality product images
2. Keep descriptions concise
3. Highlight key features
4. Include clear CTAs
`
  },
  'section-types/solutions': {
    title: 'Solutions Section',
    content: `# Solutions Section

Showcase solutions, services, or offerings with icons and descriptions.

## Use Cases

- Service offerings
- Solution categories
- Capability highlights
- Industry solutions

## Schema

\`\`\`typescript
interface SolutionsSection {
  type: 'solutions';
  title: string;
  solutions: Array<{
    name: string;
    description: string;
    icon?: string;
    link?: string;
  }>;
}
\`\`\`

## Example

\`\`\`typescript
const solutionsSection = {
  title: 'Our Solutions',
  type: 'solutions',
  solutions: [
    {
      name: 'Cloud Infrastructure',
      description: 'Scalable cloud solutions for enterprise',
      icon: 'cloud',
      link: '/solutions/cloud'
    },
    {
      name: 'Data Analytics',
      description: 'Turn data into actionable insights',
      icon: 'chart-bar'
    }
  ]
};
\`\`\`

## Layout

Solutions are displayed in a responsive grid with icon, title, and description.

## Best Practices

1. Use consistent icon style
2. Write benefit-focused descriptions
3. Limit to 4-6 solutions per section
4. Include links for more details
`
  },
  'section-types/overview': {
    title: 'Overview Section',
    content: `# Overview Section

Display summary information or introductory content.

## Use Cases

- Executive summaries
- Quick facts
- At-a-glance information
- Card introductions

## Schema

\`\`\`typescript
interface OverviewSection {
  type: 'overview';
  title: string;
  content: string;
  highlights?: Array<{
    label: string;
    value: string;
  }>;
}
\`\`\`

## Example

\`\`\`typescript
const overviewSection = {
  title: 'Company Overview',
  type: 'overview',
  content: 'Acme Corp is a leading technology company specializing in innovative solutions for enterprise clients.',
  highlights: [
    { label: 'Founded', value: '2010' },
    { label: 'Employees', value: '500+' },
    { label: 'Locations', value: '12 countries' }
  ]
};
\`\`\`

## Best Practices

1. Keep content concise
2. Use highlights for key facts
3. Position early in the card
4. Write for scanning
`
  },
  'section-types/quotation': {
    title: 'Quotation Section',
    content: `# Quotation Section

Display testimonials, quotes, or reviews.

## Use Cases

- Customer testimonials
- Expert quotes
- Reviews
- Social proof

## Schema

\`\`\`typescript
interface QuotationSection {
  type: 'quotation';
  title: string;
  quotes: Array<{
    text: string;
    author: string;
    role?: string;
    company?: string;
    imageUrl?: string;
  }>;
}
\`\`\`

## Example

\`\`\`typescript
const quotationSection = {
  title: 'What Customers Say',
  type: 'quotation',
  quotes: [
    {
      text: 'OSI Cards transformed how we present data to clients.',
      author: 'Jane Smith',
      role: 'Product Manager',
      company: 'TechCorp'
    }
  ]
};
\`\`\`

## Styling

Quotes are displayed with decorative quotation marks and author attribution.

## Best Practices

1. Use real testimonials
2. Include author credentials
3. Keep quotes concise
4. Add photos when available
`
  },
  'section-types/network-card': {
    title: 'Network Card Section',
    content: `# Network Card Section

Display network graphs and relationship diagrams.

## Use Cases

- Organization charts
- Social networks
- System dependencies
- Knowledge graphs

## Schema

\`\`\`typescript
interface NetworkCardSection {
  type: 'network-card';
  title: string;
  nodes: Array<{
    id: string;
    label: string;
    type?: string;
    imageUrl?: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    label?: string;
  }>;
}
\`\`\`

## Example

\`\`\`typescript
const networkSection = {
  title: 'Team Structure',
  type: 'network-card',
  nodes: [
    { id: '1', label: 'CEO', type: 'executive' },
    { id: '2', label: 'CTO', type: 'executive' },
    { id: '3', label: 'Engineering', type: 'team' }
  ],
  edges: [
    { source: '1', target: '2' },
    { source: '2', target: '3' }
  ]
};
\`\`\`

## Features

- Force-directed layout
- Interactive zoom/pan
- Node tooltips
- Edge labels

## Best Practices

1. Limit node count (< 50)
2. Use meaningful node labels
3. Consider hierarchical layouts
4. Provide legend for node types
`
  },
  'section-types/text-reference': {
    title: 'Text Reference Section',
    content: `# Text Reference Section

Display text content with references and citations.

## Use Cases

- Documentation references
- Citations
- Source attributions
- Legal text

## Schema

\`\`\`typescript
interface TextReferenceSection {
  type: 'text-reference';
  title: string;
  content: string;
  references?: Array<{
    id: string;
    text: string;
    url?: string;
  }>;
}
\`\`\`

## Example

\`\`\`typescript
const textRefSection = {
  title: 'Sources',
  type: 'text-reference',
  content: 'According to recent studies[1], card-based interfaces improve comprehension by 40%.',
  references: [
    { 
      id: '1', 
      text: 'Smith et al., 2023. Card UI Study',
      url: 'https://example.com/study'
    }
  ]
};
\`\`\`

## Features

- Automatic reference numbering
- Clickable citations
- Footnote-style display
- External link handling

## Best Practices

1. Use consistent citation format
2. Verify all links
3. Number references sequentially
4. Include access dates for URLs
`
  },
  'section-types/brand-colors': {
    title: 'Brand Colors Section',
    content: `# Brand Colors Section

Display color palettes and brand colors.

## Use Cases

- Brand guidelines
- Design systems
- Color palettes
- Style guides

## Schema

\`\`\`typescript
interface BrandColorsSection {
  type: 'brand-colors';
  title: string;
  colors: Array<{
    name: string;
    hex: string;
    rgb?: string;
    usage?: string;
  }>;
}
\`\`\`

## Example

\`\`\`typescript
const brandColorsSection = {
  title: 'Brand Colors',
  type: 'brand-colors',
  colors: [
    { name: 'Primary', hex: '#6366f1', usage: 'Main actions' },
    { name: 'Secondary', hex: '#8b5cf6', usage: 'Accents' },
    { name: 'Success', hex: '#22c55e', usage: 'Positive states' },
    { name: 'Warning', hex: '#eab308', usage: 'Cautions' }
  ]
};
\`\`\`

## Features

- Color swatches
- Copy-to-clipboard hex values
- Contrast ratio display
- Usage guidelines

## Best Practices

1. Include usage guidelines
2. Ensure accessibility contrast
3. Show color variations
4. Include RGB/HSL values
`
  },
  'section-types/news': {
    title: 'News Section',
    content: `# News Section

Display news articles or announcements.

## Use Cases

- Company news
- Press releases
- Blog posts
- Announcements

## Schema

\`\`\`typescript
interface NewsSection {
  type: 'news';
  title: string;
  articles: Array<{
    title: string;
    date: string;
    summary?: string;
    imageUrl?: string;
    url?: string;
  }>;
}
\`\`\`

## Example

\`\`\`typescript
const newsSection = {
  title: 'Latest News',
  type: 'news',
  articles: [
    {
      title: 'Q4 2024 Results',
      date: '2024-01-15',
      summary: 'Record-breaking quarter with 40% growth',
      url: '/news/q4-results'
    }
  ]
};
\`\`\`

## Features

- Article cards
- Date formatting
- Read more links
- Featured images

## Best Practices

1. Show recent items first
2. Use compelling headlines
3. Include publication dates
4. Limit preview length
`
  },
  'section-types/social-media': {
    title: 'Social Media Section',
    content: `# Social Media Section

Display social media links and stats.

## Use Cases

- Social profiles
- Follow buttons
- Engagement metrics
- Social proof

## Schema

\`\`\`typescript
interface SocialMediaSection {
  type: 'social-media';
  title: string;
  profiles: Array<{
    platform: string;
    handle: string;
    url: string;
    followers?: number;
  }>;
}
\`\`\`

## Example

\`\`\`typescript
const socialSection = {
  title: 'Follow Us',
  type: 'social-media',
  profiles: [
    { platform: 'twitter', handle: '@osicards', url: 'https://twitter.com/osicards', followers: 10000 },
    { platform: 'linkedin', handle: 'OSI Cards', url: 'https://linkedin.com/company/osicards' },
    { platform: 'github', handle: 'osi-cards', url: 'https://github.com/osi-cards' }
  ]
};
\`\`\`

## Supported Platforms

- Twitter/X
- LinkedIn
- GitHub
- Facebook
- Instagram
- YouTube

## Best Practices

1. Verify all profile URLs
2. Use official handles
3. Show follower counts selectively
4. Include relevant platforms only
`
  },
  'section-types/base': {
    title: 'Base (Fallback) Section',
    content: `# Base (Fallback) Section

The fallback section for unknown or custom section types.

## Use Cases

- Unknown section types
- Custom sections
- Raw data display
- Debugging

## Schema

\`\`\`typescript
interface BaseSection {
  type: string;  // Any type not matching known types
  title: string;
  [key: string]: any;  // Arbitrary additional properties
}
\`\`\`

## Example

\`\`\`typescript
const customSection = {
  title: 'Custom Data',
  type: 'custom-widget',  // Unknown type → renders as base
  data: { /* arbitrary data */ }
};
\`\`\`

## Behavior

When a section type is not recognized:
1. The section is rendered using the base template
2. A warning is logged (dev mode)
3. Available data is displayed in a simple format

## Custom Section Plugins

To handle custom types, register a plugin:

\`\`\`typescript
sectionPluginRegistry.register('custom-widget', CustomWidgetComponent);
\`\`\`

See [Custom Sections](/docs/advanced/custom-sections) for details.
`
  }
};

// Generate simple page content for sections not in PAGE_CONTENTS
function generateDefaultContent(pagePath, title) {
  return `# ${title}

Documentation for ${title}.

## Overview

This section covers ${title.toLowerCase()} functionality in OSI Cards.

## Usage

See the examples and API reference below for implementation details.

## Example

\`\`\`typescript
// Example code for ${title}
\`\`\`

## Related

- [Getting Started](/docs/getting-started)
- [Best Practices](/docs/best-practices)
`;
}

// Convert path to title
function pathToTitle(p) {
  return p
    .split('/')
    .pop()
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Convert path to component name
function pathToComponentName(p) {
  const parts = p.split('/');
  const name = parts.map(part => 
    part.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')
  ).join('');
  return name + 'PageComponent';
}

// Generate page component content
function generatePageComponent(pagePath) {
  const title = pathToTitle(pagePath);
  const componentName = pathToComponentName(pagePath);
  const content = PAGE_CONTENTS[pagePath]?.content || generateDefaultContent(pagePath, title);
  
  // Escape backticks and template literal syntax in content
  const escapedContent = content
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');

  return `import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '${pagePath.includes('/') ? '../' : ''}../doc-page.component';

const pageContent = \`${escapedContent}\`;

@Component({
  selector: 'app-${pagePath.replace(/\//g, '-')}-page',
  standalone: true,
  imports: [DocPageComponent],
  template: \`<app-doc-page [content]="content"></app-doc-page>\`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ${componentName} {
  content = pageContent;
}

export default ${componentName};
`;
}

// List of pages to regenerate
const PAGES_TO_REGENERATE = [
  // Section types
  'section-types/info',
  'section-types/analytics',
  'section-types/contact-card',
  'section-types/network-card',
  'section-types/map',
  'section-types/financials',
  'section-types/event',
  'section-types/list',
  'section-types/chart',
  'section-types/product',
  'section-types/solutions',
  'section-types/overview',
  'section-types/quotation',
  'section-types/text-reference',
  'section-types/brand-colors',
  'section-types/news',
  'section-types/social-media',
  'section-types/base'
];

// Run the regeneration
function main() {
  console.log('Regenerating documentation pages...\n');
  
  let count = 0;
  
  for (const pagePath of PAGES_TO_REGENERATE) {
    const fullPath = path.join(DOCS_DIR, pagePath, 'page.component.ts');
    const dir = path.dirname(fullPath);
    
    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Generate component content
    const componentContent = generatePageComponent(pagePath);
    
    // Write file
    fs.writeFileSync(fullPath, componentContent, 'utf-8');
    console.log(`✓ ${pagePath}/page.component.ts`);
    count++;
  }
  
  console.log(`\nRegenerated ${count} page components.`);
}

main();







