# Unified Variables Application Plan

## Overview
This document outlines the systematic approach to replace all 200+ hardcoded design values across 18 section SCSS files with the new unified variable system defined in `src/styles/core/_variables.scss`.

## Phase 1: Semantic Color Replacement

### 1.1 Primary Orange Color Replacements

**Files affected:** ALL 18 section files

**Replacements to make:**

| Old Value | New Variable | Purpose | Files |
|-----------|-------------|---------|-------|
| `rgba(255, 121, 0, 0.03)` | `var(--color-orange-bg-subtle)` | Card backgrounds | All |
| `rgba(255, 121, 0, 0.06)` | `var(--color-orange-hover)` | Hover backgrounds | Most |
| `rgba(255, 121, 0, 0.08)` | `var(--color-orange-bg-light)` | Light backgrounds | _solutions, _network |
| `rgba(255, 121, 0, 0.1)` | `var(--color-orange-bg)` | Badge/icon backgrounds (LIGHT) | _list, _contact, multiple |
| `rgba(255, 121, 0, 0.15)` | `var(--color-orange-bg)` | Badge/icon backgrounds (STANDARD) | _analytics, _list, _event, _product, _network, _solutions, _chart |
| `rgba(255, 121, 0, 0.2)` | `var(--color-orange-border)` | Border default | All cards |
| `rgba(255, 121, 0, 0.3)` | `var(--color-orange-accent)` or `var(--color-orange-border)` | Strong accent/border | _contact avatar |
| `rgba(255, 121, 0, 0.4)` | `var(--color-orange-border-hover)` | Border hover / strong accent | _list, _event, _map |
| `rgba(255, 121, 0, 0.7)` | `var(--color-orange-fill)` | Progress bar fill | _analytics, _chart |

### 1.2 Status Color Replacements

**Success (Green):**
- `rgba(34, 197, 94, 0.14)` → `var(--color-success-light)` - Badge backgrounds
- `rgba(34, 197, 94, 0.4)` → `var(--color-success-border)` - Borders/accents
- Any solid `#22c55e` or `rgb(34, 197, 94)` → `var(--color-success-solid)` - Solid fills

**Warning (Amber):**
- `rgba(251, 191, 36, 0.16)` → `var(--color-warning-light)` - Badge backgrounds
- `rgba(251, 191, 36, 0.4)` → `var(--color-warning-border)` - Borders/accents
- Any solid `#fbbf24` or `rgb(251, 191, 36)` → `var(--color-warning-solid)` - Solid fills

**Error (Red):**
- `rgba(239, 68, 68, 0.18)` → `var(--color-error-light)` - Badge backgrounds
- `rgba(239, 68, 68, 0.4)` → `var(--color-error-border)` - Borders/accents
- Any solid `#ef4444` or `rgb(239, 68, 68)` → `var(--color-error-solid)` - Solid fills

**Info (Blue):**
- `rgba(59, 130, 246, 0.15)` → `var(--color-info-light)` - Badge backgrounds
- `rgba(59, 130, 246, 0.4)` → `var(--color-info-border)` - Borders/accents
- Any solid `#3b82f6` or `rgb(59, 130, 246)` → `var(--color-info-solid)` - Solid fills

**Purple:**
- `rgba(168, 85, 247, 0.16)` → `var(--color-purple-light)` - Badge backgrounds
- `rgba(168, 85, 247, 0.4)` → `var(--color-purple-border)` - Borders/accents
- Any solid `#a855f7` or `rgb(168, 85, 247)` → `var(--color-purple-solid)` - Solid fills

### 1.3 White/Gray Color Replacements

**Files affected:** _map, _fallback, _chart

- `rgba(255, 255, 255, 0.05)` → `var(--color-orange-bg-subtle)` or new white variant
- `rgba(255, 255, 255, 0.08)` → New variable `--color-white-bg-subtle`
- `rgba(128, 128, 128, 0.15)` → `var(--color-neutral-light)` - Neutral badge backgrounds

---

## Phase 2: Semantic Hover Effect Replacement

### 2.1 Card Hover Effects (Border + Background)

**Files affected:** All card-based sections

**Current patterns:**
```scss
&:hover {
  border-color: rgba(255, 121, 0, 0.4);        // Hardcoded
  background: rgba(255, 121, 0, 0.06);         // Hardcoded
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);   // Hardcoded
}
```

**Replace with:**
```scss
&:hover {
  border-color: var(--hover-border-color);
  background: var(--hover-bg-color);
  box-shadow: var(--hover-shadow);
  transition: var(--hover-transition);
}
```

### 2.2 Text/Title Hover Effects (Color Shift)

**Files affected:** _network, _overview, _text-reference, _quotation, analytics value hovers

**Current patterns:**
```scss
&:hover .section-card__title {
  color: rgba(255, 121, 0, 1);  // Hardcoded solid orange
}
```

**Replace with:**
```scss
&:hover .section-card__title {
  color: var(--hover-text-color);
  transition: var(--hover-text-transition);
}
```

### 2.3 Icon/Chevron Hover Effects (Transform)

**Files affected:** _network, _text-reference

**Current patterns:**
```scss
&:hover .section-card__chevron {
  transform: translateX(2px);
  transition: transform 0.2s ease;
}
```

**Replace with:**
```scss
&:hover .section-card__chevron {
  transform: var(--hover-transform);
  transition: var(--hover-transform-transition);
}
```

---

## Phase 3: Border Styling Standardization

### 3.1 Border Radius Consolidation

**Current values found:** 2px, 3px, 4px, 6px, 8px, 50%, 999px

**Standardized mapping:**

| Current | Use Case | New Variable |
|---------|----------|--------------|
| `2px` | Progress bars, fine details | `var(--radius-xs)` |
| `3px` | Badge hints, small accents | `var(--radius-xs)` |
| `4px` | Fallback elements | `var(--radius-xs)` |
| `6px` | Cards, main elements | `var(--card-border-radius)` |
| `8px` | Unified cards override | Check if should be `6px` or use `var(--radius-sm)` |
| `10px` | Product cards | `var(--radius-md)` |
| `50%` | Circular avatars | `var(--radius-full)` (or keep literal) |
| `999px` | Pill shapes | `var(--radius-full)` |

**Files to update:**
- _analytics.scss - Progress bars: `2px` → `var(--radius-xs)`
- _solutions.scss - Progress circles: check radius values
- _unified-cards.scss - Check if `8px` needs standardization
- Avatar sections - Keep `50%` for true circles

### 3.2 Border Color Consolidation

**Replace all hardcoded border colors with semantic variables:**
- Orange borders (0.2) → `var(--color-orange-border)`
- Orange borders (0.3) → `var(--color-orange-accent)` or check context
- Orange borders (0.4) → `var(--color-orange-border-hover)`
- Status borders → Use status-specific variables

---

## Phase 4: Font Size & Typography

### 4.1 Label Font Sizes (small text)

**Current values found:** 0.6rem, 0.65rem, 0.67rem, 0.72rem, 0.74rem, 0.75rem, 0.79rem, 0.81rem, 0.85rem

**Standardized:**
- Labels (uppercase): Use `var(--card-label-font-size)` (0.6rem)
- Meta/subtitle: Use `var(--font-section-meta)` (0.77rem)
- Small body text: Use `var(--text-xs)` (0.75rem)
- Very small hints: Use `var(--font-section-tag)` (0.67rem)

### 4.2 Value Font Sizes (medium text)

**Current values found:** 0.78rem, 0.8rem, 0.82rem, 0.85rem, 0.87rem, 0.89rem, 0.9rem, 0.92rem, 0.95rem, 0.98rem, 0.99rem

**Standardized:**
- Standard value: Use `var(--card-value-font-size)` (0.85rem)
- Large value: Use `var(--font-section-value-lg)` (0.95rem)
- Extra large (metrics): Use `var(--card-value-font-size-lg)` (1.3rem)
- Body text: Use `var(--text-sm)` (0.875rem)

### 4.3 Title Font Sizes

**Current values found:** 0.92rem, 1.02rem, 1.1rem, 1.12rem, 1.3rem, 1.52rem

**Standardized:**
- Section title: Use `var(--font-section-title)` (~1.08rem)
- Card title: Use `var(--font-section-label-lg)` or `var(--font-section-name)` (0.92-1.02rem)
- Metric value: Use `var(--card-value-font-size-lg)` (1.3rem)
- Main title: Use `var(--font-card-title)` (1.52rem)

---

## Phase 5: Spacing & Padding Consolidation

### 5.1 Padding Consolidation

**Current values found:** Direct hardcoding throughout

**Standardized mapping:**

| Old Pattern | New Variable | Use Case |
|-------------|------------|----------|
| `padding: 10px 12px` | `var(--card-padding)` | All main cards |
| `padding: 2px 4px` | `var(--spacing-sm) var(--spacing-xs)` | Tiny elements |
| `padding: 3px 6px` | `var(--tag-padding-y) var(--tag-padding-x)` | Tags/badges |
| `padding: 4px 8px` | `var(--spacing-sm) var(--spacing-lg)` | Small items |
| `padding: 16px` | `var(--spacing-4xl)` | Block padding |
| `padding: 20px` | `var(--spacing-6xl)` | Large block padding |

### 5.2 Gap Consolidation

**Replace all hardcoded gaps:**

| Old Value | New Variable | Use Case |
|-----------|------------|----------|
| `gap: 6px` | `var(--grid-gap-md)` | Mobile grid spacing |
| `gap: 8px` | `var(--card-gap)` or `var(--grid-gap-lg)` | Item spacing |
| `gap: 12px` | `var(--section-grid-gap)` | Grid spacing |

---

## Phase 6: Comprehensive File-by-File Replacement Plan

### 6.1 _analytics.scss
**Changes needed:**
- Progress bar background: rgba(255,121,0,0.15) → `var(--color-orange-bg-light)`
- Progress bar fill: rgba(255,121,0,0.7) → `var(--color-orange-fill)`
- Progress height: check if using hardcoded 3px or 6px → standardize
- Hover effect: Add `var(--hover-transition)`

### 6.2 _overview.scss
**Changes needed:**
- Card background: current → verify uses var(--card-background)
- Font sizes: Review labels/values against standardized variables
- Hover: Add standard card hover effect with `var(--hover-*)`

### 6.3 _list.scss
**Changes needed:**
- Left accent border: 3px solid rgba(255,121,0,0.4) → `3px solid var(--border-accent)`
- Icon background: rgba(255,121,0,0.15) → `var(--icon-bg-default)`
- Tag backgrounds: rgba(255,121,0,0.1) → `var(--color-orange-bg)` 
- Status colors: Map to status variables (success/warning/error/info)
- Tag padding: 3px 6px → `var(--tag-padding-y) var(--tag-padding-x)`

### 6.4 _event.scss
**Changes needed:**
- Left border accent: → `var(--border-accent)` (or status-specific)
- Status badges:
  - Success: rgba(34,197,94,0.14) → `var(--color-success-light)`
  - Warning: rgba(251,191,36,0.16) → `var(--color-warning-light)`
  - Error: rgba(239,68,68,0.18) → `var(--color-error-light)`
  - Primary: rgba(255,121,0,0.15) → `var(--color-orange-bg)`
- Icon background: → Use semantic icon variables

### 6.5 _contact.scss
**Changes needed:**
- Avatar border: 2px solid rgba(255,121,0,0.3) → `2px solid var(--color-orange-accent)`
- Avatar background: rgba(255,121,0,0.1) → `var(--color-orange-bg-light)`
- Hover effect: Standardize with other cards

### 6.6 _map.scss
**Changes needed:**
- Badge background: rgba(255,255,255,0.05) → New white variable or `var(--color-orange-bg-subtle)`
- Badge padding: 3px 6px → `var(--tag-padding-y) var(--tag-padding-x)`
- Typography: Check font sizes

### 6.7 _quotation.scss
**Changes needed:**
- Left border: 3px solid orange → `3px solid var(--border-accent)`
- Background color: → Verify uses correct variable
- Quote typography: Check font sizes

### 6.8 _chart.scss
**Changes needed:**
- Progress bar: rgba(255,121,0,0.15) → `var(--color-orange-bg-light)`
- Progress fill: rgba(255,121,0,0.7) → `var(--color-orange-fill)`
- Legend box-shadow: Check for hardcoded white opacity values
- Border radius: Check consistency

### 6.9 _product.scss
**Changes needed:**
- Icon backgrounds: Multiple hardcoded colors → Map to semantic icon variables:
  - Success: `var(--icon-bg-success)` or `var(--color-success-light)`
  - Info: `var(--icon-bg-info)` or `var(--color-info-light)`
  - Purple: `var(--icon-bg-purple)` or `var(--color-purple-light)`
  - Warning: `var(--color-warning-light)`
  - Default: `var(--icon-bg-default)`
- Badge padding: Standardize
- Font sizes: Review and standardize
- Hover: Add standard effects

### 6.10 _solutions.scss
**Changes needed:**
- Badge backgrounds: Map to semantic colors
- Progress circle colors: → status color variables
- Icon backgrounds: → semantic icon variables
- Hover effects: Standardize

### 6.11 _network.scss
**Changes needed:**
- Icon backgrounds: Multiple colors → Map by network type:
  - Social: `var(--icon-bg-social)` or status color
  - Messaging: `var(--icon-bg-messaging)` (purple)
  - Web: `var(--icon-bg-web)` (blue)
  - Payment: `var(--icon-bg-payment)` (green)
- Hover title color: solid orange → `var(--hover-text-color)`
- Chevron transform: → `var(--hover-transform)`
- Standardize transitions

### 6.12 _text-reference.scss
**Changes needed:**
- Link color: → `var(--hover-text-color)` on hover
- Typography: Check font sizes
- Padding/spacing: Standardize
- Hover effects: Link color shift

### 6.13 _financials.scss
**Changes needed:**
- Value styling: Check font sizes
- Trend colors: Map to status colors (green/red)
- Badge styling: Standardize
- Padding/spacing: Standardize

### 6.14 _overview.scss / _fallback.scss / Other files
**Changes needed:**
- Consistent background colors
- Font sizes
- Border styling
- Hover effects
- Spacing

---

## Implementation Strategy

### Step 1: Colors (Highest Priority - Most Occurrences)
1. Replace all `rgba(255, 121, 0, X)` variations
2. Replace all status colors (green, blue, purple, red, yellow)
3. Replace white/gray tints

### Step 2: Hover Effects (Medium Priority)
1. Standardize card hover effects
2. Standardize text hover effects
3. Standardize icon/transform hovers

### Step 3: Border Styling (Medium Priority)
1. Standardize border-radius values
2. Replace border color hardcodes
3. Ensure accent borders use variables

### Step 4: Typography (Lower Priority - Fewer Inconsistencies)
1. Standardize font sizes
2. Update to use semantic font variables

### Step 5: Spacing (Lower Priority)
1. Replace padding hardcodes
2. Replace gap hardcodes
3. Ensure consistency

---

## Validation Checklist

After applying all replacements:

- [ ] Build compiles without errors: `npm run build`
- [ ] No visual regressions in browser
- [ ] Theme switching (night/day) works correctly
- [ ] Responsive breakpoints work correctly (mobile, tablet, desktop)
- [ ] Hover states work as expected
- [ ] All badges show correct colors
- [ ] Progress bars display correctly
- [ ] Icons have proper backgrounds
- [ ] All text is readable with proper contrast
- [ ] No hardcoded rgba values remain (except where necessary)
- [ ] All semantic variables are used consistently

---

## Quick Reference: Variable Migration Guide

**For developers:**

When you see this in SCSS:
```scss
background: rgba(255, 121, 0, 0.15);
```

Replace with this:
```scss
background: var(--color-orange-bg);
```

Or if it's a badge:
```scss
background: var(--badge-bg-primary);
```

Or if it's an icon:
```scss
background: var(--icon-bg-default);
```

**Key variables by purpose:**

| Purpose | Variable |
|---------|----------|
| Card background | `var(--card-background)` |
| Card hover bg | `var(--color-orange-hover)` |
| Card border | `var(--color-orange-border)` |
| Card border hover | `var(--color-orange-border-hover)` |
| Badge background (success/warning/error/info) | `var(--badge-bg-[status])` |
| Icon background | `var(--icon-bg-[type])` |
| Progress bar fill | `var(--color-orange-fill)` or `var(--progress-fill-[status])` |
| Progress bar background | `var(--color-orange-bg-light)` or `var(--progress-bg-light)` |
| Left accent border | `var(--border-accent)` or `var(--border-accent-[status])` |
| Hover border color | `var(--hover-border-color)` |
| Hover text color | `var(--hover-text-color)` |
| Card padding | `var(--card-padding)` |
| Card border radius | `var(--card-border-radius)` |
| Tag padding | `var(--tag-padding-y) var(--tag-padding-x)` |
| Grid gap | `var(--section-grid-gap)` |

