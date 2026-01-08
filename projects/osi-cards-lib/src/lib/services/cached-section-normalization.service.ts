import { Injectable, inject } from '@angular/core';
import { SectionNormalizationService } from './section-normalization.service';
import { CardSection } from '../models';
import { LRUCache } from '../utils/lru-cache.util';

/**
 * CachedSectionNormalizationService
 *
 * A caching wrapper around SectionNormalizationService that reduces
 * redundant computations for repeated section normalization.
 */
@Injectable({
  providedIn: 'root',
})
export class CachedSectionNormalizationService {
  private readonly normalizationService = inject(SectionNormalizationService);

  // Cache for normalized sections (key: hash of section, value: normalized section)
  private readonly normalizedSectionsCache = new LRUCache<string, CardSection>(200);

  // Cache for sorted sections (key: hash of sections array, value: sorted sections)
  private readonly sortedSectionsCache = new LRUCache<string, CardSection[]>(50);

  // Cache for column span calculations
  private readonly columnSpanCache = new LRUCache<string, number>(500);

  // Statistics
  private cacheHits = 0;
  private cacheMisses = 0;

  /**
   * Normalizes a section with caching
   * @param section The section to normalize
   * @returns Normalized section
   */
  normalizeSection(section: CardSection): CardSection {
    const key = this.generateSectionKey(section);

    const cached = this.normalizedSectionsCache.get(key);
    if (cached) {
      this.cacheHits++;
      return cached;
    }

    this.cacheMisses++;
    const normalized = this.normalizationService.normalizeSection(section);
    this.normalizedSectionsCache.set(key, normalized);
    return normalized;
  }

  /**
   * Normalizes multiple sections with batch optimization
   * @param sections Array of sections
   * @returns Array of normalized sections
   */
  normalizeSections(sections: CardSection[]): CardSection[] {
    return sections.map((section) => this.normalizeSection(section));
  }

  /**
   * Sorts sections with caching
   * @param sections Array of sections to sort
   * @returns Sorted array of sections
   */
  sortSections(sections: CardSection[]): CardSection[] {
    const key = this.generateSectionsArrayKey(sections);

    const cached = this.sortedSectionsCache.get(key);
    if (cached) {
      this.cacheHits++;
      return cached;
    }

    this.cacheMisses++;
    const sorted = this.normalizationService.sortSections(sections);
    this.sortedSectionsCache.set(key, sorted);
    return sorted;
  }

  /**
   * Gets the column span for a section type with caching
   * @param sectionType The section type
   * @returns Column span number
   */
  getColumnSpan(sectionType: string): number {
    const cached = this.columnSpanCache.get(sectionType);
    if (cached !== undefined) {
      this.cacheHits++;
      return cached;
    }

    this.cacheMisses++;
    // Default column span based on section type
    const colSpan = this.getDefaultColumnSpanForType(sectionType);
    this.columnSpanCache.set(sectionType, colSpan);
    return colSpan;
  }

  private getDefaultColumnSpanForType(sectionType: string): number {
    // Wide sections that benefit from more space
    const wideTypes = ['chart', 'map', 'analytics', 'network', 'timeline'];
    // Narrow sections that work well in single column
    const narrowTypes = ['contact', 'quotation', 'brand-colors'];

    if (wideTypes.includes(sectionType)) return 2;
    if (narrowTypes.includes(sectionType)) return 1;
    return 1; // Default to single column
  }

  /**
   * Normalizes and sorts sections in a single optimized operation
   * @param sections Sections to process
   * @returns Normalized and sorted sections
   */
  normalizeAndSort(sections: CardSection[]): CardSection[] {
    const normalized = this.normalizeSections(sections);
    return this.sortSections(normalized);
  }

  /**
   * Clears all caches
   */
  clearCache(): void {
    this.normalizedSectionsCache.clear();
    this.sortedSectionsCache.clear();
    this.columnSpanCache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Gets cache statistics
   */
  getStats(): {
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
   * Pre-warms the cache with common section types
   */
  warmCache(sectionTypes: string[]): void {
    sectionTypes.forEach((type) => {
      this.getColumnSpan(type);
    });
  }

  /**
   * Generates a cache key for a section
   */
  private generateSectionKey(section: CardSection): string {
    // Use a combination of type, title, and field count for key
    const fieldCount = section.fields?.length ?? 0;
    const itemCount = section.items?.length ?? 0;
    return `${section.type}:${section.title || ''}:${fieldCount}:${itemCount}:${JSON.stringify(section['metadata'] || {})}`;
  }

  /**
   * Generates a cache key for an array of sections
   */
  private generateSectionsArrayKey(sections: CardSection[]): string {
    return sections.map((s) => this.generateSectionKey(s)).join('|');
  }
}
