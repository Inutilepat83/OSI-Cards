/**
 * Layout Calculation Service
 *
 * Centralized service for all layout calculations.
 * Extracted from MasonryGridComponent to improve testability and maintainability.
 *
 * Responsibilities:
 * - Calculate optimal column count based on container width
 * - Calculate section positions using selected strategy
 * - Estimate section heights
 * - Handle responsive breakpoints
 * - Manage layout caching
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class MasonryGridComponent {
 *   private layoutService = inject(LayoutCalculationService);
 *
 *   calculateLayout() {
 *     const result = this.layoutService.calculateLayout(
 *       this.sections,
 *       { containerWidth: 1200, gap: 16, columns: 3 }
 *     );
 *   }
 * }
 * ```
 */

import { inject, Injectable } from '@angular/core';
import { CardSection } from '../models/card.model';
import { Memoize } from '../utils/advanced-memoization.util';
import {
  calculateColumnWidth,
  getPreferredColumns,
  GRID_GAP,
  MAX_COLUMNS,
  MIN_COLUMN_WIDTH,
  PreferredColumns,
  resolveColumnSpan,
  calculateColumns as utilCalculateColumns,
} from '../utils/grid-config.util';
import { HeightEstimator } from '../utils/height-estimation.util';
import { estimateSectionHeight } from '../utils/smart-grid.util';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Layout configuration
 */
export interface LayoutConfig {
  /** Container width in pixels */
  containerWidth: number;
  /** Gap between sections */
  gap?: number;
  /** Number of columns (auto-calculated if not provided) */
  columns?: number;
  /** Minimum column width */
  minColumnWidth?: number;
  /** Maximum columns */
  maxColumns?: number;
  /** Enable optimization */
  optimize?: boolean;
  /** Enable virtual scrolling */
  virtualScroll?: boolean;
}

/**
 * Positioned section with calculated layout
 */
export interface PositionedSection {
  /** Original section data */
  section: CardSection;
  /** Unique key for tracking */
  key: string;
  /** Column span */
  colSpan: number;
  /** Preferred columns */
  preferredColumns: PreferredColumns;
  /** Left position (CSS calc expression) */
  left: string;
  /** Top position in pixels */
  top: number;
  /** Width (CSS calc expression) */
  width: string;
  /** Whether this is a new section (for animations) */
  isNew?: boolean;
  /** Whether animation has completed */
  hasAnimated?: boolean;
}

/**
 * Layout calculation result
 */
export interface LayoutResult {
  /** Positioned sections */
  positions: PositionedSection[];
  /** Column heights */
  columnHeights: number[];
  /** Total grid height */
  totalHeight: number;
  /** Number of columns used */
  columns: number;
  /** Container width */
  containerWidth: number;
  /** Calculation time in ms */
  calculationTime?: number;
}

/**
 * Column assignment result
 */
export interface ColumnAssignment {
  /** Column index where section is placed */
  columnIndex: number;
  /** Number of columns the section spans */
  colSpan: number;
  /** Whether section was expanded */
  expanded: boolean;
  /** Reason for expansion (for debugging) */
  expansionReason?: string;
}

/**
 * Height estimation context
 */
export interface SectionHeightContext {
  /** Section to estimate */
  section: CardSection;
  /** Container width */
  containerWidth: number;
  /** Number of columns */
  columns: number;
  /** Column span */
  colSpan: number;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: 'root',
})
export class LayoutCalculationService {
  private readonly heightEstimator = inject(HeightEstimator);

  /**
   * Calculate complete layout for sections
   *
   * @param sections - Sections to layout
   * @param config - Layout configuration
   * @returns Layout result with positioned sections
   */
  calculateLayout(sections: CardSection[], config: LayoutConfig): LayoutResult {
    const startTime = performance.now();

    // Normalize config
    const normalizedConfig = this.normalizeConfig(config);
    const { containerWidth, gap, columns, minColumnWidth, maxColumns } = normalizedConfig;

    // Calculate columns if not provided
    const actualColumns =
      columns || this.calculateColumns(containerWidth, minColumnWidth!, maxColumns!);

    // Initialize column heights
    const columnHeights = new Array(actualColumns).fill(0);

    // Calculate positions
    const positions: PositionedSection[] = [];

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i]!;
      const key = this.generateKey(section, i);

      // Get preferred columns and resolve span
      const preferredColumns = getPreferredColumns(section.type);
      const resolvedSpan = resolveColumnSpan(preferredColumns, actualColumns);

      // Use resolved span (expansion logic can be added later)
      const colSpan = resolvedSpan;

      // Find best column
      const assignment = this.findBestColumn(columnHeights, colSpan);

      // Estimate height
      const estimatedHeight = this.estimateHeight({
        section,
        containerWidth,
        columns: actualColumns,
        colSpan,
      });

      // Calculate position
      const top = columnHeights[assignment.columnIndex]!;
      const left = this.generateLeftExpression(assignment.columnIndex, actualColumns);
      const width = this.generateWidthExpression(colSpan, actualColumns);

      // Create positioned section
      const positioned: PositionedSection = {
        section,
        key,
        colSpan,
        preferredColumns,
        left,
        top,
        width,
      };

      positions.push(positioned);

      // Update column heights
      this.updateColumnHeights(
        columnHeights,
        assignment.columnIndex,
        colSpan,
        estimatedHeight,
        gap!
      );
    }

    const endTime = performance.now();

    return {
      positions,
      columnHeights,
      totalHeight: Math.max(...columnHeights),
      columns: actualColumns,
      containerWidth,
      calculationTime: endTime - startTime,
    };
  }

  /**
   * Calculate optimal number of columns
   *
   * @param containerWidth - Container width in pixels
   * @param minColumnWidth - Minimum column width
   * @param maxColumns - Maximum columns allowed
   * @returns Optimal column count
   */
  @Memoize()
  calculateColumns(
    containerWidth: number,
    minColumnWidth: number = MIN_COLUMN_WIDTH,
    maxColumns: number = MAX_COLUMNS
  ): number {
    return utilCalculateColumns(containerWidth, { minColumnWidth, maxColumns });
  }

  /**
   * Calculate column width
   *
   * @param containerWidth - Container width
   * @param columns - Number of columns
   * @param gap - Gap between columns
   * @returns Column width in pixels
   */
  calculateColumnWidth(containerWidth: number, columns: number, gap: number = GRID_GAP): number {
    return calculateColumnWidth(containerWidth, columns, gap);
  }

  /**
   * Estimate section height
   *
   * @param context - Height estimation context
   * @returns Estimated height in pixels
   */
  estimateHeight(context: SectionHeightContext): number {
    const { section } = context;

    // Use utility-based estimation (context is optional)
    return estimateSectionHeight(section);
  }

  /**
   * Generate unique key for section
   *
   * @param section - Section
   * @param index - Section index
   * @returns Unique key
   */
  generateKey(section: CardSection, index: number): string {
    return section.id || `section-${section.type}-${index}`;
  }

  /**
   * Find best column for section placement
   *
   * @param columnHeights - Current column heights
   * @param colSpan - Column span required
   * @returns Column assignment
   */
  private findBestColumn(columnHeights: number[], colSpan: number): ColumnAssignment {
    const numColumns = columnHeights.length;

    // If span exceeds available columns, cap it
    const actualSpan = Math.min(colSpan, numColumns);

    // For single column, find shortest
    if (actualSpan === 1) {
      const shortestIndex = this.findShortestColumn(columnHeights);
      return {
        columnIndex: shortestIndex,
        colSpan: 1,
        expanded: false,
      };
    }

    // For multi-column, find position with shortest max height
    let bestIndex = 0;
    let bestMaxHeight = Infinity;

    for (let i = 0; i <= numColumns - actualSpan; i++) {
      const maxHeight = Math.max(...columnHeights.slice(i, i + actualSpan));
      if (maxHeight < bestMaxHeight) {
        bestMaxHeight = maxHeight;
        bestIndex = i;
      }
    }

    return {
      columnIndex: bestIndex,
      colSpan: actualSpan,
      expanded: actualSpan > 1,
    };
  }

  /**
   * Find shortest column
   *
   * @param columnHeights - Column heights
   * @returns Index of shortest column
   */
  private findShortestColumn(columnHeights: number[]): number {
    let shortestIndex = 0;
    let shortestHeight = columnHeights[0] ?? 0;

    for (let i = 1; i < columnHeights.length; i++) {
      const height = columnHeights[i] ?? 0;
      if (height < shortestHeight) {
        shortestHeight = height;
        shortestIndex = i;
      }
    }

    return shortestIndex;
  }

  /**
   * Update column heights after placing section
   *
   * @param columnHeights - Column heights to update
   * @param startColumn - Starting column index
   * @param colSpan - Column span
   * @param sectionHeight - Section height
   * @param gap - Gap between sections
   */
  private updateColumnHeights(
    columnHeights: number[],
    startColumn: number,
    colSpan: number,
    sectionHeight: number,
    gap: number
  ): void {
    // Find max height across spanned columns
    const maxHeight = Math.max(...columnHeights.slice(startColumn, startColumn + colSpan));

    // Set all spanned columns to max height + section height + gap
    const newHeight = maxHeight + sectionHeight + gap;
    for (let i = startColumn; i < startColumn + colSpan; i++) {
      columnHeights[i] = newHeight;
    }
  }

  /**
   * Generate left position CSS expression
   *
   * @param columnIndex - Column index
   * @param totalColumns - Total columns
   * @returns CSS calc expression
   */
  private generateLeftExpression(columnIndex: number, totalColumns: number): string {
    return `calc(${((columnIndex / totalColumns) * 100).toFixed(4)}%)`;
  }

  /**
   * Generate width CSS expression
   *
   * @param colSpan - Column span
   * @param totalColumns - Total columns
   * @returns CSS calc expression
   */
  private generateWidthExpression(colSpan: number, totalColumns: number): string {
    return `calc(${((colSpan / totalColumns) * 100).toFixed(4)}% - var(--masonry-gap))`;
  }

  /**
   * Get breakpoint from width
   *
   * @param width - Container width
   * @returns Breakpoint name
   */
  private getBreakpointFromWidth(width: number): string {
    if (width < 640) return 'mobile';
    if (width < 1024) return 'tablet';
    if (width < 1280) return 'desktop';
    return 'wide';
  }

  /**
   * Normalize layout configuration with defaults
   *
   * @param config - Input configuration
   * @returns Normalized configuration
   */
  private normalizeConfig(config: LayoutConfig): Required<LayoutConfig> {
    return {
      containerWidth: config.containerWidth,
      gap: config.gap ?? GRID_GAP,
      columns: config.columns ?? 0,
      minColumnWidth: config.minColumnWidth ?? MIN_COLUMN_WIDTH,
      maxColumns: config.maxColumns ?? MAX_COLUMNS,
      optimize: config.optimize ?? true,
      virtualScroll: config.virtualScroll ?? false,
    };
  }

  /**
   * Calculate layout density (sections per column)
   *
   * @param sections - Sections
   * @param columns - Number of columns
   * @returns Density value
   */
  calculateDensity(sections: CardSection[], columns: number): number {
    return sections.length / columns;
  }

  /**
   * Get layout statistics
   *
   * @param result - Layout result
   * @returns Layout statistics
   */
  getLayoutStatistics(result: LayoutResult): LayoutStatistics {
    const { positions, columnHeights, totalHeight, columns } = result;

    // Calculate column utilization
    const avgHeight = columnHeights.reduce((sum, h) => sum + h, 0) / columns;
    const maxHeight = Math.max(...columnHeights);
    const minHeight = Math.min(...columnHeights);
    const heightVariance = maxHeight - minHeight;
    const utilization = (avgHeight / maxHeight) * 100;

    // Calculate span distribution
    const spanDistribution = new Map<number, number>();
    positions.forEach((pos) => {
      spanDistribution.set(pos.colSpan, (spanDistribution.get(pos.colSpan) || 0) + 1);
    });

    return {
      totalSections: positions.length,
      columns,
      totalHeight,
      avgColumnHeight: avgHeight,
      maxColumnHeight: maxHeight,
      minColumnHeight: minHeight,
      heightVariance,
      columnUtilization: utilization,
      spanDistribution: Object.fromEntries(spanDistribution),
      calculationTime: result.calculationTime || 0,
    };
  }
}

/**
 * Layout statistics
 */
export interface LayoutStatistics {
  totalSections: number;
  columns: number;
  totalHeight: number;
  avgColumnHeight: number;
  maxColumnHeight: number;
  minColumnHeight: number;
  heightVariance: number;
  columnUtilization: number;
  spanDistribution: Record<number, number>;
  calculationTime: number;
}
