# Gallery Section

Displays image galleries, photo collections, and visual media.

## Overview

The **Gallery Section** (`type: "gallery"`) is used for displays image galleries, photo collections, and visual media.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | `gallery` |
| Uses Fields | No |
| Uses Items | Yes |
| Default Columns | 2 |
| Supports Collapse | Yes |
| Aliases | None |


## Use Cases

- Photo galleries
- Product images
- Team photos
- Office tours
- Event coverage

## Data Schema



### Items Schema

| Property | Type | Description |
|----------|------|-------------|
| `title` | string | Image title/caption |
| `description` | string | Image description |
| `meta` | object | - |

## Complete Example

```json
{
  "title": "Life at Nexus",
  "type": "gallery",
  "description": "Behind the scenes at our global offices",
  "items": [
    {
      "title": "Austin Headquarters",
      "description": "Our 50,000 sq ft headquarters in downtown Austin featuring open workspaces and collaboration zones",
      "meta": {
        "url": "https://images.nexustech.io/office/austin-hq.jpg",
        "caption": "Nexus HQ in Austin, Texas",
        "alt": "Modern office building with glass facade"
      }
    },
    {
      "title": "Engineering All-Hands",
      "description": "Quarterly engineering town hall with product roadmap presentations and team celebrations",
      "meta": {
        "url": "https://images.nexustech.io/events/eng-allhands.jpg",
        "caption": "Engineering team gathering",
        "alt": "Large group of engineers in conference room"
      }
    },
    {
      "title": "NexusCon 2024 Keynote",
      "description": "CEO Sarah Mitchell delivering the opening keynote to 3,000+ attendees in San Francisco",
      "meta": {
        "url": "https://images.nexustech.io/events/nexuscon-keynote.jpg",
        "caption": "NexusCon 2024 main stage",
        "alt": "Speaker on stage at large conference"
      }
    }
  ]
}
```

## Minimal Example

```json
{
  "title": "Gallery",
  "type": "gallery",
  "items": [
    {
      "title": "Image 1"
    }
  ]
}
```

## Best Practices

1. Include image URLs
2. Add captions/alt text
3. Optimize image sizes
4. Use consistent aspect ratios
5. Group related images

## Component Information

- **Selector:** `lib-gallery-section`
- **Component Path:** `./lib/components/sections/gallery-section/gallery-section.component`


## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
