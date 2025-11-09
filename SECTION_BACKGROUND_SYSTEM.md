# Section Background System - Main vs. Contrast

**Date**: November 9, 2025  
**Objective**: Consolidated CSS system for section container backgrounds with visual hierarchy

---

## Design Philosophy

Based on the principle: **"If everything is emphasized, nothing is emphasized"**

The section background system creates visual hierarchy by differentiating between:
- **Main sections** (lighter background) - The majority of sections providing supporting data
- **Contrast sections** (darker background) - 1-2 emphasis sections per card highlighting strategic information

---

## Visual Hierarchy

### Section Container (Outer Shell)
- ✅ **NO BORDER** - Clean, uncluttered design
- ✅ **Background varies** - Main (lighter) or Contrast (darker)
- ✅ **Padding & border-radius** - Consistent spacing and rounded corners

### Inner Cards (Content Elements)
- ✅ **Unified orange borders** - `rgba(255, 121, 0, 0.2)`
- ✅ **Unified orange backgrounds** - `rgba(255, 121, 0, 0.03)`
- ✅ **Unified hover states** - Brighter orange on interaction
- ✅ **All use `@include card` mixin** - Consistent styling

---

## CSS Variables

### Defined in `src/styles/core/_variables.scss`

#### Night Theme (Default):
```scss
:root, :root[data-theme='night'] {
  /* Main sections: lighter background for most sections (majority) */
  --section-bg-main: var(--color-gray-800);        // #232323
  
  /* Contrast sections: darker background for emphasis sections (1-2 max per card) */
  --section-bg-contrast: var(--color-gray-900);    // #000000
}
```

#### Day Theme:
```scss
:root[data-theme='day'] {
  /* Main sections: lighter background for most sections (majority) */
  --section-bg-main: var(--color-gray-50);         // #ffffff
  
  /* Contrast sections: darker background for emphasis sections (1-2 max per card) */
  --section-bg-contrast: var(--color-gray-100);    // #fcfcfc
}
```

---

## Implementation

### Section Shell (`.ai-section`)

**File**: `src/styles/components/sections/_section-shell.scss`

```scss
.ai-section {
  border: none;  /* ✅ NO BORDER on container */
  background: var(--section-bg-main);  /* ✅ Default to main */
  border-radius: var(--radius-lg);
  padding: var(--section-padding);
  // ... other properties
}

/* ✅ MAIN SECTION: Lighter background */
.ai-section--main {
  background: var(--section-bg-main);
}

/* ✅ CONTRAST SECTION: Darker background */
.ai-section--contrast {
  background: var(--section-bg-contrast);
}
```

### Section Block (`.section-block`)

**File**: `src/styles/components/sections/_section-types.scss`

```scss
.section-block {
  border: none;  /* ✅ NO BORDER on container */
  background: var(--section-bg-main);  /* ✅ Default to main */
  border-radius: var(--radius-lg);
  padding: clamp(14px, 2vw, 22px);
  // ... other properties
}

/* ✅ MAIN SECTION: Lighter background */
.section-block--main {
  --section-background: var(--section-bg-main);
}

/* ✅ CONTRAST SECTION: Darker background */
.section-block--contrast {
  --section-background: var(--section-bg-contrast);
}
```

---

## Usage in Components

### Default (No Modifier) = Main Section

```html
<!-- Defaults to main background -->
<section class="section-block section-block--metrics">
  <!-- Inner cards have orange borders -->
  <button class="section-card section-card--metric">
    ...
  </button>
</section>
```

### Explicit Main Section

```html
<!-- Explicitly set to main background -->
<section class="section-block section-block--list section-block--main">
  <button class="section-card section-card--list">
    ...
  </button>
</section>
```

### Contrast Section (For Emphasis)

```html
<!-- Darker background for emphasis -->
<div class="ai-section ai-section--contrast">
  <div class="ai-section__header">
    <h3 class="ai-section__title">Key Digital Initiatives</h3>
  </div>
  <div class="ai-section__body">
    <!-- Inner cards still have unified orange borders -->
    <button class="solution-item">
      ...
    </button>
  </div>
</div>
```

---

## Section Classification Guide

### **Main Sections** (Lighter Background) - Most Sections

Use for **supporting data** and **standard information**:

✅ **Analytics Section** - Performance metrics, KPIs  
✅ **Overview Section** - Company overview, general info  
✅ **List Section** - Tasks, items, lists  
✅ **Contact Section** - Contact cards, people  
✅ **Map Section** - Location information  
✅ **Quotation Section** - Quotes, testimonials  
✅ **Text Reference Section** - References, citations  
✅ **Chart Section** - Data visualizations  
✅ **Network Infrastructure** - Technical metrics (from screenshot)  
✅ **Recent Milestones** - Timeline events (from screenshot)

**Reasoning**: These sections provide **foundational information** and context. They should have consistent, neutral styling that doesn't compete for attention.

---

### **Contrast Sections** (Darker Background) - 1-2 Max Per Card

Use for **strategic emphasis** and **high-priority information**:

⭐ **Solutions Section** - Strategic solutions, offerings  
⭐ **Product Section** - Product catalog, key offerings  
⭐ **Event Section** - Critical timeline events  
⭐ **Financials Section** - Business-critical financial metrics  
⭐ **Key Digital Initiatives** - Strategic projects (from screenshot)

**Reasoning**: These sections contain **strategic, high-impact information** that requires visual emphasis. The darker/lighter background (depending on theme) draws the eye and signals importance.

**Rule**: Maximum **1-2 contrast sections per card**. If more emphasis is needed, reconsider the card's information architecture.

---

## Design Rationale

### Why No Borders on Section Containers?

1. **Reduced Visual Clutter**: Double borders (container + cards) create noise
2. **Cleaner Hierarchy**: Background color alone defines sections
3. **Modern Aesthetic**: Borderless containers feel lighter and more contemporary
4. **Focus on Content**: Orange borders on interactive cards draw attention to actions

### Why Two Background Levels?

1. **Visual Hierarchy**: Not all sections are equally important
2. **Attention Management**: Darker backgrounds naturally draw the eye
3. **Information Architecture**: Helps users quickly identify strategic vs. operational data
4. **Design Balance**: Prevents monotony while avoiding chaos

### Why "1-2 Max" Constraint?

1. **Emphasis Dilution**: Too many contrast sections = no contrast at all
2. **Cognitive Load**: Users need clear visual priorities
3. **Design Discipline**: Forces intentional information architecture
4. **Professional Polish**: Restraint creates sophistication

---

## Before & After Comparison

### ❌ Before (Inconsistent):
```
Section Container: Grey border + grey background
  └─ Cards: Mixed borders (some grey, some orange)
```

### ✅ After (Consolidated):
```
Section Container: NO border + main/contrast background
  └─ Cards: Unified orange borders (all cards)
```

---

## Inner Card Styling (Unchanged)

All inner cards use the **unified card system** via `@include card` mixin:

```scss
@mixin card {
  border: var(--card-border);                    // Orange: rgba(255, 121, 0, 0.2)
  background: var(--card-background);            // Orange: rgba(255, 121, 0, 0.03)
  border-radius: var(--card-border-radius);      // 6px
  padding: var(--card-padding);                  // 10px 12px
  
  &:hover {
    border-color: var(--card-hover-border);      // Orange: rgba(255, 121, 0, 0.4)
    background: var(--card-hover-background);    // Orange: rgba(255, 121, 0, 0.06)
  }
}
```

**Result**: All interactive cards maintain unified orange styling regardless of their container background.

---

## Migration Checklist

When updating existing sections:

- [ ] Remove any hardcoded borders from section containers
- [ ] Add `--main` or `--contrast` modifier to section element
- [ ] Verify inner cards still use `@include card` mixin
- [ ] Test in both day and night themes
- [ ] Ensure max 1-2 contrast sections per card
- [ ] Update component documentation

---

## Theme Switching Behavior

Both themes maintain the **same visual hierarchy**:

| Theme | Main Section | Contrast Section | Difference |
|-------|-------------|------------------|------------|
| Night | Gray-800 (#232323) | Gray-900 (#000000) | Darker = Emphasis |
| Day | Gray-50 (#ffffff) | Gray-100 (#fcfcfc) | Darker = Emphasis |

The **contrast direction is consistent**: darker background = more emphasis, regardless of theme.

---

## Example: Card with Both Section Types

```html
<div class="card-container">
  <!-- MAIN SECTION: Network Infrastructure (lighter) -->
  <section class="section-block section-block--metrics section-block--main">
    <header class="section-block__header">
      <h3>Network Infrastructure</h3>
    </header>
    <div class="section-grid section-grid--metrics">
      <button class="section-card section-card--metric">
        <!-- Orange border, subtle orange bg -->
        Connected Sites: 120
      </button>
    </div>
  </section>
  
  <!-- CONTRAST SECTION: Key Digital Initiatives (darker) -->
  <div class="ai-section ai-section--contrast">
    <div class="ai-section__header">
      <h3>Key Digital Initiatives</h3>
    </div>
    <div class="ai-section__body">
      <button class="solution-item">
        <!-- Orange border, subtle orange bg (same as main) -->
        Migrating core ERP to AWS and Azure
      </button>
    </div>
  </div>
</div>
```

**Visual Result**:
- Network Infrastructure has lighter background (supporting data)
- Key Digital Initiatives has darker background (strategic emphasis)
- Both sections' inner cards have identical orange borders and backgrounds
- Clear visual hierarchy without competing styles

---

## CSS Consolidation Benefits

### Before:
- 🔴 Inconsistent border usage
- 🔴 Multiple background color definitions
- 🔴 Scattered section-specific overrides
- 🔴 No clear hierarchy system

### After:
- ✅ Single source of truth for section backgrounds
- ✅ Clear main vs. contrast pattern
- ✅ Unified inner card styling
- ✅ Intentional visual hierarchy
- ✅ Maintainable and scalable

---

## Troubleshooting

### Issue: Section looks wrong in day theme
**Solution**: Check that `--section-bg-main` and `--section-bg-contrast` are defined in `:root[data-theme='day']` block in `_variables.scss`

### Issue: Cards inside section don't have orange borders
**Solution**: Verify the card component uses `@include card` mixin or has `.section-card` class

### Issue: Too many contrast sections on one card
**Solution**: Review information architecture - keep max 1-2 contrast sections per card. Demote less critical sections to main background.

### Issue: Section container has a border
**Solution**: Remove `border` property or set to `none` in section SCSS file

---

## Best Practices

1. **Default to Main**: Unless section needs emphasis, use main background (or no modifier)
2. **Be Intentional**: Only use contrast for truly strategic/important sections
3. **Respect the Rule**: Maximum 1-2 contrast sections per card
4. **Maintain Consistency**: Inner cards always use unified orange borders
5. **Test Both Themes**: Verify contrast works in both day and night modes
6. **Document Decisions**: If using contrast, explain why in component docs

---

## Related Documentation

- `SCSS_ARCHITECTURE_AUDIT.md` - Full SCSS system architecture
- `SECTION_PROPERTIES_USAGE_ANALYSIS.md` - How sections use unified card properties
- `UNIFIED_CARD_SYSTEM.md` - Details on the unified card mixin system

---

## Summary

The section background system provides:
- ✅ **Two semantic levels**: Main (most sections) and Contrast (1-2 max for emphasis)
- ✅ **No container borders**: Clean, modern aesthetic
- ✅ **Unified inner cards**: All cards use orange borders and backgrounds
- ✅ **Clear hierarchy**: Visual differentiation without chaos
- ✅ **Theme-aware**: Works in both day and night modes
- ✅ **Consolidated CSS**: Single source of truth for section styling

**Result**: Professional, intentional design with clear information hierarchy.
