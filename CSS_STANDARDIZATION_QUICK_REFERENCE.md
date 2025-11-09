# CSS Standardization Quick Reference

## Using the Standardized Card System

### For Adding New Sections

#### 1. Create Component SCSS
```scss
/* src/styles/components/sections/_[name].scss */

@use 'sections-base' as *;

.section-grid--[name] {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--section-grid-gap);

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
    gap: var(--section-grid-gap-mobile);
  }
}

.section-card--[name] {
  @include card;  // This provides: padding, border-radius, border, hover states
  /* Add section-specific styles only */
}

.card__label {
  @extend %unified-card-label;  // Enforces: 0.6rem, uppercase, letter-spacing
}

.card__value {
  @extend %unified-card-value;  // Enforces: 0.85rem, bold
}

// For analytics values
.card__value--lg {
  @extend %unified-card-value-lg;  // Enforces: 1.3rem, bold
}
```

#### 2. Color Guidelines
```scss
// Always use rgba() format for colors
// Primary orange colors:
--card-border: rgba(255, 121, 0, 0.2);           // 20% opacity (normal)
--card-border-hover: rgba(255, 121, 0, 0.4);     // 40% opacity (hover)
--card-background: rgba(255, 121, 0, 0.03);      // 3% opacity (background)
--card-background-hover: rgba(255, 121, 0, 0.06);// 6% opacity (hover)

// Text colors:
--label-color: rgba(255, 255, 255, 0.55);        // 55% opacity (labels)
--meta-color: rgba(255, 255, 255, 0.6);          // 60% opacity (metadata)
--value-color: var(--foreground);                // Full contrast values
```

#### 3. Register in `styles.scss`
```scss
// Add to src/styles.scss imports:
@import 'styles/components/sections/[name]';
```

### Standard Design Tokens

#### Spacing
```
--spacing-xs: 2px
--spacing-sm: 4px
--spacing-md: 6px
--spacing-lg: 8px
--spacing-xl: 12px
...
--section-grid-gap: 12px        (desktop)
--section-grid-gap-mobile: 6px  (mobile)
--card-gap: 8px                 (internal gap)
```

#### Typography
```
--card-label-font-size: 0.6rem (with uppercase, letter-spacing: 0.04em)
--card-value-font-size: 0.85rem (with font-weight: 700)
--card-value-font-size-lg: 1.3rem (for analytics)
```

#### Card Styling
```
--card-padding: 10px 12px (all cards)
--card-border-radius: 6px (all cards)
--card-border: 1px solid rgba(255, 121, 0, 0.2)
--card-box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1)
```

#### Responsive Breakpoint
```
Mobile: max-width: 500px
- Switch to 1-column grid
- Use --section-grid-gap-mobile (6px)
- Padding remains: 10px 12px
```

## Common Patterns

### Pattern 1: Simple Card Grid
```scss
.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--section-grid-gap);

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
    gap: var(--section-grid-gap-mobile);
  }
}

.card {
  @include card;
}
```

### Pattern 2: Card with Label/Value
```scss
.card {
  @include card;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.label {
  @extend %unified-card-label;
}

.value {
  @extend %unified-card-value;
}
```

### Pattern 3: Card with Icon + Content
```scss
.card {
  @include card;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--spacing-lg);
  align-items: center;
}

.icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 121, 0, 0.15);
  color: rgba(255, 121, 0, 0.8);
  border: 1px solid rgba(255, 121, 0, 0.3);
}

.content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--foreground);
}

.meta {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.6);
}
```

### Pattern 4: Hover Interaction
```scss
.card {
  @include card;  // Already includes hover: border-color 0.4, background 0.06
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.card:hover {
  border-color: var(--card-hover-border);
  background: var(--card-hover-background);
}

// For icons inside
.card__icon {
  color: rgba(255, 121, 0, 0.8);
  transition: color 0.2s ease;
}

.card:hover .card__icon {
  color: rgba(255, 121, 0, 1);
}
```

### Pattern 5: Analytics Metric with Progress
```scss
.metric {
  @include card;
}

.metric__label {
  @extend %unified-card-label;
}

.metric__value {
  @extend %unified-card-value-lg;  // 1.3rem for emphasis
}

.metric__progress {
  width: 100%;
  height: 3px;
  border-radius: 2px;
  background: rgba(255, 121, 0, 0.15);
  overflow: hidden;
}

.metric__progress-bar {
  height: 100%;
  background: rgba(255, 121, 0, 0.7);
  border-radius: inherit;
  transition: width 0.5s ease;
}
```

## What NOT to Do

### ❌ Don't
```scss
// Don't hardcode colors
.card { border: 1px solid #ff7900; }

// Don't use different padding
.card { padding: 15px 18px; }

// Don't use custom border-radius
.card { border-radius: 8px; }

// Don't create multiple font sizes
.label { font-size: 0.65rem; }  // Wrong: should be 0.6rem

// Don't use auto-fit or auto-fill for card grids
.grid { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }

// Don't skip mobile breakpoint
.grid { grid-template-columns: repeat(2, 1fr); }  // No mobile query

// Don't use color-mix() for orange
.icon { color: color-mix(in srgb, var(--accent) 92%, transparent); }

// Don't vary gap values
.grid { gap: 16px; }  // Should use --section-grid-gap (12px)
```

### ✅ Do
```scss
// Use CSS variables
.card { border: var(--card-border); }

// Use standardized padding
.card { @include card; }  // 10px 12px enforced

// Use standardized radius
.card { @include card; }  // 6px enforced

// Use standardized fonts
.label { @extend %unified-card-label; }  // 0.6rem enforced

// Use fixed 2-column grid
.grid { grid-template-columns: repeat(2, 1fr); }

// Always include mobile breakpoint
.grid {
  grid-template-columns: repeat(2, 1fr);
  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
}

// Use direct rgba()
.icon { color: rgba(255, 121, 0, 0.8); }

// Use standard gaps
.grid { gap: var(--section-grid-gap); }  // 12px
```

## Debugging Checklist

- [ ] Is `@include card` applied to all card elements?
- [ ] Are all colors in `rgba()` format?
- [ ] Is padding 10px 12px (or using `@include card`)?
- [ ] Is border-radius 6px (or using `@include card`)?
- [ ] Is grid layout 2-column with mobile 1-column?
- [ ] Are labels 0.6rem (using `@extend %unified-card-label`)?
- [ ] Are values 0.85rem or 1.3rem (using `@extend %unified-card-value` or `%unified-card-value-lg`)?
- [ ] Is mobile breakpoint max-width: 500px?
- [ ] Are gaps using CSS variables (not hardcoded)?
- [ ] Do hover states work (border opacity + background shift)?

## Update Frequency

- **Design System Variables:** Update `src/styles/core/_variables.scss`
- **Base Mixins:** Update `src/styles/components/sections/_sections-base.scss`
- **Typography Patterns:** Update `src/styles/components/sections/_unified-cards.scss`
- **Section Specific:** Update individual `_[name].scss` files

## Testing

```bash
# Build and verify no CSS errors
npm run build

# Run dev server
npm start

# Check computed styles in browser DevTools
# Verify:
# 1. All cards have 10px 12px padding
# 2. All cards have 6px border-radius
# 3. All grids are 2-column (desktop) or 1-column (mobile)
# 4. All labels are 0.6rem
# 5. All values are 0.85rem or 1.3rem
# 6. Hover states work correctly
```

---

**Last Updated:** 2025-01-XX
**Standardization Status:** Complete ✅
**Maintenance Mode:** Active
