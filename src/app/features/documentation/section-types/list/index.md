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
| Aliases | `table` |


## Use Cases

- Product lists
- Employee rosters
- Inventory
- Task lists

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

## Complete Example

```json
{
  "title": "Product Features",
  "type": "list",
  "description": "Key features and capabilities",
  "items": [
    {
      "title": "Real-time Analytics",
      "description": "Live data processing and visualization",
      "icon": "📊",
      "status": "completed"
    },
    {
      "title": "AI Integration",
      "description": "Machine learning powered insights",
      "icon": "🤖",
      "status": "in-progress"
    },
    {
      "title": "API Access",
      "description": "RESTful API for integrations",
      "icon": "🔗",
      "status": "completed"
    },
    {
      "title": "Multi-language",
      "description": "Support for 20+ languages",
      "icon": "🌍",
      "status": "pending"
    }
  ]
}
```

## Minimal Example

```json
{
  "title": "List",
  "type": "list",
  "items": [
    {
      "title": "Item 1"
    }
  ]
}
```

## Best Practices

1. Use items array for list data
2. Include titles and descriptions
3. Add status badges when relevant
4. Keep list items scannable

## Component Information

- **Selector:** `app-list-section`
- **Component Path:** `./lib/components/sections/list-section/list-section.component`
- **Style Path:** `./lib/styles/components/sections/_list.scss`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
