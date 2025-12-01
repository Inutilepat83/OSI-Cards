/**
 * Grid Layout Engine
 *
 * A smart, reusable layout engine that handles all grid calculations.
 * Consolidates layout logic from multiple utilities into one maintainable class.
 *
 * Key principles:
 * - Pure functions for calculations (easy to test)
 * - No DOM dependencies (framework agnostic)
 * - Built-in memoization for performance
 * - Observable state changes
 *
 * @example
 * ```typescript
 * const engine = new GridLayoutEngine({ maxColumns: 4, gap: 16 });
 *
 * // Calculate layout
 * const layout = engine.calculate(sections, containerWidth);
 *
 * // Subscribe to changes
 * engine.layout$.subscribe(layout => updateUI(layout));
 *
 * // Optimize layout
 * engine.optimize();
 * ```
 */

import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

// ============================================================================
// TYPES
// ============================================================================

/** Section input - minimal required data */
export interface GridSection {
  id: string;
  title?: string;
  type?: string;
  priority?: number;
  /** Preferred column span */
  preferredSpan?: number | { min?: number; ideal?: number; max?: number };
}

/** Positioned section output */
export interface PositionedGridSection {
  id: string;
  section: GridSection;
  /** Column span (1 to maxColumns) */
  colSpan: number;
  /** CSS left expression */
  left: string;
  /** CSS width expression */
  width: string;
  /** Top position in pixels */
  top: number;
  /** Row index */
  row: number;
  /** Column index */
  column: number;
}

/** Layout result */
export interface GridLayout {
  sections: PositionedGridSection[];
  columns: number;
  containerWidth: number;
  totalHeight: number;
  gaps: GridGap[];
  metrics: LayoutMetrics;
}

/** Gap in layout */
export interface GridGap {
  column: number;
  row: number;
  width: number;
  height: number;
}

/** Layout metrics */
export interface LayoutMetrics {
  sectionCount: number;
  rowCount: number;
  gapCount: number;
  fillRate: number; // 0-1, how well space is utilized
  computeTime: number;
}

/** Engine configuration */
export interface GridLayoutConfig {
  /** Maximum columns in grid */
  maxColumns: number;
  /** Gap between items in pixels */
  gap: number;
  /** Minimum column width in pixels */
  minColumnWidth: number;
  /** Whether to optimize layout */
  optimize: boolean;
  /** Default section height estimate */
  defaultHeight: number;
}

const DEFAULT_CONFIG: GridLayoutConfig = {
  maxColumns: 4,
  gap: 16,
  minColumnWidth: 280,
  optimize: true,
  defaultHeight: 200,
};

// ============================================================================
// GRID LAYOUT ENGINE
// ============================================================================

export class GridLayoutEngine {
  private readonly config: GridLayoutConfig;
  private readonly layoutSubject = new BehaviorSubject<GridLayout | null>(null);
  private cache = new Map<string, GridLayout>();
  private heights = new Map<string, number>();

  /** Current layout observable */
  readonly layout$: Observable<GridLayout | null> = this.layoutSubject.asObservable();

  /** Positioned sections observable */
  readonly sections$: Observable<PositionedGridSection[]> = this.layout$.pipe(
    map(l => l?.sections ?? []),
    distinctUntilChanged()
  );

  constructor(config: Partial<GridLayoutConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Calculate layout for given sections and container width
   */
  calculate(sections: GridSection[], containerWidth: number): GridLayout {
    const startTime = performance.now();

    // Check cache
    const cacheKey = this.getCacheKey(sections, containerWidth);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Calculate columns
    const columns = this.calculateColumns(containerWidth);

    // Position sections
    const positioned = this.positionSections(sections, columns);

    // Find gaps
    const gaps = this.findGaps(positioned, columns);

    // Optimize if enabled
    const optimized = this.config.optimize
      ? this.optimizeLayout(positioned, gaps, columns)
      : positioned;

    // Calculate metrics
    const totalHeight = this.calculateTotalHeight(optimized);
    const metrics = this.calculateMetrics(optimized, gaps, columns, startTime);

    const layout: GridLayout = {
      sections: optimized,
      columns,
      containerWidth,
      totalHeight,
      gaps,
      metrics,
    };

    // Cache result
    this.cache.set(cacheKey, layout);

    // Emit
    this.layoutSubject.next(layout);

    return layout;
  }

  /**
   * Update height for a section (for accurate layout after render)
   */
  setHeight(sectionId: string, height: number): void {
    this.heights.set(sectionId, height);
    // Invalidate cache entries containing this section
    this.invalidateCache();
  }

  /**
   * Update heights for multiple sections at once
   */
  setHeights(heights: Map<string, number> | Record<string, number>): void {
    const entries = heights instanceof Map ? heights.entries() : Object.entries(heights);
    for (const [id, height] of entries) {
      this.heights.set(id, height);
    }
    this.invalidateCache();
  }

  /**
   * Get current layout
   */
  getLayout(): GridLayout | null {
    return this.layoutSubject.value;
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Update configuration
   */
  configure(config: Partial<GridLayoutConfig>): void {
    Object.assign(this.config, config);
    this.invalidateCache();
  }

  // ==========================================================================
  // CORE CALCULATIONS
  // ==========================================================================

  /**
   * Calculate number of columns for container width
   */
  calculateColumns(containerWidth: number): number {
    if (containerWidth <= 0) return 1;

    const maxPossible = Math.floor(
      (containerWidth + this.config.gap) / (this.config.minColumnWidth + this.config.gap)
    );

    return Math.max(1, Math.min(maxPossible, this.config.maxColumns));
  }

  /**
   * Position sections in grid
   */
  private positionSections(sections: GridSection[], columns: number): PositionedGridSection[] {
    const result: PositionedGridSection[] = [];
    const columnHeights = new Array(columns).fill(0);

    for (const section of sections) {
      const colSpan = this.resolveColSpan(section, columns);
      const { column, top } = this.findBestPosition(columnHeights, colSpan, columns);

      const positioned: PositionedGridSection = {
        id: section.id,
        section,
        colSpan,
        left: this.generateLeft(column, columns),
        width: this.generateWidth(colSpan, columns),
        top,
        row: this.estimateRow(top),
        column,
      };

      result.push(positioned);

      // Update column heights
      const height = this.heights.get(section.id) ?? this.config.defaultHeight;
      for (let c = column; c < column + colSpan; c++) {
        columnHeights[c] = top + height + this.config.gap;
      }
    }

    return result;
  }

  /**
   * Find best position for a section
   */
  private findBestPosition(
    columnHeights: number[],
    colSpan: number,
    columns: number
  ): { column: number; top: number } {
    let bestColumn = 0;
    let bestTop = Infinity;

    for (let c = 0; c <= columns - colSpan; c++) {
      // Find max height in span
      let maxHeight = 0;
      for (let i = 0; i < colSpan; i++) {
        maxHeight = Math.max(maxHeight, columnHeights[c + i] ?? 0);
      }

      if (maxHeight < bestTop) {
        bestTop = maxHeight;
        bestColumn = c;
      }
    }

    return { column: bestColumn, top: bestTop === Infinity ? 0 : bestTop };
  }

  /**
   * Resolve column span for a section
   */
  private resolveColSpan(section: GridSection, columns: number): number {
    const pref = section.preferredSpan;

    if (!pref) return 1;

    if (typeof pref === 'number') {
      return Math.min(Math.max(1, pref), columns);
    }

    const ideal = pref.ideal ?? 1;
    const min = pref.min ?? 1;
    const max = pref.max ?? columns;

    return Math.min(Math.max(min, ideal), max, columns);
  }

  // ==========================================================================
  // OPTIMIZATION
  // ==========================================================================

  /**
   * Optimize layout by filling gaps
   */
  private optimizeLayout(
    sections: PositionedGridSection[],
    gaps: GridGap[],
    columns: number
  ): PositionedGridSection[] {
    if (gaps.length === 0 || sections.length < 2) {
      return sections;
    }

    const result = [...sections];
    let improved = false;

    // Try to fill gaps with movable sections
    for (const gap of gaps) {
      const movable = result
        .filter(s => s.colSpan === 1 && s.top > gap.row * this.config.defaultHeight)
        .sort((a, b) => b.top - a.top);

      for (const section of movable) {
        const height = this.heights.get(section.id) ?? this.config.defaultHeight;

        if (height <= gap.height + 20) {
          // Move section to gap
          const idx = result.findIndex(s => s.id === section.id);
          if (idx !== -1) {
            result[idx] = {
              ...section,
              column: gap.column,
              left: this.generateLeft(gap.column, columns),
              top: gap.row * this.config.defaultHeight,
              row: gap.row,
            };
            improved = true;
            break;
          }
        }
      }
    }

    return improved ? result : sections;
  }

  /**
   * Find gaps in layout
   */
  private findGaps(sections: PositionedGridSection[], columns: number): GridGap[] {
    const gaps: GridGap[] = [];
    if (sections.length === 0) return gaps;

    // Build occupancy grid
    const maxTop = Math.max(...sections.map(s => s.top + (this.heights.get(s.id) ?? this.config.defaultHeight)));
    const rowHeight = this.config.defaultHeight + this.config.gap;
    const rows = Math.ceil(maxTop / rowHeight);

    const grid: boolean[][] = Array.from({ length: rows }, () =>
      new Array(columns).fill(false)
    );

    // Mark occupied cells
    for (const section of sections) {
      const startRow = Math.floor(section.top / rowHeight);
      const height = this.heights.get(section.id) ?? this.config.defaultHeight;
      const endRow = Math.ceil((section.top + height) / rowHeight);

      for (let r = startRow; r < Math.min(endRow, rows); r++) {
        for (let c = section.column; c < section.column + section.colSpan; c++) {
          const row = grid[r];
          if (row) row[c] = true;
        }
      }
    }

    // Find gaps
    for (let c = 0; c < columns; c++) {
      let gapStart = -1;

      for (let r = 0; r <= rows; r++) {
        const isOccupied = r >= rows || grid[r]?.[c];

        if (!isOccupied && gapStart === -1) {
          gapStart = r;
        } else if (isOccupied && gapStart !== -1) {
          const gapHeight = (r - gapStart) * rowHeight;
          if (gapHeight >= this.config.defaultHeight * 0.5) {
            gaps.push({
              column: c,
              row: gapStart,
              width: 1,
              height: gapHeight,
            });
          }
          gapStart = -1;
        }
      }
    }

    return gaps;
  }

  // ==========================================================================
  // CSS GENERATION
  // ==========================================================================

  /**
   * Generate CSS left expression
   */
  private generateLeft(column: number, columns: number): string {
    if (column === 0) return '0px';

    const totalGaps = columns - 1;
    const gapTotal = `${totalGaps * this.config.gap}px`;

    return `calc((calc((100% - ${gapTotal}) / ${columns}) + ${this.config.gap}px) * ${column})`;
  }

  /**
   * Generate CSS width expression
   */
  private generateWidth(colSpan: number, columns: number): string {
    if (colSpan === columns) return '100%';

    const totalGaps = columns - 1;
    const gapTotal = `${totalGaps * this.config.gap}px`;
    const spanGaps = `${(colSpan - 1) * this.config.gap}px`;

    return `calc((100% - ${gapTotal}) / ${columns} * ${colSpan} + ${spanGaps})`;
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private getCacheKey(sections: GridSection[], containerWidth: number): string {
    const sectionKey = sections.map(s => `${s.id}:${s.preferredSpan || 1}`).join('|');
    const heightKey = sections.map(s => this.heights.get(s.id) ?? 0).join(',');
    return `${containerWidth}-${this.calculateColumns(containerWidth)}-${sectionKey}-${heightKey}`;
  }

  private invalidateCache(): void {
    this.cache.clear();
  }

  private calculateTotalHeight(sections: PositionedGridSection[]): number {
    if (sections.length === 0) return 0;

    return Math.max(
      ...sections.map(s => s.top + (this.heights.get(s.id) ?? this.config.defaultHeight))
    );
  }

  private estimateRow(top: number): number {
    return Math.floor(top / (this.config.defaultHeight + this.config.gap));
  }

  private calculateMetrics(
    sections: PositionedGridSection[],
    gaps: GridGap[],
    columns: number,
    startTime: number
  ): LayoutMetrics {
    const totalHeight = this.calculateTotalHeight(sections);
    const totalArea = totalHeight * columns;
    const usedArea = sections.reduce((sum, s) => {
      const height = this.heights.get(s.id) ?? this.config.defaultHeight;
      return sum + (s.colSpan * height);
    }, 0);

    return {
      sectionCount: sections.length,
      rowCount: Math.ceil(totalHeight / (this.config.defaultHeight + this.config.gap)),
      gapCount: gaps.length,
      fillRate: totalArea > 0 ? usedArea / totalArea : 0,
      computeTime: performance.now() - startTime,
    };
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/** Create a new GridLayoutEngine instance */
export function createGridLayoutEngine(config?: Partial<GridLayoutConfig>): GridLayoutEngine {
  return new GridLayoutEngine(config);
}

