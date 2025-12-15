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
 * This utility aligns with the 40-Point Section Placement System:
 * - Points 1-10: Core Layout Algorithm (single-pass, column selection)
 * - Points 11-20: Performance & Optimization (caching, debouncing)
 * - Points 21-30: Height Management (estimation, measurement)
 * - Points 31-40: State Management & Quality (validation, metrics)
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

import { CardField, CardSection, LayoutPriority } from '../models/card.model';
import {
  EXPANSION_DENSITY_THRESHOLD,
  generateLeftExpression,
  generateWidthExpression,
  getMaxExpansion,
} from './grid-config.util';

// ============================================================================
// HEIGHT ESTIMATION
// ============================================================================

import { HeightEstimationService } from '../services/height-estimation.service';

// Create a singleton instance for use in utility functions
// Note: In Angular components, inject the service instead
let heightEstimationServiceInstance: HeightEstimationService | null = null;

function getHeightEstimationService(): HeightEstimationService {
  if (!heightEstimationServiceInstance) {
    heightEstimationServiceInstance = new HeightEstimationService();
  }
  return heightEstimationServiceInstance;
}

/**
 * Estimates the height of a section based on its content
 * Uses HeightEstimationService for consistent estimates
 */
function estimateSectionHeight(section: CardSection, colSpan?: number): number {
  const service = getHeightEstimationService();
  return service.estimate(section, { colSpan });
}

/**
 * Measures the content density of a section
 */
function measureContentDensity(section: CardSection): number {
  const textLength =
    (section.description?.length ?? 0) +
    (section.fields?.reduce(
      (acc: number, f: CardField) => acc + String(f.value ?? '').length + (f.label?.length ?? 0),
      0
    ) ?? 0);
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
  column: number;
  preferredColumns: 1 | 2 | 3 | 4;
  left: string;
  top: number;
  width: string;
  height: number;
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
  lookAheadCount: 5, // UPDATED (Point 17): Increased from 3 to 5 for better combinations
  alignLeft: true,
  enableSwapping: true,
};

// ============================================================================
// ADAPTIVE LOOK-AHEAD (Point 17)
// ============================================================================

/**
 * Calculates adaptive look-ahead count based on layout complexity.
 * Reduces look-ahead for complex layouts to avoid O(n!) explosion.
 *
 * @param totalSections - Total number of sections remaining
 * @param totalColumns - Number of columns in the grid
 * @param baseLookAhead - Base look-ahead count from config
 * @returns Adaptive look-ahead count
 */
function calculateAdaptiveLookAhead(
  totalSections: number,
  totalColumns: number,
  baseLookAhead: number
): number {
  // For few sections, use full look-ahead
  if (totalSections <= 10) {
    return baseLookAhead;
  }

  // Reduce look-ahead for many sections (complexity grows factorially)
  if (totalSections <= 20) {
    return Math.max(3, baseLookAhead - 1);
  }

  // For very large layouts, use minimal look-ahead
  if (totalSections > 50) {
    return 2;
  }

  return Math.max(2, baseLookAhead - 2);
}

// ============================================================================
// WEIGHTED ORPHAN PENALTY (Point 18)
// ============================================================================

/**
 * Calculates weighted orphan penalty for a placement decision.
 * Considers remaining sections' minimum spans when calculating penalty.
 *
 * @param remainingGap - Gap left in the current row
 * @param pendingSections - Sections yet to be placed
 * @returns Weighted penalty score (lower is better)
 */
function calculateOrphanPenalty(remainingGap: number, pendingSections: PlannedSection[]): number {
  if (remainingGap === 0) return 0;

  let penalty = 0;

  // Check how many sections can potentially fill the gap
  let fillableSections = 0;
  let totalMinWidth = 0;

  for (const section of pendingSections) {
    if (section.minWidth <= remainingGap) {
      fillableSections++;
    }
    totalMinWidth += section.minWidth;
  }

  // No sections can fill the gap - high penalty
  if (fillableSections === 0 && pendingSections.length > 0) {
    penalty += remainingGap * 10;
  }

  // Few sections can fill - moderate penalty
  if (fillableSections === 1) {
    penalty += remainingGap * 3;
  }

  // Weight by how many sections we're orphaning
  const orphanRatio = pendingSections.length / Math.max(1, fillableSections);
  penalty *= 1 + orphanRatio * 0.5;

  // Consider if remaining sections have wide minimum widths
  const avgMinWidth = pendingSections.length > 0 ? totalMinWidth / pendingSections.length : 1;
  if (avgMinWidth > remainingGap) {
    penalty += remainingGap * 5; // Gap is smaller than average minimum - bad
  }

  return penalty;
}

// ============================================================================
// PRIORITY MAPPING
// ============================================================================

/**
 * Maps string priority to numeric layout priority
 */
export function mapPriorityToNumber(
  priority?: 1 | 2 | 3,
  layoutPriority?: LayoutPriority
): LayoutPriority {
  // Explicit layoutPriority takes precedence
  if (layoutPriority !== undefined) {
    return layoutPriority;
  }
  // Priority is now numeric, use it directly
  if (priority !== undefined) {
    return priority as LayoutPriority;
  }

  // Default to standard priority (2) if not set
  return 2;
}

// ============================================================================
// SECTION PREPARATION
// ============================================================================

/**
 * Type-based default preferred widths
 * UPDATED: Increased preferred widths to better fill rows and avoid gaps
 */
const TYPE_PREFERRED_WIDTHS: Record<string, number> = {
  overview: 4,
  chart: 2,
  map: 2,
  locations: 2,
  analytics: 2, // Increased from 1 - metrics benefit from more space
  stats: 2, // Increased from 1 - stats benefit from more space
  'contact-card': 1,
  'network-card': 2, // Increased from 1 - networks often have multiple connections
  info: 1,
  list: 1,
  event: 2, // Increased from 1 - events have dates and descriptions
  financials: 2, // Increased from 1 - financial data benefits from more space
  product: 2,
  solutions: 2,
  quotation: 2, // Increased from 1 - quotes benefit from wider display
  'text-reference': 2,
  timeline: 2, // Increased from 1 - timelines benefit from more space
  project: 1,
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
    const canGrow =
      section.canGrow !== false && section.flexGrow !== false && fullConfig.allowGrowing;

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
 * Look-ahead mechanism to find the best combination of sections to fill a row.
 * UPDATED (Points 17, 18): Uses adaptive look-ahead and weighted orphan penalty.
 * Returns the optimal set of section indices that together fill the row completely.
 */
function findOptimalCombination(
  available: PlannedSection[],
  targetWidth: number,
  lookAheadCount: number
): number[] | null {
  // UPDATED (Point 17): Use adaptive look-ahead based on remaining sections
  const adaptiveLookAhead = calculateAdaptiveLookAhead(
    available.length,
    targetWidth,
    lookAheadCount
  );
  const candidates = available.slice(0, Math.min(adaptiveLookAhead + 3, available.length));

  // Track best combination with penalty scoring
  let bestCombo: number[] | null = null;
  let bestScore = -Infinity;

  // Try to find combinations with penalty consideration
  // Start with single sections, then pairs, then triples, then quads
  const maxComboSize = Math.min(4, candidates.length); // Allow up to 4 sections for better filling

  for (let combinationSize = 1; combinationSize <= maxComboSize; combinationSize++) {
    const combinations = getCombinations(candidates.length, combinationSize);

    for (const combo of combinations) {
      const totalWidth = combo.reduce(
        (sum, idx) => sum + (candidates[idx]?.preferredWidth ?? 0),
        0
      );

      // Skip if exceeds target
      if (totalWidth > targetWidth) continue;

      // Calculate remaining gap
      const gap = targetWidth - totalWidth;

      // UPDATED (Point 18): Calculate weighted orphan penalty
      // Consider remaining sections after this combo
      const remainingAfterCombo = available.filter((_, idx) => !combo.includes(idx));
      const penalty = calculateOrphanPenalty(gap, remainingAfterCombo);

      // Score: maximize fill, minimize penalty
      // Exact fit (gap = 0) gets huge bonus
      const fillScore = totalWidth * 10;
      const exactFitBonus = gap === 0 ? 1000 : 0;
      const score = fillScore + exactFitBonus - penalty;

      if (score > bestScore) {
        bestScore = score;
        bestCombo = combo;
      }
    }
  }

  return bestCombo;
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

// ============================================================================
// LIMITED BACKTRACKING (Point 19)
// ============================================================================

/**
 * Backtracking result containing improved row layout
 */
interface BacktrackResult {
  improved: boolean;
  newRowSections: RowPlacedSection[];
  newRemaining: PlannedSection[];
  newGap: number;
}

/**
 * Tries limited backtracking by swapping last 2 placed sections with candidates.
 * If row ends with gap > 0, tries to find a better combination by:
 * 1. Removing the last placed section
 * 2. Finding a better candidate from remaining that fills the gap
 * 3. Or swapping positions of last 2 sections
 *
 * @param currentRow - Current row sections
 * @param remaining - Remaining sections not yet placed
 * @param totalColumns - Total columns in grid
 * @param currentGap - Current gap in the row
 * @param rowIndex - Current row index
 * @param config - Row packer config
 * @returns Backtrack result indicating if improvement was made
 */
function tryBacktrackSwap(
  currentRow: RowPlacedSection[],
  remaining: PlannedSection[],
  totalColumns: number,
  currentGap: number,
  rowIndex: number,
  config: Required<RowPackerConfig>
): BacktrackResult {
  const noImprovement: BacktrackResult = {
    improved: false,
    newRowSections: currentRow,
    newRemaining: remaining,
    newGap: currentGap,
  };

  // Need at least 2 sections to swap
  if (currentRow.length < 2) {
    return noImprovement;
  }

  // Try Strategy 1: Replace last section with a better fitting one
  const lastSection = currentRow[currentRow.length - 1];
  if (!lastSection) return noImprovement;

  const lastSectionWidth = lastSection.finalWidth;
  const targetWidth = lastSectionWidth + currentGap;

  // Find a section from remaining that exactly fills the gap
  const exactFitIdx = remaining.findIndex(
    (s) =>
      s.preferredWidth === targetWidth ||
      (s.canShrink && s.minWidth <= targetWidth && s.preferredWidth >= targetWidth)
  );

  if (exactFitIdx >= 0) {
    // Found an exact fit - swap it in
    const newSections = [...currentRow];
    const newRemaining = [...remaining];

    // Remove the new section from remaining
    const [newSection] = newRemaining.splice(exactFitIdx, 1);
    if (!newSection) return noImprovement;

    // Remove last section from row and put back to remaining
    const removedFromRow = newSections.pop();
    if (removedFromRow) {
      // Convert back to PlannedSection
      const plannedSection: PlannedSection = {
        section: removedFromRow.section,
        originalIndex: removedFromRow.originalIndex,
        minWidth: removedFromRow.minWidth,
        preferredWidth: removedFromRow.preferredWidth,
        maxWidth: removedFromRow.maxWidth,
        priority: removedFromRow.priority,
        isFlexible: removedFromRow.isFlexible,
        canShrink: removedFromRow.canShrink,
        canGrow: removedFromRow.canGrow,
        estimatedHeight: removedFromRow.estimatedHeight,
        density: removedFromRow.density,
      };
      newRemaining.push(plannedSection);
    }

    // Calculate position for new section
    let column = 0;
    for (const s of newSections) {
      column += s.finalWidth;
    }

    // Add new section
    const newPlaced: RowPlacedSection = {
      ...newSection,
      finalWidth: Math.min(targetWidth, newSection.preferredWidth),
      columnIndex: column,
      rowIndex,
      wasShrunk: targetWidth < newSection.preferredWidth,
      wasGrown: targetWidth > newSection.preferredWidth,
    };
    newSections.push(newPlaced);

    const newTotalWidth = newSections.reduce((sum, s) => sum + s.finalWidth, 0);
    const newGap = totalColumns - newTotalWidth;

    // Only accept if this improves the gap
    if (newGap < currentGap) {
      return {
        improved: true,
        newRowSections: newSections,
        newRemaining: newRemaining,
        newGap: newGap,
      };
    }
  }

  // Try Strategy 2: Swap last 2 sections' widths if they're different
  if (currentRow.length >= 2) {
    const secondLast = currentRow[currentRow.length - 2];
    if (secondLast && lastSection.finalWidth !== secondLast.finalWidth) {
      // Check if swapping widths would help
      const lastCanShrink = lastSection.canShrink && lastSection.minWidth <= secondLast.finalWidth;
      const secondCanGrow = secondLast.canGrow && secondLast.maxWidth >= lastSection.finalWidth;

      if (lastCanShrink && secondCanGrow) {
        // Try the swap - this rebalances widths
        const newSections = [...currentRow];
        const lastIdx = newSections.length - 1;
        const secondIdx = newSections.length - 2;

        // Swap widths
        const tempWidth = newSections[lastIdx]!.finalWidth;
        newSections[lastIdx]!.finalWidth = newSections[secondIdx]!.finalWidth;
        newSections[secondIdx]!.finalWidth = tempWidth;

        // Mark adjustments
        newSections[lastIdx]!.wasShrunk = true;
        newSections[secondIdx]!.wasGrown = true;

        // Recalculate column indices
        let col = 0;
        for (const s of newSections) {
          s.columnIndex = col;
          col += s.finalWidth;
        }

        const newGap = totalColumns - col;

        // This doesn't reduce gap but might help with section sizing
        // Skip this strategy for now - it doesn't actually help fill gaps
      }
    }
  }

  return noImprovement;
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
    const fitIndex = remaining.findIndex((s) => s.preferredWidth <= space);

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
      .filter((s) => {
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
    const anyExpandable = rowSections.filter((s) => {
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
      const shrinkIndex = remaining.findIndex((s) => s === candidate.section);

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
    const growable = rowSections.filter((s) => {
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
    const anyGrowable = rowSections.filter((s) => {
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

  // Phase 5.5: LIMITED BACKTRACKING (Point 19)
  // If row ends with gap > 0, try swapping last 2 placed sections to find better fit
  if (gap > 0 && rowSections.length >= 2 && remaining.length > 0) {
    const backtrackResult = tryBacktrackSwap(
      rowSections,
      remaining,
      totalColumns,
      gap,
      rowIndex,
      config
    );

    if (backtrackResult.improved) {
      // Replace rowSections with the improved version
      rowSections.length = 0;
      rowSections.push(...backtrackResult.newRowSections);
      remaining.length = 0;
      remaining.push(...backtrackResult.newRemaining);
      gap = backtrackResult.newGap;
      currentColumn = totalColumns - gap;
    }
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
  const rowsWithGaps = rows.filter((r) => r.remainingCapacity > 0).length;

  let shrunkCount = 0;
  let grownCount = 0;
  for (const row of rows) {
    for (const section of row.sections) {
      if (section.wasShrunk) shrunkCount++;
      if (section.wasGrown) grownCount++;
    }
  }

  // Calculate total height
  const totalHeight =
    rows.length > 0 ? rows[rows.length - 1]!.topOffset + rows[rows.length - 1]!.estimatedHeight : 0;

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
      const widthExpr = generateWidthExpression(config.totalColumns, placed.finalWidth, config.gap);
      const leftExpr = generateLeftExpression(config.totalColumns, placed.columnIndex, config.gap);

      positions.push({
        section: placed.section,
        key: generateSectionKey(placed.section, placed.originalIndex),
        colSpan: placed.finalWidth,
        column: placed.columnIndex,
        preferredColumns: Math.min(placed.preferredWidth, 4) as 1 | 2 | 3 | 4,
        left: leftExpr,
        top: row.topOffset,
        width: widthExpr,
        height: estimateSectionHeight(placed.section),
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
    allowGrowing: true,
  });

  const totalPreferredWidth = prepared.reduce((sum, s) => sum + s.preferredWidth, 0);
  const priorities = new Set(prepared.map((s) => s.priority));

  // Suggest columns based on section widths
  const maxPreferred = Math.max(...prepared.map((s) => s.preferredWidth));
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
