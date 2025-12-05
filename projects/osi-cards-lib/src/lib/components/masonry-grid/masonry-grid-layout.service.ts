/**
 * Masonry Grid Layout Service
 *
 * Core layout calculation service for masonry grid.
 * Handles positioning logic, column assignment, and optimization algorithms.
 *
 * Extracted from masonry-grid.component.ts for better separation of concerns.
 */

import { Injectable, inject } from '@angular/core';
import { CardSection } from '../../models';
import { SectionLayoutPreferenceService } from '../../services/section-layout-preference.service';
import {
  generateWidthExpression,
  generateLeftExpression,
  getPreferredColumns,
  resolveColumnSpan,
  PreferredColumns,
  shouldExpandSection,
  SectionExpansionInfo,
  calculateBasicDensity,
  ColumnPackingOptions,
} from '../../utils/grid-config.util';
import { estimateSectionHeight } from '../../utils/smart-grid.util';
import {
  packSectionsIntoRows,
  packingResultToPositions,
  RowPackerConfig,
} from '../../utils/row-packer.util';
import {
  packSectionsIntoColumns,
  columnPackingResultToPositions,
  ColumnPackerConfig,
} from '../../utils/column-packer.util';

export interface PositionedSection {
  section: CardSection;
  key: string;
  colSpan: number;
  preferredColumns: PreferredColumns;
  left: string;
  top: number;
  width: string;
  isNew?: boolean;
  hasAnimated?: boolean;
}

export interface LayoutConfig {
  columns: number;
  gap: number;
  containerWidth: number;
  minColumnWidth: number;
  optimizeLayout: boolean;
  packingAlgorithm: 'legacy' | 'row-first' | 'skyline' | 'column-based';
  useLegacyFallback: boolean;
  rowPackingOptions?: any;
  columnPackingOptions?: ColumnPackingOptions;
}

export interface LayoutResult {
  positionedSections: PositionedSection[];
  containerHeight: number;
  columns: number;
}

export interface ColumnAssignment {
  columnIndex: number;
  colSpan: number;
  expanded: boolean;
  expansionReason?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MasonryGridLayoutService {
  private readonly layoutPreferenceService = inject(SectionLayoutPreferenceService);

  /**
   * Calculate layout for sections
   */
  calculateLayout(
    sections: CardSection[],
    config: LayoutConfig,
    getStableKey: (section: CardSection, index: number) => string,
    markAsNew: (section: CardSection, key: string) => boolean
  ): LayoutResult {
    if (config.packingAlgorithm === 'column-based') {
      try {
        return this.calculateColumnBasedLayout(sections, config, getStableKey, markAsNew);
      } catch (error) {
        if (config.useLegacyFallback) {
          // Only warn in development mode
          const isDevelopment =
            typeof window !== 'undefined' &&
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
          if (isDevelopment) {
            console.warn('[LayoutService] Column-based failed, using legacy:', error);
          }
          return this.calculateLegacyLayout(sections, config, getStableKey, markAsNew);
        }
        throw error;
      }
    }

    if (config.packingAlgorithm === 'row-first') {
      try {
        return this.calculateRowFirstLayout(sections, config, getStableKey, markAsNew);
      } catch (error) {
        if (config.useLegacyFallback) {
          // Only warn in development mode
          const isDevelopment =
            typeof window !== 'undefined' &&
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
          if (isDevelopment) {
            console.warn('[LayoutService] Row-first failed, using legacy:', error);
          }
          return this.calculateLegacyLayout(sections, config, getStableKey, markAsNew);
        }
        throw error;
      }
    }

    return this.calculateLegacyLayout(sections, config, getStableKey, markAsNew);
  }

  /**
   * Calculate layout using column-based algorithm
   */
  private calculateColumnBasedLayout(
    sections: CardSection[],
    config: LayoutConfig,
    getStableKey: (section: CardSection, index: number) => string,
    markAsNew: (section: CardSection, key: string) => boolean
  ): LayoutResult {
    // Only log in development mode
    const isDevelopment =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (isDevelopment) {
      console.log('[LayoutService] 🎯 calculateColumnBasedLayout called', {
        sectionsCount: sections.length,
        columns: config.columns,
        containerWidth: config.containerWidth,
      });
    }

    const packConfig: ColumnPackerConfig = {
      columns: config.columns,
      gap: config.gap,
      containerWidth: config.containerWidth,
      packingMode: config.columnPackingOptions?.packingMode ?? 'ffdh',
      allowReordering: config.columnPackingOptions?.allowReordering ?? true,
      sortByHeight: config.columnPackingOptions?.sortByHeight ?? true,
      useSkylineThreshold: config.columnPackingOptions?.useSkylineThreshold ?? 3,
      layoutPreferenceService: this.layoutPreferenceService, // NEW: Pass service for dynamic preferences
    };

    const result = packSectionsIntoColumns(sections, packConfig);

    if (isDevelopment) {
      console.log('[LayoutService] 📦 Packing result', {
        positionedCount: result.positionedSections.length,
        totalHeight: result.totalHeight,
        algorithm: result.algorithm,
        utilization: result.utilization,
        gapCount: result.gapCount,
      });
    }

    const positions = columnPackingResultToPositions(result);

    const positionedSections = positions.map((pos, index) => {
      const section = pos.section;
      const key = getStableKey(section, index);
      const isNew = markAsNew(section, key);

      return {
        section,
        key,
        colSpan: pos.colSpan,
        preferredColumns: pos.preferredColumns,
        left: pos.left,
        top: pos.top,
        width: pos.width,
        isNew,
      };
    });

    if (isDevelopment) {
      console.log('[LayoutService] ✅ Column-based layout complete', {
        positionedSectionsCount: positionedSections.length,
        containerHeight: result.totalHeight,
        columns: config.columns,
      });
    }

    return {
      positionedSections,
      containerHeight: result.totalHeight,
      columns: config.columns,
    };
  }

  /**
   * Calculate layout using row-first algorithm
   */
  private calculateRowFirstLayout(
    sections: CardSection[],
    config: LayoutConfig,
    getStableKey: (section: CardSection, index: number) => string,
    markAsNew: (section: CardSection, key: string) => boolean
  ): LayoutResult {
    const packConfig: RowPackerConfig = {
      totalColumns: config.columns,
      gap: config.gap,
      prioritizeSpaceFilling: config.rowPackingOptions?.prioritizeSpaceFilling ?? true,
      allowShrinking: config.rowPackingOptions?.allowShrinking ?? true,
      allowGrowing: config.rowPackingOptions?.allowGrowing ?? true,
      maxOptimizationPasses: config.rowPackingOptions?.maxOptimizationPasses ?? 3,
    };

    const result = packSectionsIntoRows(sections, packConfig);
    const positions = packingResultToPositions(result, {
      totalColumns: config.columns,
      gap: config.gap,
    });

    const positionedSections = positions.map((pos, index) => {
      const section = pos.section;
      const key = getStableKey(section, index);
      const isNew = markAsNew(section, key);

      return {
        section,
        key,
        colSpan: pos.colSpan,
        preferredColumns: pos.preferredColumns,
        left: pos.left,
        top: pos.top,
        width: pos.width,
        isNew,
      };
    });

    return {
      positionedSections,
      containerHeight: result.totalHeight,
      columns: config.columns,
    };
  }

  /**
   * Calculate layout using legacy algorithm
   */
  private calculateLegacyLayout(
    sections: CardSection[],
    config: LayoutConfig,
    getStableKey: (section: CardSection, index: number) => string,
    markAsNew: (section: CardSection, key: string) => boolean
  ): LayoutResult {
    const { columns, gap, containerWidth, optimizeLayout } = config;
    const colWidth =
      columns > 1 ? (containerWidth - gap * (columns - 1)) / columns : containerWidth;

    const colHeights = Array(columns).fill(0);

    // Determine section ordering - sort by height for better packing
    let orderedSections = sections;
    if (optimizeLayout && sections.length > 1) {
      // Sort by estimated height (descending) for better packing
      orderedSections = [...sections].sort((a, b) => {
        const heightA = estimateSectionHeight(a);
        const heightB = estimateSectionHeight(b);
        return heightB - heightA;
      });
    }

    // Place sections
    const positionedSections = orderedSections.map((section, index) => {
      const preferredCols = getPreferredColumns(section.type ?? 'info');
      const key = getStableKey(section, index);
      const isNew = markAsNew(section, key);

      // Find shortest column
      const shortestCol = colHeights.indexOf(Math.min(...colHeights));
      const left = shortestCol * (colWidth + gap);
      const top = colHeights[shortestCol] ?? 0;

      // Estimate height
      const estimatedHeight = 300;
      colHeights[shortestCol] = top + estimatedHeight + gap;

      const widthExpr = columns > 1 ? generateWidthExpression(columns, 1, gap) : '100%';

      return {
        section,
        key,
        colSpan: this.getSectionColSpan(section, config.columns),
        preferredColumns: preferredCols,
        left: columns > 1 ? `${left}px` : '0px',
        top,
        width: widthExpr,
        isNew,
      };
    });

    return {
      positionedSections,
      containerHeight: Math.max(...colHeights, 0),
      columns,
    };
  }

  /**
   * Recalculate positions with actual measured heights
   */
  recalculateWithHeights(
    sections: PositionedSection[],
    sectionHeights: Map<string, number>,
    config: LayoutConfig
  ): LayoutResult {
    const { columns, gap, optimizeLayout } = config;

    // Sort by height descending if optimizing
    let sectionsToPlace = sections;
    if (optimizeLayout && columns > 1) {
      sectionsToPlace = [...sections].sort((a, b) => {
        const heightA = sectionHeights.get(a.key) ?? 200;
        const heightB = sectionHeights.get(b.key) ?? 200;
        return heightB - heightA;
      });
    }

    const colHeights = Array(columns).fill(0);
    const placedSections: PositionedSection[] = [];

    for (const item of sectionsToPlace) {
      const height = sectionHeights.get(item.key) ?? 200;
      const span = Math.min(item.colSpan, columns);

      // Find best column
      let bestColumn = 0;
      let minColHeight = Number.MAX_VALUE;

      for (let col = 0; col <= columns - span; col++) {
        let maxHeight = 0;
        for (let c = col; c < col + span; c++) {
          if ((colHeights[c] ?? 0) > maxHeight) {
            maxHeight = colHeights[c] ?? 0;
          }
        }
        if (maxHeight < minColHeight) {
          minColHeight = maxHeight;
          bestColumn = col;
        }
      }

      const topPosition = minColHeight;
      const widthExpr = generateWidthExpression(columns, span, gap);
      const leftExpr = generateLeftExpression(columns, bestColumn, gap);

      // Update column heights
      // Add height + gap to position (gap is spacing between items)
      const newHeight = topPosition + height + gap;
      for (let col = bestColumn; col < bestColumn + span; col++) {
        colHeights[col] = Math.max(colHeights[col] || 0, newHeight);
      }

      placedSections.push({
        ...item,
        colSpan: span,
        left: leftExpr,
        top: topPosition,
        width: widthExpr,
      });
    }

    // Calculate container height as max column height, but subtract last gap
    // (gap is added after each item, so the last gap shouldn't count)
    const maxColHeight = Math.max(...colHeights, 0);
    const containerHeight = maxColHeight > 0 ? Math.max(0, maxColHeight - gap) : 0;

    return {
      positionedSections: placedSections,
      containerHeight,
      columns,
    };
  }

  /**
   * Find optimal column assignment for a section
   */
  findOptimalColumnAssignment(
    colHeights: number[],
    preferredSpan: number,
    columns: number,
    config: LayoutConfig,
    pendingSections?: PositionedSection[],
    sectionInfo?: SectionExpansionInfo
  ): ColumnAssignment {
    // Ensure span doesn't exceed available columns
    let targetSpan = Math.min(preferredSpan, columns);

    // Graceful degradation
    while (targetSpan > 1) {
      const canFit = this.canFitSpan(colHeights, targetSpan, columns);
      if (canFit >= 0) {
        break;
      }
      targetSpan--;
    }

    // Find best column position
    let bestColumn = 0;
    let minHeight = Number.MAX_VALUE;

    for (let col = 0; col <= columns - targetSpan; col++) {
      let maxColHeight = 0;
      for (let c = col; c < col + targetSpan; c++) {
        const colHeight = colHeights[c] ?? 0;
        if (colHeight > maxColHeight) {
          maxColHeight = colHeight;
        }
      }

      if (maxColHeight < minHeight) {
        minHeight = maxColHeight;
        bestColumn = col;
      }
    }

    // Check expansion
    const remainingCols = columns - bestColumn - targetSpan;
    const canPendingFit = this.canAnyPendingSectionFit(remainingCols, pendingSections);

    const expansionResult = shouldExpandSection(sectionInfo ?? { type: 'default' }, {
      currentSpan: targetSpan,
      remainingColumns: remainingCols,
      totalColumns: columns,
      containerWidth: config.containerWidth,
      minColumnWidth: config.minColumnWidth,
      gap: config.gap,
      canPendingFit,
    });

    return {
      columnIndex: bestColumn,
      colSpan: expansionResult.finalSpan,
      expanded: expansionResult.shouldExpand,
      expansionReason: expansionResult.reason,
    };
  }

  /**
   * Check if a span can fit in any column
   */
  private canFitSpan(colHeights: number[], span: number, columns: number): number {
    for (let col = 0; col <= columns - span; col++) {
      return col;
    }
    return -1;
  }

  /**
   * Check if any pending section can fit in remaining columns
   */
  private canAnyPendingSectionFit(
    remainingCols: number,
    pendingSections?: PositionedSection[]
  ): boolean {
    if (remainingCols <= 0 || !pendingSections || pendingSections.length === 0) {
      return false;
    }

    return pendingSections.some((s) => s.colSpan <= remainingCols);
  }

  /**
   * Get section column span
   */
  private getSectionColSpan(section: CardSection, availableColumns: number = 4): number {
    const preferredColumns = getPreferredColumns(section.type ?? 'default');
    return resolveColumnSpan(preferredColumns, availableColumns, section.colSpan);
  }

  /**
   * Calculate total height from positioned sections
   */
  calculateTotalHeight(sections: PositionedSection[], sectionHeights: Map<string, number>): number {
    let maxHeight = 0;

    for (const section of sections) {
      const height = sectionHeights.get(section.key) ?? 200;
      const bottom = section.top + height;
      if (bottom > maxHeight) {
        maxHeight = bottom;
      }
    }

    return maxHeight;
  }
}
