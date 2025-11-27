import { Injectable, inject } from '@angular/core';
import { LoggingService } from './logging.service';

/**
 * Web Vitals Metrics
 */
export interface WebVitalsMetrics {
  /** First Contentful Paint - Time to first contentful paint */
  fcp?: number;
  /** Largest Contentful Paint - Time to largest contentful paint */
  lcp?: number;
  /** First Input Delay - Time from first interaction to response */
  fid?: number;
  /** Cumulative Layout Shift - Visual stability metric */
  cls?: number;
  /** Time to First Byte - Server response time */
  ttfb?: number;
  /** Total Blocking Time - Main thread blocking time */
  tbt?: number;
  /** Speed Index - Visual completeness metric */
  si?: number;
}

/**
 * Web Vitals Service
 * 
 * Monitors and reports Core Web Vitals and other performance metrics.
 * Integrates with Google Analytics or other analytics services.
 * 
 * @example
 * ```typescript
 * const webVitals = inject(WebVitalsService);
 * 
 * // Metrics are automatically collected
 * webVitals.getMetrics().subscribe(metrics => {
 *   console.log('Web Vitals:', metrics);
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class WebVitalsService {
  private readonly logger = inject(LoggingService);
  private metrics: WebVitalsMetrics = {};
  private observers: PerformanceObserver[] = [];

  /**
   * Initialize Web Vitals monitoring
   */
  initialize(): void {
    if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
      this.logger.warn('Web Vitals monitoring not supported in this environment', 'WebVitalsService');
      return;
    }

    this.observePaintMetrics();
    this.observeLayoutShift();
    this.observeNavigationTiming();
    
    this.logger.info('Web Vitals monitoring initialized', 'WebVitalsService');
  }

  /**
   * Get current Web Vitals metrics
   */
  getMetrics(): WebVitalsMetrics {
    return { ...this.metrics };
  }

  /**
   * Observe paint metrics (FCP, LCP)
   */
  private observePaintMetrics(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint') {
            const paintEntry = entry as PerformancePaintTiming;
            
            if (paintEntry.name === 'first-contentful-paint') {
              this.metrics.fcp = Math.round(paintEntry.startTime);
              this.logMetric('FCP', this.metrics.fcp);
            }
          }

          if (entry.entryType === 'largest-contentful-paint') {
            const lcpEntry = entry as PerformanceEntry & { renderTime?: number; loadTime?: number };
            const lcpValue = lcpEntry.renderTime || lcpEntry.loadTime || entry.startTime;
            this.metrics.lcp = Math.round(lcpValue);
            this.logMetric('LCP', this.metrics.lcp);
          }
        }
      });

      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
      this.observers.push(observer);
    } catch (error) {
      this.logger.warn('Failed to observe paint metrics', 'WebVitalsService', { error });
    }
  }

  /**
   * Observe layout shift (CLS)
   */
  private observeLayoutShift(): void {
    try {
      let clsValue = 0;
      let clsEntries: PerformanceEntry[] = [];

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            const layoutShiftEntry = entry as PerformanceEntry & { value?: number };
            clsValue += layoutShiftEntry.value || 0;
            clsEntries.push(entry);
          }
        }

        this.metrics.cls = Math.round(clsValue * 1000) / 1000;
        this.logMetric('CLS', this.metrics.cls);
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (error) {
      this.logger.warn('Failed to observe layout shift', 'WebVitalsService', { error });
    }
  }

  /**
   * Observe navigation timing (TTFB, TBT)
   */
  private observeNavigationTiming(): void {
    try {
      if (typeof performance.getEntriesByType === 'function') {
        const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        
        if (navigationEntries.length > 0) {
          const nav = navigationEntries[0];
          if (!nav) return;
          
          // Time to First Byte
          if (nav.responseStart !== undefined && nav.requestStart !== undefined) {
            this.metrics.ttfb = Math.round(nav.responseStart - nav.requestStart);
            this.logMetric('TTFB', this.metrics.ttfb);
          }

          // Total Blocking Time (approximation)
          // This is a simplified calculation - full TBT requires more complex analysis
          if (nav.domInteractive !== undefined && nav.domContentLoadedEventEnd !== undefined) {
            const blockingTime = nav.domInteractive - nav.domContentLoadedEventEnd;
            if (blockingTime > 0) {
              this.metrics.tbt = Math.round(blockingTime);
              this.logMetric('TBT', this.metrics.tbt);
            }
          }
        }
      }
    } catch (error) {
      this.logger.warn('Failed to observe navigation timing', 'WebVitalsService', { error });
    }
  }

  /**
   * Log a metric
   */
  private logMetric(name: string, value: number): void {
    this.logger.debug(`Web Vital ${name}: ${value}`, 'WebVitalsService', { metric: name, value });
    
    // Send to analytics if configured
    this.sendToAnalytics(name, value);
  }

  /**
   * Send metrics to analytics service
   */
  private sendToAnalytics(name: string, value: number): void {
    // Integration with Google Analytics or other analytics services
    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', name, {
        event_category: 'Web Vitals',
        value: Math.round(value),
        non_interaction: true
      });
    }
  }

  /**
   * Cleanup observers
   */
  ngOnDestroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

