import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  PerformanceMonitoringService,
  PerformanceMetrics,
  AnalyticsEvent,
} from '../../core/services/performance-monitoring.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-performance-dashboard',
  template: `
    <div class="performance-dashboard">
      <div class="dashboard-header">
        <h2>Performance Dashboard</h2>
        <div class="performance-score">
          <div class="score-circle" [class]="'score-' + performanceScore.grade.toLowerCase()">
            {{ performanceScore.score }}
          </div>
          <div class="score-info">
            <h3>Performance Score</h3>
            <p>Grade: {{ performanceScore.grade }}</p>
          </div>
        </div>
      </div>

      <div class="metrics-grid">
        <!-- Core Web Vitals -->
        <div class="metric-card">
          <h3>Largest Contentful Paint (LCP)</h3>
          <div class="metric-value" [class]="'value-' + getLCPStatus()">
            {{ metrics.lcp ? (metrics.lcp / 1000).toFixed(2) + 's' : 'Measuring...' }}
          </div>
          <div class="metric-status">{{ getLCPStatus() }}</div>
        </div>

        <div class="metric-card">
          <h3>First Input Delay (FID)</h3>
          <div class="metric-value" [class]="'value-' + getFIDStatus()">
            {{ metrics.fid ? metrics.fid.toFixed(2) + 'ms' : 'Measuring...' }}
          </div>
          <div class="metric-status">{{ getFIDStatus() }}</div>
        </div>

        <div class="metric-card">
          <h3>Cumulative Layout Shift (CLS)</h3>
          <div class="metric-value" [class]="'value-' + getCLSStatus()">
            {{ metrics.cls ? metrics.cls.toFixed(4) : 'Measuring...' }}
          </div>
          <div class="metric-status">{{ getCLSStatus() }}</div>
        </div>

        <!-- Additional Metrics -->
        <div class="metric-card">
          <h3>First Contentful Paint (FCP)</h3>
          <div class="metric-value">
            {{ metrics.fcp ? (metrics.fcp / 1000).toFixed(2) + 's' : 'Measuring...' }}
          </div>
        </div>

        <div class="metric-card">
          <h3>Time to First Byte (TTFB)</h3>
          <div class="metric-value">
            {{ metrics.ttfb ? metrics.ttfb.toFixed(2) + 'ms' : 'Measuring...' }}
          </div>
        </div>

        <div class="metric-card">
          <h3>DOM Content Loaded</h3>
          <div class="metric-value">
            {{
              metrics.domContentLoaded
                ? (metrics.domContentLoaded / 1000).toFixed(2) + 's'
                : 'Measuring...'
            }}
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="recommendations" *ngIf="performanceScore.recommendations.length > 0">
        <h3>Performance Recommendations</h3>
        <ul>
          <li *ngFor="let rec of performanceScore.recommendations">{{ rec }}</li>
        </ul>
      </div>

      <!-- Analytics Summary -->
      <div class="analytics-summary">
        <h3>Recent Activity</h3>
        <div class="analytics-grid">
          <div class="analytics-card">
            <h4>Page Views</h4>
            <div class="analytics-value">{{ getEventCount('page_view') }}</div>
          </div>
          <div class="analytics-card">
            <h4>User Interactions</h4>
            <div class="analytics-value">
              {{ getEventCount('button_click') + getEventCount('form_submit') }}
            </div>
          </div>
          <div class="analytics-card">
            <h4>Errors</h4>
            <div class="analytics-value">
              {{ getEventCount('javascript_error') + getEventCount('promise_rejection') }}
            </div>
          </div>
          <div class="analytics-card">
            <h4>API Calls</h4>
            <div class="analytics-value">{{ getEventCount('api_response') }}</div>
          </div>
        </div>
      </div>

      <!-- Export Button -->
      <div class="dashboard-actions">
        <button type="button" class="export-btn" (click)="exportReport()">
          <i class="pi pi-download"></i>
          Export Performance Report
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .performance-dashboard {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--surface-border);
      }

      .dashboard-header h2 {
        margin: 0;
        color: var(--text-color);
      }

      .performance-score {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .score-circle {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        font-weight: bold;
        color: white;
      }

      .score-a {
        background: #10b981;
      }
      .score-b {
        background: #84cc16;
      }
      .score-c {
        background: #f59e0b;
      }
      .score-d {
        background: #f97316;
      }
      .score-f {
        background: #ef4444;
      }

      .score-info h3 {
        margin: 0;
        color: var(--text-color);
      }

      .score-info p {
        margin: 0.25rem 0 0 0;
        color: var(--text-color-secondary);
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .metric-card {
        background: var(--surface-card);
        border: 1px solid var(--surface-border);
        border-radius: 8px;
        padding: 1.5rem;
        text-align: center;
      }

      .metric-card h3 {
        margin: 0 0 1rem 0;
        color: var(--text-color);
        font-size: 1rem;
        font-weight: 600;
      }

      .metric-value {
        font-size: 2rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
      }

      .value-good {
        color: #10b981;
      }
      .value-needs-improvement {
        color: #f59e0b;
      }
      .value-poor {
        color: #ef4444;
      }

      .metric-status {
        font-size: 0.9rem;
        color: var(--text-color-secondary);
        text-transform: uppercase;
        font-weight: 500;
      }

      .recommendations {
        background: var(--surface-section);
        border: 1px solid var(--surface-border);
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 2rem;
      }

      .recommendations h3 {
        margin: 0 0 1rem 0;
        color: var(--text-color);
      }

      .recommendations ul {
        margin: 0;
        padding-left: 1.5rem;
      }

      .recommendations li {
        margin-bottom: 0.5rem;
        color: var(--text-color-secondary);
      }

      .analytics-summary {
        margin-bottom: 2rem;
      }

      .analytics-summary h3 {
        margin-bottom: 1rem;
        color: var(--text-color);
      }

      .analytics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }

      .analytics-card {
        background: var(--surface-card);
        border: 1px solid var(--surface-border);
        border-radius: 8px;
        padding: 1rem;
        text-align: center;
      }

      .analytics-card h4 {
        margin: 0 0 0.5rem 0;
        color: var(--text-color);
        font-size: 0.9rem;
      }

      .analytics-value {
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--primary-color);
      }

      .dashboard-actions {
        text-align: center;
      }

      .export-btn {
        background: var(--primary-color);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.2s ease;
      }

      .export-btn:hover {
        background: var(--primary-color-hover);
        transform: translateY(-1px);
      }

      /* Dark theme support */
      [data-theme='dark'] .metric-card,
      [data-theme='dark'] .analytics-card {
        background: var(--surface-card-dark);
        border-color: var(--surface-border-dark);
      }

      [data-theme='dark'] .recommendations {
        background: var(--surface-section-dark);
        border-color: var(--surface-border-dark);
      }
    `,
  ],
})
export class PerformanceDashboardComponent implements OnInit, OnDestroy {
  metrics: PerformanceMetrics = {
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    domContentLoaded: null,
    loadComplete: null,
    componentRenderTime: 0,
    apiResponseTime: 0,
    bundleSize: 0,
  };

  performanceScore = { score: 0, grade: 'A', recommendations: [] as string[] };
  analyticsEvents: AnalyticsEvent[] = [];
  private subscriptions: Subscription[] = [];

  constructor(private performanceService: PerformanceMonitoringService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.performanceService.getMetrics$().subscribe(metrics => {
        this.metrics = metrics;
        this.performanceScore = this.performanceService.getPerformanceScore();
      })
    );

    this.analyticsEvents = this.performanceService.getAnalyticsEvents();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getLCPStatus(): string {
    if (!this.metrics.lcp) return 'measuring';
    if (this.metrics.lcp <= 2500) return 'good';
    if (this.metrics.lcp <= 4000) return 'needs-improvement';
    return 'poor';
  }

  getFIDStatus(): string {
    if (!this.metrics.fid) return 'measuring';
    if (this.metrics.fid <= 100) return 'good';
    if (this.metrics.fid <= 300) return 'needs-improvement';
    return 'poor';
  }

  getCLSStatus(): string {
    if (!this.metrics.cls) return 'measuring';
    if (this.metrics.cls <= 0.1) return 'good';
    if (this.metrics.cls <= 0.25) return 'needs-improvement';
    return 'poor';
  }

  getEventCount(eventType: string): number {
    return this.analyticsEvents.filter(event => event.event === eventType).length;
  }

  exportReport(): void {
    const report = this.performanceService.exportPerformanceReport();
    const blob = new Blob([report], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
