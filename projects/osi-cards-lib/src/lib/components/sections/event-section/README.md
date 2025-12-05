# Event Section

Displays event information including dates, times, locations, and attendee details.

## Overview

The Event Section displays calendar events with support for date/time formatting, status indicators, and attendee information.

**Component:** `lib-event-section`
**Type:** `event`
**Aliases:** `timeline`
**Uses Fields:** Yes
**Default Columns:** 1

## Use Cases

- Event calendar
- Meeting schedules
- Conference agendas
- Milestone tracking
- Deadline management

## Best Practices

- Include date and time
- Show event status
- Add location details
- Include attendee count
- Use category badges

## Field Schema

| Property | Type | Description |
|----------|------|-------------|
| `label` | string | Event label |
| `value` | string | Event description |
| `date` | string | Event date (ISO format) |
| `time` | string | Event time |
| `category` | string | Event category/type |
| `status` | 'confirmed', 'pending', 'cancelled' | Event status |
| `attendees` | number | Number of attendees |

## Examples

### Basic Event

```typescript
const section: CardSection = {
  type: 'event',
  title: 'Upcoming Events',
  fields: [
    {
      label: 'Product Launch',
      value: 'Q1 2025 Product Release',
      date: '2025-03-15',
      category: 'Launch',
      status: 'confirmed'
    }
  ]
};
```

### Event with Details

```typescript
const section: CardSection = {
  type: 'event',
  title: 'Team Events',
  fields: [
    {
      label: 'All-Hands Meeting',
      value: 'Monthly company update',
      date: '2025-01-15',
      time: '10:00 AM',
      category: 'Meeting',
      status: 'confirmed',
      attendees: 150
    }
  ]
};
```

## Component Files

- `event-section.component.ts` - Component logic and styles
- `event-section.component.html` - Template
- `event.definition.json` - Section metadata and schema
- `README.md` - This documentation


