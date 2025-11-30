/**
 * Virtual Scroll Utilities
 * 
 * Implements virtual scrolling for large card lists (20+ sections).
 * Only renders visible sections plus a buffer, significantly improving
 * performance for cards with many sections.
 * 
 * @example
 * ```typescript
 * import { VirtualScrollManager } from 'osi-cards-lib';
 * 
 * const manager = new VirtualScrollManager(containerRef, {
 *   bufferSize: 3,
 *   estimatedItemHeight: 200,
 * });
 * 
 * manager.setItems(sections);
 * const visible = manager.getVisibleItems();
 * ```
 */

import { CardSection } from '../models/card.model';
import { estimateSectionHeight } from './smart-grid.util';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Virtual item with position information
 */
export interface VirtualItem<T = any> {
  /** Original item data */
  item: T;
  /** Index in the full list */
  index: number;
  /** Offset from container top */
  offset: number;
  /** Estimated or measured height */
  height: number;
  /** Whether item is currently visible */
  isVisible: boolean;
  /** Whether item should be rendered (visible + buffer) */
  shouldRender: boolean;
}

/**
 * Virtual scroll viewport state
 */
export interface ViewportState {
  /** Scroll position from top */
  scrollTop: number;
  /** Visible area height */
  viewportHeight: number;
  /** Total scrollable height */
  totalHeight: number;
  /** First visible item index */
  startIndex: number;
  /** Last visible item index */
  endIndex: number;
  /** First rendered item index (including buffer) */
  renderStartIndex: number;
  /** Last rendered item index (including buffer) */
  renderEndIndex: number;
}

/**
 * Virtual scroll configuration
 */
export interface VirtualScrollConfig {
  /** Number of items to render above/below visible area */
  bufferSize?: number;
  /** Default estimated height for items */
  estimatedItemHeight?: number;
  /** Minimum items before enabling virtual scrolling */
  virtualThreshold?: number;
  /** Enable smooth scrolling behavior */
  smoothScroll?: boolean;
  /** Overscan count for IntersectionObserver */
  overscanCount?: number;
}

/**
 * Scroll event data
 */
export interface ScrollEvent {
  scrollTop: number;
  scrollLeft: number;
  direction: 'up' | 'down' | 'none';
  velocity: number;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: Required<VirtualScrollConfig> = {
  bufferSize: 3,
  estimatedItemHeight: 200,
  virtualThreshold: 20,
  smoothScroll: true,
  overscanCount: 2,
};

// ============================================================================
// VIRTUAL SCROLL MANAGER
// ============================================================================

/**
 * Manager for virtual scrolling of large lists
 */
export class VirtualScrollManager<T = CardSection> {
  private items: T[] = [];
  private heights: Map<number, number> = new Map();
  private offsets: number[] = [];
  private totalHeight = 0;
  
  private scrollTop = 0;
  private viewportHeight = 0;
  private lastScrollTop = 0;
  private scrollVelocity = 0;
  
  private observer: IntersectionObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private measureCallbacks = new Map<number, () => void>();
  
  private readonly config: Required<VirtualScrollConfig>;
  private readonly heightEstimator: (item: T) => number;
  
  private onVisibilityChange?: (indices: number[]) => void;
  private onScrollChange?: (event: ScrollEvent) => void;

  constructor(
    private container: HTMLElement | null,
    config?: VirtualScrollConfig,
    heightEstimator?: (item: T) => number
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.heightEstimator = heightEstimator ?? this.defaultHeightEstimator;
    
    this.setupObservers();
    this.measureViewport();
  }

  /**
   * Cleans up observers and resources
   */
  destroy(): void {
    this.observer?.disconnect();
    this.resizeObserver?.disconnect();
    this.measureCallbacks.clear();
  }

  /**
   * Sets the items to virtualize
   */
  setItems(items: T[]): void {
    this.items = items;
    this.calculateLayout();
  }

  /**
   * Updates a specific item
   */
  updateItem(index: number, item: T): void {
    if (index >= 0 && index < this.items.length) {
      this.items[index] = item;
      this.heights.delete(index);
      this.calculateLayout();
    }
  }

  /**
   * Sets measured height for an item
   */
  setMeasuredHeight(index: number, height: number): void {
    const currentHeight = this.heights.get(index);
    if (currentHeight !== height) {
      this.heights.set(index, height);
      this.recalculateOffsets(index);
    }
  }

  /**
   * Updates scroll position
   */
  setScrollTop(scrollTop: number): void {
    this.lastScrollTop = this.scrollTop;
    this.scrollTop = scrollTop;
    this.scrollVelocity = scrollTop - this.lastScrollTop;
    
    this.onScrollChange?.({
      scrollTop,
      scrollLeft: 0,
      direction: this.scrollVelocity > 0 ? 'down' : this.scrollVelocity < 0 ? 'up' : 'none',
      velocity: Math.abs(this.scrollVelocity),
    });
  }

  /**
   * Gets items that should be rendered (visible + buffer)
   */
  getVisibleItems(): VirtualItem<T>[] {
    if (!this.shouldVirtualize()) {
      return this.items.map((item, index) => ({
        item,
        index,
        offset: this.offsets[index] ?? 0,
        height: this.getItemHeight(index),
        isVisible: true,
        shouldRender: true,
      }));
    }

    const state = this.getViewportState();
    const result: VirtualItem<T>[] = [];

    for (let i = state.renderStartIndex; i <= state.renderEndIndex && i < this.items.length; i++) {
      const item = this.items[i];
      if (item) {
        result.push({
          item,
          index: i,
          offset: this.offsets[i] ?? 0,
          height: this.getItemHeight(i),
          isVisible: i >= state.startIndex && i <= state.endIndex,
          shouldRender: true,
        });
      }
    }

    return result;
  }

  /**
   * Gets current viewport state
   */
  getViewportState(): ViewportState {
    const startIndex = this.findStartIndex(this.scrollTop);
    const endIndex = this.findEndIndex(this.scrollTop + this.viewportHeight);
    
    const { bufferSize } = this.config;
    const renderStartIndex = Math.max(0, startIndex - bufferSize);
    const renderEndIndex = Math.min(this.items.length - 1, endIndex + bufferSize);

    return {
      scrollTop: this.scrollTop,
      viewportHeight: this.viewportHeight,
      totalHeight: this.totalHeight,
      startIndex,
      endIndex,
      renderStartIndex,
      renderEndIndex,
    };
  }

  /**
   * Gets total scrollable height
   */
  getTotalHeight(): number {
    return this.totalHeight;
  }

  /**
   * Checks if virtual scrolling is enabled
   */
  shouldVirtualize(): boolean {
    return this.items.length >= this.config.virtualThreshold;
  }

  /**
   * Scrolls to a specific item
   */
  scrollToItem(index: number, behavior: ScrollBehavior = 'auto'): void {
    if (!this.container || index < 0 || index >= this.items.length) return;

    const offset = this.offsets[index] ?? 0;
    
    this.container.scrollTo({
      top: offset,
      behavior: this.config.smoothScroll ? behavior : 'auto',
    });
  }

  /**
   * Scrolls to make an item visible (if not already)
   */
  scrollToItemIfNeeded(index: number): void {
    if (index < 0 || index >= this.items.length) return;

    const offset = this.offsets[index] ?? 0;
    const height = this.getItemHeight(index);
    const itemBottom = offset + height;

    const viewportTop = this.scrollTop;
    const viewportBottom = this.scrollTop + this.viewportHeight;

    if (offset < viewportTop) {
      this.scrollToItem(index, 'smooth');
    } else if (itemBottom > viewportBottom) {
      this.container?.scrollTo({
        top: itemBottom - this.viewportHeight,
        behavior: 'smooth',
      });
    }
  }

  /**
   * Registers callback for visibility changes
   */
  onVisibilityChanged(callback: (indices: number[]) => void): () => void {
    this.onVisibilityChange = callback;
    return () => { this.onVisibilityChange = undefined; };
  }

  /**
   * Registers callback for scroll changes
   */
  onScroll(callback: (event: ScrollEvent) => void): () => void {
    this.onScrollChange = callback;
    return () => { this.onScrollChange = undefined; };
  }

  /**
   * Creates a measurement callback for an item
   */
  createMeasureCallback(index: number, element: HTMLElement): () => void {
    const callback = () => {
      const height = element.offsetHeight;
      if (height > 0) {
        this.setMeasuredHeight(index, height);
      }
    };

    this.measureCallbacks.set(index, callback);
    
    // Measure on next frame
    requestAnimationFrame(callback);

    return () => {
      this.measureCallbacks.delete(index);
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private setupObservers(): void {
    if (typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        {
          root: this.container,
          rootMargin: `${this.config.overscanCount * this.config.estimatedItemHeight}px`,
          threshold: [0, 0.25, 0.5, 0.75, 1],
        }
      );
    }

    if (typeof ResizeObserver !== 'undefined' && this.container) {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === this.container) {
            this.measureViewport();
          }
        }
      });
      this.resizeObserver.observe(this.container);
    }
  }

  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    const changedIndices: number[] = [];

    for (const entry of entries) {
      const indexStr = (entry.target as HTMLElement).dataset['virtualIndex'];
      if (indexStr) {
        const index = parseInt(indexStr, 10);
        if (!isNaN(index)) {
          changedIndices.push(index);
          
          // Measure on visibility change
          const callback = this.measureCallbacks.get(index);
          if (callback && entry.isIntersecting) {
            callback();
          }
        }
      }
    }

    if (changedIndices.length > 0) {
      this.onVisibilityChange?.(changedIndices);
    }
  }

  private measureViewport(): void {
    if (!this.container) return;

    const rect = this.container.getBoundingClientRect();
    this.viewportHeight = rect.height;
  }

  private calculateLayout(): void {
    this.offsets = [];
    let offset = 0;

    for (let i = 0; i < this.items.length; i++) {
      this.offsets.push(offset);
      offset += this.getItemHeight(i);
    }

    this.totalHeight = offset;
  }

  private recalculateOffsets(fromIndex: number): void {
    if (fromIndex >= this.items.length) return;

    let offset = this.offsets[fromIndex] ?? 0;

    for (let i = fromIndex; i < this.items.length; i++) {
      this.offsets[i] = offset;
      offset += this.getItemHeight(i);
    }

    this.totalHeight = offset;
  }

  private getItemHeight(index: number): number {
    // Use measured height if available
    const measured = this.heights.get(index);
    if (measured !== undefined) {
      return measured;
    }

    // Estimate height
    const item = this.items[index];
    if (item) {
      return this.heightEstimator(item);
    }

    return this.config.estimatedItemHeight;
  }

  private findStartIndex(scrollTop: number): number {
    // Binary search for first visible item
    let low = 0;
    let high = this.items.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const offset = this.offsets[mid] ?? 0;
      const height = this.getItemHeight(mid);

      if (offset + height < scrollTop) {
        low = mid + 1;
      } else if (offset > scrollTop) {
        high = mid - 1;
      } else {
        return mid;
      }
    }

    return Math.max(0, low);
  }

  private findEndIndex(bottom: number): number {
    // Binary search for last visible item
    let low = 0;
    let high = this.items.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const offset = this.offsets[mid] ?? 0;

      if (offset < bottom) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return Math.min(this.items.length - 1, low);
  }

  private defaultHeightEstimator(item: T): number {
    // If it's a CardSection, use estimateSectionHeight
    if (this.isCardSection(item)) {
      return estimateSectionHeight(item);
    }
    return this.config.estimatedItemHeight;
  }

  private isCardSection(item: any): item is CardSection {
    return item && typeof item === 'object' && ('type' in item || 'title' in item || 'fields' in item);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a virtual scroll manager for card sections
 */
export function createVirtualScrollManager(
  container: HTMLElement | null,
  config?: VirtualScrollConfig
): VirtualScrollManager<CardSection> {
  return new VirtualScrollManager(container, config, estimateSectionHeight);
}

/**
 * Hook-like function for tracking scroll position
 */
export function createScrollTracker(
  container: HTMLElement,
  onScroll: (state: { scrollTop: number; scrollLeft: number }) => void
): () => void {
  const handler = () => {
    onScroll({
      scrollTop: container.scrollTop,
      scrollLeft: container.scrollLeft,
    });
  };

  container.addEventListener('scroll', handler, { passive: true });
  return () => container.removeEventListener('scroll', handler);
}

/**
 * Creates an IntersectionObserver for item visibility tracking
 */
export function createVisibilityObserver(
  container: HTMLElement | null,
  onVisibilityChange: (entries: IntersectionObserverEntry[]) => void,
  options?: {
    rootMargin?: string;
    threshold?: number | number[];
  }
): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') {
    return null;
  }

  return new IntersectionObserver(onVisibilityChange, {
    root: container,
    rootMargin: options?.rootMargin ?? '100px',
    threshold: options?.threshold ?? 0,
  });
}

/**
 * Applies virtual scroll transform to position an item
 */
export function applyVirtualPosition(
  element: HTMLElement,
  offset: number,
  height?: number
): void {
  element.style.transform = `translateY(${offset}px)`;
  element.style.position = 'absolute';
  element.style.top = '0';
  element.style.left = '0';
  element.style.right = '0';
  
  if (height !== undefined) {
    element.style.height = `${height}px`;
  }
}

/**
 * Creates a spacer element to maintain scroll height
 */
export function createScrollSpacer(totalHeight: number): HTMLDivElement {
  const spacer = document.createElement('div');
  spacer.style.height = `${totalHeight}px`;
  spacer.style.width = '1px';
  spacer.style.position = 'absolute';
  spacer.style.top = '0';
  spacer.style.left = '0';
  spacer.style.pointerEvents = 'none';
  spacer.style.visibility = 'hidden';
  return spacer;
}

