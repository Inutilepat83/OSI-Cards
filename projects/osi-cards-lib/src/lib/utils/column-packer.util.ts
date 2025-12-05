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
  product: 260,
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
}

/**
 * Default column packer configuration
 */
export const DEFAULT_COLUMN_PACKER_CONFIG: Required<Omit<ColumnPackerConfig, 'containerWidth'>> = {
  columns: 4,
  gap: 12,
  packingMode: 'ffdh',
  allowReordering: true,
  sortByHeight: true,
  useSkylineThreshold: 3, // Switch to Skyline if gap count >= 3
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
 */
function packWithFFDH(
  sectionsWithMetrics: SectionWithMetrics[],
  columns: number,
  gap: number
): ColumnPackedSection[] {
  const colHeights = new Array(columns).fill(0);
  const positioned: ColumnPackedSection[] = [];

  for (const item of sectionsWithMetrics) {
    const { section, height, colSpan, preferredColumns, originalIndex } = item;
    const effectiveColSpan = Math.min(colSpan, columns);

    // Find shortest column position
    const bestColumn = findShortestColumn(colHeights, effectiveColSpan, columns);

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

  return positioned;
}

/**
 * Calculates packing metrics
 */
function calculateMetrics(
  positioned: ColumnPackedSection[],
  totalHeight: number,
  columns: number,
  gap: number
): { utilization: number; gapCount: number } {
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

  // Count gaps: columns that are shorter than the maximum height
  const maxHeight = Math.max(...colHeights, totalHeight);
  const gapCount = colHeights.filter((h) => h < maxHeight - 1).length; // -1 to account for floating point

  return {
    utilization: Math.round(utilization * 100) / 100,
    gapCount,
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

  // Debug logging
  if (packingMode === 'hybrid' || packingMode === 'skyline' || sections.length > 10) {
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
    const preferredColumns = getPreferredColumns(String(section.type ?? 'default'));
    const colSpan = resolveColumnSpan(preferredColumns, columns, section.colSpan);

    return {
      section,
      originalIndex: index,
      height: estimateSectionHeight(section),
      colSpan,
      preferredColumns,
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
    // Parse column index from left position for Skyline results
    positioned = skylinePositions.map((pos, skylineIndex) => {
      // Find the original section by matching
      const originalItem = orderedSections.find((s) => s.section === pos.section);

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
    // Use FFDH algorithm
    positioned = packWithFFDH(orderedSections, columns, gap);

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
        positioned = skylinePositions.map((pos, skylineIndex) => {
          const originalItem = orderedSections.find((s) => s.section === pos.section);

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

  // Debug logging - always log for hybrid/skyline, or when gaps are detected
  if (
    packingMode === 'hybrid' ||
    packingMode === 'skyline' ||
    metrics.gapCount > 0 ||
    sections.length > 10
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
      sections: positioned.length,
      columnHeights: columnHeights.map((h) => Math.round(h)),
      maxColumnHeight: Math.max(...columnHeights),
      minColumnHeight: Math.min(...columnHeights.filter((h) => h > 0)),
      heightVariance: Math.max(...columnHeights) - Math.min(...columnHeights.filter((h) => h > 0)),
    });
  }

  return {
    positionedSections: positioned,
    totalHeight,
    columns,
    utilization: metrics.utilization,
    gapCount: metrics.gapCount,
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
