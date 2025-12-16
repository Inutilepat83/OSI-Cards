# Overview Section

Displays high-level summaries, executive dashboards, and key highlights.

## Overview

The **Overview Section** is used for displays high-level summaries, executive dashboards, and key highlights.

## Use Cases

- Executive summaries
- Dashboard overviews
- Key highlights
- Quick insights

## Data Schema

```typescript
interface CardSection {
  title: string;
  type: 'overview';
  fields?: CardField[];

}
```

## Example

```json
{
  "title": "Executive Summary",
  "type": "overview",
  "description": "Strategic company overview and positioning",
  "fields": [
    {
      "label": "About",
      "value": "Nexus Technologies is a leading enterprise software company specializing in AI-powered analytics and business intelligence solutions. Founded in 2018, we serve over 450 enterprise customers globally, transforming raw data into actionable insights that drive measurable business growth and competitive advantage."
    },
    {
      "label": "Mission",
      "value": "To democratize data intelligence by making advanced analytics accessible to every business user, regardless of technical expertise. We empower organizations to make faster, smarter, data-driven decisions that accelerate innovation and operational excellence."
    },
    {
      "label": "Market Position",
      "value": "Recognized as a Leader in Gartner Magic Quadrant for Analytics & BI Platforms 2024. Top-rated on G2 with 4.8/5 stars across 2,500+ customer reviews. Named to Forbes Cloud 100 for three consecutive years, demonstrating sustained innovation and market leadership."
    },
    {
      "label": "Key Differentiators",
      "value": "Real-time streaming analytics • Intuitive no-code dashboard builder • Native AI/ML integration • Enterprise-grade security and compliance • Industry-specific solutions tailored to unique business needs"
    }
  ],
  "preferredColumns": 1,
  "priority": 1
}
```

## Best Practices

1. Keep content high-level
1. Focus on key metrics
1. Use visual indicators
1. Limit to essential information

## Component Properties




## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
