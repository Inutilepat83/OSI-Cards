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
  "title": "Product Section Example",
  "type": "product",
  "fields": [
    {
      "label": "Example Label",
      "value": "Example Value"
    }
  ]
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
