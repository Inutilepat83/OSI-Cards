# Migration Guide: OSI Cards Library Encapsulation

This guide helps you migrate from older versions of OSI Cards Library to the fully encapsulated version.

## Table of Contents

1. [Overview](#overview)
2. [Breaking Changes](#breaking-changes)
3. [Step-by-Step Migration](#step-by-step-migration)
4. [Configuration Changes](#configuration-changes)
5. [Style Updates](#style-updates)
6. [Animation Changes](#animation-changes)
7. [Event System Migration](#event-system-migration)
8. [Testing Updates](#testing-updates)
9. [FAQ](#faq)

## Overview

Version 2.0 introduces complete CSS encapsulation using Shadow DOM. This ensures:

- Zero style conflicts with host applications
- Self-contained animations
- Isolated theme system
- Better framework compatibility

## Breaking Changes

### 1. Component Encapsulation

**Before:**

```typescript
// Components used default emulated encapsulation
@Component({
  encapsulation: ViewEncapsulation.Emulated // or no setting
})
```

**After:**

```typescript
// Main components use Shadow DOM
@Component({
  encapsulation: ViewEncapsulation.ShadowDom
})

// Child components explicitly inherit
@Component({
  encapsulation: ViewEncapsulation.None // Inherits from parent Shadow DOM
})
```

### 2. Style Imports

**Before:**

```scss
// Global style import
@import 'osi-cards-lib/styles/styles';
```

**After:**

```scss
// Scoped style import (recommended)
@import 'osi-cards-lib/styles/styles-scoped';

// Or use standalone CSS
@import 'osi-cards-lib/styles/osi-cards.css';
```

### 3. Provider Configuration

**Before:**

```typescript
providers: [
  provideAnimations(),
  // Manual icon registration
];
```

**After:**

```typescript
providers: [
  provideOSICards({
    enableAnimations: true,
    animationConfig: {
      /* new options */
    },
    cssIsolation: 'standard',
    defaultTheme: 'day',
  }),
];
```

### 4. Container Requirement

**Before:**

```html
<!-- Components worked anywhere -->
<app-ai-card-renderer [cardConfig]="config"></app-ai-card-renderer>
```

**After:**

```html
<!-- Recommended: Use single entry point -->
<osi-cards [card]="config" [theme]="'day'"></osi-cards>

<!-- Or use container wrapper -->
<osi-cards-container [theme]="'day'">
  <app-ai-card-renderer [cardConfig]="config"></app-ai-card-renderer>
</osi-cards-container>
```

## Step-by-Step Migration

### Step 1: Update Provider Configuration

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideOSICards } from 'osi-cards-lib';

export const appConfig: ApplicationConfig = {
  providers: [
    // Replace individual providers with unified provider
    provideOSICards({
      enableAnimations: true,
      cssIsolation: 'standard',
      defaultTheme: 'day',
    }),
    // ... other providers
  ],
};
```

### Step 2: Update Style Imports

Remove global style imports from `styles.scss`:

```scss
// REMOVE these global imports
// @import 'osi-cards-lib/styles/styles';
// @import 'osi-cards-lib/styles/variables';

// ADD scoped import if needed for custom theming
@import 'osi-cards-lib/styles/tokens/master';
```

### Step 3: Update Template Usage

**Option A: Use New Single Entry Point (Simplest)**

```html
<!-- Before -->
<app-ai-card-renderer
  [cardConfig]="config"
  [isFullscreen]="fullscreen"
  (fieldInteraction)="onField($event)"
>
</app-ai-card-renderer>

<!-- After -->
<osi-cards [card]="config" [fullscreen]="fullscreen" (fieldClick)="onField($event)"> </osi-cards>
```

**Option B: Use Container Wrapper**

```html
<!-- Before -->
<div class="my-wrapper">
  <app-ai-card-renderer [cardConfig]="config"></app-ai-card-renderer>
</div>

<!-- After -->
<osi-cards-container [theme]="'day'">
  <app-ai-card-renderer [cardConfig]="config"></app-ai-card-renderer>
</osi-cards-container>
```

### Step 4: Update Event Handlers

```typescript
// Before
onFieldInteraction(event: CardFieldInteractionEvent) {
  console.log(event.field);
}

// After - Same interface, but can also use native events
onFieldInteraction(event: CardFieldInteractionEvent) {
  console.log(event.field);
}

// Or listen to native custom events (for Shadow DOM)
document.addEventListener('osi-field-click', (e: OSIFieldClickEvent) => {
  console.log(e.detail.field);
});
```

### Step 5: Update Theme Application

```html
<!-- Before: Theme via CSS class -->
<div class="osi-dark-theme">
  <app-ai-card-renderer></app-ai-card-renderer>
</div>

<!-- After: Theme via data attribute -->
<osi-cards [card]="config" [theme]="'night'"></osi-cards>

<!-- Or on container -->
<osi-cards-container [theme]="'night'">
  <app-ai-card-renderer></app-ai-card-renderer>
</osi-cards-container>
```

## Configuration Changes

### Animation Configuration

**New options available:**

```typescript
provideOSICards({
  enableAnimations: true,
  animationConfig: {
    // Preset: 'full' | 'minimal' | 'none'
    preset: 'full',

    // Individual feature toggles
    features: {
      entrance: true, // Card entrance animations
      streaming: true, // Streaming generation animations
      hover: true, // Hover effects
      skeleton: true, // Skeleton shimmer
      tilt: true, // 3D tilt effects
      particles: true, // Empty state particles
      stagger: true, // Stagger delays
    },

    // Timing adjustments
    timing: {
      durationMultiplier: 1, // Scale all durations
      entranceDuration: 220,
      hoverDuration: 200,
      streamingDuration: 300,
    },

    // Accessibility
    respectReducedMotion: true,
  },
});
```

### CSS Isolation Mode

```typescript
provideOSICards({
  // 'standard': CSS Layers for encapsulation
  // 'strict': Additional containment properties
  cssIsolation: 'standard',
});
```

## Style Updates

### Custom Token Overrides

**Before:**

```scss
// Global variable override
:root {
  --osi-color-brand: #custom-color;
}
```

**After:**

```scss
// Scoped override using container
.osi-cards-container {
  --color-brand: #custom-color;
}

// Or create custom theme
@use 'osi-cards-lib/styles/tokens/master' as tokens;

.my-branded-cards {
  @include tokens.osi-theme-base('integration', true);
  --color-brand: #custom-color;
}
```

### Custom Component Styles

**Before:**

```scss
// Direct styling
app-ai-card-renderer .section {
  border-color: red;
}
```

**After:**

```scss
// Cannot style Shadow DOM directly from outside
// Use CSS custom properties instead

.osi-cards-container {
  --section-border-color: red;
}
```

## Animation Changes

### Keyframe Access

**Before:**

```scss
// Using library keyframes globally
.my-element {
  animation: fadeInUp 0.3s ease;
}
```

**After:**

```scss
// Keyframes are now scoped to Shadow DOM
// Import them for use in your components
@import 'osi-cards-lib/styles/core/animations-shadow';

.my-element {
  animation: fadeInUp 0.3s ease;
}
```

### Disabling Specific Animations

**Before:**

```scss
// Override with CSS
.osi-cards-container .section {
  animation: none !important;
}
```

**After:**

```typescript
// Configure via provider
provideOSICards({
  animationConfig: {
    features: {
      entrance: false, // Disable entrance animations
      streaming: true, // Keep streaming animations
    },
  },
});
```

## Event System Migration

### New Event Types

The library now exports typed events that work with Shadow DOM:

```typescript
import {
  OSI_EVENTS,
  createFieldClickEvent,
  isOSIFieldClickEvent,
  OSIFieldClickEvent,
} from 'osi-cards-lib';

// Listen to events
element.addEventListener(OSI_EVENTS.FIELD_CLICK, (e: OSIFieldClickEvent) => {
  console.log(e.detail.field);
  console.log(e.detail.section);
});

// Create events (if building custom components)
const event = createFieldClickEvent(field, section);
element.dispatchEvent(event);
```

### Event Mapping

| Old Event            | New Event                            | Notes          |
| -------------------- | ------------------------------------ | -------------- |
| `(fieldInteraction)` | `(fieldClick)` + `osi-field-click`   | Both work      |
| `(cardInteraction)`  | `(actionClick)` + `osi-action-click` | Renamed        |
| `(agentAction)`      | `(agentAction)` + `osi-action-click` | Type in detail |
| `(questionAction)`   | `(questionAction)`                   | Unchanged      |

## Testing Updates

### Unit Tests

```typescript
// Before
beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [AICardRendererComponent],
    providers: [provideAnimations()],
  }).compileComponents();
});

// After
beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [AICardRendererComponent],
    providers: [provideOSICards()],
  }).compileComponents();
});
```

### Shadow DOM Testing

```typescript
// Access Shadow DOM content
const element = fixture.nativeElement;
const shadowRoot = element.shadowRoot;

// Query inside Shadow DOM
const innerElement = shadowRoot.querySelector('.section');
```

### E2E Tests

```typescript
// Playwright example
const card = page.locator('app-ai-card-renderer');

// Check Shadow DOM exists
const hasShadow = await card.evaluate((el) => el.shadowRoot !== null);
expect(hasShadow).toBe(true);

// Query Shadow DOM
const section = card.locator('>>> .section'); // Playwright shadow pierce
```

## FAQ

### Q: My custom styles no longer work. What happened?

**A:** Shadow DOM encapsulation prevents external styles from affecting components. Use CSS custom properties to customize:

```scss
.osi-cards-container {
  --color-brand: #your-color;
  --card-border-radius: 8px;
}
```

### Q: Can I disable Shadow DOM?

**A:** Not recommended, as it would break encapsulation. Instead, use the `OsiCardsContainerComponent` with `strictIsolation: false` for lighter encapsulation.

### Q: My animations look different. Why?

**A:** Animation timing and behavior can be configured via providers. Check your `animationConfig` settings.

### Q: Events aren't bubbling to my parent component.

**A:** Events now use `composed: true` to cross Shadow DOM boundaries. Make sure you're listening at the right level:

```typescript
// Listen on the component itself
<osi-cards (fieldClick)="onField($event)"></osi-cards>

// Or listen globally for custom events
document.addEventListener('osi-field-click', handler);
```

### Q: How do I access internal elements for testing?

**A:** Use Shadow DOM queries:

```typescript
// Via fixture
const shadowRoot = fixture.nativeElement.shadowRoot;
const element = shadowRoot.querySelector('.section');

// Via Playwright
const element = page.locator('app-ai-card-renderer >>> .section');
```

### Q: Can I still use the library without Shadow DOM for debugging?

**A:** For development, you can temporarily modify the component:

```typescript
// DEV ONLY - Not recommended for production
@Component({
  encapsulation: ViewEncapsulation.None
})
```

## Need Help?

- Check the [CSS Encapsulation Guide](./CSS_ENCAPSULATION.md)
- Review the [API Documentation](./API.md)
- Open an issue on GitHub

---

## Related Documentation

- **[Getting Started](./GETTING_STARTED.md)** - Fresh installation guide
- **[CSS Encapsulation](./CSS_ENCAPSULATION.md)** - Shadow DOM and style isolation
- **[API Reference](./API.md)** - Complete API documentation
- **[Theming Guide](./THEMING_GUIDE.md)** - Theme customization
- **[Event System](./EVENT_SYSTEM.md)** - Updated event handling
- **[Components](./COMPONENTS.md)** - Component reference
- **[Best Practices](./BEST_PRACTICES.md)** - Testing and performance tips



