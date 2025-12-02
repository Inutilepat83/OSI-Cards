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
| Aliases | None |


## Use Cases

- Event calendars
- Project timelines
- Schedules
- Milestones
- Upcoming activities

## Data Schema

### Fields Schema

| Property | Type | Description |
|----------|------|-------------|
| `label` | string | Event label |
| `value` | string | Event name/description |
| `date` | string | Event date |
| `time` | string | Event time |
| `endDate` | string | Event end date |
| `category` | string | Event category |
| `status` | string | Event status |
| `location` | string | Event location |
| `attendees` | number | Number of attendees |

### Items Schema

| Property | Type | Description |
|----------|------|-------------|
| `label` | string | Event label |
| `value` | string | Event name/description |
| `date` | string | Event date |
| `time` | string | Event time |
| `endDate` | string | Event end date |
| `category` | string | Event category |
| `status` | string | Event status |
| `location` | string | Event location |
| `attendees` | number | Number of attendees |

## Complete Example

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
      "label": "Product Launch",
      "value": "Nexus Analytics 5.0 Release",
      "date": "2025-02-10",
      "time": "10:00",
      "category": "Product",
      "status": "confirmed",
      "location": "Global Webcast"
    },
    {
      "label": "Customer Summit",
      "value": "NexusCon 2025 - AI Future",
      "date": "2025-03-18",
      "endDate": "2025-03-20",
      "time": "08:00",
      "category": "Conference",
      "status": "planned",
      "location": "Moscone Center, San Francisco",
      "attendees": 3500
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
      "label": "Partner Summit",
      "value": "Global Partner Ecosystem Meeting",
      "date": "2025-04-08",
      "endDate": "2025-04-09",
      "time": "09:00",
      "category": "Partnership",
      "status": "tentative",
      "location": "London, UK",
      "attendees": 180
    },
    {
      "label": "Engineering All-Hands",
      "value": "Technical Roadmap Review",
      "date": "2025-02-28",
      "time": "16:00",
      "category": "Internal",
      "status": "confirmed",
      "location": "Virtual",
      "attendees": 850
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
  ]
}
```

## Minimal Example

```json
{
  "title": "Upcoming Event",
  "type": "event",
  "fields": [
    {
      "label": "Meeting",
      "value": "Team Sync",
      "date": "2025-01-15"
    }
  ]
}
```

## Best Practices

1. Include dates and times
2. Add location information
3. Use status for event state
4. Chronological ordering
5. Group by category or date

## Component Information

- **Selector:** `lib-event-section`
- **Component Path:** `./lib/components/sections/event-section/event-section.component`


## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
