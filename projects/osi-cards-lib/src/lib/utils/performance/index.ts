/**
 * Performance Utilities
 *
 * Consolidated performance utilities for OSI Cards.
 * Includes optimization, monitoring, and memory management.
 */

// Quick access namespaces (export first to avoid conflicts)
export { PerformanceUtil } from './performance.consolidated';
export { MemoryUtil, CleanupRegistry } from './memory.consolidated';

// Consolidated utilities (recommended) - selective exports to avoid duplicates
export type { Memoized } from './memory.consolidated';
export type { MemoOptions, MemoTTLOptions, CacheStats } from './memory.consolidated';

// Individual utilities (backwards compatibility) - only non-conflicting exports
export { debounce, throttle, raf, whenIdle } from '../performance.util';
export { PerformanceMonitor } from '../performance-monitor.util';
export { FrameBudgetManager } from '../frame-budget.util';

