import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';
import { DocsDemoComponent } from '../../components';

const pageContent = `# Map Section

Displays geographic data with embedded maps, pins, and location information.

## Overview

The **Map Section** (\`type: "map"\`) is used for displays geographic data with embedded maps, pins, and location information.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | \`map\` |
| Uses Fields | Yes |
| Uses Items | No |
| Default Columns | 1 |
| Supports Collapse | No |
| Aliases | \`locations\` |
| External Library | \`leaflet\` |

## Use Cases

- Office locations
- Store finder
- Geographic data
- Location tracking

## Data Schema

### Fields Schema

| Property | Type | Description |
|----------|------|-------------|
| \`name\` | string | Location name |
| \`address\` | string | Physical address |
| \`x\` | number | Latitude coordinate |
| \`y\` | number | Longitude coordinate |
| \`type\` | string | Location type (office, branch, etc.) |
| \`coordinates\` | object | - |



## Complete Example

\`\`\`json
{
  "title": "Global Presence",
  "type": "map",
  "description": "Office locations worldwide",
  "fields": [
    {
      "name": "Headquarters",
      "x": 37.7749,
      "y": -122.4194,
      "type": "office",
      "address": "San Francisco, CA, USA"
    },
    {
      "name": "European HQ",
      "x": 51.5074,
      "y": -0.1278,
      "type": "office",
      "address": "London, UK"
    },
    {
      "name": "APAC Office",
      "x": 35.6762,
      "y": 139.6503,
      "type": "branch",
      "address": "Tokyo, Japan"
    }
  ]
}
\`\`\`

## Minimal Example

\`\`\`json
{
  "title": "Location",
  "type": "map",
  "fields": [
    {
      "name": "Office",
      "x": 0,
      "y": 0
    }
  ]
}
\`\`\`

## Best Practices

1. Include coordinates or addresses
2. Use proper location formats
3. Add location metadata
4. Ensure map accessibility

## Component Information

- **Selector:** \`app-map-section\`
- **Component Path:** \`./lib/components/sections/map-section/map-section.component\`
- **Style Path:** \`./lib/styles/components/sections/_map.scss\`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

const demoConfig = {
  title: 'Global Presence',
  type: 'map',
  description: 'Office locations worldwide',
  fields: [
    {
      name: 'Headquarters',
      x: 37.7749,
      y: -122.4194,
      type: 'office',
      address: 'San Francisco, CA, USA',
    },
    {
      name: 'European HQ',
      x: 51.5074,
      y: -0.1278,
      type: 'office',
      address: 'London, UK',
    },
    {
      name: 'APAC Office',
      x: 35.6762,
      y: 139.6503,
      type: 'branch',
      address: 'Tokyo, Japan',
    },
  ],
};

/**
 * Map Section documentation page with live demo
 * Auto-generated - modifications may be overwritten
 */
@Component({
  selector: 'app-map-page',
  standalone: true,
  imports: [DocPageComponent, DocsDemoComponent],
  template: `
    <div class="section-docs">
      <app-docs-demo
        [config]="demo"
        [type]="'map'"
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
export class MapPageComponent {
  content = pageContent;
  demo = demoConfig;
}

export default MapPageComponent;
