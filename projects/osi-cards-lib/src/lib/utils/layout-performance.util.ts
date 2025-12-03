/**
 * Layout Performance Utilities
 *
 * Performance optimizations for section placement:
 * - Spatial index for swap candidates (Point 56)
 * - Incremental dirty tracking (Point 57)
 * - Calculation memoization (Point 58)
 * - Lazy position calculation for virtual scroll (Point 59)
 * - Web Worker offloading helpers (Point 60)
 *
 * @example
 * ```typescript
 * import { MemoizedCalculator, SpatialIndex } from './layout-performance.util';
 *
 * const calculator = new MemoizedCalculator();
 * const colSpan = calculator.calculateOptimalColumns(section, maxCols);
 *
 * const index = new SpatialIndex(sections, containerHeight);
 * const candidates = index.findSwapCandidates(section);
 * ```
 */

import { CardSection } from '../models/card.model';
import { calculateOptimalColumns, measureContentDensity } from './smart-grid.util';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Cached calculation result
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
}

/**
 * Section with position for spatial indexing
 */
export interface IndexedSection {
  key: string;
  section: CardSection;
  colSpan: number;
  column: number;
  top: number;
  height: number;
  rowBand: number; // Which row band this section belongs to
}

/**
 * Dirty tracking state for incremental updates
 */
export interface DirtyState {
  dirtyKeys: Set<string>;
  firstDirtyIndex: number;
  needsFullReflow: boolean;
}

/**
 * Viewport bounds for lazy calculation
 */
export interface ViewportBounds {
  top: number;
  bottom: number;
  buffer: number;
}

/**
 * Worker message for offloading
 */
export interface LayoutWorkerMessage {
  type: 'pack' | 'optimize' | 'measure';
  sections: CardSection[];
  config: {
    columns: number;
    gap: number;
    containerWidth: number;
  };
  requestId: string;
}

// ============================================================================
// CALCULATION MEMOIZATION (Point 58)
// ============================================================================

/**
 * Memoized calculator for expensive layout calculations.
 * Caches results by section content hash to avoid redundant calculations.
 */
export class MemoizedCalculator {
  private colSpanCache: Map<string, CacheEntry<number>> = new Map();
  private heightCache: Map<string, CacheEntry<number>> = new Map();
  private densityCache: Map<string, CacheEntry<number>> = new Map();

  private readonly maxCacheSize: number;
  private readonly maxCacheAge: number;

  constructor(options: { maxCacheSize?: number; maxCacheAgeMs?: number } = {}) {
    this.maxCacheSize = options.maxCacheSize ?? 500;
    this.maxCacheAge = options.maxCacheAgeMs ?? 60000; // 1 minute
  }

  /**
   * Calculate optimal columns with memoization
   */
  calculateOptimalColumns(section: CardSection, maxColumns: number): number {
    const hash = this.generateHash(section, maxColumns);
    const cached = this.colSpanCache.get(hash);

    if (cached && !this.isExpired(cached)) {
      cached.hits++;
      return cached.value;
    }

    // Calculate fresh
    const value = calculateOptimalColumns(section, maxColumns);

    this.colSpanCache.set(hash, {
      value,
      timestamp: Date.now(),
      hits: 1,
    });

    this.pruneCache(this.colSpanCache);

    return value;
  }

  /**
   * Calculate content density with memoization
   */
  calculateDensity(section: CardSection): number {
    const hash = this.generateContentHash(section);
    const cached = this.densityCache.get(hash);

    if (cached && !this.isExpired(cached)) {
      cached.hits++;
      return cached.value;
    }

    const value = measureContentDensity(section);

    this.densityCache.set(hash, {
      value,
      timestamp: Date.now(),
      hits: 1,
    });

    this.pruneCache(this.densityCache);

    return value;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    colSpanCacheSize: number;
    heightCacheSize: number;
    densityCacheSize: number;
    totalHits: number;
  } {
    let totalHits = 0;

    for (const entry of this.colSpanCache.values()) {
      totalHits += entry.hits;
    }
    for (const entry of this.heightCache.values()) {
      totalHits += entry.hits;
    }
    for (const entry of this.densityCache.values()) {
      totalHits += entry.hits;
    }

    return {
      colSpanCacheSize: this.colSpanCache.size,
      heightCacheSize: this.heightCache.size,
      densityCacheSize: this.densityCache.size,
      totalHits,
    };
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.colSpanCache.clear();
    this.heightCache.clear();
    this.densityCache.clear();
  }

  /**
   * Invalidate cache for specific section
   */
  invalidate(section: CardSection): void {
    const hash = this.generateContentHash(section);

    // Remove from all caches where this section might be
    for (const key of this.colSpanCache.keys()) {
      if (key.startsWith(hash)) {
        this.colSpanCache.delete(key);
      }
    }

    this.heightCache.delete(hash);
    this.densityCache.delete(hash);
  }

  /**
   * Generate a hash key for colSpan calculations
   */
  private generateHash(section: CardSection, maxColumns: number): string {
    return `${this.generateContentHash(section)}-cols${maxColumns}`;
  }

  /**
   * Generate a content hash for a section
   */
  private generateContentHash(section: CardSection): string {
    const parts = [
      section.type ?? '',
      section.title ?? '',
      String(section.fields?.length ?? 0),
      String(section.items?.length ?? 0),
      String(section.description?.length ?? 0),
      section.colSpan?.toString() ?? '',
      section.preferredColumns?.toString() ?? '',
    ];

    return parts.join('|');
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp > this.maxCacheAge;
  }

  /**
   * Prune cache if it exceeds max size
   */
  private pruneCache<T>(cache: Map<string, CacheEntry<T>>): void {
    if (cache.size <= this.maxCacheSize) {
      return;
    }

    // Remove oldest entries (LRU-like)
    const entries = Array.from(cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toRemove = entries.slice(0, cache.size - this.maxCacheSize + 50);

    for (const [key] of toRemove) {
      cache.delete(key);
    }
  }
}

// ============================================================================
// SPATIAL INDEX (Point 56)
// ============================================================================

/**
 * Spatial index for efficient lookup of nearby sections.
 * Used for swap optimization to only consider sections in the same row band.
 */
export class SpatialIndex {
  private sections: IndexedSection[] = [];
  private rowBands: Map<number, IndexedSection[]> = new Map();
  private readonly bandHeight: number;

  /**
   * @param bandHeight - Height of each row band for grouping (default: 200px)
   */
  constructor(bandHeight: number = 200) {
    this.bandHeight = bandHeight;
  }

  /**
   * Build the spatial index from sections
   */
  build(
    sections: Array<{
      key: string;
      section: CardSection;
      colSpan: number;
      column: number;
      top: number;
      height: number;
    }>
  ): void {
    this.sections = [];
    this.rowBands.clear();

    for (const section of sections) {
      const rowBand = Math.floor(section.top / this.bandHeight);

      const indexed: IndexedSection = {
        ...section,
        rowBand,
      };

      this.sections.push(indexed);

      // Add to row band
      if (!this.rowBands.has(rowBand)) {
        this.rowBands.set(rowBand, []);
      }
      this.rowBands.get(rowBand)!.push(indexed);

      // Also add to adjacent bands if section spans them
      const endRowBand = Math.floor((section.top + section.height) / this.bandHeight);
      for (let band = rowBand + 1; band <= endRowBand; band++) {
        if (!this.rowBands.has(band)) {
          this.rowBands.set(band, []);
        }
        this.rowBands.get(band)!.push(indexed);
      }
    }
  }

  /**
   * Find swap candidates for a section (Point 56)
   * Only returns sections in the same or adjacent row bands.
   */
  findSwapCandidates(
    section: IndexedSection,
    options: {
      sameColumnOnly?: boolean;
      adjacentBandsOnly?: boolean;
    } = {}
  ): IndexedSection[] {
    const candidates: IndexedSection[] = [];
    const targetBands = [section.rowBand];

    // Include adjacent bands unless restricted
    if (!options.adjacentBandsOnly) {
      targetBands.push(section.rowBand - 1, section.rowBand + 1);
    }

    for (const band of targetBands) {
      const bandSections = this.rowBands.get(band) ?? [];

      for (const candidate of bandSections) {
        // Skip self
        if (candidate.key === section.key) continue;

        // Filter by column if requested
        if (options.sameColumnOnly && candidate.column !== section.column) continue;

        // Check for compatible colSpan
        if (candidate.colSpan !== section.colSpan) {
          // Different spans - might still be swappable if both fit
          // Skip complex swaps for now
          continue;
        }

        candidates.push(candidate);
      }
    }

    return candidates;
  }

  /**
   * Find sections in a specific vertical range
   */
  findInRange(top: number, bottom: number): IndexedSection[] {
    const startBand = Math.floor(top / this.bandHeight);
    const endBand = Math.floor(bottom / this.bandHeight);

    const results = new Set<IndexedSection>();

    for (let band = startBand; band <= endBand; band++) {
      const bandSections = this.rowBands.get(band) ?? [];
      for (const section of bandSections) {
        // Check if section actually overlaps the range
        if (section.top + section.height >= top && section.top <= bottom) {
          results.add(section);
        }
      }
    }

    return Array.from(results);
  }

  /**
   * Get all sections in a specific column
   */
  findInColumn(column: number): IndexedSection[] {
    return this.sections.filter(s =>
      s.column <= column && s.column + s.colSpan > column
    );
  }
}

// ============================================================================
// INCREMENTAL DIRTY TRACKING (Point 57)
// ============================================================================

/**
 * Tracks which sections need recalculation after changes.
 */
export class DirtyTracker {
  private state: DirtyState = {
    dirtyKeys: new Set(),
    firstDirtyIndex: Infinity,
    needsFullReflow: false,
  };

  private sectionOrder: string[] = [];

  /**
   * Initialize with current section order
   */
  initialize(keys: string[]): void {
    this.sectionOrder = [...keys];
    this.reset();
  }

  /**
   * Mark a section as dirty
   */
  markDirty(key: string): void {
    this.state.dirtyKeys.add(key);

    const index = this.sectionOrder.indexOf(key);
    if (index >= 0 && index < this.state.firstDirtyIndex) {
      this.state.firstDirtyIndex = index;
    }
  }

  /**
   * Mark all sections after a certain index as dirty
   */
  markDirtyAfter(index: number): void {
    for (let i = index; i < this.sectionOrder.length; i++) {
      const key = this.sectionOrder[i];
      if (key) {
        this.state.dirtyKeys.add(key);
      }
    }

    if (index < this.state.firstDirtyIndex) {
      this.state.firstDirtyIndex = index;
    }
  }

  /**
   * Mark that a full reflow is needed
   */
  markNeedsFullReflow(): void {
    this.state.needsFullReflow = true;
    this.state.firstDirtyIndex = 0;
  }

  /**
   * Check if a section is dirty
   */
  isDirty(key: string): boolean {
    return this.state.dirtyKeys.has(key);
  }

  /**
   * Get sections that need recalculation
   */
  getDirtySections(): string[] {
    return Array.from(this.state.dirtyKeys);
  }

  /**
   * Get the first dirty index
   */
  getFirstDirtyIndex(): number {
    return this.state.firstDirtyIndex;
  }

  /**
   * Check if full reflow is needed
   */
  needsFullReflow(): boolean {
    return this.state.needsFullReflow;
  }

  /**
   * Reset dirty state
   */
  reset(): void {
    this.state = {
      dirtyKeys: new Set(),
      firstDirtyIndex: Infinity,
      needsFullReflow: false,
    };
  }

  /**
   * Get current state
   */
  getState(): DirtyState {
    return {
      dirtyKeys: new Set(this.state.dirtyKeys),
      firstDirtyIndex: this.state.firstDirtyIndex,
      needsFullReflow: this.state.needsFullReflow,
    };
  }
}

// ============================================================================
// LAZY POSITION CALCULATION (Point 59)
// ============================================================================

/**
 * Lazy calculator for virtual scroll scenarios.
 * Only calculates positions for sections in the visible viewport.
 */
export class LazyPositionCalculator {
  private calculatedSections: Map<string, {
    left: string;
    top: number;
    width: string;
    height: number;
  } | null | undefined> = new Map();

  private sectionOrder: string[] = [];
  private sectionData: Map<string, { section: CardSection; colSpan: number; height: number }> = new Map();
  private columnHeights: number[] = [];
  private config: { columns: number; gap: number } = { columns: 4, gap: 12 };

  /**
   * Initialize with sections and config
   */
  initialize(
    sections: Array<{ key: string; section: CardSection; colSpan: number; estimatedHeight: number }>,
    config: { columns: number; gap: number }
  ): void {
    this.config = config;
    this.columnHeights = new Array(config.columns).fill(0);
    this.calculatedSections.clear();
    this.sectionOrder = [];
    this.sectionData.clear();

    for (const section of sections) {
      this.sectionOrder.push(section.key);
      this.sectionData.set(section.key, {
        section: section.section,
        colSpan: section.colSpan,
        height: section.estimatedHeight,
      });
    }
  }

  /**
   * Get positions for sections in viewport
   */
  getPositionsForViewport(viewport: ViewportBounds): Map<string, {
    left: string;
    top: number;
    width: string;
    height: number;
  }> {
    const result = new Map<string, {
      left: string;
      top: number;
      width: string;
      height: number;
    }>();

    const expandedTop = Math.max(0, viewport.top - viewport.buffer);
    const expandedBottom = viewport.bottom + viewport.buffer;

    // Calculate positions sequentially until we're past the viewport
    for (const key of this.sectionOrder) {
      // Check if we already calculated this section
      let position = this.calculatedSections.get(key);

      if (!position) {
        // Calculate position
        position = this.calculatePosition(key);
        if (position) {
          this.calculatedSections.set(key, position);
        }
      }

      if (position) {
        // Check if in viewport
        const bottom = position.top + position.height;

        if (bottom >= expandedTop && position.top <= expandedBottom) {
          result.set(key, position);
        }

        // Early exit if we're past the viewport
        if (position.top > expandedBottom) {
          break;
        }
      }
    }

    return result;
  }

  /**
   * Calculate position for a single section
   */
  private calculatePosition(key: string): { left: string; top: number; width: string; height: number } | null | undefined {
    const data = this.sectionData.get(key);
    if (!data) return null;

    const colSpan = Math.min(data.colSpan, this.config.columns);

    // Find best column
    let bestColumn = 0;
    let bestTop = Infinity;

    for (let col = 0; col <= this.config.columns - colSpan; col++) {
      let maxHeight = 0;
      for (let c = col; c < col + colSpan; c++) {
        maxHeight = Math.max(maxHeight, this.columnHeights[c] ?? 0);
      }
      if (maxHeight < bestTop) {
        bestTop = maxHeight;
        bestColumn = col;
      }
    }

    const top = bestTop === Infinity ? 0 : bestTop;

    // Update column heights
    const newHeight = top + data.height + this.config.gap;
    for (let c = bestColumn; c < bestColumn + colSpan; c++) {
      this.columnHeights[c] = newHeight;
    }

    // Generate CSS expressions
    const left = this.generateLeft(bestColumn);
    const width = this.generateWidth(colSpan);

    return { left, top, width, height: data.height };
  }

  /**
   * Generate CSS left expression
   */
  private generateLeft(column: number): string {
    if (column === 0) return '0px';
    return `calc((100% - ${(this.config.columns - 1) * this.config.gap}px) / ${this.config.columns} * ${column} + ${column * this.config.gap}px)`;
  }

  /**
   * Generate CSS width expression
   */
  private generateWidth(colSpan: number): string {
    if (colSpan === this.config.columns) return '100%';
    return `calc((100% - ${(this.config.columns - 1) * this.config.gap}px) / ${this.config.columns} * ${colSpan} + ${(colSpan - 1) * this.config.gap}px)`;
  }

  /**
   * Invalidate calculations from a certain point
   */
  invalidateFrom(key: string): void {
    const index = this.sectionOrder.indexOf(key);
    if (index < 0) return;

    // Remove calculated positions for this section and all after it
    for (let i = index; i < this.sectionOrder.length; i++) {
      const k = this.sectionOrder[i];
      if (k) {
        this.calculatedSections.delete(k);
      }
    }

    // Reset column heights (would need proper tracking for incremental)
    // For simplicity, recalculate from start
    if (index === 0) {
      this.columnHeights = new Array(this.config.columns).fill(0);
    }
  }

  /**
   * Get total estimated height
   */
  getEstimatedTotalHeight(): number {
    // Calculate all positions to get accurate height
    for (const key of this.sectionOrder) {
      if (!this.calculatedSections.has(key)) {
        const position = this.calculatePosition(key);
        if (position) {
          this.calculatedSections.set(key, position);
        }
      }
    }

    return Math.max(...this.columnHeights, 0);
  }
}

// ============================================================================
// WEB WORKER HELPERS (Point 60)
// ============================================================================

/**
 * Helper for offloading layout calculations to a Web Worker
 */
export class LayoutWorkerManager {
  private worker: Worker | null = null;
  private pendingRequests: Map<string, {
    resolve: (result: unknown) => void;
    reject: (error: Error) => void;
  }> = new Map();

  private requestIdCounter = 0;

  /**
   * Initialize the worker
   */
  initialize(workerUrl: string): void {
    if (typeof Worker === 'undefined') {
      console.warn('[LayoutWorkerManager] Web Workers not available');
      return;
    }

    try {
      this.worker = new Worker(workerUrl);

      this.worker.onmessage = (event) => {
        const { requestId, result, error } = event.data;
        const pending = this.pendingRequests.get(requestId);

        if (pending) {
          this.pendingRequests.delete(requestId);
          if (error) {
            pending.reject(new Error(error));
          } else {
            pending.resolve(result);
          }
        }
      };

      this.worker.onerror = (error) => {
        console.error('[LayoutWorkerManager] Worker error:', error);
      };
    } catch (e) {
      console.warn('[LayoutWorkerManager] Failed to initialize worker:', e);
    }
  }

  /**
   * Check if worker is available
   */
  isAvailable(): boolean {
    return this.worker !== null;
  }

  /**
   * Offload packing calculation to worker
   */
  async pack(
    sections: CardSection[],
    config: { columns: number; gap: number; containerWidth: number }
  ): Promise<unknown> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    const requestId = `req-${this.requestIdCounter++}`;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });

      const message: LayoutWorkerMessage = {
        type: 'pack',
        sections,
        config,
        requestId,
      };

      this.worker!.postMessage(message);
    });
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    // Reject all pending requests
    for (const pending of this.pendingRequests.values()) {
      pending.reject(new Error('Worker terminated'));
    }
    this.pendingRequests.clear();
  }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

let _memoizedCalculator: MemoizedCalculator | null = null;
let _spatialIndex: SpatialIndex | null = null;
let _dirtyTracker: DirtyTracker | null = null;

/**
 * Get the global memoized calculator
 */
export function getMemoizedCalculator(): MemoizedCalculator {
  if (!_memoizedCalculator) {
    _memoizedCalculator = new MemoizedCalculator();
  }
  return _memoizedCalculator;
}

/**
 * Get the global spatial index
 */
export function getSpatialIndex(): SpatialIndex {
  if (!_spatialIndex) {
    _spatialIndex = new SpatialIndex();
  }
  return _spatialIndex;
}

/**
 * Get the global dirty tracker
 */
export function getDirtyTracker(): DirtyTracker {
  if (!_dirtyTracker) {
    _dirtyTracker = new DirtyTracker();
  }
  return _dirtyTracker;
}

/**
 * Reset all performance singletons
 */
export function resetPerformanceHelpers(): void {
  _memoizedCalculator?.clearCaches();
  _spatialIndex = null;
  _dirtyTracker = null;
}



