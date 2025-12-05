# App-Specific Card Components

## Overview

This folder contains **app-specific implementations** of card components that extend the library versions with application-specific optimizations and features.

## Why These Exist

The library (`projects/osi-cards-lib`) provides the core, reusable card components. However, the demo application requires additional features that are not suitable for the library:

1. **ai-card-renderer.component** - Extended with:
   - App-specific streaming integration
   - Demo-specific export functionality
   - Optimized magnetic tilt effects

2. **section-renderer/** - Extended with:
   - App-specific lazy loading strategies
   - Demo-specific section registration
   - Custom fallback handling

3. **MagneticTiltService** (in `core/services`) - Optimized with:
   - Performance improvements for the demo
   - App-specific pointer tracking
   - Demo-specific animation presets

## Usage Guidelines

### For Library Consumers
Import from the library:
```typescript
import { AICardRendererComponent } from 'osi-cards-lib';
```

### For This Demo App
Import from this folder for app-specific features:
```typescript
import { AICardRendererComponent } from '@shared/components/cards/ai-card-renderer.component';
```

## File Structure

```
cards/
├── ai-card-renderer.component.ts    # App-specific card renderer
├── ai-card-renderer.component.html
├── ai-card-renderer.component.css
├── section-renderer/                # App-specific section renderer
│   ├── section-renderer.component.ts
│   ├── section-loader.service.ts
│   └── ...
└── sections/
    └── index.ts                     # Re-exports from library
```

## Relationship to Library

These components **extend** the library functionality. Changes that benefit all consumers should be contributed back to the library.

| Component | Library Location | App-Specific Features |
|-----------|------------------|----------------------|
| AICardRenderer | `lib/components/ai-card-renderer` | Streaming, export |
| SectionRenderer | `lib/components/section-renderer` | Custom loaders |
| MagneticTilt | `lib/services/magnetic-tilt.service` | Perf optimizations |

## Migration Notes

If you want to use the library versions instead:

1. Update imports to use `'osi-cards-lib'`
2. Remove app-specific dependencies
3. Test thoroughly

---

*Last Updated: December 1, 2025*




