# Section Design System Specification

> **Comprehensive visual and technical specification for the OSI-Cards section design system**

---

## Table of Contents

1. [Design Tokens](#design-tokens)
2. [Typography Scale](#typography-scale)
3. [Color Palette](#color-palette)
4. [Spacing Scale](#spacing-scale)
5. [Component Anatomy](#component-anatomy)
6. [Layout Grids](#layout-grids)
7. [Interactive States](#interactive-states)
8. [Accessibility](#accessibility)

---

## Design Tokens

### Token Structure

```typescript
{
  // Spacing
  spacing: {
    xs:  '4px',
    sm:  '8px',
    md:  '12px',
    lg:  '16px',
    xl:  '24px',
    '2xl': '32px',
    '3xl': '48px'
  },

  // Typography
  fontSize: {
    xs:   '0.75rem',  // 12px
    sm:   '0.875rem', // 14px
    base: '1rem',     // 16px
    lg:   '1.125rem', // 18px
    xl:   '1.25rem',  // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem' // 30px
  },

  // Font Weight
  fontWeight: {
    normal:    400,
    medium:    500,
    semibold:  600,
    bold:      700
  },

  // Line Height
  lineHeight: {
    tight:    1.25,
    snug:     1.375,
    normal:   1.5,
    relaxed:  1.625,
    loose:    2
  },

  // Border Radius
  radius: {
    none: '0',
    sm:   '4px',
    md:   '8px',
    lg:   '12px',
    xl:   '16px',
    full: '9999px'
  },

  // Shadows
  shadow: {
    sm:  '0 1px 2px rgba(0, 0, 0, 0.05)',
    md:  '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg:  '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl:  '0 20px 25px rgba(0, 0, 0, 0.15)',
    '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)'
  },

  // Transitions
  transition: {
    fast:   '150ms',
    normal: '200ms',
    slow:   '300ms',
    slower: '600ms'
  },

  // Easing
  easing: {
    linear:  'linear',
    easeIn:  'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    bounce:  'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  }
}
```

---

## Typography Scale

### Hierarchy

```
┌─────────────────────────────────────────────────────┐
│  H1 - Page Title                                     │
│  └─ 30px (1.875rem) / Bold (700) / Tight (1.25)    │
├─────────────────────────────────────────────────────┤
│  H2 - Major Section                                  │
│  └─ 24px (1.5rem) / Bold (700) / Tight (1.25)      │
├─────────────────────────────────────────────────────┤
│  H3 - Section Title (Most Common)                    │
│  └─ 18px (1.125rem) / Bold (700) / Tight (1.25)    │
├─────────────────────────────────────────────────────┤
│  H4 - Subsection                                     │
│  └─ 16px (1rem) / Semibold (600) / Snug (1.375)    │
├─────────────────────────────────────────────────────┤
│  H5 - Group Heading                                  │
│  └─ 14px (0.875rem) / Semibold (600) / Snug (1.375)│
├─────────────────────────────────────────────────────┤
│  H6 - Item Title                                     │
│  └─ 14px (0.875rem) / Semibold (600) / Snug (1.375)│
├─────────────────────────────────────────────────────┤
│  Body Large - Featured text                         │
│  └─ 16px (1rem) / Normal (400) / Relaxed (1.625)   │
├─────────────────────────────────────────────────────┤
│  Body - Default text                                │
│  └─ 14px (0.875rem) / Normal (400) / Normal (1.5)  │
├─────────────────────────────────────────────────────┤
│  Body Small - Secondary text                        │
│  └─ 12px (0.75rem) / Normal (400) / Normal (1.5)   │
├─────────────────────────────────────────────────────┤
│  Label - Form labels, metadata                      │
│  └─ 12px (0.75rem) / Medium (500) / Tight (1.25)   │
│     UPPERCASE / Letter-spacing: 0.5px               │
├─────────────────────────────────────────────────────┤
│  Caption - Helper text                              │
│  └─ 12px (0.75rem) / Normal (400) / Relaxed (1.625)│
└─────────────────────────────────────────────────────┘
```

### Section-Specific Typography

```typescript
// Section Title (Universal)
.section-title {
  font-size: var(--text-lg);        // 18px
  font-weight: var(--font-bold);    // 700
  line-height: var(--leading-tight); // 1.25
  color: var(--foreground);
}

// Section Description (Universal)
.section-description {
  font-size: var(--text-base);      // 14px
  font-weight: var(--font-normal);  // 400
  line-height: var(--leading-relaxed); // 1.625
  color: var(--muted-foreground);
}

// Item Title
.item-title {
  font-size: var(--text-base);      // 14px
  font-weight: var(--font-semibold); // 600
  line-height: var(--leading-snug); // 1.375
  color: var(--foreground);
}

// Item Label
.item-label {
  font-size: var(--text-xs);        // 12px
  font-weight: var(--font-medium);  // 500
  line-height: var(--leading-tight); // 1.25
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

// Item Value
.item-value {
  font-size: var(--text-md);        // 16px
  font-weight: var(--font-semibold); // 600
  line-height: var(--leading-normal); // 1.5
  color: var(--foreground);
}

// Number Display (Analytics)
.number-display {
  font-size: var(--text-2xl);       // 24px
  font-weight: var(--font-bold);    // 700
  line-height: 1;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}
```

---

## Color Palette

### Semantic Colors

```typescript
// Surface Colors (Layering)
{
  surface: {
    base:    'hsl(0, 0%, 10%)',      // #1a1a1a - Base surface
    raised:  'hsl(0, 0%, 15%)',      // #262626 - Elevated elements
    hover:   'hsl(0, 0%, 20%)',      // #333333 - Hover state
    subtle:  'hsl(0, 0%, 12%)',      // #1f1f1f - Zebra striping
  },

  // Text Colors
  foreground: {
    primary:   'hsl(0, 0%, 95%)',    // #f2f2f2 - Primary text
    strong:    'hsl(0, 0%, 100%)',   // #ffffff - Emphasized text
    muted:     'hsl(0, 0%, 60%)',    // #999999 - Secondary text
    disabled:  'hsl(0, 0%, 40%)',    // #666666 - Disabled text
  },

  // Brand/Accent Colors
  accent: {
    primary:   'hsl(25, 100%, 50%)',  // #ff7900 - Orange
    bright:    'hsl(25, 100%, 60%)',  // #ffa347 - Bright orange
    muted:     'hsl(25, 50%, 40%)',   // #bf7400 - Muted orange
  },

  // Status Colors
  status: {
    success: {
      main: 'hsl(142, 71%, 45%)',     // #22c55e - Green
      bg:   'hsl(142, 71%, 15%)',     // Dark green bg
    },
    error: {
      main: 'hsl(0, 84%, 60%)',       // #ef4444 - Red
      bg:   'hsl(0, 84%, 20%)',       // Dark red bg
    },
    warning: {
      main: 'hsl(45, 93%, 47%)',      // #eab308 - Yellow
      bg:   'hsl(45, 93%, 17%)',      // Dark yellow bg
    },
    info: {
      main: 'hsl(221, 83%, 53%)',     // #3b82f6 - Blue
      bg:   'hsl(221, 83%, 18%)',     // Dark blue bg
    }
  },

  // Border Colors
  border: {
    default: 'hsl(0, 0%, 25%)',       // #404040 - Default border
    muted:   'hsl(0, 0%, 15%)',       // #262626 - Subtle border
    strong:  'hsl(0, 0%, 35%)',       // #595959 - Strong border
  }
}
```

### Color Usage Guidelines

```typescript
// Text Hierarchy
Primary content:    var(--foreground)
Secondary content:  var(--muted-foreground)
Disabled text:      var(--foreground-disabled)
Links/Actions:      var(--accent)

// Backgrounds
Container:          var(--surface)
Cards/Items:        var(--surface)
Hover state:        var(--surface-raised)
Active state:       var(--surface-hover)
Alternate rows:     var(--surface-subtle)

// Feedback
Success:            var(--status-success)
Error/Danger:       var(--status-error)
Warning:            var(--status-warning)
Info:               var(--status-info)

// Borders
Default:            var(--border)
Subtle:             var(--border-muted)
Focus:              var(--accent)
```

---

## Spacing Scale

### Base Scale

```
┌─────────┬────────┬─────────────────────────────┐
│ Token   │ Value  │ Usage                       │
├─────────┼────────┼─────────────────────────────┤
│ xs      │ 4px    │ Tight gaps, icon spacing    │
│ sm      │ 8px    │ Item gaps, small padding    │
│ md      │ 12px   │ Default gap, item padding   │
│ lg      │ 16px   │ Section padding, large gaps │
│ xl      │ 24px   │ Major spacing               │
│ 2xl     │ 32px   │ Section spacing             │
│ 3xl     │ 48px   │ Page-level spacing          │
└─────────┴────────┴─────────────────────────────┘
```

### Component Spacing Rules

```scss
// Section Container
.section-container {
  padding: var(--spacing-md);        // 12px
  margin-bottom: var(--spacing-lg);  // 16px
  gap: var(--spacing-md);            // 12px (header to content)
}

// Section Header
.section-header {
  margin-bottom: var(--spacing-xs); // 4px (title to description)
}

// Grid/List Layout
.section-grid,
.section-list {
  gap: var(--spacing-md);           // 12px (between items)
  padding: var(--spacing-md);       // 12px (container padding)
}

// Items/Cards
.item,
.card {
  padding: var(--spacing-md);       // 12px (internal padding)
  gap: var(--spacing-sm);           // 8px (element gap)
  border-radius: var(--radius-sm);  // 4px
}

// Item Internal Elements
.item-header {
  margin-bottom: var(--spacing-sm); // 8px
}

.item-content {
  gap: var(--spacing-xs);           // 4px (tight content)
}

.item-footer {
  margin-top: var(--spacing-sm);    // 8px
}
```

### Responsive Spacing

```scss
// Desktop (default)
--spacing-base: 12px;

// Tablet (≤768px)
@media (max-width: 768px) {
  --spacing-base: 10px;
}

// Mobile (≤640px)
@media (max-width: 640px) {
  --spacing-base: 8px;
}
```

---

## Component Anatomy

### 1. Section Container

```
┌─────────────────────────────────────────┐
│ .section-container                      │ ← Outer wrapper
│ ├─ padding: var(--spacing-md)          │
│ ├─ background: var(--surface)          │
│ ├─ border-radius: var(--radius-md)     │
│ └─ gap: var(--spacing-md)              │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ .section-header                     │ │ ← Header area
│ │ ├─ .section-title (h3)             │ │
│ │ └─ .section-description (p)        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ .section-{grid|list|flex}          │ │ ← Content area
│ │ ├─ gap: var(--spacing-md)          │ │
│ │ └─ layout: {grid|flex}             │ │
│ │                                     │ │
│ │ ┌─────────────┐ ┌─────────────┐   │ │
│ │ │ .item/.card │ │ .item/.card │   │ │ ← Items
│ │ └─────────────┘ └─────────────┘   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ .section-empty (optional)           │ │ ← Empty state
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 2. Card Anatomy (Grid Items)

```
┌───────────────────────────────────────┐
│ .card                                 │
│ ├─ padding: var(--spacing-md)        │
│ ├─ border-radius: var(--radius-sm)   │
│ ├─ background: var(--surface)        │
│ └─ transition: all 200ms              │
│                                       │
│ ┌───────────────────────────────────┐ │
│ │ .card-header                      │ │
│ │ ├─ .card-title                    │ │
│ │ └─ .card-meta (badges, icons)     │ │
│ └───────────────────────────────────┘ │
│                                       │
│ ┌───────────────────────────────────┐ │
│ │ .card-content                     │ │
│ │ └─ Main content area              │ │
│ └───────────────────────────────────┘ │
│                                       │
│ ┌───────────────────────────────────┐ │
│ │ .card-footer (optional)           │ │
│ │ └─ Actions, links                 │ │
│ └───────────────────────────────────┘ │
└───────────────────────────────────────┘
```

### 3. List Item Anatomy

```
┌─────────────────────────────────────────────┐
│ .list-item                                  │
│ ├─ display: flex                            │
│ ├─ align-items: flex-start                 │
│ ├─ gap: var(--spacing-md)                  │
│ └─ padding: var(--spacing-md)              │
│                                             │
│ ┌─┐ ┌───────────────────────────────────┐ │
│ │•│ │ .item-content                     │ │
│ └─┘ │ ┌───────────────────────────────┐ │ │
│     │ │ .item-header                  │ │ │
│     │ │ ├─ .item-title                │ │ │
│     │ │ └─ .item-badges               │ │ │
│     │ └───────────────────────────────┘ │ │
│     │ ┌───────────────────────────────┐ │ │
│     │ │ .item-description             │ │ │
│     │ └───────────────────────────────┘ │ │
│     └───────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 4. Key-Value Pair Anatomy (Info Section)

```
┌─────────────────────────────────────┐
│ .info-item                          │
│ ├─ display: flex                    │
│ ├─ flex-direction: column           │
│ ├─ gap: var(--spacing-sm)          │
│ └─ padding: var(--spacing-md)      │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ .info-label-wrapper             │ │
│ │ ├─ .info-icon (optional)        │ │
│ │ └─ .info-label                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ .info-value-wrapper             │ │
│ │ ├─ .info-value                  │ │
│ │ └─ .info-trend (optional)       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ .info-description (optional)    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Layout Grids

### Grid Configurations

```scss
// Small Cards (Analytics, Metrics)
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--spacing-md);
}

// Medium Cards (Contacts, Standard Cards)
.contacts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

// Large Cards (Gallery, Video)
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-md);
}

// Two-Column (Overview, Details)
.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

// Three-Column (Features, Services)
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}
```

### Responsive Grid Behavior

```scss
// Desktop (≥1024px) - Default
grid-template-columns: repeat(auto-fit, minmax(Xpx, 1fr));

// Tablet (768px - 1023px)
@media (max-width: 1023px) {
  grid-template-columns: repeat(2, 1fr);
}

// Mobile (≤767px)
@media (max-width: 767px) {
  grid-template-columns: 1fr;
}
```

---

## Interactive States

### Hover States

```scss
// Card Hover (Lift Up)
.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  background: var(--surface-raised);

  .card-title {
    color: var(--accent);
  }
}

// List Item Hover (Slide Right)
.list-item:hover {
  transform: translateX(4px);
  background: var(--surface-raised);

  .item-bullet {
    transform: scale(1.15);
    color: var(--accent);
  }
}

// Button Hover
.button:hover {
  background: var(--accent-bright);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}
```

### Active States

```scss
.card:active,
.list-item:active,
.button:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}
```

### Focus States (Accessibility)

```scss
.card:focus-visible,
.list-item:focus-visible,
.button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  background: var(--surface-raised);
}
```

### Loading States

```scss
.card--loading {
  pointer-events: none;
  opacity: 0.6;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    animation: shimmer 1.5s infinite;
  }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

### Disabled States

```scss
.card--disabled,
.button--disabled {
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
}
```

---

## Accessibility

### ARIA Labels

```html
<!-- Section -->
<section aria-labelledby="section-title" role="region">
  <h3 id="section-title">{{ title }}</h3>
</section>

<!-- Interactive Items -->
<div class="card" role="button" tabindex="0"
     [attr.aria-label]="'View ' + item.title">
</div>

<!-- Status Indicators -->
<span class="badge" role="status" aria-live="polite">
  {{ status }}
</span>

<!-- Progress -->
<div role="progressbar"
     [attr.aria-valuenow]="value"
     [attr.aria-valuemin]="0"
     [attr.aria-valuemax]="100">
</div>
```

### Keyboard Navigation

```scss
// Focus visible only for keyboard navigation
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

// Hide outline for mouse clicks
:focus:not(:focus-visible) {
  outline: none;
}
```

### Color Contrast

```typescript
// Minimum contrast ratios (WCAG AA)
{
  normalText: '4.5:1',      // Body text
  largeText: '3:1',         // ≥18px or ≥14px bold
  uiComponents: '3:1',      // Buttons, form controls
}

// Verified combinations
{
  'foreground on surface': '13.1:1',      // ✅ Excellent
  'muted-foreground on surface': '6.2:1', // ✅ Good
  'accent on surface': '8.4:1',           // ✅ Excellent
}
```

### Screen Reader Support

```html
<!-- Hidden but accessible -->
<span class="sr-only">
  {{ screenReaderText }}
</span>

<!-- Skip to content -->
<a href="#main-content" class="skip-link">
  Skip to main content
</a>

<!-- Live regions -->
<div aria-live="polite" aria-atomic="true">
  {{ dynamicContent }}
</div>
```

---

## Usage Examples

### Complete Section Example

```html
<div class="analytics-container">
  <!-- Section Header -->
  <div class="section-header">
    <h3 class="section-title">Key Metrics</h3>
    <p class="section-description">Performance indicators for Q4 2024</p>
  </div>

  <!-- Metrics Grid -->
  <div class="analytics-grid">
    <div class="metric-card">
      <div class="metric-header">
        <span class="metric-label">Revenue</span>
        <lib-trend-indicator trend="up" [value]="15.5"></lib-trend-indicator>
      </div>
      <div class="metric-value">$2.4M</div>
      <lib-progress-bar [value]="85" variant="success"></lib-progress-bar>
    </div>
  </div>

  <!-- Empty State -->
  <lib-empty-state
    *ngIf="!hasData"
    message="No metrics available"
    icon="📊">
  </lib-empty-state>
</div>
```

---

## Design System Checklist

### For New Sections
- [ ] Use `BaseSectionComponent` as base class
- [ ] Implement standard header structure
- [ ] Use design tokens for all spacing/colors
- [ ] Include empty state
- [ ] Add hover/focus states for interactive elements
- [ ] Ensure keyboard navigation works
- [ ] Add ARIA labels where appropriate
- [ ] Test responsive behavior
- [ ] Verify color contrast
- [ ] Document any custom patterns

### For Updates
- [ ] Maintain backward compatibility
- [ ] Update all affected sections
- [ ] Test in light and dark themes
- [ ] Verify accessibility
- [ ] Update documentation
- [ ] Add migration notes if needed

---

*Design System Specification v1.0 - December 2, 2025*
*OSI-Cards Library - Section Design System*

