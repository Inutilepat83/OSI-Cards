# Product Section

Displays product information, features, benefits, and pricing.

## Overview

The **Product Section** is used for displays product information, features, benefits, and pricing.

## Use Cases

- Product catalogs
- Feature lists
- Product comparisons
- Pricing tables

## Data Schema

```typescript
interface CardSection {
  title: string;
  type: 'product';
  fields?: CardField[];
  
}
```

## Example

```json
{
  "title": "Nexus Analytics Enterprise",
  "type": "product",
  "description": "AI-powered business intelligence platform for data-driven enterprises",
  "fields": [
    {
      "label": "Product Name",
      "value": "Nexus Analytics Enterprise Edition"
    },
    {
      "label": "Version",
      "value": "5.2.1 LTS (Long-term Support)"
    },
    {
      "label": "Storage Included",
      "value": "5TB cloud storage with auto-scaling"
    },
    {
      "label": "Status",
      "value": "Generally Available",
      "status": "available"
    }
  ],
  "preferredColumns": 1,
  "priority": 3
}
```

## Best Practices

1. Highlight key features
1. Include pricing when relevant
1. Use descriptions for details
1. Add status for availability

## Component Properties




## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
