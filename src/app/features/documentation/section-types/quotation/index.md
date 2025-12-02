# Quotation Section

Displays quotes, testimonials, highlighted text, and citations.

## Overview

The **Quotation Section** (`type: "quotation"`) is used for displays quotes, testimonials, highlighted text, and citations.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | `quotation` |
| Uses Fields | Yes |
| Uses Items | No |
| Default Columns | 1 |
| Supports Collapse | Yes |
| Aliases | None |


## Use Cases

- Testimonials
- Customer quotes
- Citations
- Highlighted content
- Expert opinions

## Data Schema

### Fields Schema

| Property | Type | Description |
|----------|------|-------------|
| `label` | string | Quote label/category |
| `value` | string | Quote text |
| `quote` | string | Alternative quote field |
| `description` | string | Attribution/source |
| `author` | string | Quote author |
| `role` | string | Author's role |
| `company` | string | Author's company |
| `date` | string | Quote date |



## Complete Example

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
  ]
}
```

## Minimal Example

```json
{
  "title": "Testimonial",
  "type": "quotation",
  "fields": [
    {
      "value": "\"Great product!\""
    }
  ]
}
```

## Best Practices

1. Include source attribution
2. Add author information
3. Use for emphasis
4. Include dates when relevant
5. Show company/role context

## Component Information

- **Selector:** `lib-quotation-section`
- **Component Path:** `./lib/components/sections/quotation-section/quotation-section.component`


## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
