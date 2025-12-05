/**
 * Column-Based Packing Algorithm
 *
 * Lightweight FFDH (First Fit Decreasing Height) implementation that places
 * each section in the shortest available column, naturally filling gaps and
 * minimizing empty vertical space.
 *
 * Features:
 * - FFDH algorithm by default (fast, effective)
 * - Optional Skyline algorithm for maximum compaction
 * - Hybrid mode: Uses Skyline when gap count exceeds threshold
 * - Supports multi-column spanning sections
 * - Allows reordering by height for optimal packing
 *
 * @example
 * ```typescript
 * import { packSectionsIntoColumns } from './column-packer.util';
 *
 * const result = packSectionsIntoColumns(sections, {
 *   columns: 4,
 *   gap: 12,
 *   packingMode: 'ffdh',
 *   allowReordering: true,
 *   sortByHeight: true
 * });
 * ```
 */

import { CardSection } from '../models/card.model';
import {
  generateWidthExpression,
  generateLeftExpression,
  getPreferredColumns,
  resolveColumnSpan,
  PreferredColumns,
} from './grid-config.util';
import { SkylinePacker, packWithSkyline, skylineResultToPositions } from './skyline-algorithm.util';

// ============================================================================
// HEIGHT ESTIMATION
// ============================================================================

/**
 * Default height estimates per section type (in pixels)
 */
const SECTION_HEIGHT_ESTIMATES: Record<string, number> = {
  overview: 180,
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
  default: 180,
};

const HEIGHT_PER_ITEM = 50;
const HEIGHT_PER_FIELD = 32;
const SECTION_HEADER_HEIGHT = 48;
const SECTION_PADDING = 20;

/**
 * Estimates the height of a section based on its content
 */
function estimateSectionHeight(section: CardSection): number {
  const type = String(section.type ?? 'default').toLowerCase();
  const baseHeight = SECTION_HEIGHT_ESTIMATES[type] ?? SECTION_HEIGHT_ESTIMATES['default'] ?? 120;

  const itemCount = section.items?.length ?? 0;
  const fieldCount = section.fields?.length ?? 0;

  const itemsHeight = itemCount * HEIGHT_PER_ITEM;
  const fieldsHeight = fieldCount * HEIGHT_PER_FIELD;
  const contentHeight = Math.max(itemsHeight, fieldsHeight);

  const estimatedHeight = Math.max(
    baseHeight,
    SECTION_HEADER_HEIGHT + contentHeight + SECTION_PADDING
  );

  return Math.min(estimatedHeight, 500);
}

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Configuration for the column packer algorithm
 */
export interface ColumnPackerConfig {
  /** Total number of columns in the grid (typically 1-4) */
  columns: number;
  /** Gap between items in pixels */
  gap?: number;
  /** Container width in pixels (for Skyline algorithm) */
  containerWidth?: number;
  /** Packing mode: 'ffdh' (default), 'skyline', or 'hybrid' */
  packingMode?: 'ffdh' | 'skyline' | 'hybrid';
  /** Whether to allow reordering sections for optimal packing */
  allowReordering?: boolean;
  /** Whether to sort sections by height before packing */
  sortByHeight?: boolean;
  /** Gap count threshold for hybrid mode to switch to Skyline */
  useSkylineThreshold?: number;
  /** Number of optimization passes for FFDH (default: 1, max: 3) */
  optimizationPasses?: number;
  /** Enable gap-aware placement (considers gap creation when placing) */
  enableGapAwarePlacement?: boolean;
  /** Optional layout preference service for dynamic section preferences */
  layoutPreferenceService?: any; // SectionLayoutPreferenceService
}

/**
 * Default column packer configuration
 */
export const DEFAULT_COLUMN_PACKER_CONFIG: Required<
  Omit<ColumnPackerConfig, 'containerWidth' | 'layoutPreferenceService'>
> = {
  columns: 4,
  gap: 12,
  packingMode: 'ffdh',
  allowReordering: true,
  sortByHeight: true,
  useSkylineThreshold: 1, // Very aggressive: Switch to Skyline at first gap
  optimizationPasses: 4, // Increased: More passes for maximum compactness
  enableGapAwarePlacement: true, // Consider gap creation when placing
};

/**
 * Section with calculated metrics for packing
 */
interface SectionWithMetrics {
  section: CardSection;
  originalIndex: number;
  height: number;
  colSpan: number;
  preferredColumns: PreferredColumns;
  canShrinkToFill?: boolean; // NEW: Can shrink to 1 column to fill grid
  shrinkPriority?: number; // NEW: Priority when multiple sections can shrink
}

/**
 * Positioned section result
 */
export interface ColumnPackedSection {
  section: CardSection;
  colSpan: number;
  preferredColumns: PreferredColumns;
  left: string;
  top: number;
  width: string;
  originalIndex: number;
  columnIndex: number; // Track column index for gap calculation
}

/**
 * Packing result with metrics
 */
export interface ColumnPackingResult {
  positionedSections: ColumnPackedSection[];
  totalHeight: number;
  columns: number;
  utilization: number;
  gapCount: number;
  gapArea?: number;
  heightVariance?: number;
  algorithm: 'ffdh' | 'skyline';
}

// ============================================================================
// FFDH PACKING ALGORITHM
// ============================================================================

/**
 * Finds the best column position for a section using FFDH
 * Returns the column index where the section should be placed
 */
function findShortestColumn(colHeights: number[], colSpan: number, columns: number): number {
  let bestColumn = 0;
  let minHeight = Infinity;

  // Try all possible column positions
  for (let col = 0; col <= columns - colSpan; col++) {
    // Find the maximum height among columns this section would span
    let maxColHeight = 0;
    for (let c = col; c < col + colSpan; c++) {
      const colHeight = colHeights[c] ?? 0;
      if (colHeight > maxColHeight) {
        maxColHeight = colHeight;
      }
    }

    // Choose the position with the lowest maximum height (shortest column)
    if (maxColHeight < minHeight) {
      minHeight = maxColHeight;
      bestColumn = col;
    }
  }

  return bestColumn;
}

/**
 * Packs sections using FFDH (First Fit Decreasing Height) algorithm
 * Enhanced with gap-aware placement and multi-pass optimization
 */
function packWithFFDH(
  sectionsWithMetrics: SectionWithMetrics[],
  columns: number,
  gap: number,
  optimizePasses: number = 1
): ColumnPackedSection[] {
  let positioned: ColumnPackedSection[] = [];
  let bestPositioned: ColumnPackedSection[] = [];
  let bestMetrics = { gapCount: Infinity, heightVariance: Infinity, totalHeight: Infinity };

  // Multi-pass optimization: try different strategies and pick the best
  for (let pass = 0; pass < optimizePasses; pass++) {
    const colHeights = new Array(columns).fill(0);
    positioned = [];

    // Strategy variation: try different sorting strategies for better consolidation
    let orderedSections = sectionsWithMetrics;
    if (pass > 0) {
      // Alternate strategies for different passes
      if (pass % 3 === 1) {
        // Single-column first: prioritize 1-column sections to maximize side-by-side placement
        orderedSections = [...sectionsWithMetrics].sort((a, b) => {
          const aIsSingle = a.colSpan === 1 ? 1 : 0;
          const bIsSingle = b.colSpan === 1 ? 1 : 0;
          if (aIsSingle !== bIsSingle) return bIsSingle - aIsSingle; // Single columns first
          return b.height - a.height; // Then by height
        });
      } else if (pass % 3 === 2) {
        // Density-first: prioritize sections with more content
        orderedSections = [...sectionsWithMetrics].sort((a, b) => {
          const densityA = (a.section.items?.length ?? 0) + (a.section.fields?.length ?? 0);
          const densityB = (b.section.items?.length ?? 0) + (b.section.fields?.length ?? 0);
          return densityB - densityA;
        });
      } else {
        // Width-first: prioritize wider sections to fill rows better
        orderedSections = [...sectionsWithMetrics].sort((a, b) => b.colSpan - a.colSpan);
      }
    }

    for (const item of orderedSections) {
      const { section, height, colSpan, preferredColumns, originalIndex, canShrinkToFill } = item;

      // AGGRESSIVE SHRINKING: Try shrinking to 1 column if canShrinkToFill is true
      // This maximizes horizontal space utilization by placing more sections side by side
      let effectiveColSpan = Math.min(colSpan, columns);
      if (canShrinkToFill && effectiveColSpan > 1) {
        // Check if shrinking to 1 column would fill a gap better
        const shrinkScore = findShortestColumnWithGapAwareness(colHeights, 1, columns, height, gap);
        const shrinkMaxHeight = Math.max(
          ...Array.from({ length: 1 }, (_, i) => colHeights[shrinkScore + i] ?? 0)
        );

        const normalScore = findShortestColumnWithGapAwareness(
          colHeights,
          effectiveColSpan,
          columns,
          height,
          gap
        );
        const normalMaxHeight = Math.max(
          ...Array.from({ length: effectiveColSpan }, (_, i) => colHeights[normalScore + i] ?? 0)
        );

        // Very aggressive shrinking: prioritize horizontal placement
        // Shrink if heights are similar OR if it reduces gap creation
        const heightDiff = normalMaxHeight - shrinkMaxHeight;
        const heightSimilarity = Math.abs(heightDiff) < 30; // Heights within 30px are "similar"

        // Always shrink if heights are similar (promotes side-by-side)
        // Or shrink if it reduces gap significantly
        if (heightSimilarity || heightDiff > 5 || (effectiveColSpan >= 2 && heightDiff >= 0)) {
          effectiveColSpan = 1;
        }
      }

      // Enhanced placement: consider gap creation when choosing position
      const bestColumn = findShortestColumnWithGapAwareness(
        colHeights,
        effectiveColSpan,
        columns,
        height,
        gap
      );

      // Calculate top position: max height among columns this section will span
      let maxColHeight = 0;
      for (let c = bestColumn; c < bestColumn + effectiveColSpan; c++) {
        if (colHeights[c] > maxColHeight) {
          maxColHeight = colHeights[c];
        }
      }
      const top = maxColHeight;

      // Update column heights
      const newHeight = top + height + gap;
      for (let c = bestColumn; c < bestColumn + effectiveColSpan; c++) {
        colHeights[c] = newHeight;
      }

      // Generate CSS expressions
      const left = generateLeftExpression(columns, bestColumn, gap);
      const width = generateWidthExpression(columns, effectiveColSpan, gap);

      positioned.push({
        section,
        colSpan: effectiveColSpan,
        preferredColumns,
        left,
        top,
        width,
        originalIndex,
        columnIndex: bestColumn,
      });
    }

    // Evaluate this pass
    const totalHeight = Math.max(
      ...positioned.map((p) => p.top + estimateSectionHeight(p.section)),
      0
    );
    const metrics = calculateMetrics(positioned, totalHeight, columns, gap);

    // Keep the best result
    // Enhanced scoring: prioritize horizontal placement and consolidation
    // Count how many sections are placed side-by-side (same top position)
    // Tighter tolerance (30px) for better row detection and consolidation
    const rowGroups = new Map<number, number>();
    for (const p of positioned) {
      const rowKey = Math.floor(p.top / 30); // Group by approximate row (30px tolerance for tighter grouping)
      rowGroups.set(rowKey, (rowGroups.get(rowKey) || 0) + 1);
    }
    const avgSectionsPerRow =
      rowGroups.size > 0
        ? Array.from(rowGroups.values()).reduce((sum, count) => sum + count, 0) / rowGroups.size
        : 0;
    const horizontalBonus = avgSectionsPerRow * 75; // Increased bonus for more sections per row (better consolidation)

    // Lower score = better (we subtract horizontalBonus to reward side-by-side placement)
    const score = metrics.gapCount * 1000 + metrics.heightVariance + totalHeight - horizontalBonus;

    // Calculate bestScore with previous best's horizontal bonus (if exists)
    let bestHorizontalBonus = 0;
    if (bestPositioned.length > 0) {
      const bestRowGroups = new Map<number, number>();
      for (const p of bestPositioned) {
        const rowKey = Math.floor(p.top / 30); // Tighter tolerance for better consolidation
        bestRowGroups.set(rowKey, (bestRowGroups.get(rowKey) || 0) + 1);
      }
      const bestAvgSectionsPerRow =
        bestRowGroups.size > 0
          ? Array.from(bestRowGroups.values()).reduce((sum, count) => sum + count, 0) /
            bestRowGroups.size
          : 0;
      bestHorizontalBonus = bestAvgSectionsPerRow * 50;
    }
    const bestScore =
      bestMetrics.gapCount * 1000 +
      bestMetrics.heightVariance +
      bestMetrics.totalHeight -
      bestHorizontalBonus;

    if (score < bestScore) {
      bestPositioned = positioned;
      bestMetrics = { ...metrics, totalHeight };
    }
  }

  return bestPositioned.length > 0 ? bestPositioned : positioned;
}

/**
 * Enhanced column finder that considers gap creation
 * Prefers positions that minimize both height and gap creation
 */
function findShortestColumnWithGapAwareness(
  colHeights: number[],
  colSpan: number,
  columns: number,
  sectionHeight: number,
  gap: number
): number {
  let bestColumn = 0;
  let minScore = Infinity;

  for (let col = 0; col <= columns - colSpan; col++) {
    // Find the maximum height among columns this section would span
    let maxColHeight = 0;
    for (let c = col; c < col + colSpan; c++) {
      const colHeight = colHeights[c] ?? 0;
      if (colHeight > maxColHeight) {
        maxColHeight = colHeight;
      }
    }

    // Calculate gap score: how much empty space would be created
    const remainingCols = columns - col - colSpan;
    const gapScore = calculateGapScoreForPosition(colHeights, col, colSpan, columns, maxColHeight);

    // Combined score: prioritize horizontal placement and gap minimization
    // Very aggressive: strongly favor side-by-side placement
    // Lower height weight even more to maximize horizontal packing
    const score = maxColHeight * 0.5 + gapScore * 150;

    if (score < minScore) {
      minScore = score;
      bestColumn = col;
    }
  }

  return bestColumn;
}

/**
 * Calculate gap score for a potential placement position
 * Lower score = better (less gaps created)
 * Enhanced to better detect opportunities for horizontal placement
 */
function calculateGapScoreForPosition(
  colHeights: number[],
  startCol: number,
  colSpan: number,
  columns: number,
  placementHeight: number
): number {
  let gapScore = 0;

  // Check columns before placement
  for (let c = 0; c < startCol; c++) {
    const heightDiff = placementHeight - (colHeights[c] ?? 0);
    if (heightDiff > 5) {
      // Very aggressive: detect gaps > 5px
      // Significant gap would be created - penalize heavily
      gapScore += heightDiff * 2.0; // Increased penalty for better consolidation
    }
  }

  // Check columns after placement
  for (let c = startCol + colSpan; c < columns; c++) {
    const heightDiff = placementHeight - (colHeights[c] ?? 0);
    if (heightDiff > 5) {
      // Very aggressive: detect gaps > 5px
      gapScore += heightDiff * 2.0; // Increased penalty
    }
  }

  // Bonus: Prefer placements that create balanced row heights (promotes side-by-side)
  const avgHeight = colHeights.reduce((sum, h) => sum + h, 0) / columns;
  const heightVariance = Math.abs(placementHeight - avgHeight);
  if (heightVariance < 40) {
    gapScore -= 30; // Increased reward for balanced rows (better consolidation)
  }

  return gapScore;
}

/**
 * Calculates packing metrics with enhanced gap detection
 */
function calculateMetrics(
  positioned: ColumnPackedSection[],
  totalHeight: number,
  columns: number,
  gap: number
): { utilization: number; gapCount: number; gapArea: number; heightVariance: number } {
  // Calculate total area
  const totalArea = columns * totalHeight;

  // Calculate used area
  const usedArea = positioned.reduce((sum, p) => {
    const height = estimateSectionHeight(p.section);
    return sum + p.colSpan * height;
  }, 0);

  // Utilization percentage
  const utilization = totalArea > 0 ? (usedArea / totalArea) * 100 : 0;

  // Calculate actual column heights by tracking placements
  const colHeights = new Array(columns).fill(0);
  for (const pos of positioned) {
    const height = estimateSectionHeight(pos.section);
    const top = pos.top;
    const bottom = top + height + gap;

    // Use tracked column index
    const startCol = pos.columnIndex;
    const endCol = Math.min(columns, startCol + pos.colSpan);

    // Update heights for all columns this section spans
    for (let c = startCol; c < endCol; c++) {
      if (bottom > colHeights[c]) {
        colHeights[c] = bottom;
      }
    }
  }

  // Enhanced gap detection: count gaps and calculate gap area
  const maxHeight = Math.max(...colHeights, totalHeight);
  const minHeight = Math.min(...colHeights.filter((h) => h > 0), maxHeight);
  const heightVariance = maxHeight - minHeight;

  // Count gaps: columns that are significantly shorter than the maximum height
  // Very aggressive: lowered threshold to 10px for maximum consolidation
  const gapThreshold = 10;
  const gapCount = colHeights.filter((h) => h < maxHeight - gapThreshold).length;

  // Calculate total gap area (unused vertical space)
  const gapArea = colHeights.reduce((sum, h) => {
    const gapHeight = Math.max(0, maxHeight - h - gapThreshold);
    return sum + gapHeight;
  }, 0);

  return {
    utilization: Math.round(utilization * 100) / 100,
    gapCount,
    gapArea: Math.round(gapArea),
    heightVariance: Math.round(heightVariance),
  };
}

// ============================================================================
// MAIN PACKING FUNCTION
// ============================================================================

/**
 * Packs sections into columns using the specified algorithm
 *
 * @param sections - Sections to pack
 * @param config - Packing configuration
 * @returns Packing result with positioned sections and metrics
 */
export function packSectionsIntoColumns(
  sections: CardSection[],
  config: ColumnPackerConfig
): ColumnPackingResult {
  const fullConfig = {
    ...DEFAULT_COLUMN_PACKER_CONFIG,
    ...config,
  };

  const {
    columns,
    gap,
    containerWidth,
    packingMode,
    allowReordering,
    sortByHeight,
    useSkylineThreshold,
  } = fullConfig;

  if (sections.length === 0) {
    return {
      positionedSections: [],
      totalHeight: 0,
      columns,
      utilization: 0,
      gapCount: 0,
      algorithm: 'ffdh',
    };
  }

  // Debug logging - only in development mode
  const isDevelopment =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (
    isDevelopment &&
    (packingMode === 'hybrid' || packingMode === 'skyline' || sections.length > 10)
  ) {
    console.log('[ColumnPacker] 🚀 Starting packing', {
      sectionCount: sections.length,
      columns,
      gap,
      packingMode,
      allowReordering: fullConfig.allowReordering,
      sortByHeight: fullConfig.sortByHeight,
      containerWidth,
    });
  }

  // Prepare sections with metrics
  const sectionsWithMetrics: SectionWithMetrics[] = sections.map((section, index) => {
    // Try to get layout preferences from service if available
    let preferredColumns: PreferredColumns = 2;
    let canShrinkToFill = false;
    let shrinkPriority = 50;

    if (fullConfig.layoutPreferenceService) {
      const layoutPrefs = fullConfig.layoutPreferenceService.getPreferences(section, columns);
      if (layoutPrefs) {
        preferredColumns = layoutPrefs.preferredColumns;
        canShrinkToFill = layoutPrefs.canShrinkToFill;
        shrinkPriority = layoutPrefs.shrinkPriority ?? 50;
      } else {
        preferredColumns = getPreferredColumns(
          String(section.type ?? 'default'),
          undefined,
          undefined,
          columns
        );
      }
    } else {
      preferredColumns = getPreferredColumns(
        String(section.type ?? 'default'),
        undefined,
        undefined,
        columns
      );
    }

    const colSpan = resolveColumnSpan(
      preferredColumns,
      columns,
      section.colSpan,
      undefined,
      canShrinkToFill
    );

    return {
      section,
      originalIndex: index,
      height: estimateSectionHeight(section),
      colSpan,
      preferredColumns,
      canShrinkToFill,
      shrinkPriority,
    };
  });

  // Sort by height if enabled (FFDH = First Fit Decreasing Height)
  let orderedSections = sectionsWithMetrics;
  if (sortByHeight) {
    orderedSections = [...sectionsWithMetrics].sort((a, b) => b.height - a.height);
  }

  // Determine which algorithm to use
  let useSkyline = packingMode === 'skyline';
  let positioned: ColumnPackedSection[];

  if (useSkyline || (packingMode === 'hybrid' && containerWidth)) {
    // Use Skyline algorithm
    const skylineResult = packWithSkyline(
      orderedSections.map((s) => s.section),
      columns,
      containerWidth ?? 1200,
      {
        gap,
        useBestFit: true,
        sortByHeight: true,
      }
    );

    const skylinePositions = skylineResultToPositions(skylineResult, columns, gap);

    // Map back to our format, preserving original indices
    // Create lookup map for O(1) access instead of O(n) find()
    const sectionToMetrics = new Map(orderedSections.map((s) => [s.section, s]));

    positioned = skylinePositions.map((pos, skylineIndex) => {
      // Use Map lookup instead of find() for better performance
      const originalItem = sectionToMetrics.get(pos.section);

      // Parse column index from left CSS expression
      let columnIndex = 0;
      if (pos.left !== '0px' && pos.left.includes('calc')) {
        const match = pos.left.match(/\*\s*(\d+)\s*\)/);
        if (match && match[1]) {
          columnIndex = parseInt(match[1], 10);
        }
      }

      return {
        section: pos.section,
        colSpan: pos.colSpan,
        preferredColumns: originalItem?.preferredColumns ?? (1 as PreferredColumns),
        left: pos.left,
        top: pos.top,
        width: pos.width,
        originalIndex: originalItem?.originalIndex ?? skylineIndex,
        columnIndex,
      };
    });

    // Restore original order if reordering is disabled
    if (!allowReordering) {
      positioned.sort((a, b) => a.originalIndex - b.originalIndex);
    }
  } else {
    // Use FFDH algorithm with multi-pass optimization
    const optimizationPasses = fullConfig.optimizationPasses ?? 2;
    const enableGapAware = fullConfig.enableGapAwarePlacement ?? true;

    positioned = packWithFFDH(
      orderedSections,
      columns,
      gap,
      enableGapAware ? optimizationPasses : 1
    );

    // Restore original order if reordering is disabled
    if (!allowReordering) {
      positioned.sort((a, b) => a.originalIndex - b.originalIndex);
    }

    // In hybrid mode, check if we should switch to Skyline
    if (packingMode === 'hybrid' && containerWidth) {
      const totalHeight = Math.max(
        ...positioned.map((p) => p.top + estimateSectionHeight(p.section)),
        0
      );
      const metrics = calculateMetrics(positioned, totalHeight, columns, gap);

      if (metrics.gapCount >= useSkylineThreshold) {
        // Re-run with Skyline for better compaction
        const skylineResult = packWithSkyline(
          orderedSections.map((s) => s.section),
          columns,
          containerWidth,
          {
            gap,
            useBestFit: true,
            sortByHeight: true,
          }
        );

        const skylinePositions = skylineResultToPositions(skylineResult, columns, gap);
        // Create lookup map for O(1) access instead of O(n) find()
        const sectionToMetrics = new Map(orderedSections.map((s) => [s.section, s]));

        positioned = skylinePositions.map((pos, skylineIndex) => {
          // Use Map lookup instead of find() for better performance
          const originalItem = sectionToMetrics.get(pos.section);

          // Parse column index from left CSS expression
          let columnIndex = 0;
          if (pos.left !== '0px' && pos.left.includes('calc')) {
            const match = pos.left.match(/\*\s*(\d+)\s*\)/);
            if (match && match[1]) {
              columnIndex = parseInt(match[1], 10);
            }
          }

          return {
            section: pos.section,
            colSpan: pos.colSpan,
            preferredColumns: originalItem?.preferredColumns ?? (1 as PreferredColumns),
            left: pos.left,
            top: pos.top,
            width: pos.width,
            originalIndex: originalItem?.originalIndex ?? skylineIndex,
            columnIndex,
          };
        });

        if (!allowReordering) {
          positioned.sort((a, b) => a.originalIndex - b.originalIndex);
        }

        useSkyline = true;
      }
    }
  }

  // Calculate total height
  const totalHeight = Math.max(
    ...positioned.map((p) => p.top + estimateSectionHeight(p.section)),
    0
  );

  // Calculate metrics
  const metrics = calculateMetrics(positioned, totalHeight, columns, gap);

  // Debug logging - only in development mode (reuse isDevelopment from above)
  if (
    isDevelopment &&
    (packingMode === 'hybrid' ||
      packingMode === 'skyline' ||
      metrics.gapCount > 0 ||
      sections.length > 10)
  ) {
    const columnHeights = Array.from({ length: columns }, (_, i) => {
      const colSections = positioned.filter((p) => {
        const startCol = p.columnIndex;
        const endCol = startCol + p.colSpan;
        return i >= startCol && i < endCol;
      });
      return colSections.length > 0
        ? Math.max(...colSections.map((p) => p.top + estimateSectionHeight(p.section)), 0)
        : 0;
    });

    console.log('[ColumnPacker] ✅ Packing complete', {
      algorithm: useSkyline ? 'skyline' : 'ffdh',
      totalHeight: Math.round(totalHeight),
      utilization: metrics.utilization.toFixed(1) + '%',
      gapCount: metrics.gapCount,
      gapArea: metrics.gapArea,
      heightVariance: metrics.heightVariance,
      sections: positioned.length,
      columnHeights: columnHeights.map((h) => Math.round(h)),
      maxColumnHeight: Math.max(...columnHeights),
      minColumnHeight: Math.min(...columnHeights.filter((h) => h > 0)),
    });
  }

  return {
    positionedSections: positioned,
    totalHeight,
    columns,
    utilization: metrics.utilization,
    gapCount: metrics.gapCount,
    gapArea: metrics.gapArea,
    heightVariance: metrics.heightVariance,
    algorithm: useSkyline ? 'skyline' : 'ffdh',
  };
}

/**
 * Converts column packing result to positioned sections format
 * (for compatibility with existing layout service)
 */
export function columnPackingResultToPositions(result: ColumnPackingResult): Array<{
  section: CardSection;
  colSpan: number;
  preferredColumns: PreferredColumns;
  left: string;
  top: number;
  width: string;
}> {
  return result.positionedSections.map((pos) => ({
    section: pos.section,
    colSpan: pos.colSpan,
    preferredColumns: pos.preferredColumns,
    left: pos.left,
    top: pos.top,
    width: pos.width,
  }));
}
