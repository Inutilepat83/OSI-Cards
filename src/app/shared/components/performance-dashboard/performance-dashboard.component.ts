import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PerformanceMetric, PerformanceService } from '../../../core/services/performance.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

/**
 * Performance Monitoring Dashboard Component
 *
 * Displays real-time performance metrics including:
 * - Web Vitals (LCP, FID, CLS, FCP, TTI)
 * - Custom metrics
 * - Performance budgets
 * - Memory usage
 * - Slow operations
 *
 * @example
 * ```html
 * <app-performance-dashboard [autoRefresh]="true" [refreshInterval]="5000"></app-performance-dashboard>
 * ```
 */
@Component({
  selector: 'app-performance-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './performance-dashboard.component.html',
  styleUrls: ['./performance-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerformanceDashboardComponent implements OnInit {
  private readonly performanceService = inject(PerformanceService);
  private readonly destroyRef = inject(DestroyRef);

  autoRefresh = true;
  refreshInterval = 5000; // 5 seconds

  // Metrics
  summary: ReturnType<typeof this.performanceService.getSummary> | null = null;
  webVitals: {
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    tti?: number;
  } = {};
  memoryUsage: {
    used?: number;
    total?: number;
    limit?: number;
  } = {};
  recentMetrics: PerformanceMetric[] = [];
  budgetViolations: ReturnType<typeof this.performanceService.getViolations> = [];

  ngOnInit(): void {
    this.loadMetrics();

    if (this.autoRefresh) {
      interval(this.refreshInterval)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.loadMetrics();
        });
    }
  }

  /**
   * Load all performance metrics
   */
  loadMetrics(): void {
    this.summary = this.performanceService.getSummary();
    this.recentMetrics = this.performanceService.getRecentMetrics(10);
    this.budgetViolations = this.performanceService.getViolations();

    // Trigger change detection
    // Note: In a real implementation, you might want to inject ChangeDetectorRef

    // Extract Web Vitals from metrics
    const metrics = this.performanceService.getMetrics();
    const lcp = this.findMetricValue(metrics, 'LCP');
    const fid = this.findMetricValue(metrics, 'FID');
    const cls = this.findMetricValue(metrics, 'CLS');
    const fcp = this.findMetricValue(metrics, 'FCP');
    const tti = this.findMetricValue(metrics, 'TTI');

    this.webVitals = {};
    if (lcp !== undefined) {
      this.webVitals.lcp = lcp;
    }
    if (fid !== undefined) {
      this.webVitals.fid = fid;
    }
    if (cls !== undefined) {
      this.webVitals.cls = cls;
    }
    if (fcp !== undefined) {
      this.webVitals.fcp = fcp;
    }
    if (tti !== undefined) {
      this.webVitals.tti = tti;
    }

    // Get memory usage if available
    if (typeof (performance as any).memory !== 'undefined') {
      const memory = (performance as any).memory;
      this.memoryUsage = {
        used: memory.usedJSHeapSize / 1048576, // Convert to MB
        total: memory.totalJSHeapSize / 1048576,
        limit: memory.jsHeapSizeLimit / 1048576,
      };
    }
  }

  /**
   * Find metric value by name
   */
  private findMetricValue(metrics: PerformanceMetric[], name: string): number | undefined {
    const metric = metrics.find((m) => m.name === name);
    return metric?.duration;
  }

  /**
   * Format duration in milliseconds
   */
  formatDuration(ms?: number): string {
    if (ms === undefined) {
      return 'N/A';
    }
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  }

  /**
   * Format memory in MB
   */
  formatMemory(mb?: number): string {
    if (mb === undefined) {
      return 'N/A';
    }
    return `${mb.toFixed(2)} MB`;
  }

  /**
   * Format timestamp
   */
  formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString();
  }

  /**
   * Format timestamp with date
   */
  formatTimestampWithDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  /**
   * Get Web Vital status (good, needs improvement, poor)
   */
  getWebVitalStatus(
    value: number | undefined,
    thresholds: { good: number; poor: number }
  ): 'good' | 'needs-improvement' | 'poor' | 'unknown' {
    if (value === undefined) {
      return 'unknown';
    }
    if (value <= thresholds.good) {
      return 'good';
    }
    if (value <= thresholds.poor) {
      return 'needs-improvement';
    }
    return 'poor';
  }

  /**
   * Get status class for Web Vital
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'good':
        return 'status-good';
      case 'needs-improvement':
        return 'status-warning';
      case 'poor':
        return 'status-error';
      default:
        return 'status-unknown';
    }
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.performanceService.clearMetrics();
    this.loadMetrics();
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): void {
    const data = {
      summary: this.summary,
      webVitals: this.webVitals,
      memoryUsage: this.memoryUsage,
      recentMetrics: this.recentMetrics,
      budgetViolations: this.budgetViolations,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
