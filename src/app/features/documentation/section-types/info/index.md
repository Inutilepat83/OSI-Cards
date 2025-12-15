# Info Section

Displays key-value pairs in a clean, scannable format. Ideal for metadata, contact information, and general data display.

## Overview

The **Info Section** is used for displays key-value pairs in a clean, scannable format. ideal for metadata, contact information, and general data display.

## Use Cases

- Company information
- Contact details
- Metadata display
- Key-value pairs

## Data Schema

```typescript
interface CardSection {
  title: string;
  type: 'info';
  fields?: CardField[];
  
}
```

## Example

```json
{
  "title": "Nexus Technologies Inc.",
  "type": "info",
  "description": "Enterprise SaaS company specializing in AI-powered analytics",
  "fields": [
    {
      "label": "Industry",
      "value": "Enterprise Software & AI",
      "icon": "🏢"
    },
    {
      "label": "Founded",
      "value": "2018",
      "icon": "📅"
    },
    {
      "label": "Customer Base",
      "value": "450+ Enterprise Clients",
      "icon": "🎯"
    },
    {
      "label": "Website",
      "value": "www.nexustech.io",
      "icon": "🔗"
    }
  ],
  "preferredColumns": 1,
  "priority": 3
}
```

## Best Practices

1. Use for structured data with clear labels and values
1. Keep labels concise and descriptive
1. Use trend indicators for dynamic data
1. Group related fields together

## Component Properties




## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
