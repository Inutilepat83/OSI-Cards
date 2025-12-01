/**
 * Advanced Packing Algorithms
 * 
 * Collection of advanced bin-packing algorithms and optimizations:
 * - FFDH with area-based sorting
 * - Best-Fit Decreasing (BFD)
 * - Strip packing optimization
 * - Level-oriented packing
 * - Bottom-left fill strategy
 * - Waste-aware placement scoring
 * - Lookahead placement
 * 
 * These algorithms complement the base algorithms (Skyline, Guillotine, MaxRects)
 * with additional optimization strategies.
 * 
 * @example
 * ```typescript
 * import { packWithFFDHArea, packWithBFD, optimizeStripPacking } from 'osi-cards-lib';
 * 
 * // FFDH with area-based sorting (better for mixed sizes)
 * const result1 = packWithFFDHArea(sections, columns, containerWidth);
 * 
 * // Best-Fit Decreasing for tight packing
 * const result2 = packWithBFD(sections, columns, containerWidth);
 * 
 * // Post-process with strip optimization
 * const optimized = optimizeStripPacking(result1.placements, columns);
 * ```
 */

import { CardSection } from '../models/card.model';
import { estimateSectionHeight, measureContentDensity, calculatePriorityScore } from './smart-grid.util';
import { generateWidthExpression, generateLeftExpression, GRID_GAP } from './grid-config.util';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Section with computed metrics for packing
 */
export interface PackingSection {
  section: CardSection;
  index: number;
  height: number;
  colSpan: number;
  area: number;
  priority: number;
  density: number;
}

/**
 * Placement in the grid
 */
export interface PackingPlacement {
  section: CardSection;
  x: number;
  y: number;
  width: number;
  height: number;
  level?: number;
  strip?: number;
}

/**
 * Level in level-oriented packing
 */
export interface PackingLevel {
  index: number;
  y: number;
  height: number;
  sections: PackingPlacement[];
  remainingWidth: number;
}

/**
 * Strip in strip packing
 */
export interface PackingStrip {
  index: number;
  column: number;
  sections: PackingPlacement[];
  totalHeight: number;
}

/**
 * Packing result
 */
export interface AdvancedPackingResult {
  placements: PackingPlacement[];
  totalHeight: number;
  utilization: number;
  gapCount: number;
  levels?: PackingLevel[];
  strips?: PackingStrip[];
}

/**
 * Sorting heuristic for FFDH variants
 */
export type FFDHSortHeuristic = 
  | 'height'       // Original FFDH - sort by height
  | 'area'         // Sort by area (width * height)
  | 'width'        // Sort by width
  | 'perimeter'    // Sort by perimeter
  | 'aspect-ratio' // Sort by aspect ratio (prioritize square-ish items)
  | 'priority'     // Sort by priority first, then height
  | 'combined';    // Combined score of height, width, and priority

/**
 * Configuration for BFD algorithm
 */
export interface BFDConfig {
  columns: number;
  containerWidth: number;
  gap?: number;
  /** Weight for position preference (lower y = better) */
  positionWeight?: number;
  /** Weight for fit tightness (smaller leftover = better) */
  fitWeight?: number;
  /** Weight for column balance */
  balanceWeight?: number;
}

// ============================================================================
// FFDH WITH AREA-BASED SORTING
// ============================================================================

/**
 * First Fit Decreasing Height with configurable sorting
 * 
 * Standard FFDH sorts by height only. This variant allows sorting by:
 * - Area: Better for mixed-size sections
 * - Perimeter: Balances width and height influence
 * - Combined score: Considers priority, height, and width
 */
export function packWithFFDH(
  sections: CardSection[],
  columns: number,
  containerWidth: number,
  options?: {
    gap?: number;
    sortHeuristic?: FFDHSortHeuristic;
    respectPriority?: boolean;
  }
): AdvancedPackingResult {
  const gap = options?.gap ?? GRID_GAP;
  const sortHeuristic = options?.sortHeuristic ?? 'height';
  const respectPriority = options?.respectPriority ?? true;

  // Prepare sections with metrics
  const packingSections = prepareSections(sections, columns);

  // Sort based on heuristic
  const sorted = sortSections(packingSections, sortHeuristic, respectPriority);

  // Pack using FFDH
  const colHeights = new Array(columns).fill(0);
  const placements: PackingPlacement[] = [];

  for (const item of sorted) {
    const effectiveColSpan = Math.min(item.colSpan, columns);
    const effectiveHeight = item.height + gap;

    // Find best fit column
    let bestColumn = 0;
    let bestHeight = Infinity;

    for (let col = 0; col <= columns - effectiveColSpan; col++) {
      // Find max height among columns this span would occupy
      let maxColHeight = 0;
      for (let c = col; c < col + effectiveColSpan; c++) {
        maxColHeight = Math.max(maxColHeight, colHeights[c] ?? 0);
      }

      if (maxColHeight < bestHeight) {
        bestHeight = maxColHeight;
        bestColumn = col;
      }
    }

    // Place section
    placements.push({
      section: item.section,
      x: bestColumn,
      y: bestHeight,
      width: effectiveColSpan,
      height: item.height,
    });

    // Update column heights
    const newHeight = bestHeight + effectiveHeight;
    for (let c = bestColumn; c < bestColumn + effectiveColSpan; c++) {
      colHeights[c] = newHeight;
    }
  }

  return calculateResult(placements, columns, gap);
}

/**
 * FFDH with area-based sorting (convenience function)
 */
export function packWithFFDHArea(
  sections: CardSection[],
  columns: number,
  containerWidth: number,
  gap?: number
): AdvancedPackingResult {
  return packWithFFDH(sections, columns, containerWidth, {
    gap,
    sortHeuristic: 'area',
  });
}

// ============================================================================
// BEST-FIT DECREASING (BFD) ALGORITHM
// ============================================================================

/**
 * Best-Fit Decreasing algorithm
 * 
 * Unlike FFDH which places in the first available spot, BFD evaluates
 * ALL possible positions and chooses the one that:
 * 1. Minimizes wasted space
 * 2. Keeps columns balanced
 * 3. Minimizes total height increase
 */
export function packWithBFD(
  sections: CardSection[],
  columns: number,
  containerWidth: number,
  config?: Partial<BFDConfig>
): AdvancedPackingResult {
  const gap = config?.gap ?? GRID_GAP;
  const positionWeight = config?.positionWeight ?? 1.0;
  const fitWeight = config?.fitWeight ?? 2.0;
  const balanceWeight = config?.balanceWeight ?? 0.5;

  const packingSections = prepareSections(sections, columns);
  
  // Sort by area descending (larger items first)
  const sorted = [...packingSections].sort((a, b) => b.area - a.area);

  const colHeights = new Array(columns).fill(0) as number[];
  const placements: PackingPlacement[] = [];

  for (const item of sorted) {
    const effectiveColSpan = Math.min(item.colSpan, columns);
    const effectiveHeight = item.height + gap;

    // Evaluate ALL possible positions
    let bestScore = Infinity;
    let bestColumn = 0;
    let bestY = 0;

    for (let col = 0; col <= columns - effectiveColSpan; col++) {
      // Find Y position for this column
      let y = 0;
      for (let c = col; c < col + effectiveColSpan; c++) {
        y = Math.max(y, colHeights[c] ?? 0);
      }

      // Calculate score (lower is better)
      const score = calculateBFDScore(
        col,
        y,
        effectiveColSpan,
        effectiveHeight,
        colHeights,
        columns,
        positionWeight,
        fitWeight,
        balanceWeight
      );

      if (score < bestScore) {
        bestScore = score;
        bestColumn = col;
        bestY = y;
      }
    }

    // Place section at best position
    placements.push({
      section: item.section,
      x: bestColumn,
      y: bestY,
      width: effectiveColSpan,
      height: item.height,
    });

    // Update column heights
    const newHeight = bestY + effectiveHeight;
    for (let c = bestColumn; c < bestColumn + effectiveColSpan; c++) {
      colHeights[c] = newHeight;
    }
  }

  return calculateResult(placements, columns, gap);
}

/**
 * Calculates BFD placement score
 */
function calculateBFDScore(
  column: number,
  y: number,
  width: number,
  height: number,
  colHeights: number[],
  totalColumns: number,
  positionWeight: number,
  fitWeight: number,
  balanceWeight: number
): number {
  // Position score: prefer lower Y positions
  const positionScore = y * positionWeight;

  // Fit score: prefer positions that minimize wasted space
  let wastedSpace = 0;
  for (let c = column; c < column + width; c++) {
    const colHeight = colHeights[c] ?? 0;
    wastedSpace += y - colHeight;  // Gap created above this section
  }
  const fitScore = wastedSpace * fitWeight;

  // Balance score: prefer positions that balance column heights
  const newHeights = [...colHeights];
  const newHeight = y + height;
  for (let c = column; c < column + width; c++) {
    newHeights[c] = newHeight;
  }
  const avgHeight = newHeights.reduce((a, b) => a + b, 0) / totalColumns;
  const variance = newHeights.reduce((sum, h) => sum + Math.pow(h - avgHeight, 2), 0) / totalColumns;
  const balanceScore = Math.sqrt(variance) * balanceWeight;

  return positionScore + fitScore + balanceScore;
}

// ============================================================================
// STRIP PACKING OPTIMIZATION
// ============================================================================

/**
 * Strip packing optimization
 * 
 * Organizes sections into vertical strips (columns) and optimizes
 * the arrangement within each strip to minimize total height.
 */
export function packWithStrips(
  sections: CardSection[],
  columns: number,
  containerWidth: number,
  gap?: number
): AdvancedPackingResult {
  const effectiveGap = gap ?? GRID_GAP;
  const packingSections = prepareSections(sections, columns);

  // Initialize strips (one per column)
  const strips: PackingStrip[] = Array.from({ length: columns }, (_, i) => ({
    index: i,
    column: i,
    sections: [],
    totalHeight: 0,
  }));

  // Sort sections by height descending
  const sorted = [...packingSections].sort((a, b) => b.height - a.height);

  // Assign each section to the strip with lowest total height
  for (const item of sorted) {
    // For multi-column sections, find best starting strip
    const effectiveColSpan = Math.min(item.colSpan, columns);
    
    let bestStrip = 0;
    let bestHeight = Infinity;

    for (let s = 0; s <= columns - effectiveColSpan; s++) {
      // Find max height among the strips this section would span
      let maxHeight = 0;
      for (let c = s; c < s + effectiveColSpan; c++) {
        maxHeight = Math.max(maxHeight, strips[c]?.totalHeight ?? 0);
      }

      if (maxHeight < bestHeight) {
        bestHeight = maxHeight;
        bestStrip = s;
      }
    }

    // Add to strips
    const placement: PackingPlacement = {
      section: item.section,
      x: bestStrip,
      y: bestHeight,
      width: effectiveColSpan,
      height: item.height,
      strip: bestStrip,
    };

    // Update all affected strips
    const newHeight = bestHeight + item.height + effectiveGap;
    for (let c = bestStrip; c < bestStrip + effectiveColSpan; c++) {
      const strip = strips[c];
      if (strip) {
        strip.sections.push(placement);
        strip.totalHeight = newHeight;
      }
    }
  }

  // Collect all placements
  const allPlacements = new Set<PackingPlacement>();
  for (const strip of strips) {
    for (const p of strip.sections) {
      allPlacements.add(p);
    }
  }

  const result = calculateResult([...allPlacements], columns, effectiveGap);
  result.strips = strips;
  return result;
}

/**
 * Post-process optimization for strip packing
 * Reorders sections within strips to minimize gaps
 */
export function optimizeStripPacking(
  placements: PackingPlacement[],
  columns: number,
  gap?: number
): PackingPlacement[] {
  const effectiveGap = gap ?? GRID_GAP;

  // Group by column
  const byColumn = new Map<number, PackingPlacement[]>();
  for (const p of placements) {
    const list = byColumn.get(p.x) ?? [];
    list.push(p);
    byColumn.set(p.x, list);
  }

  const optimized: PackingPlacement[] = [];

  // Optimize each column
  for (let col = 0; col < columns; col++) {
    const columnPlacements = byColumn.get(col) ?? [];
    
    // Sort by height descending for this column
    columnPlacements.sort((a, b) => b.height - a.height);

    // Recompute Y positions
    let currentY = 0;
    for (const p of columnPlacements) {
      optimized.push({
        ...p,
        y: currentY,
      });
      currentY += p.height + effectiveGap;
    }
  }

  return optimized;
}

// ============================================================================
// LEVEL-ORIENTED PACKING
// ============================================================================

/**
 * Level-oriented packing
 * 
 * Groups sections by similar heights into "levels" (horizontal bands).
 * Each level contains sections of similar height, reducing vertical gaps.
 */
export function packWithLevels(
  sections: CardSection[],
  columns: number,
  containerWidth: number,
  options?: {
    gap?: number;
    heightTolerance?: number;  // How similar heights must be to group (percentage)
  }
): AdvancedPackingResult {
  const gap = options?.gap ?? GRID_GAP;
  const heightTolerance = options?.heightTolerance ?? 20;  // 20% tolerance

  const packingSections = prepareSections(sections, columns);

  // Sort by height descending
  const sorted = [...packingSections].sort((a, b) => b.height - a.height);

  const levels: PackingLevel[] = [];
  const placements: PackingPlacement[] = [];

  for (const item of sorted) {
    const effectiveColSpan = Math.min(item.colSpan, columns);

    // Try to fit in existing level
    let placed = false;
    for (const level of levels) {
      // Check height compatibility
      const heightDiff = Math.abs(level.height - item.height) / level.height * 100;
      if (heightDiff > heightTolerance) continue;

      // Check if fits width-wise
      if (level.remainingWidth >= effectiveColSpan) {
        // Place in this level
        const x = columns - level.remainingWidth;
        placements.push({
          section: item.section,
          x,
          y: level.y,
          width: effectiveColSpan,
          height: item.height,
          level: level.index,
        });

        level.sections.push(placements[placements.length - 1]!);
        level.remainingWidth -= effectiveColSpan;
        level.height = Math.max(level.height, item.height);
        placed = true;
        break;
      }
    }

    if (!placed) {
      // Create new level
      const y = levels.length > 0
        ? Math.max(...levels.map(l => l.y + l.height)) + gap
        : 0;

      const level: PackingLevel = {
        index: levels.length,
        y,
        height: item.height,
        sections: [],
        remainingWidth: columns - effectiveColSpan,
      };

      placements.push({
        section: item.section,
        x: 0,
        y,
        width: effectiveColSpan,
        height: item.height,
        level: level.index,
      });

      level.sections.push(placements[placements.length - 1]!);
      levels.push(level);
    }
  }

  const result = calculateResult(placements, columns, gap);
  result.levels = levels;
  return result;
}

// ============================================================================
// BOTTOM-LEFT FILL STRATEGY
// ============================================================================

/**
 * Bottom-Left Fill packing
 * 
 * Places each section at the lowest possible position, as far left as possible.
 * This is a different approach from FFDH that can sometimes achieve better packing.
 */
export function packWithBottomLeftFill(
  sections: CardSection[],
  columns: number,
  containerWidth: number,
  gap?: number
): AdvancedPackingResult {
  const effectiveGap = gap ?? GRID_GAP;
  const packingSections = prepareSections(sections, columns);

  // Sort by height descending
  const sorted = [...packingSections].sort((a, b) => b.height - a.height);

  const placements: PackingPlacement[] = [];
  
  // Track occupied spaces as rectangles
  const occupied: Array<{ x: number; y: number; width: number; height: number }> = [];

  for (const item of sorted) {
    const effectiveColSpan = Math.min(item.colSpan, columns);
    const effectiveHeight = item.height + effectiveGap;

    // Find bottom-left position
    const position = findBottomLeftPosition(
      occupied,
      effectiveColSpan,
      effectiveHeight,
      columns
    );

    placements.push({
      section: item.section,
      x: position.x,
      y: position.y,
      width: effectiveColSpan,
      height: item.height,
    });

    occupied.push({
      x: position.x,
      y: position.y,
      width: effectiveColSpan,
      height: effectiveHeight,
    });
  }

  return calculateResult(placements, columns, effectiveGap);
}

/**
 * Finds bottom-left position for a section
 */
function findBottomLeftPosition(
  occupied: Array<{ x: number; y: number; width: number; height: number }>,
  width: number,
  height: number,
  columns: number
): { x: number; y: number } {
  // Generate candidate Y positions
  const yPositions = new Set<number>([0]);
  for (const rect of occupied) {
    yPositions.add(rect.y + rect.height);
  }

  // Sort Y positions
  const sortedY = [...yPositions].sort((a, b) => a - b);

  for (const y of sortedY) {
    // Try each X position at this Y
    for (let x = 0; x <= columns - width; x++) {
      // Check if position is valid (doesn't overlap)
      const testRect = { x, y, width, height };
      const hasCollision = occupied.some(r => rectanglesOverlap(testRect, r));

      if (!hasCollision) {
        return { x, y };
      }
    }
  }

  // Fallback: place below all existing sections
  const maxY = occupied.length > 0
    ? Math.max(...occupied.map(r => r.y + r.height))
    : 0;
  return { x: 0, y: maxY };
}

/**
 * Checks if two rectangles overlap
 */
function rectanglesOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  return !(
    a.x >= b.x + b.width ||
    a.x + a.width <= b.x ||
    a.y >= b.y + b.height ||
    a.y + a.height <= b.y
  );
}

// ============================================================================
// WASTE-AWARE PLACEMENT SCORING
// ============================================================================

/**
 * Waste-aware packing
 * 
 * Uses sophisticated scoring to predict and minimize wasted space.
 * Considers the impact of each placement on future placements.
 */
export function packWithWasteAwareness(
  sections: CardSection[],
  columns: number,
  containerWidth: number,
  options?: {
    gap?: number;
    wasteWeight?: number;
    futureWeight?: number;
  }
): AdvancedPackingResult {
  const gap = options?.gap ?? GRID_GAP;
  const wasteWeight = options?.wasteWeight ?? 2.0;
  const futureWeight = options?.futureWeight ?? 1.0;

  const packingSections = prepareSections(sections, columns);
  const sorted = [...packingSections].sort((a, b) => b.area - a.area);

  const colHeights = new Array(columns).fill(0) as number[];
  const placements: PackingPlacement[] = [];
  const remaining = [...sorted];

  while (remaining.length > 0) {
    // For current section, evaluate waste-aware score for each position
    const item = remaining.shift()!;
    const effectiveColSpan = Math.min(item.colSpan, columns);
    const effectiveHeight = item.height + gap;

    let bestScore = Infinity;
    let bestColumn = 0;
    let bestY = 0;

    for (let col = 0; col <= columns - effectiveColSpan; col++) {
      let y = 0;
      for (let c = col; c < col + effectiveColSpan; c++) {
        y = Math.max(y, colHeights[c] ?? 0);
      }

      // Calculate waste created by this placement
      let immediateWaste = 0;
      for (let c = col; c < col + effectiveColSpan; c++) {
        immediateWaste += y - (colHeights[c] ?? 0);
      }

      // Predict future waste (simplified)
      const futureWaste = predictFutureWaste(
        col,
        y + effectiveHeight,
        effectiveColSpan,
        colHeights,
        remaining,
        columns
      );

      const score = immediateWaste * wasteWeight + futureWaste * futureWeight;

      if (score < bestScore) {
        bestScore = score;
        bestColumn = col;
        bestY = y;
      }
    }

    placements.push({
      section: item.section,
      x: bestColumn,
      y: bestY,
      width: effectiveColSpan,
      height: item.height,
    });

    const newHeight = bestY + effectiveHeight;
    for (let c = bestColumn; c < bestColumn + effectiveColSpan; c++) {
      colHeights[c] = newHeight;
    }
  }

  return calculateResult(placements, columns, gap);
}

/**
 * Predicts future waste based on remaining sections
 */
function predictFutureWaste(
  column: number,
  newHeight: number,
  width: number,
  colHeights: number[],
  remaining: PackingSection[],
  columns: number
): number {
  // Simulate column heights after this placement
  const simHeights = [...colHeights];
  for (let c = column; c < column + width; c++) {
    simHeights[c] = newHeight;
  }

  // Check if any remaining section would fit poorly
  let predictedWaste = 0;
  for (const section of remaining.slice(0, 3)) {  // Look ahead 3 sections
    const span = Math.min(section.colSpan, columns);
    
    // Find best fit for this section
    let minGap = Infinity;
    for (let col = 0; col <= columns - span; col++) {
      let maxH = 0;
      let totalGap = 0;
      for (let c = col; c < col + span; c++) {
        const h = simHeights[c] ?? 0;
        maxH = Math.max(maxH, h);
      }
      for (let c = col; c < col + span; c++) {
        totalGap += maxH - (simHeights[c] ?? 0);
      }
      minGap = Math.min(minGap, totalGap);
    }
    
    predictedWaste += minGap;
  }

  return predictedWaste;
}

// ============================================================================
// LOOKAHEAD PLACEMENT
// ============================================================================

/**
 * Lookahead packing
 * 
 * Before placing each section, simulates the next N placements to choose
 * the position that yields the best overall outcome.
 */
export function packWithLookahead(
  sections: CardSection[],
  columns: number,
  containerWidth: number,
  options?: {
    gap?: number;
    lookaheadDepth?: number;  // How many sections to look ahead
  }
): AdvancedPackingResult {
  const gap = options?.gap ?? GRID_GAP;
  const lookaheadDepth = options?.lookaheadDepth ?? 2;

  const packingSections = prepareSections(sections, columns);
  const sorted = [...packingSections].sort((a, b) => b.area - a.area);

  const colHeights = new Array(columns).fill(0) as number[];
  const placements: PackingPlacement[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i]!;
    const effectiveColSpan = Math.min(item.colSpan, columns);
    const effectiveHeight = item.height + gap;

    // Get lookahead sections
    const lookaheadSections = sorted.slice(i + 1, i + 1 + lookaheadDepth);

    let bestColumn = 0;
    let bestScore = Infinity;

    for (let col = 0; col <= columns - effectiveColSpan; col++) {
      let y = 0;
      for (let c = col; c < col + effectiveColSpan; c++) {
        y = Math.max(y, colHeights[c] ?? 0);
      }

      // Simulate this placement
      const simHeights = [...colHeights];
      const newHeight = y + effectiveHeight;
      for (let c = col; c < col + effectiveColSpan; c++) {
        simHeights[c] = newHeight;
      }

      // Simulate lookahead placements
      const score = simulateLookahead(
        simHeights,
        lookaheadSections,
        columns,
        gap
      );

      if (score < bestScore) {
        bestScore = score;
        bestColumn = col;
      }
    }

    // Place at best position
    let bestY = 0;
    for (let c = bestColumn; c < bestColumn + effectiveColSpan; c++) {
      bestY = Math.max(bestY, colHeights[c] ?? 0);
    }

    placements.push({
      section: item.section,
      x: bestColumn,
      y: bestY,
      width: effectiveColSpan,
      height: item.height,
    });

    const newHeight = bestY + effectiveHeight;
    for (let c = bestColumn; c < bestColumn + effectiveColSpan; c++) {
      colHeights[c] = newHeight;
    }
  }

  return calculateResult(placements, columns, gap);
}

/**
 * Simulates lookahead placements and returns score
 */
function simulateLookahead(
  colHeights: number[],
  sections: PackingSection[],
  columns: number,
  gap: number
): number {
  const simHeights = [...colHeights];
  let totalWaste = 0;

  for (const item of sections) {
    const span = Math.min(item.colSpan, columns);
    const height = item.height + gap;

    // Find best column (simple first-fit)
    let bestCol = 0;
    let minY = Infinity;

    for (let col = 0; col <= columns - span; col++) {
      let y = 0;
      for (let c = col; c < col + span; c++) {
        y = Math.max(y, simHeights[c] ?? 0);
      }
      if (y < minY) {
        minY = y;
        bestCol = col;
      }
    }

    // Calculate waste
    for (let c = bestCol; c < bestCol + span; c++) {
      totalWaste += minY - (simHeights[c] ?? 0);
    }

    // Update simulated heights
    const newH = minY + height;
    for (let c = bestCol; c < bestCol + span; c++) {
      simHeights[c] = newH;
    }
  }

  // Score includes both waste and final max height
  const maxHeight = Math.max(...simHeights);
  return totalWaste + maxHeight;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Prepares sections with computed metrics
 */
function prepareSections(sections: CardSection[], columns: number): PackingSection[] {
  return sections.map((section, index) => {
    const height = estimateSectionHeight(section);
    const colSpan = getColSpan(section, columns);
    return {
      section,
      index,
      height,
      colSpan,
      area: colSpan * height,
      priority: calculatePriorityScore(section),
      density: measureContentDensity(section),
    };
  });
}

/**
 * Gets column span for a section
 */
function getColSpan(section: CardSection, columns: number): number {
  if (section.colSpan && section.colSpan > 0) {
    return Math.min(section.colSpan, columns);
  }
  if (section.preferredColumns) {
    return Math.min(section.preferredColumns, columns);
  }
  return 1;
}

/**
 * Sorts sections based on heuristic
 */
function sortSections(
  sections: PackingSection[],
  heuristic: FFDHSortHeuristic,
  respectPriority: boolean
): PackingSection[] {
  const sorted = [...sections];

  sorted.sort((a, b) => {
    // Priority first if enabled
    if (respectPriority && a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    switch (heuristic) {
      case 'height':
        return b.height - a.height;
      
      case 'area':
        return b.area - a.area;
      
      case 'width':
        return b.colSpan - a.colSpan;
      
      case 'perimeter':
        const perimA = 2 * (a.colSpan + a.height);
        const perimB = 2 * (b.colSpan + b.height);
        return perimB - perimA;
      
      case 'aspect-ratio':
        // Prefer square-ish items (ratio closer to 1)
        const ratioA = Math.abs(1 - (a.colSpan * 100) / a.height);
        const ratioB = Math.abs(1 - (b.colSpan * 100) / b.height);
        return ratioA - ratioB;
      
      case 'combined':
        // Combined score: height + width * 50 + priority * 100
        const scoreA = a.height + a.colSpan * 50;
        const scoreB = b.height + b.colSpan * 50;
        return scoreB - scoreA;
      
      case 'priority':
        return a.priority - b.priority;
      
      default:
        return b.height - a.height;
    }
  });

  return sorted;
}

/**
 * Calculates packing result metrics
 */
function calculateResult(
  placements: PackingPlacement[],
  columns: number,
  gap: number
): AdvancedPackingResult {
  const totalHeight = placements.length > 0
    ? Math.max(...placements.map(p => p.y + p.height + gap))
    : 0;

  const totalArea = columns * totalHeight;
  const usedArea = placements.reduce((sum, p) => sum + (p.width * p.height), 0);
  const utilization = totalArea > 0 ? (usedArea / totalArea) * 100 : 100;

  // Count gaps (simplified)
  const gapCount = 0;  // Would need detailed analysis

  return {
    placements,
    totalHeight,
    utilization: Math.round(utilization * 100) / 100,
    gapCount,
  };
}

/**
 * Converts advanced packing result to CSS-ready positions
 */
export function advancedResultToPositions(
  result: AdvancedPackingResult,
  columns: number,
  gap: number = GRID_GAP
): Array<{
  section: CardSection;
  left: string;
  top: number;
  width: string;
  colSpan: number;
}> {
  return result.placements.map(placement => ({
    section: placement.section,
    left: generateLeftExpression(columns, placement.x, gap),
    top: placement.y,
    width: generateWidthExpression(columns, placement.width, gap),
    colSpan: placement.width,
  }));
}

