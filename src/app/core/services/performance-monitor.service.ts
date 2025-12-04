/**
 * Performance Monitoring Service
 *
 * Tracks and reports application performance metrics.
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class MyComponent {
 *   private perfMonitor = inject(PerformanceMonitorService);
 *
 *   loadData() {
 *     const mark = this.perfMonitor.startMeasure('load-data');
 *     // ... load data ...
 *     mark.end();
 *   }
 * }
 * ```
 */

import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PerformanceMark {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  marks: PerformanceMark[];
  averages: Record<string, number>;
  p95: Record<string, number>;
  p99: Record<string, number>;
}

@Injectable({
  providedIn: 'root',
})
export class PerformanceMonitorService {
  private marks = new BehaviorSubject<PerformanceMark[]>([]);
  private maxMarks = 1000;

  marks$: Observable<PerformanceMark[]> = this.marks.asObservable();

  /**
   * Start performance measurement
   */
  startMeasure(
    name: string,
    metadata?: Record<string, any>
  ): {
    end: () => number;
    cancel: () => void;
  } {
    const mark: PerformanceMark = {
      name,
      startTime: performance.now(),
      metadata,
    };

    return {
      end: () => {
        mark.endTime = performance.now();
        mark.duration = mark.endTime - mark.startTime;

        // Store mark
        const currentMarks = this.marks.value;
        currentMarks.push(mark);

        // Limit stored marks
        if (currentMarks.length > this.maxMarks) {
          currentMarks.shift();
        }

        this.marks.next(currentMarks);

        return mark.duration;
      },
      cancel: () => {
        // Mark cancelled, don't store
      },
    };
  }

  /**
   * Measure function execution time
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const mark = this.startMeasure(name, metadata);
    try {
      const result = await fn();
      mark.end();
      return result;
    } catch (error) {
      mark.cancel();
      throw error;
    }
  }

  /**
   * Measure synchronous function
   */
  measureSync<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    const mark = this.startMeasure(name, metadata);
    try {
      const result = fn();
      mark.end();
      return result;
    } catch (error) {
      mark.cancel();
      throw error;
    }
  }

  /**
   * Get all marks
   */
  getMarks(name?: string): PerformanceMark[] {
    const allMarks = this.marks.value;
    if (name) {
      return allMarks.filter((m) => m.name === name);
    }
    return [...allMarks];
  }

  /**
   * Get average duration for a mark
   */
  getAverage(name: string): number {
    const marks = this.getMarks(name).filter((m) => m.duration !== undefined);
    if (marks.length === 0) {
      return 0;
    }

    const total = marks.reduce((sum, m) => sum + (m.duration || 0), 0);
    return total / marks.length;
  }

  /**
   * Get percentile duration
   */
  getPercentile(name: string, percentile: number): number {
    const marks = this.getMarks(name)
      .filter((m) => m.duration !== undefined)
      .map((m) => m.duration!)
      .sort((a, b) => a - b);

    if (marks.length === 0) {
      return 0;
    }

    const index = Math.ceil((percentile / 100) * marks.length) - 1;
    return marks[index] || 0;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const allMarks = this.marks.value;
    const markNames = [...new Set(allMarks.map((m) => m.name))];

    const averages: Record<string, number> = {};
    const p95: Record<string, number> = {};
    const p99: Record<string, number> = {};

    markNames.forEach((name) => {
      averages[name] = this.getAverage(name);
      p95[name] = this.getPercentile(name, 95);
      p99[name] = this.getPercentile(name, 99);
    });

    return {
      marks: allMarks,
      averages,
      p95,
      p99,
    };
  }

  /**
   * Clear all marks
   */
  clear(): void {
    this.marks.next([]);
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    const metrics = this.getMetrics();
    return JSON.stringify(metrics, null, 2);
  }

  /**
   * Download metrics
   */
  downloadMetrics(): void {
    const json = this.exportMetrics();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-metrics-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Get slow operations (> threshold)
   */
  getSlowOperations(thresholdMs = 1000): PerformanceMark[] {
    return this.marks.value.filter((m) => (m.duration || 0) > thresholdMs);
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    const metrics = this.getMetrics();

    console.group('📊 Performance Summary');
    Object.keys(metrics.averages).forEach((name) => {
      console.log(`${name}:`);
      console.log(`  Average: ${(metrics.averages[name] || 0).toFixed(2)}ms`);
      console.log(`  P95: ${(metrics.p95[name] || 0).toFixed(2)}ms`);
      console.log(`  P99: ${(metrics.p99[name] || 0).toFixed(2)}ms`);
    });
    console.groupEnd();
  }
}
