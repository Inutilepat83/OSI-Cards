# Shadow DOM Migration Guide

This guide explains how to migrate to the new Shadow DOM-based style encapsulation system for OSI Cards.

## Overview

OSI Cards now uses **Shadow DOM** for true style encapsulation. This means:

1. **Component styles are completely isolated** - No styles leak in or out
2. **Host app styles are protected** - OSI Cards won't affect your existing CSS
3. **OSI Cards are protected** - Your app's CSS won't break OSI Cards
4. **Theming still works** - CSS custom properties pass through Shadow DOM

## Migration Steps

### Step 1: Update Your Imports

**Before (legacy):**

```typescript
// Old way - importing global styles
import 'osi-cards-lib/styles/osi-cards.css';
```

**After (Shadow DOM):**

```typescript
// New way - import tokens only, components have their styles bundled
import 'osi-cards-lib/styles/osi-cards-tokens.css';
```

### Step 2: Set Up Theming

Since components use Shadow DOM, CSS custom properties must be defined at the host level:

```css
/* Your app's global styles */
:root {
  /* These pass through Shadow DOM boundaries */
  --color-brand: #ff7900;
  --background: #ffffff;
  --foreground: #1c1c1f;
  /* ... other tokens */
}

/* Dark theme */
:root[data-theme='night'] {
  --background: #0a0a0a;
  --foreground: #ffffff;
  /* ... */
}
```

Or use the tokens-only stylesheet which provides all defaults:

```css
@import 'osi-cards-lib/styles/osi-cards-tokens.css';
```

### Step 3: Update Container Markup

```html
<!-- Add data-theme attribute for theming -->
<div class="osi-cards-container" data-theme="night">
  <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
</div>
```

## CSS Custom Property API

### Core Colors

| Property             | Description        | Default (Light)            |
| -------------------- | ------------------ | -------------------------- |
| `--color-brand`      | Brand/accent color | `#ff7900`                  |
| `--background`       | Background color   | `#ffffff`                  |
| `--foreground`       | Text color         | `#1c1c1f`                  |
| `--muted`            | Muted background   | `#f4f4f6`                  |
| `--muted-foreground` | Muted text         | `#555861`                  |
| `--border`           | Border color       | `rgba(200, 200, 200, 0.5)` |

### Typography

| Property                 | Description     |
| ------------------------ | --------------- |
| `--font-size-base`       | Base font size  |
| `--card-title-font-size` | Card title size |
| `--card-label-font-size` | Label text size |
| `--card-value-font-size` | Value text size |

### Spacing

| Property             | Description               |
| -------------------- | ------------------------- |
| `--card-padding`     | Card internal padding     |
| `--card-gap`         | Gap between card elements |
| `--section-card-gap` | Gap between section cards |

### Shadows

| Property           | Description             |
| ------------------ | ----------------------- |
| `--shadow-sm`      | Small elevation shadow  |
| `--shadow-md`      | Medium elevation shadow |
| `--shadow-lg`      | Large elevation shadow  |
| `--shadow-glow-sm` | Small brand glow        |

### Customizing Components

Override CSS custom properties to customize appearance:

```css
/* In your host app's styles */
:root {
  /* Custom brand color */
  --color-brand: #0066cc;

  /* Larger card padding */
  --card-padding: 24px;

  /* Different shadow style */
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

## Bundle Options

### Option A: Full Bundle (Simple)

Import the tokens file and let components handle their own styles:

```typescript
// main.ts or styles.scss
import 'osi-cards-lib/styles/osi-cards-tokens.css';
```

### Option B: Scoped Container (Integration)

For embedding in apps with their own design systems:

```css
/* Tokens scoped to container */
.osi-cards-container {
  /* Tokens are automatically applied */
}
```

```html
<div class="osi-cards-container" data-theme="night">
  <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
</div>
```

## Troubleshooting

### Styles Not Applying

**Problem:** Components appear unstyled.

**Solution:** Ensure tokens CSS is imported at the root level:

```typescript
import 'osi-cards-lib/styles/osi-cards-tokens.css';
```

### Theme Not Switching

**Problem:** `data-theme` attribute doesn't change appearance.

**Solution:** The `data-theme` attribute must be on the container element:

```html
<div class="osi-cards-container" data-theme="night">
  <!-- components here -->
</div>
```

### Custom Properties Not Working

**Problem:** Custom property overrides don't apply.

**Solution:** Define properties at `:root` level (they pass through Shadow DOM):

```css
:root {
  --color-brand: #custom-color;
}
```

### Legacy Mode

If you need to use the non-Shadow DOM version temporarily:

1. Import the legacy styles:

```typescript
import 'osi-cards-lib/styles/osi-cards-scoped.css';
```

2. Use components without Shadow DOM by checking documentation for legacy configuration options.

## Benefits of Shadow DOM

1. **Zero Style Leakage** - Your Bootstrap/Tailwind/custom CSS won't affect OSI Cards
2. **Predictable Styling** - Components always look the same regardless of host app
3. **Easier Integration** - No need to fight CSS specificity battles
4. **Better Performance** - Browser can optimize isolated style scopes

## Full Example

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideOSICards } from 'osi-cards-lib';

export const appConfig: ApplicationConfig = {
  providers: [provideOSICards()],
};
```

```css
/* styles.scss */
@import 'osi-cards-lib/styles/osi-cards-tokens.css';

/* Customize theme */
:root {
  --color-brand: #0066cc;
}

:root[data-theme='night'] {
  --background: #1a1a2e;
}
```

```html
<!-- app.component.html -->
<div class="osi-cards-container" [attr.data-theme]="theme">
  <app-ai-card-renderer [cardConfig]="cardData" (fieldInteraction)="onFieldClick($event)">
  </app-ai-card-renderer>
</div>
```


