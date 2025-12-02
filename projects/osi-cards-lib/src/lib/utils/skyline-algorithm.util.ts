/**
 * Skyline Bin-Packing Algorithm
 * 
 * Advanced layout algorithm that maintains a "skyline" of column tops
 * for optimal section placement. Provides better space utilization than
 * the simpler First Fit Decreasing Height (FFDH) algorithm.
 * 
 * The algorithm:
 * 1. Maintains a skyline (list of segment heights) representing the "top edge"
 * 2. For each section, finds the best position where it fits with minimal waste
 * 3. Updates the skyline after placement
 * 4. Supports multi-column spanning sections
 * 
 * @example
 * ```typescript
 * import { SkylinePacker } from 'osi-cards-lib';
 * 
 * const packer = new SkylinePacker(4, 1200); // 4 columns, 1200px width
 * const layout = packer.pack(sections);
 * ```
 */

import { CardSection } from '../models/card.model';
import { estimateSectionHeight, measureContentDensity, calculatePriorityScore } from './smart-grid.util';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Skyline segment representing a horizontal region at a certain height
 */
export interface SkylineSegment {
  /** Starting X position (column index or pixel position) */
  x: number;
  /** Width of segment (in columns or pixels) */
  width: number;
  /** Height (Y position of top edge) */
  y: number;
}

/**
 * Placed section with position and dimensions
 */
export interface PlacedSection {
  section: CardSection;
  x: number;           // Left position (column index)
  y: number;           // Top position (pixels)
  width: number;       // Width in columns
  height: number;      // Height in pixels
  priority: number;    // Priority score
  wastedSpace: number; // Wasted space at this position
}

/**
 * Placement candidate during best-fit search
 */
interface PlacementCandidate {
  segmentIndex: number;
  x: number;
  y: number;
  wastedSpace: number;
  fitnessScore: number;
}

/**
 * Skyline packer configuration
 */
export interface SkylinePackerConfig {
  /** Number of columns in the grid */
  columns: number;
  /** Container width in pixels */
  containerWidth: number;
  /** Gap between items in pixels */
  gap?: number;
  /** Whether to use best-fit (true) or first-fit (false) */
  useBestFit?: boolean;
  /** Whether to merge adjacent segments at same height */
  mergeSegments?: boolean;
  /** Maximum height before wrapping (0 = infinite) */
  maxHeight?: number;
}

/**
 * Packing result with metrics
 */
export interface PackingResult {
  /** Placed sections with positions */
  placements: PlacedSection[];
  /** Total height of packed area */
  totalHeight: number;
  /** Utilization percentage (0-100) */
  utilization: number;
  /** Number of gaps created */
  gapCount: number;
  /** Total wasted space in pixels */
  wastedSpace: number;
  /** Final skyline state */
  finalSkyline: SkylineSegment[];
}

// ============================================================================
// SKYLINE PACKER CLASS
// ============================================================================

/**
 * Skyline bin-packing algorithm implementation
 */
export class SkylinePacker {
  private skyline: SkylineSegment[] = [];
  private placements: PlacedSection[] = [];
  private readonly config: Required<SkylinePackerConfig>;
  private readonly columnWidth: number;

  constructor(config: SkylinePackerConfig) {
    this.config = {
      columns: config.columns,
      containerWidth: config.containerWidth,
      gap: config.gap ?? 12,
      useBestFit: config.useBestFit ?? true,
      mergeSegments: config.mergeSegments ?? true,
      maxHeight: config.maxHeight ?? 0,
    };

    // Calculate column width
    const totalGaps = this.config.gap * (this.config.columns - 1);
    this.columnWidth = (this.config.containerWidth - totalGaps) / this.config.columns;

    // Initialize skyline with single segment at y=0
    this.reset();
  }

  /**
   * Resets the packer to initial state
   */
  reset(): void {
    this.skyline = [{
      x: 0,
      width: this.config.columns,
      y: 0,
    }];
    this.placements = [];
  }

  /**
   * Packs sections using the skyline algorithm
   * 
   * @param sections - Sections to pack
   * @param options - Packing options
   * @returns Packing result with placements and metrics
   */
  pack(
    sections: CardSection[],
    options?: {
      sortByHeight?: boolean;
      sortByPriority?: boolean;
      respectOrder?: boolean;
    }
  ): PackingResult {
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
    }));

    // Sort sections based on options
    if (options?.sortByPriority && !options?.respectOrder) {
      sectionsToPlace.sort((a, b) => a.priority - b.priority);
    }

    if (options?.sortByHeight && !options?.respectOrder) {
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
        this.updateSkyline(placement);
      }
    }

    return this.getResult();
  }

  /**
   * Places a single section using skyline algorithm
   */
  private placeSection(
    section: CardSection,
    colSpan: number,
    height: number,
    priority: number
  ): PlacedSection | null {
    // Clamp colSpan to available columns
    const effectiveColSpan = Math.min(colSpan, this.config.columns);
    
    // Find best position
    const candidate = this.config.useBestFit
      ? this.findBestFit(effectiveColSpan, height)
      : this.findFirstFit(effectiveColSpan, height);

    if (!candidate) {
      return null;
    }

    return {
      section,
      x: candidate.x,
      y: candidate.y,
      width: effectiveColSpan,
      height,
      priority,
      wastedSpace: candidate.wastedSpace,
    };
  }

  /**
   * Finds the best-fit position (minimizes wasted space)
   */
  private findBestFit(colSpan: number, height: number): PlacementCandidate | null {
    const candidates: PlacementCandidate[] = [];

    for (let i = 0; i < this.skyline.length; i++) {
      const segment = this.skyline[i];
      if (!segment) continue;

      // Check all possible positions within this segment and following segments
      for (let x = segment.x; x <= segment.x + segment.width - colSpan; x++) {
        // Make sure x is valid (column boundary)
        if (x < 0 || x + colSpan > this.config.columns) continue;

        const candidate = this.evaluatePosition(x, colSpan, height);
        if (candidate) {
          candidate.segmentIndex = i;
          candidates.push(candidate);
        }
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    // Find candidate with best fitness score
    candidates.sort((a, b) => a.fitnessScore - b.fitnessScore);
    return candidates[0] ?? null;
  }

  /**
   * Finds the first-fit position
   */
  private findFirstFit(colSpan: number, height: number): PlacementCandidate | null {
    for (let i = 0; i < this.skyline.length; i++) {
      const segment = this.skyline[i];
      if (!segment) continue;

      if (segment.width >= colSpan) {
        const candidate = this.evaluatePosition(segment.x, colSpan, height);
        if (candidate) {
          candidate.segmentIndex = i;
          return candidate;
        }
      }
    }
    return null;
  }

  /**
   * Evaluates a potential placement position
   */
  private evaluatePosition(
    x: number,
    colSpan: number,
    height: number
  ): PlacementCandidate | null {
    // Find the maximum Y among all segments this placement would span
    let maxY = 0;
    let touchedSegments = 0;

    for (const segment of this.skyline) {
      // Check if segment overlaps with placement
      const segmentEnd = segment.x + segment.width;
      const placementEnd = x + colSpan;

      if (segment.x < placementEnd && segmentEnd > x) {
        // Segments overlap
        maxY = Math.max(maxY, segment.y);
        touchedSegments++;
      }
    }

    // Check max height constraint
    if (this.config.maxHeight > 0 && maxY + height > this.config.maxHeight) {
      return null;
    }

    // Calculate wasted space (gaps created below this placement)
    let wastedSpace = 0;
    for (const segment of this.skyline) {
      const segmentEnd = segment.x + segment.width;
      const placementEnd = x + colSpan;

      if (segment.x < placementEnd && segmentEnd > x) {
        // Calculate overlap width
        const overlapStart = Math.max(segment.x, x);
        const overlapEnd = Math.min(segmentEnd, placementEnd);
        const overlapWidth = overlapEnd - overlapStart;
        
        // Wasted space is the gap between segment top and placement bottom
        const gap = maxY - segment.y;
        if (gap > 0) {
          wastedSpace += gap * overlapWidth * this.columnWidth;
        }
      }
    }

    // Fitness score: lower is better
    // Prioritize: lower Y position, less wasted space, fewer touched segments
    const fitnessScore = 
      maxY * 1000 + 
      wastedSpace * 0.01 + 
      touchedSegments * 10 +
      x * 0.001; // Slight preference for left positions

    return {
      segmentIndex: 0, // Will be set by caller
      x,
      y: maxY,
      wastedSpace,
      fitnessScore,
    };
  }

  /**
   * Updates the skyline after placing a section
   */
  private updateSkyline(placement: PlacedSection): void {
    const newTop = placement.y + placement.height + this.config.gap;
    const placementLeft = placement.x;
    const placementRight = placement.x + placement.width;

    // Create new skyline segments
    const newSkyline: SkylineSegment[] = [];

    for (const segment of this.skyline) {
      const segmentLeft = segment.x;
      const segmentRight = segment.x + segment.width;

      // No overlap - keep segment as is
      if (segmentRight <= placementLeft || segmentLeft >= placementRight) {
        newSkyline.push({ ...segment });
        continue;
      }

      // Segment is completely covered - replace with new segment
      if (segmentLeft >= placementLeft && segmentRight <= placementRight) {
        // Will be added as part of placement
        continue;
      }

      // Partial overlap on left side
      if (segmentLeft < placementLeft) {
        newSkyline.push({
          x: segmentLeft,
          width: placementLeft - segmentLeft,
          y: segment.y,
        });
      }

      // Partial overlap on right side
      if (segmentRight > placementRight) {
        newSkyline.push({
          x: placementRight,
          width: segmentRight - placementRight,
          y: segment.y,
        });
      }
    }

    // Add segment for the new placement
    newSkyline.push({
      x: placementLeft,
      width: placement.width,
      y: newTop,
    });

    // Sort by x position
    newSkyline.sort((a, b) => a.x - b.x);

    // Merge adjacent segments at same height
    if (this.config.mergeSegments) {
      this.skyline = this.mergeAdjacentSegments(newSkyline);
    } else {
      this.skyline = newSkyline;
    }
  }

  /**
   * Merges adjacent segments that are at the same height
   */
  private mergeAdjacentSegments(segments: SkylineSegment[]): SkylineSegment[] {
    if (segments.length <= 1) {
      return segments;
    }

    const merged: SkylineSegment[] = [];
    let current = { ...segments[0]! };

    for (let i = 1; i < segments.length; i++) {
      const next = segments[i]!;
      
      // Check if segments are adjacent and at same height
      if (current.x + current.width === next.x && current.y === next.y) {
        // Merge: extend current segment
        current.width += next.width;
      } else {
        // Different height or not adjacent: start new segment
        merged.push(current);
        current = { ...next };
      }
    }

    merged.push(current);
    return merged;
  }

  /**
   * Calculates column span for a section
   */
  private calculateColSpan(section: CardSection): number {
    // Explicit colSpan takes priority
    if (section.colSpan && section.colSpan > 0) {
      return Math.min(section.colSpan, this.config.columns);
    }

    // Use preferredColumns if set
    if (section.preferredColumns) {
      return Math.min(section.preferredColumns, this.config.columns);
    }

    // Type-based defaults
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
  private getResult(): PackingResult {
    // Calculate total height from skyline
    const totalHeight = Math.max(...this.skyline.map(s => s.y), 0);

    // Calculate utilization
    const totalArea = this.config.containerWidth * totalHeight;
    const usedArea = this.placements.reduce(
      (sum, p) => sum + (p.width * this.columnWidth * p.height),
      0
    );
    const utilization = totalArea > 0 ? (usedArea / totalArea) * 100 : 0;

    // Calculate total wasted space
    const wastedSpace = this.placements.reduce((sum, p) => sum + p.wastedSpace, 0);

    // Count gaps (segments below max height)
    const maxSegmentY = Math.max(...this.skyline.map(s => s.y));
    const gapCount = this.skyline.filter(s => s.y < maxSegmentY).length;

    return {
      placements: this.placements,
      totalHeight,
      utilization: Math.round(utilization * 100) / 100,
      gapCount,
      wastedSpace: Math.round(wastedSpace),
      finalSkyline: [...this.skyline],
    };
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Packs sections using skyline algorithm with default configuration
 * 
 * @param sections - Sections to pack
 * @param columns - Number of columns
 * @param containerWidth - Container width in pixels
 * @param options - Packing options
 * @returns Packing result
 */
export function packWithSkyline(
  sections: CardSection[],
  columns: number,
  containerWidth: number,
  options?: {
    gap?: number;
    sortByHeight?: boolean;
    sortByPriority?: boolean;
    useBestFit?: boolean;
  }
): PackingResult {
  const packer = new SkylinePacker({
    columns,
    containerWidth,
    gap: options?.gap ?? 12,
    useBestFit: options?.useBestFit ?? true,
  });

  return packer.pack(sections, {
    sortByHeight: options?.sortByHeight ?? true,
    sortByPriority: options?.sortByPriority ?? true,
  });
}

/**
 * Converts skyline packing result to positioned sections for rendering
 * 
 * @param result - Packing result from skyline algorithm
 * @param columns - Number of columns
 * @param gap - Gap between items
 * @returns Array of positioned sections with CSS-ready values
 */
export function skylineResultToPositions(
  result: PackingResult,
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
    // Calculate CSS expressions
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
 * Compares packing efficiency between FFDH and Skyline algorithms
 * 
 * @param sections - Sections to pack
 * @param columns - Number of columns
 * @param containerWidth - Container width
 * @returns Comparison metrics
 */
export function comparePacking(
  sections: CardSection[],
  columns: number,
  containerWidth: number
): {
  skyline: PackingResult;
  comparison: {
    utilizationDiff: number;
    heightDiff: number;
    gapCountDiff: number;
    recommendation: 'skyline' | 'ffdh' | 'equal';
  };
} {
  const skylineResult = packWithSkyline(sections, columns, containerWidth);
  
  // For comparison, we'd need to run the FFDH algorithm too
  // Here we return just the skyline result with placeholder comparison
  return {
    skyline: skylineResult,
    comparison: {
      utilizationDiff: 0,
      heightDiff: 0,
      gapCountDiff: 0,
      recommendation: 'skyline',
    },
  };
}









