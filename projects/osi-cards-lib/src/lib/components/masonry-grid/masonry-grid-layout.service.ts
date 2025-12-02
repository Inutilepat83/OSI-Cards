/**
 * Masonry Grid Layout Service
 *
 * Core layout calculation service for masonry grid.
 * Handles positioning logic, column assignment, and optimization algorithms.
 *
 * Extracted from masonry-grid.component.ts for better separation of concerns.
 */

import { Injectable } from '@angular/core';
import { CardSection } from '../../models';
import {
  generateWidthExpression,
  generateLeftExpression,
  getPreferredColumns,
  resolveColumnSpan,
  PreferredColumns,
  shouldExpandSection,
  SectionExpansionInfo,
  calculateBasicDensity
} from '../../utils/grid-config.util';
import {
  estimateSectionHeight,
  binPack2D
} from '../../utils/smart-grid.util';
import {
  packSectionsIntoRows,
  packingResultToPositions,
  RowPackerConfig
} from '../../utils/row-packer.util';

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
  packingAlgorithm: 'legacy' | 'row-first' | 'skyline';
  useLegacyFallback: boolean;
  rowPackingOptions?: any;
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

@Injectable()
export class MasonryGridLayoutService {
  /**
   * Calculate layout for sections
   */
  calculateLayout(
    sections: CardSection[],
    config: LayoutConfig,
    getStableKey: (section: CardSection, index: number) => string,
    markAsNew: (section: CardSection, key: string) => boolean
  ): LayoutResult {
    if (config.packingAlgorithm === 'row-first') {
      try {
        return this.calculateRowFirstLayout(sections, config, getStableKey, markAsNew);
      } catch (error) {
        if (config.useLegacyFallback) {
          console.warn('[LayoutService] Row-first failed, using legacy:', error);
          return this.calculateLegacyLayout(sections, config, getStableKey, markAsNew);
        }
        throw error;
      }
    }

    return this.calculateLegacyLayout(sections, config, getStableKey, markAsNew);
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
      columns: config.columns
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
    const colWidth = columns > 1
      ? (containerWidth - (gap * (columns - 1))) / columns
      : containerWidth;

    const colHeights = Array(columns).fill(0);

    // Determine section ordering
    let orderedSections = sections;
    if (optimizeLayout && sections.length > 1) {
      const resolvedSections = sections.map(s => ({
        section: s,
        colSpan: this.getSectionColSpan(s),
        preferredColumns: getPreferredColumns(s.type ?? 'info')
      }));

      const packedSections = binPack2D(resolvedSections, columns, {
        respectPriority: true,
        fillGaps: true,
        balanceColumns: false
      });

      orderedSections = packedSections.map(s => s.section);
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

      const widthExpr = columns > 1
        ? generateWidthExpression(columns, 1, gap)
        : '100%';

      return {
        section,
        key,
        colSpan: this.getSectionColSpan(section),
        preferredColumns: preferredCols,
        left: columns > 1 ? `${left}px` : '0px',
        top,
        width: widthExpr,
        isNew
      };
    });

    return {
      positionedSections,
      containerHeight: Math.max(...colHeights, 0),
      columns
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
      const newHeight = topPosition + height + gap;
      for (let col = bestColumn; col < bestColumn + span; col++) {
        colHeights[col] = newHeight;
      }

      placedSections.push({
        ...item,
        colSpan: span,
        left: leftExpr,
        top: topPosition,
        width: widthExpr
      });
    }

    return {
      positionedSections: placedSections,
      containerHeight: Math.max(...colHeights, 0),
      columns
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

    const expansionResult = shouldExpandSection(
      sectionInfo ?? { type: 'default' },
      {
        currentSpan: targetSpan,
        remainingColumns: remainingCols,
        totalColumns: columns,
        containerWidth: config.containerWidth,
        minColumnWidth: config.minColumnWidth,
        gap: config.gap,
        canPendingFit,
      }
    );

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

    return pendingSections.some(s => s.colSpan <= remainingCols);
  }

  /**
   * Get section column span
   */
  private getSectionColSpan(section: CardSection): number {
    return resolveColumnSpan(section);
  }

  /**
   * Calculate total height from positioned sections
   */
  calculateTotalHeight(
    sections: PositionedSection[],
    sectionHeights: Map<string, number>
  ): number {
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

