# OSI Cards Architecture Documentation

## Overview

OSI Cards is a modern Angular 17+ application that transforms datasets into interactive card-based dashboards. This document describes the architecture, component hierarchy, data flow, and key design patterns.

## Component Hierarchy

```
AICardRendererComponent (Entry Point)
  └── SectionRendererComponent (Router)
      └── Section Components (18 types)
          ├── InfoSectionComponent
          ├── OverviewSectionComponent
          ├── AnalyticsSectionComponent
          ├── NewsSectionComponent
          ├── SocialMediaSectionComponent
          ├── FinancialsSectionComponent
          ├── ListSectionComponent
          ├── EventSectionComponent
          ├── ProductSectionComponent
          ├── SolutionsSectionComponent
          ├── ContactCardSectionComponent
          ├── NetworkCardSectionComponent
          ├── MapSectionComponent
          ├── ChartSectionComponent
          ├── QuotationSectionComponent
          ├── TextReferenceSectionComponent
          ├── BrandColorsSectionComponent
          └── FallbackSectionComponent
  └── MasonryGridComponent (Layout Engine)
```

## Data Flow

```
JSON Config (assets/configs/*)
    ↓
JsonFileCardProvider
    ↓
CardDataService (Provider Management)
    ↓
NgRx Store (cards state)
    ↓
AICardRendererComponent (Hydration)
    ↓
SectionRendererComponent (Type Resolution)
    ↓
Section Components (Rendering)
    ↓
MasonryGridComponent (Layout + Animation)
```

## Key Services

### Core Services (`src/app/core/services/`)

- **CardDataService**: Manages card data providers, caching, and real-time streams
- **JsonProcessingService**: Handles JSON parsing, validation, and card structure processing
- **JsonValidationService**: Validates JSON syntax and provides error suggestions
- **CardGenerationService**: Orchestrates card generation from JSON input
- **LLMStreamingService**: Manages LLM simulation and progressive card updates
- **PerformanceService**: Tracks performance metrics and Web Vitals
- **FeatureFlagService**: Manages feature toggles and runtime configuration
- **LoggingService**: Structured logging with log levels
- **AppConfigService**: Centralized application configuration

### Shared Services (`src/app/shared/services/`)

- **SectionNormalizationService**: Resolves section types and calculates column spans
- **SectionCompletionService**: Tracks section completion during streaming
- **CardDiffService**: Wraps card diff utilities for dependency injection
- **CardPreviewService**: Manages card preview state
- **IconService**: Maps field labels to icons
- **SectionUtilsService**: Provides formatting utilities for status, trends, changes
- **ToastService**: Toast notifications
- **ThemeService**: Dark mode and theme management
- **SearchFilterService**: Card search and filtering

## State Management

### NgRx Store Structure

```typescript
interface CardsState {
  ids: string[];
  entities: Dictionary<AICardConfig>;
  currentCardId: string | null;
  cardType: CardType;
  cardVariant: number;
  jsonInput: string;
  isGenerating: boolean;
  isFullscreen: boolean;
  error: string | null;
  loading: boolean;
  lastChangeType: CardChangeType;
}
```

### Key Selectors

- `selectCurrentCard`: Current card being displayed
- `selectCards`: All cards in store
- `selectFilteredCards`: Cards filtered by search term
- `selectSortedCards`: Cards sorted by criteria
- `selectCardsByType`: Cards grouped by type

## Design Patterns

### 1. Base Component Pattern

All section components extend `BaseSectionComponent` which provides:
- Common animation logic
- Interaction event handling
- TrackBy functions
- Change detection optimization

### 2. Provider Pattern

Card data sources implement `CardDataProvider` interface:
- `JsonFileCardProvider`: Loads from static JSON files
- `WebSocketCardProvider`: Real-time updates via WebSocket

### 3. Strategy Pattern

Different strategies for:
- Section type resolution (`SectionNormalizationService`)
- Card diff algorithms (`CardDiffUtil`)
- Animation strategies (staggered, batched)

### 4. Observer Pattern

RxJS observables for:
- Card updates (`CardDataService.cardUpdates$`)
- State changes (NgRx selectors)
- Feature flags (`FeatureFlagService.flags$`)

## Section Component Architecture

### BaseSectionComponent

All section components extend this base class:

```typescript
export abstract class BaseSectionComponent<T extends CardField | CardItem> {
  @Input({ required: true }) section!: CardSection;
  @Output() fieldInteraction = new EventEmitter<SectionInteraction<T>>();
  @Output() itemInteraction = new EventEmitter<SectionInteraction<T>>();
  
  protected getFields(): CardField[];
  protected getItems(): CardItem[];
  protected trackField(index: number, field: CardField): string;
  protected trackItem(index: number, item: CardItem): string;
  protected emitFieldInteraction(field: T, metadata?: Record<string, unknown>): void;
  protected emitItemInteraction(item: T, metadata?: Record<string, unknown>): void;
}
```

### Section Type Resolution

`SectionRendererComponent` uses `SectionNormalizationService` to resolve section types:

1. Direct type match (`type: 'info'`)
2. Title-based matching (`title: 'Company Info'` → `type: 'info'`)
3. Fallback to `FallbackSectionComponent`

## Masonry Grid Layout

`MasonryGridComponent` calculates optimal layout:

1. **Column Count**: Based on container width (1-4 columns)
2. **Column Span**: Calculated using density heuristics
3. **Animation**: Staggered appearance animations
4. **Responsive**: Adapts to breakpoints

### Layout Algorithm

```typescript
// Calculate columns based on width
const columns = calculateColumns(containerWidth);

// Calculate colSpan for each section
const colSpan = calculateColSpan(section, columns);

// Apply staggered animations
applyStaggerAnimation(section, index);
```

## Streaming Architecture

LLM streaming simulation uses progressive updates:

1. **Placeholder Creation**: Empty card structure created immediately
2. **Section Detection**: Sections detected as JSON parses
3. **Progressive Updates**: Fields/items update as they complete
4. **Completion Tracking**: Sections marked complete when all fields/items done
5. **Final Merge**: Complete card merged and persisted

## Performance Optimizations

1. **OnPush Change Detection**: All components use OnPush
2. **TrackBy Functions**: Optimized *ngFor performance
3. **Batched Updates**: Animation state updates batched via RAF
4. **Memoization**: Expensive computations cached
5. **Lazy Loading**: Optional dependencies (Chart.js, Leaflet) lazy loaded
6. **Virtual Scrolling**: For large card lists (planned)

## Security

1. **Input Sanitization**: All user inputs sanitized
2. **XSS Protection**: SafeHtml pipe used for HTML content
3. **CSP Headers**: Content Security Policy configured
4. **Input Validation**: JSON validated before processing

## Accessibility

1. **ARIA Labels**: All interactive elements have ARIA labels
2. **Keyboard Navigation**: Full keyboard support
3. **Focus Management**: Focus trap and visible indicators
4. **Screen Reader Support**: ARIA live regions for dynamic content
5. **Color Contrast**: WCAG AA compliant

## Testing Strategy

1. **Unit Tests**: Services, utilities, components
2. **Integration Tests**: Card generation flow, streaming
3. **E2E Tests**: Playwright for full user workflows
4. **Test Builders**: Fluent API for creating test data

## File Structure

```
src/app/
├── core/                    # App-level services
│   ├── services/           # Core services
│   ├── interceptors/       # HTTP interceptors
│   ├── guards/            # Route guards
│   └── resolvers/         # Route resolvers
├── shared/                 # Reusable components/services
│   ├── components/        # Shared components
│   ├── services/          # Shared services
│   ├── utils/             # Utility functions
│   └── pipes/            # Pipes
├── features/              # Feature modules
│   └── home/             # Home feature
├── store/                 # NgRx store
│   └── cards/            # Cards state
└── models/               # TypeScript models
```

## Design Tokens

All styling uses CSS custom properties (design tokens):

```scss
--card-title-font-size: clamp(1.3rem, 1.15rem + 0.4vw, 1.6rem);
--card-padding: 1.25rem;
--card-gap: 0.75rem;
--color-brand: #FF7900;
--card-background: rgba(20, 30, 50, 0.4);
```

## Extension Points

### Adding a New Section Type

1. Create component extending `BaseSectionComponent`
2. Add to `SectionRendererComponent` switch
3. Add SCSS styles using design tokens
4. Update `SectionType` union type
5. Add to section type catalog

### Adding a New Card Provider

1. Implement `CardDataProvider` interface
2. Register with `CardDataService.switchProvider()`
3. Implement `subscribeToUpdates()` if real-time needed

## Performance Budgets

- Initial bundle: < 2MB
- Component styles: < 6KB each
- Any bundle: < 500KB
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1

## Future Enhancements

1. Virtual scrolling for large lists
2. Code splitting for section components
3. Service worker for offline support
4. WebSocket provider for real-time updates
5. Advanced filtering and search
6. Card templates gallery
7. Export to PDF/Image
8. Undo/Redo functionality



