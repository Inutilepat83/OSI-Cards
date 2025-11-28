import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgDocPageComponent, NgDocRootPage } from '@ng-doc/app';
import { NgDocPageType } from '@ng-doc/core';
import pageConfig from './base.page';

const pageContent: string = `# base Section

Documentation for base section type.

## Overview

The **base Section** is used for documentation for base section type.

## Use Cases



## Data Schema

\`\`\`typescript
interface CardSection {
  title: string;
  type: 'base';
  fields?: CardField[];
  
}
\`\`\`

## Example

\`\`\`json
{
  "title": "base Section Example",
  "type": "base",
  "fields": [
    {
      "label": "Example Label",
      "value": "Example Value"
    }
  ]
}
\`\`\`

## Best Practices



## Component Properties


### Outputs

- **fieldInteraction**: Output event
- **itemInteraction**: Output event


## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

@Component({
  selector: 'ng-doc-page-base',
  template: `<ng-doc-page></ng-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDocPageComponent],
  providers: [
    { provide: NgDocRootPage, useExisting: BasePageComponent }
  ],
  standalone: true
})
export class BasePageComponent extends NgDocRootPage {
  readonly pageType: NgDocPageType = 'guide';
  readonly pageContent: string = pageContent;
  readonly editSourceFileUrl?: string;
  readonly viewSourceFileUrl?: string;
  override readonly page = pageConfig;

  constructor() {
    super();
  }
}

export default BasePageComponent;
