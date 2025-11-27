import { Injectable } from '@angular/core';
import { CardSection } from '../../models/card.model';

interface ColSpanThresholds {
  two: number;
  three?: number;
}

/**
 * Column span thresholds for each section type
 * These define when a section should span 2 or 3 columns based on content density
 * Lower thresholds = sections span 2 columns more easily (with less content)
 * 
 * Threshold calculation: fieldCount + itemCount + descriptionDensity >= threshold
 * - two: minimum score to span 2 columns
 * - three: minimum score to span 3 columns (optional)
 */
const SECTION_COL_SPAN_THRESHOLDS: Record<string, ColSpanThresholds> = {
  // Overview sections typically have 6-10 key-value pairs, should span 2 columns easily
  overview: { two: 5, three: 10 },
  
  // Charts and maps need space, should span 2 columns with minimal content
  chart: { two: 2 },
  map: { two: 2 },
  locations: { two: 2 },
  
  // Contact cards typically have 3-4 contacts, should span 2 columns easily
  'contact-card': { two: 3 },
  'network-card': { two: 3 },
  
  // Analytics/Stats typically have 3-4 metrics, should span 2 columns
  analytics: { two: 3 },
  stats: { two: 3 },
  
  // Financials typically have 3-5 fields, should span 2 columns
  financials: { two: 3 },
  
  // Info sections with key-value pairs, should span 2 columns with 4+ fields
  info: { two: 4, three: 8 },
  
  // Solutions typically have 3-4 items, should span 2 columns
  solutions: { two: 3 },
  product: { two: 3 },
  
  // Lists typically have 4-6 items, should span 2 columns
  list: { two: 4 },
  
  // Events/Timelines typically have 3-5 phases, should span 2 columns
  event: { two: 3 },
  
  // Text-heavy sections should span 2 columns for readability
  quotation: { two: 3 },
  'text-reference': { two: 3 },
  
  // Projects always span 1 column (special case handled in masonry grid)
  project: { two: 999 } // Effectively always 1 column
};

const DEFAULT_COL_SPAN_THRESHOLD: ColSpanThresholds = { two: 6 };

/**
 * Service for normalizing and resolving section types
 * 
 * Handles section type resolution, column span calculations, and section sorting.
 * Provides intelligent type matching based on section type and title patterns.
 * 
 * @example
 * ```typescript
 * const normalized = sectionNormalization.normalizeSection({
 *   title: 'Company Info',
 *   type: 'info',
 *   fields: [...]
 * });
 * 
 * const colSpan = sectionNormalization.calculateColSpan(normalized, 4);
 * ```
 */
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

    // Check if normalization is actually needed
    const needsTypeResolution = rawType !== resolvedType;
    const needsMetricsConversion = resolvedType === 'analytics' && (!section.fields || !section.fields.length) && (section as Record<string, unknown>)['metrics'];
    const needsDescriptionFromSubtitle = !section.description && section.subtitle;
    const needsMetaUpdate = !section.meta || !(section.meta as Record<string, unknown>)?.['colSpanThresholds'];

    // If nothing needs to change, return original section to preserve reference
    if (!needsTypeResolution && !needsMetricsConversion && !needsDescriptionFromSubtitle && !needsMetaUpdate) {
      return section;
    }

    // Only create new object if normalization is actually needed
    const normalized: CardSection = {
      ...section,
      type: resolvedType
    };

    // Handle analytics sections with metrics array
    if (needsMetricsConversion) {
      const metrics = (section as Record<string, unknown>)['metrics'];
      if (Array.isArray(metrics)) {
        normalized.fields = metrics as typeof normalized.fields;
      }
    }

    // Use subtitle as description if description is missing
    if (needsDescriptionFromSubtitle) {
      normalized.description = section.subtitle;
    }

    // Add column span thresholds to section meta if not already present
    if (needsMetaUpdate) {
      const existingMeta = normalized.meta as Record<string, unknown> | undefined;
      const colSpanThresholds = this.getColSpanThresholdsForType(resolvedType);
      
      normalized.meta = {
        ...existingMeta,
        // Only add if not already defined (allows sections to override)
        colSpanThresholds: existingMeta?.['colSpanThresholds'] ?? colSpanThresholds
      };
    }

    return normalized;
  }

  /**
   * Get column span thresholds for a section type
   * This is the default logic for each section type
   */
  private getColSpanThresholdsForType(type: string): ColSpanThresholds {
    return SECTION_COL_SPAN_THRESHOLDS[type] ?? DEFAULT_COL_SPAN_THRESHOLD;
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

