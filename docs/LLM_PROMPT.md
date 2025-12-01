# OSI Cards - LLM Card Generation Guide

> AUTO-GENERATED FROM section-registry.json
> Generated: 2025-12-01T16:52:12.274Z

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
  "title": "Info",
  "type": "info",
  "fields": [
    {
      "label": "Key",
      "value": "Value"
    }
  ]
}
```

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
  "title": "Analytics",
  "type": "analytics",
  "fields": [
    {
      "label": "Score",
      "value": "100%",
      "percentage": 100
    }
  ]
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
  "title": "Contact",
  "type": "contact-card",
  "fields": [
    {
      "title": "Contact Name",
      "email": "contact@example.com"
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
  "title": "Network",
  "type": "network-card",
  "items": [
    {
      "title": "Partner"
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
      "name": "Office",
      "x": 0,
      "y": 0
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
  "title": "Financials",
  "type": "financials",
  "fields": [
    {
      "label": "Revenue",
      "value": "$1M"
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
    - category: string

Example:
```json
{
  "title": "Events",
  "type": "event",
  "fields": [
    {
      "label": "Event",
      "value": "TBD"
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
  "title": "List",
  "type": "list",
  "items": [
    {
      "title": "Item 1"
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
  "title": "Chart",
  "type": "chart",
  "chartType": "bar",
  "chartData": {
    "labels": [
      "A"
    ],
    "datasets": [
      {
        "data": [
          1
        ]
      }
    ]
  }
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
      "value": "Product"
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
  "title": "Solutions",
  "type": "solutions",
  "fields": [
    {
      "title": "Solution",
      "description": "Description"
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
      "value": "Overview text"
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
  "title": "Quote",
  "type": "quotation",
  "fields": [
    {
      "value": "\"Quote text\""
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
  "title": "Reference",
  "type": "text-reference",
  "fields": [
    {
      "label": "Doc",
      "value": "Document"
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
      "title": "News Item"
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

## Type Aliases

The following aliases are supported for backward compatibility:

- `metrics` → `analytics`
- `stats` → `analytics`
- `timeline` → `event`
- `table` → `list`
- `locations` → `map`
- `quote` → `quotation`
- `reference` → `text-reference`
- `text-ref` → `text-reference`
- `brands` → `brand-colors`
- `colors` → `brand-colors`
- `project` → `info`

## Guidelines for LLM Card Generation

1. **Always use valid section types** from the list above
2. **Match data structure** - use `fields` or `items` based on section type
3. **Include required properties** - `title` and `type` are always required
4. **Use appropriate types** - analytics for metrics, list for items, etc.
5. **Validate JSON** - ensure output is valid JSON before returning

## Quick Reference

| Section Type | Data Structure | Best For |
|--------------|---------------|----------|
| `info` | fields | Company information |
| `analytics` | fields | Performance metrics |
| `contact-card` | fields | Team members |
| `network-card` | items | Org charts |
| `map` | fields | Office locations |
| `financials` | fields | Financial reports |
| `event` | items | Event calendars |
| `list` | items | Product lists |
| `chart` | fields | Data visualization |
| `product` | fields | Product catalogs |
| `solutions` | items | Service offerings |
| `overview` | fields | Executive summaries |
| `quotation` | fields | Testimonials |
| `text-reference` | fields | Articles |
| `brand-colors` | fields | Brand assets |
| `news` | items | News feeds |
| `social-media` | items | Social feeds |

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
