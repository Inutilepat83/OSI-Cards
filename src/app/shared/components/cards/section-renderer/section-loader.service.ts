import { inject, Injectable, Type } from '@angular/core';
import { SectionComponentRegistryService } from './section-component-registry.service';
import { SectionComponentInstance } from './section-component.interface';

/**
 * Section component loader service
 * Handles lazy loading of section components to reduce initial bundle size.
 * Now uses registry-based strategy pattern instead of switch statement.
 *
 * CONSOLIDATED: All sections now load from @osi-cards/lib (single source of truth)
 */
@Injectable({
  providedIn: 'root',
})
export class SectionLoaderService {
  private componentCache = new Map<string, Promise<Type<SectionComponentInstance>>>();
  private readonly registry = inject(SectionComponentRegistryService);

  constructor() {
    this.initializeRegistry();
  }

  /**
   * Initialize the component registry with all section types
   * All sections load from the library (projects/osi-cards-lib)
   */
  private initializeRegistry(): void {
    // Info section - from library
    this.registry.register('info', {
      canHandle: () => true,
      loadComponent: async () =>
        (
          await import('projects/osi-cards-lib/src/lib/components/sections/overview-section/overview-section.component')
        ).OverviewSectionComponent,
    });

    // Analytics section - from library
    this.registry.register(
      'analytics',
      {
        canHandle: () => true,
        loadComponent: async () =>
          (
            await import('projects/osi-cards-lib/src/lib/components/sections/analytics-section/analytics-section.component')
          ).AnalyticsSectionComponent,
      },
      ['metrics', 'stats']
    );

    // Financials section - from library
    this.registry.register('financials', {
      canHandle: () => true,
      loadComponent: async () =>
        (
          await import('projects/osi-cards-lib/src/lib/components/sections/financials-section/financials-section.component')
        ).FinancialsSectionComponent,
    });

    // List section - from library
    this.registry.register(
      'list',
      {
        canHandle: () => true,
        loadComponent: async () =>
          (
            await import('projects/osi-cards-lib/src/lib/components/sections/list-section/list-section.component')
          ).ListSectionComponent,
      },
      []
    );

    // Table section - from library
    this.registry.register(
      'table',
      {
        canHandle: () => true,
        loadComponent: async () =>
          (
            await import('projects/osi-cards-lib/src/lib/components/sections/table-section/table-section.component')
          ).TableSectionComponent,
      },
      ['data-table', 'grid']
    );

    // Event section - from library
    this.registry.register(
      'event',
      {
        canHandle: () => true,
        loadComponent: async () =>
          (
            await import('projects/osi-cards-lib/src/lib/components/sections/event-section/event-section.component')
          ).EventSectionComponent,
      },
      ['timeline']
    );

    // Product section - from library
    this.registry.register('product', {
      canHandle: () => true,
      loadComponent: async () =>
        (
          await import('projects/osi-cards-lib/src/lib/components/sections/product-section/product-section.component')
        ).ProductSectionComponent,
    });

    // Solutions section - from library
    this.registry.register('solutions', {
      canHandle: () => true,
      loadComponent: async () =>
        (
          await import('projects/osi-cards-lib/src/lib/components/sections/solutions-section/solutions-section.component')
        ).SolutionsSectionComponent,
    });

    // Contact card section - from library
    this.registry.register('contact-card', {
      canHandle: () => true,
      loadComponent: async () =>
        (
          await import('projects/osi-cards-lib/src/lib/components/sections/contact-card-section/contact-card-section.component')
        ).ContactCardSectionComponent,
    });

    // Network card section - from library
    this.registry.register('network-card', {
      canHandle: () => true,
      loadComponent: async () =>
        (
          await import('projects/osi-cards-lib/src/lib/components/sections/network-card-section/network-card-section.component')
        ).NetworkCardSectionComponent,
    });

    // Map section - from library
    this.registry.register(
      'map',
      {
        canHandle: () => true,
        loadComponent: async () =>
          (
            await import('projects/osi-cards-lib/src/lib/components/sections/map-section/map-section.component')
          ).MapSectionComponent,
      },
      ['locations']
    );

    // Chart section - from library
    this.registry.register('chart', {
      canHandle: () => true,
      loadComponent: async () =>
        (
          await import('projects/osi-cards-lib/src/lib/components/sections/chart-section/chart-section.component')
        ).ChartSectionComponent,
    });

    // Quotation section - from library
    this.registry.register(
      'quotation',
      {
        canHandle: () => true,
        loadComponent: async () =>
          (
            await import('projects/osi-cards-lib/src/lib/components/sections/quotation-section/quotation-section.component')
          ).QuotationSectionComponent,
      },
      ['quote']
    );

    // Text reference section - from library
    this.registry.register(
      'text-reference',
      {
        canHandle: () => true,
        loadComponent: async () =>
          (
            await import('projects/osi-cards-lib/src/lib/components/sections/text-reference-section/text-reference-section.component')
          ).TextReferenceSectionComponent,
      },
      ['reference', 'text-ref']
    );

    // Brand colors section - from library
    this.registry.register(
      'brand-colors',
      {
        canHandle: () => true,
        loadComponent: async () =>
          (
            await import('projects/osi-cards-lib/src/lib/components/sections/brand-colors-section/brand-colors-section.component')
          ).BrandColorsSectionComponent,
      },
      ['brands', 'colors']
    );

    // News section - from library
    this.registry.register('news', {
      canHandle: () => true,
      loadComponent: async () =>
        (
          await import('projects/osi-cards-lib/src/lib/components/sections/news-section/news-section.component')
        ).NewsSectionComponent,
    });

    // Social media section - from library
    this.registry.register('social-media', {
      canHandle: () => true,
      loadComponent: async () =>
        (
          await import('projects/osi-cards-lib/src/lib/components/sections/social-media-section/social-media-section.component')
        ).SocialMediaSectionComponent,
    });
  }

  /**
   * Get component type for a section type
   * Returns a promise that resolves to the component class
   */
  async getComponentType(sectionType: string): Promise<Type<SectionComponentInstance>> {
    // Check cache first
    if (this.componentCache.has(sectionType)) {
      return this.componentCache.get(sectionType)!;
    }

    // Load component dynamically using registry
    const componentPromise = this.registry.getComponentType(sectionType);
    this.componentCache.set(sectionType, componentPromise);

    try {
      return await componentPromise;
    } catch (error) {
      // If loading fails, return info component
      console.error(`Failed to load component for type: ${sectionType}`, error);
      return this.registry.getComponentType('info');
    }
  }

  /**
   * Clear component cache
   */
  clearCache(): void {
    this.componentCache.clear();
  }
}
