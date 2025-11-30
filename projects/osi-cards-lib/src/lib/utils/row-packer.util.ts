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
  maxOptimizationPasses: 3,
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
 */
const TYPE_PREFERRED_WIDTHS: Record<string, number> = {
  'overview': 4,
  'chart': 2,
  'map': 2,
  'locations': 2,
  'analytics': 1,
  'stats': 1,
  'contact-card': 1,
  'network-card': 1,
  'info': 1,
  'list': 1,
  'event': 1,
  'financials': 1,
  'product': 2,
  'solutions': 2,
  'quotation': 1,
  'text-reference': 2,
  'timeline': 1,
  'project': 1,
};

/**
 * Calculates the preferred width for a section based on type and content
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

  // Special handling for contact cards
  if (type === 'contact-card' && fieldCount > 2) {
    return Math.min(fieldCount, maxColumns);
  }

  // Expand dense sections
  if (density > 40 && typeDefault < maxColumns) {
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
 * Builds a single row by filling it as completely as possible
 * 
 * Algorithm:
 * 1. Add sections at preferred width until row is full
 * 2. If gap remains, try to expand flexible sections
 * 3. If gap still remains, try to pull and shrink the next section
 * 4. Return the completed row
 */
function buildRow(
  available: PlannedSection[],
  totalColumns: number,
  rowIndex: number,
  topOffset: number,
  config: Required<RowPackerConfig>
): { row: PackedRow; remaining: PlannedSection[] } {
  const rowSections: RowPlacedSection[] = [];
  const remaining = [...available];
  let currentColumn = 0;
  let rowHeight = 0;

  // Phase 1: Add sections at preferred width
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
        
        // Check content density - sparse content shouldn't expand
        if (s.density < EXPANSION_DENSITY_THRESHOLD && gap > 1) {
          // Allow expansion only if this is the only option (gap=1)
          // or if there are no other expandable sections
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

  // Phase 3: Try to pull and shrink the next section to fill remaining gap
  if (gap > 0 && config.allowShrinking && remaining.length > 0) {
    // Find a section that can be shrunk to fit
    const shrinkIndex = remaining.findIndex(s => 
      s.canShrink && s.minWidth <= gap
    );

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

  // Sort by priority first, then by original index for stability
  const sorted = [...planned].sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority; // 1 before 2 before 3
    }
    return a.originalIndex - b.originalIndex; // Maintain original order within priority
  });

  // Build rows
  const rows: PackedRow[] = [];
  let remaining = sorted;
  let currentTop = 0;
  let rowIndex = 0;

  while (remaining.length > 0) {
    const { row, remaining: leftover } = buildRow(
      remaining,
      fullConfig.totalColumns,
      rowIndex,
      currentTop,
      fullConfig
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

