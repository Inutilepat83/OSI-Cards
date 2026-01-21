/**
 * Object Pool Utility
 *
 * Implements object pooling pattern to reduce garbage collection pressure
 * by reusing objects instead of creating new ones.
 *
 * Benefits:
 * - Reduces memory allocation
 * - Decreases GC pressure
 * - Improves performance for frequently created objects
 * - Prevents memory spikes
 *
 * @example
 * ```typescript
 * import { ObjectPool } from './';
 *
 * interface Point { x: number; y: number; }
 *
 * const pointPool = new ObjectPool<Point>(
 *   () => ({ x: 0, y: 0 }),
 *   (point) => { point.x = 0; point.y = 0; }
 * );
 *
 * // Acquire object from pool
 * const point = pointPool.acquire();
 * point.x = 10;
 * point.y = 20;
 *
 * // Return to pool when done
 * pointPool.release(point);
 * ```
 */

/**
 * Object Pool Configuration
 */
export interface ObjectPoolConfig<T> {
  /**
   * Factory function to create new objects
   */
  factory: () => T;

  /**
   * Reset function to clean object before reuse
   * Optional - if not provided, objects are reused as-is
   */
  reset?: (obj: T) => void;

  /**
   * Initial pool size
   * Default: 0 (lazy initialization)
   */
  initialSize?: number;

  /**
   * Maximum pool size (0 = unlimited)
   * Default: 100
   */
  maxSize?: number;

  /**
   * Maximum age of pooled objects in milliseconds
   * Objects older than this are discarded instead of reused
   * Default: 0 (no expiration)
   */
  maxAge?: number;

  /**
   * Whether to validate objects before reuse
   * Default: false
   */
  validate?: (obj: T) => boolean;
}

/**
 * Pooled object wrapper with metadata
 */
interface PooledObject<T> {
  /**
   * The actual object
   */
  object: T;

  /**
   * When this object was created
   */
  createdAt: number;

  /**
   * When this object was last used
   */
  lastUsedAt: number;

  /**
   * Number of times this object has been acquired
   */
  useCount: number;
}

/**
 * Object Pool
 *
 * Manages a pool of reusable objects to reduce allocation overhead.
 * Thread-safe and supports automatic cleanup of stale objects.
 */
export class ObjectPool<T> {
  private pool: PooledObject<T>[] = [];
  private acquired = new Set<T>();
  private factory: () => T;
  private reset?: (obj: T) => void;
  private maxSize: number;
  private maxAge: number;
  private validate?: (obj: T) => boolean;

  // Statistics
  private stats = {
    created: 0,
    acquired: 0,
    released: 0,
    reused: 0,
    discarded: 0,
    hits: 0,
    misses: 0,
  };

  /**
   * Create a new object pool
   *
   * @param config - Pool configuration
   */
  constructor(config: ObjectPoolConfig<T>) {
    this.factory = config.factory;
    this.reset = config.reset;
    this.maxSize = config.maxSize ?? 100;
    this.maxAge = config.maxAge ?? 0;
    this.validate = config.validate;

    // Pre-populate pool if initial size specified
    const initialSize = config.initialSize ?? 0;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createPooledObject());
    }
  }

  /**
   * Acquire an object from the pool
   *
   * If pool is empty, creates a new object.
   *
   * @returns Object from pool or newly created
   *
   * @example
   * ```typescript
   * const obj = pool.acquire();
   * // Use obj...
   * pool.release(obj);
   * ```
   */
  acquire(): T {
    this.stats.acquired++;

    // Try to get from pool
    while (this.pool.length > 0) {
      const pooled = this.pool.pop()!;

      // Check if object is still valid
      if (this.isValid(pooled)) {
        // Reset object if reset function provided
        if (this.reset) {
          this.reset(pooled.object);
        }

        pooled.lastUsedAt = Date.now();
        pooled.useCount++;
        this.acquired.add(pooled.object);

        this.stats.hits++;
        this.stats.reused++;

        return pooled.object;
      } else {
        // Object is stale, discard it
        this.stats.discarded++;
      }
    }

    // Pool empty, create new object
    this.stats.misses++;
    const pooled = this.createPooledObject();
    this.acquired.add(pooled.object);

    return pooled.object;
  }

  /**
   * Release an object back to the pool
   *
   * The object will be available for reuse. If pool is at max size,
   * the object is discarded.
   *
   * @param obj - Object to release
   * @returns True if object was returned to pool
   *
   * @example
   * ```typescript
   * const obj = pool.acquire();
   * // ... use obj ...
   * pool.release(obj);
   * ```
   */
  release(obj: T): boolean {
    if (!this.acquired.has(obj)) {
      console.warn('Attempting to release object not acquired from this pool');
      return false;
    }

    this.acquired.delete(obj);
    this.stats.released++;

    // Check if pool is at max size
    if (this.maxSize > 0 && this.pool.length >= this.maxSize) {
      this.stats.discarded++;
      return false;
    }

    // Validate object before returning to pool
    if (this.validate && !this.validate(obj)) {
      this.stats.discarded++;
      return false;
    }

    // Find or create pooled wrapper
    const pooled: PooledObject<T> = {
      object: obj,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      useCount: 0,
    };

    this.pool.push(pooled);
    return true;
  }

  /**
   * Clear the pool
   *
   * Removes all objects from pool. Does not affect acquired objects.
   */
  clear(): void {
    this.pool = [];
  }

  /**
   * Drain the pool
   *
   * Removes all objects from pool and resets statistics.
   */
  drain(): void {
    this.pool = [];
    this.acquired.clear();
    this.resetStats();
  }

  /**
   * Get pool size
   *
   * @returns Number of objects currently in pool
   */
  size(): number {
    return this.pool.length;
  }

  /**
   * Get number of acquired objects
   *
   * @returns Number of objects currently acquired
   */
  acquiredCount(): number {
    return this.acquired.size;
  }

  /**
   * Get pool statistics
   *
   * @returns Statistics object with usage metrics
   */
  getStats() {
    return {
      ...this.stats,
      poolSize: this.pool.length,
      acquiredCount: this.acquired.size,
      hitRate: this.stats.acquired > 0 ? this.stats.hits / this.stats.acquired : 0,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      created: 0,
      acquired: 0,
      released: 0,
      reused: 0,
      discarded: 0,
      hits: 0,
      misses: 0,
    };
  }

  /**
   * Cleanup stale objects
   *
   * Removes objects older than maxAge from pool.
   *
   * @returns Number of objects removed
   */
  cleanup(): number {
    if (this.maxAge === 0) {
      return 0;
    }

    const now = Date.now();
    const originalSize = this.pool.length;

    this.pool = this.pool.filter((pooled) => {
      const age = now - pooled.createdAt;
      return age < this.maxAge;
    });

    const removed = originalSize - this.pool.length;
    this.stats.discarded += removed;

    return removed;
  }

  /**
   * Create a new pooled object
   */
  private createPooledObject(): PooledObject<T> {
    this.stats.created++;

    return {
      object: this.factory(),
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      useCount: 0,
    };
  }

  /**
   * Check if pooled object is still valid
   */
  private isValid(pooled: PooledObject<T>): boolean {
    // Check age if maxAge is set
    if (this.maxAge > 0) {
      const age = Date.now() - pooled.createdAt;
      if (age > this.maxAge) {
        return false;
      }
    }

    // Check validation function if provided
    if (this.validate) {
      return this.validate(pooled.object);
    }

    return true;
  }
}

/**
 * Create an object pool with simplified syntax
 *
 * @param factory - Function to create new objects
 * @param reset - Optional reset function
 * @param options - Additional pool options
 * @returns New ObjectPool instance
 *
 * @example
 * ```typescript
 * const pool = createPool(
 *   () => ({ x: 0, y: 0 }),
 *   (point) => { point.x = 0; point.y = 0; }
 * );
 * ```
 */
export function createPool<T>(
  factory: () => T,
  reset?: (obj: T) => void,
  options: Partial<ObjectPoolConfig<T>> = {}
): ObjectPool<T> {
  return new ObjectPool({
    factory,
    reset,
    ...options,
  });
}

/**
 * Pooled resource manager with automatic release
 *
 * Provides RAII-style resource management for pooled objects.
 *
 * @example
 * ```typescript
 * await using(pool, obj => {
 *   // Use obj here
 *   obj.x = 10;
 * });
 * // obj is automatically released
 * ```
 */
export async function using<T, R>(
  pool: ObjectPool<T>,
  callback: (obj: T) => R | Promise<R>
): Promise<R> {
  const obj = pool.acquire();
  try {
    return await callback(obj);
  } finally {
    pool.release(obj);
  }
}

/**
 * Synchronous version of using
 *
 * @example
 * ```typescript
 * const result = withPooled(pool, obj => {
 *   return obj.x + obj.y;
 * });
 * ```
 */
export function withPooled<T, R>(pool: ObjectPool<T>, callback: (obj: T) => R): R {
  const obj = pool.acquire();
  try {
    return callback(obj);
  } finally {
    pool.release(obj);
  }
}
