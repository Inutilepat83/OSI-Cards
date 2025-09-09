import { InjectionToken } from '@angular/core';

export interface PerformanceConfig {
  debounceTime: number;
  throttleTime: number;
  virtualScrollItemSize: number;
  virtualScrollBufferSize: number;
  lazyLoadingThreshold: number;
  memoryCleanupInterval: number;
  performanceTrackingEnabled: boolean;
  enableWebWorkers: boolean;
  enableServiceWorker: boolean;
  compressionEnabled: boolean;
  imageLazyLoading: boolean;
  preloadStrategy: 'none' | 'preload-all' | 'smart-preload';
  bundleOptimization: boolean;
  treeShakingEnabled: boolean;
  enableCriticalCSS: boolean;
  enableProgressiveLoading: boolean;
  enableResourceHints: boolean;
  enableSkeletonLoading: boolean;
  enableChunkedDataLoading: boolean;
}

export const defaultPerformanceConfig: PerformanceConfig = {
  debounceTime: 300,
  throttleTime: 100,
  virtualScrollItemSize: 400,
  virtualScrollBufferSize: 5,
  lazyLoadingThreshold: 0.1,
  memoryCleanupInterval: 300000, // 5 minutes
  performanceTrackingEnabled: true,
  enableWebWorkers: false, // Disabled by default, can be enabled via feature flags
  enableServiceWorker: true,
  compressionEnabled: true,
  imageLazyLoading: true,
  preloadStrategy: 'smart-preload',
  bundleOptimization: true,
  treeShakingEnabled: true,
  enableCriticalCSS: true,
  enableProgressiveLoading: true,
  enableResourceHints: true,
  enableSkeletonLoading: true,
  enableChunkedDataLoading: true
};

export const PERFORMANCE_CONFIG = new InjectionToken<PerformanceConfig>('performance.config', {
  providedIn: 'root',
  factory: () => defaultPerformanceConfig
});

// Environment-specific configurations
export const developmentPerformanceConfig: Partial<PerformanceConfig> = {
  debounceTime: 500, // Higher debounce for development
  performanceTrackingEnabled: true,
  enableWebWorkers: false,
  compressionEnabled: false
};

export const productionPerformanceConfig: Partial<PerformanceConfig> = {
  debounceTime: 200, // Lower debounce for production
  performanceTrackingEnabled: true,
  enableWebWorkers: true,
  compressionEnabled: true,
  bundleOptimization: true,
  treeShakingEnabled: true
};

export const testingPerformanceConfig: Partial<PerformanceConfig> = {
  debounceTime: 0, // No debounce for testing
  performanceTrackingEnabled: false,
  enableWebWorkers: false,
  enableServiceWorker: false
};
