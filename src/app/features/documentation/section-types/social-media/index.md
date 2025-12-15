# Social Media Section

Displays social media posts, engagement metrics, and social feed content.

## Overview

The **Social Media Section** is used for displays social media posts, engagement metrics, and social feed content.

## Use Cases

- Social feeds
- Engagement tracking
- Social monitoring
- Content aggregation

## Data Schema

```typescript
interface CardSection {
  title: string;
  type: 'social-media';
  fields?: CardField[];
  
}
```

## Example

```json
{
  "title": "Social Media Presence",
  "type": "social-media",
  "description": "Official company social profiles and engagement",
  "preferredColumns": 2,
  "priority": 3,
  "fields": [
    {
      "platform": "linkedin",
      "handle": "Nexus Technologies",
      "url": "https://linkedin.com/company/nexus-tech",
      "followers": 125000,
      "engagement": 4.8,
      "verified": true
    },
    {
      "platform": "twitter",
      "handle": "@NexusTech",
      "url": "https://twitter.com/NexusTech",
      "followers": 87500,
      "engagement": 3.2,
      "verified": true
    },
    {
      "platform": "github",
      "handle": "nexus-tech",
      "url": "https://github.com/nexus-tech",
      "followers": 12500,
      "verified": false
    },
    {
      "platform": "facebook",
      "handle": "NexusTechnologies",
      "url": "https://facebook.com/NexusTechnologies",
      "followers": 28000,
      "engagement": 2.1,
      "verified": true
    }
  ]
}
```

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
