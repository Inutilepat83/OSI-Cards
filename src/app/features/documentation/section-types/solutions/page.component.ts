import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgDocPageComponent, NgDocRootPage } from '@ng-doc/app';
import { NgDocPageType } from '@ng-doc/core';
import pageConfig from './solutions.page';

const pageContent: string = `# Solutions Section

Displays solution offerings, use cases, features, and benefits.

## Overview

The **Solutions Section** is used for displays solution offerings, use cases, features, and benefits.

## Use Cases

- Service offerings
- Solution portfolios
- Use cases
- Case studies

## Data Schema

\`\`\`typescript
interface CardSection {
  title: string;
  type: 'solutions';
  fields?: CardField[];
  
}
\`\`\`

## Example

\`\`\`json
{
  "title": "Solutions Section Example",
  "type": "solutions",
  "fields": [
    {
      "label": "Example Label",
      "value": "Example Value"
    }
  ]
}
\`\`\`

## Best Practices

1. Highlight key benefits
1. Include use cases
1. Add feature lists
1. Show outcomes when available

## Component Properties




## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

@Component({
  selector: 'ng-doc-page-solutions',
  template: `<ng-doc-page></ng-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDocPageComponent],
  providers: [
    { provide: NgDocRootPage, useExisting: SolutionsPageComponent }
  ],
  standalone: true
})
export class SolutionsPageComponent extends NgDocRootPage {
  readonly pageType: NgDocPageType = 'guide';
  readonly pageContent: string = pageContent;
  readonly editSourceFileUrl?: string;
  readonly viewSourceFileUrl?: string;
  override readonly page = pageConfig;

  constructor() {
    super();
  }
}

export default SolutionsPageComponent;
