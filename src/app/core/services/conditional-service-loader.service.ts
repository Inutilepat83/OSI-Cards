import { Injectable, Injector } from '@angular/core';

/**
 * Service for conditional loading of heavy services
 * Helps reduce initial bundle size by loading services on demand
 */
@Injectable({
  providedIn: 'root',
})
export class ConditionalServiceLoader {
  constructor(private injector: Injector) {}

  /**
   * Load performance monitoring service only when needed
   */
  async loadPerformanceMonitoring(): Promise<any> {
    const { PerformanceMonitoringService } = await import(
      '../services/performance-monitoring.service'
    );
    return this.injector.get(PerformanceMonitoringService);
  }

  /**
   * Load offline support service only when needed
   */
  async loadOfflineSupport(): Promise<any> {
    const { OfflineSupportService } = await import('../services/offline-support.service');
    return this.injector.get(OfflineSupportService);
  }

  /**
   * Load advanced security service only when needed
   */
  async loadAdvancedSecurity(): Promise<any> {
    const { AdvancedSecurityService } = await import('../services/advanced-security.service');
    return this.injector.get(AdvancedSecurityService);
  }

  /**
   * Load error reporting service only when needed
   */
  async loadErrorReporting(): Promise<any> {
    const { ErrorReportingService } = await import('../services/error-reporting.service');
    return this.injector.get(ErrorReportingService);
  }

  /**
   * Load accessibility service only when needed
   */
  async loadAccessibility(): Promise<any> {
    const { AccessibilityService } = await import('../accessibility/accessibility.service');
    return this.injector.get(AccessibilityService);
  }
}
