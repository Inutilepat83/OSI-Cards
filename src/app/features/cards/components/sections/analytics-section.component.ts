import { Component, Input, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardSection } from '../../../../models/card.model';
import { LoggingService } from '../../../../core/services/logging.service';

@Component({
  selector: 'app-analytics-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analytics-section">
      <h3 class="section-title">{{ section.title }}</h3>
      <div class="analytics-grid">
        <div class="metric-card" *ngFor="let field of section.fields; trackBy: trackByField">
          <div class="metric-header">
            <span class="metric-label">{{ field.label }}</span>
            <i *ngIf="field.icon" class="pi {{ field.icon }} metric-icon"></i>
          </div>
          <div class="metric-value" [style.color]="field.valueColor || '#2563eb'">
            {{ field.value }}
          </div>
          <div class="metric-change" *ngIf="field.meta?.change">
            <span
              class="change-indicator"
              [class.positive]="field.meta.change > 0"
              [class.negative]="field.meta.change < 0"
            >
              <i class="pi" [class]="field.meta.change > 0 ? 'pi-arrow-up' : 'pi-arrow-down'"></i>
              {{ Math.abs(field.meta.change) }}%
            </span>
            <span class="change-period">vs last period</span>
          </div>
        </div>
      </div>
      <div class="analytics-chart" *ngIf="section.chartData">
        <div class="chart-placeholder">
          <i class="pi pi-chart-bar chart-icon"></i>
          <span>Chart visualization would render here</span>
          <small>Chart.js integration pending</small>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .analytics-section {
        padding: 1rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .section-title {
        margin: 0 0 1.5rem 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #333;
      }

      .analytics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .metric-card {
        padding: 1.5rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        position: relative;
        overflow: hidden;
      }

      .metric-card::before {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 100px;
        height: 100px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        transform: translate(30px, -30px);
      }

      .metric-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        position: relative;
        z-index: 1;
      }

      .metric-label {
        font-size: 0.875rem;
        opacity: 0.9;
      }

      .metric-icon {
        font-size: 1.25rem;
        opacity: 0.8;
      }

      .metric-value {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        position: relative;
        z-index: 1;
      }

      .metric-change {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.75rem;
        position: relative;
        z-index: 1;
      }

      .change-indicator {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-weight: 600;
      }

      .change-indicator.positive {
        color: #10b981;
      }

      .change-indicator.negative {
        color: #ef4444;
      }

      .change-period {
        opacity: 0.8;
      }

      .analytics-chart {
        margin-top: 2rem;
        padding: 2rem;
        background: #f8f9fa;
        border-radius: 8px;
        text-align: center;
      }

      .chart-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        color: #6b7280;
      }

      .chart-icon {
        font-size: 3rem;
        opacity: 0.5;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsSectionComponent implements OnInit {
  @Input() section!: CardSection;

  constructor(private logger: LoggingService) {}

  ngOnInit() {
    // Initialize chart if chartData is present
    if (this.section.chartData) {
      // Chart.js integration would go here
      this.logger.log('AnalyticsSectionComponent', 'Analytics chart data', this.section.chartData);
    }
  }

  trackByField(index: number, field: any): any {
    return field.id || index;
  }
}
