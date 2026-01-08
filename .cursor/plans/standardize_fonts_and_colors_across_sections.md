# Standardize Fonts and Colors Across Sections

## Problem

Even though sections use typography mixins, many override with hardcoded values:
1. **Font sizes** - Hardcoded values like `0.6rem`, `0.7rem`, `1.25rem` instead of using mixins/tokens
2. **Colors** - Hardcoded colors like `#ffffff`, `rgba(255, 255, 255, 0.7)`, or inconsistent token usage
3. **Typography mixin overrides** - Using mixins but then overriding with custom font-size values

## Standard Typography Mixins

### Heading Mixins (from `_typography-system.scss`)
- `@include heading(5)` - Card/Item Title (13px, semibold)
- `@include heading(6)` - Small Item Title (11.2px, semibold)

### Body Text Mixins
- `@include body-text("small")` - Small body text (12px, normal)
- `@include body-text("base")` - Base body text (16px, normal)

### Label Mixins
- `@include typo.label-uppercase` - Uppercase labels (12px, semibold, uppercase)
- `@include typo.label-base` - Base labels (14px, semibold)

### Number Display Mixins
- `@include typo.number-display-medium` - Medium numbers (24px, semibold)
- `@include typo.number-display-small` - Small numbers (18px, semibold)

### Unified Typography Mixins (from `_unified-sections.scss`)
- `@include unified-item-title` - Item titles (14px, semibold)
- `@include unified-item-label` - Item labels (11.2px, medium, uppercase)
- `@include unified-item-value` - Item values (14px, semibold)
- `@include unified-item-description` - Item descriptions (12px, normal)
- `@include unified-number-display` - Number displays (24px, bold)

## Standard Color Tokens

### Primary Colors
- `var(--osi-foreground)` - Primary text color (preferred)
- `var(--foreground)` - Primary text color (fallback/legacy)
- `var(--osi-muted-foreground)` - Secondary/muted text color (preferred)
- `var(--muted-foreground)` - Secondary/muted text color (fallback/legacy)
- `var(--accent)` or `var(--osi-accent)` - Accent color

### Avoid
- Hardcoded colors: `#ffffff`, `#1a1a1a`, `rgba(255, 255, 255, 0.7)`
- Inconsistent token usage: mixing `--foreground` and `--osi-foreground`
- Hardcoded fallbacks: `var(--foreground, #f2f2f2)`

## Issues Found

### Font Size Overrides
1. **financials-section** - Overrides `@include typo.label-uppercase` with `font-size: 0.65rem`, overrides `@include typo.number-display-medium` with `font-size: 1.25rem`
2. **analytics-section** - Overrides `@include typo.label-uppercase` with `font-size: 0.6rem`, overrides `@include typo.number-display-medium` with `font-size: 1.02rem !important`
3. **solutions-section** - Overrides `@include heading(5)` with `font-size: 0.9375rem`
4. **text-reference-section** - Multiple hardcoded font sizes (0.7rem, 0.8125rem, 0.75rem)
5. **contact-card-section** - Many hardcoded font sizes (0.5rem, 0.625rem, 0.75rem, 0.6875rem)
6. **network-card-section** - Overrides with `font-size: 0.625rem`
7. **product-section** - Overrides with `font-size: 0.7rem`
8. **news-section** - Overrides with `font-size: 0.7rem`
9. **social-media-section** - Overrides with `font-size: 0.6rem`
10. **faq-section** - Overrides with `font-size: 0.7rem`
11. **event-section** - Overrides with `font-size: 1.125rem`, `font-size: 0.625rem`
12. **quotation-section** - Overrides with `font-size: 1.625rem`, `font-size: 0.7rem`
13. **gallery-section** - Overrides with `font-size: 0.75rem`
14. **timeline-section** - Overrides with `font-size: 0.75rem`
15. **overview-section** - Multiple hardcoded font sizes

### Color Inconsistencies
1. **financials-section** - Uses `color: var(--foreground, #f2f2f2)` (hardcoded fallback), `color: var(--muted-foreground, rgba(255, 255, 255, 0.7))`
2. **analytics-section** - Uses `color: var(--foreground, #ffffff)` (hardcoded fallback), `color: var(--muted-foreground, rgba(255, 255, 255, 0.6))`
3. **map-section** - Many hardcoded colors: `#1a1a1a`, `#ffffff`, `#2a2a2a`, `#3b82f6`, `#999999` (Leaflet-specific, may need exceptions)
4. **event-section** - Uses `color: rgba(255, 255, 255, 0.9)` (hardcoded)
5. **overview-section** - Uses `color: var(--osi-foreground-strong, #ffffff)` (hardcoded fallback)

## Standardization Rules

### Typography Rules
1. **Use typography mixins** - Don't override font-size after using mixin
2. **If custom size needed** - Use CSS tokens: `var(--osi-text-sm)`, `var(--osi-text-xs)`, etc.
3. **Remove hardcoded font-size** - Replace with mixins or tokens
4. **Consistent font-weight** - Use tokens: `var(--osi-font-semibold)`, `var(--osi-font-medium)`, etc.

### Color Rules
1. **Use OSI tokens** - Prefer `var(--osi-foreground)` over `var(--foreground)`
2. **No hardcoded colors** - Remove `#ffffff`, `rgba()` values
3. **Consistent muted colors** - Use `var(--osi-muted-foreground)`
4. **No fallback hardcoded values** - Remove `var(--foreground, #f2f2f2)` patterns

## Implementation Steps

### 1. Standardize Typography
- Remove font-size overrides after typography mixins
- Replace hardcoded font-size with mixins or tokens
- Ensure consistent use of typography mixins
- Use `var(--osi-text-*)` tokens when custom sizes needed

### 2. Standardize Colors
- Replace hardcoded colors with tokens
- Prefer `var(--osi-foreground)` over `var(--foreground)`
- Remove hardcoded fallback values
- Use `var(--osi-muted-foreground)` for secondary text

### 3. Verify Consistency
- Check all sections use standardized typography
- Check all sections use standardized colors
- Ensure no hardcoded values remain

## Files to Modify

### High Priority (Major Overrides)
- `projects/osi-cards-lib/src/lib/components/sections/financials-section/financials-section.scss` - Font and color overrides
- `projects/osi-cards-lib/src/lib/components/sections/analytics-section/analytics-section.scss` - Font and color overrides
- `projects/osi-cards-lib/src/lib/components/sections/contact-card-section/contact-card-section.scss` - Many hardcoded font sizes
- `projects/osi-cards-lib/src/lib/components/sections/map-section/map-section.scss` - Many hardcoded colors (Leaflet-specific exceptions may apply)
- `projects/osi-cards-lib/src/lib/components/sections/overview-section/overview-section.scss` - Multiple font and color issues

### Medium Priority
- `projects/osi-cards-lib/src/lib/components/sections/solutions-section/solutions-section.scss` - Font overrides
- `projects/osi-cards-lib/src/lib/components/sections/text-reference-section/text-reference-section.scss` - Multiple font sizes
- `projects/osi-cards-lib/src/lib/components/sections/network-card-section/network-card-section.scss` - Font overrides
- `projects/osi-cards-lib/src/lib/components/sections/product-section/product-section.scss` - Font overrides
- `projects/osi-cards-lib/src/lib/components/sections/news-section/news-section.scss` - Font overrides
- `projects/osi-cards-lib/src/lib/components/sections/social-media-section/social-media-section.scss` - Font overrides
- `projects/osi-cards-lib/src/lib/components/sections/faq-section/faq-section.scss` - Font overrides
- `projects/osi-cards-lib/src/lib/components/sections/event-section/event-section.scss` - Font and color overrides
- `projects/osi-cards-lib/src/lib/components/sections/quotation-section/quotation-section.scss` - Font overrides
- `projects/osi-cards-lib/src/lib/components/sections/gallery-section/gallery-section.scss` - Font overrides
- `projects/osi-cards-lib/src/lib/components/sections/timeline-section/timeline-section.scss` - Font overrides

## Success Criteria

- [ ] All typography uses mixins or tokens (no hardcoded font-size)
- [ ] No font-size overrides after typography mixins
- [ ] All colors use standardized tokens (no hardcoded colors)
- [ ] Consistent use of `var(--osi-foreground)` and `var(--osi-muted-foreground)`
- [ ] No hardcoded fallback color values
- [ ] Visual consistency across all sections
- [ ] No linter errors

## Notes

- Some sections may need custom font sizes for specific design needs - use tokens in those cases
- Map section has Leaflet-specific styling that may need hardcoded colors for third-party library
- Focus on section-item content - nested elements can have more flexibility
- Typography mixins already provide consistent sizing - avoid overrides
- When mixins provide the right size, remove font-size overrides
- When custom size is needed, use `var(--osi-text-*)` tokens instead of hardcoded rem/px values
