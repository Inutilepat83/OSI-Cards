# Overview Section

Displays high-level summaries, executive dashboards, and key highlights.

## Overview

The **Overview Section** (`type: "overview"`) is used for displays high-level summaries, executive dashboards, and key highlights.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | `overview` |
| Uses Fields | Yes |
| Uses Items | No |
| Default Columns | 1 |
| Supports Collapse | No |
| Aliases | None |


## Use Cases

- Executive summaries
- Dashboard overviews
- Key highlights
- Quick insights
- Company profiles

## Data Schema

### Fields Schema

| Property | Type | Description |
|----------|------|-------------|
| `label` | string | Overview field label |
| `value` | string | Field value/content |
| `icon` | string | Icon identifier |
| `highlight` | boolean | Whether to highlight this field |



## Complete Example

```json
{
  "title": "Executive Summary",
  "type": "overview",
  "description": "Strategic company overview and positioning",
  "fields": [
    {
      "label": "About",
      "value": "Nexus Technologies is a leading enterprise software company specializing in AI-powered analytics and business intelligence solutions. Founded in 2018, we serve over 450 enterprise customers globally, helping them transform raw data into actionable insights that drive business growth."
    },
    {
      "label": "Mission",
      "value": "To democratize data intelligence by making advanced analytics accessible to every business user, regardless of technical expertise, enabling organizations to make faster, smarter, data-driven decisions."
    },
    {
      "label": "Vision",
      "value": "A world where every business decision is informed by real-time, AI-powered insights, eliminating guesswork and enabling unprecedented operational efficiency."
    },
    {
      "label": "Core Values",
      "value": "Innovation First • Customer Obsession • Radical Transparency • Continuous Learning • Inclusive Excellence"
    },
    {
      "label": "Market Position",
      "value": "Leader in Gartner Magic Quadrant for Analytics & BI Platforms 2024. Top-rated on G2 with 4.8/5 stars across 2,500+ reviews. Named to Forbes Cloud 100 for three consecutive years."
    },
    {
      "label": "Industry Focus",
      "value": "Enterprise Software • Financial Services • Healthcare & Life Sciences • Retail & E-commerce • Manufacturing • Technology"
    },
    {
      "label": "Competitive Advantage",
      "value": "Proprietary AI engine with patent-pending natural language processing, enabling 10x faster insights discovery compared to traditional BI tools."
    },
    {
      "label": "Key Differentiators",
      "value": "Real-time streaming analytics • No-code dashboard builder • Native AI/ML integration • Enterprise-grade security • Industry-specific solutions"
    }
  ]
}
```

## Minimal Example

```json
{
  "title": "Overview",
  "type": "overview",
  "fields": [
    {
      "label": "Summary",
      "value": "Brief overview of the topic"
    }
  ]
}
```

## Best Practices

1. Keep content high-level
2. Focus on key metrics
3. Use visual indicators
4. Limit to essential information
5. Use as entry point to details

## Component Information

- **Selector:** `lib-overview-section`
- **Component Path:** `./lib/components/sections/overview-section/overview-section.component`


## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
