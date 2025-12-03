/**
 * Dynamic Column Optimizer Utility
 *
 * Intelligently determines optimal column count based on:
 * - Container width
 * - Section content characteristics
 * - Layout density goals
 * - Performance constraints
 *
 * Prevents unnecessary recalculations and provides smooth transitions.
 */

import { CardSection } from '../models/card.model';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Column optimization strategy
 */
export type ColumnStrategy = 'content-aware' | 'fixed-breakpoints' | 'dynamic' | 'performance';

/**
 * Configuration for column optimization
 */
export interface ColumnOptimizerConfig {
  /** Minimum column width in pixels */
  minColumnWidth?: number;
  /** Maximum columns allowed */
  maxColumns?: number;
  /** Optimization strategy */
  strategy?: ColumnStrategy;
  /** Breakpoints for responsive behavior */
  breakpoints?: {
    mobile: number;
    tablet: number;
    desktop: number;
    wide: number;
  };
  /** Threshold for recalculation (width change in pixels) */
  recalculationThreshold?: number;
  /** Enable content-based adjustments */
  enableContentAnalysis?: boolean;
}

/**
 * Result of column optimization
 */
export interface ColumnOptimizationResult {
  /** Optimal column count */
  columns: number;
  /** Strategy used */
  strategy: ColumnStrategy;
  /** Reason for this column count */
  reason: string;
  /** Whether this is a change from previous */
  isChange: boolean;
  /** Confidence score (0-100) */
  confidence: number;
}

/**
 * Section content characteristics for analysis
 */
interface ContentCharacteristics {
  hasWideContent: boolean;
  hasNarrowContent: boolean;
  averagePreferredSpan: number;
  maxPreferredSpan: number;
  contentDensity: number;
}

const DEFAULT_CONFIG: Required<ColumnOptimizerConfig> = {
  minColumnWidth: 260,
  maxColumns: 4,
  strategy: 'content-aware',
  breakpoints: {
    mobile: 640,
    tablet: 1024,
    desktop: 1440,
    wide: 1920,
  },
  recalculationThreshold: 50,
  enableContentAnalysis: true,
};

// ============================================================================
// DYNAMIC COLUMN OPTIMIZER
// ============================================================================

/**
 * Optimizes column count dynamically based on content and container
 */
export class DynamicColumnOptimizer {
  private readonly config: Required<ColumnOptimizerConfig>;
  private lastWidth: number = 0;
  private lastColumns: number = 0;
  private lastSectionCount: number = 0;
  private calculationCount: number = 0;

  constructor(config: ColumnOptimizerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Calculate optimal column count
   */
  calculateOptimalColumns(
    containerWidth: number,
    sections: CardSection[] = []
  ): ColumnOptimizationResult {
    this.calculationCount++;

    // Check if recalculation is needed
    if (!this.needsRecalculation(containerWidth, sections.length)) {
      return {
        columns: this.lastColumns,
        strategy: this.config.strategy,
        reason: 'Using cached value (no significant change)',
        isChange: false,
        confidence: 100,
      };
    }

    // Calculate based on strategy
    let result: ColumnOptimizationResult;

    switch (this.config.strategy) {
      case 'content-aware':
        result = this.calculateContentAwareColumns(containerWidth, sections);
        break;

      case 'fixed-breakpoints':
        result = this.calculateBreakpointColumns(containerWidth);
        break;

      case 'dynamic':
        result = this.calculateDynamicColumns(containerWidth, sections);
        break;

      case 'performance':
        result = this.calculatePerformanceOptimizedColumns(containerWidth, sections);
        break;

      default:
        result = this.calculateBreakpointColumns(containerWidth);
    }

    // Update state
    const isChange = result.columns !== this.lastColumns;
    this.lastWidth = containerWidth;
    this.lastColumns = result.columns;
    this.lastSectionCount = sections.length;

    return {
      ...result,
      isChange,
    };
  }

  /**
   * Check if recalculation is needed
   */
  private needsRecalculation(containerWidth: number, sectionCount: number): boolean {
    // First calculation
    if (this.lastColumns === 0) {
      return true;
    }

    // Section count changed significantly
    if (Math.abs(sectionCount - this.lastSectionCount) > 5) {
      return true;
    }

    // Width changed beyond threshold
    const widthDiff = Math.abs(containerWidth - this.lastWidth);
    if (widthDiff < this.config.recalculationThreshold) {
      return false;
    }

    // Check if width change crosses a breakpoint
    const oldBreakpoint = this.getBreakpoint(this.lastWidth);
    const newBreakpoint = this.getBreakpoint(containerWidth);

    return oldBreakpoint !== newBreakpoint;
  }

  /**
   * Get breakpoint for width
   */
  private getBreakpoint(width: number): string {
    const { breakpoints } = this.config;
    if (width < breakpoints.mobile) return 'mobile';
    if (width < breakpoints.tablet) return 'tablet';
    if (width < breakpoints.desktop) return 'desktop';
    return 'wide';
  }

  // ==========================================================================
  // STRATEGY IMPLEMENTATIONS
  // ==========================================================================

  /**
   * Content-aware column calculation
   * Analyzes section content to determine optimal columns
   */
  private calculateContentAwareColumns(
    containerWidth: number,
    sections: CardSection[]
  ): ColumnOptimizationResult {
    // Start with breakpoint-based calculation
    const baseResult = this.calculateBreakpointColumns(containerWidth);
    let columns = baseResult.columns;
    let reason = baseResult.reason;
    let confidence = 80;

    if (!this.config.enableContentAnalysis || sections.length === 0) {
      return { ...baseResult, confidence };
    }

    // Analyze content characteristics
    const characteristics = this.analyzeContentCharacteristics(sections);

    // Adjust based on content
    if (characteristics.hasWideContent && columns > 2) {
      // Wide content needs more space
      const suggestedColumns = Math.max(2, Math.ceil(columns * 0.75));
      if (suggestedColumns < columns) {
        columns = suggestedColumns;
        reason += '; Reduced for wide content';
        confidence = 90;
      }
    }

    if (characteristics.hasNarrowContent && columns < this.config.maxColumns) {
      // Narrow content can use more columns
      const suggestedColumns = Math.min(
        this.config.maxColumns,
        Math.ceil(columns * 1.25)
      );
      if (suggestedColumns > columns) {
        columns = suggestedColumns;
        reason += '; Increased for narrow content';
        confidence = 85;
      }
    }

    // Consider average preferred span
    if (characteristics.averagePreferredSpan > 1.5 && columns > 2) {
      columns = Math.max(2, Math.floor(columns * 0.8));
      reason += '; Adjusted for preferred spans';
      confidence = 88;
    }

    return {
      columns,
      strategy: 'content-aware',
      reason,
      isChange: false,
      confidence,
    };
  }

  /**
   * Fixed breakpoint-based calculation
   */
  private calculateBreakpointColumns(containerWidth: number): ColumnOptimizationResult {
    const breakpoint = this.getBreakpoint(containerWidth);

    // Calculate maximum possible columns
    const maxPossible = Math.floor(
      (containerWidth + 12) / (this.config.minColumnWidth + 12)
    );

    let columns: number;
    let reason: string;

    switch (breakpoint) {
      case 'mobile':
        columns = 1;
        reason = 'Mobile breakpoint';
        break;
      case 'tablet':
        columns = Math.min(2, maxPossible);
        reason = 'Tablet breakpoint';
        break;
      case 'desktop':
        columns = Math.min(this.config.maxColumns, maxPossible);
        reason = 'Desktop breakpoint';
        break;
      case 'wide':
        columns = Math.min(this.config.maxColumns, maxPossible);
        reason = 'Wide breakpoint';
        break;
      default:
        columns = Math.min(this.config.maxColumns, maxPossible);
        reason = 'Default calculation';
    }

    return {
      columns: Math.max(1, columns),
      strategy: 'fixed-breakpoints',
      reason,
      isChange: false,
      confidence: 95,
    };
  }

  /**
   * Dynamic column calculation with smooth scaling
   */
  private calculateDynamicColumns(
    containerWidth: number,
    sections: CardSection[]
  ): ColumnOptimizationResult {
    // Calculate based on available width
    const idealColumns = Math.floor(
      (containerWidth + 12) / (this.config.minColumnWidth + 12)
    );

    // Apply constraints
    let columns = Math.max(1, Math.min(this.config.maxColumns, idealColumns));

    // Adjust for section count
    if (sections.length > 0) {
      const sectionsPerColumn = sections.length / columns;

      if (sectionsPerColumn < 2 && columns > 1) {
        // Too few sections per column, reduce columns
        columns = Math.max(1, Math.ceil(sections.length / 2));
      } else if (sectionsPerColumn > 10 && columns < this.config.maxColumns) {
        // Too many sections per column, increase if possible
        columns = Math.min(this.config.maxColumns, columns + 1);
      }
    }

    return {
      columns,
      strategy: 'dynamic',
      reason: `Dynamic calculation: ${idealColumns} ideal, adjusted to ${columns}`,
      isChange: false,
      confidence: 85,
    };
  }

  /**
   * Performance-optimized calculation
   * Minimizes layout complexity for large datasets
   */
  private calculatePerformanceOptimizedColumns(
    containerWidth: number,
    sections: CardSection[]
  ): ColumnOptimizationResult {
    const breakpointResult = this.calculateBreakpointColumns(containerWidth);
    let columns = breakpointResult.columns;
    let reason = breakpointResult.reason;

    // For large datasets, prefer fewer columns to reduce complexity
    if (sections.length > 50) {
      columns = Math.min(columns, 3);
      reason += '; Limited for performance (50+ sections)';
    } else if (sections.length > 100) {
      columns = Math.min(columns, 2);
      reason += '; Limited for performance (100+ sections)';
    }

    return {
      columns,
      strategy: 'performance',
      reason,
      isChange: false,
      confidence: 90,
    };
  }

  // ==========================================================================
  // CONTENT ANALYSIS
  // ==========================================================================

  /**
   * Analyze section content characteristics
   */
  private analyzeContentCharacteristics(sections: CardSection[]): ContentCharacteristics {
    if (sections.length === 0) {
      return {
        hasWideContent: false,
        hasNarrowContent: false,
        averagePreferredSpan: 1,
        maxPreferredSpan: 1,
        contentDensity: 0.5,
      };
    }

    let totalPreferredSpan = 0;
    let maxPreferredSpan = 1;
    let wideCount = 0;
    let narrowCount = 0;
    let totalContentSize = 0;

    for (const section of sections) {
      const preferredSpan = section.colSpan || 1;
      totalPreferredSpan += preferredSpan;
      maxPreferredSpan = Math.max(maxPreferredSpan, preferredSpan);

      if (preferredSpan >= 3) {
        wideCount++;
      } else if (preferredSpan === 1) {
        narrowCount++;
      }

      // Estimate content size
      const itemCount = section.items?.length || 0;
      const contentLength = (section.content as any)?.length || 0;
      totalContentSize += itemCount * 50 + contentLength;
    }

    const averagePreferredSpan = totalPreferredSpan / sections.length;
    const contentDensity = Math.min(1, totalContentSize / (sections.length * 500));

    return {
      hasWideContent: wideCount > sections.length * 0.2,
      hasNarrowContent: narrowCount > sections.length * 0.5,
      averagePreferredSpan,
      maxPreferredSpan,
      contentDensity,
    };
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  /**
   * Get current state for debugging
   */
  getState() {
    return {
      lastWidth: this.lastWidth,
      lastColumns: this.lastColumns,
      lastSectionCount: this.lastSectionCount,
      calculationCount: this.calculationCount,
    };
  }

  /**
   * Reset optimizer state
   */
  reset(): void {
    this.lastWidth = 0;
    this.lastColumns = 0;
    this.lastSectionCount = 0;
    this.calculationCount = 0;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Quick helper to calculate optimal columns
 */
export function calculateOptimalColumns(
  containerWidth: number,
  sections: CardSection[] = [],
  config: ColumnOptimizerConfig = {}
): number {
  const optimizer = new DynamicColumnOptimizer(config);
  const result = optimizer.calculateOptimalColumns(containerWidth, sections);
  return result.columns;
}

/**
 * Check if column count should change
 */
export function shouldRecalculateColumns(
  oldWidth: number,
  newWidth: number,
  threshold: number = 50
): boolean {
  const widthDiff = Math.abs(newWidth - oldWidth);
  return widthDiff >= threshold;
}

