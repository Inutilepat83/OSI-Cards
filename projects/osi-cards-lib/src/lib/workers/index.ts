/**
 * Web Workers
 * 
 * Exports Web Worker utilities for offloading heavy computations.
 * 
 * Note: The actual worker files need to be bundled separately.
 * Use the worker factory functions to instantiate workers.
 * 
 * @example
 * ```typescript
 * import { createLayoutWorker } from 'osi-cards-lib/workers';
 * 
 * const worker = createLayoutWorker();
 * worker.postMessage({ type: 'calculate', sections, config });
 * ```
 */

// Worker types - import from worker file for type info
export type {
  Section,
  LayoutConfig,
  PositionedSection,
  LayoutResult,
  LayoutMetrics
} from './layout.worker';

/**
 * Create a layout calculation worker
 * @returns Web Worker instance for layout calculations
 */
export function createLayoutWorker(): Worker | null {
  if (typeof Worker === 'undefined') {
    console.warn('Web Workers not supported in this environment');
    return null;
  }
  
  try {
    // Workers need to be bundled with the application
    // This is a placeholder - actual implementation depends on build setup
    return new Worker(new URL('./layout.worker', import.meta.url), { type: 'module' });
  } catch (error) {
    console.warn('Failed to create layout worker:', error);
    return null;
  }
}

/**
 * Worker message types
 */
export type WorkerMessageType = 'calculate' | 'optimize' | 'estimate';

/**
 * Worker response types
 */
export type WorkerResponseType = 'result' | 'error' | 'progress';

/**
 * Create a message for the layout worker
 */
export function createLayoutWorkerMessage(
  type: WorkerMessageType,
  sections: unknown[],
  config: unknown
): { type: WorkerMessageType; id: string; sections: unknown[]; config: unknown } {
  return {
    type,
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    sections,
    config
  };
}

// Worker Pool (Improvement Plan Point #8)
export {
  LayoutWorkerPool,
  LayoutWorkerPoolService,
  createWorkerPool,
  OSI_WORKER_POOL_CONFIG,
  DEFAULT_WORKER_POOL_CONFIG,
  type WorkerPoolConfig,
  type WorkerSection,
  type WorkerLayoutConfig,
  type WorkerPositionedSection,
  type WorkerLayoutResult,
  type TaskPriority,
  type PoolStats
} from './layout-worker-pool';

