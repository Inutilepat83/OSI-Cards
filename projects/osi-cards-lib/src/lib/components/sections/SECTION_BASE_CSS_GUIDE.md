# Section Base CSS Guide

## Overview

All sections now have access to a unified base CSS system. This ensures consistency across all section types while allowing each section to add its own specific styling on top.

## Quick Start

### 1. Template Structure

All section templates should wrap their content in the `.ai-section` class:

```html
<div class="ai-section ai-section--{section-type} section-content">
  <lib-section-header *ngIf="section.title" [title]="section.title" [description]="section.description">
  </lib-section-header>

  <!-- Your section content here -->
</div>
```

**Example:**
```html
<div class="ai-section ai-section--product section-content">
  <!-- Product section content -->
</div>
```

### 2. SCSS Imports

At the top of your section SCSS file, import the base styles:

```scss
// Import base section styles
@import "../../../styles/components/sections/sections-base";
@import "../../../styles/components/sections/section-shell";
@import "../../../styles/mixins/section-mixins";
```

### 3. Using Base Mixins

Use base mixins for common patterns:

```scss
// For card-like items
.product-card {
  @include card; // Base card styling
  // Add product-specific styles here
}

// For list items
.news-item {
  @include list-item; // Base list item styling
  // Add news-specific styles here
}

// For field items
.info-field {
  @include field-item; // Base field styling
  // Add info-specific styles here
}
```

### 4. Using CSS Variables

Replace hardcoded values with CSS variables:

```scss
// ❌ Bad - Hardcoded values
.product-title {
  font-size: 0.9375rem;
  color: #1a1d23;
  background: white;
}

// ✅ Good - CSS variables
.product-title {
  font-size: var(--card-title-font-size, 0.9375rem);
  color: var(--foreground, #1a1d23);
  background: var(--section-item-background, white);
}
```

## Available CSS Variables

### Spacing
- `--section-padding` - Section container padding
- `--section-card-gap` - Gap between cards/items
- `--section-field-gap` - Gap between fields
- `--section-item-gap` - Gap between list items
- `--card-padding` - Card internal padding
- `--card-gap` - Card internal gap

### Colors
- `--section-background` - Section background color
- `--section-background-hover` - Section hover background
- `--section-item-background` - Item/card background
- `--section-item-background-hover` - Item hover background
- `--foreground` - Primary text color
- `--muted-foreground` - Secondary/muted text color
- `--accent` - Accent color (brand color)
- `--border` - Border color
- `--border-hover` - Border hover color

### Typography
- `--card-title-font-size` - Title font size
- `--card-title-font-weight` - Title font weight
- `--card-subtitle-font-size` - Subtitle font size
- `--card-meta-font-size` - Meta text font size
- `--card-label-font-size` - Label font size
- `--font-semibold` - Semibold font weight (600)
- `--font-bold` - Bold font weight (700)

### Borders & Effects
- `--section-border-radius` - Section border radius
- `--section-item-border-radius` - Item border radius
- `--section-item-box-shadow` - Item box shadow
- `--section-item-box-shadow-hover` - Item hover shadow

### Section-Specific
- `--section-accent` - Section-specific accent color (inherits from `--accent`)

## Available Mixins

### Layout Mixins
```scss
@include section-base;          // Base section container
@include section-header;        // Section header/title
@include section-field-grid(2); // Grid layout for fields
@include section-item-list;     // List layout for items
```

### Component Mixins
```scss
@include card;                  // Base card styling
@include field-item;            // Field item styling
@include list-item;             // List item styling
@include section-empty-state;   // Empty state styling
```

### Typography Mixins
```scss
@include section-header;        // Section header
@include field-label;           // Field label
@include field-value;           // Field value
```

## Migration Checklist

When updating an existing section:

- [ ] Wrap template content in `.ai-section ai-section--{type} section-content`
- [ ] Import base styles in SCSS file
- [ ] Replace hardcoded colors with CSS variables
- [ ] Replace hardcoded spacing with CSS variables
- [ ] Replace hardcoded font sizes with CSS variables
- [ ] Use base mixins for common patterns (`@include card`, `@include list-item`, etc.)
- [ ] Test in browser to ensure styles still work
- [ ] Verify theme switching works (light/dark mode)

## Examples

### Product Section (Updated)

**Template:**
```html
<div class="ai-section ai-section--product section-content">
  <!-- content -->
</div>
```

**SCSS:**
```scss
@import "../../../styles/components/sections/sections-base";
@import "../../../styles/components/sections/section-shell";
@import "../../../styles/mixins/section-mixins";

.product-card {
  @include card; // Base card styling
  min-height: 180px;

  // Product-specific overrides
  padding: var(--card-padding, 0.875rem);
}
```

### News Section (Updated)

**Template:**
```html
<div class="ai-section ai-section--news section-content">
  <!-- content -->
</div>
```

**SCSS:**
```scss
@import "../../../styles/components/sections/sections-base";
@import "../../../styles/components/sections/section-shell";
@import "../../../styles/mixins/section-mixins";

.news-row {
  @include list-item; // Base list item styling
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}
```

## Benefits

1. **Consistency** - All sections share the same base styling
2. **Theme Support** - Automatic light/dark mode support via CSS variables
3. **Maintainability** - Update base styles once, affects all sections
4. **Flexibility** - Sections can still add their own specific styles
5. **Performance** - Shared base styles reduce CSS bundle size

## Questions?

If you have questions about using base section CSS, check:
- `_sections-base.scss` - Base card and grid mixins
- `_section-shell.scss` - Section container styles
- `_section-mixins.scss` - Common section mixins
- Existing updated sections (product, news, analytics) for examples





