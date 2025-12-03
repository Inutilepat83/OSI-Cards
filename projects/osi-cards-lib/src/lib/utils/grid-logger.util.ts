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

// Re-export layout debugging utilities
export * from './layout-debug.util';

// ============================================================================
// TYPES
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';
export type LayoutPhase =
  | 'init'
  | 'measure'
  | 'sort'
  | 'pack'
  | 'place'
  | 'reflow'
  | 'gap-fill'
  | 'balance'
  | 'complete';
export type PackingAlgorithm = 'first-fit' | 'best-fit' | 'next-fit' | 'skyline';

export interface PlacementDecision {
  sectionId: string;
  sectionType: string;
  title: string;
  requestedColSpan: number;
  actualColSpan: number;
  column: number;
  row: number;
  top: number;
  reason: string;
  alternatives?: Array<{ column: number; reason: string }>;
}

export interface GapAnalysis {
  totalGaps: number;
  gapArea: number;
  gaps: Array<{
    column: number;
    startRow: number;
    endRow: number;
    height: number;
  }>;
  utilizationPercent: number;
}

export interface ColumnAnalysis {
  columnIndex: number;
  height: number;
  itemCount: number;
  utilization: number;
  density: number;
}

export interface RowMetrics {
  row: number;
  height: number;
  columns: number;
}

export interface HeightAnalysis {
  average: number;
  median: number;
  max: number;
  min: number;
}

export interface GridLayoutLogEntry {
  timestamp: number;
  phase: LayoutPhase;
  message: string;
  data?: Record<string, unknown>;
  duration?: number;
}

// ============================================================================
// GRID LOGGER IMPLEMENTATION
// ============================================================================

/**
 * Grid logger implementation with all required methods
 */
export const gridLogger = {
  log: (message: string, data?: any) => {
    if (typeof window !== 'undefined' && (window as any).__GRID_DEBUG__) {
      console.log(`[Grid] ${message}`, data);
    }
  },
  warn: (message: string, data?: any) => {
    if (typeof window !== 'undefined' && (window as any).__GRID_DEBUG__) {
      console.warn(`[Grid] ${message}`, data);
    }
  },
  error: (message: string, error?: any) => {
    console.error(`[Grid] ${message}`, error);
  },
  logPlacement: (decision: PlacementDecision) => {
    gridLogger.log(`Placed section: ${decision.title}`, decision);
  },
  logGapAnalysis: (analysis: GapAnalysis) => {
    gridLogger.log('Gap Analysis', analysis);
  },
  logColumnAnalysis: (analysis: ColumnAnalysis[]) => {
    gridLogger.log('Column Analysis', analysis);
  },
  startSession: (config?: any) => {
    gridLogger.log('Starting layout session', config);
  },
  endSession: () => {
    gridLogger.log('Ending layout session');
  },
  startPhase: (phase: LayoutPhase) => {
    gridLogger.log(`Starting phase: ${phase}`);
  },
  endPhase: (phase: LayoutPhase, result?: any) => {
    gridLogger.log(`Completed phase: ${phase}`, result);
  },
  logRowBuilt: (row: number, sections: any[], height: number) => {
    gridLogger.log(`Row ${row} built`, { sections: sections.length, height });
  },
  logColumnBalance: (data: any) => {
    gridLogger.log('Column Balance', data);
  },
  configure: (config: { level?: string; enabled?: boolean; consoleOutput?: boolean }) => {
    if (typeof window !== 'undefined') {
      (window as any).__GRID_DEBUG__ = config.enabled ? config.level || 'debug' : false;
    }
  },
  logSortOrder: (order: any) => {
    gridLogger.log('Sort Order', order);
  },
  logAlgorithmSelection: (algorithm: string, reason: string) => {
    gridLogger.log(`Algorithm selected: ${algorithm}`, { reason });
  },
};

/**
 * Consolidated GridLogger namespace for convenience
 */
export const GridLogger = {
  // Main logger instance
  logger: gridLogger,

  // Enable debug mode
  enable: (level: 'debug' | 'info' | 'warn' = 'debug') => {
    if (typeof window !== 'undefined') {
      (window as any).__GRID_DEBUG__ = level;
    }
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
  },

  // Specialized logging
  logPlacement: (decision: PlacementDecision) => {
    gridLogger.logPlacement(decision);
  },

  logGapAnalysis: (analysis: GapAnalysis) => {
    gridLogger.logGapAnalysis(analysis);
  },

  logColumnAnalysis: (analysis: ColumnAnalysis[]) => {
    gridLogger.logColumnAnalysis(analysis);
  },
};
