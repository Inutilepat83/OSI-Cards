/**
 * Memoization Utilities - App Re-export
 *
 * This file re-exports memoization utilities from the library.
 * The library contains the consolidated memoization implementation.
 *
 * @deprecated Import directly from '@osi-cards/utils' instead
 */

// Re-export ONLY memoization-related exports to avoid conflicts
export {
  memoize,
  memoizeAsync,
  memoizeWeak,
  Memoize,
  MemoizeAsync,
  MemoizeCache,
  defaultKeyGenerator,
  primitiveKeyGenerator,
  clearMemoizeCache,
  MemoizationUtil,
  memo,
  memoWithTTL,
  memoWeakMap,
  memoWithEquality,
  once,
  LRUCache,
  type MemoizeDecoratorOptions,
  type MemoizedGetter,
  type LRUCacheOptions,
} from '@osi-cards/utils';

// Additional types (these are in memo.util but not re-exported through utils/index)
// For now, just define them locally to avoid import errors
export interface MemoOptions {
  maxSize?: number;
  ttl?: number;
  keyResolver?: (...args: unknown[]) => string;
  trackStats?: boolean;
}
export type MemoTTLOptions = MemoOptions & { ttl: number; slidingExpiration?: boolean };
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}
