import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';
import { DocsDemoComponent } from '../../components';

const pageContent = `# List Section

Displays structured lists and tables. Supports sorting, filtering, and item interactions.

## Overview

The **List Section** (\`type: "list"\`) is used for displays structured lists and tables. supports sorting, filtering, and item interactions.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | \`list\` |
| Uses Fields | No |
| Uses Items | Yes |
| Default Columns | 1 |
| Supports Collapse | Yes |
| Aliases | \`table\`, \`checklist\` |


## Use Cases

- Product lists
- Feature lists
- Task lists
- Inventory
- Requirements

## Data Schema



### Items Schema

| Property | Type | Description |
|----------|------|-------------|
| \`title\` | string | Item title |
| \`description\` | string | Item description |
| \`icon\` | string | Icon identifier |
| \`status\` | string | Item status |
| \`value\` | string,number | Item value |
| \`date\` | string | Item date |
| \`priority\` | string | Priority level |

## Complete Example

\`\`\`json
{
  "title": "Product Roadmap Q1-Q2 2025",
  "type": "list",
  "description": "Strategic initiatives and feature development",
  "items": [
    {
      "title": "AI-Powered Forecasting Engine",
      "description": "Machine learning model for predictive analytics with 95% accuracy target",
      "icon": "🤖",
      "status": "in-progress",
      "priority": "critical"
    },
    {
      "title": "Enterprise SSO Integration",
      "description": "SAML 2.0 and OIDC support for Okta, Azure AD, and custom IdPs",
      "icon": "🔐",
      "status": "completed",
      "priority": "high"
    }
  ]
}
\`\`\`

## Minimal Example

\`\`\`json
{
  "title": "Tasks",
  "type": "list",
  "items": [
    {
      "title": "Task 1"
    }
  ]
}
\`\`\`

## Best Practices

1. Use items array for list data
2. Include titles and descriptions
3. Add status badges when relevant
4. Keep list items scannable
5. Use icons for visual hierarchy

## Component Information

- **Selector:** \`lib-list-section\`
- **Component Path:** \`./lib/components/sections/list-section/list-section.component\`
- **Style Path:** \`./lib/components/sections/list-section/list-section.scss\`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

const demoConfig = {
  title: 'Product Roadmap Q1-Q2 2025',
  type: 'list',
  description: 'Strategic initiatives and feature development',
  items: [
    {
      title: 'AI-Powered Forecasting Engine',
      description: 'Machine learning model for predictive analytics with 95% accuracy target',
      icon: '🤖',
      status: 'in-progress',
      priority: 'critical',
    },
    {
      title: 'Enterprise SSO Integration',
      description: 'SAML 2.0 and OIDC support for Okta, Azure AD, and custom IdPs',
      icon: '🔐',
      status: 'completed',
      priority: 'high',
    },
  ],
};

/**
 * List Section documentation page with live demo
 * Auto-generated - modifications may be overwritten
 */
@Component({
  selector: 'app-list-page',
  standalone: true,
  imports: [DocPageComponent, DocsDemoComponent],
  template: `
    <div class="section-docs">
      <app-docs-demo
        [config]="demo"
        [type]="'list'"
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
export class ListPageComponent {
  content = pageContent;
  demo = demoConfig;
}

export default ListPageComponent;
