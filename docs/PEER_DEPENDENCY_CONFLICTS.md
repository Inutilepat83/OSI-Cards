# Handling Peer Dependency Conflicts

When installing `osi-cards-lib` in projects with Angular 20, you may encounter peer dependency conflicts with packages that haven't been updated to Angular 20 yet.

## Common Conflicts

### Packages That May Cause Conflicts

- `@ng-select/ng-select@13.x` - Requires Angular 18
- `@angular-slider/ngx-slider@18.x` - Requires Angular 18
- Other packages that require Angular 17 or 18

## Solutions

### Solution 1: Use --legacy-peer-deps (Recommended)

This is the **recommended approach** when you have mixed Angular versions in your project:

```bash
npm install osi-cards-lib --legacy-peer-deps
```

**Why this works:**
- `osi-cards-lib` requires Angular 20, which matches your project
- The conflict is with other packages that haven't been updated yet
- `--legacy-peer-deps` tells npm to ignore peer dependency conflicts
- The library will work correctly because your project already has Angular 20

**When to use:**
- Your project uses Angular 20
- You have other packages that require Angular 18 or earlier
- You want to use both without downgrading Angular

### Solution 2: Update Incompatible Packages

Check if Angular 20 compatible versions exist:

```bash
# Check available versions
npm view @ng-select/ng-select versions --json
npm view @angular-slider/ngx-slider versions --json

# If Angular 20 compatible versions exist, update them
npm install @ng-select/ng-select@latest --legacy-peer-deps
npm install @angular-slider/ngx-slider@latest --legacy-peer-deps
```

**Note:** Not all packages have Angular 20 compatible versions yet. Check the package's GitHub repository or npm page for compatibility information.

### Solution 3: Use --force (Use with Caution)

```bash
npm install osi-cards-lib --force
```

**Warning:** This forces npm to install despite conflicts. Use only if you understand the implications.

### Solution 4: Configure npm to Always Use Legacy Peer Deps

Add to your `.npmrc` file (in your project root):

```
legacy-peer-deps=true
```

Then install normally:

```bash
npm install osi-cards-lib
```

## Understanding the Conflict

The error message shows:

```
peer @angular/common@"^18.0.0" from @ng-select/ng-select@13.9.1
Found: @angular/common@20.2.2
```

This means:
- Your project has Angular 20.2.2 ✅
- `osi-cards-lib` requires Angular 20 ✅ (compatible)
- `@ng-select/ng-select` requires Angular 18 ❌ (incompatible)

**The conflict is NOT with `osi-cards-lib`** - it's between your Angular 20 project and packages that require Angular 18.

## Verification

After installation, verify the library works:

```typescript
import { AICardRendererComponent, AICardConfig } from 'osi-cards-lib';

// This should work without errors
@Component({
  imports: [AICardRendererComponent],
  // ...
})
```

## Best Practices

1. **Use `--legacy-peer-deps`** when installing `osi-cards-lib` if you have Angular 18 dependencies
2. **Monitor package updates** - Check periodically for Angular 20 compatible versions of conflicting packages
3. **Test thoroughly** - After using `--legacy-peer-deps`, test your application to ensure everything works
4. **Update when possible** - When Angular 20 compatible versions become available, update those packages

## Example Installation Workflow

```bash
# 1. Install osi-cards-lib with legacy peer deps
npm install osi-cards-lib --legacy-peer-deps

# 2. Install peer dependencies (if not already installed)
npm install @angular/common@^20.0.0 @angular/core@^20.0.0 @angular/animations@^20.0.0 @angular/platform-browser@^20.0.0 lucide-angular@^0.548.0 rxjs@~7.8.0 --legacy-peer-deps

# 3. Import styles in your styles.scss
# @import 'osi-cards-lib/styles/_styles';

# 4. Use in your components
# import { AICardRendererComponent } from 'osi-cards-lib';
```

## Troubleshooting

### Issue: Library imports work but components don't render

**Solution:** Ensure styles are imported:
```scss
@import 'osi-cards-lib/styles/_styles';
```

### Issue: TypeScript errors about missing types

**Solution:** Restart your TypeScript server:
- VS Code: `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server"

### Issue: Runtime errors about missing dependencies

**Solution:** Ensure all peer dependencies are installed:
```bash
npm install @angular/common@^20.0.0 @angular/core@^20.0.0 @angular/animations@^20.0.0 @angular/platform-browser@^20.0.0 lucide-angular@^0.548.0 rxjs@~7.8.0
```

## Summary

- ✅ `osi-cards-lib` requires Angular 20 (matches your project)
- ⚠️ Other packages may require Angular 18 (causes conflicts)
- ✅ Use `--legacy-peer-deps` to resolve conflicts
- ✅ The library will work correctly with Angular 20


