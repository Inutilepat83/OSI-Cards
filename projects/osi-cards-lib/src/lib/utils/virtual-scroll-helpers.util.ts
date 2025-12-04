/**
 * Virtual Scroll Helpers
 *
 * Utilities for implementing efficient virtual scrolling with
 * large datasets, reducing DOM nodes and improving performance.
 *
 * Features:
 * - Dynamic item sizing
 * - Smooth scrolling
 * - Viewport calculation
 * - Buffer zones
 * - Performance optimization
 *
 * @example
 * ```typescript
 * import { VirtualScrollManager } from '@osi-cards/utils';
 *
 * const manager = new VirtualScrollManager({
 *   itemCount: 10000,
 *   itemHeight: 50,
 *   viewportHeight: 600,
 *   bufferSize: 5
 * });
 *
 * const visible = manager.getVisibleRange(scrollTop);
 * // Render only: items[visible.start] to items[visible.end]
 * ```
 */

/**
 * Virtual scroll configuration
 */
export interface VirtualScrollConfig {
  /**
   * Total number of items
   */
  itemCount: number;

  /**
   * Height of each item (or function for dynamic heights)
   */
  itemHeight: number | ((index: number) => number);

  /**
   * Viewport height in pixels
   */
  viewportHeight: number;

  /**
   * Number of items to render outside viewport (buffer)
   * Default: 3
   */
  bufferSize?: number;

  /**
   * Minimum number of items to render
   * Default: 1
   */
  minRenderCount?: number;
}

/**
 * Visible range
 */
export interface VisibleRange {
  /**
   * Start index (inclusive)
   */
  start: number;

  /**
   * End index (exclusive)
   */
  end: number;

  /**
   * Offset from top in pixels
   */
  offsetTop: number;

  /**
   * Offset from bottom in pixels
   */
  offsetBottom: number;
}

/**
 * Virtual item
 */
export interface VirtualItem<T> {
  /**
   * Item index
   */
  index: number;

  /**
   * Item data
   */
  data: T;

  /**
   * Item height in pixels
   */
  height: number;

  /**
   * Item top position in pixels
   */
  top: number;
}

/**
 * Virtual Scroll Manager
 *
 * Manages virtual scrolling calculations and state.
 */
export class VirtualScrollManager {
  private config: Required<VirtualScrollConfig>;
  private heightCache = new Map<number, number>();
  private totalHeight = 0;

  constructor(config: VirtualScrollConfig) {
    this.config = {
      ...config,
      bufferSize: config.bufferSize ?? 3,
      minRenderCount: config.minRenderCount ?? 1,
    };

    this.calculateTotalHeight();
  }

  /**
   * Get visible range for current scroll position
   *
   * @param scrollTop - Current scroll position
   * @returns Visible range with buffer
   *
   * @example
   * ```typescript
   * const range = manager.getVisibleRange(window.scrollY);
   * const items = allItems.slice(range.start, range.end);
   * ```
   */
  getVisibleRange(scrollTop: number): VisibleRange {
    const { itemCount, viewportHeight, bufferSize, minRenderCount } = this.config;

    // Calculate visible indices
    let start = this.getIndexAtPosition(scrollTop);
    let end = this.getIndexAtPosition(scrollTop + viewportHeight) + 1;

    // Apply buffer
    start = Math.max(0, start - bufferSize);
    end = Math.min(itemCount, end + bufferSize);

    // Ensure minimum render count
    if (end - start < minRenderCount) {
      end = Math.min(itemCount, start + minRenderCount);
    }

    // Calculate offsets
    const offsetTop = this.getPositionAtIndex(start);
    const offsetBottom = this.totalHeight - this.getPositionAtIndex(end);

    return {
      start,
      end,
      offsetTop,
      offsetBottom,
    };
  }

  /**
   * Get total scrollable height
   *
   * @returns Total height in pixels
   */
  getTotalHeight(): number {
    return this.totalHeight;
  }

  /**
   * Get item height at specific index
   *
   * @param index - Item index
   * @returns Height in pixels
   */
  getItemHeight(index: number): number {
    if (this.heightCache.has(index)) {
      return this.heightCache.get(index)!;
    }

    const { itemHeight } = this.config;
    const height = typeof itemHeight === 'function' ? itemHeight(index) : itemHeight;

    this.heightCache.set(index, height);
    return height;
  }

  /**
   * Get position of item at index
   *
   * @param index - Item index
   * @returns Top position in pixels
   */
  getPositionAtIndex(index: number): number {
    let position = 0;

    for (let i = 0; i < index; i++) {
      position += this.getItemHeight(i);
    }

    return position;
  }

  /**
   * Get index at scroll position
   *
   * @param position - Scroll position
   * @returns Item index
   */
  getIndexAtPosition(position: number): number {
    let currentPosition = 0;
    let index = 0;

    while (index < this.config.itemCount && currentPosition < position) {
      currentPosition += this.getItemHeight(index);
      index++;
    }

    return Math.max(0, index - 1);
  }

  /**
   * Update item height (for dynamic sizing)
   *
   * @param index - Item index
   * @param height - New height
   */
  updateItemHeight(index: number, height: number): void {
    const oldHeight = this.heightCache.get(index) || 0;
    this.heightCache.set(index, height);
    this.totalHeight += height - oldHeight;
  }

  /**
   * Update configuration
   *
   * @param config - Partial config to update
   */
  updateConfig(config: Partial<VirtualScrollConfig>): void {
    Object.assign(this.config, config);
    this.calculateTotalHeight();
  }

  /**
   * Clear height cache
   */
  clearCache(): void {
    this.heightCache.clear();
    this.calculateTotalHeight();
  }

  /**
   * Calculate total height
   */
  private calculateTotalHeight(): void {
    this.totalHeight = 0;

    for (let i = 0; i < this.config.itemCount; i++) {
      this.totalHeight += this.getItemHeight(i);
    }
  }
}

/**
 * Create virtual scroll manager
 *
 * @param config - Virtual scroll configuration
 * @returns New VirtualScrollManager instance
 */
export function createVirtualScroll(config: VirtualScrollConfig): VirtualScrollManager {
  return new VirtualScrollManager(config);
}

/**
 * Virtual scroll directive helper
 *
 * Provides utilities for creating virtual scroll directives.
 */
export class VirtualScrollHelper {
  private manager: VirtualScrollManager;
  private scrollElement: HTMLElement;
  private onScrollCallback?: () => void;

  constructor(config: VirtualScrollConfig, scrollElement: HTMLElement) {
    this.manager = new VirtualScrollManager(config);
    this.scrollElement = scrollElement;
    this.setupScrollListener();
  }

  /**
   * Get visible items for current scroll position
   *
   * @param items - All items
   * @returns Virtual items with positioning
   */
  getVisibleItems<T>(items: T[]): VirtualItem<T>[] {
    const scrollTop = this.scrollElement.scrollTop;
    const range = this.manager.getVisibleRange(scrollTop);
    const visibleItems: VirtualItem<T>[] = [];

    for (let i = range.start; i < range.end; i++) {
      if (i < items.length) {
        visibleItems.push({
          index: i,
          data: items[i],
          height: this.manager.getItemHeight(i),
          top: this.manager.getPositionAtIndex(i),
        });
      }
    }

    return visibleItems;
  }

  /**
   * Register scroll callback
   *
   * @param callback - Function to call on scroll
   */
  onScroll(callback: () => void): void {
    this.onScrollCallback = callback;
  }

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    this.scrollElement.removeEventListener('scroll', this.handleScroll);
  }

  /**
   * Setup scroll listener
   */
  private setupScrollListener(): void {
    this.scrollElement.addEventListener('scroll', this.handleScroll, {
      passive: true,
    });
  }

  /**
   * Handle scroll event
   */
  private handleScroll = (): void => {
    if (this.onScrollCallback) {
      this.onScrollCallback();
    }
  };
}

/**
 * Calculate optimal virtual scroll settings
 *
 * @param options - Input parameters
 * @returns Optimized configuration
 *
 * @example
 * ```typescript
 * const config = calculateVirtualScrollSettings({
 *   totalItems: 10000,
 *   averageItemHeight: 50,
 *   viewportHeight: 600
 * });
 * ```
 */
export function calculateVirtualScrollSettings(options: {
  totalItems: number;
  averageItemHeight: number;
  viewportHeight: number;
}): {
  bufferSize: number;
  renderAhead: number;
  renderBehind: number;
} {
  const { totalItems, averageItemHeight, viewportHeight } = options;

  const itemsPerViewport = Math.ceil(viewportHeight / averageItemHeight);
  const bufferSize = Math.max(3, Math.ceil(itemsPerViewport * 0.5));

  return {
    bufferSize,
    renderAhead: bufferSize,
    renderBehind: bufferSize,
  };
}

/**
 * Smooth scroll to index
 *
 * @param manager - Virtual scroll manager
 * @param scrollElement - Scroll container
 * @param index - Target index
 * @param options - Scroll options
 *
 * @example
 * ```typescript
 * scrollToIndex(manager, container, 500, {
 *   behavior: 'smooth',
 *   block: 'center'
 * });
 * ```
 */
export function scrollToIndex(
  manager: VirtualScrollManager,
  scrollElement: HTMLElement,
  index: number,
  options: ScrollIntoViewOptions = {}
): void {
  const position = manager.getPositionAtIndex(index);

  scrollElement.scrollTo({
    top: position,
    behavior: options.behavior || 'smooth',
  });
}

/**
 * Check if index is in visible range
 *
 * @param index - Item index
 * @param range - Visible range
 * @returns True if item is visible
 */
export function isIndexVisible(index: number, range: VisibleRange): boolean {
  return index >= range.start && index < range.end;
}

/**
 * Get visible item count
 *
 * @param range - Visible range
 * @returns Number of visible items
 */
export function getVisibleCount(range: VisibleRange): number {
  return range.end - range.start;
}
