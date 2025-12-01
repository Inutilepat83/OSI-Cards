# OSI-Cards Architecture

## Overview

OSI-Cards follows a **library-first** architecture where all reusable code resides in `projects/osi-cards-lib/` and the application (`src/app/`) only contains app-specific code.

## Core Principles

### 1. Single Source of Truth
- **Section Registry** (`section-registry.json`) is THE master definition for all sections
- All section types, properties, defaults, and validations derive from this registry
- Code generation creates TypeScript types, SCSS tokens, validators, and documentation

### 2. Library First
- ALL reusable code lives in `projects/osi-cards-lib/`
- App (`src/app/`) only contains app-specific code
- Import from library using path aliases: `@osi-cards/lib`, `@osi-cards/sections`, etc.

### 3. No Duplicates
- Components exist in ONE place only
- Services exist in ONE place only
- If the library has it, the app imports from the library

## Directory Structure

```
OSI-Cards/
├── projects/osi-cards-lib/          # NPM LIBRARY (Single Source of Truth)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/          # All reusable components
│   │   │   │   ├── sections/        # ALL section components
│   │   │   │   │   ├── analytics-section/
│   │   │   │   │   ├── chart-section/
│   │   │   │   │   └── ...
│   │   │   │   ├── ai-card-renderer/
│   │   │   │   ├── masonry-grid/
│   │   │   │   └── section-renderer/
│   │   │   ├── services/            # All reusable services
│   │   │   │   ├── theme.service.ts
│   │   │   │   ├── card-facade.service.ts
│   │   │   │   ├── event-bus.service.ts
│   │   │   │   └── ...
│   │   │   ├── utils/               # All utilities
│   │   │   ├── models/              # All interfaces/types
│   │   │   ├── themes/              # Theming system
│   │   │   ├── styles/              # SCSS source
│   │   │   └── constants/           # Constants
│   │   └── public-api.ts            # Public exports
│   ├── section-registry.json        # MASTER section definitions
│   └── package.json                 # Library package
│
├── src/app/                         # APPLICATION (App-specific only)
│   ├── core/                        # App infrastructure
│   │   ├── services/                # App-only services (API, auth, streaming)
│   │   ├── guards/                  # Route guards
│   │   ├── interceptors/            # HTTP interceptors
│   │   └── workers/                 # Web workers
│   ├── features/                    # Feature modules
│   │   ├── documentation/           # Docs site
│   │   ├── home/                    # Home page
│   │   ├── ilibrary/                # Library showcase
│   │   └── ...
│   └── shared/                      # App-shared code
│       ├── components/              # App-only components
│       ├── services/                # App-only services
│       ├── pipes/                   # Pipes
│       └── directives/              # Directives
│
├── docs/                            # Documentation (Single source)
│   ├── ARCHITECTURE.md              # This file
│   ├── SERVICES.md
│   ├── THEMING_GUIDE.md
│   └── ...
│
├── e2e/                             # End-to-end tests
│   ├── integration/
│   └── visual-regression/
│
└── scripts/                         # Build & generation scripts
    ├── generate-from-registry.js    # Master generator
    └── ...
```

## Decision Tree: Where Does Code Belong?

```
Is this code reusable across different Angular apps?
│
├── YES → projects/osi-cards-lib/
│   │
│   ├── Is it a section component?
│   │   └── YES → lib/components/sections/[section-name]/
│   │
│   ├── Is it a UI component?
│   │   └── YES → lib/components/[component-name]/
│   │
│   ├── Is it a service?
│   │   └── YES → lib/services/[service-name].service.ts
│   │
│   ├── Is it a utility function?
│   │   └── YES → lib/utils/[name].util.ts
│   │
│   ├── Is it a model/interface?
│   │   └── YES → lib/models/[name].model.ts
│   │
│   └── Is it styling?
│       └── YES → lib/styles/
│
└── NO → src/app/
    │
    ├── Is it app infrastructure (guards, interceptors)?
    │   └── YES → core/
    │
    ├── Is it a feature/page?
    │   └── YES → features/[feature-name]/
    │
    └── Is it shared within the app only?
        └── YES → shared/
```

## Code Generation Pipeline

```
section-registry.json (SINGLE SOURCE OF TRUTH)
        │
        ▼
   generate-from-registry.js
        │
        ├──► lib/models/generated-section-types.ts    (TypeScript types)
        ├──► lib/section-manifest.generated.ts        (Component mappings)
        ├──► lib/styles/tokens/_section-tokens.scss   (SCSS tokens)
        ├──► lib/validators/section-validators.ts     (Validation logic)
        └──► docs/sections/                           (Documentation)
```

## Import Rules

### ✅ CORRECT: Import from library aliases
```typescript
// Section components
import { AnalyticsSectionComponent } from '@osi-cards/sections';

// Services
import { ThemeService, CardFacadeService } from '@osi-cards/services';

// Utilities
import { sanitize, validateSection } from '@osi-cards/utils';

// Models
import { CardConfig, SectionType } from '@osi-cards/models';

// Themes
import { darkTheme, lightTheme } from '@osi-cards/themes';
```

### ❌ WRONG: Don't create duplicates
```typescript
// DON'T create src/app/shared/components/analytics-section/
// DON'T create src/app/shared/services/theme.service.ts
// DON'T import directly from lib paths
import { x } from 'projects/osi-cards-lib/src/lib/...'; // WRONG
```

## Dependency Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   section-registry.json                      │
│                  (SINGLE SOURCE OF TRUTH)                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │      Code Generators     │
              │   (scripts/generate-*)   │
              └───────────────────────┬─┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│   TypeScript  │           │     SCSS      │           │     Docs      │
│    Types      │           │    Tokens     │           │  Generation   │
└───────────────┘           └───────────────┘           └───────────────┘
        │                             │                             │
        └─────────────────────────────┼─────────────────────────────┘
                                      │
                                      ▼
                      ┌───────────────────────────┐
                      │  projects/osi-cards-lib   │
                      │     (NPM LIBRARY)         │
                      └───────────────────────────┘
                                      │
                                      │ npm build
                                      ▼
                      ┌───────────────────────────┐
                      │        dist/osi-cards-lib │
                      └───────────────────────────┘
                                      │
                                      │ npm install / import
                                      ▼
                      ┌───────────────────────────┐
                      │         src/app           │
                      │    (CONSUMING APP)        │
                      └───────────────────────────┘
```

## Service Scoping

### Root-Level Services (Singletons)
```typescript
@Injectable({ providedIn: 'root' })
export class ThemeService { }
```
- ThemeService - Global theme state
- EventBusService - Global event communication
- SectionRegistryService - Section metadata cache
- IconService - Icon cache

### Component-Scoped Services
```typescript
@Component({
  providers: [CardStateService]
})
```
- CardStateService - Per-card state
- SectionAnimationService - Per-section animations

## Migration Strategy

When migrating existing duplicates:
1. **Compare** src and lib versions
2. **Merge** unique features to lib version
3. **Update** lib version with merged code
4. **Update imports** in app to use lib version
5. **Delete** src version
6. **Test** thoroughly

## Testing Strategy

```
projects/osi-cards-lib/
└── src/lib/testing/
    ├── fixtures/           # Mock data
    ├── mocks/              # Service mocks
    └── utils/              # Test utilities
```

### Using Test Utilities
```typescript
import { createMockSection, renderSection } from '@osi-cards/testing';

it('should render analytics section', () => {
  const fixture = renderSection('analytics', { title: 'Test' });
  expect(fixture.nativeElement).toBeTruthy();
});
```

## Performance Considerations

### Lazy Loading
- Sections are lazy-loaded by default
- Use `LazySectionLoader` for dynamic loading
- Preload critical sections on app init

### Caching
- Section components are cached after first load
- Theme styles are cached per theme
- Registry lookups are memoized

### Change Detection
- All components use `OnPush` change detection
- Use signals for reactive state
- Minimize template expressions

## Versioning

The library follows semantic versioning:
- **MAJOR**: Breaking API changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

When releasing:
1. Update `section-registry.json` if needed
2. Run `npm run generate:all`
3. Run `npm run version:minor` (or major/patch)
4. Run `npm run publish:lib`

---

## Related Documentation

- **[Getting Started](./GETTING_STARTED.md)** - Installation and initial setup
- **[Components](./COMPONENTS.md)** - Component architecture details
- **[Services](./SERVICES.md)** - Service documentation
- **[Plugin System](./PLUGIN_SYSTEM.md)** - Extending with custom sections
- **[Section Registry](./SECTION_REGISTRY.md)** - Section type definitions
- **[CSS Encapsulation](./CSS_ENCAPSULATION.md)** - Style isolation strategies

---

*Last Updated: December 2025*

