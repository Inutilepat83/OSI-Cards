/**
 * Virtual Scrolling Utilities
 *
 * Provides utilities for implementing virtual scrolling
 * in large card lists and sections.
 */

/**
 * Calculate visible items for virtual scrolling
 */
export interface VirtualScrollConfig {
  /** Total number of items */
  totalItems: number;
  /** Height of each item in pixels */
  itemHeight: number;
  /** Height of the container in pixels */
  containerHeight: number;
  /** Current scroll position */
  scrollTop: number;
  /** Number of items to render above/below viewport */
  overscan?: number;
}

/**
 * Virtual scroll calculation result
 */
export interface VirtualScrollResult {
  /** Index of first visible item */
  startIndex: number;
  /** Index of last visible item */
  endIndex: number;
  /** Offset to position items correctly */
  offsetY: number;
  /** Total height of all items */
  totalHeight: number;
  /** Number of visible items */
  visibleCount: number;
}

/**
 * Calculate which items should be rendered for virtual scrolling
 */
export function calculateVirtualScroll(config: VirtualScrollConfig): VirtualScrollResult {
  const {
    totalItems,
    itemHeight,
    containerHeight,
    scrollTop,
    overscan = 3
  } = config;

  // Calculate total height
  const totalHeight = totalItems * itemHeight;

  // Calculate visible range
  const visibleCount = Math.ceil(containerHeight / itemHeight);

  // Calculate start index with overscan
  const rawStartIndex = Math.floor(scrollTop / itemHeight);
  const startIndex = Math.max(0, rawStartIndex - overscan);

  // Calculate end index with overscan
  const rawEndIndex = rawStartIndex + visibleCount;
  const endIndex = Math.min(totalItems - 1, rawEndIndex + overscan);

  // Calculate offset
  const offsetY = startIndex * itemHeight;

  return {
    startIndex,
    endIndex,
    offsetY,
    totalHeight,
    visibleCount
  };
}

/**
 * Calculate visible items for variable height virtual scrolling
 */
export interface VariableHeightItem {
  index: number;
  height: number;
  offset: number;
}

export interface VariableVirtualScrollConfig {
  /** Array of item heights */
  itemHeights: number[];
  /** Height of the container in pixels */
  containerHeight: number;
  /** Current scroll position */
  scrollTop: number;
  /** Number of items to render above/below viewport */
  overscan?: number;
}

export interface VariableVirtualScrollResult {
  /** Items to render */
  items: VariableHeightItem[];
  /** Total height of all items */
  totalHeight: number;
  /** Offset for positioning */
  offsetY: number;
}

/**
 * Calculate virtual scroll for variable height items
 */
export function calculateVariableVirtualScroll(
  config: VariableVirtualScrollConfig
): VariableVirtualScrollResult {
  const { itemHeights, containerHeight, scrollTop, overscan = 3 } = config;

  // Calculate cumulative offsets
  const offsets: number[] = [];
  let totalHeight = 0;

  for (const height of itemHeights) {
    offsets.push(totalHeight);
    totalHeight += height;
  }

  // Binary search to find start index
  let startIndex = binarySearch(offsets, scrollTop);
  startIndex = Math.max(0, startIndex - overscan);

  // Find end index
  const scrollBottom = scrollTop + containerHeight;
  let endIndex = binarySearch(offsets, scrollBottom);
  endIndex = Math.min(itemHeights.length - 1, endIndex + overscan);

  // Build visible items array
  const items: VariableHeightItem[] = [];
  for (let i = startIndex; i <= endIndex; i++) {
    items.push({
      index: i,
      height: itemHeights[i] ?? 0,
      offset: offsets[i] ?? 0
    });
  }

  return {
    items,
    totalHeight,
    offsetY: offsets[startIndex] || 0
  };
}

/**
 * Binary search to find index of first item >= target
 */
function binarySearch(arr: number[], target: number): number {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = arr[mid] ?? 0;
    if (midValue < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return Math.max(0, left - 1);
}

/**
 * Debounced scroll handler
 */
export function createScrollHandler(
  callback: (scrollTop: number) => void,
  delay = 16 // ~60fps
): (event: Event) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastScrollTop = 0;

  return (event: Event) => {
    const target = event.target as HTMLElement;
    lastScrollTop = target.scrollTop;

    if (timeout) return;

    timeout = setTimeout(() => {
      callback(lastScrollTop);
      timeout = null;
    }, delay);
  };
}

/**
 * Intersection observer for lazy loading
 */
export function createLazyLoadObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver {
  return new IntersectionObserver(callback, {
    root: null,
    rootMargin: '100px',
    threshold: 0,
    ...options
  });
}

/**
 * Resize observer for container size changes
 */
export function createResizeObserver(
  callback: (width: number, height: number) => void
): ResizeObserver {
  return new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      callback(width, height);
    }
  });
}

