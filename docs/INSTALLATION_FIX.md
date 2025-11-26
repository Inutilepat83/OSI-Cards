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

## About Peer Dependency Errors

If you see peer dependency errors about packages like:
- `@angular-slider/ngx-slider@18.0.0`
- `@ng-select/ng-select@13.9.1`
- Other packages requiring Angular 18

This is **not** related to `osi-cards-lib`. The error occurs because:
- Your project uses Angular 20.2.2 ✅
- `osi-cards-lib` requires Angular 20 ✅ (compatible)
- Other packages require Angular 18 ❌ (incompatible with your project)

### Recommended Solution: Use --legacy-peer-deps

```bash
npm install osi-cards-lib --legacy-peer-deps
```

**Why this is safe:**
- Your project already has Angular 20
- `osi-cards-lib` requires Angular 20 (matches your project)
- The conflict is with other packages, not `osi-cards-lib`
- The library will work correctly because Angular versions match

### Alternative Solutions

1. **Update incompatible packages** (if Angular 20 versions exist):
   ```bash
   npm install @ng-select/ng-select@latest --legacy-peer-deps
   npm install @angular-slider/ngx-slider@latest --legacy-peer-deps
   ```

2. **Configure npm globally** (add to `.npmrc`):
   ```
   legacy-peer-deps=true
   ```

3. **Remove or replace incompatible packages** if they're not essential

See [PEER_DEPENDENCY_CONFLICTS.md](./PEER_DEPENDENCY_CONFLICTS.md) for detailed information.

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

