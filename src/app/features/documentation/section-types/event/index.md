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
  "title": "Q1 2025 Key Events",
  "type": "event",
  "description": "Major company events and milestones",
  "fields": [
    {
      "label": "Annual Sales Kickoff",
      "value": "SKO 2025 - Revenue Excellence",
      "date": "2025-01-15",
      "endDate": "2025-01-17",
      "time": "09:00",
      "category": "Sales",
      "status": "confirmed",
      "location": "Austin Convention Center, TX",
      "attendees": 450
    },
    {
      "label": "Board Meeting",
      "value": "Q4 2024 Results Review",
      "date": "2025-01-28",
      "time": "14:00",
      "category": "Corporate",
      "status": "confirmed",
      "location": "Virtual",
      "attendees": 12
    },
    {
      "label": "Investor Day",
      "value": "Annual Investor Relations Event",
      "date": "2025-03-25",
      "time": "09:30",
      "category": "Finance",
      "status": "planned",
      "location": "New York Stock Exchange",
      "attendees": 200
    },
    {
      "label": "AWS re:Invent Presence",
      "value": "Booth #1234 + Speaking Sessions",
      "date": "2025-12-01",
      "endDate": "2025-12-05",
      "time": "08:00",
      "category": "Conference",
      "status": "planned",
      "location": "Las Vegas, NV"
    }
  ],
  "preferredColumns": 1,
  "priority": 3
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
