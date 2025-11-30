/**
 * Gap Filler Optimizer Utility
 * 
 * Provides algorithms for filling gaps in masonry grid layouts.
 * After initial placement, analyzes the layout for gaps and attempts
 * to fill them by repositioning flexible sections.
 * 
 * @example
 * ```typescript
 * import { optimizeLayoutGaps, findLayoutGaps } from './gap-filler-optimizer.util';
 * 
 * const optimized = optimizeLayoutGaps(sections, columns, containerWidth, sectionHeights);
 * ```
 */

import { generateWidthExpression, generateLeftExpression } from './grid-config.util';
import { PreferredColumns } from '../types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Section with position information for gap analysis
 */
export interface GapAnalyzableSection {
  key: string;
  colSpan: number;
  preferredColumns: PreferredColumns;
  left: string;
  top: number;
  width: string;
}

/**
 * Gap information in the layout
 */
export interface LayoutGap {
  /** Column index where gap starts */
  column: number;
  /** Top position of gap (px) */
  top: number;
  /** Height of gap (px) */
  height: number;
  /** Width of gap in columns */
  width: number;
}

/**
 * Configuration for gap filling
 */
export interface GapFillerConfig {
  /** Grid resolution for gap detection (px) */
  gridResolution: number;
  /** Minimum gap height to consider (px) */
  minGapHeight: number;
  /** Height tolerance when fitting sections (px) */
  heightTolerance: number;
  /** Gap between sections */
  gap: number;
}

/** Default configuration */
export const DEFAULT_GAP_FILLER_CONFIG: GapFillerConfig = {
  gridResolution: 10,
  minGapHeight: 100,
  heightTolerance: 20,
  gap: 12,
};

// ============================================================================
// GAP ANALYSIS
// ============================================================================

/**
 * Finds gaps in the current layout where sections could be placed.
 * Uses a grid-based approach to identify empty spaces.
 * 
 * @param sections - Sections with height information
 * @param columns - Number of columns
 * @param config - Configuration options
 * @returns Array of gaps with position and size
 */
export function findLayoutGaps<T extends GapAnalyzableSection & { height: number }>(
  sections: T[],
  columns: number,
  config: Partial<GapFillerConfig> = {}
): LayoutGap[] {
  const fullConfig = { ...DEFAULT_GAP_FILLER_CONFIG, ...config };
  const gaps: LayoutGap[] = [];

  if (sections.length === 0) {
    return gaps;
  }

  // Calculate container height from sections
  const containerHeight = Math.max(
    ...sections.map(s => s.top + s.height),
    0
  );

  if (containerHeight === 0) {
    return gaps;
  }

  // Build occupancy grid
  const rows = Math.ceil(containerHeight / fullConfig.gridResolution);
  const grid: boolean[][] = Array.from({ length: rows }, () =>
    new Array(columns).fill(false) as boolean[]
  );

  // Mark occupied cells
  for (const section of sections) {
    const startRow = Math.floor(section.top / fullConfig.gridResolution);
    const endRow = Math.min(Math.ceil((section.top + section.height) / fullConfig.gridResolution), rows);
    const startCol = parseColumnIndex(section.left, columns, fullConfig.gap);
    const endCol = Math.min(startCol + section.colSpan, columns);

    for (let r = startRow; r < endRow; r++) {
      const row = grid[r];
      if (row) {
        for (let c = startCol; c < endCol; c++) {
          row[c] = true;
        }
      }
    }
  }

  // Find contiguous unoccupied regions (gaps)
  for (let c = 0; c < columns; c++) {
    let gapStart: number | null = null;

    for (let r = 0; r < rows; r++) {
      const isOccupied = grid[r]?.[c] ?? false;

      if (!isOccupied && gapStart === null) {
        gapStart = r;
      } else if (isOccupied && gapStart !== null) {
        const gapHeight = (r - gapStart) * fullConfig.gridResolution;
        if (gapHeight >= fullConfig.minGapHeight) {
          gaps.push({
            column: c,
            top: gapStart * fullConfig.gridResolution,
            height: gapHeight,
            width: 1, // Single column gap
          });
        }
        gapStart = null;
      }
    }

    // Don't count gaps at the bottom as they're not "internal" gaps
  }

  // Sort gaps by area (largest first) to prioritize filling bigger gaps
  gaps.sort((a, b) => (b.height * b.width) - (a.height * a.width));

  return gaps;
}

/**
 * Optimizes layout by filling gaps with movable sections.
 * 
 * Algorithm:
 * 1. Build an occupancy grid from current section positions
 * 2. Identify significant gaps (empty spaces between sections)
 * 3. Find single-column sections that could fit in gaps
 * 4. Reposition sections to fill gaps without increasing total height
 * 
 * @param sections - Currently positioned sections
 * @param columns - Number of columns
 * @param sectionHeights - Map of section keys to heights
 * @param config - Configuration options
 * @returns Optimized section array (same reference if no changes made)
 */
export function optimizeLayoutGaps<T extends GapAnalyzableSection>(
  sections: T[],
  columns: number,
  sectionHeights: Map<string, number>,
  config: Partial<GapFillerConfig> = {}
): T[] {
  const fullConfig = { ...DEFAULT_GAP_FILLER_CONFIG, ...config };
  
  if (sections.length < 2 || columns < 2) {
    return sections; // No optimization possible
  }

  // Build sections with height info for gap analysis
  const sectionsWithHeight = sections.map(s => ({
    ...s,
    height: sectionHeights.get(s.key) ?? 200,
  }));

  // Find gaps in current layout
  const gaps = findLayoutGaps(sectionsWithHeight, columns, fullConfig);

  if (gaps.length === 0) {
    return sections; // No gaps to fill
  }

  // Find candidate sections that could fill gaps
  // Prefer single-column, low-priority sections for repositioning
  const movableSections = sections
    .map((s, idx) => ({
      section: s,
      index: idx,
      height: sectionHeights.get(s.key) ?? 200,
    }))
    .filter(
      ({ section }) =>
        section.colSpan === 1 && section.preferredColumns === 1
    )
    .sort((a, b) => b.section.top - a.section.top); // Start from bottom sections

  if (movableSections.length === 0) {
    return sections; // No movable sections
  }

  // Try to fill gaps with movable sections
  const result = [...sections];
  let madeChanges = false;

  for (const gap of gaps) {
    // Find a section that fits in this gap
    const candidate = movableSections.find(
      ({ section, height }) =>
        section.colSpan <= gap.width &&
        height <= gap.height + fullConfig.heightTolerance
    );

    if (candidate) {
      // Move section to fill the gap
      const targetIndex = result.findIndex(s => s.key === candidate.section.key);
      const targetSection = result[targetIndex];
      if (targetIndex >= 0 && targetSection) {
        const movedSection: T = {
          ...targetSection,
          left: generateLeftExpression(columns, gap.column, fullConfig.gap),
          top: gap.top,
          width: generateWidthExpression(columns, candidate.section.colSpan, fullConfig.gap),
        };
        result[targetIndex] = movedSection;
        madeChanges = true;

        // Remove from movable list to avoid reusing
        const movableIdx = movableSections.findIndex(
          m => m.section.key === candidate.section.key
        );
        if (movableIdx >= 0) {
          movableSections.splice(movableIdx, 1);
        }
      }
    }
  }

  return madeChanges ? result : sections;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse column index from CSS calc expression
 */
function parseColumnIndex(left: string, columns: number, gap: number): number {
  // Handle "0px" case
  if (left === '0px' || left === '0') return 0;

  // Try to extract column index from calc expression pattern
  // Pattern: calc((calc((100% - Xpx) / N) + Ypx) * INDEX)
  const indexMatch = left.match(/\*\s*(\d+)\s*\)/);
  if (indexMatch?.[1]) {
    return parseInt(indexMatch[1], 10);
  }

  // Try to parse px value and estimate column
  const pxMatch = left.match(/(\d+)px/);
  if (pxMatch?.[1]) {
    // Rough estimation based on typical column widths
    const pxValue = parseInt(pxMatch[1], 10);
    const estimatedColWidth = 260 + gap;
    return Math.round(pxValue / estimatedColWidth);
  }

  return 0;
}

