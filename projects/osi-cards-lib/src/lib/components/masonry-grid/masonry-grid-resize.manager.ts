/**
 * Masonry Grid Resize Manager
 *
 * Handles container and item resize observation with throttling and debouncing.
 * Extracted from masonry-grid.component.ts for better separation of concerns.
 */

export interface ResizeConfig {
  throttleMs?: number;
  debounceMs?: number;
  minColumnWidth: number;
}

export class MasonryGridResizeManager {
  private resizeObserver?: ResizeObserver;
  private itemObserver?: ResizeObserver;
  private resizeThrottleTimeout?: number;
  private resizeDebounceTimeout?: number;
  private pendingResizeWidth = 0;
  private lastValidContainerWidth = 0;

  private readonly throttleMs: number;
  private readonly debounceMs: number;
  private readonly minColumnWidth: number;

  constructor(
    private config: ResizeConfig,
    private onContainerResize: (width: number) => void,
    private onItemResize: () => void
  ) {
    this.throttleMs = config.throttleMs ?? 16; // ~1 frame at 60fps
    this.debounceMs = config.debounceMs ?? 100;
    this.minColumnWidth = config.minColumnWidth;
  }

  /**
   * Start observing container resizes
   */
  observeContainer(containerElement: HTMLElement): void {
    if (!containerElement || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.handleContainerResize(entry);
      }
    });

    this.resizeObserver.observe(containerElement);
  }

  /**
   * Start observing item resizes
   */
  observeItems(itemElements: HTMLElement[]): void {
    if (typeof ResizeObserver === 'undefined' || itemElements.length === 0) {
      return;
    }

    this.itemObserver = new ResizeObserver(() => {
      this.handleItemResize();
    });

    for (const element of itemElements) {
      if (element) {
        this.itemObserver.observe(element);
      }
    }
  }

  /**
   * Update observed items when they change
   */
  updateObservedItems(itemElements: HTMLElement[]): void {
    // Disconnect existing observer
    this.itemObserver?.disconnect();

    // Observe new items
    this.observeItems(itemElements);
  }

  /**
   * Handle container resize with throttling and debouncing
   */
  private handleContainerResize(entry: ResizeObserverEntry): void {
    const newWidth = entry.contentRect.width;

    if (!newWidth || newWidth < this.minColumnWidth) {
      return;
    }

    // Store for immediate access
    this.pendingResizeWidth = newWidth;
    this.lastValidContainerWidth = newWidth;

    // Throttle for immediate feedback (every frame)
    if (!this.resizeThrottleTimeout) {
      this.resizeThrottleTimeout = window.setTimeout(() => {
        this.resizeThrottleTimeout = undefined;
        this.onContainerResize(newWidth);
      }, this.throttleMs);
    }

    // Debounce for final layout (after resize stops)
    if (this.resizeDebounceTimeout) {
      clearTimeout(this.resizeDebounceTimeout);
    }

    this.resizeDebounceTimeout = window.setTimeout(() => {
      this.resizeDebounceTimeout = undefined;
      this.onContainerResize(newWidth);
    }, this.debounceMs);
  }

  /**
   * Handle item resize (content changed)
   */
  private handleItemResize(): void {
    // Clear any pending debounce
    if (this.resizeDebounceTimeout) {
      clearTimeout(this.resizeDebounceTimeout);
    }

    // Debounce the reflow to avoid excessive recalculations
    this.resizeDebounceTimeout = window.setTimeout(() => {
      this.resizeDebounceTimeout = undefined;
      this.onItemResize();
    }, this.debounceMs);
  }

  /**
   * Get the last valid container width
   */
  getLastValidWidth(): number {
    return this.lastValidContainerWidth;
  }

  /**
   * Get pending resize width (from ResizeObserver)
   */
  getPendingWidth(): number {
    return this.pendingResizeWidth;
  }

  /**
   * Get container width with fallback chain
   */
  getContainerWidth(
    containerElement: HTMLElement | undefined,
    explicitWidth?: number
  ): number {
    // Priority 1: Use explicitly provided width
    if (explicitWidth && explicitWidth > 0) {
      return explicitWidth;
    }

    // Priority 2: Use cached resize width
    if (this.pendingResizeWidth > 0) {
      return this.pendingResizeWidth;
    }

    // Priority 3: Use last valid width
    if (this.lastValidContainerWidth > 0) {
      return this.lastValidContainerWidth;
    }

    // Priority 4: Measure from DOM
    if (containerElement) {
      const rect = containerElement.getBoundingClientRect();
      let width = rect.width;

      if (width === 0) {
        width = containerElement.clientWidth;
      }

      // Try parent if still too small
      if (width < this.minColumnWidth) {
        const parent = containerElement.parentElement;
        if (parent) {
          const parentRect = parent.getBoundingClientRect();
          if (parentRect.width >= this.minColumnWidth) {
            width = parentRect.width;
          }
        }
      }

      // Cache if valid
      if (width >= this.minColumnWidth) {
        this.lastValidContainerWidth = width;
        return width;
      }
    }

    // Priority 5: Window fallback
    return this.getWindowFallbackWidth();
  }

  /**
   * Get fallback width based on window dimensions
   */
  private getWindowFallbackWidth(): number {
    if (typeof window === 'undefined') {
      return 375; // SSR fallback
    }
    return Math.max(window.innerWidth - 80, this.minColumnWidth);
  }

  /**
   * Cleanup - disconnect all observers and clear timeouts
   */
  destroy(): void {
    this.resizeObserver?.disconnect();
    this.itemObserver?.disconnect();

    if (this.resizeThrottleTimeout) {
      clearTimeout(this.resizeThrottleTimeout);
    }
    if (this.resizeDebounceTimeout) {
      clearTimeout(this.resizeDebounceTimeout);
    }

    this.resizeObserver = undefined;
    this.itemObserver = undefined;
  }
}

