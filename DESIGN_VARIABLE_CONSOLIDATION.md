# Design Variable Consolidation Guide

## Problem Statement

Sections used **inconsistent spacing variables** creating visual inconsistency:
- List sections: `--spacing-lg`, `--spacing-xs`, `--spacing-md`
- Event sections: `--spacing-4xl`, `--spacing-sm`
- Overview: `--spacing-xs`, `--spacing-md`, `--spacing-sm`
- Analytics: `--spacing-xs`, `--spacing-lg`, `--spacing-md`
- Contact: `--spacing-sm`, `--spacing-xs`

**Result:** Cards in different sections had different internal spacing, making the UI feel inconsistent.

## Standardized Design Variables

### Card Structure Variables (Primary)

These are the **ONLY** variables that should be used for card internal spacing:

```scss
--card-gap: 8px              // Internal element spacing (labels, values, metadata)
--section-card-gap: 12px     // Gap between multiple cards in a grid
--card-padding: 12px         // Internal card padding
--section-padding: 12px      // Section container padding
```

### Typography Variables (Use Mixins Instead)

**DO NOT use these directly** - use typography mixins instead:

```scss
--card-label-font-size
--card-label-font-weight
--card-value-font-size
--card-title-font-size
--card-subtitle-font-size
--card-meta-font-size
```

**Use these mixins:**
- `@include label-text` → Labels, field names
- `@include value-text` → Metric values, data
- `@include card-title-text` → Titles, names
- `@include card-subtitle-text` → Descriptions, subtitles
- `@include card-meta-text` → Metadata, timestamps

### Border & Visual Variables

```scss
--section-card-border-radius: 8px     // Internal cards (smaller than sections)
--card-border-radius: 12px            // Section containers
--card-border                         // Card border color/style
--card-background                     // Card background
--card-box-shadow                     // Card shadow
```

## Migration: Spacing Variables → Standardized System

### Before (Inconsistent)

```scss
// Overview section
.overview-card {
  &__label {
    margin-bottom: var(--spacing-xs);  // ❌ Custom spacing
  }
  
  &__meta {
    gap: var(--spacing-md);            // ❌ Different gap
    margin-top: var(--spacing-sm);     // ❌ Custom margin
  }
}

// Analytics section
.analytics-metric {
  &__label {
    gap: var(--spacing-lg);            // ❌ Different from overview
  }
  
  &__progress {
    margin-top: var(--spacing-md);     // ❌ Custom margin
  }
}

// Contact section
.contact-card {
  &__details {
    gap: var(--spacing-sm);            // ❌ Different from others
  }
  
  &__header {
    @include compact-card-header(var(--spacing-xs));  // ❌ Mixin with custom gap
  }
}

// List section
.section-card--list {
  gap: var(--spacing-lg);              // ❌ Different from card default
  
  .section-card__row {
    gap: var(--spacing-lg);            // ❌ Custom gap
  }
  
  .section-card__tags {
    gap: var(--spacing-xs);            // ❌ Different gap
    margin-top: var(--spacing-xs);     // ❌ Custom margin
  }
}

// Event section
.event-card {
  gap: var(--spacing-4xl);             // ❌ Much larger than others
}

.event-item {
  border-left: 3px solid var(--section-accent);  // ❌ Custom accent
  &:hover {
    transform: var(--card-hover-transform-slide);  // ❌ Custom transform
  }
}
```

### After (Unified)

```scss
// All sections use unified card mixin
.overview-card,
.analytics-metric,
.contact-card,
.info-row,
.section-card--list,
.event-item {
  @include card;  // ✅ Sets gap: var(--card-gap) automatically
}

// Card elements follow the mixin pattern
.card-element {
  &__label {
    @include label-text;  // ✅ No custom margins/spacing
  }
  
  &__value {
    @include value-text;  // ✅ Consistent typography
  }
  
  &__meta {
    @include card-meta-text;  // ✅ Consistent styling
    gap: var(--card-gap);     // ✅ Use standardized gap
  }
  
  &__content {
    gap: var(--card-gap);     // ✅ Same gap everywhere
  }
}

// Grid containers use unified gap
.section-grid,
.event-list,
.section-list {
  gap: var(--section-card-gap);  // ✅ 12px between cards
}
```

## Files Updated

### Section Styles (7 files)

1. **`_info.scss`** ✅
   - Removed: `gap: var(--spacing-xs)`
   - Uses: `@include card` default gap

2. **`_overview.scss`** ✅
   - Removed: `margin-bottom: var(--spacing-xs)` from label
   - Changed: `gap: var(--spacing-md)` → `gap: var(--card-gap)` in meta
   - Removed: `margin-top: var(--spacing-sm)` from meta

3. **`_analytics.scss`** ✅
   - Removed: `@include compact-card-header(var(--spacing-xs))`
   - Changed: `gap: var(--spacing-lg)` → `gap: var(--card-gap)` in label
   - Removed: `margin-top: var(--spacing-md)` from progress

4. **`_contact.scss`** ✅
   - Changed: `gap: var(--spacing-sm)` → `gap: var(--card-gap)` in details
   - Removed: `@include compact-card-header(var(--spacing-xs))`
   - Removed: `@include compact-card-meta(var(--spacing-sm))`
   - Added: Explicit flex layouts with `gap: var(--card-gap)`

5. **`_list.scss`** ✅
   - Changed: `gap: var(--section-grid-gap)` → `gap: var(--section-card-gap)`
   - Removed: `gap: var(--spacing-lg)` from card (uses mixin default)
   - Changed: All `--spacing-*` → `var(--card-gap)`
   - Replaced: Manual font-size → Typography mixins

6. **`_event.scss`** ✅
   - Removed: `gap: var(--spacing-4xl)` from event-card
   - Changed: `gap: var(--section-grid-gap)` → `gap: var(--section-card-gap)`
   - Removed: Custom `border-left` accent bar
   - Removed: Custom `&:hover { transform: ... }`
   - Replaced: Manual typography → Typography mixins

7. **`_chart.scss`** (Not updated - badges/special UI)
   - Left intentionally: `--spacing-3xl` for color dot spacing
   - These are UI-specific, not card-internal spacing

## Deprecated Mixins

These mixins are **no longer used** after consolidation:

```scss
// ❌ DEPRECATED - Do not use
@mixin compact-card-layout($padding-vertical, $padding-horizontal)
@mixin compact-card-header($gap)
@mixin compact-card-meta($gap)
```

**Why deprecated:**
- Created inconsistency with custom gap values
- Bypassed unified card system
- Made spacing unpredictable across sections

**Use instead:**
```scss
// ✅ Use unified card mixin
@include card;

// ✅ Use explicit flex layouts with standardized gap
.element__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--card-gap);
}
```

## Design Token Hierarchy

### Level 1: Card Container
```scss
@include card {
  padding: var(--card-padding);              // 12px
  gap: var(--card-gap);                      // 8px (internal elements)
  border-radius: var(--section-card-border-radius);  // 8px
}
```

### Level 2: Card Elements
```scss
.card__label {
  @include label-text;  // Uses --card-label-* variables
}

.card__value {
  @include value-text;  // Uses --card-value-* variables
}

.card__content {
  gap: var(--card-gap);  // 8px between child elements
}
```

### Level 3: Card Grids
```scss
.section-grid {
  @include section-responsive-grid(200px, var(--section-card-gap));
  // 12px gap between cards
}
```

## Quick Reference: What to Use When

| Element | Variable/Mixin | Value |
|---------|---------------|-------|
| Internal card spacing | `gap: var(--card-gap)` | 8px |
| Gap between cards | `gap: var(--section-card-gap)` | 12px |
| Card padding | `padding: var(--card-padding)` | 12px |
| Label text | `@include label-text` | Auto |
| Value text | `@include value-text` | Auto |
| Title text | `@include card-title-text` | Auto |
| Subtitle text | `@include card-subtitle-text` | Auto |
| Meta text | `@include card-meta-text` | Auto |
| Card border radius | `border-radius: var(--section-card-border-radius)` | 8px |

## What NOT to Use

❌ **DO NOT USE:**
- `var(--spacing-xs)`, `var(--spacing-sm)`, `var(--spacing-md)`, `var(--spacing-lg)`, `var(--spacing-xl)`, `var(--spacing-2xl)`, `var(--spacing-3xl)`, `var(--spacing-4xl)`
- Custom `margin-top`, `margin-bottom` on card elements
- `@include compact-card-layout()`
- `@include compact-card-header()`
- `@include compact-card-meta()`
- Manual `font-size`, `font-weight`, `color` declarations
- Custom hover transforms (`scale`, `translateY`, `slide`)
- Custom accent decorations (`border-left`, `&::before` glows)

## Validation Checklist

When creating or updating a section, verify:

✅ **Card Base**
- [ ] Uses `@include card` (not compact-card or list-card)
- [ ] No custom padding override
- [ ] No custom gap override (uses mixin default)
- [ ] No custom hover effects

✅ **Card Elements**
- [ ] Labels use `@include label-text`
- [ ] Values use `@include value-text`
- [ ] Titles use `@include card-title-text`
- [ ] Descriptions use `@include card-subtitle-text`
- [ ] Meta uses `@include card-meta-text`

✅ **Spacing**
- [ ] Internal elements use `gap: var(--card-gap)` (8px)
- [ ] No `--spacing-*` variables in card internals
- [ ] No custom margins (`margin-top`, `margin-bottom`)

✅ **Grid**
- [ ] Uses `@include section-responsive-grid(200px, var(--section-card-gap))`
- [ ] Grid gap is `var(--section-card-gap)` (12px)

✅ **Visual Consistency**
- [ ] Same border-radius as other cards (8px)
- [ ] Same padding as other cards (12px)
- [ ] Same hover effect (border + background + shadow only)
- [ ] No custom decorations (accent bars, gradients)

## Benefits Achieved

1. **Visual Consistency** - All cards have identical internal spacing (8px)
2. **Predictable Layout** - Same gap between cards everywhere (12px)
3. **Reduced Complexity** - Only 2 gap variables instead of 8 spacing variables
4. **Easier Maintenance** - Change spacing in one place (CSS variables)
5. **Better Developer Experience** - Clear pattern: use `--card-gap` for internals, `--section-card-gap` for grids
6. **Typography Uniformity** - All text uses mixins, no manual font declarations
7. **Simplified Hover States** - No custom transforms, only unified card hover
8. **Removed Deprecated Mixins** - No more `compact-card-*` confusion

## Build Status

✅ **Build successful** (3.6s)
✅ **No errors**
✅ **1 warning** (unrelated lazy-image directive)

## Related Documentation

- `UNIFIED_CARD_DESIGN.md` - Card mixin consolidation
- `ARCHITECTURE_UNIFICATION.md` - Responsive grid system
- `_design-system.scss` - Typography mixin definitions
- `_variables.scss` - CSS variable definitions
