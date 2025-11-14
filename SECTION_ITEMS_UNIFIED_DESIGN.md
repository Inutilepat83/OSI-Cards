# Section Items Unified Design System

## Overview
All section items now use **identical styling** with no variations. This ensures 100% visual consistency across all card types in the application.

## Unified Section Items

All of the following section item types use **identical styling**:

1. `.section-card` (base)
2. `.section-card--metric`
3. `.section-card--quotation`
4. `.section-card--reference`
5. `.section-card--list`
6. `.info-row`
7. `.overview-card`
8. `.analytics-metric`
9. `.contact-card`
10. `.event-card`
11. `.event-item`
12. `.financial-card`
13. `.financial-metric`
14. `.solution-card`
15. `.solution-item`
16. `.map-card`
17. `.network-card`
18. `.product-card`
19. `.product-card--references`
20. `.product-entry`
21. `.product-reference`
22. `.chart-card`
23. `.chart-card--pie`
24. `.chart-card--legend`
25. `.fallback-card`
26. `.fallback-field`

## Global Variables

All section items use the following global variables (defined in `_variables.scss`):

### Border
- `--section-item-border`: Light grey border (theme-aware)
- `--section-item-border-hover`: Orange border on hover

### Background
- `--section-item-background`: Base background (theme-aware)
- `--section-item-background-hover`: Hover background (theme-aware)

### Border Radius
- `--section-item-border-radius`: Unified border radius (8px)

### Box Shadow
- `--section-item-box-shadow`: Base shadow
- `--section-item-box-shadow-hover`: Hover shadow with orange glow

### Padding
- `--card-padding`: Unified padding (10px)

### Gap
- `--card-gap`: Unified gap between internal elements

### Min Height
- `--card-min-height`: Unified min-height (auto)

### Transform
- `--section-item-hover-transform`: Hover transform (none - cards remain stationary)

## Theme Support

### Dark Theme (`:root[data-theme='night']`)
- Border: `rgba(233, 233, 233, 0.5)` (light grey)
- Border Hover: `rgba(255, 121, 0, 0.7)` (orange)

### Light Theme (`:root[data-theme='day']`)
- Border: `rgba(146, 153, 158, 0.7)` (dark grey)
- Border Hover: `rgba(255, 121, 0, 0.7)` (orange)

## Global Enforcement

The `_global-enforcement.scss` file ensures 100% consistency by:

1. **Overriding all local styles** with `!important`
2. **Enforcing unified padding, border, radius, gap, background, shadow**
3. **Removing any local overrides** from individual section files
4. **Applying identical hover states** to all section items

## What's Enforced

- ✅ Padding: `var(--card-padding) !important`
- ✅ Border: `var(--section-item-border) !important`
- ✅ Border Radius: `var(--section-item-border-radius) !important`
- ✅ Background: `var(--section-item-background) !important`
- ✅ Box Shadow: `var(--section-item-box-shadow) !important`
- ✅ Gap: `var(--card-gap) !important`
- ✅ Min Height: `var(--card-min-height) !important`
- ✅ Transition: Unified transition
- ✅ Hover State: Unified hover (border, background, shadow)
- ✅ Focus State: Unified focus (orange outline)

## What's NOT Enforced (Allowed Variations)

- ✅ Text colors (labels, values, meta) - can vary for hierarchy
- ✅ Typography sizes (labels, values, meta) - can vary for hierarchy
- ✅ Internal layout (flex direction, grid layout) - can vary per section
- ✅ Nested elements (badges, icons, tags) - can have their own styling
- ✅ Section-specific content styling - can vary

## Files Modified

### Core Variables
- `src/styles/core/_variables.scss`: Added section-item variables
- `src/styles/core/variables/_colors.scss`: Added theme-specific section-item borders

### Global Enforcement
- `src/styles/components/sections/_global-enforcement.scss`: Enforces unified styling on all section items

### Section Files (Theme Overrides Removed)
- `src/styles/components/sections/_info.scss`
- `src/styles/components/sections/_overview.scss`
- `src/styles/components/sections/_analytics.scss`
- `src/styles/components/sections/_contact.scss`
- `src/styles/components/sections/_event.scss`
- `src/styles/components/sections/_product.scss`
- `src/styles/components/sections/_solutions.scss`
- `src/styles/components/sections/_map.scss`
- `src/styles/components/sections/_chart.scss`
- `src/styles/components/sections/_quotation.scss`
- `src/styles/components/sections/_text-reference.scss`

### Base Mixin
- `src/styles/components/sections/_sections-base.scss`: Updated `@mixin card` to use section-item variables

## Migration Notes

1. **No local overrides allowed**: All background, border, padding, radius, gap, shadow, and hover state overrides are removed from individual section files.

2. **Theme overrides limited**: Only text color overrides are allowed in theme-specific blocks. Background and border overrides are removed.

3. **Global enforcement wins**: The `_global-enforcement.scss` file (imported last) overrides all local styles with `!important`.

4. **Consistent styling**: All section items now look identical in terms of border, background, padding, radius, gap, shadow, and hover effects.

## Testing

To verify unified styling:

1. Open the app in browser
2. Check all section item types
3. Verify they all have:
   - Same border (light grey, theme-aware)
   - Same border radius (8px)
   - Same padding (10px)
   - Same background (theme-aware)
   - Same box shadow
   - Same hover effect (orange border, background change, shadow change)
   - No transform on hover

## Benefits

1. **100% Visual Consistency**: All section items look identical
2. **Easier Maintenance**: Single source of truth for all styling
3. **Theme Support**: Automatic theme-aware borders and backgrounds
4. **No Surprises**: No local overrides can break consistency
5. **Better UX**: Consistent hover effects across all cards

