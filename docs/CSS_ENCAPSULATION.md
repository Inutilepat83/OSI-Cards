# CSS Encapsulation Guide

## Problem

By default, OSI Cards library exports global styles that can affect your entire application:
- Global CSS resets (`* { margin: 0; padding: 0; }`)
- Global element styles (`body`, `button`, `a`, `h1-h6`, `p`)
- Global CSS variables on `:root` that can conflict with your app's variables
- Global focus styles for all interactive elements

This can cause CSS leakage where OSI Cards styles override your application's styles.

## Solution: Scoped Styles

OSI Cards provides a **scoped stylesheet** that wraps all styles in a `.osi-cards-container` class, preventing any CSS from leaking outside the container.

## Usage

### Option 1: Use Scoped Stylesheet (Recommended)

**Step 1:** Import the scoped stylesheet instead of the global one:

```scss
// In your styles.scss or styles.sass
@import 'osi-cards-lib/styles/_styles-scoped';
```

**Step 2:** Wrap your OSI Cards components in a container with the class:

```html
<div class="osi-cards-container">
  <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
</div>
```

### Option 2: Use Wrapper Component (Easiest)

**Step 1:** Import the scoped stylesheet:

```scss
@import 'osi-cards-lib/styles/_styles-scoped';
```

**Step 2:** Use the `OsiCardsContainerComponent` wrapper:

```typescript
// In your component
import { OsiCardsContainerComponent } from 'osi-cards-lib';
```

```html
<!-- In your template -->
<osi-cards-container>
  <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
</osi-cards-container>
```

**With theme support:**

```html
<osi-cards-container [theme]="'night'">
  <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
</osi-cards-container>
```

### Option 3: Keep Global Styles (Not Recommended)

If you don't have CSS conflicts, you can continue using the global stylesheet:

```scss
@import 'osi-cards-lib/styles/_styles';
```

**Note:** This will affect your entire application. Only use this if you're okay with OSI Cards styles being global.

## Migration Guide

### From Global to Scoped Styles

**Before:**
```scss
// styles.scss
@import 'osi-cards-lib/styles/_styles';
```

```html
<!-- component.html -->
<app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
```

**After:**
```scss
// styles.scss
@import 'osi-cards-lib/styles/_styles-scoped';
```

```html
<!-- component.html -->
<div class="osi-cards-container">
  <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
</div>
```

Or using the wrapper component:

```html
<!-- component.html -->
<osi-cards-container>
  <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
</osi-cards-container>
```

## Theme Support

Scoped styles support theming via the `data-theme` attribute:

```html
<!-- Light theme (default) -->
<div class="osi-cards-container" data-theme="day">
  <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
</div>

<!-- Dark theme -->
<div class="osi-cards-container" data-theme="night">
  <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
</div>
```

Or with the wrapper component:

```html
<osi-cards-container [theme]="'night'">
  <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
</osi-cards-container>
```

## What Gets Scoped?

All OSI Cards styles are scoped within `.osi-cards-container`:

- ✅ CSS resets (only affect elements inside container)
- ✅ Element styles (`button`, `a`, `h1-h6`, `p` only inside container)
- ✅ CSS variables (scoped to container, won't conflict with your app)
- ✅ Focus styles (only for elements inside container)
- ✅ All component styles (cards, sections, etc.)

## Benefits

1. **No CSS Leakage**: OSI Cards styles won't affect your application
2. **No Variable Conflicts**: CSS variables are scoped, won't override your app's variables
3. **Isolated Styling**: Each instance can have its own theme
4. **Backward Compatible**: Global stylesheet still available if needed

## Troubleshooting

### Styles Not Applying

If styles aren't applying, make sure:
1. You've imported the scoped stylesheet: `@import 'osi-cards-lib/styles/_styles-scoped';`
2. Your components are wrapped in `.osi-cards-container` or `<osi-cards-container>`
3. The stylesheet is included in your build (check `angular.json`)

### CSS Variables Not Working

If CSS variables aren't working:
1. Ensure the container has the `.osi-cards-container` class
2. Check that variables are defined within the scoped stylesheet
3. Verify theme attributes are set correctly (`data-theme="night"` or `data-theme="day"`)

### Multiple Containers

You can have multiple containers on the same page, each with its own theme:

```html
<div class="osi-cards-container" data-theme="day">
  <app-ai-card-renderer [cardConfig]="card1"></app-ai-card-renderer>
</div>

<div class="osi-cards-container" data-theme="night">
  <app-ai-card-renderer [cardConfig]="card2"></app-ai-card-renderer>
</div>
```

## Examples

### Basic Usage

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { AICardConfig } from 'osi-cards-lib';

@Component({
  selector: 'app-root',
  template: `
    <div class="osi-cards-container">
      <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
    </div>
  `
})
export class AppComponent {
  card: AICardConfig = { /* ... */ };
}
```

### With Wrapper Component

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { AICardRendererComponent, OsiCardsContainerComponent } from 'osi-cards-lib';

@Component({
  selector: 'app-root',
  imports: [AICardRendererComponent, OsiCardsContainerComponent],
  template: `
    <osi-cards-container>
      <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
    </osi-cards-container>
  `
})
export class AppComponent {
  card: AICardConfig = { /* ... */ };
}
```

### Multiple Cards with Different Themes

```html
<div class="osi-cards-container" data-theme="day">
  <app-ai-card-renderer [cardConfig]="lightCard"></app-ai-card-renderer>
</div>

<div class="osi-cards-container" data-theme="night">
  <app-ai-card-renderer [cardConfig]="darkCard"></app-ai-card-renderer>
</div>
```

## API Reference

### OsiCardsContainerComponent

**Selector:** `osi-cards-container`

**Inputs:**
- `theme?: 'day' | 'night'` - Theme to apply to the container

**Usage:**
```html
<osi-cards-container [theme]="'night'">
  <!-- Your OSI Cards components -->
</osi-cards-container>
```

## Best Practices

1. **Always use scoped styles** when integrating OSI Cards into an existing application
2. **Use the wrapper component** for cleaner code and automatic scoping
3. **Set themes at the container level** for consistent styling
4. **Test CSS isolation** by checking that OSI Cards styles don't affect your app
5. **Use multiple containers** if you need different themes on the same page

## Support

If you encounter issues with CSS encapsulation:
1. Check the [troubleshooting section](#troubleshooting) above
2. Verify your stylesheet imports are correct
3. Ensure the container class is applied correctly
4. Check browser DevTools to see if styles are being scoped properly

