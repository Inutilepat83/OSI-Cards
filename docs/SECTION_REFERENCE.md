# Section Types - Quick Reference

**Quick Reference Guide**: Fast lookup for all section types, their usage, and parameters.

**Replaces**: `SECTION_TYPES.md`, `SECTION_DESIGN_QUICK_REFERENCE.md`, `SECTION_COMPARISON.md`

---

## Section Type Index

| Type | Columns | Use Case | Key Features |
|------|---------|----------|--------------|
| [info](#info) | 1 | General information | Key-value pairs |
| [overview](#overview) | 2 | Comprehensive details | Extended fields |
| [analytics](#analytics) | 2 | Metrics & KPIs | Trends, percentages |
| [chart](#chart) | 2 | Data visualization | Chart.js integration |
| [map](#map) | 2 | Geographic data | Leaflet integration |
| [list](#list) | 1 | Bullet/numbered lists | Simple items |
| [contact-card](#contact-card) | 2 | People information | Contact details |
| [network-card](#network-card) | 2 | Relationships | Network graphs |
| [event](#event) | 1 | Timeline events | Chronological |
| [product](#product) | 1-2 | Product info | Features, specs |
| [solutions](#solutions) | 1 | Solution offerings | Descriptions |
| [financials](#financials) | 2 | Financial data | Numbers, reports |
| [quotation](#quotation) | 1 | Quotes | Text content |
| [text-reference](#text-reference) | 1 | References | Citations |
| [news](#news) | 1 | News articles | Headlines, summaries |
| [social-media](#social-media) | 1 | Social posts | Engagement metrics |
| [brand-colors](#brand-colors) | 1 | Color palettes | Brand colors |

---

## Section Types

### Info

**Use For**: General key-value information

```typescript
{
  type: 'info',
  title: 'Company Information',
  fields: [
    { label: 'Name', value: 'Acme Corp' },
    { label: 'Industry', value: 'Technology' }
  ]
}
```

---

### Overview

**Use For**: Comprehensive company/contact overview

```typescript
{
  type: 'overview',
  title: 'Company Overview',
  fields: [
    { label: 'Legal Name', value: 'Acme Corporation Inc.' },
    { label: 'Stock Symbol', value: 'ACME' },
    { label: 'Headquarters', value: 'San Francisco, CA' }
  ],
  preferredColumns: 2
}
```

---

### Analytics

**Use For**: Metrics, KPIs, performance data

```typescript
{
  type: 'analytics',
  title: 'Key Metrics',
  fields: [
    {
      label: 'Revenue Growth',
      value: '+23.5%',
      percentage: 85,
      trend: 'up',
      change: 23.5
    }
  ]
}
```

**Special Fields**:
- `percentage`: For progress bars (0-100)
- `trend`: 'up', 'down', 'stable'
- `change`: Numeric change value
- `performance`: 'excellent', 'good', 'average', 'poor'

---

### Chart

**Use For**: Data visualization

```typescript
{
  type: 'chart',
  title: 'Sales Trend',
  chartType: 'line',
  chartData: {
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [{
      label: 'Sales',
      data: [100, 150, 200]
    }]
  }
}
```

**Chart Types**: line, bar, pie, doughnut, radar, polarArea

---

### Map

**Use For**: Geographic locations

```typescript
{
  type: 'map',
  title: 'Office Locations',
  locations: [
    {
      lat: 37.7749,
      lng: -122.4194,
      label: 'San Francisco HQ'
    }
  ]
}
```

---

### List

**Use For**: Simple bullet or numbered lists

```typescript
{
  type: 'list',
  title: 'Key Features',
  items: [
    { content: 'Fast performance' },
    { content: 'Easy to use' },
    { content: 'Highly customizable' }
  ]
}
```

---

### Contact Card

**Use For**: People/contact information

```typescript
{
  type: 'contact-card',
  title: 'Team',
  items: [
    {
      name: 'John Doe',
      role: 'CEO',
      email: 'john@example.com',
      phone: '+1234567890',
      avatar: 'https://...'
    }
  ]
}
```

---

### Network Card

**Use For**: Relationship networks

```typescript
{
  type: 'network-card',
  title: 'Business Network',
  items: [
    {
      entity: 'Partner Company',
      relationship: 'Strategic Partner',
      strength: 'strong'
    }
  ]
}
```

---

### Event

**Use For**: Timeline events, schedules

```typescript
{
  type: 'event',
  title: 'Recent Activity',
  items: [
    {
      title: 'Product Launch',
      date: '2024-03-15',
      description: 'Launched new product line'
    }
  ]
}
```

---

### Product

**Use For**: Product information

```typescript
{
  type: 'product',
  title: 'Products',
  items: [
    {
      name: 'Product A',
      price: '$99',
      description: 'Premium offering',
      features: ['Feature 1', 'Feature 2']
    }
  ]
}
```

---

### Financials

**Use For**: Financial data, reports

```typescript
{
  type: 'financials',
  title: 'Financial Summary',
  fields: [
    { label: 'Revenue', value: '$1.2M' },
    { label: 'Profit Margin', value: '23%' },
    { label: 'EBITDA', value: '$450K' }
  ]
}
```

---

## Design Quick Reference

### Common Scenarios

#### Dark Theme Section
```typescript
meta: {
  design: {
    itemBackground: '#1a1a1a',
    itemBorderColor: '#333',
    labelColor: '#aaa',
    valueColor: '#fff'
  }
}
```

#### Accent Highlight
```typescript
meta: {
  design: {
    accentColor: '#ff7900',
    itemBorderColor: 'rgba(255, 121, 0, 0.3)'
  }
}
```

#### Compact Display
```typescript
meta: { design: { preset: 'compact' } }
```

#### Glassmorphism Effect
```typescript
meta: { design: { preset: 'glass' } }
```

---

## Parameter Reference

| Parameter | Values | Default |
|-----------|--------|---------|
| `accentColor` | Any CSS color | `#6366f1'` |
| `itemBackground` | Any CSS color | `transparent` |
| `itemBorderColor` | Any CSS color | `#e5e7eb` |
| `borderRadius` | CSS size | `8px` |
| `itemPadding` | CSS spacing | `12px 16px` |
| `itemGap` | CSS spacing | `8px` |

---

## Column Span Reference

| Type | Default | Min | Max | Notes |
|------|---------|-----|-----|-------|
| info | 1 | 1 | 2 | Stacks well |
| overview | 2 | 1 | 3 | Needs space |
| chart | 2 | 1 | 3 | Visualizations |
| map | 2 | 1 | 3 | Maps need width |
| analytics | 2 | 1 | 3 | Metrics |
| list | 1 | 1 | 2 | Vertical |
| contact-card | 2 | 1 | 3 | Side-by-side |

---

## For More Information

- **Complete Guide**: [SECTION_DESIGN.md](./SECTION_DESIGN.md)
- **Section Registry**: [SECTION_REGISTRY.md](./SECTION_REGISTRY.md)
- **Theming**: [THEMING_GUIDE.md](./THEMING_GUIDE.md)
- **Integration**: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)

---

*Last Updated: December 2, 2025*
*Consolidated from 3 separate quick reference documents*
*Phase 5: Documentation Consolidation*

