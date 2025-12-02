/**
 * Consolidated Grid Logger Utilities
 *
 * Merges functionality from:
 * - grid-logger.util.ts (basic grid logging)
 * - smart-grid-logger.util.ts (advanced logging with metrics)
 * - layout-debug.util.ts (layout debugging utilities)
 *
 * Provides comprehensive grid layout logging and debugging.
 *
 * @example
 * ```typescript
 * import { GridLogger } from 'osi-cards-lib';
 *
 * // Enable logging
 * GridLogger.enable('debug');
 *
 * // Log placement
 * GridLogger.logPlacement(section, position, metrics);
 *
 * // Get statistics
 * const stats = GridLogger.getStats();
 * ```
 */

// Re-export all grid logging utilities
export * from '../grid-logger.util';
export * from '../smart-grid-logger.util';
export * from '../layout-debug.util';

// Create consolidated namespace for easier access
import { gridLogger, enableGridDebug } from '../smart-grid.util';

export const GridLogger = {
  // Main logger instance
  logger: gridLogger,

  // Enable debug mode
  enable: (level: 'debug' | 'info' | 'warn' = 'debug') => {
    enableGridDebug(level);
  },

  // Quick logging methods
  log: (message: string, data?: any) => {
    gridLogger.log(message, data);
  },

  warn: (message: string, data?: any) => {
    gridLogger.warn(message, data);
  },

  error: (message: string, error?: any) => {
    gridLogger.error(message, error);
  }
};

