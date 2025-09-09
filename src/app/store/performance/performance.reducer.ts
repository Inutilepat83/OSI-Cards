import { createReducer, on } from '@ngrx/store';
import * as PerformanceActions from './performance.actions';

export interface CoreWebVitals {
  cls: number[];
  fid: number[];
  lcp: number[];
  fcp: number[];
  ttfb: number[];
}

export type BundleMetrics = Record<string, number>;

export interface LoadingMetrics {
  resources: {
    type: string;
    loadTime: number;
    url: string;
    timestamp: number;
  }[];
  navigationTiming?: PerformanceNavigationTiming;
}

export interface ComponentMetrics {
  renderTimes: Record<string, number[]>;
  lifecycleTimes: Record<string, {
    init: number[];
    render: number[];
    destroy: number[];
  }>;
}

export interface PerformanceState {
  // Core Performance Data
  metrics: PerformanceActions.PerformanceMetric[];
  userInteractions: PerformanceActions.UserInteraction[];
  memorySnapshots: PerformanceActions.MemorySnapshot[];
  
  // Core Web Vitals
  coreWebVitals: CoreWebVitals;
  
  // Bundle and Loading Performance
  bundleMetrics: BundleMetrics;
  loadingMetrics: LoadingMetrics;
  
  // Component Performance
  componentMetrics: ComponentMetrics;
  
  // Performance Settings
  performanceModeEnabled: boolean;
  virtualScrollingEnabled: boolean;
  webWorkersEnabled: boolean;
  serviceWorkerEnabled: boolean;
  
  // Performance Monitoring
  thresholds: {
    cls: number;
    fid: number;
    lcp: number;
    memoryUsage: number;
    renderTime: number;
  };
  
  // Alerts and Issues
  alerts: {
    id: string;
    type: 'threshold_exceeded' | 'memory_leak' | 'slow_component';
    severity: 'warning' | 'critical';
    message: string;
    timestamp: number;
    resolved: boolean;
  }[];
  
  // Statistics
  averageMetrics: {
    pageLoadTime: number;
    componentRenderTime: number;
    memoryUsage: number;
    interactionResponseTime: number;
  };
  
  // Configuration
  trackingEnabled: boolean;
  maxMetricsHistory: number;
  maxMemorySnapshots: number;
}

export const initialState: PerformanceState = {
  metrics: [],
  userInteractions: [],
  memorySnapshots: [],
  coreWebVitals: {
    cls: [],
    fid: [],
    lcp: [],
    fcp: [],
    ttfb: []
  },
  bundleMetrics: {},
  loadingMetrics: {
    resources: []
  },
  componentMetrics: {
    renderTimes: {},
    lifecycleTimes: {}
  },
  performanceModeEnabled: false,
  virtualScrollingEnabled: true,
  webWorkersEnabled: false,
  serviceWorkerEnabled: true,
  thresholds: {
    cls: 0.1,
    fid: 100,
    lcp: 2500,
    memoryUsage: 50 * 1024 * 1024, // 50MB
    renderTime: 16 // 60fps
  },
  alerts: [],
  averageMetrics: {
    pageLoadTime: 0,
    componentRenderTime: 0,
    memoryUsage: 0,
    interactionResponseTime: 0
  },
  trackingEnabled: true,
  maxMetricsHistory: 1000,
  maxMemorySnapshots: 100
};

export const reducer = createReducer(
  initialState,
  
  // Metric Tracking
  on(PerformanceActions.trackMetric, (state, { metric }) => ({
    ...state,
    metrics: [
      ...state.metrics.slice(-state.maxMetricsHistory + 1),
      metric
    ]
  })),
  
  on(PerformanceActions.trackUserInteraction, (state, { interaction }) => ({
    ...state,
    userInteractions: [
      ...state.userInteractions.slice(-state.maxMetricsHistory + 1),
      interaction
    ]
  })),
  
  on(PerformanceActions.recordMemorySnapshot, (state, { snapshot }) => ({
    ...state,
    memorySnapshots: [
      ...state.memorySnapshots.slice(-state.maxMemorySnapshots + 1),
      snapshot
    ]
  })),
  
  // Core Web Vitals
  on(PerformanceActions.recordCLS, (state, { value, timestamp }) => ({
    ...state,
    coreWebVitals: {
      ...state.coreWebVitals,
      cls: [...state.coreWebVitals.cls.slice(-99), value]
    }
  })),
  
  on(PerformanceActions.recordFID, (state, { value, timestamp }) => ({
    ...state,
    coreWebVitals: {
      ...state.coreWebVitals,
      fid: [...state.coreWebVitals.fid.slice(-99), value]
    }
  })),
  
  on(PerformanceActions.recordLCP, (state, { value, timestamp }) => ({
    ...state,
    coreWebVitals: {
      ...state.coreWebVitals,
      lcp: [...state.coreWebVitals.lcp.slice(-99), value]
    }
  })),
  
  on(PerformanceActions.recordFCP, (state, { value, timestamp }) => ({
    ...state,
    coreWebVitals: {
      ...state.coreWebVitals,
      fcp: [...state.coreWebVitals.fcp.slice(-99), value]
    }
  })),
  
  on(PerformanceActions.recordTTFB, (state, { value, timestamp }) => ({
    ...state,
    coreWebVitals: {
      ...state.coreWebVitals,
      ttfb: [...state.coreWebVitals.ttfb.slice(-99), value]
    }
  })),
  
  // Bundle and Loading Performance
  on(PerformanceActions.recordBundleSize, (state, { bundleName, size }) => ({
    ...state,
    bundleMetrics: {
      ...state.bundleMetrics,
      [bundleName]: size
    }
  })),
  
  on(PerformanceActions.recordLoadTime, (state, { resourceType, loadTime, url }) => ({
    ...state,
    loadingMetrics: {
      ...state.loadingMetrics,
      resources: [
        ...state.loadingMetrics.resources.slice(-199),
        { type: resourceType, loadTime, url, timestamp: Date.now() }
      ]
    }
  })),
  
  on(PerformanceActions.recordNavigationTiming, (state, { timing }) => ({
    ...state,
    loadingMetrics: {
      ...state.loadingMetrics,
      navigationTiming: timing
    }
  })),
  
  // Component Performance
  on(PerformanceActions.recordComponentRenderTime, (state, { componentName, renderTime, timestamp }) => ({
    ...state,
    componentMetrics: {
      ...state.componentMetrics,
      renderTimes: {
        ...state.componentMetrics.renderTimes,
        [componentName]: [
          ...(state.componentMetrics.renderTimes[componentName] || []).slice(-49),
          renderTime
        ]
      }
    }
  })),
  
  on(PerformanceActions.recordComponentLifecycle, (state, { componentName, lifecycle, duration, timestamp }) => ({
    ...state,
    componentMetrics: {
      ...state.componentMetrics,
      lifecycleTimes: {
        ...state.componentMetrics.lifecycleTimes,
        [componentName]: {
          ...state.componentMetrics.lifecycleTimes[componentName],
          [lifecycle]: [
            ...((state.componentMetrics.lifecycleTimes[componentName]?.[lifecycle]) || []).slice(-49),
            duration
          ]
        }
      }
    }
  })),
  
  // Performance Settings
  on(PerformanceActions.enablePerformanceMode, (state) => ({
    ...state,
    performanceModeEnabled: true
  })),
  
  on(PerformanceActions.disablePerformanceMode, (state) => ({
    ...state,
    performanceModeEnabled: false
  })),
  
  on(PerformanceActions.setVirtualScrolling, (state, { enabled }) => ({
    ...state,
    virtualScrollingEnabled: enabled
  })),
  
  on(PerformanceActions.setWebWorkers, (state, { enabled }) => ({
    ...state,
    webWorkersEnabled: enabled
  })),
  
  on(PerformanceActions.setServiceWorker, (state, { enabled }) => ({
    ...state,
    serviceWorkerEnabled: enabled
  })),
  
  // Performance Alerts
  on(PerformanceActions.performanceThresholdExceeded, (state, { metricName, value, threshold, severity }) => ({
    ...state,
    alerts: [
      ...state.alerts,
      {
        id: `alert-${Date.now()}`,
        type: 'threshold_exceeded' as const,
        severity: severity as 'warning' | 'critical',
        message: `${metricName} exceeded threshold: ${value} > ${threshold}`,
        timestamp: Date.now(),
        resolved: false
      }
    ]
  })),
  
  on(PerformanceActions.memoryLeakDetected, (state, { componentName, growthRate, currentUsage }) => ({
    ...state,
    alerts: [
      ...state.alerts,
      {
        id: `memory-leak-${Date.now()}`,
        type: 'memory_leak' as const,
        severity: 'critical' as const,
        message: `Memory leak detected${componentName ? ` in ${componentName}` : ''}: ${growthRate}% growth, ${currentUsage} bytes`,
        timestamp: Date.now(),
        resolved: false
      }
    ]
  })),
  
  // Cleanup Actions
  on(PerformanceActions.clearOldMetrics, (state, { olderThan }) => ({
    ...state,
    metrics: state.metrics.filter(m => m.timestamp > olderThan),
    userInteractions: state.userInteractions.filter(i => i.timestamp > olderThan),
    memorySnapshots: state.memorySnapshots.filter(s => s.timestamp > olderThan)
  })),
  
  on(PerformanceActions.clearAllMetrics, (state) => ({
    ...state,
    metrics: [],
    userInteractions: [],
    memorySnapshots: [],
    coreWebVitals: {
      cls: [],
      fid: [],
      lcp: [],
      fcp: [],
      ttfb: []
    }
  })),
  
  on(PerformanceActions.resetPerformanceState, () => initialState)
);
