/**
 * Row-First Space-Filling Packing Algorithm
 *
 * This algorithm prioritizes filling rows completely (zero white space) over
 * strictly respecting section preferred widths. Sections can be shrunk or
 * expanded to ensure each row is fully utilized.
 *
 * Design Philosophy:
 * 1. PRIMARY: Fill every row completely (no gaps)
 * 2. SECONDARY: Respect section priority (1-3)
 * 3. TERTIARY: Honor preferred column widths when possible
 *
 * @example
 * ```typescript
 * import { packSectionsIntoRows } from './row-packer.util';
 *
 * const rows = packSectionsIntoRows(sections, {
 *   totalColumns: 4,
 *   prioritizeSpaceFilling: true,
 *   allowShrinking: true,
 *   allowGrowing: true
 * });
 * ```
 */

import { CardSection, LayoutPriority, CardField } from '../models/card.model';
import {
  generateWidthExpression,
  generateLeftExpression,
  getMaxExpansion,
  EXPANSION_DENSITY_THRESHOLD
} from './grid-config.util';

// ============================================================================
// HEIGHT ESTIMATION (copied from smart-grid to avoid circular dependencies)
// ============================================================================

/**
 * Default height estimates per section type (in pixels)
 */
const SECTION_HEIGHT_ESTIMATES: Record<string, number> = {
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

const HEIGHT_PER_ITEM = 50;
const HEIGHT_PER_FIELD = 32;
const SECTION_HEADER_HEIGHT = 48;
const SECTION_PADDING = 20;

/**
 * Estimates the height of a section based on its content
 */
function estimateSectionHeight(section: CardSection): number {
  const type = section.type?.toLowerCase() ?? 'default';
  const baseHeight = SECTION_HEIGHT_ESTIMATES[type] ?? SECTION_HEIGHT_ESTIMATES['default'] ?? 120;

  const itemCount = section.items?.length ?? 0;
  const fieldCount = section.fields?.length ?? 0;

  const itemsHeight = itemCount * HEIGHT_PER_ITEM;
  const fieldsHeight = fieldCount * HEIGHT_PER_FIELD;
  const contentHeight = Math.max(itemsHeight, fieldsHeight);

  const estimatedHeight = Math.max(
    baseHeight as number,
    SECTION_HEADER_HEIGHT + contentHeight + SECTION_PADDING
  );

  return Math.min(estimatedHeight, 500);
}

/**
 * Measures the content density of a section
 */
function measureContentDensity(section: CardSection): number {
  const textLength = (section.description?.length ?? 0) +
    (section.fields?.reduce((acc: number, f: CardField) => acc + String(f.value ?? '').length + (f.label?.length ?? 0), 0) ?? 0);
  const itemCount = section.items?.length ?? 0;
  const fieldCount = section.fields?.length ?? 0;

  const textScore = textLength / 50;
  const itemScore = itemCount * 3;
  const fieldScore = fieldCount * 2;

  return Math.round(textScore + itemScore + fieldScore);
}

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Configuration for the row packer algorithm
 */
export interface RowPackerConfig {
  /** Total number of columns in the grid (typically 1-4) */
  totalColumns: number;
  /** Gap between items in pixels */
  gap?: number;
  /** When true, filling rows takes precedence over respecting preferred widths */
  prioritizeSpaceFilling: boolean;
  /** Whether sections can shrink below their preferred width */
  allowShrinking: boolean;
  /** Whether sections can grow beyond their preferred width */
  allowGrowing: boolean;
  /** Maximum iterations for optimization passes */
  maxOptimizationPasses?: number;
  /** Number of sections to look ahead when optimizing row filling */
  lookAheadCount?: number;
  /** Force sections to align left (column 0 preference) */
  alignLeft?: boolean;
  /** Enable section swapping optimization between rows */
  enableSwapping?: boolean;
}

/**
 * Section prepared for packing with calculated metrics
 */
export interface PlannedSection {
  /** Original section data */
  section: CardSection;
  /** Original index in the input array (for stable sorting) */
  originalIndex: number;
  /** Minimum column width (default: 1) */
  minWidth: number;
  /** Preferred column width based on content and type */
  preferredWidth: number;
  /** Maximum column width (default: totalColumns) */
  maxWidth: number;
  /** Layout priority (1=highest, 3=lowest) */
  priority: LayoutPriority;
  /** Whether this section is flexible (can shrink/grow) */
  isFlexible: boolean;
  /** Whether this section can shrink */
  canShrink: boolean;
  /** Whether this section can grow */
  canGrow: boolean;
  /** Estimated height in pixels */
  estimatedHeight: number;
  /** Content density score */
  density: number;
}

/**
 * A section that has been placed in a row with its final width
 */
export interface RowPlacedSection extends PlannedSection {
  /** Final column width after packing */
  finalWidth: number;
  /** Column index where this section starts (0-indexed) */
  columnIndex: number;
  /** Row index (0-indexed) */
  rowIndex: number;
  /** Whether the section was shrunk from its preferred width */
  wasShrunk: boolean;
  /** Whether the section was grown from its preferred width */
  wasGrown: boolean;
}

/**
 * A row of packed sections
 */
export interface PackedRow {
  /** Index of this row (0-indexed) */
  index: number;
  /** Sections placed in this row */
  sections: RowPlacedSection[];
  /** Total columns used in this row */
  totalWidth: number;
  /** Remaining capacity (0 = perfectly filled) */
  remainingCapacity: number;
  /** Estimated row height based on tallest section */
  estimatedHeight: number;
  /** Top offset in pixels */
  topOffset: number;
}

/**
 * Result of the row packing algorithm
 */
export interface RowPackingResult {
  /** All packed rows */
  rows: PackedRow[];
  /** Total estimated height of all rows */
  totalHeight: number;
  /** Utilization percentage (100 = perfect, no gaps) */
  utilizationPercent: number;
  /** Number of rows with remaining capacity (gaps) */
  rowsWithGaps: number;
  /** Sections that were shrunk from preferred */
  shrunkCount: number;
  /** Sections that were grown from preferred */
  grownCount: number;
}

/**
 * Positioned section ready for rendering
 */
export interface PositionedSection {
  section: CardSection;
  key: string;
  colSpan: number;
  preferredColumns: 1 | 2 | 3 | 4;
  left: string;
  top: number;
  width: string;
  rowIndex: number;
  wasShrunk: boolean;
  wasGrown: boolean;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: Required<RowPackerConfig> = {
  totalColumns: 4,
  gap: 12,
  prioritizeSpaceFilling: true,
  allowShrinking: true,
  allowGrowing: true,
  maxOptimizationPasses: 5,
  lookAheadCount: 3,
  alignLeft: true,
  enableSwapping: true,
};

// ============================================================================
// PRIORITY MAPPING
// ============================================================================

/**
 * Maps string priority to numeric layout priority
 */
export function mapPriorityToNumber(
  priority?: 'critical' | 'important' | 'standard' | 'optional',
  layoutPriority?: LayoutPriority
): LayoutPriority {
  // Explicit layoutPriority takes precedence
  if (layoutPriority !== undefined) {
    return layoutPriority;
  }

  // Map string priority to number
  switch (priority) {
    case 'critical':
    case 'important':
      return 1;
    case 'standard':
      return 2;
    case 'optional':
      return 3;
    default:
      return 2; // Default to standard priority
  }
}

// ============================================================================
// SECTION PREPARATION
// ============================================================================

/**
 * Type-based default preferred widths
 * UPDATED: Increased preferred widths to better fill rows and avoid gaps
 */
const TYPE_PREFERRED_WIDTHS: Record<string, number> = {
  'overview': 4,
  'chart': 2,
  'map': 2,
  'locations': 2,
  'analytics': 2,   // Increased from 1 - metrics benefit from more space
  'stats': 2,       // Increased from 1 - stats benefit from more space
  'contact-card': 1,
  'network-card': 2, // Increased from 1 - networks often have multiple connections
  'info': 1,
  'list': 1,
  'event': 2,       // Increased from 1 - events have dates and descriptions
  'financials': 2,  // Increased from 1 - financial data benefits from more space
  'product': 2,
  'solutions': 2,
  'quotation': 2,   // Increased from 1 - quotes benefit from wider display
  'text-reference': 2,
  'timeline': 2,    // Increased from 1 - timelines benefit from more space
  'project': 1,
};

/**
 * Calculates the preferred width for a section based on type and content
 * Uses content-aware heuristics to determine optimal column span
 */
function calculatePreferredWidth(section: CardSection, maxColumns: number): number {
  // Explicit colSpan takes absolute precedence
  if (section.colSpan && section.colSpan > 0) {
    return Math.min(section.colSpan, maxColumns);
  }

  // Then preferredColumns
  if (section.preferredColumns) {
    return Math.min(section.preferredColumns, maxColumns);
  }

  // Type-based default
  const type = section.type?.toLowerCase() ?? 'info';
  const typeDefault = TYPE_PREFERRED_WIDTHS[type] ?? 1;

  // Content-aware adjustments
  const fieldCount = section.fields?.length ?? 0;
  const itemCount = section.items?.length ?? 0;
  const density = measureContentDensity(section);

  // Special handling for contact cards - each contact can be in its own column
  if (type === 'contact-card') {
    if (fieldCount >= 4) return Math.min(4, maxColumns);
    if (fieldCount >= 3) return Math.min(3, maxColumns);
    if (fieldCount >= 2) return Math.min(2, maxColumns);
    return 1;
  }

  // Special handling for network cards
  if (type === 'network-card') {
    if (fieldCount >= 3) return Math.min(3, maxColumns);
    if (fieldCount >= 2) return Math.min(2, maxColumns);
    return 1;
  }

  // Analytics/stats with multiple metrics should expand
  if ((type === 'analytics' || type === 'stats') && fieldCount > 0) {
    if (fieldCount >= 6) return Math.min(3, maxColumns);
    if (fieldCount >= 4) return Math.min(2, maxColumns);
    return 1;
  }

  // Overview sections should expand based on field count
  if (type === 'overview') {
    if (fieldCount >= 8) return Math.min(4, maxColumns);
    if (fieldCount >= 6) return Math.min(3, maxColumns);
    if (fieldCount >= 4) return Math.min(2, maxColumns);
    return Math.min(typeDefault, maxColumns);
  }

  // Info sections with many fields should expand
  if (type === 'info' && fieldCount >= 6) {
    return Math.min(2, maxColumns);
  }

  // Lists with many items should stay narrow (vertical scrolling)
  if (type === 'list' && itemCount > 6) {
    return 1;
  }

  // Charts and maps always benefit from more space
  if (type === 'chart' || type === 'map') {
    return Math.min(Math.max(2, typeDefault), maxColumns);
  }

  // Expand very dense sections
  if (density > 50 && typeDefault < maxColumns) {
    return Math.min(typeDefault + 2, maxColumns);
  }

  if (density > 30 && typeDefault < maxColumns) {
    return Math.min(typeDefault + 1, maxColumns);
  }

  return Math.min(typeDefault, maxColumns);
}

/**
 * Prepares sections for packing by calculating metrics
 */
export function prepareSections(
  sections: CardSection[],
  config: RowPackerConfig
): PlannedSection[] {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  return sections.map((section, index) => {
    const preferredWidth = calculatePreferredWidth(section, fullConfig.totalColumns);
    const priority = mapPriorityToNumber(section.priority, section.layoutPriority);

    // Determine flexibility
    const canShrink = section.canShrink !== false && fullConfig.allowShrinking;
    const canGrow = (section.canGrow !== false && section.flexGrow !== false) && fullConfig.allowGrowing;

    return {
      section,
      originalIndex: index,
      minWidth: section.minColumns ?? 1,
      preferredWidth,
      maxWidth: section.maxColumns ?? fullConfig.totalColumns,
      priority,
      isFlexible: canShrink || canGrow,
      canShrink,
      canGrow,
      estimatedHeight: estimateSectionHeight(section),
      density: measureContentDensity(section),
    };
  });
}

// ============================================================================
// ROW BUILDING ALGORITHM
// ============================================================================

/**
 * Look-ahead mechanism to find the best combination of sections to fill a row
 * Returns the optimal set of section indices that together fill the row completely
 */
function findOptimalCombination(
  available: PlannedSection[],
  targetWidth: number,
  lookAheadCount: number
): number[] | null {
  const candidates = available.slice(0, Math.min(lookAheadCount + 3, available.length));

  // Try to find exact fit combinations
  // Start with single sections, then pairs, then triples
  for (let combinationSize = 1; combinationSize <= Math.min(3, candidates.length); combinationSize++) {
    const combinations = getCombinations(candidates.length, combinationSize);

    for (const combo of combinations) {
      const totalWidth = combo.reduce((sum, idx) => sum + (candidates[idx]?.preferredWidth ?? 0), 0);
      if (totalWidth === targetWidth) {
        return combo;
      }
    }
  }

  // No exact fit found, try to find best fit (closest to target without exceeding)
  let bestFit: number[] | null = null;
  let bestFitWidth = 0;

  for (let combinationSize = 1; combinationSize <= Math.min(3, candidates.length); combinationSize++) {
    const combinations = getCombinations(candidates.length, combinationSize);

    for (const combo of combinations) {
      const totalWidth = combo.reduce((sum, idx) => sum + (candidates[idx]?.preferredWidth ?? 0), 0);
      if (totalWidth <= targetWidth && totalWidth > bestFitWidth) {
        bestFit = combo;
        bestFitWidth = totalWidth;
      }
    }
  }

  return bestFit;
}

/**
 * Generate all combinations of k elements from n elements
 */
function getCombinations(n: number, k: number): number[][] {
  const result: number[][] = [];

  function backtrack(start: number, current: number[]): void {
    if (current.length === k) {
      result.push([...current]);
      return;
    }

    for (let i = start; i < n; i++) {
      current.push(i);
      backtrack(i + 1, current);
      current.pop();
    }
  }

  backtrack(0, []);
  return result;
}

/**
 * Builds a single row by filling it as completely as possible
 *
 * Algorithm:
 * 1. Use look-ahead to find optimal section combination
 * 2. Add sections at preferred width until row is full
 * 3. If gap remains, try to expand flexible sections
 * 4. If gap still remains, try to pull and shrink the next section
 * 5. Left-align all sections (ensure column indices start from 0)
 * 6. Return the completed row
 */
function buildRow(
  available: PlannedSection[],
  totalColumns: number,
  rowIndex: number,
  topOffset: number,
  config: Required<RowPackerConfig>,
  isLastRow: boolean = false
): { row: PackedRow; remaining: PlannedSection[] } {
  const rowSections: RowPlacedSection[] = [];
  const remaining = [...available];
  let currentColumn = 0;
  let rowHeight = 0;

  // Phase 0: Use look-ahead to find optimal combination
  if (config.lookAheadCount > 0 && remaining.length > 1) {
    const optimalCombo = findOptimalCombination(remaining, totalColumns, config.lookAheadCount);

    if (optimalCombo && optimalCombo.length > 0) {
      // Sort indices in descending order so we can splice without index shifting
      const sortedIndices = [...optimalCombo].sort((a, b) => b - a);
      const sectionsToPlace: PlannedSection[] = [];

      for (const idx of sortedIndices) {
        const section = remaining[idx];
        if (section) {
          sectionsToPlace.unshift(section);
          remaining.splice(idx, 1);
        }
      }

      // Sort by priority for placement order
      sectionsToPlace.sort((a, b) => a.priority - b.priority);

      for (const section of sectionsToPlace) {
        const placed: RowPlacedSection = {
          ...section,
          finalWidth: section.preferredWidth,
          columnIndex: currentColumn,
          rowIndex,
          wasShrunk: false,
          wasGrown: false,
        };

        rowSections.push(placed);
        currentColumn += section.preferredWidth;
        rowHeight = Math.max(rowHeight, section.estimatedHeight);
      }
    }
  }

  // Phase 1: Add sections at preferred width (if look-ahead didn't fill the row)
  while (remaining.length > 0 && currentColumn < totalColumns) {
    const space = totalColumns - currentColumn;

    // Find the highest priority section that fits
    const fitIndex = remaining.findIndex(s => s.preferredWidth <= space);

    if (fitIndex === -1) {
      // No section fits at preferred width, move to Phase 2
      break;
    }

    const section = remaining.splice(fitIndex, 1)[0]!;
    const placed: RowPlacedSection = {
      ...section,
      finalWidth: section.preferredWidth,
      columnIndex: currentColumn,
      rowIndex,
      wasShrunk: false,
      wasGrown: false,
    };

    rowSections.push(placed);
    currentColumn += section.preferredWidth;
    rowHeight = Math.max(rowHeight, section.estimatedHeight);
  }

  // Phase 2: Fill remaining gap by expanding existing sections
  let gap = totalColumns - currentColumn;

  if (gap > 0 && config.allowGrowing) {
    // Sort by priority (lower = higher priority, expand last)
    // We want to expand low-priority sections first to preserve high-priority section widths
    const expandable = rowSections
      .filter(s => {
        // Check if section can grow
        if (!s.canGrow) return false;

        // Calculate type-aware max expansion limit
        const typeMaxExpansion = getMaxExpansion(s.section.type ?? 'default');
        const effectiveMax = Math.min(s.maxWidth, typeMaxExpansion, totalColumns);

        // Check if already at effective max
        if (s.finalWidth >= effectiveMax) return false;

        // RELAXED: Only check density for very sparse content (threshold lowered)
        // This allows more aggressive gap filling
        if (s.density < EXPANSION_DENSITY_THRESHOLD / 2 && gap > 2) {
          return false;
        }

        return true;
      })
      .sort((a, b) => b.priority - a.priority); // 3 before 2 before 1

    for (const section of expandable) {
      if (gap === 0) break;

      // Calculate type-aware max expansion limit
      const typeMaxExpansion = getMaxExpansion(section.section.type ?? 'default');
      const effectiveMax = Math.min(section.maxWidth, typeMaxExpansion, totalColumns);

      const expandBy = Math.min(gap, effectiveMax - section.finalWidth);
      if (expandBy > 0) {
        section.finalWidth += expandBy;
        section.wasGrown = true;
        gap -= expandBy;

        // Update column indices for sections after this one
        const sectionIdx = rowSections.indexOf(section);
        for (let i = sectionIdx + 1; i < rowSections.length; i++) {
          rowSections[i]!.columnIndex += expandBy;
        }
      }
    }

    currentColumn = totalColumns - gap;
  }

  // Phase 2.5: If still have gap and sections can't grow further, try ALL sections regardless of density
  if (gap > 0 && config.allowGrowing && rowSections.length > 0) {
    const anyExpandable = rowSections.filter(s => {
      const typeMaxExpansion = getMaxExpansion(s.section.type ?? 'default');
      // Use higher max (+1) to allow filling critical gaps
      const effectiveMax = Math.min(s.maxWidth, typeMaxExpansion + 1, totalColumns);
      return s.finalWidth < effectiveMax;
    });

    // Distribute remaining gap evenly among expandable sections
    while (gap > 0 && anyExpandable.length > 0) {
      let expanded = false;
      for (const section of anyExpandable) {
        if (gap === 0) break;

        const typeMaxExpansion = getMaxExpansion(section.section.type ?? 'default');
        const effectiveMax = Math.min(section.maxWidth, typeMaxExpansion + 1, totalColumns);

        if (section.finalWidth < effectiveMax) {
          section.finalWidth += 1;
          section.wasGrown = true;
          gap -= 1;
          expanded = true;

          const sectionIdx = rowSections.indexOf(section);
          for (let i = sectionIdx + 1; i < rowSections.length; i++) {
            rowSections[i]!.columnIndex += 1;
          }
        }
      }
      if (!expanded) break;
    }

    currentColumn = totalColumns - gap;
  }

  // Phase 3: Try to pull and shrink the next section to fill remaining gap
  // Priority-based shrinking: prefer shrinking lower priority sections first
  if (gap > 0 && config.allowShrinking && remaining.length > 0) {
    // Sort candidates by priority descending (3 before 2 before 1)
    // This ensures we shrink optional sections before important ones
    const shrinkCandidates = remaining
      .map((s, idx) => ({ section: s, originalIdx: idx }))
      .filter(({ section }) => section.canShrink && section.minWidth <= gap)
      .sort((a, b) => {
        // Higher priority number = lower importance = shrink first
        if (a.section.priority !== b.section.priority) {
          return b.section.priority - a.section.priority;
        }
        // Within same priority, prefer sections closer to gap size
        const aDiff = Math.abs(a.section.preferredWidth - gap);
        const bDiff = Math.abs(b.section.preferredWidth - gap);
        return aDiff - bDiff;
      });

    if (shrinkCandidates.length > 0) {
      const candidate = shrinkCandidates[0]!;
      const shrinkIndex = remaining.findIndex(s => s === candidate.section);

      if (shrinkIndex !== -1) {
        const section = remaining.splice(shrinkIndex, 1)[0]!;
        const shrunkWidth = Math.min(gap, section.preferredWidth);

        const placed: RowPlacedSection = {
          ...section,
          finalWidth: shrunkWidth,
          columnIndex: currentColumn,
          rowIndex,
          wasShrunk: shrunkWidth < section.preferredWidth,
          wasGrown: false,
        };

        rowSections.push(placed);
        currentColumn += shrunkWidth;
        rowHeight = Math.max(rowHeight, section.estimatedHeight);
        gap = totalColumns - currentColumn;
      }
    }
  }

  // Phase 4: If still have gap, try distributing it among growable sections
  // This is a fallback for when Phase 2 couldn't fill the gap
  // We're more lenient here since this is the last chance to fill gaps
  if (gap > 0 && config.allowGrowing) {
    const growable = rowSections.filter(s => {
      if (!s.canGrow) return false;

      // Calculate type-aware max expansion limit
      const typeMaxExpansion = getMaxExpansion(s.section.type ?? 'default');
      const effectiveMax = Math.min(s.maxWidth, typeMaxExpansion, totalColumns);

      return s.finalWidth < effectiveMax;
    });

    while (gap > 0 && growable.length > 0) {
      let distributed = false;

      for (const section of growable) {
        if (gap === 0) break;

        // Calculate type-aware max expansion limit
        const typeMaxExpansion = getMaxExpansion(section.section.type ?? 'default');
        const effectiveMax = Math.min(section.maxWidth, typeMaxExpansion, totalColumns);

        if (section.finalWidth < effectiveMax) {
          section.finalWidth += 1;
          section.wasGrown = true;
          gap -= 1;
          distributed = true;

          // Update column indices
          const sectionIdx = rowSections.indexOf(section);
          for (let i = sectionIdx + 1; i < rowSections.length; i++) {
            rowSections[i]!.columnIndex += 1;
          }
        }
      }

      if (!distributed) break; // No more expansion possible
    }

    currentColumn = totalColumns - gap;
  }

  // Phase 5: Force-fill on last row - ignore density threshold
  // This ensures no gaps at the end of the grid
  if (isLastRow && gap > 0 && rowSections.length > 0) {
    // Find any section that can still grow (ignore density threshold)
    const anyGrowable = rowSections.filter(s => {
      const typeMaxExpansion = getMaxExpansion(s.section.type ?? 'default');
      const effectiveMax = Math.min(s.maxWidth, typeMaxExpansion + 1, totalColumns); // Allow +1 beyond type max for last row
      return s.finalWidth < effectiveMax;
    });

    // Distribute remaining gap among all growable sections
    while (gap > 0 && anyGrowable.length > 0) {
      let distributed = false;

      for (const section of anyGrowable) {
        if (gap === 0) break;

        const typeMaxExpansion = getMaxExpansion(section.section.type ?? 'default');
        const effectiveMax = Math.min(section.maxWidth, typeMaxExpansion + 1, totalColumns);

        if (section.finalWidth < effectiveMax) {
          section.finalWidth += 1;
          section.wasGrown = true;
          gap -= 1;
          distributed = true;

          const sectionIdx = rowSections.indexOf(section);
          for (let i = sectionIdx + 1; i < rowSections.length; i++) {
            rowSections[i]!.columnIndex += 1;
          }
        }
      }

      if (!distributed) break;
    }

    currentColumn = totalColumns - gap;
  }

  // Phase 6: Left alignment - ensure sections start from column 0
  if (config.alignLeft && rowSections.length > 0) {
    // Sort by column index and recalculate positions starting from 0
    rowSections.sort((a, b) => a.columnIndex - b.columnIndex);
    let leftCol = 0;
    for (const section of rowSections) {
      section.columnIndex = leftCol;
      leftCol += section.finalWidth;
    }
    currentColumn = leftCol;
  }

  const row: PackedRow = {
    index: rowIndex,
    sections: rowSections,
    totalWidth: currentColumn,
    remainingCapacity: totalColumns - currentColumn,
    estimatedHeight: rowHeight,
    topOffset,
  };

  return { row, remaining };
}

// ============================================================================
// MAIN PACKING FUNCTION
// ============================================================================

/**
 * Packs sections into rows using the row-first space-filling algorithm
 *
 * @param sections - Sections to pack
 * @param config - Packing configuration
 * @returns Packing result with rows and metrics
 */
export function packSectionsIntoRows(
  sections: CardSection[],
  config: RowPackerConfig
): RowPackingResult {
  const fullConfig: Required<RowPackerConfig> = { ...DEFAULT_CONFIG, ...config };

  if (sections.length === 0) {
    return {
      rows: [],
      totalHeight: 0,
      utilizationPercent: 100,
      rowsWithGaps: 0,
      shrunkCount: 0,
      grownCount: 0,
    };
  }

  // Prepare sections with metrics
  const planned = prepareSections(sections, fullConfig);

  // Sort by priority first, then by preferred width descending (for better packing),
  // then by original index for stability
  const sorted = [...planned].sort((a, b) => {
    // Primary: priority (1 before 2 before 3)
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    // Secondary: wider sections first for better row filling
    if (a.preferredWidth !== b.preferredWidth) {
      return b.preferredWidth - a.preferredWidth;
    }
    // Tertiary: original order
    return a.originalIndex - b.originalIndex;
  });

  // Build rows
  const rows: PackedRow[] = [];
  let remaining = sorted;
  let currentTop = 0;
  let rowIndex = 0;

  while (remaining.length > 0) {
    // Detect if this is the last row (remaining sections can all fit)
    const totalRemainingWidth = remaining.reduce((sum, s) => sum + s.preferredWidth, 0);
    const isLastRow = totalRemainingWidth <= fullConfig.totalColumns;

    const { row, remaining: leftover } = buildRow(
      remaining,
      fullConfig.totalColumns,
      rowIndex,
      currentTop,
      fullConfig,
      isLastRow
    );

    // Safety check: if no sections were placed, force place the first one
    if (row.sections.length === 0 && remaining.length > 0) {
      const forced = remaining.shift()!;
      const forcedWidth = Math.min(forced.preferredWidth, fullConfig.totalColumns);

      row.sections.push({
        ...forced,
        finalWidth: forcedWidth,
        columnIndex: 0,
        rowIndex,
        wasShrunk: forcedWidth < forced.preferredWidth,
        wasGrown: false,
      });
      row.totalWidth = forcedWidth;
      row.remainingCapacity = fullConfig.totalColumns - forcedWidth;
      row.estimatedHeight = forced.estimatedHeight;
    }

    rows.push(row);
    currentTop += row.estimatedHeight + fullConfig.gap;
    rowIndex++;
    remaining = leftover;
  }

  // Post-processing: Section swapping optimization
  if (fullConfig.enableSwapping && rows.length >= 2) {
    optimizeRowsWithSwapping(rows, fullConfig.totalColumns, fullConfig.maxOptimizationPasses);
  }

  // Calculate metrics
  const totalCells = rows.length * fullConfig.totalColumns;
  const usedCells = rows.reduce((sum, row) => sum + row.totalWidth, 0);
  const utilizationPercent = totalCells > 0 ? (usedCells / totalCells) * 100 : 100;
  const rowsWithGaps = rows.filter(r => r.remainingCapacity > 0).length;

  let shrunkCount = 0;
  let grownCount = 0;
  for (const row of rows) {
    for (const section of row.sections) {
      if (section.wasShrunk) shrunkCount++;
      if (section.wasGrown) grownCount++;
    }
  }

  // Calculate total height
  const totalHeight = rows.length > 0
    ? rows[rows.length - 1]!.topOffset + rows[rows.length - 1]!.estimatedHeight
    : 0;

  return {
    rows,
    totalHeight,
    utilizationPercent: Math.round(utilizationPercent * 100) / 100,
    rowsWithGaps,
    shrunkCount,
    grownCount,
  };
}

/**
 * Post-processing optimization: Try swapping sections between adjacent rows
 * to eliminate gaps
 */
function optimizeRowsWithSwapping(
  rows: PackedRow[],
  totalColumns: number,
  maxPasses: number
): void {
  for (let pass = 0; pass < maxPasses; pass++) {
    let improved = false;

    for (let i = 0; i < rows.length - 1; i++) {
      const rowA = rows[i]!;
      const rowB = rows[i + 1]!;

      // Skip if both rows are full
      if (rowA.remainingCapacity === 0 && rowB.remainingCapacity === 0) {
        continue;
      }

      // Try to find a swap that fills both rows better
      for (const sectionA of rowA.sections) {
        for (const sectionB of rowB.sections) {
          // Check if swapping would improve gap situation
          const gapBeforeA = rowA.remainingCapacity;
          const gapBeforeB = rowB.remainingCapacity;

          // Calculate new gaps after potential swap
          const newGapA = gapBeforeA + sectionA.finalWidth - sectionB.finalWidth;
          const newGapB = gapBeforeB + sectionB.finalWidth - sectionA.finalWidth;

          // Accept swap if it reduces total gaps or makes one row perfect
          const totalGapBefore = gapBeforeA + gapBeforeB;
          const totalGapAfter = Math.max(0, newGapA) + Math.max(0, newGapB);

          if (totalGapAfter < totalGapBefore && newGapA >= 0 && newGapB >= 0) {
            // Perform swap
            const idxA = rowA.sections.indexOf(sectionA);
            const idxB = rowB.sections.indexOf(sectionB);

            if (idxA !== -1 && idxB !== -1) {
              // Swap the sections
              rowA.sections[idxA] = { ...sectionB, rowIndex: rowA.index };
              rowB.sections[idxB] = { ...sectionA, rowIndex: rowB.index };

              // Update row metrics
              rowA.remainingCapacity = newGapA;
              rowB.remainingCapacity = newGapB;
              rowA.totalWidth = totalColumns - newGapA;
              rowB.totalWidth = totalColumns - newGapB;

              // Recalculate column indices
              recalculateColumnIndices(rowA);
              recalculateColumnIndices(rowB);

              improved = true;
              break;
            }
          }
        }
        if (improved) break;
      }
    }

    if (!improved) break; // No more improvements possible
  }
}

/**
 * Recalculate column indices for a row after modifications
 */
function recalculateColumnIndices(row: PackedRow): void {
  let col = 0;
  for (const section of row.sections) {
    section.columnIndex = col;
    col += section.finalWidth;
  }
}

// ============================================================================
// CONVERSION TO POSITIONED SECTIONS
// ============================================================================

/**
 * Generates a stable key for a section
 */
function generateSectionKey(section: CardSection, index: number): string {
  return section.id ?? `section-${section.type}-${section.title}-${index}`;
}

/**
 * Converts packing result to positioned sections for rendering
 *
 * @param result - Packing result from packSectionsIntoRows
 * @param config - Grid configuration
 * @returns Array of positioned sections ready for rendering
 */
export function packingResultToPositions(
  result: RowPackingResult,
  config: { totalColumns: number; gap: number }
): PositionedSection[] {
  const positions: PositionedSection[] = [];

  for (const row of result.rows) {
    for (const placed of row.sections) {
      const widthExpr = generateWidthExpression(
        config.totalColumns,
        placed.finalWidth,
        config.gap
      );
      const leftExpr = generateLeftExpression(
        config.totalColumns,
        placed.columnIndex,
        config.gap
      );

      positions.push({
        section: placed.section,
        key: generateSectionKey(placed.section, placed.originalIndex),
        colSpan: placed.finalWidth,
        preferredColumns: Math.min(placed.preferredWidth, 4) as 1 | 2 | 3 | 4,
        left: leftExpr,
        top: row.topOffset,
        width: widthExpr,
        rowIndex: row.index,
        wasShrunk: placed.wasShrunk,
        wasGrown: placed.wasGrown,
      });
    }
  }

  return positions;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Analyzes a set of sections and suggests optimal packing configuration
 */
export function analyzeSections(sections: CardSection[]): {
  totalPreferredWidth: number;
  canFitInRows: number;
  suggestedColumns: number;
  hasMixedPriorities: boolean;
} {
  const prepared = prepareSections(sections, {
    totalColumns: 4,
    prioritizeSpaceFilling: true,
    allowShrinking: true,
    allowGrowing: true
  });

  const totalPreferredWidth = prepared.reduce((sum, s) => sum + s.preferredWidth, 0);
  const priorities = new Set(prepared.map(s => s.priority));

  // Suggest columns based on section widths
  const maxPreferred = Math.max(...prepared.map(s => s.preferredWidth));
  const avgPreferred = totalPreferredWidth / prepared.length;

  let suggestedColumns = 4;
  if (maxPreferred <= 2 && avgPreferred <= 1.5) {
    suggestedColumns = 2;
  } else if (maxPreferred <= 3 && avgPreferred <= 2) {
    suggestedColumns = 3;
  }

  return {
    totalPreferredWidth,
    canFitInRows: Math.ceil(totalPreferredWidth / 4),
    suggestedColumns,
    hasMixedPriorities: priorities.size > 1,
  };
}

/**
 * Validates packing result and returns warnings
 */
export function validatePackingResult(result: RowPackingResult): string[] {
  const warnings: string[] = [];

  if (result.utilizationPercent < 90) {
    warnings.push(
      `Low utilization (${result.utilizationPercent.toFixed(1)}%). Consider allowing more section flexibility.`
    );
  }

  if (result.rowsWithGaps > 0) {
    warnings.push(
      `${result.rowsWithGaps} row(s) have gaps. Enable section growing/shrinking for better packing.`
    );
  }

  if (result.shrunkCount > result.rows.length) {
    warnings.push(
      `Many sections (${result.shrunkCount}) were shrunk. Consider reducing preferred widths.`
    );
  }

  return warnings;
}

