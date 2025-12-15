import { Injectable } from '@angular/core';
import { CardSection } from '../models';

/**
 * Position info for a section after transform calculation
 */
export interface TransformPosition {
  transform: string;
  finalTop: number;
  colIndex: number;
  colSpan: number;
}

/**
 * Configuration for transform calculation
 */
export interface TransformConfig {
  columns: number;
  gap: number;
  containerWidth: number;
}

/**
 * Service for calculating CSS transforms to eliminate gaps in masonry layout.
 *
 * KEY PRINCIPLE: This service READS heights from DOM after browser layout,
 * calculates transforms, and returns them. It NEVER triggers re-renders or
 * DOM mutations during calculation, preventing circular dependencies.
 */
@Injectable({
  providedIn: 'root',
})
export class MasonryTransformService {
  /**
   * Calculate transforms to eliminate vertical gaps.
   *
   * CRITICAL: This method is PURE - no side effects, no DOM mutations.
   * It reads ACTUAL heights from the DOM after browser has laid out content,
   * then calculates transforms. This breaks circular dependency chains.
   *
   * @param sections - Array of sections to position
   * @param itemElements - DOM elements corresponding to sections (in same order)
   * @param config - Layout configuration
   * @param getColSpan - Function to get column span for a section
   * @returns Map of section keys to transform positions
   */
  calculateTransforms(
    sections: CardSection[],
    itemElements: HTMLElement[],
    config: TransformConfig,
    getColSpan: (section: CardSection, columns: number) => number
  ): Map<string, TransformPosition> {
    if (sections.length === 0 || itemElements.length === 0) {
      return new Map();
    }

    if (sections.length !== itemElements.length) {
      console.warn(
        `[MasonryTransform] Section count (${sections.length}) doesn't match ` +
          `element count (${itemElements.length}). Cannot calculate transforms.`
      );
      return new Map();
    }

    const colHeights = new Array(config.columns).fill(0);
    const transforms = new Map<string, TransformPosition>();

    // Track current column position for sequential filling
    let currentColumn = 0;

    // Track recent widths for diversity calculation (keep last 5 widths)
    const recentWidths: number[] = [];
    const MAX_RECENT_WIDTHS = 5;

    // Process sections - first create indexed array, then arrange for better distribution
    const indexedSections = sections
      .map((section, index) => ({
        section,
        element: itemElements[index],
        index,
      }))
      .filter(
        (item): item is { section: CardSection; element: HTMLElement; index: number } =>
          item.element !== undefined && item.element !== null
      );

    // Arrange sections: group by priority, sort by width within groups for better distribution
    const arrangedSections = this.arrangeSections(indexedSections, getColSpan, config.columns);

    // Track placed items to skip items placed via look-ahead
    const placedIndices = new Set<number>();

    for (let loopIndex = 0; loopIndex < arrangedSections.length; loopIndex++) {
      const item = arrangedSections[loopIndex];
      if (!item) {
        continue;
      }
      const { section, element, index } = item;

      // Skip if already placed via look-ahead
      if (placedIndices.has(index)) {
        continue;
      }

      // Read ACTUAL height from DOM - always measure, never cache
      // Use offsetHeight as primary (most reliable for layout)
      // Fallback to getBoundingClientRect if needed
      const offsetHeight = element.offsetHeight || 0;
      const rectHeight = element.getBoundingClientRect().height || 0;

      // Use the larger value to ensure we don't underestimate
      const actualHeight = Math.max(offsetHeight, rectHeight);

      if (actualHeight <= 0) {
        console.warn(`[MasonryTransform] Section ${index} has zero height`, {
          rectHeight,
          offsetHeight,
        });
        continue;
      }

      // Smart placement: find best column position (shortest column that fits)
      const preferredSpan = section.preferredColumns || getColSpan(section, config.columns) || 1;
      let placementCol = this.findBestColumnPosition(
        preferredSpan,
        config.columns,
        colHeights,
        currentColumn
      );

      // Get optimal span considering space fit and diversity at chosen position
      let optimalSpan = this.getOptimalSpan(
        section,
        placementCol,
        config.columns,
        colHeights,
        recentWidths,
        getColSpan
      );

      // If span doesn't fit at chosen position, wrap to start and recalculate
      if (placementCol + optimalSpan > config.columns) {
        placementCol = 0;
        optimalSpan = this.getOptimalSpan(
          section,
          placementCol,
          config.columns,
          colHeights,
          recentWidths,
          getColSpan
        );
      }

      // Check if we should fill the last row
      const remainingItems = indexedSections.length - index - 1;
      const remainingCols = this.calculateRemainingColumns(
        placementCol,
        optimalSpan,
        config.columns
      );

      if (this.shouldFillLastRow(index, indexedSections.length, remainingCols, remainingItems)) {
        // Adjust span to fill remaining columns in last row
        const adjustedSpan = this.calculateOptimalSpanForLastRow(
          section,
          placementCol,
          remainingCols,
          config.columns,
          getColSpan
        );
        // Only use adjusted span if it's larger (we want to fill, not shrink)
        if (adjustedSpan > optimalSpan && placementCol + adjustedSpan <= config.columns) {
          optimalSpan = adjustedSpan;
        }
      }

      // Try to fill remaining columns after placement
      const fillStrategy = this.tryFillRemainingColumns(
        item,
        optimalSpan,
        placementCol,
        config.columns,
        arrangedSections,
        loopIndex,
        placedIndices,
        getColSpan
      );

      // Apply fill strategy adjustments
      if (fillStrategy.action === 'extend' && fillStrategy.adjustedSpan) {
        optimalSpan = fillStrategy.adjustedSpan;
      } else if (fillStrategy.action === 'reduce_and_place' && fillStrategy.adjustedSpan) {
        optimalSpan = fillStrategy.adjustedSpan;
      }

      // Calculate top position (max height of columns this span occupies)
      const targetTop = this.calculateTopPosition(placementCol, optimalSpan, colHeights);
      const currentTop = element.offsetTop || 0;
      const translateY = targetTop - currentTop;

      // Generate section key
      const key = this.getSectionKey(section, index);

      // Store transform
      transforms.set(key, {
        transform: translateY !== 0 ? `translateY(${translateY}px)` : 'none',
        finalTop: targetTop,
        colIndex: placementCol,
        colSpan: optimalSpan,
      });

      // Update column heights
      const newHeight = targetTop + actualHeight + config.gap;
      for (let c = placementCol; c < placementCol + optimalSpan; c++) {
        colHeights[c] = newHeight;
      }

      // Track width for diversity (keep last N widths)
      recentWidths.push(optimalSpan);
      if (recentWidths.length > MAX_RECENT_WIDTHS) {
        recentWidths.shift();
      }

      // Mark current item as placed
      placedIndices.add(index);

      // Track final column position after placing current and any look-ahead items
      let finalPlacementCol = placementCol + optimalSpan;

      // If strategy requires placing next item, do it immediately
      if (fillStrategy.action === 'place_next' || fillStrategy.action === 'reduce_and_place') {
        if (fillStrategy.nextItem) {
          // Place next item from same group in remaining space
          const nextPlacementCol = placementCol + optimalSpan;
          const nextRemainingCols = config.columns - nextPlacementCol;
          const nextOptimalSpan = this.getOptimalSpan(
            fillStrategy.nextItem.section,
            nextPlacementCol,
            config.columns,
            colHeights,
            recentWidths,
            getColSpan
          );

          // Ensure it fits in remaining space
          const nextSpan = Math.min(nextOptimalSpan, nextRemainingCols);

          if (nextSpan > 0 && nextPlacementCol + nextSpan <= config.columns) {
            // Place next item immediately
            const nextTargetTop = this.calculateTopPosition(nextPlacementCol, nextSpan, colHeights);
            const nextElement = fillStrategy.nextItem.element;
            const nextCurrentTop = nextElement.offsetTop || 0;
            const nextTranslateY = nextTargetTop - nextCurrentTop;
            const nextKey = this.getSectionKey(
              fillStrategy.nextItem.section,
              fillStrategy.nextItem.index
            );

            // Get next item's actual height
            const nextOffsetHeight = nextElement.offsetHeight || 0;
            const nextRectHeight = nextElement.getBoundingClientRect().height || 0;
            const nextActualHeight = Math.max(nextOffsetHeight, nextRectHeight);

            if (nextActualHeight > 0) {
              transforms.set(nextKey, {
                transform: nextTranslateY !== 0 ? `translateY(${nextTranslateY}px)` : 'none',
                finalTop: nextTargetTop,
                colIndex: nextPlacementCol,
                colSpan: nextSpan,
              });

              // Update column heights for next item
              const nextNewHeight = nextTargetTop + nextActualHeight + config.gap;
              for (let c = nextPlacementCol; c < nextPlacementCol + nextSpan; c++) {
                colHeights[c] = nextNewHeight;
              }

              // Track width for diversity
              recentWidths.push(nextSpan);
              if (recentWidths.length > MAX_RECENT_WIDTHS) {
                recentWidths.shift();
              }

              // Mark next item as placed (skip it in main loop)
              placedIndices.add(fillStrategy.nextItem.index);

              // Update final placement column
              finalPlacementCol = nextPlacementCol + nextSpan;
            }
          }
        }
      }

      // If strategy requires placing multiple items, do it immediately
      if (fillStrategy.action === 'place_multiple' && fillStrategy.nextItems) {
        let nextPlacementCol = placementCol + optimalSpan;

        for (const nextItemInfo of fillStrategy.nextItems) {
          const nextSpan = nextItemInfo.span;
          const nextItem = nextItemInfo.item;

          if (nextPlacementCol + nextSpan <= config.columns) {
            const nextTargetTop = this.calculateTopPosition(nextPlacementCol, nextSpan, colHeights);
            const nextElement = nextItem.element;
            const nextCurrentTop = nextElement.offsetTop || 0;
            const nextTranslateY = nextTargetTop - nextCurrentTop;
            const nextKey = this.getSectionKey(nextItem.section, nextItem.index);

            const nextOffsetHeight = nextElement.offsetHeight || 0;
            const nextRectHeight = nextElement.getBoundingClientRect().height || 0;
            const nextActualHeight = Math.max(nextOffsetHeight, nextRectHeight);

            if (nextActualHeight > 0) {
              transforms.set(nextKey, {
                transform: nextTranslateY !== 0 ? `translateY(${nextTranslateY}px)` : 'none',
                finalTop: nextTargetTop,
                colIndex: nextPlacementCol,
                colSpan: nextSpan,
              });

              const nextNewHeight = nextTargetTop + nextActualHeight + config.gap;
              for (let c = nextPlacementCol; c < nextPlacementCol + nextSpan; c++) {
                colHeights[c] = nextNewHeight;
              }

              recentWidths.push(nextSpan);
              if (recentWidths.length > MAX_RECENT_WIDTHS) {
                recentWidths.shift();
              }

              placedIndices.add(nextItem.index);
              nextPlacementCol += nextSpan;
              finalPlacementCol = nextPlacementCol;
            }
          }
        }
      }

      // Advance current column pointer for next item
      // If we filled the entire row (or beyond), wrap to column 0
      // Ensure finalPlacementCol doesn't exceed config.columns to prevent issues
      if (finalPlacementCol >= config.columns) {
        currentColumn = 0;
      } else {
        currentColumn = finalPlacementCol;
      }
    }

    return transforms;
  }

  /**
   * Arrange sections for better column distribution
   * Groups by priority (critical → important → standard → optional)
   * Within each group, sorts by preferred width for visual variety
   *
   * @param indexedSections - Sections with their elements and original indices
   * @param getColSpan - Function to get default column span
   * @param totalColumns - Total columns in grid
   * @returns Ordered sections array
   */
  private arrangeSections(
    indexedSections: Array<{
      section: CardSection;
      element: HTMLElement;
      index: number;
    }>,
    getColSpan: (section: CardSection, columns: number) => number,
    totalColumns: number
  ): Array<{ section: CardSection; element: HTMLElement; index: number }> {
    // Get priority order (lower number = higher priority)
    // Priority is now numeric (1-3), so we can use it directly
    const getPriorityOrder = (section: CardSection): number => {
      return section.priority ?? 3; // Default to 3 (lowest priority) if not set
    };

    // Get preferred width for sorting
    const getPreferredWidth = (section: CardSection): number => {
      return section.preferredColumns || getColSpan(section, totalColumns) || 1;
    };

    // Stable sort: priority first, then width (wider first for variety)
    return [...indexedSections].sort((a, b) => {
      const priorityA = getPriorityOrder(a.section);
      const priorityB = getPriorityOrder(b.section);

      // Primary: priority (critical/important first)
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Secondary: within same priority, sort by width for variety
      // Wider sections first creates better distribution
      const widthA = getPreferredWidth(a.section);
      const widthB = getPreferredWidth(b.section);
      if (widthA !== widthB) {
        return widthB - widthA; // Wider first
      }

      // Tertiary: original order (stability)
      return a.index - b.index;
    });
  }

  /**
   * Get priority group number for a section (used for grouping and look-ahead)
   *
   * @param section - Section to get priority group for
   * @returns Priority group number (1=critical, 2=important, 3=standard, 4=optional)
   */
  private getPriorityGroup(section: CardSection): number {
    // Priority is now numeric (1-3), so we can use it directly
    return section.priority ?? 3; // Default to 3 (lowest priority) if not set
  }

  /**
   * Find next unplaced item from the same priority group
   *
   * @param arrangedSections - All arranged sections
   * @param currentIndex - Current item index
   * @param currentPriorityGroup - Priority group of current item
   * @returns Next item from same group, or null if none found
   */
  private findNextItemInSameGroup(
    arrangedSections: Array<{ section: CardSection; element: HTMLElement; index: number }>,
    currentIndex: number,
    currentPriorityGroup: number
  ): { section: CardSection; element: HTMLElement; index: number } | null {
    for (let i = currentIndex + 1; i < arrangedSections.length; i++) {
      const item = arrangedSections[i];
      if (item && this.getPriorityGroup(item.section) === currentPriorityGroup) {
        return item;
      }
    }
    return null;
  }

  /**
   * Find items that could fill remaining columns
   * Prioritizes same-group items but considers others if needed
   *
   * @param arrangedSections - All arranged sections
   * @param currentIndex - Current item index
   * @param currentPriorityGroup - Priority group of current item
   * @param remainingCols - Columns remaining to fill
   * @param maxItems - Maximum number of items to consider
   * @param placedIndices - Set of indices that have already been placed
   * @param getColSpan - Function to get default column span
   * @param totalColumns - Total columns in grid
   * @returns Array of candidate items with their preferred spans and constraints
   */
  private findFillableItems(
    arrangedSections: Array<{ section: CardSection; element: HTMLElement; index: number }>,
    currentIndex: number,
    currentPriorityGroup: number,
    remainingCols: number,
    maxItems: number,
    placedIndices: Set<number>,
    getColSpan: (section: CardSection, columns: number) => number,
    totalColumns: number
  ): Array<{
    item: { section: CardSection; element: HTMLElement; index: number };
    preferredSpan: number;
    minSpan: number;
    maxSpan: number;
  }> {
    const sameGroupCandidates: Array<{
      item: { section: CardSection; element: HTMLElement; index: number };
      preferredSpan: number;
      minSpan: number;
      maxSpan: number;
    }> = [];
    const otherGroupCandidates: Array<{
      item: { section: CardSection; element: HTMLElement; index: number };
      preferredSpan: number;
      minSpan: number;
      maxSpan: number;
    }> = [];

    // Collect candidates, filtering out already-placed items
    for (let i = currentIndex + 1; i < arrangedSections.length; i++) {
      const item = arrangedSections[i];
      if (!item || placedIndices.has(item.index)) continue;

      const group = this.getPriorityGroup(item.section);
      const preferred =
        item.section.preferredColumns || getColSpan(item.section, totalColumns) || 1;
      const minSpan = item.section.minColumns || 1;
      const maxSpan = Math.min(item.section.maxColumns || totalColumns, totalColumns);

      const candidate = { item, preferredSpan: preferred, minSpan, maxSpan };

      // Collect same-group and other-group separately
      if (group === currentPriorityGroup) {
        sameGroupCandidates.push(candidate);
      } else if (sameGroupCandidates.length + otherGroupCandidates.length < maxItems) {
        otherGroupCandidates.push(candidate);
      }

      // Stop if we have enough candidates
      if (sameGroupCandidates.length + otherGroupCandidates.length >= maxItems * 2) {
        break;
      }
    }

    // Combine: all same-group first, then others up to maxItems
    const allCandidates = [...sameGroupCandidates, ...otherGroupCandidates];

    // Sort by preferred span (smaller first for better fit)
    return allCandidates.sort((a, b) => a.preferredSpan - b.preferredSpan).slice(0, maxItems);
  }

  /**
   * Check if an item can fit in remaining columns (with optional reduction of current item)
   *
   * @param section - Section to check if it can fit (next item)
   * @param remainingCols - Columns remaining in current row
   * @param currentSpan - Current span of the item being placed
   * @param currentItemSection - Current item's section (for checking reduction constraints)
   * @param canReduceCurrent - Whether current item can be reduced
   * @param getColSpan - Function to get default column span
   * @param totalColumns - Total columns in grid
   * @returns Object with fit status, required span, and optional reduced current span
   */
  private canFitInRemainingSpace(
    section: CardSection,
    remainingCols: number,
    currentSpan: number,
    currentItemSection: CardSection,
    canReduceCurrent: boolean,
    getColSpan: (section: CardSection, columns: number) => number,
    totalColumns: number
  ): { fits: boolean; requiredSpan: number; currentSpanAfterReduce?: number } {
    // Get minimum viable span for next item
    const minSpan = section.minColumns || 1;
    const preferredSpan = section.preferredColumns || getColSpan(section, totalColumns);

    // Check if it fits directly
    if (minSpan <= remainingCols) {
      return {
        fits: true,
        requiredSpan: Math.min(preferredSpan, remainingCols),
      };
    }

    // Check if reducing current item would help
    if (canReduceCurrent) {
      const currentMin = currentItemSection.minColumns || 1;
      const canReduceBy = currentSpan - currentMin;
      const newRemaining = remainingCols + canReduceBy;

      if (minSpan <= newRemaining) {
        return {
          fits: true,
          requiredSpan: Math.min(preferredSpan, newRemaining),
          currentSpanAfterReduce: Math.max(currentMin, currentSpan - (minSpan - remainingCols)),
        };
      }
    }

    return { fits: false, requiredSpan: 0 };
  }

  /**
   * Generate combinations of items (helper for evaluateFillCombinations)
   */
  private generateCombinations<T>(items: T[], count: number): T[][] {
    if (count === 0) return [[]];
    if (count > items.length) return [];

    const results: T[][] = [];

    for (let i = 0; i <= items.length - count; i++) {
      const head = items[i];
      if (head === undefined) continue;
      const tailCombos = this.generateCombinations(items.slice(i + 1), count - 1);
      for (const tail of tailCombos) {
        results.push([head, ...tail]);
      }
    }

    return results;
  }

  /**
   * Evaluate combinations of items to fill remaining columns
   * Returns the best combination that fits within remaining space
   *
   * @param candidates - Candidate items to evaluate
   * @param remainingCols - Columns remaining to fill
   * @param currentPriorityGroup - Priority group of current item
   * @param totalColumns - Total columns in grid
   * @returns Best fill combination or null
   */
  private evaluateFillCombinations(
    candidates: Array<{
      item: { section: CardSection; element: HTMLElement; index: number };
      preferredSpan: number;
      minSpan: number;
      maxSpan: number;
    }>,
    remainingCols: number,
    currentPriorityGroup: number,
    totalColumns: number
  ): {
    items: Array<{
      item: { section: CardSection; element: HTMLElement; index: number };
      span: number;
    }>;
    score: number;
  } | null {
    if (candidates.length === 0 || remainingCols === 0) {
      return null;
    }

    let bestCombination: {
      items: Array<{
        item: { section: CardSection; element: HTMLElement; index: number };
        span: number;
      }>;
      score: number;
    } | null = null;
    let bestScore = -1;

    const maxItems = Math.min(candidates.length, remainingCols);

    for (let itemCount = 1; itemCount <= maxItems; itemCount++) {
      const combinations = this.generateCombinations(candidates, itemCount);

      for (const combo of combinations) {
        const totalMinSpan = combo.reduce((sum, c) => sum + c.minSpan, 0);
        const totalMaxSpan = combo.reduce((sum, c) => sum + Math.min(c.maxSpan, remainingCols), 0);

        // Must fit within remaining columns
        if (totalMinSpan > remainingCols || totalMaxSpan < remainingCols) continue;

        // Distribute spans more intelligently
        const items: Array<{
          item: { section: CardSection; element: HTMLElement; index: number };
          span: number;
        }> = [];
        const canGrowFlags = combo.map((c) => c.item.section.canGrow !== false);
        const canShrinkFlags = combo.map((c) => c.item.section.canShrink !== false);

        // First pass: assign preferred spans where possible
        const preferredSpans: number[] = [];
        let preferredTotal = 0;

        for (let i = 0; i < combo.length; i++) {
          const candidate = combo[i];
          if (!candidate) continue;

          let preferred = candidate.preferredSpan;
          preferred = Math.max(preferred, candidate.minSpan);
          preferred = Math.min(preferred, candidate.maxSpan);
          preferred = Math.min(preferred, remainingCols); // Can't exceed total

          preferredSpans.push(preferred);
          preferredTotal += preferred;
        }

        // Adjust if total doesn't match remainingCols
        let adjustment = remainingCols - preferredTotal;
        let remaining = remainingCols;

        for (let i = 0; i < combo.length; i++) {
          const candidate = combo[i];
          if (!candidate) continue;

          const preferredSpan = preferredSpans[i];
          if (preferredSpan === undefined) continue;

          let span = preferredSpan;
          const isLast = i === combo.length - 1;

          if (adjustment > 0 && canGrowFlags[i]) {
            // Can grow - increase within maxSpan
            const canGrowBy = Math.min(candidate.maxSpan - span, adjustment);
            span += canGrowBy;
            adjustment -= canGrowBy;
          } else if (adjustment < 0 && canShrinkFlags[i]) {
            // Can shrink - decrease within minSpan
            const canShrinkBy = Math.min(span - candidate.minSpan, -adjustment);
            span -= canShrinkBy;
            adjustment += canShrinkBy;
          } else if (isLast) {
            // Last item gets remainder (only if it can accommodate)
            span += adjustment;
            adjustment = 0;
          }

          // Clamp to valid range
          span = Math.max(candidate.minSpan, Math.min(span, candidate.maxSpan));
          span = Math.min(span, remaining);

          if (span >= candidate.minSpan && span <= candidate.maxSpan && span > 0) {
            items.push({ item: candidate.item, span });
            remaining -= span;
          } else {
            break; // Invalid span, skip this combination
          }
        }

        // Verify all items placed and space filled exactly
        if (items.length === combo.length && remaining === 0) {
          const sameGroupCount = items.filter(
            (i) => this.getPriorityGroup(i.item.section) === currentPriorityGroup
          ).length;
          const totalPreferredSpan = combo.reduce((sum, c) => sum + c.preferredSpan, 0);

          // Score: prefer same-group, prefer more items, penalize deviation from preferred
          const score =
            sameGroupCount * 100 +
            items.length * 10 -
            Math.abs(totalPreferredSpan - remainingCols) * 0.5;

          if (score > bestScore) {
            bestScore = score;
            bestCombination = { items, score };
          }
        }
      }
    }

    return bestCombination;
  }

  /**
   * Try to fill remaining columns after placing an item
   * Evaluates options: extend current item, place next item from same group, or reduce and place
   *
   * @param currentItem - Current item being placed
   * @param currentSpan - Current span of the item
   * @param placementCol - Column where current item is being placed
   * @param totalColumns - Total columns in grid
   * @param arrangedSections - All arranged sections
   * @param currentIndex - Current item index
   * @param placedIndices - Set of indices that have already been placed
   * @param getColSpan - Function to get default column span
   * @returns Strategy decision with action type and optional adjustments
   */
  private tryFillRemainingColumns(
    currentItem: { section: CardSection; element: HTMLElement; index: number },
    currentSpan: number,
    placementCol: number,
    totalColumns: number,
    arrangedSections: Array<{ section: CardSection; element: HTMLElement; index: number }>,
    currentIndex: number,
    placedIndices: Set<number>,
    getColSpan: (section: CardSection, columns: number) => number
  ): {
    action: 'extend' | 'place_next' | 'place_multiple' | 'reduce_and_place' | 'none';
    adjustedSpan?: number;
    nextItem?: { section: CardSection; element: HTMLElement; index: number };
    nextItems?: Array<{
      item: { section: CardSection; element: HTMLElement; index: number };
      span: number;
    }>;
  } {
    const remainingCols = this.calculateRemainingColumns(placementCol, currentSpan, totalColumns);

    // No remaining columns, nothing to fill
    if (remainingCols === 0) {
      return { action: 'none' };
    }

    const currentPriorityGroup = this.getPriorityGroup(currentItem.section);

    // Strategy 1: Try multiple items (preferred for better utilization)
    if (remainingCols >= 2) {
      const candidates = this.findFillableItems(
        arrangedSections,
        currentIndex,
        currentPriorityGroup,
        remainingCols,
        4, // Look ahead up to 4 items
        placedIndices,
        getColSpan,
        totalColumns
      );

      const multiFill = this.evaluateFillCombinations(
        candidates,
        remainingCols,
        currentPriorityGroup,
        totalColumns
      );

      // Only prefer multi-item if it uses 2+ items AND has good score
      if (multiFill && multiFill.items.length > 1 && multiFill.score > 50) {
        return {
          action: 'place_multiple',
          adjustedSpan: currentSpan,
          nextItems: multiFill.items,
        };
      }
    }

    // Strategy 2: Try placing next item from same group (fallback to current behavior)
    const nextItem = this.findNextItemInSameGroup(
      arrangedSections,
      currentIndex,
      currentPriorityGroup
    );

    if (nextItem) {
      const canReduce = currentItem.section.canShrink !== false;
      const fitCheck = this.canFitInRemainingSpace(
        nextItem.section,
        remainingCols,
        currentSpan,
        currentItem.section,
        canReduce,
        getColSpan,
        totalColumns
      );

      if (fitCheck.fits) {
        if (fitCheck.currentSpanAfterReduce) {
          return {
            action: 'reduce_and_place',
            adjustedSpan: fitCheck.currentSpanAfterReduce,
            nextItem: nextItem,
          };
        } else {
          return {
            action: 'place_next',
            adjustedSpan: currentSpan,
            nextItem: nextItem,
          };
        }
      }
    }

    // Strategy 3: Extend current item to fill remaining space
    if (currentItem.section.canGrow !== false) {
      const maxCols = Math.min(currentItem.section.maxColumns || totalColumns, totalColumns);
      const maxAvailableSpan = totalColumns - placementCol;
      const extendedSpan = Math.min(currentSpan + remainingCols, maxCols, maxAvailableSpan);

      if (extendedSpan > currentSpan) {
        return {
          action: 'extend',
          adjustedSpan: extendedSpan,
        };
      }
    }

    return { action: 'none' };
  }

  /**
   * Calculate final container height based on transforms
   */
  calculateContainerHeight(transforms: Map<string, TransformPosition>): number {
    let maxHeight = 0;

    for (const position of transforms.values()) {
      if (position.finalTop > maxHeight) {
        maxHeight = position.finalTop;
      }
    }

    return maxHeight;
  }

  /**
   * Generate stable key for section
   */
  private getSectionKey(section: CardSection, index: number): string {
    if (section.id) {
      return section.id;
    }
    return `${section.title || 'section'}-${section.type || 'default'}-${index}`;
  }

  /**
   * Get width options around preferred width for a section
   * Generates valid width variations (preferred ± 1) respecting constraints
   *
   * @param section - Section to get width options for
   * @param totalColumns - Total columns available in the grid
   * @param getColSpan - Function to get default column span for a section
   * @returns Array of valid width options
   */
  private getWidthOptions(
    section: CardSection,
    totalColumns: number,
    getColSpan: (section: CardSection, columns: number) => number
  ): number[] {
    // 1. Explicit colSpan - no variation allowed
    if (section.colSpan && section.colSpan > 0) {
      return [Math.min(section.colSpan, totalColumns)];
    }

    // 2. Determine preferred width
    const preferred = section.preferredColumns || getColSpan(section, totalColumns);
    const minCols = section.minColumns || 1;
    const maxCols = Math.min(section.maxColumns || totalColumns, totalColumns);

    // 3. Generate options: preferred, preferred-1, preferred+1 (if valid)
    const options: number[] = [];

    // Always include preferred if valid
    if (preferred >= minCols && preferred <= maxCols && preferred <= totalColumns) {
      options.push(preferred);
    }

    // Include preferred - 1 if valid and can shrink
    if (section.canShrink !== false) {
      const smaller = preferred - 1;
      if (smaller >= minCols && smaller <= maxCols && smaller >= 1) {
        options.push(smaller);
      }
    }

    // Include preferred + 1 if valid and can grow
    if (section.canGrow !== false) {
      const larger = preferred + 1;
      if (larger >= minCols && larger <= maxCols && larger <= totalColumns) {
        options.push(larger);
      }
    }

    // Ensure at least one option
    if (options.length === 0) {
      return [Math.max(1, Math.min(preferred, totalColumns))];
    }

    // Remove duplicates and sort (prefer closer to preferred)
    const uniqueOptions = Array.from(new Set(options));
    return uniqueOptions.sort((a, b) => {
      const distA = Math.abs(a - preferred);
      const distB = Math.abs(b - preferred);
      return distA - distB;
    });
  }

  /**
   * Calculate diversity bonus for a width option
   * Rewards widths that haven't been used recently to create visual variety
   *
   * @param spanOption - Width option to evaluate
   * @param recentWidths - Array of recently used widths (last N widths)
   * @returns Bonus score (higher = more diversity)
   */
  private calculateDiversityBonus(spanOption: number, recentWidths: number[]): number {
    if (recentWidths.length === 0) {
      return 0; // No history, no bonus
    }

    // Count occurrences of this width in recent history
    const occurrences = recentWidths.filter((w) => w === spanOption).length;
    const recentCount = recentWidths.length;

    // Check if all recent widths are the same (uniform pattern)
    // If so, boost diversity bonus to break the pattern
    const allSame = recentCount > 1 && recentWidths.every((w) => w === recentWidths[0]);
    const diversityMultiplier = allSame ? 1.5 : 1.0; // Boost bonus when pattern is uniform

    // Base bonus calculation
    const baseBonus = (1 - occurrences / recentCount) * 30;
    return baseBonus * diversityMultiplier;
  }

  /**
   * Find the best column position for a given span
   * Prefers shortest column that can fit the span, starting from currentColumn
   *
   * @param preferredSpan - Preferred column span
   * @param totalColumns - Total columns in grid
   * @param colHeights - Current column heights array
   * @param startColumn - Starting column to check from
   * @returns Best column position
   */
  private findBestColumnPosition(
    preferredSpan: number,
    totalColumns: number,
    colHeights: number[],
    startColumn: number
  ): number {
    // Check if preferred span fits at start position
    if (startColumn + preferredSpan <= totalColumns) {
      const startTop = this.calculateTopPosition(startColumn, preferredSpan, colHeights);

      // Check if there's a significantly shorter position (20px+ difference)
      let bestCol = startColumn;
      let bestTop = startTop;

      // Check all valid positions (simple linear scan, no nested loops)
      for (let col = 0; col <= totalColumns - preferredSpan; col++) {
        const top = this.calculateTopPosition(col, preferredSpan, colHeights);
        if (top < bestTop - 20) {
          // Found a significantly better position
          bestCol = col;
          bestTop = top;
        }
      }

      return bestCol;
    }

    // Preferred span doesn't fit at start, find first valid position
    for (let col = 0; col <= totalColumns - preferredSpan; col++) {
      if (col + preferredSpan <= totalColumns) {
        return col;
      }
    }

    // Fallback: return start position
    return startColumn;
  }

  /**
   * Calculate top position for a given span at a column position
   *
   * @param col - Starting column index
   * @param span - Column span
   * @param colHeights - Current column heights array
   * @returns Top position (max height of columns in span)
   */
  private calculateTopPosition(col: number, span: number, colHeights: number[]): number {
    let maxHeight = 0;
    for (let c = col; c < col + span && c < colHeights.length; c++) {
      maxHeight = Math.max(maxHeight, colHeights[c] ?? 0);
    }
    return maxHeight;
  }

  /**
   * Calculate remaining columns in the current row after placing an item
   *
   * @param col - Starting column index
   * @param span - Column span of the item
   * @param totalColumns - Total columns in the grid
   * @returns Number of columns remaining in the current row (0 if item wraps to new row)
   */
  private calculateRemainingColumns(col: number, span: number, totalColumns: number): number {
    const endCol = col + span;
    if (endCol > totalColumns) {
      // Item wraps to next row, so current row has no remaining columns
      return 0;
    }
    // Remaining columns in current row
    return totalColumns - endCol;
  }

  /**
   * Calculate wasted space (gaps created under item when columns have different heights)
   *
   * @param col - Starting column index
   * @param span - Column span
   * @param colHeights - Current column heights array
   * @returns Sum of gaps under the item (zero if all columns are same height)
   */
  private calculateWastedSpace(col: number, span: number, colHeights: number[]): number {
    const spanCols: number[] = [];
    for (let c = col; c < col + span && c < colHeights.length; c++) {
      spanCols.push(colHeights[c] ?? 0);
    }

    if (spanCols.length === 0) return 0;

    const maxHeight = Math.max(...spanCols);
    // Sum of gaps: (maxHeight - each column height) for columns shorter than max
    const wastedSpace = spanCols.reduce((sum, h) => sum + (maxHeight - h), 0);
    return wastedSpace;
  }

  /**
   * Calculate height variance for columns in a span
   * Lower variance = more balanced = better
   *
   * @param col - Starting column index
   * @param span - Column span
   * @param colHeights - Current column heights array
   * @returns Height variance (standard deviation approximation)
   */
  private calculateHeightVariance(col: number, span: number, colHeights: number[]): number {
    const spanCols: number[] = [];
    for (let c = col; c < col + span && c < colHeights.length; c++) {
      spanCols.push(colHeights[c] ?? 0);
    }

    if (spanCols.length === 0) return 0;
    if (spanCols.length === 1) return 0;

    const avg = spanCols.reduce((sum, h) => sum + h, 0) / spanCols.length;
    const variance = spanCols.reduce((sum, h) => sum + Math.pow(h - avg, 2), 0) / spanCols.length;
    return Math.sqrt(variance); // Standard deviation
  }

  /**
   * Determine if we should try to fill the last row
   * Returns true when processing one of the last 2-3 items and there's remaining space
   *
   * @param currentIndex - Current item index
   * @param totalItems - Total number of items
   * @param remainingCols - Columns remaining in current row after placing current item
   * @param remainingItems - Number of items remaining to be placed
   * @returns True if we should attempt to fill the last row
   */
  private shouldFillLastRow(
    currentIndex: number,
    totalItems: number,
    remainingCols: number,
    remainingItems: number
  ): boolean {
    // Only consider last 3 items
    if (currentIndex < totalItems - 3) {
      return false;
    }

    // If no remaining columns, nothing to fill
    if (remainingCols === 0) {
      return false;
    }

    // If this is the last item and there are remaining columns, definitely try to fill
    if (remainingItems === 0 && remainingCols > 0) {
      return true;
    }

    // For last 2-3 items, try to fill if remaining space is significant
    // Only fill if remaining items can reasonably fill remaining columns
    if (remainingItems > 0 && remainingItems <= 3) {
      // If remaining space is small (< 2 columns), it's worth trying to fill
      // If remaining space is larger, let remaining items handle it naturally
      return remainingCols <= 2 || remainingItems === 1;
    }

    return false;
  }

  /**
   * Calculate optimal span for last row filling
   * Adjusts span to fill remaining columns while respecting section constraints
   *
   * @param section - Section to adjust
   * @param placementCol - Current column position
   * @param remainingCols - Columns remaining in current row
   * @param totalColumns - Total columns in grid
   * @param getColSpan - Function to get default column span
   * @returns Adjusted span that fills remaining columns (or original if can't expand)
   */
  private calculateOptimalSpanForLastRow(
    section: CardSection,
    placementCol: number,
    remainingCols: number,
    totalColumns: number,
    getColSpan: (section: CardSection, columns: number) => number
  ): number {
    // Don't modify explicit colSpan
    if (section.colSpan && section.colSpan > 0) {
      return section.colSpan;
    }

    // If section can't grow, return current preferred
    if (section.canGrow === false) {
      return section.preferredColumns || getColSpan(section, totalColumns);
    }

    // Calculate current/preferred span
    const currentSpan = section.preferredColumns || getColSpan(section, totalColumns);
    const maxCols = Math.min(section.maxColumns || totalColumns, totalColumns);

    // Calculate target span to fill remaining columns
    const targetSpan = currentSpan + remainingCols;
    const maxAllowedSpan = totalColumns - placementCol; // Can't exceed available columns

    // Use the smaller of: target span, max columns constraint, or available columns
    const adjustedSpan = Math.min(targetSpan, maxCols, maxAllowedSpan);

    // Ensure it's at least the current span (only expand, don't shrink)
    return Math.max(adjustedSpan, currentSpan);
  }

  /**
   * Get optimal column span for a section considering space fit and diversity
   * Evaluates width options and chooses the best one
   *
   * @param section - Section to get optimal span for
   * @param currentColumn - Current column position
   * @param totalColumns - Total columns available
   * @param colHeights - Current column heights
   * @param recentWidths - Recently used widths for diversity
   * @param getColSpan - Function to get default column span
   * @returns Optimal span choice
   */
  private getOptimalSpan(
    section: CardSection,
    currentColumn: number,
    totalColumns: number,
    colHeights: number[],
    recentWidths: number[],
    getColSpan: (section: CardSection, columns: number) => number
  ): number {
    // Get width options around preferred
    const widthOptions = this.getWidthOptions(section, totalColumns, getColSpan);

    // Determine preferred width for penalty calculation
    const preferredWidth = section.preferredColumns || getColSpan(section, totalColumns);

    // Early exit: Check for perfect fit with preferred width first
    const preferredOption = widthOptions.find((opt) => opt === preferredWidth);
    if (preferredOption && currentColumn + preferredOption <= totalColumns) {
      const wastedSpace = this.calculateWastedSpace(currentColumn, preferredOption, colHeights);
      if (wastedSpace === 0) {
        // Perfect fit: zero wasted space and preferred width - use it immediately
        return preferredOption;
      }
    }

    // Evaluate each option
    let bestOption = widthOptions[0]!;
    let bestScore = Infinity;

    for (const spanOption of widthOptions) {
      // Check if span fits at current column
      if (currentColumn + spanOption > totalColumns) {
        continue; // Doesn't fit, skip
      }

      // Calculate fit score (lower top position = better fit)
      const topPosition = this.calculateTopPosition(currentColumn, spanOption, colHeights);

      // Include wasted space in fit score (gaps created under item)
      const wastedSpace = this.calculateWastedSpace(currentColumn, spanOption, colHeights);

      // Prefer placements that reduce height variance (better balance)
      const heightVariance = this.calculateHeightVariance(currentColumn, spanOption, colHeights);
      const fitScore = topPosition + wastedSpace * 0.5 + heightVariance * 0.3; // Small weight for wasted space and variance

      // Diversity bonus (prefer widths that create variety)
      const diversityBonus = this.calculateDiversityBonus(spanOption, recentWidths);

      // Preference penalty (small penalty for deviating from preferred)
      const preferencePenalty = Math.abs(spanOption - preferredWidth) * 5;

      // Total score (lower is better)
      const totalScore = fitScore - diversityBonus + preferencePenalty;

      if (totalScore < bestScore) {
        bestScore = totalScore;
        bestOption = spanOption;
      }
    }

    return bestOption;
  }
}
