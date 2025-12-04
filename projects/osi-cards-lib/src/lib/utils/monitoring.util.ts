/**
 * Monitoring Utilities
 *
 * Utilities for application monitoring and health checks.
 *
 * @example
 * ```typescript
 * import { Monitor, createHealthCheck } from '@osi-cards/utils';
 *
 * const monitor = new Monitor();
 * monitor.trackMetric('api_calls', 42);
 * const health = await createHealthCheck(() => checkDatabase());
 * ```
 */

export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  timestamp: Date;
}

export class Monitor {
  private metrics: Metric[] = [];
  private maxMetrics = 1000;

  trackMetric(name: string, value: number, tags?: Record<string, string>): void {
    this.metrics.push({
      name,
      value,
      timestamp: new Date(),
      tags,
    });

    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  getMetrics(name?: string): Metric[] {
    if (name) {
      return this.metrics.filter((m) => m.name === name);
    }
    return this.metrics;
  }

  getLatestMetric(name: string): Metric | undefined {
    const metrics = this.getMetrics(name);
    return metrics[metrics.length - 1];
  }

  getAverageMetric(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;

    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }
}

export function createHealthCheck(
  name: string,
  checkFn: () => Promise<boolean> | boolean
): () => Promise<HealthCheck> {
  return async () => {
    try {
      const result = await checkFn();
      return {
        name,
        status: result ? 'healthy' : 'unhealthy',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name,
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Check failed',
        timestamp: new Date(),
      };
    }
  };
}

export async function runHealthChecks(
  checks: Array<() => Promise<HealthCheck>>
): Promise<HealthCheck[]> {
  return Promise.all(checks.map((check) => check()));
}

export function getOverallHealth(checks: HealthCheck[]): 'healthy' | 'degraded' | 'unhealthy' {
  const unhealthy = checks.filter((c) => c.status === 'unhealthy').length;
  const degraded = checks.filter((c) => c.status === 'degraded').length;

  if (unhealthy > 0) return 'unhealthy';
  if (degraded > 0) return 'degraded';
  return 'healthy';
}

export const globalMonitor = new Monitor();

export function trackMetric(name: string, value: number, tags?: Record<string, string>): void {
  globalMonitor.trackMetric(name, value, tags);
}

export function getMetrics(name?: string): Metric[] {
  return globalMonitor.getMetrics(name);
}
