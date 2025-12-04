/**
 * Section Normalization Service
 *
 * @description
 * Provides comprehensive section normalization, type resolution, priority assignment,
 * and condensation logic for optimal card layout. Uses LRU caching for performance
 * with typical 80% hit rate.
 *
 * Key responsibilities:
 * - Resolve section type aliases to canonical types
 * - Assign priority bands for rendering order
 * - Calculate preferred column spans
 * - Apply condensation rules
 * - Cache normalization results
 *
 * @example
 * ```typescript
 * import { SectionNormalizationService } from '@osi-cards/services';
 *
 * @Component({...})
 * export class MyComponent {
 *   private normalization = inject(SectionNormalizationService);
 *
 *   processSections(sections: CardSection[]): CardSection[] {
 *     return this.normalization.normalizeAndSortSections(sections);
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Normalize single section
 * const normalized = normalization.normalizeSection(section);
 *
 * // Get priority for layout
 * const priority = normalization.getLayoutPriorityForSection(section);
 *
 * // Apply condensation
 * const condensed = normalization.applyCondensation(sections, 10);
 * ```
 *
 * @public
 */
import { Injectable } from '@angular/core';
import { CardSection, LayoutPriority } from '../models/card.model';
import {
  SectionType,
  SectionTypeInput,
  resolveSectionType as resolveType,
  isValidSectionType,
} from '../models/generated-section-types';
import {
  getPreferredColumns,
  DEFAULT_SECTION_COLUMN_PREFERENCES,
  PreferredColumns,
} from '../utils/grid-config.util';
import { LRUCache } from '../utils/lru-cache.util';

interface ColSpanThresholds {
  two: number;
  three?: number;
}

/**
 * Priority band types for section ordering and condensation
 */
export type PriorityBand = 'critical' | 'important' | 'standard' | 'optional';

/**
 * Priority band configuration
 */
export interface PriorityBandConfig {
  types: string[];
  condensePriority: 'never' | 'last' | 'always' | 'first';
  order: number;
}

/**
 * Priority bands with condensation rules
 * - critical: Never condensed, always visible (overview, contact-card)
 * - important: Condensed last (analytics, chart, stats, financials)
 * - standard: Normal condensation (info, list, product, solutions, map)
 * - optional: Condensed first (news, event, timeline, quotation)
 */
export const PRIORITY_BANDS: Record<PriorityBand, PriorityBandConfig> = {
  critical: {
    types: ['overview', 'contact-card'],
    condensePriority: 'never',
    order: 1,
  },
  important: {
    types: ['analytics', 'chart', 'stats', 'financials'],
    condensePriority: 'last',
    order: 2,
  },
  standard: {
    types: ['info', 'list', 'product', 'solutions', 'map'],
    condensePriority: 'always',
    order: 3,
  },
  optional: {
    types: ['news', 'event', 'timeline', 'quotation', 'text-reference', 'network-card'],
    condensePriority: 'first',
    order: 4,
  },
};

/**
 * Column span thresholds for each section type
 * These define when a section should span 2 or 3 columns based on content density
 * Lower thresholds = sections span 2 columns more easily (with less content)
 *
 * Threshold calculation: fieldCount + itemCount + descriptionDensity >= threshold
 * - two: minimum score to span 2 columns
 * - three: minimum score to span 3 columns (optional)
 *
 * UPDATED: Lowered thresholds to allow easier multi-column expansion and reduce gaps
 */
const SECTION_COL_SPAN_THRESHOLDS: Record<string, ColSpanThresholds> = {
  // Overview sections typically have 6-10 key-value pairs, should span 2-3 columns easily
  overview: { two: 2, three: 6 }, // Lowered from { two: 5, three: 10 }

  // Charts and maps need space, should span 2 columns with minimal content
  chart: { two: 1, three: 4 }, // Lowered and added three
  map: { two: 1, three: 4 }, // Lowered and added three
  locations: { two: 1, three: 4 }, // Lowered and added three

  // Contact cards - span 2 with just 2 contacts
  'contact-card': { two: 2, three: 4 }, // Lowered from { two: 3 }
  'network-card': { two: 2, three: 4 }, // Lowered from { two: 3 }

  // Analytics/Stats - span 2 with just 2 metrics
  analytics: { two: 2, three: 5 }, // Lowered from { two: 3 }
  stats: { two: 2, three: 5 }, // Lowered from { two: 3 }

  // Financials - span 2 with just 2 fields
  financials: { two: 2, three: 5 }, // Lowered from { two: 3 }

  // Info sections with key-value pairs - easier to span 2
  info: { two: 2, three: 6 }, // Lowered from { two: 4, three: 8 }

  // Solutions/products - easier to span 2
  solutions: { two: 2, three: 5 }, // Lowered from { two: 3 }
  product: { two: 2, three: 5 }, // Lowered from { two: 3 }

  // Lists - span 2 with just 3 items
  list: { two: 3, three: 6 }, // Lowered from { two: 4 }

  // Events/Timelines - span 2 with 2 events
  event: { two: 2, three: 5 }, // Lowered from { two: 3 }
  timeline: { two: 2, three: 5 }, // Added

  // Text-heavy sections - easier to span 2
  quotation: { two: 2, three: 4 }, // Lowered from { two: 3 }
  'text-reference': { two: 2, three: 4 }, // Lowered from { two: 3 }

  // Projects - can now span 2 if they have content
  project: { two: 4, three: 8 }, // Changed from { two: 999 }
};

const DEFAULT_COL_SPAN_THRESHOLD: ColSpanThresholds = { two: 3, three: 6 }; // Lowered from { two: 6 }

@Injectable({
  providedIn: 'root',
})
export class SectionNormalizationService {
  // ========== Caching (merged from cached-section-normalization.service.ts) ==========
  private readonly normalizedSectionsCache = new LRUCache<string, CardSection>({ maxSize: 200 });
  private readonly sortedSectionsCache = new LRUCache<string, CardSection[]>({ maxSize: 50 });
  private readonly columnSpanCache = new LRUCache<string, number>({ maxSize: 500 });
  private cacheHits = 0;
  private cacheMisses = 0;

  /**
   * Normalize a section by resolving its type and ensuring required properties
   * Now includes caching to avoid redundant computations
   */
  normalizeSection(section: CardSection): CardSection {
    // Check cache first
    const key = this.generateSectionKey(section);
    const cached = this.normalizedSectionsCache.get(key);
    if (cached) {
      this.cacheHits++;
      return cached;
    }

    this.cacheMisses++;
    const normalized = this.performNormalization(section);
    this.normalizedSectionsCache.set(key, normalized);
    return normalized;
  }

  /**
   * Actual normalization logic (extracted for caching)
   */
  private performNormalization(section: CardSection): CardSection {
    const rawType = (section.type ?? '').toLowerCase();
    const title = (section.title ?? '').toLowerCase();

    const resolvedType = this.resolveSectionType(rawType, title);

    const normalized: CardSection = {
      ...section,
      type: resolvedType,
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

    // Add column span thresholds and preferred columns to section meta
    // This allows each section to have its own column logic
    const existingMeta = normalized.meta as Record<string, unknown> | undefined;
    const colSpanThresholds = this.getColSpanThresholdsForType(resolvedType);
    const preferredColumns = this.getPreferredColumnsForType(resolvedType);
    const priorityBand = this.getPriorityBandForType(resolvedType);

    normalized.meta = {
      ...existingMeta,
      // Only add if not already defined (allows sections to override)
      colSpanThresholds: existingMeta?.['colSpanThresholds'] ?? colSpanThresholds,
      preferredColumns: existingMeta?.['preferredColumns'] ?? preferredColumns,
      priorityBand: existingMeta?.['priorityBand'] ?? priorityBand,
    };

    // Also set preferredColumns on the section itself if not already defined
    if (!normalized.preferredColumns) {
      normalized.preferredColumns = preferredColumns;
    }

    // Set priority band on section if not already defined
    if (!normalized.priority) {
      normalized.priority = priorityBand;
    }

    // Set numeric layout priority for row-first packing algorithm
    if (normalized.layoutPriority === undefined) {
      normalized.layoutPriority = this.mapPriorityBandToLayoutPriority(priorityBand);
    }

    return normalized;
  }

  /**
   * Get the priority band for a section type
   */
  getPriorityBandForType(type: string): PriorityBand {
    const lowerType = type.toLowerCase();

    for (const [band, config] of Object.entries(PRIORITY_BANDS)) {
      if (config.types.includes(lowerType)) {
        return band as PriorityBand;
      }
    }

    return 'standard';
  }

  /**
   * Maps a priority band string to a numeric layout priority (1-3).
   * Used by the row-first packing algorithm for efficient sorting.
   *
   * Mapping:
   * - 'critical' → 1 (highest priority, placed first)
   * - 'important' → 1 (high priority)
   * - 'standard' → 2 (normal priority)
   * - 'optional' → 3 (lowest priority, placed last)
   *
   * @param priority - The priority band string
   * @returns Numeric layout priority (1, 2, or 3)
   */
  mapPriorityBandToLayoutPriority(priority?: PriorityBand): LayoutPriority {
    switch (priority) {
      case 'critical':
      case 'important':
        return 1;
      case 'standard':
        return 2;
      case 'optional':
        return 3;
      default:
        return 2; // Default to standard priority
    }
  }

  /**
   * Gets the layout priority for a section.
   * First checks for explicit layoutPriority, then maps from priority band.
   *
   * @param section - The section to get priority for
   * @returns Numeric layout priority (1, 2, or 3)
   */
  getLayoutPriorityForSection(section: CardSection): LayoutPriority {
    // Explicit layoutPriority takes precedence
    if (section.layoutPriority !== undefined) {
      return section.layoutPriority;
    }

    // Map from priority band
    const priorityBand = section.priority ?? this.getPriorityBandForType(section.type ?? 'info');
    return this.mapPriorityBandToLayoutPriority(priorityBand);
  }

  /**
   * Get condensation priority for a section
   * Returns the order in which sections should be condensed (lower = condense first)
   */
  getCondensationOrder(section: CardSection): number {
    const band = section.priority ?? this.getPriorityBandForType(section.type ?? 'info');
    const config = PRIORITY_BANDS[band as PriorityBand];

    switch (config?.condensePriority) {
      case 'first':
        return 1; // Condense first
      case 'always':
        return 2; // Normal condensation
      case 'last':
        return 3; // Condense last
      case 'never':
        return 999; // Never condense
      default:
        return 2;
    }
  }

  /**
   * Apply condensation to sections based on available space
   * Returns sections with collapsed flags set appropriately
   *
   * @param sections - Sections to potentially condense
   * @param maxVisibleSections - Maximum number of sections to show uncollapsed
   * @returns Sections with collapsed flags updated
   */
  applyCondensation(sections: CardSection[], maxVisibleSections: number): CardSection[] {
    if (sections.length <= maxVisibleSections) {
      return sections;
    }

    // Sort by condensation order (what to condense first)
    const sortedByCondensation = [...sections].sort((a, b) => {
      return this.getCondensationOrder(a) - this.getCondensationOrder(b);
    });

    // Determine which sections to collapse
    const toCollapse = sortedByCondensation.slice(maxVisibleSections);
    const collapseIds = new Set(toCollapse.map((s) => s.id ?? s.title));

    // Apply collapsed flag while preserving original order
    return sections.map((section) => {
      const shouldCollapse = collapseIds.has(section.id ?? section.title);
      const band = section.priority ?? this.getPriorityBandForType(section.type ?? 'info');
      const config = PRIORITY_BANDS[band as PriorityBand];

      // Never collapse critical sections
      if (config?.condensePriority === 'never') {
        return section;
      }

      if (shouldCollapse) {
        return { ...section, collapsed: true };
      }

      return section;
    });
  }

  /**
   * Get column span thresholds for a section type
   * This is the default logic for each section type
   */
  private getColSpanThresholdsForType(type: string): ColSpanThresholds {
    return SECTION_COL_SPAN_THRESHOLDS[type] ?? DEFAULT_COL_SPAN_THRESHOLD;
  }

  /**
   * Get preferred columns for a section type
   * Uses the centralized preferences from grid-config.util.ts
   *
   * @param type - The section type
   * @returns Preferred column count (1, 2, or 3)
   */
  getPreferredColumnsForType(type: string): PreferredColumns {
    return getPreferredColumns(type, DEFAULT_SECTION_COLUMN_PREFERENCES);
  }

  /**
   * Resolve section type from raw type and title
   * Uses the generated type resolution from section-registry.json
   */
  private resolveSectionType(rawType: string, title: string): SectionType {
    // Title-based overrides take precedence
    if (!rawType && title.includes('overview')) {
      return 'overview';
    }

    // Handle empty type
    if (!rawType) {
      return title.includes('overview') ? 'overview' : 'info';
    }

    // Handle legacy aliases not in registry
    if (rawType === 'contact') {
      return 'contact-card';
    }
    if (rawType === 'network') {
      return 'network-card';
    }

    // Use the generated resolver which handles all registry aliases
    const resolved = resolveType(rawType as SectionTypeInput);

    // If the resolved type is valid, use it; otherwise default to info
    return isValidSectionType(resolved) ? resolved : 'info';
  }

  /**
   * Get section priority for sorting
   * Uses priority bands for consistent ordering
   * Lower numbers appear first
   */
  getSectionPriority(section: CardSection): number {
    // First check explicit priority on section
    if (section.priority) {
      return PRIORITY_BANDS[section.priority]?.order ?? 3;
    }

    const type = section.type?.toLowerCase() ?? '';
    const title = section.title?.toLowerCase() ?? '';

    // Title-based overrides
    if (title.includes('overview')) return 1;

    // Use priority bands
    const band = this.getPriorityBandForType(type);
    const baseOrder = PRIORITY_BANDS[band]?.order ?? 3;

    // Fine-grained ordering within bands
    const typeOrder: Record<string, number> = {
      overview: 0,
      'contact-card': 1,
      analytics: 0,
      chart: 1,
      stats: 2,
      financials: 3,
      info: 0,
      product: 1,
      solutions: 2,
      list: 3,
      map: 4,
      event: 0,
      timeline: 1,
      quotation: 2,
      'text-reference': 3,
      'network-card': 4,
    };

    const subOrder = (typeOrder[type] ?? 5) / 10;
    return baseOrder + subOrder;
  }

  /**
   * Sort sections by priority (with caching)
   */
  sortSections(sections: CardSection[]): CardSection[] {
    // Check cache first
    const key = this.generateSectionsArrayKey(sections);
    const cached = this.sortedSectionsCache.get(key);
    if (cached) {
      this.cacheHits++;
      return cached;
    }

    // Cache miss - perform sort
    this.cacheMisses++;
    const sorted = [...sections].sort((a, b) => {
      const streamingOrderComparison = this.compareStreamingOrder(a, b);
      if (streamingOrderComparison !== 0) {
        return streamingOrderComparison;
      }
      const priorityA = this.getSectionPriority(a);
      const priorityB = this.getSectionPriority(b);
      return priorityA - priorityB;
    });

    this.sortedSectionsCache.set(key, sorted);
    return sorted;
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
    const normalized = sections.map((section) => this.normalizeSection(section));
    return this.sortSections(normalized);
  }

  // ============================================================================
  // CACHING METHODS (merged from cached-section-normalization.service.ts)
  // ============================================================================

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.normalizedSectionsCache.clear();
    this.sortedSectionsCache.clear();
    this.columnSpanCache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    hits: number;
    misses: number;
    hitRate: number;
    normalizedCacheSize: number;
    sortedCacheSize: number;
    columnSpanCacheSize: number;
  } {
    const total = this.cacheHits + this.cacheMisses;
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: total > 0 ? this.cacheHits / total : 0,
      normalizedCacheSize: this.normalizedSectionsCache.size,
      sortedCacheSize: this.sortedSectionsCache.size,
      columnSpanCacheSize: this.columnSpanCache.size,
    };
  }

  /**
   * Pre-warm cache with common section types
   */
  warmCache(sectionTypes: string[]): void {
    // Pre-compute column spans for common types
    sectionTypes.forEach((type) => {
      const preferredCols = this.getPreferredColumnsForType(type);
      this.columnSpanCache.set(type, preferredCols);
    });
  }

  /**
   * Generate cache key for a section
   */
  private generateSectionKey(section: CardSection): string {
    const fieldCount = section.fields?.length ?? 0;
    const itemCount = section.items?.length ?? 0;
    const meta = JSON.stringify(section.meta || {});
    return `${section.type}:${section.title || ''}:${fieldCount}:${itemCount}:${meta}`;
  }

  /**
   * Generate cache key for sections array
   */
  private generateSectionsArrayKey(sections: CardSection[]): string {
    return sections.map((s) => this.generateSectionKey(s)).join('|');
  }
}
