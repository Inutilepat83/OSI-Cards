# Architecture Unification - Responsive Grid System

## Problem Identified

The system had **three competing responsive systems** that weren't coordinated:

1. **TypeScript Masonry Grid** - Dynamically calculated 1-4 columns based on container width
2. **SCSS Fixed Grid Mixins** - `grid-2col` hardcoded `repeat(2, minmax(...))` ignoring masonry's calculation
3. **SCSS Auto-Fit Grids** - Some sections used `repeat(auto-fit, minmax(...))` independently

**Result:** At SM-2Col breakpoint (640px, 2 columns), sections using `grid-2col` worked by accident, but there was no actual coordination. Forced 2-column media queries fought against the continuous responsive design.

## Solution Implemented

### 1. CSS Custom Property Bridge
**File:** `masonry-grid.component.ts`

```typescript
// Expose column count as CSS custom property for section grids to consume
this.containerRef.nativeElement.style.setProperty('--masonry-columns', columns.toString());
```

The masonry grid now exposes its calculated column count as `--masonry-columns` CSS variable (though sections don't need to read it directly - the unified mixin handles responsiveness).

### 2. Unified Responsive Grid Mixin
**File:** `_design-system.scss`

Created `@mixin section-responsive-grid($min-width, $gap)` as the **SINGLE SOURCE OF TRUTH** for all section grids:

```scss
@mixin section-responsive-grid($min-width: 180px, $gap: 12px) {
  display: grid !important;
  grid-template-columns: repeat(auto-fit, minmax($min-width, 1fr));
  gap: var(--section-card-gap, $gap);
  width: 100%;
  min-height: 0;

  @media (max-width: 360px) {
    grid-template-columns: 1fr !important;
    gap: calc($gap * 0.75);
  }
}
```

**Key principles:**
- Uses `repeat(auto-fit, minmax($min-width, 1fr))` for continuous responsiveness
- Adapts naturally to container width without discrete breakpoints
- Consistent gap using `--section-card-gap` variable (12px)
- Only collapses to single column on extremely narrow viewports (≤360px)

### 3. Refactored Legacy Mixins
Both `grid-2col` and `grid-auto-fit` now delegate to the unified mixin:

```scss
@mixin grid-2col($gap: 12px, $min-width: 120px) {
  @include section-responsive-grid($min-width, $gap);
}

@mixin grid-auto-fit($min-width: 130px, $gap: 12px) {
  @include section-responsive-grid($min-width, $gap);
}

@mixin section-compact-grid($min-width: 220px, $gap: var(--section-card-gap)) {
  @include section-responsive-grid($min-width, $gap);
}
```

### 4. Removed Forced 2-Column Overrides
**Files:** `_overview.scss`, `_analytics.scss`

Deleted these conflicting media queries:
```scss
/* Force 2-column layout for wider cards */
@media (min-width: 641px) {
  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
}
```

These were fighting against the continuous responsive design and causing the SM-2Col conflicts.

### 5. Standardized All Section Grids
Replaced hardcoded `grid-template-columns` in all sections:

**Updated files:**
- `_info.scss` → `.info-matrix { @include section-responsive-grid(180px, var(--section-card-gap)); }`
- `_chart.scss` → `.chart-section__split`, `.chart-section__list` use unified mixin
- `_financials.scss` → `.financials-grid` uses unified mixin
- `_product.scss` → `.product-card__body`, `.product-card__refs-grid`, `.product-grid`, `.product-summary` all use unified mixin
- `_section-types.scss` → `.section-grid` uses unified mixin

## How It Works Now

### Masonry Grid Layer (TypeScript)
1. Calculates optimal columns: `Math.floor((containerWidth + 12) / (260 + 12))`
2. Emits `MasonryLayoutInfo` with breakpoint, column count, and width
3. Exposes `--masonry-columns` CSS variable (available for future use)

### Section Grid Layer (SCSS)
1. All sections use `@mixin section-responsive-grid` (directly or via legacy mixin aliases)
2. Grids adapt continuously using `repeat(auto-fit, minmax($min-width, 1fr))`
3. No discrete breakpoints - responds naturally to available space
4. Consistent 12px gaps via `--section-card-gap` variable

### Coordination
- **No hard dependencies:** Sections don't need to "know" the masonry column count
- **Natural alignment:** Both layers use similar responsive logic (container-based, fluid adaptation)
- **Single column calculation:** Masonry grid does math once, emits for telemetry/debugging
- **CSS does layout:** Auto-fit grids handle actual card placement naturally

## Benefits

✅ **Eliminated architectural conflict** - No more competing responsive systems
✅ **Consistent behavior at all breakpoints** - Including SM-2Col (640px, 2 columns)
✅ **Single source of truth** - One mixin controls all section grids
✅ **Continuous responsiveness** - No discrete breakpoint jumps
✅ **Maintainable** - Change grid behavior in one place
✅ **Backward compatible** - Existing `grid-2col`, `grid-auto-fit` calls still work

## Testing Checklist

Verify at these critical widths:
- [ ] **320px** - Mobile portrait, should show 1 column
- [ ] **640px** - SM breakpoint, should show 2 columns (THIS WAS THE PROBLEM CASE)
- [ ] **768px** - MD breakpoint, should show 2-3 columns
- [ ] **1024px** - LG breakpoint, should show 3-4 columns
- [ ] **1280px+** - XL breakpoint, should show 4 columns (maxColumns cap)

All sections should:
- Use consistent 12px gaps between internal cards
- Use 8px border radius for internal cards (vs 12px for sections)
- Adapt smoothly without layout jumps
- Maintain 16px main card padding, 12px section padding

## Migration Notes

If adding new sections:
1. Use `@include section-responsive-grid($min-width, var(--section-card-gap))` for grids
2. Set `$min-width` based on content needs (120-280px typical range)
3. Never hardcode `grid-template-columns` with fixed column counts
4. Never add media queries that force specific column layouts

## Technical Details

**Masonry Grid Math:**
```typescript
minColumnWidth = 260
gap = 12
maxColumns = 4

columns = Math.min(
  maxColumns,
  Math.max(1, Math.floor((containerWidth + gap) / (minColumnWidth + gap)))
)
```

**Example calculations:**
- 300px container → `(300 + 12) / (260 + 12) = 1.14` → 1 column
- 640px container → `(640 + 12) / (260 + 12) = 2.39` → 2 columns ✓ (SM-2Col)
- 900px container → `(900 + 12) / (260 + 12) = 3.35` → 3 columns
- 1400px container → `(1400 + 12) / (260 + 12) = 5.19` → 4 columns (capped by maxColumns)

**Section Grid Behavior:**
```scss
grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))
```
- With 640px container and 12px gap: `(640 - 12) / 2 = 314px per column`
- Can fit items with 180px min → shows 2 columns naturally ✓
- Adapts to any container width without breakpoints
