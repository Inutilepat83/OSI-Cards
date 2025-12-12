# Automatic Styles Setup for OSI Cards Library

## Overview

The OSI Cards library now includes an **automated setup script** that configures `angular.json` to automatically include library styles. This ensures styles are always loaded correctly, regardless of SASS/SCSS import resolution issues.

## How It Works

When you run the setup script, it:
1. ✅ Finds your `angular.json` file
2. ✅ Adds `node_modules/osi-cards-lib/styles/_styles-scoped.scss` to the styles array
3. ✅ Configures `stylePreprocessorOptions` with correct `includePaths`
4. ✅ Sets up SASS deprecation silence
5. ✅ Works with all Angular projects in your workspace

## Usage

### Option 1: Run Setup Script (Recommended)

After installing the library:

```bash
node node_modules/osi-cards-lib/scripts/setup-angular-styles.js
```

### Option 2: Manual Configuration

If you prefer to configure manually, add to your `angular.json`:

```json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "src/styles.sass",
              "node_modules/osi-cards-lib/styles/_styles-scoped.scss"
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

## Benefits

### ✅ Automatic Style Loading
- Styles are included in every build automatically
- No need to remember to import in your styles file
- Works regardless of SASS/SCSS import resolution

### ✅ No Import Statements Needed
- Remove `@import 'osi-cards-lib/styles/_styles-scoped'` from your styles file
- Styles are loaded directly via `angular.json`
- Cleaner, more maintainable setup

### ✅ Reliable Build Process
- No dependency on SASS import path resolution
- Works with all Angular versions
- Consistent across all environments

## What Gets Configured

The script automatically adds:

1. **Styles Array Entry**:
   ```json
   "styles": [
     "node_modules/osi-cards-lib/styles/_styles-scoped.scss"
   ]
   ```

2. **Style Preprocessor Options**:
   ```json
   "stylePreprocessorOptions": {
     "includePaths": [
       "node_modules/osi-cards-lib/styles"
     ],
     "sass": {
       "silenceDeprecations": ["import"]
     }
   }
   ```

## After Running Setup

1. **Remove the import** from your `styles.sass` or `styles.scss`:
   ```sass
   // Remove this line:
   // @import 'osi-cards-lib/styles/_styles-scoped';
   ```

2. **Rebuild your app**:
   ```bash
   ng build
   # or
   npm start
   ```

3. **Verify styles are loading**:
   - Check browser console for errors
   - Inspect `.osi-cards-container` element
   - Verify CSS variables are set

## Troubleshooting

### Script Not Found
If the script isn't found, make sure:
- The library is installed: `npm list osi-cards-lib`
- You're in the root of your Angular project
- The library version is 1.5.19 or higher

### Styles Still Not Loading
1. Check that `angular.json` was updated correctly
2. Verify the styles array includes the library path
3. Rebuild your app completely: `ng build --delete-output-path`
4. Check browser console for 404 errors

### Multiple Projects
The script automatically configures all Angular application projects in your workspace. If you have multiple projects, all will be configured.

## Integration with CI/CD

You can add the setup script to your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Setup OSI Cards Styles
  run: node node_modules/osi-cards-lib/scripts/setup-angular-styles.js
```

Or in your `package.json`:

```json
{
  "scripts": {
    "postinstall": "node node_modules/osi-cards-lib/scripts/setup-angular-styles.js"
  }
}
```

**Note**: Be careful with `postinstall` as it runs after every `npm install`. Consider running it manually or only in specific environments.

## Summary

The automatic setup script makes it easy to configure OSI Cards library styles in your Angular project. Simply run the script after installation, and styles will be automatically included in every build!


