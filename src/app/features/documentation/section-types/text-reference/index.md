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
  "title": "Resources & Documentation",
  "type": "text-reference",
  "description": "Essential guides, documentation, and reference materials",
  "fields": [
    {
      "label": "Technical Documentation",
      "value": "Nexus Analytics Platform - Complete Technical Reference",
      "description": "Comprehensive documentation covering architecture, API reference, integration guides, and best practices for enterprise deployments",
      "url": "https://docs.nexustech.io/platform",
      "type": "Documentation",
      "date": "2024-12-01"
    },
    {
      "label": "API Reference",
      "value": "REST API v3.0 Developer Guide",
      "description": "Complete API documentation with authentication, endpoints, request/response schemas, rate limiting, and code examples in Python, JavaScript, and Java",
      "url": "https://api.nexustech.io/docs/v3",
      "type": "API Docs"
    },
    {
      "label": "Video Training",
      "value": "Nexus Academy - Complete Certification Course",
      "description": "40-hour video training program covering platform fundamentals, advanced analytics, administration, and developer certification paths",
      "url": "https://academy.nexustech.io",
      "type": "Video Course"
    },
    {
      "label": "Release Notes",
      "value": "Version 5.2 Release Notes & Migration Guide",
      "description": "Complete changelog, new features, breaking changes, deprecations, and step-by-step migration instructions for version 5.2",
      "url": "https://docs.nexustech.io/releases/5.2",
      "type": "Release Notes",
      "date": "2025-01-15"
    }
  ],
  "preferredColumns": 1,
  "priority": 3
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
