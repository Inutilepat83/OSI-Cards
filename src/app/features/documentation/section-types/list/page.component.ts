import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgDocPageComponent, NgDocRootPage } from '@ng-doc/app';
import { NgDocPageType } from '@ng-doc/core';
import pageConfig from './list.page';

const pageContent: string = `# List Section

Displays structured lists and tables. Supports sorting, filtering, and item interactions.

## Overview

The **List Section** is used for displays structured lists and tables. supports sorting, filtering, and item interactions.

## Use Cases

- Product lists
- Employee rosters
- Inventory
- Task lists

## Data Schema

\`\`\`typescript
interface CardSection {
  title: string;
  type: 'list';
  fields?: CardField[];
  items?: CardItem[];
}
\`\`\`

## Example

\`\`\`json
{
  "title": "List Section Example",
  "type": "list",
  "items": [
    {
      "title": "Example Item",
      "description": "Item description"
    }
  ]
}
\`\`\`

## Best Practices

1. Use items array for list data
1. Include titles and descriptions
1. Add status badges when relevant
1. Keep list items scannable

## Component Properties




## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

@Component({
  selector: 'ng-doc-page-list',
  template: `<ng-doc-page></ng-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDocPageComponent],
  providers: [
    { provide: NgDocRootPage, useExisting: ListPageComponent }
  ],
  standalone: true
})
export class ListPageComponent extends NgDocRootPage {
  readonly pageType: NgDocPageType = 'guide';
  readonly pageContent: string = pageContent;
  readonly editSourceFileUrl?: string;
  readonly viewSourceFileUrl?: string;
  override readonly page = pageConfig;

  constructor() {
    super();
  }
}

export default ListPageComponent;
