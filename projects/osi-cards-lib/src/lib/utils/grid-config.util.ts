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
// SECTION EXPANSION LIMITS
// ============================================================================

/**
 * Maximum column expansion allowed per section type.
 * This limits how wide a section can grow when filling remaining row space.
 * Prevents inappropriate expansion (e.g., contact cards becoming 4 columns wide).
 * 
 * Unlike preferredColumns (which is a starting point), these are hard limits
 * that the expansion logic will not exceed.
 */
export interface SectionExpansionLimits {
  [sectionType: string]: number;
}

/**
 * Default maximum expansion limits per section type.
 * These values represent the maximum sensible width for each section type,
 * regardless of available space.
 */
export const SECTION_MAX_EXPANSION: SectionExpansionLimits = {
  // Compact sections - should never expand much
  'contact-card': 2,    // Contact cards look bad when too wide
  'network-card': 2,    // Similar to contact cards
  'project': 1,         // Projects should stay single column
  'quotation': 2,       // Quotes are narrow content
  
  // Medium sections - can expand moderately
  'info': 2,            // Info sections work at 1-2 columns
  'list': 2,            // Lists are vertical, don't need width
  'event': 2,           // Events are timeline-oriented
  'timeline': 2,        // Timelines are vertical
  'financials': 2,      // Financial data is typically narrow
  'stats': 2,           // Stats are compact metrics
  'product': 2,         // Products don't need full width
  'solutions': 2,       // Solutions work at medium width
  'text-reference': 2,  // Text references are narrow
  
  // Wide sections - can expand more
  'analytics': 3,       // Analytics with multiple metrics can expand
  'locations': 3,       // Location maps can be wider
  
  // Full-width capable sections
  'chart': 4,           // Charts benefit from full width
  'map': 4,             // Maps benefit from full width
  'overview': 4,        // Overview sections can span full width
  
  // Conservative default for unknown types
  'default': 2,
};

/**
 * Content density threshold for expansion.
 * Sections with density below this value will not be expanded,
 * as sparse content looks bad when stretched across multiple columns.
 */
export const EXPANSION_DENSITY_THRESHOLD = 15;

/**
 * Gets the maximum expansion limit for a section type.
 * 
 * @param sectionType - The section type
 * @param limits - Optional custom limits map
 * @returns Maximum column span allowed for this section type
 */
export function getMaxExpansion(
  sectionType: string,
  limits: SectionExpansionLimits = SECTION_MAX_EXPANSION
): number {
  const type = sectionType?.toLowerCase() || 'default';
  return limits[type] ?? limits['default'] ?? 2;
}

/**
 * Section information needed for expansion decision
 */
export interface SectionExpansionInfo {
  /** Section type (e.g., 'contact-card', 'chart') */
  type?: string;
  /** Whether section can grow (canGrow !== false) */
  canGrow?: boolean;
  /** Explicit max columns limit from section config */
  maxColumns?: number;
  /** Content density score (calculated from measureContentDensity) */
  density?: number;
}

/**
 * Context for expansion decision
 */
export interface ExpansionContext {
  /** Current column span before expansion */
  currentSpan: number;
  /** Remaining columns in the row */
  remainingColumns: number;
  /** Total columns in the grid */
  totalColumns: number;
  /** Container width in pixels */
  containerWidth: number;
  /** Minimum column width in pixels */
  minColumnWidth?: number;
  /** Gap between columns in pixels */
  gap?: number;
  /** Whether any pending section can fit in remaining space */
  canPendingFit?: boolean;
}

/**
 * Result of expansion decision
 */
export interface ExpansionResult {
  /** Whether the section should expand */
  shouldExpand: boolean;
  /** Final column span after potential expansion */
  finalSpan: number;
  /** Reason for the decision (for debugging) */
  reason: string;
}

/**
 * Determines whether a section should expand to fill remaining row space.
 * Uses type-aware limits and content density checks to make intelligent decisions.
 * 
 * The function considers:
 * 1. Whether the section allows growth (canGrow)
 * 2. Type-based expansion limits
 * 3. Explicit maxColumns constraint from section config
 * 4. Content density (sparse content shouldn't expand)
 * 5. Whether remaining space can fit another section
 * 
 * @param section - Section information
 * @param context - Expansion context
 * @returns Expansion decision with reasoning
 */
export function shouldExpandSection(
  section: SectionExpansionInfo,
  context: ExpansionContext
): ExpansionResult {
  const {
    currentSpan,
    remainingColumns,
    totalColumns,
    containerWidth,
    minColumnWidth = MIN_COLUMN_WIDTH,
    gap = GRID_GAP,
    canPendingFit = false,
  } = context;

  // No expansion needed if no remaining space
  if (remainingColumns <= 0) {
    return {
      shouldExpand: false,
      finalSpan: currentSpan,
      reason: 'No remaining columns to expand into',
    };
  }

  // Check if section explicitly disallows growth
  if (section.canGrow === false) {
    return {
      shouldExpand: false,
      finalSpan: currentSpan,
      reason: 'Section has canGrow=false',
    };
  }

  // Calculate type-aware max expansion limit
  const sectionType = section.type?.toLowerCase() || 'default';
  const typeMaxExpansion = getMaxExpansion(sectionType);
  
  // Effective max is minimum of: type limit, explicit maxColumns, total columns
  const effectiveMaxSpan = Math.min(
    typeMaxExpansion,
    section.maxColumns ?? totalColumns,
    totalColumns
  );

  // Calculate potential expanded span
  const potentialSpan = currentSpan + remainingColumns;

  // Check if expansion would exceed type-aware limit
  if (potentialSpan > effectiveMaxSpan) {
    // Calculate how much we CAN expand
    const allowedExpansion = effectiveMaxSpan - currentSpan;
    
    if (allowedExpansion <= 0) {
      return {
        shouldExpand: false,
        finalSpan: currentSpan,
        reason: `Type '${sectionType}' at max expansion limit (${effectiveMaxSpan})`,
      };
    }
    
    // Partial expansion up to the limit
    return {
      shouldExpand: true,
      finalSpan: effectiveMaxSpan,
      reason: `Partial expansion to type limit (${effectiveMaxSpan})`,
    };
  }

  // Check content density - sparse content shouldn't expand
  const density = section.density ?? 0;
  if (density < EXPANSION_DENSITY_THRESHOLD && remainingColumns > 0) {
    // Allow expansion only if remaining space is truly unusable
    const gapTotal = gap * (totalColumns - 1);
    const columnWidthPx = (containerWidth - gapTotal) / totalColumns;
    const remainingWidthPx = remainingColumns * columnWidthPx + 
      (remainingColumns > 0 ? (remainingColumns - 1) * gap : 0);
    
    // If another section COULD fit, don't expand sparse content
    if (remainingWidthPx >= minColumnWidth || canPendingFit) {
      return {
        shouldExpand: false,
        finalSpan: currentSpan,
        reason: `Content density (${density}) below threshold (${EXPANSION_DENSITY_THRESHOLD})`,
      };
    }
  }

  // Check if remaining space can fit another section
  const gapTotal = gap * (totalColumns - 1);
  const columnWidthPx = (containerWidth - gapTotal) / totalColumns;
  const remainingWidthPx = remainingColumns * columnWidthPx + 
    (remainingColumns > 0 ? (remainingColumns - 1) * gap : 0);

  // Expand only if:
  // 1. Remaining space can't fit minimum width section, OR
  // 2. No pending section can fit in the remaining columns
  const spaceIsUnusable = remainingWidthPx < minColumnWidth;
  const nothingCanFit = !canPendingFit;

  if (spaceIsUnusable || nothingCanFit) {
    return {
      shouldExpand: true,
      finalSpan: potentialSpan,
      reason: spaceIsUnusable 
        ? 'Remaining space too small for any section'
        : 'No pending section can fit in remaining space',
    };
  }

  // Default: don't expand, let other sections fill the space
  return {
    shouldExpand: false,
    finalSpan: currentSpan,
    reason: 'Space available for other sections',
  };
}

/**
 * Simple content density calculation for expansion decisions.
 * This is a lightweight version that can be used standalone.
 * For full density calculation, use measureContentDensity from smart-grid.util.
 * 
 * @param fields - Array of fields in the section
 * @param items - Array of items in the section
 * @param description - Section description text
 * @returns Density score (higher = more content)
 */
export function calculateBasicDensity(
  fields?: Array<{ label?: string; value?: unknown }>,
  items?: unknown[],
  description?: string
): number {
  const textLength = (description?.length ?? 0) + 
    (fields?.reduce((acc, f) => acc + String(f.value ?? '').length + (f.label?.length ?? 0), 0) ?? 0);
  const itemCount = items?.length ?? 0;
  const fieldCount = fields?.length ?? 0;
  
  const textScore = textLength / 50;  // 1 point per 50 chars
  const itemScore = itemCount * 3;     // 3 points per item
  const fieldScore = fieldCount * 2;   // 2 points per field
  
  return Math.round(textScore + itemScore + fieldScore);
}

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

