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

### Items Schema

| Property | Type | Description |
|----------|------|-------------|
| `platform` | string | Social platform |
| `handle` | string | Social media handle |
| `url` | string | Profile URL |
| `followers` | number | Follower count |

## Complete Example

```json
{
  "title": "Social Media Presence",
  "type": "social-media",
  "description": "Company social media profiles",
  "fields": [
    {
      "platform": "linkedin",
      "handle": "@company",
      "url": "https://linkedin.com/company/example",
      "followers": 50000
    },
    {
      "platform": "twitter",
      "handle": "@company",
      "url": "https://twitter.com/company",
      "followers": 25000
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
4. Include author information

## Component Information

- **Selector:** `app-social-media-section`
- **Component Path:** `./lib/components/sections/social-media-section/social-media-section.component`
- **Style Path:** `./lib/styles/components/sections/_social-media.scss`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
