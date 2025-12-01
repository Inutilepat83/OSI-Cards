/**
 * Lazy Section Loader Service
 *
 * Provides code splitting for section components by loading them on demand.
 * This reduces initial bundle size by deferring loading of heavy sections
 * (like chart and map sections) until they're actually needed.
 *
 * @example
 * ```typescript
 * const loader = inject(LazySectionLoaderService);
 *
 * // Load a section component lazily
 * const component = await loader.loadSection('chart');
 * ```
 *
 * @module components/section-renderer/lazy-section-loader
 */

import { Injectable, Type, signal, computed, inject } from '@angular/core';
import { CardSection } from '../../models';
import { BaseSectionComponent } from '../sections/base-section.component';
import { SectionType, isValidSectionType, resolveSectionType, SectionTypeInput } from '../../models/generated-section-types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySectionComponent = Type<BaseSectionComponent<any>>;

/**
 * Lazy load result
 */
interface LazyLoadResult {
  component: AnySectionComponent | null;
  error: Error | null;
  loadTimeMs: number;
}

/**
 * Section categories for lazy loading
 */
type SectionCategory = 'core' | 'chart' | 'map' | 'complex' | 'simple';

/**
 * Section category configuration
 */
const SECTION_CATEGORIES: Record<SectionType, SectionCategory> = {
  // Core sections - always loaded
  'info': 'core',
  'analytics': 'core',
  'list': 'core',
  'overview': 'core',
  'fallback': 'core',

  // Chart sections - requires chart.js
  'chart': 'chart',

  // Map sections - requires leaflet
  'map': 'map',

  // Complex sections - lazy loaded for performance
  'financials': 'complex',
  'contact-card': 'complex',
  'network-card': 'complex',
  'social-media': 'complex',

  // Simple sections - loaded on demand
  'event': 'simple',
  'product': 'simple',
  'solutions': 'simple',
  'quotation': 'simple',
  'text-reference': 'simple',
  'brand-colors': 'simple',
  'news': 'simple'
};

/**
 * Lazy section loader service for code splitting
 */
@Injectable({
  providedIn: 'root'
})
export class LazySectionLoaderService {
  // Cache for loaded components
  private readonly componentCache = new Map<string, AnySectionComponent>();

  // Loading promises to prevent duplicate loads
  private readonly loadingPromises = new Map<string, Promise<AnySectionComponent>>();

  // State signals
  private readonly _loadedCategories = signal<Set<SectionCategory>>(new Set(['core']));
  private readonly _loadingCategory = signal<SectionCategory | null>(null);
  private readonly _loadStats = signal<Map<string, number>>(new Map());

  /**
   * Categories that have been loaded
   */
  readonly loadedCategories = this._loadedCategories.asReadonly();

  /**
   * Currently loading category (if any)
   */
  readonly loadingCategory = this._loadingCategory.asReadonly();

  /**
   * Whether chart sections are loaded
   */
  readonly isChartLoaded = computed(() => this._loadedCategories().has('chart'));

  /**
   * Whether map sections are loaded
   */
  readonly isMapLoaded = computed(() => this._loadedCategories().has('map'));

  /**
   * Load statistics
   */
  readonly loadStats = this._loadStats.asReadonly();

  constructor() {
    // Pre-load core sections synchronously
    this.preloadCoreComponents();
  }

  /**
   * Load a section component (lazy or from cache)
   */
  async loadSection(type: SectionType): Promise<AnySectionComponent> {
    // Check cache first
    if (this.componentCache.has(type)) {
      return this.componentCache.get(type)!;
    }

    // Check if already loading
    if (this.loadingPromises.has(type)) {
      return this.loadingPromises.get(type)!;
    }

    // Start loading
    const loadPromise = this.loadSectionInternal(type);
    this.loadingPromises.set(type, loadPromise);

    try {
      const component = await loadPromise;
      this.componentCache.set(type, component);
      return component;
    } finally {
      this.loadingPromises.delete(type);
    }
  }

  /**
   * Load all components for a category
   */
  async loadCategory(category: SectionCategory): Promise<void> {
    if (this._loadedCategories().has(category)) {
      return;
    }

    this._loadingCategory.set(category);

    try {
      const types = Object.entries(SECTION_CATEGORIES)
        .filter(([_, cat]) => cat === category)
        .map(([type]) => type as SectionType);

      await Promise.all(types.map(type => this.loadSection(type)));

      this._loadedCategories.update(cats => {
        const newCats = new Set(cats);
        newCats.add(category);
        return newCats;
      });
    } finally {
      this._loadingCategory.set(null);
    }
  }

  /**
   * Preload components for likely-needed sections
   */
  async preloadSections(types: SectionType[]): Promise<void> {
    await Promise.all(types.map(type => this.loadSection(type)));
  }

  /**
   * Check if a section type is loaded
   */
  isLoaded(type: SectionType): boolean {
    return this.componentCache.has(type);
  }

  /**
   * Get category for a section type
   */
  getCategory(type: SectionType): SectionCategory {
    return SECTION_CATEGORIES[type] ?? 'simple';
  }

  /**
   * Get component synchronously (returns null if not loaded)
   */
  getSync(type: SectionType): AnySectionComponent | null {
    return this.componentCache.get(type) ?? null;
  }

  /**
   * Clear cache and reset state
   */
  reset(): void {
    this.componentCache.clear();
    this.loadingPromises.clear();
    this._loadedCategories.set(new Set(['core']));
    this._loadStats.set(new Map());
    this.preloadCoreComponents();
  }

  /**
   * Internal loading implementation with lazy imports
   */
  private async loadSectionInternal(type: SectionType): Promise<AnySectionComponent> {
    const startTime = performance.now();

    try {
      const component = await this.dynamicImport(type);

      // Track load time
      const loadTime = performance.now() - startTime;
      this._loadStats.update(stats => {
        const newStats = new Map(stats);
        newStats.set(type, loadTime);
        return newStats;
      });

      return component;
    } catch (error) {
      console.warn(`[LazySectionLoader] Failed to load section: ${type}`, error);
      // Return fallback on error
      return this.getFallbackComponent();
    }
  }

  /**
   * Dynamic import for each section type
   * Note: These imports enable tree-shaking and code splitting
   */
  private async dynamicImport(type: SectionType): Promise<AnySectionComponent> {
    switch (type) {
      // Core sections - synchronous import (already bundled)
      case 'info':
        return (await import('../sections/info-section.component')).InfoSectionComponent;

      case 'analytics':
        return (await import('../sections/analytics-section/analytics-section.component')).AnalyticsSectionComponent;

      case 'list':
        return (await import('../sections/list-section/list-section.component')).ListSectionComponent;

      case 'overview':
        return (await import('../sections/overview-section/overview-section.component')).OverviewSectionComponent;

      // Chart section - requires chart.js
      case 'chart':
        return (await import('../sections/chart-section/chart-section.component')).ChartSectionComponent;

      // Map section - requires leaflet
      case 'map':
        return (await import('../sections/map-section/map-section.component')).MapSectionComponent;

      // Complex sections
      case 'financials':
        return (await import('../sections/financials-section/financials-section.component')).FinancialsSectionComponent;

      case 'contact-card':
        return (await import('../sections/contact-card-section/contact-card-section.component')).ContactCardSectionComponent;

      case 'network-card':
        return (await import('../sections/network-card-section/network-card-section.component')).NetworkCardSectionComponent;

      case 'social-media':
        return (await import('../sections/social-media-section/social-media-section.component')).SocialMediaSectionComponent;

      // Simple sections
      case 'event':
        return (await import('../sections/event-section/event-section.component')).EventSectionComponent;

      case 'product':
        return (await import('../sections/product-section/product-section.component')).ProductSectionComponent;

      case 'solutions':
        return (await import('../sections/solutions-section/solutions-section.component')).SolutionsSectionComponent;

      case 'quotation':
        return (await import('../sections/quotation-section/quotation-section.component')).QuotationSectionComponent;

      case 'text-reference':
        return (await import('../sections/text-reference-section/text-reference-section.component')).TextReferenceSectionComponent;

      case 'brand-colors':
        return (await import('../sections/brand-colors-section/brand-colors-section.component')).BrandColorsSectionComponent;

      case 'news':
        return (await import('../sections/news-section/news-section.component')).NewsSectionComponent;

      case 'fallback':
      default:
        return this.getFallbackComponent();
    }
  }

  /**
   * Pre-load core components
   */
  private preloadCoreComponents(): void {
    // Core components are loaded synchronously on startup
    // This ensures they're available immediately
    const coreTypes: SectionType[] = ['info', 'analytics', 'list', 'overview', 'fallback'];

    // Load them asynchronously but don't await
    coreTypes.forEach(type => {
      this.loadSection(type).catch(() => {
        // Ignore errors during preload
      });
    });
  }

  /**
   * Get fallback component
   */
  private async getFallbackComponent(): Promise<AnySectionComponent> {
    return (await import('../sections/fallback-section/fallback-section.component')).FallbackSectionComponent;
  }
}


