# OrangeSales Intelligence OSI Cards

**OSI Cards - Versatile card generator for sales intelligence agents**

[![npm version](https://badge.fury.io/js/osi-cards-lib.svg)](https://www.npmjs.com/package/osi-cards-lib)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Built as a modern, token-driven Angular dashboard framework (supports Angular 18 and 20), OSI Cards transforms any dataset into a visually rich stack of interactive cards rendered within a responsive masonry grid. Built for flexibility, accessibility, and performance, OSI Cards empowers developers to compose diverse data experiences with minimal friction.

> **🤖 AI-Generated Cards:** All OSI Cards are **AI-generated** by Large Language Models (LLMs). Cards are never manually created - they are always produced by LLMs that understand the card structure, section types, and data schemas.

Each card is composed of one or more **sections**—standalone, configurable components orchestrated by `AICardRendererComponent` ⟶ `SectionRendererComponent` ⟶ `MasonryGridComponent`. This architecture enables seamless combination of layouts, real-time streaming updates, and rich interactions.

---

## ✨ What's New in v1.5.51

### 🎉 MAJOR: Complete Architecture Optimization
- **Massive Cleanup**: Removed ~700+ files (28% of project) while maintaining all core functionality
- **Library Utilities**: 143 → 22 files (-85%)
- **App Utilities**: 50 → 10 files (-80%)
- **Scripts**: 88 → 27 files (-69%)
- **Documentation**: 262 → ~80 files (-70%)
- **Services**: Consolidated and removed 20+ redundant services
- **Bundle Size**: Estimated 40-50% reduction through aggressive optimization
- **Maintained**: All public APIs, sales-assistance-demo project, test coverage, zero breaking changes

### Code Quality & Type Safety
- **Branded Types**: Type-safe IDs (`CardId`, `SectionId`, `FieldId`) to prevent ID mixing bugs
- **Utility Types**: `DeepPartial`, `DeepReadonly`, `RequiredFields`, `SectionOf` for better DX
- **Factory Pattern**: `CardFactory`, `SectionFactory`, `FieldFactory` for fluent card creation
- **Constants**: Centralized animation, layout, and streaming constants

### Performance
- **Core Performance Utilities**: `debounce`, `throttle`, advanced memoization, object pooling
- **Virtual Scrolling**: Enhanced virtual scroll for large card lists
- **Optimized Bundle**: Improved tree-shaking and reduced bundle size

### UI/UX
- **Design Tokens**: CSS custom properties for spacing, colors, typography, animations
- **Directives**: `CopyToClipboardDirective`, `TooltipDirective`
- **Accessibility**: Focus management, screen reader support, WCAG contrast checking

### Architecture
- **Layout Services**: New `LayoutCalculationService` & `LayoutStateManager`
- **CardFacade Service**: Unified API for all card operations
- **Injection Tokens**: Configurable streaming, animation, layout, theme, accessibility

### Fixes
- **Zero-gap packing utility restored**: `packWithZeroGapsGuarantee` is available again and exported from `osi-cards-lib` for dense masonry layouts.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Installation](#installation)
3. [Using OSI Cards in Your Project](#using-osi-cards-in-your-project)
4. [LLM Integration](#llm-integration)
5. [Section Types](#section-types)
6. [Advanced Features](#advanced-features)
7. [Documentation](#documentation)
8. [Development](#development)

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

## Installation

### Install from npm (Recommended)

```bash
npm install osi-cards-lib
```

**Package URL:** https://www.npmjs.com/package/osi-cards-lib

The library supports both Angular 18 and Angular 20. If you encounter peer dependency conflicts:

```bash
npm install osi-cards-lib --legacy-peer-deps
```

### Install from GitHub

```bash
npm install git+https://github.com/Inutilepat83/OSI-Cards.git
```

---

## Using OSI Cards in Your Project

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

For detailed integration instructions, see the [Documentation](#documentation).

---

## LLM Integration

OSI Cards is designed to work seamlessly with Large Language Models (LLMs) for dynamic card generation.

### Features

- **Streaming Card Generation**: Cards are generated progressively as LLM responses stream in
- **WebSocket Support**: Real-time card updates via WebSocket connections
- **Agent Integration**: Connect with agent systems for automated card generation
- **Prompt Engineering**: Structured prompts for consistent card generation

### Quick Example

```typescript
import { LLMStreamingService } from 'osi-cards-lib';

const streamingService = inject(LLMStreamingService);

// Start streaming from LLM response
streamingService.start(llmJsonResponse);

// Subscribe to card updates
streamingService.cardUpdates$.subscribe(update => {
  console.log('Card updated:', update.card);
});
```

For complete LLM integration guide, see [Documentation - LLM Integration](/docs/llm-integration).

---

## Section Types

OSI Cards includes **20+ pre-built section types**:

- **Info**: Key-value pairs and metadata
- **Analytics**: Metrics with trends and percentages
- **News**: News articles and headlines
- **Social Media**: Social media posts and engagement
- **Financials**: Financial data and reports
- **List/Table**: Structured lists and tables
- **Event/Timeline**: Chronological events
- **Product**: Product information and features
- **Contact Cards**: Person information
- **Network Cards**: Relationship graphs
- **Map/Locations**: Geographic data
- **Chart**: Data visualizations
- And many more...

For complete section type documentation with examples and best practices, see [Documentation - Section Types](/docs/section-types).

---

## Advanced Features

### Factory Pattern

Create cards fluently with the factory pattern:

```typescript
import { CardFactory } from 'osi-cards-lib';

const card = CardFactory.createCard('Company Overview', [
  CardFactory.section('info', 'Company Details')
    .addField('Industry', 'Technology')
    .addField('Employees', '500+')
    .build(),
  CardFactory.section('analytics', 'Performance')
    .addMetric('Growth', '85%', { percentage: 85, trend: 'up' })
    .build()
]);
```

### Branded Types for Type Safety

```typescript
import { CardId, SectionId, createCardId } from 'osi-cards-lib';

// Type-safe ID handling prevents mixing different ID types
const cardId: CardId = createCardId('my-card');
const sectionId: SectionId = createSectionId('overview');

// TypeScript error: Type 'CardId' is not assignable to type 'SectionId'
// const wrong: SectionId = cardId;
```

### Configurable Services via Injection Tokens

```typescript
import { OSI_STREAMING_CONFIG, OSI_ANIMATION_CONFIG } from 'osi-cards-lib';

@NgModule({
  providers: [
    {
      provide: OSI_STREAMING_CONFIG,
      useValue: {
        chunkIntervalMs: 50,
        throttleMs: 100,
        timeoutMs: 60000
      }
    },
    {
      provide: OSI_ANIMATION_CONFIG,
      useValue: {
        durationMs: 300,
        easing: 'ease-out',
        staggerDelayMs: 40
      }
    }
  ]
})
export class AppModule {}
```

### Accessibility Utilities

```typescript
import { AccessibilityUtil } from 'osi-cards-lib';

// Announce to screen readers
AccessibilityUtil.announceToScreenReader('Card loaded successfully');

// Check for reduced motion preference
if (AccessibilityUtil.prefersReducedMotion()) {
  // Use simpler animations
}

// Trap focus in modal
const releaseFocus = AccessibilityUtil.trapFocus(modalElement);
// ... later
releaseFocus();
```

### Performance Utilities

```typescript
import { PerformanceUtil } from 'osi-cards-lib';

// Debounce expensive operations
const debouncedSearch = PerformanceUtil.debounce(searchFn, 300);

// Memoize computations
const memoizedTransform = PerformanceUtil.memoize(transformData);

// Batch DOM operations
const batcher = PerformanceUtil.createFrameBatcher();
batcher.schedule(() => updateDOM1());
batcher.schedule(() => updateDOM2());
```

---

## Documentation

📖 **Full Documentation:** [View Documentation](/docs)

The documentation includes:
- Installation and setup guides
- Library usage examples
- LLM integration guide
- Complete section type reference
- API documentation
- Best practices

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

# Build production
npm run build
```

### Generate Documentation

```bash
# Generate all documentation
npm run docs:generate

# Generate API docs only
npm run docs:api

# Generate README
npm run docs:readme

# Watch mode for development
npm run docs:watch
```

---

## License

MIT

## Version

1.5.17

---

**Questions or contributions?** See the [Documentation](/docs) for detailed guides and examples.
