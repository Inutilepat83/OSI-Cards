/**
 * Object Pooling Utilities
 *
 * Reuses objects to reduce garbage collection pressure and improve performance.
 * Useful for frequently created/destroyed objects like DOM elements, event objects, etc.
 *
 * @example
 * ```typescript
 * const pool = createObjectPool(() => ({ x: 0, y: 0 }), 10);
 *
 * // Get object from pool
 * const point = pool.acquire();
 * point.x = 10;
 * point.y = 20;
 *
 * // Return to pool when done
 * pool.release(point);
 * ```
 */

/**
 * Object pool interface
 */
export interface ObjectPool<T> {
  /**
   * Acquire an object from the pool
   */
  acquire(): T;

  /**
   * Release an object back to the pool
   */
  release(obj: T): void;

  /**
   * Clear all objects from the pool
   */
  clear(): void;

  /**
   * Get current pool size
   */
  size(): number;
}

/**
 * Creates an object pool
 */
export function createObjectPool<T>(
  factory: () => T,
  maxSize = 50,
  reset?: (obj: T) => void
): ObjectPool<T> {
  const pool: T[] = [];

  return {
    acquire(): T {
      if (pool.length > 0) {
        return pool.pop()!;
      }
      return factory();
    },

    release(obj: T): void {
      if (pool.length < maxSize) {
        if (reset) {
          reset(obj);
        }
        pool.push(obj);
      }
    },

    clear(): void {
      pool.length = 0;
    },

    size(): number {
      return pool.length;
    },
  };
}

/**
 * Array pool for frequently created arrays
 */
export class ArrayPool {
  private pools = new Map<number, any[][]>();

  acquire<T>(size = 0): T[] {
    const pool = this.pools.get(size) || [];
    if (pool.length > 0) {
      return pool.pop()!;
    }
    return new Array(size) as T[];
  }

  release<T>(arr: T[]): void {
    const size = arr.length;
    arr.length = 0; // Clear array

    if (!this.pools.has(size)) {
      this.pools.set(size, []);
    }
    this.pools.get(size)!.push(arr);
  }

  clear(): void {
    this.pools.clear();
  }
}

/**
 * Global array pool instance
 */
export const arrayPool = new ArrayPool();
