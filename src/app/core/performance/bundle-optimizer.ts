/**
 * Performance optimization utilities and bundle size analysis
 */

export class BundleOptimizer {
  /**
   * Analyze large dependencies and suggest optimizations
   */
  static analyzeDependencies(): OptimizationSuggestion[] {
    return [
      {
        package: '@angular/material',
        currentSize: '~200kb',
        optimization: 'Import only needed modules',
        example: `
// Instead of importing entire MatModule
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
        `,
      },
      {
        package: 'primeng',
        currentSize: '~150kb',
        optimization: 'Tree-shake unused components',
        example: `
// Import specific components only
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
        `,
      },
      {
        package: 'chart.js',
        currentSize: '~100kb',
        optimization: 'Lazy load and tree-shake',
        example: `
// Lazy load Chart.js
const chartModule = await import('chart.js');
        `,
      },
      {
        package: 'leaflet',
        currentSize: '~80kb',
        optimization: 'Conditional loading',
        example: `
// Load only when map component is used
if (needsMap) {
  const leaflet = await import('leaflet');
}
        `,
      },
    ];
  }

  /**
   * Get tree-shaking optimizations
   */
  static getTreeShakingOptimizations(): TreeShakingRule[] {
    return [
      {
        rule: 'Use ES6 imports with specific imports',
        bad: `import * as _ from 'lodash';`,
        good: `import { debounce, throttle } from 'lodash-es';`,
      },
      {
        rule: 'Avoid barrel exports for large libraries',
        bad: `import { Component } from '@angular/core';`,
        good: `// This is actually good for Angular core, but bad for large utility libraries`,
      },
      {
        rule: 'Use conditional imports',
        bad: `import { HeavyFeature } from './heavy-feature';`,
        good: `const { HeavyFeature } = await import('./heavy-feature');`,
      },
    ];
  }
}

export interface OptimizationSuggestion {
  package: string;
  currentSize: string;
  optimization: string;
  example: string;
}

export interface TreeShakingRule {
  rule: string;
  bad: string;
  good: string;
}

/**
 * Lazy loading utilities for heavy features
 */
export class LazyLoader {
  private static loadedModules = new Map<string, any>();

  /**
   * Lazy load a module and cache it
   */
  static async loadModule<T>(moduleLoader: () => Promise<T>, moduleKey: string): Promise<T> {
    if (this.loadedModules.has(moduleKey)) {
      return this.loadedModules.get(moduleKey);
    }

    const module = await moduleLoader();
    this.loadedModules.set(moduleKey, module);
    return module;
  }

  /**
   * Lazy load Chart.js when needed
   */
  static async loadChartJs() {
    return this.loadModule(() => import('chart.js'), 'chart.js');
  }

  /**
   * Lazy load Leaflet when needed
   */
  static async loadLeaflet() {
    return this.loadModule(() => import('leaflet'), 'leaflet');
  }

  /**
   * Lazy load html2canvas for export functionality
   */
  static async loadHtml2Canvas() {
    return this.loadModule(() => import('html2canvas'), 'html2canvas');
  }

  /**
   * Preload critical modules
   */
  static preloadCriticalModules(): void {
    // Only preload if user is likely to use these features
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        // Preload chart.js if analytics cards are common
        this.loadChartJs().catch(() => {
          // Silent fail for preloading
        });
      });
    }
  }

  /**
   * Clear module cache to free memory
   */
  static clearCache(): void {
    this.loadedModules.clear();
  }
}

/**
 * Performance monitoring for bundle size and loading times
 */
export class PerformanceMonitor {
  private static measurements = new Map<string, PerformanceMeasurement>();

  /**
   * Start measuring a performance metric
   */
  static startMeasurement(name: string): void {
    const startTime = performance.now();
    this.measurements.set(name, {
      name,
      startTime,
      endTime: 0,
      duration: 0,
    });
  }

  /**
   * End measurement and calculate duration
   */
  static endMeasurement(name: string): PerformanceMeasurement | null {
    const measurement = this.measurements.get(name);
    if (!measurement) return null;

    measurement.endTime = performance.now();
    measurement.duration = measurement.endTime - measurement.startTime;

    return measurement;
  }

  /**
   * Measure bundle loading performance
   */
  static measureBundleLoad(): void {
    // Measure First Contentful Paint
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
            console.log(`First Contentful Paint: ${entry.startTime}ms`);
          }
        }
      });
      observer.observe({ entryTypes: ['paint'] });
    }

    // Measure Time to Interactive
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure' && entry.name === 'TTI') {
            console.log(`Time to Interactive: ${entry.duration}ms`);
          }
        }
      });
      observer.observe({ entryTypes: ['measure'] });
    }
  }

  /**
   * Get bundle size information
   */
  static getBundleInfo(): BundleInfo {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));

    return {
      scriptCount: scripts.length,
      styleCount: styles.length,
      totalResources: scripts.length + styles.length,
      estimatedSize: this.estimateResourceSizes(scripts, styles),
    };
  }

  private static estimateResourceSizes(scripts: Element[], styles: Element[]): string {
    // This is an estimation - in production you'd get actual sizes from network API
    const estimatedScriptSize = scripts.length * 100; // ~100kb per script estimate
    const estimatedStyleSize = styles.length * 20; // ~20kb per stylesheet estimate

    return `~${estimatedScriptSize + estimatedStyleSize}kb`;
  }
}

export interface PerformanceMeasurement {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
}

export interface BundleInfo {
  scriptCount: number;
  styleCount: number;
  totalResources: number;
  estimatedSize: string;
}
