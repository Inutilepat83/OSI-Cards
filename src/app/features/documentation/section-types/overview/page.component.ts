import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgDocPageComponent, NgDocRootPage } from '@ng-doc/app';
import { NgDocPageType } from '@ng-doc/core';
import pageConfig from './overview.page';

const pageContent: string = `# Overview Section

Displays high-level summaries, executive dashboards, and key highlights.

## Overview

The **Overview Section** is used for displays high-level summaries, executive dashboards, and key highlights.

## Use Cases

- Executive summaries
- Dashboard overviews
- Key highlights
- Quick insights

## Data Schema

\`\`\`typescript
interface CardSection {
  title: string;
  type: 'overview';
  fields?: CardField[];
  
}
\`\`\`

## Example

\`\`\`json
{
  "title": "Overview Section Example",
  "type": "overview",
  "fields": [
    {
      "label": "Example Label",
      "value": "Example Value"
    }
  ]
}
\`\`\`

## Best Practices

1. Keep content high-level
1. Focus on key metrics
1. Use visual indicators
1. Limit to essential information

## Component Properties




## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

@Component({
  selector: 'ng-doc-page-overview',
  template: `<ng-doc-page></ng-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDocPageComponent],
  providers: [
    { provide: NgDocRootPage, useExisting: OverviewPageComponent }
  ],
  standalone: true
})
export class OverviewPageComponent extends NgDocRootPage {
  readonly pageType: NgDocPageType = 'guide';
  readonly pageContent: string = pageContent;
  readonly editSourceFileUrl?: string;
  readonly viewSourceFileUrl?: string;
  override readonly page = pageConfig;

  constructor() {
    super();
  }
}

export default OverviewPageComponent;
