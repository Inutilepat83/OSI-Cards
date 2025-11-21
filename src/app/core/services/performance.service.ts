import { Injectable, isDevMode, OnDestroy } from '@angular/core';

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Performance budgets configuration
 */
export interface PerformanceBudget {
  name: string;
  type: 'duration' | 'size' | 'count';
  threshold: number;
  warning: number;
  error: number;
}

/**
 * Consolidated Performance Service
 * Merges functionality from PerformanceService, PerformanceMonitorService, and PerformanceBudgetService
 */
@Injectable({
  providedIn: 'root'
})
export class PerformanceService implements OnDestroy {
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 100;
  private observers: PerformanceObserver[] = [];
  private budgetCheckInterval?: number;

  // Performance budgets
  private readonly budgets: PerformanceBudget[] = [
    // Loading performance budgets
    { name: 'loadCards', type: 'duration', threshold: 500, warning: 1000, error: 2000 },
    { name: 'loadTemplate', type: 'duration', threshold: 300, warning: 600, error: 1200 },
    { name: 'searchCards', type: 'duration', threshold: 100, warning: 300, error: 500 },
    
    // Rendering performance budgets
    { name: 'cardRender', type: 'duration', threshold: 50, warning: 100, error: 200 },
    { name: 'sectionRender', type: 'duration', threshold: 20, warning: 50, error: 100 },
    { name: 'layoutCalculation', type: 'duration', threshold: 100, warning: 200, error: 400 },
    
    // Size budgets
    { name: 'cardSize', type: 'size', threshold: 5000, warning: 10000, error: 20000 },
    { name: 'totalCardSize', type: 'size', threshold: 50000, warning: 100000, error: 200000 },
    
    // Count budgets
    { name: 'cardCount', type: 'count', threshold: 20, warning: 50, error: 100 },
    { name: 'sectionCount', type: 'count', threshold: 10, warning: 20, error: 50 }
  ];

  private violations: {
    budget: string;
    actual: number;
    threshold: number;
    severity: 'warning' | 'error';
    timestamp: number;
  }[] = [];

  /**
   * Measure execution time of a function
   */
  measure<T>(name: string, fn: () => T, metadata?: Record<string, unknown>): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Measure execution time of an async function
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Start a performance mark
   */
  mark(name: string): void {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
    }
  }

  /**
   * Measure between two marks
   */
  measureBetween(startMark: string, endMark: string, name: string): void {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        if (measure) {
          this.recordMetric(name, measure.duration);
        }
      } catch {
        // Mark might not exist, ignore
      }
    }
  }

  /**
   * Record a custom metric
   */
  recordMetric(name: string, duration: number, metadata?: Record<string, unknown>): void {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    // Log slow operations in development
    if (duration > 100 && isDevMode()) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`, metadata);
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Get average duration for a metric name
   */
  getAverageDuration(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) {
      return 0;
    }
    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get performance summary (includes budget violations)
   */
  getSummary(): {
    totalMetrics: number;
    averageDuration: number;
    slowestOperations: PerformanceMetric[];
    violations?: {
      total: number;
      warnings: number;
      errors: number;
      recent: number;
    };
  } {
    if (this.metrics.length === 0) {
      return {
        totalMetrics: 0,
        averageDuration: 0,
        slowestOperations: [],
        violations: {
          total: this.violations.length,
          warnings: this.violations.filter(v => v.severity === 'warning').length,
          errors: this.violations.filter(v => v.severity === 'error').length,
          recent: this.getRecentViolations(5).length
        }
      };
    }

    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const averageDuration = totalDuration / this.metrics.length;

    const slowestOperations = [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      totalMetrics: this.metrics.length,
      averageDuration,
      slowestOperations,
      violations: {
        total: this.violations.length,
        warnings: this.violations.filter(v => v.severity === 'warning').length,
        errors: this.violations.filter(v => v.severity === 'error').length,
        recent: this.getRecentViolations(5).length
      }
    };
  }

  // ===== Web Vitals Tracking (from PerformanceMonitorService) =====

  /**
   * Initialize Web Vitals tracking
   * Should be called during app initialization
   */
  initialize(): void {
    if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
      return;
    }

    this.trackLCP(); // Largest Contentful Paint
    this.trackFID(); // First Input Delay
    this.trackCLS(); // Cumulative Layout Shift
    this.trackFCP(); // First Contentful Paint
    this.trackTTI(); // Time to Interactive
    this.trackMemory(); // Memory usage (if available)

    // Setup budget monitoring
    if (isDevMode()) {
      this.budgetCheckInterval = window.setInterval(() => {
        this.checkBudgets();
      }, 5000); // Check every 5 seconds in dev mode
    }
  }

  /**
   * Track Largest Contentful Paint (LCP)
   */
  private trackLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        const lcp = lastEntry.renderTime || lastEntry.loadTime;
        
        this.recordMetric('LCP', lcp, {
          element: lastEntry.element?.tagName || 'unknown',
          url: lastEntry.url || 'unknown'
        });

        if (isDevMode()) {
          console.log(`LCP: ${lcp.toFixed(2)}ms`);
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    } catch (error) {
      if (isDevMode()) {
        console.warn('LCP tracking not supported:', error);
      }
    }
  }

  /**
   * Track First Input Delay (FID)
   */
  private trackFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          
          this.recordMetric('FID', fid, {
            eventType: entry.name,
            target: entry.target?.tagName || 'unknown'
          });

          if (isDevMode()) {
            console.log(`FID: ${fid.toFixed(2)}ms`);
          }
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    } catch (error) {
      if (isDevMode()) {
        console.warn('FID tracking not supported:', error);
      }
    }
  }

  /**
   * Track Cumulative Layout Shift (CLS)
   */
  private trackCLS(): void {
    try {
      let clsValue = 0;
      const clsEntries: any[] = [];

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            clsEntries.push(entry);
          }
        });

        if (clsEntries.length > 0) {
          this.recordMetric('CLS', clsValue, {
            entryCount: clsEntries.length
          });

          if (isDevMode()) {
            console.log(`CLS: ${clsValue.toFixed(4)}`);
          }
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (error) {
      if (isDevMode()) {
        console.warn('CLS tracking not supported:', error);
      }
    }
  }

  /**
   * Track First Contentful Paint (FCP)
   */
  private trackFCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const fcp = entry.renderTime || entry.loadTime;
          
          this.recordMetric('FCP', fcp, {
            name: entry.name
          });

          if (isDevMode()) {
            console.log(`FCP: ${fcp.toFixed(2)}ms`);
          }
        });
      });

      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    } catch (error) {
      if (isDevMode()) {
        console.warn('FCP tracking not supported:', error);
      }
    }
  }

  /**
   * Track Time to Interactive (TTI)
   */
  private trackTTI(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (perfData) {
          const tti = perfData.domInteractive - perfData.fetchStart;
          
          this.recordMetric('TTI', tti, {
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
            loadComplete: perfData.loadEventEnd - perfData.fetchStart
          });

          if (isDevMode()) {
            console.log(`TTI: ${tti.toFixed(2)}ms`);
          }
        }
      }, 0);
    });
  }

  /**
   * Track memory usage (Chrome only)
   */
  private trackMemory(): void {
    if (typeof (performance as any).memory === 'undefined') {
      return;
    }

    const checkMemory = () => {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1048576;
      const totalMB = memory.totalJSHeapSize / 1048576;
      const limitMB = memory.jsHeapSizeLimit / 1048576;

      this.recordMetric('memory', usedMB, {
        total: totalMB,
        limit: limitMB,
        percentage: (usedMB / limitMB) * 100
      });

      if (usedMB > limitMB * 0.9) {
        console.warn(`High memory usage: ${usedMB.toFixed(2)}MB / ${limitMB.toFixed(2)}MB`);
      }
    };

    setInterval(checkMemory, 30000); // Every 30 seconds
    checkMemory(); // Initial check
  }

  // ===== Budget Monitoring (from PerformanceBudgetService) =====

  /**
   * Check performance metrics against budgets
   */
  checkBudgets(): void {
    // Group metrics by name
    const metricsByName = new Map<string, number[]>();
    this.metrics.forEach(metric => {
      if (!metricsByName.has(metric.name)) {
        metricsByName.set(metric.name, []);
      }
      metricsByName.get(metric.name)!.push(metric.duration);
    });

    // Check each budget
    this.budgets.forEach(budget => {
      const metricValues = metricsByName.get(budget.name) || [];
      
      if (metricValues.length === 0) {
        return;
      }

      let value: number;
      
      if (budget.type === 'duration') {
        value = metricValues.reduce((sum, v) => sum + v, 0) / metricValues.length;
      } else {
        value = metricValues[metricValues.length - 1];
      }

      if (value > budget.error) {
        this.recordViolation(budget.name, value, budget.error, 'error');
      } else if (value > budget.warning) {
        this.recordViolation(budget.name, value, budget.warning, 'warning');
      }
    });
  }

  /**
   * Record a budget violation
   */
  private recordViolation(budgetName: string, actual: number, threshold: number, severity: 'warning' | 'error'): void {
    const recentViolation = this.violations.find(
      v => v.budget === budgetName && 
           Date.now() - v.timestamp < 60000
    );

    if (recentViolation) {
      return;
    }

    const violation = {
      budget: budgetName,
      actual,
      threshold,
      severity,
      timestamp: Date.now()
    };

    this.violations.push(violation);

    const message = `Performance budget violation: ${budgetName} ${severity.toUpperCase()}. ` +
                   `Actual: ${actual.toFixed(2)}ms, Threshold: ${threshold}ms`;
    
    if (severity === 'error') {
      console.error(message);
    } else {
      console.warn(message);
    }

    if (this.violations.length > 100) {
      this.violations = this.violations.slice(-100);
    }
  }

  /**
   * Get budget violations
   */
  getViolations(): typeof this.violations {
    return [...this.violations];
  }

  /**
   * Get recent violations (last N minutes)
   */
  getRecentViolations(minutes = 5): typeof this.violations {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.violations.filter(v => v.timestamp > cutoff);
  }

  /**
   * Clear all violations
   */
  clearViolations(): void {
    this.violations = [];
  }

  /**
   * Get budget configuration
   */
  getBudgets(): PerformanceBudget[] {
    return [...this.budgets];
  }

  /**
   * Add a custom budget
   */
  addBudget(budget: PerformanceBudget): void {
    this.budgets.push(budget);
  }

  /**
   * Check a specific metric against its budget
   */
  checkMetric(name: string, value: number, metadata?: Record<string, unknown>): 'ok' | 'warning' | 'error' {
    const budget = this.budgets.find(b => b.name === name);
    if (!budget) {
      return 'ok';
    }

    if (metadata && isDevMode()) {
      console.debug(`Budget metadata for ${name}:`, metadata);
    }

    if (value > budget.error) {
      this.recordViolation(name, value, budget.error, 'error');
      return 'error';
    } else if (value > budget.warning) {
      this.recordViolation(name, value, budget.warning, 'warning');
      return 'warning';
    }

    return 'ok';
  }

  /**
   * Clean up observers and intervals
   */
  ngOnDestroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    if (this.budgetCheckInterval) {
      clearInterval(this.budgetCheckInterval);
    }
  }
}

