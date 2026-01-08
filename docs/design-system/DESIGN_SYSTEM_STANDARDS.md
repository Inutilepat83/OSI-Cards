# Design System Standards

**Last Updated:** December 2024
**Implementation Status:** Complete

## Overview

This document defines the standardized design system for OSI Cards, ensuring complete consistency across all card components for paddings, gaps, margins, borders, backgrounds, and animations.

## Core Principles

1. **Single Source of Truth** - All styling uses `--osi-section-item-*` tokens
2. **Mixin-Based Architecture** - Standardized mixins prevent inconsistencies
3. **Parameter-Driven** - Mixins accept spacing parameters to avoid overrides
4. **Consistent Animations** - Unified animation system across all components
5. **Backward Compatible** - Legacy tokens maintained with deprecation warnings

## Token System

### Primary Tokens (Use These)

All section items/fields should use these tokens:

#### Padding
- `--osi-section-item-padding` - Base padding (default: 12px)
- `--osi-section-item-padding-compact` - Compact variant (6px)
- `--osi-section-item-padding-normal` - Normal variant (12px)
- `--osi-section-item-padding-spacious` - Spacious variant (16px)

#### Gaps
- `--osi-section-item-gap` - Base gap (default: 6px)
- `--osi-section-item-gap-xs` - Extra small (2px)
- `--osi-section-item-gap-sm` - Small (4px)
- `--osi-section-item-gap-md` - Medium (8px)
- `--osi-section-item-gap-lg` - Large (12px)
- `--osi-section-item-gap-xl` - Extra large (16px)

#### Margins
- `--osi-section-item-margin-*` - Use for special cases only
- Default margins are 0 (use padding for spacing)

#### Borders
- `--osi-section-item-border` - Standard border
- `--osi-section-item-border-hover` - Hover border
- `--osi-section-item-border-width` - Border width (1px)
- `--osi-section-item-border-radius` - Border radius (var(--radius-md))

#### Backgrounds
- `--osi-section-item-background` - Standard background
- `--osi-section-item-background-hover` - Hover background

#### Shadows
- `--osi-section-item-shadow` - Standard shadow
- `--osi-section-item-shadow-hover` - Hover shadow

#### Transitions
- `--osi-section-item-transition` - Standard transition (220ms cubic-bezier)

#### Min-Heights
- `--osi-section-item-min-height-xs` - Extra small (70px)
- `--osi-section-item-min-height-sm` - Small (80px)
- `--osi-section-item-min-height-md` - Medium (90px)
- `--osi-section-item-min-height-lg` - Large (95px)
- `--osi-section-item-min-height-xl` - Extra large (110px)

#### Grid Min-Widths
- `--osi-section-item-grid-min-xs` - Extra small (120px)
- `--osi-section-item-grid-min-sm` - Small (160px)
- `--osi-section-item-grid-min-md` - Medium (180px)
- `--osi-section-item-grid-min-lg` - Large (250px)
- `--osi-section-item-grid-min-xl` - Extra large (300px)

#### Additional Spacing Tokens
- `--osi-spacing-2px` - 2px spacing
- `--osi-spacing-4px` - 4px spacing
- `--osi-spacing-6px` - 6px spacing
- `--osi-spacing-8px` - 8px spacing

#### Border Radius Tokens
- `--osi-radius-xs` - Extra small (2px)
- `--osi-radius-sm` - Small (4px)
- `--osi-radius-md` - Medium (8px)
- `--osi-radius-lg` - Large (12px)
- `--osi-radius-xl` - Extra large (16px)
- `--osi-radius-full` - Full (9999px)

### Deprecated Tokens (Avoid)

These tokens are deprecated but still work for backward compatibility:
- `--card-*` tokens (use `--osi-section-item-*` instead)
- `--section-item-*` tokens (aliases, use `--osi-section-item-*` instead)

## Mixin System

### Base Mixin

```scss
@include card($spacing: 'normal');
```

**Parameters:**
- `$spacing`: `'compact' | 'normal' | 'spacious'`

**What it provides:**
- Standardized padding, gap, border, background
- Hover states
- Focus states
- Reduced motion support

### Variant Mixins

```scss
// Elevated card (with shadow/lift)
@include card-elevated($spacing: 'normal');

// Compact card
@include card('compact');

// Glass morphism
@include card-glass($spacing: 'normal');
```

### List-Specific Mixins

```scss
// List container
@include list-container($spacing: 'normal');

// List item
@include list-item($spacing: 'normal');
```

## Component Styling Pattern

### Standard Pattern

```scss
.my-section {
  // Container uses standardized mixin
  &__container {
    @include card('normal');
  }

  // Items use standardized mixin
  &__item {
    @include card('compact');
  }
}
```

### With Animation

```scss
.my-item {
  @include card('normal');
  @include item-animation; // Add animation support
}
```

## Spacing Guidelines

### When to Use Padding
- Internal spacing within items
- Card/content spacing
- Component internal spacing

### When to Use Gap
- Spacing between items in grids/lists
- Flex/grid container spacing
- Element spacing within containers

### When to Use Margin
- Special layout cases only
- List item separation (with border-bottom)
- Negative spacing cases

## Animation Guidelines

### Standard Animation

```scss
// Apply animation mixin
@include item-animation;

// Use standard class names
.item-streaming    // During animation
.item-entered      // After animation
.item-stagger-0    // Stagger delays (0-15)
```

### Animation Timing

All animations use standardized tokens:
- Duration: `--osi-section-item-animation-duration` (220ms)
- Easing: `--osi-section-item-animation-easing` (cubic-bezier)
- Stagger: `--osi-section-item-stagger-delay` (30ms)

## Component Checklist

When creating or updating a section component:

- [ ] Uses `@include card()` or variant mixin
- [ ] Uses `--osi-section-item-*` tokens (not `--card-*`)
- [ ] Spacing uses standardized gap/padding tokens
- [ ] Borders use standardized border tokens
- [ ] Backgrounds use standardized background tokens
- [ ] Transitions use `--osi-section-item-transition`
- [ ] Animations use `@include item-animation`
- [ ] No hardcoded spacing values
- [ ] Respects `prefers-reduced-motion`
- [ ] Hover states use standardized tokens

## Migration Examples

### Before (Inconsistent)

```scss
.my-item {
  padding: 12px 16px; // Hardcoded
  gap: 8px; // Hardcoded
  min-height: 80px; // Hardcoded
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); // Hardcoded
  background: var(--card-background); // Wrong token
  border: 1px solid var(--card-border); // Wrong token
  border-radius: 2px; // Hardcoded
  transition: all 0.2s ease-out; // Custom timing
  gap: var(--osi-section-item-gap, 6px) !important; // Hardcoded fallback
}
```

### After (Standardized)

```scss
.my-item {
  @include card('normal'); // Standardized mixin
  min-height: var(--osi-section-item-min-height-sm); // Use token
  grid-template-columns: repeat(auto-fit, minmax(var(--osi-section-item-grid-min-md), 1fr)); // Use token
  border-radius: var(--osi-radius-xs); // Use token
  gap: var(--osi-section-item-gap) !important; // No hardcoded fallback
  // All properties inherited from mixin using standardized tokens
}
```

### Common Replacements

| Hardcoded Value | Token Replacement |
|----------------|-------------------|
| `6px` | `var(--osi-section-item-gap)` or `var(--osi-spacing-6px)` |
| `8px` | `var(--osi-spacing-sm)` or `var(--osi-spacing-8px)` |
| `12px` | `var(--osi-spacing-md)` or `var(--osi-section-item-padding-normal)` |
| `16px` | `var(--osi-spacing-lg)` |
| `2px` | `var(--osi-spacing-2px)` or `var(--osi-section-item-gap-xs)` |
| `4px` | `var(--osi-spacing-xs)` or `var(--osi-section-item-gap-sm)` |
| `80px` min-height | `var(--osi-section-item-min-height-sm)` |
| `90px` min-height | `var(--osi-section-item-min-height-md)` |
| `110px` min-height | `var(--osi-section-item-min-height-xl)` |
| `160px` grid min | `var(--osi-section-item-grid-min-sm)` |
| `180px` grid min | `var(--osi-section-item-grid-min-md)` |
| `300px` grid min | `var(--osi-section-item-grid-min-xl)` |
| `2px` border-radius | `var(--osi-radius-xs)` |
| `4px` border-radius | `var(--osi-radius-sm)` |
| `#ff7900` color | `var(--accent)` or `var(--osi-accent)` |
| `#ccc` color | `var(--osi-muted-foreground)` |
| `rgba(255, 255, 255, 0.08)` | `var(--osi-border-muted)` |

## File Structure

### Token Files
- `projects/osi-cards-lib/src/lib/styles/tokens/_master.scss` - All token definitions

### Mixin Files
- `projects/osi-cards-lib/src/lib/styles/components/sections/_sections-base.scss` - Base mixins
- `projects/osi-cards-lib/src/lib/styles/components/sections/_component-mixins.scss` - Variants
- `projects/osi-cards-lib/src/lib/styles/components/sections/_compact-mixins.scss` - Compact variants

### Animation Files
- `projects/osi-cards-lib/src/lib/styles/components/sections/_sections-base.scss` - Animation mixins
- `projects/osi-cards-lib/src/lib/styles/components/sections/_section-animations.scss` - Hover effects

## Quick Reference

### Token Prefix Guide

| Use Case | Token Prefix |
|----------|-------------|
| Items/Fields | `--osi-section-item-*` ✅ |
| Section Container | `--osi-section-*` |
| Card Container | `--osi-card-*` |
| Legacy (Deprecated) | `--card-*`, `--section-item-*` ⚠️ |

### Mixin Selection Guide

| Use Case | Mixin |
|----------|-------|
| Standard card | `@include card('normal')` |
| Compact spacing | `@include card('compact')` |
| Elevated/shadow | `@include card-elevated('normal')` |
| Glass effect | `@include card-glass('normal')` |
| List container | `@include list-container('normal')` |
| List item | `@include list-item('normal')` |

---

**See also:**
- [CARD_DESIGN_SYSTEM_ANALYSIS.md](./CARD_DESIGN_SYSTEM_ANALYSIS.md) - Full analysis
- [CONFLICT_MATRIX.md](./CONFLICT_MATRIX.md) - Conflict resolution
- [ANIMATION_GUIDELINES.md](./ANIMATION_GUIDELINES.md) - Animation standards
