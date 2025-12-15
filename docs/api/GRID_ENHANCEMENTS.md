# Grid Layout Enhancements API Reference

**Version:** 2.0.0
**Last Updated:** December 2025

This document describes the enhanced masonry grid system with content-responsive sections, dynamic layout preferences, format/orientation support, and zero-empty-space guarantee.

---

## Overview

The enhanced grid system provides:

- **Content-Responsive Sections**: Sections adapt their layout based on content (e.g., contact count)
- **Dynamic Layout Preferences**: Two-way communication between grid and sections
- **Orientation Support**: Vertical, horizontal, squared, and auto orientations
- **Zero Empty Spaces**: Aggressive gap-filling algorithms guarantee optimal space utilization
- **Layout Context**: Sections receive contextual information for intelligent layout decisions

---

## SectionLayoutPreferenceService

### Enhanced API

The `SectionLayoutPreferenceService` now supports `LayoutContext` for intelligent preference calculation.

```typescript
import { SectionLayoutPreferenceService, LayoutContext } from 'osi-cards-lib';

// Register preferences with context support
preferenceService.register('contact-card', (
  section: CardSection,
  availableColumns: number,
  context?: LayoutContext
) => {
  const contactCount = section.fields?.length || 0;

  return {
    preferredColumns: contactCount === 1 ? 1 : 2,
    minColumns: 1,
    maxColumns: 4,
    orientation: contactCount === 1 ? 'squared' : 'vertical',
    contentDensity: contactCount,
    aspectRatio: contactCount === 1 ? 1.0 : undefined,
    canShrinkToFill: true,
    canGrow: true,
  };
});

// Get preferences with context
const context: LayoutContext = {
  containerWidth: 1200,
  gridGap: 12,
  currentBreakpoint: 'lg',
  totalSections: 10,
};

const prefs = preferenceService.getPreferences(section, 4, context);
```

### LayoutContext Interface

```typescript
interface LayoutContext {
  containerWidth: number;      // Container width in pixels
  gridGap: number;             // Gap between grid items in pixels
  currentBreakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  totalSections: number;       // Total number of sections in grid
}
```

---

## Enhanced SectionLayoutPreferences

### New Properties

```typescript
interface SectionLayoutPreferences {
  // Existing properties
  preferredColumns: 1 | 2 | 3 | 4;
  minColumns: 1 | 2 | 3 | 4;
  maxColumns: 1 | 2 | 3 | 4;
  canShrinkToFill: boolean;
  shrinkPriority?: number;
  expandOnContent?: { ... };

  // New properties
  orientation?: 'vertical' | 'horizontal' | 'squared' | 'auto';
  contentDensity?: number;      // Items/fields count - helps determine expansion
  aspectRatio?: number;         // For squared layouts (width/height)
}
```

---

## CardSection Enhancements

### Updated Orientation Type

```typescript
interface CardSection {
  // ... existing properties

  orientation?: 'vertical' | 'horizontal' | 'squared' | 'auto';

  // Runtime-assigned properties (internal use)
  _assignedColSpan?: number;      // Column span assigned by grid
  _calculatedHeight?: number;     // Estimated or measured height
  _rowIndex?: number;             // Row index in grid layout
  _columnIndex?: number;          // Starting column index
}
```

---

## Contact Card Component

### Content-Responsive Logic

The contact card component automatically adapts based on contact count:

- **1 contact**: 1 column, squared format
- **2 contacts**: 1-2 columns, horizontal or vertical
- **3 contacts**: 1 column vertical (can expand to 2)
- **4 contacts**: 2 columns squared (can be 1 col vertical or 4 col horizontal)
- **5-8 contacts**: 2 columns vertical (can expand)
- **9+ contacts**: 3 columns vertical

### Usage

```typescript
// Component automatically calculates preferences based on contact count
@Component({
  template: `
    <lib-contact-card-section
      [section]="contactSection"
      [colSpan]="colSpan"
      [orientation]="orientation">
    </lib-contact-card-section>
  `
})
```

### Orientation Templates

Three orientation templates are available:

1. **Squared** (`orientation="squared"`): Grid layout with square aspect ratio
2. **Vertical** (`orientation="vertical"`): Stacked list layout
3. **Horizontal** (`orientation="horizontal"`): Row layout

---

## MasonryGridComponent Integration

### Enhanced getColSpan

The grid component now integrates with the preference service:

```typescript
// Automatic integration - no code changes needed
// Component automatically:
// 1. Gets preferences from service with LayoutContext
// 2. Respects minColumns/maxColumns constraints
// 3. Assigns orientation to sections
// 4. Stores _assignedColSpan for grid communication
```

### Layout Context Creation

The grid automatically creates and passes `LayoutContext`:

```typescript
const context: LayoutContext = {
  containerWidth: this.containerWidth,
  gridGap: this.gap,
  currentBreakpoint: this.getCurrentBreakpoint(),
  totalSections: this.sections.length,
};
```

---

## Zero-Gap Packing Algorithm

### Overview

The zero-gap algorithm guarantees optimal space utilization through 5 optimization passes:

1. **Initial FFDH Placement**: Standard column-based packing
2. **Aggressive Expansion**: Expand sections to fill gaps
3. **Section Shrinking**: Optimize by shrinking where beneficial
4. **Row Reordering**: Reorder rows for better density
5. **Final Gap Filling**: Adaptive resizing to eliminate remaining gaps

### Usage

```typescript
import { packWithZeroGapsGuarantee } from 'osi-cards-lib';

const result = packWithZeroGapsGuarantee(
  sections,
  columns,        // Number of columns
  gap,            // Gap between items
  preferenceService,  // Optional: SectionLayoutPreferenceService
  context         // Optional: LayoutContext
);

// Result includes:
// - positionedSections: Positioned sections with colSpan
// - totalHeight: Total grid height
// - utilization: Space utilization percentage
// - gapCount: Number of remaining gaps (should be 0 or minimal)
// - gapArea: Total gap area in pixels
```

### Integration with Layout Service

```typescript
// Enable zero-gap algorithm via config
const config: LayoutConfig = {
  columns: 4,
  gap: 12,
  containerWidth: 1200,
  minColumnWidth: 220,
  optimizeLayout: true,
  packingAlgorithm: 'zero-gap',  // Use zero-gap algorithm
  // OR
  useZeroGapAlgorithm: true,     // Feature flag approach
  layoutContext: { ... },         // Optional context
};

const result = layoutService.calculateLayout(sections, config, ...);
```

---

## Best Practices

### 1. Register Preferences Early

Register section preferences in `ngOnInit`:

```typescript
ngOnInit(): void {
  this.preferenceService.register('my-section',
    this.calculatePreferences.bind(this)
  );
}
```

### 2. Use LayoutContext for Responsive Logic

Leverage context for breakpoint-aware preferences:

```typescript
calculatePreferences(
  section: CardSection,
  availableColumns: number,
  context?: LayoutContext
): SectionLayoutPreferences {
  // Adjust based on breakpoint
  if (context?.currentBreakpoint === 'sm') {
    return { preferredColumns: 1, ... };
  }

  return { preferredColumns: 2, ... };
}
```

### 3. Content-Responsive Sections

Make sections adapt to content:

```typescript
calculatePreferences(section, columns, context) {
  const itemCount = section.items?.length || 0;

  return {
    preferredColumns: itemCount <= 2 ? 1 : 2,
    orientation: itemCount === 1 ? 'squared' : 'vertical',
    contentDensity: itemCount,
    // ...
  };
}
```

### 4. Zero-Gap for Critical Layouts

Use zero-gap algorithm when space utilization is critical:

```typescript
// Enable zero-gap for important layouts
const config = {
  // ...
  packingAlgorithm: 'zero-gap',
  // Performance: Zero-gap is more expensive, use selectively
};
```

---

## Performance Considerations

1. **Caching**: Preferences are cached automatically based on section + context
2. **Zero-Gap Cost**: Zero-gap algorithm is ~2-3x slower than standard packing
3. **Context Changes**: Cache is invalidated when context values change
4. **Breakpoint Detection**: Minimize breakpoint recalculation

---

## Migration Guide

See [GRID_MIGRATION_GUIDE.md](../migration/grid-enhancements.md) for detailed migration instructions.














