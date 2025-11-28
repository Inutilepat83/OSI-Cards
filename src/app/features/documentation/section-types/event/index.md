# Event Section

Displays chronological events, timelines, schedules, and calendar information.

## Overview

The **Event Section** is used for displays chronological events, timelines, schedules, and calendar information.

## Use Cases

- Event calendars
- Project timelines
- Schedules
- Milestones

## Data Schema

```typescript
interface CardSection {
  title: string;
  type: 'event';
  fields?: CardField[];
  items?: CardItem[];
}
```

## Example

```json
{
  "title": "Event Section Example",
  "type": "event",
  "fields": [
    {
      "label": "Example Label",
      "value": "Example Value"
    }
  ]
}
```

## Best Practices

1. Include dates and times
1. Add location information
1. Use status for event state
1. Chronological ordering

## Component Properties




## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
