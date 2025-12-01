import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';
import { DocsDemoComponent } from '../../components';

const pageContent = `# Network Card Section

Displays relationship graphs, network connections, and influence metrics.

## Overview

The **Network Card Section** (\`type: "network-card"\`) is used for displays relationship graphs, network connections, and influence metrics.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | \`network-card\` |
| Uses Fields | No |
| Uses Items | Yes |
| Default Columns | 1 |
| Supports Collapse | Yes |
| Aliases | None |


## Use Cases

- Org charts
- Relationship maps
- Network analysis
- Connection graphs

## Data Schema



### Items Schema

| Property | Type | Description |
|----------|------|-------------|
| \`title\` | string | Network node name |
| \`description\` | string | Node description |
| \`meta\` | object | - |

## Complete Example

\`\`\`json
{
  "title": "Business Network",
  "type": "network-card",
  "description": "Key business relationships and partnerships",
  "items": [
    {
      "title": "Strategic Partner A",
      "description": "Technology partnership",
      "meta": {
        "influence": 85,
        "connections": 12,
        "status": "active"
      }
    },
    {
      "title": "Investor Group",
      "description": "Series B lead investor",
      "meta": {
        "influence": 92,
        "connections": 8,
        "status": "active"
      }
    },
    {
      "title": "Distribution Partner",
      "description": "EMEA distribution",
      "meta": {
        "influence": 67,
        "connections": 25,
        "status": "active"
      }
    }
  ]
}
\`\`\`

## Minimal Example

\`\`\`json
{
  "title": "Network",
  "type": "network-card",
  "items": [
    {
      "title": "Partner"
    }
  ]
}
\`\`\`

## Best Practices

1. Show relationships clearly
2. Include connection types
3. Add influence metrics
4. Use visual hierarchy

## Component Information

- **Selector:** \`app-network-card-section\`
- **Component Path:** \`./lib/components/sections/network-card-section/network-card-section.component\`
- **Style Path:** \`./lib/styles/components/sections/_network.scss\`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

const demoConfig = {
  "title": "Business Network",
  "type": "network-card",
  "description": "Key business relationships and partnerships",
  "items": [
    {
      "title": "Strategic Partner A",
      "description": "Technology partnership",
      "meta": {
        "influence": 85,
        "connections": 12,
        "status": "active"
      }
    },
    {
      "title": "Investor Group",
      "description": "Series B lead investor",
      "meta": {
        "influence": 92,
        "connections": 8,
        "status": "active"
      }
    },
    {
      "title": "Distribution Partner",
      "description": "EMEA distribution",
      "meta": {
        "influence": 67,
        "connections": 25,
        "status": "active"
      }
    }
  ]
};

/**
 * Network Card Section documentation page with live demo
 * Auto-generated - modifications may be overwritten
 */
@Component({
  selector: 'app-network-card-page',
  standalone: true,
  imports: [DocPageComponent, DocsDemoComponent],
  template: `
    <div class="section-docs">
      <app-docs-demo 
        [config]="demo" 
        [type]="'network-card'"
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
export class NetworkCardPageComponent {
  content = pageContent;
  demo = demoConfig;
}

export default NetworkCardPageComponent;
