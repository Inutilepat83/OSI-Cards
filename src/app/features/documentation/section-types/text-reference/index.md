# Text Reference Section

Displays long-form text, paragraphs, articles, and reference content.

## Overview

The **Text Reference Section** (`type: "text-reference"`) is used for displays long-form text, paragraphs, articles, and reference content.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | `text-reference` |
| Uses Fields | Yes |
| Uses Items | No |
| Default Columns | 1 |
| Supports Collapse | Yes |
| Aliases | `reference`, `text-ref` |


## Use Cases

- Articles
- Blog posts
- Research summaries
- Long-form content

## Data Schema

### Fields Schema

| Property | Type | Description |
|----------|------|-------------|
| `label` | string | Reference label |
| `value` | string | Reference title/name |
| `text` | string | Reference text content |
| `description` | string | Reference description |
| `url` | string | Reference URL |
| `source` | string | Source attribution |



## Complete Example

```json
{
  "title": "Documentation References",
  "type": "text-reference",
  "description": "Related documents and resources",
  "fields": [
    {
      "label": "Technical Spec",
      "value": "Technical Specification v2.1",
      "description": "Latest technical documentation",
      "url": "https://docs.example.com/spec"
    },
    {
      "label": "User Guide",
      "value": "User Guide 2024 Edition",
      "description": "Complete user manual",
      "url": "https://docs.example.com/guide"
    },
    {
      "label": "API Reference",
      "value": "REST API Documentation",
      "description": "API endpoints and schemas",
      "url": "https://api.example.com/docs"
    }
  ]
}
```

## Minimal Example

```json
{
  "title": "Reference",
  "type": "text-reference",
  "fields": [
    {
      "label": "Doc",
      "value": "Document"
    }
  ]
}
```

## Best Practices

1. Break into readable chunks
2. Use proper formatting
3. Include citations
4. Add metadata for context

## Component Information

- **Selector:** `app-text-reference-section`
- **Component Path:** `./lib/components/sections/text-reference-section/text-reference-section.component`
- **Style Path:** `./lib/styles/components/sections/_text-reference.scss`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
