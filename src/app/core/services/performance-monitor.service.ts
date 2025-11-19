import { Injectable, inject, isDevMode } from '@angular/core';
import { PerformanceService } from './performance.service';

/**
 * Performance monitor service for tracking Web Vitals and Core Web Vitals
 * Provides comprehensive performance metrics for monitoring and optimization
 */
@Injectable({
  providedIn: 'root'
})
export class PerformanceMonitorService {
  private readonly performanceService = inject(PerformanceService);
  private observers: PerformanceObserver[] = [];

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
  }

  /**
   * Track Largest Contentful Paint (LCP)
   * Measures loading performance - should be < 2.5s
   */
  private trackLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        const lcp = lastEntry.renderTime || lastEntry.loadTime;
        
        this.performanceService.recordMetric('LCP', lcp, {
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
   * Measures interactivity - should be < 100ms
   */
  private trackFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          
          this.performanceService.recordMetric('FID', fid, {
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
   * Measures visual stability - should be < 0.1
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

        // Report CLS periodically
        if (clsEntries.length > 0) {
          this.performanceService.recordMetric('CLS', clsValue, {
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
   * Measures loading performance - should be < 1.8s
   */
  private trackFCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const fcp = entry.renderTime || entry.loadTime;
          
          this.performanceService.recordMetric('FCP', fcp, {
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
   * Measures when page becomes fully interactive
   */
  private trackTTI(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Use Performance API to estimate TTI
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (perfData) {
          const tti = perfData.domInteractive - perfData.fetchStart;
          
          this.performanceService.recordMetric('TTI', tti, {
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

      this.performanceService.recordMetric('memory', usedMB, {
        total: totalMB,
        limit: limitMB,
        percentage: (usedMB / limitMB) * 100
      });

      // Warn if memory usage is high
      if (usedMB > limitMB * 0.9) {
        console.warn(`High memory usage: ${usedMB.toFixed(2)}MB / ${limitMB.toFixed(2)}MB`);
      }
    };

    // Check memory periodically
    setInterval(checkMemory, 30000); // Every 30 seconds
    checkMemory(); // Initial check
  }

  /**
   * Clean up observers
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

