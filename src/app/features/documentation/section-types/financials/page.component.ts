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
      "label": "Total Revenue",
      "value": "$142.8M",
      "format": "currency",
      "change": 38.7,
      "trend": "up",
      "period": "FY2024"
    },
    {
      "label": "Gross Profit",
      "value": "$112.3M",
      "format": "currency",
      "change": 41.2,
      "trend": "up",
      "period": "FY2024"
    },
    {
      "label": "Gross Margin",
      "value": "78.6%",
      "format": "percentage",
      "change": 2.3,
      "trend": "up"
    },
    {
      "label": "Operating Expenses",
      "value": "$98.5M",
      "format": "currency",
      "change": 22.1,
      "trend": "up"
    },
    {
      "label": "EBITDA",
      "value": "$24.8M",
      "format": "currency",
      "change": 156.3,
      "trend": "up"
    },
    {
      "label": "Net Income",
      "value": "$18.2M",
      "format": "currency",
      "change": 245.8,
      "trend": "up"
    },
    {
      "label": "Operating Margin",
      "value": "17.4%",
      "format": "percentage",
      "change": 8.2,
      "trend": "up"
    },
    {
      "label": "Cash & Equivalents",
      "value": "$89.3M",
      "format": "currency",
      "change": 12.4,
      "trend": "up"
    },
    {
      "label": "Total Assets",
      "value": "$234.7M",
      "format": "currency",
      "change": 28.9,
      "trend": "up"
    },
    {
      "label": "Debt-to-Equity Ratio",
      "value": "0.34",
      "format": "ratio",
      "change": -8.1,
      "trend": "down"
    },
    {
      "label": "Free Cash Flow",
      "value": "$31.2M",
      "format": "currency",
      "change": 67.4,
      "trend": "up"
    },
    {
      "label": "R&D Investment",
      "value": "$28.4M",
      "format": "currency",
      "change": 35.2,
      "trend": "up",
      "period": "FY2024"
    },
    {
      "label": "Customer Acquisition Cost",
      "value": "$12,450",
      "format": "currency",
      "change": -12.3,
      "trend": "down"
    },
    {
      "label": "LTV/CAC Ratio",
      "value": "6.8x",
      "format": "ratio",
      "change": 23.5,
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
      label: 'Total Revenue',
      value: '$142.8M',
      format: 'currency',
      change: 38.7,
      trend: 'up',
      period: 'FY2024',
    },
    {
      label: 'Gross Profit',
      value: '$112.3M',
      format: 'currency',
      change: 41.2,
      trend: 'up',
      period: 'FY2024',
    },
    {
      label: 'Gross Margin',
      value: '78.6%',
      format: 'percentage',
      change: 2.3,
      trend: 'up',
    },
    {
      label: 'Operating Expenses',
      value: '$98.5M',
      format: 'currency',
      change: 22.1,
      trend: 'up',
    },
    {
      label: 'EBITDA',
      value: '$24.8M',
      format: 'currency',
      change: 156.3,
      trend: 'up',
    },
    {
      label: 'Net Income',
      value: '$18.2M',
      format: 'currency',
      change: 245.8,
      trend: 'up',
    },
    {
      label: 'Operating Margin',
      value: '17.4%',
      format: 'percentage',
      change: 8.2,
      trend: 'up',
    },
    {
      label: 'Cash & Equivalents',
      value: '$89.3M',
      format: 'currency',
      change: 12.4,
      trend: 'up',
    },
    {
      label: 'Total Assets',
      value: '$234.7M',
      format: 'currency',
      change: 28.9,
      trend: 'up',
    },
    {
      label: 'Debt-to-Equity Ratio',
      value: '0.34',
      format: 'ratio',
      change: -8.1,
      trend: 'down',
    },
    {
      label: 'Free Cash Flow',
      value: '$31.2M',
      format: 'currency',
      change: 67.4,
      trend: 'up',
    },
    {
      label: 'R&D Investment',
      value: '$28.4M',
      format: 'currency',
      change: 35.2,
      trend: 'up',
      period: 'FY2024',
    },
    {
      label: 'Customer Acquisition Cost',
      value: '$12,450',
      format: 'currency',
      change: -12.3,
      trend: 'down',
    },
    {
      label: 'LTV/CAC Ratio',
      value: '6.8x',
      format: 'ratio',
      change: 23.5,
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
