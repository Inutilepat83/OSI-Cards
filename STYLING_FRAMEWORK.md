# Styling Framework Guide

**Purpose:** This document defines the framework for styling sections while maintaining uniformity through main variables.

## Core Principles

### 1. **Use Main Variables for Foundation**
All sections MUST use the main variables defined in `_variables.scss` for:
- Spacing: `--card-gap`, `--section-card-gap`, `--card-padding`
- Typography: `--card-label-font-size`, `--card-value-font-size`, etc.
- Colors: `--card-background`, `--card-border`, `--card-text-primary`, etc.
- Borders: `--section-card-border-radius`
- Shadows: `--card-box-shadow`, `--card-box-shadow-hover`

### 2. **Unified Card Mixin**
All cards MUST use `@mixin card` from `_sections-base.scss`:
```scss
.my-card {
  @include card;
  // Card mixin provides:
  // - Border, background, padding, border-radius
  // - Consistent hover states (border, background, shadow only)
  // - No transforms on cards themselves
}
```

### 3. **No Transforms on Cards**
Cards themselves MUST NOT use transforms:
- ❌ `transform: translateY()`, `transform: scale()`, `transform: translateX()`
- ✅ Cards stay stationary on hover
- ✅ Hover effects: border-color, background, box-shadow only
- ✅ Child elements (icons, chevrons) can have subtle animations if needed

### 4. **Standardized Transitions**
All transitions MUST use the standard timing:
- Duration: `0.22s`
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- Properties: Only animate what's needed (color, opacity, border-color, etc.)

### 5. **Specific Styling Framework**
When you need section-specific styling, follow this framework:

## Framework for Specific Styling

### Step 1: Start with Unified Base
```scss
.my-section-card {
  @include card;
  // Card mixin provides all base styling
}
```

### Step 2: Add Layout-Specific Styles
```scss
.my-section-card {
  @include card;
  
  // Layout overrides (if needed)
  display: flex;
  flex-direction: row; // Override default column if needed
  align-items: center;
}
```

### Step 3: Style Child Elements
```scss
.my-section-card {
  @include card;
  
  // Use main variables for child elements
  &__title {
    @include card-title-text; // Uses --card-title-font-size, etc.
    color: var(--card-text-primary);
    transition: color 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  &__meta {
    display: flex;
    gap: var(--card-gap); // Use main variable
    font-size: var(--card-meta-font-size); // Use main variable
    color: var(--card-text-muted); // Use main variable
  }
}
```

### Step 4: Add Subtle Child Element Animations (Optional)
```scss
.my-section-card {
  @include card;
  
  // Child elements can have subtle animations
  &__icon {
    transition: opacity 0.22s cubic-bezier(0.4, 0, 0.2, 1), 
                box-shadow 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    
    // Use opacity/color changes instead of transforms
    .my-section-card:hover & {
      opacity: 1;
      box-shadow: var(--card-box-shadow-hover);
    }
  }
  
  &__chevron {
    transition: color 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    
    // Use color change instead of transform
    .my-section-card:hover & {
      color: var(--card-text-hover);
      opacity: 1;
    }
  }
}
```

## Main Variables Reference

### Spacing Variables
```scss
--card-gap: 8px;              // Internal element spacing
--section-card-gap: 12px;     // Gap between cards in grid
--card-padding: 12px;         // Card internal padding
--section-padding: 12px;      // Section container padding
```

### Typography Variables
```scss
--card-label-font-size: clamp(0.54rem, 0.48rem + 0.16vw, 0.68rem);
--card-value-font-size: clamp(0.84rem, 0.76rem + 0.26vw, 1.06rem);
--card-title-font-size: clamp(0.84rem, 0.76rem + 0.24vw, 1rem);
--card-subtitle-font-size: clamp(0.7rem, 0.62rem + 0.16vw, 0.86rem);
--card-meta-font-size: clamp(0.64rem, 0.56rem + 0.16vw, 0.8rem);
```

### Color Variables
```scss
--card-background: rgba(255, 121, 0, 0.025);
--card-background-hover: rgba(255, 121, 0, 0.055);
--card-border: 1px solid rgba(255, 121, 0, 0.2);
--card-border-hover: rgba(255, 121, 0, 0.45);
--card-text-primary: var(--foreground);
--card-text-secondary: var(--muted-foreground);
--card-text-muted: var(--muted-foreground);
--card-text-hover: var(--primary);
```

### Border & Shadow Variables
```scss
--section-card-border-radius: 8px;
--card-box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
--card-box-shadow-hover: 0 10px 32px rgba(255, 121, 0, 0.18);
```

## Typography Mixins

Use these mixins for consistent typography:
```scss
@include label-text;          // For labels (uses --card-label-*)
@include value-text;          // For values (uses --card-value-*)
@include value-text-lg;       // For large values (uses --card-value-font-size-large)
@include card-title-text;     // For titles (uses --card-title-*)
@include card-subtitle-text;  // For subtitles (uses --card-subtitle-*)
@include card-meta-text;      // For meta text (uses --card-meta-*)
```

## Grid System

Use the unified grid mixin:
```scss
.my-section-grid {
  @include section-responsive-grid(var(--section-grid-min-width), var(--section-card-gap));
  // Provides:
  // - Responsive grid with 200px min-width
  // - 12px gap between cards
  // - Auto-fit columns
}
```

## What NOT to Do

### ❌ Don't Use Deprecated Patterns
```scss
// ❌ Don't use deprecated mixins
@include compact-card;
@include list-card;

// ✅ Use unified mixin instead
@include card;
```

### ❌ Don't Add Transforms to Cards
```scss
// ❌ Don't add transforms to cards
.my-card:hover {
  transform: translateY(-2px);
  transform: scale(1.05);
}

// ✅ Cards stay stationary
// Hover effects: border, background, shadow only
```

### ❌ Don't Use Custom Spacing Values
```scss
// ❌ Don't use custom spacing
gap: 16px;
padding: 14px;
margin-top: 10px;

// ✅ Use main variables
gap: var(--card-gap);
padding: var(--card-padding);
margin-top: var(--card-gap);
```

### ❌ Don't Override Card Hover States
```scss
// ❌ Don't override card hover
.my-card:hover {
  border-color: custom-color;
  background: custom-background;
  // Card mixin already handles this
}

// ✅ Let card mixin handle hover states
// Or use child element hover for specific feedback
```

### ❌ Don't Use Custom Transitions
```scss
// ❌ Don't use custom transitions
transition: all 0.3s ease;
transition: transform 0.25s ease;

// ✅ Use standardized transitions
transition: color 0.22s cubic-bezier(0.4, 0, 0.2, 1);
```

## Examples

### Example 1: Simple Card
```scss
.info-card {
  @include card;
  
  &__label {
    @include label-text;
  }
  
  &__value {
    @include value-text;
  }
}
```

### Example 2: Card with Layout Override
```scss
.contact-card {
  @include card;
  align-items: flex-start; // Override default
  
  &__details {
    display: flex;
    flex-direction: column;
    gap: var(--card-gap);
  }
  
  &__name {
    @include card-title-text;
  }
  
  &__role {
    @include card-subtitle-text;
  }
}
```

### Example 3: Card with Child Element Animations
```scss
.product-card {
  @include card;
  
  &__icon {
    transition: opacity 0.22s cubic-bezier(0.4, 0, 0.2, 1), 
                box-shadow 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    
    // Subtle shadow enhancement on card hover
    .product-card:hover & {
      box-shadow: var(--card-box-shadow-hover);
      opacity: 1;
    }
  }
  
  &__title {
    @include card-title-text;
    transition: color 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  // Color change on hover instead of transform
  &:hover &__title {
    color: var(--card-text-hover);
  }
}
```

### Example 4: Card Grid
```scss
.analytics-metrics {
  @include section-responsive-grid(var(--section-grid-min-width), var(--section-card-gap));
}

.analytics-metric {
  @include card;
  
  &__label {
    @include label-text;
  }
  
  &__value {
    @include value-text-lg;
  }
}
```

## Migration Checklist

When creating or updating a section:

- [ ] Use `@include card` for all cards
- [ ] Use main variables for spacing (`--card-gap`, `--section-card-gap`)
- [ ] Use main variables for typography (`--card-label-font-size`, etc.)
- [ ] Use typography mixins (`@include label-text`, etc.)
- [ ] Use standardized transitions (0.22s cubic-bezier)
- [ ] No transforms on cards themselves
- [ ] No custom hover states on cards (use child element hover if needed)
- [ ] Use main variables for colors (`--card-text-primary`, etc.)
- [ ] Use main variables for borders (`--section-card-border-radius`)
- [ ] Use main variables for shadows (`--card-box-shadow`, etc.)

## Benefits

1. **Uniformity:** All sections use the same base styling
2. **Maintainability:** Change variables in one place, affects all sections
3. **Consistency:** Predictable behavior across all sections
4. **Performance:** Optimized transitions and hover states
5. **Accessibility:** Proper focus states and reduced motion support
6. **Flexibility:** Framework allows specific styling while maintaining uniformity

## Related Documentation

- `UNIFIED_CARD_DESIGN.md` - Unified card design system
- `DESIGN_VARIABLE_CONSOLIDATION.md` - Variable consolidation guide
- `DESIGN_REVIEW.md` - Design system review
- `_variables.scss` - Main variables definition
- `_sections-base.scss` - Unified card mixin

