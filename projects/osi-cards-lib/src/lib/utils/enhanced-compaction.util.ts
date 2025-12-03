/**
 * Enhanced Compaction Utility
 *
 * Optimized compaction algorithm for large datasets with:
 * - Early termination for performance
 * - Adaptive pass selection
 * - Incremental improvements tracking
 * - Smart section prioritization
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Compaction configuration
 */
export interface EnhancedCompactionConfig {
  /** Maximum number of passes */
  maxPasses?: number;
  /** Minimum improvement threshold (pixels) to continue */
  minImprovementThreshold?: number;
  /** Maximum time budget in milliseconds */
  timeBudget?: number;
  /** Enable adaptive pass selection */
  adaptivePasses?: boolean;
  /** Section count threshold for performance mode */
  performanceModeThreshold?: number;
  /** Gap tolerance in pixels */
  gapTolerance?: number;
}

/**
 * Compaction result
 */
export interface EnhancedCompactionResult {
  /** Height before compaction */
  initialHeight: number;
  /** Height after compaction */
  finalHeight: number;
  /** Height saved */
  heightSaved: number;
  /** Percentage improvement */
  improvement: number;
  /** Number of passes executed */
  passesExecuted: number;
  /** Time taken in milliseconds */
  timeMs: number;
  /** Sections moved */
  sectionsMoved: number;
  /** Gaps filled */
  gapsFilled: number;
  /** Reason for termination */
  terminationReason: string;
}

/**
 * Section for compaction
 */
export interface CompactableSection {
  key: string;
  column: number;
  top: number;
  colSpan: number;
  height: number;
  canMove?: boolean;
  priority?: number;
}

const DEFAULT_CONFIG: Required<EnhancedCompactionConfig> = {
  maxPasses: 5,
  minImprovementThreshold: 10,
  timeBudget: 50, // 50ms budget
  adaptivePasses: true,
  performanceModeThreshold: 100,
  gapTolerance: 20,
};

// ============================================================================
// ENHANCED COMPACTION ENGINE
// ============================================================================

/**
 * Optimized compaction for large datasets
 */
export class EnhancedCompactionEngine {
  private readonly config: Required<EnhancedCompactionConfig>;

  constructor(config: EnhancedCompactionConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Compact layout with performance optimizations
   */
  compact<T extends CompactableSection>(
    sections: T[],
    columns: number
  ): EnhancedCompactionResult & { sections: T[] } {
    const startTime = performance.now();
    const initialHeight = this.calculateHeight(sections);

    let currentSections = [...sections];
    let passesExecuted = 0;
    let sectionsMoved = 0;
    let gapsFilled = 0;
    let lastHeight = initialHeight;
    let terminationReason = 'Completed all passes';

    // Determine if we should use performance mode
    const usePerformanceMode = sections.length >= this.config.performanceModeThreshold;
    const effectiveMaxPasses = usePerformanceMode
      ? Math.min(3, this.config.maxPasses)
      : this.config.maxPasses;

    // Execute compaction passes
    for (let pass = 0; pass < effectiveMaxPasses; pass++) {
      // Check time budget
      const elapsed = performance.now() - startTime;
      if (elapsed > this.config.timeBudget) {
        terminationReason = 'Time budget exceeded';
        break;
      }

      // Execute pass
      const passResult = this.executePass(currentSections, columns, pass, usePerformanceMode);
      currentSections = passResult.sections;
      passesExecuted++;
      sectionsMoved += passResult.moved;
      gapsFilled += passResult.gapsFilled;

      // Check for improvement
      const currentHeight = this.calculateHeight(currentSections);
      const improvement = lastHeight - currentHeight;

      if (improvement < this.config.minImprovementThreshold) {
        terminationReason = 'Minimal improvement detected';
        break;
      }

      lastHeight = currentHeight;

      // Adaptive pass selection
      if (this.config.adaptivePasses && improvement < 20 && pass >= 2) {
        terminationReason = 'Adaptive early termination';
        break;
      }
    }

    const finalHeight = this.calculateHeight(currentSections);
    const timeMs = performance.now() - startTime;

    return {
      sections: currentSections,
      initialHeight,
      finalHeight,
      heightSaved: initialHeight - finalHeight,
      improvement: initialHeight > 0 ? ((initialHeight - finalHeight) / initialHeight) * 100 : 0,
      passesExecuted,
      timeMs,
      sectionsMoved,
      gapsFilled,
      terminationReason,
    };
  }

  /**
   * Execute a single compaction pass
   */
  private executePass<T extends CompactableSection>(
    sections: T[],
    columns: number,
    passNumber: number,
    performanceMode: boolean
  ): { sections: T[]; moved: number; gapsFilled: number } {
    // Select pass strategy based on pass number and mode
    if (passNumber === 0) {
      return this.moveUpwardPass(sections, columns);
    } else if (passNumber === 1) {
      return this.fillGapsPass(sections, columns);
    } else if (passNumber === 2 && !performanceMode) {
      return this.optimizeSpacingPass(sections, columns);
    } else {
      return { sections, moved: 0, gapsFilled: 0 };
    }
  }

  /**
   * Pass 1: Move sections upward into gaps
   */
  private moveUpwardPass<T extends CompactableSection>(
    sections: T[],
    columns: number
  ): { sections: T[]; moved: number; gapsFilled: number } {
    const result = [...sections];
    let moved = 0;
    let gapsFilled = 0;

    // Sort by top position (process from top to bottom)
    const sorted = [...result].sort((a, b) => a.top - b.top);

    for (const section of sorted) {
      if (section.canMove === false) continue;

      // Find highest position this section can move to
      const newTop = this.findHighestPosition(result, section, columns);

      if (newTop < section.top - this.config.gapTolerance) {
        // Update section position
        const index = result.findIndex(s => s.key === section.key);
        if (index !== -1) {
          result[index] = { ...result[index], top: newTop } as T;
          moved++;
          if (section.top - newTop > 50) {
            gapsFilled++;
          }
        }
      }
    }

    return { sections: result, moved, gapsFilled };
  }

  /**
   * Pass 2: Fill gaps with smaller sections
   */
  private fillGapsPass<T extends CompactableSection>(
    sections: T[],
    columns: number
  ): { sections: T[]; moved: number; gapsFilled: number } {
    const result = [...sections];
    let moved = 0;
    let gapsFilled = 0;

    // Find gaps
    const gaps = this.findGaps(result, columns);

    // Find small sections that can fill gaps
    const movableSections = result
      .filter(s => s.canMove !== false && s.colSpan === 1)
      .sort((a, b) => a.height - b.height); // Smallest first

    for (const gap of gaps) {
      if (gap.height < 100) continue; // Skip tiny gaps

      // Find a section that fits
      for (const section of movableSections) {
        if (section.height <= gap.height + this.config.gapTolerance) {
          // Check if we can move it here
          const canFit = this.canFitInGap(section, gap, result);

          if (canFit) {
            const index = result.findIndex(s => s.key === section.key);
            if (index !== -1) {
              result[index] = {
                ...result[index],
                column: gap.column,
                top: gap.top,
              } as T;
              moved++;
              gapsFilled++;
              break; // Move to next gap
            }
          }
        }
      }
    }

    return { sections: result, moved, gapsFilled };
  }

  /**
   * Pass 3: Optimize spacing between sections
   */
  private optimizeSpacingPass<T extends CompactableSection>(
    sections: T[],
    columns: number
  ): { sections: T[]; moved: number; gapsFilled: number } {
    const result = [...sections];
    let moved = 0;

    // Group sections by column
    const columnGroups = this.groupByColumn(result, columns);

    for (const [col, colSections] of columnGroups.entries()) {
      // Sort by top position
      const sorted = [...colSections].sort((a, b) => a.top - b.top);

      // Adjust spacing
      let currentTop = 0;
      for (const section of sorted) {
        const index = result.findIndex(s => s.key === section.key);
        if (index !== -1 && section.top > currentTop + 5) {
          result[index] = { ...result[index], top: currentTop } as T;
          moved++;
        }
        currentTop = Math.max(currentTop, result[index]!.top + result[index]!.height + 12);
      }
    }

    return { sections: result, moved, gapsFilled: 0 };
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Calculate total layout height
   */
  private calculateHeight<T extends CompactableSection>(sections: T[]): number {
    if (sections.length === 0) return 0;
    return Math.max(...sections.map(s => s.top + s.height));
  }

  /**
   * Find highest position a section can move to
   */
  private findHighestPosition<T extends CompactableSection>(
    sections: T[],
    section: T,
    columns: number
  ): number {
    let highestTop = 0;

    // Check all sections that might block this one
    for (const other of sections) {
      if (other.key === section.key) continue;

      // Check if columns overlap
      const columnsOverlap =
        other.column < section.column + section.colSpan &&
        section.column < other.column + other.colSpan;

      if (columnsOverlap) {
        const otherBottom = other.top + other.height + 12; // Include gap
        highestTop = Math.max(highestTop, otherBottom);
      }
    }

    return highestTop;
  }

  /**
   * Find gaps in the layout
   */
  private findGaps<T extends CompactableSection>(
    sections: T[],
    columns: number
  ): Array<{ column: number; top: number; height: number }> {
    const gaps: Array<{ column: number; top: number; height: number }> = [];
    const maxHeight = this.calculateHeight(sections);

    for (let col = 0; col < columns; col++) {
      const colSections = sections
        .filter(s => s.column <= col && col < s.column + s.colSpan)
        .sort((a, b) => a.top - b.top);

      let currentTop = 0;
      for (const section of colSections) {
        if (section.top > currentTop + this.config.gapTolerance) {
          gaps.push({
            column: col,
            top: currentTop,
            height: section.top - currentTop,
          });
        }
        currentTop = Math.max(currentTop, section.top + section.height + 12);
      }
    }

    return gaps.filter(g => g.height >= 50); // Only significant gaps
  }

  /**
   * Check if section can fit in gap
   */
  private canFitInGap<T extends CompactableSection>(
    section: T,
    gap: { column: number; top: number; height: number },
    sections: T[]
  ): boolean {
    // Check if any section already occupies this space
    for (const other of sections) {
      if (other.key === section.key) continue;

      const columnsOverlap =
        other.column <= gap.column && gap.column < other.column + other.colSpan;

      const verticalOverlap =
        other.top < gap.top + section.height &&
        gap.top < other.top + other.height;

      if (columnsOverlap && verticalOverlap) {
        return false;
      }
    }

    return true;
  }

  /**
   * Group sections by column
   */
  private groupByColumn<T extends CompactableSection>(
    sections: T[],
    columns: number
  ): Map<number, T[]> {
    const groups = new Map<number, T[]>();

    for (let col = 0; col < columns; col++) {
      groups.set(col, []);
    }

    for (const section of sections) {
      for (let col = section.column; col < section.column + section.colSpan; col++) {
        groups.get(col)?.push(section);
      }
    }

    return groups;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Quick helper to compact sections
 */
export function compactSections<T extends CompactableSection>(
  sections: T[],
  columns: number,
  config: EnhancedCompactionConfig = {}
): T[] {
  const engine = new EnhancedCompactionEngine(config);
  const result = engine.compact(sections, columns);
  return result.sections;
}

/**
 * Estimate compaction benefit
 */
export function estimateCompactionBenefit<T extends CompactableSection>(
  sections: T[],
  columns: number
): number {
  if (sections.length === 0) return 0;

  // Quick heuristic: count gaps
  const engine = new EnhancedCompactionEngine();
  const gaps = (engine as any).findGaps(sections, columns);

  return gaps.reduce((sum: number, gap: any) => sum + gap.height, 0);
}

