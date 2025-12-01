/**
 * @deprecated Use unified-layout-optimizer.util.ts instead.
 * This file will be removed in a future version.
 * Import from @osi-cards/core for new implementations.
 */

/**
 * Column Span Optimizer Utility
 * 
 * Provides algorithms for optimizing column spans in masonry grids:
 * - Dynamic span reduction with total layout impact consideration
 * - Span expansion heuristics with content density awareness
 * - Cross-section span negotiation
 * - Minimum viable span calculation
 * - Span stability hints for consistent user experience
 * 
 * @example
 * ```typescript
 * import { 
 *   optimizeColumnSpans, 
 *   negotiateSpans,
 *   calculateMinViableSpan,
 *   SpanStabilityTracker 
 * } from './column-span-optimizer.util';
 * 
 * const optimized = optimizeColumnSpans(sections, sectionHeights, columns);
 * const negotiated = negotiateSpans(sections, columns, containerWidth);
 * ```
 */

import { PreferredColumns } from '../types';
import { CardSection } from '../models/card.model';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Section with position information for optimization
 */
export interface OptimizableSection {
  key: string;
  colSpan: number;
  preferredColumns: PreferredColumns;
  top: number;
  section?: CardSection;  // Optional reference to original section
}

/**
 * Extended section with content metrics for span optimization
 */
export interface ExtendedOptimizableSection extends OptimizableSection {
  /** Content density score */
  density?: number;
  /** Character count in section */
  charCount?: number;
  /** Field count */
  fieldCount?: number;
  /** Item count */
  itemCount?: number;
  /** Section type */
  type?: string;
  /** Whether section can shrink */
  canShrink?: boolean;
  /** Whether section can grow */
  canGrow?: boolean;
  /** User-preferred span (for stability) */
  userPreferredSpan?: number;
}

/**
 * Configuration for column span optimization
 */
export interface ColumnSpanOptimizerConfig {
  /** Threshold multiplier for considering a section "tall" */
  tallThresholdMultiplier: number;
  /** Minimum span to reduce to */
  minSpan: number;
  /** Maximum iterations for optimization */
  maxIterations?: number;
  /** Whether to consider global layout impact */
  considerGlobalImpact?: boolean;
  /** Weight for height reduction vs width preservation */
  heightReductionWeight?: number;
}

/**
 * Configuration for span negotiation
 */
export interface SpanNegotiationConfig {
  /** Total columns available */
  columns: number;
  /** Container width in pixels */
  containerWidth: number;
  /** Gap between columns */
  gap?: number;
  /** Whether to allow shrinking below preferred */
  allowShrink?: boolean;
  /** Whether to allow growing above preferred */
  allowGrow?: boolean;
  /** Priority weight (higher = more important to honor preferences) */
  priorityWeight?: number;
}

/**
 * Result of span negotiation
 */
export interface SpanNegotiationResult {
  sections: ExtendedOptimizableSection[];
  totalWidth: number;
  shrunkCount: number;
  grownCount: number;
  utilization: number;
  conflicts: SpanConflict[];
}

/**
 * Span conflict between sections
 */
export interface SpanConflict {
  section1Key: string;
  section2Key: string;
  type: 'overlap' | 'preference' | 'space';
  resolution: 'shrink' | 'grow' | 'defer' | 'none';
}

/**
 * Span stability record
 */
export interface SpanStabilityRecord {
  sectionKey: string;
  preferredSpan: number;
  lastUsedSpan: number;
  usageCount: number;
  lastUpdated: number;
}

/** Default configuration */
export const DEFAULT_OPTIMIZER_CONFIG: ColumnSpanOptimizerConfig = {
  tallThresholdMultiplier: 1.5,
  minSpan: 1,
  maxIterations: 5,
  considerGlobalImpact: true,
  heightReductionWeight: 1.0,
};

// ============================================================================
// COLUMN SPAN OPTIMIZATION
// ============================================================================

/**
 * Optimizes column spans for sections to minimize total container height.
 * 
 * Algorithm:
 * 1. Identify tall multi-column sections (height > average * threshold)
 * 2. For each candidate, simulate layout with current span vs narrower span
 * 3. If narrower span results in lower total height, adjust the span
 * 
 * @param sections - Sections with position information
 * @param sectionHeights - Map of section keys to actual heights
 * @param columns - Number of columns
 * @param config - Optimization configuration
 * @returns Sections with optimized column spans
 */
export function optimizeColumnSpans<T extends OptimizableSection>(
  sections: T[],
  sectionHeights: Map<string, number>,
  columns: number,
  config: ColumnSpanOptimizerConfig = DEFAULT_OPTIMIZER_CONFIG
): T[] {
  if (sections.length < 2 || columns < 2) {
    return sections;
  }

  // Calculate average height
  let totalHeight = 0;
  let count = 0;
  for (const height of sectionHeights.values()) {
    totalHeight += height;
    count++;
  }
  const avgHeight = count > 0 ? totalHeight / count : 200;

  // Threshold: sections taller than average by multiplier are candidates
  const tallThreshold = avgHeight * config.tallThresholdMultiplier;

  // Find multi-column sections that are tall candidates
  const candidates = sections.filter(s => {
    const height = sectionHeights.get(s.key) ?? 200;
    return s.colSpan > 1 && s.preferredColumns > 1 && height > tallThreshold;
  });

  if (candidates.length === 0) {
    return sections;
  }

  // Clone sections for modification
  const optimized = sections.map(s => ({ ...s }));

  for (const candidate of candidates) {
    const idx = optimized.findIndex(s => s.key === candidate.key);
    if (idx < 0) continue;

    const section = optimized[idx];
    if (!section) continue;

    const currentSpan = section.colSpan;

    // Only try reducing by 1 (don't go from 3 to 1 directly)
    const narrowerSpan = Math.max(config.minSpan, currentSpan - 1);

    if (narrowerSpan === currentSpan) continue;

    // Simulate both layouts and compare total heights
    const currentLayoutHeight = simulateLayoutHeight(optimized, sectionHeights, columns);

    // Temporarily modify span
    section.colSpan = narrowerSpan;

    const narrowerLayoutHeight = simulateLayoutHeight(optimized, sectionHeights, columns);

    // Keep narrower span only if it reduces total height
    if (narrowerLayoutHeight < currentLayoutHeight) {
      // Keep the narrower span and update preferred columns
      section.preferredColumns = narrowerSpan as PreferredColumns;
    } else {
      // Revert to original span
      section.colSpan = currentSpan;
    }
  }

  return optimized;
}

/**
 * Simulates layout and returns the total container height.
 * Used for comparing different layout configurations.
 * 
 * @param sections - Sections to simulate
 * @param sectionHeights - Map of section keys to heights
 * @param columns - Number of columns
 * @returns Simulated container height
 */
export function simulateLayoutHeight<T extends OptimizableSection>(
  sections: T[],
  sectionHeights: Map<string, number>,
  columns: number
): number {
  const colHeights = new Array(columns).fill(0) as number[];

  // Sort by height descending (same as real layout)
  const sorted = [...sections].sort((a, b) => {
    const heightA = sectionHeights.get(a.key) ?? 200;
    const heightB = sectionHeights.get(b.key) ?? 200;
    return heightB - heightA;
  });

  for (const section of sorted) {
    const height = sectionHeights.get(section.key) ?? 200;
    const span = Math.min(section.colSpan, columns);

    // Find shortest position for this span
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

    // Update column heights
    const newHeight = minColHeight + height;
    for (let c = bestColumn; c < bestColumn + span; c++) {
      colHeights[c] = newHeight;
    }
  }

  return Math.max(...colHeights, 0);
}

/**
 * Calculates total container height from placed sections.
 * 
 * @param sections - Positioned sections
 * @param sectionHeights - Map of section keys to heights
 * @returns Total container height
 */
export function calculateTotalHeight<T extends { key: string; top: number }>(
  sections: T[],
  sectionHeights: Map<string, number>
): number {
  let maxBottom = 0;
  for (const section of sections) {
    const height = sectionHeights.get(section.key) ?? 200;
    const bottom = section.top + height;
    if (bottom > maxBottom) {
      maxBottom = bottom;
    }
  }
  return maxBottom;
}

// ============================================================================
// DYNAMIC SPAN REDUCTION (Item 11)
// ============================================================================

/**
 * Dynamic span reduction with total layout impact consideration.
 * 
 * Unlike basic optimization that only considers individual sections,
 * this evaluates how span changes affect the ENTIRE layout including:
 * - How other sections reflow
 * - Total container height change
 * - Column balance impact
 * - Gap creation/elimination
 * 
 * @param sections - Sections to optimize
 * @param sectionHeights - Map of section keys to heights
 * @param columns - Number of columns
 * @param config - Optimization configuration
 * @returns Optimized sections with global impact consideration
 */
export function optimizeSpansWithGlobalImpact<T extends OptimizableSection>(
  sections: T[],
  sectionHeights: Map<string, number>,
  columns: number,
  config: ColumnSpanOptimizerConfig = DEFAULT_OPTIMIZER_CONFIG
): T[] {
  if (sections.length < 2 || columns < 2) {
    return sections;
  }

  const maxIterations = config.maxIterations ?? 5;
  let optimized = sections.map(s => ({ ...s }));
  let currentHeight = simulateLayoutHeight(optimized, sectionHeights, columns);
  let improved = true;
  let iteration = 0;

  while (improved && iteration < maxIterations) {
    improved = false;
    iteration++;

    // Calculate average height for threshold
    let totalHeight = 0;
    let count = 0;
    for (const height of sectionHeights.values()) {
      totalHeight += height;
      count++;
    }
    const avgHeight = count > 0 ? totalHeight / count : 200;
    const tallThreshold = avgHeight * config.tallThresholdMultiplier;

    // Try reducing span for each multi-column section
    for (let i = 0; i < optimized.length; i++) {
      const section = optimized[i];
      if (!section || section.colSpan <= 1) continue;

      const sectionHeight = sectionHeights.get(section.key) ?? 200;
      if (sectionHeight <= tallThreshold) continue;

      // Try reducing span
      const originalSpan = section.colSpan;
      const newSpan = Math.max(config.minSpan, originalSpan - 1);
      if (newSpan === originalSpan) continue;

      // Temporarily apply reduction
      section.colSpan = newSpan;

      // Simulate full layout
      const newHeight = simulateLayoutHeight(optimized, sectionHeights, columns);
      const heightImprovement = currentHeight - newHeight;

      // Calculate balance score change
      const originalBalance = calculateColumnBalance(optimized, sectionHeights, columns, originalSpan, i);
      const newBalance = calculateColumnBalance(optimized, sectionHeights, columns, newSpan, i);
      const balanceImprovement = newBalance - originalBalance;

      // Combined improvement score
      const weight = config.heightReductionWeight ?? 1.0;
      const totalImprovement = heightImprovement * weight + balanceImprovement * 0.1;

      if (totalImprovement > 0) {
        // Keep the change
        section.preferredColumns = newSpan as PreferredColumns;
        currentHeight = newHeight;
        improved = true;
      } else {
        // Revert
        section.colSpan = originalSpan;
      }
    }
  }

  return optimized;
}

/**
 * Calculates column balance score (higher is better)
 */
function calculateColumnBalance<T extends OptimizableSection>(
  sections: T[],
  sectionHeights: Map<string, number>,
  columns: number,
  changedSpan: number,
  changedIndex: number
): number {
  const colHeights = new Array(columns).fill(0) as number[];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (!section) continue;

    const height = sectionHeights.get(section.key) ?? 200;
    const span = i === changedIndex ? changedSpan : section.colSpan;
    const effectiveSpan = Math.min(span, columns);

    // Find best column
    let bestCol = 0;
    let minHeight = Infinity;
    for (let col = 0; col <= columns - effectiveSpan; col++) {
      let maxH = 0;
      for (let c = col; c < col + effectiveSpan; c++) {
        maxH = Math.max(maxH, colHeights[c] ?? 0);
      }
      if (maxH < minHeight) {
        minHeight = maxH;
        bestCol = col;
      }
    }

    // Update heights
    const newH = minHeight + height;
    for (let c = bestCol; c < bestCol + effectiveSpan; c++) {
      colHeights[c] = newH;
    }
  }

  // Balance score: inverse of variance (higher = more balanced)
  const avg = colHeights.reduce((a, b) => a + b, 0) / columns;
  const variance = colHeights.reduce((sum, h) => sum + Math.pow(h - avg, 2), 0) / columns;
  return variance === 0 ? 100 : 100 / (1 + Math.sqrt(variance) / 100);
}

// ============================================================================
// SPAN NEGOTIATION (Item 13)
// ============================================================================

/**
 * Cross-section span negotiation.
 * 
 * When multiple sections compete for the same space, this negotiates
 * span allocations based on:
 * - Content density (denser content gets more space)
 * - Priority (higher priority sections preferred)
 * - Flexibility (some sections can shrink/grow more)
 * 
 * @param sections - Sections to negotiate
 * @param config - Negotiation configuration
 * @returns Negotiated sections with resolved conflicts
 */
export function negotiateSpans(
  sections: ExtendedOptimizableSection[],
  config: SpanNegotiationConfig
): SpanNegotiationResult {
  const { columns, allowShrink = true, allowGrow = true, priorityWeight = 1.0 } = config;
  
  const result: ExtendedOptimizableSection[] = sections.map(s => ({ ...s }));
  const conflicts: SpanConflict[] = [];
  let shrunkCount = 0;
  let grownCount = 0;

  // Group sections into rows based on current layout simulation
  const rows = groupIntoRows(result, columns);

  for (const row of rows) {
    const totalPreferred = row.reduce((sum, s) => sum + s.colSpan, 0);
    
    if (totalPreferred === columns) {
      // Perfect fit, no negotiation needed
      continue;
    }
    
    if (totalPreferred > columns) {
      // Over-subscribed row - need to shrink
      if (!allowShrink) continue;

      const excess = totalPreferred - columns;
      const shrinkable = row
        .filter(s => s.canShrink !== false && s.colSpan > 1)
        .sort((a, b) => {
          // Sort by priority (lower = keep original), then density (lower = shrink first)
          const priorityA = calculateNegotiationPriority(a, priorityWeight);
          const priorityB = calculateNegotiationPriority(b, priorityWeight);
          return priorityB - priorityA;  // Higher priority keeps span
        });

      let remaining = excess;
      for (const section of shrinkable) {
        if (remaining <= 0) break;

        const maxShrink = section.colSpan - 1;
        const shrinkAmount = Math.min(remaining, maxShrink);
        
        if (shrinkAmount > 0) {
          section.colSpan -= shrinkAmount;
          section.preferredColumns = section.colSpan as PreferredColumns;
          remaining -= shrinkAmount;
          shrunkCount++;

          // Record conflict if multiple sections involved
          if (row.length > 1) {
            const otherSection = row.find(s => s.key !== section.key);
            if (otherSection) {
              conflicts.push({
                section1Key: section.key,
                section2Key: otherSection.key,
                type: 'space',
                resolution: 'shrink',
              });
            }
          }
        }
      }
    } else if (totalPreferred < columns) {
      // Under-subscribed row - can grow
      if (!allowGrow) continue;

      const available = columns - totalPreferred;
      const growable = row
        .filter(s => s.canGrow !== false)
        .sort((a, b) => {
          // Higher density grows first
          return (b.density ?? 0) - (a.density ?? 0);
        });

      let remaining = available;
      for (const section of growable) {
        if (remaining <= 0) break;

        const maxGrow = columns - section.colSpan;
        const growAmount = Math.min(remaining, maxGrow, 1);  // Grow by 1 at a time

        if (growAmount > 0) {
          section.colSpan += growAmount;
          section.preferredColumns = section.colSpan as PreferredColumns;
          remaining -= growAmount;
          grownCount++;
        }
      }
    }
  }

  // Calculate utilization
  const totalSpan = result.reduce((sum, s) => sum + s.colSpan, 0);
  const totalCapacity = rows.length * columns;
  const utilization = totalCapacity > 0 ? (totalSpan / totalCapacity) * 100 : 100;

  return {
    sections: result,
    totalWidth: totalSpan,
    shrunkCount,
    grownCount,
    utilization,
    conflicts,
  };
}

/**
 * Groups sections into simulated rows
 */
function groupIntoRows(
  sections: ExtendedOptimizableSection[],
  columns: number
): ExtendedOptimizableSection[][] {
  const rows: ExtendedOptimizableSection[][] = [];
  let currentRow: ExtendedOptimizableSection[] = [];
  let currentWidth = 0;

  for (const section of sections) {
    if (currentWidth + section.colSpan <= columns) {
      currentRow.push(section);
      currentWidth += section.colSpan;
    } else {
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }
      currentRow = [section];
      currentWidth = section.colSpan;
    }
  }

  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Calculates negotiation priority for a section
 */
function calculateNegotiationPriority(
  section: ExtendedOptimizableSection,
  weight: number
): number {
  let priority = 50;  // Base priority

  // Density bonus
  priority += (section.density ?? 0) * 0.5;

  // User preference bonus
  if (section.userPreferredSpan && section.userPreferredSpan === section.colSpan) {
    priority += 20 * weight;
  }

  // Field/item count bonus
  priority += (section.fieldCount ?? 0) * 2;
  priority += (section.itemCount ?? 0) * 3;

  return priority;
}

// ============================================================================
// MINIMUM VIABLE SPAN (Item 14)
// ============================================================================

/**
 * Calculates the minimum viable span for a section.
 * 
 * Determines the smallest span that still renders content well based on:
 * - Character counts and average word length
 * - Field widths and label lengths
 * - Item complexity
 * - Section type requirements
 * 
 * @param section - Section to analyze
 * @param columnWidth - Width of a single column in pixels
 * @param options - Calculation options
 * @returns Minimum viable span (1-4)
 */
export function calculateMinViableSpan(
  section: CardSection | ExtendedOptimizableSection,
  columnWidth: number,
  options?: {
    minCharsPerLine?: number;
    avgCharWidth?: number;
    padding?: number;
  }
): number {
  const minCharsPerLine = options?.minCharsPerLine ?? 20;
  const avgCharWidth = options?.avgCharWidth ?? 8;  // pixels per character
  const padding = options?.padding ?? 32;  // Total horizontal padding

  // Get content from section
  const cardSection: CardSection = 'section' in section && (section as ExtendedOptimizableSection).section 
    ? (section as ExtendedOptimizableSection).section! 
    : section as CardSection;
  if (!cardSection) return 1;

  const fields: Array<{ value?: unknown }> = cardSection.fields ?? [];
  const items: Array<{ title?: string }> = cardSection.items ?? [];
  const description: string = cardSection.description ?? '';
  const type: string = cardSection.type?.toLowerCase() ?? 'info';

  // Type-based minimum spans
  const typeMinimums: Record<string, number> = {
    'chart': 2,
    'map': 2,
    'overview': 2,
    'analytics': 1,
    'contact-card': 1,
    'info': 1,
    'list': 1,
  };
  const typeMin = typeMinimums[type] ?? 1;

  // Calculate content-based minimum
  let contentMin = 1;

  // Check longest field value
  if (fields.length > 0) {
    const maxFieldLength = Math.max(
      ...fields.map((f: { value?: unknown }) => String(f.value ?? '').length)
    );
    const neededWidth = maxFieldLength * avgCharWidth + padding;
    const neededSpan = Math.ceil(neededWidth / columnWidth);
    contentMin = Math.max(contentMin, neededSpan);
  }

  // Check description line requirements
  if (description.length > 0) {
    const words = description.split(/\s+/);
    const avgWordLength = words.reduce((sum: number, w: string) => sum + w.length, 0) / words.length;
    const minLineWidth = minCharsPerLine * avgCharWidth + padding;
    
    if (avgWordLength > 10) {
      // Long words need more space
      const neededSpan = Math.ceil(minLineWidth * 1.5 / columnWidth);
      contentMin = Math.max(contentMin, neededSpan);
    }
  }

  // Check items (if they have long titles)
  if (items.length > 0) {
    const maxItemTitleLength = Math.max(
      ...items.map((i: { title?: string }) => (i.title ?? '').length)
    );
    if (maxItemTitleLength > 30) {
      contentMin = Math.max(contentMin, 2);
    }
  }

  // Return the larger of type-based and content-based minimum
  return Math.min(4, Math.max(typeMin, contentMin));
}

/**
 * Applies minimum viable spans to a set of sections
 */
export function applyMinViableSpans<T extends ExtendedOptimizableSection>(
  sections: T[],
  columnWidth: number
): T[] {
  return sections.map(section => {
    const minSpan = calculateMinViableSpan(section, columnWidth);
    return {
      ...section,
      colSpan: Math.max(section.colSpan, minSpan),
    };
  });
}

// ============================================================================
// SPAN STABILITY (Item 15)
// ============================================================================

/**
 * Tracks span preferences for consistent user experience.
 * 
 * Maintains a history of span assignments to provide stability hints:
 * - Remembers user-adjusted spans
 * - Provides consistent spans across re-renders
 * - Decays old preferences over time
 */
export class SpanStabilityTracker {
  private records: Map<string, SpanStabilityRecord> = new Map();
  private readonly maxAge: number;  // Max age in milliseconds
  private readonly decayFactor: number;

  constructor(options?: {
    maxAgeMs?: number;
    decayFactor?: number;
  }) {
    this.maxAge = options?.maxAgeMs ?? 24 * 60 * 60 * 1000;  // 24 hours default
    this.decayFactor = options?.decayFactor ?? 0.9;
  }

  /**
   * Records a span assignment
   */
  recordSpan(sectionKey: string, span: number, isUserPreference: boolean = false): void {
    const existing = this.records.get(sectionKey);
    
    if (existing) {
      existing.lastUsedSpan = span;
      existing.usageCount++;
      existing.lastUpdated = Date.now();
      if (isUserPreference) {
        existing.preferredSpan = span;
      }
    } else {
      this.records.set(sectionKey, {
        sectionKey,
        preferredSpan: span,
        lastUsedSpan: span,
        usageCount: 1,
        lastUpdated: Date.now(),
      });
    }
  }

  /**
   * Gets the stable span for a section
   */
  getStableSpan(sectionKey: string, defaultSpan: number): number {
    const record = this.records.get(sectionKey);
    
    if (!record) {
      return defaultSpan;
    }

    // Check age
    const age = Date.now() - record.lastUpdated;
    if (age > this.maxAge) {
      this.records.delete(sectionKey);
      return defaultSpan;
    }

    // Calculate confidence based on usage and age
    const ageWeight = 1 - (age / this.maxAge);
    const usageWeight = Math.min(1, record.usageCount / 10);
    const confidence = ageWeight * usageWeight;

    // If high confidence, return preferred span
    if (confidence > 0.5) {
      return record.preferredSpan;
    }

    // Otherwise, return last used span
    return record.lastUsedSpan;
  }

  /**
   * Applies stability hints to sections
   */
  applyStabilityHints<T extends ExtendedOptimizableSection>(sections: T[]): T[] {
    return sections.map(section => {
      const stableSpan = this.getStableSpan(section.key, section.colSpan);
      return {
        ...section,
        userPreferredSpan: stableSpan,
      };
    });
  }

  /**
   * Cleans up old records
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      if (now - record.lastUpdated > this.maxAge) {
        this.records.delete(key);
      }
    }
  }

  /**
   * Exports records for persistence
   */
  export(): SpanStabilityRecord[] {
    return Array.from(this.records.values());
  }

  /**
   * Imports records from persistence
   */
  import(records: SpanStabilityRecord[]): void {
    for (const record of records) {
      this.records.set(record.sectionKey, record);
    }
  }

  /**
   * Clears all records
   */
  clear(): void {
    this.records.clear();
  }
}

// ============================================================================
// SPAN EXPANSION HEURISTICS (Item 12)
// ============================================================================

/**
 * Improved span expansion heuristics with content density awareness.
 * 
 * Determines whether a section should expand based on:
 * - Content density (more content = more expansion benefit)
 * - Available space (only expand into truly unused space)
 * - Section type capabilities
 * - Visual balance considerations
 * 
 * @param section - Section to evaluate
 * @param availableSpace - Available columns for expansion
 * @param context - Expansion context
 * @returns Recommended expansion amount (0 = no expansion)
 */
export function calculateSpanExpansion(
  section: ExtendedOptimizableSection,
  availableSpace: number,
  context: {
    columns: number;
    otherSectionsDensity?: number;
    sectionHeights?: Map<string, number>;
  }
): number {
  if (availableSpace <= 0 || section.canGrow === false) {
    return 0;
  }

  const density = section.density ?? 0;
  const currentSpan = section.colSpan;
  const type = section.type?.toLowerCase() ?? 'info';

  // Type-based max expansion
  const typeMaxExpansion: Record<string, number> = {
    'chart': 4,
    'map': 4,
    'overview': 4,
    'analytics': 3,
    'contact-card': 2,
    'info': 2,
    'list': 2,
    'event': 2,
  };
  const typeMax = typeMaxExpansion[type] ?? 2;

  // Calculate expansion score
  let expansionScore = 0;

  // Density-based score (higher density = more benefit from expansion)
  if (density > 30) {
    expansionScore += 2;
  } else if (density > 15) {
    expansionScore += 1;
  }

  // Field/item count bonus
  if ((section.fieldCount ?? 0) > 5 || (section.itemCount ?? 0) > 3) {
    expansionScore += 1;
  }

  // Character count bonus
  if ((section.charCount ?? 0) > 500) {
    expansionScore += 1;
  }

  // Cap expansion based on type and score
  const maxExpansion = Math.min(
    availableSpace,
    typeMax - currentSpan,
    expansionScore
  );

  return Math.max(0, maxExpansion);
}

/**
 * Applies expansion heuristics to sections
 */
export function applyExpansionHeuristics<T extends ExtendedOptimizableSection>(
  sections: T[],
  columns: number,
  sectionHeights?: Map<string, number>
): T[] {
  const result = sections.map(s => ({ ...s }));
  
  // Group into rows
  const rows = groupIntoRows(result, columns);
  
  for (const row of rows) {
    const usedSpace = row.reduce((sum, s) => sum + s.colSpan, 0);
    const availableSpace = columns - usedSpace;
    
    if (availableSpace <= 0) continue;
    
    // Calculate average density
    const avgDensity = row.reduce((sum, s) => sum + (s.density ?? 0), 0) / row.length;
    
    // Sort by expansion benefit (higher density first)
    const sortedRow = [...row].sort((a, b) => (b.density ?? 0) - (a.density ?? 0));
    
    let remaining = availableSpace;
    for (const section of sortedRow) {
      if (remaining <= 0) break;
      
      const expansion = calculateSpanExpansion(section, remaining, {
        columns,
        otherSectionsDensity: avgDensity,
        sectionHeights,
      });
      
      if (expansion > 0) {
        section.colSpan += expansion;
        section.preferredColumns = section.colSpan as PreferredColumns;
        remaining -= expansion;
      }
    }
  }
  
  return result;
}




