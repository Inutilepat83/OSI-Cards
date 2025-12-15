# Quotation Section

Displays quotes, testimonials, highlighted text, and citations.

## Overview

The **Quotation Section** is used for displays quotes, testimonials, highlighted text, and citations.

## Use Cases

- Testimonials
- Quotes
- Citations
- Highlighted content

## Data Schema

```typescript
interface CardSection {
  title: string;
  type: 'quotation';
  fields?: CardField[];
  
}
```

## Example

```json
{
  "title": "Customer Success Stories",
  "type": "quotation",
  "description": "What industry leaders say about our platform",
  "fields": [
    {
      "label": "Enterprise Transformation",
      "value": "\"Nexus Analytics has fundamentally transformed how we approach data-driven decision making. Within six months of deployment, we've seen a 47% reduction in time-to-insight and our business users are now self-sufficient in creating their own reports. The ROI has been extraordinary.\"",
      "description": "Jennifer Martinez, Chief Data Officer at Fortune 500 Retailer",
      "author": "Jennifer Martinez",
      "role": "Chief Data Officer",
      "company": "MegaMart Corp",
      "date": "2024-11-15"
    },
    {
      "label": "Healthcare Innovation",
      "value": "\"In healthcare, data accuracy and compliance are non-negotiable. Nexus not only meets our stringent HIPAA requirements but has enabled our research teams to discover patterns that were previously invisible. We've accelerated our clinical trial analysis by 10x.\"",
      "description": "Dr. Michael Chen, VP of Research Analytics at Leading Healthcare System",
      "author": "Dr. Michael Chen",
      "role": "VP of Research Analytics",
      "company": "HealthFirst Systems"
    },
    {
      "label": "Financial Services Excellence",
      "value": "\"The real-time analytics capabilities have been game-changing for our trading desk. We're now making decisions in milliseconds that used to take hours. Our risk management team has never been more confident in their data.\"",
      "description": "Sarah Thompson, Managing Director at Global Investment Bank",
      "author": "Sarah Thompson",
      "role": "Managing Director",
      "company": "Sterling Capital Partners"
    },
    {
      "label": "Manufacturing Efficiency",
      "value": "\"We integrated Nexus with our IoT sensors across 12 manufacturing plants. The predictive maintenance insights alone have saved us $15M annually in unplanned downtime. It's become the central nervous system of our operations.\"",
      "description": "Klaus Weber, Global Head of Operations at Industrial Manufacturer",
      "author": "Klaus Weber",
      "role": "Global Head of Operations",
      "company": "PrecisionWorks AG"
    },
    {
      "label": "Analyst Recognition",
      "value": "\"Nexus Technologies continues to set the standard for modern analytics platforms. Their AI-first approach and commitment to user experience puts them firmly in the Leader quadrant, with the highest scores for innovation and customer satisfaction.\"",
      "description": "Gartner Magic Quadrant for Analytics & BI Platforms, 2024",
      "author": "Gartner Research",
      "company": "Gartner Inc.",
      "date": "2024-09-01"
    }
  ],
  "preferredColumns": 1,
  "priority": 3
}
```

## Best Practices

1. Include source attribution
1. Add author information
1. Use for emphasis
1. Include dates when relevant

## Component Properties




## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
