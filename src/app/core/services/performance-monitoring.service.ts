import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LoggingService } from './logging.service';

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift

  // Additional metrics
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
  domContentLoaded: number | null;
  loadComplete: number | null;

  // Custom metrics
  componentRenderTime: number;
  apiResponseTime: number;
  bundleSize: number;
}

export interface AnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  page: string;
  userAgent: string;
}

@Injectable({
  providedIn: 'root',
})
export class PerformanceMonitoringService {
  private metrics$ = new BehaviorSubject<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    domContentLoaded: null,
    loadComplete: null,
    componentRenderTime: 0,
    apiResponseTime: 0,
    bundleSize: 0,
  });

  private analyticsEvents: AnalyticsEvent[] = [];
  private sessionId: string;
  private observers: PerformanceObserver[] = [];

  constructor(
    private router: Router,
    private logger: LoggingService
  ) {
    this.sessionId = this.generateSessionId();
    this.initializePerformanceMonitoring();
    this.initializeAnalyticsTracking();
    this.trackLongTasks();
    this.trackResourceLoading();
    this.startPeriodicMonitoring();
  }

  /**
   * Get performance metrics as observable
   */
  getMetrics$(): Observable<PerformanceMetrics> {
    return this.metrics$.asObservable();
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics {
    return this.metrics$.value;
  }

  /**
   * Initialize Core Web Vitals monitoring
   */
  private initializePerformanceMonitoring(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.updateMetric('lcp', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch {
        this.logger.warn('PerformanceMonitoringService', 'LCP monitoring not supported');
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.updateMetric('fid', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch {
        this.logger.warn('PerformanceMonitoringService', 'FID monitoring not supported');
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.updateMetric('cls', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch {
        this.logger.warn('PerformanceMonitoringService', 'CLS monitoring not supported');
      }

      // First Contentful Paint (FCP)
      try {
        const fcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.name === 'first-contentful-paint') {
              this.updateMetric('fcp', entry.startTime);
            }
          });
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(fcpObserver);
      } catch {
        this.logger.warn('PerformanceMonitoringService', 'FCP monitoring not supported');
      }
    }

    // Traditional performance metrics
    this.monitorTraditionalMetrics();

    // Route change performance
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      this.trackPageView();
    });
  }

  /**
   * Monitor traditional performance metrics
   */
  private monitorTraditionalMetrics(): void {
    // Time to First Byte (TTFB)
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as any;
        if (navigation) {
          this.updateMetric('ttfb', navigation.responseStart - navigation.requestStart);
          this.updateMetric(
            'domContentLoaded',
            navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
          );
          this.updateMetric('loadComplete', navigation.loadEventEnd - navigation.loadEventStart);
        }
      }, 0);
    });
  }

  /**
   * Initialize analytics tracking
   */
  private initializeAnalyticsTracking(): void {
    // Track page views
    this.trackPageView();

    // Track user interactions
    this.trackUserInteractions();

    // Track errors
    this.trackErrors();
  }

  /**
   * Track page view
   */
  private trackPageView(): void {
    this.trackEvent({
      event: 'page_view',
      category: 'navigation',
      action: 'page_load',
      label: this.router.url,
      page: this.router.url,
      userAgent: navigator.userAgent,
    });
  }

  /**
   * Track user interactions
   */
  private trackUserInteractions(): void {
    // Track button clicks
    document.addEventListener('click', event => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        this.trackEvent({
          event: 'button_click',
          category: 'interaction',
          action: 'click',
          label: target.textContent?.trim() || 'button',
          page: this.router.url,
          userAgent: navigator.userAgent,
        });
      }
    });

    // Track form submissions
    document.addEventListener('submit', event => {
      const form = event.target as HTMLFormElement;
      this.trackEvent({
        event: 'form_submit',
        category: 'interaction',
        action: 'submit',
        label: form.id || 'form',
        page: this.router.url,
        userAgent: navigator.userAgent,
      });
    });
  }

  /**
   * Track errors
   */
  private trackErrors(): void {
    window.addEventListener('error', event => {
      this.trackEvent({
        event: 'javascript_error',
        category: 'error',
        action: 'error',
        label: event.message,
        value: event.lineno,
        page: this.router.url,
        userAgent: navigator.userAgent,
      });
    });

    window.addEventListener('unhandledrejection', event => {
      this.trackEvent({
        event: 'promise_rejection',
        category: 'error',
        action: 'rejection',
        label: event.reason?.toString() || 'Unknown',
        page: this.router.url,
        userAgent: navigator.userAgent,
      });
    });
  }

  /**
   * Track custom event
   */
  trackEvent(eventData: Omit<AnalyticsEvent, 'timestamp' | 'sessionId'>): void {
    const event: AnalyticsEvent = {
      ...eventData,
      timestamp: new Date(),
      sessionId: this.sessionId,
    };

    this.analyticsEvents.push(event);

    // Send to analytics service (implement based on your analytics provider)
    this.sendToAnalytics(event);

    // Keep only last 1000 events
    if (this.analyticsEvents.length > 1000) {
      this.analyticsEvents = this.analyticsEvents.slice(-1000);
    }
  }

  /**
   * Track component render time
   */
  trackComponentRender(componentName: string, renderTime: number): void {
    this.updateMetric('componentRenderTime', renderTime);
    this.trackEvent({
      event: 'component_render',
      category: 'performance',
      action: 'render',
      label: componentName,
      value: renderTime,
      page: this.router.url,
      userAgent: navigator.userAgent,
    });
  }

  /**
   * Track API response time
   */
  trackApiResponse(url: string, responseTime: number): void {
    this.updateMetric('apiResponseTime', responseTime);
    this.trackEvent({
      event: 'api_response',
      category: 'performance',
      action: 'api_call',
      label: url,
      value: responseTime,
      page: this.router.url,
      userAgent: navigator.userAgent,
    });
  }

  /**
   * Update performance metric
   */
  private updateMetric(key: keyof PerformanceMetrics, value: number): void {
    const current = this.metrics$.value;
    this.metrics$.next({
      ...current,
      [key]: value,
    });
  }

  /**
   * Send event to analytics service
   */
  private sendToAnalytics(event: AnalyticsEvent): void {
    // Implement based on your analytics provider (Google Analytics, Mixpanel, etc.)
    this.logger.log('PerformanceMonitoringService', 'Analytics event', event);

    // Example: Send to Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
      });
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get analytics events for debugging
   */
  getAnalyticsEvents(): AnalyticsEvent[] {
    return [...this.analyticsEvents];
  }

  /**
   * Export performance report
   */
  exportPerformanceReport(): string {
    const metrics = this.getCurrentMetrics();
    const events = this.getAnalyticsEvents();

    return JSON.stringify(
      {
        metrics,
        events: events.slice(-50), // Last 50 events
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
      },
      null,
      2
    );
  }

  /**
   * Track memory usage
   */
  trackMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.trackEvent({
        event: 'memory_usage',
        category: 'performance',
        action: 'memory',
        label: 'heap_used',
        value: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        page: this.router.url,
        userAgent: navigator.userAgent,
      });
    }
  }

  /**
   * Track network information
   */
  trackNetworkInfo(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.trackEvent({
        event: 'network_info',
        category: 'performance',
        action: 'network',
        label: connection.effectiveType || 'unknown',
        value: connection.downlink || 0,
        page: this.router.url,
        userAgent: navigator.userAgent,
      });
    }
  }

  /**
   * Track long tasks (tasks > 50ms)
   */
  private trackLongTasks(): void {
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.trackEvent({
              event: 'long_task',
              category: 'performance',
              action: 'long_task',
              label: 'main_thread_blocked',
              value: entry.duration,
              page: this.router.url,
              userAgent: navigator.userAgent,
            });
          });
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch {
        this.logger.warn('PerformanceMonitoringService', 'Long task monitoring not supported');
      }
    }
  }

  /**
   * Monitor resource loading performance
   */
  private trackResourceLoading(): void {
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.duration > 1000) {
              // Only track slow resources
              this.trackEvent({
                event: 'slow_resource',
                category: 'performance',
                action: 'resource_load',
                label: entry.name,
                value: entry.duration,
                page: this.router.url,
                userAgent: navigator.userAgent,
              });
            }
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch {
        this.logger.warn('PerformanceMonitoringService', 'Resource monitoring not supported');
      }
    }
  }

  /**
   * Get performance score based on Core Web Vitals
   */
  getPerformanceScore(): { score: number; grade: string; recommendations: string[] } {
    const metrics = this.getCurrentMetrics();
    let score = 100;
    const recommendations: string[] = [];

    // LCP scoring
    if (metrics.lcp !== null) {
      if (metrics.lcp > 4000) {
        score -= 30;
        recommendations.push(
          'Improve Largest Contentful Paint (LCP) - consider optimizing images and critical resources'
        );
      } else if (metrics.lcp > 2500) {
        score -= 15;
        recommendations.push('Consider optimizing Largest Contentful Paint (LCP)');
      }
    }

    // FID scoring
    if (metrics.fid !== null) {
      if (metrics.fid > 300) {
        score -= 30;
        recommendations.push('Improve First Input Delay (FID) - reduce JavaScript execution time');
      } else if (metrics.fid > 100) {
        score -= 15;
        recommendations.push('Consider optimizing First Input Delay (FID)');
      }
    }

    // CLS scoring
    if (metrics.cls !== null) {
      if (metrics.cls > 0.25) {
        score -= 30;
        recommendations.push('Fix Cumulative Layout Shift (CLS) - ensure stable page layout');
      } else if (metrics.cls > 0.1) {
        score -= 15;
        recommendations.push('Consider fixing minor layout shifts');
      }
    }

    let grade = 'A';
    if (score < 90) grade = 'B';
    if (score < 75) grade = 'C';
    if (score < 60) grade = 'D';
    if (score < 40) grade = 'F';

    return { score: Math.max(0, score), grade, recommendations };
  }

  /**
   * Start periodic performance monitoring
   */
  startPeriodicMonitoring(intervalMs: number = 30000): void {
    setInterval(() => {
      this.trackMemoryUsage();
      this.trackNetworkInfo();
    }, intervalMs);
  }
}
