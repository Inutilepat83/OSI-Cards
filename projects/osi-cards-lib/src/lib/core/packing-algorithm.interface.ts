/**
 * Packing Algorithm Interface (Point 97)
 *
 * Defines a unified interface for all packing algorithms.
 * This allows easy addition of new algorithms and consistent usage.
 *
 * @example
 * ```typescript
 * import { PackingAlgorithm, LayoutResult } from './';
 *
 * class MyCustomPacker implements PackingAlgorithm {
 *   readonly name = 'custom';
 *   pack(sections, config): LayoutResult {
 *     // Custom packing logic
 *   }
 * }
 *
 * const packer = getPackingAlgorithm('row-first');
 * const result = packer.pack(sections, config);
 * ```
 */

import { CardSection } from '../models';

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Configuration for packing algorithms
 */
export interface PackingConfig {
  /** Number of columns in the grid */
  columns: number;
  /** Gap between sections in pixels */
  gap: number;
  /** Container width in pixels */
  containerWidth: number;
  /** Whether sections can shrink */
  allowShrinking?: boolean;
  /** Whether sections can grow */
  allowGrowing?: boolean;
  /** Maximum optimization passes */
  maxOptimizationPasses?: number;
  /** Additional algorithm-specific options */
  options?: Record<string, unknown>;
}

/**
 * Positioned section in the layout
 */
export interface PositionedSection {
  /** Original section data */
  section: CardSection;
  /** Unique key for tracking */
  key: string;
  /** Column span */
  colSpan: number;
  /** Starting column (0-based) */
  column: number;
  /** Top position in pixels */
  top: number;
  /** CSS left expression */
  left: string;
  /** CSS width expression */
  width: string;
  /** Estimated height in pixels */
  height: number;
  /** Whether section was shrunk from preferred width */
  wasShrunk?: boolean;
  /** Whether section was grown from preferred width */
  wasGrown?: boolean;
}

/**
 * Gap information in the layout
 */
export interface LayoutGap {
  /** Column index */
  column: number;
  /** Top position in pixels */
  top: number;
  /** Height of gap in pixels */
  height: number;
  /** Width in columns */
  width: number;
}

/**
 * Result of a packing operation
 */
export interface LayoutResult {
  /** Positioned sections */
  sections: PositionedSection[];
  /** Total height of the layout */
  totalHeight: number;
  /** Space utilization percentage (0-100) */
  utilizationPercent: number;
  /** Number of gaps in the layout */
  gapCount: number;
  /** Detailed gap information */
  gaps: LayoutGap[];
  /** Column heights after packing */
  columnHeights: number[];
  /** Number of sections that were shrunk */
  shrunkCount: number;
  /** Number of sections that were grown */
  grownCount: number;
  /** Time taken for packing in milliseconds */
  packingTimeMs: number;
  /** Algorithm-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Layout metrics for analytics
 */
export interface LayoutMetrics {
  /** Algorithm used */
  algorithm: string;
  /** Number of sections */
  sectionCount: number;
  /** Number of columns */
  columns: number;
  /** Container width */
  containerWidth: number;
  /** Total height */
  totalHeight: number;
  /** Utilization percentage */
  utilizationPercent: number;
  /** Gap count */
  gapCount: number;
  /** Balance score (0-1) */
  balanceScore: number;
  /** Packing time in ms */
  packingTimeMs: number;
  /** Optimization time in ms */
  optimizationTimeMs?: number;
  /** Number of reflows */
  reflowCount?: number;
}

// ============================================================================
// PACKING ALGORITHM INTERFACE
// ============================================================================

/**
 * Interface that all packing algorithms must implement.
 * Provides a consistent API for section placement.
 */
export interface IPackingAlgorithm {
  /** Algorithm identifier */
  readonly name: string;

  /**
   * Pack sections into a layout
   * @param sections - Sections to pack
   * @param config - Packing configuration
   * @returns Layout result with positioned sections
   */
  pack(sections: CardSection[], config: PackingConfig): LayoutResult;

  /**
   * Check if this algorithm supports incremental updates
   */
  supportsIncremental(): boolean;

  /**
   * Add a single section to an existing layout (if supported)
   * @param section - Section to add
   * @param currentLayout - Current layout result
   * @param config - Packing configuration
   * @returns Updated layout result
   */
  addSection?(
    section: CardSection,
    currentLayout: LayoutResult,
    config: PackingConfig
  ): LayoutResult;

  /**
   * Optimize an existing layout
   * @param layout - Current layout to optimize
   * @param config - Packing configuration
   * @returns Optimized layout result
   */
  optimize?(layout: LayoutResult, config: PackingConfig): LayoutResult;

  /**
   * Reset internal state (if any)
   */
  reset?(): void;
}

// ============================================================================
// ABSTRACT BASE CLASS
// ============================================================================

/**
 * Abstract base class for packing algorithms.
 * Provides common functionality and enforces the interface.
 */
export abstract class BasePackingAlgorithm implements IPackingAlgorithm {
  abstract readonly name: string;

  abstract pack(sections: CardSection[], config: PackingConfig): LayoutResult;

  supportsIncremental(): boolean {
    return false;
  }

  /**
   * Calculate utilization percentage
   */
  protected calculateUtilization(
    sections: PositionedSection[],
    columns: number,
    totalHeight: number
  ): number {
    if (totalHeight === 0 || columns === 0) {
      return 100;
    }

    const totalArea = columns * totalHeight;
    const usedArea = sections.reduce((sum, s) => sum + s.colSpan * s.height, 0);

    return Math.min(100, (usedArea / totalArea) * 100);
  }

  /**
   * Calculate column balance score (0-1)
   */
  protected calculateBalanceScore(columnHeights: number[]): number {
    if (columnHeights.length === 0) return 1;

    const avg = columnHeights.reduce((a, b) => a + b, 0) / columnHeights.length;
    const variance =
      columnHeights.reduce((sum, h) => sum + Math.pow(h - avg, 2), 0) / columnHeights.length;

    const maxVariance = Math.pow(avg, 2);
    return maxVariance > 0 ? Math.max(0, 1 - variance / maxVariance) : 1;
  }

  /**
   * Generate CSS left expression
   */
  protected generateLeft(columns: number, column: number, gap: number): string {
    if (column === 0) return '0px';
    return `calc((100% - ${(columns - 1) * gap}px) / ${columns} * ${column} + ${column * gap}px)`;
  }

  /**
   * Generate CSS width expression
   */
  protected generateWidth(columns: number, colSpan: number, gap: number): string {
    if (colSpan === columns) return '100%';
    return `calc((100% - ${(columns - 1) * gap}px) / ${columns} * ${colSpan} + ${(colSpan - 1) * gap}px)`;
  }

  /**
   * Generate section key
   */
  protected generateKey(section: CardSection, index: number): string {
    if (section.id) return section.id;
    return `${section.type}-${section.title}-${index}`;
  }
}

// ============================================================================
// ALGORITHM REGISTRY
// ============================================================================

/**
 * Registry of available packing algorithms
 */
const algorithmRegistry = new Map<string, () => IPackingAlgorithm>();

/**
 * Register a packing algorithm
 */
export function registerPackingAlgorithm(name: string, factory: () => IPackingAlgorithm): void {
  algorithmRegistry.set(name, factory);
}

/**
 * Get a packing algorithm by name
 */
export function getPackingAlgorithm(name: string): IPackingAlgorithm | null {
  const factory = algorithmRegistry.get(name);
  return factory ? factory() : null;
}

/**
 * Get all registered algorithm names
 */
export function getAvailableAlgorithms(): string[] {
  return Array.from(algorithmRegistry.keys());
}

// ============================================================================
// DEFAULT ALGORITHM REGISTRATIONS
// ============================================================================

// Note: Actual algorithm implementations should register themselves
// when imported. This ensures lazy loading.

/**
 * Initialize default algorithm registrations
 * Call this during app initialization
 */
export async function initializeDefaultAlgorithms(): Promise<void> {
  // Dynamic imports to avoid circular dependencies
  const [rowPacker, smartGrid, skyline] = await Promise.all([
    import('../utils/row-packer.util'),
    import('../utils/smart-grid.util'),
    import('../utils/skyline-algorithm.util'),
  ]);

  // Register row-first algorithm
  registerPackingAlgorithm('row-first', () => ({
    name: 'row-first',
    supportsIncremental: () => false,
    pack: (sections, config) => {
      const start = performance.now();
      const result = rowPacker.packSectionsIntoRows(sections, {
        totalColumns: config.columns,
        gap: config.gap,
        prioritizeSpaceFilling: true,
        allowShrinking: config.allowShrinking ?? true,
        allowGrowing: config.allowGrowing ?? true,
        maxOptimizationPasses: config.maxOptimizationPasses ?? 5,
      });

      // Convert to standard LayoutResult format
      const positioned = rowPacker.packingResultToPositions(result, {
        totalColumns: config.columns,
        gap: config.gap,
      });

      return {
        sections: positioned.map((p, i) => ({
          section: sections[i]!,
          key: sections[i]?.id || `section-${i}`,
          colSpan: p.colSpan,
          column: p.column,
          top: p.top,
          left: p.left,
          width: p.width,
          height: p.height,
          wasShrunk: p.wasShrunk,
          wasGrown: p.wasGrown,
        })),
        totalHeight: result.totalHeight,
        utilizationPercent: result.utilizationPercent,
        gapCount: result.rowsWithGaps,
        gaps: [],
        columnHeights: [],
        shrunkCount: result.shrunkCount,
        grownCount: result.grownCount,
        packingTimeMs: performance.now() - start,
      };
    },
  }));

  // Register legacy algorithm
  registerPackingAlgorithm('legacy', () => ({
    name: 'legacy',
    supportsIncremental: () => false,
    pack: (sections, config) => {
      const start = performance.now();
      const result = smartGrid.binPack2D(sections, config.columns, {
        respectPriority: true,
        fillGaps: true,
        balanceColumns: true,
      });

      const columnHeights = new Array(config.columns).fill(0);
      const positioned: PositionedSection[] = result.map((s, i) => {
        const col = s.column ?? 0;
        const top = s.top ?? 0;

        for (let c = col; c < col + s.colSpan; c++) {
          columnHeights[c] = Math.max(columnHeights[c], top + s.estimatedHeight + config.gap);
        }

        return {
          section: s.section,
          key: s.section.id || `section-${i}`,
          colSpan: s.colSpan,
          column: col,
          top,
          left:
            col === 0
              ? '0px'
              : `calc((100% - ${(config.columns - 1) * config.gap}px) / ${config.columns} * ${col} + ${col * config.gap}px)`,
          width:
            s.colSpan === config.columns
              ? '100%'
              : `calc((100% - ${(config.columns - 1) * config.gap}px) / ${config.columns} * ${s.colSpan} + ${(s.colSpan - 1) * config.gap}px)`,
          height: s.estimatedHeight,
        };
      });

      const totalHeight = Math.max(...columnHeights, 0);
      const totalArea = config.columns * totalHeight;
      const usedArea = positioned.reduce((sum, s) => sum + s.colSpan * s.height, 0);

      return {
        sections: positioned,
        totalHeight,
        utilizationPercent: totalArea > 0 ? (usedArea / totalArea) * 100 : 100,
        gapCount: 0,
        gaps: [],
        columnHeights,
        shrunkCount: 0,
        grownCount: 0,
        packingTimeMs: performance.now() - start,
      };
    },
  }));

  // Register skyline algorithm
  registerPackingAlgorithm('skyline', () => ({
    name: 'skyline',
    supportsIncremental: () => true,
    pack: (sections, config) => {
      const start = performance.now();
      const packer = new skyline.SkylinePacker({
        columns: config.columns,
        gap: config.gap,
        containerWidth: config.containerWidth,
      });

      const result = packer.pack(sections);

      return {
        sections: result.placements.map((p) => ({
          section: p.section,
          key: p.section.id || `section-${result.placements.indexOf(p)}`,
          colSpan: p.width,
          column: p.x,
          top: p.y,
          left:
            p.x === 0
              ? '0px'
              : `calc((100% - ${(config.columns - 1) * config.gap}px) / ${config.columns} * ${p.x} + ${p.x * config.gap}px)`,
          width:
            p.width === config.columns
              ? '100%'
              : `calc((100% - ${(config.columns - 1) * config.gap}px) / ${config.columns} * ${p.width} + ${(p.width - 1) * config.gap}px)`,
          height: p.height,
        })),
        totalHeight: result.totalHeight,
        utilizationPercent: result.utilization,
        gapCount: result.gapCount,
        gaps: [],
        columnHeights: result.finalSkyline.map((s) => s.y),
        shrunkCount: 0,
        grownCount: 0,
        packingTimeMs: performance.now() - start,
      };
    },
  }));
}
