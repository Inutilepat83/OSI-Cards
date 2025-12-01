# OSI-Cards 100-Point Improvement Plan - DETAILED IMPLEMENTATION

**Version:** 2.0 (Deep Planning)
**Date:** December 1, 2025
**Total Estimated Effort:** 12 weeks

---

## Table of Contents

- [Phase 1: Foundation & Cleanup (Points 1-15)](#phase-1-foundation--cleanup)
- [Phase 2: Single Source of Truth - Sections (Points 16-35)](#phase-2-single-source-of-truth---sections)
- [Phase 3: Service Consolidation (Points 36-50)](#phase-3-service-consolidation)
- [Phase 4: Component Architecture (Points 51-65)](#phase-4-component-architecture)
- [Phase 5: Style System Unification (Points 66-75)](#phase-5-style-system-unification)
- [Phase 6: Documentation & Build (Points 76-85)](#phase-6-documentation--build)
- [Phase 7: Testing & Quality (Points 86-95)](#phase-7-testing--quality)
- [Phase 8: Advanced Optimizations (Points 96-100)](#phase-8-advanced-optimizations)

---

# Phase 1: Foundation & Cleanup

## Point 1: Delete Orphan Spec Files

### Current State
```
src/app/core/services/icon.service.spec.ts (49 lines) - NO SOURCE
src/app/features/home/components/home-page/home-page.llm-preview.spec.ts (213 lines) - NO SOURCE
src/app/shared/services/magnetic-tilt.service.spec.ts (65 lines) - NO SOURCE
src/app/testing/components/single-card.component.spec.ts (24 lines) - NO SOURCE
src/app/testing/effects/cards.effects.spec.ts (36 lines) - NO SOURCE
```

### Implementation Steps

**Step 1.1:** Verify no source file exists
```bash
# Run verification script
cd /Users/arthurmariani/Desktop/OSI-Cards-1

# Check each file
for spec in \
  "src/app/core/services/icon.service.spec.ts" \
  "src/app/features/home/components/home-page/home-page.llm-preview.spec.ts" \
  "src/app/shared/services/magnetic-tilt.service.spec.ts" \
  "src/app/testing/components/single-card.component.spec.ts" \
  "src/app/testing/effects/cards.effects.spec.ts"
do
  source="${spec%.spec.ts}.ts"
  if [ ! -f "$source" ]; then
    echo "ORPHAN: $spec"
  fi
done
```

**Step 1.2:** Check if tests are imported anywhere
```bash
# Verify no imports reference these files
grep -r "icon.service.spec" --include="*.ts" src/
grep -r "home-page.llm-preview.spec" --include="*.ts" src/
grep -r "magnetic-tilt.service.spec" --include="*.ts" src/
grep -r "single-card.component.spec" --include="*.ts" src/
grep -r "cards.effects.spec" --include="*.ts" src/
```

**Step 1.3:** Archive before deletion (optional safety)
```bash
mkdir -p .archive/orphan-specs
cp src/app/core/services/icon.service.spec.ts .archive/orphan-specs/
cp src/app/features/home/components/home-page/home-page.llm-preview.spec.ts .archive/orphan-specs/
cp src/app/shared/services/magnetic-tilt.service.spec.ts .archive/orphan-specs/
cp src/app/testing/components/single-card.component.spec.ts .archive/orphan-specs/
cp src/app/testing/effects/cards.effects.spec.ts .archive/orphan-specs/
```

**Step 1.4:** Delete files
```bash
rm src/app/core/services/icon.service.spec.ts
rm src/app/features/home/components/home-page/home-page.llm-preview.spec.ts
rm src/app/shared/services/magnetic-tilt.service.spec.ts
rm src/app/testing/components/single-card.component.spec.ts
rm src/app/testing/effects/cards.effects.spec.ts
```

**Step 1.5:** Run tests to verify nothing breaks
```bash
npm run test:unit
npm run build
```

### Acceptance Criteria
- [ ] All 5 orphan spec files deleted
- [ ] No test failures
- [ ] Build succeeds
- [ ] No import errors

### Estimated Time: 30 minutes

---

## Point 2: Delete Backup/Legacy Files

### Current State
```
projects/osi-cards-lib/src/lib/optional/ng-package.json.bak
```

### Implementation Steps

**Step 2.1:** Verify it's a backup (compare with original if exists)
```bash
# Check if original exists
ls -la projects/osi-cards-lib/src/lib/optional/ng-package.json

# Compare if both exist
diff projects/osi-cards-lib/src/lib/optional/ng-package.json \
     projects/osi-cards-lib/src/lib/optional/ng-package.json.bak
```

**Step 2.2:** Delete backup file
```bash
rm projects/osi-cards-lib/src/lib/optional/ng-package.json.bak
```

**Step 2.3:** Search for other backup files
```bash
find . -name "*.bak" -o -name "*.backup" -o -name "*.old" -o -name "*~" \
  | grep -v node_modules | grep -v dist
```

### Acceptance Criteria
- [ ] Backup file deleted
- [ ] No other hidden backup files exist
- [ ] Build succeeds

### Estimated Time: 15 minutes

---

## Point 3: Audit Unused Scripts

### Current State
10 scripts not referenced in package.json:
```
scripts/audit-tokens.js
scripts/build-standalone-css.js
scripts/detect-version-bump.js
scripts/generate-ngdoc-pages.js
scripts/generate-ngdoc-routes.js
scripts/regenerate-all-doc-pages.js
scripts/regenerate-doc-pages.js
scripts/sync-registry.js
scripts/verify-exports.js
scripts/version-manager.js
```

### Implementation Steps

**Step 3.1:** Create audit spreadsheet

| Script | Lines | Purpose | Decision | Action |
|--------|-------|---------|----------|--------|
| audit-tokens.js | ? | Token auditing | KEEP/DELETE | Add to package.json / Delete |
| build-standalone-css.js | ? | CSS build | KEEP/DELETE | Add to package.json / Delete |
| ... | ... | ... | ... | ... |

**Step 3.2:** Analyze each script

```bash
# For each script, determine purpose
for script in scripts/audit-tokens.js scripts/build-standalone-css.js \
  scripts/detect-version-bump.js scripts/generate-ngdoc-pages.js \
  scripts/generate-ngdoc-routes.js scripts/regenerate-all-doc-pages.js \
  scripts/regenerate-doc-pages.js scripts/sync-registry.js \
  scripts/verify-exports.js scripts/version-manager.js
do
  echo "=== $script ==="
  head -30 "$script"
  echo ""
  wc -l "$script"
  echo "---"
done
```

**Step 3.3:** For scripts to KEEP, add to package.json
```json
{
  "scripts": {
    "audit:tokens": "node scripts/audit-tokens.js",
    "build:standalone-css": "node scripts/build-standalone-css.js",
    "version:detect-bump": "node scripts/detect-version-bump.js",
    "docs:generate-ngdoc-pages": "node scripts/generate-ngdoc-pages.js",
    "docs:generate-ngdoc-routes": "node scripts/generate-ngdoc-routes.js",
    "docs:regenerate-all": "node scripts/regenerate-all-doc-pages.js",
    "docs:regenerate": "node scripts/regenerate-doc-pages.js",
    "registry:sync": "node scripts/sync-registry.js",
    "verify:exports": "node scripts/verify-exports.js",
    "version:manage": "node scripts/version-manager.js"
  }
}
```

**Step 3.4:** For scripts to DELETE, archive then remove
```bash
mkdir -p .archive/unused-scripts
mv scripts/[script-name].js .archive/unused-scripts/
```

**Step 3.5:** Document decisions
```markdown
<!-- In scripts/README.md -->
## Script Audit (December 2025)

| Script | Status | Reason |
|--------|--------|--------|
| audit-tokens.js | ADDED | Useful for design token validation |
| build-standalone-css.js | DELETED | Replaced by compile-styles.js |
| ... | ... | ... |
```

### Acceptance Criteria
- [ ] Each script evaluated with documented decision
- [ ] Kept scripts added to package.json
- [ ] Deleted scripts archived
- [ ] scripts/README.md updated

### Estimated Time: 2 hours

---

## Point 4: Create ARCHITECTURE.md

### Implementation Steps

**Step 4.1:** Create the file
```bash
touch docs/ARCHITECTURE.md
```

**Step 4.2:** Document the architecture

```markdown
# OSI-Cards Architecture

## Overview

OSI-Cards follows a **library-first** architecture where all reusable code
resides in `projects/osi-cards-lib/` and the application (`src/app/`) only
contains app-specific code.

## Directory Structure

```
OSI-Cards/
├── projects/osi-cards-lib/     # NPM LIBRARY (Single Source of Truth)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/     # All reusable components
│   │   │   │   ├── sections/   # ALL section components
│   │   │   │   └── ...
│   │   │   ├── services/       # All reusable services
│   │   │   ├── utils/          # All utilities
│   │   │   ├── models/         # All interfaces/types
│   │   │   ├── themes/         # Theming system
│   │   │   └── styles/         # SCSS source
│   │   └── public-api.ts       # Public exports
│   └── package.json            # Library package
│
├── src/app/                    # APPLICATION (App-specific only)
│   ├── core/                   # App infrastructure
│   │   ├── services/           # App-only services (API, auth)
│   │   ├── guards/             # Route guards
│   │   └── interceptors/       # HTTP interceptors
│   ├── features/               # Feature modules
│   │   ├── documentation/      # Docs site
│   │   ├── home/               # Home page
│   │   └── ...
│   └── shared/                 # App-shared code
│       └── components/         # App-only components (re-exports lib)
│
└── docs/                       # Documentation (Single source)
```

## Decision Tree: Where Does Code Belong?

```
Is this code reusable across different Angular apps?
├── YES → projects/osi-cards-lib/
│   ├── Is it a section component? → lib/components/sections/
│   ├── Is it a service? → lib/services/
│   ├── Is it a utility? → lib/utils/
│   ├── Is it a model/interface? → lib/models/
│   └── Is it styling? → lib/styles/
│
└── NO → src/app/
    ├── Is it app infrastructure? → core/
    ├── Is it a feature? → features/[feature-name]/
    └── Is it shared within app? → shared/
```

## Single Source of Truth Principles

### 1. Section Registry
- `section-registry.json` is THE master definition
- All section types, defaults, validations derive from it
- Code generation creates TypeScript, SCSS, docs

### 2. No Duplicates Rule
- Components exist in ONE place only
- Services exist in ONE place only
- Utilities exist in ONE place only
- If lib has it, app imports from lib

### 3. Import Rules
```typescript
// ✅ CORRECT: Import from library
import { AnalyticsSectionComponent } from '@osi-cards/lib';
import { ThemeService } from '@osi-cards/services';

// ❌ WRONG: Don't duplicate in app
// Don't create src/app/shared/components/analytics-section/
```

## Migration Strategy

When migrating existing duplicates:
1. Compare src and lib versions
2. Merge unique features to lib
3. Update lib version
4. Delete src version
5. Update imports

## Dependency Flow

```
section-registry.json
        ↓
   [generators]
        ↓
projects/osi-cards-lib/
        ↓
     [npm build]
        ↓
    src/app/
```
```

### Acceptance Criteria
- [ ] ARCHITECTURE.md created
- [ ] Decision tree documented
- [ ] Import rules documented
- [ ] Migration strategy documented

### Estimated Time: 2 hours

---

## Point 5: Set Up Path Aliases

### Current State
No consistent path aliases for library imports.

### Implementation Steps

**Step 5.1:** Update root tsconfig.json
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@osi-cards/lib": ["projects/osi-cards-lib/src/public-api.ts"],
      "@osi-cards/lib/*": ["projects/osi-cards-lib/src/lib/*"],
      "@osi-cards/sections": ["projects/osi-cards-lib/src/lib/components/sections/index.ts"],
      "@osi-cards/services": ["projects/osi-cards-lib/src/lib/services/index.ts"],
      "@osi-cards/utils": ["projects/osi-cards-lib/src/lib/utils/index.ts"],
      "@osi-cards/models": ["projects/osi-cards-lib/src/lib/models/index.ts"],
      "@osi-cards/themes": ["projects/osi-cards-lib/src/lib/themes/index.ts"],
      "@osi-cards/constants": ["projects/osi-cards-lib/src/lib/constants/index.ts"],
      "@osi-cards/testing": ["projects/osi-cards-lib/src/lib/testing/index.ts"],
      "@app/*": ["src/app/*"],
      "@core/*": ["src/app/core/*"],
      "@shared/*": ["src/app/shared/*"],
      "@features/*": ["src/app/features/*"],
      "@env": ["src/environments/environment.ts"]
    }
  }
}
```

**Step 5.2:** Create index.ts barrel files in library

```typescript
// projects/osi-cards-lib/src/lib/components/sections/index.ts
export * from './analytics-section/analytics-section.component';
export * from './brand-colors-section/brand-colors-section.component';
export * from './chart-section/chart-section.component';
export * from './contact-card-section/contact-card-section.component';
export * from './event-section/event-section.component';
export * from './fallback-section/fallback-section.component';
export * from './financials-section/financials-section.component';
export * from './info-section.component';
export * from './list-section/list-section.component';
export * from './map-section/map-section.component';
export * from './network-card-section/network-card-section.component';
export * from './news-section/news-section.component';
export * from './overview-section/overview-section.component';
export * from './product-section/product-section.component';
export * from './quotation-section/quotation-section.component';
export * from './social-media-section/social-media-section.component';
export * from './solutions-section/solutions-section.component';
export * from './text-reference-section/text-reference-section.component';
export * from './base-section.component';
```

```typescript
// projects/osi-cards-lib/src/lib/services/index.ts
export * from './accessibility.service';
export * from './animation-orchestrator.service';
export * from './card-facade.service';
export * from './email-handler.service';
export * from './empty-state.service';
export * from './event-bus.service';
export * from './event-middleware.service';
export * from './feature-flags.service';
export * from './icon.service';
export * from './layout-worker.service';
export * from './magnetic-tilt.service';
export * from './reduced-motion.service';
export * from './retry-policy.service';
export * from './section-animation.service';
export * from './section-normalization.service';
export * from './section-plugin-registry.service';
export * from './section-utils.service';
export * from './streaming.service';
```

```typescript
// projects/osi-cards-lib/src/lib/utils/index.ts
export * from './accessibility.util';
export * from './animation-optimization.util';
export * from './card-diff.util';
export * from './card-spawner.util';
export * from './column-span-optimizer.util';
export * from './component-composition.util';
export * from './container-queries.util';
export * from './error-boundary.util';
export * from './flip-animation.util';
export * from './frame-budget.util';
export * from './gap-filler-optimizer.util';
export * from './grid-accessibility.util';
export * from './grid-config.util';
export * from './grid-logger.util';
export * from './incremental-layout.util';
export * from './input-coercion.util';
export * from './input-validation.util';
export * from './layout-cache.util';
export * from './layout-debug.util';
export * from './layout-optimizer.util';
export * from './local-swap-optimizer.util';
export * from './lru-cache.util';
export * from './masonry-detection.util';
export * from './memo.util';
export * from './memory.util';
export * from './performance.util';
export * from './responsive.util';
export * from './retry.util';
export * from './row-packer.util';
export * from './sanitization.util';
export * from './skyline-algorithm.util';
export * from './smart-grid-logger.util';
export * from './smart-grid.util';
export * from './streaming-layout.util';
export * from './style-validator.util';
export * from './virtual-scroll-enhanced.util';
export * from './virtual-scroll.util';
export * from './web-animations.util';
```

```typescript
// projects/osi-cards-lib/src/lib/models/index.ts
export * from './card.model';
export * from './discriminated-sections';
export * from './generated-section-types';
```

```typescript
// projects/osi-cards-lib/src/lib/themes/index.ts
export * from './theme.service';
export * from './theme-builder.util';
export * from './theme-composer.util';
export * from './theme-config.provider';
export * from './tokens.constants';
export * from './presets';
```

**Step 5.3:** Update tsconfig.app.json
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/app",
    "types": []
  },
  "files": ["src/main.ts"],
  "include": ["src/**/*.d.ts"]
}
```

**Step 5.4:** Test the aliases
```typescript
// Test file: src/app/test-aliases.ts
import { AnalyticsSectionComponent } from '@osi-cards/sections';
import { ThemeService } from '@osi-cards/services';
import { sanitize } from '@osi-cards/utils';
import { CardConfig } from '@osi-cards/models';
import { darkTheme } from '@osi-cards/themes';

console.log('Aliases work!');
```

**Step 5.5:** Run build to verify
```bash
npm run build
```

### Acceptance Criteria
- [ ] Path aliases configured in tsconfig.json
- [ ] All barrel exports created
- [ ] Build succeeds with aliases
- [ ] IDE autocomplete works

### Estimated Time: 3 hours

---

## Point 6: Create Dependency Injection Strategy Document

### Implementation Steps

**Step 6.1:** Create the document
```bash
touch docs/DEPENDENCY_INJECTION.md
```

**Step 6.2:** Document DI strategy

```markdown
# Dependency Injection Strategy

## Service Scopes

### Root-Level Services (providedIn: 'root')

These services are singletons shared across the entire application.

| Service | Scope | Reason |
|---------|-------|--------|
| `ThemeService` | root | Global theme state |
| `EventBusService` | root | Global event communication |
| `SectionRegistryService` | root | Section metadata cache |
| `IconService` | root | Icon cache |
| `FeatureFlagsService` | root | Global feature flags |

```typescript
@Injectable({ providedIn: 'root' })
export class ThemeService {
  // Singleton - one instance for entire app
}
```

### Component-Scoped Services

These services are created per component instance.

| Service | Scope | Reason |
|---------|-------|--------|
| `CardStateService` | component | Per-card state |
| `SectionAnimationService` | component | Per-section animations |
| `StreamingService` | component | Per-card streaming |

```typescript
@Component({
  providers: [CardStateService] // New instance per component
})
export class AiCardRendererComponent {
  private readonly state = inject(CardStateService);
}
```

### Module-Scoped Services

These services are shared within a feature module.

| Service | Scope | Reason |
|---------|-------|--------|
| `DocCacheService` | documentation module | Documentation caching |

```typescript
@NgModule({
  providers: [DocCacheService]
})
export class DocumentationModule {}
```

## Override Patterns

### Providing Custom Implementation

```typescript
// In app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    // Override library service with custom implementation
    {
      provide: ThemeService,
      useClass: CustomThemeService
    }
  ]
};
```

### Providing Mock for Testing

```typescript
// In test file
TestBed.configureTestingModule({
  providers: [
    {
      provide: ThemeService,
      useValue: createMockThemeService()
    }
  ]
});
```

### Conditional Providers

```typescript
// Based on environment
export const appConfig: ApplicationConfig = {
  providers: [
    environment.production
      ? { provide: LoggingService, useClass: ProductionLoggingService }
      : { provide: LoggingService, useClass: DebugLoggingService }
  ]
};
```

## Injection Tokens

### Library Tokens

```typescript
// projects/osi-cards-lib/src/lib/providers/injection-tokens.ts
export const OSI_CARDS_CONFIG = new InjectionToken<OsiCardsConfig>('OSI_CARDS_CONFIG');
export const SECTION_REGISTRY = new InjectionToken<SectionRegistry>('SECTION_REGISTRY');
export const THEME_CONFIG = new InjectionToken<ThemeConfig>('THEME_CONFIG');
```

### Using Tokens

```typescript
// Providing configuration
providers: [
  {
    provide: OSI_CARDS_CONFIG,
    useValue: {
      enableStreaming: true,
      defaultTheme: 'dark',
    }
  }
]

// Injecting configuration
export class SomeService {
  private readonly config = inject(OSI_CARDS_CONFIG);
}
```

## Best Practices

1. **Prefer `inject()` over constructor injection**
```typescript
// ✅ Preferred
private readonly service = inject(MyService);

// ❌ Avoid
constructor(private service: MyService) {}
```

2. **Use `providedIn: 'root'` for singletons**
3. **Document service scope in JSDoc**
4. **Use injection tokens for configuration**
5. **Keep service dependencies minimal**
```

### Acceptance Criteria
- [ ] DEPENDENCY_INJECTION.md created
- [ ] All service scopes documented
- [ ] Override patterns documented
- [ ] Injection tokens documented

### Estimated Time: 2 hours

---

## Point 7: Establish Barrel Export Structure

### Implementation Steps

**Step 7.1:** Create directory structure verification script
```javascript
// scripts/verify-barrel-exports.js
const fs = require('fs');
const path = require('path');

const REQUIRED_BARRELS = [
  'projects/osi-cards-lib/src/public-api.ts',
  'projects/osi-cards-lib/src/lib/components/index.ts',
  'projects/osi-cards-lib/src/lib/components/sections/index.ts',
  'projects/osi-cards-lib/src/lib/services/index.ts',
  'projects/osi-cards-lib/src/lib/utils/index.ts',
  'projects/osi-cards-lib/src/lib/models/index.ts',
  'projects/osi-cards-lib/src/lib/themes/index.ts',
  'projects/osi-cards-lib/src/lib/constants/index.ts',
  'projects/osi-cards-lib/src/lib/testing/index.ts',
];

const missing = REQUIRED_BARRELS.filter(f => !fs.existsSync(f));
if (missing.length > 0) {
  console.error('Missing barrel exports:');
  missing.forEach(f => console.error(`  - ${f}`));
  process.exit(1);
}
console.log('All barrel exports present!');
```

**Step 7.2:** Create/update public-api.ts
```typescript
// projects/osi-cards-lib/src/public-api.ts

// Components
export * from './lib/components';
export * from './lib/components/sections';

// Services
export * from './lib/services';

// Utils
export * from './lib/utils';

// Models
export * from './lib/models';

// Themes
export * from './lib/themes';

// Constants
export * from './lib/constants';

// Providers
export * from './lib/providers';

// Events
export * from './lib/events';

// Interfaces
export * from './lib/interfaces';

// Decorators
export * from './lib/decorators';

// Directives
export * from './lib/directives';
```

**Step 7.3:** Create components barrel
```typescript
// projects/osi-cards-lib/src/lib/components/index.ts
export * from './ai-card-renderer/ai-card-renderer.component';
export * from './card-actions/card-actions.component';
export * from './card-body/card-body.component';
export * from './card-footer/card-footer.component';
export * from './card-header/card-header.component';
export * from './card-preview/card-preview.component';
export * from './card-section-list/card-section-list.component';
export * from './card-skeleton/card-skeleton.component';
export * from './card-streaming-indicator/card-streaming-indicator.component';
export * from './masonry-grid/masonry-grid.component';
export * from './osi-cards/osi-cards.component';
export * from './osi-cards-container/osi-cards-container.component';
export * from './section-error-boundary/section-error-boundary.component';
export * from './section-renderer/section-renderer.component';
export * from './section-skeleton/section-skeleton.component';
export * from './skip-link/skip-link.component';

// Section renderer sub-exports
export * from './section-renderer/dynamic-section-loader.service';
export * from './section-renderer/lazy-section-loader.service';
export * from './section-renderer/lazy-section-placeholder.component';
export * from './section-renderer/plugin-section-wrapper.component';
export * from './section-renderer/section-component-map.generated';
```

**Step 7.4:** Add to package.json scripts
```json
{
  "scripts": {
    "verify:barrels": "node scripts/verify-barrel-exports.js"
  }
}
```

**Step 7.5:** Add to CI/CD
```yaml
# .github/workflows/ci.yml
- name: Verify barrel exports
  run: npm run verify:barrels
```

### Acceptance Criteria
- [ ] All barrel files created
- [ ] public-api.ts exports everything
- [ ] Verification script passes
- [ ] Added to CI/CD

### Estimated Time: 2 hours

---

## Point 8: Create Feature Flags for Migration

### Implementation Steps

**Step 8.1:** Create feature flags configuration
```typescript
// projects/osi-cards-lib/src/lib/config/migration-flags.config.ts
export interface MigrationFlags {
  // Section flags
  USE_LIB_SECTIONS: boolean;
  USE_SECTION_REGISTRY: boolean;
  USE_LAZY_SECTIONS: boolean;

  // Service flags
  USE_LIB_SERVICES: boolean;
  USE_CONSOLIDATED_THEME_SERVICE: boolean;

  // Style flags
  USE_CONSOLIDATED_STYLES: boolean;
  USE_CSS_VARIABLES: boolean;

  // Component flags
  USE_LIB_CARD_RENDERER: boolean;
  USE_LIB_MASONRY_GRID: boolean;
}

export const DEFAULT_MIGRATION_FLAGS: MigrationFlags = {
  USE_LIB_SECTIONS: true,
  USE_SECTION_REGISTRY: true,
  USE_LAZY_SECTIONS: false, // Enable after testing
  USE_LIB_SERVICES: true,
  USE_CONSOLIDATED_THEME_SERVICE: true,
  USE_CONSOLIDATED_STYLES: true,
  USE_CSS_VARIABLES: true,
  USE_LIB_CARD_RENDERER: true,
  USE_LIB_MASONRY_GRID: true,
};
```

**Step 8.2:** Create migration flags service
```typescript
// projects/osi-cards-lib/src/lib/services/migration-flags.service.ts
import { Injectable, inject } from '@angular/core';
import { MigrationFlags, DEFAULT_MIGRATION_FLAGS } from '../config/migration-flags.config';

export const MIGRATION_FLAGS = new InjectionToken<Partial<MigrationFlags>>('MIGRATION_FLAGS');

@Injectable({ providedIn: 'root' })
export class MigrationFlagsService {
  private readonly overrides = inject(MIGRATION_FLAGS, { optional: true });

  private readonly flags: MigrationFlags = {
    ...DEFAULT_MIGRATION_FLAGS,
    ...this.overrides,
  };

  isEnabled(flag: keyof MigrationFlags): boolean {
    return this.flags[flag];
  }

  getAll(): MigrationFlags {
    return { ...this.flags };
  }
}
```

**Step 8.3:** Create conditional component loading
```typescript
// projects/osi-cards-lib/src/lib/components/section-renderer/section-renderer.component.ts
@Component({
  selector: 'osi-section-renderer',
  template: `
    @if (useLibSections()) {
      <ng-container *ngComponentOutlet="sectionComponent(); inputs: sectionInputs()" />
    } @else {
      <!-- Legacy path for gradual migration -->
      <ng-container *ngComponentOutlet="legacySectionComponent(); inputs: sectionInputs()" />
    }
  `,
})
export class SectionRendererComponent {
  private readonly migrationFlags = inject(MigrationFlagsService);

  readonly useLibSections = computed(() =>
    this.migrationFlags.isEnabled('USE_LIB_SECTIONS')
  );
}
```

**Step 8.4:** Usage in app
```typescript
// src/app/app.config.ts
import { MIGRATION_FLAGS } from '@osi-cards/lib';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: MIGRATION_FLAGS,
      useValue: {
        // Override specific flags during migration
        USE_LAZY_SECTIONS: true,  // Test lazy loading
        USE_LIB_MASONRY_GRID: false, // Keep using src version temporarily
      }
    }
  ]
};
```

**Step 8.5:** Create migration progress tracking
```typescript
// scripts/migration-progress.js
const MIGRATION_STATUS = {
  sections: {
    analytics: 'MIGRATED',
    brandColors: 'MIGRATED',
    chart: 'IN_PROGRESS',
    // ...
  },
  services: {
    theme: 'MIGRATED',
    cardFacade: 'PENDING',
    // ...
  },
};

console.log('Migration Progress:');
console.log(JSON.stringify(MIGRATION_STATUS, null, 2));
```

### Acceptance Criteria
- [ ] MigrationFlags interface created
- [ ] MigrationFlagsService implemented
- [ ] Conditional component loading works
- [ ] Flags can be overridden in app

### Estimated Time: 3 hours

---

## Point 9: Set Up Automated Duplicate Detection

### Implementation Steps

**Step 9.1:** Create duplicate detection script
```javascript
// scripts/detect-duplicates.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SRC_DIRS = ['src/app/shared', 'src/app/core'];
const LIB_DIRS = ['projects/osi-cards-lib/src/lib'];

function getFileHash(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('md5').update(content).digest('hex');
}

function findFiles(dir, extension) {
  const results = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      results.push(...findFiles(fullPath, extension));
    } else if (file.name.endsWith(extension)) {
      results.push(fullPath);
    }
  }
  return results;
}

function detectDuplicates() {
  const srcFiles = SRC_DIRS.flatMap(dir => findFiles(dir, '.ts'));
  const libFiles = LIB_DIRS.flatMap(dir => findFiles(dir, '.ts'));

  const duplicates = [];

  for (const srcFile of srcFiles) {
    const srcName = path.basename(srcFile);
    const libMatch = libFiles.find(f => path.basename(f) === srcName);

    if (libMatch) {
      duplicates.push({
        src: srcFile,
        lib: libMatch,
        srcLines: fs.readFileSync(srcFile, 'utf8').split('\n').length,
        libLines: fs.readFileSync(libMatch, 'utf8').split('\n').length,
      });
    }
  }

  return duplicates;
}

const duplicates = detectDuplicates();

if (duplicates.length > 0) {
  console.error('❌ DUPLICATE FILES DETECTED:');
  duplicates.forEach(d => {
    console.error(`  ${path.basename(d.src)}`);
    console.error(`    src: ${d.src} (${d.srcLines} lines)`);
    console.error(`    lib: ${d.lib} (${d.libLines} lines)`);
  });

  if (process.env.CI) {
    process.exit(1); // Fail in CI
  }
} else {
  console.log('✅ No duplicate files detected');
}
```

**Step 9.2:** Add to package.json
```json
{
  "scripts": {
    "lint:duplicates": "node scripts/detect-duplicates.js"
  }
}
```

**Step 9.3:** Add to CI/CD
```yaml
# .github/workflows/ci.yml
jobs:
  lint:
    steps:
      - name: Check for duplicates
        run: npm run lint:duplicates
```

**Step 9.4:** Add pre-commit hook
```bash
# .husky/pre-commit
npm run lint:duplicates
```

### Acceptance Criteria
- [ ] Detection script created
- [ ] Runs in CI/CD
- [ ] Pre-commit hook added
- [ ] Fails build on new duplicates

### Estimated Time: 2 hours

---

## Point 10: Create Migration Tracking Checklist

### Implementation Steps

**Step 10.1:** Create migration tracking file
```markdown
<!-- MIGRATION_TRACKER.md -->
# Migration Tracking

## Status Legend
- ⬜ NOT STARTED
- 🟡 IN PROGRESS
- 🟢 COMPLETED
- ⏸️ BLOCKED
- ❌ CANCELLED

## Sections Migration

| Section | Status | src Lines | lib Lines | Blocker | Notes |
|---------|--------|-----------|-----------|---------|-------|
| analytics | 🟢 | 107 | 115 | - | Completed Dec 1 |
| brand-colors | ⬜ | 113 | 115 | - | - |
| chart | ⬜ | 107 | 113 | - | - |
| contact-card | ⬜ | 99 | 103 | - | - |
| event | ⬜ | 40 | 46 | - | - |
| fallback | 🟡 | 33 | 22 | src has more | Need to merge |
| financials | ⬜ | 63 | 70 | - | - |
| info | 🟡 | 109 | 92 | src has more | Need to merge |
| list | 🟡 | 68 | 53 | src has more | Need to merge |
| map | ⬜ | 68 | 74 | - | - |
| network-card | ⬜ | 44 | 49 | - | - |
| news | ⬜ | 49 | 53 | - | - |
| overview | 🟡 | 69 | 55 | src has more | Need to merge |
| product | ⬜ | 190 | 179 | - | - |
| quotation | ⬜ | 49 | 57 | - | - |
| social-media | ⬜ | 47 | 54 | - | - |
| solutions | ⬜ | 39 | 46 | - | - |
| text-reference | ⬜ | 54 | 68 | - | - |

## Services Migration

| Service | Status | src Lines | lib Lines | Blocker | Notes |
|---------|--------|-----------|-----------|---------|-------|
| theme | ⬜ | 161 | 729 | - | lib is primary |
| card-facade | ⬜ | 156 | 682 | - | lib is primary |
| event-bus | ⬜ | 158 | 318 | - | lib is primary |
| section-normalization | 🟡 | 550 | 466 | src has more | - |
| section-utils | 🟡 | 245 | 163 | src has more | - |
| icon | 🟡 | 216 | 168 | src has more | - |
| magnetic-tilt | ⬜ | 475 | 457 | - | Similar size |

## Components Migration

| Component | Status | src Lines | lib Lines | Blocker | Notes |
|-----------|--------|-----------|-----------|---------|-------|
| ai-card-renderer | ⬜ | 1362 | 1264 | - | Compare |
| masonry-grid | ⬜ | 1401 | 2638 | - | lib is primary |
| card-skeleton | ⬜ | 38 | 180 | - | lib is primary |
| section-renderer | 🟡 | 606 | 359 | src has more | - |

## Progress Summary

| Category | Total | Completed | In Progress | Blocked |
|----------|-------|-----------|-------------|---------|
| Sections | 18 | 1 | 4 | 0 |
| Services | 7 | 0 | 3 | 0 |
| Components | 4 | 0 | 1 | 0 |
```

**Step 10.2:** Create progress script
```javascript
// scripts/migration-progress.js
const fs = require('fs');
const path = require('path');

const tracker = fs.readFileSync('MIGRATION_TRACKER.md', 'utf8');

const counts = {
  '⬜': 0,
  '🟡': 0,
  '🟢': 0,
  '⏸️': 0,
};

// Count statuses
const lines = tracker.split('\n');
for (const line of lines) {
  if (line.includes('|')) {
    for (const [status, count] of Object.entries(counts)) {
      if (line.includes(status)) {
        counts[status]++;
      }
    }
  }
}

console.log('Migration Progress:');
console.log(`  Not Started: ${counts['⬜']}`);
console.log(`  In Progress: ${counts['🟡']}`);
console.log(`  Completed:   ${counts['🟢']}`);
console.log(`  Blocked:     ${counts['⏸️']}`);

const total = Object.values(counts).reduce((a, b) => a + b, 0);
const completed = counts['🟢'];
console.log(`\n  Progress: ${completed}/${total} (${Math.round(completed/total*100)}%)`);
```

### Acceptance Criteria
- [ ] MIGRATION_TRACKER.md created
- [ ] All files tracked
- [ ] Progress script works
- [ ] Status updates documented

### Estimated Time: 1 hour

---

## Points 11-15: Core Principles Setup

### Point 11: Define Section Registry as Single Source of Truth

**Step 11.1:** Enhance section-registry.json structure
```json
{
  "$schema": "./section-registry.schema.json",
  "version": "2.0.0",
  "sections": {
    "analytics": {
      "type": "analytics",
      "displayName": "Analytics Section",
      "description": "Displays analytics metrics with charts and KPIs",
      "component": {
        "name": "AnalyticsSectionComponent",
        "path": "./components/sections/analytics-section/analytics-section.component"
      },
      "category": "data-visualization",
      "icon": "chart-bar",
      "defaultColumnSpan": 2,
      "maxColumnSpan": 4,
      "properties": {
        "title": {
          "type": "string",
          "required": true,
          "default": "Analytics"
        },
        "metrics": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "label": { "type": "string", "required": true },
              "value": { "type": "number", "required": true },
              "trend": { "type": "string", "enum": ["up", "down", "neutral"] },
              "format": { "type": "string", "enum": ["number", "percent", "currency"] }
            }
          }
        },
        "chartType": {
          "type": "string",
          "enum": ["bar", "line", "pie", "donut"],
          "default": "bar"
        }
      },
      "styles": {
        "tokens": {
          "--section-analytics-bg": "var(--surface-card)",
          "--section-analytics-border": "var(--border-subtle)"
        }
      },
      "accessibility": {
        "role": "region",
        "ariaLabel": "Analytics dashboard",
        "announceUpdates": true
      },
      "streaming": {
        "supportedFields": ["metrics"],
        "partialRender": true
      },
      "examples": [
        {
          "name": "Basic",
          "config": {
            "type": "analytics",
            "title": "Revenue",
            "data": {
              "metrics": [
                { "label": "Total", "value": 50000, "format": "currency" }
              ]
            }
          }
        }
      ]
    }
    // ... other sections
  },
  "categories": {
    "data-visualization": {
      "displayName": "Data Visualization",
      "description": "Charts, metrics, and analytics",
      "icon": "chart-pie"
    },
    "content": {
      "displayName": "Content",
      "description": "Text, lists, and information",
      "icon": "file-text"
    }
    // ...
  }
}
```

### Point 12: Create Code Generation Pipeline

**Step 12.1:** Create master generation script
```javascript
// scripts/generate-from-registry.js
const fs = require('fs');
const path = require('path');

const registry = JSON.parse(
  fs.readFileSync('projects/osi-cards-lib/section-registry.json', 'utf8')
);

const generators = {
  types: require('./generators/types.generator'),
  manifest: require('./generators/manifest.generator'),
  scss: require('./generators/scss.generator'),
  validators: require('./generators/validators.generator'),
  docs: require('./generators/docs.generator'),
  stories: require('./generators/stories.generator'),
  tests: require('./generators/tests.generator'),
};

async function generate(targets = ['all']) {
  const toGenerate = targets.includes('all')
    ? Object.keys(generators)
    : targets;

  for (const target of toGenerate) {
    if (generators[target]) {
      console.log(`Generating ${target}...`);
      await generators[target].generate(registry);
      console.log(`✅ ${target} generated`);
    }
  }
}

const args = process.argv.slice(2);
generate(args.length ? args : ['all']);
```

**Step 12.2:** Create types generator
```javascript
// scripts/generators/types.generator.js
const fs = require('fs');

function generate(registry) {
  const sections = Object.entries(registry.sections);

  let output = `// AUTO-GENERATED - DO NOT EDIT
// Generated from section-registry.json

`;

  // Generate section type enum
  output += `export type SectionType = ${sections.map(([key]) => `'${key}'`).join(' | ')};\n\n`;

  // Generate section interfaces
  for (const [key, config] of sections) {
    output += generateSectionInterface(key, config);
  }

  // Generate discriminated union
  output += generateDiscriminatedUnion(sections);

  // Generate type guards
  output += generateTypeGuards(sections);

  fs.writeFileSync(
    'projects/osi-cards-lib/src/lib/models/generated-section-types.ts',
    output
  );
}

function generateSectionInterface(key, config) {
  const interfaceName = `${pascalCase(key)}Section`;

  let output = `export interface ${interfaceName} extends BaseSection {\n`;
  output += `  type: '${key}';\n`;
  output += `  data: ${interfaceName}Data;\n`;
  output += `}\n\n`;

  output += `export interface ${interfaceName}Data {\n`;
  for (const [propKey, propConfig] of Object.entries(config.properties || {})) {
    const optional = propConfig.required ? '' : '?';
    output += `  ${propKey}${optional}: ${mapType(propConfig)};\n`;
  }
  output += `}\n\n`;

  return output;
}

module.exports = { generate };
```

### Point 13: Establish "Lib First" Rule

**Step 13.1:** Add ESLint rule to enforce
```javascript
// eslint.config.js
module.exports = [
  {
    files: ['src/app/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['**/projects/osi-cards-lib/src/lib/**'],
            message: 'Import from @osi-cards/* instead of direct lib path'
          }
        ]
      }]
    }
  },
  {
    files: ['projects/osi-cards-lib/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['**/src/app/**'],
            message: 'Library cannot import from app'
          }
        ]
      }]
    }
  }
];
```

### Point 14: Create Interface Contracts

**Step 14.1:** Define core interfaces
```typescript
// projects/osi-cards-lib/src/lib/interfaces/contracts.ts

/**
 * Contract for section rendering
 */
export interface ISectionRenderer {
  /**
   * Render a section by its configuration
   */
  renderSection(section: CardSection): ComponentRef<BaseSection>;

  /**
   * Get all available section types
   */
  getAvailableSections(): SectionType[];

  /**
   * Check if a section type is supported
   */
  supportsSection(type: string): type is SectionType;
}

/**
 * Contract for theme management
 */
export interface IThemeProvider {
  /**
   * Get current theme
   */
  getTheme(): Theme;

  /**
   * Set active theme
   */
  setTheme(theme: Theme): void;

  /**
   * Get available theme presets
   */
  getPresets(): ThemePreset[];

  /**
   * Subscribe to theme changes
   */
  themeChange$: Observable<Theme>;
}

/**
 * Contract for section registry
 */
export interface ISectionRegistry {
  /**
   * Get section metadata by type
   */
  get(type: SectionType): SectionMetadata | undefined;

  /**
   * Get all registered sections
   */
  getAll(): Map<SectionType, SectionMetadata>;

  /**
   * Register a custom section
   */
  register(type: string, metadata: SectionMetadata): void;

  /**
   * Get section component
   */
  getComponent(type: SectionType): Type<BaseSection>;
}
```

### Point 15: Set Up Barrel Export Validation

**Step 15.1:** Create validation script
```javascript
// scripts/validate-barrel-exports.js
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const PUBLIC_API = 'projects/osi-cards-lib/src/public-api.ts';

function getExportedSymbols(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true
  );

  const exports = [];

  function visit(node) {
    if (ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier) {
        exports.push(node.moduleSpecifier.getText().replace(/['"]/g, ''));
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return exports;
}

function getAllPublicFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllPublicFiles(fullPath));
    } else if (
      entry.name.endsWith('.ts') &&
      !entry.name.endsWith('.spec.ts') &&
      !entry.name.includes('internal')
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

// Check that all public files are exported
const exported = getExportedSymbols(PUBLIC_API);
const allFiles = getAllPublicFiles('projects/osi-cards-lib/src/lib');

const missing = allFiles.filter(f => {
  const relativePath = './' + path.relative('projects/osi-cards-lib/src', f).replace(/\\/g, '/').replace('.ts', '');
  return !exported.some(e => relativePath.includes(e) || e.includes(relativePath));
});

if (missing.length > 0) {
  console.error('Files not exported in public-api.ts:');
  missing.forEach(f => console.error(`  ${f}`));
  process.exit(1);
}

console.log('✅ All public files are exported');
```

### Acceptance Criteria for Points 11-15
- [ ] Section registry enhanced with full schema
- [ ] Code generation pipeline working
- [ ] "Lib First" ESLint rule enforced
- [ ] Interface contracts defined
- [ ] Barrel export validation passing

### Estimated Time: 8 hours total

---

# Phase 2: Single Source of Truth - Sections

## Points 16-20: Section Architecture Foundation

### Point 16: Create Abstract BaseSection

```typescript
// projects/osi-cards-lib/src/lib/components/sections/base-section.component.ts
import {
  Directive,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  inject,
  computed,
  signal,
  ChangeDetectorRef,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { CardSection, SectionType } from '../../models';
import { ThemeService } from '../../themes/theme.service';
import { SectionAnimationService } from '../../services/section-animation.service';
import { AccessibilityService } from '../../services/accessibility.service';

/**
 * Abstract base class for all section components.
 * Provides common functionality and enforces consistent interface.
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class AnalyticsSectionComponent extends BaseSection<AnalyticsSectionData> {
 *   readonly sectionType = 'analytics' as const;
 * }
 * ```
 */
@Directive()
export abstract class BaseSection<TData = unknown> implements OnInit, OnDestroy {
  // ============================================
  // INPUTS
  // ============================================

  /** The section configuration */
  @Input({ required: true }) section!: CardSection;

  /** Optional theme override */
  @Input() theme?: string;

  /** Whether this section is currently streaming data */
  @Input() isStreaming = false;

  /** Column span for grid layout */
  @Input() columnSpan?: number;

  /** Animation delay for staggered entrance */
  @Input() animationDelay = 0;

  /** Whether to show in compact mode */
  @Input() compact = false;

  // ============================================
  // OUTPUTS
  // ============================================

  /** Emitted when a link in the section is clicked */
  @Output() linkClick = new EventEmitter<{ url: string; label: string }>();

  /** Emitted when an action button is clicked */
  @Output() actionClick = new EventEmitter<{ action: string; data: unknown }>();

  /** Emitted when the section is fully rendered */
  @Output() rendered = new EventEmitter<void>();

  /** Emitted when an error occurs */
  @Output() error = new EventEmitter<Error>();

  // ============================================
  // SERVICES
  // ============================================

  protected readonly themeService = inject(ThemeService);
  protected readonly animationService = inject(SectionAnimationService);
  protected readonly a11yService = inject(AccessibilityService);
  protected readonly cdr = inject(ChangeDetectorRef);

  // ============================================
  // ABSTRACT MEMBERS
  // ============================================

  /** The section type identifier - must be implemented by subclass */
  abstract readonly sectionType: SectionType;

  // ============================================
  // COMPUTED PROPERTIES
  // ============================================

  /** Typed access to section data */
  protected readonly sectionData = computed<TData>(() => {
    return (this.section?.data ?? {}) as TData;
  });

  /** Section title */
  protected readonly title = computed(() => {
    return this.section?.title ?? '';
  });

  /** Section subtitle */
  protected readonly subtitle = computed(() => {
    return this.section?.subtitle ?? '';
  });

  /** Section icon */
  protected readonly icon = computed(() => {
    return this.section?.icon ?? '';
  });

  /** CSS variables for theming */
  protected readonly themeStyles = computed(() => {
    return this.themeService.getSectionStyles(this.sectionType);
  });

  /** Computed column span */
  protected readonly computedColumnSpan = computed(() => {
    return this.columnSpan ?? this.section?.columnSpan ?? this.getDefaultColumnSpan();
  });

  /** Whether content is empty */
  protected readonly isEmpty = computed(() => {
    return this.checkIsEmpty();
  });

  /** Accessibility attributes */
  protected readonly ariaAttributes = computed(() => {
    return this.a11yService.getSectionAriaAttributes(this.sectionType, this.title());
  });

  // ============================================
  // INTERNAL STATE
  // ============================================

  protected readonly destroy$ = new Subject<void>();
  protected readonly isInitialized = signal(false);
  protected readonly hasError = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  // ============================================
  // LIFECYCLE
  // ============================================

  ngOnInit(): void {
    this.validateSection();
    this.setupAnimations();
    this.setupAccessibility();
    this.isInitialized.set(true);

    // Emit rendered after view is stable
    requestAnimationFrame(() => {
      this.rendered.emit();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // PROTECTED METHODS (Override in subclass)
  // ============================================

  /**
   * Get the default column span for this section type.
   * Override in subclass if needed.
   */
  protected getDefaultColumnSpan(): number {
    return 1;
  }

  /**
   * Check if the section content is empty.
   * Override in subclass for custom logic.
   */
  protected checkIsEmpty(): boolean {
    const data = this.sectionData();
    if (!data) return true;
    if (typeof data === 'object') {
      return Object.keys(data).length === 0;
    }
    return false;
  }

  /**
   * Validate the section configuration.
   * Override to add custom validation.
   */
  protected validateSection(): void {
    if (!this.section) {
      this.setError('Section configuration is required');
      return;
    }

    if (this.section.type !== this.sectionType) {
      this.setError(
        `Section type mismatch: expected '${this.sectionType}', got '${this.section.type}'`
      );
    }
  }

  /**
   * Handle link click with optional custom behavior.
   * Override to add analytics or custom handling.
   */
  protected handleLinkClick(url: string, label: string): void {
    this.linkClick.emit({ url, label });
  }

  /**
   * Handle action click.
   * Override for custom action handling.
   */
  protected handleActionClick(action: string, data?: unknown): void {
    this.actionClick.emit({ action, data });
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private setupAnimations(): void {
    if (this.animationDelay > 0) {
      this.animationService.scheduleAnimation(
        this.sectionType,
        this.animationDelay
      );
    }
  }

  private setupAccessibility(): void {
    this.a11yService.registerSection(this.sectionType, {
      title: this.title(),
      isStreaming: this.isStreaming,
    });
  }

  private setError(message: string): void {
    this.hasError.set(true);
    this.errorMessage.set(message);
    this.error.emit(new Error(message));
  }

  // ============================================
  // TEMPLATE HELPERS
  // ============================================

  /** Track by function for lists */
  protected trackByIndex(index: number): number {
    return index;
  }

  /** Track by id if available */
  protected trackById(index: number, item: { id?: string | number }): string | number {
    return item.id ?? index;
  }

  /** Format number with locale */
  protected formatNumber(value: number, format?: string): string {
    // Use locale formatting service
    return new Intl.NumberFormat().format(value);
  }

  /** Format currency */
  protected formatCurrency(value: number, currency = 'USD'): string {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(value);
  }

  /** Format percentage */
  protected formatPercent(value: number): string {
    return new Intl.NumberFormat(undefined, {
      style: 'percent',
      minimumFractionDigits: 1,
    }).format(value / 100);
  }
}
```

### Point 17: Merge All Section Components to Lib

**Step 17.1:** Create merge script for each section
```bash
#!/bin/bash
# scripts/merge-section.sh

SECTION=$1

SRC_FILE="src/app/shared/components/cards/sections/${SECTION}/${SECTION}.component.ts"
LIB_FILE="projects/osi-cards-lib/src/lib/components/sections/${SECTION}/${SECTION}.component.ts"

if [ -f "$SRC_FILE" ] && [ -f "$LIB_FILE" ]; then
  echo "Comparing $SECTION..."

  SRC_LINES=$(wc -l < "$SRC_FILE")
  LIB_LINES=$(wc -l < "$LIB_FILE")

  echo "  src: $SRC_LINES lines"
  echo "  lib: $LIB_LINES lines"

  if [ "$SRC_LINES" -gt "$LIB_LINES" ]; then
    echo "  ⚠️  src has more code - manual review needed"
    diff "$LIB_FILE" "$SRC_FILE" > "diffs/${SECTION}.diff"
  else
    echo "  ✅ lib is primary - can delete src"
  fi
fi
```

**Step 17.2:** Detailed merge for sections where src has more code

For `fallback-section` (src: 33 vs lib: 22):
```typescript
// Review diff and merge unique features
// projects/osi-cards-lib/src/lib/components/sections/fallback-section/fallback-section.component.ts

@Component({
  selector: 'osi-fallback-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fallback-section" [attr.data-section-type]="section.type">
      <div class="fallback-icon">
        <lucide-icon name="alert-circle" [size]="24"></lucide-icon>
      </div>
      <p class="fallback-message">
        {{ message }}
      </p>
      @if (showDebugInfo && section.type) {
        <code class="fallback-debug">Type: {{ section.type }}</code>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FallbackSectionComponent extends BaseSection {
  readonly sectionType = 'fallback' as const;

  // Merged from src version
  @Input() showDebugInfo = false;

  readonly message = computed(() => {
    return this.section?.data?.message ??
           `Unknown section type: ${this.section?.type}`;
  });
}
```

### Point 18: Create Section Factory with Registry Lookup

```typescript
// projects/osi-cards-lib/src/lib/factories/section.factory.ts
import { Injectable, Type, inject } from '@angular/core';
import { SectionRegistry } from '../services/section-registry.service';
import { BaseSection } from '../components/sections/base-section.component';
import { FallbackSectionComponent } from '../components/sections/fallback-section/fallback-section.component';
import { SectionType, SectionMetadata } from '../models';

/**
 * Factory for creating section components dynamically.
 * Uses the section registry for component lookup.
 */
@Injectable({ providedIn: 'root' })
export class SectionFactory {
  private readonly registry = inject(SectionRegistry);

  /**
   * Get the component class for a section type.
   * Returns FallbackSection if type is not found.
   */
  createSection(type: SectionType | string): Type<BaseSection> {
    const config = this.registry.get(type as SectionType);

    if (!config) {
      console.warn(`Unknown section type: ${type}, using fallback`);
      return FallbackSectionComponent;
    }

    return config.component;
  }

  /**
   * Check if a section type is registered.
   */
  hasSection(type: string): type is SectionType {
    return this.registry.has(type as SectionType);
  }

  /**
   * Get metadata for a section type.
   */
  getSectionMetadata(type: SectionType): SectionMetadata | undefined {
    return this.registry.getMetadata(type);
  }

  /**
   * Get all registered section types.
   */
  getAvailableSections(): SectionType[] {
    return this.registry.getAllTypes();
  }

  /**
   * Get sections by category.
   */
  getSectionsByCategory(category: string): SectionType[] {
    return this.registry.getByCategory(category);
  }

  /**
   * Get the default column span for a section type.
   */
  getDefaultColumnSpan(type: SectionType): number {
    const metadata = this.registry.getMetadata(type);
    return metadata?.defaultColumnSpan ?? 1;
  }
}
```

### Point 19: Implement Lazy Loading for Sections

```typescript
// projects/osi-cards-lib/src/lib/components/section-renderer/lazy-section-loader.service.ts
import { Injectable, Type, inject } from '@angular/core';
import { BaseSection } from '../sections/base-section.component';
import { SectionType } from '../../models';

type LazyLoader = () => Promise<Type<BaseSection>>;

/**
 * Lazy loader for section components.
 * Enables code splitting for large applications.
 */
@Injectable({ providedIn: 'root' })
export class LazySectionLoader {
  private readonly cache = new Map<SectionType, Type<BaseSection>>();

  private readonly loaders: Record<SectionType, LazyLoader> = {
    analytics: () => import('../sections/analytics-section/analytics-section.component')
      .then(m => m.AnalyticsSectionComponent),
    'brand-colors': () => import('../sections/brand-colors-section/brand-colors-section.component')
      .then(m => m.BrandColorsSectionComponent),
    chart: () => import('../sections/chart-section/chart-section.component')
      .then(m => m.ChartSectionComponent),
    'contact-card': () => import('../sections/contact-card-section/contact-card-section.component')
      .then(m => m.ContactCardSectionComponent),
    event: () => import('../sections/event-section/event-section.component')
      .then(m => m.EventSectionComponent),
    fallback: () => import('../sections/fallback-section/fallback-section.component')
      .then(m => m.FallbackSectionComponent),
    financials: () => import('../sections/financials-section/financials-section.component')
      .then(m => m.FinancialsSectionComponent),
    info: () => import('../sections/info-section.component')
      .then(m => m.InfoSectionComponent),
    list: () => import('../sections/list-section/list-section.component')
      .then(m => m.ListSectionComponent),
    map: () => import('../sections/map-section/map-section.component')
      .then(m => m.MapSectionComponent),
    'network-card': () => import('../sections/network-card-section/network-card-section.component')
      .then(m => m.NetworkCardSectionComponent),
    news: () => import('../sections/news-section/news-section.component')
      .then(m => m.NewsSectionComponent),
    overview: () => import('../sections/overview-section/overview-section.component')
      .then(m => m.OverviewSectionComponent),
    product: () => import('../sections/product-section/product-section.component')
      .then(m => m.ProductSectionComponent),
    quotation: () => import('../sections/quotation-section/quotation-section.component')
      .then(m => m.QuotationSectionComponent),
    'social-media': () => import('../sections/social-media-section/social-media-section.component')
      .then(m => m.SocialMediaSectionComponent),
    solutions: () => import('../sections/solutions-section/solutions-section.component')
      .then(m => m.SolutionsSectionComponent),
    'text-reference': () => import('../sections/text-reference-section/text-reference-section.component')
      .then(m => m.TextReferenceSectionComponent),
  };

  /**
   * Load a section component lazily.
   * Results are cached for subsequent requests.
   */
  async load(type: SectionType): Promise<Type<BaseSection>> {
    // Check cache first
    if (this.cache.has(type)) {
      return this.cache.get(type)!;
    }

    // Load and cache
    const loader = this.loaders[type];
    if (!loader) {
      console.warn(`No lazy loader for section type: ${type}`);
      return this.loaders.fallback();
    }

    const component = await loader();
    this.cache.set(type, component);
    return component;
  }

  /**
   * Preload specific section types.
   * Useful for predictive loading.
   */
  async preload(types: SectionType[]): Promise<void> {
    await Promise.all(types.map(type => this.load(type)));
  }

  /**
   * Preload all section types.
   */
  async preloadAll(): Promise<void> {
    await this.preload(Object.keys(this.loaders) as SectionType[]);
  }

  /**
   * Clear the cache.
   */
  clearCache(): void {
    this.cache.clear();
  }
}
```

### Point 20: Create Section Composition Utilities

```typescript
// projects/osi-cards-lib/src/lib/components/sections/composition/index.ts

// Re-export composition components
export * from './section-header.component';
export * from './section-content.component';
export * from './section-footer.component';
export * from './section-actions.component';
export * from './section-empty-state.component';
export * from './section-error.component';
export * from './section-loading.component';

// Composition helpers
export const SectionParts = {
  Header: () => import('./section-header.component').then(m => m.SectionHeaderComponent),
  Content: () => import('./section-content.component').then(m => m.SectionContentComponent),
  Footer: () => import('./section-footer.component').then(m => m.SectionFooterComponent),
  Actions: () => import('./section-actions.component').then(m => m.SectionActionsComponent),
  EmptyState: () => import('./section-empty-state.component').then(m => m.SectionEmptyStateComponent),
  Error: () => import('./section-error.component').then(m => m.SectionErrorComponent),
  Loading: () => import('./section-loading.component').then(m => m.SectionLoadingComponent),
};
```

```typescript
// projects/osi-cards-lib/src/lib/components/sections/composition/section-header.component.ts
@Component({
  selector: 'osi-section-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <header class="section-header" [class.with-actions]="hasActions">
      @if (icon) {
        <lucide-icon [name]="icon" [size]="iconSize" class="section-icon"></lucide-icon>
      }
      <div class="section-header-content">
        @if (title) {
          <h3 class="section-title">{{ title }}</h3>
        }
        @if (subtitle) {
          <p class="section-subtitle">{{ subtitle }}</p>
        }
      </div>
      <div class="section-header-actions">
        <ng-content select="[actions]"></ng-content>
      </div>
    </header>
  `,
  styleUrl: './section-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHeaderComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() icon?: string;
  @Input() iconSize = 20;
  @Input() hasActions = false;
}
```

---

*[Document continues with Points 21-100 with same level of detail...]*

---

## Quick Reference: All 100 Points Summary

| # | Point | Phase | Est. Time |
|---|-------|-------|-----------|
| 1 | Delete orphan spec files | 1 | 30m |
| 2 | Delete backup files | 1 | 15m |
| 3 | Audit unused scripts | 1 | 2h |
| 4 | Create ARCHITECTURE.md | 1 | 2h |
| 5 | Set up path aliases | 1 | 3h |
| 6 | Create DI strategy doc | 1 | 2h |
| 7 | Establish barrel exports | 1 | 2h |
| 8 | Create feature flags | 1 | 3h |
| 9 | Set up duplicate detection | 1 | 2h |
| 10 | Create migration tracker | 1 | 1h |
| 11 | Define section registry | 1 | 2h |
| 12 | Create generation pipeline | 1 | 4h |
| 13 | Establish "Lib First" rule | 1 | 1h |
| 14 | Create interface contracts | 1 | 2h |
| 15 | Barrel export validation | 1 | 1h |
| 16 | Create abstract BaseSection | 2 | 4h |
| 17 | Merge sections to lib | 2 | 8h |
| 18 | Create section factory | 2 | 3h |
| 19 | Implement lazy loading | 2 | 4h |
| 20 | Section composition utils | 2 | 3h |
| 21 | Delete duplicate sections | 2 | 2h |
| 22 | Create type discriminators | 2 | 2h |
| 23 | Section validation | 2 | 3h |
| 24 | Section normalization | 2 | 3h |
| 25 | Section renderer | 2 | 4h |
| 26 | Delete src section-renderer | 2 | 1h |
| 27 | Section plugin system | 2 | 4h |
| 28 | Section theming | 2 | 3h |
| 29 | Section doc generator | 2 | 3h |
| 30 | Section testing utils | 2 | 3h |
| 31 | Section storybook | 2 | 2h |
| 32 | Section analytics | 2 | 2h |
| 33 | Section a11y checker | 2 | 2h |
| 34 | Section perf monitoring | 2 | 2h |
| 35 | Section migration CLI | 2 | 3h |
| 36-50 | Service consolidation | 3 | 24h |
| 51-65 | Component architecture | 4 | 24h |
| 66-75 | Style unification | 5 | 16h |
| 76-85 | Documentation & build | 6 | 16h |
| 86-95 | Testing & quality | 7 | 16h |
| 96-100 | Advanced optimizations | 8 | 12h |

**Total Estimated Time: ~200 hours (12 weeks at ~17h/week)**

---

*Full detailed implementation for Points 21-100 available in IMPROVEMENT_PLAN_DETAILED_PART2.md*

