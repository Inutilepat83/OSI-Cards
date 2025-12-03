/**
 * Dynamic Import Utilities
 *
 * Utilities for managing dynamic imports, code splitting, and
 * lazy loading of modules with caching and error handling.
 *
 * Features:
 * - Cached dynamic imports
 * - Loading states
 * - Error handling
 * - Retry logic
 * - Preloading support
 *
 * @example
 * ```typescript
 * import { lazyLoad, preload } from '@osi-cards/utils';
 *
 * // Lazy load with caching
 * const ChartLib = await lazyLoad(() => import('chart.js'));
 *
 * // Preload for faster access later
 * preload(() => import('heavy-lib'));
 * ```
 */

/**
 * Loading state for dynamic imports
 */
export type LoadingState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; module: T }
  | { status: 'error'; error: Error };

/**
 * Dynamic import cache entry
 */
interface CacheEntry<T> {
  promise: Promise<T>;
  result?: T;
  error?: Error;
  timestamp: number;
}

/**
 * Dynamic Import Manager
 *
 * Manages dynamic imports with caching and state tracking.
 */
export class DynamicImportManager {
  private cache = new Map<string, CacheEntry<any>>();
  private stateMap = new Map<string, LoadingState<any>>();

  /**
   * Import module with caching
   *
   * @param key - Unique key for this import
   * @param importFn - Import function
   * @returns Promise with module
   *
   * @example
   * ```typescript
   * const manager = new DynamicImportManager();
   * const module = await manager.import(
   *   'chart-lib',
   *   () => import('chart.js')
   * );
   * ```
   */
  async import<T>(
    key: string,
    importFn: () => Promise<T>
  ): Promise<T> {
    // Check cache
    const cached = this.cache.get(key);
    if (cached) {
      if (cached.result) {
        return cached.result;
      }
      if (cached.error) {
        throw cached.error;
      }
      return cached.promise;
    }

    // Update state
    this.stateMap.set(key, { status: 'loading' });

    // Create new import
    const promise = importFn()
      .then(module => {
        this.cache.set(key, {
          promise,
          result: module,
          timestamp: Date.now(),
        });
        this.stateMap.set(key, { status: 'success', module });
        return module;
      })
      .catch(error => {
        this.cache.set(key, {
          promise,
          error,
          timestamp: Date.now(),
        });
        this.stateMap.set(key, { status: 'error', error });
        throw error;
      });

    this.cache.set(key, {
      promise,
      timestamp: Date.now(),
    });

    return promise;
  }

  /**
   * Get loading state for import
   *
   * @param key - Import key
   * @returns Current loading state
   */
  getState<T>(key: string): LoadingState<T> {
    return this.stateMap.get(key) || { status: 'idle' };
  }

  /**
   * Check if module is loaded
   *
   * @param key - Import key
   * @returns True if module is loaded
   */
  isLoaded(key: string): boolean {
    const cached = this.cache.get(key);
    return !!cached?.result;
  }

  /**
   * Preload module
   *
   * @param key - Import key
   * @param importFn - Import function
   */
  preload<T>(key: string, importFn: () => Promise<T>): void {
    if (!this.cache.has(key)) {
      this.import(key, importFn).catch(() => {
        // Ignore preload errors
      });
    }
  }

  /**
   * Clear cache
   *
   * @param key - Optional key to clear (clears all if not provided)
   */
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
      this.stateMap.delete(key);
    } else {
      this.cache.clear();
      this.stateMap.clear();
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * Global dynamic import manager
 */
const globalImportManager = new DynamicImportManager();

/**
 * Lazy load module with caching
 *
 * @param importFn - Import function
 * @returns Promise with module
 *
 * @example
 * ```typescript
 * const ChartJS = await lazyLoad(() => import('chart.js'));
 * ```
 */
export async function lazyLoad<T>(importFn: () => Promise<T>): Promise<T> {
  const key = importFn.toString();
  return globalImportManager.import(key, importFn);
}

/**
 * Preload module for faster access later
 *
 * @param importFn - Import function
 *
 * @example
 * ```typescript
 * // Preload on idle
 * preload(() => import('heavy-chart-lib'));
 *
 * // Use later (loads instantly from cache)
 * const lib = await lazyLoad(() => import('heavy-chart-lib'));
 * ```
 */
export function preload<T>(importFn: () => Promise<T>): void {
  const key = importFn.toString();
  globalImportManager.preload(key, importFn);
}

/**
 * Lazy load with retry
 *
 * @param importFn - Import function
 * @param retries - Number of retries
 * @returns Promise with module
 *
 * @example
 * ```typescript
 * const module = await lazyLoadWithRetry(
 *   () => import('./module'),
 *   3 // Retry 3 times
 * );
 * ```
 */
export async function lazyLoadWithRetry<T>(
  importFn: () => Promise<T>,
  retries = 3
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < retries; i++) {
    try {
      return await lazyLoad(importFn);
    } catch (error) {
      lastError = error as Error;

      if (i < retries - 1) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  throw lastError || new Error('Failed to load module');
}

/**
 * Preload multiple modules
 *
 * @param imports - Array of import functions
 *
 * @example
 * ```typescript
 * preloadAll([
 *   () => import('chart.js'),
 *   () => import('leaflet'),
 *   () => import('jspdf')
 * ]);
 * ```
 */
export function preloadAll(imports: Array<() => Promise<any>>): void {
  imports.forEach(importFn => preload(importFn));
}

/**
 * Lazy load component
 *
 * Helper for lazy loading Angular components.
 *
 * @param importFn - Import function returning component
 * @returns Promise with component
 *
 * @example
 * ```typescript
 * const HeavyComponent = await lazyLoadComponent(
 *   () => import('./heavy.component').then(m => m.HeavyComponent)
 * );
 * ```
 */
export async function lazyLoadComponent<T>(
  importFn: () => Promise<T>
): Promise<T> {
  return lazyLoad(importFn);
}

/**
 * Preload on idle
 *
 * Preloads module when browser is idle.
 *
 * @param importFn - Import function
 *
 * @example
 * ```typescript
 * preloadOnIdle(() => import('non-critical-module'));
 * ```
 */
export function preloadOnIdle(importFn: () => Promise<any>): void {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      preload(importFn);
    });
  } else {
    // Fallback to setTimeout
    setTimeout(() => {
      preload(importFn);
    }, 1);
  }
}

/**
 * Preload on interaction
 *
 * Preloads module when user interacts with element.
 *
 * @param element - Element to listen to
 * @param importFn - Import function
 * @param event - Event type (default: 'mouseenter')
 * @returns Cleanup function
 *
 * @example
 * ```typescript
 * const cleanup = preloadOnInteraction(
 *   buttonElement,
 *   () => import('./modal-dialog'),
 *   'mouseenter'
 * );
 * ```
 */
export function preloadOnInteraction(
  element: HTMLElement,
  importFn: () => Promise<any>,
  event: string = 'mouseenter'
): () => void {
  const handler = (): void => {
    preload(importFn);
    element.removeEventListener(event, handler);
  };

  element.addEventListener(event, handler, { once: true });

  return () => {
    element.removeEventListener(event, handler);
  };
}

/**
 * Dynamic import with timeout
 *
 * @param importFn - Import function
 * @param timeoutMs - Timeout in milliseconds
 * @returns Promise with module or timeout error
 *
 * @example
 * ```typescript
 * try {
 *   const module = await lazyLoadWithTimeout(
 *     () => import('./slow-module'),
 *     5000
 *   );
 * } catch (error) {
 *   console.error('Import timed out');
 * }
 * ```
 */
export async function lazyLoadWithTimeout<T>(
  importFn: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    lazyLoad(importFn),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Import timeout')), timeoutMs)
    ),
  ]);
}

