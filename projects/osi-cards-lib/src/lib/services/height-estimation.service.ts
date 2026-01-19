/**
 * Height Estimation Service
 *
 * Centralized service for estimating section heights with caching and learning.
 * Replaces all local estimateSectionHeight() functions throughout the codebase.
 *
 * Features:
 * - Type-based default height estimates
 * - Content-aware height calculation (items, fields, description)
 * - Caching for performance
 * - Learning from actual measurements (feedback loop)
 *
 * @dependencies
 * - None (pure calculation service with internal caching)
 */

import { Injectable } from '@angular/core';
import { CardSection } from '@osi-cards/models';

export interface HeightEstimationContext {
  colSpan?: number;
  containerWidth?: number;
  columns?: number;
}

/**
 * Default height estimates per section type (in pixels)
 */
const SECTION_HEIGHT_ESTIMATES: Record<string, number> = {
  'contact-card': 160,
  'network-card': 160,
  analytics: 200,
  stats: 180,
  chart: 280,
  map: 250,
  financials: 200,
  info: 180,
  list: 220,
  event: 240,
  timeline: 240,
  product: 220,
  solutions: 240,
  quotation: 160,
  'text-reference': 180,
  gallery: 200,
  'social-media': 180,
  news: 200,
  video: 250,
  faq: 200,
  'brand-colors': 180,
  default: 180,
};

const HEIGHT_PER_ITEM = 50;
const HEIGHT_PER_FIELD = 32;
const SECTION_HEADER_HEIGHT = 48;
const SECTION_PADDING = 20;
const MIN_SECTION_HEIGHT = 100;
const MAX_SECTION_HEIGHT = 600;

@Injectable({
  providedIn: 'root',
})
export class HeightEstimationService {
  private cache = new Map<string, number>();

  /**
   * Estimates the height of a section based on its type and content
   *
   * @param section - The section to estimate height for
   * @param context - Optional context (colSpan, containerWidth, columns)
   * @returns Estimated height in pixels
   */
  estimate(section: CardSection, context?: HeightEstimationContext): number {
    const cacheKey = this.getCacheKey(section, context);

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const type = String(section.type ?? 'default').toLowerCase();
    const baseHeight = SECTION_HEIGHT_ESTIMATES[type] ?? SECTION_HEIGHT_ESTIMATES['default'] ?? 180;

    // Calculate content-based height
    const itemCount = section.items?.length ?? 0;
    const fieldCount = section.fields?.length ?? 0;
    const descriptionLength = section.description?.length ?? 0;

    const itemsHeight = itemCount * HEIGHT_PER_ITEM;
    const fieldsHeight = fieldCount * HEIGHT_PER_FIELD;
    const descriptionHeight = descriptionLength / 10; // ~10px per 100 chars

    const contentHeight = Math.max(itemsHeight, fieldsHeight, descriptionHeight);

    // Base estimate: header + content + padding
    let estimated = Math.max(baseHeight, SECTION_HEADER_HEIGHT + contentHeight + SECTION_PADDING);

    // Adjust for column span (wider sections may need more height for content)
    if (context?.colSpan && context.colSpan > 1) {
      // Slightly reduce height for wider sections (content spreads horizontally)
      estimated = estimated * (1 - (context.colSpan - 1) * 0.05);
    }

    // Clamp to reasonable range
    const final = Math.min(Math.max(estimated, MIN_SECTION_HEIGHT), MAX_SECTION_HEIGHT);

    // Cache the result
    this.cache.set(cacheKey, final);

    return final;
  }

  /**
   * Records an actual measured height for a section
   * Used to improve future estimates (learning)
   *
   * @param section - The section that was measured
   * @param actualHeight - The actual measured height in pixels
   * @param context - Optional context
   */
  recordActual(
    section: CardSection,
    actualHeight: number,
    context?: HeightEstimationContext
  ): void {
    const cacheKey = this.getCacheKey(section, context);

    // Update cache with actual measurement
    // Use weighted average: 70% actual, 30% cached (if exists)
    const cached = this.cache.get(cacheKey);
    if (cached) {
      const learned = actualHeight * 0.7 + cached * 0.3;
      this.cache.set(cacheKey, learned);
    } else {
      this.cache.set(cacheKey, actualHeight);
    }
  }

  /**
   * Clears the height estimation cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Gets cache statistics for debugging
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Generates a cache key for a section and context
   */
  private getCacheKey(section: CardSection, context?: HeightEstimationContext): string {
    const parts = [
      section.id || section.title || 'unknown',
      section.type || 'default',
      context?.colSpan?.toString() || '1',
      context?.columns?.toString() || '',
    ];

    return parts.filter(Boolean).join('-');
  }
}
