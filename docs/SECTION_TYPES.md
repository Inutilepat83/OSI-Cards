# Section Types Reference

Quick reference for all section types in OSI Cards.

## Table of Contents

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

## Info Section

Displays key-value pairs. Best for general information.

```typescript
const section: CardSection = {
  type: 'info',
  title: 'Company Information',
  fields: [
    { label: 'Name', value: 'Acme Corp' },
    { label: 'Industry', value: 'Technology' },
    { label: 'Employees', value: '5,000+' },
  ],
};
```

## Overview Section

Extended info section with more fields.

```typescript
const section: CardSection = {
  type: 'overview',
  title: 'Company Overview',
  fields: [
    { label: 'Legal Name', value: 'Acme Corporation Inc.' },
    { label: 'Stock Symbol', value: 'ACME' },
    { label: 'Headquarters', value: 'San Francisco, CA' },
  ],
  preferredColumns: 2,
};
```

## Analytics Section

Displays metrics with trends and progress.

```typescript
const section: CardSection = {
  type: 'analytics',
  title: 'Key Metrics',
  fields: [
    {
      label: 'Monthly Active Users',
      value: '1.2M',
      change: 23.5,
      trend: 'up',
      percentage: 85,
    },
  ],
};
```

## Chart Section

Visualizes data with Chart.js.

```typescript
const section: CardSection = {
  type: 'chart',
  title: 'Sales Trend',
  chartType: 'line',
  chartData: {
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [
      {
        label: 'Sales',
        data: [100, 150, 200],
      },
    ],
  },
};
```

## List Section

Displays bullet points or numbered lists.

```typescript
const section: CardSection = {
  type: 'list',
  title: 'Key Features',
  items: [
    { title: 'Feature 1', description: 'Description here' },
    { title: 'Feature 2', description: 'Another feature' },
  ],
};
```

## Contact Card Section

Displays contact information.

```typescript
const section: CardSection = {
  type: 'contact-card',
  title: 'Primary Contact',
  fields: [
    {
      title: 'John Doe',
      value: 'Sales Manager',
      email: 'john@example.com',
      phone: '+1 555-1234',
    },
  ],
};
```

## Network Card Section

Shows network or organizational connections.

```typescript
const section: CardSection = {
  type: 'network-card',
  title: 'Partners',
  items: [{ title: 'Partner A', description: 'Technology partner' }],
};
```

## Map Section

Displays location markers.

```typescript
const section: CardSection = {
  type: 'map',
  title: 'Office Location',
  fields: [
    {
      name: 'HQ',
      x: 50,
      y: 50,
      type: 'office',
    },
  ],
};
```

## Event Section

Shows event information.

```typescript
const section: CardSection = {
  type: 'event',
  title: 'Upcoming Events',
  fields: [
    {
      label: 'Product Launch',
      value: 'Q1 2025',
      date: '2025-03-15',
      category: 'Launch',
    },
  ],
};
```

## Product Section

Displays product information.

```typescript
const section: CardSection = {
  type: 'product',
  title: 'Products',
  fields: [
    {
      label: 'Product Name',
      value: 'Enterprise Suite',
      icon: '📦',
    },
  ],
};
```

## Solutions Section

Lists business solutions.

```typescript
const section: CardSection = {
  type: 'solutions',
  title: 'Recommended Solutions',
  fields: [
    {
      title: 'Cloud Migration',
      description: 'Move to cloud infrastructure',
      benefits: ['Scalability', 'Cost savings'],
    },
  ],
};
```

## Financials Section

Displays financial data.

```typescript
const section: CardSection = {
  type: 'financials',
  title: 'Financial Summary',
  fields: [
    {
      label: 'Revenue',
      value: '$10M',
      format: 'currency',
      change: 15,
    },
  ],
};
```

## Quotation Section

Shows testimonials or quotes.

```typescript
const section: CardSection = {
  type: 'quotation',
  title: 'Customer Feedback',
  fields: [
    {
      value: 'Excellent product and service',
      author: 'Jane Smith',
      role: 'CEO, Tech Corp',
    },
  ],
};
```

## Text Reference Section

Links to external documents.

```typescript
const section: CardSection = {
  type: 'text-reference',
  title: 'Documentation',
  fields: [
    {
      label: 'User Guide',
      value: 'Getting Started Guide',
      url: 'https://docs.example.com',
    },
  ],
};
```

## News Section

Displays news items.

```typescript
const section: CardSection = {
  type: 'news',
  title: 'Latest News',
  items: [
    {
      title: 'Product Update Released',
      description: 'New features available',
      date: '2025-01-15',
    },
  ],
};
```

## Brand Colors Section

Shows brand color palette.

```typescript
const section: CardSection = {
  type: 'brand-colors',
  title: 'Brand Colors',
  fields: [
    { label: 'Primary', value: '#ff7900' },
    { label: 'Secondary', value: '#000000' },
  ],
};
```

---

For detailed examples and advanced usage, see the full API documentation.
