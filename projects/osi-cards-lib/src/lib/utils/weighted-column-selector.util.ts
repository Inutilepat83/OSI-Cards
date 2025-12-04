/**
 * Weighted Column Selector Utility
 *
 * Enhanced column selection algorithm that considers:
 * - Current column heights (balance)
 * - Future section placements (lookahead)
 * - Gap creation potential (space efficiency)
 * - Column variance (overall balance)
 *
 * This replaces the simple "find minimum height" strategy with a sophisticated
 * scoring system that produces better-balanced, more space-efficient layouts.
 *
 * @example
 * ```typescript
 * const selector = new WeightedColumnSelector({ gapWeight: 2.0, varianceWeight: 0.5 });
 * const bestColumn = selector.findBestColumn(columnHeights, colSpan, sectionHeight, pendingSections);
 * ```
 */

import { CardSection } from '../models/card.model';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Configuration for weighted column selection
 */
export interface WeightedColumnSelectorConfig {
  /** Weight for gap penalty (higher = avoid gaps more) */
  gapWeight?: number;
  /** Weight for variance penalty (higher = prefer balanced columns) */
  varianceWeight?: number;
  /** Weight for position bonus (higher = prefer left placement) */
  positionWeight?: number;
  /** Whether to use lookahead analysis */
  enableLookahead?: boolean;
}

/**
 * Score breakdown for a column position
 */
export interface ColumnScore {
  /** Column index */
  column: number;
  /** Total score (lower is better) */
  totalScore: number;
  /** Base height score */
  heightScore: number;
  /** Variance penalty */
  variancePenalty: number;
  /** Gap creation penalty */
  gapPenalty: number;
  /** Position bonus */
  positionBonus: number;
  /** Explanation for debugging */
  explanation?: string;
}

/**
 * Result of column selection with detailed metrics
 */
export interface ColumnSelectionResult {
  /** Selected column index */
  column: number;
  /** Top position for placement */
  top: number;
  /** Score breakdown */
  score: ColumnScore;
  /** Alternative options (for debugging) */
  alternatives?: ColumnScore[];
}

const DEFAULT_CONFIG: Required<WeightedColumnSelectorConfig> = {
  gapWeight: 2.0,
  varianceWeight: 0.5,
  positionWeight: 0.1,
  enableLookahead: true,
};

// ============================================================================
// WEIGHTED COLUMN SELECTOR
// ============================================================================

/**
 * Selects optimal column placement using weighted scoring
 */
export class WeightedColumnSelector {
  private readonly config: Required<WeightedColumnSelectorConfig>;

  constructor(config: WeightedColumnSelectorConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Finds the best column for placing a section
   *
   * @param columnHeights - Current height of each column
   * @param colSpan - Number of columns the section spans
   * @param sectionHeight - Height of the section to place
   * @param pendingSections - Sections still to be placed (for lookahead)
   * @param gap - Gap between sections in pixels
   * @returns Column selection result with detailed metrics
   */
  findBestColumn(
    columnHeights: number[],
    colSpan: number,
    sectionHeight: number,
    pendingSections: CardSection[] = [],
    gap: number = 12
  ): ColumnSelectionResult {
    const scores = this.calculateAllColumnScores(
      columnHeights,
      colSpan,
      sectionHeight,
      pendingSections,
      gap
    );

    // Find column with best (minimum) score
    const bestScore = scores.reduce((best, current) =>
      current.totalScore < best.totalScore ? current : best
    );

    // Calculate placement height
    const top = this.calculatePlacementHeight(columnHeights, bestScore.column, colSpan);

    return {
      column: bestScore.column,
      top,
      score: bestScore,
      alternatives: scores.filter((s) => s.column !== bestScore.column).slice(0, 3),
    };
  }

  /**
   * Calculates scores for all possible column positions
   */
  private calculateAllColumnScores(
    columnHeights: number[],
    colSpan: number,
    sectionHeight: number,
    pendingSections: CardSection[],
    gap: number
  ): ColumnScore[] {
    const scores: ColumnScore[] = [];
    const columns = columnHeights.length;

    // Try each possible starting column
    for (let col = 0; col <= columns - colSpan; col++) {
      const score = this.calculateColumnScore(
        columnHeights,
        col,
        colSpan,
        sectionHeight,
        pendingSections,
        gap
      );
      scores.push(score);
    }

    return scores;
  }

  /**
   * Calculates weighted score for a specific column position
   */
  private calculateColumnScore(
    columnHeights: number[],
    column: number,
    colSpan: number,
    sectionHeight: number,
    pendingSections: CardSection[],
    gap: number
  ): ColumnScore {
    // 1. Base score: maximum height in the span (primary factor)
    const maxHeight = this.calculatePlacementHeight(columnHeights, column, colSpan);
    const heightScore = maxHeight;

    // 2. Variance penalty: prefer balanced columns
    const variancePenalty = this.calculateVariancePenalty(
      columnHeights,
      column,
      colSpan,
      maxHeight,
      sectionHeight,
      gap
    );

    // 3. Gap penalty: avoid creating unfillable gaps
    const gapPenalty = this.config.enableLookahead
      ? this.calculateGapPenalty(
          columnHeights,
          column,
          colSpan,
          sectionHeight,
          pendingSections,
          gap
        )
      : 0;

    // 4. Position bonus: slight preference for left placement
    const positionBonus = column * this.config.positionWeight;

    // Calculate total weighted score
    const totalScore =
      heightScore +
      variancePenalty * this.config.varianceWeight +
      gapPenalty * this.config.gapWeight +
      positionBonus;

    // Generate explanation for debugging
    const explanation = this.generateExplanation(
      column,
      heightScore,
      variancePenalty,
      gapPenalty,
      positionBonus
    );

    return {
      column,
      totalScore,
      heightScore,
      variancePenalty,
      gapPenalty,
      positionBonus,
      explanation,
    };
  }

  /**
   * Calculates the placement height (max height in span)
   */
  private calculatePlacementHeight(
    columnHeights: number[],
    column: number,
    colSpan: number
  ): number {
    let maxHeight = 0;
    for (let c = column; c < column + colSpan; c++) {
      maxHeight = Math.max(maxHeight, columnHeights[c] ?? 0);
    }
    return maxHeight;
  }

  /**
   * Calculates penalty for column height variance
   *
   * This encourages balanced columns and prevents one column from becoming
   * significantly taller than others.
   */
  private calculateVariancePenalty(
    columnHeights: number[],
    column: number,
    colSpan: number,
    placementHeight: number,
    sectionHeight: number,
    gap: number
  ): number {
    // Simulate the placement
    const simulated = [...columnHeights];
    const newHeight = placementHeight + sectionHeight + gap;

    for (let c = column; c < column + colSpan; c++) {
      simulated[c] = newHeight;
    }

    // Calculate variance after placement
    const avgHeight = simulated.reduce((sum, h) => sum + h, 0) / simulated.length;
    const variance =
      simulated.reduce((sum, h) => {
        const diff = h - avgHeight;
        return sum + diff * diff;
      }, 0) / simulated.length;

    // Return standard deviation as penalty
    return Math.sqrt(variance);
  }

  /**
   * Calculates penalty for creating unfillable gaps
   *
   * This uses lookahead to check if pending sections can fill gaps that
   * would be created by this placement.
   */
  private calculateGapPenalty(
    columnHeights: number[],
    column: number,
    colSpan: number,
    sectionHeight: number,
    pendingSections: CardSection[],
    gap: number
  ): number {
    if (pendingSections.length === 0) {
      return 0;
    }

    // Simulate the placement
    const simulated = [...columnHeights];
    const placementHeight = this.calculatePlacementHeight(columnHeights, column, colSpan);
    const newHeight = placementHeight + sectionHeight + gap;

    for (let c = column; c < column + colSpan; c++) {
      simulated[c] = newHeight;
    }

    let totalPenalty = 0;

    // Analyze pending sections to determine minimum span
    const minPendingSpan =
      pendingSections.length > 0 ? Math.min(...pendingSections.map((s) => s.colSpan || 1)) : 1;

    // Check for orphan columns on the left
    if (column > 0 && column < minPendingSpan) {
      // Orphan columns that can't fit any pending section
      totalPenalty += column * 50;
    }

    // Check for orphan columns on the right
    const remaining = columnHeights.length - (column + colSpan);
    if (remaining > 0 && remaining < minPendingSpan) {
      totalPenalty += remaining * 50;
    }

    // Check for significant height gaps in non-spanned columns
    for (let c = 0; c < columnHeights.length; c++) {
      // Skip columns that are spanned by this placement
      if (c >= column && c < column + colSpan) continue;

      const simulatedHeight = simulated[c] ?? 0;
      const currentHeight = columnHeights[c] ?? 0;
      const heightDiff = simulatedHeight - currentHeight;
      if (heightDiff > 100) {
        // Large gap created - check if any pending section can fill it
        const canFill = this.canAnyPendingSectionFill(heightDiff, 1, pendingSections);

        if (!canFill) {
          totalPenalty += heightDiff * 0.1;
        }
      }
    }

    return totalPenalty;
  }

  /**
   * Checks if any pending section can fill a gap of given dimensions
   */
  private canAnyPendingSectionFill(
    height: number,
    width: number,
    pendingSections: CardSection[]
  ): boolean {
    const heightTolerance = 20;

    return pendingSections.some((section) => {
      const sectionSpan = section.colSpan || 1;
      const sectionHeight = this.estimateSectionHeight(section);

      return sectionSpan <= width && sectionHeight <= height + heightTolerance;
    });
  }

  /**
   * Estimates height of a section (simplified)
   */
  private estimateSectionHeight(section: CardSection): number {
    // Use existing height if available
    if (section.height && typeof section.height === 'number') return section.height;

    // Basic estimation by type
    const typeHeights: Record<string, number> = {
      overview: 300,
      chart: 250,
      list: 200,
      'contact-card': 150,
      info: 180,
    };

    return typeHeights[section.type || ''] || 200;
  }

  /**
   * Generates human-readable explanation of score
   */
  private generateExplanation(
    column: number,
    heightScore: number,
    variancePenalty: number,
    gapPenalty: number,
    positionBonus: number
  ): string {
    const parts: string[] = [];

    parts.push(`Col ${column}`);
    parts.push(`height=${heightScore.toFixed(0)}`);

    if (variancePenalty > 0) {
      parts.push(`variance=${variancePenalty.toFixed(0)}`);
    }

    if (gapPenalty > 0) {
      parts.push(`gap=${gapPenalty.toFixed(0)}`);
    }

    if (positionBonus > 0) {
      parts.push(`pos=${positionBonus.toFixed(1)}`);
    }

    return parts.join(', ');
  }

  /**
   * Updates configuration
   */
  configure(config: Partial<WeightedColumnSelectorConfig>): void {
    Object.assign(this.config, config);
  }

  /**
   * Gets current configuration
   */
  getConfig(): Required<WeightedColumnSelectorConfig> {
    return { ...this.config };
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Finds best column using default weighted selection
 *
 * This is a convenience function for one-off usage without creating
 * a WeightedColumnSelector instance.
 */
export function findBestColumn(
  columnHeights: number[],
  colSpan: number,
  sectionHeight: number,
  pendingSections: CardSection[] = [],
  gap: number = 12
): { column: number; top: number } {
  const selector = new WeightedColumnSelector();
  const result = selector.findBestColumn(
    columnHeights,
    colSpan,
    sectionHeight,
    pendingSections,
    gap
  );

  return {
    column: result.column,
    top: result.top,
  };
}

/**
 * Compares weighted selection vs simple min-height selection
 *
 * Useful for benchmarking and debugging to see the difference
 * between the two approaches.
 */
export function compareSelectionStrategies(
  columnHeights: number[],
  colSpan: number,
  sectionHeight: number,
  pendingSections: CardSection[] = [],
  gap: number = 12
): {
  weighted: ColumnSelectionResult;
  simple: { column: number; top: number };
  difference: string;
} {
  // Weighted selection
  const selector = new WeightedColumnSelector();
  const weighted = selector.findBestColumn(
    columnHeights,
    colSpan,
    sectionHeight,
    pendingSections,
    gap
  );

  // Simple min-height selection
  let minHeight = Infinity;
  let simpleColumn = 0;

  for (let col = 0; col <= columnHeights.length - colSpan; col++) {
    let maxHeight = 0;
    for (let c = col; c < col + colSpan; c++) {
      maxHeight = Math.max(maxHeight, columnHeights[c] ?? 0);
    }

    if (maxHeight < minHeight) {
      minHeight = maxHeight;
      simpleColumn = col;
    }
  }

  const simple = {
    column: simpleColumn,
    top: minHeight,
  };

  // Generate difference explanation
  const difference =
    weighted.column === simple.column
      ? 'Same choice'
      : `Weighted chose col ${weighted.column} (score=${weighted.score.totalScore.toFixed(0)}) ` +
        `vs simple col ${simple.column} (height=${simple.top.toFixed(0)})`;

  return {
    weighted,
    simple,
    difference,
  };
}

/**
 * Creates a pre-configured selector for different layout priorities
 */
export function createPresetSelector(
  preset: 'balanced' | 'compact' | 'gap-averse' | 'fast'
): WeightedColumnSelector {
  const configs: Record<string, WeightedColumnSelectorConfig> = {
    balanced: {
      gapWeight: 1.5,
      varianceWeight: 1.0,
      positionWeight: 0.1,
      enableLookahead: true,
    },
    compact: {
      gapWeight: 3.0,
      varianceWeight: 0.3,
      positionWeight: 0.05,
      enableLookahead: true,
    },
    'gap-averse': {
      gapWeight: 5.0,
      varianceWeight: 0.5,
      positionWeight: 0.1,
      enableLookahead: true,
    },
    fast: {
      gapWeight: 1.0,
      varianceWeight: 0.2,
      positionWeight: 0.1,
      enableLookahead: false,
    },
  };

  return new WeightedColumnSelector(configs[preset]);
}
