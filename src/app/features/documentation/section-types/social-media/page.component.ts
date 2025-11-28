import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgDocPageComponent, NgDocRootPage } from '@ng-doc/app';
import { NgDocPageType } from '@ng-doc/core';
import pageConfig from './social-media.page';

const pageContent: string = `# Social Media Section

Displays social media posts, engagement metrics, and social feed content.

## Overview

The **Social Media Section** is used for displays social media posts, engagement metrics, and social feed content.

## Use Cases

- Social feeds
- Engagement tracking
- Social monitoring
- Content aggregation

## Data Schema

\`\`\`typescript
interface CardSection {
  title: string;
  type: 'social-media';
  fields?: CardField[];
  
}
\`\`\`

## Example

\`\`\`json
{
  "title": "Social Media Section Example",
  "type": "social-media",
  "fields": [
    {
      "label": "Example Label",
      "value": "Example Value"
    }
  ]
}
\`\`\`

## Best Practices

1. Include platform information
1. Show engagement metrics
1. Add timestamps
1. Include author information

## Component Properties




## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

@Component({
  selector: 'ng-doc-page-social-media',
  template: `<ng-doc-page></ng-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDocPageComponent],
  providers: [
    { provide: NgDocRootPage, useExisting: SocialMediaPageComponent }
  ],
  standalone: true
})
export class SocialMediaPageComponent extends NgDocRootPage {
  readonly pageType: NgDocPageType = 'guide';
  readonly pageContent: string = pageContent;
  readonly editSourceFileUrl?: string;
  readonly viewSourceFileUrl?: string;
  override readonly page = pageConfig;

  constructor() {
    super();
  }
}

export default SocialMediaPageComponent;
