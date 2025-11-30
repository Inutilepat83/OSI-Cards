# Design Tokens Architecture

This directory contains the consolidated design token system for OSI Cards.

## Overview

All design tokens are defined in a **single source of truth**: `_master.scss`. This ensures consistency across the entire library and simplifies maintenance.

## File Structure

```
tokens/
├── _master.scss    # SINGLE SOURCE OF TRUTH for all tokens
├── _index.scss     # Re-exports for convenience
└── README.md       # This documentation
```

## Token Categories

### 1. Primitive Tokens (Raw Values)

Base color values, numbers, and constants that don't change.

```scss
$osi-color-brand: #ff7900;
$osi-color-white: #ffffff;
$osi-gray-400: #92999e;
```

### 2. Semantic Tokens (CSS Variables)

Meaningful tokens that reference primitives, output as CSS variables:

```scss
--color-brand: #{$osi-color-brand};
--foreground: #{$osi-foreground-light};
--card-padding: 16px;
```

### 3. Component Tokens

UI element-specific values derived from semantic tokens:

```scss
--card-title-font-size: clamp(0.93rem, 0.83rem + 0.3vw, 1.08rem);
--section-item-border-radius: var(--radius-md);
```

### 4. Theme Variants

Light/dark mode overrides applied via data attributes:

```scss
:root[data-theme='night'] {
  @include osi-theme-dark('demo', false);
}
```

## Usage

### In SCSS Files

Import master tokens directly:

```scss
@use '../../tokens/master' as *;

.my-component {
  color: $brand-color-70;
  background: $foreground-05;
}
```

Or via the legacy color-helpers for backward compatibility:

```scss
@import '../../core/color-helpers';
```

### In TypeScript

Import the shared constants:

```typescript
import { OSI_COLORS, OSI_THEME_COLORS } from '../themes/tokens.constants';

const brandColor = OSI_COLORS.brand; // '#ff7900'
```

## Available Mixins

### Token Generation

```scss
// Generate all tokens (call once in variables file)
@include osi-tokens($variant: 'demo', $is-scoped: false);

// Generate theme colors
@include osi-theme-base($variant, $is-scoped);
@include osi-theme-dark($variant, $is-scoped);
@include osi-theme-light($variant, $is-scoped);

// Accessibility overrides
@include osi-tokens-reduced-motion();
@include osi-tokens-high-contrast();
@include osi-tokens-forced-colors();
```

### Individual Token Groups

```scss
@include osi-base-colors();
@include osi-status-colors();
@include osi-shadows();
@include osi-radius();
@include osi-spacing();
@include osi-animation();
@include osi-opacity();
@include osi-typography($variant);
@include osi-card-typography($variant);
@include osi-card-layout();
@include osi-card-text-colors();
@include osi-card-surfaces();
@include osi-interactive();
@include osi-element-system();
```

## Color Helper Variables

Pre-computed opacity variants for use in SCSS:

```scss
// Brand color variants
$brand-color-90  // 90% opacity
$brand-color-50  // 50% opacity
$brand-color-15  // 15% opacity
// ... through $brand-color-03

// Foreground variants
$foreground-70
$foreground-50
// ... through $foreground-03

// White variants
$white-90
$white-50
// ... through $white-05
```

## Color Helper Functions

```scss
// Generate any opacity variant
color: brand-alpha(0.75);
background: foreground-alpha(0.1);
border: 1px solid white-alpha(0.2);
box-shadow: 0 4px 8px black-alpha(0.15);
```

## Variants

The token system supports two variants:

- **`demo`**: Larger sizes for the documentation/demo app
- **`integration`**: Compact sizes for embedding in external apps

## Theming

Four built-in themes:

1. **Night** (dark): `data-theme="night"`
2. **Day** (light): `data-theme="day"`
3. **OSI Night** (dark): `data-theme="osi-night"` - Orange Sales Assistance styling
4. **OSI Day** (light): `data-theme="osi-day"` - Orange Sales Assistance styling

Accessibility features (high contrast, forced colors) are handled via CSS media queries automatically.

## Migration Guide

### From Old Token System

If you were importing from multiple sources:

```scss
// OLD - Multiple imports
@import 'core/variables';
@import 'core/color-helpers';
@import 'core/tokens-source';

// NEW - Single import
@use '../../tokens/master' as *;
```

### Deprecated Variables

The following aliases are deprecated and will be removed in v2.0:

- `--master-color` → use `--color-brand`
- `--bg-color` → use `--background`
- `--card-bg` → use `--card`
- `--text-color` → use `--foreground`
- Font aliases like `--font-section-*` → use `--card-*` tokens

## Best Practices

1. **Always import from master** - Don't define custom token values
2. **Use CSS variables** - Let the cascade handle theming
3. **Use helper functions** - For opacity variants, use `brand-alpha()` etc.
4. **Respect variants** - Use `$variant` parameter for size differences

