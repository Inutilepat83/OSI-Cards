import { Injectable, Inject, Optional, inject, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Observable, fromEvent, merge, BehaviorSubject, timer, Subscription } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, startWith, shareReplay } from 'rxjs/operators';

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  
  // Navigation Timing
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;
  
  // Resource Timing
  resourceCount: number;
  totalResourceSize: number;
  
  // Memory Usage
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  
  // Custom Metrics
  componentInitTime: number;
  routeChangeTime: number;
  apiResponseTime: number;
}

export interface PerformanceConfig {
  enableMetricsCollection: boolean;
  enableConsoleReporting: boolean;
  enableRemoteReporting: boolean;
  reportingInterval: number;
  enableWebVitals: boolean;
  enableResourceTiming: boolean;
  enableMemoryTracking: boolean;
  enableUserTiming: boolean;
  thresholds: {
    lcp: number;
    fid: number;
    cls: number;
    loadTime: number;
    memoryUsage: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceMonitoringService {
  private readonly document: Document;
  private readonly window: Window;
  
  private readonly metricsSubject = new BehaviorSubject<Partial<PerformanceMetrics>>({});
  private readonly config: PerformanceConfig;
  
  public readonly metrics$ = this.metricsSubject.asObservable();
  private observer?: PerformanceObserver;
  private resourceObserver?: PerformanceObserver;
  private memoryTimer?: Subscription;

  constructor(
    @Inject(DOCUMENT) document: Document,
    @Optional() @Inject('PERFORMANCE_CONFIG') config?: PerformanceConfig
  ) {
    this.document = document;
    this.window = this.document.defaultView!;
    this.config = {
      enableMetricsCollection: true,
      enableConsoleReporting: false,
      enableRemoteReporting: true,
      reportingInterval: 30000, // 30 seconds
      enableWebVitals: true,
      enableResourceTiming: true,
      enableMemoryTracking: true,
      enableUserTiming: true,
      thresholds: {
        lcp: 2500,
        fid: 100,
        cls: 0.1,
        loadTime: 3000,
        memoryUsage: 50 * 1024 * 1024 // 50MB
      },
      ...config
    };

    if (this.config.enableMetricsCollection) {
      this.initializeMonitoring();
    }
  }

  private initializeMonitoring(): void {
    if (typeof window === 'undefined' || !window.performance) {
      console.warn('Performance API not available');
      return;
    }

    this.setupNavigationTiming();
    
    if (this.config.enableWebVitals) {
      this.setupWebVitals();
    }
    
    if (this.config.enableResourceTiming) {
      this.setupResourceTiming();
    }
    
    if (this.config.enableMemoryTracking) {
      this.setupMemoryTracking();
    }

    if (this.config.enableUserTiming) {
      this.setupUserTiming();
    }

    this.setupReporting();
  }

  private setupNavigationTiming(): void {
    if (this.window.performance.navigation) {
      const navigation = this.window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const metrics: Partial<PerformanceMetrics> = {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart
        };
        
        this.updateMetrics(metrics);
      }
    }
  }

  private setupWebVitals(): void {
    // Largest Contentful Paint (LCP)
    this.observePerformanceEntry('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1] as PerformancePaintTiming;
      this.updateMetrics({ lcp: lastEntry.startTime });
    });

    // First Input Delay (FID)
    this.observePerformanceEntry('first-input', (entries) => {
      const firstInput = entries[0] as PerformanceEventTiming;
      const fid = firstInput.processingStart - firstInput.startTime;
      this.updateMetrics({ fid });
    });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    this.observePerformanceEntry('layout-shift', (entries) => {
      for (const entry of entries as LayoutShift[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      this.updateMetrics({ cls: clsValue });
    });

    // First Paint and First Contentful Paint
    this.observePerformanceEntry('paint', (entries) => {
      for (const entry of entries as PerformancePaintTiming[]) {
        if (entry.name === 'first-paint') {
          this.updateMetrics({ firstPaint: entry.startTime });
        } else if (entry.name === 'first-contentful-paint') {
          this.updateMetrics({ firstContentfulPaint: entry.startTime });
        }
      }
    });
  }

  private setupResourceTiming(): void {
    this.resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceResourceTiming[];
      
      let totalSize = 0;
      for (const entry of entries) {
        totalSize += entry.transferSize || 0;
      }
      
      this.updateMetrics({
        resourceCount: entries.length,
        totalResourceSize: totalSize
      });
    });

    this.resourceObserver.observe({ entryTypes: ['resource'] });
  }

  private setupMemoryTracking(): void {
    if ('memory' in this.window.performance) {
      this.memoryTimer = timer(0, 5000).subscribe(() => {
        const memory = (this.window.performance as any).memory;
        
        this.updateMetrics({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        });
        
        // Check memory threshold
        if (memory.usedJSHeapSize > this.config.thresholds.memoryUsage) {
          this.reportPerformanceIssue('memory', {
            current: memory.usedJSHeapSize,
            threshold: this.config.thresholds.memoryUsage
          });
        }
      });
    }
  }

  private setupUserTiming(): void {
    this.observePerformanceEntry('measure', (entries) => {
      for (const entry of entries as PerformanceMeasure[]) {
        if (entry.name.includes('component-init')) {
          this.updateMetrics({ componentInitTime: entry.duration });
        } else if (entry.name.includes('route-change')) {
          this.updateMetrics({ routeChangeTime: entry.duration });
        } else if (entry.name.includes('api-response')) {
          this.updateMetrics({ apiResponseTime: entry.duration });
        }
      }
    });
  }

  private observePerformanceEntry(entryType: string, callback: (entries: PerformanceEntry[]) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      
      observer.observe({ entryTypes: [entryType] });
      
      // Store observer reference for cleanup
      if (!this.observer) {
        this.observer = observer;
      }
    } catch (error) {
      console.warn(`Performance observer for ${entryType} not supported:`, error);
    }
  }

  private setupReporting(): void {
    if (this.config.enableConsoleReporting) {
      this.metrics$.pipe(
        debounceTime(this.config.reportingInterval),
        distinctUntilChanged()
      ).subscribe(metrics => {
        console.table(metrics);
      });
    }

    if (this.config.enableRemoteReporting) {
      this.metrics$.pipe(
        debounceTime(this.config.reportingInterval),
        distinctUntilChanged()
      ).subscribe(metrics => {
        this.sendMetricsToServer(metrics);
      });
    }
  }

  private updateMetrics(newMetrics: Partial<PerformanceMetrics>): void {
    const currentMetrics = this.metricsSubject.value;
    const updatedMetrics = { ...currentMetrics, ...newMetrics };
    this.metricsSubject.next(updatedMetrics);
    
    this.checkThresholds(updatedMetrics);
  }

  private checkThresholds(metrics: Partial<PerformanceMetrics>): void {
    const { thresholds } = this.config;
    
    if (metrics.lcp && metrics.lcp > thresholds.lcp) {
      this.reportPerformanceIssue('lcp', { current: metrics.lcp, threshold: thresholds.lcp });
    }
    
    if (metrics.fid && metrics.fid > thresholds.fid) {
      this.reportPerformanceIssue('fid', { current: metrics.fid, threshold: thresholds.fid });
    }
    
    if (metrics.cls && metrics.cls > thresholds.cls) {
      this.reportPerformanceIssue('cls', { current: metrics.cls, threshold: thresholds.cls });
    }
    
    if (metrics.loadComplete && metrics.loadComplete > thresholds.loadTime) {
      this.reportPerformanceIssue('loadTime', { current: metrics.loadComplete, threshold: thresholds.loadTime });
    }
  }

  private reportPerformanceIssue(metric: string, data: any): void {
    console.warn(`Performance threshold exceeded for ${metric}:`, data);
    
    // Send to monitoring service
    this.sendPerformanceAlert({
      metric,
      data,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  }

  private async sendMetricsToServer(metrics: Partial<PerformanceMetrics>): Promise<void> {
    try {
      await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch (error) {
      console.warn('Failed to send metrics to server:', error);
    }
  }

  private async sendPerformanceAlert(alert: any): Promise<void> {
    try {
      await fetch('/api/performance-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });
    } catch (error) {
      console.warn('Failed to send performance alert:', error);
    }
  }

  // Public API methods
  public startMeasurement(name: string): void {
    if (this.window.performance && this.window.performance.mark) {
      this.window.performance.mark(`${name}-start`);
    }
  }

  public endMeasurement(name: string): number {
    if (this.window.performance && this.window.performance.mark && this.window.performance.measure) {
      this.window.performance.mark(`${name}-end`);
      this.window.performance.measure(name, `${name}-start`, `${name}-end`);
      
      const measures = this.window.performance.getEntriesByName(name, 'measure');
      return measures.length > 0 ? measures[measures.length - 1].duration : 0;
    }
    return 0;
  }

  public getCurrentMetrics(): Partial<PerformanceMetrics> {
    return this.metricsSubject.value;
  }

  public getNavigationTiming(): PerformanceNavigationTiming | null {
    const navigation = this.window.performance.getEntriesByType('navigation');
    return navigation.length > 0 ? navigation[0] as PerformanceNavigationTiming : null;
  }

  public getResourceTiming(): PerformanceResourceTiming[] {
    return this.window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  }

  public clearResourceTiming(): void {
    if (this.window.performance.clearResourceTimings) {
      this.window.performance.clearResourceTimings();
    }
  }

  public dispose(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    if (this.resourceObserver) {
      this.resourceObserver.disconnect();
    }
    
    if (this.memoryTimer) {
      this.memoryTimer.unsubscribe();
    }
    
    this.metricsSubject.complete();
  }
}

// Types for better TypeScript support
interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
  processingEnd: number;
  cancelable: boolean;
}
