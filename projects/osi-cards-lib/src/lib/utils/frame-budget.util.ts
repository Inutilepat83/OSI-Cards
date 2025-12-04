/**
 * Frame Budget Management Utilities
 *
 * Enforces 16ms frame budget for layout work to maintain 60fps.
 * Defers excess calculations to next frame with priority queue.
 * Uses requestAnimationFrame and requestIdleCallback for scheduling.
 *
 * @example
 * ```typescript
 * import { FrameBudgetManager } from 'osi-cards-lib';
 *
 * const budget = new FrameBudgetManager();
 *
 * // Schedule work with automatic frame budget management
 * budget.schedule(() => {
 *   // Expensive layout calculation
 * }, { priority: 'high' });
 * ```
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Priority levels for scheduled work
 */
export type WorkPriority = 'critical' | 'high' | 'normal' | 'low' | 'idle';

/**
 * Scheduled work item
 */
export interface ScheduledWork {
  id: string;
  task: () => void | Promise<void>;
  priority: WorkPriority;
  estimatedMs?: number;
  deadline?: number;
  createdAt: number;
}

/**
 * Frame budget configuration
 */
export interface FrameBudgetConfig {
  /** Target frame time in ms (default: 16 for 60fps) */
  targetFrameTime?: number;
  /** Maximum work items per frame */
  maxItemsPerFrame?: number;
  /** Enable performance monitoring */
  enableMonitoring?: boolean;
  /** Use requestIdleCallback for low priority work */
  useIdleCallback?: boolean;
}

/**
 * Frame statistics
 */
export interface FrameStats {
  /** Average frame time */
  avgFrameTime: number;
  /** Maximum frame time */
  maxFrameTime: number;
  /** Frames exceeding budget */
  droppedFrames: number;
  /** Total frames processed */
  totalFrames: number;
  /** Current queue length */
  queueLength: number;
  /** Work items completed */
  completedWork: number;
  /** Work items deferred */
  deferredWork: number;
}

/**
 * Work completion callback
 */
export type WorkCompletionCallback = (result: {
  completed: boolean;
  deferred: boolean;
  timeSpent: number;
}) => void;

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: Required<FrameBudgetConfig> = {
  targetFrameTime: 16, // 60fps
  maxItemsPerFrame: 10,
  enableMonitoring: true,
  useIdleCallback: true,
};

const PRIORITY_ORDER: Record<WorkPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
  idle: 4,
};

// ============================================================================
// FRAME BUDGET MANAGER
// ============================================================================

/**
 * Manages frame budget for smooth animations and layouts
 */
export class FrameBudgetManager {
  private queue: ScheduledWork[] = [];
  private isProcessing = false;
  private animationFrameId: number | null = null;
  private idleCallbackId: number | null = null;
  private workIdCounter = 0;

  private readonly config: Required<FrameBudgetConfig>;

  // Statistics
  private frameTimes: number[] = [];
  private stats: FrameStats = {
    avgFrameTime: 0,
    maxFrameTime: 0,
    droppedFrames: 0,
    totalFrames: 0,
    queueLength: 0,
    completedWork: 0,
    deferredWork: 0,
  };

  // Callbacks
  private completionCallbacks = new Map<string, WorkCompletionCallback>();

  constructor(config?: FrameBudgetConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Cleans up resources
   */
  destroy(): void {
    this.cancelAll();
    this.frameTimes = [];
    this.completionCallbacks.clear();
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Schedules work to be executed within frame budget
   */
  schedule(
    task: () => void | Promise<void>,
    options?: {
      priority?: WorkPriority;
      estimatedMs?: number;
      deadline?: number;
      onComplete?: WorkCompletionCallback;
    }
  ): string {
    const id = `work-${this.workIdCounter++}`;
    const priority = options?.priority ?? 'normal';

    const work: ScheduledWork = {
      id,
      task,
      priority,
      estimatedMs: options?.estimatedMs,
      deadline: options?.deadline,
      createdAt: performance.now(),
    };

    // Insert in priority order
    this.insertByPriority(work);

    if (options?.onComplete) {
      this.completionCallbacks.set(id, options.onComplete);
    }

    this.ensureProcessing();
    return id;
  }

  /**
   * Schedules critical work that must run this frame
   */
  scheduleCritical(task: () => void | Promise<void>): string {
    return this.schedule(task, { priority: 'critical' });
  }

  /**
   * Schedules layout work with estimated duration
   */
  scheduleLayout(task: () => void, estimatedMs: number = 5): string {
    return this.schedule(task, {
      priority: 'high',
      estimatedMs,
    });
  }

  /**
   * Schedules low-priority work for idle time
   */
  scheduleIdle(task: () => void): string {
    return this.schedule(task, { priority: 'idle' });
  }

  /**
   * Cancels scheduled work by ID
   */
  cancel(id: string): boolean {
    const index = this.queue.findIndex((w) => w.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.completionCallbacks.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Cancels all scheduled work
   */
  cancelAll(): void {
    this.queue = [];
    this.completionCallbacks.clear();

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.idleCallbackId !== null && typeof cancelIdleCallback !== 'undefined') {
      cancelIdleCallback(this.idleCallbackId);
      this.idleCallbackId = null;
    }

    this.isProcessing = false;
  }

  /**
   * Runs all pending work synchronously (use sparingly)
   */
  flush(): void {
    while (this.queue.length > 0) {
      const work = this.queue.shift();
      if (work) {
        try {
          work.task();
          this.stats.completedWork++;
        } catch (error) {
          console.error('Error executing flushed work:', error);
        }
      }
    }
  }

  /**
   * Gets current statistics
   */
  getStats(): FrameStats {
    return {
      ...this.stats,
      queueLength: this.queue.length,
      avgFrameTime: this.calculateAverageFrameTime(),
    };
  }

  /**
   * Gets remaining budget for current frame
   */
  getRemainingBudget(): number {
    // This is a rough estimate based on typical frame timing
    return Math.max(0, this.config.targetFrameTime - 2);
  }

  /**
   * Checks if there's work pending
   */
  hasPendingWork(): boolean {
    return this.queue.length > 0;
  }

  /**
   * Gets queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private insertByPriority(work: ScheduledWork): void {
    const priority = PRIORITY_ORDER[work.priority];

    // Find insertion point
    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      const itemPriority = PRIORITY_ORDER[this.queue[i]?.priority ?? 'normal'];
      if (priority < itemPriority) {
        insertIndex = i;
        break;
      }
    }

    this.queue.splice(insertIndex, 0, work);
  }

  private ensureProcessing(): void {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.scheduleNextFrame();
  }

  private scheduleNextFrame(): void {
    // Use requestIdleCallback for idle priority work when queue only has idle items
    if (
      this.config.useIdleCallback &&
      this.queue.length > 0 &&
      this.queue.every((w) => w.priority === 'idle') &&
      typeof requestIdleCallback !== 'undefined'
    ) {
      this.idleCallbackId = requestIdleCallback((deadline) => this.processIdleWork(deadline), {
        timeout: 1000,
      });
    } else {
      this.animationFrameId = requestAnimationFrame((timestamp) => this.processFrame(timestamp));
    }
  }

  private processFrame(timestamp: number): void {
    this.animationFrameId = null;

    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    const frameStart = performance.now();
    const budget = this.config.targetFrameTime;
    let itemsProcessed = 0;
    let totalTimeSpent = 0;

    // Process work within budget
    while (this.queue.length > 0 && itemsProcessed < this.config.maxItemsPerFrame) {
      const elapsed = performance.now() - frameStart;
      const remaining = budget - elapsed;

      // Check if we have budget remaining
      if (remaining <= 0) {
        break;
      }

      const work = this.queue[0];
      if (!work) break;

      // Skip if estimated time exceeds remaining budget (unless critical)
      if (work.priority !== 'critical' && work.estimatedMs && work.estimatedMs > remaining) {
        // Check if work has deadline
        if (work.deadline && performance.now() > work.deadline) {
          // Deadline passed, must execute
        } else {
          // Defer to next frame
          this.stats.deferredWork++;
          this.notifyCompletion(work.id, false, true, 0);
          break;
        }
      }

      // Execute work
      this.queue.shift();
      const workStart = performance.now();

      try {
        const result = work.task();

        // Handle async tasks
        if (result instanceof Promise) {
          result.catch((error) => {
            console.error('Error in async work:', error);
          });
        }

        itemsProcessed++;
        this.stats.completedWork++;
      } catch (error) {
        console.error('Error executing work:', error);
      }

      const workTime = performance.now() - workStart;
      totalTimeSpent += workTime;
      this.notifyCompletion(work.id, true, false, workTime);
    }

    // Update statistics
    const frameTime = performance.now() - frameStart;
    this.recordFrameTime(frameTime);

    // Schedule next frame if there's more work
    if (this.queue.length > 0) {
      this.scheduleNextFrame();
    } else {
      this.isProcessing = false;
    }
  }

  private processIdleWork(deadline: IdleDeadline): void {
    this.idleCallbackId = null;

    while (this.queue.length > 0 && deadline.timeRemaining() > 0) {
      const work = this.queue.shift();
      if (!work) break;

      const workStart = performance.now();

      try {
        work.task();
        this.stats.completedWork++;
      } catch (error) {
        console.error('Error executing idle work:', error);
      }

      this.notifyCompletion(work.id, true, false, performance.now() - workStart);
    }

    // Schedule more idle work if needed
    if (this.queue.length > 0) {
      this.scheduleNextFrame();
    } else {
      this.isProcessing = false;
    }
  }

  private notifyCompletion(
    id: string,
    completed: boolean,
    deferred: boolean,
    timeSpent: number
  ): void {
    const callback = this.completionCallbacks.get(id);
    if (callback) {
      callback({ completed, deferred, timeSpent });
      this.completionCallbacks.delete(id);
    }
  }

  private recordFrameTime(time: number): void {
    if (!this.config.enableMonitoring) return;

    this.frameTimes.push(time);
    this.stats.totalFrames++;

    if (time > this.stats.maxFrameTime) {
      this.stats.maxFrameTime = time;
    }

    if (time > this.config.targetFrameTime) {
      this.stats.droppedFrames++;
    }

    // Keep only last 100 frame times
    if (this.frameTimes.length > 100) {
      this.frameTimes.shift();
    }
  }

  private calculateAverageFrameTime(): number {
    if (this.frameTimes.length === 0) return 0;
    const sum = this.frameTimes.reduce((a, b) => a + b, 0);
    return Math.round((sum / this.frameTimes.length) * 100) / 100;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Singleton instance for global frame budget management
 */
let globalFrameBudget: FrameBudgetManager | null = null;

/**
 * Gets or creates the global frame budget manager
 */
export function getFrameBudgetManager(): FrameBudgetManager {
  if (!globalFrameBudget) {
    globalFrameBudget = new FrameBudgetManager();
  }
  return globalFrameBudget;
}

/**
 * Schedules work using the global frame budget manager
 */
export function scheduleWork(task: () => void, priority: WorkPriority = 'normal'): string {
  return getFrameBudgetManager().schedule(task, { priority });
}

/**
 * Batches DOM updates using requestAnimationFrame
 */
export function batchDOMUpdates(updates: Array<() => void>, onComplete?: () => void): void {
  requestAnimationFrame(() => {
    const budget = getFrameBudgetManager();

    for (const update of updates) {
      budget.schedule(update, { priority: 'high', estimatedMs: 1 });
    }

    if (onComplete) {
      budget.schedule(onComplete, { priority: 'low' });
    }
  });
}

/**
 * Runs expensive work during idle time
 */
export function runWhenIdle(task: () => void, timeout: number = 1000): void {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(
      (deadline) => {
        if (deadline.timeRemaining() > 0) {
          task();
        } else {
          // Not enough time, reschedule
          runWhenIdle(task, timeout);
        }
      },
      { timeout }
    );
  } else {
    // Fallback to setTimeout
    setTimeout(task, 1);
  }
}

/**
 * Creates a throttled function that respects frame budget
 */
export function throttleWithBudget<T extends (...args: any[]) => void>(
  fn: T,
  priority: WorkPriority = 'normal'
): T {
  let scheduled = false;
  let lastArgs: Parameters<T> | null = null;

  return ((...args: Parameters<T>) => {
    lastArgs = args;

    if (!scheduled) {
      scheduled = true;
      getFrameBudgetManager().schedule(
        () => {
          scheduled = false;
          if (lastArgs) {
            fn(...lastArgs);
          }
        },
        { priority }
      );
    }
  }) as T;
}

/**
 * Measures execution time of a function
 */
export function measureExecutionTime<T>(
  fn: () => T,
  label?: string
): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;

  if (label) {
    console.debug(`[${label}] Execution time: ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

/**
 * Chunks an array of work into frame-budget-friendly batches
 */
export async function processInBatches<T, R>(
  items: T[],
  processor: (item: T, index: number) => R,
  batchSize: number = 10,
  onBatchComplete?: (completed: number, total: number) => void
): Promise<R[]> {
  const results: R[] = [];
  const budget = getFrameBudgetManager();

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    await new Promise<void>((resolve) => {
      budget.schedule(
        () => {
          for (let j = 0; j < batch.length; j++) {
            const item = batch[j];
            if (item !== undefined) {
              results.push(processor(item, i + j));
            }
          }
          onBatchComplete?.(Math.min(i + batchSize, items.length), items.length);
          resolve();
        },
        { priority: 'normal' }
      );
    });
  }

  return results;
}
