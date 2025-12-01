import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogEntry, LoggingService } from '../../../core/services/logging.service';
import { PerformanceService } from '../../../core/services/performance.service';
import { DevToolsService } from '../../../core/services/dev-tools.service';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app.state';
import { selectCards } from '../../../store/cards/cards.selectors';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Developer Tools Component
 *
 * Provides debugging panel for developers to inspect:
 * - Log history with filtering
 * - Performance metrics
 * - Application state
 * - Card data
 *
 * Only visible in development mode.
 *
 * @example
 * ```html
 * <app-dev-tools *ngIf="!isProduction"></app-dev-tools>
 * ```
 */
@Component({
  selector: 'app-dev-tools',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dev-tools-container" *ngIf="isVisible" [class.collapsed]="isCollapsed">
      <div class="dev-tools-header" (click)="toggleCollapse()">
        <h3>Developer Tools</h3>
        <button
          type="button"
          class="toggle-btn"
          [attr.aria-label]="isCollapsed ? 'Expand' : 'Collapse'"
        >
          {{ isCollapsed ? '▼' : '▲' }}
        </button>
      </div>

      <div class="dev-tools-content" *ngIf="!isCollapsed">
        <div class="dev-tools-tabs">
          <button
            *ngFor="let tab of tabs"
            type="button"
            [class.active]="activeTab === tab"
            (click)="activeTab = tab"
            [attr.aria-label]="'Switch to ' + tab + ' tab'"
          >
            {{ tab }}
          </button>
        </div>

        <!-- Logs Tab -->
        <div class="dev-tools-panel" *ngIf="activeTab === 'Logs'">
          <div class="panel-controls">
            <select [(ngModel)]="logLevelFilter" (ngModelChange)="filterLogs()">
              <option value="">All Levels</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
            </select>
            <button type="button" (click)="clearLogs()">Clear Logs</button>
          </div>
          <div class="log-entries">
            <div
              *ngFor="let entry of filteredLogs"
              class="log-entry"
              [class]="'log-entry--' + entry.level"
            >
              <span class="log-time">{{ entry.timestamp | date: 'HH:mm:ss.SSS' }}</span>
              <span class="log-level">{{ entry.level }}</span>
              <span class="log-context" *ngIf="entry.context">[{{ entry.context }}]</span>
              <span class="log-message">{{ entry.message }}</span>
              <span class="log-correlation" *ngIf="entry.correlationId"
                >Corr: {{ entry.correlationId }}</span
              >
            </div>
          </div>
        </div>

        <!-- Performance Tab -->
        <div class="dev-tools-panel" *ngIf="activeTab === 'Performance'">
          <div class="metric-grid">
            <div class="metric-item" *ngFor="let metric of performanceMetrics">
              <div class="metric-label">{{ metric.name }}</div>
              <div class="metric-value">{{ metric.value }}</div>
            </div>
          </div>
        </div>

        <!-- State Tab -->
        <div class="dev-tools-panel" *ngIf="activeTab === 'State'">
          <div class="panel-controls">
            <button type="button" (click)="refreshState()">Refresh</button>
            <button type="button" (click)="exportState()">Export State</button>
            <button type="button" (click)="clearState()">Clear State</button>
          </div>
          <div class="state-info">
            <h4>Application State</h4>
            <div class="state-stats">
              <div class="stat-item">
                <span class="stat-label">Cards:</span>
                <span class="stat-value">{{ (cards$ | async)?.length || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Session ID:</span>
                <span class="stat-value">{{ sessionId }}</span>
              </div>
            </div>
            <div class="state-tree">
              <div class="state-node" *ngFor="let node of stateTree">
                <div class="state-node-header" (click)="toggleNode(node)">
                  <span class="node-toggle">{{ node.expanded ? '▼' : '▶' }}</span>
                  <span class="node-key">{{ node.key }}</span>
                  <span class="node-type">{{ node.type }}</span>
                </div>
                <div class="state-node-content" *ngIf="node.expanded">
                  <pre>{{ node.value }}</pre>
                </div>
              </div>
            </div>
            <div class="state-json">
              <pre>{{ statePreview }}</pre>
            </div>
          </div>
        </div>

        <!-- Profiler Tab -->
        <div class="dev-tools-panel" *ngIf="activeTab === 'Profiler'">
          <div class="panel-controls">
            <button type="button" (click)="toggleProfiler()">
              {{ isProfiling ? 'Stop' : 'Start' }} Profiling
            </button>
            <button type="button" (click)="clearProfilerData()" [disabled]="!isProfiling">
              Clear
            </button>
          </div>
          <div class="profiler-info">
            <h4>Performance Profiler</h4>
            <div class="profiler-stats">
              <div class="stat-item" *ngFor="let stat of profilerStats">
                <span class="stat-label">{{ stat.label }}:</span>
                <span class="stat-value">{{ stat.value }}</span>
              </div>
            </div>
            <div class="profiler-metrics">
              <h5>Execution Times</h5>
              <div class="metric-list">
                <div class="metric-row" *ngFor="let metric of profilerMetrics">
                  <span class="metric-name">{{ metric.name }}</span>
                  <span class="metric-time">{{ metric.time }}ms</span>
                  <div class="metric-bar">
                    <div class="metric-bar-fill" [style.width.%]="metric.percentage"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="memory-info" *ngIf="memoryInfo">
              <h5>Memory Usage</h5>
              <div class="memory-stats">
                <div class="memory-item">
                  <span>Used:</span>
                  <span>{{ memoryInfo.used }} MB</span>
                </div>
                <div class="memory-item">
                  <span>Total:</span>
                  <span>{{ memoryInfo.total }} MB</span>
                </div>
                <div class="memory-item">
                  <span>Limit:</span>
                  <span>{{ memoryInfo.limit }} MB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .dev-tools-container {
        position: fixed;
        bottom: 0;
        right: 0;
        width: 400px;
        max-height: 500px;
        background: var(--card-background, #1a1a1a);
        border: 1px solid var(--border, #333);
        border-radius: 8px 8px 0 0;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        font-family: monospace;
        font-size: 12px;
      }

      .dev-tools-container.collapsed {
        height: 40px;
      }

      .dev-tools-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: var(--muted, #2a2a2a);
        cursor: pointer;
        user-select: none;
      }

      .dev-tools-header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
      }

      .toggle-btn {
        background: none;
        border: none;
        color: var(--foreground, #fff);
        cursor: pointer;
        font-size: 12px;
      }

      .dev-tools-content {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .dev-tools-tabs {
        display: flex;
        border-bottom: 1px solid var(--border, #333);
      }

      .dev-tools-tabs button {
        flex: 1;
        padding: 8px;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: var(--muted-foreground, #999);
        cursor: pointer;
        font-size: 12px;
      }

      .dev-tools-tabs button.active {
        color: var(--foreground, #fff);
        border-bottom-color: var(--primary, #ff7900);
      }

      .dev-tools-panel {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
      }

      .panel-controls {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
      }

      .panel-controls select,
      .panel-controls button {
        padding: 4px 8px;
        background: var(--muted, #2a2a2a);
        border: 1px solid var(--border, #333);
        color: var(--foreground, #fff);
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
      }

      .log-entries {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .log-entry {
        padding: 4px 8px;
        border-radius: 4px;
        display: flex;
        gap: 8px;
        align-items: center;
        font-size: 11px;
      }

      .log-entry--debug {
        background: rgba(100, 100, 100, 0.1);
      }
      .log-entry--info {
        background: rgba(59, 130, 246, 0.1);
      }
      .log-entry--warn {
        background: rgba(251, 191, 36, 0.1);
      }
      .log-entry--error {
        background: rgba(239, 68, 68, 0.1);
      }

      .log-time {
        color: var(--muted-foreground, #999);
      }
      .log-level {
        font-weight: 600;
        text-transform: uppercase;
      }
      .log-context {
        color: var(--muted-foreground, #999);
      }
      .log-message {
        flex: 1;
      }
      .log-correlation {
        color: var(--muted-foreground, #999);
        font-size: 10px;
      }

      .metric-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .metric-item {
        padding: 8px;
        background: var(--muted, #2a2a2a);
        border-radius: 4px;
      }

      .metric-label {
        font-size: 10px;
        color: var(--muted-foreground, #999);
        margin-bottom: 4px;
      }

      .metric-value {
        font-size: 16px;
        font-weight: 600;
      }

      .state-json {
        margin-top: 12px;
        padding: 8px;
        background: var(--muted, #2a2a2a);
        border-radius: 4px;
        max-height: 300px;
        overflow-y: auto;
      }

      .state-json pre {
        margin: 0;
        font-size: 10px;
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      .state-stats {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;
        padding: 8px;
        background: var(--muted, #2a2a2a);
        border-radius: 4px;
      }

      .stat-item {
        display: flex;
        gap: 8px;
        font-size: 11px;
      }

      .stat-label {
        color: var(--muted-foreground, #999);
      }

      .stat-value {
        font-weight: 600;
        color: var(--foreground, #fff);
      }

      .state-tree {
        margin-top: 12px;
      }

      .state-node {
        margin-bottom: 8px;
        border: 1px solid var(--border, #333);
        border-radius: 4px;
        overflow: hidden;
      }

      .state-node-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        background: var(--muted, #2a2a2a);
        cursor: pointer;
        font-size: 11px;
      }

      .node-toggle {
        color: var(--muted-foreground, #999);
        width: 12px;
      }

      .node-key {
        font-weight: 600;
        color: var(--foreground, #fff);
      }

      .node-type {
        color: var(--muted-foreground, #999);
        font-size: 10px;
      }

      .state-node-content {
        padding: 8px;
        background: var(--card-background, #1a1a1a);
      }

      .state-node-content pre {
        margin: 0;
        font-size: 10px;
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      .profiler-info {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .profiler-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        padding: 8px;
        background: var(--muted, #2a2a2a);
        border-radius: 4px;
      }

      .profiler-metrics {
        margin-top: 12px;
      }

      .profiler-metrics h5 {
        margin: 0 0 8px 0;
        font-size: 12px;
        font-weight: 600;
      }

      .metric-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .metric-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 6px 8px;
        background: var(--muted, #2a2a2a);
        border-radius: 4px;
        font-size: 11px;
      }

      .metric-name {
        flex: 1;
        color: var(--foreground, #fff);
      }

      .metric-time {
        min-width: 60px;
        text-align: right;
        color: var(--muted-foreground, #999);
      }

      .metric-bar {
        width: 100px;
        height: 4px;
        background: var(--border, #333);
        border-radius: 2px;
        overflow: hidden;
      }

      .metric-bar-fill {
        height: 100%;
        background: var(--primary, #ff7900);
        transition: width 0.3s ease;
      }

      .memory-info {
        margin-top: 12px;
        padding: 8px;
        background: var(--muted, #2a2a2a);
        border-radius: 4px;
      }

      .memory-info h5 {
        margin: 0 0 8px 0;
        font-size: 12px;
        font-weight: 600;
      }

      .memory-stats {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 11px;
      }

      .memory-item {
        display: flex;
        justify-content: space-between;
        color: var(--foreground, #fff);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevToolsComponent implements OnInit, OnDestroy {
  private readonly loggingService = inject(LoggingService);
  private readonly performanceService = inject(PerformanceService);
  private readonly devToolsService = inject(DevToolsService);
  private readonly store = inject(Store<AppState>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  isVisible = false; // Only show in development
  isCollapsed = false;
  activeTab = 'Logs';
  tabs = ['Logs', 'Performance', 'State', 'Profiler'];

  logLevelFilter = '';
  filteredLogs: LogEntry[] = [];
  performanceMetrics: { name: string; value: string }[] = [];
  cards$: Observable<any[]> = this.store.select(selectCards);
  statePreview = '';
  sessionId = '';

  // State inspector
  stateTree: { key: string; type: string; value: string; expanded: boolean }[] = [];

  // Profiler
  isProfiling = false;
  profilerStats: { label: string; value: string }[] = [];
  profilerMetrics: { name: string; time: number; percentage: number }[] = [];
  memoryInfo: { used: string; total: string; limit: string } | null = null;
  private profilerInterval: ReturnType<typeof setInterval> | undefined;

  ngOnInit(): void {
    // Only show in development
    this.isVisible = !(window as any).__PRODUCTION__;

    if (this.isVisible) {
      this.sessionId = this.loggingService.getSessionId();
      this.filterLogs();
      this.updatePerformanceMetrics();
      this.updateStatePreview();
      this.buildStateTree();

      // Update metrics periodically
      setInterval(() => {
        this.updatePerformanceMetrics();
        if (this.isProfiling) {
          this.updateProfilerData();
        }
      }, 2000);
    }
  }

  ngOnDestroy(): void {
    this.stopProfiler();
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  filterLogs(): void {
    const allLogs = this.loggingService.getHistory();
    this.filteredLogs = this.logLevelFilter
      ? allLogs.filter((log) => log.level === this.logLevelFilter)
      : allLogs;
  }

  clearLogs(): void {
    // LoggingService doesn't have clear method, but we can filter
    this.filteredLogs = [];
  }

  updatePerformanceMetrics(): void {
    // Get performance metrics from PerformanceService
    const metrics = this.performanceService.getMetrics();
    this.performanceMetrics = [
      { name: 'Total Metrics', value: String(metrics.length) },
      { name: 'Session ID', value: this.loggingService.getSessionId().substring(0, 20) + '...' },
    ];
  }

  updateStatePreview(): void {
    this.cards$.pipe(takeUntil(this.destroy$)).subscribe((cards) => {
      this.statePreview = JSON.stringify(
        {
          cardsCount: cards.length,
          sessionId: this.loggingService.getSessionId(),
          correlationId: this.loggingService.getCorrelationId(),
        },
        null,
        2
      );
      this.buildStateTree();
      this.cdr.markForCheck();
    });
  }

  buildStateTree(): void {
    this.cards$.pipe(takeUntil(this.destroy$)).subscribe((cards) => {
      this.stateTree = [
        {
          key: 'cards',
          type: 'array',
          value: JSON.stringify(cards, null, 2),
          expanded: false,
        },
        {
          key: 'session',
          type: 'object',
          value: JSON.stringify(
            {
              sessionId: this.loggingService.getSessionId(),
              correlationId: this.loggingService.getCorrelationId(),
            },
            null,
            2
          ),
          expanded: false,
        },
      ];
      this.cdr.markForCheck();
    });
  }

  toggleNode(node: { expanded: boolean }): void {
    node.expanded = !node.expanded;
  }

  refreshState(): void {
    this.updateStatePreview();
    this.buildStateTree();
  }

  exportState(): void {
    this.cards$.pipe(takeUntil(this.destroy$)).subscribe((cards) => {
      const state = {
        cards,
        sessionId: this.loggingService.getSessionId(),
        timestamp: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `osi-cards-state-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  clearState(): void {
    if (confirm('Are you sure you want to clear the state? This cannot be undone.')) {
      // Clear would need to dispatch an action or call a service method
      this.loggingService.warn('State clear requested', 'DevToolsComponent');
    }
  }

  toggleProfiler(): void {
    this.isProfiling = !this.isProfiling;
    if (this.isProfiling) {
      this.devToolsService.enablePerformanceMonitoring();
      this.startProfiler();
    } else {
      this.devToolsService.disablePerformanceMonitoring();
      this.stopProfiler();
    }
  }

  startProfiler(): void {
    this.profilerInterval = setInterval(() => {
      this.updateProfilerData();
    }, 1000);
    this.updateProfilerData();
  }

  stopProfiler(): void {
    if (this.profilerInterval) {
      clearInterval(this.profilerInterval);
      this.profilerInterval = undefined;
    }
  }

  updateProfilerData(): void {
    const metrics = this.devToolsService.getPerformanceMetrics();
    const memory = this.devToolsService.getMemoryUsage();

    // Convert metrics to array and calculate percentages
    const metricsArray = Array.from(metrics.entries()).map(([name, time]) => ({
      name,
      time: Math.round(time * 100) / 100,
      percentage: 0, // Will calculate below
    }));

    const maxTime = metricsArray.length > 0 ? Math.max(...metricsArray.map((m) => m.time)) : 1;

    this.profilerMetrics = metricsArray.map((m) => ({
      ...m,
      percentage: (m.time / maxTime) * 100,
    }));

    // Update stats
    this.profilerStats = [
      { label: 'Total Metrics', value: String(metrics.size) },
      { label: 'Max Time', value: `${maxTime.toFixed(2)}ms` },
      {
        label: 'Avg Time',
        value:
          metricsArray.length > 0
            ? `${(metricsArray.reduce((sum, m) => sum + m.time, 0) / metricsArray.length).toFixed(2)}ms`
            : '0ms',
      },
    ];

    // Update memory info
    if (memory.usedJSHeapSize && memory.totalJSHeapSize && memory.jsHeapSizeLimit) {
      this.memoryInfo = {
        used: (memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
        total: (memory.totalJSHeapSize / 1024 / 1024).toFixed(2),
        limit: (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2),
      };
    }

    this.cdr.markForCheck();
  }

  clearProfilerData(): void {
    this.devToolsService.clearPerformanceMetrics();
    this.profilerMetrics = [];
    this.profilerStats = [];
    this.memoryInfo = null;
    this.cdr.markForCheck();
  }
}
