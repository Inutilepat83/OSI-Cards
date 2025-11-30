/**
 * Grid Configuration Utilities
 * 
 * Centralized grid constants and calculation helpers for the masonry layout system.
 * This is the single source of truth for all grid-related values.
 */

// ============================================================================
// GRID CONSTANTS
// ============================================================================

/** Minimum width for a single column in pixels */
export const MIN_COLUMN_WIDTH = 260;

/** Maximum number of columns allowed */
export const MAX_COLUMNS = 4;

/** Gap between columns and rows in pixels */
export const GRID_GAP = 12;

/** CSS variable name for minimum column width */
export const CSS_VAR_MIN_WIDTH = '--section-grid-min-width';

/** CSS variable name for grid gap */
export const CSS_VAR_GRID_GAP = '--section-card-gap';

/** CSS variable name for current column count */
export const CSS_VAR_COLUMNS = '--masonry-columns';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Configuration interface for grid layout
 */
export interface GridConfig {
  minColumnWidth: number;
  maxColumns: number;
  gap: number;
}

/**
 * Default grid configuration
 */
export const DEFAULT_GRID_CONFIG: GridConfig = {
  minColumnWidth: MIN_COLUMN_WIDTH,
  maxColumns: MAX_COLUMNS,
  gap: GRID_GAP,
};

// ============================================================================
// PACKING ALGORITHM CONFIGURATION
// ============================================================================

/**
 * Available packing algorithms
 * - 'legacy': Original masonry algorithm (FFDH-based)
 * - 'row-first': New space-filling algorithm that prioritizes complete rows
 * - 'skyline': Skyline bin-packing algorithm
 */
export type PackingAlgorithm = 'legacy' | 'row-first' | 'skyline';

/**
 * Configuration for the row-first packing algorithm
 */
export interface RowPackingOptions {
  /**
   * When true, filling rows completely takes precedence over 
   * respecting section preferred widths
   * @default true
   */
  prioritizeSpaceFilling: boolean;
  
  /**
   * Whether sections can be shrunk below their preferred width
   * to help fill rows completely
   * @default true
   */
  allowShrinking: boolean;
  
  /**
   * Whether sections can be grown beyond their preferred width
   * to fill gaps in rows
   * @default true
   */
  allowGrowing: boolean;
  
  /**
   * Maximum optimization passes to run after initial packing
   * @default 3
   */
  maxOptimizationPasses: number;
}

/**
 * Default row packing options
 */
export const DEFAULT_ROW_PACKING_OPTIONS: RowPackingOptions = {
  prioritizeSpaceFilling: true,
  allowShrinking: true,
  allowGrowing: true,
  maxOptimizationPasses: 3,
};

/**
 * Extended configuration for masonry grid with packing options
 */
export interface MasonryPackingConfig extends GridConfig {
  /**
   * Which packing algorithm to use
   * @default 'row-first'
   */
  packingAlgorithm: PackingAlgorithm;
  
  /**
   * Options for the row-first packing algorithm
   * Only used when packingAlgorithm is 'row-first'
   */
  rowPackingOptions: RowPackingOptions;
  
  /**
   * Whether to use the legacy algorithm as a fallback
   * when the selected algorithm fails
   * @default true
   */
  useLegacyFallback: boolean;
}

/**
 * Default masonry packing configuration
 * Uses the legacy algorithm by default for backward compatibility
 * Set packingAlgorithm to 'row-first' to enable zero white space packing
 */
export const DEFAULT_MASONRY_PACKING_CONFIG: MasonryPackingConfig = {
  ...DEFAULT_GRID_CONFIG,
  packingAlgorithm: 'legacy',
  rowPackingOptions: DEFAULT_ROW_PACKING_OPTIONS,
  useLegacyFallback: true,
};

/**
 * Configuration preset for maximum space utilization
 * Aggressively shrinks and grows sections to fill all gaps
 */
export const SPACE_OPTIMIZED_CONFIG: MasonryPackingConfig = {
  ...DEFAULT_GRID_CONFIG,
  packingAlgorithm: 'row-first',
  rowPackingOptions: {
    prioritizeSpaceFilling: true,
    allowShrinking: true,
    allowGrowing: true,
    maxOptimizationPasses: 5,
  },
  useLegacyFallback: true,
};

/**
 * Configuration preset for respecting section preferences
 * Minimizes resizing, may result in some gaps
 */
export const PREFERENCE_OPTIMIZED_CONFIG: MasonryPackingConfig = {
  ...DEFAULT_GRID_CONFIG,
  packingAlgorithm: 'row-first',
  rowPackingOptions: {
    prioritizeSpaceFilling: false,
    allowShrinking: false,
    allowGrowing: true,  // Allow growing only to fill gaps
    maxOptimizationPasses: 2,
  },
  useLegacyFallback: true,
};

/**
 * Configuration preset for legacy behavior
 * Uses the original algorithm for backward compatibility
 */
export const LEGACY_CONFIG: MasonryPackingConfig = {
  ...DEFAULT_GRID_CONFIG,
  packingAlgorithm: 'legacy',
  rowPackingOptions: DEFAULT_ROW_PACKING_OPTIONS,
  useLegacyFallback: false,
};

/**
 * Preferred columns for section types
 * This defines the ideal number of columns a section should span
 * when space is available. Sections will gracefully degrade to fewer
 * columns when constrained.
 */
export type PreferredColumns = 1 | 2 | 3 | 4;

/**
 * Section type to preferred columns mapping
 */
export interface SectionColumnPreferences {
  [sectionType: string]: PreferredColumns;
}

/**
 * Default preferred columns per section type
 * - 1 column: compact sections (contact cards, simple info)
 * - 2 columns: medium sections (analytics, charts, maps)
 * - 3 columns: wide sections (overview with many fields)
 */
export const DEFAULT_SECTION_COLUMN_PREFERENCES: SectionColumnPreferences = {
  // Single column sections - compact
  'contact-card': 1,
  'network-card': 1,
  'project': 1,
  
  // Two column sections - medium
  'analytics': 2,
  'stats': 2,
  'chart': 2,
  'map': 2,
  'locations': 2,
  'financials': 2,
  'product': 2,
  'solutions': 2,
  'event': 2,
  'list': 2,
  'quotation': 2,
  'text-reference': 2,
  
  // Can expand to 3 columns with enough content
  'overview': 2,
  'info': 2,
  
  // Default for unknown types
  'default': 1,
};

// ============================================================================
// CALCULATION HELPERS
// ============================================================================

/**
 * Calculates the number of columns that fit within a container width
 * while ensuring each column is at least minColumnWidth pixels wide.
 * 
 * Formula: columns = floor((containerWidth + gap) / (minColumnWidth + gap))
 * 
 * @param containerWidth - Available container width in pixels
 * @param config - Grid configuration (optional, uses defaults)
 * @returns Number of columns (1 to maxColumns)
 */
export function calculateColumns(
  containerWidth: number,
  config: Partial<GridConfig> = {}
): number {
  const { 
    minColumnWidth = MIN_COLUMN_WIDTH, 
    maxColumns = MAX_COLUMNS, 
    gap = GRID_GAP 
  } = config;

  if (containerWidth <= 0) {
    return 1;
  }

  // Calculate how many columns fit
  // We add gap to containerWidth because the formula accounts for n-1 gaps
  const columns = Math.floor((containerWidth + gap) / (minColumnWidth + gap));
  
  // Clamp between 1 and maxColumns
  return Math.min(maxColumns, Math.max(1, columns));
}

/**
 * Calculates the actual column width based on container width and column count
 * 
 * @param containerWidth - Available container width in pixels
 * @param columns - Number of columns
 * @param gap - Gap between columns in pixels
 * @returns Width of each column in pixels
 */
export function calculateColumnWidth(
  containerWidth: number,
  columns: number,
  gap: number = GRID_GAP
): number {
  if (containerWidth <= 0 || columns <= 0) {
    return 0;
  }

  // Total gap space = (columns - 1) * gap
  const totalGapWidth = (columns - 1) * gap;
  
  // Available width for columns
  const availableWidth = containerWidth - totalGapWidth;
  
  // Width per column
  return availableWidth / columns;
}

/**
 * Calculates the minimum container width required for a given number of columns
 * 
 * @param columns - Desired number of columns
 * @param config - Grid configuration (optional, uses defaults)
 * @returns Minimum container width in pixels
 */
export function calculateMinContainerWidth(
  columns: number,
  config: Partial<GridConfig> = {}
): number {
  const { minColumnWidth = MIN_COLUMN_WIDTH, gap = GRID_GAP } = config;
  
  if (columns <= 0) {
    return 0;
  }

  // columns * minColumnWidth + (columns - 1) * gap
  return columns * minColumnWidth + (columns - 1) * gap;
}

/**
 * Gets the preferred column count for a section type
 * 
 * @param sectionType - The section type
 * @param preferences - Optional custom preferences map
 * @returns Preferred column count (1, 2, or 3)
 */
export function getPreferredColumns(
  sectionType: string,
  preferences: SectionColumnPreferences = DEFAULT_SECTION_COLUMN_PREFERENCES
): PreferredColumns {
  const type = sectionType?.toLowerCase() || 'default';
  return preferences[type] ?? preferences['default'] ?? 1;
}

/**
 * Resolves the effective column span for a section based on preference and availability
 * 
 * @param preferredColumns - The section's preferred column count
 * @param availableColumns - The total columns available in the container
 * @param explicitColSpan - Optional explicit colSpan override from section config
 * @returns The effective column span to use
 */
export function resolveColumnSpan(
  preferredColumns: PreferredColumns,
  availableColumns: number,
  explicitColSpan?: number
): number {
  // Explicit colSpan always takes precedence
  if (explicitColSpan !== undefined && explicitColSpan > 0) {
    return Math.min(explicitColSpan, availableColumns);
  }

  // Use preferred columns, constrained by available columns
  return Math.min(preferredColumns, availableColumns);
}

/**
 * Generates a CSS calc() expression for column width
 * 
 * @param columns - Total number of columns in the grid
 * @param colSpan - Number of columns this item spans
 * @param gap - Gap between columns in pixels
 * @returns CSS calc() expression string
 */
export function generateWidthExpression(
  columns: number,
  colSpan: number,
  gap: number = GRID_GAP
): string {
  if (columns <= 0 || colSpan <= 0) {
    return '100%';
  }

  const totalGap = gap * (columns - 1);
  const singleColumnWidth = `calc((100% - ${totalGap}px) / ${columns})`;

  if (colSpan === 1) {
    return singleColumnWidth;
  }

  // For multi-column spans: (singleWidth * colSpan) + (gap * (colSpan - 1))
  const spanGaps = gap * (colSpan - 1);
  return `calc(${singleColumnWidth} * ${colSpan} + ${spanGaps}px)`;
}

/**
 * Generates a CSS calc() expression for left position
 * 
 * @param columns - Total number of columns in the grid
 * @param columnIndex - The starting column index (0-based)
 * @param gap - Gap between columns in pixels
 * @returns CSS calc() expression string
 */
export function generateLeftExpression(
  columns: number,
  columnIndex: number,
  gap: number = GRID_GAP
): string {
  if (columns <= 0 || columnIndex <= 0) {
    return '0px';
  }

  const totalGap = gap * (columns - 1);
  const singleColumnWidth = `calc((100% - ${totalGap}px) / ${columns})`;

  // left = (singleWidth + gap) * columnIndex
  return `calc((${singleColumnWidth} + ${gap}px) * ${columnIndex})`;
}

// ============================================================================
// BREAKPOINT HELPERS
// ============================================================================

/**
 * Breakpoint definitions for responsive layout
 */
export const BREAKPOINTS = {
  xs: 0,
  sm: 544,   // 2 columns possible (544px = 2*260 + 1*12 + padding)
  md: 816,   // 3 columns possible (816px = 3*260 + 2*12 + padding)
  lg: 1088,  // 4 columns possible (1088px = 4*260 + 3*12 + padding)
  xl: 1024,
  '2xl': 1280,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

/**
 * Gets the breakpoint key for a given container width
 * 
 * @param width - Container width in pixels
 * @returns Breakpoint key
 */
export function getBreakpoint(width: number): BreakpointKey {
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

/**
 * Maps breakpoint to typical column count
 * 
 * @param breakpoint - Breakpoint key
 * @returns Suggested column count for the breakpoint
 */
export function getColumnsForBreakpoint(breakpoint: BreakpointKey): number {
  switch (breakpoint) {
    case 'xs': return 1;
    case 'sm': return 2;
    case 'md': return 3;
    case 'lg':
    case 'xl':
    case '2xl':
      return 4;
    default:
      return 1;
  }
}

