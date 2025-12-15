# News Section

Displays news articles, headlines, and press releases. Supports source attribution and publication dates.

## Overview

The **News Section** is used for displays news articles, headlines, and press releases. supports source attribution and publication dates.

## Use Cases

- News feeds
- Press releases
- Announcements
- Blog posts

## Data Schema

```typescript
interface CardSection {
  title: string;
  type: 'news';
  fields?: CardField[];
  items?: CardItem[];
}
```

## Example

```json
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
  ],
  "preferredColumns": 1,
  "priority": 3
}
```

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
