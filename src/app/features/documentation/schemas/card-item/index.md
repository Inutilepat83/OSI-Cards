# CardItem

Defines an item in list-based sections.

## Overview

`CardItem` is used for sections that display lists of items, such as news, events, or product lists.

## Interface Definition

```typescript
interface CardItem {
  id?: string;
  title: string;
  description?: string;
  icon?: string;
  value?: string | number;
  status?: string;
  date?: string;
  meta?: Record<string, unknown>;
}
```

## Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | No | Unique identifier |
| `title` | string | **Yes** | Item title |
| `description` | string | No | Item description |
| `icon` | string | No | Icon identifier |
| `value` | string \| number | No | Associated value |
| `status` | string | No | Status indicator |
| `date` | string | No | Date string |
| `meta` | object | No | Additional metadata |

## Example (News Section)

```json
{
  "title": "Q4 Earnings Released",
  "description": "Company reports 25% revenue growth",
  "meta": {
    "source": "Bloomberg",
    "date": "2025-01-15"
  },
  "status": "published"
}
```

## Example (List Section)

```json
{
  "title": "Real-time Analytics",
  "description": "Live data processing",
  "icon": "📊",
  "status": "completed"
}
```
