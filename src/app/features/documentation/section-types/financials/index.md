# Financials Section

Displays financial data including revenue, expenses, P&L statements, and currency information.

## Overview

The **Financials Section** is used for displays financial data including revenue, expenses, p&l statements, and currency information.

## Use Cases

- Financial reports
- Quarterly earnings
- Budget information
- Revenue tracking

## Data Schema

```typescript
interface CardSection {
  title: string;
  type: 'financials';
  fields?: CardField[];
  
}
```

## Example

```json
{
  "title": "FY2024 Financial Summary",
  "type": "financials",
  "description": "Annual financial performance and key metrics",
  "fields": [
    {
      "label": "Annual Recurring Revenue",
      "value": "$127.4M",
      "format": "currency",
      "change": 45.2,
      "trend": "up",
      "period": "FY2024"
    },
    {
      "label": "Total Revenue",
      "value": "$142.8M",
      "format": "currency",
      "change": 38.7,
      "trend": "up",
      "period": "FY2024"
    },
    {
      "label": "Operating Margin",
      "value": "17.4%",
      "format": "percentage",
      "change": 8.2,
      "trend": "up"
    },
    {
      "label": "LTV/CAC Ratio",
      "value": "6.8x",
      "format": "ratio",
      "change": 23.5,
      "trend": "up"
    }
  ],
  "preferredColumns": 1,
  "priority": 2
}
```

## Best Practices

1. Use currency formatting
1. Include time periods
1. Show trends and changes
1. Group by category

## Component Properties




## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
