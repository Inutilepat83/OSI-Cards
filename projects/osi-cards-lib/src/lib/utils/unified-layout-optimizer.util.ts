/**
 * Unified Layout Optimizer
 *
 * Consolidates multiple layout optimization strategies:
 * - Gap filling: Identifies and fills layout gaps
 * - Column span optimization: Optimizes section widths
 * - Local swap optimization: Swaps adjacent sections for better layout
 *
 * @module UnifiedLayoutOptimizer
 * @since 3.0.0
 */

import { CardSection } from '../models';

// ============================================================================
// BASE INTERFACES
// ============================================================================

/**
 * Base interface for sections that can be optimized
 * All specific optimizer interfaces extend this
 */
export interface OptimizableLayoutSection {
  /** Unique identifier */
  key: string;
  /** Current column span (1-4 typically) */
  colSpan: number;
  /** Top position in pixels */
  top: number;
  /** Left position (CSS value) */
  left?: string;
  /** Width (CSS value) */
  width?: string;
  /** Height in pixels */
  height?: number;
  /** Reference to original section data */
  section?: CardSection;
}

/**
 * Preferred column configuration per breakpoint
 */
export interface PreferredColumns {
  min?: number;
  ideal?: number;
  max?: number;
}

/**
 * Extended section with all optimization properties
 */
export interface FullyOptimizableSection extends OptimizableLayoutSection {
  preferredColumns: PreferredColumns;
  canSplit?: boolean;
  priority?: number;
}

// ============================================================================
// OPTIMIZATION STRATEGY TYPES
// ============================================================================

export type OptimizationStrategy = 'gap-fill' | 'column-span' | 'local-swap' | 'combined';

export interface OptimizationResult<T extends OptimizableLayoutSection> {
  sections: T[];
  metrics: OptimizationMetrics;
  appliedStrategies: OptimizationStrategy[];
}

export interface OptimizationMetrics {
  /** Layout height before optimization */
  initialHeight: number;
  /** Layout height after optimization */
  finalHeight: number;
  /** Height reduction percentage */
  heightReduction: number;
  /** Number of gaps filled */
  gapsFilled: number;
  /** Number of span changes */
  spanChanges: number;
  /** Number of swaps performed */
  swapsPerformed: number;
  /** Optimization duration in ms */
  duration: number;
}

// ============================================================================
// UNIFIED CONFIGURATION
// ============================================================================

export interface UnifiedLayoutOptimizerConfig {
  /** Maximum iterations for optimization loop */
  maxIterations: number;
  /** Minimum height improvement to continue (percentage) */
  minImprovementThreshold: number;
  /** Whether to enable gap filling */
  enableGapFilling: boolean;
  /** Whether to enable column span optimization */
  enableColumnSpanOptimization: boolean;
  /** Whether to enable local swap optimization */
  enableLocalSwapOptimization: boolean;
  /** Maximum number of columns in grid */
  maxColumns: number;
  /** Gap between grid items in pixels */
  gridGap: number;
  /** Whether to log optimization steps */
  debug: boolean;
}

export const DEFAULT_OPTIMIZER_CONFIG: UnifiedLayoutOptimizerConfig = {
  maxIterations: 10,
  minImprovementThreshold: 2, // 2% minimum improvement
  enableGapFilling: true,
  enableColumnSpanOptimization: true,
  enableLocalSwapOptimization: true,
  maxColumns: 4,
  gridGap: 16,
  debug: false,
};

// ============================================================================
// GAP DETECTION & FILLING
// ============================================================================

export interface LayoutGap {
  /** Column index where gap starts */
  column: number;
  /** Row index where gap starts */
  row: number;
  /** Gap width in columns */
  width: number;
  /** Gap height in pixels */
  height: number;
  /** Sections adjacent to this gap */
  adjacentSections: string[];
}

/**
 * Find gaps in the current layout
 */
export function findLayoutGaps<T extends OptimizableLayoutSection>(
  sections: T[],
  config: Partial<UnifiedLayoutOptimizerConfig> = {}
): LayoutGap[] {
  const opts = { ...DEFAULT_OPTIMIZER_CONFIG, ...config };
  const gaps: LayoutGap[] = [];

  if (sections.length === 0) return gaps;

  // Build a grid map
  const maxTop = Math.max(...sections.map((s) => s.top + (s.height || 100)));
  const rowHeight = opts.gridGap + 100; // Approximate row height
  const rows = Math.ceil(maxTop / rowHeight);

  // Create occupancy grid
  const grid: boolean[][] = Array(rows)
    .fill(null)
    .map(() => Array(opts.maxColumns).fill(false));

  // Mark occupied cells
  for (const section of sections) {
    const startRow = Math.floor(section.top / rowHeight);
    const startCol = parseColumnFromLeft(section.left || '0%', opts.maxColumns);

    for (let c = 0; c < section.colSpan; c++) {
      if (startCol + c < opts.maxColumns) {
        grid[startRow]?.[startCol + c] && (grid[startRow][startCol + c] = true);
      }
    }
  }

  // Find gaps (contiguous empty cells)
  for (let r = 0; r < rows; r++) {
    const row = grid[r];
    if (!row) continue;

    let gapStart = -1;
    for (let c = 0; c <= opts.maxColumns; c++) {
      const isEmpty = c < opts.maxColumns && !row[c];

      if (isEmpty && gapStart === -1) {
        gapStart = c;
      } else if (!isEmpty && gapStart !== -1) {
        gaps.push({
          column: gapStart,
          row: r,
          width: c - gapStart,
          height: rowHeight,
          adjacentSections: findAdjacentSections(sections, r, gapStart, c - gapStart, rowHeight),
        });
        gapStart = -1;
      }
    }
  }

  return gaps;
}

/**
 * Fill gaps by adjusting section spans or positions
 */
export function fillLayoutGaps<T extends FullyOptimizableSection>(
  sections: T[],
  gaps: LayoutGap[],
  config: Partial<UnifiedLayoutOptimizerConfig> = {}
): { sections: T[]; gapsFilled: number } {
  const opts = { ...DEFAULT_OPTIMIZER_CONFIG, ...config };
  let gapsFilled = 0;
  const result = [...sections];

  for (const gap of gaps) {
    // Find sections that could expand to fill this gap
    const expandable = result.filter((s) => {
      const sCol = parseColumnFromLeft(s.left || '0%', opts.maxColumns);
      const sRow = Math.floor(s.top / (opts.gridGap + 100));

      // Section is adjacent and can expand
      return (
        sRow === gap.row &&
        (sCol + s.colSpan === gap.column || sCol === gap.column + gap.width) &&
        s.colSpan < (s.preferredColumns?.max || opts.maxColumns)
      );
    });

    if (expandable.length > 0) {
      // Expand the first expandable section
      const toExpand = expandable[0];
      if (toExpand) {
        const idx = result.indexOf(toExpand);
        if (idx !== -1) {
          result[idx] = {
            ...toExpand,
            colSpan: Math.min(
              toExpand.colSpan + gap.width,
              toExpand.preferredColumns?.max || opts.maxColumns
            ),
          } as T;
          gapsFilled++;
        }
      }
    }
  }

  return { sections: result, gapsFilled };
}

// ============================================================================
// COLUMN SPAN OPTIMIZATION
// ============================================================================

/**
 * Optimize column spans to minimize layout height
 */
export function optimizeColumnSpans<T extends FullyOptimizableSection>(
  sections: T[],
  config: Partial<UnifiedLayoutOptimizerConfig> = {}
): { sections: T[]; spanChanges: number } {
  const opts = { ...DEFAULT_OPTIMIZER_CONFIG, ...config };
  let spanChanges = 0;
  const result = [...sections];

  // Sort by priority or position
  const sorted = [...result].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  for (const section of sorted) {
    const idx = result.findIndex((s) => s.key === section.key);
    if (idx === -1) continue;

    const current = result[idx];
    if (!current) continue;

    const preferred = current.preferredColumns;
    if (!preferred) continue;

    // Try to use ideal span if possible
    const idealSpan = preferred.ideal || current.colSpan;

    if (
      idealSpan !== current.colSpan &&
      idealSpan >= (preferred.min || 1) &&
      idealSpan <= (preferred.max || opts.maxColumns)
    ) {
      result[idx] = { ...current, colSpan: idealSpan } as T;
      spanChanges++;
    }
  }

  return { sections: result, spanChanges };
}

// ============================================================================
// LOCAL SWAP OPTIMIZATION
// ============================================================================

/**
 * Swap adjacent sections to reduce layout height
 */
export function localSwapOptimization<T extends OptimizableLayoutSection>(
  sections: T[],
  config: Partial<UnifiedLayoutOptimizerConfig> = {}
): { sections: T[]; swapsPerformed: number } {
  const opts = { ...DEFAULT_OPTIMIZER_CONFIG, ...config };
  let swapsPerformed = 0;
  const result = [...sections];

  // Simple bubble-sort style swapping based on height benefit
  for (let i = 0; i < result.length - 1; i++) {
    for (let j = i + 1; j < result.length; j++) {
      const a = result[i];
      const b = result[j];

      if (!a || !b) continue;

      // Only swap if on same row and swap would reduce height
      if (Math.abs(a.top - b.top) < 50) {
        const currentHeight = Math.max(a.height || 100, b.height || 100);

        // Calculate hypothetical height after swap
        const swappedHeight = Math.max(
          (a.height || 100) * (b.colSpan / a.colSpan),
          (b.height || 100) * (a.colSpan / b.colSpan)
        );

        if (swappedHeight < currentHeight * 0.9) {
          // Swap positions
          const tempLeft = a.left;
          const tempTop = a.top;
          result[i] = { ...a, left: b.left, top: b.top } as T;
          result[j] = { ...b, left: tempLeft, top: tempTop } as T;
          swapsPerformed++;
        }
      }
    }
  }

  return { sections: result, swapsPerformed };
}

// ============================================================================
// UNIFIED OPTIMIZER
// ============================================================================

/**
 * Run all enabled optimization strategies
 */
export function optimizeLayout<T extends FullyOptimizableSection>(
  sections: T[],
  config: Partial<UnifiedLayoutOptimizerConfig> = {}
): OptimizationResult<T> {
  const opts = { ...DEFAULT_OPTIMIZER_CONFIG, ...config };
  const startTime = performance.now();
  const appliedStrategies: OptimizationStrategy[] = [];

  let currentSections = [...sections];
  let totalGapsFilled = 0;
  let totalSpanChanges = 0;
  let totalSwaps = 0;

  const initialHeight = calculateLayoutHeight(currentSections);

  for (let iteration = 0; iteration < opts.maxIterations; iteration++) {
    const prevHeight = calculateLayoutHeight(currentSections);

    // 1. Gap filling
    if (opts.enableGapFilling) {
      const gaps = findLayoutGaps(currentSections, opts);
      const { sections: filled, gapsFilled } = fillLayoutGaps(currentSections, gaps, opts);
      currentSections = filled;
      totalGapsFilled += gapsFilled;
      if (gapsFilled > 0 && !appliedStrategies.includes('gap-fill')) {
        appliedStrategies.push('gap-fill');
      }
    }

    // 2. Column span optimization
    if (opts.enableColumnSpanOptimization) {
      const { sections: optimized, spanChanges } = optimizeColumnSpans(currentSections, opts);
      currentSections = optimized;
      totalSpanChanges += spanChanges;
      if (spanChanges > 0 && !appliedStrategies.includes('column-span')) {
        appliedStrategies.push('column-span');
      }
    }

    // 3. Local swap optimization
    if (opts.enableLocalSwapOptimization) {
      const { sections: swapped, swapsPerformed } = localSwapOptimization(currentSections, opts);
      currentSections = swapped;
      totalSwaps += swapsPerformed;
      if (swapsPerformed > 0 && !appliedStrategies.includes('local-swap')) {
        appliedStrategies.push('local-swap');
      }
    }

    // Check if improvement is below threshold
    const newHeight = calculateLayoutHeight(currentSections);
    const improvement = ((prevHeight - newHeight) / prevHeight) * 100;

    if (opts.debug) {
      console.log(
        `[UnifiedOptimizer] Iteration ${iteration + 1}: ${prevHeight}px -> ${newHeight}px (${improvement.toFixed(2)}% improvement)`
      );
    }

    if (improvement < opts.minImprovementThreshold) {
      break;
    }
  }

  const finalHeight = calculateLayoutHeight(currentSections);
  const duration = performance.now() - startTime;

  return {
    sections: currentSections,
    metrics: {
      initialHeight,
      finalHeight,
      heightReduction: ((initialHeight - finalHeight) / initialHeight) * 100,
      gapsFilled: totalGapsFilled,
      spanChanges: totalSpanChanges,
      swapsPerformed: totalSwaps,
      duration,
    },
    appliedStrategies,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function parseColumnFromLeft(left: string, maxColumns: number): number {
  if (left.endsWith('%')) {
    const percent = parseFloat(left);
    return Math.round((percent / 100) * maxColumns);
  }
  return 0;
}

function calculateLayoutHeight<T extends OptimizableLayoutSection>(sections: T[]): number {
  if (sections.length === 0) return 0;
  return Math.max(...sections.map((s) => s.top + (s.height || 100)));
}

function findAdjacentSections<T extends OptimizableLayoutSection>(
  sections: T[],
  row: number,
  gapColumn: number,
  gapWidth: number,
  rowHeight: number
): string[] {
  return sections
    .filter((s) => {
      const sRow = Math.floor(s.top / rowHeight);
      const sCol = parseColumnFromLeft(s.left || '0%', 4);

      return (
        Math.abs(sRow - row) <= 1 &&
        (sCol + s.colSpan === gapColumn || sCol === gapColumn + gapWidth)
      );
    })
    .map((s) => s.key);
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick optimize with default settings
 */
export function quickOptimize<T extends FullyOptimizableSection>(sections: T[]): T[] {
  return optimizeLayout(sections).sections;
}

/**
 * Optimize with gap filling only
 */
export function optimizeGapsOnly<T extends FullyOptimizableSection>(sections: T[]): T[] {
  return optimizeLayout(sections, {
    enableGapFilling: true,
    enableColumnSpanOptimization: false,
    enableLocalSwapOptimization: false,
  }).sections;
}

/**
 * Get optimization metrics without modifying sections
 */
export function analyzeLayout<T extends FullyOptimizableSection>(
  sections: T[]
): { gaps: LayoutGap[]; estimatedImprovement: number } {
  const gaps = findLayoutGaps(sections);
  const currentHeight = calculateLayoutHeight(sections);

  // Estimate potential improvement
  const gapArea = gaps.reduce((sum, g) => sum + g.width * g.height, 0);
  const totalArea = currentHeight * 4; // Approximate
  const estimatedImprovement = (gapArea / totalArea) * 100;

  return { gaps, estimatedImprovement };
}
