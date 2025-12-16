import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';
import { DocsDemoComponent } from '../../components';

const pageContent = `# Event Section

Displays chronological events, timelines, schedules, and calendar information.

## Overview

The **Event Section** (\`type: "event"\`) is used for displays chronological events, timelines, schedules, and calendar information.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | \`event\` |
| Uses Fields | Yes |
| Uses Items | Yes |
| Default Columns | 1 |
| Supports Collapse | Yes |
| Aliases | \`calendar\`, \`schedule\` |


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
| \`label\` | string | Event label |
| \`value\` | string | Event name/description |
| \`date\` | string | Event date |
| \`time\` | string | Event time |
| \`endDate\` | string | Event end date |
| \`category\` | string | Event category |
| \`status\` | string | Event status |
| \`location\` | string | Event location |
| \`attendees\` | number | Number of attendees |

### Items Schema

| Property | Type | Description |
|----------|------|-------------|
| \`label\` | string | Event label |
| \`value\` | string | Event name/description |
| \`date\` | string | Event date |
| \`time\` | string | Event time |
| \`endDate\` | string | Event end date |
| \`category\` | string | Event category |
| \`status\` | string | Event status |
| \`location\` | string | Event location |
| \`attendees\` | number | Number of attendees |

## Complete Example

\`\`\`json
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
      "label": "Customer Summit",
      "value": "NexusCon 2025 - AI Future",
      "date": "2025-03-18",
      "endDate": "2025-03-20",
      "time": "08:00",
      "category": "Conference",
      "status": "planned",
      "location": "Moscone Center, San Francisco",
      "attendees": 3500
    }
  ]
}
\`\`\`

## Minimal Example

\`\`\`json
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
\`\`\`

## Best Practices

1. Include dates and times
2. Add location information
3. Use status for event state
4. Chronological ordering
5. Group by category or date

## Component Information

- **Selector:** \`lib-event-section\`
- **Component Path:** \`./lib/components/sections/event-section/event-section.component\`
- **Style Path:** \`./lib/components/sections/event-section/event-section.scss\`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

const demoConfig = {
  title: 'Q1 2025 Key Events',
  type: 'event',
  description: 'Major company events and milestones',
  fields: [
    {
      label: 'Annual Sales Kickoff',
      value: 'SKO 2025 - Revenue Excellence',
      date: '2025-01-15',
      endDate: '2025-01-17',
      time: '09:00',
      category: 'Sales',
      status: 'confirmed',
      location: 'Austin Convention Center, TX',
      attendees: 450,
    },
    {
      label: 'Customer Summit',
      value: 'NexusCon 2025 - AI Future',
      date: '2025-03-18',
      endDate: '2025-03-20',
      time: '08:00',
      category: 'Conference',
      status: 'planned',
      location: 'Moscone Center, San Francisco',
      attendees: 3500,
    },
  ],
};

/**
 * Event Section documentation page with live demo
 * Auto-generated - modifications may be overwritten
 */
@Component({
  selector: 'app-event-page',
  standalone: true,
  imports: [DocPageComponent, DocsDemoComponent],
  template: `
    <div class="section-docs">
      <app-docs-demo
        [config]="demo"
        [type]="'event'"
        demoTitle="Live Preview"
        height="350px"
      ></app-docs-demo>
      <app-doc-page [content]="content"></app-doc-page>
    </div>
  `,
  styles: [
    `
      .section-docs {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventPageComponent {
  content = pageContent;
  demo = demoConfig;
}

export default EventPageComponent;
