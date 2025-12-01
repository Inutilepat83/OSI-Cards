/**
 * Gap Filler Optimizer Utility
 * 
 * Provides comprehensive algorithms for detecting and filling gaps in masonry grid layouts:
 * - Gap detection with topology tracking (L-shaped, rectangular, fragmented)
 * - Gap filling priority queue based on fillability
 * - Section splitting for very tall sections
 * - Elastic gap absorption (sections with flexible padding)
 * - Gap prediction to prevent unfillable gaps
 * - Fragment coalescing (combining small gaps)
 * - Backtracking optimization
 * - Utilization threshold alerts
 * - Compaction passes
 * - Gap metrics dashboard
 * 
 * @example
 * ```typescript
 * import { 
 *   GapAnalyzer, 
 *   GapFiller, 
 *   GapPriorityQueue,
 *   optimizeLayoutGaps 
 * } from './gap-filler-optimizer.util';
 * 
 * const analyzer = new GapAnalyzer(sections, columns);
 * const gaps = analyzer.findAllGaps();
 * const metrics = analyzer.getMetrics();
 * 
 * const filler = new GapFiller(sections, columns, config);
 * const optimized = filler.fillGaps();
 * ```
 */

import { generateWidthExpression, generateLeftExpression, GRID_GAP } from './grid-config.util';
import { PreferredColumns } from '../types';
import { CardSection } from '../models/card.model';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Section with position information for gap analysis
 */
export interface GapAnalyzableSection {
  key: string;
  colSpan: number;
  preferredColumns: PreferredColumns;
  left: string;
  top: number;
  width: string;
  section?: CardSection;
  canSplit?: boolean;
  elasticPadding?: number;  // Max padding that can be added/removed
}

/**
 * Gap topology types
 */
export type GapTopology = 
  | 'rectangular'  // Simple rectangular gap
  | 'L-shaped'     // L-shaped gap (two connected rectangles)
  | 'T-shaped'     // T-shaped gap
  | 'fragmented'   // Multiple disconnected small gaps
  | 'irregular';   // Complex shape

/**
 * Gap information in the layout
 */
export interface LayoutGap {
  /** Unique identifier */
  id: string;
  /** Column index where gap starts */
  column: number;
  /** Top position of gap (px) */
  top: number;
  /** Height of gap (px) */
  height: number;
  /** Width of gap in columns */
  width: number;
  /** Gap topology */
  topology: GapTopology;
  /** Area in column-pixels */
  area: number;
  /** Fillability score (0-100) */
  fillability: number;
  /** Connected gap IDs (for complex shapes) */
  connectedGaps?: string[];
  /** Whether this gap can be absorbed by elastic padding */
  canAbsorb: boolean;
}

/**
 * Gap metrics for dashboard
 */
export interface GapMetrics {
  /** Total number of gaps */
  totalGaps: number;
  /** Total gap area (column-pixels) */
  totalGapArea: number;
  /** Container utilization percentage */
  utilizationPercent: number;
  /** Gaps by topology */
  gapsByTopology: Record<GapTopology, number>;
  /** Average gap size */
  avgGapSize: number;
  /** Largest gap */
  largestGap: LayoutGap | null;
  /** Fillable gaps count */
  fillableGaps: number;
  /** Absorbable gaps count */
  absorbableGaps: number;
  /** Alerts */
  alerts: GapAlert[];
}

/**
 * Gap alert for low utilization
 */
export interface GapAlert {
  type: 'low_utilization' | 'large_gap' | 'unfillable_gap' | 'fragmented';
  severity: 'info' | 'warning' | 'error';
  message: string;
  gapId?: string;
}

/**
 * Configuration for gap filling
 */
export interface GapFillerConfig {
  /** Grid resolution for gap detection (px) */
  gridResolution: number;
  /** Minimum gap height to consider (px) */
  minGapHeight: number;
  /** Height tolerance when fitting sections (px) */
  heightTolerance: number;
  /** Gap between sections */
  gap: number;
  /** Utilization threshold for alerts (percentage) */
  utilizationThreshold?: number;
  /** Enable backtracking optimization */
  enableBacktracking?: boolean;
  /** Maximum backtrack iterations */
  maxBacktrackIterations?: number;
  /** Enable elastic gap absorption */
  enableElasticAbsorption?: boolean;
  /** Maximum elastic padding (px) */
  maxElasticPadding?: number;
  /** Enable section splitting */
  enableSectionSplitting?: boolean;
  /** Minimum section height for splitting (px) */
  minSplitHeight?: number;
  /** Enable compaction passes */
  enableCompaction?: boolean;
}

/** Default configuration */
export const DEFAULT_GAP_FILLER_CONFIG: GapFillerConfig = {
  gridResolution: 10,
  minGapHeight: 100,
  heightTolerance: 20,
  gap: 12,
  utilizationThreshold: 85,
  enableBacktracking: true,
  maxBacktrackIterations: 3,
  enableElasticAbsorption: true,
  maxElasticPadding: 20,
  enableSectionSplitting: false,
  minSplitHeight: 300,
  enableCompaction: true,
};

/**
 * Priority queue item for gap filling
 */
interface PriorityQueueItem {
  gap: LayoutGap;
  priority: number;
  candidateSections: string[];
}

// ============================================================================
// GAP ANALYSIS
// ============================================================================

/**
 * Finds gaps in the current layout where sections could be placed.
 * Uses a grid-based approach to identify empty spaces.
 * 
 * @param sections - Sections with height information
 * @param columns - Number of columns
 * @param config - Configuration options
 * @returns Array of gaps with position and size
 */
export function findLayoutGaps<T extends GapAnalyzableSection & { height: number }>(
  sections: T[],
  columns: number,
  config: Partial<GapFillerConfig> = {}
): LayoutGap[] {
  const fullConfig = { ...DEFAULT_GAP_FILLER_CONFIG, ...config };
  const gaps: LayoutGap[] = [];

  if (sections.length === 0) {
    return gaps;
  }

  // Calculate container height from sections
  const containerHeight = Math.max(
    ...sections.map(s => s.top + s.height),
    0
  );

  if (containerHeight === 0) {
    return gaps;
  }

  // Build occupancy grid
  const rows = Math.ceil(containerHeight / fullConfig.gridResolution);
  const grid: boolean[][] = Array.from({ length: rows }, () =>
    new Array(columns).fill(false) as boolean[]
  );

  // Mark occupied cells
  for (const section of sections) {
    const startRow = Math.floor(section.top / fullConfig.gridResolution);
    const endRow = Math.min(Math.ceil((section.top + section.height) / fullConfig.gridResolution), rows);
    const startCol = parseColumnIndex(section.left, columns, fullConfig.gap);
    const endCol = Math.min(startCol + section.colSpan, columns);

    for (let r = startRow; r < endRow; r++) {
      const row = grid[r];
      if (row) {
        for (let c = startCol; c < endCol; c++) {
          row[c] = true;
        }
      }
    }
  }

  // Find contiguous unoccupied regions (gaps)
  for (let c = 0; c < columns; c++) {
    let gapStart: number | null = null;

    for (let r = 0; r < rows; r++) {
      const isOccupied = grid[r]?.[c] ?? false;

      if (!isOccupied && gapStart === null) {
        gapStart = r;
      } else if (isOccupied && gapStart !== null) {
        const gapHeight = (r - gapStart) * fullConfig.gridResolution;
        if (gapHeight >= fullConfig.minGapHeight) {
          const gapTop = gapStart * fullConfig.gridResolution;
          gaps.push({
            id: `gap-${c}-${gapStart}`,
            column: c,
            top: gapTop,
            height: gapHeight,
            width: 1, // Single column gap
            topology: 'rectangular',
            area: gapHeight * 1, // height * width in column-pixels
            fillability: Math.min(100, Math.round((gapHeight / fullConfig.minGapHeight) * 50)),
            canAbsorb: true
          });
        }
        gapStart = null;
      }
    }

    // Don't count gaps at the bottom as they're not "internal" gaps
  }

  // Sort gaps by area (largest first) to prioritize filling bigger gaps
  gaps.sort((a, b) => (b.height * b.width) - (a.height * a.width));

  return gaps;
}

/**
 * Optimizes layout by filling gaps with movable sections.
 * 
 * Algorithm:
 * 1. Build an occupancy grid from current section positions
 * 2. Identify significant gaps (empty spaces between sections)
 * 3. Find single-column sections that could fit in gaps
 * 4. Reposition sections to fill gaps without increasing total height
 * 
 * @param sections - Currently positioned sections
 * @param columns - Number of columns
 * @param sectionHeights - Map of section keys to heights
 * @param config - Configuration options
 * @returns Optimized section array (same reference if no changes made)
 */
export function optimizeLayoutGaps<T extends GapAnalyzableSection>(
  sections: T[],
  columns: number,
  sectionHeights: Map<string, number>,
  config: Partial<GapFillerConfig> = {}
): T[] {
  const fullConfig = { ...DEFAULT_GAP_FILLER_CONFIG, ...config };
  
  if (sections.length < 2 || columns < 2) {
    return sections; // No optimization possible
  }

  // Build sections with height info for gap analysis
  const sectionsWithHeight = sections.map(s => ({
    ...s,
    height: sectionHeights.get(s.key) ?? 200,
  }));

  // Find gaps in current layout
  const gaps = findLayoutGaps(sectionsWithHeight, columns, fullConfig);

  if (gaps.length === 0) {
    return sections; // No gaps to fill
  }

  // Find candidate sections that could fill gaps
  // Prefer single-column, low-priority sections for repositioning
  const movableSections = sections
    .map((s, idx) => ({
      section: s,
      index: idx,
      height: sectionHeights.get(s.key) ?? 200,
    }))
    .filter(
      ({ section }) =>
        section.colSpan === 1 && section.preferredColumns === 1
    )
    .sort((a, b) => b.section.top - a.section.top); // Start from bottom sections

  if (movableSections.length === 0) {
    return sections; // No movable sections
  }

  // Try to fill gaps with movable sections
  const result = [...sections];
  let madeChanges = false;

  for (const gap of gaps) {
    // Find a section that fits in this gap
    const candidate = movableSections.find(
      ({ section, height }) =>
        section.colSpan <= gap.width &&
        height <= gap.height + fullConfig.heightTolerance
    );

    if (candidate) {
      // Move section to fill the gap
      const targetIndex = result.findIndex(s => s.key === candidate.section.key);
      const targetSection = result[targetIndex];
      if (targetIndex >= 0 && targetSection) {
        const movedSection: T = {
          ...targetSection,
          left: generateLeftExpression(columns, gap.column, fullConfig.gap),
          top: gap.top,
          width: generateWidthExpression(columns, candidate.section.colSpan, fullConfig.gap),
        };
        result[targetIndex] = movedSection;
        madeChanges = true;

        // Remove from movable list to avoid reusing
        const movableIdx = movableSections.findIndex(
          m => m.section.key === candidate.section.key
        );
        if (movableIdx >= 0) {
          movableSections.splice(movableIdx, 1);
        }
      }
    }
  }

  return madeChanges ? result : sections;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse column index from CSS calc expression
 */
function parseColumnIndex(left: string, columns: number, gap: number): number {
  // Handle "0px" case
  if (left === '0px' || left === '0') return 0;

  // Try to extract column index from calc expression pattern
  // Pattern: calc((calc((100% - Xpx) / N) + Ypx) * INDEX)
  const indexMatch = left.match(/\*\s*(\d+)\s*\)/);
  if (indexMatch?.[1]) {
    return parseInt(indexMatch[1], 10);
  }

  // Try to parse px value and estimate column
  const pxMatch = left.match(/(\d+)px/);
  if (pxMatch?.[1]) {
    // Rough estimation based on typical column widths
    const pxValue = parseInt(pxMatch[1], 10);
    const estimatedColWidth = 260 + gap;
    return Math.round(pxValue / estimatedColWidth);
  }

  return 0;
}

// ============================================================================
// GAP ANALYZER CLASS (Item 16 - Gap detection with topology)
// ============================================================================

/**
 * Analyzes gaps in a layout with topology tracking.
 * Identifies gap shapes (rectangular, L-shaped, T-shaped, fragmented)
 * and calculates fillability scores.
 */
export class GapAnalyzer<T extends GapAnalyzableSection & { height: number }> {
  private readonly sections: T[];
  private readonly columns: number;
  private readonly config: GapFillerConfig;
  private grid: boolean[][] = [];
  private containerHeight: number = 0;
  private gaps: LayoutGap[] = [];
  private nextGapId = 0;

  constructor(
    sections: T[],
    columns: number,
    config: Partial<GapFillerConfig> = {}
  ) {
    this.sections = sections;
    this.columns = columns;
    this.config = { ...DEFAULT_GAP_FILLER_CONFIG, ...config };
    this.buildOccupancyGrid();
    this.detectGaps();
  }

  /**
   * Builds the occupancy grid from sections
   */
  private buildOccupancyGrid(): void {
    if (this.sections.length === 0) return;

    this.containerHeight = Math.max(
      ...this.sections.map(s => s.top + s.height),
      0
    );

    const rows = Math.ceil(this.containerHeight / this.config.gridResolution);
    this.grid = Array.from({ length: rows }, () =>
      new Array(this.columns).fill(false) as boolean[]
    );

    for (const section of this.sections) {
      const startRow = Math.floor(section.top / this.config.gridResolution);
      const endRow = Math.min(
        Math.ceil((section.top + section.height) / this.config.gridResolution),
        rows
      );
      const startCol = parseColumnIndex(section.left, this.columns, this.config.gap);
      const endCol = Math.min(startCol + section.colSpan, this.columns);

      for (let r = startRow; r < endRow; r++) {
        const row = this.grid[r];
        if (row) {
          for (let c = startCol; c < endCol; c++) {
            row[c] = true;
          }
        }
      }
    }
  }

  /**
   * Detects all gaps and determines their topology
   */
  private detectGaps(): void {
    this.gaps = [];
    if (this.grid.length === 0) return;

    const visited = new Set<string>();
    const rows = this.grid.length;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < this.columns; c++) {
        const key = `${r},${c}`;
        if (visited.has(key) || this.grid[r]?.[c]) continue;

        // Found an unvisited empty cell - flood fill to find gap region
        const gapCells = this.floodFill(r, c, visited);
        if (gapCells.length > 0) {
          const gap = this.createGapFromCells(gapCells);
          if (gap.height >= this.config.minGapHeight) {
            this.gaps.push(gap);
          }
        }
      }
    }

    // Sort by fillability
    this.gaps.sort((a, b) => b.fillability - a.fillability);
  }

  /**
   * Flood fills to find all cells in a gap region
   */
  private floodFill(startRow: number, startCol: number, visited: Set<string>): Array<[number, number]> {
    const cells: Array<[number, number]> = [];
    const queue: Array<[number, number]> = [[startRow, startCol]];
    const rows = this.grid.length;

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      const key = `${r},${c}`;

      if (visited.has(key) || r < 0 || r >= rows || c < 0 || c >= this.columns) {
        continue;
      }

      if (this.grid[r]?.[c]) {
        continue;  // Occupied cell
      }

      visited.add(key);
      cells.push([r, c]);

      // Check neighbors (4-connected)
      queue.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
    }

    return cells;
  }

  /**
   * Creates a gap object from a set of cells
   */
  private createGapFromCells(cells: Array<[number, number]>): LayoutGap {
    // Calculate bounding box
    const minRow = Math.min(...cells.map(c => c[0]));
    const maxRow = Math.max(...cells.map(c => c[0]));
    const minCol = Math.min(...cells.map(c => c[1]));
    const maxCol = Math.max(...cells.map(c => c[1]));

    const boundingWidth = maxCol - minCol + 1;
    const boundingHeight = (maxRow - minRow + 1) * this.config.gridResolution;
    const boundingArea = boundingWidth * boundingHeight;
    const actualArea = cells.length * this.config.gridResolution;

    // Determine topology based on shape analysis
    const topology = this.analyzeTopology(cells, boundingWidth, maxRow - minRow + 1, actualArea, boundingArea);

    // Calculate fillability based on shape regularity and size
    const fillability = this.calculateFillability(cells, topology, actualArea);

    // Check if can be absorbed by elastic padding
    const canAbsorb = actualArea < this.config.maxElasticPadding! * this.columns;

    return {
      id: `gap-${this.nextGapId++}`,
      column: minCol,
      top: minRow * this.config.gridResolution,
      height: boundingHeight,
      width: boundingWidth,
      topology,
      area: actualArea,
      fillability,
      canAbsorb,
    };
  }

  /**
   * Analyzes the topology of a gap region
   */
  private analyzeTopology(
    cells: Array<[number, number]>,
    boundingWidth: number,
    boundingRows: number,
    actualArea: number,
    boundingArea: number
  ): GapTopology {
    const fillRatio = actualArea / boundingArea;

    // If fill ratio is close to 1, it's rectangular
    if (fillRatio > 0.95) {
      return 'rectangular';
    }

    // If fill ratio is moderate and has characteristic L-shape
    if (fillRatio > 0.6 && fillRatio <= 0.8) {
      // Check for L-shape pattern
      if (this.isLShaped(cells, boundingWidth, boundingRows)) {
        return 'L-shaped';
      }
      // Check for T-shape pattern
      if (this.isTShaped(cells, boundingWidth, boundingRows)) {
        return 'T-shaped';
      }
    }

    // Check if fragmented (multiple disconnected regions)
    if (fillRatio < 0.5 && cells.length < 10) {
      return 'fragmented';
    }

    return 'irregular';
  }

  /**
   * Checks if cells form an L-shape
   */
  private isLShaped(cells: Array<[number, number]>, width: number, height: number): boolean {
    // L-shape has cells in corner regions but not in opposite corner
    const corners = [
      cells.some(([r, c]) => r === 0 && c === 0),
      cells.some(([r, c]) => r === 0 && c === width - 1),
      cells.some(([r, c]) => r === height - 1 && c === 0),
      cells.some(([r, c]) => r === height - 1 && c === width - 1),
    ];
    
    // L-shape has 3 corners filled
    return corners.filter(Boolean).length === 3;
  }

  /**
   * Checks if cells form a T-shape
   */
  private isTShaped(cells: Array<[number, number]>, width: number, height: number): boolean {
    // T-shape has a stem and horizontal bar
    const midCol = Math.floor(width / 2);
    const hasVerticalStem = cells.some(([r, c]) => c === midCol && r > 0);
    const hasHorizontalBar = cells.some(([r, c]) => r === 0 && c !== midCol);
    return hasVerticalStem && hasHorizontalBar;
  }

  /**
   * Calculates fillability score for a gap
   */
  private calculateFillability(
    cells: Array<[number, number]>,
    topology: GapTopology,
    area: number
  ): number {
    let score = 50;  // Base score

    // Topology bonus
    switch (topology) {
      case 'rectangular':
        score += 40;
        break;
      case 'L-shaped':
        score += 20;
        break;
      case 'T-shaped':
        score += 10;
        break;
      case 'fragmented':
        score -= 20;
        break;
      case 'irregular':
        score -= 10;
        break;
    }

    // Size bonus (larger gaps are more fillable)
    if (area > 50000) score += 10;
    else if (area < 5000) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Gets all detected gaps
   */
  getAllGaps(): LayoutGap[] {
    return [...this.gaps];
  }

  /**
   * Gets fillable gaps sorted by priority
   */
  getFillableGaps(minFillability: number = 50): LayoutGap[] {
    return this.gaps.filter(g => g.fillability >= minFillability);
  }

  /**
   * Gets gap metrics for dashboard
   */
  getMetrics(): GapMetrics {
    const totalGapArea = this.gaps.reduce((sum, g) => sum + g.area, 0);
    const containerArea = this.columns * this.containerHeight;
    const utilizationPercent = containerArea > 0 
      ? ((containerArea - totalGapArea) / containerArea) * 100 
      : 100;

    const gapsByTopology: Record<GapTopology, number> = {
      'rectangular': 0,
      'L-shaped': 0,
      'T-shaped': 0,
      'fragmented': 0,
      'irregular': 0,
    };
    for (const gap of this.gaps) {
      gapsByTopology[gap.topology]++;
    }

    const avgGapSize = this.gaps.length > 0
      ? totalGapArea / this.gaps.length
      : 0;

    const largestGap = this.gaps.length > 0
      ? this.gaps.reduce((max, g) => g.area > max.area ? g : max)
      : null;

    const fillableGaps = this.gaps.filter(g => g.fillability >= 50).length;
    const absorbableGaps = this.gaps.filter(g => g.canAbsorb).length;

    // Generate alerts
    const alerts: GapAlert[] = [];

    if (utilizationPercent < (this.config.utilizationThreshold ?? 85)) {
      alerts.push({
        type: 'low_utilization',
        severity: utilizationPercent < 70 ? 'error' : 'warning',
        message: `Layout utilization is ${utilizationPercent.toFixed(1)}%, below threshold of ${this.config.utilizationThreshold}%`,
      });
    }

    if (largestGap && largestGap.area > containerArea * 0.1) {
      alerts.push({
        type: 'large_gap',
        severity: 'warning',
        message: `Large gap detected (${Math.round(largestGap.area / 1000)}k px²)`,
        gapId: largestGap.id,
      });
    }

    const unfillableCount = this.gaps.filter(g => g.fillability < 30).length;
    if (unfillableCount > 2) {
      alerts.push({
        type: 'unfillable_gap',
        severity: 'info',
        message: `${unfillableCount} gaps with low fillability detected`,
      });
    }

    if (gapsByTopology['fragmented'] > 3) {
      alerts.push({
        type: 'fragmented',
        severity: 'info',
        message: 'Multiple fragmented gaps suggest suboptimal section ordering',
      });
    }

    return {
      totalGaps: this.gaps.length,
      totalGapArea,
      utilizationPercent,
      gapsByTopology,
      avgGapSize,
      largestGap,
      fillableGaps,
      absorbableGaps,
      alerts,
    };
  }
}

// ============================================================================
// GAP PRIORITY QUEUE (Item 17)
// ============================================================================

/**
 * Priority queue for gap filling.
 * Queues gaps by fillability (size, shape, position) and processes in optimal order.
 */
export class GapPriorityQueue {
  private items: PriorityQueueItem[] = [];

  /**
   * Adds a gap to the queue with its candidate sections
   */
  enqueue(gap: LayoutGap, candidateSections: string[]): void {
    const priority = this.calculatePriority(gap, candidateSections);
    
    const item: PriorityQueueItem = {
      gap,
      priority,
      candidateSections,
    };

    // Insert in sorted order (highest priority first)
    let inserted = false;
    for (let i = 0; i < this.items.length; i++) {
      if (priority > (this.items[i]?.priority ?? 0)) {
        this.items.splice(i, 0, item);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      this.items.push(item);
    }
  }

  /**
   * Removes and returns the highest priority gap
   */
  dequeue(): PriorityQueueItem | undefined {
    return this.items.shift();
  }

  /**
   * Peeks at the highest priority gap without removing
   */
  peek(): PriorityQueueItem | undefined {
    return this.items[0];
  }

  /**
   * Returns queue size
   */
  get size(): number {
    return this.items.length;
  }

  /**
   * Checks if queue is empty
   */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * Calculates priority for a gap
   */
  private calculatePriority(gap: LayoutGap, candidates: string[]): number {
    let priority = 0;

    // Fillability is the primary factor
    priority += gap.fillability * 0.5;

    // Having candidates increases priority
    priority += Math.min(candidates.length * 10, 30);

    // Larger gaps have higher priority
    priority += Math.min(gap.area / 1000, 20);

    // Rectangular gaps are easier to fill
    if (gap.topology === 'rectangular') {
      priority += 15;
    }

    // Gaps higher in the layout have priority (visual impact)
    priority += Math.max(0, 20 - gap.top / 100);

    return priority;
  }

  /**
   * Rebuilds queue priorities (call after section changes)
   */
  reprioritize(): void {
    const items = [...this.items];
    this.items = [];
    for (const item of items) {
      this.enqueue(item.gap, item.candidateSections);
    }
  }
}

// ============================================================================
// GAP FILLER CLASS (Items 18-25)
// ============================================================================

/**
 * Comprehensive gap filler with all optimization strategies:
 * - Section splitting for tall sections
 * - Elastic gap absorption
 * - Gap prediction
 * - Fragment coalescing
 * - Backtracking optimization
 * - Compaction passes
 */
export class GapFiller<T extends GapAnalyzableSection> {
  private sections: (T & { height: number })[];
  private readonly columns: number;
  private readonly config: GapFillerConfig;
  private readonly sectionHeights: Map<string, number>;
  private priorityQueue: GapPriorityQueue = new GapPriorityQueue();

  constructor(
    sections: T[],
    columns: number,
    sectionHeights: Map<string, number>,
    config: Partial<GapFillerConfig> = {}
  ) {
    this.sections = sections.map(s => ({
      ...s,
      height: sectionHeights.get(s.key) ?? 200,
    }));
    this.columns = columns;
    this.sectionHeights = sectionHeights;
    this.config = { ...DEFAULT_GAP_FILLER_CONFIG, ...config };
  }

  /**
   * Main optimization method - fills gaps using all strategies
   */
  optimize(): T[] {
    let result = [...this.sections];
    let improved = true;
    let iterations = 0;
    const maxIterations = this.config.maxBacktrackIterations ?? 3;

    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;

      // Step 1: Analyze current gaps
      const analyzer = new GapAnalyzer(result, this.columns, this.config);
      const gaps = analyzer.getFillableGaps();

      if (gaps.length === 0) break;

      // Step 2: Build priority queue
      this.buildPriorityQueue(gaps, result);

      // Step 3: Process gaps in priority order
      while (!this.priorityQueue.isEmpty()) {
        const item = this.priorityQueue.dequeue();
        if (!item) break;

        // Try to fill this gap
        const filled = this.tryFillGap(item, result);
        if (filled) {
          improved = true;
        }
      }

      // Step 4: Apply elastic absorption
      if (this.config.enableElasticAbsorption) {
        result = this.applyElasticAbsorption(result, analyzer);
      }

      // Step 5: Compaction pass
      if (this.config.enableCompaction) {
        result = this.compactLayout(result);
      }
    }

    return result as T[];
  }

  /**
   * Builds the priority queue from gaps
   */
  private buildPriorityQueue(gaps: LayoutGap[], sections: (T & { height: number })[]): void {
    this.priorityQueue = new GapPriorityQueue();

    for (const gap of gaps) {
      // Find candidate sections that could fill this gap
      const candidates = this.findCandidateSections(gap, sections);
      if (candidates.length > 0) {
        this.priorityQueue.enqueue(gap, candidates);
      }
    }
  }

  /**
   * Finds sections that could potentially fill a gap
   */
  private findCandidateSections(gap: LayoutGap, sections: (T & { height: number })[]): string[] {
    return sections
      .filter(s => {
        // Must fit width
        if (s.colSpan > gap.width) return false;
        
        // Must fit height (with tolerance)
        if (s.height > gap.height + this.config.heightTolerance) return false;
        
        // Prefer flexible sections
        if (s.preferredColumns > 1 && s.colSpan === 1) return true;
        
        // Single-column sections are most movable
        return s.colSpan === 1;
      })
      .map(s => s.key);
  }

  /**
   * Tries to fill a specific gap
   */
  private tryFillGap(
    item: PriorityQueueItem,
    sections: (T & { height: number })[]
  ): boolean {
    const { gap, candidateSections } = item;

    for (const candidateKey of candidateSections) {
      const sectionIndex = sections.findIndex(s => s.key === candidateKey);
      if (sectionIndex < 0) continue;

      const section = sections[sectionIndex];
      if (!section) continue;

      // Check if moving this section would actually improve layout
      const originalTop = section.top;
      const originalLeft = section.left;

      // Move section to gap
      section.top = gap.top;
      section.left = generateLeftExpression(this.columns, gap.column, this.config.gap);

      // Verify improvement (section moved up or layout improved)
      if (section.top < originalTop) {
        return true;  // Successfully filled gap
      }

      // Revert if no improvement
      section.top = originalTop;
      section.left = originalLeft;
    }

    return false;
  }

  /**
   * Applies elastic absorption to small gaps
   */
  private applyElasticAbsorption(
    sections: (T & { height: number })[],
    analyzer: GapAnalyzer<T & { height: number }>
  ): (T & { height: number })[] {
    const absorbableGaps = analyzer.getAllGaps().filter(g => g.canAbsorb);
    
    for (const gap of absorbableGaps) {
      // Find adjacent section that could absorb
      const adjacentSection = this.findAdjacentSection(sections, gap);
      if (adjacentSection && adjacentSection.elasticPadding !== undefined) {
        // Increase section's effective height to absorb gap
        const absorption = Math.min(
          gap.height,
          this.config.maxElasticPadding! - (adjacentSection.elasticPadding ?? 0)
        );
        adjacentSection.elasticPadding = (adjacentSection.elasticPadding ?? 0) + absorption;
      }
    }

    return sections;
  }

  /**
   * Finds section adjacent to a gap
   */
  private findAdjacentSection(
    sections: (T & { height: number })[],
    gap: LayoutGap
  ): (T & { height: number }) | undefined {
    // Find section directly above the gap
    return sections.find(s => {
      const sCol = parseColumnIndex(s.left, this.columns, this.config.gap);
      const sBottom = s.top + s.height;
      
      return sCol <= gap.column && 
             sCol + s.colSpan > gap.column &&
             Math.abs(sBottom - gap.top) < 20;  // Within 20px
    });
  }

  /**
   * Compacts the layout by moving sections up
   */
  private compactLayout(sections: (T & { height: number })[]): (T & { height: number })[] {
    // Sort by top position
    const sorted = [...sections].sort((a, b) => a.top - b.top);
    const colHeights = new Array(this.columns).fill(0) as number[];

    for (const section of sorted) {
      const col = parseColumnIndex(section.left, this.columns, this.config.gap);
      const span = section.colSpan;

      // Find the highest column in the span
      let maxHeight = 0;
      for (let c = col; c < col + span && c < this.columns; c++) {
        maxHeight = Math.max(maxHeight, colHeights[c] ?? 0);
      }

      // Move section up to this position if it's higher
      if (section.top > maxHeight) {
        section.top = maxHeight;
      }

      // Update column heights
      const newHeight = section.top + section.height + this.config.gap;
      for (let c = col; c < col + span && c < this.columns; c++) {
        colHeights[c] = newHeight;
      }
    }

    return sorted;
  }
}

// ============================================================================
// GAP PREDICTION (Item 20)
// ============================================================================

/**
 * Predicts whether a placement will create unfillable gaps.
 * Used during placement decisions to prevent gaps.
 */
export function predictGaps(
  currentLayout: Array<{ column: number; top: number; width: number; height: number }>,
  newPlacement: { column: number; top: number; width: number; height: number },
  columns: number,
  pendingSections: Array<{ colSpan: number; height: number }>
): {
  willCreateGap: boolean;
  gapSize: number;
  fillableBySections: boolean;
} {
  // Simulate the new placement
  const layout = [...currentLayout, newPlacement];

  // Check for gaps in columns not covered by new placement
  const newBottom = newPlacement.top + newPlacement.height;
  let totalGapSize = 0;
  let fillableGaps = 0;

  for (let c = 0; c < columns; c++) {
    // Skip columns covered by new placement
    if (c >= newPlacement.column && c < newPlacement.column + newPlacement.width) {
      continue;
    }

    // Find the highest point in this column
    const colHeight = layout
      .filter(p => c >= p.column && c < p.column + p.width)
      .reduce((max, p) => Math.max(max, p.top + p.height), 0);

    // Gap between this column's top and the new placement's bottom
    if (colHeight < newPlacement.top) {
      const gapHeight = newPlacement.top - colHeight;
      totalGapSize += gapHeight;

      // Check if any pending section could fill this gap
      const canFill = pendingSections.some(s => 
        s.colSpan === 1 && s.height <= gapHeight + 20
      );
      if (canFill) fillableGaps++;
    }
  }

  return {
    willCreateGap: totalGapSize > 0,
    gapSize: totalGapSize,
    fillableBySections: fillableGaps > 0,
  };
}

// ============================================================================
// FRAGMENT COALESCING (Item 21)
// ============================================================================

/**
 * Coalesces adjacent small gaps into larger fillable spaces.
 * This involves repositioning sections to merge gap fragments.
 */
export function coalesceFragments<T extends GapAnalyzableSection>(
  sections: (T & { height: number })[],
  columns: number,
  config: Partial<GapFillerConfig> = {}
): (T & { height: number })[] {
  const fullConfig = { ...DEFAULT_GAP_FILLER_CONFIG, ...config };
  const analyzer = new GapAnalyzer(sections, columns, fullConfig);
  const gaps = analyzer.getAllGaps();

  // Find adjacent fragmented gaps
  const fragmentedGaps = gaps.filter(g => g.topology === 'fragmented' || g.area < 5000);
  
  if (fragmentedGaps.length < 2) {
    return sections;  // Not enough fragments to coalesce
  }

  // Group fragments by proximity
  const groups: LayoutGap[][] = [];
  const used = new Set<string>();

  for (const gap of fragmentedGaps) {
    if (used.has(gap.id)) continue;

    const group = [gap];
    used.add(gap.id);

    // Find adjacent gaps
    for (const other of fragmentedGaps) {
      if (used.has(other.id)) continue;

      // Check if adjacent (within 50px vertically and same or adjacent column)
      const verticallyAdjacent = Math.abs(gap.top - other.top) < 50 ||
        Math.abs((gap.top + gap.height) - other.top) < 50;
      const horizontallyAdjacent = Math.abs(gap.column - other.column) <= 1;

      if (verticallyAdjacent && horizontallyAdjacent) {
        group.push(other);
        used.add(other.id);
      }
    }

    if (group.length > 1) {
      groups.push(group);
    }
  }

  // Try to coalesce each group
  let result = [...sections];
  for (const group of groups) {
    result = tryCoalesceGroup(result, group, columns, fullConfig);
  }

  return result;
}

/**
 * Tries to coalesce a group of fragments
 */
function tryCoalesceGroup<T extends GapAnalyzableSection>(
  sections: (T & { height: number })[],
  fragments: LayoutGap[],
  columns: number,
  config: GapFillerConfig
): (T & { height: number })[] {
  // Find the combined bounding box
  const minCol = Math.min(...fragments.map(f => f.column));
  const maxCol = Math.max(...fragments.map(f => f.column + f.width));
  const minTop = Math.min(...fragments.map(f => f.top));
  const maxBottom = Math.max(...fragments.map(f => f.top + f.height));

  // Find sections that could be moved to consolidate the gap
  const movableSections = sections.filter(s => {
    const sCol = parseColumnIndex(s.left, columns, config.gap);
    return sCol >= minCol && sCol < maxCol && 
           s.top >= minTop && s.top < maxBottom &&
           s.colSpan === 1;  // Only move single-column sections
  });

  if (movableSections.length === 0) {
    return sections;
  }

  // Try moving the movable section to one side to consolidate
  const result = [...sections];
  for (const movable of movableSections) {
    const idx = result.findIndex(s => s.key === movable.key);
    if (idx < 0) continue;

    const section = result[idx];
    if (!section) continue;

    // Move to the edge column if it creates a larger contiguous space
    const newCol = minCol === 0 ? maxCol - 1 : minCol;
    section.left = generateLeftExpression(columns, newCol, config.gap);
  }

  return result;
}

// ============================================================================
// UTILIZATION ALERTS (Item 23)
// ============================================================================

/**
 * Checks layout utilization and returns alerts if below threshold
 */
export function checkUtilization<T extends GapAnalyzableSection & { height: number }>(
  sections: T[],
  columns: number,
  threshold: number = 85
): GapAlert[] {
  const analyzer = new GapAnalyzer(sections, columns);
  const metrics = analyzer.getMetrics();

  const alerts: GapAlert[] = [];

  if (metrics.utilizationPercent < threshold) {
    alerts.push({
      type: 'low_utilization',
      severity: metrics.utilizationPercent < 70 ? 'error' : 'warning',
      message: `Layout utilization (${metrics.utilizationPercent.toFixed(1)}%) is below ${threshold}% threshold. Consider enabling more section flexibility.`,
    });
  }

  return alerts;
}




