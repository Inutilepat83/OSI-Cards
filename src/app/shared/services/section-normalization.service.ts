import { Injectable } from '@angular/core';
import { CardSection } from '../../models/card.model';

@Injectable({
  providedIn: 'root'
})
export class SectionNormalizationService {
  /**
   * Supported section types
   */
  private readonly supportedTypes: CardSection['type'][] = [
    'info',
    'analytics',
    'contact-card',
    'network-card',
    'map',
    'financials',
    'locations',
    'event',
    'project',
    'list',
    'chart',
    'product',
    'solutions',
    'overview',
    'stats',
    'quotation',
    'text-reference'
  ];

  /**
   * Normalize a section by resolving its type and ensuring required properties
   */
  normalizeSection(section: CardSection): CardSection {
    const rawType = (section.type ?? '').toLowerCase();
    const title = (section.title ?? '').toLowerCase();

    const resolvedType = this.resolveSectionType(rawType, title);

    const normalized: CardSection = {
      ...section,
      type: resolvedType
    };

    // Handle analytics sections with metrics array
    if (resolvedType === 'analytics' && (!normalized.fields || !normalized.fields.length)) {
      const metrics = (section as Record<string, unknown>)['metrics'];
      if (Array.isArray(metrics)) {
        normalized.fields = metrics as typeof normalized.fields;
      }
    }

    // Use subtitle as description if description is missing
    if (!normalized.description && section.subtitle) {
      normalized.description = section.subtitle;
    }

    return normalized;
  }

  /**
   * Resolve section type from raw type and title
   */
  private resolveSectionType(rawType: string, title: string): CardSection['type'] {
    // Title-based overrides take precedence
    if (!rawType && title.includes('overview')) {
      return 'overview';
    }

    // Type-based resolution
    switch (rawType) {
      case 'timeline':
        return 'event';
      case 'metrics':
      case 'stats':
        return 'analytics';
      case 'table':
        return 'list';
      case 'locations':
        return 'map';
      case 'project':
        return 'info';
      case 'contact':
        return 'contact-card';
      case 'network':
        return 'network-card';
      case 'quotation':
      case 'quote':
        return 'quotation';
      case 'text-reference':
      case 'reference':
      case 'text-ref':
        return 'text-reference';
      case '':
        return title.includes('overview') ? 'overview' : 'info';
      default:
        return this.supportedTypes.includes(rawType as CardSection['type'])
          ? (rawType as CardSection['type'])
          : 'info';
    }
  }

  /**
   * Get section priority for sorting
   * Lower numbers appear first
   */
  getSectionPriority(section: CardSection): number {
    const type = section.type?.toLowerCase() ?? '';
    const title = section.title?.toLowerCase() ?? '';

    // Priority order
    if (type === 'contact-card' || type === 'contact') return 1;
    if (type === 'overview' || title.includes('overview')) return 2;
    if (type === 'analytics') return 3;
    if (type === 'product') return 4;
    if (type === 'solutions') return 5;
    if (type === 'map') return 6;
    if (type === 'financials') return 7;
    if (type === 'chart') return 8;
    if (type === 'list') return 9;
    if (type === 'event') return 10;
    if (type === 'info') return 11;
    return 12;
  }

  /**
   * Sort sections by priority
   */
  sortSections(sections: CardSection[]): CardSection[] {
    return [...sections].sort((a, b) => {
      const streamingOrderComparison = this.compareStreamingOrder(a, b);
      if (streamingOrderComparison !== 0) {
        return streamingOrderComparison;
      }
      const priorityA = this.getSectionPriority(a);
      const priorityB = this.getSectionPriority(b);
      return priorityA - priorityB;
    });
  }

  private compareStreamingOrder(a: CardSection, b: CardSection): number {
    const orderA = this.getStreamingOrder(a);
    const orderB = this.getStreamingOrder(b);
    const hasOrderA = orderA !== null;
    const hasOrderB = orderB !== null;
    if (!hasOrderA && !hasOrderB) {
      return 0;
    }
    if (hasOrderA && !hasOrderB) {
      return -1;
    }
    if (!hasOrderA && hasOrderB) {
      return 1;
    }
    if (orderA! < orderB!) {
      return -1;
    }
    if (orderA! > orderB!) {
      return 1;
    }
    return 0;
  }

  private getStreamingOrder(section: CardSection): number | null {
    const metadata = section.meta as Record<string, unknown> | undefined;
    if (!metadata) {
      return null;
    }
    const rawOrder = metadata['streamingOrder'];
    if (typeof rawOrder === 'number' && Number.isFinite(rawOrder)) {
      return rawOrder;
    }
    return null;
  }

  /**
   * Normalize and sort sections
   */
  normalizeAndSortSections(sections: CardSection[]): CardSection[] {
    const normalized = sections.map(section => this.normalizeSection(section));
    return this.sortSections(normalized);
  }
}

