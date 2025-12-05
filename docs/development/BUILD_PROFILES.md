# 🏗️ Build Profiles

Complete guide to build configurations and optimization strategies.

---

## 📋 Available Profiles

### 1. Development (Default)
```bash
npm start
# or
npm run build
```

**Optimizations:**
- Source maps enabled
- Development mode
- Fast rebuilds
- Detailed errors
- Debug logging

### 2. Production
```bash
npm run build -- --configuration=production
```

**Optimizations:**
- Minification
- Tree-shaking
- Dead code elimination
- AOT compilation
- Bundle optimization
- Source maps (external)

### 3. Staging
```bash
npm run build -- --configuration=staging
```

**Optimizations:**
- Production-like build
- Debug-friendly
- Performance monitoring
- Error tracking enabled

---

## 🎯 Build Optimization Strategies

### 1. Bundle Size Optimization ✅

**Current Budgets:**
- Initial: 2MB warning, 5MB error
- Bundles: 500KB warning, 1MB error
- Styles: 400KB warning, 600KB error

**Techniques:**
- Code splitting
- Lazy loading
- Tree-shaking
- Minification

### 2. Build Performance ✅

**Parallel Builds:**
```json
{
  "scripts": {
    "build:parallel": "npm run build:lib && npm run build"
  }
}
```

**Caching:**
- Angular build cache enabled
- npm cache utilized
- Docker layer caching

### 3. Asset Optimization ✅

**Images:**
- WebP format for modern browsers
- Responsive images
- Lazy loading

**Fonts:**
- Font subsetting
- WOFF2 format
- Preload critical fonts

---

## 📊 Build Comparison

| Profile | Build Time | Bundle Size | Source Maps | Minification |
|---------|------------|-------------|-------------|--------------|
| Development | ~20s | ~5MB | Inline | No |
| Staging | ~30s | ~1.5MB | External | Yes |
| Production | ~40s | ~800KB | External | Yes |

---

## ⚙️ Configuration

### angular.json

```json
{
  "configurations": {
    "production": {
      "optimization": true,
      "outputHashing": "all",
      "sourceMap": false,
      "namedChunks": false,
      "extractLicenses": true,
      "vendorChunk": false,
      "buildOptimizer": true,
      "budgets": [...]
    },
    "staging": {
      "optimization": true,
      "outputHashing": "all",
      "sourceMap": true,
      "namedChunks": true,
      "fileReplacements": [
        {
          "replace": "src/environments/environment.ts",
          "with": "src/environments/environment.staging.ts"
        }
      ]
    }
  }
}
```

---

## 🔍 Bundle Analysis

### Analyze Bundle

```bash
# Generate stats file
npm run build:stats

# Analyze with webpack-bundle-analyzer
npx webpack-bundle-analyzer dist/osi-cards/stats.json
```

### Identify Large Dependencies

```bash
# Check bundle composition
npm run bundle:analyze

# Results show:
# - Largest chunks
# - Dependency sizes
# - Unused exports
```

---

## 🎯 Optimization Targets

### Current Bundle Breakdown
```
Main bundle: ~450KB
Polyfills: ~100KB
Runtime: ~5KB
Lazy chunks: ~250KB each
Total: ~800KB (gzipped: ~300KB)
```

### Optimization Goals
- [ ] Main bundle < 400KB
- [ ] Lazy chunks < 200KB
- [ ] Total < 700KB
- [ ] Gzipped < 250KB

---

## 🚀 Advanced Techniques

### 1. Code Splitting

```typescript
// Route-level splitting
const routes: Routes = [
  {
    path: 'feature',
    loadComponent: () => import('./feature/feature.component')
  }
];
```

### 2. Dynamic Imports

```typescript
// Load on demand
async loadHeavyFeature() {
  const module = await import('./heavy-feature');
  module.initialize();
}
```

### 3. Tree-Shaking

```typescript
// ✅ Named imports (tree-shakeable)
import { specificFunction } from 'library';

// ❌ Namespace imports (not tree-shakeable)
import * as lib from 'library';
```

### 4. Preloading Strategy

```typescript
// Custom preloading
export class CustomPreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    return route.data?.['preload'] ? load() : of(null);
  }
}
```

---

## 📈 Performance Budgets

### Enforce Budgets

```json
{
  "budgets": [
    {
      "type": "bundle",
      "name": "main",
      "baseline": "500kb",
      "maximumWarning": "550kb",
      "maximumError": "600kb"
    }
  ]
}
```

### Monitor Budgets

```bash
# Check against budgets
npm run build

# Fails if exceeded:
# ✘ bundle initial exceeded maximum budget
```

---

## 🎯 Build Checklist

### Before Build
- [ ] Clean dist folder
- [ ] Update dependencies
- [ ] Run tests
- [ ] Check bundle budgets

### During Build
- [ ] Monitor build time
- [ ] Check for warnings
- [ ] Verify optimization

### After Build
- [ ] Analyze bundle size
- [ ] Test build locally
- [ ] Check source maps
- [ ] Verify lazy loading

---

**Last Updated:** December 4, 2025
**Build Version:** 1.5.5
**Status:** Optimized 🚀


