# Design Variables Consistency Audit Report

## Executive Summary
This report documents all inconsistencies found across sections' CSS and HTML components regarding background colors, hover effects, borders, and font sizes. The goal is to create a unified design system with consistent CSS variables.

---

## 1. Background Colors - Current Inconsistencies

### Issue: Inconsistent Background Colors for Cards/Icons

#### Primary Background Variations Found:
```scss
// Main card backgrounds
--card-background: rgba(255, 121, 0, 0.03);      // Orange tint - STANDARD
rgba(255, 121, 0, 0.03);                        // Direct value (redundant)
rgba(255, 255, 255, 0.05);                      // White tint (map badges)
rgba(255, 255, 255, 0.01);                      // Fallback section
color-mix(in srgb, var(--foreground) 4%, transparent); // Foreground-based

// Icon/Badge backgrounds  
rgba(255, 121, 0, 0.1);                         // 10% opacity - LIGHT VERSION
rgba(255, 121, 0, 0.15);                        // 15% opacity - MEDIUM VERSION
rgba(255, 121, 0, 0.08);                        // 8% opacity - SOLUTIONS
rgba(255, 121, 0, 0.05);                        // 5% opacity - FALLBACK INFO

// Status/semantic backgrounds
rgba(34, 197, 94, 0.14);                        // Green (success)
rgba(251, 191, 36, 0.16);                       // Amber (warning)
rgba(239, 68, 68, 0.18);                        // Red (error)
rgba(59, 130, 246, 0.15);                       // Blue (info)
rgba(168, 85, 247, 0.16);                       // Purple
rgba(250, 204, 21, 0.18);                       // Yellow
```

**Files with inconsistencies:**
- `_analytics.scss` - Uses standard orange
- `_list.scss` - Uses 0.15 opacity orange for icons, 0.1 for tags
- `_event.scss` - Uses 0.14-0.18 for status colors
- `_contact.scss` - Uses 0.1 for avatar background, 0.3 for border
- `_map.scss` - Uses 0.05 for badge background
- `_product.scss` - Multiple variations (0.14-0.18 for statuses, 0.15 for icons)
- `_solutions.scss` - Uses 0.08, 0.15 for badges
- `_network.scss` - Uses 0.15 for icons, different colors per type
- `_fallback.scss` - Uses 0.01, 0.05, 0.08, 0.1, 0.15 variations

---

## 2. Hover Effects - Current Inconsistencies

### Issue: Inconsistent Hover State Handling

#### Types of Hover Effects Found:
```scss
// Card-level hover (standardized via variables)
border-color: var(--card-hover-border);          // rgba(255, 121, 0, 0.4)
background: var(--card-hover-background);        // rgba(255, 121, 0, 0.06)
box-shadow: var(--card-hover-shadow);            // 0 2px 4px rgba(0, 0, 0, 0.12)

// Color shifts (inconsistent)
&:hover .section-card__value {
  color: var(--section-accent);                 // Color shift to accent
}

// Title color shifts
&:hover .network-card__title {
  color: rgba(255, 121, 0, 1);                  // Direct rgba (not using variables)
}

// Chevron/icon transforms
&:hover .network-card__chevron {
  transform: translateX(2px);                   // Not consistent
}
```

**Hover State Variations:**
- Some components have NO hover effects (overview)
- Some use border-color + background shift (cards)
- Some use color shifts (titles, values)
- Some use transforms (chevrons, links)
- Some use combined effects

**Files with hover issues:**
- `_analytics.scss` - Value color shift only
- `_overview.scss` - Value color shift only
- `_list.scss` - Full hover effects
- `_event.scss` - NO consistent hover defined
- `_contact.scss` - Full hover effect
- `_map.scss` - border-color + box-shadow
- `_quotation.scss` - NO hover effects
- `_chart.scss` - NO hover effects  
- `_product.scss` - Varied: some with transforms, some with color shifts
- `_network.scss` - Title color shift + chevron transform
- `_text-reference.scss` - Partial hover
- `_fallback.scss` - NO hover effects

---

## 3. Borders - Current Inconsistencies

### Issue: Multiple Border Styles and Color Values

#### Border Variations Found:
```scss
// Card borders (standardized)
border: var(--card-border);                     // 1px solid rgba(255, 121, 0, 0.2)
border: var(--card-border-radius);              // Applied correctly

// Icon/badge borders
border: 1px solid rgba(255, 121, 0, 0.3);      // 30% opacity (different from card 20%)
border: 2px solid rgba(255, 121, 0, 0.3);      // 2px variant (avatars)
border: 1px solid rgba(128, 128, 128, 0.15);   // Fallback gray border

// Status-specific borders  
border: 1px solid rgba(34, 197, 94, 0.4);      // Green
border: 1px solid rgba(59, 130, 246, 0.4);     // Blue
border: 1px solid rgba(168, 85, 247, 0.4);     // Purple

// Event left border
border-left: 3px solid rgba(255, 121, 0, 0.4); // LEFT border accent

// Dashed borders
border: 1px dashed color-mix(...);              // Empty state borders

// Radius variations
border-radius: 2px;                             // Progress bars, quotation
border-radius: 3px;                             // Fallback hints
border-radius: 4px;                             // Fallback fields
border-radius: 50%;                             // Circular (avatars, progress)
border-radius: var(--radius-xs);                // 4px (badges)
border-radius: var(--radius-sm);                // 6px (icons)
border-radius: var(--radius-md);                // 10px (product)
border-radius: var(--radius-full);              // 999px (pills)
border-radius: var(--card-border-radius);       // 6px (cards)
```

**Border Color Inconsistencies:**
- Card border: `0.2` opacity
- Icon/badge border: `0.3` opacity
- Status borders: `0.4` opacity
- Fallback border: `0.15` opacity (gray)

**Files with border issues:**
- All files use different border opacity values
- Inconsistent use of `border-radius` variables vs. hardcoded values
- No unified border-width variable

---

## 4. Font Sizes - Current Inconsistencies

### Issue: Too Many Font Size Variables and Inconsistent Usage

#### Font Size Variables in Use:
```scss
// Card-level fonts
--card-title: 1.52rem
--card-eyebrow: 0.79rem
--card-subtitle: 0.87rem
--card-meta: 0.65rem
--card-meta-value: 0.77rem
--card-footnote: 0.63rem
--card-action: 0.81rem

// Section fonts
--font-section-title: ~1.08rem (calc based)
--font-section-label: ~0.8rem (calc based)
--font-section-value: ~0.99rem (calc based)
--font-section-description: 0.85rem
--font-section-meta: 0.77rem

// Additional variations
--font-section-label-lg: 0.92rem
--font-section-value-lg: 0.95rem
--font-section-value-xl: 1.02rem
--font-section-value-2xl: 1.12rem
--font-section-name: 1.02rem
--font-section-role: 0.82rem
--font-section-tag: 0.67rem

// Contact section
--font-contact-name: 1.02rem
--font-contact-role: 0.82rem
--font-contact-meta: 0.81rem

// List section
--font-list-title: 0.92rem
--font-list-subtitle: 0.79rem

// Chart section
--font-chart-label: 0.92rem
--font-chart-value: 0.95rem
```

**Problem:** Over 30+ font size variables creating confusion

**Actual Font Sizes Used in Components (hardcoded):**
- Labels: `0.6rem`, `0.65rem`, `0.67rem`, `0.72rem`, `0.74rem`, `0.75rem`, `0.79rem`, `0.81rem`, `0.85rem`
- Values: `0.78rem`, `0.8rem`, `0.82rem`, `0.85rem`, `0.87rem`, `0.89rem`, `0.9rem`, `0.92rem`, `0.95rem`, `0.98rem`, `0.99rem`
- Large values: `1.02rem`, `1.1rem`, `1.12rem`, `1.3rem`, `1.52rem`

**Files with font size issues:**
- ALL files use inconsistent font sizes
- Mix of CSS variables and hardcoded values
- Calc-based values in variables causing confusion
- Many unused variables in _variables.scss

---

## 5. Box Shadows - Current Inconsistencies

### Issue: Multiple Shadow Definitions

#### Box Shadow Variations:
```scss
// Standardized card shadow
--card-box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

// Hover shadows
--card-hover-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);

// Complex master shadow (unused?)
--master-card-hover-shadow: [9-layer complex shadow];

// Icon shadows
box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);

// Section block shadow
--section-block-shadow: [3-layer shadow];

// Empty state shadow
box-shadow: var(--card-box-shadow);
```

---

## 6. Gap/Spacing - Current Inconsistencies

### Issue: Multiple Spacing Variables and Inconsistent Application

```scss
// Defined in variables
--spacing-xs: 2px through --spacing-10xl: 28px

// Usage patterns
gap: var(--section-grid-gap);              // 12px
gap: var(--section-grid-gap-mobile);       // 6px
gap: var(--card-gap);                      // 8px
gap: var(--spacing-lg);                    // 8px
gap: var(--spacing-xl);                    // 10px
gap: var(--spacing-2xl);                   // 12px
padding: var(--spacing-4xl);               // 16px
padding: var(--spacing-6xl);               // 20px
padding: var(--spacing-7xl);               // 22px
padding: var(--spacing-8xl);               // 24px

// Hardcoded values also appear
gap: 6px;                                  // Direct values
padding: 3px 6px;                          // Direct values
```

---

## 7. Padding - Current Inconsistencies

### Issue: Mix of Variables and Hardcoded Padding

```scss
// Standardized (cards)
padding: var(--card-padding);              // 10px 12px

// Partially standardized (badges, small items)
padding: 2px 4px;                          // Hardcoded
padding: 3px 6px;                          // Hardcoded
padding: var(--spacing-sm) var(--spacing-lg); // 4px 8px

// Non-standard (large items, sections)
padding: var(--spacing-7xl) var(--spacing-6xl); // 22px 20px
padding: var(--spacing-8xl) var(--spacing-4xl); // 24px 16px
padding: var(--spacing-4xl);               // 16px
padding: var(--tag-padding-y) var(--tag-padding-x); // 3px 6px
```

---

## Summary Table: Design Variables Needed

| Category | Current State | Needed Variables |
|----------|---------------|------------------|
| **Background Colors** | 15+ variations | 10-12 standardized |
| **Border Colors** | 8+ opacity values | 4-5 standardized |
| **Border Styles** | 5+ border-radius values | 3-4 standardized |
| **Hover Effects** | 7+ inconsistent types | 5 standardized patterns |
| **Font Sizes** | 30+ variables defined, inconsistent use | 8-10 standardized |
| **Box Shadows** | 5+ definitions | 3 standardized |
| **Spacing/Gaps** | 15+ variables, mix of direct values | 5-8 standardized |
| **Padding** | Variable + hardcoded mix | 5-6 standardized |
| **Border Widths** | 1px (no variable) | 1-2 variables |

---

## Recommendations

### Priority 1 (Critical):
1. ✅ Consolidate background colors: 3-5 standardized options (light, medium, dark, semantic)
2. ✅ Standardize hover effects: Define 4-5 reusable patterns
3. ✅ Define border system: Colors, widths, radius standardized
4. ✅ Simplify font sizes: 8-10 core sizes (label, body, title, large)

### Priority 2 (Important):
1. Create unified padding/spacing system for all component types
2. Standardize shadow usage across all components
3. Define semantic color tokens for status (success, warning, error, info)

### Priority 3 (Nice to Have):
1. Create design token documentation
2. Generate CSS output from design system
3. Add Figma/design tool integration

---

## Next Steps

1. **Extend _variables.scss** with new comprehensive variables
2. **Create component-specific variable groups** (card, badge, icon, etc.)
3. **Update all section files** to use new variables
4. **Test and verify** all components render consistently

