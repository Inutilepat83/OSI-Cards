/**
 * Layout Memoization Utilities
 *
 * Provides caching and memoization for expensive layout calculations.
 * Helps reduce redundant computations during resize and re-render events.
 *
 * @module LayoutMemoization
 * @since 3.0.0
 */

// ============================================================================
// TYPES
// ============================================================================

export interface MemoizedFunction<T extends (...args: unknown[]) => unknown> {
  (...args: Parameters<T>): ReturnType<T>;
  /** Clear the cache */
  clear(): void;
  /** Get cache statistics */
  stats(): MemoStats;
}

export interface MemoStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

export interface MemoOptions {
  /** Maximum cache size (entries) */
  maxSize?: number;
  /** Cache TTL in milliseconds */
  ttl?: number;
  /** Custom key generator */
  keyGenerator?: (...args: unknown[]) => string;
}

// ============================================================================
// LRU CACHE
// ============================================================================

class LRUCache<K, V> {
  private cache = new Map<K, { value: V; timestamp: number }>();
  private readonly maxSize: number;
  private readonly ttl: number;

  constructor(maxSize = 100, ttl = 0) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check TTL
    if (this.ttl > 0 && Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recent)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  set(key: K, value: V): void {
    // Delete if exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, { value, timestamp: Date.now() });
  }

  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check TTL
    if (this.ttl > 0 && Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// ============================================================================
// MEMOIZATION
// ============================================================================

/**
 * Create a memoized version of a function
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options: MemoOptions = {}
): MemoizedFunction<T> {
  const { maxSize = 100, ttl = 0, keyGenerator } = options;
  const cache = new LRUCache<string, ReturnType<T>>(maxSize, ttl);

  let hits = 0;
  let misses = 0;

  const defaultKeyGenerator = (...args: unknown[]): string => {
    return JSON.stringify(args);
  };

  const getKey = keyGenerator || defaultKeyGenerator;

  const memoized = ((...args: Parameters<T>): ReturnType<T> => {
    const key = getKey(...args);

    if (cache.has(key)) {
      hits++;
      return cache.get(key)!;
    }

    misses++;
    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as MemoizedFunction<T>;

  memoized.clear = () => {
    cache.clear();
    hits = 0;
    misses = 0;
  };

  memoized.stats = () => ({
    hits,
    misses,
    size: cache.size,
    hitRate: hits + misses > 0 ? hits / (hits + misses) : 0,
  });

  return memoized;
}

// ============================================================================
// LAYOUT-SPECIFIC MEMOIZATION
// ============================================================================

/**
 * Key generator for layout calculations based on section configuration
 */
export function layoutKeyGenerator(
  sections: Array<{ key: string; colSpan: number }>,
  columns: number,
  containerWidth: number
): string {
  // Create a lightweight key based on section structure
  const sectionKey = sections
    .map(s => `${s.key}:${s.colSpan}`)
    .join('|');

  return `${columns}-${containerWidth}-${sectionKey}`;
}

/**
 * Key generator for height-based calculations
 */
export function heightKeyGenerator(
  sections: Array<{ key: string; height?: number }>,
  columns: number
): string {
  const heightKey = sections
    .map(s => `${s.key}:${s.height || 0}`)
    .join('|');

  return `${columns}-${heightKey}`;
}

// ============================================================================
// DEBOUNCED LAYOUT UPDATES
// ============================================================================

export interface DebouncedLayoutUpdate<T> {
  /** Schedule an update */
  schedule(value: T): void;
  /** Cancel pending update */
  cancel(): void;
  /** Execute immediately */
  flush(): void;
}

/**
 * Create a debounced layout update handler
 */
export function createDebouncedLayout<T>(
  callback: (value: T) => void,
  delay = 16 // ~1 frame
): DebouncedLayoutUpdate<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingValue: T | null = null;

  return {
    schedule(value: T) {
      pendingValue = value;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        if (pendingValue !== null) {
          callback(pendingValue);
          pendingValue = null;
        }
        timeoutId = null;
      }, delay);
    },

    cancel() {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      pendingValue = null;
    },

    flush() {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (pendingValue !== null) {
        callback(pendingValue);
        pendingValue = null;
      }
    },
  };
}

// ============================================================================
// RAF-BASED UPDATES
// ============================================================================

/**
 * Create a requestAnimationFrame-based update scheduler
 */
export function createRAFScheduler<T>(
  callback: (value: T) => void
): DebouncedLayoutUpdate<T> {
  let rafId: number | null = null;
  let pendingValue: T | null = null;

  return {
    schedule(value: T) {
      pendingValue = value;

      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          if (pendingValue !== null) {
            callback(pendingValue);
            pendingValue = null;
          }
          rafId = null;
        });
      }
    },

    cancel() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      pendingValue = null;
    },

    flush() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (pendingValue !== null) {
        callback(pendingValue);
        pendingValue = null;
      }
    },
  };
}

// ============================================================================
// BATCH UPDATES
// ============================================================================

export interface BatchedUpdates<T> {
  /** Add item to batch */
  add(item: T): void;
  /** Process all batched items */
  flush(): void;
  /** Get current batch size */
  size(): number;
}

/**
 * Create a batch processor for layout updates
 */
export function createBatchProcessor<T>(
  processor: (items: T[]) => void,
  batchSize = 10,
  delay = 100
): BatchedUpdates<T> {
  let batch: T[] = [];
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const process = () => {
    if (batch.length > 0) {
      processor([...batch]);
      batch = [];
    }
    timeoutId = null;
  };

  return {
    add(item: T) {
      batch.push(item);

      if (batch.length >= batchSize) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        process();
      } else if (!timeoutId) {
        timeoutId = setTimeout(process, delay);
      }
    },

    flush() {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      process();
    },

    size() {
      return batch.length;
    },
  };
}



