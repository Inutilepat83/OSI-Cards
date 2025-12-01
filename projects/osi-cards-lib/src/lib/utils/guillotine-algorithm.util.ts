/**
 * Guillotine Bin-Packing Algorithm
 * 
 * A bin-packing algorithm that works by splitting free rectangles using
 * "guillotine cuts" - either horizontal or vertical splits. This approach
 * can provide better space utilization than skyline for certain section
 * configurations, particularly when sections have varied sizes.
 * 
 * The algorithm maintains a list of free rectangles and for each section:
 * 1. Finds the best-fit free rectangle
 * 2. Places the section
 * 3. Splits the remaining space using guillotine cuts
 * 
 * Supports multiple split heuristics:
 * - Shorter Axis Split (SAS): Split along the shorter remaining axis
 * - Longer Axis Split (LAS): Split along the longer remaining axis
 * - Shorter Leftover Axis (SLAS): Minimize the shorter leftover dimension
 * - Longer Leftover Axis (LLAS): Minimize the longer leftover dimension
 * - Max Area Split (MAS): Maximize the area of the larger resulting rectangle
 * 
 * @example
 * ```typescript
 * import { GuillotinePacker } from 'osi-cards-lib';
 * 
 * const packer = new GuillotinePacker({
 *   columns: 4,
 *   containerWidth: 1200,
 *   splitHeuristic: 'shorter-axis',
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
 * Free rectangle in the packing space
 */
export interface FreeRectangle {
  /** X position (column index) */
  x: number;
  /** Y position (pixels from top) */
  y: number;
  /** Width in columns */
  width: number;
  /** Height in pixels */
  height: number;
  /** Unique ID for tracking */
  id: number;
}

/**
 * Placed section with position and dimensions
 */
export interface GuillotinePlacement {
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
  /** Free rectangle ID where this was placed */
  sourceRectId: number;
}

/**
 * Split heuristic for guillotine cuts
 */
export type SplitHeuristic = 
  | 'shorter-axis'      // Split along shorter remaining axis
  | 'longer-axis'       // Split along longer remaining axis
  | 'shorter-leftover'  // Minimize shorter leftover dimension
  | 'longer-leftover'   // Minimize longer leftover dimension
  | 'max-area';         // Maximize area of larger resulting rectangle

/**
 * Free rectangle selection heuristic
 */
export type RectangleSelectionHeuristic =
  | 'best-area-fit'     // Rectangle with smallest area that fits
  | 'best-short-side'   // Rectangle where shorter side fits best
  | 'best-long-side'    // Rectangle where longer side fits best
  | 'worst-area-fit'    // Rectangle with largest area (for spreading)
  | 'worst-short-side'; // Rectangle where shorter side fits worst

/**
 * Guillotine packer configuration
 */
export interface GuillotinePackerConfig {
  /** Number of columns in the grid */
  columns: number;
  /** Container width in pixels */
  containerWidth: number;
  /** Gap between items in pixels */
  gap?: number;
  /** Split heuristic to use */
  splitHeuristic?: SplitHeuristic;
  /** Rectangle selection heuristic */
  selectionHeuristic?: RectangleSelectionHeuristic;
  /** Whether to merge adjacent free rectangles */
  mergeFreeRects?: boolean;
  /** Maximum container height (0 = infinite) */
  maxHeight?: number;
  /** Initial container height estimate */
  initialHeight?: number;
}

/**
 * Packing result with metrics
 */
export interface GuillotinePackingResult {
  /** Placed sections with positions */
  placements: GuillotinePlacement[];
  /** Total height of packed area */
  totalHeight: number;
  /** Utilization percentage (0-100) */
  utilization: number;
  /** Number of free rectangles remaining */
  freeRectCount: number;
  /** Total wasted space in pixels */
  wastedSpace: number;
  /** Final free rectangles state */
  freeRectangles: FreeRectangle[];
}

// ============================================================================
// GUILLOTINE PACKER CLASS
// ============================================================================

/**
 * Guillotine bin-packing algorithm implementation
 */
export class GuillotinePacker {
  private freeRectangles: FreeRectangle[] = [];
  private placements: GuillotinePlacement[] = [];
  private readonly config: Required<GuillotinePackerConfig>;
  private readonly columnWidth: number;
  private nextRectId = 0;
  private containerHeight: number;

  constructor(config: GuillotinePackerConfig) {
    this.config = {
      columns: config.columns,
      containerWidth: config.containerWidth,
      gap: config.gap ?? 12,
      splitHeuristic: config.splitHeuristic ?? 'shorter-axis',
      selectionHeuristic: config.selectionHeuristic ?? 'best-area-fit',
      mergeFreeRects: config.mergeFreeRects ?? true,
      maxHeight: config.maxHeight ?? 0,
      initialHeight: config.initialHeight ?? 10000, // Large initial height
    };

    // Calculate column width
    const totalGaps = this.config.gap * (this.config.columns - 1);
    this.columnWidth = (this.config.containerWidth - totalGaps) / this.config.columns;
    this.containerHeight = this.config.initialHeight;

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
      height: this.containerHeight,
      id: this.nextRectId++,
    }];
    this.placements = [];
  }

  /**
   * Packs sections using the guillotine algorithm
   */
  pack(
    sections: CardSection[],
    options?: {
      sortByHeight?: boolean;
      sortByPriority?: boolean;
      sortByArea?: boolean;
    }
  ): GuillotinePackingResult {
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
      area: 0, // Will be calculated
    }));

    // Calculate area for each section
    sectionsToPlace = sectionsToPlace.map(s => ({
      ...s,
      area: s.colSpan * s.height,
    }));

    // Sort sections based on options
    if (options?.sortByPriority) {
      sectionsToPlace.sort((a, b) => a.priority - b.priority);
    } else if (options?.sortByArea) {
      // Sort by area descending (larger first for better packing)
      sectionsToPlace.sort((a, b) => b.area - a.area);
    } else if (options?.sortByHeight !== false) {
      // Default: sort by height descending
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
      }
    }

    return this.getResult();
  }

  /**
   * Places a single section using guillotine algorithm
   */
  private placeSection(
    section: CardSection,
    colSpan: number,
    height: number,
    priority: number
  ): GuillotinePlacement | null {
    const effectiveColSpan = Math.min(colSpan, this.config.columns);
    const effectiveHeight = height + this.config.gap;

    // Find best free rectangle
    const bestRect = this.findBestFreeRectangle(effectiveColSpan, effectiveHeight);

    if (!bestRect) {
      // No space found - expand container and try again
      this.expandContainer(effectiveHeight);
      const expandedRect = this.findBestFreeRectangle(effectiveColSpan, effectiveHeight);
      if (!expandedRect) {
        return null;
      }
      return this.placeSectionInRect(section, effectiveColSpan, height, priority, expandedRect);
    }

    return this.placeSectionInRect(section, effectiveColSpan, height, priority, bestRect);
  }

  /**
   * Places a section in a specific free rectangle and splits remaining space
   */
  private placeSectionInRect(
    section: CardSection,
    colSpan: number,
    height: number,
    priority: number,
    rect: FreeRectangle
  ): GuillotinePlacement {
    const effectiveHeight = height + this.config.gap;

    // Create placement
    const placement: GuillotinePlacement = {
      section,
      x: rect.x,
      y: rect.y,
      width: colSpan,
      height,
      priority,
      sourceRectId: rect.id,
    };

    // Remove the used rectangle
    this.freeRectangles = this.freeRectangles.filter(r => r.id !== rect.id);

    // Split remaining space using guillotine cuts
    this.splitFreeRectangle(rect, colSpan, effectiveHeight);

    // Optionally merge adjacent free rectangles
    if (this.config.mergeFreeRects) {
      this.mergeFreeRectangles();
    }

    return placement;
  }

  /**
   * Finds the best free rectangle based on selection heuristic
   */
  private findBestFreeRectangle(
    width: number,
    height: number
  ): FreeRectangle | null {
    let bestRect: FreeRectangle | null = null;
    let bestScore = this.config.selectionHeuristic.startsWith('worst') 
      ? -Infinity 
      : Infinity;

    for (const rect of this.freeRectangles) {
      // Skip if rectangle is too small
      if (rect.width < width || rect.height < height) {
        continue;
      }

      const score = this.calculateRectangleScore(rect, width, height);

      const isBetter = this.config.selectionHeuristic.startsWith('worst')
        ? score > bestScore
        : score < bestScore;

      if (isBetter) {
        bestScore = score;
        bestRect = rect;
      }
    }

    return bestRect;
  }

  /**
   * Calculates score for a free rectangle based on selection heuristic
   */
  private calculateRectangleScore(
    rect: FreeRectangle,
    width: number,
    height: number
  ): number {
    const leftoverWidth = rect.width - width;
    const leftoverHeight = rect.height - height;

    switch (this.config.selectionHeuristic) {
      case 'best-area-fit':
      case 'worst-area-fit':
        return rect.width * rect.height;

      case 'best-short-side':
      case 'worst-short-side':
        return Math.min(leftoverWidth, leftoverHeight);

      case 'best-long-side':
        return Math.max(leftoverWidth, leftoverHeight);

      default:
        return rect.width * rect.height;
    }
  }

  /**
   * Splits a free rectangle after placing a section
   * Creates up to 2 new free rectangles from the remaining space
   */
  private splitFreeRectangle(
    rect: FreeRectangle,
    usedWidth: number,
    usedHeight: number
  ): void {
    const leftoverWidth = rect.width - usedWidth;
    const leftoverHeight = rect.height - usedHeight;

    // No leftover space
    if (leftoverWidth <= 0 && leftoverHeight <= 0) {
      return;
    }

    // Determine split direction based on heuristic
    const splitHorizontally = this.shouldSplitHorizontally(
      leftoverWidth,
      leftoverHeight,
      usedWidth,
      usedHeight
    );

    if (splitHorizontally) {
      // Horizontal split: one rect to the right, one below
      if (leftoverWidth > 0) {
        this.freeRectangles.push({
          x: rect.x + usedWidth,
          y: rect.y,
          width: leftoverWidth,
          height: usedHeight,
          id: this.nextRectId++,
        });
      }
      if (leftoverHeight > 0) {
        this.freeRectangles.push({
          x: rect.x,
          y: rect.y + usedHeight,
          width: rect.width,
          height: leftoverHeight,
          id: this.nextRectId++,
        });
      }
    } else {
      // Vertical split: one rect below, one to the right
      if (leftoverHeight > 0) {
        this.freeRectangles.push({
          x: rect.x,
          y: rect.y + usedHeight,
          width: usedWidth,
          height: leftoverHeight,
          id: this.nextRectId++,
        });
      }
      if (leftoverWidth > 0) {
        this.freeRectangles.push({
          x: rect.x + usedWidth,
          y: rect.y,
          width: leftoverWidth,
          height: rect.height,
          id: this.nextRectId++,
        });
      }
    }
  }

  /**
   * Determines split direction based on heuristic
   */
  private shouldSplitHorizontally(
    leftoverWidth: number,
    leftoverHeight: number,
    usedWidth: number,
    usedHeight: number
  ): boolean {
    switch (this.config.splitHeuristic) {
      case 'shorter-axis':
        return leftoverWidth <= leftoverHeight;

      case 'longer-axis':
        return leftoverWidth > leftoverHeight;

      case 'shorter-leftover':
        // Choose split that minimizes the shorter dimension of leftovers
        const horizShorter = Math.min(leftoverWidth, usedHeight);
        const vertShorter = Math.min(usedWidth, leftoverHeight);
        return horizShorter <= vertShorter;

      case 'longer-leftover':
        // Choose split that maximizes the longer dimension of leftovers
        const horizLonger = Math.max(leftoverWidth, usedHeight);
        const vertLonger = Math.max(usedWidth, leftoverHeight);
        return horizLonger >= vertLonger;

      case 'max-area':
        // Choose split that maximizes the area of the larger resulting rectangle
        const horizMaxArea = Math.max(
          leftoverWidth * usedHeight,
          leftoverHeight * (usedWidth + leftoverWidth)
        );
        const vertMaxArea = Math.max(
          usedWidth * leftoverHeight,
          leftoverWidth * (usedHeight + leftoverHeight)
        );
        return horizMaxArea >= vertMaxArea;

      default:
        return leftoverWidth <= leftoverHeight;
    }
  }

  /**
   * Merges adjacent free rectangles that can form larger rectangles
   */
  private mergeFreeRectangles(): void {
    let merged = true;
    
    while (merged) {
      merged = false;
      
      for (let i = 0; i < this.freeRectangles.length && !merged; i++) {
        for (let j = i + 1; j < this.freeRectangles.length && !merged; j++) {
          const rectA = this.freeRectangles[i];
          const rectB = this.freeRectangles[j];
          
          if (!rectA || !rectB) continue;

          // Try to merge horizontally (same y, same height, adjacent x)
          if (rectA.y === rectB.y && 
              rectA.height === rectB.height &&
              (rectA.x + rectA.width === rectB.x || rectB.x + rectB.width === rectA.x)) {
            const newX = Math.min(rectA.x, rectB.x);
            const newWidth = rectA.width + rectB.width;
            
            this.freeRectangles.splice(j, 1);
            this.freeRectangles.splice(i, 1);
            this.freeRectangles.push({
              x: newX,
              y: rectA.y,
              width: newWidth,
              height: rectA.height,
              id: this.nextRectId++,
            });
            merged = true;
          }
          // Try to merge vertically (same x, same width, adjacent y)
          else if (rectA.x === rectB.x &&
                   rectA.width === rectB.width &&
                   (rectA.y + rectA.height === rectB.y || rectB.y + rectB.height === rectA.y)) {
            const newY = Math.min(rectA.y, rectB.y);
            const newHeight = rectA.height + rectB.height;
            
            this.freeRectangles.splice(j, 1);
            this.freeRectangles.splice(i, 1);
            this.freeRectangles.push({
              x: rectA.x,
              y: newY,
              width: rectA.width,
              height: newHeight,
              id: this.nextRectId++,
            });
            merged = true;
          }
        }
      }
    }
  }

  /**
   * Expands the container height when space runs out
   */
  private expandContainer(neededHeight: number): void {
    const expansion = Math.max(neededHeight, 500);
    this.containerHeight += expansion;

    // Add new free rectangle at the bottom
    this.freeRectangles.push({
      x: 0,
      y: this.containerHeight - expansion,
      width: this.config.columns,
      height: expansion,
      id: this.nextRectId++,
    });

    // Merge with any adjacent rectangles
    if (this.config.mergeFreeRects) {
      this.mergeFreeRectangles();
    }
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
  private getResult(): GuillotinePackingResult {
    // Calculate total height from placements
    const totalHeight = this.placements.length > 0
      ? Math.max(...this.placements.map(p => p.y + p.height + this.config.gap))
      : 0;

    // Calculate utilization
    const totalArea = this.config.columns * totalHeight;
    const usedArea = this.placements.reduce(
      (sum, p) => sum + (p.width * p.height),
      0
    );
    const utilization = totalArea > 0 ? (usedArea / totalArea) * 100 : 0;

    // Calculate wasted space
    const wastedSpace = this.freeRectangles
      .filter(r => r.y < totalHeight)
      .reduce((sum, r) => {
        const effectiveHeight = Math.min(r.height, totalHeight - r.y);
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
 * Packs sections using guillotine algorithm with default configuration
 */
export function packWithGuillotine(
  sections: CardSection[],
  columns: number,
  containerWidth: number,
  options?: {
    gap?: number;
    sortByHeight?: boolean;
    sortByArea?: boolean;
    splitHeuristic?: SplitHeuristic;
    selectionHeuristic?: RectangleSelectionHeuristic;
  }
): GuillotinePackingResult {
  const packer = new GuillotinePacker({
    columns,
    containerWidth,
    gap: options?.gap ?? 12,
    splitHeuristic: options?.splitHeuristic ?? 'shorter-axis',
    selectionHeuristic: options?.selectionHeuristic ?? 'best-area-fit',
  });

  return packer.pack(sections, {
    sortByHeight: options?.sortByHeight ?? true,
    sortByArea: options?.sortByArea ?? false,
  });
}

/**
 * Converts guillotine packing result to positioned sections for rendering
 */
export function guillotineResultToPositions(
  result: GuillotinePackingResult,
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
 * Compares guillotine packing with different heuristics
 */
export function compareGuillotineHeuristics(
  sections: CardSection[],
  columns: number,
  containerWidth: number
): Map<SplitHeuristic, GuillotinePackingResult> {
  const results = new Map<SplitHeuristic, GuillotinePackingResult>();
  const heuristics: SplitHeuristic[] = [
    'shorter-axis',
    'longer-axis',
    'shorter-leftover',
    'longer-leftover',
    'max-area',
  ];

  for (const heuristic of heuristics) {
    const packer = new GuillotinePacker({
      columns,
      containerWidth,
      splitHeuristic: heuristic,
    });
    results.set(heuristic, packer.pack(sections));
  }

  return results;
}

/**
 * Finds the best heuristic combination for a given set of sections
 */
export function findBestGuillotineConfig(
  sections: CardSection[],
  columns: number,
  containerWidth: number
): {
  splitHeuristic: SplitHeuristic;
  selectionHeuristic: RectangleSelectionHeuristic;
  result: GuillotinePackingResult;
} {
  const splitHeuristics: SplitHeuristic[] = [
    'shorter-axis',
    'longer-axis',
    'shorter-leftover',
    'longer-leftover',
    'max-area',
  ];
  
  const selectionHeuristics: RectangleSelectionHeuristic[] = [
    'best-area-fit',
    'best-short-side',
    'best-long-side',
  ];

  let bestResult: GuillotinePackingResult | null = null;
  let bestSplit: SplitHeuristic = 'shorter-axis';
  let bestSelection: RectangleSelectionHeuristic = 'best-area-fit';

  for (const split of splitHeuristics) {
    for (const selection of selectionHeuristics) {
      const packer = new GuillotinePacker({
        columns,
        containerWidth,
        splitHeuristic: split,
        selectionHeuristic: selection,
      });
      
      const result = packer.pack(sections);
      
      // Score based on utilization and height
      if (!bestResult || 
          result.utilization > bestResult.utilization ||
          (result.utilization === bestResult.utilization && 
           result.totalHeight < bestResult.totalHeight)) {
        bestResult = result;
        bestSplit = split;
        bestSelection = selection;
      }
    }
  }

  return {
    splitHeuristic: bestSplit,
    selectionHeuristic: bestSelection,
    result: bestResult!,
  };
}

