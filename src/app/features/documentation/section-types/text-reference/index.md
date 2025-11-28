# Text Reference Section

Displays long-form text, paragraphs, articles, and reference content.

## Overview

The **Text Reference Section** is used for displays long-form text, paragraphs, articles, and reference content.

## Use Cases

- Articles
- Blog posts
- Research summaries
- Long-form content

## Data Schema

```typescript
interface CardSection {
  title: string;
  type: 'text-reference';
  fields?: CardField[];
  
}
```

## Example

```json
{
  "title": "Text Reference Section Example",
  "type": "text-reference",
  "fields": [
    {
      "label": "Example Label",
      "value": "Example Value"
    }
  ]
}
```

## Best Practices

1. Break into readable chunks
1. Use proper formatting
1. Include citations
1. Add metadata for context

## Component Properties




## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
