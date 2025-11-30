/**
 * Column Span Optimizer Utility
 * 
 * Provides algorithms for optimizing column spans in masonry grids.
 * For tall multi-column sections, evaluates if narrowing the span would
 * reduce total container height.
 * 
 * @example
 * ```typescript
 * import { optimizeColumnSpans, simulateLayoutHeight } from './column-span-optimizer.util';
 * 
 * const optimized = optimizeColumnSpans(sections, sectionHeights, columns);
 * ```
 */

import { PreferredColumns } from '../types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Section with position information for optimization
 */
export interface OptimizableSection {
  key: string;
  colSpan: number;
  preferredColumns: PreferredColumns;
  top: number;
}

/**
 * Configuration for column span optimization
 */
export interface ColumnSpanOptimizerConfig {
  /** Threshold multiplier for considering a section "tall" */
  tallThresholdMultiplier: number;
  /** Minimum span to reduce to */
  minSpan: number;
}

/** Default configuration */
export const DEFAULT_OPTIMIZER_CONFIG: ColumnSpanOptimizerConfig = {
  tallThresholdMultiplier: 1.5,
  minSpan: 1,
};

// ============================================================================
// COLUMN SPAN OPTIMIZATION
// ============================================================================

/**
 * Optimizes column spans for sections to minimize total container height.
 * 
 * Algorithm:
 * 1. Identify tall multi-column sections (height > average * threshold)
 * 2. For each candidate, simulate layout with current span vs narrower span
 * 3. If narrower span results in lower total height, adjust the span
 * 
 * @param sections - Sections with position information
 * @param sectionHeights - Map of section keys to actual heights
 * @param columns - Number of columns
 * @param config - Optimization configuration
 * @returns Sections with optimized column spans
 */
export function optimizeColumnSpans<T extends OptimizableSection>(
  sections: T[],
  sectionHeights: Map<string, number>,
  columns: number,
  config: ColumnSpanOptimizerConfig = DEFAULT_OPTIMIZER_CONFIG
): T[] {
  if (sections.length < 2 || columns < 2) {
    return sections;
  }

  // Calculate average height
  let totalHeight = 0;
  let count = 0;
  for (const height of sectionHeights.values()) {
    totalHeight += height;
    count++;
  }
  const avgHeight = count > 0 ? totalHeight / count : 200;

  // Threshold: sections taller than average by multiplier are candidates
  const tallThreshold = avgHeight * config.tallThresholdMultiplier;

  // Find multi-column sections that are tall candidates
  const candidates = sections.filter(s => {
    const height = sectionHeights.get(s.key) ?? 200;
    return s.colSpan > 1 && s.preferredColumns > 1 && height > tallThreshold;
  });

  if (candidates.length === 0) {
    return sections;
  }

  // Clone sections for modification
  const optimized = sections.map(s => ({ ...s }));

  for (const candidate of candidates) {
    const idx = optimized.findIndex(s => s.key === candidate.key);
    if (idx < 0) continue;

    const section = optimized[idx];
    if (!section) continue;

    const currentSpan = section.colSpan;

    // Only try reducing by 1 (don't go from 3 to 1 directly)
    const narrowerSpan = Math.max(config.minSpan, currentSpan - 1);

    if (narrowerSpan === currentSpan) continue;

    // Simulate both layouts and compare total heights
    const currentLayoutHeight = simulateLayoutHeight(optimized, sectionHeights, columns);

    // Temporarily modify span
    section.colSpan = narrowerSpan;

    const narrowerLayoutHeight = simulateLayoutHeight(optimized, sectionHeights, columns);

    // Keep narrower span only if it reduces total height
    if (narrowerLayoutHeight < currentLayoutHeight) {
      // Keep the narrower span and update preferred columns
      section.preferredColumns = narrowerSpan as PreferredColumns;
    } else {
      // Revert to original span
      section.colSpan = currentSpan;
    }
  }

  return optimized;
}

/**
 * Simulates layout and returns the total container height.
 * Used for comparing different layout configurations.
 * 
 * @param sections - Sections to simulate
 * @param sectionHeights - Map of section keys to heights
 * @param columns - Number of columns
 * @returns Simulated container height
 */
export function simulateLayoutHeight<T extends OptimizableSection>(
  sections: T[],
  sectionHeights: Map<string, number>,
  columns: number
): number {
  const colHeights = new Array(columns).fill(0) as number[];

  // Sort by height descending (same as real layout)
  const sorted = [...sections].sort((a, b) => {
    const heightA = sectionHeights.get(a.key) ?? 200;
    const heightB = sectionHeights.get(b.key) ?? 200;
    return heightB - heightA;
  });

  for (const section of sorted) {
    const height = sectionHeights.get(section.key) ?? 200;
    const span = Math.min(section.colSpan, columns);

    // Find shortest position for this span
    let bestColumn = 0;
    let minColHeight = Number.MAX_VALUE;

    for (let col = 0; col <= columns - span; col++) {
      let maxHeight = 0;
      for (let c = col; c < col + span; c++) {
        if ((colHeights[c] ?? 0) > maxHeight) {
          maxHeight = colHeights[c] ?? 0;
        }
      }
      if (maxHeight < minColHeight) {
        minColHeight = maxHeight;
        bestColumn = col;
      }
    }

    // Update column heights
    const newHeight = minColHeight + height;
    for (let c = bestColumn; c < bestColumn + span; c++) {
      colHeights[c] = newHeight;
    }
  }

  return Math.max(...colHeights, 0);
}

/**
 * Calculates total container height from placed sections.
 * 
 * @param sections - Positioned sections
 * @param sectionHeights - Map of section keys to heights
 * @returns Total container height
 */
export function calculateTotalHeight<T extends { key: string; top: number }>(
  sections: T[],
  sectionHeights: Map<string, number>
): number {
  let maxBottom = 0;
  for (const section of sections) {
    const height = sectionHeights.get(section.key) ?? 200;
    const bottom = section.top + height;
    if (bottom > maxBottom) {
      maxBottom = bottom;
    }
  }
  return maxBottom;
}

