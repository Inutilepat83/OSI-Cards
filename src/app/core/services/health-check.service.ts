/**
 * Health Check Service
 *
 * Provides health check endpoints and monitoring for the application.
 * Monitors critical services and dependencies.
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class HealthComponent {
 *   private health = inject(HealthCheckService);
 *
 *   async checkHealth() {
 *     const status = await this.health.check();
 *     console.log('Health:', status.status);
 *   }
 * }
 * ```
 */

import { Injectable } from '@angular/core';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  version: string;
  uptime: number;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  duration: number;
  message?: string;
  metadata?: Record<string, unknown>;
}

@Injectable({
  providedIn: 'root',
})
export class HealthCheckService {
  private startTime = Date.now();
  private version = '1.5.5'; // Should match package.json

  /**
   * Perform comprehensive health check
   */
  async check(): Promise<HealthStatus> {
    const checks: HealthCheck[] = await Promise.all([
      this.checkMemory(),
      this.checkPerformance(),
      this.checkDOM(),
      this.checkLocalStorage(),
      this.checkNetwork(),
    ]);

    // Determine overall status
    const hasFailed = checks.some((c) => c.status === 'fail');
    const hasWarnings = checks.some((c) => c.status === 'warn');

    const status: HealthStatus['status'] = hasFailed
      ? 'unhealthy'
      : hasWarnings
        ? 'degraded'
        : 'healthy';

    return {
      status,
      timestamp: Date.now(),
      version: this.version,
      uptime: this.getUptime(),
      checks,
    };
  }

  /**
   * Check memory usage
   */
  private async checkMemory(): Promise<HealthCheck> {
    const start = performance.now();

    try {
      const memory = (performance as any).memory;

      if (!memory) {
        return {
          name: 'memory',
          status: 'warn',
          duration: performance.now() - start,
          message: 'Memory API not available',
        };
      }

      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
      const usagePercent = (usedMB / limitMB) * 100;

      return {
        name: 'memory',
        status: usagePercent > 90 ? 'fail' : usagePercent > 70 ? 'warn' : 'pass',
        duration: performance.now() - start,
        message: `${usedMB.toFixed(0)}MB used (${usagePercent.toFixed(1)}%)`,
        metadata: {
          usedMB,
          limitMB,
          usagePercent,
        },
      };
    } catch (error) {
      return {
        name: 'memory',
        status: 'fail',
        duration: performance.now() - start,
        message: `Check failed: ${error}`,
      };
    }
  }

  /**
   * Check performance
   */
  private async checkPerformance(): Promise<HealthCheck> {
    const start = performance.now();

    try {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;

      if (!navigation) {
        return {
          name: 'performance',
          status: 'warn',
          duration: performance.now() - start,
          message: 'Navigation timing not available',
        };
      }

      const loadTime = navigation.loadEventEnd - navigation.fetchStart;

      return {
        name: 'performance',
        status: loadTime > 5000 ? 'warn' : 'pass',
        duration: performance.now() - start,
        message: `Page load: ${loadTime.toFixed(0)}ms`,
        metadata: {
          loadTime,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          domInteractive: navigation.domInteractive - navigation.fetchStart,
        },
      };
    } catch (error) {
      return {
        name: 'performance',
        status: 'warn',
        duration: performance.now() - start,
        message: `Check not available`,
      };
    }
  }

  /**
   * Check DOM health
   */
  private async checkDOM(): Promise<HealthCheck> {
    const start = performance.now();

    try {
      const nodeCount = document.getElementsByTagName('*').length;

      return {
        name: 'dom',
        status: nodeCount > 10000 ? 'warn' : 'pass',
        duration: performance.now() - start,
        message: `${nodeCount} DOM nodes`,
        metadata: {
          nodeCount,
        },
      };
    } catch (error) {
      return {
        name: 'dom',
        status: 'fail',
        duration: performance.now() - start,
        message: `Check failed: ${error}`,
      };
    }
  }

  /**
   * Check localStorage availability
   */
  private async checkLocalStorage(): Promise<HealthCheck> {
    const start = performance.now();

    try {
      const testKey = '__health_check__';
      localStorage.setItem(testKey, 'test');
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      return {
        name: 'localStorage',
        status: retrieved === 'test' ? 'pass' : 'fail',
        duration: performance.now() - start,
        message: retrieved === 'test' ? 'Available' : 'Not working',
      };
    } catch (error) {
      return {
        name: 'localStorage',
        status: 'fail',
        duration: performance.now() - start,
        message: 'Not available (private mode?)',
      };
    }
  }

  /**
   * Check network connectivity
   */
  private async checkNetwork(): Promise<HealthCheck> {
    const start = performance.now();

    try {
      const online = navigator.onLine;

      return {
        name: 'network',
        status: online ? 'pass' : 'fail',
        duration: performance.now() - start,
        message: online ? 'Online' : 'Offline',
        metadata: {
          online,
          connection: (navigator as any).connection?.effectiveType || 'unknown',
        },
      };
    } catch (error) {
      return {
        name: 'network',
        status: 'warn',
        duration: performance.now() - start,
        message: 'Check not available',
      };
    }
  }

  /**
   * Get application uptime in milliseconds
   */
  getUptime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Get formatted uptime
   */
  getFormattedUptime(): string {
    const uptime = this.getUptime();
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  /**
   * Check if in production
   */
  private isProduction(): boolean {
    return (
      typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      !window.location.hostname.includes('127.0.0.1')
    );
  }

  /**
   * Check if in development
   */
  private isDevelopment(): boolean {
    return !this.isProduction();
  }

  /**
   * Send to external monitoring service
   */
  private sendToExternalService(error: any): void {
    // TODO: Integrate with external monitoring (DataDog, New Relic, etc.)
    // For now, this is a placeholder
  }

  /**
   * Get health status as HTTP response format
   */
  async getHealthResponse(): Promise<{
    status: number;
    body: HealthStatus;
  }> {
    const health = await this.check();

    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

    return {
      status: statusCode,
      body: health,
    };
  }
}
