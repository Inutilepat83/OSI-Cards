# CSS Encapsulation Guide

This document explains how OSI Cards Library achieves complete CSS encapsulation to prevent style conflicts with host applications.

## Table of Contents

1. [Overview](#overview)
2. [Encapsulation Strategies](#encapsulation-strategies)
3. [Shadow DOM](#shadow-dom)
4. [CSS Layers](#css-layers)
5. [Token System](#token-system)
6. [Animation Encapsulation](#animation-encapsulation)
7. [Integration Patterns](#integration-patterns)
8. [Troubleshooting](#troubleshooting)

## Overview

The OSI Cards Library uses multiple encapsulation strategies to ensure:

- **Zero CSS leakage**: Library styles don't affect your application
- **Zero CSS inheritance**: Host application styles don't affect the library
- **Complete isolation**: All animations, variables, and z-indexes are self-contained
- **Theme independence**: Library themes work regardless of host theming

## Encapsulation Strategies

### Strategy Layers

```
┌─────────────────────────────────────────────────────────────┐
│  Host Application                                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  CSS Layer (@layer osi-cards)                         │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Shadow DOM Boundary                            │  │  │
│  │  │  ┌───────────────────────────────────────────┐  │  │  │
│  │  │  │  Component Styles                         │  │  │  │
│  │  │  │  - Token Variables                        │  │  │  │
│  │  │  │  - Keyframe Animations                    │  │  │  │
│  │  │  │  - Scoped Selectors                       │  │  │  │
│  │  │  └───────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Shadow DOM

The main `AICardRendererComponent` uses Shadow DOM encapsulation:

```typescript
@Component({
  selector: 'app-ai-card-renderer',
  encapsulation: ViewEncapsulation.ShadowDom,
  styleUrls: ['../../styles/bundles/_ai-card.scss']
})
```

### Benefits of Shadow DOM

1. **Complete style isolation**: Styles inside cannot leak out
2. **Protection from external styles**: Host styles cannot affect components
3. **Scoped CSS variables**: Variables are defined within the shadow boundary
4. **Scoped animations**: @keyframes are local to the component

### Child Components

Child components use `ViewEncapsulation.None` since they inherit from the parent's Shadow DOM:

```typescript
@Component({
  selector: 'app-section-renderer',
  encapsulation: ViewEncapsulation.None // Inherits parent Shadow DOM
})
```

## CSS Layers

For non-Shadow DOM scenarios, we use CSS Layers:

```css
@layer osi-cards {
  /* All library styles are contained within this layer */
  .osi-cards-container {
    /* styles */
  }
}
```

### Layer Priority

CSS Layers have lower specificity than unlayered styles, making them easy to override:

```css
/* Host application can easily override */
.osi-cards-container .my-custom-class {
  /* This wins over layer styles */
}
```

## Token System

All design tokens are defined in a single source of truth:

```scss
// projects/osi-cards-lib/src/lib/styles/tokens/_master.scss

$osi-color-brand: #ff7900;
$osi-color-brand-dark: #cc5f00;
// ... more tokens

@mixin osi-tokens($variant: 'demo', $is-scoped: false) {
  @include osi-shadows();
  @include osi-radius();
  @include osi-spacing();
  @include osi-z-index();  // Z-index scale
  @include osi-animation();
  // ... more token mixins
}
```

### Using Tokens

In component styles:

```scss
@use '../tokens/master' as *;

:host {
  @include osi-theme-base('integration', true);
  @include osi-tokens('integration', true);
}
```

### Z-Index Isolation

All z-index values are relative and contained:

```scss
@mixin osi-z-index() {
  --z-base: 0;
  --z-content: 1;
  --z-elevated: 10;
  --z-dropdown: 100;
  --z-tooltip: 200;
  --z-modal: 500;
  --z-max: 999;
}
```

## Animation Encapsulation

All animations are defined within component bundles for Shadow DOM compatibility:

### Keyframe Definitions

Located in `core/_animations-shadow.scss`:

```scss
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translate3d(0, var(--motion-distance-lg, 10px), 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes shimmerWave {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

// ... streaming animations, hover effects, etc.
```

### Animation Configuration

Configure animations via providers:

```typescript
import { provideOSICards } from 'osi-cards-lib';

export const appConfig: ApplicationConfig = {
  providers: [
    provideOSICards({
      enableAnimations: true,
      animationConfig: {
        preset: 'full', // 'full' | 'minimal' | 'none'
        features: {
          entrance: true,
          streaming: true,
          hover: true,
          skeleton: true,
          tilt: true,
          particles: true,
          stagger: true
        },
        timing: {
          durationMultiplier: 1, // Adjust all timings
          entranceDuration: 220,
          hoverDuration: 200
        },
        respectReducedMotion: true
      }
    })
  ]
};
```

### Reduced Motion Support

Animations automatically respect `prefers-reduced-motion`:

```scss
@media (prefers-reduced-motion: reduce) {
  :host {
    @include osi-tokens-reduced-motion();
  }
}
```

## Integration Patterns

### Pattern 1: Simple Integration (Recommended)

Use the single entry point component:

```html
<osi-cards 
  [card]="cardConfig"
  [theme]="'day'"
  (fieldClick)="onFieldClick($event)">
</osi-cards>
```

### Pattern 2: Container Wrapper

For more control, use the container component:

```html
<osi-cards-container [theme]="'night'" [strictIsolation]="true">
  <app-ai-card-renderer 
    [cardConfig]="config">
  </app-ai-card-renderer>
</osi-cards-container>
```

### Pattern 3: Manual Integration

Add the container class and theme attribute manually:

```html
<div class="osi-cards-container" data-theme="day">
  <app-ai-card-renderer [cardConfig]="config"></app-ai-card-renderer>
</div>
```

### Pattern 4: CSS-Only (Non-Angular)

For non-Angular applications:

```html
<link rel="stylesheet" href="osi-cards.css">

<div class="osi-cards-container" data-theme="day">
  <!-- Your card content -->
</div>
```

## Framework Compatibility

The library automatically resets styles from popular frameworks:

- Bootstrap 4.x / 5.x
- Boosted (Orange Bootstrap)
- Tailwind CSS
- Foundation
- Bulma
- Materialize CSS

### Framework Reset

Located in `reset/_framework-reset.scss`:

```scss
@mixin framework-variable-reset() {
  // Reset Bootstrap variables
  --bs-primary: unset;
  --bs-secondary: unset;
  // ... more resets
  
  // Reset Tailwind variables
  --tw-ring-color: unset;
  // ... more resets
}
```

## Theme System

### Theme Switching

Themes are applied via `data-theme` attribute:

```html
<!-- Light theme -->
<osi-cards [card]="config" [theme]="'day'"></osi-cards>

<!-- Dark theme -->
<osi-cards [card]="config" [theme]="'night'"></osi-cards>
```

### Theme Variables

Each theme defines its own color scheme:

```scss
:host([data-theme='night']),
:host-context([data-theme='night']) {
  @include osi-theme-dark('integration', true);
}

:host([data-theme='day']),
:host-context([data-theme='day']) {
  @include osi-theme-light('integration', true);
}
```

## Event System

Events properly bubble through Shadow DOM:

```typescript
import { OSI_EVENTS, createFieldClickEvent } from 'osi-cards-lib';

// Events use composed: true to cross shadow boundaries
element.dispatchEvent(createFieldClickEvent(field, section));

// Listen at any level
document.addEventListener('osi-field-click', (e) => {
  console.log(e.detail.field);
});
```

## Troubleshooting

### Styles Not Applying

1. Ensure `provideOSICards()` is in your providers
2. Check Shadow DOM is supported in your browser
3. Verify the container has `data-theme` attribute

### Animations Not Working

1. Check `enableAnimations: true` in config
2. Verify browser supports CSS animations
3. Check `prefers-reduced-motion` isn't set

### Host Styles Leaking In

1. Verify Shadow DOM encapsulation is enabled
2. Use `strictIsolation: true` on container
3. Check for `!important` rules in host

### Library Styles Leaking Out

This should not happen with Shadow DOM. If it does:

1. Check component encapsulation settings
2. Verify CSS layer is working
3. Report as a bug

## Build Configuration

### ng-packagr Configuration

```json
{
  "lib": {
    "styleIncludePaths": [
      "src/lib/styles",
      "src/lib/styles/tokens",
      "src/lib/styles/core"
    ]
  }
}
```

### PostCSS Pipeline

Located in `postcss.config.js`:

- Autoprefixer for cross-browser support
- cssnano for production minification
- CSS variable fallbacks

## File Reference

| File | Purpose |
|------|---------|
| `tokens/_master.scss` | Single source of truth for design tokens |
| `tokens/_index.scss` | Token exports and font isolation |
| `reset/_shadow-reset.scss` | Shadow DOM reset styles |
| `reset/_framework-reset.scss` | Framework variable resets |
| `core/_animations-shadow.scss` | Shadow DOM compatible animations |
| `bundles/_ai-card.scss` | Main component style bundle |
| `bundles/_card-skeleton.scss` | Skeleton component bundle |

## Version History

- **v2.0.0**: Full Shadow DOM encapsulation
- **v1.5.0**: CSS Layers support
- **v1.0.0**: Initial release with scoped styles
