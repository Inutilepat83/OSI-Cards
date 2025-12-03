/**
 * Performance Monitoring Utilities
 * Provides comprehensive performance tracking, budgeting, and monitoring capabilities
 */

/**
 * Performance budget configuration
 */
export interface PerformanceBudget {
  /** Maximum time in ms for a frame */
  frameTime?: number;
  /** Maximum time in ms for layout calculation */
  layoutTime?: number;
  /** Maximum time in ms for component render */
  renderTime?: number;
  /** Maximum memory usage in MB */
  memoryLimit?: number;
}

/**
 * Performance metrics collected during monitoring
 */
export interface PerformanceMetrics {
  /** Metric name/identifier */
  name: string;
  /** Duration in milliseconds */
  duration: number;
  /** Timestamp when metric was recorded */
  timestamp: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Whether budget was exceeded */
  budgetExceeded?: boolean;
}

/**
 * Frame timing information
 */
export interface FrameTimings {
  /** Frame number */
  frame: number;
  /** Frame duration in ms */
  duration: number;
  /** Frames per second */
  fps: number;
  /** Whether frame dropped */
  dropped: boolean;
}

const DEFAULT_BUDGET: PerformanceBudget = {
  frameTime: 16.67, // 60fps
  layoutTime: 10,
  renderTime: 8,
  memoryLimit: 100,
};

/**
 * Performance monitor for tracking metrics and budgets
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private budget: PerformanceBudget;
  private marks: Map<string, number> = new Map();
  private observers: Set<(metric: PerformanceMetrics) => void> = new Set();
  private frameCallbacks: Set<(timing: FrameTimings) => void> = new Set();
  private rafId: number | null = null;
  private lastFrameTime = 0;
  private frameCount = 0;

  constructor(budget: PerformanceBudget = DEFAULT_BUDGET) {
    this.budget = { ...DEFAULT_BUDGET, ...budget };
  }

  /**
   * Start measuring a performance metric
   */
  public startMeasure(name: string): void {
    this.marks.set(name, performance.now());

    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${name}-start`);
    }
  }

  /**
   * End measuring and record the metric
   */
  public endMeasure(name: string, metadata?: Record<string, unknown>): PerformanceMetrics | null {
    const startTime = this.marks.get(name);

    if (startTime === undefined) {
      console.warn(`PerformanceMonitor: No start mark found for "${name}"`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(name);

    // Create performance measure if available
    if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
      try {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
      } catch (e) {
        // Ignore measure errors
      }
    }

    const metric: PerformanceMetrics = {
      name,
      duration,
      timestamp: Date.now(),
      metadata,
      budgetExceeded: this.checkBudget(name, duration),
    };

    this.metrics.push(metric);
    this.notifyObservers(metric);

    // Warn if budget exceeded
    if (metric.budgetExceeded) {
      console.warn(`Performance budget exceeded for "${name}": ${duration.toFixed(2)}ms`);
    }

    return metric;
  }

  /**
   * Check if a metric exceeds the performance budget
   */
  private checkBudget(name: string, duration: number): boolean {
    if (name.includes('frame')) {
      return duration > (this.budget.frameTime ?? DEFAULT_BUDGET.frameTime!);
    }
    if (name.includes('layout')) {
      return duration > (this.budget.layoutTime ?? DEFAULT_BUDGET.layoutTime!);
    }
    if (name.includes('render')) {
      return duration > (this.budget.renderTime ?? DEFAULT_BUDGET.renderTime!);
    }
    return false;
  }

  /**
   * Get all recorded metrics
   */
  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get metrics filtered by name pattern
   */
  public getMetricsByName(pattern: string | RegExp): PerformanceMetrics[] {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return this.metrics.filter(m => regex.test(m.name));
  }

  /**
   * Get average duration for a metric name
   */
  public getAverageDuration(name: string): number {
    const filtered = this.metrics.filter(m => m.name === name);
    if (filtered.length === 0) return 0;

    const sum = filtered.reduce((acc, m) => acc + m.duration, 0);
    return sum / filtered.length;
  }

  /**
   * Clear all recorded metrics
   */
  public clearMetrics(): void {
    this.metrics = [];
    this.marks.clear();
  }

  /**
   * Subscribe to metric updates
   */
  public subscribe(callback: (metric: PerformanceMetrics) => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  /**
   * Notify all observers of a new metric
   */
  private notifyObservers(metric: PerformanceMetrics): void {
    this.observers.forEach(callback => callback(metric));
  }

  /**
   * Start monitoring frame rate
   */
  public startFrameMonitoring(): void {
    if (this.rafId !== null) return;

    this.lastFrameTime = performance.now();
    this.frameCount = 0;

    const monitorFrame = (timestamp: number): void => {
      const delta = timestamp - this.lastFrameTime;
      const fps = 1000 / delta;
      const dropped = delta > (this.budget.frameTime ?? 16.67) * 1.5;

      const timing: FrameTimings = {
        frame: this.frameCount++,
        duration: delta,
        fps,
        dropped,
      };

      this.frameCallbacks.forEach(callback => callback(timing));

      this.lastFrameTime = timestamp;
      this.rafId = requestAnimationFrame(monitorFrame);
    };

    this.rafId = requestAnimationFrame(monitorFrame);
  }

  /**
   * Stop monitoring frame rate
   */
  public stopFrameMonitoring(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Subscribe to frame timing updates
   */
  public subscribeToFrames(callback: (timing: FrameTimings) => void): () => void {
    this.frameCallbacks.add(callback);
    return () => this.frameCallbacks.delete(callback);
  }

  /**
   * Get current memory usage (if available)
   */
  public getMemoryUsage(): number | null {
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }
    return null;
  }

  /**
   * Check if memory budget is exceeded
   */
  public isMemoryBudgetExceeded(): boolean {
    const usage = this.getMemoryUsage();
    if (usage === null) return false;
    return usage > (this.budget.memoryLimit ?? DEFAULT_BUDGET.memoryLimit!);
  }

  /**
   * Generate performance report
   */
  public generateReport(): PerformanceReport {
    const uniqueNames = Array.from(new Set(this.metrics.map(m => m.name)));
    const summary = uniqueNames.map(name => {
      const filtered = this.metrics.filter(m => m.name === name);
      const durations = filtered.map(m => m.duration);
      const budgetViolations = filtered.filter(m => m.budgetExceeded).length;

      return {
        name,
        count: filtered.length,
        average: durations.reduce((a, b) => a + b, 0) / durations.length,
        min: Math.min(...durations),
        max: Math.max(...durations),
        budgetViolations,
        violationRate: budgetViolations / filtered.length,
      };
    });

    return {
      totalMetrics: this.metrics.length,
      uniqueMetrics: uniqueNames.length,
      summary,
      memoryUsage: this.getMemoryUsage(),
      memoryBudgetExceeded: this.isMemoryBudgetExceeded(),
    };
  }
}

/**
 * Performance report structure
 */
export interface PerformanceReport {
  totalMetrics: number;
  uniqueMetrics: number;
  summary: Array<{
    name: string;
    count: number;
    average: number;
    min: number;
    max: number;
    budgetViolations: number;
    violationRate: number;
  }>;
  memoryUsage: number | null;
  memoryBudgetExceeded: boolean;
}

/**
 * Global performance monitor instance
 */
export const globalPerformanceMonitor = new PerformanceMonitor();

/**
 * Decorator for measuring method performance
 */
export function Measure(name?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const measureName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      globalPerformanceMonitor.startMeasure(measureName);
      try {
        const result = originalMethod.apply(this, args);

        // Handle async methods
        if (result instanceof Promise) {
          return result.finally(() => {
            globalPerformanceMonitor.endMeasure(measureName);
          });
        }

        globalPerformanceMonitor.endMeasure(measureName);
        return result;
      } catch (error) {
        globalPerformanceMonitor.endMeasure(measureName);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Helper to measure async operations
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  globalPerformanceMonitor.startMeasure(name);
  try {
    const result = await fn();
    globalPerformanceMonitor.endMeasure(name, metadata);
    return result;
  } catch (error) {
    globalPerformanceMonitor.endMeasure(name, { ...metadata, error: true });
    throw error;
  }
}

/**
 * Helper to measure synchronous operations
 */
export function measureSync<T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, unknown>
): T {
  globalPerformanceMonitor.startMeasure(name);
  try {
    const result = fn();
    globalPerformanceMonitor.endMeasure(name, metadata);
    return result;
  } catch (error) {
    globalPerformanceMonitor.endMeasure(name, { ...metadata, error: true });
    throw error;
  }
}

