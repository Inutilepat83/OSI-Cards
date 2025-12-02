# Section Components - Complete List

> **Auto-Generated**: This file is generated from section modules.
> Last updated: 2025-12-02T12:49:57.433Z

Total sections: **22**

---

## Table of Contents

- [Analytics Section](#analytics)
- [Brand Colors Section](#brand-colors)
- [Chart Section](#chart)
- [Contact Card Section](#contact-card)
- [Event Section](#event)
- [Fallback Section](#fallback)
- [FAQ Section](#faq)
- [Financials Section](#financials)
- [Gallery Section](#gallery)
- [Info Section](#info)
- [List Section](#list)
- [Map Section](#map)
- [Network Card Section](#network-card)
- [News Section](#news)
- [Overview Section](#overview)
- [Product Section](#product)
- [Quotation Section](#quotation)
- [Social Media Section](#social-media)
- [Solutions Section](#solutions)
- [Text Reference Section](#text-reference)
- [Timeline Section](#timeline)
- [Video Section](#video)

---

## Analytics Section

**Type**: `analytics`
**Selector**: `lib-analytics-section`
**Component**: `AnalyticsSectionComponent`

Displays metrics with visual indicators, trends, and percentages. Perfect for KPIs, performance metrics, and statistical data.

### Use Cases

- Performance metrics
- KPIs and dashboards
- Growth statistics
- Sales analytics
- Customer health scores

### Best Practices

- Include percentage values for better visualization
- Use trend indicators (up/down/stable)
- Show change values when available
- Group related metrics together
- Use performance ratings for quick assessment

### Rendering

- Uses fields: ✅
- Uses items: ❌
- Default columns: 2
- Supports collapse: ✅

### Example

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

---

## Brand Colors Section

**Type**: `brand-colors`
**Selector**: `lib-brand-colors-section`
**Component**: `BrandColorsSectionComponent`

Displays color swatches, brand palettes, and design system colors.

### Use Cases

- Brand assets
- Design systems
- Color palettes
- Style guides
- Brand identity

### Best Practices

- Include hex/RGB values
- Show color names
- Group by category
- Enable copy-to-clipboard
- Show usage guidelines

### Rendering

- Uses fields: ✅
- Uses items: ❌
- Default columns: 2
- Supports collapse: ✅

### Example

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

---

## Chart Section

**Type**: `chart`
**Selector**: `lib-chart-section`
**Component**: `ChartSectionComponent`

Displays data visualizations including bar charts, line charts, pie charts, and more.

### Use Cases

- Data visualization
- Analytics dashboards
- Statistical reports
- Trend analysis
- Performance tracking

### Best Practices

- Provide proper chart configuration
- Include chart type specification
- Use appropriate data formats
- Ensure accessibility with labels
- Choose chart type based on data

### Rendering

- Uses fields: ❌
- Uses items: ❌
- Default columns: 2
- Supports collapse: ❌

### Example

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

---

## Contact Card Section

**Type**: `contact-card`
**Selector**: `lib-contact-card-section`
**Component**: `ContactCardSectionComponent`

Displays person information with avatars, roles, contact details, and social links.

### Use Cases

- Team members
- Key contacts
- Leadership profiles
- Stakeholder directory
- Sales contacts

### Best Practices

- Include name, role, and contact info
- Add avatar images when available
- Include social media links
- Group by department or role
- Show location for distributed teams

### Rendering

- Uses fields: ✅
- Uses items: ❌
- Default columns: 2
- Supports collapse: ✅

### Example

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

---

## Event Section

**Type**: `event`
**Selector**: `lib-event-section`
**Component**: `EventSectionComponent`

Displays chronological events, timelines, schedules, and calendar information.

### Use Cases

- Event calendars
- Project timelines
- Schedules
- Milestones
- Upcoming activities

### Best Practices

- Include dates and times
- Add location information
- Use status for event state
- Chronological ordering
- Group by category or date

### Rendering

- Uses fields: ✅
- Uses items: ✅
- Default columns: 1
- Supports collapse: ✅

### Example

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

---

## Fallback Section

**Type**: `fallback`
**Selector**: `lib-fallback-section`
**Component**: `FallbackSectionComponent`

Default section renderer for unknown or unsupported section types.

### Use Cases

- Unknown types
- Error handling
- Graceful degradation

### Best Practices

- Display section data in readable format
- Show section type for debugging
- Provide helpful error messages

### Rendering

- Uses fields: ✅
- Uses items: ✅
- Default columns: 1
- Supports collapse: ✅

### Example

```json
{
  "title": "Fallback",
  "type": "fallback"
}
```

---

## FAQ Section

**Type**: `faq`
**Selector**: `lib-faq-section`
**Component**: `FaqSectionComponent`

Displays frequently asked questions with expandable answers.

### Use Cases

- Help content
- Support documentation
- Product FAQs
- Onboarding guides
- Knowledge base

### Best Practices

- Keep questions clear and concise
- Provide comprehensive answers
- Group by category
- Order by frequency
- Include links for more info

### Rendering

- Uses fields: ❌
- Uses items: ✅
- Default columns: 1
- Supports collapse: ✅

### Example

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

---

## Financials Section

**Type**: `financials`
**Selector**: `lib-financials-section`
**Component**: `FinancialsSectionComponent`

Displays financial data including revenue, expenses, P&L statements, and currency information.

### Use Cases

- Financial reports
- Quarterly earnings
- Budget information
- Revenue tracking
- Investment summaries

### Best Practices

- Use currency formatting
- Include time periods
- Show trends and changes
- Group by category
- Highlight key metrics

### Rendering

- Uses fields: ✅
- Uses items: ❌
- Default columns: 2
- Supports collapse: ✅

### Example

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

---

## Gallery Section

**Type**: `gallery`
**Selector**: `lib-gallery-section`
**Component**: `GallerySectionComponent`

Displays image galleries, photo collections, and visual media.

### Use Cases

- Photo galleries
- Product images
- Team photos
- Office tours
- Event coverage

### Best Practices

- Include image URLs
- Add captions/alt text
- Optimize image sizes
- Use consistent aspect ratios
- Group related images

### Rendering

- Uses fields: ❌
- Uses items: ✅
- Default columns: 2
- Supports collapse: ✅

### Example

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

---

## Info Section

**Type**: `info`
**Selector**: `lib-info-section`
**Component**: `InfoSectionComponent`

Displays key-value pairs in a clean, scannable format. Ideal for metadata, contact information, and general data display.

### Use Cases

- Company information
- Contact details
- Metadata display
- Key-value pairs
- Profile summaries

### Best Practices

- Use for structured data with clear labels and values
- Keep labels concise and descriptive
- Use trend indicators for dynamic data
- Group related fields together
- Use icons to enhance visual hierarchy

### Rendering

- Uses fields: ✅
- Uses items: ❌
- Default columns: 1
- Supports collapse: ✅

### Example

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

---

## List Section

**Type**: `list`
**Selector**: `lib-list-section`
**Component**: `ListSectionComponent`

Displays structured lists and tables. Supports sorting, filtering, and item interactions.

### Use Cases

- Product lists
- Feature lists
- Task lists
- Inventory
- Requirements

### Best Practices

- Use items array for list data
- Include titles and descriptions
- Add status badges when relevant
- Keep list items scannable
- Use icons for visual hierarchy

### Rendering

- Uses fields: ❌
- Uses items: ✅
- Default columns: 1
- Supports collapse: ✅

### Example

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

---

## Map Section

**Type**: `map`
**Selector**: `lib-map-section`
**Component**: `MapSectionComponent`

Displays geographic data with embedded maps, pins, and location information.

### Use Cases

- Office locations
- Store finder
- Geographic data
- Location tracking
- Service coverage

### Best Practices

- Include coordinates or addresses
- Use proper location formats
- Add location metadata
- Ensure map accessibility
- Show location types visually

### Rendering

- Uses fields: ✅
- Uses items: ❌
- Default columns: 1
- Supports collapse: ❌

### Example

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

---

## Network Card Section

**Type**: `network-card`
**Selector**: `lib-network-card-section`
**Component**: `NetworkCardSectionComponent`

Displays relationship graphs, network connections, and influence metrics.

### Use Cases

- Org charts
- Relationship maps
- Network analysis
- Partnership visualization
- Stakeholder mapping

### Best Practices

- Show relationships clearly
- Include connection types
- Add influence metrics
- Use visual hierarchy
- Show connection strength

### Rendering

- Uses fields: ❌
- Uses items: ✅
- Default columns: 1
- Supports collapse: ✅

### Example

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

---

## News Section

**Type**: `news`
**Selector**: `lib-news-section`
**Component**: `NewsSectionComponent`

Displays news articles, headlines, and press releases. Supports source attribution and publication dates.

### Use Cases

- News feeds
- Press releases
- Announcements
- Industry updates
- Company news

### Best Practices

- Include source and publication date in meta
- Keep headlines concise
- Use descriptions for summaries
- Include status for article state
- Order chronologically

### Rendering

- Uses fields: ❌
- Uses items: ✅
- Default columns: 1
- Supports collapse: ✅

### Example

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

---

## Overview Section

**Type**: `overview`
**Selector**: `lib-overview-section`
**Component**: `OverviewSectionComponent`

Displays high-level summaries, executive dashboards, and key highlights.

### Use Cases

- Executive summaries
- Dashboard overviews
- Key highlights
- Quick insights
- Company profiles

### Best Practices

- Keep content high-level
- Focus on key metrics
- Use visual indicators
- Limit to essential information
- Use as entry point to details

### Rendering

- Uses fields: ✅
- Uses items: ❌
- Default columns: 1
- Supports collapse: ❌

### Example

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

---

## Product Section

**Type**: `product`
**Selector**: `lib-product-section`
**Component**: `ProductSectionComponent`

Displays product information, features, benefits, and pricing.

### Use Cases

- Product catalogs
- Feature lists
- Product comparisons
- Specifications
- Service offerings

### Best Practices

- Highlight key features
- Include pricing when relevant
- Use descriptions for details
- Add status for availability
- Show version information

### Rendering

- Uses fields: ✅
- Uses items: ❌
- Default columns: 1
- Supports collapse: ✅

### Example

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

---

## Quotation Section

**Type**: `quotation`
**Selector**: `lib-quotation-section`
**Component**: `QuotationSectionComponent`

Displays quotes, testimonials, highlighted text, and citations.

### Use Cases

- Testimonials
- Customer quotes
- Citations
- Highlighted content
- Expert opinions

### Best Practices

- Include source attribution
- Add author information
- Use for emphasis
- Include dates when relevant
- Show company/role context

### Rendering

- Uses fields: ✅
- Uses items: ❌
- Default columns: 1
- Supports collapse: ✅

### Example

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

---

## Social Media Section

**Type**: `social-media`
**Selector**: `lib-social-media-section`
**Component**: `SocialMediaSectionComponent`

Displays social media posts, engagement metrics, and social feed content.

### Use Cases

- Social profiles
- Social feeds
- Engagement tracking
- Social monitoring
- Content aggregation

### Best Practices

- Include platform information
- Show engagement metrics
- Add timestamps
- Include profile links
- Show follower counts

### Rendering

- Uses fields: ✅
- Uses items: ✅
- Default columns: 1
- Supports collapse: ✅

### Example

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

---

## Solutions Section

**Type**: `solutions`
**Selector**: `lib-solutions-section`
**Component**: `SolutionsSectionComponent`

Displays solution offerings, use cases, features, and benefits.

### Use Cases

- Service offerings
- Solution portfolios
- Use cases
- Case studies
- Professional services

### Best Practices

- Highlight key benefits
- Include use cases
- Add feature lists
- Show outcomes when available
- Include delivery timeframes

### Rendering

- Uses fields: ✅
- Uses items: ✅
- Default columns: 1
- Supports collapse: ✅

### Example

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

---

## Text Reference Section

**Type**: `text-reference`
**Selector**: `lib-text-reference-section`
**Component**: `TextReferenceSectionComponent`

Displays long-form text, paragraphs, articles, and reference content.

### Use Cases

- Articles
- Documentation links
- Research summaries
- Reference materials
- Resource libraries

### Best Practices

- Break into readable chunks
- Use proper formatting
- Include citations
- Add metadata for context
- Provide action links

### Rendering

- Uses fields: ✅
- Uses items: ❌
- Default columns: 1
- Supports collapse: ✅

### Example

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

---

## Timeline Section

**Type**: `timeline`
**Selector**: `lib-timeline-section`
**Component**: `TimelineSectionComponent`

Displays chronological sequences of events, milestones, and historical data.

### Use Cases

- Company history
- Project milestones
- Career history
- Product evolution
- Historical events

### Best Practices

- Order chronologically
- Include dates clearly
- Use consistent formatting
- Highlight key milestones
- Keep descriptions concise

### Rendering

- Uses fields: ❌
- Uses items: ✅
- Default columns: 1
- Supports collapse: ✅

### Example

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

---

## Video Section

**Type**: `video`
**Selector**: `lib-video-section`
**Component**: `VideoSectionComponent`

Displays video content with thumbnails, durations, and playback controls.

### Use Cases

- Product demos
- Training videos
- Webinar recordings
- Customer testimonials
- Tutorial content

### Best Practices

- Include video thumbnails
- Show duration information
- Add descriptive titles
- Provide video URLs
- Group by category

### Rendering

- Uses fields: ❌
- Uses items: ✅
- Default columns: 2
- Supports collapse: ✅

### Example

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

---
