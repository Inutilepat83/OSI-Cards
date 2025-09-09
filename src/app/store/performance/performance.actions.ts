import { createAction, props } from '@ngrx/store';

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface UserInteraction {
  id: string;
  type: string;
  timestamp: number;
  duration?: number;
  data?: any;
}

export interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

// Performance Tracking Actions
export const trackMetric = createAction(
  '[Performance] Track Metric',
  props<{ metric: PerformanceMetric }>()
);

export const trackUserInteraction = createAction(
  '[Performance] Track User Interaction',
  props<{ interaction: UserInteraction }>()
);

export const recordMemorySnapshot = createAction(
  '[Performance] Record Memory Snapshot',
  props<{ snapshot: MemorySnapshot }>()
);

// Core Web Vitals Actions
export const recordCLS = createAction(
  '[Performance] Record CLS',
  props<{ value: number; timestamp: number }>()
);

export const recordFID = createAction(
  '[Performance] Record FID',
  props<{ value: number; timestamp: number }>()
);

export const recordLCP = createAction(
  '[Performance] Record LCP',
  props<{ value: number; timestamp: number }>()
);

export const recordFCP = createAction(
  '[Performance] Record FCP',
  props<{ value: number; timestamp: number }>()
);

export const recordTTFB = createAction(
  '[Performance] Record TTFB',
  props<{ value: number; timestamp: number }>()
);

// Bundle and Loading Performance
export const recordBundleSize = createAction(
  '[Performance] Record Bundle Size',
  props<{ bundleName: string; size: number }>()
);

export const recordLoadTime = createAction(
  '[Performance] Record Load Time',
  props<{ resourceType: string; loadTime: number; url: string }>()
);

export const recordNavigationTiming = createAction(
  '[Performance] Record Navigation Timing',
  props<{ timing: PerformanceNavigationTiming }>()
);

// Component Performance
export const recordComponentRenderTime = createAction(
  '[Performance] Record Component Render Time',
  props<{ componentName: string; renderTime: number; timestamp: number }>()
);

export const recordComponentLifecycle = createAction(
  '[Performance] Record Component Lifecycle',
  props<{ 
    componentName: string; 
    lifecycle: 'init' | 'render' | 'destroy'; 
    duration: number;
    timestamp: number;
  }>()
);

// Performance Optimization Actions
export const enablePerformanceMode = createAction('[Performance] Enable Performance Mode');
export const disablePerformanceMode = createAction('[Performance] Disable Performance Mode');

export const setVirtualScrolling = createAction(
  '[Performance] Set Virtual Scrolling',
  props<{ enabled: boolean }>()
);

export const setWebWorkers = createAction(
  '[Performance] Set Web Workers',
  props<{ enabled: boolean }>()
);

export const setServiceWorker = createAction(
  '[Performance] Set Service Worker',
  props<{ enabled: boolean }>()
);

// Performance Alerts
export const performanceThresholdExceeded = createAction(
  '[Performance] Threshold Exceeded',
  props<{ 
    metricName: string; 
    value: number; 
    threshold: number; 
    severity: 'warning' | 'critical' 
  }>()
);

export const memoryLeakDetected = createAction(
  '[Performance] Memory Leak Detected',
  props<{ 
    componentName?: string; 
    growthRate: number; 
    currentUsage: number 
  }>()
);

// Cleanup Actions
export const clearOldMetrics = createAction(
  '[Performance] Clear Old Metrics',
  props<{ olderThan: number }>()
);

export const clearAllMetrics = createAction('[Performance] Clear All Metrics');

export const exportPerformanceData = createAction('[Performance] Export Performance Data');

export const resetPerformanceState = createAction('[Performance] Reset Performance State');
