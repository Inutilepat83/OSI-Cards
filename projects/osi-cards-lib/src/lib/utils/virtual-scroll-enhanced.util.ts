/**
 * Enhanced Virtual Scroll Utilities
 *
 * Provides utilities for implementing virtual scrolling in card lists.
 * Works with Angular CDK's virtual scroll or can be used standalone.
 *
 * @example
 * ```typescript
 * const virtualScroll = useVirtualScroll({
 *   items: cards,
 *   itemHeight: 200,
 *   containerHeight: 600,
 *   overscan: 3
 * });
 *
 * // In template: only render virtualScroll.visibleItems()
 * ```
 *
 * @module utils/virtual-scroll-enhanced
 */

import { computed, signal, Signal } from '@angular/core';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Virtual scroll configuration
 */
export interface VirtualScrollConfig<T> {
  /** All items to virtualize */
  items: Signal<T[]>;
  /** Height of each item in pixels (or estimator function) */
  itemHeight: number | ((item: T, index: number) => number);
  /** Height of the container in pixels */
  containerHeight: number;
  /** Number of items to render above/below viewport */
  overscan?: number;
  /** Gap between items in pixels */
  gap?: number;
  /** Scroll threshold for triggering updates (0-1) */
  scrollThreshold?: number;
}

/**
 * Virtual scroll state
 */
export interface VirtualScrollState<T> {
  /** Currently visible items */
  visibleItems: Signal<T[]>;
  /** Start index in the items array */
  startIndex: Signal<number>;
  /** End index in the items array */
  endIndex: Signal<number>;
  /** Total height of all items */
  totalHeight: Signal<number>;
  /** Offset from top for positioning */
  offsetTop: Signal<number>;
  /** Handle scroll event */
  onScroll: (scrollTop: number) => void;
  /** Jump to specific index */
  scrollToIndex: (index: number) => void;
  /** Get item position */
  getItemPosition: (index: number) => { top: number; height: number };
  /** Reset scroll state */
  reset: () => void;
  /** Current scroll position */
  scrollTop: Signal<number>;
  /** Whether at start of list */
  isAtStart: Signal<boolean>;
  /** Whether at end of list */
  isAtEnd: Signal<boolean>;
}

/**
 * Visible range
 */
interface VisibleRange {
  start: number;
  end: number;
  offsetTop: number;
}

// ============================================================================
// VIRTUAL SCROLL HOOK
// ============================================================================

/**
 * Create virtual scroll state for a list
 *
 * @param config - Virtual scroll configuration
 * @returns Virtual scroll state object
 */
export function useVirtualScroll<T>(config: VirtualScrollConfig<T>): VirtualScrollState<T> {
  const {
    items,
    itemHeight,
    containerHeight,
    overscan = 3,
    gap = 0,
    scrollThreshold = 0.1,
  } = config;

  // State
  const _scrollTop = signal(0);
  const _containerHeight = signal(containerHeight);

  // Cache for item heights (for variable height items)
  const heightCache = new Map<number, number>();

  // Get height for an item
  const getItemHeight = (item: T, index: number): number => {
    if (typeof itemHeight === 'number') {
      return itemHeight;
    }

    // Check cache
    if (heightCache.has(index)) {
      return heightCache.get(index)!;
    }

    // Calculate and cache
    const height = itemHeight(item, index);
    heightCache.set(index, height);
    return height;
  };

  // Calculate total height
  const totalHeight = computed(() => {
    const allItems = items();
    if (allItems.length === 0) return 0;

    if (typeof itemHeight === 'number') {
      return allItems.length * itemHeight + (allItems.length - 1) * gap;
    }

    return allItems.reduce((total, item, i) => {
      return total + getItemHeight(item, i) + (i > 0 ? gap : 0);
    }, 0);
  });

  // Calculate visible range
  const visibleRange = computed((): VisibleRange => {
    const allItems = items();
    const scrollPos = _scrollTop();
    const viewportHeight = _containerHeight();

    if (allItems.length === 0) {
      return { start: 0, end: 0, offsetTop: 0 };
    }

    // Fixed height - simple calculation
    if (typeof itemHeight === 'number') {
      const itemWithGap = itemHeight + gap;
      const start = Math.max(0, Math.floor(scrollPos / itemWithGap) - overscan);
      const visibleCount = Math.ceil(viewportHeight / itemWithGap);
      const end = Math.min(allItems.length, start + visibleCount + overscan * 2);
      const offsetTop = start * itemWithGap;

      return { start, end, offsetTop };
    }

    // Variable height - need to iterate
    let accumulatedHeight = 0;
    let start = 0;
    let end = allItems.length;
    let offsetTop = 0;
    let foundStart = false;

    for (let i = 0; i < allItems.length; i++) {
      const height = getItemHeight(allItems[i]!, i);

      // Check if this item starts the visible range
      if (!foundStart && accumulatedHeight + height >= scrollPos) {
        start = Math.max(0, i - overscan);
        offsetTop = start > 0 ? accumulatedHeight - (i - start) * (height + gap) : 0;
        foundStart = true;
      }

      // Check if this item ends the visible range
      if (foundStart && accumulatedHeight >= scrollPos + viewportHeight) {
        end = Math.min(allItems.length, i + overscan);
        break;
      }

      accumulatedHeight += height + gap;
    }

    return { start, end, offsetTop };
  });

  // Visible items
  const visibleItems = computed(() => {
    const allItems = items();
    const { start, end } = visibleRange();
    return allItems.slice(start, end);
  });

  // Start/end indices
  const startIndex = computed(() => visibleRange().start);
  const endIndex = computed(() => visibleRange().end);
  const offsetTop = computed(() => visibleRange().offsetTop);

  // Position checks
  const isAtStart = computed(() => _scrollTop() <= 0);
  const isAtEnd = computed(() => {
    const viewportHeight = _containerHeight();
    return _scrollTop() + viewportHeight >= totalHeight() - 1;
  });

  // Get position for an item
  const getItemPosition = (index: number): { top: number; height: number } => {
    const allItems = items();

    if (index < 0 || index >= allItems.length) {
      return { top: 0, height: 0 };
    }

    if (typeof itemHeight === 'number') {
      return {
        top: index * (itemHeight + gap),
        height: itemHeight,
      };
    }

    let top = 0;
    for (let i = 0; i < index; i++) {
      top += getItemHeight(allItems[i]!, i) + gap;
    }

    return {
      top,
      height: getItemHeight(allItems[index]!, index),
    };
  };

  // Scroll handlers
  const onScroll = (scrollTop: number): void => {
    _scrollTop.set(Math.max(0, scrollTop));
  };

  const scrollToIndex = (index: number): void => {
    const { top } = getItemPosition(index);
    _scrollTop.set(top);
  };

  const reset = (): void => {
    _scrollTop.set(0);
    heightCache.clear();
  };

  return {
    visibleItems,
    startIndex,
    endIndex,
    totalHeight,
    offsetTop,
    onScroll,
    scrollToIndex,
    getItemPosition,
    reset,
    scrollTop: _scrollTop.asReadonly(),
    isAtStart,
    isAtEnd,
  };
}

// ============================================================================
// INTERSECTION OBSERVER UTILITIES
// ============================================================================

/**
 * Intersection observer options
 */
export interface IntersectionOptions {
  /** Root element (null for viewport) */
  root?: Element | null;
  /** Root margin */
  rootMargin?: string;
  /** Intersection threshold(s) */
  threshold?: number | number[];
  /** Callback when visibility changes */
  onVisibilityChange?: (isVisible: boolean, entry: IntersectionObserverEntry) => void;
}

/**
 * Intersection observer state
 */
export interface IntersectionState {
  /** Whether element is visible */
  isVisible: Signal<boolean>;
  /** Intersection ratio */
  intersectionRatio: Signal<number>;
  /** Observe an element */
  observe: (element: Element) => void;
  /** Unobserve an element */
  unobserve: (element: Element) => void;
  /** Disconnect observer */
  disconnect: () => void;
}

/**
 * Create intersection observer state
 *
 * @param options - Observer options
 * @returns Intersection state object
 */
export function useIntersectionObserver(options: IntersectionOptions = {}): IntersectionState {
  const { root = null, rootMargin = '0px', threshold = 0, onVisibilityChange } = options;

  const _isVisible = signal(false);
  const _intersectionRatio = signal(0);

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const isVisible = entry.isIntersecting;
        const ratio = entry.intersectionRatio;

        _isVisible.set(isVisible);
        _intersectionRatio.set(ratio);

        onVisibilityChange?.(isVisible, entry);
      }
    },
    { root, rootMargin, threshold }
  );

  return {
    isVisible: _isVisible.asReadonly(),
    intersectionRatio: _intersectionRatio.asReadonly(),
    observe: (element: Element) => observer.observe(element),
    unobserve: (element: Element) => observer.unobserve(element),
    disconnect: () => observer.disconnect(),
  };
}

// ============================================================================
// LAZY LOADING UTILITIES
// ============================================================================

/**
 * Create a lazy loading trigger using intersection observer
 *
 * @param callback - Function to call when element becomes visible
 * @param options - Observer options
 * @returns Object with observe/unobserve methods
 */
export function createLazyLoadTrigger(
  callback: () => void,
  options: Omit<IntersectionOptions, 'onVisibilityChange'> = {}
): { observe: (element: Element) => void; disconnect: () => void } {
  let hasTriggered = false;

  const state = useIntersectionObserver({
    ...options,
    threshold: options.threshold ?? 0.1,
    onVisibilityChange: (isVisible) => {
      if (isVisible && !hasTriggered) {
        hasTriggered = true;
        callback();
      }
    },
  });

  return {
    observe: state.observe,
    disconnect: state.disconnect,
  };
}

/**
 * Create infinite scroll trigger
 *
 * @param loadMore - Function to load more items
 * @param options - Configuration options
 * @returns Object with observe/disconnect methods
 */
export function createInfiniteScrollTrigger(
  loadMore: () => Promise<void>,
  options: {
    threshold?: number;
    rootMargin?: string;
  } = {}
): { observe: (element: Element) => void; disconnect: () => void } {
  let isLoading = false;

  const state = useIntersectionObserver({
    rootMargin: options.rootMargin ?? '100px',
    threshold: options.threshold ?? 0,
    onVisibilityChange: async (isVisible) => {
      if (isVisible && !isLoading) {
        isLoading = true;
        try {
          await loadMore();
        } finally {
          isLoading = false;
        }
      }
    },
  });

  return {
    observe: state.observe,
    disconnect: state.disconnect,
  };
}
