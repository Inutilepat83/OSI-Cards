/**
 * SLA Monitoring Service
 *
 * Monitors Service Level Agreement compliance.
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class MyComponent {
 *   private slaMonitor = inject(SLAMonitorService);
 *
 *   ngOnInit() {
 *     this.slaMonitor.getSLAStatus().subscribe(status => {
 *       console.log('Uptime:', status.uptime);
 *     });
 *   }
 * }
 * ```
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Observable } from 'rxjs';

export interface SLAMetrics {
  uptime: number; // Percentage (0-100)
  availability: number; // Percentage (0-100)
  responseTime: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
  errorRate: number; // Percentage (0-100)
  throughput: number; // Requests per second
  latency: number; // Average latency in ms
}

export interface SLAStatus {
  compliant: boolean;
  metrics: SLAMetrics;
  violations: string[];
  period: {
    start: number;
    end: number;
  };
}

export interface SLATargets {
  uptime: number; // e.g., 99.9%
  maxResponseTime: number; // e.g., 500ms
  maxErrorRate: number; // e.g., 1%
  minThroughput: number; // e.g., 100 req/s
}

@Injectable({
  providedIn: 'root',
})
export class SLAMonitorService {
  private status = new BehaviorSubject<SLAStatus | null>(null);
  private startTime = Date.now();
  private downtime = 0;
  private lastCheck = Date.now();

  // SLA Targets
  private targets: SLATargets = {
    uptime: 99.9, // 99.9% uptime
    maxResponseTime: 500, // 500ms
    maxErrorRate: 1, // 1% error rate
    minThroughput: 100, // 100 req/s
  };

  status$: Observable<SLAStatus | null> = this.status.asObservable();

  constructor() {
    this.startMonitoring();
  }

  /**
   * Configure SLA targets
   */
  configureTargets(targets: Partial<SLATargets>): void {
    this.targets = { ...this.targets, ...targets };
  }

  /**
   * Get current SLA status
   */
  getSLAStatus(): SLAStatus {
    const metrics = this.calculateMetrics();
    const violations = this.checkViolations(metrics);

    return {
      compliant: violations.length === 0,
      metrics,
      violations,
      period: {
        start: this.startTime,
        end: Date.now(),
      },
    };
  }

  /**
   * Record downtime
   */
  recordDowntime(durationMs: number): void {
    this.downtime += durationMs;
    this.updateStatus();
  }

  /**
   * Record response time
   */
  recordResponseTime(timeMs: number): void {
    // Would store in time-series database
    if (timeMs > this.targets.maxResponseTime) {
      console.warn(`[SLA] Response time violation: ${timeMs}ms`);
    }
    this.updateStatus();
  }

  /**
   * Record error
   */
  recordError(): void {
    // Would increment error counter
    this.updateStatus();
  }

  /**
   * Get uptime percentage
   */
  getUptime(): number {
    const totalTime = Date.now() - this.startTime;
    const uptime = ((totalTime - this.downtime) / totalTime) * 100;
    return Math.max(0, Math.min(100, uptime));
  }

  /**
   * Get SLA compliance report
   */
  getComplianceReport(periodDays = 30): {
    period: string;
    compliant: boolean;
    uptime: number;
    violations: number;
    details: string[];
  } {
    const status = this.getSLAStatus();
    const uptime = this.getUptime();

    return {
      period: `Last ${periodDays} days`,
      compliant: uptime >= this.targets.uptime,
      uptime,
      violations: status.violations.length,
      details: status.violations,
    };
  }

  /**
   * Calculate current metrics
   */
  private calculateMetrics(): SLAMetrics {
    const uptime = this.getUptime();

    return {
      uptime,
      availability: uptime,
      responseTime: {
        average: 150, // Would calculate from real data
        p50: 100,
        p95: 300,
        p99: 450,
      },
      errorRate: 0.5, // Would calculate from real data
      throughput: 150, // Would calculate from real data
      latency: 150, // Would calculate from real data
    };
  }

  /**
   * Check for SLA violations
   */
  private checkViolations(metrics: SLAMetrics): string[] {
    const violations: string[] = [];

    if (metrics.uptime < this.targets.uptime) {
      violations.push(
        `Uptime below target: ${metrics.uptime.toFixed(2)}% < ${this.targets.uptime}%`
      );
    }

    if (metrics.responseTime.p95 > this.targets.maxResponseTime) {
      violations.push(
        `P95 response time above target: ${metrics.responseTime.p95}ms > ${this.targets.maxResponseTime}ms`
      );
    }

    if (metrics.errorRate > this.targets.maxErrorRate) {
      violations.push(
        `Error rate above target: ${metrics.errorRate}% > ${this.targets.maxErrorRate}%`
      );
    }

    if (metrics.throughput < this.targets.minThroughput) {
      violations.push(
        `Throughput below target: ${metrics.throughput} req/s < ${this.targets.minThroughput} req/s`
      );
    }

    return violations;
  }

  /**
   * Update SLA status
   */
  private updateStatus(): void {
    const status = this.getSLAStatus();
    this.status.next(status);

    // Alert on violations
    if (status.violations.length > 0) {
      console.error('[SLA] Violations detected:', status.violations);
    }
  }

  /**
   * Start monitoring loop
   */
  private startMonitoring(): void {
    // Update status every minute
    interval(60000).subscribe(() => {
      this.updateStatus();
    });

    // Initial status
    this.updateStatus();
  }
}
