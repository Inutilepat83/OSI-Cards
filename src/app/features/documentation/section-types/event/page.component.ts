import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgDocPageComponent, NgDocRootPage } from '@ng-doc/app';
import { NgDocPageType } from '@ng-doc/core';
import pageConfig from './event.page';

const pageContent: string = `# Event Section

Displays chronological events, timelines, schedules, and calendar information.

## Overview

The **Event Section** is used for displays chronological events, timelines, schedules, and calendar information.

## Use Cases

- Event calendars
- Project timelines
- Schedules
- Milestones

## Data Schema

\`\`\`typescript
interface CardSection {
  title: string;
  type: 'event';
  fields?: CardField[];
  items?: CardItem[];
}
\`\`\`

## Example

\`\`\`json
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
\`\`\`

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
`;

@Component({
  selector: 'ng-doc-page-event',
  template: `<ng-doc-page></ng-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDocPageComponent],
  providers: [
    { provide: NgDocRootPage, useExisting: EventPageComponent }
  ],
  standalone: true
})
export class EventPageComponent extends NgDocRootPage {
  readonly pageType: NgDocPageType = 'guide';
  readonly pageContent: string = pageContent;
  readonly editSourceFileUrl?: string;
  readonly viewSourceFileUrl?: string;
  override readonly page = pageConfig;

  constructor() {
    super();
  }
}

export default EventPageComponent;
