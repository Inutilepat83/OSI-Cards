/**
 * Layout Optimization Service
 *
 * Provides injectable layout optimization capabilities for components.
 * Wraps the unified layout optimizer with Angular DI integration.
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class GridComponent {
 *   private layoutOptimizer = inject(LayoutOptimizationService);
 *
 *   optimizeGrid(sections: Section[]) {
 *     const result = this.layoutOptimizer.optimize(sections);
 *     console.log(`Reduced height by ${result.metrics.heightReduction}%`);
 *     return result.sections;
 *   }
 * }
 * ```
 */

import { Injectable, inject } from '@angular/core';
import { CardSection } from '../models';
import {
  OptimizableLayoutSection,
  FullyOptimizableSection,
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
import { FeatureFlagsService } from './feature-flags.service';

// ============================================================================
// POSITIONED SECTION INTERFACE
// ============================================================================

/**
 * Section with position information for grid layout
 */
export interface PositionedSection extends OptimizableLayoutSection {
  /** Reference to original CardSection */
  section: CardSection;
  /** Preferred column configuration */
  preferredColumns: number | PreferredColumns;
  /** Whether this is a newly added section */
  isNew?: boolean;
}

/**
 * Extended positioned section for full optimization
 * Requires preferredColumns to be the full PreferredColumns object
 */
export interface OptimizablePositionedSection extends Omit<PositionedSection, 'preferredColumns'> {
  /** Full preferred column configuration */
  preferredColumns: PreferredColumns;
  /** Priority for optimization (higher = more important) */
  priority?: number;
  /** Whether section can be split */
  canSplit?: boolean;
}

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

export interface LayoutOptimizationConfig extends Partial<UnifiedLayoutOptimizerConfig> {
  /** Grid gap in pixels */
  gridGap?: number;
  /** Minimum gap height to consider for filling */
  minGapHeight?: number;
  /** Grid resolution for gap detection (pixels) */
  gridResolution?: number;
}

const DEFAULT_SERVICE_CONFIG: LayoutOptimizationConfig = {
  ...DEFAULT_OPTIMIZER_CONFIG,
  gridGap: 16,
  minGapHeight: 100,
  gridResolution: 10,
};

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: 'root',
})
export class LayoutOptimizationService {
  private readonly featureFlags = inject(FeatureFlagsService);

  /** Current configuration */
  private config: LayoutOptimizationConfig = { ...DEFAULT_SERVICE_CONFIG };

  /** Performance metrics from last optimization */
  private lastMetrics: OptimizationMetrics | null = null;

  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================

  /**
   * Update service configuration
   */
  configure(config: Partial<LayoutOptimizationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): LayoutOptimizationConfig {
    return { ...this.config };
  }

  /**
   * Check if layout optimization is enabled
   */
  isEnabled(): boolean {
    return this.featureFlags.isEnabled('layoutOptimization');
  }

  // ==========================================================================
  // OPTIMIZATION METHODS
  // ==========================================================================

  /**
   * Optimize a set of positioned sections
   */
  optimize<T extends OptimizablePositionedSection>(
    sections: T[],
    config?: Partial<LayoutOptimizationConfig>
  ): OptimizationResult<T> {
    if (!this.isEnabled() || sections.length < 2) {
      return {
        sections,
        metrics: this.createEmptyMetrics(sections),
        appliedStrategies: [],
      };
    }

    const opts = { ...this.config, ...config };
    const result = optimizeLayout(sections, opts);

    this.lastMetrics = result.metrics;

    if (opts.debug) {
      this.logOptimizationResult(result);
    }

    return result;
  }

  /**
   * Find gaps in the current layout
   */
  findGaps<T extends OptimizableLayoutSection>(
    sections: T[],
    config?: Partial<LayoutOptimizationConfig>
  ): LayoutGap[] {
    const opts = { ...this.config, ...config };
    return findLayoutGaps(sections, opts);
  }

  /**
   * Fill gaps by expanding adjacent sections
   */
  fillGaps<T extends OptimizablePositionedSection>(
    sections: T[],
    gaps: LayoutGap[],
    config?: Partial<LayoutOptimizationConfig>
  ): { sections: T[]; gapsFilled: number } {
    const opts = { ...this.config, ...config };
    return fillLayoutGaps(sections, gaps, opts);
  }

  /**
   * Optimize column spans
   */
  optimizeSpans<T extends OptimizablePositionedSection>(
    sections: T[],
    config?: Partial<LayoutOptimizationConfig>
  ): { sections: T[]; spanChanges: number } {
    const opts = { ...this.config, ...config };
    return optimizeColumnSpans(sections, opts);
  }

  /**
   * Perform local swap optimization
   */
  localSwap<T extends OptimizableLayoutSection>(
    sections: T[],
    config?: Partial<LayoutOptimizationConfig>
  ): { sections: T[]; swapsPerformed: number } {
    const opts = { ...this.config, ...config };
    return localSwapOptimization(sections, opts);
  }

  /**
   * Analyze layout without modifying
   */
  analyze<T extends OptimizablePositionedSection>(
    sections: T[]
  ): { gaps: LayoutGap[]; estimatedImprovement: number } {
    return analyzeLayout(sections);
  }

  // ==========================================================================
  // CONVERSION HELPERS
  // ==========================================================================

  /**
   * Convert PositionedSection to OptimizablePositionedSection
   */
  toOptimizable(section: PositionedSection, height?: number): OptimizablePositionedSection {
    const preferredColumns = this.normalizePreferredColumns(section.preferredColumns);

    return {
      ...section,
      preferredColumns,
      height: height ?? 200,
    };
  }

  /**
   * Convert array of PositionedSection to OptimizablePositionedSection
   */
  toOptimizableArray(
    sections: PositionedSection[],
    heights?: Map<string, number>
  ): OptimizablePositionedSection[] {
    return sections.map((s) => this.toOptimizable(s, heights?.get(s.key)));
  }

  /**
   * Normalize preferred columns to full object form
   */
  normalizePreferredColumns(preferred: number | PreferredColumns): PreferredColumns {
    if (typeof preferred === 'number') {
      return { min: 1, ideal: preferred, max: this.config.maxColumns || 4 };
    }
    return preferred;
  }

  // ==========================================================================
  // METRICS & DEBUGGING
  // ==========================================================================

  /**
   * Get metrics from last optimization
   */
  getLastMetrics(): OptimizationMetrics | null {
    return this.lastMetrics;
  }

  /**
   * Calculate layout height
   */
  calculateHeight<T extends OptimizableLayoutSection>(sections: T[]): number {
    if (sections.length === 0) return 0;
    return Math.max(...sections.map((s) => s.top + (s.height || 100)));
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private createEmptyMetrics<T extends OptimizableLayoutSection>(
    sections: T[]
  ): OptimizationMetrics {
    const height = this.calculateHeight(sections);
    return {
      initialHeight: height,
      finalHeight: height,
      heightReduction: 0,
      gapsFilled: 0,
      spanChanges: 0,
      swapsPerformed: 0,
      duration: 0,
    };
  }

  private logOptimizationResult<T extends OptimizableLayoutSection>(
    result: OptimizationResult<T>
  ): void {
    console.group('[LayoutOptimization] Result');
    console.log('Applied strategies:', result.appliedStrategies);
    console.log('Height reduction:', `${result.metrics.heightReduction.toFixed(2)}%`);
    console.log('Gaps filled:', result.metrics.gapsFilled);
    console.log('Span changes:', result.metrics.spanChanges);
    console.log('Swaps performed:', result.metrics.swapsPerformed);
    console.log('Duration:', `${result.metrics.duration.toFixed(2)}ms`);
    console.groupEnd();
  }
}
