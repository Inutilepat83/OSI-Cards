import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# Solutions Section

Displays solution offerings, use cases, features, and benefits.

## Overview

The **Solutions Section** (\`type: "solutions"\`) is used for displays solution offerings, use cases, features, and benefits.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | \`solutions\` |
| Uses Fields | Yes |
| Uses Items | Yes |
| Default Columns | 1 |
| Supports Collapse | Yes |
| Aliases | None |


## Use Cases

- Service offerings
- Solution portfolios
- Use cases
- Case studies

## Data Schema

### Fields Schema

| Property | Type | Description |
|----------|------|-------------|
| \`title\` | string | Solution title |
| \`description\` | string | Solution description |
| \`category\` | string | Solution category |
| \`benefits\` | array | List of benefits |
| \`deliveryTime\` | string | Delivery timeframe |
| \`complexity\` | string | Implementation complexity |
| \`outcomes\` | array | Expected outcomes |

### Items Schema

| Property | Type | Description |
|----------|------|-------------|
| \`title\` | string | Solution title |
| \`description\` | string | Solution description |
| \`category\` | string | Solution category |
| \`benefits\` | array | List of benefits |
| \`deliveryTime\` | string | Delivery timeframe |
| \`complexity\` | string | Implementation complexity |
| \`outcomes\` | array | Expected outcomes |

## Complete Example

\`\`\`json
{
  "title": "Solutions Portfolio",
  "type": "solutions",
  "description": "Available solutions and services",
  "fields": [
    {
      "title": "Cloud Migration",
      "description": "Complete cloud infrastructure migration service",
      "category": "Infrastructure",
      "benefits": [
        "Scalability",
        "Cost reduction",
        "Security"
      ],
      "deliveryTime": "8-10 weeks"
    },
    {
      "title": "Data Analytics Platform",
      "description": "Real-time analytics and reporting solution",
      "category": "Analytics",
      "benefits": [
        "Real-time insights",
        "Custom dashboards",
        "API access"
      ],
      "deliveryTime": "4-6 weeks"
    }
  ]
}
\`\`\`

## Minimal Example

\`\`\`json
{
  "title": "Solutions",
  "type": "solutions",
  "fields": [
    {
      "title": "Solution",
      "description": "Description"
    }
  ]
}
\`\`\`

## Best Practices

1. Highlight key benefits
2. Include use cases
3. Add feature lists
4. Show outcomes when available

## Component Information

- **Selector:** \`app-solutions-section\`
- **Component Path:** \`./lib/components/sections/solutions-section/solutions-section.component\`
- **Style Path:** \`./lib/styles/components/sections/_solutions.scss\`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

@Component({
  selector: 'app-solutions-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolutionsPageComponent {
  content = pageContent;
}

export default SolutionsPageComponent;
