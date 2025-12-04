/**
 * Progressive Loading Utilities
 *
 * Implements progressive/chunked data loading patterns for better
 * perceived performance and user experience with large datasets.
 *
 * Features:
 * - Chunked data loading
 * - Priority-based loading
 * - Incremental rendering
 * - Load on demand
 * - Progress tracking
 *
 * @example
 * ```typescript
 * import { ProgressiveLoader } from '@osi-cards/utils';
 *
 * const loader = new ProgressiveLoader({
 *   chunkSize: 50,
 *   loadDelay: 100
 * });
 *
 * await loader.loadInChunks(items, (chunk) => {
 *   renderItems(chunk);
 * });
 * ```
 */

import { Observable, Subject } from 'rxjs';

/**
 * Progressive loading configuration
 */
export interface ProgressiveLoadConfig {
  /**
   * Number of items per chunk
   * Default: 50
   */
  chunkSize?: number;

  /**
   * Delay between chunks in milliseconds
   * Default: 0
   */
  loadDelay?: number;

  /**
   * Priority loading (load high priority first)
   * Default: false
   */
  usePriority?: boolean;

  /**
   * Maximum concurrent chunks
   * Default: 1 (sequential)
   */
  concurrency?: number;
}

/**
 * Progress event
 */
export interface LoadProgress<T> {
  /**
   * Current chunk data
   */
  chunk: T[];

  /**
   * Chunk index
   */
  chunkIndex: number;

  /**
   * Total chunks
   */
  totalChunks: number;

  /**
   * Items loaded so far
   */
  loadedCount: number;

  /**
   * Total items
   */
  totalCount: number;

  /**
   * Progress percentage (0-100)
   */
  progress: number;

  /**
   * Whether this is the last chunk
   */
  isLast: boolean;
}

/**
 * Progressive Loader
 *
 * Manages progressive loading of large datasets.
 */
export class ProgressiveLoader<T = any> {
  private config: Required<ProgressiveLoadConfig>;
  private progressSubject = new Subject<LoadProgress<T>>();

  /**
   * Observable of load progress
   */
  readonly progress$ = this.progressSubject.asObservable();

  constructor(config: ProgressiveLoadConfig = {}) {
    this.config = {
      chunkSize: config.chunkSize ?? 50,
      loadDelay: config.loadDelay ?? 0,
      usePriority: config.usePriority ?? false,
      concurrency: config.concurrency ?? 1,
    };
  }

  /**
   * Load items in chunks
   *
   * @param items - Items to load
   * @param processor - Function to process each chunk
   * @returns Promise that resolves when all chunks are loaded
   *
   * @example
   * ```typescript
   * await loader.loadInChunks(users, (chunk) => {
   *   displayUsers(chunk);
   * });
   * ```
   */
  async loadInChunks(
    items: T[],
    processor: (chunk: T[], progress: LoadProgress<T>) => void | Promise<void>
  ): Promise<void> {
    const chunks = this.createChunks(items);
    const totalChunks = chunks.length;
    let loadedCount = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      loadedCount += chunk.length;

      const progress: LoadProgress<T> = {
        chunk,
        chunkIndex: i,
        totalChunks,
        loadedCount,
        totalCount: items.length,
        progress: (loadedCount / items.length) * 100,
        isLast: i === chunks.length - 1,
      };

      // Process chunk
      await processor(chunk, progress);

      // Emit progress
      this.progressSubject.next(progress);

      // Delay before next chunk
      if (!progress.isLast && this.config.loadDelay > 0) {
        await this.sleep(this.config.loadDelay);
      }
    }

    this.progressSubject.complete();
  }

  /**
   * Load items progressively with priority
   *
   * @param items - Items with priority
   * @param priorityFn - Function to get item priority
   * @param processor - Chunk processor
   */
  async loadByPriority(
    items: T[],
    priorityFn: (item: T) => number,
    processor: (chunk: T[], progress: LoadProgress<T>) => void | Promise<void>
  ): Promise<void> {
    // Sort by priority (higher first)
    const sorted = [...items].sort((a, b) => priorityFn(b) - priorityFn(a));
    return this.loadInChunks(sorted, processor);
  }

  /**
   * Load visible items first, then rest
   *
   * @param items - All items
   * @param isVisible - Function to check if item is visible
   * @param processor - Chunk processor
   */
  async loadVisibleFirst(
    items: T[],
    isVisible: (item: T) => boolean,
    processor: (chunk: T[], progress: LoadProgress<T>) => void | Promise<void>
  ): Promise<void> {
    const visible = items.filter(isVisible);
    const hidden = items.filter((item) => !isVisible(item));

    // Load visible first
    await this.loadInChunks(visible, processor);

    // Then load hidden
    if (hidden.length > 0) {
      await this.loadInChunks(hidden, processor);
    }
  }

  /**
   * Create chunks from items
   */
  private createChunks(items: T[]): T[][] {
    const chunks: T[][] = [];
    const { chunkSize } = this.config;

    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }

    return chunks;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create progressive loader
 *
 * @param config - Loader configuration
 * @returns New ProgressiveLoader instance
 */
export function createProgressiveLoader<T>(config?: ProgressiveLoadConfig): ProgressiveLoader<T> {
  return new ProgressiveLoader<T>(config);
}

/**
 * Load items progressively (simple API)
 *
 * @param items - Items to load
 * @param processor - Processor function
 * @param options - Load options
 *
 * @example
 * ```typescript
 * await loadProgressively(
 *   largeArray,
 *   (items) => renderItems(items),
 *   { chunkSize: 100, delay: 50 }
 * );
 * ```
 */
export async function loadProgressively<T>(
  items: T[],
  processor: (chunk: T[]) => void | Promise<void>,
  options: {
    chunkSize?: number;
    delay?: number;
  } = {}
): Promise<void> {
  const { chunkSize = 50, delay = 0 } = options;

  const loader = new ProgressiveLoader<T>({
    chunkSize,
    loadDelay: delay,
  });

  await loader.loadInChunks(items, async (chunk) => {
    await processor(chunk);
  });
}

/**
 * Incremental renderer
 *
 * Renders items incrementally to avoid blocking the UI.
 */
export class IncrementalRenderer<T> {
  private items: T[] = [];
  private renderedCount = 0;
  private isRendering = false;
  private rafId: number | null = null;

  constructor(
    private renderer: (item: T, index: number) => void,
    private options: {
      itemsPerFrame?: number;
      onProgress?: (count: number, total: number) => void;
      onComplete?: () => void;
    } = {}
  ) {}

  /**
   * Start rendering items
   *
   * @param items - Items to render
   *
   * @example
   * ```typescript
   * const renderer = new IncrementalRenderer(
   *   (item) => container.appendChild(createCard(item)),
   *   { itemsPerFrame: 10 }
   * );
   *
   * renderer.render(items);
   * ```
   */
  render(items: T[]): void {
    this.items = items;
    this.renderedCount = 0;
    this.isRendering = true;
    this.renderNext();
  }

  /**
   * Stop rendering
   */
  stop(): void {
    this.isRendering = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Resume rendering
   */
  resume(): void {
    if (!this.isRendering && this.renderedCount < this.items.length) {
      this.isRendering = true;
      this.renderNext();
    }
  }

  /**
   * Check if rendering is complete
   */
  isComplete(): boolean {
    return this.renderedCount >= this.items.length;
  }

  /**
   * Render next batch
   */
  private renderNext = (): void => {
    if (!this.isRendering || this.renderedCount >= this.items.length) {
      if (this.options.onComplete) {
        this.options.onComplete();
      }
      return;
    }

    const itemsPerFrame = this.options.itemsPerFrame ?? 10;
    const endIndex = Math.min(this.renderedCount + itemsPerFrame, this.items.length);

    // Render batch
    for (let i = this.renderedCount; i < endIndex; i++) {
      this.renderer(this.items[i], i);
    }

    this.renderedCount = endIndex;

    // Report progress
    if (this.options.onProgress) {
      this.options.onProgress(this.renderedCount, this.items.length);
    }

    // Schedule next batch
    if (this.renderedCount < this.items.length) {
      this.rafId = requestAnimationFrame(this.renderNext);
    } else if (this.options.onComplete) {
      this.options.onComplete();
    }
  };
}

/**
 * Render items incrementally
 *
 * @param items - Items to render
 * @param renderer - Renderer function
 * @param options - Rendering options
 * @returns Promise that resolves when complete
 *
 * @example
 * ```typescript
 * await renderIncrementally(
 *   items,
 *   (item) => container.appendChild(createCard(item)),
 *   { itemsPerFrame: 10 }
 * );
 * ```
 */
export async function renderIncrementally<T>(
  items: T[],
  renderer: (item: T, index: number) => void,
  options: {
    itemsPerFrame?: number;
    onProgress?: (count: number, total: number) => void;
  } = {}
): Promise<void> {
  return new Promise((resolve) => {
    const incrementalRenderer = new IncrementalRenderer(renderer, {
      ...options,
      onComplete: resolve,
    });

    incrementalRenderer.render(items);
  });
}

/**
 * Lazy load on scroll
 *
 * Loads more items when user scrolls near bottom.
 *
 * @param scrollElement - Scroll container
 * @param loadMore - Function to load more items
 * @param options - Loading options
 * @returns Cleanup function
 *
 * @example
 * ```typescript
 * const cleanup = lazyLoadOnScroll(
 *   container,
 *   async () => {
 *     const more = await fetchMore();
 *     appendItems(more);
 *   },
 *   { threshold: 200 }
 * );
 * ```
 */
export function lazyLoadOnScroll(
  scrollElement: HTMLElement,
  loadMore: () => void | Promise<void>,
  options: {
    threshold?: number;
    debounce?: number;
  } = {}
): () => void {
  const { threshold = 200, debounce = 100 } = options;
  let isLoading = false;
  let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

  const handleScroll = (): void => {
    if (isLoading) return;

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    debounceTimeout = setTimeout(() => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

      if (distanceFromBottom < threshold) {
        isLoading = true;

        Promise.resolve(loadMore()).finally(() => {
          isLoading = false;
        });
      }
    }, debounce);
  };

  scrollElement.addEventListener('scroll', handleScroll, { passive: true });

  return () => {
    scrollElement.removeEventListener('scroll', handleScroll);
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
  };
}
