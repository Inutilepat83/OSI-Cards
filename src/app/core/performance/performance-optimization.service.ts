import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PerformanceMonitor, LazyLoader } from './bundle-optimizer';
import { LoggerService } from '../services/enhanced-logging.service';

@Injectable({
  providedIn: 'root',
})
export class PerformanceOptimizationService {
  private performanceMetrics$ = new BehaviorSubject<PerformanceMetrics | null>(null);
  private readonly logger = this.loggerService.createChildLogger('Performance');

  constructor(private loggerService: LoggerService) {
    this.initializePerformanceMonitoring();
  }

  getPerformanceMetrics(): Observable<PerformanceMetrics | null> {
    return this.performanceMetrics$.asObservable();
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Start measuring app initialization
    PerformanceMonitor.startMeasurement('app-init');

    // Monitor bundle loading
    PerformanceMonitor.measureBundleLoad();

    // Preload critical modules when idle
    LazyLoader.preloadCriticalModules();

    // Collect initial metrics after app loads
    setTimeout(() => {
      this.collectMetrics();
    }, 2000);

    // Set up periodic metric collection
    setInterval(() => {
      this.collectMetrics();
    }, 30000); // Every 30 seconds
  }

  /**
   * Collect current performance metrics
   */
  private collectMetrics(): void {
    try {
      const navigationTiming = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      const bundleInfo = PerformanceMonitor.getBundleInfo();

      const metrics: PerformanceMetrics = {
        // Timing metrics
        domContentLoaded:
          navigationTiming?.domContentLoadedEventEnd -
            navigationTiming?.domContentLoadedEventStart || 0,
        firstContentfulPaint: this.getFirstContentfulPaint(),
        largestContentfulPaint: this.getLargestContentfulPaint(),
        timeToInteractive: this.getTimeToInteractive(),
        totalLoadTime: navigationTiming?.loadEventEnd - navigationTiming?.fetchStart || 0,

        // Bundle metrics
        bundleSize: this.estimateBundleSize(),
        chunkCount: bundleInfo.scriptCount,

        // Memory metrics
        usedJSHeapSize: this.getMemoryUsage(),

        // Performance scores
        performanceScore: this.calculatePerformanceScore(),

        timestamp: new Date(),
      };

      this.performanceMetrics$.next(metrics);
      this.logger.debug('Performance metrics collected', metrics);
    } catch (error) {
      this.logger.error('Failed to collect performance metrics', error);
    }
  }

  /**
   * Get First Contentful Paint timing
   */
  private getFirstContentfulPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcpEntry?.startTime || 0;
  }

  /**
   * Get Largest Contentful Paint timing
   */
  private getLargestContentfulPaint(): number {
    return new Promise<number>(resolve => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
          observer.disconnect();
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });

        // Fallback timeout
        setTimeout(() => resolve(0), 1000);
      } else {
        resolve(0);
      }
    }) as any; // Type assertion for immediate return
  }

  /**
   * Estimate Time to Interactive
   */
  private getTimeToInteractive(): number {
    // Simplified TTI calculation
    const navigationTiming = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;
    return navigationTiming?.domInteractive - navigationTiming?.fetchStart || 0;
  }

  /**
   * Estimate bundle size from loaded resources
   */
  private estimateBundleSize(): number {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));

    // Rough estimation based on resource count
    // In production, you'd get actual sizes from ResourceTiming API
    return (scripts.length * 100 + styles.length * 20) * 1024; // KB to bytes
  }

  /**
   * Get memory usage if available
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Calculate a performance score (0-100)
   */
  private calculatePerformanceScore(): number {
    const fcp = this.getFirstContentfulPaint();
    const bundleSize = this.estimateBundleSize();

    let score = 100;

    // Deduct points for slow FCP
    if (fcp > 3000) score -= 30;
    else if (fcp > 1500) score -= 15;

    // Deduct points for large bundle
    if (bundleSize > 1000000)
      score -= 20; // > 1MB
    else if (bundleSize > 500000) score -= 10; // > 500KB

    return Math.max(0, score);
  }

  /**
   * Optimize performance by cleaning up resources
   */
  optimizePerformance(): void {
    this.logger.info('Optimizing performance...');

    // Clear lazy loader cache to free memory
    LazyLoader.clearCache();

    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }

    // Clear old performance entries
    if (performance.clearResourceTimings) {
      performance.clearResourceTimings();
    }

    this.logger.info('Performance optimization completed');
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): OptimizationRecommendation[] {
    const metrics = this.performanceMetrics$.value;
    if (!metrics) return [];

    const recommendations: OptimizationRecommendation[] = [];

    if (metrics.firstContentfulPaint > 2500) {
      recommendations.push({
        type: 'critical',
        title: 'Slow First Contentful Paint',
        description: 'FCP is over 2.5s, consider optimizing critical resources',
        actions: [
          'Minimize critical CSS',
          'Optimize fonts loading',
          'Remove render-blocking resources',
        ],
      });
    }

    if (metrics.bundleSize > 800000) {
      recommendations.push({
        type: 'warning',
        title: 'Large Bundle Size',
        description: 'Bundle is over 800KB, consider code splitting',
        actions: ['Implement lazy loading', 'Tree-shake unused code', 'Optimize dependencies'],
      });
    }

    if (metrics.usedJSHeapSize > 50000000) {
      // 50MB
      recommendations.push({
        type: 'info',
        title: 'High Memory Usage',
        description: 'Memory usage is high, consider optimization',
        actions: [
          'Check for memory leaks',
          'Optimize data structures',
          'Clear caches periodically',
        ],
      });
    }

    return recommendations;
  }
}

export interface PerformanceMetrics {
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  totalLoadTime: number;
  bundleSize: number;
  chunkCount: number;
  usedJSHeapSize: number;
  performanceScore: number;
  timestamp: Date;
}

export interface OptimizationRecommendation {
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  actions: string[];
}
