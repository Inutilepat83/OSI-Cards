# Social Media Section

Displays social media posts, engagement metrics, and social feed content.

## Overview

The **Social Media Section** (`type: "social-media"`) is used for displays social media posts, engagement metrics, and social feed content.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | `social-media` |
| Uses Fields | Yes |
| Uses Items | Yes |
| Default Columns | 1 |
| Supports Collapse | Yes |
| Aliases | None |


## Use Cases

- Social profiles
- Social feeds
- Engagement tracking
- Social monitoring
- Content aggregation

## Data Schema

### Fields Schema

| Property | Type | Description |
|----------|------|-------------|
| `platform` | string | Social platform |
| `handle` | string | Social media handle |
| `url` | string | Profile URL |
| `followers` | number | Follower count |
| `engagement` | number | Engagement rate |
| `verified` | boolean | Verified account |

### Items Schema

| Property | Type | Description |
|----------|------|-------------|
| `platform` | string | Social platform |
| `handle` | string | Social media handle |
| `url` | string | Profile URL |
| `followers` | number | Follower count |
| `engagement` | number | Engagement rate |
| `verified` | boolean | Verified account |

## Complete Example

```json
{
  "title": "Social Media Presence",
  "type": "social-media",
  "description": "Official company social profiles and engagement",
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
      "platform": "youtube",
      "handle": "Nexus Technologies",
      "url": "https://youtube.com/@nexustech",
      "followers": 45000,
      "engagement": 6.1,
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
      "platform": "instagram",
      "handle": "@nexustech.official",
      "url": "https://instagram.com/nexustech.official",
      "followers": 32000,
      "engagement": 5.4,
      "verified": true
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

## Minimal Example

```json
{
  "title": "Social",
  "type": "social-media",
  "fields": [
    {
      "platform": "linkedin",
      "handle": "@company"
    }
  ]
}
```

## Best Practices

1. Include platform information
2. Show engagement metrics
3. Add timestamps
4. Include profile links
5. Show follower counts

## Component Information

- **Selector:** `lib-social-media-section`
- **Component Path:** `./lib/components/sections/social-media-section/social-media-section.component`


## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
