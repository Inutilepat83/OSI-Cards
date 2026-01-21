import { Injectable, Type, inject } from '@angular/core';
import { CardSection } from '@osi-cards/models';
import { BaseSectionComponent } from '@osi-cards/lib/components/sections/base-section.component';
import { SectionPluginRegistry } from '@osi-cards/services';
import { safeDebugFetch } from '@osi-cards/utils';
import {
  SectionType,
  SectionTypeInput,
  resolveSectionType,
  isValidSectionType,
  getSectionMetadata,
} from '@osi-cards/models';
import { SECTION_COMPONENT_MAP, getSectionComponent } from './section-component-map.generated';
import {
  LazySectionLoaderService,
  LazySectionType,
  LAZY_SECTION_TYPES,
} from './lazy-section-loader.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySectionComponent = Type<BaseSectionComponent<any>>;

/** Result of component resolution - can be sync or async */
export interface ComponentResolution {
  /** The component class (null if lazy and not yet loaded) */
  component: AnySectionComponent | null;
  /** Whether this is a lazy-loaded section */
  isLazy: boolean;
  /** Promise that resolves to the component (for lazy sections) */
  loadPromise?: Promise<AnySectionComponent>;
}

/**
 * Service for dynamically loading section components
 *
 * This service replaces the switch statement approach with a registry-based
 * dynamic component resolution system. It supports:
 * - Registry-based component mapping
 * - Type alias resolution
 * - Plugin component overrides
 * - Fallback to default component for unknown types
 */
@Injectable({
  providedIn: 'root',
})
export class DynamicSectionLoaderService {
  private readonly pluginRegistry = inject(SectionPluginRegistry);
  private readonly lazySectionLoader = inject(LazySectionLoaderService);
  private readonly componentCache = new Map<string, AnySectionComponent>();

  /**
   * Get the component class for a section
   *
   * Resolution order:
   * 1. Check plugin registry for custom overrides
   * 2. Resolve type aliases to canonical types
   * 3. Look up in generated component map
   * 4. Fall back to OverviewSectionComponent
   */
  getComponentForSection(section: CardSection): AnySectionComponent {
    // #region agent log
    if (typeof window !== 'undefined') {
      safeDebugFetch('http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc', {
        location: 'dynamic-section-loader.service.ts:59',
        message: 'getComponentForSection called',
        data: {
          sectionType: section?.type,
          baseClassAvailable: typeof BaseSectionComponent !== 'undefined',
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'E',
      });
    }
    // #endregion
    if (!section?.type) {
      return this.getFallbackComponent();
    }

    const cacheKey = section.type.toLowerCase();

    // Check cache first
    if (this.componentCache.has(cacheKey)) {
      return this.componentCache.get(cacheKey)!;
    }

    // Check plugin registry for custom components
    const pluginComponent = this.pluginRegistry.getComponentForSection(section);
    if (pluginComponent) {
      this.componentCache.set(cacheKey, pluginComponent);
      return pluginComponent;
    }

    // Resolve type alias and get component from generated map
    const typeInput = section.type.toLowerCase() as SectionTypeInput;

    if (isValidSectionType(typeInput)) {
      const resolvedType = resolveSectionType(typeInput);
      const component = getSectionComponent(resolvedType);
      // #region agent log
      if (typeof window !== 'undefined') {
        safeDebugFetch('http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc', {
          location: 'dynamic-section-loader.service.ts:85',
          message: 'Component retrieved from map',
          data: {
            resolvedType,
            componentAvailable: typeof component !== 'undefined',
            componentName: component?.name || 'undefined',
            isBaseSectionComponent: component?.prototype instanceof BaseSectionComponent,
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'E',
        });
      }
      // #endregion

      if (component) {
        this.componentCache.set(cacheKey, component);
        return component;
      }
    }

    // Fall back to fallback component
    return this.getFallbackComponent();
  }

  /**
   * Get the fallback component for unknown types
   */
  private getFallbackComponent(): AnySectionComponent {
    return SECTION_COMPONENT_MAP['list'];
  }

  /**
   * Resolve a section type to its canonical form
   */
  resolveType(type: string): SectionType {
    const typeInput = type.toLowerCase() as SectionTypeInput;

    if (isValidSectionType(typeInput)) {
      return resolveSectionType(typeInput);
    }

    return 'overview';
  }

  /**
   * Check if a type is supported (either built-in or via plugin)
   */
  isTypeSupported(type: string): boolean {
    const typeInput = type.toLowerCase();

    // Check built-in types
    if (isValidSectionType(typeInput as SectionTypeInput)) {
      return true;
    }

    // Check plugin registry
    return this.pluginRegistry.hasPlugin(typeInput);
  }

  /**
   * Get metadata for a section type
   */
  getTypeMetadata(type: string) {
    const typeInput = type.toLowerCase() as SectionTypeInput;

    if (isValidSectionType(typeInput)) {
      return getSectionMetadata(typeInput);
    }

    return undefined;
  }

  /**
   * Clear the component cache (useful for testing or hot reload)
   */
  clearCache(): void {
    this.componentCache.clear();
  }

  /**
   * Get all supported section types (built-in + plugins)
   */
  getSupportedTypes(): string[] {
    const builtInTypes = Object.keys(SECTION_COMPONENT_MAP);
    const pluginTypes = this.pluginRegistry.getPlugins().map((p) => p.type);

    return [...new Set([...builtInTypes, ...pluginTypes])];
  }

  // ============================================================================
  // LAZY LOADING SUPPORT
  // ============================================================================

  /**
   * Check if a section type should be lazy loaded
   *
   * Lazy sections are those that depend on heavy external libraries
   * (e.g., Chart.js for charts, Leaflet for maps)
   */
  isLazySection(type: string): boolean {
    const resolvedType = this.resolveType(type);
    return LAZY_SECTION_TYPES.includes(resolvedType as LazySectionType);
  }

  /**
   * Get component resolution info for a section
   *
   * Returns both the component (if available) and loading state info.
   * Use this for async-aware component loading.
   */
  resolveComponent(section: CardSection): ComponentResolution {
    if (!section?.type) {
      return {
        component: this.getFallbackComponent(),
        isLazy: false,
      };
    }

    const typeInput = section.type.toLowerCase();
    const resolvedType = this.resolveType(typeInput);

    // Check if this is a lazy section
    if (this.lazySectionLoader.isLazySection(resolvedType)) {
      const lazyType = resolvedType as LazySectionType;
      const cachedComponent = this.lazySectionLoader.getCachedComponent(lazyType);

      if (cachedComponent) {
        return {
          component: cachedComponent,
          isLazy: true,
        };
      }

      return {
        component: null,
        isLazy: true,
        loadPromise: this.lazySectionLoader.loadSection(lazyType),
      };
    }

    // Non-lazy section - use sync loading
    return {
      component: this.getComponentForSection(section),
      isLazy: false,
    };
  }

  /**
   * Async version of getComponentForSection
   *
   * Handles both sync and lazy-loaded components
   */
  async getComponentForSectionAsync(section: CardSection): Promise<AnySectionComponent> {
    const resolution = this.resolveComponent(section);

    if (resolution.component) {
      return resolution.component;
    }

    if (resolution.loadPromise) {
      return resolution.loadPromise;
    }

    return this.getFallbackComponent();
  }

  /**
   * Preload lazy sections for anticipated use
   */
  preloadLazySections(): void {
    this.lazySectionLoader.preloadAll();
  }

  /**
   * Preload a specific lazy section type
   */
  preloadSection(type: LazySectionType): void {
    this.lazySectionLoader.preload(type);
  }

  /**
   * Get loading state for a lazy section
   */
  getLazyLoadingState(type: LazySectionType) {
    return this.lazySectionLoader.getLoadingState(type);
  }
}
