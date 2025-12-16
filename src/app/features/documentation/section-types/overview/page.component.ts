import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';
import { DocsDemoComponent } from '../../components';

const pageContent = `# Overview Section

Displays high-level summaries, executive dashboards, and key highlights.

## Overview

The **Overview Section** (\`type: "overview"\`) is used for displays high-level summaries, executive dashboards, and key highlights.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | \`overview\` |
| Uses Fields | Yes |
| Uses Items | No |
| Default Columns | 1 |
| Supports Collapse | No |
| Aliases | \`summary\`, \`executive\` |


## Use Cases

- Executive summaries
- Dashboard overviews
- Key highlights
- Quick insights
- Company profiles

## Data Schema

### Fields Schema

| Property | Type | Description |
|----------|------|-------------|
| \`label\` | string | Overview field label |
| \`value\` | string | Field value/content |
| \`icon\` | string | Icon identifier |
| \`highlight\` | boolean | Whether to highlight this field |



## Complete Example

\`\`\`json
{
  "title": "Executive Summary",
  "type": "overview",
  "description": "Strategic company overview and positioning",
  "fields": [
    {
      "label": "About",
      "value": "Nexus Technologies is a leading enterprise software company specializing in AI-powered analytics and business intelligence solutions. Founded in 2018, we serve over 450 enterprise customers globally, helping them transform raw data into actionable insights that drive business growth."
    },
    {
      "label": "Market Position",
      "value": "Leader in Gartner Magic Quadrant for Analytics & BI Platforms 2024. Top-rated on G2 with 4.8/5 stars across 2,500+ reviews. Named to Forbes Cloud 100 for three consecutive years."
    }
  ]
}
\`\`\`

## Minimal Example

\`\`\`json
{
  "title": "Overview",
  "type": "overview",
  "fields": [
    {
      "label": "Summary",
      "value": "Brief overview of the topic"
    }
  ]
}
\`\`\`

## Best Practices

1. Keep content high-level
2. Focus on key metrics
3. Use visual indicators
4. Limit to essential information
5. Use as entry point to details

## Component Information

- **Selector:** \`lib-overview-section\`
- **Component Path:** \`./lib/components/sections/overview-section/overview-section.component\`
- **Style Path:** \`./lib/components/sections/overview-section/overview-section.scss\`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

const demoConfig = {
  title: 'Executive Summary',
  type: 'overview',
  description: 'Strategic company overview and positioning',
  fields: [
    {
      label: 'About',
      value:
        'Nexus Technologies is a leading enterprise software company specializing in AI-powered analytics and business intelligence solutions. Founded in 2018, we serve over 450 enterprise customers globally, helping them transform raw data into actionable insights that drive business growth.',
    },
    {
      label: 'Market Position',
      value:
        'Leader in Gartner Magic Quadrant for Analytics & BI Platforms 2024. Top-rated on G2 with 4.8/5 stars across 2,500+ reviews. Named to Forbes Cloud 100 for three consecutive years.',
    },
  ],
};

/**
 * Overview Section documentation page with live demo
 * Auto-generated - modifications may be overwritten
 */
@Component({
  selector: 'app-overview-page',
  standalone: true,
  imports: [DocPageComponent, DocsDemoComponent],
  template: `
    <div class="section-docs">
      <app-docs-demo
        [config]="demo"
        [type]="'overview'"
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
export class OverviewPageComponent {
  content = pageContent;
  demo = demoConfig;
}

export default OverviewPageComponent;
