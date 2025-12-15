# List Section

Displays structured lists and tables. Supports sorting, filtering, and item interactions.

## Overview

The **List Section** is used for displays structured lists and tables. supports sorting, filtering, and item interactions.

## Use Cases

- Product lists
- Employee rosters
- Inventory
- Task lists

## Data Schema

```typescript
interface CardSection {
  title: string;
  type: 'list';
  fields?: CardField[];
  items?: CardItem[];
}
```

## Example

```json
{
  "title": "Product Roadmap Q1-Q2 2025",
  "type": "list",
  "description": "Strategic initiatives and feature development",
  "items": [
    {
      "title": "AI-Powered Forecasting Engine",
      "description": "Machine learning model for predictive analytics with 95% accuracy target",
      "icon": "🤖",
      "status": "in-progress",
      "priority": "critical"
    },
    {
      "title": "Real-time Collaboration Suite",
      "description": "Multi-user editing with presence indicators and conflict resolution",
      "icon": "👥",
      "status": "in-progress",
      "priority": "high"
    },
    {
      "title": "Enterprise SSO Integration",
      "description": "SAML 2.0 and OIDC support for Okta, Azure AD, and custom IdPs",
      "icon": "🔐",
      "status": "completed",
      "priority": "high"
    }
  ],
  "preferredColumns": 1,
  "priority": 3
}
```

## Best Practices

1. Use items array for list data
1. Include titles and descriptions
1. Add status badges when relevant
1. Keep list items scannable

## Component Properties




## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
