import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { HealthCheckService, HealthStatus } from '../../../core/services/health-check.service';

/**
 * Health Check Component
 *
 * Displays application health status and service availability.
 */
@Component({
  selector: 'app-health-check',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="health-check-container">
      <h1>Health Check</h1>

      <div class="health-status" [class]="'status-' + (healthStatus?.status || 'unknown')">
        <h2>Overall Status: {{ healthStatus?.status || 'Checking...' }}</h2>
        <p>Last checked: {{ healthStatus?.timestamp | date: 'short' }}</p>
      </div>

      <div class="services-section">
        <h3>Services</h3>
        <div class="service-list">
          <div
            *ngFor="let service of serviceEntries"
            class="service-item"
            [class]="'status-' + service.value.status"
          >
            <div class="service-name">{{ service.key }}</div>
            <div class="service-status">{{ service.value.status }}</div>
            <div *ngIf="service.value.responseTime" class="service-metrics">
              Response time: {{ service.value.responseTime | number: '1.0-2' }}ms
            </div>
            <div *ngIf="service.value.error" class="service-error">
              {{ service.value.error }}
            </div>
          </div>
        </div>
      </div>

      <div class="metrics-section">
        <h3>Metrics</h3>
        <dl>
          <dt>Uptime:</dt>
          <dd>{{ formatUptime(healthStatus?.uptime || 0) }}</dd>
          <dt>Version:</dt>
          <dd>{{ healthStatus?.version || 'Unknown' }}</dd>
        </dl>
      </div>
    </div>
  `,
  styles: [
    `
      .health-check-container {
        padding: 20px;
        max-width: 800px;
        margin: 0 auto;
      }

      .health-status {
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 20px;
      }

      .status-healthy {
        background: #c8e6c9;
        color: #2e7d32;
      }

      .status-degraded {
        background: #fff3cd;
        color: #856404;
      }

      .status-unhealthy {
        background: #ffcdd2;
        color: #c62828;
      }

      .service-list {
        display: grid;
        gap: 10px;
      }

      .service-item {
        padding: 15px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }

      .service-name {
        font-weight: 600;
      }

      .service-status {
        margin-top: 5px;
        text-transform: uppercase;
        font-size: 0.9em;
      }

      .status-up {
        color: #2e7d32;
      }

      .status-down {
        color: #c62828;
      }

      .status-degraded {
        color: #856404;
      }

      .service-error {
        margin-top: 5px;
        color: #c62828;
        font-size: 0.9em;
      }

      .metrics-section dl {
        display: grid;
        grid-template-columns: 150px 1fr;
        gap: 10px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HealthCheckComponent implements OnInit {
  private readonly healthCheckService = inject(HealthCheckService);
  private readonly destroyRef = inject(DestroyRef);

  healthStatus: HealthStatus | null = null;
  serviceEntries: { key: string; value: any }[] = [];

  async ngOnInit(): Promise<void> {
    // Initial health check
    this.healthStatus = await this.healthCheckService.check();
  }

  formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }
}
