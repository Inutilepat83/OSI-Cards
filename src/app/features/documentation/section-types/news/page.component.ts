import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgDocPageComponent, NgDocRootPage } from '@ng-doc/app';
import { NgDocPageType } from '@ng-doc/core';
import pageConfig from './news.page';

const pageContent: string = `# News Section

Displays news articles, headlines, and press releases. Supports source attribution and publication dates.

## Overview

The **News Section** is used for displays news articles, headlines, and press releases. supports source attribution and publication dates.

## Use Cases

- News feeds
- Press releases
- Announcements
- Blog posts

## Data Schema

\`\`\`typescript
interface CardSection {
  title: string;
  type: 'news';
  fields?: CardField[];
  items?: CardItem[];
}
\`\`\`

## Example

\`\`\`json
{
  "title": "News Section Example",
  "type": "news",
  "items": [
    {
      "title": "Example Item",
      "description": "Item description"
    }
  ]
}
\`\`\`

## Best Practices

1. Include source and publication date in meta
1. Keep headlines concise
1. Use descriptions for summaries
1. Include status for article state

## Component Properties




## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

@Component({
  selector: 'ng-doc-page-news',
  template: `<ng-doc-page></ng-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDocPageComponent],
  providers: [
    { provide: NgDocRootPage, useExisting: NewsPageComponent }
  ],
  standalone: true
})
export class NewsPageComponent extends NgDocRootPage {
  readonly pageType: NgDocPageType = 'guide';
  readonly pageContent: string = pageContent;
  readonly editSourceFileUrl?: string;
  readonly viewSourceFileUrl?: string;
  override readonly page = pageConfig;

  constructor() {
    super();
  }
}

export default NewsPageComponent;
