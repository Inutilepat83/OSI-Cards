# OSI Cards Library - Integration Guide

This guide explains how to integrate the OSI Cards library into your Angular application while ensuring style isolation and preventing conflicts with your existing styles.

## Table of Contents

1. [Style Entry Points](#style-entry-points)
2. [Integration Scenarios](#integration-scenarios)
3. [Token Namespace](#token-namespace)
4. [Minimal Integration Example](#minimal-integration-example)
5. [Sales Assistance Frontend Integration](#sales-assistance-frontend-integration)
6. [CSS Property Inheritance](#css-property-inheritance)
7. [Troubleshooting](#troubleshooting)

---

## Style Entry Points

The library provides **three style entry points** for different integration scenarios:

### 1. `_styles.scss` - Demo App Only

**Use case:** For the OSI Cards demo website only.

- Applies variables to `:root`
- Uses larger typography scale
- Not recommended for external integration

```scss
// DON'T use this in external apps
@import 'osi-cards-lib/styles/styles';
```

### 2. `_styles-scoped.scss` - Standard Integration (Recommended)

**Use case:** Standard integration into existing apps (Bootstrap, Boosted, etc.)

- All styles scoped within `.osi-cards-container`
- Uses compact typography scale optimized for integration
- Does NOT affect styles outside the container
- Your app's Bootstrap/Boosted styles remain unchanged

```scss
// RECOMMENDED for external apps
@import 'osi-cards-lib/styles/styles-scoped';
```

### 3. `_styles-standalone.scss` - Maximum Isolation

**Use case:** Apps with heavy Bootstrap/Boosted customization that conflict with cards.

- Includes full Bootstrap reset within container
- All CSS variables defined with explicit values
- Maximum isolation, no CSS variable inheritance required
- Larger bundle size

```scss
// For heavy Bootstrap conflicts
@import 'osi-cards-lib/styles/styles-standalone';
```

---

## Integration Scenarios

### Scenario A: Clean Angular App (No Bootstrap)

Use the scoped entry point:

```scss
// styles.scss
@import 'osi-cards-lib/styles/styles-scoped';
```

### Scenario B: App with Bootstrap/Boosted

Use the scoped entry point - it won't affect your Bootstrap styles:

```scss
// styles.scss
@import 'bootstrap/scss/bootstrap'; // Your Bootstrap
@import 'osi-cards-lib/styles/styles-scoped'; // Cards are isolated
```

### Scenario C: Heavy Bootstrap Conflicts

If cards still have visual issues, use standalone:

```scss
// styles.scss
@import 'bootstrap/scss/bootstrap';
@import 'osi-cards-lib/styles/styles-standalone';
```

---

## Token Namespace

### Library Tokens (Scoped)

All library tokens use the `--osi-*` namespace or are scoped within `.osi-cards-container`:

```css
.osi-cards-container {
  --card-padding: 16px;
  --card-border-radius: 12px;
  --card-gap: 8px;
  /* ... */
}
```

These will NOT conflict with your app's tokens.

### Your App's Tokens

Keep your existing token names unchanged. The library's scoped approach ensures:

- Your `--card-*` variables remain untouched
- Your Bootstrap `$primary` etc. remain untouched
- No global CSS pollution

---

## Minimal Integration Example

### 1. Install the Library

```bash
npm install osi-cards-lib
```

### 2. Import Styles

In your `styles.scss`:

```scss
// Your existing styles
@import 'your-styles';

// OSI Cards (scoped)
@import 'osi-cards-lib/styles/styles-scoped';
```

### 3. Wrap Cards in Container

In your component template:

```html
<div class="osi-cards-container">
  <osi-ai-card-renderer [card]="cardData"></osi-ai-card-renderer>
</div>
```

### 4. Import the Module

In your `app.module.ts`:

```typescript
import { OsiCardsModule } from 'osi-cards-lib';

@NgModule({
  imports: [OsiCardsModule],
  // ...
})
export class AppModule {}
```

---

## Sales Assistance Frontend Integration

For the Orange Sales Assistance frontend specifically:

### styles.sass

```sass
// Keep all your existing styles
@import 'your-app-styles'

// Import only the scoped library styles
@import 'osi-cards-lib/styles/styles-scoped'
```

### Component Usage

```html
<!-- Wrap the card renderer in the container class -->
<div class="osi-cards-container">
  <osi-ai-card-renderer [card]="generatedCard" [config]="cardConfig"> </osi-ai-card-renderer>
</div>
```

### Important Notes

1. **DO NOT** import `_styles.scss` (the demo app styles)
2. **DO** use `.osi-cards-container` wrapper
3. **DO** keep your existing Boosted/Bootstrap styles
4. The library will not override your existing styles

---

## CSS Property Inheritance

### Properties That Inherit Into Cards

These CSS properties inherit from your app into cards:

- `font-family` (if not explicitly set)
- `color` (base text color)
- `direction` (for RTL support)

### Properties That Don't Inherit

These are explicitly set by the library:

- `font-size` - Uses library's typography scale
- `line-height` - Optimized for card content
- `background` - Card backgrounds are controlled
- `border` - Card borders are controlled
- `padding/margin` - Card spacing is controlled

### Overriding Library Defaults

If you need to customize:

```scss
.osi-cards-container {
  // Override typography scale
  --card-title-font-size: 1.2rem;
  --card-value-font-size: 1.1rem;

  // Override colors
  --color-brand: #your-brand-color;

  // Override spacing
  --card-padding: 20px;
}
```

---

## Troubleshooting

### Cards look different than expected

1. Ensure you're using `.osi-cards-container` wrapper
2. Check that you imported `styles-scoped` not `styles`
3. Verify no CSS is overriding the container styles

### Bootstrap styles are affected

1. Make sure you're NOT using `styles.scss` (demo styles)
2. Use `styles-scoped.scss` or `styles-standalone.scss`

### Cards have wrong typography

1. Check your container has the wrapper class
2. The library uses a compact typography scale for integration
3. You can override with CSS variables (see above)

### Animations not working

1. Check `prefers-reduced-motion` media query
2. Library respects accessibility preferences
3. Animations can be enabled via CSS variables

### Dark/Light theme not working

1. Set `data-theme="night"` or `data-theme="day"` on container or parent
2. Or on document body for global theme

```html
<body data-theme="night">
  <div class="osi-cards-container">
    <!-- Cards will use night theme -->
  </div>
</body>
```

---

## Support

For issues or questions, please file an issue in the repository or contact the OSI Cards team.


