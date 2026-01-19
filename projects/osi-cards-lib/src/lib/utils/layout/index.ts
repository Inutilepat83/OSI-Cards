/**
 * Layout Utilities
 *
 * Consolidated layout utilities for OSI Cards grid system.
 * Includes algorithms, optimization, caching, and debugging.
 */

// Core layout utilities (kept separate - too large/complex to merge)
export * from '@osi-cards/utils';
export * from '@osi-cards/utils';
export * from '@osi-cards/utils';
export * from '@osi-cards/utils';
export * from '@osi-cards/utils';

// Consolidated utilities
export * from './grid-logger.consolidated';

// Algorithm utilities
export * from '@osi-cards/utils';
export * from '@osi-cards/utils';

// Optimization utilities
export * from '@osi-cards/utils';
export * from '@osi-cards/utils';
export * from '@osi-cards/utils';
export * from '@osi-cards/utils';
export * from '@osi-cards/utils';
export * from '@osi-cards/utils';

// Caching utilities
export { LayoutCache, type LayoutCacheEntry, type LayoutCacheKey } from '@osi-cards/utils';
export * from '@osi-cards/utils';
export { LRUCache, type LRUCacheOptions } from '@osi-cards/utils';

// Height estimation
export * from '@osi-cards/utils';

// Backwards compatibility - consolidated logger
export { GridLogger } from './grid-logger.consolidated';
