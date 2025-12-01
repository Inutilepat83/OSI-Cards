# OSI Cards - Components Reference

This guide documents all components provided by the OSI Cards library.

## Table of Contents

- [Entry Point Components](#entry-point-components)
  - [OsiCardsComponent](#osicardscomponent)
  - [OsiCardsContainerComponent](#osicardscontainercomponent)
  - [AICardRendererComponent](#aicardrenderercomponent)
- [Layout Components](#layout-components)
  - [MasonryGridComponent](#masonrygridcomponent)
  - [CardSectionListComponent](#cardsectionlistcomponent)
- [Card Structure Components](#card-structure-components)
  - [CardHeaderComponent](#cardheadercomponent)
  - [CardBodyComponent](#cardbodycomponent)
  - [CardFooterComponent](#cardfootercomponent)
  - [CardActionsComponent](#cardactionscomponent)
- [Section Components](#section-components)
  - [SectionRendererComponent](#sectionrenderercomponent)
  - [BaseSectionComponent](#basesectioncomponent)
  - [Built-in Section Types](#built-in-section-types)
- [Loading & Error Components](#loading--error-components)
  - [CardSkeletonComponent](#cardskeletoncomponent)
  - [SectionSkeletonComponent](#sectionskeletoncomponent)
  - [SectionErrorBoundaryComponent](#sectionerrorboundarycomponent)
  - [CardStreamingIndicatorComponent](#cardstreamingindicatorcomponent)
- [Preview Components](#preview-components)
  - [CardPreviewComponent](#cardpreviewcomponent)

---

## Entry Point Components

### OsiCardsComponent

The primary entry point for rendering OSI Cards. Provides a simplified API with automatic style isolation.

#### Selector

```html
<osi-cards></osi-cards>
```

#### Usage

```typescript
import { OsiCardsComponent } from 'osi-cards-lib';

@Component({
  imports: [OsiCardsComponent],
  template: `
    <osi-cards
      [card]="cardConfig"
      [theme]="'day'"
      [isStreaming]="isStreaming"
      [streamingStage]="streamingStage"
      [streamingProgress]="progress"
      (fieldClick)="onFieldClick($event)"
      (actionClick)="onActionClick($event)">
    </osi-cards>
  `
})
```

#### Inputs

| Input                  | Type               | Default               | Description                  |
| ---------------------- | ------------------ | --------------------- | ---------------------------- |
| `card`                 | `AICardConfig`     | -                     | Card configuration to render |
| `theme`                | `'day' \| 'night'` | `'day'`               | Theme to apply               |
| `fullscreen`           | `boolean`          | `false`               | Display in fullscreen mode   |
| `tiltEnabled`          | `boolean`          | `true`                | Enable 3D tilt effect        |
| `containerWidth`       | `number`           | -                     | Explicit container width     |
| `isStreaming`          | `boolean`          | `false`               | Whether streaming is active  |
| `streamingStage`       | `StreamingStage`   | -                     | Current streaming stage      |
| `streamingProgress`    | `number`           | -                     | Streaming progress (0-1)     |
| `showLoadingByDefault` | `boolean`          | `true`                | Show loading when no card    |
| `loadingMessages`      | `string[]`         | -                     | Custom loading messages      |
| `loadingTitle`         | `string`           | `'Creating OSI Card'` | Loading title                |

#### Outputs

| Output             | Event Type                               | Description               |
| ------------------ | ---------------------------------------- | ------------------------- |
| `fieldClick`       | `CardFieldInteractionEvent`              | Field clicked             |
| `actionClick`      | `{ action: string; card: AICardConfig }` | Action button clicked     |
| `fullscreenChange` | `boolean`                                | Fullscreen toggled        |
| `agentAction`      | `AgentActionEvent`                       | Agent action triggered    |
| `questionAction`   | `QuestionActionEvent`                    | Question action triggered |
| `export`           | `void`                                   | Export requested          |

---

### OsiCardsContainerComponent

A wrapper component that provides layout and theme context for multiple cards.

#### Selector

```html
<osi-cards-container></osi-cards-container>
```

#### Usage

```typescript
import { OsiCardsContainerComponent } from 'osi-cards-lib';

@Component({
  imports: [OsiCardsContainerComponent, OsiCardsComponent],
  template: `
    <osi-cards-container [theme]="'night'" [maxWidth]="800">
      <osi-cards [card]="card1"></osi-cards>
      <osi-cards [card]="card2"></osi-cards>
    </osi-cards-container>
  `
})
```

#### Inputs

| Input      | Type               | Default | Description             |
| ---------- | ------------------ | ------- | ----------------------- |
| `theme`    | `'day' \| 'night'` | `'day'` | Theme for all cards     |
| `maxWidth` | `number`           | -       | Maximum container width |
| `gap`      | `number`           | `16`    | Gap between cards       |

---

### AICardRendererComponent

The core rendering component that handles all card visualization. Uses Shadow DOM for style encapsulation.

#### Selector

```html
<app-ai-card-renderer></app-ai-card-renderer>
```

#### Usage

```typescript
import { AICardRendererComponent } from 'osi-cards-lib';

@Component({
  imports: [AICardRendererComponent],
  template: `
    <app-ai-card-renderer
      [cardConfig]="cardConfig"
      [isFullscreen]="false"
      [tiltEnabled]="true"
      (fieldInteraction)="onFieldInteraction($event)"
      (cardInteraction)="onCardInteraction($event)">
    </app-ai-card-renderer>
  `
})
```

#### Encapsulation

`AICardRendererComponent` uses `ViewEncapsulation.ShadowDom` to ensure complete style isolation. All child components use `ViewEncapsulation.None` to inherit styles from the Shadow DOM root.

---

## Layout Components

### MasonryGridComponent

Responsive masonry grid layout for sections with multiple packing algorithms.

#### Selector

```html
<app-masonry-grid></app-masonry-grid>
```

#### Usage

```typescript
import { MasonryGridComponent } from 'osi-cards-lib';

@Component({
  imports: [MasonryGridComponent],
  template: `
    <app-masonry-grid
      [sections]="sections"
      [containerWidth]="containerWidth"
      [isStreaming]="isStreaming"
      [packingAlgorithm]="'row-first'"
      [optimizeLayout]="true"
      [enableVirtualScroll]="false"
      (sectionEvent)="onSectionEvent($event)"
      (layoutChange)="onLayoutChange($event)"
      (layoutLog)="onLayoutLog($event)">
    </app-masonry-grid>
  `
})
```

#### Inputs

| Input                 | Type                | Default    | Description                |
| --------------------- | ------------------- | ---------- | -------------------------- |
| `sections`            | `CardSection[]`     | `[]`       | Sections to render         |
| `gap`                 | `number`            | `12`       | Gap between sections       |
| `minColumnWidth`      | `number`            | `260`      | Minimum column width       |
| `maxColumns`          | `number`            | `4`        | Maximum columns            |
| `containerWidth`      | `number`            | -          | Explicit container width   |
| `isStreaming`         | `boolean`           | `false`    | Streaming mode             |
| `optimizeLayout`      | `boolean`           | `true`     | Enable layout optimization |
| `packingAlgorithm`    | `PackingAlgorithm`  | `'legacy'` | Packing algorithm          |
| `rowPackingOptions`   | `RowPackingOptions` | -          | Row packing config         |
| `useLegacyFallback`   | `boolean`           | `true`     | Fallback to legacy         |
| `enableVirtualScroll` | `boolean`           | `false`    | Enable virtual scrolling   |
| `virtualThreshold`    | `number`            | `50`       | Section count for virtual  |
| `virtualBuffer`       | `number`            | `5`        | Buffer sections            |
| `debug`               | `boolean`           | `false`    | Enable debug logging       |

#### Outputs

| Output         | Event Type           | Description         |
| -------------- | -------------------- | ------------------- |
| `sectionEvent` | `SectionRenderEvent` | Section interaction |
| `layoutChange` | `MasonryLayoutInfo`  | Layout changed      |
| `layoutLog`    | `LayoutLogEntry`     | Debug layout log    |

#### Packing Algorithms

```typescript
type PackingAlgorithm = 'legacy' | 'row-first' | 'skyline';

// Legacy: Original FFDH-based masonry (default)
// Row-first: Space-filling algorithm prioritizing complete rows
// Skyline: Skyline bin-packing for minimal gaps
```

#### Layout Log Entry

```typescript
interface LayoutLogEntry {
  timestamp: number;
  event: 'columns_changed' | 'sections_positioned' | 'section_expanded';
  containerWidth: number;
  columns: number;
  previousColumns?: number;
  sections: SectionLayoutLog[];
}
```

---

### CardSectionListComponent

Renders a list of sections with proper animations and event handling.

#### Selector

```html
<app-card-section-list></app-card-section-list>
```

#### Usage

```typescript
@Component({
  template: `
    <app-card-section-list
      [sections]="sections"
      [isStreaming]="isStreaming"
      (sectionEvent)="onSectionEvent($event)">
    </app-card-section-list>
  `
})
```

---

## Card Structure Components

### CardHeaderComponent

Renders the card header with title, subtitle, and optional actions.

#### Selector

```html
<app-card-header></app-card-header>
```

#### Usage

```typescript
@Component({
  template: `
    <app-card-header
      [title]="card.cardTitle"
      [subtitle]="card.cardSubtitle"
      [showFullscreen]="true"
      [isFullscreen]="isFullscreen"
      (fullscreenToggle)="onFullscreenToggle($event)">
    </app-card-header>
  `
})
```

---

### CardBodyComponent

Container for the main card content (sections).

#### Selector

```html
<app-card-body></app-card-body>
```

---

### CardFooterComponent

Renders the card footer with metadata or actions.

#### Selector

```html
<app-card-footer></app-card-footer>
```

---

### CardActionsComponent

Renders action buttons for the card.

#### Selector

```html
<app-card-actions></app-card-actions>
```

#### Usage

```typescript
@Component({
  template: `
    <app-card-actions
      [actions]="card.actions"
      [card]="card"
      (actionClick)="onActionClick($event)">
    </app-card-actions>
  `
})
```

#### Action Types

```typescript
type CardActionType =
  | 'link' // Open URL
  | 'mail' // Email action
  | 'phone' // Phone call
  | 'copy' // Copy to clipboard
  | 'share' // Share content
  | 'download' // Download file
  | 'agent' // Trigger AI agent
  | 'question' // Ask follow-up question
  | 'custom'; // Custom handler
```

---

## Section Components

### SectionRendererComponent

Dynamically loads and renders section components based on type.

#### Selector

```html
<app-section-renderer></app-section-renderer>
```

#### Usage

```typescript
import { SectionRendererComponent } from 'osi-cards-lib';

@Component({
  imports: [SectionRendererComponent],
  template: `
    <app-section-renderer
      [section]="section"
      (sectionEvent)="onSectionEvent($event)">
    </app-section-renderer>
  `
})
```

#### Inputs

| Input     | Type          | Description           |
| --------- | ------------- | --------------------- |
| `section` | `CardSection` | Section configuration |

#### Outputs

| Output         | Event Type           | Description         |
| -------------- | -------------------- | ------------------- |
| `sectionEvent` | `SectionRenderEvent` | Section interaction |

---

### BaseSectionComponent

Abstract base class that all section components must extend.

#### Usage

```typescript
import { BaseSectionComponent, SectionPlugin } from 'osi-cards-lib';

@Component({
  selector: 'app-custom-section',
  template: `...`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomSectionComponent extends BaseSectionComponent implements SectionPlugin {
  getPluginType(): string {
    return 'custom';
  }

  canHandle(section: CardSection): boolean {
    return section.type === 'custom';
  }
}
```

#### Protected Methods

```typescript
// Access section data
protected getFields(): CardField[];
protected getItems(): CardItem[];
protected getFieldValue(field: CardField): string | number | boolean | undefined;
protected getMetaValue(field: CardField, key: string): unknown;

// Emit interactions
protected emitFieldInteraction(field: CardField, metadata?: Record<string, unknown>): void;
protected emitItemInteraction(item: CardItem, metadata?: Record<string, unknown>): void;

// TrackBy functions
protected trackField(index: number, field: CardField): string;
protected trackItem(index: number, item: CardItem): string;

// Animation helpers
getFieldAnimationClass(fieldId: string, index: number): string;
getItemAnimationClass(itemId: string, index: number): string;
getFieldStaggerIndex(index: number): number;
getItemStaggerIndex(index: number): number;

// Utility
protected isStreamingPlaceholder(value: unknown): boolean;
```

#### Public Getters

```typescript
get hasFields(): boolean;
get hasItems(): boolean;
```

---

### Built-in Section Types

| Type             | Component                       | Description               |
| ---------------- | ------------------------------- | ------------------------- |
| `info`           | `InfoSectionComponent`          | Key-value pairs           |
| `analytics`      | `AnalyticsSectionComponent`     | Metrics with trends       |
| `overview`       | `OverviewSectionComponent`      | Summary overview          |
| `contact-card`   | `ContactCardSectionComponent`   | Contact information       |
| `network-card`   | `NetworkCardSectionComponent`   | Network/connections       |
| `map`            | `MapSectionComponent`           | Interactive map (Leaflet) |
| `chart`          | `ChartSectionComponent`         | Charts (Chart.js)         |
| `list`           | `ListSectionComponent`          | Item list                 |
| `event`          | `EventSectionComponent`         | Timeline/events           |
| `product`        | `ProductSectionComponent`       | Product details           |
| `solutions`      | `SolutionsSectionComponent`     | Solutions list            |
| `financials`     | `FinancialsSectionComponent`    | Financial data            |
| `quotation`      | `QuotationSectionComponent`     | Quotes                    |
| `text-reference` | `TextReferenceSectionComponent` | Text with references      |
| `brand-colors`   | `BrandColorsSectionComponent`   | Color palette             |
| `news`           | `NewsSectionComponent`          | News items                |
| `social-media`   | `SocialMediaSectionComponent`   | Social links              |
| `fallback`       | `FallbackSectionComponent`      | Unknown types             |

See [Section Types Reference](./SECTION_TYPES.md) for detailed examples.

---

## Loading & Error Components

### CardSkeletonComponent

Displays a loading skeleton while card data is loading.

#### Selector

```html
<app-card-skeleton></app-card-skeleton>
```

#### Usage

```typescript
@Component({
  template: `
    <app-card-skeleton
      *ngIf="isLoading"
      [sections]="3"
      [showHeader]="true"
      [showActions]="true">
    </app-card-skeleton>
  `
})
```

#### Inputs

| Input         | Type      | Default | Description                 |
| ------------- | --------- | ------- | --------------------------- |
| `sections`    | `number`  | `3`     | Number of skeleton sections |
| `showHeader`  | `boolean` | `true`  | Show header skeleton        |
| `showActions` | `boolean` | `true`  | Show actions skeleton       |

---

### SectionSkeletonComponent

Displays a loading skeleton for a single section.

#### Selector

```html
<app-section-skeleton></app-section-skeleton>
```

#### Usage

```typescript
@Component({
  template: `
    <app-section-skeleton
      [type]="'info'"
      [lines]="4">
    </app-section-skeleton>
  `
})
```

---

### SectionErrorBoundaryComponent

Wraps sections to catch and handle rendering errors gracefully.

#### Selector

```html
<app-section-error-boundary></app-section-error-boundary>
```

#### Usage

```typescript
@Component({
  template: `
    <app-section-error-boundary
      [sectionId]="section.id"
      [sectionType]="section.type"
      [config]="errorConfig"
      (errorCaught)="onError($event)"
      (retryRequested)="onRetry($event)">
      <app-analytics-section [section]="section"></app-analytics-section>
    </app-section-error-boundary>
  `
})
```

#### Inputs

| Input         | Type                  | Default        | Description                |
| ------------- | --------------------- | -------------- | -------------------------- |
| `sectionId`   | `string`              | -              | Section ID for reporting   |
| `sectionType` | `string`              | -              | Section type for reporting |
| `config`      | `ErrorBoundaryConfig` | Default config | Error handling config      |

#### Configuration

```typescript
interface ErrorBoundaryConfig {
  showDetails: boolean; // Show error details (dev mode)
  allowRetry: boolean; // Allow retry button
  maxRetries: number; // Maximum retry attempts
  retryDelayMs: number; // Delay between retries
  autoRetry: boolean; // Auto-retry on error
}

const DEFAULT_ERROR_BOUNDARY_CONFIG: ErrorBoundaryConfig = {
  showDetails: false,
  allowRetry: true,
  maxRetries: 3,
  retryDelayMs: 1000,
  autoRetry: false,
};
```

#### Outputs

| Output           | Event Type     | Description             |
| ---------------- | -------------- | ----------------------- |
| `errorCaught`    | `SectionError` | Error was caught        |
| `retryRequested` | `number`       | Retry requested (count) |
| `errorCleared`   | `void`         | Error was cleared       |

#### SectionError Interface

```typescript
interface SectionError {
  message: string;
  timestamp: Date;
  sectionId?: string;
  sectionType?: string;
  originalError?: Error;
  retryCount: number;
}
```

---

### CardStreamingIndicatorComponent

Displays streaming progress and status.

#### Selector

```html
<app-card-streaming-indicator></app-card-streaming-indicator>
```

#### Usage

```typescript
@Component({
  template: `
    <app-card-streaming-indicator
      [stage]="streamingStage"
      [progress]="streamingProgress"
      [message]="'Generating card...'">
    </app-card-streaming-indicator>
  `
})
```

#### Inputs

| Input      | Type             | Description             |
| ---------- | ---------------- | ----------------------- |
| `stage`    | `StreamingStage` | Current streaming stage |
| `progress` | `number`         | Progress value (0-1)    |
| `message`  | `string`         | Status message          |

#### StreamingStage

```typescript
type StreamingStage = 'idle' | 'thinking' | 'streaming' | 'complete' | 'aborted' | 'error';
```

---

## Preview Components

### CardPreviewComponent

Renders a compact preview/thumbnail of a card.

#### Selector

```html
<app-card-preview></app-card-preview>
```

#### Usage

```typescript
@Component({
  template: `
    <app-card-preview
      [card]="card"
      [maxSections]="2"
      [showActions]="false"
      (click)="onPreviewClick()">
    </app-card-preview>
  `
})
```

#### Inputs

| Input         | Type           | Default | Description          |
| ------------- | -------------- | ------- | -------------------- |
| `card`        | `AICardConfig` | -       | Card to preview      |
| `maxSections` | `number`       | `2`     | Max sections to show |
| `showActions` | `boolean`      | `false` | Show action buttons  |
| `compact`     | `boolean`      | `true`  | Use compact layout   |

---

## Component Architecture

### Encapsulation Strategy

```
┌─────────────────────────────────────────────────────────────┐
│  AICardRendererComponent (Shadow DOM)                       │
│  ├─ Encapsulation: ViewEncapsulation.ShadowDom             │
│  │                                                          │
│  │  ┌───────────────────────────────────────────────────┐  │
│  │  │  Child Components (None encapsulation)            │  │
│  │  │  • MasonryGridComponent                           │  │
│  │  │  • SectionRendererComponent                       │  │
│  │  │  • CardHeaderComponent                            │  │
│  │  │  • All Section Components                         │  │
│  │  │                                                   │  │
│  │  │  Inherit styles from Shadow DOM root              │  │
│  │  └───────────────────────────────────────────────────┘  │
│  │                                                          │
└──┴──────────────────────────────────────────────────────────┘
```

### Data Flow

```
AICardConfig
      │
      ▼
┌─────────────────────┐
│  OsiCardsComponent  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ AICardRendererComponent │
└─────────┬───────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌───────┐  ┌────────────┐
│Header │  │MasonryGrid │
└───────┘  └─────┬──────┘
                 │
         ┌───────┼───────┐
         ▼       ▼       ▼
     ┌───────┐ ┌───────┐ ┌───────┐
     │Section│ │Section│ │Section│
     │ #1    │ │ #2    │ │ #3    │
     └───────┘ └───────┘ └───────┘
```

---

## Related Documentation

- [API Reference](./API.md) - Full API documentation
- [Section Types Reference](./SECTION_TYPES.md) - Section type details
- [Plugin System](./PLUGIN_SYSTEM.md) - Custom section plugins
- [CSS Encapsulation](./CSS_ENCAPSULATION.md) - Style isolation
- [Best Practices](./BEST_PRACTICES.md) - Performance tips

