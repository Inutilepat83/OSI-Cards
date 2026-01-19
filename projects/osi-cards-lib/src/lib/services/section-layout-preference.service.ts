import { Injectable } from '@angular/core';
import { CardSection } from '@osi-cards/models';
import { SectionLayoutPreferences } from '@osi-cards/components';

/**
 * Cache key for memoization
 */
interface CacheKey {
  sectionId: string;
  sectionType: string;
  fieldCount: number;
  itemCount: number;
  descriptionLength: number;
  preferredColumns?: number;
  availableColumns: number;
}

/**
 * Section Layout Preference Service
 *
 * Service to manage section layout preferences.
 * Allows sections to register their layout preference functions dynamically.
 * Includes memoization for performance optimization.
 *
 * @dependencies
 * - None (uses internal Map for caching and function registry)
 *
 * @example
 * ```typescript
 * const layoutService = inject(SectionLayoutPreferenceService);
 *
 * // Register layout preference function
 * layoutService.register('analytics', (section, availableColumns) => {
 *   return { preferredColumns: 2, minColumns: 1, maxColumns: 3 };
 * });
 *
 * // Get preferences
 * const prefs = layoutService.getPreferences(section, 4);
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class SectionLayoutPreferenceService {
  /**
   * Registry of layout preference functions by section type
   */
  private layoutPreferenceFunctions = new Map<
    string,
    (section: CardSection, availableColumns: number) => SectionLayoutPreferences
  >();

  /**
   * Cache for layout preferences to avoid recalculating for unchanged sections
   * Key: stringified CacheKey, Value: SectionLayoutPreferences
   */
  private preferencesCache = new Map<string, SectionLayoutPreferences>();

  /**
   * Maximum cache size to prevent memory leaks
   */
  private readonly MAX_CACHE_SIZE = 500;

  /**
   * Generate cache key from section and available columns
   * Optimized to avoid expensive JSON.stringify for simple keys
   */
  private getCacheKey(section: CardSection, availableColumns: number): string {
    // Use simple string concatenation for better performance
    // Only include values that affect layout preferences
    return `${section.id || ''}|${(section.type ?? '').toLowerCase()}|${section.fields?.length ?? 0}|${section.items?.length ?? 0}|${section.description?.length ?? 0}|${section.preferredColumns ?? ''}|${availableColumns}`;
  }

  /**
   * Register a layout preference function for a section type
   *
   * @param sectionType - Section type (e.g., 'info', 'analytics')
   * @param preferenceFn - Function that returns layout preferences for a section
   */
  register(
    sectionType: string,
    preferenceFn: (section: CardSection, availableColumns: number) => SectionLayoutPreferences
  ): void {
    const type = sectionType.toLowerCase();
    this.layoutPreferenceFunctions.set(type, preferenceFn);
    // Clear cache when new functions are registered
    this.preferencesCache.clear();
  }

  /**
   * Get layout preferences for a section with memoization
   *
   * @param section - Section data
   * @param availableColumns - Available columns in grid
   * @returns Layout preferences or null if not registered
   */
  getPreferences(
    section: CardSection,
    availableColumns: number = 4
  ): SectionLayoutPreferences | null {
    const type = (section.type ?? '').toLowerCase();
    const preferenceFn = this.layoutPreferenceFunctions.get(type);

    if (!preferenceFn) {
      return null;
    }

    // Check cache first
    const cacheKey = this.getCacheKey(section, availableColumns);
    const cached = this.preferencesCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Calculate preferences
    try {
      const preferences = preferenceFn(section, availableColumns);

      // Cache the result (with size limit)
      if (this.preferencesCache.size >= this.MAX_CACHE_SIZE) {
        // Remove oldest entry (simple FIFO)
        const firstKey = this.preferencesCache.keys().next().value;
        if (firstKey) {
          this.preferencesCache.delete(firstKey);
        }
      }
      this.preferencesCache.set(cacheKey, preferences);

      return preferences;
    } catch (error) {
      // Only log in development mode
      if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
        // Production: silent fail
        return null;
      }
      console.warn(
        `[SectionLayoutPreferenceService] Error getting preferences for type "${type}":`,
        error
      );
      return null;
    }
  }

  /**
   * Check if a section type has registered preferences
   *
   * @param sectionType - Section type
   * @returns True if preferences are registered
   */
  hasPreferences(sectionType: string): boolean {
    const type = sectionType.toLowerCase();
    return this.layoutPreferenceFunctions.has(type);
  }

  /**
   * Clear all registered preferences and cache (useful for testing)
   */
  clear(): void {
    this.layoutPreferenceFunctions.clear();
    this.preferencesCache.clear();
  }

  /**
   * Clear only the cache (useful when section data changes)
   */
  clearCache(): void {
    this.preferencesCache.clear();
  }
}
