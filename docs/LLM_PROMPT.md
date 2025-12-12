# OSI Cards - LLM Card Generation Guide

> AUTO-GENERATED FROM section-registry.json
> Generated: 2025-12-04T09:39:38.459Z

## Overview

OSI Cards is a card-based UI component library for Angular. Cards are JSON configurations
that define structured data displays with multiple section types.

## Card Structure

```json
{
  "cardTitle": "Card Title",
  "cardSubtitle": "Optional Subtitle",
  "cardType": "company|contact|event|product|analytics",
  "description": "Card description",
  "sections": [
    {
      "title": "Section Title",
      "type": "<section-type>",
      "fields": [...] // or "items": [...]
    }
  ],
  "actions": [
    {
      "label": "Action Label",
      "type": "website|mail|agent|question",
      "variant": "primary|secondary|outline|ghost"
    }
  ]
}
```

## Available Section Types

### analytics
Displays metrics with visual indicators, trends, and percentages. Perfect for KPIs, performance metrics, and statistical data.
Uses fields:
    - label: string
    - value: string,number
    - percentage: number
    - performance: string
    - trend: string

Example:
```json
{
  "title": "Key Metric",
  "type": "analytics",
  "fields": [
    {
      "label": "Score",
      "value": "85%",
      "percentage": 85
    }
  ]
}
```

### brand-colors
Displays color swatches, brand palettes, and design system colors.
Uses fields:
    - label: string
    - value: string
    - description: string
    - category: string

Example:
```json
{
  "title": "Colors",
  "type": "brand-colors",
  "fields": [
    {
      "label": "Primary",
      "value": "#000000"
    }
  ]
}
```

### chart
Displays data visualizations including bar charts, line charts, pie charts, and more.
Uses items:


Example:
```json
{
  "title": "Basic Chart",
  "type": "chart",
  "chartType": "bar",
  "chartData": {
    "labels": [
      "A",
      "B",
      "C"
    ],
    "datasets": [
      {
        "data": [
          10,
          20,
          30
        ]
      }
    ]
  }
}
```

### contact-card
Displays person information with avatars, roles, contact details, and social links.
Uses fields:
    - title: string
    - label: string
    - value: string
    - role: string
    - email: string

Example:
```json
{
  "title": "Primary Contact",
  "type": "contact-card",
  "fields": [
    {
      "title": "Support Team",
      "email": "support@company.com"
    }
  ]
}
```

### event
Displays chronological events, timelines, schedules, and calendar information.
Uses fields:
    - label: string
    - value: string
    - date: string
    - time: string
    - endDate: string

Example:
```json
{
  "title": "Upcoming Event",
  "type": "event",
  "fields": [
    {
      "label": "Meeting",
      "value": "Team Sync",
      "date": "2025-01-15"
    }
  ]
}
```

### fallback
Default section renderer for unknown or unsupported section types.
Uses fields:


Example:
```json
{
  "title": "Fallback",
  "type": "fallback"
}
```

### faq
Displays frequently asked questions with expandable answers.
Uses items:
    - title: string
    - description: string
    - meta: object

Example:
```json
{
  "title": "FAQ",
  "type": "faq",
  "items": [
    {
      "title": "Question?",
      "description": "Answer here."
    }
  ]
}
```

### financials
Displays financial data including revenue, expenses, P&L statements, and currency information.
Uses fields:
    - label: string
    - value: string,number
    - format: string
    - change: number
    - trend: string

Example:
```json
{
  "title": "Revenue",
  "type": "financials",
  "fields": [
    {
      "label": "Total Revenue",
      "value": "$10M"
    }
  ]
}
```

### gallery
Displays image galleries, photo collections, and visual media.
Uses items:
    - title: string
    - description: string
    - meta: object

Example:
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

### info
Displays key-value pairs in a clean, scannable format. Ideal for metadata, contact information, and general data display.
Uses fields:
    - label: string
    - value: string,number,boolean,null
    - icon: string
    - description: string
    - trend: string

Example:
```json
{
  "title": "Quick Info",
  "type": "info",
  "fields": [
    {
      "label": "Status",
      "value": "Active"
    }
  ]
}
```

### list
Displays structured lists and tables. Supports sorting, filtering, and item interactions.
Uses items:
    - title: string
    - description: string
    - icon: string
    - status: string
    - value: string,number

Example:
```json
{
  "title": "Tasks",
  "type": "list",
  "items": [
    {
      "title": "Task 1"
    }
  ]
}
```

### map
Displays geographic data with embedded maps, pins, and location information.
Uses fields:
    - name: string
    - address: string
    - x: number
    - y: number
    - type: string

Example:
```json
{
  "title": "Location",
  "type": "map",
  "fields": [
    {
      "name": "Main Office",
      "x": 0,
      "y": 0
    }
  ]
}
```

### network-card
Displays relationship graphs, network connections, and influence metrics.
Uses items:
    - title: string
    - description: string
    - meta: object

Example:
```json
{
  "title": "Partners",
  "type": "network-card",
  "items": [
    {
      "title": "Partner Organization"
    }
  ]
}
```

### news
Displays news articles, headlines, and press releases. Supports source attribution and publication dates.
Uses items:
    - title: string
    - description: string
    - meta: object
    - status: string

Example:
```json
{
  "title": "News",
  "type": "news",
  "items": [
    {
      "title": "Company Update"
    }
  ]
}
```

### overview
Displays high-level summaries, executive dashboards, and key highlights.
Uses fields:
    - label: string
    - value: string
    - icon: string
    - highlight: boolean

Example:
```json
{
  "title": "Overview",
  "type": "overview",
  "fields": [
    {
      "label": "Summary",
      "value": "Brief overview of the topic"
    }
  ]
}
```

### product
Displays product information, features, benefits, and pricing.
Uses fields:
    - label: string
    - value: string
    - icon: string
    - price: string
    - status: string

Example:
```json
{
  "title": "Product",
  "type": "product",
  "fields": [
    {
      "label": "Name",
      "value": "Basic Product"
    }
  ]
}
```

### quotation
Displays quotes, testimonials, highlighted text, and citations.
Uses fields:
    - label: string
    - value: string
    - quote: string
    - description: string
    - author: string

Example:
```json
{
  "title": "Testimonial",
  "type": "quotation",
  "fields": [
    {
      "value": "\"Great product!\""
    }
  ]
}
```

### social-media
Displays social media posts, engagement metrics, and social feed content.
Uses fields:
    - platform: string
    - handle: string
    - url: string
    - followers: number
    - engagement: number

Example:
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

### solutions
Displays solution offerings, use cases, features, and benefits.
Uses fields:
    - title: string
    - description: string
    - category: string
    - benefits: array
    - deliveryTime: string

Example:
```json
{
  "title": "Solution",
  "type": "solutions",
  "fields": [
    {
      "title": "Consulting Service",
      "description": "Professional consultation"
    }
  ]
}
```

### text-reference
Displays long-form text, paragraphs, articles, and reference content.
Uses fields:
    - label: string
    - value: string
    - text: string
    - description: string
    - url: string

Example:
```json
{
  "title": "References",
  "type": "text-reference",
  "fields": [
    {
      "label": "Link",
      "value": "Reference Document"
    }
  ]
}
```

### timeline
Displays chronological sequences of events, milestones, and historical data.
Uses items:
    - title: string
    - description: string
    - meta: object

Example:
```json
{
  "title": "Timeline",
  "type": "timeline",
  "items": [
    {
      "title": "Event 1",
      "meta": {
        "year": "2024"
      }
    }
  ]
}
```

### video
Displays video content with thumbnails, durations, and playback controls.
Uses items:
    - title: string
    - description: string
    - meta: object

Example:
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

## Type Aliases

The following aliases are supported for backward compatibility:



## Guidelines for LLM Card Generation

1. **Always use valid section types** from the list above
2. **Match data structure** - use `fields` or `items` based on section type
3. **Include required properties** - `title` and `type` are always required
4. **Use appropriate types** - analytics for metrics, list for items, etc.
5. **Validate JSON** - ensure output is valid JSON before returning

## Quick Reference

| Section Type | Data Structure | Best For |
|--------------|---------------|----------|
| `analytics` | fields | Performance metrics |
| `brand-colors` | fields | Brand assets |
| `chart` | fields | Data visualization |
| `contact-card` | fields | Team members |
| `event` | items | Event calendars |
| `fallback` | items | Unknown types |
| `faq` | items | Help content |
| `financials` | fields | Financial reports |
| `gallery` | items | Photo galleries |
| `info` | fields | Company information |
| `list` | items | Product lists |
| `map` | fields | Office locations |
| `network-card` | items | Org charts |
| `news` | items | News feeds |
| `overview` | fields | Executive summaries |
| `product` | fields | Product catalogs |
| `quotation` | fields | Testimonials |
| `social-media` | items | Social profiles |
| `solutions` | items | Service offerings |
| `text-reference` | fields | Articles |
| `timeline` | items | Company history |
| `video` | items | Product demos |

## Example Complete Card

```json
{
  "cardTitle": "Example Company Card",
  "cardType": "company",
  "sections": [
    {
      "title": "Overview",
      "type": "overview",
      "fields": [
        { "label": "Industry", "value": "Technology" },
        { "label": "Founded", "value": "2010" }
      ]
    },
    {
      "title": "Key Metrics",
      "type": "analytics",
      "fields": [
        { "label": "Revenue Growth", "value": "25%", "percentage": 25, "trend": "up" }
      ]
    }
  ],
  "actions": [
    { "label": "Learn More", "type": "website", "variant": "primary", "url": "https://example.com" }
  ]
}
```





