/**
 * Consolidated Memory Utilities
 *
 * Merges functionality from:
 * - memory.util.ts (memory management, cleanup, pooling)
 * - memo.util.ts (memoization decorators and utilities)
 *
 * Provides comprehensive memory management and memoization utilities.
 *
 * @example
 * ```typescript
 * import { MemoryUtil } from 'osi-cards-lib';
 *
 * // Object pooling
 * const pool = MemoryUtil.createPool(() => ({ x: 0, y: 0 }));
 * const obj = pool.acquire();
 * pool.release(obj);
 *
 * // Memoization
 * const memoized = MemoryUtil.memoize(expensiveFunction);
 *
 * // Memory cleanup
 * MemoryUtil.registerCleanup(() => {
 *   // Cleanup code
 * });
 * ```
 */

// Re-export memory management utilities
export * from '../memory.util';

// Re-export memoization utilities
export {
  memo as memoize,
  memo,
  memoWithTTL,
  memoWeakMap,
  MemoizedGetter,
  memoWithEquality,
  once,
  type MemoOptions,
  type MemoTTLOptions,
  type CacheStats
} from '../memo.util';

// Import from actual source files
import { memoize as performanceMemoize, createObjectPool } from '../performance.util';
import { CleanupRegistry as CleanupRegistryClass } from '../memory.util';

// Types
export type Memoized<T> = T;

export const MemoryUtil = {
  // Object pooling
  createPool: createObjectPool,

  // Memoization
  memoize: performanceMemoize,
};

// Re-export CleanupRegistry with getInstance method
export class CleanupRegistry extends CleanupRegistryClass {
  private static instance: CleanupRegistry | null = null;

  static getInstance(): CleanupRegistry {
    if (!CleanupRegistry.instance) {
      CleanupRegistry.instance = new CleanupRegistry();
    }
    return CleanupRegistry.instance;
  }
}

