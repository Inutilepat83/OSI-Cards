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
export const MIN_COLUMN_WIDTH = 220;

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
 * - 'column-based': Column-based FFDH algorithm (places cards in shortest column)
 */
export type PackingAlgorithm = 'legacy' | 'row-first' | 'skyline' | 'column-based';

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
 * Configuration for the column-based packing algorithm
 */
export interface ColumnPackingOptions {
  /**
   * Packing mode: 'ffdh' (fast, effective), 'skyline' (maximum compaction), or 'hybrid' (adaptive)
   * @default 'ffdh'
   */
  packingMode?: 'ffdh' | 'skyline' | 'hybrid';

  /**
   * Whether to allow reordering sections for optimal packing
   * @default true
   */
  allowReordering?: boolean;

  /**
   * Whether to sort sections by height before packing (FFDH = First Fit Decreasing Height)
   * @default true
   */
  sortByHeight?: boolean;

  /**
   * Gap count threshold for hybrid mode to switch to Skyline algorithm
   * @default 3
   */
  useSkylineThreshold?: number;

  /**
   * Number of optimization passes for FFDH algorithm (1-3)
   * More passes = better results but slower. Default: 2
   * @default 2
   */
  optimizationPasses?: number;

  /**
   * Enable gap-aware placement that considers gap creation when placing sections
   * @default true
   */
  enableGapAwarePlacement?: boolean;
}

/**
 * Default column packing options
 */
export const DEFAULT_COLUMN_PACKING_OPTIONS: Required<ColumnPackingOptions> = {
  packingMode: 'ffdh',
  allowReordering: true,
  sortByHeight: true,
  useSkylineThreshold: 1, // Very aggressive: Switch to Skyline at first gap
  optimizationPasses: 4, // Increased: Maximum compactness through more passes
  enableGapAwarePlacement: true,
};

/**
 * Default row packing options
 */
export const DEFAULT_ROW_PACKING_OPTIONS: RowPackingOptions = {
  prioritizeSpaceFilling: true,
  allowShrinking: true,
  allowGrowing: true,
  maxOptimizationPasses: 5,
};

/**
 * Extended configuration for masonry grid with packing options
 */
export interface MasonryPackingConfig extends GridConfig {
  /**
   * Which packing algorithm to use
   * @default 'column-based'
   */
  packingAlgorithm: PackingAlgorithm;

  /**
   * Options for the row-first packing algorithm
   * Only used when packingAlgorithm is 'row-first'
   */
  rowPackingOptions: RowPackingOptions;

  /**
   * Options for the column-based packing algorithm
   * Only used when packingAlgorithm is 'column-based'
   */
  columnPackingOptions?: ColumnPackingOptions;

  /**
   * Whether to use the legacy algorithm as a fallback
   * when the selected algorithm fails
   * @default true
   */
  useLegacyFallback: boolean;
}

/**
 * Default masonry packing configuration
 * Uses column-based algorithm by default for optimal space utilization
 * Set packingAlgorithm to 'row-first' or 'legacy' for backward compatibility
 */
export const DEFAULT_MASONRY_PACKING_CONFIG: MasonryPackingConfig = {
  ...DEFAULT_GRID_CONFIG,
  packingAlgorithm: 'column-based',
  rowPackingOptions: DEFAULT_ROW_PACKING_OPTIONS,
  columnPackingOptions: DEFAULT_COLUMN_PACKING_OPTIONS,
  useLegacyFallback: true,
};

/**
 * Configuration preset for maximum space utilization
 * Uses column-based packing with hybrid mode for best compaction
 */
export const SPACE_OPTIMIZED_CONFIG: MasonryPackingConfig = {
  ...DEFAULT_GRID_CONFIG,
  packingAlgorithm: 'column-based',
  rowPackingOptions: {
    ...DEFAULT_ROW_PACKING_OPTIONS,
    prioritizeSpaceFilling: true, // Aggressively fill rows
    allowShrinking: true, // Allow shrinking for better consolidation
    maxOptimizationPasses: 6, // Maximum passes for best results
  },
  columnPackingOptions: {
    packingMode: 'hybrid',
    allowReordering: true,
    sortByHeight: true,
    useSkylineThreshold: 1, // Very aggressive: switch to Skyline at first gap
    optimizationPasses: 5, // Maximum optimization passes for compactness
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
    allowGrowing: true, // Allow growing only to fill gaps
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
 * Provides variety: 1, 2, 3, or 4 columns based on section type
 * - 1 column: compact sections (contact-card, project)
 * - 2 columns: medium sections (most common)
 * - 3 columns: wide sections (timeline, financials)
 * - 4 columns: full-width sections (hero, header)
 */
export const DEFAULT_SECTION_COLUMN_PREFERENCES: SectionColumnPreferences = {
  // 1 column - compact sections
  'contact-card': 1,
  project: 1,
  faq: 1,

  // 2 columns - medium sections (most common)
  'network-card': 2,
  analytics: 2,
  stats: 2,
  chart: 2,
  map: 2,
  locations: 2,
  product: 2,
  solutions: 2,
  event: 2,
  list: 2,
  quotation: 2,
  'text-reference': 2,
  info: 2,
  news: 2,
  gallery: 2,
  video: 2,
  'social-media': 2,
  'brand-colors': 2,

  // 3 columns - wide sections
  timeline: 3,
  financials: 3,

  // 4 columns - full-width sections
  hero: 4,
  header: 4,

  // Default for unknown types - 2 columns
  default: 2,
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
 *
 * UPDATED: Increased limits to allow better gap filling while maintaining
 * reasonable content density.
 */
export const SECTION_MAX_EXPANSION: SectionExpansionLimits = {
  // Compact sections - can expand to fill gaps
  'contact-card': 3, // Contact cards can expand for multiple contacts
  'network-card': 3, // Network cards can show more connections
  project: 2, // Projects can expand slightly
  quotation: 3, // Quotes can expand for readability

  // Medium sections - can expand more freely
  list: 3, // Lists can expand for better readability
  event: 3, // Events can expand
  timeline: 3, // Timelines can expand
  financials: 3, // Financial data can expand for more metrics
  stats: 3, // Stats can expand for more metrics
  product: 3, // Products can expand
  solutions: 3, // Solutions work at medium width
  'text-reference': 3, // Text references can expand

  // Wide sections - can expand fully
  analytics: 4, // Analytics with multiple metrics can expand fully
  locations: 4, // Location maps can be wider

  // Full-width capable sections
  chart: 4, // Charts benefit from full width
  map: 4, // Maps benefit from full width

  // More permissive default for unknown types
  default: 3,
};

// ============================================================================
// CARD-LEVEL LAYOUT CONFIGURATION (Points 77-79)
// ============================================================================

/**
 * Per-card layout configuration (Point 77)
 * Allows customization of layout behavior on a per-card basis.
 */
export interface CardLayoutConfig {
  /**
   * Card identifier for tracking
   */
  cardId?: string;

  /**
   * Maximum columns for this card (overrides global)
   */
  maxColumns?: number;

  /**
   * Preferred algorithm for this card
   */
  preferredAlgorithm?: PackingAlgorithm;

  /**
   * Gap size in pixels (overrides global)
   */
  gapSize?: number;

  /**
   * Priority multiplier for all sections in this card (Point 79)
   * Values > 1 increase priority, < 1 decrease priority
   */
  priorityMultiplier?: number;

  /**
   * Whether to enable layout optimization for this card
   */
  enableOptimization?: boolean;

  /**
   * Custom expansion limits for this card (Point 78)
   */
  expansionLimits?: Partial<SectionExpansionLimits>;

  /**
   * Custom column preferences for this card
   */
  columnPreferences?: Partial<SectionColumnPreferences>;
}

/**
 * Default card layout configuration
 */
export const DEFAULT_CARD_LAYOUT_CONFIG: CardLayoutConfig = {
  maxColumns: MAX_COLUMNS,
  priorityMultiplier: 1,
  enableOptimization: true,
};

/**
 * Merges card config with global config
 */
export function mergeCardConfig(
  globalConfig: MasonryPackingConfig,
  cardConfig?: CardLayoutConfig
): MasonryPackingConfig {
  if (!cardConfig) {
    return globalConfig;
  }

  return {
    ...globalConfig,
    maxColumns: cardConfig.maxColumns ?? globalConfig.maxColumns,
    gap: cardConfig.gapSize ?? globalConfig.gap,
    packingAlgorithm: cardConfig.preferredAlgorithm ?? globalConfig.packingAlgorithm,
  };
}

/**
 * Applies card-level priority multiplier to section priority (Point 79)
 */
export function applyCardPriorityMultiplier(
  sectionPriority: number,
  cardConfig?: CardLayoutConfig
): number {
  const multiplier = cardConfig?.priorityMultiplier ?? 1;
  // Higher priority number = lower visual priority
  // So we divide by multiplier to increase priority when multiplier > 1
  return Math.max(1, Math.min(4, sectionPriority / multiplier));
}

/**
 * Gets expansion limit for a section type, considering card overrides (Point 78)
 */
export function getEffectiveExpansionLimit(
  sectionType: string,
  cardConfig?: CardLayoutConfig
): number {
  // Check card-level override first
  if (cardConfig?.expansionLimits?.[sectionType] !== undefined) {
    return cardConfig.expansionLimits[sectionType]!;
  }

  // Fall back to global defaults
  return SECTION_MAX_EXPANSION[sectionType] ?? SECTION_MAX_EXPANSION['default'] ?? 3;
}

/**
 * Gets preferred columns for a section type, considering card overrides
 */
export function getEffectiveColumnPreference(
  sectionType: string,
  cardConfig?: CardLayoutConfig
): PreferredColumns {
  // Check card-level override first
  if (cardConfig?.columnPreferences?.[sectionType] !== undefined) {
    return cardConfig.columnPreferences[sectionType] as PreferredColumns;
  }

  // Fall back to global defaults
  return (DEFAULT_SECTION_COLUMN_PREFERENCES[sectionType] ??
    DEFAULT_SECTION_COLUMN_PREFERENCES['default'] ??
    2) as PreferredColumns;
}

// ============================================================================
// CSS VARIABLE INTEGRATION (Point 80)
// ============================================================================

/**
 * CSS variable names for theming
 */
export const CSS_THEME_VARS = {
  /** Masonry gap between sections */
  masonryGap: '--masonry-gap',
  /** Column count */
  masonryColumns: '--masonry-columns',
  /** Calculated column width */
  masonryColumnWidth: '--masonry-column-width',
  /** Container width */
  masonryContainerWidth: '--masonry-container-width',
  /** Section border radius */
  sectionBorderRadius: '--section-border-radius',
  /** Section padding */
  sectionPadding: '--section-padding',
};

/**
 * Reads gap from CSS variable if available, falls back to config/default
 */
export function getGapFromTheme(element?: HTMLElement | null, fallback: number = GRID_GAP): number {
  if (typeof getComputedStyle === 'undefined' || !element) {
    return fallback;
  }

  try {
    const computedStyle = getComputedStyle(element);
    const cssGap = computedStyle.getPropertyValue(CSS_THEME_VARS.masonryGap).trim();

    if (cssGap) {
      const parsed = parseInt(cssGap, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore errors, use fallback
  }

  return fallback;
}

/**
 * Sets CSS variables on a container element
 */
export function setCssVariables(
  element: HTMLElement,
  config: {
    gap: number;
    columns: number;
    columnWidth?: number;
    containerWidth?: number;
  }
): void {
  element.style.setProperty(CSS_THEME_VARS.masonryGap, `${config.gap}px`);
  element.style.setProperty(CSS_THEME_VARS.masonryColumns, String(config.columns));

  if (config.columnWidth !== undefined) {
    element.style.setProperty(CSS_THEME_VARS.masonryColumnWidth, `${config.columnWidth}px`);
  }

  if (config.containerWidth !== undefined) {
    element.style.setProperty(CSS_THEME_VARS.masonryContainerWidth, `${config.containerWidth}px`);
  }
}

// ============================================================================
// SECTION TYPE DEFAULTS FROM REGISTRY (Point 76)
// ============================================================================

/**
 * Section type configuration loaded from registry
 */
export interface SectionTypeDefaults {
  type: string;
  preferredColumns: PreferredColumns;
  maxExpansion: number;
  minHeight: number;
  maxHeight: number;
  canShrink: boolean;
  canGrow: boolean;
}

/**
 * Registry of section type defaults
 * This should be generated from section-registry.json
 */
let _sectionTypeRegistry: Map<string, SectionTypeDefaults> | null = null;

/**
 * Initialize the section type registry from JSON data
 */
export function initializeSectionTypeRegistry(
  registryData: Array<{
    type: string;
    layout?: {
      preferredColumns?: number;
      maxExpansion?: number;
      minHeight?: number;
      maxHeight?: number;
      canShrink?: boolean;
      canGrow?: boolean;
    };
  }>
): void {
  _sectionTypeRegistry = new Map();

  for (const entry of registryData) {
    const defaults: SectionTypeDefaults = {
      type: entry.type,
      preferredColumns: (entry.layout?.preferredColumns ??
        DEFAULT_SECTION_COLUMN_PREFERENCES[entry.type] ??
        2) as PreferredColumns,
      maxExpansion: entry.layout?.maxExpansion ?? SECTION_MAX_EXPANSION[entry.type] ?? 3,
      minHeight: entry.layout?.minHeight ?? 100,
      maxHeight: entry.layout?.maxHeight ?? 600,
      canShrink: entry.layout?.canShrink ?? true,
      canGrow: entry.layout?.canGrow ?? true,
    };

    _sectionTypeRegistry.set(entry.type, defaults);
  }
}

/**
 * Get section type defaults from registry
 */
export function getSectionTypeDefaults(sectionType: string): SectionTypeDefaults | undefined {
  return _sectionTypeRegistry?.get(sectionType);
}

/**
 * Check if registry is initialized
 */
export function isSectionTypeRegistryInitialized(): boolean {
  return _sectionTypeRegistry !== null;
}

// ============================================================================
// EXISTING CONFIGURATION (continued)
// ============================================================================

/**
 * Content density threshold for expansion.
 * Lowered to 5 to allow more aggressive gap filling and better consolidation.
 * Sections with density >= 5 can expand to fill gaps, promoting side-by-side placement.
 */
export const EXPANSION_DENSITY_THRESHOLD = 5;

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
  type?: string | undefined;
  /** Whether section can grow (canGrow !== false) */
  canGrow?: boolean | undefined;
  /** Explicit max columns limit from section config */
  maxColumns?: number | undefined;
  /** Content density score (calculated from measureContentDensity) */
  density?: number | undefined;
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
    const remainingWidthPx =
      remainingColumns * columnWidthPx + (remainingColumns > 0 ? (remainingColumns - 1) * gap : 0);

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
  const remainingWidthPx =
    remainingColumns * columnWidthPx + (remainingColumns > 0 ? (remainingColumns - 1) * gap : 0);

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
  const textLength =
    (description?.length ?? 0) +
    (fields?.reduce((acc, f) => acc + String(f.value ?? '').length + (f.label?.length ?? 0), 0) ??
      0);
  const itemCount = items?.length ?? 0;
  const fieldCount = fields?.length ?? 0;

  const textScore = textLength / 50; // 1 point per 50 chars
  const itemScore = itemCount * 3; // 3 points per item
  const fieldScore = fieldCount * 2; // 2 points per field

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
export function calculateColumns(containerWidth: number, config: Partial<GridConfig> = {}): number {
  const { minColumnWidth = MIN_COLUMN_WIDTH, maxColumns = MAX_COLUMNS, gap = GRID_GAP } = config;

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
 * @param sectionComponent - Optional section component instance (for dynamic preferences)
 * @param availableColumns - Optional available columns in grid
 * @returns Preferred column count (1, 2, or 3)
 */
export function getPreferredColumns(
  sectionType: string,
  preferences: SectionColumnPreferences = DEFAULT_SECTION_COLUMN_PREFERENCES,
  sectionComponent?: any, // BaseSectionComponent instance
  availableColumns: number = 4
): PreferredColumns {
  // NEW: Try to get preferences from section component first (dynamic)
  if (sectionComponent && typeof sectionComponent.getLayoutPreferences === 'function') {
    try {
      const layoutPrefs = sectionComponent.getLayoutPreferences(availableColumns);
      return layoutPrefs.preferredColumns;
    } catch (error) {
      // Only warn in development mode
      const isDevelopment =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      if (isDevelopment) {
        console.warn(
          '[GridConfig] Failed to get layout preferences from section component:',
          error
        );
      }
      // Fall through to static preferences
    }
  }

  // Fallback to static preferences (deprecated but kept for backward compatibility)
  const type = sectionType?.toLowerCase() || 'default';
  const staticPref = preferences[type] ?? preferences['default'] ?? 1;

  // Warn if using deprecated static preferences (only in development)
  const isDevelopment =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  if (isDevelopment && !sectionComponent) {
    console.warn(
      `[GridConfig] Using deprecated static preferences for section type "${type}". ` +
        `Consider implementing getLayoutPreferences() in the section component.`
    );
  }

  return staticPref;
}

/**
 * Resolves the effective column span for a section based on preference and availability
 *
 * @param preferredColumns - The section's preferred column count
 * @param availableColumns - The total columns available in the container
 * @param explicitColSpan - Optional explicit colSpan override from section config
 * @param sectionComponent - Optional section component instance (for dynamic preferences)
 * @param canShrinkToFill - Whether section can shrink to 1 column to fill grid
 * @returns The effective column span to use
 */
export function resolveColumnSpan(
  preferredColumns: PreferredColumns,
  availableColumns: number,
  explicitColSpan?: number,
  sectionComponent?: any, // BaseSectionComponent instance
  canShrinkToFill?: boolean
): number {
  // Explicit colSpan always takes precedence
  if (explicitColSpan !== undefined && explicitColSpan > 0) {
    return Math.min(explicitColSpan, availableColumns);
  }

  // Get layout preferences from section component if available
  if (sectionComponent && typeof sectionComponent.getLayoutPreferences === 'function') {
    try {
      const layoutPrefs = sectionComponent.getLayoutPreferences(availableColumns);
      const effectivePref = Math.min(layoutPrefs.preferredColumns, availableColumns);

      // Respect min/max constraints
      const minCols = Math.max(1, layoutPrefs.minColumns);
      const maxCols = Math.min(availableColumns, layoutPrefs.maxColumns);

      let result = Math.max(minCols, Math.min(effectivePref, maxCols));

      // If canShrinkToFill is true and we need to fill gaps, allow shrinking to 1
      if (canShrinkToFill && layoutPrefs.canShrinkToFill) {
        result = Math.max(1, result); // Can go down to 1
      }

      return result;
    } catch (error) {
      // Only warn in development mode
      const isDevelopment =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      if (isDevelopment) {
        console.warn('[GridConfig] Failed to resolve column span from section component:', error);
      }
      // Fall through to static preferences
    }
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
 * @param padding - Optional container padding (left + right) in pixels
 * @returns CSS calc() expression string
 */
export function generateWidthExpression(
  columns: number,
  colSpan: number,
  gap: number = GRID_GAP,
  padding: number = 0
): string {
  if (columns <= 0 || colSpan <= 0) {
    return padding > 0 ? `calc(100% - ${padding}px)` : '100%';
  }

  const totalGap = gap * (columns - 1);
  const contentWidth = padding > 0 ? `calc(100% - ${padding}px)` : '100%';
  const singleColumnWidth = `calc((${contentWidth} - ${totalGap}px) / ${columns})`;

  if (colSpan === 1) {
    return singleColumnWidth;
  }

  // For multi-column spans: (singleWidth * colSpan) + (gap * (colSpan - 1))
  const spanGaps = gap * (colSpan - 1);
  return `calc((${singleColumnWidth} * ${colSpan}) + ${spanGaps}px)`;
}

/**
 * Generates a CSS calc() expression for left position
 *
 * @param columns - Total number of columns in the grid
 * @param columnIndex - The starting column index (0-based)
 * @param gap - Gap between columns in pixels
 * @param paddingLeft - Optional container left padding in pixels
 * @returns CSS calc() expression string
 */
export function generateLeftExpression(
  columns: number,
  columnIndex: number,
  gap: number = GRID_GAP,
  paddingLeft: number = 0
): string {
  if (columns <= 0 || columnIndex < 0) {
    return `${paddingLeft}px`;
  }

  if (columnIndex === 0) {
    return `${paddingLeft}px`;
  }

  const totalGap = gap * (columns - 1);
  const contentWidth = paddingLeft > 0 ? `calc(100% - ${paddingLeft * 2}px)` : '100%';
  const singleColumnWidth = `calc((${contentWidth} - ${totalGap}px) / ${columns})`;

  // left = paddingLeft + (singleWidth + gap) * columnIndex
  return `calc(${paddingLeft}px + (${singleColumnWidth} + ${gap}px) * ${columnIndex})`;
}

// ============================================================================
// BREAKPOINT HELPERS
// ============================================================================

/**
 * Breakpoint definitions for responsive layout
 */
export const BREAKPOINTS = {
  xs: 0,
  sm: 464, // 2 columns possible (464px = 2*220 + 1*12 + padding)
  md: 684, // 3 columns possible (684px = 3*220 + 2*12 + padding)
  lg: 904, // 4 columns possible (904px = 4*220 + 3*12 + padding)
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
    case 'xs':
      return 1;
    case 'sm':
      return 2;
    case 'md':
      return 3;
    case 'lg':
    case 'xl':
    case '2xl':
      return 4;
    default:
      return 1;
  }
}
