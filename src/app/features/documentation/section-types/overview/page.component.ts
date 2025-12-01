import { Component, ChangeDetectionStrategy } from '@angular/core';
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
| Aliases | None |


## Use Cases

- Executive summaries
- Dashboard overviews
- Key highlights
- Quick insights

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
  "title": "Company Overview",
  "type": "overview",
  "description": "High-level company information",
  "fields": [
    {
      "label": "About",
      "value": "Leading technology company specializing in enterprise solutions"
    },
    {
      "label": "Mission",
      "value": "Empowering businesses through innovative technology"
    },
    {
      "label": "Industry",
      "value": "Enterprise Software"
    },
    {
      "label": "Founded",
      "value": "2010"
    },
    {
      "label": "Size",
      "value": "1000-5000 employees"
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
      "value": "Overview text"
    }
  ]
}
\`\`\`

## Best Practices

1. Keep content high-level
2. Focus on key metrics
3. Use visual indicators
4. Limit to essential information

## Component Information

- **Selector:** \`app-overview-section\`
- **Component Path:** \`./lib/components/sections/overview-section/overview-section.component\`
- **Style Path:** \`./lib/styles/components/sections/_overview.scss\`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

const demoConfig = {
  "title": "Company Overview",
  "type": "overview",
  "description": "High-level company information",
  "fields": [
    {
      "label": "About",
      "value": "Leading technology company specializing in enterprise solutions"
    },
    {
      "label": "Mission",
      "value": "Empowering businesses through innovative technology"
    },
    {
      "label": "Industry",
      "value": "Enterprise Software"
    },
    {
      "label": "Founded",
      "value": "2010"
    },
    {
      "label": "Size",
      "value": "1000-5000 employees"
    }
  ]
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
  styles: [`
    .section-docs {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OverviewPageComponent {
  content = pageContent;
  demo = demoConfig;
}

export default OverviewPageComponent;
