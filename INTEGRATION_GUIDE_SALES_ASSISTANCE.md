# OSI Cards Library - Sales Assistance Frontend Integration Guide

Based on your actual project setup, here are the specific fixes needed:

## Issues Found

### 1. Missing `data-theme` Attribute
Your HTML is missing the required `data-theme` attribute.

### 2. Missing `stylePreprocessorOptions` in angular.json
Angular needs to know where to resolve SCSS imports.

### 3. Import Position in styles.sass
The import should be near the top, not at the bottom.

## Required Fixes

### Fix 1: Update `cards.component.html`

**Current:**
```html
<div class="osi-cards-container" *ngIf="cardConfig">
  <app-ai-card-renderer [cardConfig]="cardConfig"></app-ai-card-renderer>
</div>
```

**Fixed:**
```html
<div class="osi-cards-container" [attr.data-theme]="'day'" *ngIf="cardConfig">
  <app-ai-card-renderer [cardConfig]="cardConfig"></app-ai-card-renderer>
</div>
```

Or if you want to support theme switching:
```html
<div class="osi-cards-container" [attr.data-theme]="theme" *ngIf="cardConfig">
  <app-ai-card-renderer [cardConfig]="cardConfig"></app-ai-card-renderer>
</div>
```

And in your component:
```typescript
theme: 'day' | 'night' = 'day';
```

### Fix 2: Update `angular.json`

Add `stylePreprocessorOptions` to help Angular resolve SCSS imports:

```json
{
  "projects": {
    "orangesalesassistant": {
      "architect": {
        "build": {
          "options": {
            "stylePreprocessorOptions": {
              "includePaths": [
                "node_modules/osi-cards-lib/styles"
              ],
              "sass": {
                "silenceDeprecations": ["import"]
              }
            },
            "styles": [
              "src/styles.sass",
              "node_modules/datatables.net-dt/css/dataTables.dataTables.min.css",
              "node_modules/datatables.net-buttons-dt/css/buttons.dataTables.css",
              "node_modules/boosted/dist/css/boosted.min.css",
              "node_modules/boosted/dist/css/orange-helvetica.css",
              "node_modules/bootstrap-icons/font/bootstrap-icons.css",
              "node_modules/@ng-select/ng-select/themes/material.theme.css",
              "node_modules/flatpickr/dist/flatpickr.min.css"
            ]
          }
        }
      }
    }
  }
}
```

### Fix 3: Update `styles.sass`

Move the import to the top (after your CSS variables but before other styles):

```sass
/* You can add global styles to this file, and also import other style files */
/* Add application styles & imports to this file! */

// Import OSI Cards library styles FIRST (before other styles)
@import 'osi-cards-lib/styles/_styles-scoped'

body
  --text-color: black
  --bkg-color: #F7F7F7
  // ... rest of your styles
```

### Fix 4: Update `cards.component.sass` (Optional)

Your current styles might conflict. Consider removing or adjusting:

```sass
.osi-cards-container
  width: 100%
  max-width: 100%
  padding: 0.5rem  // This might conflict with library's 8px padding
  margin-bottom: 1rem
  box-sizing: border-box

  // These ::ng-deep styles might not be needed if library styles load correctly
  // ::ng-deep app-ai-card-renderer
  //   display: block
  //   width: 100%

  // ::ng-deep .osi-card
  //   background: var(--card-bg-color, #fff)
  //   border-radius: 12px
  //   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08)
  //   overflow: hidden
```

The library already provides these styles, so you might not need the `::ng-deep` overrides.

## Verification Checklist

After making these changes:

1. ✅ `provideOsiCards()` is in `app.config.ts` (you already have this)
2. ✅ `AICardRendererComponent` is imported in your module (you already have this)
3. ✅ `@import 'osi-cards-lib/styles/_styles-scoped'` is in `styles.sass`
4. ✅ `stylePreprocessorOptions` is configured in `angular.json`
5. ✅ `data-theme` attribute is on `.osi-cards-container`
6. ✅ Rebuild your app: `ng build` or `npm start`

## Testing

1. Check browser console for any 404 errors on style files
2. Verify the card renders with proper styling
3. Check that animations work (if enabled)
4. Test theme switching if you implement it

## Common Issues

### Styles still not loading?
- Try: `@import '~osi-cards-lib/styles/_styles-scoped'` (with tilde)
- Or add directly to `angular.json` styles array: `"node_modules/osi-cards-lib/styles/_styles-scoped.scss"`

### Theme not applying?
- Make sure `data-theme="day"` or `data-theme="night"` is set
- Check that the attribute is on the `.osi-cards-container` div

### Component not rendering?
- Verify `provideOsiCards()` is in providers
- Check that `AICardRendererComponent` is imported in your module
- Ensure `cardConfig` is not null


