# Timeline Section

Displays chronological sequences of events, milestones, and historical data.

## Overview

The **Timeline Section** (`type: "timeline"`) is used for displays chronological sequences of events, milestones, and historical data.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | `timeline` |
| Uses Fields | No |
| Uses Items | Yes |
| Default Columns | 1 |
| Supports Collapse | Yes |
| Aliases | None |


## Use Cases

- Company history
- Project milestones
- Career history
- Product evolution
- Historical events

## Data Schema



### Items Schema

| Property | Type | Description |
|----------|------|-------------|
| `title` | string | Milestone title |
| `description` | string | Milestone description |
| `meta` | object | - |

## Complete Example

```json
{
  "title": "Company Journey",
  "type": "timeline",
  "description": "Key milestones in Nexus Technologies' growth story",
  "items": [
    {
      "title": "Company Founded",
      "description": "Dr. Sarah Mitchell and James Park launch Nexus Technologies in Austin, TX with a vision to democratize data analytics for enterprises",
      "meta": {
        "date": "March 2018",
        "year": "2018",
        "icon": "🚀"
      }
    },
    {
      "title": "Seed Funding Secured",
      "description": "Raised $3.5M seed round from angel investors and TechStars to build initial product and hire founding team",
      "meta": {
        "date": "September 2018",
        "year": "2018",
        "icon": "💰"
      }
    },
    {
      "title": "First Enterprise Customer",
      "description": "Signed first Fortune 500 customer, validating product-market fit for enterprise analytics segment",
      "meta": {
        "date": "February 2019",
        "year": "2019",
        "icon": "🎯"
      }
    }
  ]
}
```

## Minimal Example

```json
{
  "title": "Timeline",
  "type": "timeline",
  "items": [
    {
      "title": "Event 1",
      "meta": {
        "year": "2024"
      }
    }
  ]
}
```

## Best Practices

1. Order chronologically
2. Include dates clearly
3. Use consistent formatting
4. Highlight key milestones
5. Keep descriptions concise

## Component Information

- **Selector:** `lib-timeline-section`
- **Component Path:** `./lib/components/sections/timeline-section/timeline-section.component`


## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
