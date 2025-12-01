import { inject, Injectable, Type } from '@angular/core';
import { SectionComponentRegistryService } from './section-component-registry.service';
import { SectionComponentInstance } from './section-component.interface';

/**
 * Section component loader service
 * Handles lazy loading of section components to reduce initial bundle size.
 * Now uses registry-based strategy pattern instead of switch statement.
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
   */
  private initializeRegistry(): void {
    // Info section
    this.registry.register('info', {
      canHandle: () => true,
      loadComponent: async () =>
        (await import('../sections/info-section.component')).InfoSectionComponent,
    });

    // Analytics section
    this.registry.register(
      'analytics',
      {
        canHandle: () => true,
        loadComponent: async () =>
          (await import('../sections/analytics-section/analytics-section.component'))
            .AnalyticsSectionComponent,
      },
      ['metrics', 'stats']
    );

    // Financials section
    this.registry.register('financials', {
      canHandle: () => true,
      loadComponent: async () =>
        (await import('../sections/financials-section/financials-section.component'))
          .FinancialsSectionComponent,
    });

    // List section
    this.registry.register(
      'list',
      {
        canHandle: () => true,
        loadComponent: async () =>
          (await import('../sections/list-section/list-section.component')).ListSectionComponent,
      },
      ['table']
    );

    // Event section
    this.registry.register(
      'event',
      {
        canHandle: () => true,
        loadComponent: async () =>
          (await import('../sections/event-section/event-section.component')).EventSectionComponent,
      },
      ['timeline']
    );

    // Product section
    this.registry.register('product', {
      canHandle: () => true,
      loadComponent: async () =>
        (await import('../sections/product-section/product-section.component'))
          .ProductSectionComponent,
    });

    // Solutions section
    this.registry.register('solutions', {
      canHandle: () => true,
      loadComponent: async () =>
        (await import('../sections/solutions-section/solutions-section.component'))
          .SolutionsSectionComponent,
    });

    // Contact card section
    this.registry.register('contact-card', {
      canHandle: () => true,
      loadComponent: async () =>
        (await import('../sections/contact-card-section/contact-card-section.component'))
          .ContactCardSectionComponent,
    });

    // Network card section
    this.registry.register('network-card', {
      canHandle: () => true,
      loadComponent: async () =>
        (await import('../sections/network-card-section/network-card-section.component'))
          .NetworkCardSectionComponent,
    });

    // Map section
    this.registry.register(
      'map',
      {
        canHandle: () => true,
        loadComponent: async () =>
          (await import('../sections/map-section/map-section.component')).MapSectionComponent,
      },
      ['locations']
    );

    // Chart section
    this.registry.register('chart', {
      canHandle: () => true,
      loadComponent: async () =>
        (await import('../sections/chart-section/chart-section.component')).ChartSectionComponent,
    });

    // Overview section
    this.registry.register('overview', {
      canHandle: () => true,
      loadComponent: async () =>
        (await import('../sections/overview-section/overview-section.component'))
          .OverviewSectionComponent,
    });

    // Quotation section
    this.registry.register(
      'quotation',
      {
        canHandle: () => true,
        loadComponent: async () =>
          (await import('../sections/quotation-section/quotation-section.component'))
            .QuotationSectionComponent,
      },
      ['quote']
    );

    // Text reference section
    this.registry.register(
      'text-reference',
      {
        canHandle: () => true,
        loadComponent: async () =>
          (await import('../sections/text-reference-section/text-reference-section.component'))
            .TextReferenceSectionComponent,
      },
      ['reference', 'text-ref']
    );

    // Brand colors section
    this.registry.register(
      'brand-colors',
      {
        canHandle: () => true,
        loadComponent: async () =>
          (await import('../sections/brand-colors-section/brand-colors-section.component'))
            .BrandColorsSectionComponent,
      },
      ['brands', 'colors']
    );

    // News section
    this.registry.register('news', {
      canHandle: () => true,
      loadComponent: async () =>
        (await import('../sections/news-section/news-section.component')).NewsSectionComponent,
    });

    // Social media section
    this.registry.register('social-media', {
      canHandle: () => true,
      loadComponent: async () =>
        (await import('../sections/social-media-section/social-media-section.component'))
          .SocialMediaSectionComponent,
    });

    // Fallback section
    this.registry.register('fallback', {
      canHandle: () => true,
      loadComponent: async () =>
        (await import('../sections/fallback-section/fallback-section.component'))
          .FallbackSectionComponent,
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
      // If loading fails, return fallback component
      console.error(`Failed to load component for type: ${sectionType}`, error);
      return this.registry.getComponentType('fallback');
    }
  }

  /**
   * Clear component cache
   */
  clearCache(): void {
    this.componentCache.clear();
  }
}
