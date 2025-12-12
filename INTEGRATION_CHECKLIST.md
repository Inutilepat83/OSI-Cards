# OSI Cards Library Integration Checklist - Sales Assistance Frontend

## ✅ Completed Configuration

### 1. angular.json Configuration
- ✅ Added `node_modules/osi-cards-lib/styles/_styles-scoped.scss` to styles array
- ✅ Added `stylePreprocessorOptions` with `includePaths`
- ✅ Configured SASS deprecation silence

### 2. HTML Component
- ✅ Added `data-theme="night"` attribute to `.osi-cards-container`
- ✅ Component wrapper is correct: `<div class="osi-cards-container">`

### 3. Styles File
- ✅ Removed redundant `@import` from `styles.sass` (now loaded via angular.json)

### 4. App Configuration
- ✅ `provideOsiCards()` is in `app.config.ts`
- ✅ `AICardRendererComponent` is imported in module

## 🔍 Integration Verification Steps

### Step 1: Check Server is Running
```bash
# Check if server is running on port 4400
lsof -i:4400
# or
curl http://localhost:4400
```

### Step 2: Verify Styles are Loading

**In Browser DevTools:**
1. Open http://localhost:4400
2. Open DevTools (F12)
3. Go to Network tab
4. Filter by "stylesheet" or ".scss"
5. Look for: `_styles-scoped.scss` - should load with 200 status

**In Elements/Inspector:**
1. Find `.osi-cards-container` element
2. Check Computed styles:
   - Should have CSS variables like `--card-bg-color`
   - Should have styles from the library
   - Container should have `perspective: 1200px` (from library)

### Step 3: Check Console for Errors
- No 404 errors for style files
- No import resolution errors
- No missing module errors

### Step 4: Visual Verification
- Card should have proper styling (not unstyled)
- Theme should be applied (night theme = dark colors)
- Components should render correctly

## 🐛 Troubleshooting

### Styles Not Loading?
1. **Check angular.json** - Verify styles array includes library path
2. **Check build output** - Look for SCSS compilation errors
3. **Clear cache** - Delete `.angular` folder and rebuild
4. **Check node_modules** - Ensure `osi-cards-lib` is installed

### Component Not Rendering?
1. **Check providers** - Verify `provideOsiCards()` is in app.config.ts
2. **Check imports** - Verify `AICardRendererComponent` is imported
3. **Check data** - Ensure `cardConfig` is not null

### Theme Not Applying?
1. **Check HTML** - Verify `data-theme="night"` is on container
2. **Check CSS variables** - Inspect element for `--card-*` variables
3. **Check theme service** - If using ThemeService, verify it's configured

## 📝 Current Configuration Summary

**angular.json:**
```json
{
  "styles": [
    "src/styles.sass",
    "node_modules/osi-cards-lib/styles/_styles-scoped.scss"
  ],
  "stylePreprocessorOptions": {
    "includePaths": ["node_modules/osi-cards-lib/styles"],
    "sass": {
      "silenceDeprecations": ["import"]
    }
  }
}
```

**HTML:**
```html
<div class="osi-cards-container" [attr.data-theme]="'night'" *ngIf="cardConfig">
  <app-ai-card-renderer [cardConfig]="cardConfig"></app-ai-card-renderer>
</div>
```

**styles.sass:**
- Import removed (styles loaded via angular.json)

## ✅ Expected Result

When everything is configured correctly:
- ✅ Server runs on port 4400
- ✅ Styles load automatically via angular.json
- ✅ Card renders with proper styling
- ✅ Night theme is applied
- ✅ No console errors
- ✅ All library features work correctly


