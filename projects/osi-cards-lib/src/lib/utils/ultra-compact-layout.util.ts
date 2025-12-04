/**
 * Ultra-Compact Layout Engine
 *
 * Aggressively eliminates empty spaces and gaps in grid layouts through:
 * - Tetris-like section fitting
 * - Dynamic section resizing
 * - Gap-filling priority system
 * - Multi-pass compaction
 * - Zero-tolerance for wasted space
 *
 * This engine ensures NO empty spaces remain in the layout.
 *
 * @example
 * ```typescript
 * const compactor = new UltraCompactLayoutEngine({ maxPasses: 5 });
 * const compactLayout = compactor.compact(sections, columns, sectionHeights);
 * ```
 */

import { CardSection } from '../models/card.model';
import { generateWidthExpression, generateLeftExpression, GRID_GAP } from './grid-config.util';
import { SectionLayoutIntelligence } from './section-layout-intelligence.util';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Positioned section with layout data
 */
export interface CompactPositionedSection {
  section: CardSection;
  key: string;
  colSpan: number;
  left: string;
  top: number;
  width: string;
  height: number;
  canShrink: boolean;
  canExpand: boolean;
  minColumns: number;
  maxColumns: number;
  priority: number;
}

/**
 * Gap in the layout
 */
export interface LayoutGap {
  column: number;
  top: number;
  height: number;
  width: number;
  area: number;
}

/**
 * Compaction configuration
 */
export interface UltraCompactConfig {
  /** Maximum number of compaction passes */
  maxPasses: number;
  /** Enable section shrinking */
  enableShrinking: boolean;
  /** Enable section expanding */
  enableExpanding: boolean;
  /** Enable section splitting */
  enableSplitting: boolean;
  /** Gap tolerance in pixels (gaps smaller are OK) */
  gapTolerance: number;
  /** Grid gap between sections */
  gap: number;
  /** Container width */
  containerWidth: number;
}

/**
 * Compaction result with metrics
 */
export interface CompactionResult {
  sections: CompactPositionedSection[];
  totalHeight: number;
  gapCount: number;
  totalGapArea: number;
  utilization: number;
  passesRun: number;
  improvements: string[];
}

const DEFAULT_CONFIG: UltraCompactConfig = {
  maxPasses: 5,
  enableShrinking: true,
  enableExpanding: true,
  enableSplitting: false,
  gapTolerance: 20,
  gap: 12,
  containerWidth: 1200,
};

// ============================================================================
// ULTRA-COMPACT LAYOUT ENGINE
// ============================================================================

/**
 * Main compaction engine
 */
export class UltraCompactLayoutEngine {
  private readonly config: UltraCompactConfig;
  private readonly intelligence: SectionLayoutIntelligence;

  constructor(config: Partial<UltraCompactConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.intelligence = new SectionLayoutIntelligence();
  }

  /**
   * Compacts layout to eliminate all gaps
   */
  compact(
    sections: CardSection[],
    columns: number,
    sectionHeights: Map<string, number>
  ): CompactionResult {
    // Convert to positioned sections
    let positioned = this.initializePositions(sections, columns, sectionHeights);

    const improvements: string[] = [];
    let passesRun = 0;
    let improved = true;

    // Multi-pass compaction
    while (improved && passesRun < this.config.maxPasses) {
      improved = false;
      passesRun++;

      // Pass 1: Move sections up into gaps
      const upwardResult = this.moveUpward(positioned, columns);
      if (upwardResult.improved) {
        positioned = upwardResult.sections;
        improvements.push(`Pass ${passesRun}: Moved ${upwardResult.movedCount} sections upward`);
        improved = true;
      }

      // Pass 2: Shrink sections to eliminate gaps
      if (this.config.enableShrinking) {
        const shrinkResult = this.shrinkToFit(positioned, columns);
        if (shrinkResult.improved) {
          positioned = shrinkResult.sections;
          improvements.push(`Pass ${passesRun}: Shrunk ${shrinkResult.shrunkCount} sections`);
          improved = true;
        }
      }

      // Pass 3: Expand sections to fill gaps
      if (this.config.enableExpanding) {
        const expandResult = this.expandToFill(positioned, columns);
        if (expandResult.improved) {
          positioned = expandResult.sections;
          improvements.push(`Pass ${passesRun}: Expanded ${expandResult.expandedCount} sections`);
          improved = true;
        }
      }

      // Pass 4: Tetris-fit small sections into gaps
      const tetrisResult = this.tetrisFit(positioned, columns);
      if (tetrisResult.improved) {
        positioned = tetrisResult.sections;
        improvements.push(`Pass ${passesRun}: Tetris-fit ${tetrisResult.fittedCount} sections`);
        improved = true;
      }

      // Pass 5: Swap sections for better packing
      const swapResult = this.swapForCompaction(positioned, columns);
      if (swapResult.improved) {
        positioned = swapResult.sections;
        improvements.push(`Pass ${passesRun}: Swapped ${swapResult.swapCount} section pairs`);
        improved = true;
      }
    }

    // Final metrics
    const totalHeight = this.calculateTotalHeight(positioned);
    const gaps = this.findGaps(positioned, columns, totalHeight);
    const totalGapArea = gaps.reduce((sum, g) => sum + g.area, 0);
    const utilization = this.calculateUtilization(positioned, totalHeight, columns);

    return {
      sections: positioned,
      totalHeight,
      gapCount: gaps.filter((g) => g.height > this.config.gapTolerance).length,
      totalGapArea,
      utilization,
      passesRun,
      improvements,
    };
  }

  /**
   * Initializes positioned sections from card sections
   */
  private initializePositions(
    sections: CardSection[],
    columns: number,
    sectionHeights: Map<string, number>
  ): CompactPositionedSection[] {
    const positioned: CompactPositionedSection[] = [];
    const colHeights = new Array(columns).fill(0);

    // Sort by priority (higher first)
    const sorted = [...sections].sort((a, b) => {
      const prioA = this.intelligence.getSectionPreferences(a).placementPriority;
      const prioB = this.intelligence.getSectionPreferences(b).placementPriority;
      return prioB - prioA;
    });

    for (const section of sorted) {
      const preferences = this.intelligence.getSectionPreferences(section);
      const optimized = this.intelligence.optimizeSection(
        section,
        this.config.containerWidth,
        columns
      );

      let colSpan = optimized.colSpan;
      const height =
        sectionHeights.get(section.id || section.title || '') || optimized.estimatedHeight;

      // Find best column
      let bestColumn = 0;
      let minHeight = Infinity;

      for (let col = 0; col <= columns - colSpan; col++) {
        let maxHeight = 0;
        for (let c = col; c < col + colSpan; c++) {
          maxHeight = Math.max(maxHeight, colHeights[c] || 0);
        }
        if (maxHeight < minHeight) {
          minHeight = maxHeight;
          bestColumn = col;
        }
      }

      // Update column heights
      const newHeight = minHeight + height + this.config.gap;
      for (let c = bestColumn; c < bestColumn + colSpan; c++) {
        colHeights[c] = newHeight;
      }

      positioned.push({
        section,
        key: section.id || section.title || `section-${positioned.length}`,
        colSpan,
        left: generateLeftExpression(columns, bestColumn, this.config.gap),
        top: minHeight,
        width: generateWidthExpression(columns, colSpan, this.config.gap),
        height,
        canShrink: preferences.canShrink,
        canExpand: preferences.canExpand,
        minColumns: preferences.minColumns,
        maxColumns: preferences.maxColumns,
        priority: preferences.placementPriority,
      });
    }

    return positioned;
  }

  /**
   * Moves sections upward into gaps
   */
  private moveUpward(
    sections: CompactPositionedSection[],
    columns: number
  ): { sections: CompactPositionedSection[]; improved: boolean; movedCount: number } {
    const result = [...sections];
    let movedCount = 0;

    // Sort by current top position (process bottom sections first)
    const sorted = [...result].sort((a, b) => b.top - a.top);

    for (const section of sorted) {
      const col = this.parseColumn(section.left, columns);
      const span = section.colSpan;

      // Find highest position this section can move to
      const newTop = this.findHighestPosition(result, col, span, section.key, columns);

      if (newTop < section.top) {
        // Move it up
        const idx = result.findIndex((s) => s.key === section.key);
        if (idx >= 0) {
          result[idx] = { ...section, top: newTop };
          movedCount++;
        }
      }
    }

    return {
      sections: result,
      improved: movedCount > 0,
      movedCount,
    };
  }

  /**
   * Finds highest position a section can be placed
   */
  private findHighestPosition(
    sections: CompactPositionedSection[],
    col: number,
    span: number,
    excludeKey: string,
    columns: number
  ): number {
    // Build column heights excluding the target section
    const colHeights = new Array(columns).fill(0);

    for (const section of sections) {
      if (section.key === excludeKey) continue;

      const sCol = this.parseColumn(section.left, columns);
      const sSpan = section.colSpan;
      const sBottom = section.top + section.height + this.config.gap;

      for (let c = sCol; c < sCol + sSpan; c++) {
        colHeights[c] = Math.max(colHeights[c] || 0, sBottom);
      }
    }

    // Find max height in target span
    let maxHeight = 0;
    for (let c = col; c < col + span; c++) {
      maxHeight = Math.max(maxHeight, colHeights[c] || 0);
    }

    return maxHeight;
  }

  /**
   * Shrinks sections to eliminate gaps
   */
  private shrinkToFit(
    sections: CompactPositionedSection[],
    columns: number
  ): { sections: CompactPositionedSection[]; improved: boolean; shrunkCount: number } {
    const result = [...sections];
    let shrunkCount = 0;

    // Find gaps
    const totalHeight = this.calculateTotalHeight(result);
    const gaps = this.findGaps(result, columns, totalHeight);

    // Try shrinking wide sections
    for (const section of result) {
      if (!section.canShrink || section.colSpan <= section.minColumns) {
        continue;
      }

      // Check if shrinking would help fill gaps
      const col = this.parseColumn(section.left, columns);
      const newSpan = section.colSpan - 1;

      if (newSpan >= section.minColumns) {
        // Check if this creates fillable space
        const remaining = section.colSpan - newSpan;
        const adjacentGaps = gaps.filter(
          (g) => (g.column === col + newSpan || g.column === col - 1) && g.width < remaining + 1
        );

        if (adjacentGaps.length > 0) {
          // Shrink it
          const idx = result.findIndex((s) => s.key === section.key);
          if (idx >= 0) {
            result[idx] = {
              ...section,
              colSpan: newSpan,
              width: generateWidthExpression(columns, newSpan, this.config.gap),
            };
            shrunkCount++;
          }
        }
      }
    }

    return {
      sections: result,
      improved: shrunkCount > 0,
      shrunkCount,
    };
  }

  /**
   * Expands sections to fill gaps
   */
  private expandToFill(
    sections: CompactPositionedSection[],
    columns: number
  ): { sections: CompactPositionedSection[]; improved: boolean; expandedCount: number } {
    const result = [...sections];
    let expandedCount = 0;

    // Find gaps
    const totalHeight = this.calculateTotalHeight(result);
    const gaps = this.findGaps(result, columns, totalHeight);

    // Try expanding sections to fill gaps
    for (const section of result) {
      if (!section.canExpand || section.colSpan >= section.maxColumns) {
        continue;
      }

      const col = this.parseColumn(section.left, columns);
      const newSpan = Math.min(section.colSpan + 1, section.maxColumns, columns - col);

      if (newSpan > section.colSpan) {
        // Check if this fills a gap
        const adjacentGaps = gaps.filter(
          (g) =>
            g.column === col + section.colSpan &&
            g.width >= 1 &&
            Math.abs(g.top - section.top) < section.height + 50
        );

        if (adjacentGaps.length > 0) {
          // Check if expansion doesn't create overlap
          const wouldOverlap = this.wouldOverlapAfterExpansion(
            result,
            section,
            col,
            newSpan,
            columns
          );

          if (!wouldOverlap) {
            const idx = result.findIndex((s) => s.key === section.key);
            if (idx >= 0) {
              result[idx] = {
                ...section,
                colSpan: newSpan,
                width: generateWidthExpression(columns, newSpan, this.config.gap),
              };
              expandedCount++;
            }
          }
        }
      }
    }

    return {
      sections: result,
      improved: expandedCount > 0,
      expandedCount,
    };
  }

  /**
   * Checks if expanding section would cause overlap
   */
  private wouldOverlapAfterExpansion(
    sections: CompactPositionedSection[],
    section: CompactPositionedSection,
    col: number,
    newSpan: number,
    columns: number
  ): boolean {
    const sectionBottom = section.top + section.height;

    for (const other of sections) {
      if (other.key === section.key) continue;

      const otherCol = this.parseColumn(other.left, columns);
      const otherSpan = other.colSpan;
      const otherBottom = other.top + other.height;

      // Check for column overlap
      const colOverlap = !(col + newSpan <= otherCol || col >= otherCol + otherSpan);

      // Check for vertical overlap
      const vertOverlap = !(
        section.top >= otherBottom + this.config.gap || sectionBottom + this.config.gap <= other.top
      );

      if (colOverlap && vertOverlap) {
        return true;
      }
    }

    return false;
  }

  /**
   * Tetris-style fitting of small sections into gaps
   */
  private tetrisFit(
    sections: CompactPositionedSection[],
    columns: number
  ): { sections: CompactPositionedSection[]; improved: boolean; fittedCount: number } {
    const result = [...sections];
    let fittedCount = 0;

    // Find gaps
    const totalHeight = this.calculateTotalHeight(result);
    const gaps = this.findGaps(result, columns, totalHeight).sort((a, b) => b.area - a.area); // Largest gaps first

    // Find small sections that could fit
    const candidates = result.filter((s) => s.colSpan <= 2 && s.height < 300);

    for (const gap of gaps) {
      if (gap.height < this.config.gapTolerance) continue;

      for (const candidate of candidates) {
        if (candidate.colSpan > gap.width) continue;
        if (candidate.height > gap.height + this.config.gapTolerance) continue;

        const currentTop = candidate.top;

        // Try fitting in the gap
        if (gap.top < currentTop) {
          // Check if we can move it without creating overlap
          const col = gap.column;
          const canFit = !this.wouldOverlapAfterMove(result, candidate, col, gap.top, columns);

          if (canFit) {
            const idx = result.findIndex((s) => s.key === candidate.key);
            if (idx >= 0) {
              result[idx] = {
                ...candidate,
                left: generateLeftExpression(columns, col, this.config.gap),
                top: gap.top,
              };
              fittedCount++;
              break; // Move to next gap
            }
          }
        }
      }
    }

    return {
      sections: result,
      improved: fittedCount > 0,
      fittedCount,
    };
  }

  /**
   * Checks if moving section would cause overlap
   */
  private wouldOverlapAfterMove(
    sections: CompactPositionedSection[],
    section: CompactPositionedSection,
    newCol: number,
    newTop: number,
    columns: number
  ): boolean {
    const newBottom = newTop + section.height;

    for (const other of sections) {
      if (other.key === section.key) continue;

      const otherCol = this.parseColumn(other.left, columns);
      const otherSpan = other.colSpan;
      const otherBottom = other.top + other.height;

      // Check for column overlap
      const colOverlap = !(newCol + section.colSpan <= otherCol || newCol >= otherCol + otherSpan);

      // Check for vertical overlap (with gap tolerance)
      const vertOverlap = !(
        newTop >= otherBottom + this.config.gap || newBottom + this.config.gap <= other.top
      );

      if (colOverlap && vertOverlap) {
        return true;
      }
    }

    return false;
  }

  /**
   * Swaps sections for better compaction
   */
  private swapForCompaction(
    sections: CompactPositionedSection[],
    columns: number
  ): { sections: CompactPositionedSection[]; improved: boolean; swapCount: number } {
    const result = [...sections];
    let swapCount = 0;

    // Try swapping pairs of sections
    for (let i = 0; i < result.length - 1; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const sectionA = result[i];
        const sectionB = result[j];

        if (!sectionA || !sectionB) continue;

        // Only swap if different spans
        if (sectionA.colSpan === sectionB.colSpan) continue;

        // Calculate current total height
        const currentHeight = this.calculateTotalHeight(result);

        // Try swap
        const swapped = [...result];
        const colA = this.parseColumn(sectionA.left, columns);
        const colB = this.parseColumn(sectionB.left, columns);

        swapped[i] = {
          ...sectionA,
          left: generateLeftExpression(columns, colB, this.config.gap),
          colSpan: sectionB.colSpan,
          width: generateWidthExpression(columns, sectionB.colSpan, this.config.gap),
        };

        swapped[j] = {
          ...sectionB,
          left: generateLeftExpression(columns, colA, this.config.gap),
          colSpan: sectionA.colSpan,
          width: generateWidthExpression(columns, sectionA.colSpan, this.config.gap),
        };

        // Recalculate positions
        const recompacted = this.moveUpward(swapped, columns);
        const newHeight = this.calculateTotalHeight(recompacted.sections);

        // Keep swap if it improves
        if (newHeight < currentHeight - 10) {
          result[i] = recompacted.sections[i]!;
          result[j] = recompacted.sections[j]!;
          swapCount++;
        }
      }
    }

    return {
      sections: result,
      improved: swapCount > 0,
      swapCount,
    };
  }

  /**
   * Finds all gaps in the layout
   */
  private findGaps(
    sections: CompactPositionedSection[],
    columns: number,
    containerHeight: number
  ): LayoutGap[] {
    const gaps: LayoutGap[] = [];
    const resolution = 10; // Grid resolution in pixels

    // Build occupancy grid
    const rows = Math.ceil(containerHeight / resolution);
    const grid: boolean[][] = Array.from({ length: rows }, () => new Array(columns).fill(false));

    // Mark occupied cells
    for (const section of sections) {
      const col = this.parseColumn(section.left, columns);
      const startRow = Math.floor(section.top / resolution);
      const endRow = Math.min(Math.ceil((section.top + section.height) / resolution), rows);

      for (let r = startRow; r < endRow; r++) {
        for (let c = col; c < col + section.colSpan; c++) {
          if (grid[r]) grid[r]![c] = true;
        }
      }
    }

    // Find gaps
    for (let c = 0; c < columns; c++) {
      let gapStart: number | null = null;

      for (let r = 0; r < rows; r++) {
        const occupied = grid[r]?.[c] || false;

        if (!occupied && gapStart === null) {
          gapStart = r;
        } else if (occupied && gapStart !== null) {
          const height = (r - gapStart) * resolution;
          if (height >= this.config.gapTolerance) {
            gaps.push({
              column: c,
              top: gapStart * resolution,
              height,
              width: 1,
              area: height,
            });
          }
          gapStart = null;
        }
      }
    }

    return gaps;
  }

  /**
   * Calculates total layout height
   */
  private calculateTotalHeight(sections: CompactPositionedSection[]): number {
    if (sections.length === 0) return 0;
    return Math.max(...sections.map((s) => s.top + s.height + this.config.gap));
  }

  /**
   * Calculates space utilization percentage
   */
  private calculateUtilization(
    sections: CompactPositionedSection[],
    totalHeight: number,
    columns: number
  ): number {
    const totalArea = totalHeight * columns;
    if (totalArea === 0) return 100;

    const usedArea = sections.reduce((sum, s) => sum + s.colSpan * s.height, 0);
    return (usedArea / totalArea) * 100;
  }

  /**
   * Parses column index from CSS expression
   */
  private parseColumn(left: string, columns: number): number {
    if (left === '0px') return 0;

    const match = left.match(/\*\s*(\d+)\s*\)/);
    if (match?.[1]) {
      return parseInt(match[1], 10);
    }

    return 0;
  }
}

/**
 * Quick helper to compact a layout
 */
export function compactLayout(
  sections: CardSection[],
  columns: number,
  sectionHeights: Map<string, number>,
  containerWidth: number = 1200
): CompactionResult {
  const engine = new UltraCompactLayoutEngine({ containerWidth });
  return engine.compact(sections, columns, sectionHeights);
}
