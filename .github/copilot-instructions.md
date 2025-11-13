# OSI Cards - AI Coding Agent Instructions

## Project Overview
OSI Cards is an Angular 17+ application migrated from React/Vite for creating interactive, 3D-tiltable card visualizations with rich content sections. The architecture uses **standalone components**, **NgRx** state management, and a **modular section-based rendering system**.

**Design Reference**: The React implementation in `Orange Sales Intelligence Cards System 5/` serves as the visual design reference. Angular maintains functional parity with React's design aesthetic while adding theme switching (day/night modes).

## Core Architecture Patterns

### 1. **Standalone Components Everywhere**
- All components use `standalone: true` - NO NgModules exist
- Use `imports: [CommonModule, ...]` directly in component decorators
- Example: `@Component({ standalone: true, imports: [CommonModule, LucideIconsModule] })`

### 2. **Section-Based Card System**
Cards are composed of pluggable **section components** rendered through a dynamic router:
- **AICardRendererComponent** orchestrates card display with masonry layout
- **SectionRendererComponent** (`section-renderer.component.ts`) routes sections by type using `ngSwitch`
- **15+ specialized section components** in `src/app/shared/components/cards/sections/`:
  - `analytics-section` - Metrics with progress bars and trends
  - `chart-section` - Bar/pie charts (custom CSS-based, no Chart.js)
  - `map-section`, `info-section`, `list-section`, `event-section`, `product-section`, `contact-card-section`, etc.

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
  sections: CardSection[];  // Heterogeneous sections
  actions?: CardAction[];
  metadata?: { category, variant, complexity }
}

interface CardSection {
  id: string;
  type: 'info' | 'analytics' | 'chart' | 'map' | 'list' | ... (15+ types);
  title: string;
  fields?: CardField[];
  preferredColumns?: 1 | 2 | 3 | 4;  // INTERNAL section grid layout only
}
```

**Key Distinction**: `section.preferredColumns` controls the INTERNAL grid of fields WITHIN a section, NOT the section's span in the masonry layout.

### 4. **NgRx State Management**

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
  error: string | null;
  loading: boolean;
}
```

**Key Actions**:
- `loadCards` / `loadCardsSuccess` / `loadCardsFailure`
- `generateCard` / `generateCardSuccess` / `generateCardFailure`
- `loadTemplate` / `loadTemplateSuccess` / `loadTemplateFailure`
- `setCardType` / `setCardVariant`
- `toggleFullscreen` / `setFullscreen`
- **Legacy aliases**: `createCard` = `updateCard` = `generateCard` (backwards compatibility)

**Effects Pattern**:
```typescript
loadTemplate$ = createEffect(() =>
  this.actions$.pipe(
    ofType(CardsActions.loadTemplate),
    mergeMap(({ cardType, variant }) =>
      this.cardConfigService.getCardsByType(cardType).pipe(
        map(cards => {
          const template = cards[variant - 1] ?? cards[0];
          const scrubbed = removeAllIds(template);
          const hydrated = ensureCardIds(scrubbed);
          return CardsActions.loadTemplateSuccess({ template: hydrated });
        })
      )
    )
  )
);
```

**Data Provider Pattern**:
- **Abstraction**: `CardDataProvider` interface enables pluggable backends
- **DI Token**: `CARD_DATA_PROVIDER` in `app.config.ts`
- **Default**: `TemplateCardProvider` loads from `src/assets/examples/`
- **Service**: `CardDataService` wraps provider with caching (`shareReplay(1)`)

### 5. **Styling System** (CRITICAL - Recently Unified)

**Dual SCSS + Tailwind approach**:

**SCSS Architecture** (`src/styles/`):
- `components/cards/_ai-card.scss` - Main card chrome
- `components/sections/_sections-base.scss` - **Universal card mixin system** (newly consolidated)
- `components/sections/*.scss` - Individual section layouts

**Universal Card Mixin** (`@mixin card` in `_sections-base.scss`):
```scss
@mixin card {
  border: var(--card-border);
  border-radius: var(--card-border-radius);
  padding: var(--card-padding);
  background: var(--card-background);
  // Matches Tailwind: rounded-2xl, border-border/40, bg-card/70
  transition: border-color 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    border-color: var(--card-hover-border);
    background: var(--card-hover-background);
    box-shadow: var(--card-hover-shadow);
  }
}
```

**Design System Constraints** (ENFORCE):
- All section cards use `@include card` mixin for consistency
- Font sizes controlled by `unified-cards.scss` - DO NOT override in section styles
- Labels: `@include metric-label` (uppercase, `letter-spacing: 0.05em`)
- Values: `@include metric-value` (bold, `font-weight: 700`)
- Grids: `@include section-grid($min-width, $gap)` for responsive layouts
- Status/Priority: Use standardized `.status--*` and `.priority--*` classes

**Theme System** (`_colors.scss`):
- **Dark Theme** (`data-theme='night'`): React design colors (#000 background, #111 cards, orange #FF7900 primary)
- **Light Theme** (`data-theme='day'`): Inverted palette (#fff background, #fafafa cards)
- **CSS Variables**: Always use `var(--foreground)`, `var(--primary)`, never hex codes
- **Border opacity**: Dark 0.4, Light 0.3

**Tailwind Integration**:
- `styles.css` provides utility classes
- Color tokens in `tailwind.config.js` map to CSS vars
- Hero section uses Tailwind classes: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

## Critical Workflows

### Running the Application
```bash
npm start              # Dev server on :4200
npm run build          # Production build
npm test               # Karma unit tests
npm run lint:fix       # Auto-fix ESLint
```

### Adding a New Section Type

**1. Create Component** (`src/app/shared/components/cards/sections/[name]-section/`):
```typescript
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField, CardSection } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';

@Component({
  selector: 'app-my-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './my-section.component.html',
  styleUrl: './my-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MySectionComponent {
  @Input({ required: true }) section!: CardSection;
  @Output() fieldInteraction = new EventEmitter<{
    field: CardField;
    metadata?: Record<string, unknown>;
  }>();

  trackByFieldId = (index: number, field: CardField) => field.id;

  onFieldClick(field: CardField): void {
    this.fieldInteraction.emit({ field });
  }
}
```

**2. Create Styles** (`src/styles/components/sections/_my-section.scss`):
```scss
@import '../../../core/variables/colors';
@import './sections-base';

.my-section {
  &__grid {
    @include section-grid($min-width: 120px, $gap: 3px);
  }
  
  &__card {
    @include card;  // Use universal card mixin
  }
  
  &__label {
    @include metric-label;  // DO NOT set font-size
  }
  
  &__value {
    @include metric-value;  // DO NOT set font-size
  }
}
```

**3. Import Styles** (add to `src/styles.scss`):
```scss
@import 'styles/components/sections/my-section';
```

**4. Register in SectionRenderer**:
- Import component in `section-renderer.component.ts`
- Add to `imports: []` array
- Update `resolvedType` getter if needed
- Add `*ngSwitchCase` in template

**5. Update Type Union** (`src/app/models/card.model.ts`):
```typescript
type: 'info' | 'analytics' | 'my-section' | ...
```

### Performance Optimization Patterns
- **OnPush change detection**: Used in ALL components - mutate via `cdr.markForCheck()`
- **TrackBy functions**: Required in all `*ngFor` loops
- **Observables**: Prefer `shareReplay(1)` for cached streams
- **Zone coalescing**: Enabled via `provideZoneChangeDetection({ eventCoalescing: true })`

## Project-Specific Conventions

### Icons (Lucide Angular)
```typescript
// ALWAYS use LucideIconsModule wrapper
import { LucideIconsModule } from '../../../../shared/icons/lucide-icons.module';
imports: [CommonModule, LucideIconsModule]

// Template:
<lucide-icon [name]="'bar-chart-3'" size="18"></lucide-icon>
```

### Component Communication Pattern
```typescript
@Output() fieldInteraction = new EventEmitter<{
  field: CardField;
  metadata?: Record<string, unknown>;
}>();

onFieldClick(field: CardField): void {
  this.fieldInteraction.emit({
    field,
    metadata: { sectionId: this.section.id, timestamp: Date.now() }
  });
}
```
Events bubble: `SectionComponent` → `SectionRendererComponent` → `AICardRendererComponent` → `HomePageComponent`

### TrackBy Functions (Performance Critical)
```typescript
// Component:
trackByFieldId = (index: number, field: CardField) => field.id;

// Template:
<div *ngFor="let field of fields; trackBy: trackByFieldId">
```

### Type-Safe Field Access
```typescript
type AnalyticsField = CardField & {
  percentage?: number;
  trend?: 'up' | 'down' | 'stable';
};

get fields(): AnalyticsField[] {
  return (this.section.fields as AnalyticsField[]) ?? [];
}
```

## Common Debugging Scenarios

### "Section not rendering"
1. Check `SectionRendererComponent.resolvedType` mapping
2. Verify section component imported in `SectionRendererComponent.imports[]`
3. Check `*ngSwitchCase` matches `resolvedType` return
4. Validate JSON has required `id`, `title`, `type` fields

### "Change detection not firing"
1. Using OnPush? Call `cdr.markForCheck()` after mutations
2. Mutating arrays? Create new references: `this.items = [...this.items]`
3. Observable not triggering? Check `| async` in template

### "Styles not applying"
1. Check SCSS imported in `styles.scss`
2. Verify class names match between SCSS and template
3. Check CSS specificity in DevTools
4. Tailwind not working? Restart `npm start`

### "Icons not showing"
1. Import `LucideIconsModule` in component
2. Verify icon name (see lucide.dev)
3. Check size prop: `size="18"`

### "NgRx state not updating"
1. Check action dispatched (Redux DevTools)
2. Verify reducer handles action: `on(MyAction, ...)`
3. Effect not firing? Check `ofType(MyAction)`
4. Ensure state immutability in reducer

## Migration Context
Migrated from React (Vite) to Angular in 2024:
- React hooks → Angular RxJS (signals not yet adopted)
- React Context → NgRx store
- Vite → Angular CLI with Webpack
- CSS Modules → SCSS + Tailwind

Reference `Orange Sales Intelligence Cards System 5/` for original React implementation.

## Questions to Ask Before Coding
1. Does this section type already exist? (Check `SectionRendererComponent.resolvedType`)
2. Does component use OnPush? (Required for all new components except MasonryGrid)
3. Are you using `@include card` mixin for consistency?
4. Are icons from LucideIconsModule?
5. Are you mutating state correctly? (New references for OnPush)
6. Do you have trackBy functions?
7. Is styling using CSS variables, not hex codes?
8. Does design match React reference in night mode?
