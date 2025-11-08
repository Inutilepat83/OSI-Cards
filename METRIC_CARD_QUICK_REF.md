# 🚀 Quick Reference - Metric Card System

## One-Minute Overview

**Problem Fixed:** "Industry" and "annual ICT Budget" cards now have identical styling (same function = same appearance)

**How It Works:**
1. **Variables** define properties (in `_variables.scss`)
2. **Mixins** use variables (in `_sections-base.scss`)
3. **Sections** apply mixins (in `_*.scss` files)

**Result:** Change one variable → all metric cards update instantly ✅

---

## Quick Reference Table

| Task | File | How |
|------|------|-----|
| Change padding on all metric cards | `_variables.scss` | Update `--metric-card-padding` |
| Change border on all metric cards | `_variables.scss` | Update `--metric-card-border` |
| Change label font on all metric cards | `_variables.scss` | Update `--metric-label-font-size` |
| Add new metric card section | `_my-section.scss` | Use `@include metric-card` |
| Customize just overview fonts | `_overview.scss` | Use `@include metric-card` + override font vars |
| Check if working | DevTools | Inspect two cards, compare padding/border |

---

## CSS Variables Available

```scss
/* Card Structure */
--metric-card-padding: 10px 12px;
--metric-card-min-height: 50px;
--metric-card-background: transparent;
--metric-card-border: 1px solid rgba(128, 128, 128, 0.25);
--metric-card-border-radius: 10px;
--metric-card-gap: 6px;
--metric-card-box-shadow: none;

/* Hover States */
--metric-card-hover-border: rgba(128, 128, 128, 0.4);
--metric-card-hover-background: transparent;
--metric-card-hover-transform: translateY(-1px);

/* Typography */
--metric-label-font-size: var(--font-section-label);      /* 0.62rem */
--metric-value-font-size: var(--font-section-value);      /* 0.57rem */

/* Mobile (≤768px) */
--metric-card-padding-mobile: 8px 10px;
--metric-card-min-height-mobile: 46px;
--metric-card-border-radius-mobile: 8px;
```

---

## Mixins Available

```scss
@include metric-card;      /* Base card styling */
@include metric-label;     /* Label styling */
@include metric-value;     /* Value styling */
```

---

## Common Patterns

### Pattern 1: New Metric Card Section
```scss
// In _my-section.scss
.my-metric {
  @include metric-card;    // ✅ Done!
  
  &__label {
    @include metric-label;
  }
  
  &__value {
    @include metric-value;
  }
}
```

### Pattern 2: Override Only Fonts
```scss
// In _overview.scss
.overview-card {
  @include metric-card;    // Get standard styling
  
  &__label {
    @include metric-label;
    font-size: var(--font-overview-label);  // ✅ Font override only
  }
}
```

### Pattern 3: Create Custom Variant
```scss
// In _variables.scss
--metric-card-padding-compact: 8px 10px;

// In _sections-base.scss
@mixin metric-card-compact {
  @include metric-card;
  --metric-card-padding: var(--metric-card-padding-compact);
}

// In _my-section.scss
.my-compact-card {
  @include metric-card-compact;  // ✅ Uses custom variant
}
```

---

## ❌ What NOT To Do

```scss
/* NEVER hardcode properties! */
.my-card {
  @include metric-card;
  padding: 12px 14px;         // ❌ NO!
  min-height: 60px;           // ❌ NO!
  border: 1px solid #fff;     // ❌ NO!
}

/* Instead, use variables or custom mixin */
```

---

## Sections Using This System

| Section | Card Class | File |
|---------|-----------|------|
| Analytics | `.analytics-metric` | `_analytics.scss` |
| Info | `.info-card` | `_info.scss` |
| Overview | `.overview-card` | `_overview.scss` |

---

## Verification Checklist

- [ ] Build runs: `npm run build` ✅
- [ ] App runs: `npm start` ✅
- [ ] DevTools: Industry card `padding: 10px 12px` ✅
- [ ] DevTools: ICT Budget card `padding: 10px 12px` ✅
- [ ] All cards have same border/background/gap ✅
- [ ] Mobile responsive at ≤768px ✅

---

## Key Principles

| ✅ DO | ❌ DON'T |
|------|---------|
| Use CSS variables for all properties | Hardcode pixel values |
| Use mixins consistently | Override mixin properties |
| Create new variables for variants | Duplicate mixin code |
| Document why custom styling needed | Add hardcoded exceptions |

---

## When Something Looks Wrong

1. **Inspect in DevTools** (F12)
2. **Check computed styles** for the card
3. **Look for hardcoded values** (should see CSS variables instead)
4. **Search for pattern** `padding:` or `min-height:` in section file
5. **Replace with** `@include metric-card`

---

## Emergency Contact

**If cards look inconsistent:**
1. Check `_variables.scss` - are metric-card variables defined? ✅
2. Check `_sections-base.scss` - does `@mixin metric-card` use variables? ✅
3. Check section file (e.g., `_analytics.scss`) - does `.analytics-metric` have hardcoded properties? ❌

If step 3 has hardcoded properties, remove them and use the mixin instead.

---

## Documentation Links

- **Technical Details:** `SCSS_ARCHITECTURE_FIXED.md`
- **Before/After Comparison:** `SCSS_BEFORE_AFTER.md`
- **Executive Summary:** `SCSS_FIX_SUMMARY.md`
- **Full Verification:** `SCSS_FIX_VERIFICATION.md`
- **All Documentation:** `DOCUMENTATION_INDEX.md`

---

**Status: ✅ System Deployed and Working**  
**Last Updated:** November 7, 2025
