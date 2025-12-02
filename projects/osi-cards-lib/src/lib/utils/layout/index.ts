/**
 * Layout Utilities
 *
 * Consolidated layout utilities for OSI Cards grid system.
 * Includes algorithms, optimization, caching, and debugging.
 */

// Core layout utilities (kept separate - too large/complex to merge)
export * from '../grid-config.util';
export * from '../row-packer.util';
export * from '../gap-filler-optimizer.util';
export * from '../streaming-layout.util';
export * from '../smart-grid.util';

// Consolidated utilities
export * from './grid-logger.consolidated';

// Algorithm utilities
export * from '../algorithm-selector.util';
export * from '../skyline-algorithm.util';

// Optimization utilities
export * from '../column-span-optimizer.util';
export * from '../local-swap-optimizer.util';
export * from '../unified-layout-optimizer.util';
export * from '../layout-optimizer.util';
export * from '../layout-performance.util';
export * from '../incremental-layout.util';

// Caching utilities
export * from '../layout-cache.util';
export * from '../layout-memoization.util';
export * from '../lru-cache.util';

// Height estimation
export * from '../height-estimation.util';

// Backwards compatibility - consolidated logger
export { GridLogger } from './grid-logger.consolidated';

