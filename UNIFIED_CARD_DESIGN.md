# Unified Card Design System

## Problem Statement

Cards across different sections (info, overview, contact, analytics, event, list) had **inconsistent visual design and structure**:

- **3 different card mixins**: `@mixin card`, `@mixin compact-card`, `@mixin list-card`
- **Inconsistent hover effects**: Some had glow, some had accent bars, some had transform scales
- **Inconsistent padding**: Mix of custom padding values vs CSS variables
- **Inconsistent grid min-widths**: 180px, 220px, 240px across sections
- **Inconsistent typography**: Some used mixins, others had custom font-size declarations
- **Different border-radius values**: Mixing `--section-card-border-radius` and `--card-border-radius-large`

**Result:** Visual inconsistency between sections made the UI feel disjointed and unprofessional.

## Solution: Single Card Design Language

### 1. Unified Card Base Mixin

**All sections now use `@mixin card` exclusively:**

```scss
@mixin card {
  border: var(--card-border);
  border-radius: var(--section-card-border-radius);
  padding: var(--card-padding);
  background: var(--card-background);
  display: flex;
  flex-direction: column;
  gap: var(--card-gap);
  min-height: var(--card-min-height);
  cursor: pointer;
  box-shadow: var(--card-box-shadow);
  transition: border-color 0.22s, background 0.22s, box-shadow 0.22s;

  &:hover {
    border-color: var(--card-hover-border);
    background: var(--card-hover-background);
    box-shadow: var(--card-hover-shadow);
  }
}
```

**Key principles:**
- ✅ No custom hover transforms (no scale, no slide)
- ✅ No accent bars or gradient glows
- ✅ Consistent padding via `--card-padding` (12px)
- ✅ Consistent border-radius via `--section-card-border-radius` (8px)
- ✅ Consistent transitions (0.22s cubic-bezier)
- ✅ Consistent hover states (border + background + shadow only)

### 2. Standardized Grid System

**All section grids use 200px min-width:**

```scss
.overview-grid,
.analytics-metrics,
.contact-collection,
.info-matrix {
  @include section-responsive-grid(200px, var(--section-card-gap));
}
```

**Benefits:**
- Cards are same minimum width across all sections
- Consistent wrapping behavior at all viewport sizes
- Visual harmony when comparing different section types
- Same grid logic = predictable responsive behavior

### 3. Unified Typography Mixins

**All card elements use standardized typography mixins:**

| Element | Mixin | Usage |
|---------|-------|-------|
| Labels | `@mixin label-text` | Field names, categories |
| Values | `@mixin value-text` | Metric values, data points |
| Large Values | `@mixin value-text-lg` | Emphasized stats |
| Titles | `@mixin card-title-text` | Contact names, product names |
| Subtitles | `@mixin card-subtitle-text` | Roles, descriptions |
| Meta | `@mixin card-meta-text` | Change indicators, timestamps |

**Example - Before (inconsistent):**
```scss
// Info section
&__label {
  font-size: var(--card-label-font-size);
  font-weight: var(--card-label-font-weight);
  opacity: 0.75;
  text-transform: capitalize;
  letter-spacing: 0.04em;
}

// Overview section
&__label {
  @include label-text;
  margin-bottom: var(--spacing-xs);
}
```

**After (unified):**
```scss
// All sections
&__label {
  @include label-text;
}
```

### 4. Removed Card Variants

**Deprecated mixins (no longer used):**
- ❌ `@mixin compact-card` - Had radial gradient glow on hover
- ❌ `@mixin list-card` - Had left accent bar, different border-radius
- ❌ `@mixin compact-card-layout` - Custom padding overrides

**Migration:**
- All instances replaced with `@mixin card`
- Removed custom `&::before` pseudo-elements
- Removed custom hover transforms
- Removed custom padding declarations

## Files Updated

### Section Styles (8 files)
1. **`_info.scss`**
   - ✅ Replaced custom card styling with `@mixin card`
   - ✅ Label → `@mixin label-text`
   - ✅ Value → `@mixin value-text`
   - ✅ Description → `@mixin card-subtitle-text`
   - ✅ Change → `@mixin card-meta-text`
   - ✅ Grid → 200px min-width

2. **`_overview.scss`**
   - ✅ Simplified to use `@mixin card`
   - ✅ Removed custom hover effects on nested elements
   - ✅ Grid → 200px min-width

3. **`_analytics.scss`**
   - ✅ Replaced `compact-card-layout` with `@mixin card`
   - ✅ Removed redundant hover logic
   - ✅ Grid → 200px min-width

4. **`_contact.scss`**
   - ✅ Replaced `list-card` with `@mixin card`
   - ✅ Removed `&::before` accent bar
   - ✅ Removed `compact-card-layout` mixin
   - ✅ Grid → 200px min-width

5. **`_list.scss`**
   - ✅ Replaced `list-card` with `@mixin card`
   - ✅ Removed custom padding override

6. **`_event.scss`**
   - ✅ Already using `@mixin card` ✓
   - Left accent bar kept intentionally (timeline visual)

7. **`_chart.scss`**
   - ✅ Already using `@mixin card` ✓

8. **`_financials.scss`**
   - ✅ Already using `@mixin card` ✓

## Visual Consistency Checklist

✅ **Same card base** - All cards use identical border, background, padding
✅ **Same border-radius** - All cards use 8px (`--section-card-border-radius`)
✅ **Same padding** - All cards use 12px (`--card-padding`)
✅ **Same gaps** - All internal elements use `--card-gap` spacing
✅ **Same hover** - Border brightens, background shifts, shadow enhances
✅ **Same transitions** - 0.22s cubic-bezier across all effects
✅ **Same grid** - All sections use 200px min-width with 12px gap
✅ **Same typography** - All elements use standardized font size/weight mixins
✅ **No transforms** - Cards stay stationary, no scale/slide effects
✅ **No custom accents** - No gradient glows or accent bars (except events)

## Design Tokens Used

All cards now use these CSS variables:

```scss
// Card Structure
--section-card-border-radius: 8px
--card-padding: 12px
--card-gap: 8px
--section-card-gap: 12px

// Card Visual
--card-border: 1px solid rgba(...)
--card-background: rgba(...)
--card-box-shadow: (...)

// Card Hover
--card-hover-border: rgba(...)
--card-hover-background: rgba(...)
--card-hover-shadow: (...)

// Typography
--card-label-font-size
--card-label-font-weight
--card-value-font-size
--card-value-font-weight
--card-title-font-size
--card-subtitle-font-size
--card-meta-font-size
```

## Before vs After Comparison

### Info Section Cards
**Before:**
- Custom border/background/padding declarations
- Custom hover with explicit `border-color`/`background`/`box-shadow`
- Manual font-size/font-weight for labels
- 180px min-width grid

**After:**
- `@mixin card` for all styling
- Automatic hover states from mixin
- `@mixin label-text` / `@mixin value-text` for typography
- 200px min-width grid

### Overview Section Cards
**Before:**
- `@mixin card` base
- Custom hover with `.overview-card__value` color change + scale transform
- Custom hover with `.overview-card__label` color change
- 120px min-width grid (via `grid-2col`)

**After:**
- `@mixin card` (no additional hover logic)
- Typography mixins handle text styling
- 200px min-width grid

### Contact Section Cards
**Before:**
- `@mixin list-card` (different border-radius, left accent bar)
- `@mixin compact-card-layout` (custom padding)
- `&::before` pseudo-element for accent bar
- 240px min-width grid

**After:**
- `@mixin card` (unified design)
- No accent bar or custom padding
- Same visual language as other cards
- 200px min-width grid

### Analytics Section Cards
**Before:**
- `@mixin card` + `@mixin compact-card-layout`
- Redundant hover logic duplicating card mixin
- 220px min-width grid

**After:**
- `@mixin card` only
- No redundant hover styles
- 200px min-width grid

## Migration Guide for New Sections

When creating a new section with cards:

```scss
@import 'design-system';

// 1. Define grid container
.my-section-grid {
  @include section-responsive-grid(200px, var(--section-card-gap));
}

// 2. Define card
.my-section-card {
  @include card;
  
  // 3. Use typography mixins for elements
  &__label {
    @include label-text;
  }
  
  &__value {
    @include value-text;
  }
  
  &__title {
    @include card-title-text;
  }
  
  &__description {
    @include card-subtitle-text;
  }
  
  &__meta {
    @include card-meta-text;
  }
}
```

**DO NOT:**
- ❌ Add custom border/background/padding declarations
- ❌ Create custom hover effects (transforms, colors)
- ❌ Use different grid min-widths
- ❌ Manually set font-size/font-weight
- ❌ Add `&::before` pseudo-elements for decoration
- ❌ Use `@mixin compact-card` or `@mixin list-card`

## Testing Verification

Test at these viewport widths:
- **320px** - Mobile portrait (1 column expected)
- **640px** - SM breakpoint (2-3 columns expected)
- **768px** - MD breakpoint (3 columns expected)
- **1024px** - LG breakpoint (4 columns expected)

All section types should:
- ✅ Show same card border/background/shadow
- ✅ Show same card padding (12px)
- ✅ Show same border-radius (8px)
- ✅ Wrap at same container widths (200px min)
- ✅ Show consistent gaps (12px between cards)
- ✅ Use same typography sizes
- ✅ Have identical hover effects

## Build Status

✅ **Build successful** - All SCSS compiles without errors
✅ **No warnings** - (except unrelated lazy-image directive)
✅ **Live reload working** - Changes hot-reload on save

## Benefits Achieved

1. **Visual Consistency** - All cards look like they belong to the same design system
2. **Code Maintainability** - One place to update card styling (`@mixin card`)
3. **Reduced Complexity** - Removed 2 duplicate card mixins and custom hover logic
4. **Better UX** - Predictable card behavior across all sections
5. **Easier Onboarding** - New developers see one clear pattern
6. **Responsive Harmony** - All sections wrap/flow the same way
7. **Design Token Compliance** - All cards use centralized CSS variables
8. **Accessibility** - Consistent focus states and hover affordances

## Related Documentation

- `ARCHITECTURE_UNIFICATION.md` - Responsive grid system unification
- `RENDERING_OPTIMIZATIONS.md` - Performance optimizations
- `ANTI_BLUR_OPTIMIZATIONS.md` - Text rendering clarity
