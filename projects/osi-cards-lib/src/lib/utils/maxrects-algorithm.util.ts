/**
 * MaxRects Bin-Packing Algorithm
 * 
 * An advanced bin-packing algorithm that maintains a list of maximal free
 * rectangles. Unlike guillotine which creates disjoint free rectangles,
 * MaxRects allows overlapping free rectangles to maximize placement options.
 * 
 * When a section is placed:
 * 1. Find the best-fit free rectangle
 * 2. Place the section
 * 3. Split ALL overlapping free rectangles
 * 4. Remove redundant (contained) rectangles
 * 
 * This approach typically achieves better space utilization than both
 * Skyline and Guillotine algorithms, at the cost of more complex bookkeeping.
 * 
 * Supports multiple selection heuristics:
 * - Best Short Side Fit (BSSF): Minimize the shorter leftover side
 * - Best Long Side Fit (BLSF): Minimize the longer leftover side  
 * - Best Area Fit (BAF): Minimize the area of the free rectangle
 * - Bottom Left (BL): Prefer bottom-left positions
 * - Contact Point (CP): Maximize edge contact with placed sections
 * 
 * @example
 * ```typescript
 * import { MaxRectsPacker } from 'osi-cards-lib';
 * 
 * const packer = new MaxRectsPacker({
 *   columns: 4,
 *   containerWidth: 1200,
 *   heuristic: 'best-short-side',
 * });
 * const result = packer.pack(sections);
 * ```
 */

import { CardSection } from '../models/card.model';
import { estimateSectionHeight, measureContentDensity, calculatePriorityScore } from './smart-grid.util';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Rectangle in the packing space
 */
export interface MaxRect {
  /** X position (column index) */
  x: number;
  /** Y position (pixels from top) */
  y: number;
  /** Width in columns */
  width: number;
  /** Height in pixels */
  height: number;
}

/**
 * Placed section with position and dimensions
 */
export interface MaxRectsPlacement {
  section: CardSection;
  /** X position (column index) */
  x: number;
  /** Y position (pixels) */
  y: number;
  /** Width in columns */
  width: number;
  /** Height in pixels */
  height: number;
  /** Priority score */
  priority: number;
  /** Heuristic score used for selection */
  score: number;
}

/**
 * Selection heuristic for MaxRects
 */
export type MaxRectsHeuristic =
  | 'best-short-side'   // BSSF: Minimize shorter leftover side
  | 'best-long-side'    // BLSF: Minimize longer leftover side
  | 'best-area'         // BAF: Minimize area of free rectangle
  | 'bottom-left'       // BL: Prefer bottom-left positions
  | 'contact-point';    // CP: Maximize contact with placed sections

/**
 * MaxRects packer configuration
 */
export interface MaxRectsPackerConfig {
  /** Number of columns in the grid */
  columns: number;
  /** Container width in pixels */
  containerWidth: number;
  /** Gap between items in pixels */
  gap?: number;
  /** Selection heuristic to use */
  heuristic?: MaxRectsHeuristic;
  /** Initial container height */
  initialHeight?: number;
  /** Whether to allow rotation (swap width/height) - not used for grid */
  allowRotation?: boolean;
}

/**
 * Packing result with metrics
 */
export interface MaxRectsPackingResult {
  /** Placed sections with positions */
  placements: MaxRectsPlacement[];
  /** Total height of packed area */
  totalHeight: number;
  /** Utilization percentage (0-100) */
  utilization: number;
  /** Number of free rectangles */
  freeRectCount: number;
  /** Total wasted space estimate */
  wastedSpace: number;
  /** Final free rectangles */
  freeRectangles: MaxRect[];
}

/**
 * Placement candidate with scores
 */
interface PlacementCandidate {
  rectIndex: number;
  rect: MaxRect;
  score1: number;  // Primary score
  score2: number;  // Secondary score (tie-breaker)
}

// ============================================================================
// MAXRECTS PACKER CLASS
// ============================================================================

/**
 * MaxRects bin-packing algorithm implementation
 */
export class MaxRectsPacker {
  private freeRectangles: MaxRect[] = [];
  private placements: MaxRectsPlacement[] = [];
  private readonly config: Required<MaxRectsPackerConfig>;
  private readonly columnWidth: number;
  private usedHeight: number = 0;

  constructor(config: MaxRectsPackerConfig) {
    this.config = {
      columns: config.columns,
      containerWidth: config.containerWidth,
      gap: config.gap ?? 12,
      heuristic: config.heuristic ?? 'best-short-side',
      initialHeight: config.initialHeight ?? 10000,
      allowRotation: config.allowRotation ?? false,
    };

    const totalGaps = this.config.gap * (this.config.columns - 1);
    this.columnWidth = (this.config.containerWidth - totalGaps) / this.config.columns;

    this.reset();
  }

  /**
   * Resets the packer to initial state
   */
  reset(): void {
    this.freeRectangles = [{
      x: 0,
      y: 0,
      width: this.config.columns,
      height: this.config.initialHeight,
    }];
    this.placements = [];
    this.usedHeight = 0;
  }

  /**
   * Packs sections using the MaxRects algorithm
   */
  pack(
    sections: CardSection[],
    options?: {
      sortByHeight?: boolean;
      sortByPriority?: boolean;
      sortByArea?: boolean;
    }
  ): MaxRectsPackingResult {
    this.reset();

    if (sections.length === 0) {
      return this.getResult();
    }

    // Prepare sections with metrics
    let sectionsToPlace = sections.map((section, index) => ({
      section,
      index,
      height: estimateSectionHeight(section),
      colSpan: this.calculateColSpan(section),
      priority: calculatePriorityScore(section),
      density: measureContentDensity(section),
      area: 0,
    }));

    // Calculate area
    sectionsToPlace = sectionsToPlace.map(s => ({
      ...s,
      area: s.colSpan * s.height,
    }));

    // Sort based on options
    if (options?.sortByPriority) {
      sectionsToPlace.sort((a, b) => a.priority - b.priority);
    } else if (options?.sortByArea) {
      sectionsToPlace.sort((a, b) => b.area - a.area);
    } else if (options?.sortByHeight !== false) {
      sectionsToPlace.sort((a, b) => b.height - a.height);
    }

    // Place each section
    for (const item of sectionsToPlace) {
      const placement = this.placeSection(
        item.section,
        item.colSpan,
        item.height,
        item.priority
      );

      if (placement) {
        this.placements.push(placement);
        this.usedHeight = Math.max(this.usedHeight, placement.y + placement.height);
      }
    }

    return this.getResult();
  }

  /**
   * Places a single section using MaxRects algorithm
   */
  private placeSection(
    section: CardSection,
    colSpan: number,
    height: number,
    priority: number
  ): MaxRectsPlacement | null {
    const effectiveColSpan = Math.min(colSpan, this.config.columns);
    const effectiveHeight = height + this.config.gap;

    // Find best placement
    const candidate = this.findBestPlacement(effectiveColSpan, effectiveHeight);

    if (!candidate) {
      return null;
    }

    const placement: MaxRectsPlacement = {
      section,
      x: candidate.rect.x,
      y: candidate.rect.y,
      width: effectiveColSpan,
      height,
      priority,
      score: candidate.score1,
    };

    // Split all free rectangles that overlap with the placement
    this.splitFreeRectangles(placement.x, placement.y, effectiveColSpan, effectiveHeight);

    // Remove redundant rectangles
    this.pruneContainedRectangles();

    return placement;
  }

  /**
   * Finds the best placement based on the configured heuristic
   */
  private findBestPlacement(
    width: number,
    height: number
  ): PlacementCandidate | null {
    let bestCandidate: PlacementCandidate | null = null;

    for (let i = 0; i < this.freeRectangles.length; i++) {
      const rect = this.freeRectangles[i];
      if (!rect) continue;

      // Check if section fits
      if (rect.width < width || rect.height < height) {
        continue;
      }

      const scores = this.calculateScores(rect, width, height);
      const candidate: PlacementCandidate = {
        rectIndex: i,
        rect,
        score1: scores.primary,
        score2: scores.secondary,
      };

      if (!bestCandidate || this.isBetterPlacement(candidate, bestCandidate)) {
        bestCandidate = candidate;
      }
    }

    return bestCandidate;
  }

  /**
   * Calculates scores for a potential placement based on heuristic
   */
  private calculateScores(
    rect: MaxRect,
    width: number,
    height: number
  ): { primary: number; secondary: number } {
    const leftoverWidth = rect.width - width;
    const leftoverHeight = rect.height - height;
    const shortSide = Math.min(leftoverWidth, leftoverHeight);
    const longSide = Math.max(leftoverWidth, leftoverHeight);

    switch (this.config.heuristic) {
      case 'best-short-side':
        return { primary: shortSide, secondary: longSide };

      case 'best-long-side':
        return { primary: longSide, secondary: shortSide };

      case 'best-area':
        return { 
          primary: rect.width * rect.height, 
          secondary: shortSide 
        };

      case 'bottom-left':
        return { primary: rect.y, secondary: rect.x };

      case 'contact-point':
        return {
          primary: -this.calculateContactScore(rect, width, height),
          secondary: rect.y,
        };

      default:
        return { primary: shortSide, secondary: longSide };
    }
  }

  /**
   * Calculates contact score (edges touching placed sections)
   */
  private calculateContactScore(
    rect: MaxRect,
    width: number,
    height: number
  ): number {
    let score = 0;

    // Check edges
    if (rect.x === 0) score += height; // Left edge
    if (rect.x + width === this.config.columns) score += height; // Right edge
    if (rect.y === 0) score += width * this.columnWidth; // Top edge

    // Check contact with placed sections
    for (const placed of this.placements) {
      // Top contact
      if (placed.y + placed.height + this.config.gap === rect.y) {
        const overlapStart = Math.max(rect.x, placed.x);
        const overlapEnd = Math.min(rect.x + width, placed.x + placed.width);
        if (overlapEnd > overlapStart) {
          score += (overlapEnd - overlapStart) * this.columnWidth;
        }
      }
      // Left contact
      if (placed.x + placed.width === rect.x) {
        const overlapStart = Math.max(rect.y, placed.y);
        const overlapEnd = Math.min(rect.y + height, placed.y + placed.height);
        if (overlapEnd > overlapStart) {
          score += overlapEnd - overlapStart;
        }
      }
      // Right contact  
      if (rect.x + width === placed.x) {
        const overlapStart = Math.max(rect.y, placed.y);
        const overlapEnd = Math.min(rect.y + height, placed.y + placed.height);
        if (overlapEnd > overlapStart) {
          score += overlapEnd - overlapStart;
        }
      }
    }

    return score;
  }

  /**
   * Compares two placement candidates
   */
  private isBetterPlacement(a: PlacementCandidate, b: PlacementCandidate): boolean {
    if (a.score1 < b.score1) return true;
    if (a.score1 === b.score1 && a.score2 < b.score2) return true;
    return false;
  }

  /**
   * Splits all free rectangles that overlap with the placed section
   * This is the key difference from Guillotine - we split ALL overlapping rectangles
   */
  private splitFreeRectangles(
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const newRectangles: MaxRect[] = [];

    for (let i = this.freeRectangles.length - 1; i >= 0; i--) {
      const rect = this.freeRectangles[i];
      if (!rect) continue;

      // Check if rectangle overlaps with placement
      if (!this.rectanglesOverlap(rect, { x, y, width, height })) {
        continue;
      }

      // Rectangle overlaps - remove it and create up to 4 new rectangles
      this.freeRectangles.splice(i, 1);

      // Left piece
      if (x > rect.x) {
        newRectangles.push({
          x: rect.x,
          y: rect.y,
          width: x - rect.x,
          height: rect.height,
        });
      }

      // Right piece
      if (x + width < rect.x + rect.width) {
        newRectangles.push({
          x: x + width,
          y: rect.y,
          width: rect.x + rect.width - (x + width),
          height: rect.height,
        });
      }

      // Top piece
      if (y > rect.y) {
        newRectangles.push({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: y - rect.y,
        });
      }

      // Bottom piece
      if (y + height < rect.y + rect.height) {
        newRectangles.push({
          x: rect.x,
          y: y + height,
          width: rect.width,
          height: rect.y + rect.height - (y + height),
        });
      }
    }

    // Add new rectangles
    this.freeRectangles.push(...newRectangles);
  }

  /**
   * Checks if two rectangles overlap
   */
  private rectanglesOverlap(a: MaxRect, b: MaxRect): boolean {
    return !(
      a.x >= b.x + b.width ||
      a.x + a.width <= b.x ||
      a.y >= b.y + b.height ||
      a.y + a.height <= b.y
    );
  }

  /**
   * Removes rectangles that are completely contained within other rectangles
   * This is essential for MaxRects efficiency
   */
  private pruneContainedRectangles(): void {
    for (let i = this.freeRectangles.length - 1; i >= 0; i--) {
      const rectA = this.freeRectangles[i];
      if (!rectA) continue;

      for (let j = 0; j < this.freeRectangles.length; j++) {
        if (i === j) continue;
        
        const rectB = this.freeRectangles[j];
        if (!rectB) continue;

        // Check if rectA is contained within rectB
        if (this.isContained(rectA, rectB)) {
          this.freeRectangles.splice(i, 1);
          break;
        }
      }
    }
  }

  /**
   * Checks if rectangle A is completely contained within rectangle B
   */
  private isContained(a: MaxRect, b: MaxRect): boolean {
    return (
      a.x >= b.x &&
      a.y >= b.y &&
      a.x + a.width <= b.x + b.width &&
      a.y + a.height <= b.y + b.height
    );
  }

  /**
   * Calculates column span for a section
   */
  private calculateColSpan(section: CardSection): number {
    if (section.colSpan && section.colSpan > 0) {
      return Math.min(section.colSpan, this.config.columns);
    }

    if (section.preferredColumns) {
      return Math.min(section.preferredColumns, this.config.columns);
    }

    const type = section.type?.toLowerCase() ?? '';
    const typeDefaults: Record<string, number> = {
      'overview': 4,
      'chart': 2,
      'map': 2,
      'analytics': 1,
      'contact-card': 1,
      'network-card': 1,
      'info': 1,
      'list': 1,
    };

    return Math.min(typeDefaults[type] ?? 1, this.config.columns);
  }

  /**
   * Gets the current packing result
   */
  private getResult(): MaxRectsPackingResult {
    const totalHeight = this.usedHeight + this.config.gap;

    const totalArea = this.config.columns * totalHeight;
    const usedArea = this.placements.reduce(
      (sum, p) => sum + (p.width * p.height),
      0
    );
    const utilization = totalArea > 0 ? (usedArea / totalArea) * 100 : 0;

    // Estimate wasted space from free rectangles within used height
    const wastedSpace = this.freeRectangles
      .filter(r => r.y < totalHeight)
      .reduce((sum, r) => {
        const effectiveHeight = Math.min(r.height, totalHeight - r.y);
        if (effectiveHeight <= 0) return sum;
        return sum + (r.width * this.columnWidth * effectiveHeight);
      }, 0);

    return {
      placements: this.placements,
      totalHeight,
      utilization: Math.round(utilization * 100) / 100,
      freeRectCount: this.freeRectangles.length,
      wastedSpace: Math.round(wastedSpace),
      freeRectangles: [...this.freeRectangles],
    };
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Packs sections using MaxRects algorithm with default configuration
 */
export function packWithMaxRects(
  sections: CardSection[],
  columns: number,
  containerWidth: number,
  options?: {
    gap?: number;
    sortByHeight?: boolean;
    sortByArea?: boolean;
    heuristic?: MaxRectsHeuristic;
  }
): MaxRectsPackingResult {
  const packer = new MaxRectsPacker({
    columns,
    containerWidth,
    gap: options?.gap ?? 12,
    heuristic: options?.heuristic ?? 'best-short-side',
  });

  return packer.pack(sections, {
    sortByHeight: options?.sortByHeight ?? true,
    sortByArea: options?.sortByArea ?? false,
  });
}

/**
 * Converts MaxRects packing result to positioned sections for rendering
 */
export function maxRectsResultToPositions(
  result: MaxRectsPackingResult,
  columns: number,
  gap: number = 12
): Array<{
  section: CardSection;
  left: string;
  top: number;
  width: string;
  colSpan: number;
}> {
  return result.placements.map(placement => {
    const totalGaps = gap * (columns - 1);
    const singleColWidth = `calc((100% - ${totalGaps}px) / ${columns})`;

    const width = placement.width === 1
      ? singleColWidth
      : `calc(${singleColWidth} * ${placement.width} + ${gap * (placement.width - 1)}px)`;

    const left = placement.x === 0
      ? '0px'
      : `calc((${singleColWidth} + ${gap}px) * ${placement.x})`;

    return {
      section: placement.section,
      left,
      top: placement.y,
      width,
      colSpan: placement.width,
    };
  });
}

/**
 * Compares MaxRects with different heuristics to find the best one
 */
export function findBestMaxRectsHeuristic(
  sections: CardSection[],
  columns: number,
  containerWidth: number
): {
  heuristic: MaxRectsHeuristic;
  result: MaxRectsPackingResult;
} {
  const heuristics: MaxRectsHeuristic[] = [
    'best-short-side',
    'best-long-side',
    'best-area',
    'bottom-left',
    'contact-point',
  ];

  let bestResult: MaxRectsPackingResult | null = null;
  let bestHeuristic: MaxRectsHeuristic = 'best-short-side';

  for (const heuristic of heuristics) {
    const packer = new MaxRectsPacker({
      columns,
      containerWidth,
      heuristic,
    });

    const result = packer.pack(sections);

    if (!bestResult ||
        result.utilization > bestResult.utilization ||
        (result.utilization === bestResult.utilization &&
         result.totalHeight < bestResult.totalHeight)) {
      bestResult = result;
      bestHeuristic = heuristic;
    }
  }

  return {
    heuristic: bestHeuristic,
    result: bestResult!,
  };
}

/**
 * Compares all packing algorithms and returns the best result
 */
export function compareAllMaxRectsHeuristics(
  sections: CardSection[],
  columns: number,
  containerWidth: number
): Map<MaxRectsHeuristic, MaxRectsPackingResult> {
  const results = new Map<MaxRectsHeuristic, MaxRectsPackingResult>();
  
  const heuristics: MaxRectsHeuristic[] = [
    'best-short-side',
    'best-long-side',
    'best-area',
    'bottom-left',
    'contact-point',
  ];

  for (const heuristic of heuristics) {
    const packer = new MaxRectsPacker({
      columns,
      containerWidth,
      heuristic,
    });
    results.set(heuristic, packer.pack(sections));
  }

  return results;
}

