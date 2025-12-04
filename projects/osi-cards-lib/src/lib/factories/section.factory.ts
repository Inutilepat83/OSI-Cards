import { Injectable, Type, inject } from '@angular/core';
import { SectionPluginRegistry } from '../services/section-plugin-registry.service';

/**
 * Section types supported by the library
 */
export type SectionType =
  | 'analytics'
  | 'brand-colors'
  | 'chart'
  | 'contact-card'
  | 'event'
  | 'fallback'
  | 'financials'
  | 'info'
  | 'list'
  | 'map'
  | 'network-card'
  | 'news'
  | 'overview'
  | 'product'
  | 'quotation'
  | 'social-media'
  | 'solutions'
  | 'text-reference';

/**
 * Section metadata
 */
export interface SectionMetadata {
  type: SectionType;
  displayName: string;
  description?: string;
  category?: string;
  icon?: string;
  defaultColumnSpan?: number;
  maxColumnSpan?: number;
  supportedFields?: string[];
}

/**
 * Section registry entry
 */
interface SectionRegistryEntry {
  type: SectionType;
  loader: () => Promise<Type<unknown>>;
  metadata: SectionMetadata;
}

/**
 * Factory for creating and managing section components.
 * Provides a centralized way to load sections from the library.
 *
 * @example
 * ```typescript
 * const factory = inject(SectionFactory);
 *
 * // Get component type
 * const component = await factory.createSection('analytics');
 *
 * // Check if type is valid
 * if (factory.hasSection('chart')) {
 *   // ...
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class SectionFactory {
  private readonly pluginRegistry = inject(SectionPluginRegistry);
  private readonly registry = new Map<SectionType, SectionRegistryEntry>();
  private readonly cache = new Map<SectionType, Type<unknown>>();

  constructor() {
    this.initializeRegistry();
  }

  /**
   * Initialize the section registry with all built-in sections
   */
  private initializeRegistry(): void {
    const sections: SectionRegistryEntry[] = [
      {
        type: 'analytics',
        loader: () =>
          import('../components/sections/analytics-section/analytics-section.component').then(
            (m) => m.AnalyticsSectionComponent
          ),
        metadata: {
          type: 'analytics',
          displayName: 'Analytics',
          description: 'Display metrics and KPIs',
          category: 'data-visualization',
          icon: 'chart-bar',
          defaultColumnSpan: 2,
        },
      },
      {
        type: 'brand-colors',
        loader: () =>
          import('../components/sections/brand-colors-section/brand-colors-section.component').then(
            (m) => m.BrandColorsSectionComponent
          ),
        metadata: {
          type: 'brand-colors',
          displayName: 'Brand Colors',
          description: 'Display brand color palette',
          category: 'branding',
          icon: 'palette',
          defaultColumnSpan: 1,
        },
      },
      {
        type: 'chart',
        loader: () =>
          import('../components/sections/chart-section/chart-section.component').then(
            (m) => m.ChartSectionComponent
          ),
        metadata: {
          type: 'chart',
          displayName: 'Chart',
          description: 'Display data visualizations',
          category: 'data-visualization',
          icon: 'chart-pie',
          defaultColumnSpan: 2,
        },
      },
      {
        type: 'contact-card',
        loader: () =>
          import('../components/sections/contact-card-section/contact-card-section.component').then(
            (m) => m.ContactCardSectionComponent
          ),
        metadata: {
          type: 'contact-card',
          displayName: 'Contact Card',
          description: 'Display contact information',
          category: 'contact',
          icon: 'user',
          defaultColumnSpan: 1,
        },
      },
      {
        type: 'event',
        loader: () =>
          import('../components/sections/event-section/event-section.component').then(
            (m) => m.EventSectionComponent
          ),
        metadata: {
          type: 'event',
          displayName: 'Event',
          description: 'Display event information',
          category: 'content',
          icon: 'calendar',
          defaultColumnSpan: 1,
        },
      },
      {
        type: 'fallback',
        loader: () =>
          import('../components/sections/fallback-section/fallback-section.component').then(
            (m) => m.FallbackSectionComponent
          ),
        metadata: {
          type: 'fallback',
          displayName: 'Fallback',
          description: 'Fallback for unknown section types',
          category: 'system',
          icon: 'alert-circle',
          defaultColumnSpan: 1,
        },
      },
      {
        type: 'financials',
        loader: () =>
          import('../components/sections/financials-section/financials-section.component').then(
            (m) => m.FinancialsSectionComponent
          ),
        metadata: {
          type: 'financials',
          displayName: 'Financials',
          description: 'Display financial data',
          category: 'data-visualization',
          icon: 'dollar-sign',
          defaultColumnSpan: 2,
        },
      },
      {
        type: 'info',
        loader: () =>
          import('../components/sections/info-section/info-section.component').then(
            (m) => m.InfoSectionComponent
          ),
        metadata: {
          type: 'info',
          displayName: 'Info',
          description: 'Display general information',
          category: 'content',
          icon: 'info',
          defaultColumnSpan: 1,
        },
      },
      {
        type: 'list',
        loader: () =>
          import('../components/sections/list-section/list-section.component').then(
            (m) => m.ListSectionComponent
          ),
        metadata: {
          type: 'list',
          displayName: 'List',
          description: 'Display lists of items',
          category: 'content',
          icon: 'list',
          defaultColumnSpan: 1,
        },
      },
      {
        type: 'map',
        loader: () =>
          import('../components/sections/map-section/map-section.component').then(
            (m) => m.MapSectionComponent
          ),
        metadata: {
          type: 'map',
          displayName: 'Map',
          description: 'Display location maps',
          category: 'location',
          icon: 'map-pin',
          defaultColumnSpan: 2,
        },
      },
      {
        type: 'network-card',
        loader: () =>
          import('../components/sections/network-card-section/network-card-section.component').then(
            (m) => m.NetworkCardSectionComponent
          ),
        metadata: {
          type: 'network-card',
          displayName: 'Network Card',
          description: 'Display network/relationship information',
          category: 'network',
          icon: 'share-2',
          defaultColumnSpan: 1,
        },
      },
      {
        type: 'news',
        loader: () =>
          import('../components/sections/news-section/news-section.component').then(
            (m) => m.NewsSectionComponent
          ),
        metadata: {
          type: 'news',
          displayName: 'News',
          description: 'Display news articles',
          category: 'content',
          icon: 'newspaper',
          defaultColumnSpan: 2,
        },
      },
      {
        type: 'overview',
        loader: () =>
          import('../components/sections/overview-section/overview-section.component').then(
            (m) => m.OverviewSectionComponent
          ),
        metadata: {
          type: 'overview',
          displayName: 'Overview',
          description: 'Display overview information',
          category: 'content',
          icon: 'file-text',
          defaultColumnSpan: 2,
        },
      },
      {
        type: 'product',
        loader: () =>
          import('../components/sections/product-section/product-section.component').then(
            (m) => m.ProductSectionComponent
          ),
        metadata: {
          type: 'product',
          displayName: 'Product',
          description: 'Display product information',
          category: 'commerce',
          icon: 'package',
          defaultColumnSpan: 1,
        },
      },
      {
        type: 'quotation',
        loader: () =>
          import('../components/sections/quotation-section/quotation-section.component').then(
            (m) => m.QuotationSectionComponent
          ),
        metadata: {
          type: 'quotation',
          displayName: 'Quotation',
          description: 'Display quotes',
          category: 'content',
          icon: 'quote',
          defaultColumnSpan: 1,
        },
      },
      {
        type: 'social-media',
        loader: () =>
          import('../components/sections/social-media-section/social-media-section.component').then(
            (m) => m.SocialMediaSectionComponent
          ),
        metadata: {
          type: 'social-media',
          displayName: 'Social Media',
          description: 'Display social media links',
          category: 'social',
          icon: 'share',
          defaultColumnSpan: 1,
        },
      },
      {
        type: 'solutions',
        loader: () =>
          import('../components/sections/solutions-section/solutions-section.component').then(
            (m) => m.SolutionsSectionComponent
          ),
        metadata: {
          type: 'solutions',
          displayName: 'Solutions',
          description: 'Display solution offerings',
          category: 'commerce',
          icon: 'lightbulb',
          defaultColumnSpan: 2,
        },
      },
      {
        type: 'text-reference',
        loader: () =>
          import('../components/sections/text-reference-section/text-reference-section.component').then(
            (m) => m.TextReferenceSectionComponent
          ),
        metadata: {
          type: 'text-reference',
          displayName: 'Text Reference',
          description: 'Display text with references',
          category: 'content',
          icon: 'link',
          defaultColumnSpan: 1,
        },
      },
    ];

    for (const section of sections) {
      this.registry.set(section.type, section);
    }
  }

  /**
   * Get the component class for a section type.
   * Returns FallbackSection if type is not found.
   */
  async createSection(type: SectionType | string): Promise<Type<unknown>> {
    const sectionType = type as SectionType;

    // Check cache first
    if (this.cache.has(sectionType)) {
      return this.cache.get(sectionType)!;
    }

    // Check plugin registry for custom sections
    const pluginComponent = this.pluginRegistry.getComponent(type);
    if (pluginComponent) {
      return pluginComponent;
    }

    // Check built-in registry
    const entry = this.registry.get(sectionType);
    if (!entry) {
      console.warn(`Unknown section type: ${type}, using fallback`);
      return this.createSection('fallback');
    }

    try {
      const component = await entry.loader();
      this.cache.set(sectionType, component);
      return component;
    } catch (error) {
      console.error(`Failed to load section: ${type}`, error);
      return this.createSection('fallback');
    }
  }

  /**
   * Check if a section type is registered.
   */
  hasSection(type: string): type is SectionType {
    return this.registry.has(type as SectionType) || this.pluginRegistry.hasPlugin(type);
  }

  /**
   * Get metadata for a section type.
   */
  getSectionMetadata(type: SectionType): SectionMetadata | undefined {
    const entry = this.registry.get(type);
    return entry?.metadata;
  }

  /**
   * Get all registered section types.
   */
  getAvailableSections(): SectionType[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Get sections by category.
   */
  getSectionsByCategory(category: string): SectionType[] {
    return Array.from(this.registry.entries())
      .filter(([_, entry]) => entry.metadata.category === category)
      .map(([type]) => type);
  }

  /**
   * Get the default column span for a section type.
   */
  getDefaultColumnSpan(type: SectionType): number {
    const metadata = this.getSectionMetadata(type);
    return metadata?.defaultColumnSpan ?? 1;
  }

  /**
   * Get all section categories.
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    for (const entry of this.registry.values()) {
      if (entry.metadata.category) {
        categories.add(entry.metadata.category);
      }
    }
    return Array.from(categories);
  }

  /**
   * Preload specific section types.
   */
  async preload(types: SectionType[]): Promise<void> {
    await Promise.all(types.map((type) => this.createSection(type)));
  }

  /**
   * Preload all section types.
   */
  async preloadAll(): Promise<void> {
    await this.preload(this.getAvailableSections());
  }

  /**
   * Clear the component cache.
   */
  clearCache(): void {
    this.cache.clear();
  }
}
