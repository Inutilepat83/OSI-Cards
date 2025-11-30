import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

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



## Complete Example

\`\`\`json
{
  "title": "Financial Overview",
  "type": "financials",
  "description": "Key financial metrics and performance",
  "fields": [
    {
      "label": "Annual Revenue",
      "value": "$50M",
      "format": "currency",
      "change": 15,
      "trend": "up"
    },
    {
      "label": "Operating Margin",
      "value": "18%",
      "format": "percentage",
      "change": 3.2,
      "trend": "up"
    },
    {
      "label": "EBITDA",
      "value": "$12M",
      "format": "currency",
      "change": 8,
      "trend": "up"
    },
    {
      "label": "Net Income",
      "value": "$8M",
      "format": "currency",
      "change": -2.5,
      "trend": "down"
    }
  ]
}
\`\`\`

## Minimal Example

\`\`\`json
{
  "title": "Financials",
  "type": "financials",
  "fields": [
    {
      "label": "Revenue",
      "value": "$1M"
    }
  ]
}
\`\`\`

## Best Practices

1. Use currency formatting
2. Include time periods
3. Show trends and changes
4. Group by category

## Component Information

- **Selector:** \`app-financials-section\`
- **Component Path:** \`./lib/components/sections/financials-section/financials-section.component\`
- **Style Path:** \`./lib/styles/components/sections/_financials.scss\`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

@Component({
  selector: 'app-financials-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinancialsPageComponent {
  content = pageContent;
}

export default FinancialsPageComponent;
