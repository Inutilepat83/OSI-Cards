# Video Section

Displays video content with thumbnails, durations, and playback controls.

## Overview

The **Video Section** (`type: "video"`) is used for displays video content with thumbnails, durations, and playback controls.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | `video` |
| Uses Fields | No |
| Uses Items | Yes |
| Default Columns | 2 |
| Supports Collapse | Yes |
| Aliases | None |


## Use Cases

- Product demos
- Training videos
- Webinar recordings
- Customer testimonials
- Tutorial content

## Data Schema



### Items Schema

| Property | Type | Description |
|----------|------|-------------|
| `title` | string | Video title |
| `description` | string | Video description |
| `meta` | object | - |

## Complete Example

```json
{
  "title": "Video Resources",
  "type": "video",
  "description": "Product demos, tutorials, and webinar recordings",
  "items": [
    {
      "title": "Nexus Analytics Platform Overview",
      "description": "Complete walkthrough of the Nexus platform capabilities, AI features, and enterprise integrations",
      "meta": {
        "url": "https://videos.nexustech.io/platform-overview",
        "thumbnail": "https://images.nexustech.io/thumbnails/overview.jpg",
        "duration": "12:45",
        "views": 45000,
        "category": "Product Demo"
      }
    },
    {
      "title": "Getting Started with Nexus in 5 Minutes",
      "description": "Quick-start guide covering account setup, data connection, and your first dashboard",
      "meta": {
        "url": "https://videos.nexustech.io/quickstart",
        "thumbnail": "https://images.nexustech.io/thumbnails/quickstart.jpg",
        "duration": "5:23",
        "views": 125000,
        "category": "Tutorial"
      }
    },
    {
      "title": "AI-Powered Insights Demo",
      "description": "See how our AI engine automatically discovers insights and explains metric changes",
      "meta": {
        "url": "https://videos.nexustech.io/ai-demo",
        "thumbnail": "https://images.nexustech.io/thumbnails/ai-demo.jpg",
        "duration": "8:15",
        "views": 67000,
        "category": "Product Demo"
      }
    }
  ]
}
```

## Minimal Example

```json
{
  "title": "Videos",
  "type": "video",
  "items": [
    {
      "title": "Video Title"
    }
  ]
}
```

## Best Practices

1. Include video thumbnails
2. Show duration information
3. Add descriptive titles
4. Provide video URLs
5. Group by category

## Component Information

- **Selector:** `lib-video-section`
- **Component Path:** `./lib/components/sections/video-section/video-section.component`


## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
