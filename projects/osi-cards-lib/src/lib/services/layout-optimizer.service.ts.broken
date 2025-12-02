/**
 * Consolidated Layout Optimizer Service
 *
 * Merges functionality from:
 * - layout-optimization.service.ts (optimization algorithms)
 * - layout-analytics.service.ts (metrics tracking)
 *
 * Provides comprehensive layout optimization and analytics tracking.
 *
 * @example
 * ```typescript
 * import { LayoutOptimizerService } from 'osi-cards-lib';
 *
 * const optimizer = inject(LayoutOptimizerService);
 *
 * // Optimize layout
 * const result = optimizer.optimize(sections, config);
 *
 * // Get analytics
 * const stats = optimizer.getAnalyticsSummary();
 * console.log(`Avg utilization: ${stats.avgUtilization}%`);
 * ```
 */

import { Injectable, inject } from '@angular/core';
import { CardSection } from '../models';
import {
  OptimizableLayoutSection,
  PreferredColumns,
  OptimizationResult,
  OptimizationMetrics,
  UnifiedLayoutOptimizerConfig,
  DEFAULT_OPTIMIZER_CONFIG,
  LayoutGap,
  findLayoutGaps,
  fillLayoutGaps,
  optimizeColumnSpans,
  localSwapOptimization,
  optimizeLayout,
  analyzeLayout,
} from '../utils/unified-layout-optimizer.util';
import { LayoutMetrics } from '../core/packing-algorithm.interface';
import { FeatureFlagsService } from './feature-flags.service';

// ============================================================================
// TYPES
// ============================================================================

export interface PositionedSection extends OptimizableLayoutSection {
  section: CardSection;
  preferredColumns: number | PreferredColumns;
  isNew?: boolean;
}

export interface LayoutOptimizationConfig extends Partial<UnifiedLayoutOptimizerConfig> {
  gridGap?: number;
  minGapHeight?: number;
  gridResolution?: number;
}

export interface LayoutAnalyticsSummary {
  totalLayouts: number;
  avgUtilization: number;
  minUtilization: number;
  maxUtilization: number;
  avgGapCount: number;
  totalReflows: number;
  avgReflowsPerLayout: number;
  avgPackingTimeMs: number;
  algorithmUsage: Record<string, number>;
  utilizationDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  errorCount: number;
  firstTrackedAt: number;
  lastTrackedAt: number;
}

interface LayoutEvent {
  timestamp: number;
  metrics: LayoutMetrics;
  eventType: 'initial' | 'reflow' | 'resize' | 'streaming';
  sessionId: string;
  error?: string;
}

// ============================================================================
// CONSOLIDATED SERVICE
// ============================================================================

@Injectable({
  providedIn: 'root'
})
export class LayoutOptimizerService {
  private readonly featureFlags = inject(FeatureFlagsService);

  // ========== Configuration ==========
  private config: LayoutOptimizationConfig = {
    ...DEFAULT_OPTIMIZER_CONFIG,
    gridGap: 16,
    minGapHeight: 100,
    gridResolution: 10,
  };

  // ========== Analytics Tracking ==========
  private events: LayoutEvent[] = [];
  private sessionId = this.generateSessionId();
  private readonly maxEventsInMemory = 100;
  private algorithmCounter: Record<string, number> = {};

  // ========== Statistics ==========
  private totalUtilization = 0;
  private minUtilization = 100;
  private maxUtilization = 0;
  private totalGaps = 0;
  private totalReflows = 0;
  private totalPackingTime = 0;
  private layoutCount = 0;
  private errorCount = 0;
  private firstTrackedAt = 0;
  private lastTrackedAt = 0;

  // ============================================================================
  // OPTIMIZATION API
  // ============================================================================

  /**
   * Configure the optimizer
   */
  configure(config: LayoutOptimizationConfig): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Optimize section layout
   */
  optimize(
    sections: PositionedSection[],
    sectionHeights: Map<string, number>,
    columns: number,
    containerWidth: number
  ): OptimizationResult {
    const startTime = performance.now();

    // Convert to optimizable format
    const optimizableSections = sections.map(s => this.toOptimizable(s));

    // Run optimization
    const result = optimizeLayout(
      optimizableSections,
      columns,
      { ...this.config, columns, containerWidth }
    );

    const packingTime = performance.now() - startTime;

    // Track metrics
    this.trackLayoutMetrics({
      utilization: result.metrics.utilizationPercent,
      gapCount: result.metrics.gapCount,
      packingTimeMs: packingTime,
      algorithm: 'unified',
      eventType: 'initial'
    });

    return result;
  }

  /**
   * Find gaps in layout
   */
  findGaps(
    sections: PositionedSection[],
    sectionHeights: Map<string, number>,
    columns: number
  ): LayoutGap[] {
    const optimizable = sections.map(s => this.toOptimizable(s));
    return findLayoutGaps(optimizable, columns, this.config.gridResolution ?? 10);
  }

  /**
   * Fill gaps with smaller sections
   */
  fillGaps(
    sections: PositionedSection[],
    gaps: LayoutGap[],
    sectionHeights: Map<string, number>,
    columns: number
  ): PositionedSection[] {
    const optimizable = sections.map(s => this.toOptimizable(s));
    const filled = fillLayoutGaps(optimizable, gaps, columns, {
      minGapHeight: this.config.minGapHeight ?? 100
    });

    return filled.map(s => this.toPositioned(s, sections));
  }

  /**
   * Optimize column spans
   */
  optimizeSpans(
    sections: PositionedSection[],
    sectionHeights: Map<string, number>,
    columns: number
  ): PositionedSection[] {
    const optimizable = sections.map(s => this.toOptimizable(s));
    const optimized = optimizeColumnSpans(optimizable, sectionHeights, columns);
    return optimized.map(s => this.toPositioned(s, sections));
  }

  /**
   * Perform local swap optimization
   */
  localSwapOptimize(
    sections: PositionedSection[],
    sectionHeights: Map<string, number>,
    columns: number
  ): PositionedSection[] {
    const optimizable = sections.map(s => this.toOptimizable(s));
    const result = localSwapOptimization(optimizable, sectionHeights);
    return result.sections.map(s => this.toPositioned(s, sections));
  }

  /**
   * Analyze layout quality
   */
  analyze(
    sections: PositionedSection[],
    sectionHeights: Map<string, number>,
    columns: number,
    containerWidth: number,
    containerHeight: number
  ): OptimizationMetrics {
    const optimizable = sections.map(s => this.toOptimizable(s));
    const analysis = analyzeLayout(optimizable);
    return {
      ...analysis,
      initialHeight: containerHeight,
      finalHeight: containerHeight,
      heightReduction: 0,
      gapsFilled: 0,
      swapsPerformed: 0,
      // layoutDensity: 0,  // Not in OptimizationMetrics type
      averageGapSize: analysis.gaps.length > 0 ? analysis.estimatedImprovement / analysis.gaps.length : 0
    };
  }

  // ============================================================================
  // ANALYTICS API
  // ============================================================================

  /**
   * Track layout metrics
   */
  trackLayoutMetrics(params: {
    utilization: number;
    gapCount: number;
    packingTimeMs: number;
    algorithm: string;
    eventType: 'initial' | 'reflow' | 'resize' | 'streaming';
    error?: string;
  }): void {
    const { utilization, gapCount, packingTimeMs, algorithm, eventType, error } = params;

    // Update counters
    this.layoutCount++;
    this.totalUtilization += utilization;
    this.minUtilization = Math.min(this.minUtilization, utilization);
    this.maxUtilization = Math.max(this.maxUtilization, utilization);
    this.totalGaps += gapCount;
    this.totalPackingTime += packingTimeMs;

    if (eventType === 'reflow') {
      this.totalReflows++;
    }

    if (error) {
      this.errorCount++;
    }

    // Track algorithm usage
    this.algorithmCounter[algorithm] = (this.algorithmCounter[algorithm] || 0) + 1;

    // Update timestamps
    const now = Date.now();
    if (this.firstTrackedAt === 0) {
      this.firstTrackedAt = now;
    }
    this.lastTrackedAt = now;

    // Store event (with memory limit)
    const event: LayoutEvent = {
      timestamp: now,
      metrics: {
        utilizationPercent: utilization,
        gapCount,
        // wastedSpace: 0,  // Not in LayoutMetrics type
        // density: 0,  // Not in LayoutMetrics type
        // isOptimal: utilization >= 95  // Not in LayoutMetrics type
      },
      eventType,
      sessionId: this.sessionId,
      error
    };

    this.events.push(event);

    // Limit memory usage
    if (this.events.length > this.maxEventsInMemory) {
      this.events.shift();
    }
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary(): LayoutAnalyticsSummary {
    const avgUtil = this.layoutCount > 0 ? this.totalUtilization / this.layoutCount : 0;
    const avgGaps = this.layoutCount > 0 ? this.totalGaps / this.layoutCount : 0;
    const avgReflows = this.layoutCount > 0 ? this.totalReflows / this.layoutCount : 0;
    const avgPackingTime = this.layoutCount > 0 ? this.totalPackingTime / this.layoutCount : 0;

    // Calculate utilization distribution
    const distribution = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0
    };

    this.events.forEach(e => {
      const util = e.metrics.utilizationPercent;
      if (util >= 95) distribution.excellent++;
      else if (util >= 85) distribution.good++;
      else if (util >= 75) distribution.fair++;
      else distribution.poor++;
    });

    return {
      totalLayouts: this.layoutCount,
      avgUtilization: avgUtil,
      minUtilization: this.minUtilization,
      maxUtilization: this.maxUtilization,
      avgGapCount: avgGaps,
      totalReflows: this.totalReflows,
      avgReflowsPerLayout: avgReflows,
      avgPackingTimeMs: avgPackingTime,
      algorithmUsage: { ...this.algorithmCounter },
      utilizationDistribution: distribution,
      errorCount: this.errorCount,
      firstTrackedAt: this.firstTrackedAt,
      lastTrackedAt: this.lastTrackedAt
    };
  }

  /**
   * Reset analytics
   */
  resetAnalytics(): void {
    this.events = [];
    this.sessionId = this.generateSessionId();
    this.algorithmCounter = {};
    this.totalUtilization = 0;
    this.minUtilization = 100;
    this.maxUtilization = 0;
    this.totalGaps = 0;
    this.totalReflows = 0;
    this.totalPackingTime = 0;
    this.layoutCount = 0;
    this.errorCount = 0;
    this.firstTrackedAt = 0;
    this.lastTrackedAt = 0;
  }

  /**
   * Export analytics data
   */
  exportAnalytics(): string {
    return JSON.stringify({
      summary: this.getAnalyticsSummary(),
      events: this.events
    }, null, 2);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private toOptimizable(section: PositionedSection): OptimizableLayoutSection {
    return {
      key: section.key,
      colSpan: section.colSpan,
      left: section.left,
      top: section.top,
      width: section.width
    };
  }

  private toPositioned(
    optimized: OptimizableLayoutSection,
    original: PositionedSection[]
  ): PositionedSection {
    const orig = original.find(s => s.key === optimized.key);
    return {
      ...orig!,
      ...optimized
    };
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

