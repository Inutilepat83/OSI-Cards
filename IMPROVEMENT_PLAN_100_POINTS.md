# OSI-Cards 100-Point Improvement Plan

**Goal:** Consolidate, modularize, and establish single source of truth while keeping all functionalities
**Principles:** Modularity | Reusability | Smart Logic | DRY (Don't Repeat Yourself)
**Date:** December 1, 2025

---

## Table of Contents

1. [Phase 1: Foundation & Cleanup](#phase-1-foundation--cleanup-points-1-15)
2. [Phase 2: Single Source of Truth - Sections](#phase-2-single-source-of-truth---sections-points-16-35)
3. [Phase 3: Service Consolidation](#phase-3-service-consolidation-points-36-50)
4. [Phase 4: Component Architecture](#phase-4-component-architecture-points-51-65)
5. [Phase 5: Style System Unification](#phase-5-style-system-unification-points-66-75)
6. [Phase 6: Documentation & Build](#phase-6-documentation--build-points-76-85)
7. [Phase 7: Testing & Quality](#phase-7-testing--quality-points-86-95)
8. [Phase 8: Advanced Optimizations](#phase-8-advanced-optimizations-points-96-100)

---

## Phase 1: Foundation & Cleanup (Points 1-15)

### Immediate Cleanup

**1. Delete orphan spec files**
```bash
# Files with no corresponding source
rm src/app/core/services/icon.service.spec.ts
rm src/app/features/home/components/home-page/home-page.llm-preview.spec.ts
rm src/app/shared/services/magnetic-tilt.service.spec.ts
rm src/app/testing/components/single-card.component.spec.ts
rm src/app/testing/effects/cards.effects.spec.ts
```

**2. Delete backup/legacy files**
```bash
rm projects/osi-cards-lib/src/lib/optional/ng-package.json.bak
```

**3. Audit unused scripts - document or remove**
- Review each of the 10 unused scripts
- Either add to package.json with documentation OR delete
- Scripts to review: `audit-tokens.js`, `build-standalone-css.js`, `detect-version-bump.js`, `generate-ngdoc-pages.js`, `generate-ngdoc-routes.js`, `regenerate-all-doc-pages.js`, `regenerate-doc-pages.js`, `sync-registry.js`, `verify-exports.js`, `version-manager.js`

**4. Create `ARCHITECTURE.md` documenting the consolidation strategy**
- Define library vs app responsibilities
- Document the "single source of truth" principle
- Create decision tree for "where does this code belong?"

**5. Set up path aliases for clean imports**
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@osi-cards/lib": ["projects/osi-cards-lib/src/public-api.ts"],
      "@osi-cards/sections": ["projects/osi-cards-lib/src/lib/components/sections/index.ts"],
      "@osi-cards/services": ["projects/osi-cards-lib/src/lib/services/index.ts"],
      "@osi-cards/utils": ["projects/osi-cards-lib/src/lib/utils/index.ts"],
      "@osi-cards/models": ["projects/osi-cards-lib/src/lib/models/index.ts"],
      "@osi-cards/themes": ["projects/osi-cards-lib/src/lib/themes/index.ts"]
    }
  }
}
```

**6. Create a dependency injection strategy document**
- Define which services are provided at root
- Define which services are scoped to components
- Document override patterns for app-specific needs

**7. Establish barrel export structure**
```
projects/osi-cards-lib/src/
├── public-api.ts                    # Main entry point
├── lib/
│   ├── components/
│   │   ├── index.ts                 # All components
│   │   └── sections/
│   │       └── index.ts             # All sections
│   ├── services/
│   │   └── index.ts                 # All services
│   ├── utils/
│   │   └── index.ts                 # All utilities
│   ├── models/
│   │   └── index.ts                 # All models/interfaces
│   └── themes/
│       └── index.ts                 # All theming
```

**8. Create feature flags for migration**
```typescript
// feature-flags.config.ts
export const MIGRATION_FLAGS = {
  USE_LIB_SECTIONS: true,           // Toggle to use lib sections
  USE_LIB_SERVICES: true,           // Toggle to use lib services
  USE_CONSOLIDATED_STYLES: true,    // Toggle for unified styles
  ENABLE_SECTION_REGISTRY: true,    // Use registry-based sections
};
```

**9. Set up automated duplicate detection**
- Add script to detect new duplicates in CI/CD
- Fail build if duplicate patterns are introduced

**10. Create migration tracking spreadsheet/checklist**
- Track each file's migration status
- Document blockers and dependencies

### Establish Core Principles

**11. Define the Section Registry as single source of truth**
```typescript
// section-registry.json becomes the MASTER definition
// All section types, properties, defaults derive from here
{
  "sections": {
    "analytics": {
      "component": "AnalyticsSectionComponent",
      "category": "data-visualization",
      "defaultColumnSpan": 2,
      "properties": {...},
      "validations": {...}
    }
  }
}
```

**12. Create code generation pipeline from registry**
```
section-registry.json
    ↓
generate-from-registry.js
    ↓
├── section-manifest.generated.ts      # Component mappings
├── section-types.generated.ts         # TypeScript types
├── section-tokens.generated.scss      # SCSS tokens
├── section-validators.generated.ts    # Validation logic
└── section-docs.generated.md          # Documentation
```

**13. Establish the "Lib First" rule**
- ALL reusable code lives in `projects/osi-cards-lib/`
- App (`src/app/`) only contains app-specific code
- Document exceptions and reasoning

**14. Create interface contracts between lib and app**
```typescript
// Define clear boundaries
export interface ISectionRenderer {
  renderSection(section: CardSection): void;
  getAvailableSections(): SectionType[];
}

export interface IThemeProvider {
  getTheme(): Theme;
  setTheme(theme: Theme): void;
}
```

**15. Set up automated barrel export validation**
- Script to verify all public exports are properly exposed
- Prevent "hidden" code that should be public

---

## Phase 2: Single Source of Truth - Sections (Points 16-35)

### Section Architecture Redesign

**16. Create abstract `BaseSection` in lib only**
```typescript
// projects/osi-cards-lib/src/lib/components/sections/base-section.ts
@Directive()
export abstract class BaseSection<T = unknown> implements OnInit, OnDestroy {
  @Input() section!: CardSection;
  @Input() theme?: Theme;
  @Input() isStreaming = false;

  protected readonly sectionData = computed(() => this.section?.data as T);
  protected readonly styles = computed(() => this.themeService.getSectionStyles(this.section.type));

  abstract readonly sectionType: SectionType;
}
```

**17. Merge all section components to lib (keep most complete version)**

| Section | Action | Source |
|---------|--------|--------|
| analytics-section | Keep lib, merge src features | lib (115 lines) |
| brand-colors-section | Keep lib | lib (115 lines) |
| chart-section | Keep lib | lib (113 lines) |
| contact-card-section | Keep lib | lib (103 lines) |
| event-section | Keep lib | lib (46 lines) |
| fallback-section | Merge to lib | src (33 lines, has more) |
| financials-section | Keep lib | lib (70 lines) |
| info-section | Merge to lib | src (109 lines, has more) |
| list-section | Merge to lib | src (68 lines, has more) |
| map-section | Keep lib | lib (74 lines) |
| network-card-section | Keep lib | lib (49 lines) |
| news-section | Keep lib | lib (53 lines) |
| overview-section | Merge to lib | src (69 lines, has more) |
| product-section | Keep lib | lib (179 lines) |
| quotation-section | Keep lib | lib (57 lines) |
| social-media-section | Keep lib | lib (54 lines) |
| solutions-section | Keep lib | lib (46 lines) |
| text-reference-section | Keep lib | lib (68 lines) |

**18. Create section factory with registry lookup**
```typescript
// projects/osi-cards-lib/src/lib/factories/section.factory.ts
@Injectable({ providedIn: 'root' })
export class SectionFactory {
  private readonly registry = inject(SectionRegistry);

  createSection(type: SectionType): Type<BaseSection> {
    const config = this.registry.get(type);
    if (!config) {
      return FallbackSectionComponent;
    }
    return config.component;
  }

  getSectionMetadata(type: SectionType): SectionMetadata {
    return this.registry.getMetadata(type);
  }
}
```

**19. Implement lazy loading for sections**
```typescript
// projects/osi-cards-lib/src/lib/components/section-renderer/lazy-sections.ts
export const LAZY_SECTION_IMPORTS: Record<SectionType, () => Promise<Type<BaseSection>>> = {
  analytics: () => import('./sections/analytics-section').then(m => m.AnalyticsSectionComponent),
  chart: () => import('./sections/chart-section').then(m => m.ChartSectionComponent),
  // ... all sections
};
```

**20. Create section composition utilities**
```typescript
// Allow sections to be composed from smaller parts
export const SectionParts = {
  Header: SectionHeaderComponent,
  Content: SectionContentComponent,
  Footer: SectionFooterComponent,
  Actions: SectionActionsComponent,
  Empty: SectionEmptyStateComponent,
  Error: SectionErrorComponent,
  Loading: SectionLoadingComponent,
};
```

**21. Remove duplicate sections from src/app**
```bash
# After confirming lib versions are complete
rm -rf src/app/shared/components/cards/sections/analytics-section/
rm -rf src/app/shared/components/cards/sections/brand-colors-section/
# ... all section folders
rm src/app/shared/components/cards/sections/base-section.component.ts
rm src/app/shared/components/cards/sections/info-section.component.ts
# Keep only index.ts that re-exports from lib
```

**22. Create section type discriminators**
```typescript
// Generated from registry
export const isSectionType = {
  analytics: (s: CardSection): s is AnalyticsSection => s.type === 'analytics',
  chart: (s: CardSection): s is ChartSection => s.type === 'chart',
  // ... all types
};

export const assertSectionType = {
  analytics: (s: CardSection): asserts s is AnalyticsSection => {
    if (s.type !== 'analytics') throw new Error(`Expected analytics, got ${s.type}`);
  },
  // ... all types
};
```

**23. Implement section validation from registry**
```typescript
// projects/osi-cards-lib/src/lib/validators/section.validator.ts
@Injectable({ providedIn: 'root' })
export class SectionValidator {
  private readonly registry = inject(SectionRegistry);

  validate(section: CardSection): ValidationResult {
    const schema = this.registry.getSchema(section.type);
    return this.validateAgainstSchema(section, schema);
  }

  getRequiredFields(type: SectionType): string[] {
    return this.registry.getRequiredFields(type);
  }
}
```

**24. Create section normalization pipeline**
```typescript
// Single normalization logic
@Injectable({ providedIn: 'root' })
export class SectionNormalizer {
  normalize(section: Partial<CardSection>): CardSection {
    const defaults = this.registry.getDefaults(section.type);
    return {
      ...defaults,
      ...section,
      data: this.normalizeData(section.type, section.data),
    };
  }
}
```

**25. Implement section renderer with single source**
```typescript
// projects/osi-cards-lib/src/lib/components/section-renderer/section-renderer.component.ts
@Component({
  selector: 'osi-section-renderer',
  template: `
    <ng-container *ngIf="sectionComponent$ | async as component">
      <ng-container *ngComponentOutlet="component; inputs: sectionInputs" />
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionRendererComponent {
  @Input() section!: CardSection;

  private readonly factory = inject(SectionFactory);

  readonly sectionComponent$ = computed(() =>
    this.factory.createSection(this.section.type)
  );

  readonly sectionInputs = computed(() => ({
    section: this.section,
    theme: this.theme,
  }));
}
```

**26. Delete duplicate section-renderer from src/app**
```bash
# src/app version has 606 lines (more), lib has 359 lines
# Merge any unique features from src to lib, then delete src version
rm -rf src/app/shared/components/cards/section-renderer/
```

**27. Create section plugin system**
```typescript
// Allow external sections to be registered
export interface SectionPlugin {
  type: string;
  component: Type<BaseSection>;
  metadata: SectionMetadata;
  styles?: string;
}

@Injectable({ providedIn: 'root' })
export class SectionPluginRegistry {
  register(plugin: SectionPlugin): void;
  unregister(type: string): void;
  getAll(): SectionPlugin[];
}
```

**28. Implement section theming from single source**
```typescript
// All section theming derives from tokens
export const SECTION_THEME_TOKENS = {
  analytics: {
    '--section-bg': 'var(--surface-card)',
    '--section-border': 'var(--border-color)',
    '--section-title-color': 'var(--text-primary)',
  },
  // ... derived from registry
};
```

**29. Create section documentation generator**
```typescript
// Auto-generate docs from registry
// scripts/generate-section-docs.js
// Outputs: docs/sections/[type].md for each section
```

**30. Implement section testing utilities**
```typescript
// projects/osi-cards-lib/src/lib/testing/section-test.utils.ts
export function createMockSection<T extends SectionType>(
  type: T,
  overrides?: Partial<SectionByType[T]>
): SectionByType[T] {
  const defaults = SECTION_DEFAULTS[type];
  return { ...defaults, ...overrides };
}

export function renderSection(type: SectionType, data?: unknown): ComponentFixture<BaseSection> {
  // Test utility for rendering any section
}
```

**31. Create section storybook stories from registry**
```typescript
// Auto-generate stories for each section type
// scripts/generate-section-stories.js
```

**32. Implement section analytics/telemetry**
```typescript
// Track section usage for optimization
@Injectable({ providedIn: 'root' })
export class SectionAnalytics {
  trackRender(type: SectionType, duration: number): void;
  trackInteraction(type: SectionType, action: string): void;
  getUsageStats(): SectionUsageStats;
}
```

**33. Create section accessibility checker**
```typescript
// Validate sections meet a11y requirements
@Injectable({ providedIn: 'root' })
export class SectionA11yValidator {
  validate(section: CardSection): A11yValidationResult;
  getRequiredAriaAttributes(type: SectionType): string[];
}
```

**34. Implement section performance monitoring**
```typescript
// Track section render performance
export function withPerformanceTracking<T extends BaseSection>(
  component: Type<T>
): Type<T> {
  // Decorator/wrapper to track render times
}
```

**35. Create section migration CLI tool**
```typescript
// Tool to help migrate custom sections
// npx osi-cards migrate-section ./my-section.component.ts
```

---

## Phase 3: Service Consolidation (Points 36-50)

### Service Architecture

**36. Merge theme.service.ts to lib**
```typescript
// lib version is 729 lines (more complete)
// src version is 161 lines
// Action: Keep lib, delete src, ensure app uses lib version
```

**37. Merge card-facade.service.ts to lib**
```typescript
// lib version is 682 lines (more complete)
// src version is 156 lines
// Action: Keep lib, delete src
```

**38. Merge event-bus.service.ts to lib**
```typescript
// lib version is 318 lines (more complete)
// src version is 158 lines
// Action: Keep lib, delete src
```

**39. Review and merge section-normalization.service.ts**
```typescript
// src version is 550 lines (MORE than lib's 466)
// Action: Merge unique features from src to lib, then delete src
```

**40. Review and merge section-utils.service.ts**
```typescript
// src version is 245 lines (MORE than lib's 163)
// Action: Merge unique features from src to lib, then delete src
```

**41. Review and merge icon.service.ts**
```typescript
// src version is 216 lines (MORE than lib's 168)
// Action: Merge unique features from src to lib, then delete src
```

**42. Merge magnetic-tilt.service.ts**
```typescript
// src: 475 lines, lib: 457 lines (similar)
// Action: Compare, merge, keep lib version
```

**43. Create service composition pattern**
```typescript
// Allow services to be composed
export interface ServiceComposition {
  core: CoreServices;
  sections: SectionServices;
  themes: ThemeServices;
  events: EventServices;
}

// App can extend with additional services
export interface AppServices extends ServiceComposition {
  app: AppSpecificServices;
}
```

**44. Implement service mocking utilities**
```typescript
// projects/osi-cards-lib/src/lib/testing/service-mocks.ts
export const createMockThemeService = (): MockType<ThemeService> => ({
  getTheme: jest.fn().mockReturnValue(DEFAULT_THEME),
  setTheme: jest.fn(),
  // ...
});
```

**45. Review low-usage services**
```typescript
// Services with only 1-2 imports - determine if needed
// retry-queue.service.ts (339 lines, 1 import)
// card-search.service.ts (232 lines, 1 import)
// chat.service.ts (193 lines, 1 import)
// security-headers.service.ts (251 lines, 1 import)
// locale-formatting.service.ts (421 lines, 1 import)
// development-warnings.service.ts (280 lines, 2 imports)
```

**46. Create service dependency graph**
```typescript
// Document which services depend on which
// Identify circular dependencies
// scripts/generate-service-graph.js
```

**47. Implement service versioning**
```typescript
// Allow services to be versioned for breaking changes
export const SERVICE_VERSIONS = {
  theme: '2.0.0',
  cardFacade: '2.0.0',
  // ...
};
```

**48. Create service initialization order**
```typescript
// Define proper initialization order
export const SERVICE_INIT_ORDER = [
  'config',
  'logging',
  'theme',
  'eventBus',
  'sectionRegistry',
  // ...
];
```

**49. Implement service health checks**
```typescript
@Injectable({ providedIn: 'root' })
export class ServiceHealthCheck {
  checkAll(): Observable<ServiceHealth[]>;
  check(serviceName: string): Observable<ServiceHealth>;
}
```

**50. Delete duplicate service files from src/app**
```bash
rm src/app/shared/services/card-facade.service.ts
rm src/app/core/services/event-bus.service.ts
rm src/app/shared/services/icon.service.ts
rm src/app/core/services/magnetic-tilt.service.ts
rm src/app/shared/services/section-normalization.service.ts
rm src/app/shared/services/section-utils.service.ts
rm src/app/shared/services/theme.service.ts
# Update imports to use lib versions
```

---

## Phase 4: Component Architecture (Points 51-65)

### Main Components Consolidation

**51. Merge ai-card-renderer.component.ts**
```typescript
// src: 1,362 lines, lib: 1,264 lines
// src has 7% more code - review what's different
// Action: Merge unique features to lib, delete src
```

**52. Merge masonry-grid.component.ts**
```typescript
// src: 1,401 lines, lib: 2,638 lines
// lib is 87% more complete
// Action: Keep lib, delete src
```

**53. Merge card-skeleton.component.ts**
```typescript
// src: 38 lines, lib: 180 lines
// lib is much more complete
// Action: Keep lib, delete src
```

**54. Merge card-streaming-indicator.component.ts**
```typescript
// src: 58 lines, lib: 106 lines
// lib is 82% more complete
// Action: Keep lib, delete src
```

**55. Create component composition system**
```typescript
// projects/osi-cards-lib/src/lib/components/composition/
export const CardComponents = {
  Renderer: AiCardRendererComponent,
  Header: CardHeaderComponent,
  Body: CardBodyComponent,
  Footer: CardFooterComponent,
  Actions: CardActionsComponent,
  Skeleton: CardSkeletonComponent,
  StreamingIndicator: CardStreamingIndicatorComponent,
  Preview: CardPreviewComponent,
};
```

**56. Implement component slots for customization**
```typescript
@Component({
  selector: 'osi-card',
  template: `
    <ng-content select="[cardHeader]"></ng-content>
    <ng-content select="[cardBody]"></ng-content>
    <ng-content select="[cardFooter]"></ng-content>
    <ng-content></ng-content>
  `,
})
export class OsiCardComponent {
  // Allow slot-based customization
}
```

**57. Create component theming API**
```typescript
// Consistent theming across all components
export interface ComponentThemeConfig {
  colors: ColorConfig;
  spacing: SpacingConfig;
  typography: TypographyConfig;
  borders: BorderConfig;
  shadows: ShadowConfig;
}
```

**58. Implement component state management**
```typescript
// Centralized state for components
@Injectable()
export class ComponentState {
  readonly cards = signal<CardConfig[]>([]);
  readonly activeCard = signal<string | null>(null);
  readonly isStreaming = signal(false);
}
```

**59. Create component event system**
```typescript
// Unified event handling
export interface CardEvents {
  onCardClick: EventEmitter<CardClickEvent>;
  onSectionClick: EventEmitter<SectionClickEvent>;
  onActionClick: EventEmitter<ActionClickEvent>;
  onStreamingStart: EventEmitter<void>;
  onStreamingComplete: EventEmitter<void>;
}
```

**60. Delete duplicate component files**
```bash
rm src/app/shared/components/cards/ai-card-renderer.component.ts
rm src/app/shared/components/cards/ai-card-renderer.component.html
rm src/app/shared/components/cards/ai-card-renderer.component.css
rm -rf src/app/shared/components/cards/masonry-grid/
rm -rf src/app/shared/components/cards/card-skeleton/
rm -rf src/app/shared/components/cards/card-streaming-indicator/
rm -rf src/app/shared/components/cards/card-header/
rm -rf src/app/shared/components/cards/card-actions/
rm -rf src/app/shared/components/cards/card-section-list/
```

**61. Create component re-exports in src/app**
```typescript
// src/app/shared/components/cards/index.ts
// Re-export everything from lib for backward compatibility
export * from '@osi-cards/lib';
```

**62. Implement component lazy loading**
```typescript
// Lazy load heavy components
export const LAZY_COMPONENTS = {
  AiCardRenderer: () => import('@osi-cards/lib').then(m => m.AiCardRendererComponent),
  MasonryGrid: () => import('@osi-cards/lib').then(m => m.MasonryGridComponent),
};
```

**63. Create component documentation**
```typescript
// Auto-generate component docs
// scripts/generate-component-docs.js
```

**64. Implement component testing harness**
```typescript
// projects/osi-cards-lib/src/lib/testing/component-harness.ts
export class CardRendererHarness extends ComponentHarness {
  static hostSelector = 'osi-ai-card-renderer';

  async getSections(): Promise<SectionHarness[]>;
  async getHeader(): Promise<HeaderHarness>;
  async clickAction(name: string): Promise<void>;
}
```

**65. Create component showcase app**
```typescript
// Interactive component explorer
// src/app/features/component-showcase/
```

---

## Phase 5: Style System Unification (Points 66-75)

### CSS/SCSS Consolidation

**66. Establish single SCSS entry point**
```scss
// projects/osi-cards-lib/src/lib/styles/_index.scss
// This is THE source for all styles

@forward 'tokens';
@forward 'base';
@forward 'components';
@forward 'sections';
@forward 'themes';
@forward 'utilities';
```

**67. Merge duplicate CSS files**
```bash
# Delete src versions, use lib versions
rm src/app/shared/components/cards/ai-card-renderer.component.css
rm src/app/shared/components/cards/masonry-grid/masonry-grid.component.css
rm src/app/shared/components/cards/card-skeleton/card-skeleton.component.css
# ... etc
```

**68. Create CSS custom properties from registry**
```scss
// Generated from section-registry.json
:root {
  // Section-specific tokens
  --osi-section-analytics-bg: var(--surface-card);
  --osi-section-analytics-border: var(--border-color);
  // ... all sections
}
```

**69. Implement theme generation system**
```typescript
// Generate theme CSS from config
export function generateThemeCSS(theme: ThemeConfig): string {
  return Object.entries(theme.tokens)
    .map(([key, value]) => `--${key}: ${value};`)
    .join('\n');
}
```

**70. Create style validation**
```typescript
// Validate styles match design system
// scripts/validate-styles.js
```

**71. Implement CSS-in-JS alternative**
```typescript
// For dynamic styling needs
export const createSectionStyles = (config: SectionStyleConfig) => ({
  container: {
    backgroundColor: `var(--osi-section-${config.type}-bg)`,
    // ...
  },
});
```

**72. Delete duplicate SCSS files**
```bash
# Review and delete duplicates
# Keep only lib versions
```

**73. Create style documentation**
```markdown
# Auto-generated style guide
# docs/STYLE_GUIDE.md
```

**74. Implement critical CSS extraction**
```typescript
// Extract critical CSS for performance
// scripts/extract-critical-css.js
```

**75. Create dark/light theme system**
```scss
// Unified theme switching
[data-theme="dark"] {
  @include dark-theme-tokens;
}

[data-theme="light"] {
  @include light-theme-tokens;
}
```

---

## Phase 6: Documentation & Build (Points 76-85)

### Documentation Consolidation

**76. Consolidate documentation folders**
```bash
# Single source: docs/
# Delete duplicates:
rm -rf projects/osi-cards-lib/docs/SERVICES.md  # Use docs/SERVICES.md
rm -rf projects/osi-cards-lib/docs/THEMING.md   # Use docs/THEMING_GUIDE.md
rm -rf src/assets/docs/SERVICES.md
rm -rf src/assets/docs/THEMING.md
rm -rf src/assets/docs/EVENTS.md
rm -rf src/assets/docs/AGENTIC_FLOW_INTEGRATION.md
```

**77. Create documentation generation pipeline**
```
section-registry.json + code + JSDocs
    ↓
generate-docs.js
    ↓
├── docs/sections/*.md
├── docs/services/*.md
├── docs/components/*.md
└── docs/api/*.md
```

**78. Implement inline documentation standards**
```typescript
/**
 * Renders a card section based on its type.
 * @param section - The section configuration
 * @returns The rendered component
 * @example
 * ```typescript
 * <osi-section-renderer [section]="mySection" />
 * ```
 */
```

**79. Create API documentation generator**
```typescript
// Generate OpenAPI/TypeDoc from code
// scripts/generate-api-docs.js
```

**80. Implement documentation testing**
```typescript
// Test that code examples in docs work
// scripts/test-docs.js
```

### Build Optimization

**81. Optimize library build**
```json
// ng-package.json optimizations
{
  "lib": {
    "entryFile": "src/public-api.ts",
    "flatModuleFile": "osi-cards",
    "flatModuleOutFile": "osi-cards.js"
  }
}
```

**82. Implement tree-shaking verification**
```typescript
// Verify unused code is eliminated
// scripts/verify-tree-shaking.js
```

**83. Create secondary entry points**
```
projects/osi-cards-lib/
├── src/public-api.ts           # Main entry
├── sections/                   # @osi-cards/sections
│   └── public-api.ts
├── themes/                     # @osi-cards/themes
│   └── public-api.ts
└── testing/                    # @osi-cards/testing
    └── public-api.ts
```

**84. Optimize bundle size**
```typescript
// Analyze and reduce bundle size
// scripts/analyze-bundle.js
```

**85. Implement code splitting**
```typescript
// Split large modules
// routes with loadComponent
```

---

## Phase 7: Testing & Quality (Points 86-95)

### Testing Infrastructure

**86. Create shared testing utilities**
```typescript
// projects/osi-cards-lib/src/lib/testing/
export * from './section-test.utils';
export * from './service-mocks';
export * from './component-harness';
export * from './fixtures';
```

**87. Implement visual regression testing**
```typescript
// Automated visual testing for sections
// e2e/visual/sections/*.spec.ts
```

**88. Create contract tests**
```typescript
// Ensure lib API doesn't break
// tests/contracts/*.spec.ts
```

**89. Implement performance benchmarks**
```typescript
// Track performance over time
// scripts/run-benchmarks.js
```

**90. Create accessibility test suite**
```typescript
// Automated a11y testing
// e2e/accessibility/*.spec.ts
```

### Quality Assurance

**91. Implement stricter TypeScript config**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**92. Create ESLint rules for architecture**
```javascript
// Enforce architecture rules
// .eslintrc.js
{
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        // Prevent importing from src in lib
        'src/app/*',
      ]
    }]
  }
}
```

**93. Implement code coverage requirements**
```json
// karma.conf.js
{
  "coverageReporter": {
    "check": {
      "global": {
        "statements": 80,
        "branches": 80,
        "functions": 80,
        "lines": 80
      }
    }
  }
}
```

**94. Create architectural fitness functions**
```typescript
// Automated architecture validation
// scripts/validate-architecture.js
```

**95. Implement dependency review**
```typescript
// Review and audit dependencies
// scripts/audit-dependencies.js
```

---

## Phase 8: Advanced Optimizations (Points 96-100)

### Final Optimizations

**96. Implement micro-frontend support**
```typescript
// Allow sections to be loaded from external sources
export interface RemoteSectionConfig {
  url: string;
  type: string;
  version: string;
}
```

**97. Create plugin marketplace structure**
```typescript
// Allow third-party sections
// docs/PLUGIN_DEVELOPMENT.md
export interface OsiCardsPlugin {
  name: string;
  version: string;
  sections: SectionPlugin[];
  themes?: ThemePlugin[];
}
```

**98. Implement caching strategy**
```typescript
// Intelligent caching for sections
@Injectable({ providedIn: 'root' })
export class SectionCacheService {
  private cache = new Map<string, CachedSection>();

  get(key: string): CachedSection | null;
  set(key: string, section: CachedSection): void;
  invalidate(pattern: string): void;
}
```

**99. Create performance monitoring dashboard**
```typescript
// Real-time performance metrics
// src/app/features/performance-dashboard/
```

**100. Implement gradual rollout system**
```typescript
// Feature flags for gradual migration
export interface RolloutConfig {
  feature: string;
  percentage: number;
  targeting?: TargetingRule[];
}

@Injectable({ providedIn: 'root' })
export class RolloutService {
  isEnabled(feature: string, context?: RolloutContext): boolean;
}
```

---

## Implementation Timeline

### Week 1-2: Foundation (Points 1-15)
- Clean up unused files
- Set up architecture documentation
- Configure path aliases and barrel exports

### Week 3-4: Sections (Points 16-35)
- Merge all section components to lib
- Implement section factory and registry
- Delete duplicate sections from src

### Week 5-6: Services (Points 36-50)
- Merge all services to lib
- Review low-usage services
- Delete duplicates

### Week 7-8: Components (Points 51-65)
- Merge main components
- Implement composition system
- Delete duplicates

### Week 9: Styles (Points 66-75)
- Unify style system
- Delete duplicate CSS/SCSS
- Implement theming

### Week 10: Documentation & Build (Points 76-85)
- Consolidate documentation
- Optimize builds

### Week 11: Testing (Points 86-95)
- Enhance testing infrastructure
- Implement quality gates

### Week 12: Advanced (Points 96-100)
- Advanced optimizations
- Plugin system foundation

---

## Success Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Duplicate files | ~90 | 0 |
| Total lines of code | ~100,000 | ~85,000 |
| Section definitions | 2 (src + lib) | 1 (lib only) |
| Service definitions | 2 (src + lib) | 1 (lib only) |
| Build time | baseline | -20% |
| Bundle size | baseline | -15% |
| Test coverage | current | 80%+ |

---

## Risk Mitigation

1. **Feature flags** for gradual migration
2. **Automated tests** before each deletion
3. **Documentation** of all changes
4. **Rollback plan** for each phase
5. **Stakeholder communication** throughout

---

*Plan created: December 1, 2025*
*Review cadence: Weekly*
*Success criteria: All 100 points completed with tests passing*

