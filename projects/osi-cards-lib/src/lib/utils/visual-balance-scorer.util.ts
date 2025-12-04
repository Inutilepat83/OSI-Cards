/**
 * Visual Balance Scorer Utility
 *
 * Advanced scoring system for evaluating visual balance in grid layouts:
 * - Column height variance
 * - Visual weight distribution
 * - Content density balance
 * - Symmetry scoring
 * - Aesthetic harmony
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Section for balance analysis
 */
export interface BalanceableSection {
  column: number;
  top: number;
  colSpan: number;
  height: number;
  visualWeight?: number; // Optional visual weight (1-10)
  contentDensity?: number; // Optional content density (0-1)
}

/**
 * Balance score breakdown
 */
export interface BalanceScore {
  /** Overall balance score (0-100) */
  overall: number;
  /** Column height variance score (0-100) */
  heightVariance: number;
  /** Visual weight distribution score (0-100) */
  weightDistribution: number;
  /** Content density balance score (0-100) */
  densityBalance: number;
  /** Symmetry score (0-100) */
  symmetry: number;
  /** Detailed metrics */
  metrics: {
    maxHeightDiff: number;
    avgHeight: number;
    stdDev: number;
    weightVariance: number;
    densityVariance: number;
  };
  /** Recommendations for improvement */
  recommendations: string[];
}

/**
 * Configuration for balance scoring
 */
export interface BalanceScorerConfig {
  /** Weight for height variance (0-1) */
  heightWeight?: number;
  /** Weight for visual weight distribution (0-1) */
  weightDistributionWeight?: number;
  /** Weight for density balance (0-1) */
  densityWeight?: number;
  /** Weight for symmetry (0-1) */
  symmetryWeight?: number;
  /** Threshold for "good" balance (0-100) */
  goodBalanceThreshold?: number;
}

const DEFAULT_CONFIG: Required<BalanceScorerConfig> = {
  heightWeight: 0.4,
  weightDistributionWeight: 0.3,
  densityWeight: 0.2,
  symmetryWeight: 0.1,
  goodBalanceThreshold: 75,
};

// ============================================================================
// VISUAL BALANCE SCORER
// ============================================================================

/**
 * Scores visual balance of grid layouts
 */
export class VisualBalanceScorer {
  private readonly config: Required<BalanceScorerConfig>;

  constructor(config: BalanceScorerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Calculate comprehensive balance score
   */
  calculateBalance<T extends BalanceableSection>(sections: T[], columns: number): BalanceScore {
    if (sections.length === 0 || columns === 0) {
      return this.createEmptyScore();
    }

    // Calculate individual scores
    const heightScore = this.calculateHeightVarianceScore(sections, columns);
    const weightScore = this.calculateWeightDistributionScore(sections, columns);
    const densityScore = this.calculateDensityBalanceScore(sections, columns);
    const symmetryScore = this.calculateSymmetryScore(sections, columns);

    // Calculate weighted overall score
    const overall =
      heightScore.score * this.config.heightWeight +
      weightScore.score * this.config.weightDistributionWeight +
      densityScore.score * this.config.densityWeight +
      symmetryScore.score * this.config.symmetryWeight;

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      heightScore: heightScore.score,
      weightScore: weightScore.score,
      densityScore: densityScore.score,
      symmetryScore: symmetryScore.score,
      overall,
    });

    return {
      overall: Math.round(overall),
      heightVariance: Math.round(heightScore.score),
      weightDistribution: Math.round(weightScore.score),
      densityBalance: Math.round(densityScore.score),
      symmetry: Math.round(symmetryScore.score),
      metrics: {
        maxHeightDiff: heightScore.maxDiff,
        avgHeight: heightScore.avgHeight,
        stdDev: heightScore.stdDev,
        weightVariance: weightScore.variance,
        densityVariance: densityScore.variance,
      },
      recommendations,
    };
  }

  // ==========================================================================
  // SCORING METHODS
  // ==========================================================================

  /**
   * Score based on column height variance
   * Lower variance = better balance
   */
  private calculateHeightVarianceScore<T extends BalanceableSection>(
    sections: T[],
    columns: number
  ): { score: number; maxDiff: number; avgHeight: number; stdDev: number } {
    const columnHeights = this.calculateColumnHeights(sections, columns);

    if (columnHeights.length === 0) {
      return { score: 100, maxDiff: 0, avgHeight: 0, stdDev: 0 };
    }

    const avgHeight = columnHeights.reduce((a, b) => a + b, 0) / columnHeights.length;
    const maxHeight = Math.max(...columnHeights);
    const minHeight = Math.min(...columnHeights);
    const maxDiff = maxHeight - minHeight;

    // Calculate standard deviation
    const variance =
      columnHeights.reduce((sum, h) => {
        const diff = h - avgHeight;
        return sum + diff * diff;
      }, 0) / columnHeights.length;
    const stdDev = Math.sqrt(variance);

    // Score: Lower variance = higher score
    // Perfect balance (0 variance) = 100
    // High variance = lower score
    const varianceRatio = avgHeight > 0 ? stdDev / avgHeight : 0;
    const score = Math.max(0, 100 - varianceRatio * 200);

    return { score, maxDiff, avgHeight, stdDev };
  }

  /**
   * Score based on visual weight distribution
   * Even distribution = better balance
   */
  private calculateWeightDistributionScore<T extends BalanceableSection>(
    sections: T[],
    columns: number
  ): { score: number; variance: number } {
    const columnWeights = new Array(columns).fill(0);

    // Calculate total visual weight per column
    for (const section of sections) {
      const weight = section.visualWeight || this.estimateVisualWeight(section);
      for (let c = section.column; c < section.column + section.colSpan; c++) {
        if (c < columns) {
          columnWeights[c] += weight;
        }
      }
    }

    // Calculate variance
    const avgWeight = columnWeights.reduce((a, b) => a + b, 0) / columns;
    const variance =
      columnWeights.reduce((sum, w) => {
        const diff = w - avgWeight;
        return sum + diff * diff;
      }, 0) / columns;

    // Score: Lower variance = higher score
    const varianceRatio = avgWeight > 0 ? Math.sqrt(variance) / avgWeight : 0;
    const score = Math.max(0, 100 - varianceRatio * 150);

    return { score, variance };
  }

  /**
   * Score based on content density balance
   * Even density = better balance
   */
  private calculateDensityBalanceScore<T extends BalanceableSection>(
    sections: T[],
    columns: number
  ): { score: number; variance: number } {
    const columnDensities = new Array(columns).fill(0);
    const columnCounts = new Array(columns).fill(0);

    // Calculate average density per column
    for (const section of sections) {
      const density = section.contentDensity || 0.5;
      for (let c = section.column; c < section.column + section.colSpan; c++) {
        if (c < columns) {
          columnDensities[c] += density;
          columnCounts[c]++;
        }
      }
    }

    // Average densities
    for (let c = 0; c < columns; c++) {
      if (columnCounts[c] > 0) {
        columnDensities[c] /= columnCounts[c];
      }
    }

    // Calculate variance
    const avgDensity = columnDensities.reduce((a, b) => a + b, 0) / columns;
    const variance =
      columnDensities.reduce((sum, d) => {
        const diff = d - avgDensity;
        return sum + diff * diff;
      }, 0) / columns;

    // Score: Lower variance = higher score
    const score = Math.max(0, 100 - Math.sqrt(variance) * 200);

    return { score, variance };
  }

  /**
   * Score based on layout symmetry
   * More symmetric = higher score
   */
  private calculateSymmetryScore<T extends BalanceableSection>(
    sections: T[],
    columns: number
  ): { score: number } {
    if (columns < 2) {
      return { score: 100 }; // Single column is perfectly symmetric
    }

    const columnHeights = this.calculateColumnHeights(sections, columns);

    // Compare left and right halves
    const midpoint = Math.floor(columns / 2);
    let symmetryDiff = 0;

    for (let i = 0; i < midpoint; i++) {
      const leftHeight = columnHeights[i] || 0;
      const rightHeight = columnHeights[columns - 1 - i] || 0;
      symmetryDiff += Math.abs(leftHeight - rightHeight);
    }

    // Normalize by total height
    const totalHeight = Math.max(...columnHeights);
    const symmetryRatio = totalHeight > 0 ? symmetryDiff / (totalHeight * midpoint) : 0;
    const score = Math.max(0, 100 - symmetryRatio * 100);

    return { score };
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Calculate height of each column
   */
  private calculateColumnHeights<T extends BalanceableSection>(
    sections: T[],
    columns: number
  ): number[] {
    const heights = new Array(columns).fill(0);

    for (const section of sections) {
      const bottom = section.top + section.height;
      for (let c = section.column; c < section.column + section.colSpan; c++) {
        if (c < columns) {
          heights[c] = Math.max(heights[c], bottom);
        }
      }
    }

    return heights;
  }

  /**
   * Estimate visual weight of a section
   */
  private estimateVisualWeight<T extends BalanceableSection>(section: T): number {
    // Larger sections have more visual weight
    const sizeWeight = section.height / 200; // Normalize by typical height
    const spanWeight = section.colSpan; // Wider sections have more weight
    return Math.min(10, sizeWeight + spanWeight);
  }

  /**
   * Generate improvement recommendations
   */
  private generateRecommendations(scores: {
    heightScore: number;
    weightScore: number;
    densityScore: number;
    symmetryScore: number;
    overall: number;
  }): string[] {
    const recommendations: string[] = [];
    const threshold = this.config.goodBalanceThreshold;

    if (scores.overall < threshold) {
      recommendations.push('Overall balance needs improvement');
    }

    if (scores.heightScore < threshold) {
      recommendations.push('Column heights are unbalanced - consider redistributing sections');
    }

    if (scores.weightScore < threshold) {
      recommendations.push('Visual weight is unevenly distributed - move heavy sections');
    }

    if (scores.densityScore < threshold) {
      recommendations.push('Content density varies too much - balance dense and sparse sections');
    }

    if (scores.symmetryScore < threshold) {
      recommendations.push('Layout lacks symmetry - consider mirroring section placement');
    }

    if (recommendations.length === 0) {
      recommendations.push('Layout is well-balanced');
    }

    return recommendations;
  }

  /**
   * Create empty score for edge cases
   */
  private createEmptyScore(): BalanceScore {
    return {
      overall: 100,
      heightVariance: 100,
      weightDistribution: 100,
      densityBalance: 100,
      symmetry: 100,
      metrics: {
        maxHeightDiff: 0,
        avgHeight: 0,
        stdDev: 0,
        weightVariance: 0,
        densityVariance: 0,
      },
      recommendations: ['No sections to balance'],
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Quick helper to calculate balance score
 */
export function calculateBalanceScore<T extends BalanceableSection>(
  sections: T[],
  columns: number,
  config?: BalanceScorerConfig
): number {
  const scorer = new VisualBalanceScorer(config);
  const result = scorer.calculateBalance(sections, columns);
  return result.overall;
}

/**
 * Check if layout is well-balanced
 */
export function isWellBalanced<T extends BalanceableSection>(
  sections: T[],
  columns: number,
  threshold: number = 75
): boolean {
  const score = calculateBalanceScore(sections, columns);
  return score >= threshold;
}

/**
 * Compare balance of two layouts
 */
export function compareBalance<T extends BalanceableSection>(
  layout1: T[],
  layout2: T[],
  columns: number
): { better: 'layout1' | 'layout2' | 'equal'; score1: number; score2: number } {
  const score1 = calculateBalanceScore(layout1, columns);
  const score2 = calculateBalanceScore(layout2, columns);

  let better: 'layout1' | 'layout2' | 'equal';
  if (Math.abs(score1 - score2) < 2) {
    better = 'equal';
  } else if (score1 > score2) {
    better = 'layout1';
  } else {
    better = 'layout2';
  }

  return { better, score1, score2 };
}
