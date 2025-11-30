/**
 * Layout Optimizer Utilities
 * 
 * Extracted layout optimization algorithms from MasonryGridComponent.
 * These algorithms handle column assignment, gap prediction, and layout optimization.
 */

import { CardSection } from '../models/card.model';
import { 
  PreferredColumns, 
  generateWidthExpression, 
  generateLeftExpression, 
  GRID_GAP,
  shouldExpandSection,
  SectionExpansionInfo,
  ExpansionResult,
  calculateBasicDensity
} from './grid-config.util';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Column assignment result from optimization
 */
export interface ColumnAssignment {
  /** The column index where the section should be placed */
  columnIndex: number;
  /** The effective column span after constraint negotiation */
  colSpan: number;
  /** Whether the section was expanded to fill orphan space */
  expanded: boolean;
  /** Reason for the expansion decision (for debugging) */
  expansionReason?: string;
}

/**
 * Positioned section with layout information
 */
export interface PositionedSectionBase {
  /** The original section data */
  section: CardSection;
  /** Unique key for tracking */
  key: string;
  /** Number of columns this section spans */
  colSpan: number;
  /** Preferred number of columns */
  preferredColumns: PreferredColumns;
  /** CSS left position expression */
  left: string;
  /** Top position in pixels */
  top: number;
  /** CSS width expression */
  width: string;
  /** Whether this is a new section for animation */
  isNew?: boolean;
  /** Whether animation has completed */
  hasAnimated?: boolean;
}

/**
 * Gap information in the layout
 */
export interface LayoutGap {
  /** Column index where the gap starts */
  column: number;
  /** Top position of the gap in pixels */
  top: number;
  /** Height of the gap in pixels */
  height: number;
  /** Width of the gap in columns */
  width: number;
}

/**
 * Configuration for layout optimization
 */
export interface LayoutOptimizerConfig {
  /** Gap between columns/rows in pixels */
  gap: number;
  /** Minimum column width in pixels */
  minColumnWidth: number;
  /** Whether to enable gap prediction */
  enableGapPrediction: boolean;
}

/**
 * Default layout optimizer configuration
 */
export const DEFAULT_LAYOUT_CONFIG: LayoutOptimizerConfig = {
  gap: GRID_GAP,
  minColumnWidth: 260,
  enableGapPrediction: true,
};

// ============================================================================
// COLUMN ASSIGNMENT ALGORITHMS
// ============================================================================

/**
 * Finds the optimal column assignment for a section.
 * Implements the column negotiation algorithm with gap prediction:
 * 1. Find the shortest column(s) that can fit the requested span
 * 2. If preferred span doesn't fit, try smaller spans (graceful degradation)
 * 3. Predict if placement would create unfillable gaps based on pending sections
 * 4. Expand to fill orphan space only if type-aware limits allow and content density is sufficient
 * 
 * @param colHeights - Array of current column heights
 * @param preferredSpan - The section's preferred column span
 * @param columns - Total available columns
 * @param containerWidth - Current container width
 * @param config - Layout optimizer configuration
 * @param pendingSections - Optional array of sections still to be placed (for gap prediction)
 * @param sectionInfo - Optional section information for type-aware expansion
 * @returns Column assignment with columnIndex, colSpan, expansion flag, and reason
 */
export function findOptimalColumnAssignment(
  colHeights: number[],
  preferredSpan: number,
  columns: number,
  containerWidth: number,
  config: LayoutOptimizerConfig = DEFAULT_LAYOUT_CONFIG,
  pendingSections?: PositionedSectionBase[],
  sectionInfo?: SectionExpansionInfo
): ColumnAssignment {
  // Ensure span doesn't exceed available columns
  let targetSpan = Math.min(preferredSpan, columns);
  
  // Graceful degradation: if preferred span doesn't fit anywhere,
  // try smaller spans until we find one that works
  while (targetSpan > 1) {
    const canFit = canFitSpan(colHeights, targetSpan, columns);
    if (canFit >= 0) {
      break;
    }
    targetSpan--;
  }
  
  // Find the best column position for the target span
  // Now considers gap prediction to avoid creating unfillable gaps
  let bestColumn = 0;
  let minHeight = Number.MAX_VALUE;
  let bestGapScore = Number.MAX_VALUE;
  
  for (let col = 0; col <= columns - targetSpan; col++) {
    // Find the maximum height across the columns this span would occupy
    let maxColHeight = 0;
    for (let c = col; c < col + targetSpan; c++) {
      const colHeight = colHeights[c] ?? 0;
      if (colHeight > maxColHeight) {
        maxColHeight = colHeight;
      }
    }
    
    // Calculate gap score: how much unfillable space would this placement create?
    const gapScore = config.enableGapPrediction 
      ? calculateGapScore(colHeights, col, targetSpan, columns, pendingSections)
      : 0;
    
    if (maxColHeight < minHeight || (maxColHeight === minHeight && gapScore < bestGapScore)) {
      minHeight = maxColHeight;
      bestColumn = col;
      bestGapScore = gapScore;
    }
  }
  
  // Check if we should expand to fill orphan space
  const remainingCols = columns - bestColumn - targetSpan;
  
  // Determine if any pending section can fit in the remaining space
  const canPendingFit = canAnyPendingSectionFit(remainingCols, pendingSections);
  
  // Use the new type-aware expansion decision function
  const expansionResult: ExpansionResult = shouldExpandSection(
    sectionInfo ?? { type: 'default' },
    {
      currentSpan: targetSpan,
      remainingColumns: remainingCols,
      totalColumns: columns,
      containerWidth,
      minColumnWidth: config.minColumnWidth,
      gap: config.gap,
      canPendingFit,
    }
  );
  
  return {
    columnIndex: bestColumn,
    colSpan: expansionResult.finalSpan,
    expanded: expansionResult.shouldExpand,
    expansionReason: expansionResult.reason,
  };
}

/**
 * Checks if a span can fit starting at any column.
 * @returns The first column index where it can fit, or -1 if it can't.
 */
export function canFitSpan(colHeights: number[], span: number, columns: number): number {
  for (let col = 0; col <= columns - span; col++) {
    let canFit = true;
    for (let c = col; c < col + span; c++) {
      if (c >= colHeights.length) {
        canFit = false;
        break;
      }
    }
    if (canFit) {
      return col;
    }
  }
  return -1;
}

/**
 * Checks if any pending section can fit in the given number of columns.
 */
export function canAnyPendingSectionFit(
  availableColumns: number, 
  pendingSections?: PositionedSectionBase[]
): boolean {
  if (!pendingSections || pendingSections.length === 0 || availableColumns <= 0) {
    return false;
  }
  
  // Check if any pending section has colSpan <= available columns
  return pendingSections.some(s => s.colSpan <= availableColumns);
}

// ============================================================================
// GAP PREDICTION ALGORITHMS
// ============================================================================

/**
 * Calculates a gap score for a potential placement.
 * Higher score = more unfillable gaps would be created.
 * 
 * @param colHeights - Current column heights
 * @param startCol - Starting column for placement
 * @param span - Column span of the section
 * @param columns - Total columns
 * @param pendingSections - Sections still to be placed
 * @returns Gap score (0 = no gaps, higher = worse)
 */
export function calculateGapScore(
  colHeights: number[],
  startCol: number,
  span: number,
  columns: number,
  pendingSections?: PositionedSectionBase[]
): number {
  if (!pendingSections || pendingSections.length === 0) {
    return 0;
  }
  
  // Simulate placing the section and calculate resulting column heights
  const simulatedHeights = [...colHeights];
  const placementHeight = Math.max(...colHeights.slice(startCol, startCol + span));
  const estimatedSectionHeight = 200; // Conservative estimate
  
  for (let c = startCol; c < startCol + span; c++) {
    simulatedHeights[c] = placementHeight + estimatedSectionHeight;
  }
  
  // Calculate height variance - lower variance = better balanced = fewer gaps
  const avgHeight = simulatedHeights.reduce((a, b) => a + b, 0) / columns;
  const variance = simulatedHeights.reduce((acc, h) => acc + Math.pow(h - avgHeight, 2), 0) / columns;
  
  // Check if remaining columns on the row could fit any pending section
  const remainingAfter = columns - startCol - span;
  const remainingBefore = startCol;
  
  // Find minimum colSpan among pending sections
  const minPendingSpan = pendingSections.length > 0 
    ? Math.min(...pendingSections.map(s => s.colSpan))
    : 1;
  
  // Penalty for creating orphan columns that can't fit any pending section
  let orphanPenalty = 0;
  if (remainingAfter > 0 && remainingAfter < minPendingSpan) {
    orphanPenalty += remainingAfter;
  }
  if (remainingBefore > 0 && remainingBefore < minPendingSpan) {
    orphanPenalty += remainingBefore;
  }
  
  return Math.sqrt(variance) / 100 + orphanPenalty;
}

// ============================================================================
// LAYOUT SIMULATION ALGORITHMS
// ============================================================================

/**
 * Simulates layout and returns the total container height.
 * Used for comparing different layout configurations.
 * 
 * @param sections - Sections to simulate layout for
 * @param sectionHeights - Map of section keys to actual heights
 * @param columns - Number of columns
 * @param gap - Gap between columns/rows
 * @returns Total container height
 */
export function simulateLayoutHeight(
  sections: PositionedSectionBase[],
  sectionHeights: Map<string, number>,
  columns: number,
  gap: number = GRID_GAP
): number {
  const colHeights = Array(columns).fill(0);
  
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
    const newHeight = minColHeight + height + gap;
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
 * @param sectionHeights - Map of section keys to actual heights
 * @returns Maximum bottom position
 */
export function calculateTotalHeight(
  sections: PositionedSectionBase[],
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

// ============================================================================
// COLUMN SPAN OPTIMIZATION
// ============================================================================

/**
 * Column Span Optimization
 * 
 * For tall multi-column sections, evaluates if narrowing the span would
 * reduce total container height. A 2-column section that's 400px tall
 * commits 800px of "area". If it were 1 column, the other column could
 * be used more efficiently.
 * 
 * @param sections - Sections with height information
 * @param sectionHeights - Map of section keys to actual heights
 * @param columns - Number of columns
 * @param gap - Gap between columns/rows
 * @returns Sections with optimized column spans
 */
export function optimizeColumnSpans(
  sections: PositionedSectionBase[],
  sectionHeights: Map<string, number>,
  columns: number,
  gap: number = GRID_GAP
): PositionedSectionBase[] {
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
  
  // Threshold: sections 50% taller than average are candidates for span reduction
  const tallThreshold = avgHeight * 1.5;
  
  // Find multi-column sections that are tall candidates
  const candidates = sections.filter(s => {
    const height = sectionHeights.get(s.key) ?? 200;
    return s.colSpan > 1 && 
           s.preferredColumns > 1 && 
           height > tallThreshold;
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
    const narrowerSpan = Math.max(1, currentSpan - 1);
    
    if (narrowerSpan === currentSpan) continue;
    
    // Simulate both layouts and compare total heights
    const currentLayoutHeight = simulateLayoutHeight(optimized, sectionHeights, columns, gap);
    
    // Temporarily modify span
    section.colSpan = narrowerSpan;
    
    const narrowerLayoutHeight = simulateLayoutHeight(optimized, sectionHeights, columns, gap);
    
    // Keep narrower span only if it reduces total height
    if (narrowerLayoutHeight < currentLayoutHeight) {
      // Keep the narrower span
      section.preferredColumns = narrowerSpan as PreferredColumns;
    } else {
      // Revert to original span
      section.colSpan = currentSpan;
    }
  }
  
  return optimized;
}

// ============================================================================
// LOCAL SWAP OPTIMIZATION
// ============================================================================

/**
 * Local Swap Optimization
 * 
 * After initial placement, tries swapping pairs of sections to find
 * improvements in total container height. Uses a limited search to
 * avoid O(n²) complexity on large layouts.
 * 
 * @param placedSections - Already positioned sections
 * @param sectionHeights - Map of section keys to actual heights
 * @param columns - Number of columns
 * @param gap - Gap between columns/rows
 * @returns Sections with potentially swapped positions
 */
export function localSwapOptimization(
  placedSections: PositionedSectionBase[],
  sectionHeights: Map<string, number>,
  columns: number,
  gap: number = GRID_GAP
): PositionedSectionBase[] {
  if (placedSections.length < 2 || columns < 2) {
    return placedSections;
  }
  
  // Clone for modification
  let result = placedSections.map(s => ({ ...s }));
  const currentHeight = calculateTotalHeight(result, sectionHeights);
  
  // Limit iterations to avoid performance issues
  const maxIterations = Math.min(placedSections.length * 2, 20);
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
        // that are in a similar "row band" (within 150px of each other)
        const topDiff = Math.abs(sectionA.top - sectionB.top);
        if (topDiff > 150) continue;
        
        // Skip if same span - no benefit
        if (sectionA.colSpan === sectionB.colSpan) continue;
        
        // Try swapping their positions
        const swapped = trySwapSections(result, i, j, sectionHeights, columns, gap);
        const swappedHeight = calculateTotalHeight(swapped, sectionHeights);
        
        // Keep swap if it improves height by at least a small margin
        if (swappedHeight < currentHeight - 5) {
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
function trySwapSections(
  sections: PositionedSectionBase[],
  indexA: number,
  indexB: number,
  sectionHeights: Map<string, number>,
  columns: number,
  gap: number
): PositionedSectionBase[] {
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
export function recalculatePositions(
  sections: PositionedSectionBase[],
  sectionHeights: Map<string, number>,
  columns: number,
  gap: number = GRID_GAP
): PositionedSectionBase[] {
  const colHeights = Array(columns).fill(0);
  
  // Sort by height descending
  const sorted = [...sections].sort((a, b) => {
    const heightA = sectionHeights.get(a.key) ?? 200;
    const heightB = sectionHeights.get(b.key) ?? 200;
    return heightB - heightA;
  });
  
  const result: PositionedSectionBase[] = [];
  
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
      width: widthExpr
    });
  }
  
  return result;
}

// ============================================================================
// GAP FILLING OPTIMIZATION
// ============================================================================

/**
 * Finds gaps in the current layout where sections could be placed.
 * Uses a grid-based approach to identify empty spaces.
 * 
 * @param sections - Sections with height information
 * @param columns - Number of columns
 * @param gridResolution - Resolution of the occupancy grid in pixels
 * @returns Array of gaps with position and size
 */
export function findLayoutGaps(
  sections: Array<PositionedSectionBase & { height: number }>,
  columns: number,
  gridResolution: number = 10
): LayoutGap[] {
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
  const rows = Math.ceil(containerHeight / gridResolution);
  const grid: boolean[][] = Array.from({ length: rows }, () => 
    new Array(columns).fill(false)
  );
  
  // Parse column index from CSS calc expression
  const parseColumnIndex = (left: string): number => {
    if (left === '0px') return 0;
    
    // Try to extract column index from calc expression pattern
    const indexMatch = left.match(/\*\s*(\d+)\s*\)/);
    if (indexMatch && indexMatch[1]) {
      return parseInt(indexMatch[1], 10);
    }
    
    return 0;
  };
  
  // Mark occupied cells
  for (const section of sections) {
    const startRow = Math.floor(section.top / gridResolution);
    const endRow = Math.min(Math.ceil((section.top + section.height) / gridResolution), rows);
    const startCol = parseColumnIndex(section.left);
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
  const minGapHeight = 100;
  
  for (let c = 0; c < columns; c++) {
    let gapStart: number | null = null;
    
    for (let r = 0; r < rows; r++) {
      const isOccupied = grid[r]?.[c] ?? false;
      
      if (!isOccupied && gapStart === null) {
        gapStart = r;
      } else if (isOccupied && gapStart !== null) {
        const gapHeight = (r - gapStart) * gridResolution;
        if (gapHeight >= minGapHeight) {
          gaps.push({
            column: c,
            top: gapStart * gridResolution,
            height: gapHeight,
            width: 1
          });
        }
        gapStart = null;
      }
    }
  }
  
  // Sort gaps by area (largest first) to prioritize filling bigger gaps
  gaps.sort((a, b) => (b.height * b.width) - (a.height * a.width));
  
  return gaps;
}

/**
 * Post-layout gap optimization.
 * After initial placement, analyzes the layout for gaps and attempts to fill them
 * by repositioning flexible sections.
 * 
 * @param sections - Currently positioned sections
 * @param columns - Number of columns
 * @param sectionHeights - Map of section keys to actual heights
 * @param gap - Gap between columns/rows
 * @returns Optimized section array
 */
export function optimizeLayoutGaps(
  sections: PositionedSectionBase[],
  columns: number,
  sectionHeights: Map<string, number>,
  gap: number = GRID_GAP
): PositionedSectionBase[] {
  if (sections.length < 2 || columns < 2) {
    return sections;
  }
  
  // Build sections with height info
  const sectionsWithHeight = sections.map(s => ({
    ...s,
    height: sectionHeights.get(s.key) ?? 200
  }));
  
  // Find gaps in current layout
  const gaps = findLayoutGaps(sectionsWithHeight, columns);
  
  if (gaps.length === 0) {
    return sections;
  }
  
  // Find candidate sections that could fill gaps
  const movableSections = sections
    .map((s, idx) => ({ section: s, index: idx, height: sectionHeights.get(s.key) ?? 200 }))
    .filter(({ section }) => 
      section.colSpan === 1 && 
      section.preferredColumns === 1
    )
    .sort((a, b) => b.section.top - a.section.top);
  
  if (movableSections.length === 0) {
    return sections;
  }
  
  // Try to fill gaps with movable sections
  const result = [...sections];
  let madeChanges = false;
  
  for (const layoutGap of gaps) {
    const candidate = movableSections.find(({ section, height }) => 
      section.colSpan <= layoutGap.width && 
      height <= layoutGap.height + 20
    );
    
    if (candidate) {
      const targetIndex = result.findIndex(s => s.key === candidate.section.key);
      const targetSection = result[targetIndex];
      if (targetIndex >= 0 && targetSection) {
        const movedSection: PositionedSectionBase = {
          section: targetSection.section,
          key: targetSection.key,
          colSpan: targetSection.colSpan,
          preferredColumns: targetSection.preferredColumns,
          isNew: targetSection.isNew,
          left: generateLeftExpression(columns, layoutGap.column, gap),
          top: layoutGap.top,
          width: generateWidthExpression(columns, candidate.section.colSpan, gap)
        };
        result[targetIndex] = movedSection;
        madeChanges = true;
        
        // Remove from movable list to avoid reusing
        const movableIdx = movableSections.findIndex(m => m.section.key === candidate.section.key);
        if (movableIdx >= 0) {
          movableSections.splice(movableIdx, 1);
        }
      }
    }
  }
  
  return madeChanges ? result : sections;
}

