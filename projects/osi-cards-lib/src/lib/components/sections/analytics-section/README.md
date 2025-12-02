# Analytics Section

Displays metrics with visual indicators, trends, and percentages. Perfect for KPIs, performance metrics, and statistical data.

## Overview

The Analytics Section displays performance metrics in a grid layout with visual indicators including progress bars, trend arrows, and performance ratings.

**Component:** `lib-analytics-section`
**Type:** `analytics`
**Aliases:** `metrics`, `stats`, `kpi`
**Uses Fields:** Yes
**Default Columns:** 2

## Use Cases

- Performance metrics
- KPIs and dashboards
- Growth statistics
- Sales analytics
- Customer health scores

## Best Practices

- Include percentage values for better visualization
- Use trend indicators (up/down/stable)
- Show change values when available
- Group related metrics together
- Use performance ratings for quick assessment

## Field Schema

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `label` | string | ✓ | Metric label |
| `value` | string, number | | Metric value |
| `percentage` | number | | Percentage value for visualization (0-100) |
| `performance` | 'excellent', 'good', 'average', 'poor' | | Performance rating |
| `trend` | 'up', 'down', 'stable', 'neutral' | | Trend indicator |
| `change` | number | | Numeric change value |
| `icon` | string | | Icon identifier |

## Examples

### Basic KPI Dashboard

```typescript
const section: CardSection = {
  type: 'analytics',
  title: 'Q4 Performance',
  fields: [
    {
      label: 'Revenue Growth',
      value: '47.3% YoY',
      percentage: 47,
      performance: 'excellent',
      trend: 'up',
      change: 12.8
    },
    {
      label: 'Monthly Active Users',
      value: '2.4M',
      percentage: 89,
      performance: 'excellent',
      trend: 'up'
    }
  ]
};
```

### Using Aliases

```typescript
// These are all equivalent
const section1: CardSection = { type: 'analytics', ... };
const section2: CardSection = { type: 'metrics', ... };
const section3: CardSection = { type: 'kpi', ... };
```

### Minimal Example

```typescript
const section: CardSection = {
  type: 'analytics',
  title: 'Key Metric',
  fields: [
    { label: 'Score', value: '85%', percentage: 85 }
  ]
};
```

## Styling

Styles are defined inline in the component. Customize using CSS custom properties and design parameters via `meta.design`:

```typescript
const section: CardSection = {
  type: 'analytics',
  title: 'Metrics',
  fields: [...],
  meta: {
    design: {
      gridGap: '12px',
      itemPadding: '12px',
      accentColor: '#ff7900'
    }
  }
};
```

## Component Files

- `analytics-section.component.ts` - Component logic and styles
- `analytics-section.component.html` - Template
- `analytics.definition.json` - Section metadata and schema
- `README.md` - This documentation

