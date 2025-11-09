# Section Border, Background, Label & Value Consistency Audit

**Date:** November 9, 2025  
**Status:** ❌ INCONSISTENCIES FOUND  

## Executive Summary

The section components have **significant inconsistencies** in how they color:
- **Borders** - Using different variables and hardcoded values
- **Backgrounds** - Using different opacity levels and variables
- **Labels** - Using inconsistent color approaches
- **Values** - Using inconsistent color approaches

This audit identifies all deviations and provides a standardization plan.

---

## 1. CARD BORDER INCONSISTENCIES

### Defined Standard
- **Variable:** `--card-border: 1px solid rgba(255, 121, 0, 0.2)`
- **Hover:** `--card-hover-border: rgba(255, 121, 0, 0.4)`
- **Radius:** `--card-border-radius: 6px`

### Current Deviations

| File | Border Style | Status | Issue |
|------|--------------|--------|-------|
| _sections-base.scss | `var(--card-border)` | ✅ Correct | N/A |
| _chart.scss | `var(--card-border)` | ✅ Correct | N/A |
| _unified-cards.scss | Uses @include card | ✅ Correct | N/A |
| **_contact.scss** | `2px solid var(--color-orange-accent)` | ❌ WRONG | **Wrong thickness (2px not 1px), wrong variable** |
| **_list.scss** | `1px solid var(--color-orange-accent)` | ❌ WRONG | **Uses color-orange-accent instead of card-border** |
| **_map.scss** | `1px solid var(--color-orange-accent)` | ❌ WRONG | **Uses color-orange-accent instead of card-border** |
| **_product.scss** | `1px solid var(--color-orange-accent)` | ❌ WRONG | **Uses color-orange-accent instead of card-border (multiple locations)** |
| **_network.scss** | `1px solid var(--color-orange-accent)` | ❌ WRONG | **Uses color-orange-accent instead of card-border** |
| **_solutions.scss** | `1px solid var(--color-orange-accent)` | ❌ WRONG | **Uses color-orange-accent instead of card-border** |
| **_event.scss** | Hard-coded in status styles | ❌ WRONG | **Uses hardcoded rgba values** |
| **_fallback.scss** | `1px solid rgba(128, 128, 128, 0.15)` | ❌ WRONG | **Uses grey instead of orange border** |

### Issue Count
- ❌ **9 files with border inconsistencies**
- 🔧 Need to standardize to `var(--card-border)`

---

## 2. CARD BACKGROUND INCONSISTENCIES

### Defined Standard
- **Base:** `--card-background: rgba(255, 121, 0, 0.03)` (Very subtle orange)
- **Hover:** `--card-hover-background: rgba(255, 121, 0, 0.06)`

### Current Deviations

| File | Background Style | Status | Issue |
|------|------------------|--------|-------|
| _sections-base.scss | `var(--card-background) !important` | ✅ Correct | N/A |
| _chart.scss | `var(--card-background) !important` | ✅ Correct | N/A |
| **_contact.scss** | `var(--color-orange-bg-light)` | ❌ WRONG | **Uses different semantic variable (too dark)** |
| **_list.scss** | `var(--color-orange-bg)` | ❌ WRONG | **Uses different semantic variable (too dark)** |
| **_map.scss** | `var(--color-orange-bg-subtle)` | ⚠️ CLOSE | **Similar but not standard var** |
| **_product.scss** | `var(--color-orange-bg)` & `var(--card-background)` | ❌ MIXED | **Inconsistent within same file** |
| **_network.scss** | `var(--color-orange-border)` for items | ❌ WRONG | **Uses border color as background** |
| **_solutions.scss** | `var(--color-orange-border)` | ❌ WRONG | **Uses border color as background** |
| **_event.scss** | Hard-coded `rgba(255, 121, 0, 0.15)` | ❌ WRONG | **Hardcoded, inconsistent** |
| **_fallback.scss** | `rgba(255, 255, 255, 0.01)` | ❌ WRONG | **Uses white instead of orange** |

### Issue Count
- ❌ **9 files with background inconsistencies**
- 🔧 Need to standardize to `var(--card-background)`

---

## 3. LABEL COLOR INCONSISTENCIES

### Defined Standard
- **From _sections-base.scss:** `@mixin metric-label` uses `color-mix(in srgb, var(--foreground) 55%, transparent)`
- **Should be:** Semantic variable referencing this mix

### Current Implementation

| File | Label Color Approach | Status |
|------|---------------------|--------|
| _sections-base.scss | Uses `@mixin metric-label` | ✅ Defined |
| _section-types.scss | Uses `color-mix(in srgb, var(--section-header-text))` | ⚠️ Different approach |
| **All section files** | Various approaches - no consistency | ❌ INCONSISTENT |

### Issues
- No single semantic variable for "label color"
- Different sections implement labels differently
- Some use opacity-based color-mix, others use raw variables
- **Need:** Create `--label-color` semantic variable

---

## 4. VALUE COLOR INCONSISTENCIES

### Defined Standard
- **From _sections-base.scss:** `@mixin metric-value` uses `var(--foreground)` with `font-weight: 700`
- **Should be:** Consistent across all sections

### Current Implementation

| File | Value Color | Status |
|------|-------------|--------|
| _sections-base.scss | Uses `@mixin metric-value` → `var(--foreground)` | ✅ Defined |
| **Most section files** | Directly use `var(--foreground)` | ✅ Mostly OK |

### Issues
- Less critical than borders/backgrounds
- Mostly implemented correctly
- **Minor issue:** Some sections use different opacity mixtures for "secondary values"

---

## 5. REMAINING HARDCODED RGBA VALUES

Files still using **raw rgba() values** that should use semantic variables:

### Critical (Orange rgba hardcodes)

| File | Line(s) | Current Value | Should Be |
|------|---------|---------------|-----------|
| _event.scss | 72, 79, 86, 93 | `rgba(34/251/239, ...)` status colors | Status color variables |
| _product.scss | Multiple | `rgba(255, 121, 0, ...)` in icon variants | `var(--card-border)` |
| _solutions.scss | 130, 133, 137 | `rgba(255, 121, 0, ...)` status indicators | Status color variables |
| _network.scss | 40, 46, 52, 58, 64 | Type-specific icon backgrounds | Type color variables |

### Non-Critical (Grey/White)

| File | Current Value | Issue |
|------|---------------|-------|
| _fallback.scss | `rgba(128, 128, 128, 0.15)` border | Uses grey not orange |
| _fallback.scss | `rgba(255, 255, 255, 0.01)` background | Uses white not orange |

---

## 6. INCONSISTENCY SUMMARY TABLE

| Element | Standard | Current State | Files Affected | Severity |
|---------|----------|---------------|-----------------|----------|
| **Card Borders** | `var(--card-border)` | Mixed (8 variations) | 9 files | 🔴 Critical |
| **Card Backgrounds** | `var(--card-background)` | Mixed (6 variations) | 9 files | 🔴 Critical |
| **Label Colors** | Need semantic variable | Scattered implementation | All sections | 🟡 High |
| **Value Colors** | `var(--foreground)` | Mostly correct | Minor issues | 🟢 Low |
| **Status/Type Colors** | Status variables | Hardcoded rgba | 4 files | 🔴 Critical |

---

## 7. STANDARDIZATION PLAN

### Phase 1: Create Missing Semantic Variables (in _variables.scss)
```scss
/* Label/Value Colors */
--label-color: color-mix(in srgb, var(--foreground) 55%, transparent);
--value-color: var(--foreground);

/* Card Elements - Standardized */
--card-border: 1px solid rgba(255, 121, 0, 0.2); /* Keep as is */
--card-background: rgba(255, 121, 0, 0.03);     /* Keep as is */
--card-hover-border: rgba(255, 121, 0, 0.4);     /* Keep as is */
--card-hover-background: rgba(255, 121, 0, 0.06); /* Keep as is */
```

### Phase 2: Standardize Card Borders
**Files to fix:** _contact.scss, _list.scss, _map.scss, _product.scss, _network.scss, _solutions.scss, _fallback.scss

Replace all card item borders with: `border: var(--card-border)`

### Phase 3: Standardize Card Backgrounds
**Files to fix:** _contact.scss, _list.scss, _map.scss, _product.scss, _network.scss, _solutions.scss, _fallback.scss

Replace all card item backgrounds with: `background: var(--card-background)`

### Phase 4: Standardize Labels and Values
**Update in _sections-base.scss:**
- Label mixin should use `--label-color` variable
- Value mixin should use `--value-color` variable

**Apply to all section files** through SCSS mixins

### Phase 5: Address Status/Type Colors
**Files:** _event.scss, _product.scss, _solutions.scss, _network.scss

Create specific status/type color variables and update all hardcoded values

---

## 8. FILES REQUIRING CHANGES

### Critical (Phase 1-3)
1. ✏️ _contact.scss - Update borders and backgrounds
2. ✏️ _list.scss - Update borders and backgrounds  
3. ✏️ _map.scss - Update borders and backgrounds
4. ✏️ _product.scss - Update borders and backgrounds
5. ✏️ _network.scss - Update borders and backgrounds
6. ✏️ _solutions.scss - Update borders and backgrounds
7. ✏️ _fallback.scss - Update borders and backgrounds

### Medium Priority (Phase 4-5)
8. ✏️ _event.scss - Update status colors
9. ✏️ _sections-base.scss - Add label/value color variables

### Supporting
10. ✏️ _variables.scss - Add new semantic variables

---

## 9. VERIFICATION CHECKLIST

After applying fixes, verify:

- [ ] All card items have `border: var(--card-border)` OR inherit from `@include card`
- [ ] All card items have `background: var(--card-background)` OR inherit from `@include card`
- [ ] All card hover states use `var(--card-hover-border)` and `var(--card-hover-background)`
- [ ] All labels use semantic label color variable
- [ ] All values use semantic value color variable
- [ ] No hardcoded rgba(255, 121, 0) values in section files
- [ ] Build passes: `npm run build`
- [ ] Responsive grid still works
- [ ] Visual consistency verified across all section types

---

## 10. BUILD & VALIDATION

After all changes:
```bash
npm run build          # Verify no errors
npm start              # Visual inspection
```

**Expected Result:** All sections visually consistent with unified card styling while maintaining type-specific accent colors in badges and indicators.

---

**Created:** 2025-11-09  
**Last Updated:** 2025-11-09  
**Status:** Ready for Implementation
