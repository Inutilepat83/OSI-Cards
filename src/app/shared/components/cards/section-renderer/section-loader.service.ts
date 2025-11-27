import { Injectable, Type } from '@angular/core';
import { CardSection } from '../../../../models';

/**
 * Section component loader service
 * Handles lazy loading of section components to reduce initial bundle size
 */
@Injectable({
  providedIn: 'root'
})
export class SectionLoaderService {
  private componentCache = new Map<string, Promise<Type<any>>>();

  /**
   * Get component type for a section type
   * Returns a promise that resolves to the component class
   */
  async getComponentType(sectionType: string): Promise<Type<any>> {
    // Check cache first
    if (this.componentCache.has(sectionType)) {
      return this.componentCache.get(sectionType)!;
    }

    // Load component dynamically
    const componentPromise = this.loadComponent(sectionType);
    this.componentCache.set(sectionType, componentPromise);

    try {
      return await componentPromise;
    } catch (error) {
      // If loading fails, return fallback component
      console.error(`Failed to load component for type: ${sectionType}`, error);
      return this.loadFallbackComponent();
    }
  }

  /**
   * Load component based on section type
   */
  private async loadComponent(sectionType: string): Promise<Type<any>> {
    switch (sectionType) {
      case 'info':
        return (await import('../sections/info-section.component')).InfoSectionComponent;
      case 'analytics':
      case 'metrics':
      case 'stats':
        return (await import('../sections/analytics-section/analytics-section.component')).AnalyticsSectionComponent;
      case 'financials':
        return (await import('../sections/financials-section/financials-section.component')).FinancialsSectionComponent;
      case 'list':
      case 'table':
        return (await import('../sections/list-section/list-section.component')).ListSectionComponent;
      case 'event':
      case 'timeline':
        return (await import('../sections/event-section/event-section.component')).EventSectionComponent;
      case 'product':
        return (await import('../sections/product-section/product-section.component')).ProductSectionComponent;
      case 'solutions':
        return (await import('../sections/solutions-section/solutions-section.component')).SolutionsSectionComponent;
      case 'contact-card':
        return (await import('../sections/contact-card-section/contact-card-section.component')).ContactCardSectionComponent;
      case 'network-card':
        return (await import('../sections/network-card-section/network-card-section.component')).NetworkCardSectionComponent;
      case 'map':
      case 'locations':
        return (await import('../sections/map-section/map-section.component')).MapSectionComponent;
      case 'chart':
        return (await import('../sections/chart-section/chart-section.component')).ChartSectionComponent;
      case 'overview':
        return (await import('../sections/overview-section/overview-section.component')).OverviewSectionComponent;
      case 'quotation':
      case 'quote':
        return (await import('../sections/quotation-section/quotation-section.component')).QuotationSectionComponent;
      case 'text-reference':
      case 'reference':
      case 'text-ref':
        return (await import('../sections/text-reference-section/text-reference-section.component')).TextReferenceSectionComponent;
      case 'brand-colors':
      case 'brands':
      case 'colors':
        return (await import('../sections/brand-colors-section/brand-colors-section.component')).BrandColorsSectionComponent;
      case 'news':
        return (await import('../sections/news-section/news-section.component')).NewsSectionComponent;
      case 'social-media':
        return (await import('../sections/social-media-section/social-media-section.component')).SocialMediaSectionComponent;
      default:
        return this.loadFallbackComponent();
    }
  }

  /**
   * Load fallback component
   */
  private async loadFallbackComponent(): Promise<Type<any>> {
    const module = await import('../sections/fallback-section/fallback-section.component');
    return module.FallbackSectionComponent;
  }

  /**
   * Clear component cache
   */
  clearCache(): void {
    this.componentCache.clear();
  }
}


