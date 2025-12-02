# Enhanced Design System Guide

Complete guide to using the modern, enhanced design system for OSI Cards sections.

---

## 🎨 Overview

The enhanced design system provides:

- **Design Tokens** - Comprehensive spacing, typography, color, and effect variables
- **Compact Spacing** - Optimized spacing system for dense, efficient layouts
- **Modern Effects** - Glass morphism, gradients, animations, and micro-interactions
- **Component Mixins** - Pre-built patterns for common UI elements
- **Typography System** - Semantic text styles with responsive options
- **Utility Classes** - Optional classes for rapid development

### 🎯 Compact by Default

All sections use **compact spacing** for optimal information density (~35-40% space savings).

---

## 📦 What's New

### Enhanced Features

✨ **Design Tokens**
- Spacing scale (8px base)
- Typography scale with semantic sizes
- Shadow system (6 levels + glow effects)
- Border radius scale
- Transition & timing utilities
- Z-index scale

✨ **Modern Effects**
- Glass morphism cards
- Gradient accents
- Shimmer/shine effects
- Elevated cards with lift
- Glow effects
- Animated borders
- Ripple effects
- Skeleton loading
- Neumorphism (soft UI)

✨ **Component Mixins**
- Enhanced card variants
- Stat/metric cards
- Modern badges & chips
- Avatars & avatar groups
- Icon buttons
- Progress indicators (bar & circle)
- Tooltips
- Input fields
- Empty states

✨ **Typography System**
- 6 heading levels
- 4 body text sizes
- Semantic variants (primary, secondary, tertiary)
- Labels & captions
- Code styling (inline & block)
- Link styles
- Number displays
- Text truncation utilities

---

## 🚀 Quick Start

### Import the Design System

```scss
// In your section SCSS file
@use '../../../styles/components/sections/design-system' as *;
```

That's it! You now have access to all mixins and tokens.

---

## 💡 Common Examples

### 1. Enhanced Card with Lift Effect

```scss
.metric-card {
  @include card-elevated;  // Card with hover lift

  // Adds:
  // - Base card styling
  // - Hover lift effect (translateY)
  // - Shimmer effect on hover
}
```

### 2. Glass Morphism Panel

```scss
.glass-panel {
  @include card-glass;

  // Adds:
  // - Frosted glass background
  // - Backdrop blur
  // - Subtle border
  // - Modern shadow
}
```

### 3. Stat Display

```scss
.stat-card {
  @include components.stat-card;

  .label {
    @include components.stat-label;
  }

  .value {
    @include components.stat-value;
  }

  .change {
    @include components.stat-change('positive');
    // Options: 'positive', 'negative', 'neutral'
  }
}
```

### 4. Modern Badge

```scss
.badge {
  @include components.badge-modern('success');
  // Variants: 'default', 'primary', 'success', 'warning', 'error'
}
```

### 5. Avatar

```scss
.avatar {
  @include components.avatar(48px);
}

.avatar-group {
  @include components.avatar-group;
}
```

### 6. Icon Button

```scss
.icon-btn {
  @include components.icon-button(36px);
}
```

### 7. Progress Bar

```scss
.progress {
  @include components.progress-bar(6px);
}
```

### 8. Typography

```scss
.title {
  @include heading(2);  // H2 style
}

.body {
  @include body-text('base');
  // Sizes: 'large', 'base', 'small', 'xs'
}

.label {
  @include typo.label-uppercase;
}

.caption {
  @include typo.caption;
}

.big-number {
  @include typo.number-display-large;
}
```

---

## 🎨 Using Design Tokens

### Spacing

```scss
.element {
  margin: var(--spacing-md);           // 12px
  padding: var(--spacing-base);        // 16px
  gap: var(--spacing-sm);              // 8px
}

// Standard Scale: none, xs, sm, md, base, lg, xl, 2xl, 3xl

// Compact Scale (for denser layouts):
.compact-element {
  padding: var(--spacing-compact-base);  // 10px
  gap: var(--spacing-compact-md);        // 8px
}

// Compact Scale: compact-xs (2px), compact-sm (4px), compact-md (8px),
//                compact-base (10px), compact-lg (16px)

// Section-Specific:
.section {
  gap: var(--section-header-gap);       // 12px
  min-height: var(--section-card-compact-height);  // 80px
}
```

### Typography

```scss
.text {
  font-size: var(--text-lg);           // 1.125rem
  font-weight: var(--font-semibold);   // 600
  line-height: var(--leading-normal);  // 1.5
}
```

### Colors

```scss
.card {
  background: var(--surface-base);
  color: var(--foreground);
  border-color: var(--border);
}

.accent-text {
  color: var(--accent);
}

.muted-text {
  color: var(--muted-foreground);
}
```

### Shadows

```scss
.card {
  box-shadow: var(--shadow-md);

  &:hover {
    box-shadow: var(--shadow-lg);
  }
}

// Scale: xs, sm, md, lg, xl, 2xl
// Glow: glow-sm, glow-md, glow-lg
```

### Border Radius

```scss
.card {
  border-radius: var(--radius-lg);  // 8px
}

.badge {
  border-radius: var(--radius-full);  // 9999px
}

// Scale: none, xs, sm, md, lg, xl, 2xl, full
```

### Transitions

```scss
.interactive {
  transition: var(--transition-base);
  // or
  transition: var(--transition-colors);
  transition: var(--transition-shadow);
  transition: var(--transition-transform);
}

// Durations: duration-fast (150ms), duration-base (200ms), duration-slow (300ms)
// Easing: ease-in, ease-out, ease-in-out, ease-bounce, ease-smooth
```

---

## ✨ Modern Effects

### Glass Morphism

```scss
.glass-card {
  @include effects.glass-card;
}
```

### Gradient Accent

```scss
.card {
  @include card;
  @include effects.gradient-accent-top;  // Gradient line on top
}
```

### Shimmer Effect

```scss
.card {
  @include card;
  @include effects.shimmer-effect;  // Shine on hover
}
```

### Elevated Card

```scss
.card {
  @include card;
  @include effects.elevated-card;  // Lift on hover
}
```

### Glow Effect

```scss
.card {
  @include effects.glow-on-hover('md');
  // Intensity: 'sm', 'md', 'lg'
}
```

### Interactive Surface

```scss
.clickable {
  @include effects.interactive-surface;
  // Adds hover, active, focus, and disabled states
}
```

### Animated Border

```scss
.card {
  @include card;
  @include effects.animated-border;
}
```

### Ripple Effect

```scss
.button {
  @include effects.ripple-effect;
}
```

### Skeleton Loading

```scss
.skeleton {
  @include effects.skeleton-loading;
}
```

### Neumorphism

```scss
.neumorphic-card {
  @include effects.neumorphic-card(true);
  // true = raised, false = inset
}
```

---

## 📐 Layout Mixins

### Grid Layouts

```scss
.grid {
  @include section-grid(200px, var(--spacing-md));
  // min-width, gap
}

.responsive-grid {
  @include section-responsive-grid(180px, var(--spacing-md));
}

// Compact variant (denser):
.compact-grid {
  @include compact.grid-compact(140px);
  // Uses compact spacing automatically
}
```

### Stack Layout

```scss
.stack {
  @include list-stack(var(--spacing-sm));
}

// Compact variant:
.compact-stack {
  @include compact.list-compact;
  // Tighter vertical spacing
}
```

### Compact Section Containers

```scss
.section {
  @include compact.section-container-compact;
  // Optimized spacing for sections
}

.section-header {
  @include compact.section-header-compact;
  // Reduced header sizes
}
```

---

## 🎯 Component Patterns

### Complete Stat Card Example

```scss
.metric-card {
  @include components.stat-card;

  &__label {
    @include components.stat-label;
  }

  &__value {
    @include components.stat-value;
  }

  &__change {
    @include components.stat-change('positive');
  }
}
```

### Contact Card Example

```scss
.contact-card {
  @include card-elevated;
  text-align: center;

  .avatar {
    @include components.avatar(80px);
    margin: 0 auto var(--spacing-md);
  }

  .name {
    @include heading(4);
  }

  .role {
    @include typo.caption;
    color: var(--muted-foreground);
  }

  .badge {
    @include components.badge-modern('primary');
  }
}
```

---

## 🛠️ Utility Classes (Optional)

If you prefer using classes directly in templates:

### Spacing

```html
<div class="p-base mt-md gap-sm">
  <!-- padding: 16px, margin-top: 12px, gap: 8px -->
</div>
```

### Layout

```html
<div class="d-flex items-center justify-between gap-md">
  <!-- flex container with center alignment and space between -->
</div>
```

### Typography

```html
<h2 class="text-2xl font-bold text-primary">Title</h2>
<p class="text-base text-secondary">Description</p>
```

### Colors

```html
<span class="text-accent">Highlighted</span>
<span class="text-success">Success</span>
<span class="text-error">Error</span>
```

See `_utility-classes.scss` for full list.

---

## 📱 Responsive Design

### Responsive Utilities

```html
<div class="d-none md:d-block">
  <!-- Hidden on mobile, shown on tablet+ -->
</div>

<div class="grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
  <!-- 1 column mobile, 2 tablet, 4 desktop -->
</div>
```

### Fluid Typography

```scss
.title {
  @include typo.fluid-type(1rem, 2rem, 320px, 1200px);
  // Scales smoothly from 1rem to 2rem between viewport widths
}
```

---

## 🎬 Animations

### Fade In

```scss
.animated-item {
  @include effects.fade-in-animation('up', 0ms);
  // Types: 'up', 'scale'
  // Delay: 0ms, 100ms, 200ms, etc.
}
```

### Stagger Children

```scss
.item {
  @include effects.fade-in-animation('up');
  @include effects.stagger-children(10, 50ms);
  // Staggers first 10 children with 50ms delay each
}
```

---

## ♿ Accessibility

### Focus States

All interactive mixins include proper focus states:

```scss
.button {
  @include effects.interactive-surface;
  // Includes focus-visible outline
}
```

### Reduced Motion

All animations respect `prefers-reduced-motion`:

```scss
@media (prefers-reduced-motion: reduce) {
  // Animations are disabled automatically
}
```

---

## 🎨 Theming

All tokens use CSS variables, so they're theme-able:

```scss
:root {
  // Override any token
  --accent: #your-brand-color;
  --spacing-base: 20px;
  --radius-lg: 12px;
}
```

Dark mode is automatically handled via `prefers-color-scheme: dark`.

---

## 📚 Best Practices

1. **Use Design Tokens** - Always prefer variables over hardcoded values
2. **Start with Mixins** - Use pre-built mixins before custom CSS
3. **Layer Effects** - Combine multiple effect mixins for rich interactions
4. **Mobile First** - Use responsive utilities for different screen sizes
5. **Accessibility** - Leverage built-in focus states and reduced motion
6. **Performance** - Effects use GPU-accelerated transforms
7. **Consistency** - Stick to the spacing/typography scales

---

## 🔧 Migration from Old System

### Old → New

| Old                      | New                              |
|--------------------------|----------------------------------|
| `@include card`          | `@include card-elevated`         |
| `@include section-title-text` | `@include heading(3)`     |
| `@include metric-label`  | `@include components.stat-label` |
| Hardcoded `12px`         | `var(--spacing-md)`              |
| Hardcoded `#ff7900`      | `var(--accent)`                  |
| `border-radius: 8px`     | `border-radius: var(--radius-lg)`|

---

## 📖 Further Reading

- `_design-tokens.scss` - All available tokens
- `_modern-effects.scss` - All effect mixins
- `_component-mixins.scss` - All component patterns
- `_typography-system.scss` - All typography mixins
- `_utility-classes.scss` - All utility classes

---

**Happy building with the enhanced design system!** 🚀

