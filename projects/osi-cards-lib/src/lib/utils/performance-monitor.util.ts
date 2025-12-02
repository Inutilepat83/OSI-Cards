/**
 * Performance Monitoring Utilities
 * Provides instrumentation for tracking component performance
 */

export interface PerformanceMark {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface PerformanceReport {
  totalMarks: number;
  averageDuration: number;
  maxDuration: number;
  minDuration: number;
  marks: PerformanceMark[];
}

/**
 * Performance Monitor for tracking component lifecycle and render times
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private marks = new Map<string, PerformanceMark>();
  private enabled = false;

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Enable performance monitoring
   */
  enable(): void {
    this.enabled = true;
    console.log('[PerformanceMonitor] Enabled');
  }

  /**
   * Disable performance monitoring
   */
  disable(): void {
    this.enabled = false;
    console.log('[PerformanceMonitor] Disabled');
  }

  /**
   * Check if monitoring is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Start a performance mark
   */
  start(name: string, metadata?: Record<string, unknown>): void {
    if (!this.enabled) return;

    this.marks.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  /**
   * End a performance mark and return duration
   */
  end(name: string): number | undefined {
    if (!this.enabled) return undefined;

    const mark = this.marks.get(name);
    if (!mark) {
      console.warn(`[PerformanceMonitor] Mark "${name}" not found`);
      return undefined;
    }

    const endTime = performance.now();
    mark.endTime = endTime;
    mark.duration = endTime - mark.startTime;

    // Log slow operations
    if (mark.duration > 16) { // More than 1 frame at 60fps
      console.warn(`[PerformanceMonitor] Slow operation: ${name} took ${mark.duration.toFixed(2)}ms`);
    }

    return mark.duration;
  }

  /**
   * Measure a synchronous function
   */
  measure<T>(name: string, fn: () => T): T {
    this.start(name);
    const result = fn();
    this.end(name);
    return result;
  }

  /**
   * Measure an async function
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(name);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * Get all marks
   */
  getMarks(): PerformanceMark[] {
    return Array.from(this.marks.values());
  }

  /**
   * Get marks by prefix
   */
  getMarksByPrefix(prefix: string): PerformanceMark[] {
    return this.getMarks().filter(mark => mark.name.startsWith(prefix));
  }

  /**
   * Generate performance report
   */
  getReport(prefix?: string): PerformanceReport {
    const marks = prefix ? this.getMarksByPrefix(prefix) : this.getMarks();
    const completedMarks = marks.filter(m => m.duration !== undefined);

    if (completedMarks.length === 0) {
      return {
        totalMarks: 0,
        averageDuration: 0,
        maxDuration: 0,
        minDuration: 0,
        marks: [],
      };
    }

    const durations = completedMarks.map(m => m.duration!);

    return {
      totalMarks: completedMarks.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      marks: completedMarks,
    };
  }

  /**
   * Log performance report to console
   */
  logReport(prefix?: string): void {
    const report = this.getReport(prefix);

    console.group('[PerformanceMonitor] Report');
    console.log(`Total marks: ${report.totalMarks}`);
    console.log(`Average duration: ${report.averageDuration.toFixed(2)}ms`);
    console.log(`Max duration: ${report.maxDuration.toFixed(2)}ms`);
    console.log(`Min duration: ${report.minDuration.toFixed(2)}ms`);

    if (report.marks.length > 0) {
      console.table(
        report.marks.map(m => ({
          name: m.name,
          duration: m.duration?.toFixed(2) + 'ms',
          metadata: JSON.stringify(m.metadata),
        }))
      );
    }

    console.groupEnd();
  }

  /**
   * Clear all marks
   */
  clear(): void {
    this.marks.clear();
  }

  /**
   * Export marks as JSON
   */
  exportJSON(): string {
    return JSON.stringify(this.getMarks(), null, 2);
  }
}

/**
 * Get the global performance monitor instance
 */
export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * Decorator for measuring method execution time
 */
export function Measure(name?: string) {
  return function (
    _target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const measureName = name || propertyKey;

    descriptor.value = function (...args: unknown[]) {
      return performanceMonitor.measure(measureName, () =>
        originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}

/**
 * Decorator for measuring async method execution time
 */
export function MeasureAsync(name?: string) {
  return function (
    _target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const measureName = name || propertyKey;

    descriptor.value = async function (...args: unknown[]) {
      return performanceMonitor.measureAsync(measureName, () =>
        originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}

/**
 * Component render tracker
 */
export class ComponentRenderTracker {
  private renderCounts = new Map<string, number>();
  private lastRenderTimes = new Map<string, number>();

  /**
   * Track a component render
   */
  trackRender(componentName: string): void {
    const count = (this.renderCounts.get(componentName) || 0) + 1;
    this.renderCounts.set(componentName, count);
    this.lastRenderTimes.set(componentName, performance.now());
  }

  /**
   * Get render count for a component
   */
  getRenderCount(componentName: string): number {
    return this.renderCounts.get(componentName) || 0;
  }

  /**
   * Get all render counts
   */
  getAllRenderCounts(): Map<string, number> {
    return new Map(this.renderCounts);
  }

  /**
   * Check for excessive renders
   */
  checkExcessiveRenders(threshold = 10): string[] {
    const excessive: string[] = [];
    for (const [name, count] of this.renderCounts) {
      if (count > threshold) {
        excessive.push(`${name}: ${count} renders`);
      }
    }
    return excessive;
  }

  /**
   * Reset tracking
   */
  reset(): void {
    this.renderCounts.clear();
    this.lastRenderTimes.clear();
  }
}

/**
 * Global render tracker instance
 */
export const renderTracker = new ComponentRenderTracker();

/**
 * Simple FPS monitor
 */
export class FPSMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 0;
  private running = false;
  private rafId: number | null = null;

  /**
   * Start FPS monitoring
   */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.frame();
  }

  /**
   * Stop FPS monitoring
   */
  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fps;
  }

  private frame(): void {
    this.frameCount++;
    const now = performance.now();
    const elapsed = now - this.lastTime;

    if (elapsed >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastTime = now;
    }

    if (this.running) {
      this.rafId = requestAnimationFrame(() => this.frame());
    }
  }
}

/**
 * Global FPS monitor instance
 */
export const fpsMonitor = new FPSMonitor();

/**
 * Memory usage tracker (if available)
 */
export function getMemoryUsage(): { used: number; total: number; limit: number } | null {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
    };
  }
  return null;
}

/**
 * Long task observer (for detecting janky frames)
 */
export function observeLongTasks(
  callback: (duration: number, name: string) => void,
  threshold = 50
): () => void {
  if (!('PerformanceObserver' in window)) {
    console.warn('[PerformanceMonitor] PerformanceObserver not supported');
    return () => {};
  }

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > threshold) {
        callback(entry.duration, entry.name);
      }
    }
  });

  try {
    observer.observe({ entryTypes: ['longtask'] });
  } catch {
    console.warn('[PerformanceMonitor] Long task observation not supported');
    return () => {};
  }

  return () => observer.disconnect();
}



