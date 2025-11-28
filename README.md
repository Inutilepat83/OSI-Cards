# OrangeSales Intelligence OSI Cards

**OrangeSales Intelligence OSI Cards** is a versatile card generator used by sales intelligence agents. It features structured formatting that can design cards for any form of business intelligence data. Built as a modern, token-driven Angular dashboard framework (supports Angular 18 and 20), OSI Cards transforms any dataset into a visually rich stack of interactive cards rendered within a responsive masonry grid. Built for flexibility, accessibility, and performance, OSI Cards empowers developers to compose diverse data experiences with minimal friction.

> **🤖 AI-Generated Cards:** All OSI Cards are **AI-generated** by Large Language Models (LLMs). Cards are never manually created - they are always produced by LLMs that understand the card structure, section types, and data schemas. See the [AI Card Generation](#ai-card-generation---how-llms-generate-cards) section for details on how LLMs generate cards.

Each card is composed of one or more **sections**—standalone, configurable components orchestrated by `AICardRendererComponent` ⟶ `SectionRendererComponent` ⟶ `MasonryGridComponent`. This architecture enables seamless combination of layouts, real-time streaming updates, and rich interactions.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Using OSI Cards in Your Project](#using-osi-cards-in-your-project)
3. [Core Architecture](#core-architecture)
4. [Section Types Catalog - Complete Reference](#section-types-catalog---complete-reference)
   - [Section Type Overview](#section-type-overview)
   - [Detailed Section Type Specifications](#detailed-section-type-specifications)
   - [Data Structure Schemes](#data-structure-schemes)
5. [AI Card Generation - How LLMs Generate Cards](#ai-card-generation---how-llms-generate-cards)
6. [Creating Cards: Complete Guide](#creating-cards-complete-guide)
7. [Design System & Tokens](#design-system--tokens)
8. [Advanced Features](#advanced-features)
9. [Development](#development)
10. [Appendix](#appendix)

---

## Quick Start

### Run the Development Server

```bash
npm start
# Navigate to http://localhost:4200
```

### Create Your First Card

Add a JSON card configuration to `src/assets/configs/companies/` or `src/assets/configs/contacts/`:

```json
{
  "cardTitle": "Your Company",
  "sections": [
    {
      "title": "Company Info",
      "type": "info",
      "fields": [
        { "label": "Industry", "value": "Technology" },
        { "label": "Employees", "value": "1000+" },
        { "label": "Founded", "value": "2020" }
      ]
    },
    {
      "title": "Key Metrics",
      "type": "analytics",
      "fields": [
        { "label": "Growth", "value": "85%", "percentage": 85 },
        { "label": "ROI", "value": "120%", "percentage": 120 }
      ]
    }
  ]
}
```

The card will automatically appear in the masonry grid on page load.

---

## Using OSI Cards in Your Project

OSI Cards can be imported and used as a library in other Angular projects.

> 📖 **For detailed integration instructions, see [README_INTEGRATION.md](./README_INTEGRATION.md)**

### Installation Options

#### Option 1: Install from npm (Recommended)

Install the library directly from npm:

```bash
npm install osi-cards-lib
```

The library supports both Angular 18 and Angular 20, which should resolve most peer dependency conflicts. If you still encounter issues, use:

```bash
npm install osi-cards-lib --legacy-peer-deps
```

**Package URL:** https://www.npmjs.com/package/osi-cards-lib

📖 **See [docs/PEER_DEPENDENCY_CONFLICTS.md](./docs/PEER_DEPENDENCY_CONFLICTS.md) for detailed conflict resolution guide.**

#### Option 2: Install from GitHub

Install the library directly from the GitHub repository:

```bash
npm install git+https://github.com/Inutilepat83/OSI-Cards.git
```

Or add to your `package.json`:

```json
{
  "dependencies": {
    "osi-cards-lib": "git+https://github.com/Inutilepat83/OSI-Cards.git#main"
  }
}
```

**Note:** When installing from git, you'll need to build the library first:

```bash
# After npm install, navigate to the installed package
cd node_modules/osi-cards-lib
npm install
npm run build:lib
```

Or install from a specific branch/tag:

```bash
npm install git+https://github.com/Inutilepat83/OSI-Cards.git#branch-name
npm install git+https://github.com/Inutilepat83/OSI-Cards.git#v1.0.0
```

#### Option 3: Install from Local Path

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Inutilepat83/OSI-Cards.git
   cd OSI-Cards
   ```

2. **Build the library:**
   ```bash
   npm install
   npm run build:lib
   ```

3. **Install in your project:**
   ```bash
   npm install /path/to/OSI-Cards/dist/osi-cards-lib
   ```

   Or add to your `package.json`:
   ```json
   {
     "dependencies": {
       "osi-cards-lib": "file:../OSI-Cards/dist/osi-cards-lib"
     }
   }
   ```

### Quick Integration

1. **Install peer dependencies:**
   ```bash
   npm install @angular/common@^20.0.0 @angular/core@^20.0.0 @angular/animations@^20.0.0 @angular/platform-browser@^20.0.0 lucide-angular@^0.548.0 rxjs@~7.8.0
   ```

2. **Import styles in your `src/styles.scss`:**
   ```scss
   @import 'osi-cards-lib/styles/_styles';
   ```

3. **Use components in your Angular component:**
   ```typescript
   import { Component } from '@angular/core';
   import { AICardRendererComponent, AICardConfig } from 'osi-cards-lib';
   
   @Component({
     selector: 'app-my-component',
     standalone: true,
     imports: [AICardRendererComponent],
     template: `
       <app-ai-card-renderer [cardConfig]="cardConfig"></app-ai-card-renderer>
     `
   })
   export class MyComponent {
     cardConfig: AICardConfig = {
       cardTitle: 'My Card',
       sections: [
         {
           title: 'Overview',
           type: 'info',
           fields: [
             { label: 'Name', value: 'Example' },
             { label: 'Status', value: 'Active' }
           ]
         }
       ]
     };
   }
   ```

### Full Documentation

- **[Quick Integration Guide](./README_INTEGRATION.md)** - Quick start guide for integrating OSI Cards
- **[Integration Guide](./docs/INTEGRATION_GUIDE.md)** - Complete integration documentation
- **[Integration Example](./docs/INTEGRATION_EXAMPLE.md)** - Working example project
- **[Integration Checklist](./docs/INTEGRATION_CHECKLIST.md)** - Step-by-step checklist

---

## Core Architecture

### Renderer Chain

1. **`AICardRendererComponent`**: Entry point that hydrates `CardSection` payloads and pipes them to the section renderer.
2. **`SectionRendererComponent`**: Smart router that resolves section types (`type` or title-based matching) and renders the appropriate standalone component. Exposes `fieldInteraction`, `itemInteraction`, and `actionInteraction` events.
3. **`MasonryGridComponent`**: Intelligent layout engine that:
   - Watches container width and calculates optimal column count (1–4)
   - Calculates `colSpan` per section using density heuristics
   - Handles streaming animations and real-time updates
   - Manages section appearance states and staggered animations

### Data Flow

```
JSON Config (assets/configs/*)
    ↓
JsonFileCardProvider (CardDataService)
    ↓
NgRx Cards Store (ensureCardIds + entity adapter)
    ↓
AICardRendererComponent (hydration)
    ↓
SectionRendererComponent (type resolution)
    ↓
Standalone Section Components (rendering)
    ↓
MasonryGridComponent (layout + animation)
```

### State Management

- **`CardDataService`** (`core/services/card-data/`): Manages providers (default: `JsonFileCardProvider`), caching via `shareReplay(1)`, and provider switching.
- **`CardState`** (`store/cards/`): NgRx entity adapter using `ensureCardIds` for deterministic IDs and `mergeCardPreservingValues()` to prevent placeholder overwrites during streaming.
- **Streaming Channel**: Direct `@Input` bypass for performance during LLM simulation; final state still persists to the store.

---

## Section Types Catalog - Complete Reference

OSI Cards includes **20+ pre-built section types**, each optimized for specific data patterns. **All cards are AI-generated** - the LLM uses this documentation to understand available section types and generate appropriate card structures. Mix and match section types freely to create diverse card layouts.

### Section Type Overview

| # | Section Type | Type Values | Component | Data Structure | Intent | Example Use |
|---|---|---|---|---|---|---|
| 1 | **Info** | `info` | `InfoSectionComponent` | `fields[]` | Metadata lists, key-value pairs, statuses | Company details, contact info, basic attributes |
| 2 | **Overview** | `overview` | `OverviewSectionComponent` | `fields[]` | KPI dashboards, metric highlights | Executive summaries, top-line metrics, key indicators |
| 3 | **Analytics** | `analytics`, `metrics`, `stats` | `AnalyticsSectionComponent` | `fields[]` | Spark lines, radial stats, trends | Performance metrics, growth rates, statistical data |
| 4 | **News** | `news` | `NewsSectionComponent` | `items[]` | News briefs, headlines, press releases | Press feeds, announcements, media coverage |
| 5 | **Social Media** | `social-media` | `SocialMediaSectionComponent` | `items[]` | Feed-style posts, engagement stats | Twitter streams, LinkedIn updates, social feeds |
| 6 | **Financials** | `financials` | `FinancialsSectionComponent` | `fields[]` | Revenue tables, P&L, currency trends | Quarterly reports, budgets, financial statements |
| 7 | **List / Table** | `list`, `table` | `ListSectionComponent` | `items[]` | Columnar data, sortable rows | Product inventories, employee rosters, data tables |
| 8 | **Event / Timeline** | `event`, `timeline` | `EventSectionComponent` | `items[]` | Chronological events, attendees, times | Calendars, project milestones, event schedules |
| 9 | **Product** | `product` | `ProductSectionComponent` | `fields[]` or `items[]` | Feature grids, benefits, CTA chips | Product portfolios, SaaS plans, feature lists |
| 10 | **Solutions** | `solutions` | `SolutionsSectionComponent` | `fields[]` | Use-cases, solution features, benefits | Service offerings, case studies, solution packages |
| 11 | **Contact Cards** | `contact-card` | `ContactCardSectionComponent` | `items[]` or `fields[]` | Personas, roles, email, phone, avatars | Team members, key contacts, stakeholder lists |
| 12 | **Network Cards** | `network-card` | `NetworkCardSectionComponent` | `fields[]` | Relationship graphs, influence metrics | Org charts, connection maps, network analysis |
| 13 | **Map / Locations** | `map`, `locations` | `MapSectionComponent` | `fields[]` | Embedded maps, pins, geodata | Office locations, store finder, geographic data |
| 14 | **Chart** | `chart` | `ChartSectionComponent` | `chartData` | Bar, line, pie, doughnut charts | Sales trends, demographic splits, data visualization |
| 15 | **Quotation** | `quotation`, `quote` | `QuotationSectionComponent` | `fields[]` | Testimonials, quoted metrics, highlights | Customer testimonials, price quotes, citations |
| 16 | **Text Reference** | `text-reference`, `reference`, `text-ref` | `TextReferenceSectionComponent` | `fields[]` or `items[]` | Long-form text, paragraphs, citations | Blog excerpts, research summaries, documentation |
| 17 | **Brand Colors** | `brand-colors`, `brands`, `colors` | `BrandColorsSectionComponent` | `fields[]` | Color swatches, hex/RGB, copy-to-clipboard | Brand assets, design systems, color palettes |
| 18 | **Fallback** | (any unmatched) | `FallbackSectionComponent` | `fields[]` or `items[]` | Generic placeholder for unknown types | Debug/development, fallback rendering |

### Detailed Section Type Specifications

#### 1. Info Section (`info`)
**Purpose:** Display key-value pairs and metadata in a structured list format.

**Data Structure:**
```json
{
  "title": "Company Information",
  "type": "info",
  "fields": [
    {
      "label": "Industry",
      "value": "Technology",
      "icon": "💼",
      "description": "Primary business sector"
    },
    {
      "label": "Employees",
      "value": "5000+",
      "status": "active"
    },
    {
      "label": "Founded",
      "value": "2010",
      "format": "text"
    }
  ]
}
```

**Field Properties:**
- `label` (string): Field label/name
- `value` (string | number): Field value
- `icon` (string, optional): Emoji or icon identifier
- `description` (string, optional): Additional context
- `status` (string, optional): Status badge (active, pending, completed, etc.)
- `format` (string, optional): Display format (currency, percentage, number, text)

**Use Cases:**
- Company profiles (industry, size, location)
- Contact information (email, phone, address)
- Product specifications (dimensions, weight, features)
- Configuration details (settings, preferences)

---

#### 2. Overview Section (`overview`)
**Purpose:** Display high-level KPIs and executive summary metrics.

**Data Structure:**
```json
{
  "title": "Key Metrics",
  "type": "overview",
  "fields": [
    {
      "label": "Annual Revenue",
      "value": "$500M",
      "format": "currency",
      "trend": "up",
      "change": 22,
      "percentage": 100
    },
    {
      "label": "Market Share",
      "value": "15%",
      "format": "percentage",
      "trend": "stable",
      "percentage": 15
    }
  ]
}
```

**Field Properties:**
- All `info` section properties, plus:
- `trend` (string, optional): `up`, `down`, `stable`, `neutral`
- `change` (number, optional): Change percentage or absolute value
- `percentage` (number, optional): Percentage value for visualization

**Use Cases:**
- Executive dashboards
- Business performance summaries
- Financial overviews
- Growth metrics

---

#### 3. Analytics Section (`analytics`, `metrics`, `stats`)
**Purpose:** Display statistical data with visual indicators (spark lines, radial charts, trends).

**Data Structure:**
```json
{
  "title": "Performance Analytics",
  "type": "analytics",
  "fields": [
    {
      "label": "Growth Rate",
      "value": "35%",
      "format": "percentage",
      "percentage": 35,
      "trend": "up",
      "change": 5,
      "performance": "excellent"
    },
    {
      "label": "Conversion Rate",
      "value": "12.5%",
      "format": "percentage",
      "percentage": 12.5,
      "trend": "up",
      "change": 2.3
    }
  ]
}
```

**Field Properties:**
- All `overview` section properties, plus:
- `performance` (string, optional): Performance level indicator

**Use Cases:**
- Performance dashboards
- Growth metrics
- Statistical analysis
- Trend visualization

---

#### 4. News Section (`news`)
**Purpose:** Display news articles, press releases, and announcements in a feed format.

**Data Structure:**
```json
{
  "title": "Latest News",
  "type": "news",
  "items": [
    {
      "title": "Company Announces New Product",
      "description": "Revolutionary AI-powered solution launches Q2 2025",
      "status": "active",
      "meta": {
        "source": "TechCrunch",
        "publishedAt": "2025-01-15",
        "author": "John Doe",
        "url": "https://example.com/news/1"
      }
    }
  ]
}
```

**Item Properties:**
- `title` (string, required): News headline
- `description` (string, optional): News summary/excerpt
- `status` (string, optional): Status badge
- `meta.source` (string, optional): News source/publication
- `meta.publishedAt` (string, optional): Publication date (ISO format)
- `meta.author` (string, optional): Article author
- `meta.url` (string, optional): Article URL

**Use Cases:**
- Press releases
- News feeds
- Announcements
- Media coverage

---

#### 5. Social Media Section (`social-media`)
**Purpose:** Display social media posts and engagement metrics.

**Data Structure:**
```json
{
  "title": "Social Media Activity",
  "type": "social-media",
  "items": [
    {
      "title": "Excited to announce our new feature!",
      "description": "Check out the latest updates to our platform...",
      "meta": {
        "platform": "Twitter",
        "author": "@company",
        "publishedAt": "2025-01-15T10:30:00Z",
        "likes": 1250,
        "comments": 89,
        "shares": 234,
        "avatar": "https://example.com/avatar.jpg"
      }
    }
  ]
}
```

**Item Properties:**
- All `news` item properties, plus:
- `meta.platform` (string, optional): Social platform (Twitter, LinkedIn, Facebook, etc.)
- `meta.likes` (number, optional): Like count
- `meta.comments` (number, optional): Comment count
- `meta.shares` (number, optional): Share count
- `meta.avatar` (string, optional): Profile avatar URL

**Use Cases:**
- Social media feeds
- Engagement tracking
- Brand monitoring
- Social analytics

---

#### 6. Financials Section (`financials`)
**Purpose:** Display financial data, revenue, expenses, and currency-formatted values.

**Data Structure:**
```json
{
  "title": "Financial Performance",
  "type": "financials",
  "fields": [
    {
      "label": "Q4 Revenue",
      "value": "$2.5M",
      "format": "currency",
      "trend": "up",
      "change": 18
    },
    {
      "label": "Operating Expenses",
      "value": "$1.2M",
      "format": "currency",
      "trend": "down",
      "change": -5
    }
  ]
}
```

**Field Properties:**
- All `info` section properties
- `format` should be `"currency"` for proper formatting
- `trend` and `change` for financial trends

**Use Cases:**
- Financial reports
- Budget tracking
- Revenue analysis
- Expense management

---

#### 7. List / Table Section (`list`, `table`)
**Purpose:** Display tabular data, lists, and structured item collections.

**Data Structure:**
```json
{
  "title": "Product Inventory",
  "type": "list",
  "items": [
    {
      "title": "Product A",
      "description": "High-performance solution",
      "value": "$99",
      "status": "active",
      "icon": "📦"
    },
    {
      "title": "Product B",
      "description": "Enterprise-grade platform",
      "value": "$299",
      "status": "active"
    }
  ]
}
```

**Item Properties:**
- `title` (string, required): Item name
- `description` (string, optional): Item description
- `value` (string | number, optional): Item value
- `status` (string, optional): Status badge
- `icon` (string, optional): Icon/emoji

**Use Cases:**
- Product catalogs
- Employee directories
- Inventory lists
- Data tables

---

#### 8. Event / Timeline Section (`event`, `timeline`)
**Purpose:** Display chronological events, schedules, and timeline data.

**Data Structure:**
```json
{
  "title": "Upcoming Events",
  "type": "event",
  "items": [
    {
      "title": "Product Launch",
      "description": "Q2 2025 - San Francisco",
      "status": "pending",
      "meta": {
        "date": "2025-04-15",
        "time": "10:00 AM",
        "location": "SF Convention Center",
        "attendees": 500
      }
    }
  ]
}
```

**Item Properties:**
- All `list` item properties, plus:
- `meta.date` (string, optional): Event date (ISO format)
- `meta.time` (string, optional): Event time
- `meta.location` (string, optional): Event location
- `meta.attendees` (number, optional): Expected attendance

**Use Cases:**
- Event calendars
- Project timelines
- Milestone tracking
- Schedule management

---

#### 9. Product Section (`product`)
**Purpose:** Display product features, benefits, and specifications.

**Data Structure:**
```json
{
  "title": "Product Features",
  "type": "product",
  "fields": [
    {
      "label": "Real-time Sync",
      "value": "Enabled",
      "description": "Instant data updates across all devices",
      "benefits": ["Fast", "Reliable", "Secure"]
    }
  ]
}
```

**Field Properties:**
- All `info` section properties, plus:
- `benefits` (string[], optional): Array of benefit descriptions

**Use Cases:**
- Product catalogs
- Feature lists
- Product comparisons
- SaaS offerings

---

#### 10. Solutions Section (`solutions`)
**Purpose:** Display solution packages, use cases, and service offerings.

**Data Structure:**
```json
{
  "title": "Solution Packages",
  "type": "solutions",
  "fields": [
    {
      "label": "Enterprise Solution",
      "value": "Custom",
      "description": "Tailored enterprise package",
      "benefits": ["Scalable", "Secure", "24/7 Support"],
      "outcomes": ["Increased efficiency", "Cost reduction", "Better ROI"]
    }
  ]
}
```

**Field Properties:**
- All `product` section properties, plus:
- `outcomes` (string[], optional): Expected outcomes/results

**Use Cases:**
- Service offerings
- Solution packages
- Case studies
- Consulting services

---

#### 11. Contact Cards Section (`contact-card`)
**Purpose:** Display contact information, team members, and stakeholder details.

**Data Structure:**
```json
{
  "title": "Key Contacts",
  "type": "contact-card",
  "items": [
    {
      "title": "John Smith",
      "description": "CEO & Founder",
      "meta": {
        "email": "john@example.com",
        "phone": "+1-555-0100",
        "role": "CEO",
        "avatar": "https://example.com/avatar.jpg"
      }
    }
  ]
}
```

**Item Properties:**
- All `list` item properties, plus:
- `meta.email` (string, optional): Email address
- `meta.phone` (string, optional): Phone number
- `meta.role` (string, optional): Job title/role
- `meta.avatar` (string, optional): Avatar image URL

**Use Cases:**
- Team directories
- Contact lists
- Stakeholder information
- Org charts

---

#### 12. Network Cards Section (`network-card`)
**Purpose:** Display relationship networks, connections, and influence metrics.

**Data Structure:**
```json
{
  "title": "Network Connections",
  "type": "network-card",
  "fields": [
    {
      "label": "John Doe",
      "value": "CEO",
      "connections": 150,
      "strength": 85,
      "description": "Key decision maker"
    }
  ]
}
```

**Field Properties:**
- All `info` section properties, plus:
- `connections` (number, optional): Number of connections
- `strength` (number, optional): Connection strength (0-100)

**Use Cases:**
- Relationship mapping
- Network analysis
- Influence tracking
- Connection graphs

---

#### 13. Map / Locations Section (`map`, `locations`)
**Purpose:** Display geographic data, locations, and map coordinates.

**Data Structure:**
```json
{
  "title": "Office Locations",
  "type": "map",
  "fields": [
    {
      "label": "Headquarters",
      "value": "San Francisco, CA",
      "address": "123 Market St, San Francisco, CA 94105",
      "coordinates": {
        "lat": 37.7749,
        "lng": -122.4194
      }
    }
  ]
}
```

**Field Properties:**
- All `info` section properties, plus:
- `address` (string, optional): Full address
- `coordinates.lat` (number, optional): Latitude
- `coordinates.lng` (number, optional): Longitude

**Use Cases:**
- Office locations
- Store finders
- Geographic data
- Location tracking

---

#### 14. Chart Section (`chart`)
**Purpose:** Display data visualizations (bar, line, pie, doughnut charts).

**Data Structure:**
```json
{
  "title": "Sales Trends",
  "type": "chart",
  "chartType": "bar",
  "chartData": {
    "labels": ["Q1", "Q2", "Q3", "Q4"],
    "datasets": [{
      "label": "Revenue",
      "data": [100, 150, 200, 250],
      "backgroundColor": "#FF7900",
      "borderColor": "#FF7900"
    }]
  }
}
```

**Properties:**
- `chartType` (string, required): `bar`, `line`, `pie`, `doughnut`
- `chartData.labels` (string[], optional): Chart labels
- `chartData.datasets` (array, required): Chart dataset(s)
  - `label` (string, optional): Dataset label
  - `data` (number[], required): Data values
  - `backgroundColor` (string | string[], optional): Background color(s)
  - `borderColor` (string | string[], optional): Border color(s)

**Use Cases:**
- Data visualization
- Trend analysis
- Statistical charts
- Performance dashboards

---

#### 15. Quotation Section (`quotation`, `quote`)
**Purpose:** Display testimonials, quotes, and highlighted citations.

**Data Structure:**
```json
{
  "title": "Customer Testimonials",
  "type": "quotation",
  "fields": [
    {
      "label": "John Doe, CEO",
      "value": "\"This product transformed our business operations.\"",
      "reference": {
        "company": "Acme Corp",
        "testimonial": "Full testimonial text...",
        "logo": "https://example.com/logo.jpg"
      }
    }
  ]
}
```

**Field Properties:**
- All `info` section properties, plus:
- `reference.company` (string, optional): Company name
- `reference.testimonial` (string, optional): Full testimonial text
- `reference.logo` (string, optional): Company logo URL

**Use Cases:**
- Customer testimonials
- Price quotes
- Citations
- Highlighted text

---

#### 16. Text Reference Section (`text-reference`, `reference`, `text-ref`)
**Purpose:** Display long-form text, paragraphs, and documentation excerpts.

**Data Structure:**
```json
{
  "title": "Research Summary",
  "type": "text-reference",
  "fields": [
    {
      "label": "Key Findings",
      "value": "Comprehensive research analysis reveals...",
      "description": "Full research document available at example.com"
    }
  ]
}
```

**Field Properties:**
- All `info` section properties
- Best for longer text content

**Use Cases:**
- Blog excerpts
- Research summaries
- Documentation
- Long-form content

---

#### 17. Brand Colors Section (`brand-colors`, `brands`, `colors`)
**Purpose:** Display color swatches, brand palettes, and design system colors.

**Data Structure:**
```json
{
  "title": "Brand Colors",
  "type": "brand-colors",
  "fields": [
    {
      "label": "Primary Orange",
      "value": "#FF7900",
      "valueColor": "#FF7900",
      "description": "Main brand color"
    }
  ]
}
```

**Field Properties:**
- All `info` section properties, plus:
- `valueColor` (string, optional): Color value for display

**Use Cases:**
- Brand assets
- Design systems
- Color palettes
- Style guides

---

### Data Structure Schemes

#### Card Configuration Schema
```typescript
interface AICardConfig {
  id?: string;                    // Auto-generated unique identifier
  cardTitle: string;              // Required: Main card title
  cardSubtitle?: string;          // Optional: Secondary title
  cardType?: string;              // Optional: Semantic type (company, contact, etc.)
  description?: string;           // Optional: Card-level description
  columns?: 1 | 2 | 3;            // Optional: Layout hint
  sections: CardSection[];        // Required: Array of sections
  actions?: CardAction[];         // Optional: CTA buttons
  meta?: Record<string, unknown>; // Optional: Arbitrary metadata
  processedAt?: number;          // Optional: Timestamp
}
```

#### Section Schema
```typescript
interface CardSection {
  id?: string;                    // Auto-generated unique identifier
  title: string;                  // Required: Section title
  type: SectionType;              // Required: Section type (see table above)
  description?: string;            // Optional: Section description
  fields?: CardField[];            // Optional: For field-based sections
  items?: CardItem[];             // Optional: For item-based sections
  chartType?: 'bar' | 'line' | 'pie' | 'doughnut'; // For chart sections
  chartData?: ChartData;          // For chart sections
  colSpan?: number;               // Optional: Column span (1-4)
  meta?: Record<string, unknown>; // Optional: Section metadata
}
```

#### Field Schema
```typescript
interface CardField {
  id?: string;
  label?: string;
  value?: string | number | boolean | null;
  icon?: string;
  format?: 'currency' | 'percentage' | 'number' | 'text';
  percentage?: number;
  change?: number;
  trend?: 'up' | 'down' | 'stable' | 'neutral';
  performance?: string;
  description?: string;
  status?: 'completed' | 'in-progress' | 'pending' | 'cancelled' | 'active' | 'inactive';
  priority?: 'high' | 'medium' | 'low';
  // Section-specific properties:
  address?: string;               // For map sections
  coordinates?: { lat: number; lng: number }; // For map sections
  email?: string;                 // For contact sections
  phone?: string;                 // For contact sections
  role?: string;                  // For contact/network sections
  avatar?: string;                // For contact sections
  connections?: number;           // For network sections
  strength?: number;              // For network sections
  benefits?: string[];            // For product/solution sections
  outcomes?: string[];            // For solution sections
  reference?: {                   // For quotation sections
    company: string;
    testimonial?: string;
    logo?: string;
  };
  contact?: {                     // For contact fields
    name: string;
    role: string;
    email?: string;
    phone?: string;
  };
  meta?: Record<string, unknown>;
}
```

#### Item Schema
```typescript
interface CardItem {
  id?: string;
  title: string;                  // Required: Item title
  description?: string;
  icon?: string;
  value?: string | number;
  status?: string;
  meta?: {
    source?: string;              // For news items
    platform?: string;            // For social media items
    publishedAt?: string;         // ISO date string
    author?: string;
    avatar?: string;
    email?: string;               // For contact items
    phone?: string;               // For contact items
    role?: string;                // For contact items
    date?: string;                // For event items
    time?: string;                // For event items
    location?: string;            // For event items
    attendees?: number;           // For event items
    likes?: number;               // For social media items
    comments?: number;             // For social media items
    shares?: number;              // For social media items
    url?: string;                 // For news items
    [key: string]: unknown;
  };
}
```

#### Action Schema
```typescript
interface CardAction {
  id?: string;
  label: string;                 // Required: Button text
  type: 'mail' | 'website' | 'agent' | 'question';
  icon?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  
  // For mail actions:
  email?: {
    contact: { name: string; email: string; role: string };
    subject: string;
    body: string;
    to?: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
  };
  
  // For website actions:
  url?: string;
  action?: string;                // Legacy: can contain URL
  
  // For agent actions:
  agentId?: string;
  agentContext?: Record<string, unknown>;
  
  // For question actions:
  question?: string;
  
  meta?: Record<string, unknown>;
}
```

---

## AI Card Generation - How LLMs Generate Cards

**Important:** All OSI Cards are **AI-generated**. Cards are never manually created - they are always produced by Large Language Models (LLMs) that understand the card structure, section types, and data schemas documented above.

### LLM Card Generation Process

#### 1. **Input to LLM**
The LLM receives context about:
- **Available section types** (info, analytics, contact-card, etc.)
- **Data structures** (CardField, CardItem, CardAction schemas)
- **Section-specific properties** (what fields/items each section type accepts)
- **Use case examples** (what each section type is best for)
- **Business context** (company data, contact information, events, products, etc.)

#### 2. **LLM Understanding**
The LLM uses this documentation to:
- **Select appropriate section types** based on the data being presented
- **Structure data correctly** using the proper schemas (fields vs items)
- **Apply section-specific properties** (trends for analytics, coordinates for maps, etc.)
- **Create logical card layouts** with multiple complementary sections
- **Generate valid JSON** that matches the AICardConfig interface

#### 3. **Card Generation Example**

**LLM Input:**
```
Generate a card for "Acme Corporation" - a technology company founded in 2010 
with 5000 employees, located in San Francisco. They have $500M annual revenue 
with 22% YoY growth. Key contacts: CEO John Smith (john@acme.com) and CFO Jane Doe (jane@acme.com).
```

**LLM Output (Generated Card):**
```json
{
  "cardTitle": "Acme Corporation",
  "cardType": "company",
  "cardSubtitle": "Technology Company",
  "sections": [
    {
      "title": "Company Information",
      "type": "info",
      "fields": [
        { "label": "Industry", "value": "Technology" },
        { "label": "Employees", "value": "5000+" },
        { "label": "Founded", "value": "2010" },
        { "label": "Location", "value": "San Francisco, CA" }
      ]
    },
    {
      "title": "Financial Performance",
      "type": "analytics",
      "fields": [
        { 
          "label": "Annual Revenue", 
          "value": "$500M", 
          "format": "currency",
          "trend": "up",
          "change": 22,
          "percentage": 100
        },
        {
          "label": "YoY Growth",
          "value": "22%",
          "format": "percentage",
          "trend": "up",
          "percentage": 22
        }
      ]
    },
    {
      "title": "Key Contacts",
      "type": "contact-card",
      "items": [
        {
          "title": "John Smith",
          "description": "CEO",
          "meta": {
            "email": "john@acme.com",
            "role": "CEO"
          }
        },
        {
          "title": "Jane Doe",
          "description": "CFO",
          "meta": {
            "email": "jane@acme.com",
            "role": "CFO"
          }
        }
      ]
    }
  ],
  "actions": [
    {
      "label": "Contact Sales",
      "type": "mail",
      "icon": "📧",
      "email": {
        "contact": { "name": "Sales Team", "email": "sales@acme.com", "role": "Sales" },
        "subject": "Inquiry about Acme Corporation",
        "body": "Hello, I'm interested in learning more about Acme Corporation."
      }
    }
  ]
}
```

#### 4. **LLM Prompt Structure**

When feeding information to an LLM for card generation, use this structure:

```markdown
You are an AI card generator for OSI Cards. Generate a valid JSON card configuration.

AVAILABLE SECTION TYPES:
- info: Key-value pairs, metadata (use fields[])
- analytics: Metrics with trends (use fields[] with trend, change, percentage)
- contact-card: Contact information (use items[] with meta.email, meta.phone, meta.role)
- map: Geographic locations (use fields[] with address, coordinates)
- financials: Financial data (use fields[] with format: "currency")
- list: Tabular data (use items[])
- event: Timeline events (use items[] with meta.date, meta.time, meta.location)
- product: Product features (use fields[] with benefits[])
- solutions: Solution packages (use fields[] with benefits[], outcomes[])
- chart: Data visualization (use chartType and chartData)
- news: News articles (use items[] with meta.source, meta.publishedAt)
- social-media: Social posts (use items[] with meta.platform, meta.likes, meta.comments)
- overview: Executive KPIs (use fields[] with trend, change, percentage)
- quotation: Testimonials (use fields[] with reference.company, reference.testimonial)
- text-reference: Long-form text (use fields[] or items[])
- brand-colors: Color swatches (use fields[] with valueColor)

DATA TO GENERATE CARD FOR:
[Insert business context, company data, contact info, events, products, etc.]

REQUIREMENTS:
1. Use appropriate section types based on the data
2. Structure data correctly (fields[] for field-based sections, items[] for item-based sections)
3. Include relevant properties (trends for analytics, coordinates for maps, etc.)
4. Create a logical card layout with multiple sections
5. Generate valid JSON matching AICardConfig schema
6. Include actions if appropriate (mail, website, agent, question)
```

#### 5. **Streaming Card Generation**

OSI Cards supports **real-time streaming** where the LLM generates sections progressively:

1. **Initial Card Structure**: LLM generates card title and first section
2. **Progressive Sections**: Additional sections stream in as they're generated
3. **Placeholder Handling**: Sections show "Streaming..." until real data arrives
4. **Final State**: Complete card with all sections rendered

This enables:
- **Live preview** of cards as they're generated
- **Progressive rendering** for better UX
- **Real-time updates** during LLM generation

#### 6. **Best Practices for LLM Card Generation**

✅ **DO:**
- Provide clear business context to the LLM
- Specify which section types to use for different data types
- Include examples of well-structured cards
- Validate generated JSON against schemas
- Use appropriate field/item structures for each section type
- Include relevant metadata (dates, sources, contacts, etc.)

❌ **DON'T:**
- Mix incompatible data structures (e.g., fields[] in a list section)
- Use wrong section types for data (e.g., map section without coordinates)
- Omit required properties (e.g., chartData for chart sections)
- Generate invalid JSON structures
- Create cards without proper section organization

---

### Quick Lookup by Use Case

**📊 Data Visualization**: Analytics, Chart, Financials, Overview  
**📝 Content**: News, Text Reference, Quotation, Solutions  
**👥 People**: Contact Cards, Network Cards, Social Media  
**🗺️ Geography**: Map, Locations  
**🛍️ Products**: Product, Solutions  
**⏰ Time-based**: Event, Timeline  
**🎨 Design**: Brand Colors  
**📋 Structured Data**: Info, List, Table

### Quick Lookup by Use Case

**📊 Data Visualization**: Analytics, Chart, Financials, Overview  
**📝 Content**: News, Text Reference, Quotation, Solutions  
**👥 People**: Contact Cards, Network Cards, Social Media  
**🗺️ Geography**: Map, Locations  
**🛍️ Products**: Product, Solutions  
**⏰ Time-based**: Event, Timeline  
**🎨 Design**: Brand Colors  
**📋 Structured Data**: Info, List, Table  

---

## Creating Cards: Complete Guide

### 1. Understand Card Structure

Every card follows this shape:

```typescript
interface AICardConfig {
  cardTitle: string;              // Required: card headline
  cardSubtitle?: string;          // Optional: secondary title
  cardType?: CardType;            // Optional: semantic type (company, contact, event, etc.)
  description?: string;           // Optional: card-level description
  sections: CardSection[];        // Required: array of sections
  actions?: CardAction[];         // Optional: CTA buttons
  columns?: number;               // Optional: layout hint (1-3)
  meta?: Record<string, unknown>; // Optional: arbitrary metadata
}
```

### 2. Add Sections

Sections are the building blocks. Each section represents a distinct data view:

```typescript
interface CardSection {
  title: string;                    // Required: section header
  type: 'info' | 'analytics' | ...  // Required: section renderer type
  description?: string;             // Optional: subtitle
  fields?: CardField[];             // Optional: key-value pairs
  items?: CardItem[];               // Optional: list entries
  colSpan?: number;                 // Optional: column span (1-4)
  meta?: Record<string, unknown>;   // Optional: metadata for section
}
```

**Choose `fields` or `items`:**
- **`fields`**: Best for definition lists (label-value pairs). Used by Info, Overview, Analytics, Financials.
- **`items`**: Best for lists/arrays. Used by List, Event, News, Social Media, Product.

### 3. Write JSON Syntax (Recommended)

JSON is the standard format for card configurations. Here's the anatomy:

```json
{
  "cardTitle": "Company Name",
  "cardSubtitle": "Optional tagline",
  "sections": [
    {
      "title": "Section 1 Title",
      "type": "info",
      "description": "Optional section description",
      "fields": [
        { "label": "Label A", "value": "Value A" },
        { "label": "Label B", "value": "Value B" },
        { "label": "Label C", "value": "Value C" },
        { "label": "Label D", "value": "Value D" }
      ]
    },
    {
      "title": "Section 2 Title",
      "type": "analytics",
      "fields": [
        { "label": "Growth Rate", "value": "85%", "percentage": 85, "trend": "up", "change": 12 },
        { "label": "Conversion", "value": "65%", "percentage": 65, "trend": "up", "change": 8 }
      ]
    },
    {
      "title": "Section 3 Title",
      "type": "list",
      "items": [
        { "title": "First Item", "description": "Description text", "status": "active" },
        { "title": "Second Item", "description": "More description", "status": "pending" }
      ]
    }
  ],
  "actions": [
    { "label": "Primary Button", "type": "primary", "icon": "🚀", "action": "https://example.com" },
    { "label": "Secondary Button", "type": "secondary", "icon": "📖", "action": "https://docs.example.com" }
  ]
}
```

### 4. Field Types & Properties

#### Common Field Properties

```typescript
interface CardField {
  id?: string;              // Unique identifier
  label?: string;           // Display label
  value?: string | number;  // Main value
  icon?: string;            // Icon/emoji
  format?: 'currency' | 'percentage' | 'number' | 'text';
  trend?: 'up' | 'down' | 'stable' | 'neutral';
  change?: number;          // Trend magnitude
  performance?: string;     // Performance level
  description?: string;     // Helper text
  status?: 'completed' | 'in-progress' | 'pending' | 'error';
  priority?: 'high' | 'medium' | 'low';
}
```

#### Example: Multi-Property Fields

```json
"fields": [
  { "label": "Revenue", "value": "$2.5M", "format": "currency", "trend": "up", "change": 18 },
  { "label": "Growth Rate", "value": "35%", "format": "percentage", "trend": "up", "change": 5 },
  { "label": "Churn Rate", "value": "2.1%", "format": "percentage", "trend": "down", "change": -0.3 }
]
```

### 5. Item Types & Properties

```typescript
interface CardItem {
  id?: string;              // Unique identifier
  title: string;            // Required: item name
  description?: string;     // Detail text
  value?: string | number;  // Numeric value
  status?: string;          // Status badge
  meta?: {
    source?: string;        // For news/social: publisher
    platform?: string;      // For social: Twitter, LinkedIn, etc.
    likes?: number;         // For social: engagement
    comments?: number;      // For social: engagement
    publishedAt?: string;   // ISO date
    avatar?: string;        // Avatar URL
    author?: string;        // Author name
  };
}
```

#### Example: News Items

```json
"items": [
  {
    "title": "Breaking News",
    "description": "Important announcement",
    "status": "active",
    "meta": {
      "source": "TechCrunch",
      "publishedAt": "2025-11-19"
    }
  },
  {
    "title": "Market Update",
    "description": "quarterly earnings",
    "status": "completed",
    "meta": {
      "source": "Reuters",
      "publishedAt": "2025-11-18"
    }
  }
]
```

### 6. Adding Actions (CTA Buttons)

Cards can include call-to-action buttons:

```typescript
interface CardAction {
  label: string;            // Button text
  type: 'primary' | 'secondary' | 'tertiary';
  icon?: string;            // Emoji or icon text
  action: string;           // URL, mailto:, or command
}
```

```json
"actions": [
  { "label": "Visit Website", "type": "primary", "icon": "🌐", "action": "https://example.com" },
  { "label": "Email Support", "type": "secondary", "icon": "📧", "action": "mailto:support@example.com" },
  { "label": "Download PDF", "type": "secondary", "icon": "📄", "action": "https://example.com/docs.pdf" }
]
```

### 7. Real-World Examples

#### Example 1: Company Overview Card

```json
{
  "cardTitle": "Acme Corporation",
  "cardType": "company",
  "cardSubtitle": "Enterprise Solutions",
  "sections": [
    {
      "title": "Company Info",
      "type": "info",
      "fields": [
        { "label": "Industry", "value": "Enterprise Software" },
        { "label": "Employees", "value": "5000+" },
        { "label": "Founded", "value": "2010" },
        { "label": "HQ", "value": "San Francisco, CA" }
      ]
    },
    {
      "title": "Financial Performance",
      "type": "analytics",
      "fields": [
        { "label": "Annual Revenue", "value": "$500M", "percentage": 100, "trend": "up" },
        { "label": "YoY Growth", "value": "22%", "percentage": 22, "trend": "up" },
        { "label": "Market Cap", "value": "$2.5B", "percentage": 100, "trend": "stable" }
      ]
    },
    {
      "title": "Leadership",
      "type": "contact-card",
      "items": [
        { "title": "John Smith", "role": "CEO", "email": "john@acme.com", "phone": "+1-555-0100" },
        { "title": "Jane Doe", "role": "CFO", "email": "jane@acme.com", "phone": "+1-555-0101" }
      ]
    }
  ],
  "actions": [
    { "label": "View Reports", "type": "primary", "icon": "📊", "action": "https://acme.com/reports" },
    { "label": "Contact Sales", "type": "secondary", "icon": "📞", "action": "mailto:sales@acme.com" }
  ]
}
```

#### Example 2: Product Card

```json
{
  "cardTitle": "CloudSync Pro",
  "cardType": "product",
  "cardSubtitle": "Real-time Data Synchronization",
  "sections": [
    {
      "title": "Features",
      "type": "product",
      "items": [
        { "title": "Real-time Sync", "description": "Instant data updates across all devices" },
        { "title": "End-to-End Encryption", "description": "Military-grade security" },
        { "title": "Auto-scaling", "description": "Handles millions of transactions" },
        { "title": "99.99% Uptime", "description": "Enterprise SLA guaranteed" }
      ]
    },
    {
      "title": "Pricing",
      "type": "financials",
      "fields": [
        { "label": "Starter Plan", "value": "$29/mo", "format": "currency" },
        { "label": "Pro Plan", "value": "$99/mo", "format": "currency" },
        { "label": "Enterprise", "value": "Custom", "format": "text" }
      ]
    }
  ],
  "actions": [
    { "label": "Start Free Trial", "type": "primary", "icon": "🚀", "action": "https://cloudsync.com/trial" },
    { "label": "View Pricing", "type": "secondary", "icon": "💰", "action": "https://cloudsync.com/pricing" }
  ]
}
```

#### Example 3: Event Card

```json
{
  "cardTitle": "Tech Conference 2025",
  "cardType": "event",
  "sections": [
    {
      "title": "Event Details",
      "type": "info",
      "fields": [
        { "label": "Date", "value": "June 15-17 2025" },
        { "label": "Location", "value": "San Francisco Convention Center" },
        { "label": "Attendees", "value": "5000+" },
        { "label": "Speakers", "value": "150+ international experts" }
      ]
    },
    {
      "title": "Schedule",
      "type": "event",
      "items": [
        { "title": "Opening Keynote", "description": "9:00 AM - Main Hall", "status": "active" },
        { "title": "Workshop Track", "description": "10:30 AM - Multiple venues", "status": "pending" },
        { "title": "Networking Dinner", "description": "6:00 PM - Rooftop", "status": "pending" }
      ]
    }
  ],
  "actions": [
    { "label": "Register Now", "type": "primary", "icon": "🎫", "action": "https://techconf.com/register" },
    { "label": "View Agenda", "type": "secondary", "icon": "📋", "action": "https://techconf.com/agenda" }
  ]
}
```

### 8. Best Practices for Diverse Cards

✅ **DO:**
- **Mix section types** to create rich experiences (Info + Analytics + List)
- **Use descriptive titles** that are scannable and clear
- **Leverage metadata** for tracking, source attribution, timestamps
- **Provide context** with descriptions and subtitles
- **Include actions** to drive user engagement
- **Test responsive** layouts on mobile, tablet, desktop
- **Use appropriate formats** (currency, percentage) for clarity
- **Group related data** in logical sections
- **Support accessibility** with semantic HTML and labels

❌ **DON'T:**
- Cram too much data into one section (use multiple sections instead)
- Mix incompatible section types (e.g., `chart` + `contact-card`)
- Overuse placeholders; provide real data when possible
- Force specific column spans; let the grid decide
- Use raw pixel values in custom styles; use CSS variables
- Ignore mobile breakpoints; test all card sizes

---

## Design System & Tokens

### CSS Custom Variables

Every card and section respects centralized design tokens defined in `src/styles/core/_variables.scss`:

```scss
// Typography
--card-title-font-size: clamp(1.3rem, 1.15rem + 0.4vw, 1.6rem);
--card-value-font-size: clamp(0.93rem, 0.88rem + 0.2vw, 1rem);
--card-label-font-size: 0.65rem;
--card-meta-font-size: 0.58rem;

// Spacing
--card-padding: 1.25rem;
--card-gap: 0.75rem;
--section-card-gap: 0.75rem;

// Colors
--color-brand: #FF7900;
--card-text-primary: #FFFFFF;
--card-text-secondary: #B8C5D6;
--card-background: rgba(20, 30, 50, 0.4);

// Borders & Radius
--card-border-radius: 12px;
--card-border: 1px solid rgba(255, 255, 255, 0.1);

// Shadows
--card-box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
--card-box-shadow-hover: 0 8px 32px rgba(0, 0, 0, 0.4);

// Animation
--card-transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
```

### Using Tokens in Custom Sections

When creating custom sections, always use tokens:

```scss
// ✅ Good: Use tokens
.my-section {
  padding: var(--card-padding);
  color: var(--card-text-primary);
  font-size: var(--card-value-font-size);
  transition: var(--card-transition);
}

// ❌ Bad: Hardcode values
.my-section {
  padding: 20px;
  color: white;
  font-size: 16px;
  transition: all 0.3s ease;
}
```

### Mixins & Patterns

Reusable mixins for consistent styling:

```scss
@include card;                           // Base card styling (border, shadow, padding)
@include section-grid;                  // Responsive grid layout
@include label-text;                    // Field label styling with color-mix
@include value-text;                    // Field value styling
@include card-title-text;               // Card title styling
@include section-responsive-grid;       // Mobile-adaptive grid
```

---

## Advanced Features

### Progressive Rendering & LLM Streaming

OSI Cards supports real-time card generation where sections appear as they stream in:

```typescript
// LLM simulation detects section completion automatically
// Placeholders show "Streaming…" until real data arrives
// Batched updates every 300ms prevent layout thrashing
```

**Enable debug logging** in `HomePageComponent`:
```typescript
ENABLE_SECTION_STATE_LOGGING = true;      // Track completion status
ENABLE_POSITION_LOGGING = true;           // Track layout calculations
```

### Custom Providers

Switch data sources on-the-fly:

```typescript
// Default: JsonFileCardProvider (assets/configs/*)
cardDataService.switchProvider(new WebsocketCardProvider());
cardDataService.switchProvider(new ApiCardProvider(http));
```

### Interaction Events

Capture user interactions at the card level:

```typescript
// Component receives emit events from SectionRendererComponent
onSectionEvent(event: SectionRenderEvent) {
  const { type, section, field, item, action, metadata } = event;
  
  if (type === 'field') {
    console.log('Field clicked:', field.label, metadata.sectionTitle);
  } else if (type === 'item') {
    console.log('Item selected:', item.title);
  } else if (type === 'action') {
    console.log('Action triggered:', action.label);
  }
}
```

---

## Development

### Setup

```bash
# Install dependencies
npm install

# Start dev server
npm start

# Run tests
npm test

# Lint + fix SCSS/TS
npm run lint:fix

# Build production
npm run build

# Run E2E tests
npm run e2e

# Check bundle size
node scripts/size-check.js
```

### Adding a New Section Type

1. **Create component** in `src/app/shared/components/cards/sections/<your-section>/`:
   ```typescript
   @Component({
     selector: 'app-your-section',
     standalone: true,
     imports: [CommonModule, LucideIconsModule],
     templateUrl: './your-section.component.html',
     changeDetection: ChangeDetectionStrategy.OnPush
   })
   export class YourSectionComponent extends BaseSectionComponent<CardField> {
     // Implement custom logic
   }
   ```

2. **Add SCSS** in `src/styles/components/sections/_your-section.scss`:
   ```scss
   .your-section {
     @include card;
     @include section-grid;
     // Custom styles using tokens
   }
   ```

3. **Register with renderer** in `SectionRendererComponent`:
   ```typescript
   imports: [
     // ... existing imports
     YourSectionComponent
   ]
   
   // In template:
   // <app-your-section *ngSwitchCase="'your-type'" ...></app-your-section>
   ```

4. **Update model** in `src/app/models/card.model.ts`:
   ```typescript
   type: 'existing' | 'your-type' | ...
   ```

5. **Test & validate**:
   ```bash
   npm run lint:fix
   npm run test
   npm run build
   ```

---

## Appendix

### Project Structure

```
src/
├── app/
│   ├── shared/components/cards/
│   │   ├── sections/
│   │   │   ├── info-section/
│   │   │   ├── analytics-section/
│   │   │   ├── brand-colors-section/
│   │   │   └── ... (20+ more)
│   │   ├── section-renderer/
│   │   └── ai-card-renderer/
│   ├── store/cards/
│   ├── core/services/card-data/
│   └── models/card.model.ts
├── assets/configs/
│   ├── companies/
│   ├── contacts/
│   ├── events/
│   └── ... (more categories)
└── styles/
    ├── core/
    │   ├── _variables.scss
    │   ├── _mixins.scss
    │   └── _sections-base.scss
    └── components/sections/
        ├── _info.scss
        ├── _analytics.scss
        └── ... (20+ more)
```

### Key Services

| Service | Location | Purpose |
|---------|----------|---------|
| `CardDataService` | `core/services/card-data/` | Provider management, card fetching, caching |
| `PerformanceService` | `core/services/performance/` | Web Vitals tracking, memory monitoring |
| `CardUtils` | `core/utils/` | ID generation, card merging, diffing |
| `MasonryGridComponent` | `shared/components/` | Layout engine, column calculation, animations |

### Resources

- **Architecture**: See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for architectural details
- **Developer Guide**: See [docs/DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md) for development guidelines
- **Examples**: See [docs/EXAMPLES.md](./docs/EXAMPLES.md) for code examples
- **Integration**: See [README_INTEGRATION.md](./README_INTEGRATION.md) for integration guide
- **Accessibility**: See [docs/ACCESSIBILITY_GUIDE.md](./docs/ACCESSIBILITY_GUIDE.md) for accessibility features and best practices
- **Security**: See [docs/SECURITY_BEST_PRACTICES.md](./docs/SECURITY_BEST_PRACTICES.md) for security guidelines
- **Performance**: See [docs/BUNDLE_OPTIMIZATION.md](./docs/BUNDLE_OPTIMIZATION.md) for bundle optimization strategies
- **Testing**: See [docs/TEST_COVERAGE_IMPROVEMENTS.md](./docs/TEST_COVERAGE_IMPROVEMENTS.md) for test coverage information
- **Improvement Plan**: See [docs/IMPROVEMENT_PLAN.md](./docs/IMPROVEMENT_PLAN.md) for the comprehensive 30-point improvement roadmap

### FAQ

**Q: Can I mix different section types on one card?**  
A: Yes! That's the core strength. Mix info + analytics + list + contact-card on the same card.

**Q: What's the maximum card size?**  
A: Cards can span 1–4 columns depending on container width. The grid auto-calculates based on content density.

**Q: How do I add custom styling?**  
A: Use `src/styles/components/sections/_your-section.scss` and import CSS variables from `_variables.scss`.

**Q: Can I use the same card in multiple views?**  
A: Yes. Cards are provider-agnostic. Load from files, APIs, WebSocket, or anywhere.

**Q: How do I track user interactions?**  
A: Listen to `SectionRenderEvent` emitted from `SectionRendererComponent`. Events include section, field, item, action, and metadata.

**Q: Does OSI Cards work offline?**  
A: Yes. The default `JsonFileCardProvider` loads static files. The app works entirely offline when using static configs.

---

**Questions or contributions?** See [docs/DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md) for development guidelines and best practices.

### Quick Examples

For practical, copy-paste ready examples, see [docs/QUICK_EXAMPLES.md](./docs/QUICK_EXAMPLES.md).

### Performance Optimization

For performance best practices and optimization strategies, see [docs/PERFORMANCE_GUIDE.md](./docs/PERFORMANCE_GUIDE.md).

### Migration Guides

- [Migration Guide v2.0](./docs/MIGRATION_V2.md) - Migrating from v1.x to v2.0
