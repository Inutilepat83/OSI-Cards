# Event Section

Displays chronological events, timelines, schedules, and calendar information.

## Overview

The **Event Section** (`type: "event"`) is used for displays chronological events, timelines, schedules, and calendar information.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | `event` |
| Uses Fields | Yes |
| Uses Items | Yes |
| Default Columns | 1 |
| Supports Collapse | Yes |
| Aliases | `timeline` |


## Use Cases

- Event calendars
- Project timelines
- Schedules
- Milestones

## Data Schema

### Fields Schema

| Property | Type | Description |
|----------|------|-------------|
| `label` | string | Event label |
| `value` | string | Event name/description |
| `date` | string | Event date |
| `time` | string | Event time |
| `category` | string | Event category |
| `status` | string | Event status |
| `location` | string | Event location |

### Items Schema

| Property | Type | Description |
|----------|------|-------------|
| `label` | string | Event label |
| `value` | string | Event name/description |
| `date` | string | Event date |
| `time` | string | Event time |
| `category` | string | Event category |
| `status` | string | Event status |
| `location` | string | Event location |

## Complete Example

```json
{
  "title": "Upcoming Events",
  "type": "event",
  "description": "Scheduled events and milestones",
  "fields": [
    {
      "label": "Product Launch",
      "value": "Q1 Launch Event",
      "date": "2025-03-15",
      "time": "10:00",
      "category": "Launch",
      "status": "confirmed"
    },
    {
      "label": "Annual Conference",
      "value": "User Summit 2025",
      "date": "2025-06-20",
      "time": "09:00",
      "category": "Conference",
      "status": "planned"
    },
    {
      "label": "Board Meeting",
      "value": "Q2 Review",
      "date": "2025-04-10",
      "time": "14:00",
      "category": "Internal",
      "status": "confirmed"
    }
  ]
}
```

## Minimal Example

```json
{
  "title": "Events",
  "type": "event",
  "fields": [
    {
      "label": "Event",
      "value": "TBD"
    }
  ]
}
```

## Best Practices

1. Include dates and times
2. Add location information
3. Use status for event state
4. Chronological ordering

## Component Information

- **Selector:** `app-event-section`
- **Component Path:** `./lib/components/sections/event-section/event-section.component`
- **Style Path:** `./lib/styles/components/sections/_event.scss`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
