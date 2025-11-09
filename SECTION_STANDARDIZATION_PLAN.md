# Section CSS Standardization Plan

## Overview
Standardize all section component styling to use consistent borders, padding, fonts, colors, and sizing across all 18 section types (analytics, chart, contact, event, list, map, product, quotation, solutions, network, financials, overview, info, text-reference, fallback, etc.).

## Current State Analysis

### Sections Found
1. ✅ analytics-section
2. ✅ archive-section
3. ✅ chart-section
4. ✅ contact-card-section
5. ✅ event-section
6. ✅ fallback-section
7. ✅ financials-section
8. ✅ info-section
9. ✅ list-section
10. ✅ map-section
11. ✅ network-card-section
12. ✅ overview-section
13. ✅ product-section
14. ✅ quotation-section
15. ✅ solutions-section
16. ✅ text-reference-section

### Current Issues
- **Padding Inconsistencies**: Ranges from 4px-28px (should be uniform: 10px 12px)
- **Border Radius Inconsistencies**: Ranges from 6px-24px (should be uniform: 6px)
- **Font Size Variations**: Multiple custom font sizes per section (should be: labels 0.6rem, values 0.85rem)
- **Border Styles**: Different opacity/color values (should be: 1px solid rgba(255, 121, 0, 0.2))
- **Grid Layouts**: Some use 2-column, some use auto-fit (should be forced 2-column)
- **Color Inconsistencies**: Different accent colors used per section

---

## Standardization Rules (Per Copilot Instructions)

### 1. **Unified Card Base**
All cards MUST use:
```scss
// Padding: 10px 12px (not 20px)
--card-padding: 10px 12px;

// Border-radius: 6px (not 24px)
--card-border-radius: 6px;

// Border: 1px solid with orange opacity
--card-border: 1px solid rgba(255, 121, 0, 0.2);

// Consistent hover state
--card-hover-border: rgba(255, 121, 0, 0.4);
--card-hover-background: rgba(255, 121, 0, 0.06);
```

### 2. **Unified Typography**
All cards MUST use:
- **Label Font Size**: `0.6rem` (with text-transform: uppercase, letter-spacing: 0.04em)
- **Value Font Size**: `0.85rem` (with font-weight: 600)
- **Analytics/Large Values**: `1.3rem` (for special emphasis)
- **Font Weight**: Labels 600, Values 700

### 3. **Unified Colors**
All cards MUST use:
- **Primary Brand**: `rgba(255, 121, 0, 1)` (orange)
- **Accent Variants**: 
  - Hover: `rgba(255, 121, 0, 0.4)` (40%)
  - Background: `rgba(255, 121, 0, 0.06)` (6%)
  - Strong: `rgba(255, 121, 0, 0.8)` (80%)
- **Text Color**: Use `var(--foreground)` or opacity mix-ins
- **NO** hardcoded hex colors - always use `rgba(255, 121, 0, 0.X)` for orange

### 4. **Grid Layouts**
All section grids MUST:
- Force **2-column layout** (except mobile: 1 column)
- Use: `grid-template-columns: repeat(2, 1fr);`
- Mobile breakpoint: `(max-width: 500px)` → `grid-template-columns: 1fr;`

### 5. **Spacing & Gaps**
All internal spacing MUST use CSS variables:
- Gap between cards: `var(--section-grid-gap)` = 12px
- Internal card gap: `var(--card-gap)` = 8px
- Padding inside cards: `var(--card-padding)` = 10px 12px

---

## Implementation Plan

### Phase 1: Update CSS Variables (src/styles/core/_variables.scss)
**Changes:**
- [ ] Update `--card-padding` from `20px` to `10px 12px`
- [ ] Update `--card-border-radius` from `24px` to `6px`
- [ ] Update `--card-border` to use `rgba(255, 121, 0, 0.2)`
- [ ] Update `--card-hover-border` to use `rgba(255, 121, 0, 0.4)`
- [ ] Update `--card-label-font-size` to `0.6rem`
- [ ] Update `--card-value-font-size` to `0.85rem`
- [ ] Add `--card-value-font-size-lg: 1.3rem` for analytics

### Phase 2: Update Base Mixin (src/styles/components/sections/_sections-base.scss)
**Changes:**
- [ ] Update `@mixin card` to enforce new padding/border-radius
- [ ] Update `@mixin metric-label` to enforce `0.6rem`
- [ ] Update `@mixin metric-value` to enforce `0.85rem`
- [ ] Standardize all hover states
- [ ] Add mobile responsive adjustments

### Phase 3: Update Unified Cards (src/styles/components/sections/_unified-cards.scss)
**Changes:**
- [ ] Apply new font sizes to `%unified-card-label`
- [ ] Apply new font sizes to `%unified-card-value`
- [ ] Ensure all card classes inherit from unified mixin
- [ ] Add override for analytics large values (1.3rem)

### Phase 4: Update Individual Section SCSS Files (11 files)
**Files to Update:**
- `_analytics.scss` - Enforce 2-column grid, update font sizes
- `_chart.scss` - Update padding/border-radius, fix grid layout
- `_contact.scss` - Standardize card styling, update typography
- `_event.scss` - Use unified card mixin, fix spacing
- `_list.scss` - Enforce 2-column grid, fix borders
- `_map.scss` - Update card base, fix typography
- `_overview.scss` - Enforce grid layout, update fonts
- `_product.scss` - Major overhaul: consistent cards, unified spacing
- `_quotation.scss` - Update card styling, fix border colors
- `_solutions.scss` - Read & standardize
- `_text-reference.scss` - Read & standardize
- `_financials.scss` - Read & standardize
- `_network.scss` - Read & standardize
- `_fallback.scss` - Read & standardize

### Phase 5: Verify & Test
**Checklist:**
- [ ] All cards render with 10px 12px padding
- [ ] All cards have 6px border-radius
- [ ] All cards have orange borders with 0.2 opacity
- [ ] All labels are 0.6rem
- [ ] All values are 0.85rem (or 1.3rem for analytics)
- [ ] All grids are 2-column on desktop, 1-column on mobile
- [ ] Hover states work consistently
- [ ] No hardcoded colors (all use rgba)
- [ ] Mobile responsiveness maintained

---

## Files to Modify (Summary)

### Critical (Must Update):
1. `src/styles/core/_variables.scss` - Update CSS custom properties
2. `src/styles/components/sections/_sections-base.scss` - Update mixins
3. `src/styles/components/sections/_unified-cards.scss` - Update typography
4. `src/styles/components/sections/_analytics.scss`
5. `src/styles/components/sections/_chart.scss`
6. `src/styles/components/sections/_contact.scss`
7. `src/styles/components/sections/_event.scss`
8. `src/styles/components/sections/_list.scss`
9. `src/styles/components/sections/_map.scss`
10. `src/styles/components/sections/_overview.scss`
11. `src/styles/components/sections/_product.scss`
12. `src/styles/components/sections/_quotation.scss`

### Important (Review & Standardize):
13. `src/styles/components/sections/_solutions.scss`
14. `src/styles/components/sections/_text-reference.scss`
15. `src/styles/components/sections/_financials.scss`
16. `src/styles/components/sections/_network.scss`
17. `src/styles/components/sections/_fallback.scss`

---

## Expected Outcomes

### Before Standardization
- Cards with varying padding (4px - 28px)
- Borders with different radius (6px - 24px)
- Font sizes inconsistent (6 different sizes per section)
- Grid layouts mixed (2-col, auto-fit, 3-col, etc.)
- Colors not uniform

### After Standardization
✅ All cards: 10px 12px padding
✅ All cards: 6px border-radius
✅ All cards: orange border rgba(255, 121, 0, 0.2)
✅ All cards: labels 0.6rem, values 0.85rem
✅ All grids: forced 2-column (desktop), 1-column (mobile)
✅ All colors: unified orange system with opacity variants
✅ All hover states: consistent elevation & color shift

---

## Ready to Implement?
Once approved, I will:
1. Update all CSS variables and mixins
2. Systematically update each section SCSS file
3. Verify grid layouts and responsive behavior
4. Test color consistency
5. Ensure no visual regressions

Proceed with implementation? (Y/N)
