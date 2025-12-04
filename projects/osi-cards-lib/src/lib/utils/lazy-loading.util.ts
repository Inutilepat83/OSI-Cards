/**
 * Lazy Loading Utilities
 * Provides utilities for lazy loading modules, components, and resources
 */

/**
 * Lazy load state
 */
export type LazyLoadState = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Lazy load result
 */
export interface LazyLoadResult<T> {
  state: LazyLoadState;
  value?: T;
  error?: Error;
}

/**
 * Lazy loader class
 */
export class LazyLoader<T> {
  private state: LazyLoadState = 'idle';
  private value: T | undefined;
  private error: Error | undefined;
  private promise: Promise<T> | null = null;
  private observers: Set<(result: LazyLoadResult<T>) => void> = new Set();

  constructor(private loader: () => Promise<T>) {}

  /**
   * Load the resource
   */
  public async load(): Promise<T> {
    // Return cached value if already loaded
    if (this.state === 'loaded' && this.value !== undefined) {
      return this.value;
    }

    // Return existing promise if loading
    if (this.promise) {
      return this.promise;
    }

    // Start loading
    this.setState('loading');

    this.promise = this.loader()
      .then((value) => {
        this.value = value;
        this.setState('loaded');
        return value;
      })
      .catch((error) => {
        this.error = error instanceof Error ? error : new Error(String(error));
        this.setState('error');
        throw this.error;
      })
      .finally(() => {
        this.promise = null;
      });

    return this.promise;
  }

  /**
   * Get current state
   */
  public getState(): LazyLoadState {
    return this.state;
  }

  /**
   * Get current result
   */
  public getResult(): LazyLoadResult<T> {
    return {
      state: this.state,
      value: this.value,
      error: this.error,
    };
  }

  /**
   * Subscribe to state changes
   */
  public subscribe(observer: (result: LazyLoadResult<T>) => void): () => void {
    this.observers.add(observer);

    // Immediately notify of current state
    observer(this.getResult());

    return () => this.observers.delete(observer);
  }

  /**
   * Reset loader
   */
  public reset(): void {
    this.state = 'idle';
    this.value = undefined;
    this.error = undefined;
    this.promise = null;
  }

  /**
   * Set state and notify observers
   */
  private setState(state: LazyLoadState): void {
    this.state = state;
    const result = this.getResult();
    this.observers.forEach((observer) => observer(result));
  }
}

/**
 * Lazy load cache for sharing loaded resources
 */
export class LazyLoadCache {
  private cache = new Map<string, LazyLoader<any>>();

  /**
   * Get or create lazy loader
   */
  public getOrCreate<T>(key: string, loader: () => Promise<T>): LazyLoader<T> {
    if (!this.cache.has(key)) {
      this.cache.set(key, new LazyLoader(loader));
    }
    return this.cache.get(key)!;
  }

  /**
   * Clear cache entry
   */
  public clear(key: string): void {
    const loader = this.cache.get(key);
    if (loader) {
      loader.reset();
      this.cache.delete(key);
    }
  }

  /**
   * Clear all cache
   */
  public clearAll(): void {
    this.cache.forEach((loader) => loader.reset());
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  public size(): number {
    return this.cache.size;
  }
}

/**
 * Global lazy load cache
 */
export const globalLazyLoadCache = new LazyLoadCache();

/**
 * Lazy load a module
 *
 * @param loader - Module loader function
 * @returns Lazy loader
 *
 * @example
 * ```typescript
 * const chartLoader = lazyLoadModule(() => import('chart.js'));
 *
 * // Later when needed
 * const Chart = await chartLoader.load();
 * ```
 */
export function lazyLoadModule<T>(loader: () => Promise<T>): LazyLoader<T> {
  return new LazyLoader(loader);
}

/**
 * Lazy load with cache
 *
 * @param key - Cache key
 * @param loader - Loader function
 * @returns Promise of loaded value
 *
 * @example
 * ```typescript
 * // Multiple calls share same load
 * const chart1 = await lazyLoadCached('chart.js', () => import('chart.js'));
 * const chart2 = await lazyLoadCached('chart.js', () => import('chart.js'));
 * // Only loads once
 * ```
 */
export async function lazyLoadCached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const lazyLoader = globalLazyLoadCache.getOrCreate(key, loader);
  return lazyLoader.load();
}

/**
 * Lazy load with retry
 *
 * @param loader - Loader function
 * @param maxAttempts - Maximum retry attempts
 * @param delay - Delay between retries
 * @returns Promise of loaded value
 *
 * @example
 * ```typescript
 * const module = await lazyLoadWithRetry(
 *   () => import('./module'),
 *   3,
 *   1000
 * );
 * ```
 */
export async function lazyLoadWithRetry<T>(
  loader: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await loader();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        console.warn(`Lazy load attempt ${attempt} failed, retrying...`, lastError);
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw new Error(`Lazy load failed after ${maxAttempts} attempts: ${lastError?.message}`);
}

/**
 * Prefetch a module
 *
 * @param loader - Module loader
 * @returns Promise that resolves when prefetch completes
 *
 * @example
 * ```typescript
 * // Prefetch during idle time
 * requestIdleCallback(() => {
 *   prefetchModule(() => import('chart.js'));
 * });
 * ```
 */
export async function prefetchModule<T>(loader: () => Promise<T>): Promise<void> {
  try {
    await loader();
  } catch (error) {
    console.warn('Prefetch failed:', error);
  }
}

/**
 * Lazy load during idle time
 *
 * @param loader - Module loader
 * @returns Lazy loader that loads during idle
 *
 * @example
 * ```typescript
 * const loader = lazyLoadIdle(() => import('heavy-module'));
 * // Module loads when browser is idle
 * ```
 */
export function lazyLoadIdle<T>(loader: () => Promise<T>): LazyLoader<T> {
  const lazyLoader = new LazyLoader(loader);

  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      lazyLoader.load().catch(() => {
        // Ignore prefetch errors
      });
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      lazyLoader.load().catch(() => {});
    }, 2000);
  }

  return lazyLoader;
}
