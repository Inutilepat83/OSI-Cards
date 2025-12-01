/**
 * Performance Monitoring Utilities (Improvements #11-15)
 * 
 * Comprehensive performance monitoring for OSI Cards.
 * Tracks Core Web Vitals, render times, and component metrics.
 * 
 * @example
 * ```typescript
 * import { PerformanceMonitor, WebVitals } from 'osi-cards-lib';
 * 
 * // Initialize monitoring
 * const monitor = new PerformanceMonitor({
 *   enabled: true,
 *   sampleRate: 0.1, // 10% sampling
 *   reportCallback: (metrics) => sendToAnalytics(metrics)
 * });
 * 
 * // Track component render
 * const stopTiming = monitor.startTiming('card-render');
 * // ... render card ...
 * stopTiming();
 * 
 * // Get Web Vitals
 * const vitals = await WebVitals.measure();
 * ```
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Performance metric types
 */
export type MetricType = 
  | 'render'
  | 'layout'
  | 'streaming'
  | 'interaction'
  | 'network'
  | 'memory'
  | 'custom';

/**
 * Performance metric entry
 */
export interface PerformanceMetric {
  name: string;
  type: MetricType;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'score';
  timestamp: number;
  tags?: Record<string, string>;
}

/**
 * Core Web Vitals metrics
 */
export interface CoreWebVitals {
  /** Largest Contentful Paint */
  lcp?: number;
  /** First Input Delay */
  fid?: number;
  /** Cumulative Layout Shift */
  cls?: number;
  /** First Contentful Paint */
  fcp?: number;
  /** Time to First Byte */
  ttfb?: number;
  /** Interaction to Next Paint */
  inp?: number;
}

/**
 * Performance monitor configuration
 */
export interface PerformanceMonitorConfig {
  /** Enable monitoring */
  enabled: boolean;
  /** Sample rate (0-1) */
  sampleRate: number;
  /** Buffer size before flushing */
  bufferSize: number;
  /** Auto-flush interval in ms */
  flushInterval: number;
  /** Include Web Vitals */
  includeWebVitals: boolean;
  /** Include memory metrics */
  includeMemory: boolean;
  /** Report callback */
  reportCallback?: (metrics: PerformanceMetric[]) => void;
}

/**
 * Timing handle
 */
export interface TimingHandle {
  stop: () => number;
  cancel: () => void;
}

/**
 * Component performance stats
 */
export interface ComponentStats {
  componentName: string;
  renderCount: number;
  totalRenderTime: number;
  avgRenderTime: number;
  minRenderTime: number;
  maxRenderTime: number;
  lastRenderTime: number;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: PerformanceMonitorConfig = {
  enabled: true,
  sampleRate: 1.0,
  bufferSize: 100,
  flushInterval: 30000, // 30 seconds
  includeWebVitals: true,
  includeMemory: true
};

// ============================================================================
// PERFORMANCE MONITOR CLASS
// ============================================================================

/**
 * Performance monitoring service
 */
export class PerformanceMonitor {
  private config: PerformanceMonitorConfig;
  private metrics: PerformanceMetric[] = [];
  private componentStats = new Map<string, ComponentStats>();
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private observer: PerformanceObserver | null = null;

  constructor(config: Partial<PerformanceMonitorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (this.config.enabled && typeof window !== 'undefined') {
      this.setupPerformanceObserver();
      this.startFlushTimer();
    }
  }

  // ============================================
  // Timing Methods
  // ============================================

  /**
   * Start timing a named operation
   */
  startTiming(name: string, type: MetricType = 'custom'): TimingHandle {
    if (!this.shouldSample()) {
      return { stop: () => 0, cancel: () => {} };
    }
    
    const startTime = performance.now();
    let cancelled = false;
    
    return {
      stop: () => {
        if (cancelled) return 0;
        
        const duration = performance.now() - startTime;
        this.record(name, duration, type);
        return duration;
      },
      cancel: () => {
        cancelled = true;
      }
    };
  }

  /**
   * Time a function execution
   */
  async timeAsync<T>(
    name: string, 
    fn: () => Promise<T>,
    type: MetricType = 'custom'
  ): Promise<T> {
    const timing = this.startTiming(name, type);
    try {
      return await fn();
    } finally {
      timing.stop();
    }
  }

  /**
   * Time a synchronous function
   */
  timeSync<T>(
    name: string,
    fn: () => T,
    type: MetricType = 'custom'
  ): T {
    const timing = this.startTiming(name, type);
    try {
      return fn();
    } finally {
      timing.stop();
    }
  }

  /**
   * Measure using Performance API
   */
  measure(name: string, startMark: string, endMark?: string): number | null {
    if (!this.shouldSample() || typeof performance === 'undefined') {
      return null;
    }
    
    try {
      if (endMark) {
        const measure = performance.measure(name, startMark, endMark);
        this.record(name, measure.duration, 'custom');
        return measure.duration;
      } else {
        performance.mark(name);
        return null;
      }
    } catch {
      return null;
    }
  }

  // ============================================
  // Recording Methods
  // ============================================

  /**
   * Record a performance metric
   */
  record(
    name: string, 
    value: number, 
    type: MetricType = 'custom',
    unit: PerformanceMetric['unit'] = 'ms',
    tags?: Record<string, string>
  ): void {
    if (!this.config.enabled) return;
    
    const metric: PerformanceMetric = {
      name,
      type,
      value,
      unit,
      timestamp: Date.now(),
      tags
    };
    
    this.metrics.push(metric);
    
    // Update component stats if it's a render metric
    if (type === 'render' && tags?.['component']) {
      this.updateComponentStats(tags['component'] as string, value);
    }
    
    // Check buffer size
    if (this.metrics.length >= this.config.bufferSize) {
      this.flush();
    }
  }

  /**
   * Record a component render
   */
  recordRender(componentName: string, duration: number): void {
    this.record(
      `render:${componentName}`,
      duration,
      'render',
      'ms',
      { component: componentName }
    );
  }

  /**
   * Record a layout calculation
   */
  recordLayout(duration: number, sectionCount: number): void {
    this.record(
      'layout:masonry',
      duration,
      'layout',
      'ms',
      { sections: String(sectionCount) }
    );
  }

  /**
   * Record streaming progress
   */
  recordStreaming(charCount: number, duration: number): void {
    this.record('streaming:chars', charCount, 'streaming', 'count');
    this.record('streaming:duration', duration, 'streaming', 'ms');
    this.record(
      'streaming:rate',
      charCount / (duration / 1000),
      'streaming',
      'count'
    );
  }

  // ============================================
  // Component Stats
  // ============================================

  /**
   * Update component statistics
   */
  private updateComponentStats(componentName: string, renderTime: number): void {
    const existing = this.componentStats.get(componentName);
    
    if (existing) {
      existing.renderCount++;
      existing.totalRenderTime += renderTime;
      existing.avgRenderTime = existing.totalRenderTime / existing.renderCount;
      existing.minRenderTime = Math.min(existing.minRenderTime, renderTime);
      existing.maxRenderTime = Math.max(existing.maxRenderTime, renderTime);
      existing.lastRenderTime = renderTime;
    } else {
      this.componentStats.set(componentName, {
        componentName,
        renderCount: 1,
        totalRenderTime: renderTime,
        avgRenderTime: renderTime,
        minRenderTime: renderTime,
        maxRenderTime: renderTime,
        lastRenderTime: renderTime
      });
    }
  }

  /**
   * Get stats for a specific component
   */
  getComponentStats(componentName: string): ComponentStats | null {
    return this.componentStats.get(componentName) ?? null;
  }

  /**
   * Get all component stats
   */
  getAllComponentStats(): ComponentStats[] {
    return Array.from(this.componentStats.values());
  }

  // ============================================
  // Web Vitals
  // ============================================

  /**
   * Setup PerformanceObserver for Web Vitals
   */
  private setupPerformanceObserver(): void {
    if (typeof PerformanceObserver === 'undefined') return;
    
    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handlePerformanceEntry(entry);
        }
      });
      
      this.observer.observe({
        entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift', 'longtask']
      });
    } catch {
      // Some entry types may not be supported
    }
  }

  /**
   * Handle performance entry
   */
  private handlePerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'largest-contentful-paint':
        this.record('web-vitals:lcp', entry.startTime, 'render');
        break;
      case 'first-input':
        this.record(
          'web-vitals:fid',
          (entry as PerformanceEventTiming).processingStart - entry.startTime,
          'interaction'
        );
        break;
      case 'layout-shift':
        if (!(entry as any).hadRecentInput) {
          this.record('web-vitals:cls', (entry as any).value, 'layout', 'score');
        }
        break;
      case 'longtask':
        this.record('longtask', entry.duration, 'render');
        break;
    }
  }

  // ============================================
  // Memory Monitoring
  // ============================================

  /**
   * Get current memory usage
   */
  getMemoryUsage(): { usedJSHeapSize: number; totalJSHeapSize: number } | null {
    if (typeof performance === 'undefined') return null;
    
    const memory = (performance as any).memory;
    if (!memory) return null;
    
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize
    };
  }

  /**
   * Record current memory usage
   */
  recordMemory(): void {
    const memory = this.getMemoryUsage();
    if (!memory) return;
    
    this.record('memory:used', memory.usedJSHeapSize, 'memory', 'bytes');
    this.record('memory:total', memory.totalJSHeapSize, 'memory', 'bytes');
  }

  // ============================================
  // Reporting
  // ============================================

  /**
   * Flush metrics to callback
   */
  flush(): void {
    if (this.metrics.length === 0) return;
    
    const metricsToReport = [...this.metrics];
    this.metrics = [];
    
    if (this.config.reportCallback) {
      this.config.reportCallback(metricsToReport);
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by type
   */
  getMetricsByType(type: MetricType): PerformanceMetric[] {
    return this.metrics.filter(m => m.type === type);
  }

  /**
   * Get summary statistics
   */
  getSummary(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const summary: Record<string, { values: number[] }> = {};
    
    for (const metric of this.metrics) {
      if (!summary[metric.name]) {
        summary[metric.name] = { values: [] };
      }
      summary[metric.name]?.values.push(metric.value);
    }
    
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    for (const [name, data] of Object.entries(summary)) {
      const values = data.values;
      result[name] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      };
    }
    
    return result;
  }

  // ============================================
  // Lifecycle
  // ============================================

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    if (this.config.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        this.flush();
        if (this.config.includeMemory) {
          this.recordMemory();
        }
      }, this.config.flushInterval);
    }
  }

  /**
   * Check if should sample this metric
   */
  private shouldSample(): boolean {
    if (!this.config.enabled) return false;
    if (this.config.sampleRate >= 1) return true;
    return Math.random() < this.config.sampleRate;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.componentStats.clear();
  }

  /**
   * Destroy the monitor
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    this.flush();
    this.clear();
  }
}

// ============================================================================
// WEB VITALS HELPER
// ============================================================================

/**
 * Web Vitals measurement utility
 */
export class WebVitals {
  /**
   * Measure all available Core Web Vitals
   */
  static async measure(): Promise<CoreWebVitals> {
    const vitals: CoreWebVitals = {};
    
    if (typeof window === 'undefined') return vitals;
    
    // Get navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (navigation) {
      vitals.ttfb = navigation.responseStart - navigation.requestStart;
    }
    
    // Get paint timing
    const paintEntries = performance.getEntriesByType('paint');
    for (const entry of paintEntries) {
      if (entry.name === 'first-contentful-paint') {
        vitals.fcp = entry.startTime;
      }
    }
    
    // Get LCP
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    const lastLcp = lcpEntries[lcpEntries.length - 1];
    if (lastLcp) {
      vitals.lcp = lastLcp.startTime;
    }
    
    return vitals;
  }

  /**
   * Check if Core Web Vitals pass thresholds
   */
  static evaluate(vitals: CoreWebVitals): {
    lcp: 'good' | 'needs-improvement' | 'poor' | 'unknown';
    fid: 'good' | 'needs-improvement' | 'poor' | 'unknown';
    cls: 'good' | 'needs-improvement' | 'poor' | 'unknown';
  } {
    return {
      lcp: vitals.lcp === undefined ? 'unknown' :
           vitals.lcp <= 2500 ? 'good' :
           vitals.lcp <= 4000 ? 'needs-improvement' : 'poor',
      fid: vitals.fid === undefined ? 'unknown' :
           vitals.fid <= 100 ? 'good' :
           vitals.fid <= 300 ? 'needs-improvement' : 'poor',
      cls: vitals.cls === undefined ? 'unknown' :
           vitals.cls <= 0.1 ? 'good' :
           vitals.cls <= 0.25 ? 'needs-improvement' : 'poor'
    };
  }
}

// ============================================================================
// GLOBAL INSTANCE
// ============================================================================

let globalMonitor: PerformanceMonitor | null = null;

/**
 * Get the global performance monitor
 */
export function getPerformanceMonitor(
  config?: Partial<PerformanceMonitorConfig>
): PerformanceMonitor {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor(config);
  }
  return globalMonitor;
}

/**
 * Initialize global performance monitor
 */
export function initPerformanceMonitor(
  config: Partial<PerformanceMonitorConfig>
): PerformanceMonitor {
  if (globalMonitor) {
    globalMonitor.destroy();
  }
  globalMonitor = new PerformanceMonitor(config);
  return globalMonitor;
}

