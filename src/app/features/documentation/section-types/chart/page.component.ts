import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgDocPageComponent, NgDocRootPage } from '@ng-doc/app';
import { NgDocPageType } from '@ng-doc/core';
import pageConfig from './chart.page';

const pageContent: string = `# Chart Section

Displays data visualizations including bar charts, line charts, pie charts, and more.

## Overview

The **Chart Section** is used for displays data visualizations including bar charts, line charts, pie charts, and more.

## Use Cases

- Data visualization
- Analytics dashboards
- Statistical reports
- Trend analysis

## Data Schema

\`\`\`typescript
interface CardSection {
  title: string;
  type: 'chart';
  fields?: CardField[];
  
}
\`\`\`

## Example

\`\`\`json
{
  "title": "Chart Section Example",
  "type": "chart",
  "fields": [
    {
      "label": "Example Label",
      "value": "Example Value"
    }
  ]
}
\`\`\`

## Best Practices

1. Provide proper chart configuration
1. Include chart type specification
1. Use appropriate data formats
1. Ensure accessibility with labels

## Component Properties




## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

@Component({
  selector: 'ng-doc-page-chart',
  template: `<ng-doc-page></ng-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDocPageComponent],
  providers: [
    { provide: NgDocRootPage, useExisting: ChartPageComponent }
  ],
  standalone: true
})
export class ChartPageComponent extends NgDocRootPage {
  readonly pageType: NgDocPageType = 'guide';
  readonly pageContent: string = pageContent;
  readonly editSourceFileUrl?: string;
  readonly viewSourceFileUrl?: string;
  override readonly page = pageConfig;

  constructor() {
    super();
  }
}

export default ChartPageComponent;
