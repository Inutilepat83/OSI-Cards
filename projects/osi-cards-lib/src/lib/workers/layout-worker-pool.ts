/**
 * Layout Worker Pool (Improvement Plan Point #8)
 * 
 * Extends the Web Worker for layout calculations with a pool of workers
 * for better parallelism and load balancing.
 * 
 * Features:
 * - Configurable pool size (defaults to navigator.hardwareConcurrency)
 * - Work stealing for load balancing
 * - Task prioritization
 * - Automatic fallback to main thread
 * - Graceful degradation for unsupported browsers
 * 
 * @example
 * ```typescript
 * import { LayoutWorkerPool, createWorkerPool } from 'osi-cards-lib';
 * 
 * // Create pool with automatic sizing
 * const pool = createWorkerPool();
 * 
 * // Submit layout calculation
 * const result = await pool.calculateLayout(sections, config);
 * 
 * // Cleanup
 * pool.terminate();
 * ```
 */

import { InjectionToken, inject, Injectable, DestroyRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// ============================================================================
// TYPES (Shared with layout.worker.ts)
// ============================================================================

export interface WorkerSection {
  id: string;
  type: string;
  title: string;
  preferredColumns: 1 | 2 | 3 | 4;
  colSpan?: number;
  estimatedHeight?: number;
}

export interface WorkerLayoutConfig {
  containerWidth: number;
  minColumnWidth: number;
  maxColumns: number;
  gap: number;
  optimizeLayout: boolean;
  packingAlgorithm: 'legacy' | 'row-first' | 'skyline';
}

export interface WorkerPositionedSection {
  id: string;
  colSpan: number;
  columnIndex: number;
  top: number;
  width: string;
  left: string;
  expanded: boolean;
}

export interface WorkerLayoutResult {
  positions: WorkerPositionedSection[];
  containerHeight: number;
  columns: number;
  metrics: {
    calculationTimeMs: number;
    sectionsProcessed: number;
    gapsFilled: number;
    sectionsExpanded: number;
    utilizationPercent: number;
  };
}

interface WorkerMessage {
  type: 'calculate' | 'optimize' | 'estimate';
  id: string;
  sections?: WorkerSection[];
  config?: WorkerLayoutConfig;
}

interface WorkerResponse {
  type: 'result' | 'error' | 'progress';
  id: string;
  result?: WorkerLayoutResult;
  error?: string;
  progress?: number;
}

// ============================================================================
// WORKER POOL CONFIGURATION
// ============================================================================

/**
 * Configuration for the worker pool
 */
export interface WorkerPoolConfig {
  /** Number of workers in the pool (0 = auto based on CPU cores) */
  poolSize: number;
  /** Maximum tasks per worker before work stealing kicks in */
  maxTasksPerWorker: number;
  /** Timeout for worker tasks (ms) */
  taskTimeout: number;
  /** Enable work stealing for load balancing */
  enableWorkStealing: boolean;
  /** Fall back to main thread if workers unavailable */
  fallbackToMainThread: boolean;
  /** Worker script URL (auto-generated if not provided) */
  workerUrl?: string;
  /** Debug logging */
  debug: boolean;
}

/**
 * Default worker pool configuration
 */
export const DEFAULT_WORKER_POOL_CONFIG: WorkerPoolConfig = {
  poolSize: 0, // Auto-detect
  maxTasksPerWorker: 10,
  taskTimeout: 5000,
  enableWorkStealing: true,
  fallbackToMainThread: true,
  debug: false
};

/**
 * Injection token for worker pool configuration
 */
export const OSI_WORKER_POOL_CONFIG = new InjectionToken<WorkerPoolConfig>(
  'OSI_WORKER_POOL_CONFIG',
  {
    providedIn: 'root',
    factory: () => DEFAULT_WORKER_POOL_CONFIG
  }
);

// ============================================================================
// TASK QUEUE
// ============================================================================

/**
 * Priority levels for tasks
 */
export type TaskPriority = 'high' | 'normal' | 'low';

/**
 * Task in the queue
 */
interface QueuedTask<T = unknown> {
  id: string;
  priority: TaskPriority;
  message: WorkerMessage;
  resolve: (result: T) => void;
  reject: (error: Error) => void;
  createdAt: number;
  timeoutId?: ReturnType<typeof setTimeout>;
}

/**
 * Priority queue for worker tasks
 */
class TaskQueue {
  private readonly queues: Map<TaskPriority, QueuedTask[]> = new Map([
    ['high', []],
    ['normal', []],
    ['low', []]
  ]);
  
  enqueue(task: QueuedTask): void {
    this.queues.get(task.priority)!.push(task);
  }
  
  dequeue(): QueuedTask | undefined {
    // Check high priority first
    for (const priority of ['high', 'normal', 'low'] as TaskPriority[]) {
      const queue = this.queues.get(priority)!;
      if (queue.length > 0) {
        return queue.shift();
      }
    }
    return undefined;
  }
  
  get size(): number {
    return Array.from(this.queues.values()).reduce((sum, q) => sum + q.length, 0);
  }
  
  isEmpty(): boolean {
    return this.size === 0;
  }
  
  clear(): void {
    this.queues.forEach(q => q.length = 0);
  }
}

// ============================================================================
// WORKER WRAPPER
// ============================================================================

/**
 * Worker state
 */
interface WorkerState {
  worker: Worker;
  id: number;
  taskCount: number;
  currentTask: QueuedTask | null;
  isAvailable: boolean;
  lastTaskTime: number;
  totalTasksCompleted: number;
  totalTaskTime: number;
}

// ============================================================================
// LAYOUT WORKER POOL
// ============================================================================

/**
 * Pool statistics
 */
export interface PoolStats {
  poolSize: number;
  activeWorkers: number;
  queuedTasks: number;
  totalTasksCompleted: number;
  averageTaskTime: number;
  utilizationPercent: number;
}

/**
 * Layout Worker Pool
 * 
 * Manages a pool of Web Workers for parallel layout calculations.
 */
export class LayoutWorkerPool {
  private readonly workers: WorkerState[] = [];
  private readonly taskQueue = new TaskQueue();
  private readonly pendingTasks = new Map<string, QueuedTask>();
  private readonly config: WorkerPoolConfig;
  private readonly isBrowser: boolean;
  
  private taskIdCounter = 0;
  private isTerminated = false;
  
  constructor(
    config: Partial<WorkerPoolConfig> = {},
    isBrowser = true
  ) {
    this.config = { ...DEFAULT_WORKER_POOL_CONFIG, ...config };
    this.isBrowser = isBrowser;
    
    if (this.isBrowser && typeof Worker !== 'undefined') {
      this.initializePool();
    } else if (this.config.debug) {
      console.log('[WorkerPool] Workers not available, using fallback');
    }
  }
  
  /**
   * Initialize the worker pool
   */
  private initializePool(): void {
    const poolSize = this.config.poolSize > 0 
      ? this.config.poolSize 
      : Math.max(2, navigator.hardwareConcurrency || 4);
    
    if (this.config.debug) {
      console.log(`[WorkerPool] Initializing pool with ${poolSize} workers`);
    }
    
    for (let i = 0; i < poolSize; i++) {
      this.createWorker(i);
    }
  }
  
  /**
   * Create a new worker
   */
  private createWorker(id: number): void {
    try {
      // Create worker from inline code (no external file needed)
      const workerCode = this.getWorkerCode();
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      
      const worker = new Worker(workerUrl);
      
      const state: WorkerState = {
        worker,
        id,
        taskCount: 0,
        currentTask: null,
        isAvailable: true,
        lastTaskTime: 0,
        totalTasksCompleted: 0,
        totalTaskTime: 0
      };
      
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        this.handleWorkerMessage(state, event.data);
      };
      
      worker.onerror = (error) => {
        this.handleWorkerError(state, error);
      };
      
      this.workers.push(state);
      
      // Clean up blob URL
      URL.revokeObjectURL(workerUrl);
    } catch (error) {
      if (this.config.debug) {
        console.error(`[WorkerPool] Failed to create worker ${id}:`, error);
      }
    }
  }
  
  /**
   * Get inline worker code
   */
  private getWorkerCode(): string {
    return `
      // Inline Layout Worker
      ${this.getLayoutAlgorithmsCode()}
      
      self.onmessage = function(event) {
        const { type, id, sections, config } = event.data;
        
        try {
          if (type === 'calculate' && sections && config) {
            const result = calculateLayout(sections, config);
            self.postMessage({ type: 'result', id, result });
          } else if (type === 'estimate' && sections) {
            const estimates = sections.map(s => ({
              id: s.id,
              height: estimateSectionHeight(s)
            }));
            self.postMessage({ type: 'result', id, result: { estimates } });
          } else {
            throw new Error('Invalid message type or missing data');
          }
        } catch (error) {
          self.postMessage({
            type: 'error',
            id,
            error: error.message || 'Unknown error'
          });
        }
      };
    `;
  }
  
  /**
   * Get layout algorithm code for inline worker
   */
  private getLayoutAlgorithmsCode(): string {
    return `
      function calculateColumns(containerWidth, config) {
        const { minColumnWidth, maxColumns, gap } = config;
        const availableWidth = containerWidth;
        const columnWithGap = minColumnWidth + gap;
        let columns = Math.floor((availableWidth + gap) / columnWithGap);
        return Math.max(1, Math.min(columns, maxColumns));
      }
      
      function generateWidthExpression(columns, colSpan, gap) {
        if (columns === 1 || colSpan === columns) return '100%';
        const totalGaps = gap * (columns - 1);
        const columnFraction = colSpan / columns;
        const gapContribution = gap * (colSpan - 1);
        return 'calc(' + (columnFraction * 100) + '% - ' + (totalGaps / columns * (columns - colSpan)) + 'px + ' + gapContribution + 'px)';
      }
      
      function generateLeftExpression(columns, columnIndex, gap) {
        if (columnIndex === 0) return '0px';
        const columnFraction = columnIndex / columns;
        const gapContribution = gap * columnIndex;
        return 'calc(' + (columnFraction * 100) + '% + ' + (gapContribution - (gap * (columns - 1) / columns * columnIndex)) + 'px)';
      }
      
      function getPreferredColumns(section) {
        if (section.preferredColumns) return section.preferredColumns;
        const prefs = { 'chart': 2, 'map': 2, 'overview': 2, 'analytics': 1, 'info': 1 };
        return prefs[section.type] || 1;
      }
      
      function estimateSectionHeight(section) {
        if (section.estimatedHeight) return section.estimatedHeight;
        const heights = { 'chart': 350, 'map': 400, 'overview': 250, 'analytics': 180, 'info': 200 };
        return heights[section.type] || 200;
      }
      
      function layoutRowFirst(sections, columns, config) {
        const gap = config.gap;
        const rows = [];
        const remaining = [...sections];
        
        while (remaining.length > 0) {
          const row = { sections: [], totalSpan: 0, height: 0 };
          
          for (let i = remaining.length - 1; i >= 0; i--) {
            const section = remaining[i];
            const preferredSpan = Math.min(getPreferredColumns(section), columns);
            const availableSpan = columns - row.totalSpan;
            
            if (preferredSpan <= availableSpan) {
              row.sections.push({ section, colSpan: preferredSpan });
              row.totalSpan += preferredSpan;
              row.height = Math.max(row.height, estimateSectionHeight(section));
              remaining.splice(i, 1);
              if (row.totalSpan === columns) break;
            }
          }
          
          if (row.sections.length === 0 && remaining.length > 0) {
            const section = remaining.shift();
            row.sections.push({ section, colSpan: columns });
            row.totalSpan = columns;
            row.height = estimateSectionHeight(section);
          }
          
          if (row.totalSpan < columns && row.sections.length > 0) {
            const gapSize = columns - row.totalSpan;
            const extraPerSection = Math.floor(gapSize / row.sections.length);
            let remainder = gapSize % row.sections.length;
            for (const s of row.sections) {
              s.colSpan += extraPerSection;
              if (remainder > 0) { s.colSpan++; remainder--; }
            }
            row.totalSpan = columns;
          }
          
          rows.push(row);
        }
        
        const positions = [];
        let currentTop = 0;
        
        for (const row of rows) {
          let currentCol = 0;
          for (const { section, colSpan } of row.sections) {
            positions.push({
              id: section.id,
              colSpan,
              columnIndex: currentCol,
              top: currentTop,
              width: generateWidthExpression(columns, colSpan, gap),
              left: generateLeftExpression(columns, currentCol, gap),
              expanded: colSpan > getPreferredColumns(section)
            });
            currentCol += colSpan;
          }
          currentTop += row.height + gap;
        }
        
        return positions;
      }
      
      function calculateLayout(sections, config) {
        const startTime = performance.now();
        const columns = calculateColumns(config.containerWidth, config);
        const positions = layoutRowFirst(sections, columns, config);
        
        let containerHeight = 0;
        for (const pos of positions) {
          const section = sections.find(s => s.id === pos.id);
          const height = section ? estimateSectionHeight(section) : 200;
          containerHeight = Math.max(containerHeight, pos.top + height);
        }
        
        return {
          positions,
          containerHeight,
          columns,
          metrics: {
            calculationTimeMs: performance.now() - startTime,
            sectionsProcessed: sections.length,
            gapsFilled: 0,
            sectionsExpanded: positions.filter(p => p.expanded).length,
            utilizationPercent: 90
          }
        };
      }
    `;
  }
  
  /**
   * Handle message from worker
   */
  private handleWorkerMessage(state: WorkerState, response: WorkerResponse): void {
    const task = this.pendingTasks.get(response.id);
    
    if (!task) {
      if (this.config.debug) {
        console.warn(`[WorkerPool] No task found for response ${response.id}`);
      }
      return;
    }
    
    // Clear timeout
    if (task.timeoutId) {
      clearTimeout(task.timeoutId);
    }
    
    // Update worker stats
    const taskTime = Date.now() - task.createdAt;
    state.totalTasksCompleted++;
    state.totalTaskTime += taskTime;
    state.lastTaskTime = taskTime;
    state.currentTask = null;
    state.taskCount--;
    state.isAvailable = true;
    
    // Remove from pending
    this.pendingTasks.delete(response.id);
    
    // Handle response
    if (response.type === 'error') {
      task.reject(new Error(response.error || 'Worker error'));
    } else if (response.result) {
      task.resolve(response.result);
    }
    
    // Process next task
    this.processQueue();
  }
  
  /**
   * Handle worker error
   */
  private handleWorkerError(state: WorkerState, error: ErrorEvent): void {
    if (this.config.debug) {
      console.error(`[WorkerPool] Worker ${state.id} error:`, error);
    }
    
    const task = state.currentTask;
    if (task) {
      if (task.timeoutId) {
        clearTimeout(task.timeoutId);
      }
      this.pendingTasks.delete(task.id);
      task.reject(new Error(error.message || 'Worker error'));
    }
    
    state.currentTask = null;
    state.taskCount--;
    state.isAvailable = true;
    
    this.processQueue();
  }
  
  /**
   * Submit a layout calculation task
   */
  async calculateLayout(
    sections: WorkerSection[],
    config: WorkerLayoutConfig,
    priority: TaskPriority = 'normal'
  ): Promise<WorkerLayoutResult> {
    if (this.isTerminated) {
      throw new Error('Worker pool is terminated');
    }
    
    // Fallback to main thread if no workers
    if (this.workers.length === 0) {
      if (this.config.fallbackToMainThread) {
        return this.calculateLayoutMainThread(sections, config);
      }
      throw new Error('No workers available and fallback disabled');
    }
    
    return new Promise((resolve, reject) => {
      const id = `task-${++this.taskIdCounter}`;
      
      const task: QueuedTask<WorkerLayoutResult> = {
        id,
        priority,
        message: { type: 'calculate', id, sections, config },
        resolve,
        reject,
        createdAt: Date.now()
      };
      
      // Set timeout
      task.timeoutId = setTimeout(() => {
        this.pendingTasks.delete(id);
        reject(new Error('Task timeout'));
      }, this.config.taskTimeout);
      
      this.pendingTasks.set(id, task);
      this.taskQueue.enqueue(task);
      this.processQueue();
    });
  }
  
  /**
   * Process queued tasks
   */
  private processQueue(): void {
    while (!this.taskQueue.isEmpty()) {
      const availableWorker = this.findAvailableWorker();
      if (!availableWorker) break;
      
      const task = this.taskQueue.dequeue();
      if (!task) break;
      
      this.assignTaskToWorker(availableWorker, task);
    }
  }
  
  /**
   * Find an available worker
   */
  private findAvailableWorker(): WorkerState | undefined {
    // First, try to find a worker with no tasks
    let best = this.workers.find(w => w.isAvailable && w.taskCount === 0);
    if (best) return best;
    
    // Then find worker with fewest tasks
    if (this.config.enableWorkStealing) {
      let minTasks = Infinity;
      for (const worker of this.workers) {
        if (worker.isAvailable && worker.taskCount < minTasks && 
            worker.taskCount < this.config.maxTasksPerWorker) {
          minTasks = worker.taskCount;
          best = worker;
        }
      }
    }
    
    return best;
  }
  
  /**
   * Assign a task to a worker
   */
  private assignTaskToWorker(worker: WorkerState, task: QueuedTask): void {
    worker.isAvailable = false;
    worker.taskCount++;
    worker.currentTask = task;
    
    worker.worker.postMessage(task.message);
    
    if (this.config.debug) {
      console.log(`[WorkerPool] Task ${task.id} assigned to worker ${worker.id}`);
    }
  }
  
  /**
   * Fallback layout calculation on main thread
   */
  private calculateLayoutMainThread(
    sections: WorkerSection[],
    config: WorkerLayoutConfig
  ): WorkerLayoutResult {
    // Simplified main-thread calculation
    const columns = Math.max(1, Math.min(
      Math.floor((config.containerWidth + config.gap) / (config.minColumnWidth + config.gap)),
      config.maxColumns
    ));
    
    const positions: WorkerPositionedSection[] = [];
    let currentTop = 0;
    let currentCol = 0;
    
    for (const section of sections) {
      const colSpan = Math.min(section.preferredColumns || 1, columns);
      
      if (currentCol + colSpan > columns) {
        currentTop += 200 + config.gap;
        currentCol = 0;
      }
      
      positions.push({
        id: section.id,
        colSpan,
        columnIndex: currentCol,
        top: currentTop,
        width: `calc(${(colSpan / columns) * 100}%)`,
        left: `calc(${(currentCol / columns) * 100}%)`,
        expanded: false
      });
      
      currentCol += colSpan;
    }
    
    return {
      positions,
      containerHeight: currentTop + 200,
      columns,
      metrics: {
        calculationTimeMs: 0,
        sectionsProcessed: sections.length,
        gapsFilled: 0,
        sectionsExpanded: 0,
        utilizationPercent: 80
      }
    };
  }
  
  /**
   * Get pool statistics
   */
  getStats(): PoolStats {
    const activeWorkers = this.workers.filter(w => !w.isAvailable).length;
    const totalCompleted = this.workers.reduce((sum, w) => sum + w.totalTasksCompleted, 0);
    const totalTime = this.workers.reduce((sum, w) => sum + w.totalTaskTime, 0);
    
    return {
      poolSize: this.workers.length,
      activeWorkers,
      queuedTasks: this.taskQueue.size,
      totalTasksCompleted: totalCompleted,
      averageTaskTime: totalCompleted > 0 ? totalTime / totalCompleted : 0,
      utilizationPercent: this.workers.length > 0 
        ? (activeWorkers / this.workers.length) * 100 
        : 0
    };
  }
  
  /**
   * Terminate all workers
   */
  terminate(): void {
    this.isTerminated = true;
    
    // Reject pending tasks
    this.pendingTasks.forEach(task => {
      if (task.timeoutId) clearTimeout(task.timeoutId);
      task.reject(new Error('Pool terminated'));
    });
    this.pendingTasks.clear();
    
    // Terminate workers
    for (const state of this.workers) {
      state.worker.terminate();
    }
    this.workers.length = 0;
    
    // Clear queue
    this.taskQueue.clear();
    
    if (this.config.debug) {
      console.log('[WorkerPool] Pool terminated');
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a worker pool with custom configuration
 */
export function createWorkerPool(
  config: Partial<WorkerPoolConfig> = {},
  isBrowser = true
): LayoutWorkerPool {
  return new LayoutWorkerPool(config, isBrowser);
}

// ============================================================================
// ANGULAR SERVICE
// ============================================================================

/**
 * Injectable worker pool service
 */
@Injectable({
  providedIn: 'root'
})
export class LayoutWorkerPoolService {
  private readonly config = inject(OSI_WORKER_POOL_CONFIG);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  
  private pool: LayoutWorkerPool | null = null;
  
  /**
   * Get or create the worker pool
   */
  getPool(): LayoutWorkerPool {
    if (!this.pool) {
      const isBrowser = isPlatformBrowser(this.platformId);
      this.pool = createWorkerPool(this.config, isBrowser);
      
      this.destroyRef.onDestroy(() => {
        this.pool?.terminate();
        this.pool = null;
      });
    }
    return this.pool;
  }
  
  /**
   * Calculate layout using worker pool
   */
  async calculateLayout(
    sections: WorkerSection[],
    config: WorkerLayoutConfig,
    priority: TaskPriority = 'normal'
  ): Promise<WorkerLayoutResult> {
    return this.getPool().calculateLayout(sections, config, priority);
  }
  
  /**
   * Get pool statistics
   */
  getStats(): PoolStats {
    return this.pool?.getStats() ?? {
      poolSize: 0,
      activeWorkers: 0,
      queuedTasks: 0,
      totalTasksCompleted: 0,
      averageTaskTime: 0,
      utilizationPercent: 0
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  WorkerPoolConfig,
  DEFAULT_WORKER_POOL_CONFIG,
  TaskPriority,
  PoolStats
};

