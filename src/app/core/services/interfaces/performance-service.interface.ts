import { Observable } from 'rxjs';
import { PerformanceMetric } from '../performance.service';

/**
 * Interface for performance monitoring service
 * Enables better testability and abstraction
 */
export interface IPerformanceService {
  /**
   * Measure execution time of a function
   */
  measure<T>(name: string, fn: () => T, metadata?: Record<string, unknown>): T;

  /**
   * Measure execution time of an async function
   */
  measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T>;

  /**
   * Start a performance mark
   */
  mark(name: string): void;

  /**
   * Measure between two marks
   */
  measureBetween(startMark: string, endMark: string, name: string): void;

  /**
   * Record a custom metric
   */
  recordMetric(name: string, duration: number, metadata?: Record<string, unknown>): void;

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[];

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[];

  /**
   * Get average duration for a metric name
   */
  getAverageDuration(name: string): number;

  /**
   * Clear all metrics
   */
  clearMetrics(): void;

  /**
   * Get performance summary
   */
  getSummary(): {
    totalMetrics: number;
    averageDuration: number;
    slowestOperations: PerformanceMetric[];
  };
}

