# Section SCSS Usage Guide

How to use and customize section styles with the design system.

---

## 📁 File Structure

Every section has its own SCSS file:

```
sections/
  analytics-section/
    ├── analytics-section.scss    ← Section styles
    └── ...
```

---

## 🎨 SCSS Template Structure

Each section SCSS file follows this pattern:

```scss
// ============= IMPORTS =============
// Import master design system
@use '../../../styles/components/sections/design-system' as *;
@use '../../../styles/components/sections/sections-base' as *;

// ============= HOST =============
:host {
  display: block;
  width: 100%;
}

// ============= CUSTOM STYLES =============
// Add your section-specific styles below
```

---

## 🔧 Available Mixins

### Layout Mixins

```scss
// Responsive grid layout
.my-grid {
  @include section-grid(200px, 12px);
  // Creates: grid with min 200px columns, 12px gap
}

// Vertical stacking
.my-list {
  @include list-stack(10px);
  // Creates: flex column with 10px gap
}

// Base card styling
.my-card {
  @include card;
  // Applies: background, border, padding, hover states
}
```

### Typography Mixins

```scss
.section-title {
  @include section-heading-text;
  // Applies: font-size, weight, color, line-height
}

.section-description {
  @include section-description-text;
  // Applies: smaller font, secondary color
}

.field-label {
  @include card-label;
  // Applies: uppercase, small, muted color
}

.field-value {
  @include card-value;
  // Applies: larger, bolder, primary color
}
```

### Component Mixins

```scss
.badge {
  @include standard-badge;
  // Applies: inline-flex, padding, uppercase, brand color
}
```

---

## 💡 Example: Custom Analytics Section

**File:** `analytics-section/analytics-section.scss`

```scss
@use '../../../styles/components/sections/design-system' as *;
@use '../../../styles/components/sections/sections-base' as *;

:host {
  display: block;
}

// ============= CUSTOM ANALYTICS STYLES =============

// Grid layout for metrics
.analytics-grid {
  @include section-grid(180px, 12px);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

// Metric card
.metric-card {
  @include card;

  // Custom: Add gradient background
  background: linear-gradient(
    135deg,
    var(--section-item-background) 0%,
    var(--section-item-background-hover) 100%
  );

  // Custom: Larger padding
  padding: var(--section-item-padding, 16px);

  // Custom: Add shine effect
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.05),
      transparent
    );
    transition: left 0.5s;
  }

  &:hover::after {
    left: 100%;
  }
}

// Performance indicator
.performance-badge {
  @include standard-badge;

  // Custom: Color based on performance
  &--excellent {
    background: var(--status-success-10);
    color: var(--status-success);
  }

  &--good {
    background: var(--accent-color-10);
    color: var(--accent-color);
  }

  &--poor {
    background: var(--status-error-10);
    color: var(--status-error);
  }
}

// Trend indicator
.trend-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.65rem;
  font-weight: 600;

  &--up { color: var(--status-success); }
  &--down { color: var(--status-error); }
  &--stable { color: var(--status-warning); }
}
```

---

## 💡 Example: Custom Contact Card

**File:** `contact-card-section/contact-card-section.scss`

```scss
@use '../../../styles/components/sections/design-system' as *;
@use '../../../styles/components/sections/sections-base' as *;

:host {
  display: block;
}

// ============= CUSTOM CONTACT STYLES =============

.contact-grid {
  @include section-grid(250px, 16px);
}

.contact-card {
  @include card;

  // Custom: Center content
  text-align: center;
  align-items: center;

  // Custom: Add avatar space
  padding-top: 60px;
}

.contact-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid var(--accent-color);
  object-fit: cover;
  margin-bottom: var(--card-gap);

  // Custom: Positioning
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
}

.contact-name {
  @include section-heading-text;
  font-size: 1rem;
}

.contact-role {
  @include card-label;
  text-transform: none;
  margin-bottom: var(--card-gap);
}

.contact-links {
  display: flex;
  gap: 8px;
  justify-content: center;

  a {
    @include standard-badge;
    text-decoration: none;

    &:hover {
      background: var(--accent-color);
      color: white;
    }
  }
}
```

---

## 🎯 CSS Variables Reference

### Colors
```scss
var(--section-item-background)          // Card background
var(--section-item-background-hover)    // Card hover background
var(--section-item-border-color)        // Border color
var(--accent-color)                     // Brand accent color
var(--accent-color-10)                  // 10% opacity accent
var(--foreground)                       // Primary text color
var(--muted-foreground)                 // Secondary text color
var(--status-success)                   // Success color
var(--status-error)                     // Error color
var(--status-warning)                   // Warning color
```

### Spacing
```scss
var(--section-card-gap)                 // Gap between cards
var(--section-item-padding)             // Card padding
var(--card-padding)                     // General padding
var(--card-gap)                         // General gap
var(--section-grid-gap)                 // Grid gap
```

### Typography
```scss
var(--card-label-font-size)             // Label font size
var(--card-value-font-size)             // Value font size
var(--card-subtitle-font-size)          // Subtitle size
var(--section-title-font-size)          // Section title size
var(--section-title-font-weight)        // Section title weight
```

### Borders & Radii
```scss
var(--section-item-border-radius)       // Card border radius
var(--border)                           // Border color
var(--radius-xs)                        // Extra small radius
var(--radius-sm)                        // Small radius
var(--radius-md)                        // Medium radius
var(--radius-lg)                        // Large radius
```

---

## 🚀 Quick Start

1. **Open section SCSS file**
   ```bash
   cd sections/analytics-section
   vim analytics-section.scss
   ```

2. **Add custom styles**
   ```scss
   .my-custom-element {
     @include card;
     // Custom styles here
   }
   ```

3. **Compile**
   ```bash
   npm run build:styles
   ```

4. **Done!** Styles automatically loaded.

---

## 📚 More Examples

See individual section README.md files for usage examples.

See `_SECTION_SCSS_TEMPLATE.scss` for the base template.

---

**Happy Styling! 🎨**


