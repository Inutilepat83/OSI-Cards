# List Section

Displays structured lists and tables. Supports sorting, filtering, and item interactions.

## Overview

The **List Section** (`type: "list"`) is used for displays structured lists and tables. supports sorting, filtering, and item interactions.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | `list` |
| Uses Fields | No |
| Uses Items | Yes |
| Default Columns | 1 |
| Supports Collapse | Yes |
| Aliases | None |


## Use Cases

- Product lists
- Feature lists
- Task lists
- Inventory
- Requirements

## Data Schema



### Items Schema

| Property | Type | Description |
|----------|------|-------------|
| `title` | string | Item title |
| `description` | string | Item description |
| `icon` | string | Icon identifier |
| `status` | string | Item status |
| `value` | string,number | Item value |
| `date` | string | Item date |
| `priority` | string | Priority level |

## Complete Example

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
  ]
}
```

## Minimal Example

```json
{
  "title": "Tasks",
  "type": "list",
  "items": [
    {
      "title": "Task 1"
    }
  ]
}
```

## Best Practices

1. Use items array for list data
2. Include titles and descriptions
3. Add status badges when relevant
4. Keep list items scannable
5. Use icons for visual hierarchy

## Component Information

- **Selector:** `lib-list-section`
- **Component Path:** `./lib/components/sections/list-section/list-section.component`


## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
