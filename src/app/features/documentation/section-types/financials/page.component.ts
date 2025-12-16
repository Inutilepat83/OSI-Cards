import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';
import { DocsDemoComponent } from '../../components';

const pageContent = `# Financials Section

Displays financial data including revenue, expenses, P&L statements, and currency information.

## Overview

The **Financials Section** (\`type: "financials"\`) is used for displays financial data including revenue, expenses, p&l statements, and currency information.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | \`financials\` |
| Uses Fields | Yes |
| Uses Items | No |
| Default Columns | 2 |
| Supports Collapse | Yes |
| Aliases | None |


## Use Cases

- Financial reports
- Quarterly earnings
- Budget information
- Revenue tracking
- Investment summaries

## Data Schema

### Fields Schema

| Property | Type | Description |
|----------|------|-------------|
| \`label\` | string | Financial metric name |
| \`value\` | string,number | Metric value |
| \`format\` | string | Value format |
| \`change\` | number | Change percentage |
| \`trend\` | string | Trend indicator |
| \`period\` | string | Time period (Q1, YTD, etc.) |
| \`currency\` | string | Currency code (USD, EUR, etc.) |



## Complete Example

\`\`\`json
{
  "title": "FY2024 Financial Summary",
  "type": "financials",
  "description": "Annual financial performance and key metrics",
  "fields": [
    {
      "label": "Annual Recurring Revenue",
      "value": "$127.4M",
      "format": "currency",
      "change": 45.2,
      "trend": "up",
      "period": "FY2024"
    },
    {
      "label": "Net Income",
      "value": "$18.2M",
      "format": "currency",
      "change": 245.8,
      "trend": "up"
    }
  ]
}
\`\`\`

## Minimal Example

\`\`\`json
{
  "title": "Revenue",
  "type": "financials",
  "fields": [
    {
      "label": "Total Revenue",
      "value": "$10M"
    }
  ]
}
\`\`\`

## Best Practices

1. Use currency formatting
2. Include time periods
3. Show trends and changes
4. Group by category
5. Highlight key metrics

## Component Information

- **Selector:** \`lib-financials-section\`
- **Component Path:** \`./lib/components/sections/financials-section/financials-section.component\`
- **Style Path:** \`./lib/components/sections/financials-section/financials-section.scss\`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

const demoConfig = {
  title: 'FY2024 Financial Summary',
  type: 'financials',
  description: 'Annual financial performance and key metrics',
  fields: [
    {
      label: 'Annual Recurring Revenue',
      value: '$127.4M',
      format: 'currency',
      change: 45.2,
      trend: 'up',
      period: 'FY2024',
    },
    {
      label: 'Net Income',
      value: '$18.2M',
      format: 'currency',
      change: 245.8,
      trend: 'up',
    },
  ],
};

/**
 * Financials Section documentation page with live demo
 * Auto-generated - modifications may be overwritten
 */
@Component({
  selector: 'app-financials-page',
  standalone: true,
  imports: [DocPageComponent, DocsDemoComponent],
  template: `
    <div class="section-docs">
      <app-docs-demo
        [config]="demo"
        [type]="'financials'"
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
export class FinancialsPageComponent {
  content = pageContent;
  demo = demoConfig;
}

export default FinancialsPageComponent;
