# Installation Fix - Package Name Update

## Issue

The package name was changed from `@osi/cards-lib` to `osi-cards-lib` to avoid requiring an npm organization.

## Correct Installation

Use the unscoped package name:

```bash
npm install osi-cards-lib
```

**NOT:**
```bash
npm install @osi/cards-lib  # ❌ This won't work
```

## About the Peer Dependency Error

If you see a peer dependency error about `@angular-slider/ngx-slider@18.0.0`, this is **not** related to `osi-cards-lib`. 

The error is because:
- Your project uses Angular 20.2.2
- `@angular-slider/ngx-slider@18.0.0` requires Angular 18

### Solutions for the Angular Slider Issue

1. **Update the slider package** (if available):
   ```bash
   npm install @angular-slider/ngx-slider@latest
   ```

2. **Use --legacy-peer-deps** (not recommended for production):
   ```bash
   npm install osi-cards-lib --legacy-peer-deps
   ```

3. **Remove or replace the slider package** if it's not compatible with Angular 20

## Installing osi-cards-lib

The `osi-cards-lib` package requires Angular 20 and should install without issues if your project uses Angular 20:

```bash
# Install the library
npm install osi-cards-lib

# Install peer dependencies (if not already installed)
npm install @angular/common@^20.0.0 @angular/core@^20.0.0 @angular/animations@^20.0.0 @angular/platform-browser@^20.0.0 lucide-angular@^0.548.0 rxjs@~7.8.0
```

## Package Information

- **Package Name**: `osi-cards-lib`
- **Version**: `1.0.0`
- **npm URL**: https://www.npmjs.com/package/osi-cards-lib
- **Angular Version**: Requires Angular 20.0.0 or higher

