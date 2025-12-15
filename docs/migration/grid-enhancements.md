# Grid Enhancements Migration Guide

**Version:** 2.0.0
**Last Updated:** December 2025

This guide helps you migrate existing code to use the enhanced grid system features.

---

## Breaking Changes

### 1. SectionLayoutPreferences Interface

**Before:**
```typescript
interface SectionLayoutPreferences {
  preferredColumns: 1 | 2 | 3 | 4;
  minColumns: 1 | 2 | 3 | 4;
  maxColumns: 1 | 2 | 3 | 4;
  canShrinkToFill: boolean;
  // ... no orientation support
}
```

**After:**
```typescript
interface SectionLayoutPreferences {
  // ... existing properties
  orientation?: 'vertical' | 'horizontal' | 'squared' | 'auto';
  contentDensity?: number;
  aspectRatio?: number;
}
```

**Migration:** No changes required - new properties are optional.

### 2. Preference Service Registration

**Before:**
```typescript
preferenceService.register('my-section', (section, availableColumns) => {
  return { preferredColumns: 2, ... };
});
```

**After:**
```typescript
preferenceService.register('my-section', (
  section,
  availableColumns,
  context?  // NEW: Optional LayoutContext
) => {
  return { preferredColumns: 2, ... };
});
```

**Migration:** Add optional `context` parameter. Existing code continues to work.

### 3. CardSection Orientation Type

**Before:**
```typescript
orientation?: 'vertical' | 'horizontal' | 'auto';
```

**After:**
```typescript
orientation?: 'vertical' | 'horizontal' | 'squared' | 'auto';
```

**Migration:** Update any hardcoded orientation strings to include 'squared' if needed.

---

## New Features to Adopt

### 1. Content-Responsive Sections

**Example: Contact Card Component**

```typescript
// BEFORE: Static preferences
private calculatePreferences(section, columns) {
  return {
    preferredColumns: 1,
    minColumns: 1,
    maxColumns: 2,
    // ...
  };
}

// AFTER: Content-responsive
private calculatePreferences(section, columns, context?) {
  const contactCount = section.fields?.length || 0;

  if (contactCount === 1) {
    return {
      preferredColumns: 1,
      orientation: 'squared',
      aspectRatio: 1.0,
      // ...
    };
  }

  if (contactCount === 4) {
    return {
      preferredColumns: 2,
      orientation: 'squared',
      // ...
    };
  }

  // ... handle other counts
}
```

### 2. LayoutContext Usage

**Add context-aware logic:**

```typescript
// BEFORE: Ignore context
calculatePreferences(section, columns) {
  return { preferredColumns: 2, ... };
}

// AFTER: Use context for responsive decisions
calculatePreferences(section, columns, context?) {
  // Adjust based on container width
  if (context && context.containerWidth < 768) {
    return { preferredColumns: 1, ... };
  }

  // Adjust based on breakpoint
  if (context?.currentBreakpoint === 'sm') {
    return { preferredColumns: 1, ... };
  }

  return { preferredColumns: 2, ... };
}
```

### 3. Orientation Support

**Update section components to support orientation:**

```typescript
// Component
export class MySectionComponent extends BaseSectionComponent {
  @Input() orientation: 'vertical' | 'horizontal' | 'squared' | 'auto' = 'vertical';

  ngOnInit(): void {
    // Register preferences that return orientation
    this.preferenceService.register('my-section', (section, columns, context) => {
      return {
        preferredColumns: 2,
        orientation: this.calculateOrientation(section),
        // ...
      };
    });
  }

  private calculateOrientation(section: CardSection): 'vertical' | 'horizontal' | 'squared' {
    // Logic to determine orientation
    return 'vertical';
  }
}
```

**Update templates:**

```html
<!-- BEFORE: Single layout -->
<div class="content">
  <div *ngFor="let item of section.items">{{ item.title }}</div>
</div>

<!-- AFTER: Orientation-aware -->
<div class="content" [ngClass]="'orientation-' + orientation">
  <div *ngIf="orientation === 'squared'" class="grid-squared">
    <!-- Squared layout -->
  </div>
  <div *ngIf="orientation === 'vertical'" class="stacked">
    <!-- Vertical layout -->
  </div>
  <div *ngIf="orientation === 'horizontal'" class="row">
    <!-- Horizontal layout -->
  </div>
</div>
```

**Update styles:**

```scss
// Orientation-specific styles
.content.orientation-squared {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  aspect-ratio: 1;
}

.content.orientation-vertical {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.content.orientation-horizontal {
  display: flex;
  flex-direction: row;
  gap: 12px;
}
```

### 4. Zero-Gap Algorithm (Optional)

**Enable for critical layouts:**

```typescript
// BEFORE: Standard packing
const config: LayoutConfig = {
  packingAlgorithm: 'column-based',
  // ...
};

// AFTER: Zero-gap guarantee
const config: LayoutConfig = {
  packingAlgorithm: 'zero-gap',  // NEW
  // OR use feature flag
  useZeroGapAlgorithm: true,
  // ...
};
```

**Note:** Zero-gap is more computationally expensive. Use selectively.

---

## Step-by-Step Migration

### Step 1: Update Preference Service Registration

Update all preference registrations to accept optional context:

```typescript
// Find all preference registrations
preferenceService.register('section-type', (section, columns) => {
  // ...
});

// Update to:
preferenceService.register('section-type', (section, columns, context?) => {
  // ...
});
```

### Step 2: Add Orientation Support (Optional)

1. Update `SectionLayoutPreferences` return values to include `orientation`
2. Update component templates to handle different orientations
3. Add orientation-specific styles

### Step 3: Make Sections Content-Responsive (Recommended)

1. Analyze section content (item count, field count, etc.)
2. Adjust preferences based on content
3. Return appropriate orientation and column spans

### Step 4: Test Zero-Gap Algorithm (Optional)

1. Enable zero-gap for test layouts
2. Verify space utilization improvements
3. Monitor performance impact
4. Deploy selectively based on results

---

## Testing Checklist

- [ ] All preference functions accept optional `context` parameter
- [ ] Sections with orientation support render correctly
- [ ] Content-responsive logic works for various content counts
- [ ] Grid passes LayoutContext to preference service
- [ ] Zero-gap algorithm (if enabled) produces better utilization
- [ ] Performance remains acceptable
- [ ] Backward compatibility maintained

---

## Troubleshooting

### Issue: Preferences not updating with context changes

**Solution:** Ensure cache is cleared or context is included in cache key. The service handles this automatically.

### Issue: Orientation not applying

**Solution:** Ensure:
1. Preference function returns `orientation`
2. Component template handles orientation
3. Grid passes orientation to section component

### Issue: Zero-gap algorithm too slow

**Solution:**
1. Use feature flag to enable/disable selectively
2. Consider using only for critical layouts
3. Optimize preference calculations

---

## Resources

- [API Reference](../api/GRID_ENHANCEMENTS.md)
- [Functional Requirements](../../GRID_FUNCTIONAL_REQUIREMENTS.md)
- [Implementation Plan](../../.cursor/plans/grid_layout_enhancement_implementation_19e54588.plan.md)














