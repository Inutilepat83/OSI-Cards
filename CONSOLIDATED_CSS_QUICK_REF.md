# Consolidated CSS System - Quick Reference

**Date**: November 9, 2025  
**Status**: ✅ Implemented

---

## ✅ What Was Consolidated

### Section Containers (Outer Shells)
```scss
// BEFORE: Grey borders + inconsistent backgrounds
.ai-section {
  border: var(--card-border);  // ❌ Grey border
  background: transparent;
}

// AFTER: No borders + semantic backgrounds
.ai-section {
  border: none;  // ✅ Clean design
  background: var(--section-bg-main);  // ✅ Semantic variable
}

.ai-section--main {
  background: var(--section-bg-main);  // ✅ Lighter (most sections)
}

.ai-section--contrast {
  background: var(--section-bg-contrast);  // ✅ Darker (emphasis, 1-2 max)
}
```

### Inner Cards (Content Elements)
```scss
// ✅ UNCHANGED - Already perfect!
.section-card {
  @include card;  // Orange borders, orange backgrounds, unified hover
}
```

---

## 🎨 Visual Hierarchy

```
┌─────────────────────────────────────┐
│ Section Container (no border)       │ ← Main or Contrast background
│  ┌───────────────────────────────┐  │
│  │ Card (orange border)          │  │ ← Always unified orange
│  │ • Border: rgba(255,121,0,0.2) │  │
│  │ • BG: rgba(255,121,0,0.03)    │  │
│  │ • Hover: Brighter orange      │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Card (orange border)          │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## 📋 Usage Guide

### Default (Main Section)
```html
<!-- No modifier = main background -->
<section class="section-block section-block--metrics">
  <button class="section-card section-card--metric">
    Analytics Card
  </button>
</section>
```

### Contrast Section (For Emphasis)
```html
<!-- Add --contrast for darker/lighter emphasis bg -->
<div class="ai-section ai-section--contrast">
  <div class="ai-section__header">
    <h3>Key Digital Initiatives</h3>
  </div>
  <div class="ai-section__body">
    <button class="solution-item">
      Strategic Initiative Card
    </button>
  </div>
</div>
```

---

## 🎯 Section Classification

### Main Sections (Use by Default)
- Analytics
- Overview
- List
- Contact
- Map
- Chart
- Quotation
- Text Reference
- Network Infrastructure

### Contrast Sections (1-2 Max Per Card)
- Solutions
- Product
- Financials
- Key Digital Initiatives
- Strategic Events

---

## 🔑 CSS Variables

### Night Theme
```scss
--section-bg-main: var(--color-gray-800);      // #232323 (lighter)
--section-bg-contrast: var(--color-gray-900);  // #000000 (darker)
```

### Day Theme
```scss
--section-bg-main: var(--color-gray-50);       // #ffffff (lighter)
--section-bg-contrast: var(--color-gray-100);  // #fcfcfc (darker)
```

### Card Styling (Unchanged)
```scss
--card-border: 1px solid rgba(255, 121, 0, 0.2);
--card-background: rgba(255, 121, 0, 0.03);
--card-hover-border: rgba(255, 121, 0, 0.4);
--card-hover-background: rgba(255, 121, 0, 0.06);
```

---

## ✅ Benefits

1. **Consistency**: All sections use 2 semantic backgrounds
2. **Clarity**: No borders on containers = cleaner design
3. **Hierarchy**: Contrast sections draw attention to strategic info
4. **Unified Cards**: All inner cards have orange borders
5. **Maintainability**: Single source of truth
6. **Flexibility**: Works in both themes

---

## 📦 Files Modified

1. **`src/styles/core/_variables.scss`**
   - Added `--section-bg-main` and `--section-bg-contrast` for both themes

2. **`src/styles/components/sections/_section-shell.scss`**
   - Removed border from `.ai-section`
   - Added `.ai-section--main` and `.ai-section--contrast` modifiers
   - Set default to main background

3. **`src/styles/components/sections/_section-types.scss`**
   - Removed border from `.section-block`
   - Added `.section-block--main` and `.section-block--contrast` modifiers
   - Set default to main background

---

## 🚀 Next Steps (Optional)

To complete the migration, update component templates:

```html
<!-- Analytics Section (main) -->
<section class="section-block section-block--metrics section-block--main">
  ...
</section>

<!-- Solutions Section (contrast) -->
<div class="ai-section ai-section--contrast">
  ...
</div>
```

**Note**: Without modifiers, sections default to `--main` background.

---

## 🎨 Design Philosophy

**"If everything is emphasized, nothing is emphasized."**

- **Main sections** (lighter) = 90% of sections
- **Contrast sections** (darker) = 10% of sections (1-2 max per card)
- **Inner cards** = Always unified orange styling

This creates intentional visual hierarchy without chaos.

---

## 📚 Full Documentation

See `SECTION_BACKGROUND_SYSTEM.md` for complete details including:
- Design rationale
- Migration checklist
- Troubleshooting guide
- Best practices
- Before/after comparisons
