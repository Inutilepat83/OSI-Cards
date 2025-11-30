# Analytics Section

Displays metrics with visual indicators, trends, and percentages. Perfect for KPIs, performance metrics, and statistical data.

## Overview

The **Analytics Section** (`type: "analytics"`) is used for displays metrics with visual indicators, trends, and percentages. perfect for kpis, performance metrics, and statistical data.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | `analytics` |
| Uses Fields | Yes |
| Uses Items | No |
| Default Columns | 2 |
| Supports Collapse | Yes |
| Aliases | `metrics`, `stats` |


## Use Cases

- Performance metrics
- KPIs
- Growth statistics
- Analytics dashboards

## Data Schema

### Fields Schema

| Property | Type | Description |
|----------|------|-------------|
| `label` | string | Metric label |
| `value` | string,number | Metric value |
| `percentage` | number | Percentage value for visualization |
| `performance` | string | Performance rating |
| `trend` | string | Trend indicator |
| `change` | number | Numeric change value |
| `icon` | string | Icon identifier |



## Complete Example

```json
{
  "title": "Performance Analytics",
  "type": "analytics",
  "description": "Key performance indicators and metrics",
  "fields": [
    {
      "label": "Performance Score",
      "value": "95%",
      "percentage": 95,
      "performance": "excellent",
      "trend": "up",
      "change": 5.2
    },
    {
      "label": "Growth Rate",
      "value": "25% YoY",
      "percentage": 25,
      "performance": "good",
      "trend": "up",
      "change": 8.1
    },
    {
      "label": "Market Share",
      "value": "12%",
      "percentage": 12,
      "performance": "average",
      "trend": "stable",
      "change": 0.5
    },
    {
      "label": "Customer Satisfaction",
      "value": "4.8/5",
      "percentage": 96,
      "performance": "excellent",
      "trend": "up"
    }
  ]
}
```

## Minimal Example

```json
{
  "title": "Analytics",
  "type": "analytics",
  "fields": [
    {
      "label": "Score",
      "value": "100%",
      "percentage": 100
    }
  ]
}
```

## Best Practices

1. Include percentage values for better visualization
2. Use trend indicators (up/down/stable)
3. Show change values when available
4. Group related metrics together

## Component Information

- **Selector:** `app-analytics-section`
- **Component Path:** `./lib/components/sections/analytics-section/analytics-section.component`
- **Style Path:** `./lib/styles/components/sections/_analytics.scss`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
