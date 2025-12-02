import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';
import { DocsDemoComponent } from '../../components';

const pageContent = `# News Section

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
| Aliases | \`press\`, \`articles\` |


## Use Cases

- News feeds
- Press releases
- Announcements
- Industry updates
- Company news

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
  "title": "Latest News & Press Coverage",
  "type": "news",
  "description": "Recent company news, press releases, and industry recognition",
  "items": [
    {
      "title": "Nexus Technologies Closes $85M Series C to Accelerate AI Innovation",
      "description": "Funding led by Sequoia Capital will fuel expansion of AI capabilities, global go-to-market, and strategic acquisitions. Company valuation reaches $1.2B.",
      "meta": {
        "source": "TechCrunch",
        "date": "2025-01-20",
        "url": "https://techcrunch.com/nexus-series-c",
        "category": "Funding"
      },
      "status": "published"
    },
    {
      "title": "Nexus Named Leader in Gartner Magic Quadrant for Analytics & BI Platforms",
      "description": "Recognition highlights company's vision completeness and ability to execute, with highest scores for AI/ML capabilities and customer experience.",
      "meta": {
        "source": "Gartner",
        "date": "2024-12-15",
        "url": "https://gartner.com/magic-quadrant/analytics",
        "category": "Recognition"
      },
      "status": "published"
    },
    {
      "title": "Q4 2024 Revenue Exceeds $42M, Up 47% Year-Over-Year",
      "description": "Strong enterprise demand drives record quarterly results. Full-year ARR surpasses $127M with path to profitability in 2025.",
      "meta": {
        "source": "Company Press Release",
        "date": "2025-01-15",
        "category": "Earnings"
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
      "title": "Company Update"
    }
  ]
}
\`\`\`

## Best Practices

1. Include source and publication date in meta
2. Keep headlines concise
3. Use descriptions for summaries
4. Include status for article state
5. Order chronologically

## Component Information

- **Selector:** \`lib-news-section\`
- **Component Path:** \`./lib/components/sections/news-section/news-section.component\`
- **Style Path:** \`./lib/components/sections/news-section/news-section.scss\`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

const demoConfig = {
  title: 'Latest News & Press Coverage',
  type: 'news',
  description: 'Recent company news, press releases, and industry recognition',
  items: [
    {
      title: 'Nexus Technologies Closes $85M Series C to Accelerate AI Innovation',
      description:
        'Funding led by Sequoia Capital will fuel expansion of AI capabilities, global go-to-market, and strategic acquisitions. Company valuation reaches $1.2B.',
      meta: {
        source: 'TechCrunch',
        date: '2025-01-20',
        url: 'https://techcrunch.com/nexus-series-c',
        category: 'Funding',
      },
      status: 'published',
    },
    {
      title: 'Nexus Named Leader in Gartner Magic Quadrant for Analytics & BI Platforms',
      description:
        "Recognition highlights company's vision completeness and ability to execute, with highest scores for AI/ML capabilities and customer experience.",
      meta: {
        source: 'Gartner',
        date: '2024-12-15',
        url: 'https://gartner.com/magic-quadrant/analytics',
        category: 'Recognition',
      },
      status: 'published',
    },
    {
      title: 'Q4 2024 Revenue Exceeds $42M, Up 47% Year-Over-Year',
      description:
        'Strong enterprise demand drives record quarterly results. Full-year ARR surpasses $127M with path to profitability in 2025.',
      meta: {
        source: 'Company Press Release',
        date: '2025-01-15',
        category: 'Earnings',
      },
      status: 'published',
    },
  ],
};

/**
 * News Section documentation page with live demo
 * Auto-generated - modifications may be overwritten
 */
@Component({
  selector: 'app-news-page',
  standalone: true,
  imports: [DocPageComponent, DocsDemoComponent],
  template: `
    <div class="section-docs">
      <app-docs-demo
        [config]="demo"
        [type]="'news'"
        demoTitle="Live Preview"
        height="350px"
      ></app-docs-demo>
      <app-doc-page [content]="content"></app-doc-page>
    </div>
  `,
  styles: [
    `
      .section-docs {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsPageComponent {
  content = pageContent;
  demo = demoConfig;
}

export default NewsPageComponent;
