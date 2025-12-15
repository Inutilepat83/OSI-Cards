/**
 * Dev Tools Service
 *
 * Stub implementation for backward compatibility.
 * Apps should implement their own dev tools strategy.
 */

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DevToolsService {
  enablePerformanceMonitoring(): void {
    console.warn('DevToolsService: Implement performance monitoring in your app');
  }

  disablePerformanceMonitoring(): void {
    console.warn('DevToolsService: Implement performance monitoring in your app');
  }

  getPerformanceMetrics(): Map<string, number> {
    return new Map();
  }

  getMemoryUsage(): any {
    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
    };
  }

  clearPerformanceMetrics(): void {
    console.warn('DevToolsService: Implement metrics clearing in your app');
  }
}
