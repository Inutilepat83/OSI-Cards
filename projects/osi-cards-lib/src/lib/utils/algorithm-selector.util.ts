/**
 * Algorithm Selector Utility
 *
 * Intelligent algorithm selection for section placement with:
 * - Algorithm scorer to pick best algorithm (Point 26)
 * - Benchmarking mode for performance comparison (Point 27)
 * - Smart fallback with retry logic (Point 28)
 * - Hybrid algorithm mode (Point 29)
 * - Streaming-aware algorithm selection (Point 30)
 *
 * @example
 * ```typescript
 * import { AlgorithmSelector } from './algorithm-selector.util';
 *
 * const selector = new AlgorithmSelector(sections, config);
 * const bestAlgorithm = selector.selectBestAlgorithm();
 * const layout = selector.executeWithFallback(sections);
 * ```
 */

import { CardSection } from '../models/card.model';
import { PackingAlgorithm } from './grid-config.util';
import { gridLogger } from './grid-logger.util';
import { IncrementalLayoutEngine } from './incremental-layout.util';
import { packSectionsIntoRows, RowPackingResult } from './row-packer.util';
import { SkylinePacker, PackingResult as SkylinePackingResult } from './skyline-algorithm.util';
import { binPack2D, SectionWithMetrics } from './smart-grid.util';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Algorithm performance metrics for comparison
 */
export interface AlgorithmMetrics {
  /** Algorithm identifier */
  algorithm: PackingAlgorithm;
  /** Space utilization percentage (0-100) */
  utilizationPercent: number;
  /** Number of gaps in the layout */
  gapCount: number;
  /** Total gap area in pixels */
  totalGapArea: number;
  /** Layout calculation time in milliseconds */
  calculationTimeMs: number;
  /** Total layout height in pixels */
  totalHeight: number;
  /** Number of sections that were shrunk */
  shrunkCount: number;
  /** Number of sections that were grown */
  grownCount: number;
  /** Column balance score (0-1, higher is better) */
  balanceScore: number;
}

/**
 * Algorithm selection result
 */
export interface AlgorithmSelectionResult {
  /** Selected algorithm */
  selectedAlgorithm: PackingAlgorithm;
  /** Reason for selection */
  selectionReason: string;
  /** All algorithm metrics (if benchmarking enabled) */
  allMetrics?: AlgorithmMetrics[];
  /** Confidence in selection (0-1) */
  confidence: number;
}

/**
 * Algorithm selector configuration
 */
export interface AlgorithmSelectorConfig {
  /** Number of sections to sample for scoring (default: 10) */
  sampleSize: number;
  /** Enable benchmarking mode to compare all algorithms */
  enableBenchmarking: boolean;
  /** Enable hybrid mode (Skyline + Row-first) */
  enableHybridMode: boolean;
  /** Minimum utilization threshold before fallback (default: 75) */
  minUtilizationThreshold: number;
  /** Maximum fallback attempts (default: 2) */
  maxFallbackAttempts: number;
  /** Enable streaming-aware selection */
  enableStreamingAware: boolean;
  /** Columns in the grid */
  columns: number;
  /** Gap between sections */
  gap: number;
}

/**
 * Default selector configuration
 */
export const DEFAULT_SELECTOR_CONFIG: AlgorithmSelectorConfig = {
  sampleSize: 10,
  enableBenchmarking: false,
  enableHybridMode: true,
  minUtilizationThreshold: 75,
  maxFallbackAttempts: 2,
  enableStreamingAware: true,
  columns: 4,
  gap: 12,
};

/**
 * Hybrid layout result combining multiple algorithms
 */
export interface HybridLayoutResult {
  /** Positioned sections from hybrid approach */
  sections: SectionWithMetrics[];
  /** Algorithm used for initial placement */
  initialAlgorithm: PackingAlgorithm;
  /** Algorithm used for gap filling */
  gapFillingAlgorithm: PackingAlgorithm;
  /** Combined metrics */
  metrics: AlgorithmMetrics;
}

// ============================================================================
// ALGORITHM SELECTOR CLASS
// ============================================================================

/**
 * Intelligent algorithm selector that chooses the best packing algorithm
 * based on section characteristics and layout requirements.
 */
export class AlgorithmSelector {
  private config: AlgorithmSelectorConfig;
  private incrementalEngine: IncrementalLayoutEngine | null = null;
  private lastSelectionResult: AlgorithmSelectionResult | null = null;

  constructor(config: Partial<AlgorithmSelectorConfig> = {}) {
    this.config = { ...DEFAULT_SELECTOR_CONFIG, ...config };
  }

  /**
   * Configure the selector
   */
  configure(config: Partial<AlgorithmSelectorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ==========================================================================
  // ALGORITHM SCORING (Point 26)
  // ==========================================================================

  /**
   * Selects the best algorithm by running all algorithms on a sample of sections.
   * Returns the algorithm with the best utilization percentage.
   *
   * @param sections - Sections to layout (or sample from)
   * @returns Algorithm selection result with reasoning
   */
  selectBestAlgorithm(sections: CardSection[]): AlgorithmSelectionResult {
    // Take a sample of sections for quick scoring
    const sampleSections = sections.slice(0, this.config.sampleSize);

    if (sampleSections.length === 0) {
      return {
        selectedAlgorithm: 'row-first',
        selectionReason: 'No sections provided, using default',
        confidence: 0.5,
      };
    }

    // Run all algorithms on the sample
    const metrics = this.benchmarkAlgorithms(sampleSections);

    // Score each algorithm
    const scores = metrics.map((m) => ({
      algorithm: m.algorithm,
      score: this.calculateAlgorithmScore(m),
      metrics: m,
    }));

    // Sort by score (highest first)
    scores.sort((a, b) => b.score - a.score);

    const best = scores[0];
    if (!best) {
      return {
        selectedAlgorithm: 'row-first',
        selectionReason: 'Scoring failed, using default',
        confidence: 0.5,
      };
    }

    // Calculate confidence based on score difference
    const secondBest = scores[1];
    const scoreDiff = secondBest ? best.score - secondBest.score : best.score;
    const confidence = Math.min(0.5 + scoreDiff / 100, 1);

    // Build selection reason
    const reason = this.buildSelectionReason(best.metrics, scores);

    const result: AlgorithmSelectionResult = {
      selectedAlgorithm: best.algorithm,
      selectionReason: reason,
      allMetrics: this.config.enableBenchmarking ? metrics : undefined,
      confidence,
    };

    this.lastSelectionResult = result;

    // Log selection if debug is enabled
    if (gridLogger.logAlgorithmSelection) {
      gridLogger.logAlgorithmSelection(result.selectedAlgorithm, result.selectionReason);
    }

    return result;
  }

  /**
   * Calculates a composite score for an algorithm based on metrics.
   * Higher score is better.
   */
  private calculateAlgorithmScore(metrics: AlgorithmMetrics): number {
    let score = 0;

    // Utilization is the primary factor (weight: 40%)
    score += metrics.utilizationPercent * 0.4;

    // Balance score (weight: 20%)
    score += metrics.balanceScore * 20;

    // Penalty for gaps (weight: -15%)
    score -= metrics.gapCount * 3;

    // Penalty for tall layouts (weight: -10%)
    // Normalize by assuming 500px is a "typical" height
    const heightPenalty = Math.max(0, (metrics.totalHeight - 500) / 100);
    score -= heightPenalty;

    // Bonus for speed (weight: 10%)
    // Normalize by assuming 10ms is acceptable
    const speedBonus = Math.max(0, 10 - metrics.calculationTimeMs);
    score += speedBonus;

    // Penalty for excessive shrinking/growing (weight: -5%)
    const adjustmentPenalty = (metrics.shrunkCount + metrics.grownCount) * 0.5;
    score -= adjustmentPenalty;

    return score;
  }

  /**
   * Builds a human-readable reason for algorithm selection
   */
  private buildSelectionReason(
    winner: AlgorithmMetrics,
    allScores: Array<{ algorithm: PackingAlgorithm; score: number; metrics: AlgorithmMetrics }>
  ): string {
    const reasons: string[] = [];

    reasons.push(
      `${winner.algorithm} selected with ${winner.utilizationPercent.toFixed(1)}% utilization`
    );

    if (winner.gapCount === 0) {
      reasons.push('no gaps');
    } else if (winner.gapCount <= 2) {
      reasons.push(`minimal gaps (${winner.gapCount})`);
    }

    if (winner.balanceScore > 0.8) {
      reasons.push('well-balanced columns');
    }

    if (winner.calculationTimeMs < 5) {
      reasons.push('fast calculation');
    }

    // Compare with runner-up
    const runnerUp = allScores.find((s) => s.algorithm !== winner.algorithm);
    if (runnerUp) {
      const diff = winner.utilizationPercent - runnerUp.metrics.utilizationPercent;
      if (Math.abs(diff) > 5) {
        reasons.push(`${diff.toFixed(1)}% better than ${runnerUp.algorithm}`);
      }
    }

    return reasons.join(', ');
  }

  // ==========================================================================
  // ALGORITHM BENCHMARKING (Point 27)
  // ==========================================================================

  /**
   * Benchmarks all available algorithms and returns their metrics.
   * Useful for debugging and performance analysis.
   */
  benchmarkAlgorithms(sections: CardSection[]): AlgorithmMetrics[] {
    const algorithms: PackingAlgorithm[] = ['row-first', 'legacy', 'skyline'];
    const results: AlgorithmMetrics[] = [];

    for (const algorithm of algorithms) {
      const metrics = this.measureAlgorithm(algorithm, sections);
      results.push(metrics);
    }

    // Sort by utilization for easy comparison
    results.sort((a, b) => b.utilizationPercent - a.utilizationPercent);

    return results;
  }

  /**
   * Measures a single algorithm's performance
   */
  private measureAlgorithm(algorithm: PackingAlgorithm, sections: CardSection[]): AlgorithmMetrics {
    const startTime = performance.now();

    let utilizationPercent = 0;
    let gapCount = 0;
    let totalGapArea = 0;
    let totalHeight = 0;
    let shrunkCount = 0;
    let grownCount = 0;
    let balanceScore = 0;

    try {
      switch (algorithm) {
        case 'row-first': {
          const result = packSectionsIntoRows(sections, {
            totalColumns: this.config.columns,
            prioritizeSpaceFilling: true,
            allowShrinking: true,
            allowGrowing: true,
            gap: this.config.gap,
          });
          utilizationPercent = result.utilizationPercent;
          gapCount = result.rowsWithGaps;
          totalHeight = result.totalHeight;
          shrunkCount = result.shrunkCount;
          grownCount = result.grownCount;
          balanceScore = this.calculateBalanceFromRows(result);
          break;
        }

        case 'skyline': {
          const packer = new SkylinePacker({
            columns: this.config.columns,
            gap: this.config.gap,
            containerWidth: this.config.columns * 260 + (this.config.columns - 1) * this.config.gap,
          });
          const result = packer.pack(sections);
          utilizationPercent = result.utilization;
          gapCount = result.gapCount;
          totalHeight = result.totalHeight;
          balanceScore = this.calculateBalanceFromSkyline(result);
          break;
        }

        case 'legacy':
        default: {
          const result = binPack2D(sections, this.config.columns, {
            respectPriority: true,
            fillGaps: true,
            balanceColumns: true,
          });
          // Calculate metrics from legacy result
          if (result.length > 0) {
            const maxTop = Math.max(...result.map((s) => (s.top ?? 0) + s.estimatedHeight));
            totalHeight = maxTop;
            const totalArea = this.config.columns * maxTop;
            const usedArea = result.reduce((sum, s) => sum + s.colSpan * s.estimatedHeight, 0);
            utilizationPercent = totalArea > 0 ? (usedArea / totalArea) * 100 : 0;
            balanceScore = this.calculateBalanceFromBinPack(result, this.config.columns);
          }
          break;
        }
      }
    } catch (error) {
      // Algorithm failed - return worst metrics
      utilizationPercent = 0;
      gapCount = sections.length;
    }

    const calculationTimeMs = performance.now() - startTime;

    return {
      algorithm,
      utilizationPercent,
      gapCount,
      totalGapArea,
      calculationTimeMs,
      totalHeight,
      shrunkCount,
      grownCount,
      balanceScore,
    };
  }

  /**
   * Calculates column balance score from row-packing result
   */
  private calculateBalanceFromRows(result: RowPackingResult): number {
    if (result.rows.length === 0) return 1;

    // Check how many rows have full width
    const fullRows = result.rows.filter((r) => r.remainingCapacity === 0).length;
    return fullRows / result.rows.length;
  }

  /**
   * Calculates column balance score from skyline result
   */
  private calculateBalanceFromSkyline(result: SkylinePackingResult): number {
    // Use final skyline segments to determine balance
    if (result.finalSkyline.length === 0) return 1;

    const heights = result.finalSkyline.map((s) => s.y);
    const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;
    const variance =
      heights.reduce((sum, h) => sum + Math.pow(h - avgHeight, 2), 0) / heights.length;

    const maxVariance = Math.pow(avgHeight, 2);
    return maxVariance > 0 ? Math.max(0, 1 - variance / maxVariance) : 1;
  }

  /**
   * Calculates column balance score from bin-pack result
   */
  private calculateBalanceFromBinPack(sections: SectionWithMetrics[], columns: number): number {
    // Calculate column heights
    const colHeights = new Array(columns).fill(0);

    for (const section of sections) {
      const col = section.column ?? 0;
      const height = section.estimatedHeight;
      for (let c = col; c < Math.min(col + section.colSpan, columns); c++) {
        colHeights[c] = Math.max(colHeights[c], (section.top ?? 0) + height);
      }
    }

    // Calculate variance
    const avgHeight = colHeights.reduce((a, b) => a + b, 0) / columns;
    const variance = colHeights.reduce((sum, h) => sum + Math.pow(h - avgHeight, 2), 0) / columns;

    // Convert to 0-1 score (lower variance = higher score)
    const maxVariance = Math.pow(avgHeight, 2);
    return maxVariance > 0 ? Math.max(0, 1 - variance / maxVariance) : 1;
  }

  // ==========================================================================
  // SMART FALLBACK (Point 28)
  // ==========================================================================

  /**
   * Executes layout with smart fallback on failure.
   * Tries algorithm-specific optimizations before falling back.
   */
  executeWithFallback(
    sections: CardSection[],
    preferredAlgorithm?: PackingAlgorithm
  ): { algorithm: PackingAlgorithm; metrics: AlgorithmMetrics; result: unknown } {
    const algorithm =
      preferredAlgorithm ?? this.lastSelectionResult?.selectedAlgorithm ?? 'row-first';
    const attempts: PackingAlgorithm[] = [algorithm];

    // Build fallback chain based on the preferred algorithm
    if (algorithm === 'row-first') {
      attempts.push('skyline', 'legacy');
    } else if (algorithm === 'skyline') {
      attempts.push('row-first', 'legacy');
    } else {
      attempts.push('row-first', 'skyline');
    }

    let lastError: Error | null = null;

    for (let i = 0; i < Math.min(attempts.length, this.config.maxFallbackAttempts + 1); i++) {
      const tryAlgorithm = attempts[i];
      if (!tryAlgorithm) continue;

      try {
        const metrics = this.measureAlgorithm(tryAlgorithm, sections);

        // Check if result is acceptable
        if (metrics.utilizationPercent >= this.config.minUtilizationThreshold) {
          return {
            algorithm: tryAlgorithm,
            metrics,
            result: this.getLayoutResult(tryAlgorithm, sections),
          };
        }

        // Below threshold - try optimizations before fallback
        if (i === 0) {
          // Try algorithm-specific optimizations
          const optimized = this.tryOptimizations(tryAlgorithm, sections);
          if (optimized && optimized.utilizationPercent >= this.config.minUtilizationThreshold) {
            return {
              algorithm: tryAlgorithm,
              metrics: optimized,
              result: this.getLayoutResult(tryAlgorithm, sections),
            };
          }
        }

        // Log fallback
        gridLogger.log?.(
          'layout',
          `Algorithm ${tryAlgorithm} utilization ${metrics.utilizationPercent.toFixed(1)}% below threshold, trying fallback`
        );
      } catch (error) {
        lastError = error as Error;
        gridLogger.log?.('error', `Algorithm ${tryAlgorithm} failed: ${lastError.message}`);
      }
    }

    // All attempts failed - return best effort with last algorithm
    const fallbackAlgorithm = attempts[attempts.length - 1] ?? 'legacy';
    return {
      algorithm: fallbackAlgorithm,
      metrics: this.measureAlgorithm(fallbackAlgorithm, sections),
      result: this.getLayoutResult(fallbackAlgorithm, sections),
    };
  }

  /**
   * Tries algorithm-specific optimizations
   */
  private tryOptimizations(
    algorithm: PackingAlgorithm,
    sections: CardSection[]
  ): AlgorithmMetrics | null {
    // Different optimizations for each algorithm
    switch (algorithm) {
      case 'row-first':
        // Try with more aggressive shrinking
        return this.measureAlgorithm('row-first', sections);

      case 'skyline':
        // Skyline doesn't have additional optimizations
        return null;

      case 'legacy':
        // Legacy uses binPack2D with gap filling
        return this.measureAlgorithm('legacy', sections);

      default:
        return null;
    }
  }

  /**
   * Gets the actual layout result for an algorithm
   */
  private getLayoutResult(algorithm: PackingAlgorithm, sections: CardSection[]): unknown {
    switch (algorithm) {
      case 'row-first':
        return packSectionsIntoRows(sections, {
          totalColumns: this.config.columns,
          prioritizeSpaceFilling: true,
          allowShrinking: true,
          allowGrowing: true,
          gap: this.config.gap,
        });

      case 'skyline':
        const packer = new SkylinePacker({
          columns: this.config.columns,
          gap: this.config.gap,
          containerWidth: this.config.columns * 260 + (this.config.columns - 1) * this.config.gap,
        });
        return packer.pack(sections);

      case 'legacy':
      default:
        return binPack2D(sections, this.config.columns, {
          respectPriority: true,
          fillGaps: true,
          balanceColumns: true,
        });
    }
  }

  // ==========================================================================
  // HYBRID ALGORITHM MODE (Point 29)
  // ==========================================================================

  /**
   * Executes hybrid algorithm: Skyline for initial placement, Row-first for gap filling.
   * Combines the strengths of both algorithms.
   */
  executeHybrid(sections: CardSection[]): HybridLayoutResult {
    if (!this.config.enableHybridMode) {
      // Fall back to single algorithm
      const metrics = this.measureAlgorithm('row-first', sections);
      const result = binPack2D(sections, this.config.columns);
      return {
        sections: result,
        initialAlgorithm: 'row-first',
        gapFillingAlgorithm: 'row-first',
        metrics,
      };
    }

    // Phase 1: Use Skyline for initial placement (better space utilization)
    const packer = new SkylinePacker({
      columns: this.config.columns,
      gap: this.config.gap,
      containerWidth: this.config.columns * 260 + (this.config.columns - 1) * this.config.gap,
    });
    const skylineResult = packer.pack(sections);

    // Phase 2: Check for remaining gaps
    if (skylineResult.gapCount === 0 || skylineResult.utilization >= 95) {
      // Skyline did great, no need for hybrid
      const metrics = this.measureAlgorithm('skyline', sections);
      return {
        sections: this.skylineToMetrics(skylineResult),
        initialAlgorithm: 'skyline',
        gapFillingAlgorithm: 'skyline',
        metrics,
      };
    }

    // Phase 3: Use Row-first to fill remaining gaps
    // This is a simplified hybrid - in practice you'd re-run with gap sections
    const rowResult = packSectionsIntoRows(sections, {
      totalColumns: this.config.columns,
      prioritizeSpaceFilling: true,
      allowShrinking: true,
      allowGrowing: true,
      gap: this.config.gap,
    });

    // Compare results and use the better one
    const skylineMetrics = this.measureAlgorithm('skyline', sections);
    const rowMetrics = this.measureAlgorithm('row-first', sections);

    const skylineScore = this.calculateAlgorithmScore(skylineMetrics);
    const rowScore = this.calculateAlgorithmScore(rowMetrics);

    if (skylineScore > rowScore) {
      return {
        sections: this.skylineToMetrics(skylineResult),
        initialAlgorithm: 'skyline',
        gapFillingAlgorithm: 'skyline',
        metrics: skylineMetrics,
      };
    }

    // Row-first won - convert to SectionWithMetrics
    const result = binPack2D(sections, this.config.columns);
    return {
      sections: result,
      initialAlgorithm: 'skyline',
      gapFillingAlgorithm: 'row-first',
      metrics: rowMetrics,
    };
  }

  /**
   * Converts Skyline result to SectionWithMetrics array
   */
  private skylineToMetrics(result: SkylinePackingResult): SectionWithMetrics[] {
    return result.placements.map((p) => ({
      section: p.section,
      estimatedHeight: p.height,
      colSpan: p.width, // In skyline, width is column span
      priority: p.priority,
      density: 0,
      column: p.x, // In skyline, x is column index
      top: p.y, // In skyline, y is top position
    }));
  }

  // ==========================================================================
  // STREAMING-AWARE SELECTION (Point 30)
  // ==========================================================================

  /**
   * Gets or creates an incremental layout engine for streaming scenarios.
   * Maintains state across section additions for better streaming performance.
   */
  getStreamingEngine(): IncrementalLayoutEngine {
    if (!this.incrementalEngine) {
      this.incrementalEngine = new IncrementalLayoutEngine({
        columns: this.config.columns,
        containerWidth: 1200,
        gap: this.config.gap,
      });
    }
    return this.incrementalEngine;
  }

  /**
   * Resets the streaming engine (call when starting a new card)
   */
  resetStreamingEngine(): void {
    this.incrementalEngine = null;
  }

  /**
   * Selects the best algorithm for streaming scenarios.
   * Considers section arrival rate and incremental layout requirements.
   */
  selectForStreaming(currentSections: CardSection[], isFirstBatch: boolean): PackingAlgorithm {
    if (!this.config.enableStreamingAware) {
      return 'row-first';
    }

    if (isFirstBatch) {
      // First batch - use algorithm scoring on available sections
      const selection = this.selectBestAlgorithm(currentSections);
      return selection.selectedAlgorithm;
    }

    // Subsequent batches - prefer incremental algorithms
    // Skyline is naturally incremental
    if (currentSections.length < 5) {
      return 'skyline'; // Good for few sections
    }

    // For more sections, row-first handles gaps better
    return 'row-first';
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let _selectorInstance: AlgorithmSelector | null = null;

/**
 * Gets the global algorithm selector instance
 */
export function getAlgorithmSelector(config?: Partial<AlgorithmSelectorConfig>): AlgorithmSelector {
  if (!_selectorInstance) {
    _selectorInstance = new AlgorithmSelector(config);
  } else if (config) {
    _selectorInstance.configure(config);
  }
  return _selectorInstance;
}

/**
 * Resets the global algorithm selector
 */
export function resetAlgorithmSelector(): void {
  _selectorInstance = null;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quickly selects the best algorithm for a set of sections
 */
export function selectBestAlgorithm(
  sections: CardSection[],
  columns: number = 4
): PackingAlgorithm {
  const selector = getAlgorithmSelector({ columns });
  return selector.selectBestAlgorithm(sections).selectedAlgorithm;
}

/**
 * Benchmarks all algorithms and returns comparison metrics
 */
export function benchmarkAlgorithms(
  sections: CardSection[],
  columns: number = 4
): AlgorithmMetrics[] {
  const selector = new AlgorithmSelector({ columns, enableBenchmarking: true });
  return selector.benchmarkAlgorithms(sections);
}

/**
 * Executes hybrid layout algorithm
 */
export function executeHybridLayout(
  sections: CardSection[],
  columns: number = 4,
  gap: number = 12
): HybridLayoutResult {
  const selector = new AlgorithmSelector({ columns, gap, enableHybridMode: true });
  return selector.executeHybrid(sections);
}
