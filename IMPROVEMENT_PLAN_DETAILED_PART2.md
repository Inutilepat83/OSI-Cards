# OSI-Cards 100-Point Improvement Plan - PART 2 (Points 21-100)

---

## Points 21-35: Section Implementation Continued

### Point 21: Delete Duplicate Sections from src/app

**Step 21.1:** Create deletion verification script
```bash
#!/bin/bash
# scripts/verify-section-deletion.sh

# Verify lib versions exist and are imported correctly
SECTIONS=(
  "analytics-section"
  "brand-colors-section"
  "chart-section"
  "contact-card-section"
  "event-section"
  "fallback-section"
  "financials-section"
  "list-section"
  "map-section"
  "network-card-section"
  "news-section"
  "overview-section"
  "product-section"
  "quotation-section"
  "social-media-section"
  "solutions-section"
  "text-reference-section"
)

echo "Verifying lib sections exist..."
for section in "${SECTIONS[@]}"; do
  LIB_PATH="projects/osi-cards-lib/src/lib/components/sections/${section}/${section}.component.ts"
  if [ ! -f "$LIB_PATH" ]; then
    echo "❌ Missing lib: $section"
    exit 1
  fi
done
echo "✅ All lib sections present"

echo ""
echo "Checking for imports of src sections..."
grep -r "shared/components/cards/sections" --include="*.ts" src/app/ | grep -v ".spec.ts"
```

**Step 21.2:** Update imports to use lib
```typescript
// Before (in any file importing sections)
import { AnalyticsSectionComponent } from '../shared/components/cards/sections/analytics-section/analytics-section.component';

// After
import { AnalyticsSectionComponent } from '@osi-cards/sections';
```

**Step 21.3:** Create re-export file for backward compatibility
```typescript
// src/app/shared/components/cards/sections/index.ts
/**
 * @deprecated Import from '@osi-cards/sections' instead
 */
export * from '@osi-cards/sections';
```

**Step 21.4:** Delete duplicate section folders
```bash
# Run after all imports updated
rm -rf src/app/shared/components/cards/sections/analytics-section/
rm -rf src/app/shared/components/cards/sections/brand-colors-section/
rm -rf src/app/shared/components/cards/sections/chart-section/
rm -rf src/app/shared/components/cards/sections/contact-card-section/
rm -rf src/app/shared/components/cards/sections/event-section/
rm -rf src/app/shared/components/cards/sections/fallback-section/
rm -rf src/app/shared/components/cards/sections/financials-section/
rm -rf src/app/shared/components/cards/sections/list-section/
rm -rf src/app/shared/components/cards/sections/map-section/
rm -rf src/app/shared/components/cards/sections/network-card-section/
rm -rf src/app/shared/components/cards/sections/news-section/
rm -rf src/app/shared/components/cards/sections/overview-section/
rm -rf src/app/shared/components/cards/sections/product-section/
rm -rf src/app/shared/components/cards/sections/quotation-section/
rm -rf src/app/shared/components/cards/sections/social-media-section/
rm -rf src/app/shared/components/cards/sections/solutions-section/
rm -rf src/app/shared/components/cards/sections/text-reference-section/
rm src/app/shared/components/cards/sections/base-section.component.ts
rm src/app/shared/components/cards/sections/info-section.component.ts
rm src/app/shared/components/cards/sections/info-section.component.html
rm src/app/shared/components/cards/sections/info-section.component.spec.ts
```

**Step 21.5:** Verify build
```bash
npm run build
npm run test:unit
```

### Point 22: Create Section Type Discriminators

```typescript
// projects/osi-cards-lib/src/lib/models/section-type-guards.ts
import {
  CardSection,
  AnalyticsSection,
  BrandColorsSection,
  ChartSection,
  ContactCardSection,
  EventSection,
  FallbackSection,
  FinancialsSection,
  InfoSection,
  ListSection,
  MapSection,
  NetworkCardSection,
  NewsSection,
  OverviewSection,
  ProductSection,
  QuotationSection,
  SocialMediaSection,
  SolutionsSection,
  TextReferenceSection,
  SectionType,
} from './generated-section-types';

/**
 * Type guard functions for section types.
 * Use these for type narrowing in conditional logic.
 */
export const isSectionType = {
  analytics: (s: CardSection): s is AnalyticsSection => s.type === 'analytics',
  brandColors: (s: CardSection): s is BrandColorsSection => s.type === 'brand-colors',
  chart: (s: CardSection): s is ChartSection => s.type === 'chart',
  contactCard: (s: CardSection): s is ContactCardSection => s.type === 'contact-card',
  event: (s: CardSection): s is EventSection => s.type === 'event',
  fallback: (s: CardSection): s is FallbackSection => s.type === 'fallback',
  financials: (s: CardSection): s is FinancialsSection => s.type === 'financials',
  info: (s: CardSection): s is InfoSection => s.type === 'info',
  list: (s: CardSection): s is ListSection => s.type === 'list',
  map: (s: CardSection): s is MapSection => s.type === 'map',
  networkCard: (s: CardSection): s is NetworkCardSection => s.type === 'network-card',
  news: (s: CardSection): s is NewsSection => s.type === 'news',
  overview: (s: CardSection): s is OverviewSection => s.type === 'overview',
  product: (s: CardSection): s is ProductSection => s.type === 'product',
  quotation: (s: CardSection): s is QuotationSection => s.type === 'quotation',
  socialMedia: (s: CardSection): s is SocialMediaSection => s.type === 'social-media',
  solutions: (s: CardSection): s is SolutionsSection => s.type === 'solutions',
  textReference: (s: CardSection): s is TextReferenceSection => s.type === 'text-reference',
} as const;

/**
 * Assertion functions for section types.
 * Throws if type doesn't match.
 */
export const assertSectionType = {
  analytics: (s: CardSection): asserts s is AnalyticsSection => {
    if (s.type !== 'analytics') {
      throw new TypeError(`Expected analytics section, got ${s.type}`);
    }
  },
  // ... similar for all types
} as const;

/**
 * Type-safe section data extractor.
 */
export function getSectionData<T extends SectionType>(
  section: CardSection,
  expectedType: T
): Extract<CardSection, { type: T }>['data'] {
  if (section.type !== expectedType) {
    throw new TypeError(`Expected ${expectedType} section, got ${section.type}`);
  }
  return section.data as Extract<CardSection, { type: T }>['data'];
}

/**
 * Check if a string is a valid section type.
 */
export function isValidSectionType(type: string): type is SectionType {
  const validTypes: SectionType[] = [
    'analytics', 'brand-colors', 'chart', 'contact-card', 'event',
    'fallback', 'financials', 'info', 'list', 'map', 'network-card',
    'news', 'overview', 'product', 'quotation', 'social-media',
    'solutions', 'text-reference',
  ];
  return validTypes.includes(type as SectionType);
}
```

### Point 23: Implement Section Validation from Registry

```typescript
// projects/osi-cards-lib/src/lib/validators/section.validator.ts
import { Injectable, inject } from '@angular/core';
import { SectionRegistry } from '../services/section-registry.service';
import { CardSection, SectionType } from '../models';

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

@Injectable({ providedIn: 'root' })
export class SectionValidator {
  private readonly registry = inject(SectionRegistry);

  /**
   * Validate a section against its schema from the registry.
   */
  validate(section: CardSection): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Check type exists
    if (!section.type) {
      errors.push({
        field: 'type',
        message: 'Section type is required',
        code: 'MISSING_TYPE',
      });
      return { valid: false, errors, warnings };
    }

    // Check type is registered
    const schema = this.registry.getSchema(section.type as SectionType);
    if (!schema) {
      errors.push({
        field: 'type',
        message: `Unknown section type: ${section.type}`,
        code: 'UNKNOWN_TYPE',
      });
      return { valid: false, errors, warnings };
    }

    // Validate required fields
    const requiredFields = this.getRequiredFields(section.type as SectionType);
    for (const field of requiredFields) {
      if (!this.hasField(section, field)) {
        errors.push({
          field,
          message: `Required field '${field}' is missing`,
          code: 'MISSING_REQUIRED_FIELD',
        });
      }
    }

    // Validate field types
    this.validateFieldTypes(section, schema, errors);

    // Check for deprecated fields
    this.checkDeprecatedFields(section, schema, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get required fields for a section type.
   */
  getRequiredFields(type: SectionType): string[] {
    const schema = this.registry.getSchema(type);
    if (!schema?.properties) return [];

    return Object.entries(schema.properties)
      .filter(([_, config]) => config.required)
      .map(([key]) => key);
  }

  /**
   * Validate a batch of sections.
   */
  validateAll(sections: CardSection[]): Map<number, ValidationResult> {
    const results = new Map<number, ValidationResult>();
    sections.forEach((section, index) => {
      results.set(index, this.validate(section));
    });
    return results;
  }

  private hasField(section: CardSection, fieldPath: string): boolean {
    const parts = fieldPath.split('.');
    let current: unknown = section;

    for (const part of parts) {
      if (current === null || current === undefined) return false;
      if (typeof current !== 'object') return false;
      current = (current as Record<string, unknown>)[part];
    }

    return current !== undefined && current !== null;
  }

  private validateFieldTypes(
    section: CardSection,
    schema: unknown,
    errors: ValidationError[]
  ): void {
    // Type validation logic based on schema
  }

  private checkDeprecatedFields(
    section: CardSection,
    schema: unknown,
    warnings: ValidationError[]
  ): void {
    // Deprecation check logic
  }
}
```

### Point 24: Create Section Normalization Pipeline

```typescript
// projects/osi-cards-lib/src/lib/services/section-normalization.service.ts
import { Injectable, inject } from '@angular/core';
import { SectionRegistry } from './section-registry.service';
import { CardSection, SectionType } from '../models';

export interface NormalizationOptions {
  applyDefaults?: boolean;
  sanitize?: boolean;
  generateIds?: boolean;
  resolveReferences?: boolean;
}

const DEFAULT_OPTIONS: NormalizationOptions = {
  applyDefaults: true,
  sanitize: true,
  generateIds: true,
  resolveReferences: false,
};

@Injectable({ providedIn: 'root' })
export class SectionNormalizationService {
  private readonly registry = inject(SectionRegistry);

  /**
   * Normalize a section by applying defaults, sanitization, and ID generation.
   */
  normalize(
    section: Partial<CardSection>,
    options: NormalizationOptions = DEFAULT_OPTIONS
  ): CardSection {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    let normalized = { ...section } as CardSection;

    if (opts.applyDefaults) {
      normalized = this.applyDefaults(normalized);
    }

    if (opts.sanitize) {
      normalized = this.sanitize(normalized);
    }

    if (opts.generateIds) {
      normalized = this.generateIds(normalized);
    }

    return normalized;
  }

  /**
   * Normalize multiple sections.
   */
  normalizeAll(
    sections: Partial<CardSection>[],
    options?: NormalizationOptions
  ): CardSection[] {
    return sections.map(s => this.normalize(s, options));
  }

  /**
   * Apply default values from registry.
   */
  private applyDefaults(section: CardSection): CardSection {
    const defaults = this.registry.getDefaults(section.type as SectionType);
    if (!defaults) return section;

    return this.deepMerge(defaults, section);
  }

  /**
   * Sanitize section data.
   */
  private sanitize(section: CardSection): CardSection {
    return {
      ...section,
      title: this.sanitizeString(section.title),
      subtitle: this.sanitizeString(section.subtitle),
      data: this.sanitizeData(section.data),
    };
  }

  /**
   * Generate IDs for sections and nested items.
   */
  private generateIds(section: CardSection): CardSection {
    return {
      ...section,
      id: section.id ?? this.generateId(),
      data: this.generateNestedIds(section.data),
    };
  }

  private sanitizeString(value?: string): string | undefined {
    if (!value) return value;
    // Basic XSS prevention
    return value
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  private sanitizeData(data: unknown): unknown {
    if (typeof data === 'string') {
      return this.sanitizeString(data);
    }
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }
    if (data && typeof data === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        result[key] = this.sanitizeData(value);
      }
      return result;
    }
    return data;
  }

  private generateNestedIds(data: unknown): unknown {
    if (Array.isArray(data)) {
      return data.map((item, index) => {
        if (item && typeof item === 'object') {
          return {
            ...item,
            id: (item as Record<string, unknown>).id ?? this.generateId(),
          };
        }
        return item;
      });
    }
    return data;
  }

  private generateId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private deepMerge(defaults: unknown, overrides: unknown): unknown {
    if (!defaults) return overrides;
    if (!overrides) return defaults;

    if (typeof defaults !== 'object' || typeof overrides !== 'object') {
      return overrides;
    }

    const result: Record<string, unknown> = { ...defaults as object };

    for (const [key, value] of Object.entries(overrides as object)) {
      if (value !== undefined) {
        result[key] = this.deepMerge(
          (defaults as Record<string, unknown>)[key],
          value
        );
      }
    }

    return result;
  }
}
```

### Point 25: Implement Section Renderer with Single Source

```typescript
// projects/osi-cards-lib/src/lib/components/section-renderer/section-renderer.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  computed,
  signal,
  ChangeDetectionStrategy,
  ViewContainerRef,
  ComponentRef,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardSection, SectionType } from '../../models';
import { SectionFactory } from '../../factories/section.factory';
import { LazySectionLoader } from './lazy-section-loader.service';
import { MigrationFlagsService } from '../../services/migration-flags.service';
import { BaseSection } from '../sections/base-section.component';
import { SectionErrorBoundaryComponent } from '../section-error-boundary/section-error-boundary.component';
import { SectionSkeletonComponent } from '../section-skeleton/section-skeleton.component';

@Component({
  selector: 'osi-section-renderer',
  standalone: true,
  imports: [
    CommonModule,
    SectionErrorBoundaryComponent,
    SectionSkeletonComponent,
  ],
  template: `
    @if (isLoading()) {
      <osi-section-skeleton [type]="section.type" />
    } @else if (hasError()) {
      <osi-section-error-boundary
        [error]="error()"
        [sectionType]="section.type"
        (retry)="loadSection()"
      />
    } @else {
      <ng-container #sectionContainer></ng-container>
    }
  `,
  styles: [`
    :host {
      display: block;
      container-type: inline-size;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionRendererComponent implements OnInit, OnDestroy, OnChanges {
  @Input({ required: true }) section!: CardSection;
  @Input() theme?: string;
  @Input() isStreaming = false;
  @Input() columnSpan?: number;
  @Input() animationDelay = 0;
  @Input() useLazyLoading = false;

  @Output() sectionRendered = new EventEmitter<void>();
  @Output() sectionError = new EventEmitter<Error>();
  @Output() linkClick = new EventEmitter<{ url: string; label: string }>();
  @Output() actionClick = new EventEmitter<{ action: string; data: unknown }>();

  private readonly factory = inject(SectionFactory);
  private readonly lazyLoader = inject(LazySectionLoader);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly migrationFlags = inject(MigrationFlagsService);

  private componentRef: ComponentRef<BaseSection> | null = null;

  readonly isLoading = signal(false);
  readonly hasError = signal(false);
  readonly error = signal<Error | null>(null);

  readonly sectionInputs = computed(() => ({
    section: this.section,
    theme: this.theme,
    isStreaming: this.isStreaming,
    columnSpan: this.columnSpan,
    animationDelay: this.animationDelay,
  }));

  ngOnInit(): void {
    this.loadSection();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['section'] && !changes['section'].firstChange) {
      this.loadSection();
    } else if (this.componentRef) {
      // Update inputs without recreating component
      this.updateComponentInputs();
    }
  }

  ngOnDestroy(): void {
    this.destroyComponent();
  }

  async loadSection(): Promise<void> {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.error.set(null);

    try {
      this.destroyComponent();

      const componentType = this.useLazyLoading || this.migrationFlags.isEnabled('USE_LAZY_SECTIONS')
        ? await this.lazyLoader.load(this.section.type as SectionType)
        : this.factory.createSection(this.section.type as SectionType);

      this.componentRef = this.viewContainerRef.createComponent(componentType);
      this.updateComponentInputs();
      this.setupComponentOutputs();

      this.isLoading.set(false);
      this.sectionRendered.emit();

    } catch (err) {
      this.isLoading.set(false);
      this.hasError.set(true);
      this.error.set(err instanceof Error ? err : new Error(String(err)));
      this.sectionError.emit(this.error()!);
    }
  }

  private updateComponentInputs(): void {
    if (!this.componentRef) return;

    const inputs = this.sectionInputs();
    for (const [key, value] of Object.entries(inputs)) {
      this.componentRef.setInput(key, value);
    }
  }

  private setupComponentOutputs(): void {
    if (!this.componentRef) return;

    const instance = this.componentRef.instance;

    instance.linkClick.subscribe(event => this.linkClick.emit(event));
    instance.actionClick.subscribe(event => this.actionClick.emit(event));
    instance.error.subscribe(err => this.sectionError.emit(err));
  }

  private destroyComponent(): void {
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
    }
    this.viewContainerRef.clear();
  }
}
```

### Points 26-35: Additional Section Infrastructure

**Point 26:** Delete src/app/shared/components/cards/section-renderer/ after verifying lib version works

**Point 27:** Section plugin system implementation
```typescript
// projects/osi-cards-lib/src/lib/services/section-plugin-registry.service.ts
@Injectable({ providedIn: 'root' })
export class SectionPluginRegistry {
  private plugins = new Map<string, SectionPlugin>();

  register(plugin: SectionPlugin): void {
    if (this.plugins.has(plugin.type)) {
      console.warn(`Plugin for type '${plugin.type}' already registered, overwriting`);
    }
    this.plugins.set(plugin.type, plugin);
  }

  unregister(type: string): boolean {
    return this.plugins.delete(type);
  }

  get(type: string): SectionPlugin | undefined {
    return this.plugins.get(type);
  }

  getAll(): SectionPlugin[] {
    return Array.from(this.plugins.values());
  }

  has(type: string): boolean {
    return this.plugins.has(type);
  }
}
```

**Point 28:** Section theming from single source (CSS variables)

**Point 29:** Section documentation generator

**Point 30:** Section testing utilities

**Point 31:** Section storybook stories from registry

**Point 32:** Section analytics/telemetry

**Point 33:** Section accessibility checker

**Point 34:** Section performance monitoring

**Point 35:** Section migration CLI tool

---

## Phase 3: Service Consolidation (Points 36-50)

### Point 36: Merge theme.service.ts

**Current State:**
- src/app/shared/services/theme.service.ts: 161 lines
- projects/osi-cards-lib/src/lib/themes/theme.service.ts: 729 lines

**Action:** Keep lib version (77% more complete)

**Step 36.1:** Compare files
```bash
diff src/app/shared/services/theme.service.ts \
     projects/osi-cards-lib/src/lib/themes/theme.service.ts > diffs/theme-service.diff
```

**Step 36.2:** Identify unique features in src version
```typescript
// Features to check if they exist in lib:
// 1. Theme persistence
// 2. System preference detection
// 3. Theme transition animations
```

**Step 36.3:** Update all imports
```typescript
// Find and replace all imports
// From: import { ThemeService } from 'src/app/shared/services/theme.service';
// To:   import { ThemeService } from '@osi-cards/themes';
```

**Step 36.4:** Delete src version
```bash
rm src/app/shared/services/theme.service.ts
```

### Point 37: Merge card-facade.service.ts

**Current State:**
- src: 156 lines
- lib: 682 lines

**Action:** Keep lib version

### Point 38: Merge event-bus.service.ts

**Current State:**
- src: 158 lines
- lib: 318 lines

**Action:** Keep lib version

### Point 39: Review and merge section-normalization.service.ts

**Current State:**
- src: 550 lines (MORE)
- lib: 466 lines

**Action:** Merge src features into lib

**Step 39.1:** Identify features in src not in lib
```bash
# Generate detailed diff
diff -u projects/osi-cards-lib/src/lib/services/section-normalization.service.ts \
        src/app/shared/services/section-normalization.service.ts > diffs/section-normalization.diff
```

**Step 39.2:** List methods/features to merge
```typescript
// src-only features to merge:
// 1. normalizeStreamingSection()
// 2. mergePartialUpdate()
// 3. validateBeforeNormalize()
// etc.
```

**Step 39.3:** Add to lib version

**Step 39.4:** Test both use cases

**Step 39.5:** Delete src version

### Point 40: Review and merge section-utils.service.ts

**Current State:**
- src: 245 lines (MORE)
- lib: 163 lines

**Action:** Merge src features into lib

### Point 41: Review and merge icon.service.ts

**Current State:**
- src: 216 lines (MORE)
- lib: 168 lines

**Action:** Merge src features into lib

### Point 42: Merge magnetic-tilt.service.ts

**Current State:**
- src: 475 lines
- lib: 457 lines (similar)

**Action:** Compare and merge

### Points 43-50: Service Infrastructure

**Point 43:** Service composition pattern
```typescript
// projects/osi-cards-lib/src/lib/providers/service-composition.ts
export interface OsiCardsServices {
  theme: ThemeService;
  cardFacade: CardFacadeService;
  eventBus: EventBusService;
  sectionRegistry: SectionRegistry;
  sectionNormalization: SectionNormalizationService;
  sectionUtils: SectionUtilsService;
  icon: IconService;
  accessibility: AccessibilityService;
  animation: AnimationOrchestratorService;
}

export function provideOsiCardsServices(): Provider[] {
  return [
    ThemeService,
    CardFacadeService,
    EventBusService,
    SectionRegistry,
    SectionNormalizationService,
    SectionUtilsService,
    IconService,
    AccessibilityService,
    AnimationOrchestratorService,
  ];
}
```

**Point 44:** Service mocking utilities

**Point 45:** Review low-usage services

**Point 46:** Service dependency graph

**Point 47:** Service versioning

**Point 48:** Service initialization order

**Point 49:** Service health checks

**Point 50:** Delete all duplicate service files

---

## Phase 4: Component Architecture (Points 51-65)

### Point 51: Merge ai-card-renderer.component.ts

**Current State:**
- src: 1,362 lines
- lib: 1,264 lines

**Step 51.1:** Detailed comparison
```bash
# Create side-by-side diff
diff -y --suppress-common-lines \
  src/app/shared/components/cards/ai-card-renderer.component.ts \
  projects/osi-cards-lib/src/lib/components/ai-card-renderer/ai-card-renderer.component.ts \
  > diffs/ai-card-renderer.diff
```

**Step 51.2:** Identify unique features in each
```
src-only features:
- Feature A
- Feature B

lib-only features:
- Feature C
- Feature D
```

**Step 51.3:** Merge into lib

**Step 51.4:** Update tests

**Step 51.5:** Delete src version

### Point 52: Merge masonry-grid.component.ts

**Current State:**
- src: 1,401 lines
- lib: 2,638 lines (87% MORE)

**Action:** Keep lib version (much more complete)

### Point 53: Merge card-skeleton.component.ts

**Current State:**
- src: 38 lines
- lib: 180 lines

**Action:** Keep lib version

### Points 54-65: Component Infrastructure

**Point 54:** Merge card-streaming-indicator

**Point 55:** Component composition system
```typescript
// projects/osi-cards-lib/src/lib/components/index.ts
export const CardComponents = {
  // Main components
  AiCardRenderer: AiCardRendererComponent,
  MasonryGrid: MasonryGridComponent,
  OsiCards: OsiCardsComponent,
  OsiCardsContainer: OsiCardsContainerComponent,

  // Sub-components
  CardHeader: CardHeaderComponent,
  CardBody: CardBodyComponent,
  CardFooter: CardFooterComponent,
  CardActions: CardActionsComponent,
  CardSkeleton: CardSkeletonComponent,
  CardPreview: CardPreviewComponent,
  CardStreamingIndicator: CardStreamingIndicatorComponent,
  CardSectionList: CardSectionListComponent,

  // Section-related
  SectionRenderer: SectionRendererComponent,
  SectionSkeleton: SectionSkeletonComponent,
  SectionErrorBoundary: SectionErrorBoundaryComponent,

  // Accessibility
  SkipLink: SkipLinkComponent,
};
```

**Point 56:** Component slots for customization

**Point 57:** Component theming API

**Point 58:** Component state management

**Point 59:** Component event system

**Point 60:** Delete duplicate component files

**Point 61:** Create component re-exports

**Point 62:** Component lazy loading

**Point 63:** Component documentation

**Point 64:** Component testing harness

**Point 65:** Component showcase app

---

## Phase 5: Style System Unification (Points 66-75)

### Point 66: Establish Single SCSS Entry Point

```scss
// projects/osi-cards-lib/src/lib/styles/_index.scss
// MASTER STYLE ENTRY POINT

// 1. Design Tokens
@forward 'tokens/master';
@forward 'tokens/section-tokens.generated';

// 2. Core
@forward 'core/variables';
@forward 'core/mixins';
@forward 'core/animations';
@forward 'core/utilities';

// 3. Base/Reset
@forward 'reset/index';

// 4. Components
@forward 'components/ai-card-renderer';
@forward 'components/badges';
@forward 'components/card-actions';
@forward 'components/card-footer';
@forward 'components/empty-state';
@forward 'components/streaming-effects';

// 5. Sections
@forward 'components/sections/sections-base';
@forward 'components/sections/section-types.generated';

// 6. Layout
@forward 'layout/masonry';
@forward 'layout/feature-grid';
@forward 'layout/tilt';

// 7. Themes
@forward 'themes';
```

### Point 67: Delete Duplicate CSS Files

```bash
# Files to delete after verification
rm src/app/shared/components/cards/ai-card-renderer.component.css
rm src/app/shared/components/cards/masonry-grid/masonry-grid.component.css
rm src/app/shared/components/cards/card-skeleton/card-skeleton.component.css
rm src/app/shared/components/cards/card-streaming-indicator/card-streaming-indicator.component.css
rm src/app/shared/components/cards/card-header/card-header.component.css
rm src/app/shared/components/cards/card-actions/card-actions.component.css
rm src/app/shared/components/cards/card-section-list/card-section-list.component.css
```

### Point 68: Generate CSS Custom Properties from Registry

```scss
// projects/osi-cards-lib/src/lib/styles/tokens/_section-tokens.generated.scss
// AUTO-GENERATED FROM section-registry.json

:root {
  // Analytics Section
  --osi-section-analytics-bg: var(--surface-card);
  --osi-section-analytics-border: var(--border-subtle);
  --osi-section-analytics-title-color: var(--text-primary);
  --osi-section-analytics-metric-color: var(--text-accent);

  // Brand Colors Section
  --osi-section-brand-colors-bg: var(--surface-card);
  --osi-section-brand-colors-border: var(--border-subtle);
  --osi-section-brand-colors-swatch-size: 48px;

  // Chart Section
  --osi-section-chart-bg: var(--surface-card);
  --osi-section-chart-border: var(--border-subtle);
  --osi-section-chart-axis-color: var(--text-secondary);
  --osi-section-chart-grid-color: var(--border-subtle);

  // ... all sections
}
```

### Points 69-75: Style Infrastructure

**Point 69:** Theme generation system

**Point 70:** Style validation

**Point 71:** CSS-in-JS alternative

**Point 72:** Delete duplicate SCSS files

**Point 73:** Style documentation

**Point 74:** Critical CSS extraction

**Point 75:** Dark/light theme system

---

## Phase 6: Documentation & Build (Points 76-85)

### Point 76: Consolidate Documentation Folders

**Current State:**
```
docs/                          # 22 files
projects/osi-cards-lib/docs/   # 6 files (duplicates)
src/assets/docs/               # 5 files (duplicates)
```

**Step 76.1:** Create consolidation plan
```markdown
| File | Keep Location | Action |
|------|---------------|--------|
| SERVICES.md | docs/ | Delete from lib/docs, assets/docs |
| THEMING.md | docs/ | Rename to THEMING.md, delete others |
| EVENTS.md | docs/ | Copy from lib/docs, delete others |
| AGENTIC_FLOW.md | docs/ | Copy from lib/docs, delete others |
```

**Step 76.2:** Execute consolidation
```bash
# Copy unique files to docs/
cp projects/osi-cards-lib/docs/EVENTS.md docs/EVENTS.md
cp projects/osi-cards-lib/docs/AGENTIC_FLOW_INTEGRATION.md docs/AGENTIC_FLOW_INTEGRATION.md
cp projects/osi-cards-lib/docs/SHADOW_DOM_MIGRATION.md docs/SHADOW_DOM_MIGRATION.md

# Delete duplicates
rm projects/osi-cards-lib/docs/SERVICES.md
rm projects/osi-cards-lib/docs/THEMING.md
rm -rf src/assets/docs/
```

**Step 76.3:** Create symlinks for lib distribution
```bash
# In projects/osi-cards-lib/
mkdir -p docs
ln -s ../../../docs/SERVICES.md docs/SERVICES.md
ln -s ../../../docs/THEMING_GUIDE.md docs/THEMING.md
```

### Points 77-85: Documentation & Build Infrastructure

**Point 77:** Documentation generation pipeline

**Point 78:** Inline documentation standards

**Point 79:** API documentation generator

**Point 80:** Documentation testing

**Point 81:** Library build optimization

**Point 82:** Tree-shaking verification

**Point 83:** Secondary entry points

**Point 84:** Bundle size optimization

**Point 85:** Code splitting

---

## Phase 7: Testing & Quality (Points 86-95)

### Point 86: Create Shared Testing Utilities

```typescript
// projects/osi-cards-lib/src/lib/testing/index.ts
export * from './fixtures/card.fixtures';
export * from './fixtures/section.fixtures';
export * from './mocks/external-libs.mock';
export * from './utils/test-helpers';
export * from './utils/component-test.utils';
export * from './utils/service-test.utils';
```

```typescript
// projects/osi-cards-lib/src/lib/testing/utils/component-test.utils.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Type } from '@angular/core';
import { BaseSection } from '../../components/sections/base-section.component';
import { CardSection } from '../../models';
import { createMockSection } from '../fixtures/section.fixtures';

export interface SectionTestConfig {
  section?: Partial<CardSection>;
  providers?: any[];
  imports?: any[];
}

export async function createSectionTestBed<T extends BaseSection>(
  component: Type<T>,
  config: SectionTestConfig = {}
): Promise<ComponentFixture<T>> {
  await TestBed.configureTestingModule({
    imports: [component, ...(config.imports || [])],
    providers: config.providers || [],
  }).compileComponents();

  const fixture = TestBed.createComponent(component);
  fixture.componentInstance.section = createMockSection(
    fixture.componentInstance.sectionType,
    config.section
  );
  fixture.detectChanges();

  return fixture;
}

export function expectSectionToRender(fixture: ComponentFixture<BaseSection>): void {
  expect(fixture.nativeElement).toBeTruthy();
  expect(fixture.nativeElement.querySelector('.section-container')).toBeTruthy();
}

export function expectSectionTitle(
  fixture: ComponentFixture<BaseSection>,
  expected: string
): void {
  const title = fixture.nativeElement.querySelector('.section-title');
  expect(title?.textContent?.trim()).toBe(expected);
}
```

### Points 87-95: Testing Infrastructure

**Point 87:** Visual regression testing

**Point 88:** Contract tests

**Point 89:** Performance benchmarks

**Point 90:** Accessibility test suite

**Point 91:** Stricter TypeScript config

**Point 92:** ESLint architecture rules

**Point 93:** Code coverage requirements

**Point 94:** Architectural fitness functions

**Point 95:** Dependency review

---

## Phase 8: Advanced Optimizations (Points 96-100)

### Point 96: Micro-Frontend Support

```typescript
// projects/osi-cards-lib/src/lib/micro-frontend/remote-section.loader.ts
export interface RemoteSectionConfig {
  url: string;
  type: string;
  version: string;
  integrity?: string;
}

@Injectable({ providedIn: 'root' })
export class RemoteSectionLoader {
  private readonly loadedModules = new Map<string, Type<BaseSection>>();

  async loadRemoteSection(config: RemoteSectionConfig): Promise<Type<BaseSection>> {
    const cacheKey = `${config.url}@${config.version}`;

    if (this.loadedModules.has(cacheKey)) {
      return this.loadedModules.get(cacheKey)!;
    }

    const module = await this.loadModule(config);
    const component = this.extractComponent(module, config.type);

    this.loadedModules.set(cacheKey, component);
    return component;
  }

  private async loadModule(config: RemoteSectionConfig): Promise<unknown> {
    // Dynamic import with integrity check
  }

  private extractComponent(module: unknown, type: string): Type<BaseSection> {
    // Extract component from module
  }
}
```

### Point 97: Plugin Marketplace Structure

```typescript
// projects/osi-cards-lib/src/lib/plugins/plugin.interface.ts
export interface OsiCardsPlugin {
  name: string;
  version: string;
  description?: string;
  author?: string;
  repository?: string;

  sections?: SectionPlugin[];
  themes?: ThemePlugin[];
  services?: ServicePlugin[];

  onInit?: () => void | Promise<void>;
  onDestroy?: () => void | Promise<void>;
}

export interface SectionPlugin {
  type: string;
  component: Type<BaseSection>;
  metadata: SectionMetadata;
  styles?: string;
  dependencies?: string[];
}

export interface PluginManifest {
  plugins: OsiCardsPlugin[];
  compatibility: {
    minVersion: string;
    maxVersion?: string;
  };
}
```

### Point 98: Caching Strategy

```typescript
// projects/osi-cards-lib/src/lib/cache/section-cache.service.ts
export interface CacheConfig {
  maxSize: number;
  ttlMs: number;
  strategy: 'lru' | 'lfu' | 'fifo';
}

@Injectable({ providedIn: 'root' })
export class SectionCacheService {
  private readonly config: CacheConfig = {
    maxSize: 100,
    ttlMs: 5 * 60 * 1000, // 5 minutes
    strategy: 'lru',
  };

  private readonly cache = new Map<string, CachedSection>();
  private readonly accessOrder: string[] = [];

  get(key: string): CachedSection | null {
    const cached = this.cache.get(key);

    if (!cached) return null;

    if (this.isExpired(cached)) {
      this.cache.delete(key);
      return null;
    }

    this.updateAccessOrder(key);
    return cached;
  }

  set(key: string, section: CardSection, metadata?: CacheMetadata): void {
    if (this.cache.size >= this.config.maxSize) {
      this.evict();
    }

    this.cache.set(key, {
      section,
      metadata,
      timestamp: Date.now(),
      accessCount: 0,
    });

    this.accessOrder.push(key);
  }

  invalidate(pattern: string | RegExp): number {
    let count = 0;

    for (const key of this.cache.keys()) {
      if (typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.length = 0;
  }

  private isExpired(cached: CachedSection): boolean {
    return Date.now() - cached.timestamp > this.config.ttlMs;
  }

  private evict(): void {
    switch (this.config.strategy) {
      case 'lru':
        this.evictLRU();
        break;
      case 'lfu':
        this.evictLFU();
        break;
      case 'fifo':
        this.evictFIFO();
        break;
    }
  }

  private evictLRU(): void {
    const oldest = this.accessOrder.shift();
    if (oldest) this.cache.delete(oldest);
  }

  private evictLFU(): void {
    let minAccess = Infinity;
    let minKey: string | null = null;

    for (const [key, cached] of this.cache.entries()) {
      if (cached.accessCount < minAccess) {
        minAccess = cached.accessCount;
        minKey = key;
      }
    }

    if (minKey) this.cache.delete(minKey);
  }

  private evictFIFO(): void {
    const first = this.cache.keys().next().value;
    if (first) this.cache.delete(first);
  }

  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }
}
```

### Point 99: Performance Monitoring Dashboard

```typescript
// src/app/features/performance-dashboard/performance-dashboard.component.ts
@Component({
  selector: 'app-performance-dashboard',
  template: `
    <div class="dashboard">
      <section class="metrics">
        <h2>Section Render Times</h2>
        <table>
          <thead>
            <tr>
              <th>Section Type</th>
              <th>Avg Render (ms)</th>
              <th>Max Render (ms)</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            @for (metric of sectionMetrics(); track metric.type) {
              <tr>
                <td>{{ metric.type }}</td>
                <td>{{ metric.avgRender | number:'1.2-2' }}</td>
                <td>{{ metric.maxRender | number:'1.2-2' }}</td>
                <td>{{ metric.count }}</td>
              </tr>
            }
          </tbody>
        </table>
      </section>

      <section class="cache-stats">
        <h2>Cache Statistics</h2>
        <div class="stat">
          <span>Hit Rate:</span>
          <span>{{ cacheHitRate() | percent }}</span>
        </div>
        <div class="stat">
          <span>Size:</span>
          <span>{{ cacheSize() }}</span>
        </div>
      </section>
    </div>
  `,
})
export class PerformanceDashboardComponent {
  private readonly perfService = inject(PerformanceMonitoringService);
  private readonly cacheService = inject(SectionCacheService);

  readonly sectionMetrics = computed(() => this.perfService.getSectionMetrics());
  readonly cacheHitRate = computed(() => this.perfService.getCacheHitRate());
  readonly cacheSize = computed(() => this.cacheService.size);
}
```

### Point 100: Gradual Rollout System

```typescript
// projects/osi-cards-lib/src/lib/rollout/rollout.service.ts
export interface RolloutRule {
  feature: string;
  percentage: number;
  targeting?: TargetingRule[];
  startDate?: Date;
  endDate?: Date;
}

export interface TargetingRule {
  attribute: string;
  operator: 'eq' | 'neq' | 'contains' | 'regex';
  value: string | number | boolean;
}

export interface RolloutContext {
  userId?: string;
  userGroup?: string;
  environment?: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class RolloutService {
  private readonly rules = new Map<string, RolloutRule>();

  configure(rules: RolloutRule[]): void {
    for (const rule of rules) {
      this.rules.set(rule.feature, rule);
    }
  }

  isEnabled(feature: string, context?: RolloutContext): boolean {
    const rule = this.rules.get(feature);

    if (!rule) return false;

    // Check date range
    if (rule.startDate && new Date() < rule.startDate) return false;
    if (rule.endDate && new Date() > rule.endDate) return false;

    // Check targeting rules
    if (rule.targeting && context) {
      const matchesTargeting = rule.targeting.every(t =>
        this.evaluateTargetingRule(t, context)
      );
      if (!matchesTargeting) return false;
    }

    // Percentage rollout
    if (rule.percentage < 100) {
      const hash = this.hashContext(feature, context);
      return hash < rule.percentage;
    }

    return true;
  }

  private evaluateTargetingRule(rule: TargetingRule, context: RolloutContext): boolean {
    const value = context[rule.attribute];

    switch (rule.operator) {
      case 'eq':
        return value === rule.value;
      case 'neq':
        return value !== rule.value;
      case 'contains':
        return String(value).includes(String(rule.value));
      case 'regex':
        return new RegExp(String(rule.value)).test(String(value));
      default:
        return false;
    }
  }

  private hashContext(feature: string, context?: RolloutContext): number {
    const str = feature + JSON.stringify(context || {});
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 100;
  }
}
```

---

## Implementation Checklist

### Week 1-2: Foundation
- [ ] Points 1-5 completed
- [ ] Points 6-10 completed
- [ ] Points 11-15 completed

### Week 3-4: Sections
- [ ] Points 16-20 completed
- [ ] Points 21-25 completed
- [ ] Points 26-30 completed
- [ ] Points 31-35 completed

### Week 5-6: Services
- [ ] Points 36-40 completed
- [ ] Points 41-45 completed
- [ ] Points 46-50 completed

### Week 7-8: Components
- [ ] Points 51-55 completed
- [ ] Points 56-60 completed
- [ ] Points 61-65 completed

### Week 9: Styles
- [ ] Points 66-70 completed
- [ ] Points 71-75 completed

### Week 10: Documentation
- [ ] Points 76-80 completed
- [ ] Points 81-85 completed

### Week 11: Testing
- [ ] Points 86-90 completed
- [ ] Points 91-95 completed

### Week 12: Advanced
- [ ] Points 96-100 completed

---

*Total Estimated Time: 200 hours (12 weeks)*
*Last Updated: December 1, 2025*

