# Analytics Section

Displays metrics with visual indicators, trends, and percentages. Perfect for KPIs, performance metrics, and statistical data.

## Overview

The **Analytics Section** is used for displays metrics with visual indicators, trends, and percentages. perfect for kpis, performance metrics, and statistical data.

## Use Cases

- Performance metrics
- KPIs
- Growth statistics
- Analytics dashboards

## Data Schema

```typescript
interface CardSection {
  title: string;
  type: 'analytics';
  fields?: CardField[];
  
}
```

## Example

```json
{
  "title": "Q4 2024 Performance Dashboard",
  "type": "analytics",
  "description": "Comprehensive business metrics and KPIs",
  "preferredColumns": 2,
  "priority": 2,
  "fields": [
    {
      "label": "Revenue Growth",
      "value": "47.3% YoY",
      "percentage": 47,
      "performance": "excellent"
    },
    {
      "label": "Customer Acquisition Cost",
      "value": "$124",
      "percentage": 78,
      "performance": "good"
    },
    {
      "label": "Average Deal Size",
      "value": "$45K",
      "percentage": 65,
      "performance": "good"
    },
    {
      "label": "Product Uptime",
      "value": "99.97%",
      "percentage": 99,
      "performance": "excellent"
    }
  ]
}
```

## Best Practices

1. Include percentage values for better visualization
1. Use trend indicators (up/down/stable)
1. Show change values when available
1. Group related metrics together

## Component Properties




## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
