# Fix: Styles Not Loading in Sales Assistance Frontend

## Problem
The card component renders but has no styles applied.

## Root Cause
The SASS `@import` statement in `styles.sass` is not resolving correctly because:
1. Angular doesn't know where to look for `node_modules` imports in SASS files
2. The `stylePreprocessorOptions` is missing from `angular.json`
3. SASS imports from `node_modules` need special configuration

## Solution: Add Styles Directly to angular.json

This is the **most reliable** method for SASS files.

### Step 1: Update `angular.json`

Add the library styles directly to the `styles` array and configure `stylePreprocessorOptions`:

```json
{
  "projects": {
    "orangesalesassistant": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "src/styles.sass",
              "node_modules/osi-cards-lib/styles/_styles-scoped.scss",
              "node_modules/datatables.net-dt/css/dataTables.dataTables.min.css",
              "node_modules/datatables.net-buttons-dt/css/buttons.dataTables.css",
              "node_modules/boosted/dist/css/boosted.min.css",
              "node_modules/boosted/dist/css/orange-helvetica.css",
              "node_modules/bootstrap-icons/font/bootstrap-icons.css",
              "node_modules/@ng-select/ng-select/themes/material.theme.css",
              "node_modules/flatpickr/dist/flatpickr.min.css"
            ],
            "stylePreprocessorOptions": {
              "includePaths": [
                "node_modules/osi-cards-lib/styles"
              ],
              "sass": {
                "silenceDeprecations": ["import"]
              }
            }
          }
        }
      }
    }
  }
}
```

### Step 2: Remove or Comment Out the Import from `styles.sass`

Since we're adding it directly to `angular.json`, remove line 436:

```sass
.filename
  max-width: 250px
  word-wrap: anywhere

// Remove this line - styles are now loaded via angular.json
// @import 'osi-cards-lib/styles/_styles-scoped';
```

### Step 3: Rebuild

```bash
ng build
# or
npm start
```

## Alternative: Fix the SASS Import

If you prefer to keep the import in `styles.sass`, you need to:

### Option A: Use Tilde Prefix

```sass
@import '~osi-cards-lib/styles/_styles-scoped';
```

### Option B: Use Full Path

```sass
@import 'node_modules/osi-cards-lib/styles/_styles-scoped';
```

### Option C: Add to angular.json stylePreprocessorOptions

```json
"stylePreprocessorOptions": {
  "includePaths": [
    "node_modules"
  ],
  "sass": {
    "silenceDeprecations": ["import"]
  }
}
```

Then in `styles.sass`:
```sass
@import 'osi-cards-lib/styles/_styles-scoped';
```

## Verification

After making changes:

1. **Check browser console** - Look for 404 errors on `.scss` files
2. **Inspect the element** - Check if `.osi-cards-container` has styles applied
3. **Check computed styles** - Verify CSS variables are set (e.g., `--card-bg-color`)
4. **Network tab** - Ensure style files are being loaded

## Why This Happens

SASS/SCSS imports from `node_modules` require:
- Either explicit path resolution via `includePaths`
- Or direct addition to `angular.json` styles array
- Or tilde prefix (`~`) for webpack-style resolution

The `angular.json` method is most reliable because Angular handles the compilation directly.




