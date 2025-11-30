import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgDocPageComponent, NgDocRootPage } from '@ng-doc/app';
import { NgDocPageType } from '@ng-doc/core';
import pageConfig from './chart.page';

const pageContent: string = `# Chart Section

Displays data visualizations including bar charts, line charts, pie charts, and more.

## Overview

The **Chart Section** (\`type: "chart"\`) is used for displays data visualizations including bar charts, line charts, pie charts, and more.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | \`chart\` |
| Uses Fields | No |
| Uses Items | No |
| Default Columns | 2 |
| Supports Collapse | No |
| Aliases | None |
| External Library | \`chart.js\` |

## Use Cases

- Data visualization
- Analytics dashboards
- Statistical reports
- Trend analysis

## Data Schema





## Complete Example

\`\`\`json
{
  "title": "Revenue Trends",
  "type": "chart",
  "chartType": "bar",
  "chartData": {
    "labels": [
      "Q1",
      "Q2",
      "Q3",
      "Q4"
    ],
    "datasets": [
      {
        "label": "Revenue",
        "data": [
          100,
          150,
          200,
          250
        ],
        "backgroundColor": "#FF7900"
      },
      {
        "label": "Expenses",
        "data": [
          80,
          90,
          100,
          110
        ],
        "backgroundColor": "#4CAF50"
      }
    ]
  }
}
\`\`\`

## Minimal Example

\`\`\`json
{
  "title": "Chart",
  "type": "chart",
  "chartType": "bar",
  "chartData": {
    "labels": [
      "A"
    ],
    "datasets": [
      {
        "data": [
          1
        ]
      }
    ]
  }
}
\`\`\`

## Best Practices

1. Provide proper chart configuration
2. Include chart type specification
3. Use appropriate data formats
4. Ensure accessibility with labels

## Component Information

- **Selector:** \`app-chart-section\`
- **Component Path:** \`./lib/components/sections/chart-section/chart-section.component\`
- **Style Path:** \`./lib/styles/components/sections/_chart.scss\`

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
