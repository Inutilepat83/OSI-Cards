# Bundle Size Optimization Guide

## Current Bundle Configuration

### Size Limits
- **Initial Bundle**: 650 KB (uncompressed)
- **Gzipped Target**: 200 KB (compressed)
- **Component Styles**: 6 KB warning, 10 KB error
- **Any Bundle**: 500 KB warning, 1 MB error

### Bundle Analysis

Run bundle analysis:
```bash
npm run bundle:analyze
```

This will:
- Show size breakdown by file
- Calculate initial bundle size
- Check gzipped sizes
- Provide optimization recommendations

## Optimization Strategies

### 1. Tree Shaking

Angular automatically tree-shakes unused code. Ensure:
- Use ES6 imports (`import { X } from 'module'` not `import *`)
- Avoid side-effect imports in barrel files
- Use `sideEffects: false` in package.json for library code

### 2. Lazy Loading

Optional dependencies are already configured for lazy loading:
- `chart.js` - Only loaded when ChartSection is used
- `leaflet` - Only loaded when MapSection is used
- `primeng` - Only loaded when needed

### 3. Code Splitting

Current configuration:
- `vendorChunk: false` - Vendor code in main bundle (can be split)
- `commonChunk: true` - Common code extracted
- Route-based splitting available

### 4. Remove Unused Dependencies

Check for unused dependencies:
```bash
npx depcheck
```

### 5. Optimize Assets

- Images: Use WebP format with fallbacks
- Fonts: Subset fonts to only include used characters
- Icons: Use icon fonts or SVGs instead of large image files

### 6. Production Build Optimizations

Already enabled:
- ✅ `optimization: true`
- ✅ `buildOptimizer: true`
- ✅ `aot: true` (Ahead-of-Time compilation)
- ✅ `extractLicenses: true`
- ✅ `sourceMap: false` (in production)

## Monitoring Bundle Size

### CI/CD Integration

The `size-check.js` script runs in CI to enforce size limits:
```bash
npm run size:check
```

### Manual Analysis

1. Build production bundle:
   ```bash
   npm run build:prod
   ```

2. Analyze bundle:
   ```bash
   npm run bundle:analyze
   ```

3. Use webpack-bundle-analyzer for detailed analysis:
   ```bash
   npm run analyze
   ```

## Optimization Checklist

- [ ] Run bundle analysis regularly
- [ ] Monitor bundle size in CI/CD
- [ ] Lazy load optional dependencies
- [ ] Remove unused dependencies
- [ ] Optimize images and assets
- [ ] Use tree-shaking friendly imports
- [ ] Split vendor chunks if needed
- [ ] Enable compression (gzip/brotli)

## Current Bundle Structure

```
dist/osi-cards/
├── main.[hash].js       # Main application code
├── runtime.[hash].js    # Webpack runtime
├── polyfills.[hash].js  # Polyfills
├── styles.[hash].css    # Global styles
└── [other chunks]       # Lazy-loaded chunks
```

## Recommendations

1. **Monitor regularly**: Run `npm run bundle:analyze` after major changes
2. **Set alerts**: Configure CI to fail if bundle exceeds limits
3. **Review large dependencies**: Check if large libraries can be replaced or lazy-loaded
4. **Optimize incrementally**: Make small optimizations rather than large refactors

## Related Files

- `scripts/size-check.js` - CI size check script
- `scripts/bundle-analyzer.js` - Detailed bundle analysis
- `angular.json` - Build configuration and budgets
- `package.json` - Dependencies and scripts


