import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';
import { DocsDemoComponent } from '../../components';

const pageContent = `# Analytics Section

Displays metrics with visual indicators, trends, and percentages. Perfect for KPIs, performance metrics, and statistical data.

## Overview

The **Analytics Section** (\`type: "analytics"\`) is used for displays metrics with visual indicators, trends, and percentages. perfect for kpis, performance metrics, and statistical data.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | \`analytics\` |
| Uses Fields | Yes |
| Uses Items | No |
| Default Columns | 2 |
| Supports Collapse | Yes |
| Aliases | \`metrics\`, \`stats\`, \`kpi\` |


## Use Cases

- Performance metrics
- KPIs and dashboards
- Growth statistics
- Sales analytics
- Customer health scores

## Data Schema

### Fields Schema

| Property | Type | Description |
|----------|------|-------------|
| \`label\` | string | Metric label |
| \`value\` | string,number | Metric value |
| \`percentage\` | number | Percentage value for visualization |
| \`performance\` | string | Performance rating |
| \`trend\` | string | Trend indicator |
| \`change\` | number | Numeric change value |
| \`icon\` | string | Icon identifier |



## Complete Example

\`\`\`json
{
  "title": "Q4 2024 Performance Dashboard",
  "type": "analytics",
  "description": "Comprehensive business metrics and KPIs",
  "fields": [
    {
      "label": "Revenue Growth",
      "value": "47.3% YoY",
      "percentage": 47,
      "performance": "excellent",
      "trend": "up",
      "change": 12.8
    },
    {
      "label": "Customer Lifetime Value",
      "value": "$8,450",
      "percentage": 84,
      "performance": "excellent",
      "trend": "up",
      "change": 18.3
    }
  ]
}
\`\`\`

## Minimal Example

\`\`\`json
{
  "title": "Key Metric",
  "type": "analytics",
  "fields": [
    {
      "label": "Score",
      "value": "85%",
      "percentage": 85
    }
  ]
}
\`\`\`

## Best Practices

1. Include percentage values for better visualization
2. Use trend indicators (up/down/stable)
3. Show change values when available
4. Group related metrics together
5. Use performance ratings for quick assessment

## Component Information

- **Selector:** \`lib-analytics-section\`
- **Component Path:** \`./lib/components/sections/analytics-section/analytics-section.component\`
- **Style Path:** \`./lib/components/sections/analytics-section/analytics-section.scss\`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

const demoConfig = {
  title: 'Q4 2024 Performance Dashboard',
  type: 'analytics',
  description: 'Comprehensive business metrics and KPIs',
  fields: [
    {
      label: 'Revenue Growth',
      value: '47.3% YoY',
      percentage: 47,
      performance: 'excellent',
      trend: 'up',
      change: 12.8,
    },
    {
      label: 'Customer Lifetime Value',
      value: '$8,450',
      percentage: 84,
      performance: 'excellent',
      trend: 'up',
      change: 18.3,
    },
  ],
};

/**
 * Analytics Section documentation page with live demo
 * Auto-generated - modifications may be overwritten
 */
@Component({
  selector: 'app-analytics-page',
  standalone: true,
  imports: [DocPageComponent, DocsDemoComponent],
  template: `
    <div class="section-docs">
      <app-docs-demo
        [config]="demo"
        [type]="'analytics'"
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
export class AnalyticsPageComponent {
  content = pageContent;
  demo = demoConfig;
}

export default AnalyticsPageComponent;
