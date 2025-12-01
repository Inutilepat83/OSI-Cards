/**
 * Local Swap Optimizer Utility
 * 
 * Provides algorithms for optimizing layouts by swapping section positions.
 * After initial placement, tries swapping pairs of sections to find
 * improvements in total container height.
 * 
 * @example
 * ```typescript
 * import { localSwapOptimization } from './local-swap-optimizer.util';
 * 
 * const optimized = localSwapOptimization(sections, sectionHeights, columns, gap);
 * ```
 */

import { generateWidthExpression, generateLeftExpression } from './grid-config.util';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Section with position and span information
 */
export interface SwappableSection {
  key: string;
  colSpan: number;
  left: string;
  top: number;
  width: string;
}

/**
 * Configuration for swap optimization
 */
export interface SwapOptimizerConfig {
  /** Maximum iterations for optimization */
  maxIterations: number;
  /** Maximum vertical distance between sections to consider for swap (px) */
  maxTopDifference: number;
  /** Minimum height improvement to keep a swap (px) */
  minImprovement: number;
  /** Gap between sections */
  gap: number;
}

/** Default configuration */
export const DEFAULT_SWAP_CONFIG: SwapOptimizerConfig = {
  maxIterations: 20,
  maxTopDifference: 150,
  minImprovement: 5,
  gap: 12,
};

// ============================================================================
// LOCAL SWAP OPTIMIZATION
// ============================================================================

/**
 * Optimizes layout by swapping pairs of sections to reduce total height.
 * 
 * Algorithm:
 * 1. Group sections by their "row band" (similar top positions)
 * 2. For each pair of sections in the same band with different spans
 * 3. Simulate swapping their column spans
 * 4. Keep the swap if it reduces total height
 * 
 * @param placedSections - Already positioned sections
 * @param sectionHeights - Map of section keys to actual heights
 * @param columns - Number of columns
 * @param config - Optimization configuration
 * @returns Sections with potentially swapped positions
 */
export function localSwapOptimization<T extends SwappableSection>(
  placedSections: T[],
  sectionHeights: Map<string, number>,
  columns: number,
  config: Partial<SwapOptimizerConfig> = {}
): T[] {
  const fullConfig = { ...DEFAULT_SWAP_CONFIG, ...config };
  
  if (placedSections.length < 2 || columns < 2) {
    return placedSections;
  }

  // Clone for modification
  let result = placedSections.map(s => ({ ...s }));
  const currentHeight = calculateTotalHeight(result, sectionHeights);

  // Limit iterations to avoid performance issues
  const maxIterations = Math.min(placedSections.length * 2, fullConfig.maxIterations);
  let iterations = 0;
  let improved = true;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    // Try swapping pairs of sections with different colSpans
    for (let i = 0; i < result.length - 1 && !improved; i++) {
      for (let j = i + 1; j < result.length && !improved; j++) {
        const sectionA = result[i];
        const sectionB = result[j];

        if (!sectionA || !sectionB) continue;

        // Only consider swapping sections with different spans
        // that are in a similar "row band"
        const topDiff = Math.abs(sectionA.top - sectionB.top);
        if (topDiff > fullConfig.maxTopDifference) continue;

        // Skip if same span - no benefit
        if (sectionA.colSpan === sectionB.colSpan) continue;

        // Try swapping their positions
        const swapped = trySwapSections(
          result,
          i,
          j,
          sectionHeights,
          columns,
          fullConfig.gap
        );

        const swappedHeight = calculateTotalHeight(swapped, sectionHeights);

        // Keep swap if it improves height by at least minImprovement
        if (swappedHeight < currentHeight - fullConfig.minImprovement) {
          result = swapped;
          improved = true;
        }
      }
    }
  }

  return result;
}

/**
 * Tries swapping two sections and re-calculates positions.
 */
function trySwapSections<T extends SwappableSection>(
  sections: T[],
  indexA: number,
  indexB: number,
  sectionHeights: Map<string, number>,
  columns: number,
  gap: number
): T[] {
  const swapped = sections.map(s => ({ ...s }));

  // Swap the sections in the array (which affects their placement order)
  const temp = swapped[indexA];
  swapped[indexA] = swapped[indexB]!;
  swapped[indexB] = temp!;

  // Re-calculate positions with swapped order
  return recalculatePositions(swapped, sectionHeights, columns, gap);
}

/**
 * Recalculates section positions using the FFDH algorithm.
 */
function recalculatePositions<T extends SwappableSection>(
  sections: T[],
  sectionHeights: Map<string, number>,
  columns: number,
  gap: number
): T[] {
  const colHeights = new Array(columns).fill(0) as number[];

  // Sort by height descending
  const sorted = [...sections].sort((a, b) => {
    const heightA = sectionHeights.get(a.key) ?? 200;
    const heightB = sectionHeights.get(b.key) ?? 200;
    return heightB - heightA;
  });

  const result: T[] = [];

  for (const section of sorted) {
    const height = sectionHeights.get(section.key) ?? 200;
    const span = Math.min(section.colSpan, columns);

    // Find best column
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

    // Calculate position
    const widthExpr = generateWidthExpression(columns, span, gap);
    const leftExpr = generateLeftExpression(columns, bestColumn, gap);

    // Update column heights
    const newHeight = minColHeight + height + gap;
    for (let c = bestColumn; c < bestColumn + span; c++) {
      colHeights[c] = newHeight;
    }

    result.push({
      ...section,
      left: leftExpr,
      top: minColHeight,
      width: widthExpr,
    });
  }

  return result;
}

/**
 * Calculates total container height from placed sections.
 */
function calculateTotalHeight<T extends { key: string; top: number }>(
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




