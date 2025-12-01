/**
 * Hybrid Algorithm Selector
 * 
 * Automatically selects the best packing algorithm based on section
 * characteristics like count, size variance, density distribution, etc.
 * 
 * Selection criteria:
 * - Section count: Fewer sections favor simpler algorithms
 * - Size variance: High variance favors MaxRects
 * - Density distribution: Uniform density favors row-first
 * - Priority mix: High-priority sections favor priority-aware algorithms
 * 
 * Can also run multiple algorithms in parallel and pick the best result
 * for production use cases where quality matters more than speed.
 * 
 * @example
 * ```typescript
 * import { AlgorithmSelector } from 'osi-cards-lib';
 * 
 * const selector = new AlgorithmSelector(sections, {
 *   columns: 4,
 *   containerWidth: 1200,
 * });
 * 
 * // Get recommended algorithm
 * const algo = selector.recommend();
 * 
 * // Or run all and pick best
 * const result = selector.packWithBestAlgorithm();
 * ```
 */

import { CardSection } from '../models/card.model';
import { estimateSectionHeight, measureContentDensity, calculatePriorityScore, binPack2D, SectionWithMetrics } from './smart-grid.util';
import { packWithSkyline, PackingResult as SkylineResult } from './skyline-algorithm.util';
import { packWithGuillotine, GuillotinePackingResult } from './guillotine-algorithm.util';
import { packWithMaxRects, MaxRectsPackingResult } from './maxrects-algorithm.util';
import { packSectionsIntoRows, RowPackingResult, packingResultToPositions as rowPackerPositions } from './row-packer.util';
import { PackingAlgorithm } from './grid-config.util';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Extended algorithm types including new algorithms
 */
export type ExtendedPackingAlgorithm = 
  | PackingAlgorithm 
  | 'guillotine' 
  | 'maxrects'
  | 'auto';  // Auto-select best algorithm

/**
 * Algorithm selection configuration
 */
export interface AlgorithmSelectorConfig {
  /** Number of columns */
  columns: number;
  /** Container width in pixels */
  containerWidth: number;
  /** Gap between items */
  gap?: number;
  /** Whether to run all algorithms and compare (slower but better quality) */
  compareAll?: boolean;
  /** Algorithm to prefer when scores are close */
  preferredAlgorithm?: ExtendedPackingAlgorithm;
  /** Minimum utilization improvement needed to switch algorithms (percentage) */
  switchThreshold?: number;
}

/**
 * Section analysis metrics
 */
export interface SectionAnalysis {
  /** Total number of sections */
  count: number;
  /** Average height of sections */
  avgHeight: number;
  /** Standard deviation of heights */
  heightStdDev: number;
  /** Coefficient of variation for heights */
  heightCV: number;
  /** Average column span */
  avgColSpan: number;
  /** Standard deviation of column spans */
  colSpanStdDev: number;
  /** Average content density */
  avgDensity: number;
  /** Percentage of high-priority sections */
  highPriorityPct: number;
  /** Total preferred width (sum of colSpans) */
  totalPreferredWidth: number;
  /** Whether sections have uniform sizes */
  isUniform: boolean;
  /** Whether there's a wide variety of sizes */
  hasHighVariety: boolean;
  /** Whether most sections are single-column */
  mostlySingleColumn: boolean;
  /** Whether sections have mixed priorities */
  hasMixedPriorities: boolean;
}

/**
 * Algorithm recommendation with reasoning
 */
export interface AlgorithmRecommendation {
  /** Recommended algorithm */
  algorithm: ExtendedPackingAlgorithm;
  /** Confidence score (0-100) */
  confidence: number;
  /** Reasons for recommendation */
  reasons: string[];
  /** Alternative algorithms to consider */
  alternatives: ExtendedPackingAlgorithm[];
}

/**
 * Unified packing result for comparison
 */
export interface UnifiedPackingResult {
  algorithm: ExtendedPackingAlgorithm;
  totalHeight: number;
  utilization: number;
  gapCount: number;
  placements: Array<{
    section: CardSection;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

/**
 * Comparison result from running multiple algorithms
 */
export interface AlgorithmComparisonResult {
  /** Best result */
  best: UnifiedPackingResult;
  /** All results for reference */
  all: UnifiedPackingResult[];
  /** Performance metrics */
  metrics: {
    algorithmsCompared: number;
    totalTimeMs: number;
    bestAlgorithm: ExtendedPackingAlgorithm;
    utilizationSpread: number;  // Max - min utilization
    heightSpread: number;       // Max - min height
  };
}

// ============================================================================
// ALGORITHM SELECTOR CLASS
// ============================================================================

/**
 * Intelligent algorithm selector for optimal packing
 */
export class AlgorithmSelector {
  private readonly sections: CardSection[];
  private readonly config: Required<AlgorithmSelectorConfig>;
  private analysis: SectionAnalysis | null = null;

  constructor(sections: CardSection[], config: AlgorithmSelectorConfig) {
    this.sections = sections;
    this.config = {
      columns: config.columns,
      containerWidth: config.containerWidth,
      gap: config.gap ?? 12,
      compareAll: config.compareAll ?? false,
      preferredAlgorithm: config.preferredAlgorithm ?? 'auto',
      switchThreshold: config.switchThreshold ?? 5,
    };
  }

  /**
   * Analyzes sections and returns metrics
   */
  analyze(): SectionAnalysis {
    if (this.analysis) {
      return this.analysis;
    }

    const metrics = this.sections.map(section => ({
      height: estimateSectionHeight(section),
      colSpan: this.getColSpan(section),
      density: measureContentDensity(section),
      priority: calculatePriorityScore(section),
    }));

    const count = metrics.length;
    
    if (count === 0) {
      this.analysis = {
        count: 0,
        avgHeight: 0,
        heightStdDev: 0,
        heightCV: 0,
        avgColSpan: 0,
        colSpanStdDev: 0,
        avgDensity: 0,
        highPriorityPct: 0,
        totalPreferredWidth: 0,
        isUniform: true,
        hasHighVariety: false,
        mostlySingleColumn: true,
        hasMixedPriorities: false,
      };
      return this.analysis;
    }

    // Calculate averages
    const avgHeight = metrics.reduce((sum, m) => sum + m.height, 0) / count;
    const avgColSpan = metrics.reduce((sum, m) => sum + m.colSpan, 0) / count;
    const avgDensity = metrics.reduce((sum, m) => sum + m.density, 0) / count;

    // Calculate standard deviations
    const heightVariance = metrics.reduce((sum, m) => sum + Math.pow(m.height - avgHeight, 2), 0) / count;
    const heightStdDev = Math.sqrt(heightVariance);
    const heightCV = avgHeight > 0 ? (heightStdDev / avgHeight) * 100 : 0;

    const colSpanVariance = metrics.reduce((sum, m) => sum + Math.pow(m.colSpan - avgColSpan, 2), 0) / count;
    const colSpanStdDev = Math.sqrt(colSpanVariance);

    // Priority analysis
    const highPriorityCount = metrics.filter(m => m.priority <= 1).length;
    const highPriorityPct = (highPriorityCount / count) * 100;
    const priorities = new Set(metrics.map(m => m.priority));

    // Total width
    const totalPreferredWidth = metrics.reduce((sum, m) => sum + m.colSpan, 0);

    // Single column analysis
    const singleColCount = metrics.filter(m => m.colSpan === 1).length;
    const mostlySingleColumn = (singleColCount / count) > 0.7;

    this.analysis = {
      count,
      avgHeight,
      heightStdDev,
      heightCV,
      avgColSpan,
      colSpanStdDev,
      avgDensity,
      highPriorityPct,
      totalPreferredWidth,
      isUniform: heightCV < 20 && colSpanStdDev < 0.5,
      hasHighVariety: heightCV > 50 || colSpanStdDev > 1,
      mostlySingleColumn,
      hasMixedPriorities: priorities.size > 1,
    };

    return this.analysis;
  }

  /**
   * Recommends the best algorithm based on section analysis
   */
  recommend(): AlgorithmRecommendation {
    const analysis = this.analyze();
    const reasons: string[] = [];
    const alternatives: ExtendedPackingAlgorithm[] = [];
    let algorithm: ExtendedPackingAlgorithm = 'legacy';
    let confidence = 70;

    // Few sections - use simpler algorithm
    if (analysis.count <= 5) {
      algorithm = 'legacy';
      reasons.push('Few sections benefit from simpler FFDH algorithm');
      alternatives.push('row-first', 'skyline');
      confidence = 80;
    }
    // Many sections with high variety - use MaxRects
    else if (analysis.count > 10 && analysis.hasHighVariety) {
      algorithm = 'maxrects';
      reasons.push('High size variety benefits from MaxRects overlapping rectangles');
      alternatives.push('guillotine', 'skyline');
      confidence = 85;
    }
    // Uniform sections - use row-first for clean rows
    else if (analysis.isUniform) {
      algorithm = 'row-first';
      reasons.push('Uniform sizes pack well with row-first algorithm');
      alternatives.push('legacy', 'skyline');
      confidence = 90;
    }
    // Mostly single-column sections
    else if (analysis.mostlySingleColumn) {
      algorithm = 'skyline';
      reasons.push('Single-column sections fit well with skyline packing');
      alternatives.push('legacy', 'maxrects');
      confidence = 75;
    }
    // Mixed priorities - use priority-aware algorithm
    else if (analysis.hasMixedPriorities && analysis.highPriorityPct > 30) {
      algorithm = 'row-first';
      reasons.push('Mixed priorities benefit from row-first priority ordering');
      alternatives.push('legacy', 'skyline');
      confidence = 70;
    }
    // Moderate variety - use Guillotine
    else if (analysis.heightCV > 30) {
      algorithm = 'guillotine';
      reasons.push('Moderate height variety benefits from guillotine splits');
      alternatives.push('maxrects', 'skyline');
      confidence = 75;
    }
    // Default to legacy for backward compatibility
    else {
      algorithm = 'legacy';
      reasons.push('Default to proven FFDH algorithm');
      alternatives.push('row-first', 'skyline');
      confidence = 65;
    }

    return {
      algorithm,
      confidence,
      reasons,
      alternatives,
    };
  }

  /**
   * Runs all algorithms and returns the best result
   */
  compareAlgorithms(): AlgorithmComparisonResult {
    const startTime = performance.now();
    const results: UnifiedPackingResult[] = [];

    // Run each algorithm
    const algorithms: ExtendedPackingAlgorithm[] = [
      'legacy',
      'row-first',
      'skyline',
      'guillotine',
      'maxrects',
    ];

    for (const algo of algorithms) {
      try {
        const result = this.runAlgorithm(algo);
        if (result) {
          results.push(result);
        }
      } catch (e) {
        // Algorithm failed, skip it
        console.warn(`Algorithm ${algo} failed:`, e);
      }
    }

    // Find best result (highest utilization, then lowest height)
    results.sort((a, b) => {
      if (Math.abs(a.utilization - b.utilization) > 1) {
        return b.utilization - a.utilization;
      }
      return a.totalHeight - b.totalHeight;
    });

    const best = results[0] ?? this.createEmptyResult('legacy');
    const utilizations = results.map(r => r.utilization);
    const heights = results.map(r => r.totalHeight);

    return {
      best,
      all: results,
      metrics: {
        algorithmsCompared: results.length,
        totalTimeMs: performance.now() - startTime,
        bestAlgorithm: best.algorithm,
        utilizationSpread: Math.max(...utilizations) - Math.min(...utilizations),
        heightSpread: Math.max(...heights) - Math.min(...heights),
      },
    };
  }

  /**
   * Packs with the best algorithm (either recommended or compared)
   */
  packWithBestAlgorithm(): UnifiedPackingResult {
    if (this.config.compareAll) {
      return this.compareAlgorithms().best;
    }

    const recommendation = this.recommend();
    const result = this.runAlgorithm(recommendation.algorithm);
    return result ?? this.createEmptyResult(recommendation.algorithm);
  }

  /**
   * Runs a specific algorithm and returns unified result
   */
  private runAlgorithm(algorithm: ExtendedPackingAlgorithm): UnifiedPackingResult | null {
    const { columns, containerWidth, gap } = this.config;

    switch (algorithm) {
      case 'legacy': {
        const packed = binPack2D(this.sections, columns, {
          respectPriority: true,
          fillGaps: true,
          balanceColumns: true,
        });
        return this.convertBinPackResult(packed, algorithm);
      }

      case 'row-first': {
        const result = packSectionsIntoRows(this.sections, {
          totalColumns: columns,
          gap,
          prioritizeSpaceFilling: true,
          allowShrinking: true,
          allowGrowing: true,
        });
        return this.convertRowPackerResult(result, algorithm);
      }

      case 'skyline': {
        const result = packWithSkyline(this.sections, columns, containerWidth, {
          gap,
          sortByHeight: true,
          sortByPriority: true,
          useBestFit: true,
        });
        return this.convertSkylineResult(result, algorithm);
      }

      case 'guillotine': {
        const result = packWithGuillotine(this.sections, columns, containerWidth, {
          gap,
          sortByHeight: true,
          splitHeuristic: 'shorter-axis',
          selectionHeuristic: 'best-area-fit',
        });
        return this.convertGuillotineResult(result, algorithm);
      }

      case 'maxrects': {
        const result = packWithMaxRects(this.sections, columns, containerWidth, {
          gap,
          sortByHeight: true,
          heuristic: 'best-short-side',
        });
        return this.convertMaxRectsResult(result, algorithm);
      }

      case 'auto':
        return this.packWithBestAlgorithm();

      default:
        return null;
    }
  }

  /**
   * Converts bin-pack result to unified format
   */
  private convertBinPackResult(
    packed: SectionWithMetrics[],
    algorithm: ExtendedPackingAlgorithm
  ): UnifiedPackingResult {
    const placements = packed.map(p => ({
      section: p.section,
      x: p.column ?? 0,
      y: p.top ?? 0,
      width: p.colSpan,
      height: p.estimatedHeight,
    }));

    const totalHeight = Math.max(...placements.map(p => p.y + p.height), 0);
    const totalArea = this.config.columns * totalHeight;
    const usedArea = placements.reduce((sum, p) => sum + (p.width * p.height), 0);

    return {
      algorithm,
      totalHeight,
      utilization: totalArea > 0 ? (usedArea / totalArea) * 100 : 0,
      gapCount: 0,  // Would need more analysis
      placements,
    };
  }

  /**
   * Converts row-packer result to unified format
   */
  private convertRowPackerResult(
    result: RowPackingResult,
    algorithm: ExtendedPackingAlgorithm
  ): UnifiedPackingResult {
    const placements: UnifiedPackingResult['placements'] = [];
    
    for (const row of result.rows) {
      for (const section of row.sections) {
        placements.push({
          section: section.section,
          x: section.columnIndex,
          y: row.topOffset,
          width: section.finalWidth,
          height: section.estimatedHeight,
        });
      }
    }

    return {
      algorithm,
      totalHeight: result.totalHeight,
      utilization: result.utilizationPercent,
      gapCount: result.rowsWithGaps,
      placements,
    };
  }

  /**
   * Converts skyline result to unified format
   */
  private convertSkylineResult(
    result: SkylineResult,
    algorithm: ExtendedPackingAlgorithm
  ): UnifiedPackingResult {
    return {
      algorithm,
      totalHeight: result.totalHeight,
      utilization: result.utilization,
      gapCount: result.gapCount,
      placements: result.placements.map(p => ({
        section: p.section,
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
      })),
    };
  }

  /**
   * Converts guillotine result to unified format
   */
  private convertGuillotineResult(
    result: GuillotinePackingResult,
    algorithm: ExtendedPackingAlgorithm
  ): UnifiedPackingResult {
    return {
      algorithm,
      totalHeight: result.totalHeight,
      utilization: result.utilization,
      gapCount: result.freeRectCount,
      placements: result.placements.map(p => ({
        section: p.section,
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
      })),
    };
  }

  /**
   * Converts maxrects result to unified format
   */
  private convertMaxRectsResult(
    result: MaxRectsPackingResult,
    algorithm: ExtendedPackingAlgorithm
  ): UnifiedPackingResult {
    return {
      algorithm,
      totalHeight: result.totalHeight,
      utilization: result.utilization,
      gapCount: result.freeRectCount,
      placements: result.placements.map(p => ({
        section: p.section,
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
      })),
    };
  }

  /**
   * Creates an empty result for error cases
   */
  private createEmptyResult(algorithm: ExtendedPackingAlgorithm): UnifiedPackingResult {
    return {
      algorithm,
      totalHeight: 0,
      utilization: 100,
      gapCount: 0,
      placements: [],
    };
  }

  /**
   * Gets column span for a section
   */
  private getColSpan(section: CardSection): number {
    if (section.colSpan && section.colSpan > 0) {
      return Math.min(section.colSpan, this.config.columns);
    }
    if (section.preferredColumns) {
      return Math.min(section.preferredColumns, this.config.columns);
    }
    return 1;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Selects the best algorithm for given sections
 */
export function selectBestAlgorithm(
  sections: CardSection[],
  columns: number,
  containerWidth: number
): AlgorithmRecommendation {
  const selector = new AlgorithmSelector(sections, { columns, containerWidth });
  return selector.recommend();
}

/**
 * Packs sections using automatically selected best algorithm
 */
export function packWithBestAlgorithm(
  sections: CardSection[],
  columns: number,
  containerWidth: number,
  options?: {
    gap?: number;
    compareAll?: boolean;
  }
): UnifiedPackingResult {
  const selector = new AlgorithmSelector(sections, {
    columns,
    containerWidth,
    gap: options?.gap,
    compareAll: options?.compareAll,
  });
  return selector.packWithBestAlgorithm();
}

/**
 * Compares all algorithms and returns results
 */
export function comparePackingAlgorithms(
  sections: CardSection[],
  columns: number,
  containerWidth: number,
  gap?: number
): AlgorithmComparisonResult {
  const selector = new AlgorithmSelector(sections, {
    columns,
    containerWidth,
    gap,
  });
  return selector.compareAlgorithms();
}

/**
 * Analyzes sections and returns metrics
 */
export function analyzeSectionsForPacking(
  sections: CardSection[],
  columns: number
): SectionAnalysis {
  const selector = new AlgorithmSelector(sections, {
    columns,
    containerWidth: columns * 300,  // Approximate
  });
  return selector.analyze();
}

