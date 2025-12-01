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
  project: { two: 999 }, // Effectively always 1 column
};

const DEFAULT_COL_SPAN_THRESHOLD: ColSpanThresholds = { two: 6 };

/**
 * Default column preferences for each section type
 * Sections can prefer 1, 2, or 3 columns but will gracefully degrade if constrained
 *
 * - 1 column: Narrow, compact sections (projects, simple info)
 * - 2 columns: Medium-width sections that benefit from space (analytics, contact cards)
 * - 3 columns: Wide sections that need horizontal space (charts, maps, overview)
 */
const DEFAULT_SECTION_COLUMN_PREFERENCES: Record<string, 1 | 2 | 3 | 4> = {
  // Wide sections - prefer 3 columns
  overview: 3,
  chart: 3,
  map: 3,
  locations: 3,

  // Medium sections - prefer 2 columns
  analytics: 2,
  stats: 2,
  'contact-card': 2,
  'network-card': 2,
  financials: 2,
  info: 2,
  solutions: 2,
  product: 2,
  list: 2,
  event: 2,
  quotation: 2,
  'text-reference': 2,

  // Narrow sections - prefer 1 column
  project: 1,
};

const DEFAULT_PREFERRED_COLUMNS: 1 | 2 | 3 | 4 = 1;

/**
 * Service for normalizing and resolving section types
 *
 * Handles section type resolution, column span calculations, and section sorting.
 * Provides intelligent type matching based on section type and title patterns.
 *
 * Features:
 * - Section type resolution with fallbacks
 * - Column span threshold calculations
 * - Section priority-based sorting
 * - Streaming order support
 * - Metadata normalization
 *
 * @example
 * ```typescript
 * const sectionNormalization = inject(SectionNormalizationService);
 *
 * // Normalize a section
 * const normalized = sectionNormalization.normalizeSection({
 *   title: 'Company Info',
 *   type: 'info',
 *   fields: [...]
 * });
 *
 * // Get section priority for sorting
 * const priority = sectionNormalization.getSectionPriority(normalized);
 *
 * // Normalize and sort multiple sections
 * const sorted = sectionNormalization.normalizeAndSortSections(sections);
 * ```
 */
@Injectable({
  providedIn: 'root',
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
    'text-reference',
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
    const needsMetricsConversion =
      resolvedType === 'analytics' &&
      (!section.fields || !section.fields.length) &&
      (section as Record<string, unknown>).metrics;
    const needsDescriptionFromSubtitle = !section.description && section.subtitle;
    const needsMetaUpdate =
      !section.meta || !(section.meta as Record<string, unknown>)?.colSpanThresholds;
    const needsPreferredColumns = section.preferredColumns === undefined;

    // If nothing needs to change, return original section to preserve reference
    if (
      !needsTypeResolution &&
      !needsMetricsConversion &&
      !needsDescriptionFromSubtitle &&
      !needsMetaUpdate &&
      !needsPreferredColumns
    ) {
      return section;
    }

    // Only create new object if normalization is actually needed
    const normalized: CardSection = {
      ...section,
      type: resolvedType,
    };

    // Handle analytics sections with metrics array
    if (needsMetricsConversion) {
      const metrics = (section as Record<string, unknown>).metrics;
      if (Array.isArray(metrics) && metrics.length > 0) {
        (normalized as { fields: typeof metrics }).fields = metrics;
      }
    }

    // Use subtitle as description if description is missing
    if (needsDescriptionFromSubtitle && section.subtitle !== undefined) {
      normalized.description = section.subtitle;
    }

    // Add column span thresholds to section meta if not already present
    if (needsMetaUpdate) {
      const existingMeta = normalized.meta as Record<string, unknown> | undefined;
      const colSpanThresholds = this.getColSpanThresholdsForType(resolvedType);

      normalized.meta = {
        ...existingMeta,
        // Only add if not already defined (allows sections to override)
        colSpanThresholds: existingMeta?.colSpanThresholds ?? colSpanThresholds,
      };
    }

    // Add preferred columns based on section type AND content if not already specified
    if (needsPreferredColumns) {
      normalized.preferredColumns = this.calculatePreferredColumns(normalized);
    }

    return normalized;
  }

  /**
   * Get the preferred number of columns for a section type (legacy method)
   * @deprecated Use calculatePreferredColumns(section) for content-aware logic
   */
  getPreferredColumns(sectionType: string): 1 | 2 | 3 | 4 {
    return DEFAULT_SECTION_COLUMN_PREFERENCES[sectionType] ?? DEFAULT_PREFERRED_COLUMNS;
  }

  /**
   * Calculate the preferred number of columns based on section type AND content
   * This provides smart, content-aware column sizing
   *
   * @param section - The section to calculate preferred columns for
   * @returns Preferred column count (1, 2, 3, or 4)
   */
  calculatePreferredColumns(section: CardSection): 1 | 2 | 3 | 4 {
    const type = section.type?.toLowerCase() ?? '';
    const fieldCount = section.fields?.length ?? 0;

    switch (type) {
      case 'contact-card':
        // 1 contact = 1 col, up to 4
        return Math.min(Math.max(fieldCount, 1), 4) as 1 | 2 | 3 | 4;

      case 'info':
      case 'analytics':
      case 'stats':
      case 'financials':
      case 'list':
      case 'event':
        // Always compact - 1 column
        return 1;

      case 'product':
      case 'solutions':
      case 'network-card':
      case 'quotation':
        // Medium width - 2 columns
        return 2;

      case 'map':
      case 'locations':
        // Wide - 3 columns
        return 3;

      case 'overview':
        // Full width - 4 columns
        return 4;

      case 'chart':
        return this.calculateChartColumns(section);

      case 'text-reference':
        return this.calculateTextRefColumns(section);

      default:
        // Default to compact
        return 1;
    }
  }

  /**
   * Calculate preferred columns for chart sections based on chart type and data complexity
   * - Pie/donut charts are compact (2 columns)
   * - Bar/line charts scale with dataset count
   */
  private calculateChartColumns(section: CardSection): 2 | 3 | 4 {
    const chartType = (section.chartType ?? '').toLowerCase();
    const datasets = section.chartData?.datasets?.length ?? 1;

    // Pie/donut charts are compact
    if (chartType === 'pie' || chartType === 'donut' || chartType === 'doughnut') {
      return 2;
    }

    // Bar/line charts scale with data complexity
    if (datasets <= 1) {
      return 2;
    }
    if (datasets <= 2) {
      return 3;
    }
    return 4;
  }

  /**
   * Calculate preferred columns for text-reference sections based on content length
   * - Short text (<100 chars): 1 column
   * - Medium text (<300 chars): 2 columns
   * - Long text: 3 columns
   */
  private calculateTextRefColumns(section: CardSection): 1 | 2 | 3 {
    const textLength = this.getTextContentLength(section);

    if (textLength < 100) {
      return 1;
    }
    if (textLength < 300) {
      return 2;
    }
    return 3;
  }

  /**
   * Get the total text content length of a section
   * Combines field values, descriptions, and section description
   */
  private getTextContentLength(section: CardSection): number {
    // Check fields for text content
    const fieldText =
      section.fields
        ?.map(
          (f) =>
            String((f as Record<string, unknown>).value ?? '') +
            String((f as Record<string, unknown>).description ?? '')
        )
        .join('') ?? '';

    // Check description
    const desc = section.description ?? '';

    return fieldText.length + desc.length;
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
   *
   * Returns a numeric priority value where lower numbers indicate higher priority.
   * Sections are sorted by priority to ensure consistent ordering across cards.
   *
   * Priority order:
   * 1. Contact cards
   * 2. Overview sections
   * 3. Analytics/Stats
   * 4. Products
   * 5. Solutions
   * 6. Maps
   * 7. Financials
   * 8. Charts
   * 9. Lists
   * 10. Events
   * 11. Info sections
   * 12. Other (default)
   *
   * @param section - Section to get priority for
   * @returns Priority number (lower = higher priority)
   *
   * @example
   * ```typescript
   * const priority = sectionNormalization.getSectionPriority(section);
   * // Returns 1-12 based on section type
   * ```
   */
  getSectionPriority(section: CardSection): number {
    const type = section.type?.toLowerCase() ?? '';
    const title = section.title?.toLowerCase() ?? '';

    // Priority order
    if (type === 'contact-card' || type === 'contact') {
      return 1;
    }
    if (type === 'overview' || title.includes('overview')) {
      return 2;
    }
    if (type === 'analytics') {
      return 3;
    }
    if (type === 'product') {
      return 4;
    }
    if (type === 'solutions') {
      return 5;
    }
    if (type === 'map') {
      return 6;
    }
    if (type === 'financials') {
      return 7;
    }
    if (type === 'chart') {
      return 8;
    }
    if (type === 'list') {
      return 9;
    }
    if (type === 'event') {
      return 10;
    }
    if (type === 'info') {
      return 11;
    }
    return 12;
  }

  /**
   * Sort sections by priority and streaming order
   *
   * Sorts sections first by streaming order (if present), then by priority.
   * This ensures sections appear in the correct order during streaming updates
   * while maintaining consistent priority-based ordering.
   *
   * @param sections - Array of sections to sort
   * @returns Sorted array of sections
   *
   * @example
   * ```typescript
   * const sorted = sectionNormalization.sortSections(sections);
   * // Sections are now ordered by priority and streaming order
   * ```
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
    const rawOrder = metadata.streamingOrder;
    if (typeof rawOrder === 'number' && Number.isFinite(rawOrder)) {
      return rawOrder;
    }
    return null;
  }

  /**
   * Normalize and sort sections
   *
   * Convenience method that normalizes all sections and then sorts them.
   * This is the recommended way to prepare sections for rendering.
   *
   * @param sections - Array of sections to normalize and sort
   * @returns Normalized and sorted array of sections
   *
   * @example
   * ```typescript
   * const processed = sectionNormalization.normalizeAndSortSections(rawSections);
   * // Sections are now normalized and sorted
   * ```
   */
  normalizeAndSortSections(sections: CardSection[]): CardSection[] {
    const normalized = sections.map((section) => this.normalizeSection(section));
    return this.sortSections(normalized);
  }
}
