# Card Design System Conflict Matrix

**Companion Document:** See [CARD_DESIGN_SYSTEM_ANALYSIS.md](./CARD_DESIGN_SYSTEM_ANALYSIS.md) for full analysis.

## Quick Reference: Mixin Conflicts

### Mixin Comparison Table

| Mixin | File | Lines | Uses Base | Padding | Border | Shadow | Hover | Cursor | Status |
|-------|------|-------|-----------|---------|--------|--------|-------|--------|--------|
| `@mixin card` | `_sections-base.scss` | 145-204 | N/A (base) | `--card-padding` | `--osi-section-item-border` | `--osi-section-item-shadow` | ✅ | ✅ | ✅ **Primary** |
| `@mixin unified-card` | `_modern-sections.scss` | 16-54 | ❌ | `var(--space-3) var(--space-4)` | `--osi-section-item-border` | ❌ | ✅ | ✅ | ⚠️ **Deprecate** |
| `@mixin section-card` | `_unified-section-style.scss` | 23-39 | ✅ card | `var(--spacing-md)` | Inherited | Inherited | ✅ | ❌ | ❌ **Remove** |
| `@mixin card-base` | `design-system/_section-base.scss` | 99-110 | N/A | `--osi-item-padding` | `var(--osi-border)` | ❌ | ❌ | ❌ | ⚠️ **Different purpose** |
| `@mixin card-elevated` | `_component-mixins.scss` | 18-22 | ✅ card | Inherited | Inherited | ✅ | ✅ | Inherited | ✅ **Variant** |
| `@mixin card-elevated` | `design-system/_section-base.scss` | 112-145 | ✅ card-base | Inherited | Inherited | ✅ | ✅ | ❌ | ❌ **Duplicate** |
| `@mixin card-glass` | `_component-mixins.scss` | 24-28 | ❌ | `var(--spacing-base)` | Inherited | Glass effect | ✅ | Inherited | ✅ **Variant** |
| `@mixin card-interactive` | `design-system/_section-base.scss` | 147-166 | ✅ card-elevated | Inherited | Inherited | Inherited | ✅ | ✅ | ✅ **Variant** |
| `@mixin card-compact` | `_compact-mixins.scss` | 51-57 | ❌ | Compact values | Inherited | Inherited | ✅ | Inherited | ✅ **Variant** |
| `@mixin section-list-container` | `_unified-section-style.scss` | 45-58 | ✅ card | `var(--spacing-md)` | Inherited | Inherited | ✅ | Inherited | ❌ **Unused** |
| `@mixin section-list-item` | `_unified-section-style.scss` | 60-78 | ❌ | `var(--spacing-sm)` | Inherited | ❌ | ✅ | ❌ | ❌ **Unused** |
| `@mixin section-card-base` | `_design-system.scss` | 336-338 | ✅ card | Inherited | Inherited | Inherited | Inherited | Inherited | ❌ **Alias only** |

### Legend
- ✅ = Feature present / Recommended
- ⚠️ = Deprecate / Different purpose
- ❌ = Remove / Duplicate / Unused
- **Primary** = Main mixin to use
- **Variant** = Extends base, keep as variant
- **Deprecate** = Keep temporarily, migrate away
- **Remove** = Can be safely removed

## Token System Conflicts

### Token Comparison Matrix

| Property | Modern Token | Legacy Token | Card Token | Recommended |
|----------|--------------|--------------|------------|-------------|
| Background | `--osi-section-item-background` | `--section-item-background` | `--card-background` | ✅ Modern |
| Background Hover | `--osi-section-item-background-hover` | `--section-item-background-hover` | `--card-background-hover` | ✅ Modern |
| Border | `--osi-section-item-border` | `--section-item-border` | `--card-border` | ✅ Modern |
| Border Hover | `--osi-section-item-border-hover` | `--section-item-border-hover` | `--card-border-hover` | ✅ Modern |
| Border Radius | `--osi-section-item-border-radius` | `--section-item-border-radius` | `--card-border-radius` | ✅ Modern |
| Shadow | `--osi-section-item-shadow` | `--section-item-box-shadow` | `--card-box-shadow` | ✅ Modern |
| Shadow Hover | `--osi-section-item-shadow-hover` | `--section-item-box-shadow-hover` | `--card-box-shadow-hover` | ✅ Modern |
| Padding | `--osi-section-item-padding` | `--section-item-padding` | `--card-padding` | ✅ Modern |
| Gap | `--osi-section-item-gap` | `--section-item-gap` | `--card-gap` | ✅ Modern |
| Transition | `--osi-section-item-transition` | `--section-item-transition` | `--card-transition` | ✅ Modern |

### Token Mapping Conflicts

**Issue:** Three token systems for the same properties

```
Modern System (--osi-section-item-*)
    ↓ aliased to
Legacy System (--section-item-*)
    ↓ but also
Card System (--card-*)
    ↓ also exists
```

**Recommendation:** Use `--osi-section-item-*` as single source of truth.

## Component Usage Patterns

### Components Using `@mixin card` (Primary)

| Component | File | Additional Overrides | Status |
|-----------|------|---------------------|--------|
| list-section | `list-section.scss:33` | Padding override | ⚠️ Remove override |
| info-section | N/A | Uses custom styling | ⚠️ Should use mixin |
| product-section | `product-section.scss:32` | None | ✅ Good |
| overview-section | `overview-section.scss:32` | None | ✅ Good |
| timeline-section | `timeline-section.scss:34` | None | ✅ Good |
| event-section | `event-section.scss:33` | None | ✅ Good |
| faq-section | `faq-section.scss:35` | None | ✅ Good |
| table-section | `table-section.scss:27` | None | ✅ Good |
| text-reference-section | `text-reference-section.scss:27` | None | ✅ Good |

**Count:** 9 components

### Components Using `@mixin card-elevated`

| Component | File | Variant | Status |
|-----------|------|---------|--------|
| analytics-section | N/A | Elevated | ✅ Good |
| brand-colors-section | `brand-colors-section.scss:45` | Elevated | ✅ Good |
| contact-card-section | `contact-card-section.scss:64` | Elevated | ✅ Good |
| financials-section | `financials-section.scss:57` | Elevated | ✅ Good |
| gallery-section | `gallery-section.scss:53` | Elevated | ✅ Good |
| network-card-section | `network-card-section.scss:49` | Elevated | ✅ Good |
| news-section | `news-section.scss:52` | Elevated | ✅ Good |
| quotation-section | `quotation-section.scss:49` | Elevated | ✅ Good |
| solutions-section | `solutions-section.scss:46` | Elevated | ✅ Good |
| social-media-section | `social-media-section.scss:47` | Elevated | ✅ Good |
| video-section | `video-section.scss:39` | Elevated | ✅ Good |

**Count:** 11 components

### Components Using `@mixin unified-card`

| Location | Count | Status |
|----------|-------|--------|
| `_all-sections.scss` | 23 instances | ❌ Legacy file, not used |

**Count:** 0 active components (legacy only)

## Specific Conflict Examples

### Conflict 1: Padding Inconsistency

**Location:** `list-section.scss`

```scss
.list-container {
  @include card;  // Gets padding from --card-padding
  padding: var(--osi-spacing-compact-sm, 6px) var(--osi-spacing-compact-md, 12px);
  // ⚠️ Immediately overrides card padding!
}
```

**Issue:** Mixin provides padding that's immediately overridden.

**Recommendation:** Either:
1. Don't include `@mixin card` if custom padding needed, OR
2. Extend mixin with padding parameter

### Conflict 2: Token System Mixing

**Location:** `info-section.scss`

```scss
.info-kpi-tile {
  background: color-mix(in srgb, var(--card-background) 98%, var(--primary) 2%);
  border: 1px solid color-mix(in srgb, var(--card-border) 40%, transparent);
  // ⚠️ Uses --card-* tokens instead of --osi-section-item-*
}
```

**Issue:** Uses legacy `--card-*` tokens instead of modern system.

**Recommendation:** Use `--osi-section-item-background` and `--osi-section-item-border`.

### Conflict 3: Duplicate Mixin Definitions

**Location:** Multiple files

```scss
// File 1: _component-mixins.scss
@mixin card-elevated {
  @include base.card;
  @include effects.elevated-card;
}

// File 2: design-system/_section-base.scss
@mixin card-elevated {
  @include card-base;
  box-shadow: var(--osi-shadow-sm);
  // Different implementation!
}
```

**Issue:** Two different implementations with same name.

**Recommendation:** Consolidate into single definition.

## Spacing Token Conflicts

### Gap/Spacing Token Comparison

| Token | Value | Usage | Status |
|-------|-------|-------|--------|
| `--osi-section-item-gap` | `var(--section-item-gap)` | Item spacing | ✅ Modern |
| `--section-item-gap` | `var(--gap-sm)` | Base value | ⚠️ Legacy |
| `--card-gap` | `var(--spacing-md)` | Card internal gap | ⚠️ Different purpose |
| `--section-element-gap` | Custom | Spacing between elements | ❌ Rename to --section-item-gap |
| `--card-element-gap-md` | Custom | Unified card gap | ⚠️ Used by unified-card only |

**Issue:** Multiple gap tokens with overlapping purposes.

**Recommendation:**
- Use `--osi-section-item-gap` for item spacing
- Rename `--section-element-gap` → `--section-item-gap`
- Deprecate `--card-element-gap-md`

## Animation System Conflicts

### Animation Mixin Comparison

| Mixin | File | Class Names | Timing | Status |
|-------|------|-------------|--------|--------|
| `@mixin section-item-animation` | `_sections-base.scss:390` | `.section-item-streaming` | 0.25s | ✅ Primary |
| `@mixin legacy-item-animation` | `_sections-base.scss:406` | `.item-streaming` | 0.25s | ⚠️ Legacy |
| `@mixin legacy-field-animation` | `_sections-base.scss:422` | `.field-streaming` | 0.25s | ⚠️ Legacy |
| `@mixin stream-animation` | `_modern-sections.scss:330` | Multiple classes | `var(--duration-moderate)` | ⚠️ Different timing |

**Issue:** Four animation mixins with different class names and timings.

**Recommendation:** Consolidate to single mixin with consistent naming.

## Recommended Consolidation

### Target Mixin Structure

```
@mixin card (base)
  ├── @mixin card-elevated (variant)
  ├── @mixin card-compact (variant)
  ├── @mixin card-glass (variant)
  └── @mixin card-interactive (variant)
```

### Target Token Structure

```
--osi-section-item-* (source of truth)
  └── --section-item-* (legacy aliases, deprecated)
```

### Migration Priority

1. **High Priority:** Remove duplicate `card-elevated` definitions
2. **High Priority:** Standardize on `@mixin card` as base
3. **Medium Priority:** Update components to use modern tokens
4. **Medium Priority:** Consolidate animation mixins
5. **Low Priority:** Remove unused mixins

---

**Last Updated:** December 2024
**Status:** Ready for migration planning
