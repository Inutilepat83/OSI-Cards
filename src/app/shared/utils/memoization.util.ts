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
  LRUCache,
  MemoizationUtil,
  Memoize,
  MemoizeAsync,
  MemoizeCache,
  clearMemoizeCache,
  defaultKeyGenerator,
  memo,
  memoWeakMap,
  memoWithEquality,
  memoWithTTL,
  memoize,
  memoizeAsync,
  memoizeWeak,
  once,
  primitiveKeyGenerator,
  type LRUCacheOptions,
  type MemoizeDecoratorOptions,
  type MemoizedGetter,
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
