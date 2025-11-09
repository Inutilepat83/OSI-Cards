# HTML Component Structure Audit

## Component Hierarchy Overview

All section components follow this standard structure:

```html
<section class="section-block section-block--[type]">
  <!-- Header (optional) -->
  <header class="section-block__header">
    <div class="section-block__heading">
      <h3 class="section-block__title">Title</h3>
      <p class="section-block__subtitle">Subtitle (optional)</p>
    </div>
  </header>

  <!-- Content Grid/List -->
  <div class="section-grid section-grid--[type]">
    <!-- Items (buttons or divs) -->
  </div>

  <!-- Empty State -->
  <ng-template #empty>
    <div class="section-empty">...</div>
  </ng-template>
</section>
```

---

## CSS Class Breakdown

### Root Level Classes
- `.section-block` - Base container (always applied)
- `.section-block--[type]` - Type-specific: `insights`, `metrics`, `list`, `event`, `contact`, `map`, `product`, `chart`, `quotation`, `network`, `solutions`, `financial`, `timeline`, etc.

### Header Classes
- `.section-block__header` - Header wrapper
- `.section-block__heading` - Heading container
- `.section-block__title` - Section title (h3)
- `.section-block__subtitle` - Optional subtitle

### Content Grid Classes
- `.section-grid` - Grid container
- `.section-grid--[type]` - Type-specific grid: `insights`, `metrics`, `list`, `event`, `contact`, `map`, etc.

### Card/Item Classes (Each item in grid)
- `.section-card` - Base card
- `.section-card--[type]` - Type-specific: `insight`, `metric`, `list`, `event`, `contact`, `map`, `product`, `chart`, etc.
- `.section-card__label` - Label element
- `.section-card__value` - Value element  
- `.section-card__description` - Description text
- `.section-card__icon` - Icon container
- `.section-card__progress` - Progress bar wrapper
- `.section-card__progress-bar` - Actual progress bar element
- `.section-card__meta` - Metadata section
- `.section-card__meta-change` - Change indicator
- `.section-card__tags` - Tags container
- `.section-card__tag` - Individual tag
- `.section-card__row` - Row layout for list items
- `.section-card__content` - Content wrapper

### Empty State Classes
- `.section-empty` - Empty state container
- `.section-empty__icon` - Empty state icon
- `.section-empty__text` - Empty state text

---

## Component Types Analysis

### 1. **Info Section (overview-section)**
**HTML Pattern:**
```html
<section class="section-block section-block--insights">
  <div class="section-grid section-grid--insights">
    <button class="section-card section-card--insight">
      <span class="section-card__label">Label</span>
      <span class="section-card__value">Value</span>
      <p class="section-card__description">Description</p>
      <div class="section-card__meta">Trend & Change</div>
    </button>
  </div>
</section>
```

**CSS Design Needs:**
- Card backgrounds: Light orange tint for cards + hover state
- Font sizes: Label (small), Value (medium), Description (small)
- Spacing: Standard card padding (10px 12px)
- Hover: Border + background + shadow

**SCSS File:** `_overview.scss`

---

### 2. **Analytics Section**
**HTML Pattern:**
```html
<section class="section-block section-block--metrics">
  <div class="section-grid section-grid--metrics">
    <button class="section-card section-card--metric">
      <div class="section-card__label">
        <lucide-icon></lucide-icon>
        <span>Label</span>
      </div>
      <div class="section-card__value">Value</div>
      <div class="section-card__progress">
        <div class="section-card__progress-bar"></div>
      </div>
      <div class="section-card__meta">Percentage & Change</div>
    </button>
  </div>
</section>
```

**CSS Design Needs:**
- Progress bar: Background (light orange) + Fill (dark orange)
- Value font: Large (1.3rem)
- Icon styling: Trend-specific colors (up=green, down=red)
- Spacing: Progress bar spacing below value

**SCSS File:** `_analytics.scss`

---

### 3. **List Section**
**HTML Pattern:**
```html
<section class="section-block section-block--list">
  <div class="section-list">
    <button class="section-card section-card--list">
      <div class="section-card__row">
        <div class="section-card__icon">Icon</div>
        <div class="section-card__content">
          <p class="section-card__label">Title</p>
          <p class="section-card__description">Description</p>
          <div class="section-card__tags">
            <span class="section-card__tag">Priority</span>
            <span class="section-card__tag">Status</span>
          </div>
        </div>
        <div class="section-card__tag section-card__tag--value">Value</div>
      </div>
      <div class="section-card__meta">Assignee & Date</div>
    </button>
  </div>
</section>
```

**CSS Design Needs:**
- Row layout: Icon (small), Content (flex-grow), Value (fixed)
- Icon background: Orange tint
- Tags: Different colors per status/priority type
- Left accent border: 3px solid orange
- Hover: Full card hover effect

**SCSS File:** `_list.scss`

---

### 4. **Event Section**
**HTML Pattern:**
```html
<section class="section-block section-block--event">
  <div class="section-list">
    <button class="section-card section-card--event">
      <div class="section-card__row">
        <div class="section-card__icon">Icon</div>
        <div class="section-card__content">
          <p class="section-card__label">Event Title</p>
          <p class="section-card__description">Description</p>
          <div class="section-card__tags">
            <span class="section-card__tag section-card__tag--badge">Status Badge</span>
          </div>
        </div>
        <div class="section-card__meta">Time/Date</div>
      </div>
    </button>
  </div>
</section>
```

**CSS Design Needs:**
- Status badges: Multiple color variants (success/warning/error/info)
- Badge background: Semantic color (0.14-0.18 opacity)
- Icon: Event/calendar styled
- Timeline styling: Left border accent or date display

**SCSS File:** `_event.scss`

---

### 5. **Contact Card Section**
**HTML Pattern:**
```html
<section class="section-block section-block--contact">
  <div class="section-grid section-grid--contact">
    <button class="section-card section-card--contact">
      <div class="section-card__avatar">Avatar</div>
      <div class="section-card__content">
        <p class="section-card__name">Name</p>
        <p class="section-card__role">Role</p>
        <div class="section-card__meta">Contact info</div>
      </div>
    </button>
  </div>
</section>
```

**CSS Design Needs:**
- Avatar: Circular (border-radius 50%), orange border
- Name: Bold, medium font
- Role: Light gray, smaller font
- Hover: Full card hover effect

**SCSS File:** `_contact.scss`

---

### 6. **Map Section**
**HTML Pattern:**
```html
<section class="section-block section-block--map">
  <div class="map-container">Map iframe/leaflet</div>
  <div class="section-grid section-grid--map">
    <div class="section-card section-card--location">
      <div class="section-card__tag">Location Tag</div>
      <div class="section-card__label">Location Name</div>
      <p class="section-card__description">Address/Details</p>
    </div>
  </div>
</section>
```

**CSS Design Needs:**
- Map container: Responsive height, rounded corners
- Location badges: White background (0.05 opacity), small text
- Compact styling: Dense layout for location cards

**SCSS File:** `_map.scss`

---

### 7. **Product Section**
**HTML Pattern:**
```html
<section class="section-block section-block--product">
  <div class="section-grid section-grid--product">
    <button class="section-card section-card--product">
      <div class="section-card__icon">Icon</div>
      <div class="section-card__content">
        <p class="section-card__label">Product Name</p>
        <p class="section-card__description">Description</p>
      </div>
      <div class="section-card__tags">
        <span class="section-card__tag section-card__tag--[status]">Status</span>
      </div>
    </button>
  </div>
</section>
```

**CSS Design Needs:**
- Icon backgrounds: Multiple status colors (success/info/warning/error/purple)
- Product grid: 2 columns responsive
- Tags: Status-specific colors with different opacity values

**SCSS File:** `_product.scss`

---

### 8. **Chart Section**
**HTML Pattern:**
```html
<section class="section-block section-block--chart">
  <div class="section-chart">
    <div class="chart-bar">
      <div class="chart-bar__fill"></div>
      <div class="chart-bar__label">Label</div>
    </div>
    <div class="chart-legend">
      <div class="chart-legend__item">Item</div>
    </div>
  </div>
</section>
```

**CSS Design Needs:**
- Bar chart: Background (light orange) + Fill (dark orange)
- Legend: Dot indicators with box-shadow
- Responsive: Adapt to container width

**SCSS File:** `_chart.scss`

---

### 9. **Quotation Section**
**HTML Pattern:**
```html
<section class="section-block section-block--quotation">
  <div class="quotation-card">
    <div class="quotation-card__left-border"></div>
    <blockquote class="quotation-card__content">
      <p>"Quote text"</p>
      <footer class="quotation-card__footer">
        <p class="quotation-card__author">Author</p>
        <p class="quotation-card__source">Source</p>
      </footer>
    </blockquote>
  </div>
</section>
```

**CSS Design Needs:**
- Left border accent: 3px solid orange
- Quote styling: Italic, medium-sized font
- Author/source: Small, light gray
- Background: Subtle orange tint

**SCSS File:** `_quotation.scss`

---

### 10. **Network Card Section**
**HTML Pattern:**
```html
<section class="section-block section-block--network">
  <div class="section-grid section-grid--network">
    <button class="section-card section-card--network">
      <div class="section-card__icon" [ngClass]="'icon--[type]'">Icon</div>
      <p class="section-card__title">Title</p>
      <p class="section-card__description">Description</p>
      <div class="section-card__chevron">→</div>
    </button>
  </div>
</section>
```

**CSS Design Needs:**
- Icon backgrounds: Multiple colors per network type (social/messaging/web/etc)
- Icon backgrounds: Orange tint (0.15 opacity base)
- Hover effect: Title color shift to orange, chevron transform
- Grid: 2 columns responsive

**SCSS File:** `_network.scss`

---

### 11. **Solutions Section**
**HTML Pattern:**
```html
<section class="section-block section-block--solutions">
  <div class="section-grid section-grid--solutions">
    <button class="section-card section-card--solution">
      <div class="section-card__icon">Icon</div>
      <p class="section-card__label">Solution Name</p>
      <p class="section-card__description">Description</p>
      <div class="section-card__tag">Badge/Status</div>
    </button>
  </div>
</section>
```

**CSS Design Needs:**
- Icon backgrounds: Multiple solution types
- Badge styling: Semantic colors
- Compact grid: 2 columns

**SCSS File:** `_solutions.scss`

---

### 12. **Text Reference Section**
**HTML Pattern:**
```html
<section class="section-block section-block--text-reference">
  <article class="text-reference-card">
    <h4 class="text-reference-card__title">Title</h4>
    <p class="text-reference-card__description">Description/excerpt</p>
    <a class="text-reference-card__link">Link →</a>
  </article>
</section>
```

**CSS Design Needs:**
- Text-focused layout: Single column
- Link styling: Orange accent on hover
- Typography: Clear hierarchy

**SCSS File:** `_text-reference.scss`

---

### 13. **Financials Section**
**HTML Pattern:**
```html
<section class="section-block section-block--financials">
  <div class="section-grid section-grid--financials">
    <div class="section-card section-card--financial">
      <p class="section-card__label">Metric</p>
      <p class="section-card__value">$Value</p>
      <div class="section-card__meta">Change/Trend</div>
    </div>
  </div>
</section>
```

**CSS Design Needs:**
- Value styling: Large, bold currency amounts
- Trend indicators: Color-coded (green/red)
- Grid: 2 columns responsive

**SCSS File:** `_financials.scss`

---

## Styling Patterns Across All Components

### 1. **Button vs Div Elements**
- Interactive items: `<button>` tags (grid items, list items, clickable cards)
- Static content: `<div>` tags (section containers, map sections, quotations)
- **CSS Impact:** Button elements need `border: none; background: transparent; padding: 0; font-family: inherit;` reset

### 2. **Icon Integration Pattern**
```html
<lucide-icon [name]="iconName" [size]="16" [ngClass]="cssClass"></lucide-icon>
```
- All icons use LucideIconsModule
- Icon wrapper: `.section-card__icon`
- Icon background colors: Vary by component type

### 3. **Status/Priority Classes**
- Applied to tags and badges: `.section-card__tag--[status]`
- Status types: `success`, `warning`, `error`, `info`, `primary`
- Each status has: Different background color (0.14-0.18 opacity)

### 4. **Animation Pattern**
```html
[style.animation]="getAnimationDuration(0.55)"
[style.animation-delay]="getAnimationDelay(i, 50)"
```
- Applied to: Grid items in most sections
- Not applied to: Map sections, quotations, text references
- **CSS Impact:** Need to ensure animations don't conflict with hover states

### 5. **Grid Layout Pattern**
- All use: `display: grid; grid-template-columns: repeat(2, 1fr);` (2 columns)
- Mobile breakpoint: `grid-template-columns: 1fr;` (1 column)
- Gap: `var(--section-grid-gap)` (12px)

### 6. **Responsive Patterns**
- Mobile breakpoint: `@media (max-width: 500px)`
- Tablet breakpoint: `@media (max-width: 900px)` (some components)
- Adjustments: Column reduction, font size reduction, spacing reduction

---

## CSS Variables Usage in HTML

### Applied via Templates:
- `[ngClass]` for status/type-specific classes
- `[style.animation-delay]` for staggered animations
- `[ngClass]="getTrendClass(field)"` for trend indicator styling

### Expected CSS Variables:
- Color variables for trend/status indicators
- Font variables for different text sizes
- Animation variables for duration/timing
- Spacing variables for gaps and padding

---

## Design System Requirements from HTML Structure

### 1. **Color Palette Requirements:**
- Primary orange with multiple opacities (badges, backgrounds, accents)
- Status colors: Success (green), Warning (amber), Error (red), Info (blue)
- Icon backgrounds: One color per icon type (social, network, solution, etc.)
- Trend indicators: Up (green), Down (red), Stable (gray)

### 2. **Font Size Hierarchy:**
- Labels: Small (0.6-0.75rem)
- Values: Medium (0.85-0.95rem)
- Large values (metrics, financials): Large (1.3rem+)
- Titles: Medium-large (0.92-1.02rem)
- Descriptions: Small (0.75-0.85rem)
- Meta text: Extra-small (0.65-0.72rem)

### 3. **Spacing Requirements:**
- Card padding: Unified 10px 12px
- Grid gap: 12px (desktop), 6px (mobile)
- Internal card spacing: 6-12px between elements
- Badge/tag padding: 3px 6px (small), 4px 8px (medium)

### 4. **Hover Effects Needed:**
- Card hover: Border color shift + background shift + shadow
- Title/link hover: Color shift to accent orange
- Icon hover: Background opacity increase
- Transform hover: Chevron/arrow slight translation

### 5. **Border Styling:**
- Card border: 1px solid orange (0.2 opacity) - standardized
- Icon border: 1px solid (varies by component type)
- Left accent border: 3px solid orange (lists, events, quotations)
- Avatar border: 2px solid orange (0.3 opacity)

---

## Summary: HTML-Based CSS Requirements

| Element | Current Classes | CSS Needs | Variable Type |
|---------|-----------------|-----------|---------------|
| Card Container | `.section-card` | Base padding, border, radius, shadow | Card variables |
| Card Label | `.section-card__label` | Font size, color, spacing | Typography variables |
| Card Value | `.section-card__value` | Font size (large), weight, color | Typography variables |
| Progress Bar | `.section-card__progress-bar` | Background color, fill color | Color variables |
| Icon Container | `.section-card__icon` | Background color (type-specific), padding | Color + spacing variables |
| Status Tags | `.section-card__tag` | Background (status-specific), text color, padding | Color variables |
| Grid Container | `.section-grid` | Gap, columns, responsive behavior | Spacing variables |
| Empty State | `.section-empty` | Icon size, spacing, text color | Typography + spacing variables |

