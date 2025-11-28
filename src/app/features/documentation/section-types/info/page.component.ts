import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgDocPageComponent, NgDocRootPage } from '@ng-doc/app';
import { NgDocPageType } from '@ng-doc/core';
import pageConfig from './info.page';

const pageContent: string = `# Info Section

Displays key-value pairs in a clean, scannable format. Ideal for metadata, contact information, and general data display.

## Overview

The **Info Section** is used for displays key-value pairs in a clean, scannable format. ideal for metadata, contact information, and general data display.

## Use Cases

- Company information
- Contact details
- Metadata display
- Key-value pairs

## Data Schema

\`\`\`typescript
interface CardSection {
  title: string;
  type: 'info';
  fields?: CardField[];
  
}
\`\`\`

## Example

\`\`\`json
{
  "title": "Info Section Example",
  "type": "info",
  "fields": [
    {
      "label": "Example Label",
      "value": "Example Value"
    }
  ]
}
\`\`\`

## Best Practices

1. Use for structured data with clear labels and values
1. Keep labels concise and descriptive
1. Use trend indicators for dynamic data
1. Group related fields together

## Component Properties


### Outputs

- **infoFieldInteraction**: Output event


## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

@Component({
  selector: 'ng-doc-page-info',
  template: `<ng-doc-page></ng-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDocPageComponent],
  providers: [
    { provide: NgDocRootPage, useExisting: InfoPageComponent }
  ],
  standalone: true
})
export class InfoPageComponent extends NgDocRootPage {
  readonly pageType: NgDocPageType = 'guide';
  readonly pageContent: string = pageContent;
  readonly editSourceFileUrl?: string;
  readonly viewSourceFileUrl?: string;
  override readonly page = pageConfig;

  constructor() {
    super();
  }
}

export default InfoPageComponent;
