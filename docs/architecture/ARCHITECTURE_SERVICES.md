# 🛠️ Services Architecture

**Version:** 1.5.5
**Last Updated:** December 4, 2025

---

## 📋 Service Categories

OSI Cards has 30+ services organized into clear categories:

### 1. Core Services
- CardFacadeService
- OSICardsStreamingService
- ThemeService

### 2. Layout Services (NEW - Dec 2025)
- LayoutCalculationService
- LayoutStateManager

### 3. Rendering Services
- SectionRendererService
- SectionNormalizationService
- IconService

### 4. Utility Services
- I18nService
- LoggerService
- AccessibilityService
- KeyboardShortcutsService

### 5. Infrastructure Services
- EventBusService
- EventMiddlewareService
- LayoutWorkerService

---

## 🎯 Core Services

### CardFacadeService

**Purpose:** Unified API for all card operations

**Key Methods:**
```typescript
@Injectable({ providedIn: 'root' })
export class CardFacadeService {
  // Create card
  async createCard(options: CreateCardOptions): Promise<AICardConfig>

  // Stream card
  stream(json: string): Observable<CardUpdate>

  // Get cards
  cards: Signal<AICardConfig[]>
  activeCard: Signal<AICardConfig | null>

  // State
  isLoading: Signal<boolean>
  isStreaming: Signal<boolean>
}
```

**Usage:**
```typescript
@Component({...})
export class MyComponent {
  private facade = inject(CardFacadeService);

  createCard() {
    this.facade.createCard({
      title: 'My Card',
      sections: [...]
    });
  }
}
```

---

### OSICardsStreamingService

**Purpose:** Handle LLM streaming with progressive rendering

**Key Methods:**
```typescript
@Injectable({ providedIn: 'root' })
export class OSICardsStreamingService {
  // Stream JSON
  stream(targetJson: string, config?: StreamingConfig): Observable<CardUpdate>

  // State
  state$: Observable<StreamingState>
  cardUpdates$: Observable<CardUpdate>

  // Control
  stop(): void
  configure(config: Partial<StreamingConfig>): void
}
```

**Streaming Flow:**
```
1. Thinking stage (500ms)
2. Chunk-by-chunk JSON parsing
3. Incremental card updates
4. Completion animation
```

---

### ThemeService

**Purpose:** Dynamic theming system

**Themes:**
- cupertino (Apple-style)
- material (Material Design)
- fluent (Microsoft)
- glassmorphic
- neumorphic

**Usage:**
```typescript
@Injectable({ providedIn: 'root' })
export class ThemeService {
  setTheme(theme: ThemePreset): void
  theme$: Observable<ThemePreset>

  // Dynamic colors
  setCustomColors(colors: Partial<ThemeColors>): void
}
```

---

## 🎯 Layout Services (NEW)

### LayoutCalculationService

**Purpose:** Centralized layout calculations

**Key Methods:**
```typescript
@Injectable({ providedIn: 'root' })
export class LayoutCalculationService {
  // Calculate layout
  calculateLayout(
    sections: CardSection[],
    config: LayoutConfig
  ): LayoutResult

  // Calculate columns
  @Memoize()
  calculateColumns(containerWidth: number): number

  // Estimate heights
  estimateHeight(context: SectionHeightContext): number

  // Statistics
  getLayoutStatistics(result: LayoutResult): LayoutStatistics
}
```

**Benefits:**
- 10-100x faster (memoization)
- Testable in isolation
- Reusable across components

---

### LayoutStateManager

**Purpose:** Predictable state management for layouts

**Key Methods:**
```typescript
export class LayoutStateManager {
  // State
  state$: Observable<LayoutState>
  positions$: Observable<Map<string, Position>>
  columnHeights$: Observable<number[]>

  // Mutations
  setState(state: LayoutState): void
  updatePositions(positions: PositionedSection[]): void
  updateColumnHeights(heights: number[]): void

  // Queries
  isReady(): boolean
  getPosition(key: string): Position | null
  getTotalHeight(): number

  // History
  getHistory(): StateSnapshot[]
  restoreSnapshot(snapshot: StateSnapshot): void
}
```

**Benefits:**
- Observable streams
- State history
- Easy debugging

---

## 🔧 Utility Services

### I18nService

**Purpose:** Internationalization support

```typescript
@Injectable({ providedIn: 'root' })
export class I18nService {
  translate(key: string, params?: Record<string, any>): string
  setLocale(locale: SupportedLocale): void
  formatDate(date: Date): string
  formatNumber(num: number): string
  formatCurrency(amount: number, currency: string): string
}
```

**Supported Locales:** en, es, fr, de, it, pt, ja, zh, ar, ru, and more

---

### AccessibilityService

**Purpose:** WCAG compliance and accessibility features

```typescript
@Injectable({ providedIn: 'root' })
export class AccessibilityService {
  announceToScreenReader(message: string): void
  setFocusTrap(element: HTMLElement): void
  checkContrast(fg: string, bg: string): boolean
  improveContrast(color: string, bg: string): string
}
```

---

## 📊 Service Dependency Graph

```
CardFacadeService
  ├─→ OSICardsStreamingService
  └─→ ThemeService

MasonryGridComponent
  ├─→ LayoutCalculationService
  │     └─→ HeightEstimator
  ├─→ LayoutStateManager
  └─→ VirtualScrollManager

AICardRendererComponent
  ├─→ CardFacadeService
  ├─→ ThemeService
  └─→ IconService

SectionRendererComponent
  ├─→ SectionNormalizationService
  ├─→ SectionPluginRegistry
  └─→ EventMiddlewareService
```

---

## 🎯 Service Best Practices

### 1. Use Dependency Injection

```typescript
// ✅ Good
@Component({...})
export class MyComponent {
  private cardService = inject(CardFacadeService);
}

// ❌ Bad
const service = new CardFacadeService(); // Don't instantiate manually
```

### 2. Subscribe with takeUntilDestroyed

```typescript
// ✅ Good
private destroyRef = inject(DestroyRef);

ngOnInit() {
  this.service.data$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(...);
}

// ❌ Bad
this.service.data$.subscribe(...); // Memory leak!
```

### 3. Use Facade for Coordinated Operations

```typescript
// ✅ Good - Use facade
this.cardFacade.createCard(options);

// ❌ Bad - Coordinating multiple services manually
this.streamingService.configure(...);
this.themeService.setTheme(...);
// ... complex coordination
```

---

## 📚 Related Documentation

- [Overview](./ARCHITECTURE_OVERVIEW.md)
- [Components](./ARCHITECTURE_COMPONENTS.md)
- [Utilities](./ARCHITECTURE_UTILITIES.md)
- [State Management](./ARCHITECTURE_STATE.md)

---

**Last Updated:** December 4, 2025
**Version:** 1.5.5


