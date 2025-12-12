# 📚 OSI Cards API Reference

**Version:** 1.5.5
**Last Updated:** December 4, 2025

---

## 🎯 Quick Links

- [Components](#components)
- [Services](#services)
- [Utilities](#utilities)
- [Types](#types)
- [Providers](#providers)

---

## 🧩 Components

### AICardRendererComponent

Main component for rendering AI-generated cards.

```typescript
import { AICardRendererComponent } from 'osi-cards-lib';

@Component({
  template: `
    <app-ai-card-renderer
      [cardConfig]="card"
      [theme]="'cupertino'"
      [enableAnimations]="true"
      (cardEvent)="onCardEvent($event)">
    </app-ai-card-renderer>
  `
})
```

**Inputs:**
- `cardConfig: AICardConfig` - Card configuration
- `theme?: ThemePreset` - Theme name (default: 'cupertino')
- `enableAnimations?: boolean` - Enable animations (default: true)

**Outputs:**
- `cardEvent: EventEmitter<CardEvent>` - Card events

---

### MasonryGridComponent

Masonry grid layout for sections.

```typescript
<app-masonry-grid
  [sections]="sections"
  [gap]="16"
  [containerWidth]="1200"
  [optimizeLayout]="true"
  [enableVirtualScroll]="false"
  (layoutChange)="onLayoutChange($event)">
</app-masonry-grid>
```

**Inputs:**
- `sections: CardSection[]` - Sections to display
- `gap?: number` - Gap between sections (default: 12)
- `minColumnWidth?: number` - Min column width (default: 260)
- `maxColumns?: number` - Max columns (default: 4)
- `containerWidth?: number` - Explicit width
- `isStreaming?: boolean` - Streaming mode (default: false)
- `optimizeLayout?: boolean` - Optimize layout (default: true)
- `enableVirtualScroll?: boolean` - Virtual scroll (default: false)
- `virtualThreshold?: number` - Min sections for virtual (default: 50)
- `virtualBuffer?: number` - Buffer size (default: 5)
- `debug?: boolean` - Debug mode (default: false)

**Outputs:**
- `layoutChange: EventEmitter<MasonryLayoutInfo>` - Layout changes
- `sectionEvent: EventEmitter<SectionRenderEvent>` - Section events
- `layoutLog: EventEmitter<LayoutLogEntry>` - Layout logs

---

### SimpleGridComponent

Simplified grid component using services.

```typescript
<lib-simple-grid
  [sections]="sections"
  [gap]="16"
  (layoutChange)="onLayoutChange($event)">
</lib-simple-grid>
```

**Inputs:**
- `sections: CardSection[]` - Sections
- `gap?: number` - Gap (default: 16)
- `minColumnWidth?: number` - Min width (default: 260)
- `maxColumns?: number` - Max columns (default: 4)
- `containerWidth?: number` - Width

**Outputs:**
- `layoutChange: EventEmitter<SimpleGridLayoutInfo>` - Layout info
- `sectionEvent: EventEmitter<any>` - Section events

---

## 🛠️ Services

### CardFacadeService

Unified API for card operations.

```typescript
import { CardFacadeService } from 'osi-cards-lib';

@Injectable({...})
export class MyService {
  private facade = inject(CardFacadeService);

  // Create card
  async createCard() {
    const card = await this.facade.createCard({
      title: 'My Card',
      sections: [...]
    });
  }

  // Stream card
  streamCard(json: string) {
    this.facade.stream(json).subscribe(update => {
      console.log('Progress:', update.progress);
    });
  }

  // Access state
  cards = this.facade.cards;
  isLoading = this.facade.isLoading;
}
```

---

### LayoutCalculationService

Layout calculation service.

```typescript
import { LayoutCalculationService } from 'osi-cards-lib';

@Injectable({...})
export class MyService {
  private layout = inject(LayoutCalculationService);

  calculateLayout() {
    const result = this.layout.calculateLayout(
      sections,
      { containerWidth: 1200, gap: 16 }
    );

    console.log('Columns:', result.columns);
    console.log('Height:', result.totalHeight);
    console.log('Time:', result.calculationTime);
  }
}
```

**Methods:**
- `calculateLayout(sections, config): LayoutResult`
- `calculateColumns(width): number`
- `estimateHeight(context): number`
- `getLayoutStatistics(result): LayoutStatistics`

---

### ThemeService

Theme management service.

```typescript
import { ThemeService } from 'osi-cards-lib';

@Injectable({...})
export class MyService {
  private theme = inject(ThemeService);

  changeTheme() {
    this.theme.setTheme('glassmorphic');
  }

  // Observe theme changes
  ngOnInit() {
    this.theme.theme$.subscribe(theme => {
      console.log('Theme:', theme);
    });
  }
}
```

---

## ⚡ Utilities

### Performance

```typescript
import {
  Memoize,
  MemoizeLRU,
  MemoizeTTL,
  RequestDeduplicator,
  Deduplicate,
  ObjectPool
} from 'osi-cards-lib';

// Memoization
@Memoize()
calculate(data: Data): Result {
  return expensive(data);
}

// Request deduplication
@Deduplicate()
load(id: string): Observable<Data> {
  return this.http.get(`/api/data/${id}`);
}

// Object pooling
const pool = new ObjectPool(() => new MyObject());
const obj = pool.acquire();
// Use obj...
pool.release(obj);
```

---

### Layout

```typescript
import {
  PerfectBinPacker,
  calculateAdaptiveGap
} from 'osi-cards-lib';

// Bin packing
const packer = new PerfectBinPacker({
  containerWidth: 1200,
  gap: 16
});
const packed = packer.pack(items);

// Adaptive gap
const gap = calculateAdaptiveGap({
  containerWidth: window.innerWidth,
  minGap: 8,
  maxGap: 24
});
```

---

### Animation

```typescript
import {
  FlipAnimator,
  debounce,
  throttle
} from 'osi-cards-lib';

// FLIP animations
const flip = new FlipAnimator();
flip.first(element);
// Make changes...
flip.play(element, { duration: 300 });

// Debounce
const search = debounce((query: string) => {
  this.performSearch(query);
}, 300);

// Throttle
const onScroll = throttle(() => {
  this.updateVisible();
}, 100);
```

---

### Developer Experience

```typescript
import {
  useErrorBoundary,
  AutoUnsubscribe,
  CardUtil
} from 'osi-cards-lib';

// Error boundary
const boundary = useErrorBoundary({
  onError: (error) => console.error(error)
});

// Auto unsubscribe
@AutoUnsubscribe()
class Component {
  private sub = this.service.data$.subscribe(...);
}

// Card utilities
const diff = CardUtil.diff(oldCard, newCard);
const merged = CardUtil.merge(baseCard, updates);
```

---

## 📦 Types

### AICardConfig

```typescript
interface AICardConfig {
  cardTitle: string;
  description?: string;
  sections: CardSection[];
  actions?: CardAction[];
  metadata?: Record<string, any>;
}
```

### CardSection

```typescript
interface CardSection {
  type: string;
  title?: string;
  fields?: CardField[];
  items?: CardItem[];
  description?: string;
  metadata?: Record<string, any>;
}
```

### LayoutConfig

```typescript
interface LayoutConfig {
  containerWidth: number;
  gap?: number;
  columns?: number;
  minColumnWidth?: number;
  maxColumns?: number;
  optimize?: boolean;
}
```

### LayoutResult

```typescript
interface LayoutResult {
  positions: PositionedSection[];
  columnHeights: number[];
  totalHeight: number;
  columns: number;
  containerWidth: number;
  calculationTime?: number;
}
```

---

## 🎨 Providers

### provideOSICards

Main provider function.

```typescript
import { provideOSICards } from 'osi-cards-lib';

export const appConfig: ApplicationConfig = {
  providers: [
    provideOSICards(),
    // ... other providers
  ]
};
```

**Options:**
```typescript
provideOSICards({
  theme: 'cupertino',
  enableAnimations: true,
  streamingConfig: { chunkSize: 10, chunkDelay: 50 }
})
```

---

### provideOSICardsTheme

Theme configuration provider.

```typescript
import { provideOSICardsTheme } from 'osi-cards-lib';

providers: [
  provideOSICardsTheme({
    defaultTheme: 'glassmorphic',
    enableTransitions: true
  })
]
```

---

## 🔧 Advanced APIs

### Factory APIs

```typescript
import { CardFactory } from 'osi-cards-lib';

// Fluent card creation
const card = CardFactory.createCard('Title', [
  CardFactory.section('info', 'Details')
    .addField('Key', 'Value')
    .build()
]);
```

### Type Guards

```typescript
import { CardTypeGuards } from 'osi-cards-lib';

if (CardTypeGuards.isValidCard(data)) {
  // data is AICardConfig
}

if (CardTypeGuards.isValidSection(section)) {
  // section is CardSection
}
```

---

## 📊 Exports Summary

**Total Exports:** 100+

**Categories:**
- Components: 25+
- Services: 20+
- Utilities: 13 high-value
- Types: 30+
- Factories: 5
- Providers: 3

**See:** [Public API](../../projects/osi-cards-lib/src/public-api.ts) for complete list

---

## 📞 More Information

- [Utilities Guide](../utilities/UTILITIES_GUIDE.md) - Detailed utility docs
- [Architecture Services](../architecture/ARCHITECTURE_SERVICES.md) - Service details
- [Grid System Guide](../guides/GRID_SYSTEM_GUIDE.md) - Grid documentation
- [Troubleshooting](../TROUBLESHOOTING.md) - Common issues

---

**Last Updated:** December 4, 2025
**Version:** 1.5.5
**Status:** Complete








