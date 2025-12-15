/**
 * Layout Metrics Utility
 *
 * Performance monitoring and metrics collection for layout calculations.
 * Provides insights into layout performance, gap counts, utilization, and timing.
 */

import { ColumnPackingResult } from './column-packer.util';

/**
 * Layout metrics snapshot
 */
export interface LayoutMetrics {
  /** Timestamp of calculation */
  timestamp: number;
  /** Number of sections */
  sectionCount: number;
  /** Number of columns */
  columns: number;
  /** Total height in pixels */
  totalHeight: number;
  /** Space utilization percentage (0-100) */
  utilization: number;
  /** Number of gaps in layout */
  gapCount: number;
  /** Total gap area in pixels */
  gapArea?: number;
  /** Height variance across columns */
  heightVariance?: number;
  /** Layout calculation time in milliseconds */
  calculationTime: number;
  /** Algorithm used */
  algorithm: string;
}

/**
 * Performance metrics aggregator
 */
export class LayoutMetricsCollector {
  private metrics: LayoutMetrics[] = [];
  private readonly MAX_METRICS = 100; // Keep last 100 calculations

  /**
   * Record layout calculation metrics
   */
  record(result: ColumnPackingResult, calculationTime: number): void {
    const metric: LayoutMetrics = {
      timestamp: Date.now(),
      sectionCount: result.positionedSections.length,
      columns: result.columns,
      totalHeight: result.totalHeight,
      utilization: result.utilization,
      gapCount: result.gapCount,
      gapArea: result.gapArea,
      heightVariance: result.heightVariance,
      calculationTime,
      algorithm: result.algorithm,
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }
  }

  /**
   * Get summary statistics
   */
  getSummary(): {
    totalCalculations: number;
    avgCalculationTime: number;
    avgUtilization: number;
    avgGapCount: number;
    maxCalculationTime: number;
    minUtilization: number;
  } {
    if (this.metrics.length === 0) {
      return {
        totalCalculations: 0,
        avgCalculationTime: 0,
        avgUtilization: 0,
        avgGapCount: 0,
        maxCalculationTime: 0,
        minUtilization: 100,
      };
    }

    const total = this.metrics.length;
    const totalTime = this.metrics.reduce((sum, m) => sum + m.calculationTime, 0);
    const totalUtilization = this.metrics.reduce((sum, m) => sum + m.utilization, 0);
    const totalGaps = this.metrics.reduce((sum, m) => sum + m.gapCount, 0);
    const maxTime = Math.max(...this.metrics.map((m) => m.calculationTime));
    const minUtil = Math.min(...this.metrics.map((m) => m.utilization));

    return {
      totalCalculations: total,
      avgCalculationTime: totalTime / total,
      avgUtilization: totalUtilization / total,
      avgGapCount: totalGaps / total,
      maxCalculationTime: maxTime,
      minUtilization: minUtil,
    };
  }

  /**
   * Get recent metrics (last N calculations)
   */
  getRecent(count: number = 10): LayoutMetrics[] {
    return this.metrics.slice(-count);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Get metrics for a specific algorithm
   */
  getByAlgorithm(algorithm: string): LayoutMetrics[] {
    return this.metrics.filter((m) => m.algorithm === algorithm);
  }

  /**
   * Export metrics as JSON
   */
  export(): string {
    return JSON.stringify(
      {
        summary: this.getSummary(),
        recent: this.getRecent(20),
        all: this.metrics,
      },
      null,
      2
    );
  }
}

/**
 * Global metrics collector instance
 */
export const layoutMetricsCollector = new LayoutMetricsCollector();

/**
 * Performance timing helper
 */
export function measureLayoutPerformance<T>(
  fn: () => T,
  resultCallback?: (result: ColumnPackingResult, time: number) => void
): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const time = end - start;

  // If result is a ColumnPackingResult, record metrics
  if (result && typeof result === 'object' && 'positionedSections' in result) {
    layoutMetricsCollector.record(result as ColumnPackingResult, time);

    if (resultCallback) {
      resultCallback(result as ColumnPackingResult, time);
    }
  }

  return result;
}

/**
 * Debug panel helper (for development)
 */
export function getLayoutMetricsDebugInfo(): string {
  const summary = layoutMetricsCollector.getSummary();
  const recent = layoutMetricsCollector.getRecent(5);

  return `
Layout Metrics Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Calculations: ${summary.totalCalculations}
Avg Calculation Time: ${summary.avgCalculationTime.toFixed(2)}ms
Avg Utilization: ${summary.avgUtilization.toFixed(2)}%
Avg Gap Count: ${summary.avgGapCount.toFixed(1)}
Max Calculation Time: ${summary.maxCalculationTime.toFixed(2)}ms
Min Utilization: ${summary.minUtilization.toFixed(2)}%

Recent Calculations:
${recent
  .map(
    (m, i) =>
      `  ${i + 1}. ${m.algorithm} | ${m.sectionCount} sections | ${m.calculationTime.toFixed(2)}ms | ${m.utilization.toFixed(1)}% util | ${m.gapCount} gaps`
  )
  .join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim();
}




