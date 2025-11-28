import { Injectable, inject } from '@angular/core';
import { AppConfigService } from './app-config.service';
import { LoggingService } from './logging.service';

/**
 * Development Tools Service
 * 
 * Provides enhanced debugging capabilities for development mode.
 * Includes performance monitoring, state inspection, and debugging utilities.
 * 
 * Features:
 * - Performance metrics tracking
 * - Component tree inspection
 * - State debugging
 * - Network request monitoring
 * - Memory usage tracking
 * 
 * @example
 * ```typescript
 * const devTools = inject(DevToolsService);
 * 
 * // Enable performance monitoring
 * devTools.enablePerformanceMonitoring();
 * 
 * // Get performance metrics
 * const metrics = devTools.getPerformanceMetrics();
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class DevToolsService {
  private readonly appConfig = inject(AppConfigService);
  private readonly logger = inject(LoggingService);
  
  private performanceMetrics: Map<string, number> = new Map();
  private isPerformanceMonitoringEnabled = false;
  private memoryUsageInterval?: ReturnType<typeof setInterval>;

  /**
   * Check if development mode is enabled
   */
  get isDevelopmentMode(): boolean {
    return !this.appConfig.isProduction && this.appConfig.LOGGING.ENABLE_DEBUG;
  }

  /**
   * Enable performance monitoring
   */
  enablePerformanceMonitoring(): void {
    if (!this.isDevelopmentMode) {
      this.logger.warn('Performance monitoring only available in development mode', 'DevToolsService');
      return;
    }

    this.isPerformanceMonitoringEnabled = true;
    this.startMemoryMonitoring();
    this.logger.info('Performance monitoring enabled', 'DevToolsService');
  }

  /**
   * Disable performance monitoring
   */
  disablePerformanceMonitoring(): void {
    this.isPerformanceMonitoringEnabled = false;
    this.stopMemoryMonitoring();
    this.performanceMetrics.clear();
    this.logger.info('Performance monitoring disabled', 'DevToolsService');
  }

  /**
   * Measure execution time of a function
   */
  measureExecutionTime<T>(label: string, fn: () => T): T {
    if (!this.isPerformanceMonitoringEnabled) {
      return fn();
    }

    const start = performance.now();
    const result = fn();
    const end = performance.now();
    const duration = end - start;

    this.performanceMetrics.set(label, duration);
    this.logger.debug(`Execution time for ${label}: ${duration.toFixed(2)}ms`, 'DevToolsService');

    return result;
  }

  /**
   * Measure execution time of an async function
   */
  async measureExecutionTimeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    if (!this.isPerformanceMonitoringEnabled) {
      return fn();
    }

    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;

    this.performanceMetrics.set(label, duration);
    this.logger.debug(`Execution time for ${label}: ${duration.toFixed(2)}ms`, 'DevToolsService');

    return result;
  }

  /**
   * Get all performance metrics
   */
  getPerformanceMetrics(): Map<string, number> {
    return new Map(this.performanceMetrics);
  }

  /**
   * Clear performance metrics
   */
  clearPerformanceMetrics(): void {
    this.performanceMetrics.clear();
  }

  /**
   * Get memory usage information
   */
  getMemoryUsage(): {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  } {
    if (typeof performance === 'undefined' || !('memory' in performance)) {
      return {};
    }

    const memory = (performance as { memory?: {
      usedJSHeapSize?: number;
      totalJSHeapSize?: number;
      jsHeapSizeLimit?: number;
    } }).memory;

    return {
      usedJSHeapSize: memory?.usedJSHeapSize,
      totalJSHeapSize: memory?.totalJSHeapSize,
      jsHeapSizeLimit: memory?.jsHeapSizeLimit
    };
  }

  /**
   * Start monitoring memory usage
   */
  private startMemoryMonitoring(): void {
    if (this.memoryUsageInterval) {
      return;
    }

    this.memoryUsageInterval = setInterval(() => {
      const memory = this.getMemoryUsage();
      if (memory.usedJSHeapSize) {
        this.logger.debug(
          `Memory usage: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB / ${memory.jsHeapSizeLimit ? (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) : 'N/A'}MB`,
          'DevToolsService'
        );
      }
    }, 10000); // Log every 10 seconds
  }

  /**
   * Stop monitoring memory usage
   */
  private stopMemoryMonitoring(): void {
    if (this.memoryUsageInterval) {
      clearInterval(this.memoryUsageInterval);
      this.memoryUsageInterval = undefined;
    }
  }

  /**
   * Log component tree structure (for debugging)
   */
  logComponentTree(component: unknown, depth = 0): void {
    if (!this.isDevelopmentMode) {
      return;
    }

    const indent = '  '.repeat(depth);
    this.logger.debug(`${indent}Component: ${component?.constructor?.name || 'Unknown'}`, 'DevToolsService');
    
    // Log component properties (be careful not to log sensitive data)
    if (component && typeof component === 'object') {
      const keys = Object.keys(component).filter(key => 
        !key.startsWith('_') && 
        !key.startsWith('ng') &&
        typeof (component as Record<string, unknown>)[key] !== 'function'
      );
      
      if (keys.length > 0) {
        this.logger.debug(`${indent}  Properties: ${keys.join(', ')}`, 'DevToolsService');
      }
    }
  }

  /**
   * Get network request statistics
   */
  getNetworkStats(): {
    totalRequests: number;
    failedRequests: number;
    averageResponseTime: number;
  } {
    // This would integrate with HTTP interceptor to track requests
    // For now, return placeholder
    return {
      totalRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0
    };
  }
}



