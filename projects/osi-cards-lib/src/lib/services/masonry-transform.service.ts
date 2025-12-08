import { Injectable } from '@angular/core';
import { CardSection } from '../models';

/**
 * Position info for a section after transform calculation
 */
export interface TransformPosition {
  transform: string;
  finalTop: number;
  colIndex: number;
  colSpan: number;
}

/**
 * Configuration for transform calculation
 */
export interface TransformConfig {
  columns: number;
  gap: number;
  containerWidth: number;
}

/**
 * Service for calculating CSS transforms to eliminate gaps in masonry layout.
 *
 * KEY PRINCIPLE: This service READS heights from DOM after browser layout,
 * calculates transforms, and returns them. It NEVER triggers re-renders or
 * DOM mutations during calculation, preventing circular dependencies.
 */
@Injectable({
  providedIn: 'root',
})
export class MasonryTransformService {
  /**
   * Calculate transforms to eliminate vertical gaps.
   *
   * CRITICAL: This method is PURE - no side effects, no DOM mutations.
   * It reads ACTUAL heights from the DOM after browser has laid out content,
   * then calculates transforms. This breaks circular dependency chains.
   *
   * @param sections - Array of sections to position
   * @param itemElements - DOM elements corresponding to sections (in same order)
   * @param config - Layout configuration
   * @param getColSpan - Function to get column span for a section
   * @returns Map of section keys to transform positions
   */
  calculateTransforms(
    sections: CardSection[],
    itemElements: HTMLElement[],
    config: TransformConfig,
    getColSpan: (section: CardSection, columns: number) => number
  ): Map<string, TransformPosition> {
    if (sections.length === 0 || itemElements.length === 0) {
      return new Map();
    }

    if (sections.length !== itemElements.length) {
      console.warn(
        `[MasonryTransform] Section count (${sections.length}) doesn't match ` +
          `element count (${itemElements.length}). Cannot calculate transforms.`
      );
      return new Map();
    }

    const colHeights = new Array(config.columns).fill(0);
    const transforms = new Map<string, TransformPosition>();

    // Process sections in order (maintain original order for consistent layout)
    const indexedSections = sections
      .map((section, index) => ({
        section,
        element: itemElements[index],
        index,
      }))
      .filter(
        (item): item is { section: CardSection; element: HTMLElement; index: number } =>
          item.element !== undefined && item.element !== null
      );

    for (const item of indexedSections) {
      const { section, element, index } = item;

      // CRITICAL: Read ACTUAL height from DOM (after browser layout)
      // This is safe because we're reading, not writing
      const rect = element.getBoundingClientRect();
      const actualHeight = rect.height;

      if (actualHeight <= 0) {
        console.warn(`[MasonryTransform] Section ${index} has zero height, skipping`);
        continue;
      }

      // Determine column span
      const colSpan = Math.min(getColSpan(section, config.columns), config.columns);

      // Find shortest column group that can fit this span
      let shortestCol = 0;
      let shortestHeight = Infinity;

      for (let col = 0; col <= config.columns - colSpan; col++) {
        // Get max height across the columns this span would occupy
        let maxHeight = 0;
        for (let c = col; c < col + colSpan; c++) {
          maxHeight = Math.max(maxHeight, colHeights[c] ?? 0);
        }

        if (maxHeight < shortestHeight) {
          shortestHeight = maxHeight;
          shortestCol = col;
        }
      }

      // Calculate transform needed to move section to target position
      // For absolutely positioned elements, offsetTop is relative to positioned parent
      const targetTop = shortestHeight;
      const currentTop = element.offsetTop || 0;
      const translateY = targetTop - currentTop;

      // Generate section key
      const key = this.getSectionKey(section, index);

      // Store transform
      transforms.set(key, {
        transform: translateY !== 0 ? `translateY(${translateY}px)` : 'none',
        finalTop: targetTop,
        colIndex: shortestCol,
        colSpan,
      });

      // Update column heights
      const newHeight = targetTop + actualHeight + config.gap;
      for (let c = shortestCol; c < shortestCol + colSpan; c++) {
        colHeights[c] = newHeight;
      }
    }

    return transforms;
  }

  /**
   * Calculate final container height based on transforms
   */
  calculateContainerHeight(transforms: Map<string, TransformPosition>): number {
    let maxHeight = 0;

    for (const position of transforms.values()) {
      if (position.finalTop > maxHeight) {
        maxHeight = position.finalTop;
      }
    }

    return maxHeight;
  }

  /**
   * Generate stable key for section
   */
  private getSectionKey(section: CardSection, index: number): string {
    if (section.id) {
      return section.id;
    }
    return `${section.title || 'section'}-${section.type || 'default'}-${index}`;
  }
}
