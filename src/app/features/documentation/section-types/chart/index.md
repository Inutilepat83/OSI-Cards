# Chart Section

Displays data visualizations including bar charts, line charts, pie charts, and more.

## Overview

The **Chart Section** is used for displays data visualizations including bar charts, line charts, pie charts, and more.

## Use Cases

- Data visualization
- Analytics dashboards
- Statistical reports
- Trend analysis

## Data Schema

```typescript
interface CardSection {
  title: string;
  type: 'chart';
  fields?: CardField[];
  
}
```

## Example

```json
{
  "title": "Revenue & Growth Analysis",
  "type": "chart",
  "chartType": "bar",
  "chartData": {
    "labels": [
      "Q1 2024",
      "Q2 2024",
      "Q3 2024",
      "Q4 2024",
      "Q1 2025 (Proj)"
    ],
    "datasets": [
      {
        "label": "Revenue ($M)",
        "data": [
          28.5,
          32.1,
          35.8,
          42.4,
          48.2
        ],
        "backgroundColor": "#FF7900",
        "borderColor": "#FF7900",
        "borderWidth": 1
      },
      {
        "label": "Operating Costs ($M)",
        "data": [
          22.1,
          24.3,
          26.8,
          31.2,
          34.5
        ],
        "backgroundColor": "#4CAF50",
        "borderColor": "#4CAF50",
        "borderWidth": 1
      },
      {
        "label": "Net Profit ($M)",
        "data": [
          6.4,
          7.8,
          9,
          11.2,
          13.7
        ],
        "backgroundColor": "#2196F3",
        "borderColor": "#2196F3",
        "borderWidth": 1
      }
    ]
  },
  "preferredColumns": 2,
  "priority": 2
}
```

## Best Practices

1. Provide proper chart configuration
1. Include chart type specification
1. Use appropriate data formats
1. Ensure accessibility with labels

## Component Properties




## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
