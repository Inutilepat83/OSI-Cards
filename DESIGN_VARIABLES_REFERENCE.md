# Design Variables Reference Sheet

Quick lookup for developers working on the design variable consistency project.

## 🎯 Most Common Replacements

### Orange Color Mappings
```scss
// FROM → TO
rgba(255, 121, 0, 0.03)  → var(--color-orange-bg-subtle)
rgba(255, 121, 0, 0.06)  → var(--color-orange-hover)
rgba(255, 121, 0, 0.08)  → var(--color-orange-bg-light)
rgba(255, 121, 0, 0.1)   → var(--color-orange-bg) ⚠️ CONTEXT: if badge/icon
rgba(255, 121, 0, 0.15)  → var(--color-orange-bg) ⚠️ CONTEXT: if badge/icon
rgba(255, 121, 0, 0.2)   → var(--color-orange-border)
rgba(255, 121, 0, 0.3)   → var(--color-orange-accent)
rgba(255, 121, 0, 0.4)   → var(--color-orange-border-hover)
rgba(255, 121, 0, 0.7)   → var(--color-orange-fill)
#ff7900 or rgb(255,121,0) → var(--color-orange-solid)
```

### Status Colors
```scss
// Success (Green)
rgba(34, 197, 94, 0.14) → var(--color-success-light)     // Badge background
rgba(34, 197, 94, 0.4)  → var(--color-success-border)    // Border/accent
rgba(34, 197, 94, 0.8)  → var(--color-success-fill)      // Strong/fill
#22c55e                 → var(--color-success-solid)

// Warning (Amber)
rgba(251, 191, 36, 0.16) → var(--color-warning-light)
rgba(251, 191, 36, 0.4)  → var(--color-warning-border)
rgba(251, 191, 36, 0.8)  → var(--color-warning-fill)
#fbbf24                  → var(--color-warning-solid)

// Error (Red)
rgba(239, 68, 68, 0.18) → var(--color-error-light)
rgba(239, 68, 68, 0.4)  → var(--color-error-border)
rgba(239, 68, 68, 0.8)  → var(--color-error-fill)
#ef4444                 → var(--color-error-solid)

// Info (Blue)
rgba(59, 130, 246, 0.15) → var(--color-info-light)
rgba(59, 130, 246, 0.4)  → var(--color-info-border)
rgba(59, 130, 246, 0.8)  → var(--color-info-fill)
#3b82f6                  → var(--color-info-solid)

// Purple
rgba(168, 85, 247, 0.16) → var(--color-purple-light)
rgba(168, 85, 247, 0.4)  → var(--color-purple-border)
rgba(168, 85, 247, 0.8)  → var(--color-purple-fill)
#a855f7                  → var(--color-purple-solid)
```

## 🎨 Component-Specific Colors

### Badge Backgrounds
```scss
// Use for all badge background colors
--badge-bg-success  // Green backgrounds
--badge-bg-warning  // Amber backgrounds
--badge-bg-error    // Red backgrounds
--badge-bg-info     // Blue backgrounds
--badge-bg-primary  // Orange backgrounds (default)
--badge-bg-neutral  // Gray backgrounds
```

### Icon Backgrounds
```scss
// Use for icon background fills
--icon-bg-default    // Standard orange
--icon-bg-success    // Green
--icon-bg-warning    // Amber
--icon-bg-error      // Red
--icon-bg-info       // Blue
--icon-bg-purple     // Purple
--icon-bg-social     // Social networks (orange)
--icon-bg-web        // Web/browser (blue)
--icon-bg-messaging  // Messaging (purple)
--icon-bg-payment    // Payment/finance (green)
```

### Progress Bars
```scss
// Backgrounds (light fill)
--color-orange-bg-light    // Standard progress background
--progress-bg-light        // Same, alternate name

// Fills (strong color)
--color-orange-fill        // Standard progress fill
--progress-fill-success    // Green fill
--progress-fill-warning    // Amber fill
--progress-fill-error      // Red fill
--progress-fill-info       // Blue fill
```

### Accent Borders
```scss
// Left borders, accent lines
--border-accent              // Standard orange accent
--border-accent-success      // Green accent
--border-accent-warning      // Amber accent
--border-accent-error        // Red accent
--border-accent-info         // Blue accent
```

## 🎬 Hover Effects

### Pattern 1: Card Hover (Border + Background + Shadow)
```scss
&:hover {
  border-color: var(--hover-border-color);  // Changes to 0.4 opacity
  background: var(--hover-bg-color);         // Changes to 0.06 opacity
  box-shadow: var(--hover-shadow);           // Enhanced shadow
  transition: var(--hover-transition);       // All 0.2s ease
}
```

### Pattern 2: Text/Title Hover (Color Shift)
```scss
&:hover {
  color: var(--hover-text-color);            // Solid orange
  transition: var(--hover-text-transition);  // 0.2s ease
}
```

### Pattern 3: Icon/Chevron Hover (Transform)
```scss
&:hover {
  transform: var(--hover-transform);         // translateX(2px)
  transition: var(--hover-transform-transition); // 0.2s ease
}
```

### Transition Variables
```scss
--transition-fast: 0.15s ease      // Quick hover effects
--transition-normal: 0.2s ease     // Standard (most common)
--transition-slow: 0.3s ease       // Slow animations
```

## 📏 Border Styling

### Border Radius
```scss
// Mapping old → new
2px  → var(--radius-xs)      // Tiny (progress bars, decorative)
3px  → var(--radius-xs)      // Tiny elements (badges, hints)
4px  → var(--radius-xs)      // Small fallbacks
6px  → var(--card-border-radius) // Standard cards
8px  → var(--radius-sm)      // May need review - not standard
10px → var(--radius-md)      // Medium surfaces
50%  → var(--radius-full)    // Circular avatars
999px → var(--radius-full)   // Pill shapes
```

### Border Colors
```scss
// Default borders (cards, containers)
1px solid var(--color-orange-border)

// Hover borders (interactive elements)
1px solid var(--color-orange-border-hover)

// Accent borders (left border on lists, events, quotes)
3px solid var(--border-accent)

// Status-specific borders
1px solid var(--color-success-border)   // Success
1px solid var(--color-warning-border)   // Warning
1px solid var(--color-error-border)     // Error
1px solid var(--color-info-border)      // Info
```

## 🔤 Typography

### Font Sizes (Label - Small Text)
```scss
// Labels in cards (uppercase, small)
font-size: var(--card-label-font-size)     // 0.6rem
font-size: var(--font-section-tag)         // 0.67rem (very small tags)
font-size: var(--font-section-tag-sm)      // 0.72rem (small tags)
font-size: var(--font-section-meta)        // 0.77rem (metadata)
font-size: var(--text-xs)                  // 0.75rem (generic small)
```

### Font Sizes (Value - Medium Text)
```scss
// Values in cards
font-size: var(--card-value-font-size)     // 0.85rem (standard)
font-size: var(--font-section-value-lg)    // 0.95rem (large)
font-size: var(--font-section-value-xl)    // 1.02rem (extra large)
font-size: var(--card-value-font-size-lg)  // 1.3rem (metrics - LARGE)
```

### Font Sizes (Titles)
```scss
// Section headers and titles
font-size: var(--font-section-title)       // ~1.08rem (section header)
font-size: var(--font-section-label-lg)    // 0.92rem (card title)
font-size: var(--font-section-name)        // 1.02rem (contact name)
font-size: var(--font-card-title)          // 1.52rem (main title)
```

## 📐 Spacing & Padding

### Card Padding
```scss
padding: var(--card-padding)              // 10px 12px (all cards - STANDARD)
padding: var(--card-padding-vertical)     // 10px
padding: var(--card-padding-horizontal)   // 12px

// Mobile (usually same as desktop)
padding: var(--card-padding-mobile)       // 10px 12px
```

### Tag/Badge Padding
```scss
padding: var(--tag-padding-y) var(--tag-padding-x)  // 3px 6px (standard)
padding: var(--tag-padding-y-sm) var(--tag-padding-x-sm)  // 2px 4px (small)
padding: var(--tag-padding-y-lg) var(--tag-padding-x-lg)  // 3px 7px (large)
```

### Grid Gaps
```scss
gap: var(--section-grid-gap)              // 12px (desktop - standard)
gap: var(--section-grid-gap-mobile)       // 6px (mobile)

// Alternative names (same values)
gap: var(--grid-gap-2xl)                  // 12px (same as section-grid-gap)
gap: var(--card-gap)                      // 8px (card element spacing)
gap: var(--grid-gap-lg)                   // 8px
gap: var(--grid-gap-md)                   // 6px
```

### Spacing Scale (for other uses)
```scss
var(--spacing-xs)    // 2px
var(--spacing-sm)    // 4px
var(--spacing-md)    // 6px
var(--spacing-lg)    // 8px
var(--spacing-xl)    // 10px
var(--spacing-2xl)   // 12px
var(--spacing-3xl)   // 14px
var(--spacing-4xl)   // 16px
var(--spacing-5xl)   // 18px
var(--spacing-6xl)   // 20px
var(--spacing-7xl)   // 22px
var(--spacing-8xl)   // 24px
```

## 📋 By-File Cheat Sheet

### _analytics.scss
```scss
// Replace these:
rgba(255, 121, 0, 0.15) → var(--color-orange-bg)
rgba(255, 121, 0, 0.7)  → var(--color-orange-fill)
border-radius: 3px      → var(--radius-xs)
```

### _list.scss
```scss
// Replace these:
border-left: 3px solid rgba(255, 121, 0, 0.4) → var(--border-accent)
rgba(255, 121, 0, 0.15) → var(--icon-bg-default)
rgba(255, 121, 0, 0.1)  → var(--color-orange-bg) (context: badge)
padding: 3px 6px        → var(--tag-padding-y) var(--tag-padding-x)
```

### _event.scss
```scss
// Status badges - replace with:
success: rgba(34, 197, 94, 0.14) → var(--color-success-light)
warning: rgba(251, 191, 36, 0.16) → var(--color-warning-light)
error: rgba(239, 68, 68, 0.18) → var(--color-error-light)
primary: rgba(255, 121, 0, 0.15) → var(--color-orange-bg)
```

### _contact.scss
```scss
// Avatar styling:
border: 2px solid rgba(255, 121, 0, 0.3) → 2px solid var(--color-orange-accent)
background: rgba(255, 121, 0, 0.1) → var(--color-orange-bg-light)
```

### _product.scss
```scss
// Icon backgrounds by status - replace with:
success: rgba(34, 197, 94, 0.14) → var(--icon-bg-success)
info: rgba(59, 130, 246, 0.15) → var(--icon-bg-info)
purple: rgba(168, 85, 247, 0.16) → var(--icon-bg-purple)
```

### _network.scss
```scss
// Icons + hover:
background: rgba(255, 121, 0, 0.15) → var(--icon-bg-[type])
&:hover .title { color: rgba(255, 121, 0, 1) } → var(--hover-text-color)
&:hover .chevron { transform: translateX(2px) } → var(--hover-transform)
```

### _map.scss
```scss
// Badge backgrounds:
background: rgba(255, 255, 255, 0.05) → var(--color-orange-bg-subtle)
padding: 3px 6px → var(--tag-padding-y) var(--tag-padding-x)
```

### _chart.scss
```scss
// Progress bars:
background: rgba(255, 121, 0, 0.15) → var(--color-orange-bg-light)
fill: rgba(255, 121, 0, 0.7) → var(--color-orange-fill)
```

### _quotation.scss
```scss
// Left border accent:
border-left: 3px solid rgba(255, 121, 0, 0.4) → var(--border-accent)
background: rgba(255, 121, 0, 0.03) → var(--color-orange-bg-subtle)
```

## ⚠️ Important Notes

### Context Matters!
- `rgba(255, 121, 0, 0.1)` vs `rgba(255, 121, 0, 0.15)` - Both → `var(--color-orange-bg)`
  - Use based on context: if it's a badge/icon → `var(--icon-bg-default)` or `var(--badge-bg-primary)`

### Theme Awareness
All variables are theme-aware (automatically change for night/day modes via data-theme attribute)
- No manual dark mode adjustments needed
- Use semantic variables and theme switching "just works"

### Build Verification
After each file replacement:
```bash
npm run build
```
Must complete without errors.

### Search & Replace Tips

1. **Search for rgba values:**
   ```
   Find: rgba\(255,\s?121,\s?0,\s?0\.\d+\)
   ```

2. **Search for status colors:**
   ```
   Find: rgba\((34,\s?197,\s?94|251,\s?191,\s?36|239,\s?68,\s?68|59,\s?130,\s?246|168,\s?85,\s?247)
   ```

3. **Search for solid orange:**
   ```
   Find: (#ff7900|rgb\(255,\s?121,\s?0\))
   ```

---

## 📞 Questions?

Refer to these documents for detailed information:
- **Full Details:** `UNIFIED_VARIABLES_APPLICATION_PLAN.md`
- **Audit Data:** `DESIGN_VARIABLES_AUDIT.md`
- **Components:** `HTML_COMPONENT_STRUCTURE_AUDIT.md`
- **Summary:** `DESIGN_CONSISTENCY_AUDIT_SUMMARY.md`

