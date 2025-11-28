# Component Composition Standards

This document defines the standard patterns and conventions for creating section components in OSI Cards.

## Standard Component Pattern

All section components should follow this consistent structure:

### Component Class Structure

```typescript
@Component({
  selector: 'app-your-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './your-section.component.html',
  styleUrls: ['./your-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class YourSectionComponent extends BaseSectionComponent<CardField> {
  // Component implementation
}
```

### Required Elements

1. **Base Class**: Extend `BaseSectionComponent<T>` where T is the data type (CardField, CardItem, etc.)
2. **Change Detection**: Always use `OnPush` strategy
3. **Standalone**: All components must be standalone
4. **Imports**: Include `CommonModule` and `LucideIconsModule` as minimum

### Input/Output Pattern

```typescript
@Input() section!: CardSection;  // Required input
@Output() fieldInteraction = new EventEmitter<SectionInteraction<CardField>>();
@Output() itemInteraction = new EventEmitter<SectionInteraction<CardItem>>();
```

### Lifecycle Hooks

- `OnInit`: Initialize component state
- `OnDestroy`: Clean up subscriptions
- Avoid `OnChanges` unless necessary (OnPush handles most cases)

### TrackBy Functions

Always provide trackBy functions for `*ngFor`:

```typescript
trackByField = (_index: number, field: CardField): string =>
  field.id ?? `${field.label}-${_index}`;

trackByItem = (_index: number, item: CardItem): string =>
  item.id ?? `${item.title}-${_index}`;
```

### Event Handling

Emit events using the standard format:

```typescript
onFieldClick(field: CardField): void {
  this.fieldInteraction.emit({
    field,
    section: this.section,
    metadata: { /* additional context */ }
  });
}
```

### Styling Standards

1. Use SCSS mixins from `src/styles/core/_mixins.scss`:
   - `@include card;` - Base card styling
   - `@include section-grid;` - Grid layout
   - `@include label-text;` - Label styling
   - `@include value-text;` - Value styling

2. Use CSS custom properties (design tokens) from `src/styles/core/_variables.scss`

3. Avoid hardcoded values - use tokens

### Example Component

See `src/app/shared/components/cards/sections/info-section/` for a complete reference implementation.

## Checklist for New Components

- [ ] Extends `BaseSectionComponent`
- [ ] Uses `OnPush` change detection
- [ ] Standalone component
- [ ] Imports `CommonModule` and `LucideIconsModule`
- [ ] Implements required inputs/outputs
- [ ] Provides trackBy functions
- [ ] Uses SCSS mixins and tokens
- [ ] Emits events in standard format
- [ ] Handles empty/null states
- [ ] Accessible (ARIA labels, keyboard navigation)
- [ ] Unit tests written
- [ ] Registered in `SectionLoaderService`

## Best Practices

1. **Keep components focused** - One component, one responsibility
2. **Use composition** - Break complex components into smaller ones
3. **Leverage base class** - Don't duplicate functionality from `BaseSectionComponent`
4. **Handle edge cases** - Null checks, empty arrays, missing data
5. **Accessibility first** - Semantic HTML, ARIA labels, keyboard support
6. **Performance** - Use OnPush, trackBy, avoid unnecessary computations

## Common Patterns

### Displaying Fields

```html
<div *ngFor="let field of section.fields; trackBy: trackByField" class="info-row">
  <span class="info-label">{{ field.label }}</span>
  <span class="info-value">{{ field.value }}</span>
</div>
```

### Handling Interactions

```typescript
onItemClick(item: CardItem): void {
  this.itemInteraction.emit({
    item,
    section: this.section,
    metadata: { action: 'click' }
  });
}
```

### Conditional Rendering

```html
<div *ngIf="section.fields?.length; else emptyState">
  <!-- Content -->
</div>
<ng-template #emptyState>
  <p>No data available</p>
</ng-template>
```

## Migration Guide

When updating existing components to follow these standards:

1. Ensure component extends `BaseSectionComponent`
2. Convert to `OnPush` if not already
3. Add trackBy functions if missing
4. Update event emissions to use standard format
5. Replace hardcoded styles with mixins and tokens
6. Add accessibility attributes
7. Update tests

