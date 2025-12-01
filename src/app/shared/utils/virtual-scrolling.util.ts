/**
 * Virtual scrolling utilities
 * Implements virtual scrolling for large card lists to improve performance
 */

export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export interface VirtualScrollResult {
  startIndex: number;
  endIndex: number;
  visibleItems: number[];
  totalHeight: number;
  offsetY: number;
}

/**
 * Calculate virtual scroll indices
 */
export function calculateVirtualScroll(
  scrollTop: number,
  totalItems: number,
  options: VirtualScrollOptions
): VirtualScrollResult {
  const { itemHeight, containerHeight, overscan = 3 } = options;

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const endIndex = Math.min(totalItems - 1, startIndex + visibleCount + overscan * 2);

  // Generate visible item indices
  const visibleItems: number[] = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push(i);
  }

  // Calculate total height and offset
  const totalHeight = totalItems * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    startIndex,
    endIndex,
    visibleItems,
    totalHeight,
    offsetY,
  };
}

/**
 * Virtual scroll manager
 */
export class VirtualScrollManager {
  private scrollTop = 0;
  private totalItems = 0;

  constructor(private readonly options: VirtualScrollOptions) {}

  /**
   * Update scroll position
   */
  updateScroll(scrollTop: number): VirtualScrollResult {
    this.scrollTop = scrollTop;
    return this.calculate();
  }

  /**
   * Set total items
   */
  setTotalItems(count: number): VirtualScrollResult {
    this.totalItems = count;
    return this.calculate();
  }

  /**
   * Calculate virtual scroll result
   */
  calculate(): VirtualScrollResult {
    return calculateVirtualScroll(this.scrollTop, this.totalItems, this.options);
  }
}
