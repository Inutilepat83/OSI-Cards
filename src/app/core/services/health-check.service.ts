import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, timer } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { LoggingService } from './logging.service';
import { AppConfigService } from './app-config.service';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  services: Record<string, {
      status: 'up' | 'down' | 'degraded';
      responseTime?: number;
      error?: string;
    }>;
  metrics: {
    uptime: number;
    memoryUsage?: number;
    cpuUsage?: number;
  };
}

/**
 * Health Check Service
 * 
 * Provides health check endpoints and monitoring for the application.
 * Can be used to monitor service availability and performance.
 * 
 * @example
 * ```typescript
 * const healthCheck = inject(HealthCheckService);
 * healthCheck.checkHealth().subscribe(status => {
 *   console.log('Health status:', status.status);
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class HealthCheckService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggingService);
  private readonly config = inject(AppConfigService);
  
  private readonly startTime = Date.now();
  private readonly healthCheckInterval = 30000; // 30 seconds

  /**
   * Check application health
   */
  checkHealth(): Observable<HealthStatus> {
    const services: HealthStatus['services'] = {};
    
    // Check API health
    const apiHealth$ = this.checkApiHealth().pipe(
      map(result => {
        services['api'] = result;
        return result;
      }),
      catchError(error => {
        services['api'] = {
          status: 'down',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        return of(services['api']);
      })
    );

    // Check local storage
    const storageHealth = this.checkStorageHealth();
    services['storage'] = storageHealth;

    // Check service worker
    const swHealth = this.checkServiceWorkerHealth();
    services['serviceWorker'] = swHealth;

    return apiHealth$.pipe(
      map(() => {
        const overallStatus = this.determineOverallStatus(services);
        
        return {
          status: overallStatus,
          timestamp: new Date(),
          services,
          metrics: {
            uptime: Date.now() - this.startTime,
            memoryUsage: this.getMemoryUsage(),
            cpuUsage: this.getCpuUsage()
          }
        };
      })
    );
  }

  /**
   * Check API health
   */
  private checkApiHealth(): Observable<{ status: 'up' | 'down' | 'degraded'; responseTime?: number; error?: string }> {
    const apiUrl = this.config.ENV.API_URL;
    
    if (!apiUrl || apiUrl === '/api') {
      // No external API configured
      return of({ status: 'up' });
    }

    const startTime = performance.now();
    return this.http.get(`${apiUrl}/health`, { observe: 'response' }).pipe(
      map(response => {
        const responseTime = performance.now() - startTime;
        const status: 'up' | 'down' | 'degraded' = response.status === 200 ? 'up' : 'degraded';
        return { status, responseTime };
      }),
      catchError(error => {
        const responseTime = performance.now() - startTime;
        return of({
          status: 'down' as const,
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      })
    );
  }

  /**
   * Check storage health
   */
  private checkStorageHealth(): { status: 'up' | 'down' | 'degraded'; error?: string } {
    try {
      const testKey = '__health_check__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return { status: 'up' };
    } catch (error) {
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Storage unavailable'
      };
    }
  }

  /**
   * Check service worker health
   */
  private checkServiceWorkerHealth(): { status: 'up' | 'down' | 'degraded'; error?: string } {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      return { status: 'up' };
    }
    return {
      status: 'degraded',
      error: 'Service Worker not supported'
    };
  }

  /**
   * Determine overall health status
   */
  private determineOverallStatus(services: HealthStatus['services']): 'healthy' | 'degraded' | 'unhealthy' {
    const serviceStatuses = Object.values(services);
    const downCount = serviceStatuses.filter(s => s.status === 'down').length;
    const degradedCount = serviceStatuses.filter(s => s.status === 'degraded').length;

    if (downCount > 0) {
      return 'unhealthy';
    }
    if (degradedCount > 0) {
      return 'degraded';
    }
    return 'healthy';
  }

  /**
   * Get memory usage (if available)
   */
  private getMemoryUsage(): number | undefined {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / memory.totalJSHeapSize;
    }
    return undefined;
  }

  /**
   * Get CPU usage (estimated)
   */
  private getCpuUsage(): number | undefined {
    // CPU usage is not directly available in browser
    // This would require performance monitoring over time
    return undefined;
  }

  /**
   * Start periodic health checks
   */
  startPeriodicHealthChecks(): Observable<HealthStatus> {
    return timer(0, this.healthCheckInterval).pipe(
      switchMap(() => this.checkHealth())
    );
  }

  /**
   * Get health check endpoint URL
   */
  getHealthCheckUrl(): string {
    return '/api/health';
  }
}

