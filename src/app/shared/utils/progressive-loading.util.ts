/**
 * Progressive loading utilities
 * Load cards progressively as user scrolls instead of all at once
 */

export interface ProgressiveLoadOptions {
  batchSize: number;
  loadDelay?: number;
  threshold?: number; // Distance from bottom to trigger load
}

/**
 * Progressive loader class
 */
export class ProgressiveLoader<T> {
  private allItems: T[] = [];
  private loadedItems: T[] = [];
  private currentIndex = 0;
  private isLoading = false;

  constructor(private readonly options: ProgressiveLoadOptions) {}

  /**
   * Initialize with items
   */
  initialize(items: T[]): void {
    this.allItems = items;
    this.loadedItems = [];
    this.currentIndex = 0;
    this.loadInitialBatch();
  }

  /**
   * Load initial batch
   */
  private loadInitialBatch(): void {
    const batch = this.allItems.slice(0, this.options.batchSize);
    this.loadedItems = batch;
    this.currentIndex = batch.length;
  }

  /**
   * Load next batch
   */
  async loadNextBatch(): Promise<T[]> {
    if (this.isLoading || this.isComplete()) {
      return [];
    }

    this.isLoading = true;

    if (this.options.loadDelay) {
      await new Promise((resolve) => setTimeout(resolve, this.options.loadDelay));
    }

    const nextBatch = this.allItems.slice(
      this.currentIndex,
      this.currentIndex + this.options.batchSize
    );

    this.loadedItems.push(...nextBatch);
    this.currentIndex += nextBatch.length;
    this.isLoading = false;

    return nextBatch;
  }

  /**
   * Check if loading is complete
   */
  isComplete(): boolean {
    return this.currentIndex >= this.allItems.length;
  }

  /**
   * Get currently loaded items
   */
  getLoadedItems(): T[] {
    return [...this.loadedItems];
  }

  /**
   * Get loading progress (0-1)
   */
  getProgress(): number {
    if (this.allItems.length === 0) {
      return 1;
    }
    return this.currentIndex / this.allItems.length;
  }

  /**
   * Check if should load more based on scroll position
   */
  shouldLoadMore(scrollTop: number, containerHeight: number, scrollHeight: number): boolean {
    const threshold = this.options.threshold || 200;
    const distanceFromBottom = scrollHeight - (scrollTop + containerHeight);
    return distanceFromBottom < threshold && !this.isComplete() && !this.isLoading;
  }
}
