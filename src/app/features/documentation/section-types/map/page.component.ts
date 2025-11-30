import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgDocPageComponent, NgDocRootPage } from '@ng-doc/app';
import { NgDocPageType } from '@ng-doc/core';
import pageConfig from './map.page';

const pageContent: string = `# Map Section

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

@Component({
  selector: 'ng-doc-page-map',
  template: `<ng-doc-page></ng-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDocPageComponent],
  providers: [
    { provide: NgDocRootPage, useExisting: MapPageComponent }
  ],
  standalone: true
})
export class MapPageComponent extends NgDocRootPage {
  readonly pageType: NgDocPageType = 'guide';
  readonly pageContent: string = pageContent;
  readonly editSourceFileUrl?: string;
  readonly viewSourceFileUrl?: string;
  override readonly page = pageConfig;

  constructor() {
    super();
  }
}

export default MapPageComponent;
