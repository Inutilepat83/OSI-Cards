# OSI Cards - AI Coding Agent Instructions

## Project Overview
OSI Cards is an Angular 17+ application migrated from React/Vite for creating interactive, 3D-tiltable card visualizations with rich content sections. The architecture uses **standalone components**, **NgRx** state management, and a **modular section-based rendering system**.

## Core Architecture Patterns

### 1. **Standalone Components Everywhere**
- All components use `standalone: true` - NO NgModules exist
- Use `imports: [CommonModule, ...]` directly in component decorators
- Example: `@Component({ standalone: true, imports: [CommonModule, LucideIconsModule] })`

### 2. **Section-Based Card System**
Cards are composed of pluggable **section components** rendered through a dynamic router:
- **AICardRendererComponent** (`ai-card-renderer.component.ts`) orchestrates card display with masonry layout
- **SectionRendererComponent** (`section-renderer/section-renderer.component.ts`) routes sections by type using `ngSwitch`
- **15 specialized section components** in `src/app/shared/components/cards/sections/`:
  - `analytics-section` - Metrics with progress bars and trends
  - `chart-section` - Bar/pie charts (no Chart.js, custom CSS-based)
  - `map-section` - Location cards (Leaflet integration optional)
  - `info-section`, `list-section`, `event-section`, `product-section`, `contact-card-section`, etc.

**Section Type Resolution Logic** (in `SectionRendererComponent.resolvedType`):
```typescript
// Title-based overrides take precedence:
if (type === 'info' && title.includes('overview')) return 'overview';
// Fallbacks: 'timeline' → 'event', 'metrics' → 'analytics', 'table' → 'list'
```

### 3. **Card Data Model** (`src/app/models/card.model.ts`)
```typescript
interface AICardConfig {
  cardTitle: string;
  cardType: 'company' | 'contact' | 'opportunity' | 'product' | 'analytics' | 'event' | 'project';
  sections: CardSection[];  // Array of heterogeneous sections
  actions?: CardAction[];
  metadata?: { category, variant, complexity, ... }
}

interface CardSection {
  id: string;
  type: 'info' | 'analytics' | 'chart' | 'map' | 'list' | ... (15 types);
  title: string;
  fields?: CardField[];  // Field structure varies by section type
  preferredColumns?: 1 | 2 | 3 | 4;  // Controls INTERNAL section grid layout
}
```

**Key Distinction**: `section.preferredColumns` controls the INTERNAL grid of metrics/fields WITHIN a section (e.g., 2-column analytics grid), NOT the section's span in the masonry layout.

### 4. **NgRx State Management** (Deep Dive)

**State Architecture** (`store/cards/`):
```typescript
interface CardsState {
  cards: AICardConfig[];           // All loaded cards
  currentCard: AICardConfig | null; // Active card being edited/viewed
  cardType: CardType;               // Selected card type filter
  cardVariant: number;              // Template variant (1-3)
  jsonInput: string;                // JSON editor content
  isGenerating: boolean;            // Card generation in progress
  isFullscreen: boolean;            // Fullscreen mode toggle
  error: string | null;             // Error messages
  loading: boolean;                 // Data loading state
}
```

**Key Actions** (in `cards.state.ts`):
- `loadCards` / `loadCardsSuccess` / `loadCardsFailure` - Fetch all cards
- `generateCard` / `generateCardSuccess` / `generateCardFailure` - Create/update card
- `loadTemplate` / `loadTemplateSuccess` / `loadTemplateFailure` - Load card template
- `setCardType` / `setCardVariant` - Update UI filters
- `toggleFullscreen` / `setFullscreen` - Control fullscreen mode
- **Legacy aliases**: `createCard` = `updateCard` = `generateCard` (backwards compatibility)

**Effects Pattern** (`cards.effects.ts`):
```typescript
loadTemplate$ = createEffect(() =>
  this.actions$.pipe(
    ofType(CardsActions.loadTemplate),
    mergeMap(({ cardType, variant }) =>
      this.cardConfigService.getCardsByType(cardType).pipe(
        map(cards => {
          const template = cards[variant - 1] ?? cards[0];
          const scrubbed = removeAllIds(template);     // Remove old IDs
          const hydrated = ensureCardIds(scrubbed);   // Generate new IDs
          return CardsActions.loadTemplateSuccess({ template: hydrated });
        })
      )
    )
  )
);
```

**Selectors** (`cards.selectors.ts`):
- `selectCurrentCard` - Get active card
- `selectCardType` / `selectCardVariant` - Get filters
- `selectIsBusy` - Combines `loading || isGenerating`
- `selectHasError` - Boolean error check
- All selectors are memoized for performance

**Data Provider Pattern**:
- **Abstraction**: `CardDataProvider` interface enables pluggable backends
- **DI Token**: `CARD_DATA_PROVIDER` in `app.config.ts`
- **Default**: `TemplateCardProvider` loads from `src/assets/examples/`
- **Service**: `CardDataService` wraps provider with caching (`shareReplay(1)`)
- **Swappable**: Call `cardDataService.switchProvider(newProvider)` to change data source

### 5. **Styling System** (Just Updated - Critical!)
**Dual SCSS + Tailwind approach**:
- **SCSS files** (`src/styles/`) define card/section-specific styles:
  - `components/cards/_ai-card.scss` - Main card chrome (8px border-radius, 1px borders)
  - `components/sections/*.scss` - Section-specific layouts (all use 6px border-radius, 10-12px padding)
  - **Design system constraints** (ENFORCE THESE):
    - All cards: `padding: 10px 12px`, `border-radius: 6px`, `border: 1px solid rgba(255, 121, 0, 0.2)`
    - Font sizes: labels `0.6rem`, values `0.85rem`, analytics values `1.3rem`
    - All grids: **forced to 2 columns** (`grid-template-columns: repeat(2, 1fr)`)
    - Progress bars: `height: 3px` (analytics), `height: 6px` (legacy)
- **Tailwind** (`styles.css`) provides utility classes - color tokens defined in `tailwind.config.js` map to CSS vars
- **Color system**: Primary orange with opacity variants - NEVER hardcode hex colors, always use `rgba(255, 121, 0, 0.X)` format

**When adding sections**: Match padding/borders/border-radius to existing sections EXACTLY. Check `_analytics.scss` or `_overview.scss` for reference.

## Critical Workflows

### Running the Application
```bash
npm start              # Dev server on :4200
npm run build          # Production build to dist/
npm test               # Karma unit tests
npm run lint:fix       # Auto-fix ESLint issues
```

**Common issue**: Failed `npm start`? The terminal shows "Last Command: npm strat, Exit Code: 1" - this is a typo. User meant `npm start`.

### Adding a New Section Type (Step-by-Step)

**1. Create Component** (`src/app/shared/components/cards/sections/[name]-section/[name]-section.component.ts`):
```typescript
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField, CardSection } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';

type MyFieldType = CardField & {
  customProp?: string;  // Add your custom properties
};

@Component({
  selector: 'app-my-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './my-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MySectionComponent {
  @Input({ required: true }) section!: CardSection;
  @Output() fieldInteraction = new EventEmitter<{
    field: CardField;
    metadata?: Record<string, unknown>;
  }>();

  get fields(): MyFieldType[] {
    return (this.section.fields as MyFieldType[]) ?? [];
  }

  trackByFieldId = (index: number, field: CardField) => field.id;

  onFieldClick(field: CardField): void {
    this.fieldInteraction.emit({ field });
  }
}
```

**2. Create Template** (`[name]-section.component.html`):
```html
<div class="ai-section">
  <div class="ai-section__header">
    <lucide-icon class="ai-section__icon" name="layers" size="16"></lucide-icon>
    <div class="ai-section__details">
      <h4 class="ai-section__title">{{ section.title }}</h4>
      <p *ngIf="section.description" class="ai-section__description">
        {{ section.description }}
      </p>
    </div>
  </div>
  
  <div class="ai-section__body">
    <div class="my-grid">
      <div *ngFor="let field of fields; trackBy: trackByFieldId"
           class="my-card"
           (click)="onFieldClick(field)">
        <span class="my-card__label">{{ field.label }}</span>
        <span class="my-card__value">{{ field.value }}</span>
      </div>
    </div>
  </div>
</div>
```

**3. Create Styles** (`src/styles/components/sections/_my-section.scss`):
```scss
.my-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);  // ALWAYS 2 columns
  gap: 8px;
  
  @media (max-width: 500px) {
    grid-template-columns: 1fr;  // Mobile: 1 column
  }
}

.my-card {
  border: 1px solid rgba(255, 121, 0, 0.2);
  border-radius: 6px;
  padding: 10px 12px;
  background: rgba(255, 121, 0, 0.03);
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 68px;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.my-card:hover {
  border-color: rgba(255, 153, 51, 0.4);
  background: rgba(255, 121, 0, 0.06);
}

.my-card__label {
  font-size: 0.6rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.2;
}

.my-card__value {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--foreground);
  line-height: 1.2;
}
```

**4. Import Styles** (add to `src/styles.scss`):
```scss
@import 'styles/components/sections/my-section';
```

**5. Register in SectionRenderer** (`section-renderer.component.ts`):
```typescript
// Add to imports array:
import { MySectionComponent } from '../sections/my-section/my-section.component';

imports: [
  CommonModule,
  MySectionComponent,  // Add here
  // ... other sections
]

// Update resolvedType getter if needed:
get resolvedType(): string {
  const type = (this.section.type ?? '').toLowerCase();
  if (type === 'my-custom-type') return 'my-section';
  // ... rest of logic
}
```

**6. Add Template Case** (`section-renderer.component.html`):
```html
<app-my-section
  *ngSwitchCase="'my-section'"
  [section]="section"
  (fieldInteraction)="emitFieldInteraction($event.field, $event.metadata)"
></app-my-section>
```

**7. Update Type Union** (`src/app/models/card.model.ts`):
```typescript
type: 'info' | 'analytics' | 'chart' | 'map' | 'list' | 'my-section' | ...
```

**8. Create Example JSON** (`src/assets/examples/my-section-example.json`):
```json
{
  "cardTitle": "My Section Example",
  "cardType": "company",
  "sections": [{
    "id": "my-1",
    "type": "my-section",
    "title": "Custom Section",
    "fields": [
      { "id": "f1", "label": "Field 1", "value": "Value 1", "customProp": "data" }
    ]
  }]
}
```

### Performance Optimization Patterns
- **OnPush change detection**: Used in ALL components - mutate via `cdr.markForCheck()` when needed
- **TrackBy functions**: Required in all `*ngFor` loops - use `trackById`, `trackByLabel`, etc.
- **Observables**: Prefer `shareReplay(1)` for cached streams (see `CardDataService`)
- **Zone coalescing**: Enabled in `app.config.optimized.ts` with `provideZoneChangeDetection({ eventCoalescing: true })`

### Testing Conventions
- **Type guards**: Test with `CardTypeGuards.isAICardConfig()`, `isCardSection()`, `isCardField()`
- **Utility functions**: Use `CardUtils.safeString()`, `safeNumber()` for sanitization
- **Test files**: Co-located as `*.spec.ts` - see `card.model.spec.ts` for pattern

## Project-Specific Gotchas

### Icons (Lucide Angular)
```typescript
// ALWAYS use the LucideIconsModule wrapper
import { LucideIconsModule } from '../../../../shared/icons/lucide-icons.module';
imports: [CommonModule, LucideIconsModule]

// In template:
<lucide-icon [name]="'bar-chart-3'" size="18"></lucide-icon>
```

### JSON Configuration Files
Card templates in `src/assets/examples/` and `src/assets/configs/[category]/` follow strict schemas. When creating examples:
- Include `processedAt` timestamp
- Set `metadata.category` and `metadata.variant`
- Validate with `CardUtils.sanitizeCardConfig()` before storage

### Masonry Grid Layout
`MasonryGridComponent` handles responsive card arrangement - uses `ChangeDetectionStrategy.Default` (intentional exception) for layout recalculations. DO NOT change to OnPush.

### Reference React Implementation
`reference-react/` folder contains the original React/Vite implementation - useful for understanding component behavior but DO NOT copy patterns (uses React hooks, different state management).

## Style Conventions
- **CSS variables**: Use `var(--foreground)`, `var(--primary)`, never hex codes
- **Transitions**: Keep fast - `0.2s ease` (not 0.3s+)
- **Hover states**: Border opacity `0.4`, background `rgba(255, 121, 0, 0.06)`
- **Typography hierarchy**: Uppercase labels with `letter-spacing: 0.04-0.06em`, `line-height: 1.2`

## Migration Context
This project was migrated from React (Vite) to Angular in 2024. Key changes:
- React hooks → Angular signals/RxJS (signals not yet adopted, still using RxJS)
- React Context → NgRx store
- Vite → Angular CLI with Webpack
- CSS Modules → SCSS + Tailwind

When debugging, check if issue existed in React version by comparing with `reference-react/src/components/`.

## Advanced Patterns

### Creating a Custom Data Provider
To integrate a new backend (API, WebSocket, Firebase, etc.):

```typescript
// 1. Implement CardDataProvider interface
@Injectable()
export class MyApiProvider extends CardDataProvider {
  readonly supportsRealtime = true;
  
  getAllCards(): Observable<AICardConfig[]> {
    return this.http.get<AICardConfig[]>('/api/cards');
  }
  
  getCardsByType(cardType: CardType): Observable<AICardConfig[]> {
    return this.http.get<AICardConfig[]>(`/api/cards?type=${cardType}`);
  }
  
  getCardById(id: string): Observable<AICardConfig | null> {
    return this.http.get<AICardConfig>(`/api/cards/${id}`);
  }
  
  subscribeToUpdates(): Observable<{type: 'created'|'updated'|'deleted', card: AICardConfig}> {
    return this.webSocket.connect('wss://api/cards/updates');
  }
}

// 2. Register in app.config.ts
providers: [
  { provide: CARD_DATA_PROVIDER, useClass: MyApiProvider }
]

// 3. CardDataService automatically wraps it with caching
```

### Component Communication Pattern
All section components use the same event emission pattern:

```typescript
@Component({...})
export class MySectionComponent {
  @Input({ required: true }) section!: CardSection;
  @Output() fieldInteraction = new EventEmitter<{
    field: CardField;
    metadata?: Record<string, unknown>;
  }>();
  
  onFieldClick(field: CardField): void {
    this.fieldInteraction.emit({
      field,
      metadata: { 
        sectionId: this.section.id,
        timestamp: Date.now()
      }
    });
  }
}
```

Events bubble up: `SectionComponent` → `SectionRendererComponent` → `AICardRendererComponent` → `HomePageComponent`

### TrackBy Functions (Performance Critical)
ALWAYS use trackBy in `*ngFor` to prevent unnecessary re-renders:

```typescript
// In component class:
trackByFieldId = (index: number, field: CardField) => field.id;
trackBySectionId = (index: number, section: CardSection) => section.id;

// In template:
<div *ngFor="let field of fields; trackBy: trackByFieldId">
```

### Type-Safe Field Access
Section components type-narrow `CardField` for safety:

```typescript
type AnalyticsField = CardField & {
  percentage?: number;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
};

get fields(): AnalyticsField[] {
  return (this.section.fields as AnalyticsField[]) ?? [];
}
```

## Common Debugging Scenarios

### Issue: "Section not rendering"
1. Check `SectionRendererComponent.resolvedType` - is type mapping correct?
2. Verify section component is imported in `SectionRendererComponent.imports[]`
3. Check `*ngSwitchCase` value matches `resolvedType` return value
4. Validate JSON: Does section have required `id`, `title`, `type` fields?

### Issue: "Change detection not firing"
1. Using OnPush? Call `cdr.markForCheck()` after mutations
2. Mutating arrays/objects directly? Create new references: `this.items = [...this.items]`
3. Observable not triggering? Check subscription in template with `| async`

### Issue: "Styles not applying"
1. Check SCSS file is imported in `styles.scss` imports list
2. Verify class names match between SCSS and template
3. CSS specificity issue? Use browser DevTools to see computed styles
4. Tailwind classes not working? Run `npm start` to rebuild Tailwind

### Issue: "Icons not showing"
1. Import `LucideIconsModule` in component `imports: []`
2. Check icon name is correct (see lucide.dev for icon list)
3. Verify icon size prop: `size="18"` or `size="24"`

### Issue: "NgRx state not updating"
1. Check action is dispatched: Use Redux DevTools extension
2. Verify reducer handles action: Look for `on(MyAction, ...)` in reducer
3. Effect not triggering? Check `ofType(MyAction)` matches dispatched action
4. Selector returning stale data? Ensure state immutability in reducer

## Performance Profiling
Enable performance tracking:
```typescript
// Dispatch performance tracking action
store.dispatch(trackPerformance({ 
  action: 'loadTemplate', 
  duration: Date.now() - startTime 
}));

// Monitor in Redux DevTools
```

## Questions to Ask Before Coding
1. Does this section type already exist? (Check `SectionRendererComponent.resolvedType` mapping)
2. Is the grid forced to 2 columns? (Recent requirement - verify SCSS uses `repeat(2, 1fr)`)
3. Does this component use OnPush? (Required for all new components except MasonryGrid)
4. Are icons from LucideIconsModule? (Not raw SVG)
5. Does styling match existing sections? (Check padding: 10-12px, border-radius: 6px, border: 1px)
6. Are you mutating state correctly? (Create new references for OnPush detection)
7. Do you have trackBy functions? (Required for all *ngFor loops)
8. Is the provider pattern needed? (For external data sources only)
