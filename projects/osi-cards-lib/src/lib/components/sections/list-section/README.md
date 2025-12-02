# List Section

Displays structured lists and tables. Supports sorting, filtering, and item interactions.

## Overview

The List Section displays items in a vertical list format with support for status badges, icons, priorities, and descriptions.

**Component:** `lib-list-section`
**Type:** `list`
**Aliases:** `table`, `checklist`
**Uses Items:** Yes
**Default Columns:** 1

## Use Cases

- Product lists
- Feature lists
- Task lists
- Inventory
- Requirements

## Best Practices

- Use items array for list data
- Include titles and descriptions
- Add status badges when relevant
- Keep list items scannable
- Use icons for visual hierarchy

## Item Schema

| Property | Type | Description |
|----------|------|-------------|
| `title` | string | Item title (required) |
| `description` | string | Item description |
| `icon` | string | Icon identifier |
| `status` | 'completed', 'in-progress', 'pending', 'cancelled', 'blocked' | Item status |
| `value` | string, number | Item value |
| `date` | string | Item date |
| `priority` | 'critical', 'high', 'medium', 'low' | Priority level |

## Examples

### Basic List

```typescript
const section: CardSection = {
  type: 'list',
  title: 'Features',
  items: [
    { title: 'User Authentication', icon: '🔐' },
    { title: 'Dashboard Analytics', icon: '📊' },
    { title: 'API Integration', icon: '🔌' }
  ]
};
```

### Task List with Status

```typescript
const section: CardSection = {
  type: 'list',
  title: 'Q1 Roadmap',
  items: [
    {
      title: 'AI-Powered Forecasting',
      description: 'ML model for predictive analytics',
      status: 'in-progress',
      priority: 'high',
      icon: '🤖'
    },
    {
      title: 'Mobile App Launch',
      description: 'iOS and Android applications',
      status: 'pending',
      priority: 'high',
      icon: '📱'
    },
    {
      title: 'API v2.0',
      status: 'completed',
      icon: '✅'
    }
  ]
};
```

## Component Files

- `list-section.component.ts` - Component logic and styles
- `list-section.component.html` - Template
- `list.definition.json` - Section metadata and schema
- `README.md` - This documentation

