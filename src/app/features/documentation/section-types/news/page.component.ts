import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgDocPageComponent, NgDocRootPage } from '@ng-doc/app';
import { NgDocPageType } from '@ng-doc/core';
import pageConfig from './news.page';

const pageContent: string = `# News Section

Displays news articles, headlines, and press releases. Supports source attribution and publication dates.

## Overview

The **News Section** (\`type: "news"\`) is used for displays news articles, headlines, and press releases. supports source attribution and publication dates.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | \`news\` |
| Uses Fields | No |
| Uses Items | Yes |
| Default Columns | 1 |
| Supports Collapse | Yes |
| Aliases | None |


## Use Cases

- News feeds
- Press releases
- Announcements
- Blog posts

## Data Schema



### Items Schema

| Property | Type | Description |
|----------|------|-------------|
| \`title\` | string | News headline |
| \`description\` | string | News summary |
| \`meta\` | object | - |
| \`status\` | string | Article status |

## Complete Example

\`\`\`json
{
  "title": "Latest News",
  "type": "news",
  "description": "Recent company news and announcements",
  "items": [
    {
      "title": "Q4 Earnings Beat Expectations",
      "description": "Company reports 25% revenue growth in Q4 2024",
      "meta": {
        "source": "Bloomberg",
        "date": "2025-01-15"
      },
      "status": "published"
    },
    {
      "title": "New Product Launch Announced",
      "description": "Enterprise Suite 4.0 coming Spring 2025",
      "meta": {
        "source": "Press Release",
        "date": "2025-01-10"
      },
      "status": "published"
    }
  ]
}
\`\`\`

## Minimal Example

\`\`\`json
{
  "title": "News",
  "type": "news",
  "items": [
    {
      "title": "News Item"
    }
  ]
}
\`\`\`

## Best Practices

1. Include source and publication date in meta
2. Keep headlines concise
3. Use descriptions for summaries
4. Include status for article state

## Component Information

- **Selector:** \`app-news-section\`
- **Component Path:** \`./lib/components/sections/news-section/news-section.component\`
- **Style Path:** \`./lib/styles/components/sections/_news.scss\`

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
