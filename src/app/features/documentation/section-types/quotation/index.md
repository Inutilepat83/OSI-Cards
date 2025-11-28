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
  "title": "Quotation Section Example",
  "type": "quotation",
  "fields": [
    {
      "label": "Example Label",
      "value": "Example Value"
    }
  ]
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
