import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgDocPageComponent, NgDocRootPage } from '@ng-doc/app';
import { NgDocPageType } from '@ng-doc/core';
import pageConfig from './analytics.page';

const pageContent: string = `# Analytics Section

Displays metrics with visual indicators, trends, and percentages. Perfect for KPIs, performance metrics, and statistical data.

## Overview

The **Analytics Section** is used for displays metrics with visual indicators, trends, and percentages. perfect for kpis, performance metrics, and statistical data.

## Use Cases

- Performance metrics
- KPIs
- Growth statistics
- Analytics dashboards

## Data Schema

\`\`\`typescript
interface CardSection {
  title: string;
  type: 'analytics';
  fields?: CardField[];
  
}
\`\`\`

## Example

\`\`\`json
{
  "title": "Analytics Section Example",
  "type": "analytics",
  "fields": [
    {
      "label": "Example Label",
      "value": "Example Value"
    }
  ]
}
\`\`\`

## Best Practices

1. Include percentage values for better visualization
1. Use trend indicators (up/down/stable)
1. Show change values when available
1. Group related metrics together

## Component Properties




## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

@Component({
  selector: 'ng-doc-page-analytics',
  template: `<ng-doc-page></ng-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDocPageComponent],
  providers: [
    { provide: NgDocRootPage, useExisting: AnalyticsPageComponent }
  ],
  standalone: true
})
export class AnalyticsPageComponent extends NgDocRootPage {
  readonly pageType: NgDocPageType = 'guide';
  readonly pageContent: string = pageContent;
  readonly editSourceFileUrl?: string;
  readonly viewSourceFileUrl?: string;
  override readonly page = pageConfig;

  constructor() {
    super();
  }
}

export default AnalyticsPageComponent;
