import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgDocPageComponent, NgDocRootPage } from '@ng-doc/app';
import { NgDocPageType } from '@ng-doc/core';
import pageConfig from './map.page';

const pageContent: string = `# Map Section

Displays geographic data with embedded maps, pins, and location information.

## Overview

The **Map Section** is used for displays geographic data with embedded maps, pins, and location information.

## Use Cases

- Office locations
- Store finder
- Geographic data
- Location tracking

## Data Schema

\`\`\`typescript
interface CardSection {
  title: string;
  type: 'map';
  fields?: CardField[];
  
}
\`\`\`

## Example

\`\`\`json
{
  "title": "Map Section Example",
  "type": "map",
  "fields": [
    {
      "label": "Example Label",
      "value": "Example Value"
    }
  ]
}
\`\`\`

## Best Practices

1. Include coordinates or addresses
1. Use proper location formats
1. Add location metadata
1. Ensure map accessibility

## Component Properties




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
