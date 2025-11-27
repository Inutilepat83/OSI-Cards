# OSI Cards

**OSI Cards** is a modern, token-driven Angular dashboard framework (supports Angular 18 and 20) that transforms any dataset into a visually rich stack of interactive cards rendered within a responsive masonry grid. Built for flexibility, accessibility, and performance, OSI Cards empowers developers to compose diverse data experiences with minimal friction.

Each card is composed of one or more **sections**—standalone, configurable components orchestrated by `AICardRendererComponent` ⟶ `SectionRendererComponent` ⟶ `MasonryGridComponent`. This architecture enables seamless combination of layouts, real-time streaming updates, and rich interactions.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Using OSI Cards in Your Project](#using-osi-cards-in-your-project)
3. [Core Architecture](#core-architecture)
4. [Section Types Catalog](#section-types-catalog---all-20-components)
5. [Creating Cards: Complete Guide](#creating-cards-complete-guide)
6. [Design System & Tokens](#design-system--tokens)
7. [Advanced Features](#advanced-features)
8. [Development](#development)
9. [Appendix](#appendix)

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

## Section Types Catalog - All 20+ Components

OSI Cards includes **20+ pre-built section types**, each optimized for specific data patterns. Mix and match them freely to create diverse card layouts.

| # | Section Type | Type Values | Component | Intent | Example Use |
|---|---|---|---|---|---|
| 1 | **Info** | `info` | `InfoSectionComponent` | Metadata lists, key-value pairs, statuses | Company details, contact info |
| 2 | **Overview** | `overview` | `OverviewSectionComponent` | KPI dashboards, metric highlights | Executive summaries, top-line metrics |
| 3 | **Analytics** | `analytics`, `metrics`, `stats` | `AnalyticsSectionComponent` | Spark lines, radial stats, trends | Performance metrics, growth rates |
| 4 | **News** | `news` | `NewsSectionComponent` | News briefs, headlines, press releases | Press feeds, announcements |
| 5 | **Social Media** | `social-media` | `SocialMediaSectionComponent` | Feed-style posts, engagement stats | Twitter streams, LinkedIn updates |
| 6 | **Financials** | `financials` | `FinancialsSectionComponent` | Revenue tables, P&L, currency trends | Quarterly reports, budgets |
| 7 | **List / Table** | `list`, `table` | `ListSectionComponent` | Columnar data, sortable rows | Product inventories, employee rosters |
| 8 | **Event / Timeline** | `event`, `timeline` | `EventSectionComponent` | Chronological events, attendees, times | Calendars, project milestones |
| 9 | **Product** | `product` | `ProductSectionComponent` | Feature grids, benefits, CTA chips | Product portfolios, SaaS plans |
| 10 | **Solutions** | `solutions` | `SolutionsSectionComponent` | Use-cases, solution features, benefits | Service offerings, case studies |
| 11 | **Contact Cards** | `contact-card` | `ContactCardSectionComponent` | Personas, roles, email, phone, avatars | Team members, key contacts |
| 12 | **Network Cards** | `network-card` | `NetworkCardSectionComponent` | Relationship graphs, influence metrics | Org charts, connection maps |
| 13 | **Map / Locations** | `map`, `locations` | `MapSectionComponent` | Embedded maps, pins, geodata | Office locations, store finder |
| 14 | **Chart** | `chart` | `ChartSectionComponent` | Bar, line, pie, doughnut charts | Sales trends, demographic splits |
| 15 | **Quotation** | `quotation`, `quote` | `QuotationSectionComponent` | Testimonials, quoted metrics, highlights | Customer testimonials, price quotes |
| 16 | **Text Reference** | `text-reference`, `reference`, `text-ref` | `TextReferenceSectionComponent` | Long-form text, paragraphs, citations | Blog excerpts, research summaries |
| 17 | **Brand Colors** | `brand-colors`, `brands`, `colors` | `BrandColorsSectionComponent` | Color swatches, hex/RGB, copy-to-clipboard | Brand assets, design systems |
| 18 | **Fallback** | (any unmatched) | `FallbackSectionComponent` | Generic placeholder for unknown types | Debug/development |

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
