/**
 * Smart Grid Utilities
 * 
 * Advanced layout algorithms for the masonry grid system including:
 * - 2D bin-packing for optimal section placement
 * - Gap-filling tetris-like algorithm
 * - Content density measurement
 * - Priority-based condensation
 */

import { CardSection, CardField } from '../models/card.model';
import { gridLogger, GapAnalysis, ColumnAnalysis, PlacementDecision } from './smart-grid-logger.util';

// Local implementation of calculateSmartColumns (previously from section-layout-registry)
function calculateSmartColumnsLocal(section: CardSection, maxColumns: number): number {
  const type = section.type || 'info';
  const width = section.width as number | undefined;
  
  // If width is explicitly set, use it
  if (typeof width === 'number' && width >= 1 && width <= maxColumns) {
    return Math.min(width, maxColumns);
  }
  
  // Default column spans based on section type
  const defaultSpans: Record<string, number> = {
    'overview': 2,
    'contact-card': 1,
    'network-card': 1,
    'analytics': 2,
    'stats': 1,
    'chart': 2,
    'map': 2,
    'financials': 2,
    'info': 1,
    'list': 1,
    'event': 1,
    'timeline': 2,
    'news': 1,
    'product': 1,
    'quotation': 1,
    'solutions': 2,
    'social-media': 1,
    'text-reference': 1,
    'brand-colors': 1
  };
  
  return Math.min(defaultSpans[type] || 1, maxColumns);
}

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Section with calculated layout metadata
 */
export interface SectionWithMetrics {
  section: CardSection;
  estimatedHeight: number;
  colSpan: number;
  priority: number;
  density: number;
  groupId?: string;
  // Placement info (set during packing)
  column?: number;
  row?: number;
  top?: number;
}

/**
 * Position in the 2D grid
 */
export interface GridPosition {
  column: number;
  row: number;
  top: number;
}

/**
 * Bin in the bin-packing algorithm
 */
export interface Bin {
  sections: SectionWithMetrics[];
  totalWidth: number;  // In columns
  maxHeight: number;   // In pixels (estimated)
}

/**
 * Virtual row for grid alignment
 */
export interface VirtualRow {
  index: number;
  topOffset: number;
  height: number;
  sections: SectionWithMetrics[];
  remainingCapacity: number;
}

/**
 * Layout result from bin-packing
 */
export interface LayoutResult {
  sections: SectionWithMetrics[];
  rows: VirtualRow[];
  totalHeight: number;
  gapCount: number;
  utilizationPercent: number;
  balanceScore: number;
}

// Import types from services to avoid duplication
import { PriorityBand, PriorityBandConfig, PRIORITY_BANDS } from '../services/section-normalization.service';

// ============================================================================
// CONSTANTS
// ============================================================================

// PRIORITY_BANDS is imported from section-normalization.service

/**
 * Default height estimates per section type (in pixels)
 */
export const SECTION_HEIGHT_ESTIMATES: Record<string, number> = {
  'overview': 180,
  'contact-card': 160,
  'network-card': 160,
  'analytics': 200,
  'stats': 180,
  'chart': 280,
  'map': 250,
  'financials': 200,
  'info': 180,
  'list': 220,
  'event': 240,
  'timeline': 240,
  'product': 260,
  'solutions': 240,
  'quotation': 160,
  'text-reference': 180,
  'default': 180,
};

/**
 * Height per item/field (in pixels)
 */
export const HEIGHT_PER_ITEM = 50;
export const HEIGHT_PER_FIELD = 32;
export const SECTION_HEADER_HEIGHT = 48;
export const SECTION_PADDING = 20;

// ============================================================================
// CONTENT DENSITY MEASUREMENT
// ============================================================================

/**
 * Measures the content density of a section
 * Higher density indicates more content that may need more space
 * 
 * @param section - The section to measure
 * @returns Density score (0-100+)
 */
export function measureContentDensity(section: CardSection): number {
  const textLength = (section.description?.length ?? 0) + 
    (section.fields?.reduce((acc: number, f: CardField) => acc + String(f.value ?? '').length + (f.label?.length ?? 0), 0) ?? 0);
  const itemCount = section.items?.length ?? 0;
  const fieldCount = section.fields?.length ?? 0;
  
  // Calculate density score
  const textScore = textLength / 50;  // 1 point per 50 chars
  const itemScore = itemCount * 3;     // 3 points per item
  const fieldScore = fieldCount * 2;   // 2 points per field
  
  return Math.round(textScore + itemScore + fieldScore);
}

/**
 * Calculates optimal column span based on content density and type
 * Uses the section layout registry for type-based defaults.
 * 
 * @param section - The section to calculate for
 * @param maxColumns - Maximum available columns
 * @returns Recommended column span (1-4)
 */
export function calculateOptimalColumns(
  section: CardSection, 
  maxColumns: number = 4
): number {
  // Use the smart column calculation
  return calculateSmartColumnsLocal(section, maxColumns);
}

// ============================================================================
// HEIGHT ESTIMATION
// ============================================================================

/**
 * Estimates the height of a section based on its content
 * 
 * @param section - The section to estimate
 * @returns Estimated height in pixels
 */
export function estimateSectionHeight(section: CardSection): number {
  const type = section.type?.toLowerCase() ?? 'default';
  const baseHeight = SECTION_HEIGHT_ESTIMATES[type] ?? SECTION_HEIGHT_ESTIMATES['default'] ?? 120;
  
  const itemCount = section.items?.length ?? 0;
  const fieldCount = section.fields?.length ?? 0;
  
  // Calculate content-based height
  const itemsHeight = itemCount * HEIGHT_PER_ITEM;
  const fieldsHeight = fieldCount * HEIGHT_PER_FIELD;
  const contentHeight = Math.max(itemsHeight, fieldsHeight);
  
  // Use the larger of base height or content-based height
  const estimatedHeight = Math.max(
    baseHeight as number,
    SECTION_HEADER_HEIGHT + contentHeight + SECTION_PADDING
  );
  
  // Cap at reasonable maximum
  return Math.min(estimatedHeight, 500);
}

// ============================================================================
// PRIORITY CALCULATION
// ============================================================================

/**
 * Gets the priority band for a section
 * 
 * @param section - The section to evaluate
 * @returns The priority band
 */
export function getSectionPriorityBand(section: CardSection): PriorityBand {
  // First check explicit priority
  if (section.priority) {
    return section.priority;
  }
  
  // Then check type-based defaults
  const type = section.type?.toLowerCase() ?? '';
  
  for (const [band, config] of Object.entries(PRIORITY_BANDS)) {
    if (config.types.includes(type)) {
      return band as PriorityBand;
    }
  }
  
  return 'standard';
}

/**
 * Calculates numeric priority score for sorting (lower = higher priority)
 * 
 * @param section - The section to evaluate
 * @returns Numeric priority (1-4)
 */
export function calculatePriorityScore(section: CardSection): number {
  const band = getSectionPriorityBand(section);
  return PRIORITY_BANDS[band].order;
}

// ============================================================================
// IMPROVED 2D BIN-PACKING ALGORITHM
// ============================================================================

/**
 * Improved 2D bin-packing algorithm using First Fit Decreasing Height (FFDH)
 * Places sections optimally to minimize gaps and maximize space utilization
 * 
 * @param sections - Sections to pack
 * @param columns - Number of available columns
 * @param options - Packing options
 * @returns Packed sections with placement info
 */
export function binPack2D(
  sections: CardSection[],
  columns: number,
  options: {
    respectPriority?: boolean;
    fillGaps?: boolean;
    balanceColumns?: boolean;
  } = {}
): SectionWithMetrics[] {
  const { 
    respectPriority = true, 
    fillGaps = true,
    balanceColumns = true
  } = options;

  if (sections.length === 0 || columns <= 0) {
    return [];
  }

  gridLogger.startSession({
    columns,
    containerWidth: columns * 260,
    sectionCount: sections.length
  });

  // Step 1: Calculate metrics for all sections
  gridLogger.startPhase('measure');
  const sectionsWithMetrics: SectionWithMetrics[] = sections.map(section => ({
    section,
    estimatedHeight: estimateSectionHeight(section),
    colSpan: calculateOptimalColumns(section, columns),
    priority: calculatePriorityScore(section),
    density: measureContentDensity(section),
    groupId: section.groupId,
  }));
  gridLogger.endPhase('measure', `${sectionsWithMetrics.length} sections measured`);

  // Step 2: Sort by priority, then by height (FFDH - taller items first)
  gridLogger.startPhase('sort');
  if (respectPriority) {
    sectionsWithMetrics.sort((a, b) => {
      // Primary: priority (lower = more important)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // Secondary: height descending (taller first for better packing)
      return b.estimatedHeight - a.estimatedHeight;
    });
  } else {
    // Sort by height descending for optimal packing
    sectionsWithMetrics.sort((a, b) => b.estimatedHeight - a.estimatedHeight);
  }
  
  gridLogger.logSortOrder(sectionsWithMetrics.map(s => ({
    title: s.section.title ?? 'Untitled',
    type: s.section.type ?? 'unknown',
    priority: s.priority,
    colSpan: s.colSpan
  })));
  gridLogger.endPhase('sort');

  // Step 3: Pack sections into rows using shelf algorithm
  gridLogger.startPhase('pack');
  const rows = packIntoRows(sectionsWithMetrics, columns, fillGaps);
  gridLogger.endPhase('pack', `${rows.length} rows created`);

  // Step 4: Calculate positions
  gridLogger.startPhase('place');
  const result = calculatePositions(rows, columns);
  gridLogger.endPhase('place', `${result.length} sections positioned`);

  // Step 5: Balance columns if needed
  if (balanceColumns) {
    gridLogger.startPhase('balance');
    balanceColumnLoads(result, columns);
    const columnHeights = calculateColumnHeights(result, columns);
    gridLogger.logColumnBalance({
      heights: columnHeights,
      variance: calculateVariance(columnHeights),
      maxDiff: Math.max(...columnHeights) - Math.min(...columnHeights),
      balanceScore: calculateBalanceScore(columnHeights)
    });
    gridLogger.endPhase('balance');
  }

  // Step 6: Analyze gaps
  gridLogger.startPhase('gap-fill');
  const gapAnalysis = analyzeGaps(result, columns);
  gridLogger.logGapAnalysis(gapAnalysis);
  gridLogger.endPhase('gap-fill');

  gridLogger.endSession();

  return result;
}

/**
 * Pack sections into rows using First Fit Decreasing
 */
function packIntoRows(
  sections: SectionWithMetrics[],
  columns: number,
  fillGaps: boolean
): VirtualRow[] {
  const rows: VirtualRow[] = [];
  const unplaced = [...sections];
  let rowIndex = 0;
  let currentTop = 0;

  while (unplaced.length > 0) {
    const row: VirtualRow = {
      index: rowIndex,
      topOffset: currentTop,
      height: 0,
      sections: [],
      remainingCapacity: columns
    };

    // First pass: place sections that fit
    let i = 0;
    while (i < unplaced.length && row.remainingCapacity > 0) {
      const section = unplaced[i];
      if (!section) {
        i++;
        continue;
      }
      
      // Clamp colSpan to available capacity
      const effectiveColSpan = Math.min(section.colSpan, row.remainingCapacity);
      
      if (effectiveColSpan > 0) {
        // Place section
        section.colSpan = effectiveColSpan;
        section.column = columns - row.remainingCapacity;
        section.row = rowIndex;
        section.top = currentTop;
        
        row.sections.push(section);
        row.remainingCapacity -= effectiveColSpan;
        row.height = Math.max(row.height, section.estimatedHeight);
        
        unplaced.splice(i, 1);
        
        gridLogger.logPlacement({
          sectionId: section.section.id ?? section.section.title ?? '',
          sectionType: section.section.type ?? 'unknown',
          title: section.section.title ?? 'Untitled',
          requestedColSpan: sections.find(s => s.section === section.section)?.colSpan ?? effectiveColSpan,
          actualColSpan: effectiveColSpan,
          column: section.column,
          row: rowIndex,
          top: currentTop,
          reason: row.remainingCapacity === 0 ? 'Exact fit' : 'First fit'
        });
      } else {
        i++;
      }
    }

    // Second pass: try to fill remaining space with smaller sections
    if (fillGaps && row.remainingCapacity > 0) {
      for (let j = 0; j < unplaced.length && row.remainingCapacity > 0; j++) {
        const section = unplaced[j];
        if (!section) continue;
        
        if (section.colSpan <= row.remainingCapacity) {
          section.column = columns - row.remainingCapacity;
          section.row = rowIndex;
          section.top = currentTop;
          
          row.sections.push(section);
          row.remainingCapacity -= section.colSpan;
          row.height = Math.max(row.height, section.estimatedHeight);
          
          unplaced.splice(j, 1);
          j--;
          
          gridLogger.logPlacement({
            sectionId: section.section.id ?? section.section.title ?? '',
            sectionType: section.section.type ?? 'unknown',
            title: section.section.title ?? 'Untitled',
            requestedColSpan: section.colSpan,
            actualColSpan: section.colSpan,
            column: section.column,
            row: rowIndex,
            top: currentTop,
            reason: 'Gap fill'
          });
        }
      }
    }

    // Log row completion
    gridLogger.logRowBuilt(
      rowIndex,
      row.sections.map(s => ({ title: s.section.title ?? 'Untitled', colSpan: s.colSpan })),
      row.remainingCapacity
    );

    // Safety: if no section was placed, force place the first one
    if (row.sections.length === 0 && unplaced.length > 0) {
      const section = unplaced.shift()!;
      section.colSpan = Math.min(section.colSpan, columns);
      section.column = 0;
      section.row = rowIndex;
      section.top = currentTop;
      row.sections.push(section);
      row.height = section.estimatedHeight;
      row.remainingCapacity = columns - section.colSpan;
    }

    rows.push(row);
    currentTop += row.height;
    rowIndex++;
  }

  return rows;
}

/**
 * Calculate final positions for all sections
 */
function calculatePositions(rows: VirtualRow[], columns: number): SectionWithMetrics[] {
  const result: SectionWithMetrics[] = [];
  
  for (const row of rows) {
    for (const section of row.sections) {
      section.top = row.topOffset;
      result.push(section);
    }
  }
  
  return result;
}

/**
 * Balance column loads by adjusting section positions
 */
function balanceColumnLoads(sections: SectionWithMetrics[], columns: number): void {
  // Calculate current column heights
  const columnHeights = calculateColumnHeights(sections, columns);
  
  // Find imbalanced columns
  const avgHeight = columnHeights.reduce((a, b) => a + b, 0) / columns;
  const threshold = avgHeight * 0.2; // 20% tolerance
  
  // Try to move sections from tall columns to short columns
  for (let iter = 0; iter < 3; iter++) {
    const tallestCol = columnHeights.indexOf(Math.max(...columnHeights));
    const shortestCol = columnHeights.indexOf(Math.min(...columnHeights));
    
    const tallestHeight = columnHeights[tallestCol] ?? 0;
    const shortestHeight = columnHeights[shortestCol] ?? 0;
    
    if (tallestHeight - shortestHeight < threshold) {
      break; // Already balanced enough
    }
    
    // Find a section in the tallest column that could fit in the shortest
    const movableSection = sections.find(s => 
      s.column === tallestCol && 
      s.colSpan === 1 &&
      s.priority >= 3 // Only move low priority sections
    );
    
    if (movableSection && columnHeights[tallestCol] !== undefined && columnHeights[shortestCol] !== undefined) {
      movableSection.column = shortestCol;
      columnHeights[tallestCol] = columnHeights[tallestCol]! - movableSection.estimatedHeight;
      columnHeights[shortestCol] = columnHeights[shortestCol]! + movableSection.estimatedHeight;
    }
  }
}

/**
 * Calculate height of each column
 */
function calculateColumnHeights(sections: SectionWithMetrics[], columns: number): number[] {
  const heights = new Array(columns).fill(0);
  
  for (const section of sections) {
    const col = section.column ?? 0;
    const span = section.colSpan;
    const height = section.estimatedHeight;
    
    for (let c = col; c < Math.min(col + span, columns); c++) {
      heights[c] += height / span; // Distribute height across spanned columns
    }
  }
  
  return heights;
}

/**
 * Calculate variance of column heights
 */
function calculateVariance(heights: number[]): number {
  const avg = heights.reduce((a, b) => a + b, 0) / heights.length;
  const squaredDiffs = heights.map(h => Math.pow(h - avg, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / heights.length;
}

/**
 * Calculate balance score (0-100, higher is better)
 */
function calculateBalanceScore(heights: number[]): number {
  if (heights.length === 0) return 100;
  const max = Math.max(...heights);
  const min = Math.min(...heights);
  if (max === 0) return 100;
  return Math.max(0, 100 - ((max - min) / max) * 100);
}

/**
 * Analyze gaps in the layout
 */
function analyzeGaps(sections: SectionWithMetrics[], columns: number): GapAnalysis {
  // Calculate total used area
  let usedArea = 0;
  let maxHeight = 0;
  
  for (const section of sections) {
    usedArea += section.colSpan * section.estimatedHeight;
    const sectionBottom = (section.top ?? 0) + section.estimatedHeight;
    maxHeight = Math.max(maxHeight, sectionBottom);
  }
  
  const totalArea = columns * maxHeight;
  const gapArea = totalArea - usedArea;
  
  return {
    totalGaps: gapArea > 0 ? Math.ceil(gapArea / (260 * 100)) : 0,
    gapArea: Math.max(0, gapArea),
    gaps: [], // Detailed gaps would require more complex analysis
    utilizationPercent: totalArea > 0 ? (usedArea / totalArea) * 100 : 100
  };
}

// ============================================================================
// GAP-FILLING TETRIS ALGORITHM
// ============================================================================

/**
 * Identifies gaps in the current layout
 * 
 * @param positionedSections - Currently positioned sections
 * @param columns - Number of columns
 * @param containerHeight - Current container height
 * @returns Array of gap positions
 */
export function findGaps(
  positionedSections: Array<{ colSpan: number; left: string; top: number; width: string; height: number }>,
  columns: number,
  containerHeight: number
): Array<{ column: number; top: number; height: number; width: number }> {
  const gaps: Array<{ column: number; top: number; height: number; width: number }> = [];
  
  if (positionedSections.length === 0 || containerHeight === 0) {
    return gaps;
  }

  // Build occupancy grid
  const gridResolution = 10; // pixels
  const rows = Math.ceil(containerHeight / gridResolution);
  const grid: boolean[][] = Array.from({ length: rows }, () => 
    new Array(columns).fill(false)
  );
  
  // Mark occupied cells
  for (const section of positionedSections) {
    const startRow = Math.floor(section.top / gridResolution);
    const endRow = Math.ceil((section.top + section.height) / gridResolution);
    const startCol = parseColumnFromLeft(section.left, columns);
    const endCol = startCol + section.colSpan;
    
    for (let r = startRow; r < Math.min(endRow, rows); r++) {
      for (let c = startCol; c < Math.min(endCol, columns); c++) {
        const row = grid[r];
        if (row) {
          row[c] = true;
        }
      }
    }
  }
  
  // Find contiguous unoccupied regions
  for (let c = 0; c < columns; c++) {
    let gapStart: number | null = null;
    
    for (let r = 0; r < rows; r++) {
      const isOccupied = grid[r]?.[c] ?? false;
      
      if (!isOccupied && gapStart === null) {
        gapStart = r;
      } else if (isOccupied && gapStart !== null) {
        // Found end of gap
        const gapHeight = (r - gapStart) * gridResolution;
        if (gapHeight >= 50) { // Only count significant gaps
          gaps.push({
            column: c,
            top: gapStart * gridResolution,
            height: gapHeight,
            width: 1
          });
        }
        gapStart = null;
      }
    }
  }
  
  return gaps;
}

/**
 * Parse column index from CSS left value
 */
function parseColumnFromLeft(left: string, columns: number): number {
  // Handle calc() expressions or simple percentage
  const match = left.match(/(\d+)/);
  if (match && match[1]) {
    const value = parseInt(match[1], 10);
    // Estimate column from percentage or pixel value
    return Math.min(Math.floor(value / (100 / columns)), columns - 1);
  }
  return 0;
}

/**
 * Attempts to fill gaps by reordering sections
 * Uses a greedy approach to find sections that fit in gaps
 */
export function fillGapsWithSections(
  orderedSections: SectionWithMetrics[],
  columns: number
): SectionWithMetrics[] {
  const result: SectionWithMetrics[] = [];
  const pending: SectionWithMetrics[] = [...orderedSections];
  
  // Separate by flexibility
  const rigid = pending.filter(s => s.priority <= 2); // Critical/Important don't move
  const flexible = pending.filter(s => s.priority > 2);
  
  // Place rigid sections first
  result.push(...rigid);
  
  // Use first-fit decreasing for flexible sections
  const sortedFlexible = [...flexible].sort((a, b) => {
    // Prefer sections that can fill remaining row space
    const aFills = a.colSpan <= columns;
    const bFills = b.colSpan <= columns;
    if (aFills !== bFills) return aFills ? -1 : 1;
    return b.colSpan - a.colSpan;
  });
  
  // Build rows, preferring complete fills
  const rows: SectionWithMetrics[][] = [];
  let currentRow: SectionWithMetrics[] = [];
  let currentRowWidth = 0;
  
  for (const section of sortedFlexible) {
    if (currentRowWidth + section.colSpan <= columns) {
      currentRow.push(section);
      currentRowWidth += section.colSpan;
    } else {
      // Start new row
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }
      currentRow = [section];
      currentRowWidth = section.colSpan;
    }
  }
  
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }
  
  // Flatten rows back to array
  for (const row of rows) {
    result.push(...row);
  }
  
  return result;
}

// ============================================================================
// LAYOUT ANALYTICS
// ============================================================================

/**
 * Calculates layout quality metrics
 * 
 * @param sections - Positioned sections
 * @param columns - Number of columns
 * @param containerHeight - Container height
 * @returns Layout analytics
 */
export function calculateLayoutAnalytics(
  sections: SectionWithMetrics[],
  columns: number,
  containerHeight: number
): { gapCount: number; utilizationPercent: number; balanceScore: number } {
  // Calculate total section area
  const totalArea = sections.reduce((acc, s) => 
    acc + (s.colSpan * s.estimatedHeight), 0
  );
  
  // Calculate container area
  const containerArea = columns * containerHeight;
  
  // Utilization percentage
  const utilizationPercent = containerArea > 0 
    ? Math.round((totalArea / containerArea) * 100) 
    : 0;
  
  // Column balance (standard deviation of heights)
  const columnHeights = calculateColumnHeights(sections, columns);
  const balanceScore = calculateBalanceScore(columnHeights);
  
  // Gap count (simplified - based on utilization)
  const gapCount = Math.round((100 - utilizationPercent) / 10);
  
  return { gapCount, utilizationPercent, balanceScore };
}

// ============================================================================
// SECTION GROUPING
// ============================================================================

/**
 * Groups sections by their groupId for keeping related sections together
 */
export function groupRelatedSections(
  sections: SectionWithMetrics[]
): Map<string | undefined, SectionWithMetrics[]> {
  const groups = new Map<string | undefined, SectionWithMetrics[]>();
  
  for (const section of sections) {
    const groupId = section.groupId;
    const group = groups.get(groupId) ?? [];
    group.push(section);
    groups.set(groupId, group);
  }
  
  return groups;
}

/**
 * Flattens grouped sections while keeping groups together
 */
export function flattenGroups(
  groups: Map<string | undefined, SectionWithMetrics[]>
): SectionWithMetrics[] {
  const result: SectionWithMetrics[] = [];
  
  // Process ungrouped first
  const ungrouped = groups.get(undefined) ?? [];
  
  // Interleave ungrouped with grouped sections based on priority
  const groupedEntries = Array.from(groups.entries())
    .filter(([key]) => key !== undefined)
    .sort((a, b) => {
      const aPriority = Math.min(...a[1].map(s => s.priority));
      const bPriority = Math.min(...b[1].map(s => s.priority));
      return aPriority - bPriority;
    });
  
  // Merge based on priority
  let ungroupedIdx = 0;
  let groupedIdx = 0;
  
  while (ungroupedIdx < ungrouped.length || groupedIdx < groupedEntries.length) {
    const nextUngrouped = ungrouped[ungroupedIdx];
    const nextGroup = groupedEntries[groupedIdx];
    
    if (!nextGroup) {
      result.push(...ungrouped.slice(ungroupedIdx));
      break;
    }
    
    if (!nextUngrouped) {
      for (const [, group] of groupedEntries.slice(groupedIdx)) {
        result.push(...group);
      }
      break;
    }
    
    const ungroupedPriority = nextUngrouped.priority;
    const groupPriority = Math.min(...nextGroup[1].map(s => s.priority));
    
    if (ungroupedPriority <= groupPriority) {
      result.push(nextUngrouped);
      ungroupedIdx++;
    } else {
      result.push(...nextGroup[1]);
      groupedIdx++;
    }
  }
  
  return result;
}

// ============================================================================
// ENABLE DEBUG MODE
// ============================================================================

/**
 * Enable debug logging for the smart grid
 */
export function enableGridDebug(level: 'debug' | 'info' | 'warn' = 'debug'): void {
  gridLogger.configure({ level, enabled: true, consoleOutput: true });
}

/**
 * Disable debug logging
 */
export function disableGridDebug(): void {
  gridLogger.configure({ enabled: false });
}

/**
 * Get grid logger for external use
 */
export { gridLogger };
