import { Injectable, inject, signal, computed, OnDestroy, NgZone } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * Performance metric types
 */
export type MetricType = 'render' | 'load' | 'interaction' | 'paint' | 'layout' | 'memory';

/**
 * Performance metric entry
 */
export interface PerformanceMetric {
  /** Metric name */
  name: string;
  /** Metric type */
  type: MetricType;
  /** Start time (ms) */
  startTime: number;
  /** Duration (ms) */
  duration: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Performance summary
 */
export interface PerformanceSummary {
  /** Average render time */
  avgRenderTime: number;
  /** Average load time */
  avgLoadTime: number;
  /** Total interactions tracked */
  interactionCount: number;
  /** Slowest operation */
  slowestOperation: PerformanceMetric | null;
  /** Memory usage (if available) */
  memoryUsage?: number;
  /** Web Vitals (if available) */
  webVitals?: {
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
  };
}

/**
 * Performance Metrics Service
 *
 * Tracks and reports performance metrics for OSI Cards.
 * Provides insights into render times, load times, and user interactions.
 *
 * @example
 * ```typescript
 * const metrics = inject(PerformanceMetricsService);
 *
 * // Start a measurement
 * const stop = metrics.startMeasure('card-render');
 * // ... render card ...
 * stop();
 *
 * // Get summary
 * const summary = metrics.getSummary();
 * ```
 */
@Injectable({ providedIn: 'root' })
export class PerformanceMetricsService implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly ngZone = inject(NgZone);

  /** All recorded metrics */
  private readonly metrics = signal<PerformanceMetric[]>([]);

  /** Maximum metrics to keep in memory */
  private readonly maxMetrics = 100;

  /** Performance observer */
  private observer: PerformanceObserver | null = null;

  /** Get all metrics */
  readonly allMetrics = computed(() => this.metrics());

  /** Get render metrics */
  readonly renderMetrics = computed(() =>
    this.metrics().filter(m => m.type === 'render')
  );

  /** Get load metrics */
  readonly loadMetrics = computed(() =>
    this.metrics().filter(m => m.type === 'load')
  );

  constructor() {
    this.initPerformanceObserver();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  /**
   * Start a performance measurement
   * Returns a function to stop the measurement
   */
  startMeasure(name: string, type: MetricType = 'render'): () => void {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name,
        type,
        startTime,
        duration
      });
    };
  }

  /**
   * Measure an async operation
   */
  async measureAsync<T>(
    name: string,
    operation: () => Promise<T>,
    type: MetricType = 'load'
  ): Promise<T> {
    const stop = this.startMeasure(name, type);
    try {
      return await operation();
    } finally {
      stop();
    }
  }

  /**
   * Record a metric manually
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.update(current => {
      const updated = [...current, metric];
      // Keep only latest metrics
      if (updated.length > this.maxMetrics) {
        return updated.slice(-this.maxMetrics);
      }
      return updated;
    });
  }

  /**
   * Get performance summary
   */
  getSummary(): PerformanceSummary {
    const all = this.metrics();
    const renders = all.filter(m => m.type === 'render');
    const loads = all.filter(m => m.type === 'load');
    const interactions = all.filter(m => m.type === 'interaction');

    const avgRender = this.average(renders.map(m => m.duration));
    const avgLoad = this.average(loads.map(m => m.duration));
    const slowest = this.findSlowest(all);

    return {
      avgRenderTime: avgRender,
      avgLoadTime: avgLoad,
      interactionCount: interactions.length,
      slowestOperation: slowest,
      memoryUsage: this.getMemoryUsage(),
      webVitals: this.getWebVitals()
    };
  }

  /**
   * Get metrics by type
   */
  getMetricsByType(type: MetricType): PerformanceMetric[] {
    return this.metrics().filter(m => m.type === type);
  }

  /**
   * Get average duration for a metric name
   */
  getAverageDuration(name: string): number {
    const matching = this.metrics().filter(m => m.name === name);
    return this.average(matching.map(m => m.duration));
  }

  /**
   * Get 95th percentile duration for a metric
   */
  getP95Duration(name: string): number {
    const matching = this.metrics().filter(m => m.name === name);
    const durations = matching.map(m => m.duration).sort((a, b) => a - b);
    const index = Math.floor(durations.length * 0.95);
    return durations[index] ?? 0;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.set([]);
  }

  /**
   * Export metrics as JSON
   */
  export(): string {
    return JSON.stringify({
      metrics: this.metrics(),
      summary: this.getSummary(),
      timestamp: Date.now()
    }, null, 2);
  }

  /**
   * Mark a point in time (creates a timestamp marker)
   */
  mark(name: string): void {
    performance.mark(name);
  }

  /**
   * Measure between two marks
   */
  measureBetweenMarks(name: string, startMark: string, endMark: string): void {
    try {
      performance.measure(name, startMark, endMark);
    } catch {
      // Marks may not exist
    }
  }

  /**
   * Get current frame rate
   */
  measureFrameRate(duration = 1000): Promise<number> {
    return new Promise(resolve => {
      let frames = 0;
      const startTime = performance.now();

      const countFrame = () => {
        frames++;
        if (performance.now() - startTime < duration) {
          requestAnimationFrame(countFrame);
        } else {
          const fps = frames / (duration / 1000);
          resolve(Math.round(fps));
        }
      };

      requestAnimationFrame(countFrame);
    });
  }

  /**
   * Initialize performance observer for Web Vitals
   */
  private initPerformanceObserver(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    try {
      this.observer = new PerformanceObserver((list) => {
        this.ngZone.runOutsideAngular(() => {
          for (const entry of list.getEntries()) {
            this.processPerformanceEntry(entry);
          }
        });
      });

      this.observer.observe({
        entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift', 'longtask']
      });
    } catch {
      // Observer not supported
    }
  }

  /**
   * Process a performance entry
   */
  private processPerformanceEntry(entry: PerformanceEntry): void {
    let type: MetricType = 'render';

    if (entry.entryType === 'paint') {
      type = 'paint';
    } else if (entry.entryType === 'layout-shift') {
      type = 'layout';
    }

    this.recordMetric({
      name: entry.name,
      type,
      startTime: entry.startTime,
      duration: entry.duration,
      metadata: {
        entryType: entry.entryType
      }
    });
  }

  /**
   * Get memory usage if available
   */
  private getMemoryUsage(): number | undefined {
    const memory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
    return memory?.usedJSHeapSize;
  }

  /**
   * Get Web Vitals from recorded metrics
   */
  private getWebVitals(): PerformanceSummary['webVitals'] {
    const paints = this.metrics().filter(m => m.type === 'paint');

    const fcp = paints.find(m => m.name === 'first-contentful-paint')?.startTime;
    const lcp = paints.find(m => m.name === 'largest-contentful-paint')?.startTime;

    return {
      fcp,
      lcp
    };
  }

  /**
   * Calculate average of numbers
   */
  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  /**
   * Find slowest operation
   */
  private findSlowest(metrics: PerformanceMetric[]): PerformanceMetric | null {
    if (metrics.length === 0) return null;
    return metrics.reduce((max, current) =>
      current.duration > max.duration ? current : max
    );
  }
}

