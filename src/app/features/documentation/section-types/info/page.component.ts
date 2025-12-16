import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';
import { DocsDemoComponent } from '../../components';

const pageContent = `# Info Section

Displays key-value pairs in a clean, scannable format. Ideal for metadata, contact information, and general data display.

## Overview

The **Info Section** (\`type: "info"\`) is used for displays key-value pairs in a clean, scannable format. ideal for metadata, contact information, and general data display.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | \`info\` |
| Uses Fields | Yes |
| Uses Items | No |
| Default Columns | 1 |
| Supports Collapse | Yes |
| Aliases | None |


## Use Cases

- Company information
- Contact details
- Metadata display
- Key-value pairs
- Profile summaries

## Data Schema

### Fields Schema

| Property | Type | Description |
|----------|------|-------------|
| \`label\` | string | Field label/key |
| \`value\` | string,number,boolean,null | Field value |
| \`icon\` | string | Icon identifier (emoji or icon name) |
| \`description\` | string | Additional field description |
| \`trend\` | string | Trend indicator |
| \`change\` | number | Numeric change value |
| \`format\` | string | Value format |



## Complete Example

\`\`\`json
{
  "title": "Nexus Technologies Inc.",
  "type": "info",
  "description": "Enterprise SaaS company specializing in AI-powered analytics",
  "fields": [
    {
      "label": "Industry",
      "value": "Enterprise Software & AI",
      "icon": "🏢"
    },
    {
      "label": "Annual Revenue",
      "value": "$127M ARR",
      "icon": "💰",
      "trend": "up",
      "change": 45.2
    }
  ]
}
\`\`\`

## Minimal Example

\`\`\`json
{
  "title": "Quick Info",
  "type": "info",
  "fields": [
    {
      "label": "Status",
      "value": "Active"
    }
  ]
}
\`\`\`

## Best Practices

1. Use for structured data with clear labels and values
2. Keep labels concise and descriptive
3. Use trend indicators for dynamic data
4. Group related fields together
5. Use icons to enhance visual hierarchy

## Component Information

- **Selector:** \`lib-info-section\`
- **Component Path:** \`./lib/components/sections/info-section/info-section.component\`
- **Style Path:** \`./lib/components/sections/info-section/info-section.scss\`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

const demoConfig = {
  title: 'Nexus Technologies Inc.',
  type: 'info',
  description: 'Enterprise SaaS company specializing in AI-powered analytics',
  fields: [
    {
      label: 'Industry',
      value: 'Enterprise Software & AI',
      icon: '🏢',
    },
    {
      label: 'Annual Revenue',
      value: '$127M ARR',
      icon: '💰',
      trend: 'up',
      change: 45.2,
    },
  ],
};

/**
 * Info Section documentation page with live demo
 * Auto-generated - modifications may be overwritten
 */
@Component({
  selector: 'app-info-page',
  standalone: true,
  imports: [DocPageComponent, DocsDemoComponent],
  template: `
    <div class="section-docs">
      <app-docs-demo
        [config]="demo"
        [type]="'info'"
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
export class InfoPageComponent {
  content = pageContent;
  demo = demoConfig;
}

export default InfoPageComponent;
