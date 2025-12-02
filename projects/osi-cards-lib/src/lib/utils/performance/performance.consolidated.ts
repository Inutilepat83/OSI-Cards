/**
 * Consolidated Performance Utilities
 *
 * Merges functionality from:
 * - performance.util.ts (debounce, throttle, memoize, RAF utilities)
 * - performance-monitor.util.ts (performance tracking and monitoring)
 * - frame-budget.util.ts (frame budget management for 60fps)
 *
 * Provides comprehensive performance optimization utilities.
 *
 * @example
 * ```typescript
 * import { PerformanceUtil } from 'osi-cards-lib';
 *
 * // Debouncing and throttling
 * const debounced = PerformanceUtil.debounce(() => calculate(), 150);
 * const throttled = PerformanceUtil.throttle(() => update(), 16);
 *
 * // Performance monitoring
 * PerformanceUtil.monitor.start('layout-calculation');
 * doExpensiveWork();
 * PerformanceUtil.monitor.end('layout-calculation');
 *
 * // Frame budget management
 * PerformanceUtil.frameBudget.schedule(() => {
 *   expensiveLayout();
 * }, { priority: 'high' });
 * ```
 */

// Re-export all utilities from their original files
export * from '../performance.util';
export * from '../performance-monitor.util';
export * from '../frame-budget.util';

// Create a consolidated namespace for easier access
import { debounce, throttle, memoize, raf } from '../performance.util';
import { PerformanceMonitor } from '../performance-monitor.util';
import { FrameBudgetManager } from '../frame-budget.util';

export const PerformanceUtil = {
  // Core utilities
  debounce,
  throttle,
  memoize,
  raf,

  // Performance monitoring
  monitor: PerformanceMonitor.getInstance(),

  // Frame budget management
  createFrameBudget: (config?: any) => new FrameBudgetManager(config)
};

