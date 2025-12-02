# Financials Section

Displays financial data with currency formatting, trends, and change indicators.

## Overview

The Financials Section displays monetary values, financial metrics, and budget information with proper currency formatting.

**Component:** `lib-financials-section`
**Type:** `financials`
**Uses Fields:** Yes
**Default Columns:** 2

## Use Cases

- Financial statements
- Budget tracking
- Revenue metrics
- Cost analysis
- Investment data

## Best Practices

- Use proper currency symbols
- Show change percentages
- Include trend indicators
- Format large numbers
- Group related metrics

## Field Schema

| Property | Type | Description |
|----------|------|-------------|
| `label` | string | Metric label |
| `value` | string, number | Financial value |
| `format` | 'currency', 'percentage', 'number' | Value format |
| `currency` | string | Currency code (USD, EUR, etc.) |
| `change` | number | Change percentage |
| `trend` | 'up', 'down', 'stable' | Trend indicator |

## Examples

### Basic Financial Metrics

```typescript
const section: CardSection = {
  type: 'financials',
  title: 'Financial Summary',
  fields: [
    { label: 'Revenue', value: '$10M', format: 'currency', change: 15 },
    { label: 'Expenses', value: '$6M', format: 'currency', change: -5 },
    { label: 'Profit Margin', value: '40%', format: 'percentage', trend: 'up' }
  ]
};
```

### With Trends

```typescript
const section: CardSection = {
  type: 'financials',
  title: 'Q4 2024',
  fields: [
    {
      label: 'Total Revenue',
      value: '$30M',
      format: 'currency',
      change: 25,
      trend: 'up'
    }
  ]
};
```

## Component Files

- `financials-section.component.ts` - Component logic and styles
- `financials-section.component.html` - Template
- `financials.definition.json` - Section metadata and schema
- `README.md` - This documentation

