import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgDocPageComponent, NgDocRootPage } from '@ng-doc/app';
import { NgDocPageType } from '@ng-doc/core';
import pageConfig from './network-card.page';

const pageContent: string = `# Network Card Section

Displays relationship graphs, network connections, and influence metrics.

## Overview

The **Network Card Section** is used for displays relationship graphs, network connections, and influence metrics.

## Use Cases

- Org charts
- Relationship maps
- Network analysis
- Connection graphs

## Data Schema

\`\`\`typescript
interface CardSection {
  title: string;
  type: 'network-card';
  fields?: CardField[];
  
}
\`\`\`

## Example

\`\`\`json
{
  "title": "Network Card Section Example",
  "type": "network-card",
  "fields": [
    {
      "label": "Example Label",
      "value": "Example Value"
    }
  ]
}
\`\`\`

## Best Practices

1. Show relationships clearly
1. Include connection types
1. Add influence metrics
1. Use visual hierarchy

## Component Properties




## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

@Component({
  selector: 'ng-doc-page-network-card',
  template: `<ng-doc-page></ng-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDocPageComponent],
  providers: [
    { provide: NgDocRootPage, useExisting: NetworkCardPageComponent }
  ],
  standalone: true
})
export class NetworkCardPageComponent extends NgDocRootPage {
  readonly pageType: NgDocPageType = 'guide';
  readonly pageContent: string = pageContent;
  readonly editSourceFileUrl?: string;
  readonly viewSourceFileUrl?: string;
  override readonly page = pageConfig;

  constructor() {
    super();
  }
}

export default NetworkCardPageComponent;
