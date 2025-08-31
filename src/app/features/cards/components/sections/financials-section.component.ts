import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { CardSection } from '../../../../models/card.model';

@Component({
  selector: 'app-financials-section',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule, MatTabsModule],
  template: `
    <div class="financials-section">
      <h3 class="section-title">{{ section.title }}</h3>

      <mat-tab-group class="financial-tabs" *ngIf="section.meta?.periods">
        <mat-tab *ngFor="let period of section.meta.periods" [label]="period.label">
          <div class="financial-content">
            <div class="financial-metrics">
              <div class="metric-card" *ngFor="let field of section.fields; trackBy: trackByField">
                <div class="metric-header">
                  <mat-icon class="metric-icon" [style.color]="getMetricColor(field.label)">
                    {{ getMetricIcon(field.label) }}
                  </mat-icon>
                  <div class="metric-info">
                    <div class="metric-label">{{ field.label }}</div>
                    <div
                      class="metric-value"
                      [style.color]="field.valueColor || getMetricColor(field.label)"
                    >
                      {{ formatValue(field.value, field.meta?.format) }}
                    </div>
                  </div>
                  <div class="metric-change" *ngIf="field.meta?.change">
                    <span
                      class="change-indicator"
                      [class.positive]="field.meta.change > 0"
                      [class.negative]="field.meta.change < 0"
                    >
                      <mat-icon class="change-icon">
                        {{ field.meta.change > 0 ? 'trending_up' : 'trending_down' }}
                      </mat-icon>
                      {{ Math.abs(field.meta.change) }}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>

      <div class="financial-breakdown" *ngIf="section.items">
        <h4 class="breakdown-title">Financial Breakdown</h4>
        <div class="breakdown-items">
          <div class="breakdown-item" *ngFor="let item of section.items; trackBy: trackByItem">
            <div class="item-header">
              <div class="item-icon" *ngIf="item.icon">
                <mat-icon [style.color]="getItemColor(item.title)">{{ item.icon }}</mat-icon>
              </div>
              <div class="item-info">
                <div class="item-title">{{ item.title }}</div>
                <div class="item-description" *ngIf="item.description">
                  {{ item.description }}
                </div>
              </div>
              <div class="item-value" [style.color]="getItemColor(item.title)">
                {{ item.value }}
              </div>
            </div>

            <div class="item-details" *ngIf="item.meta?.details">
              <div class="detail-row" *ngFor="let detail of item.meta.details">
                <span class="detail-label">{{ detail.label }}</span>
                <span class="detail-value">{{ detail.value }}</span>
                <span class="detail-percentage" *ngIf="detail.percentage">
                  ({{ detail.percentage }}%)
                </span>
              </div>
            </div>

            <div class="item-chart-placeholder" *ngIf="item.meta?.showChart">
              <mat-icon class="chart-icon">bar_chart</mat-icon>
              <span>Chart visualization would render here</span>
            </div>
          </div>
        </div>
      </div>

      <div class="financial-summary" *ngIf="section.meta?.summary">
        <div class="summary-card">
          <div class="summary-header">
            <mat-icon class="summary-icon">assessment</mat-icon>
            <h4 class="summary-title">Financial Summary</h4>
          </div>
          <div class="summary-content">
            <p class="summary-text">{{ section.meta.summary.text }}</p>
            <div class="summary-highlights" *ngIf="section.meta.summary.highlights">
              <div class="highlight-item" *ngFor="let highlight of section.meta.summary.highlights">
                <mat-icon class="highlight-icon">{{ highlight.icon || 'star' }}</mat-icon>
                <span>{{ highlight.text }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="financial-actions">
        <button mat-raised-button color="primary" class="action-btn">
          <mat-icon>download</mat-icon>
          Download Report
        </button>
        <button mat-stroked-button class="action-btn">
          <mat-icon>share</mat-icon>
          Share Analysis
        </button>
        <button mat-stroked-button class="action-btn">
          <mat-icon>compare</mat-icon>
          Compare Periods
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .financials-section {
        padding: 1.5rem;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .section-title {
        margin: 0 0 2rem 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
        text-align: center;
      }

      .financial-tabs {
        margin-bottom: 2rem;
      }

      .financial-content {
        padding: 1rem 0;
      }

      .financial-metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .metric-card {
        padding: 1.5rem;
        background: linear-gradient(135deg, #fefefe 0%, #f8fafc 100%);
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        transition: all 0.3s ease;
      }

      .metric-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      }

      .metric-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .metric-icon {
        font-size: 2rem;
        margin-right: 1rem;
      }

      .metric-info {
        flex: 1;
      }

      .metric-label {
        font-size: 0.875rem;
        color: #6b7280;
        margin-bottom: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .metric-value {
        font-size: 2rem;
        font-weight: 700;
      }

      .metric-change {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .change-indicator {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-weight: 600;
        font-size: 0.875rem;
      }

      .change-indicator.positive {
        color: #059669;
      }

      .change-indicator.negative {
        color: #dc2626;
      }

      .change-icon {
        font-size: 1.125rem;
      }

      .breakdown-title {
        margin: 0 0 1.5rem 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #374151;
      }

      .breakdown-items {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .breakdown-item {
        padding: 1.5rem;
        background: #f8fafc;
        border-radius: 12px;
        border-left: 4px solid #3b82f6;
      }

      .item-header {
        display: flex;
        align-items: center;
        margin-bottom: 1rem;
      }

      .item-icon {
        margin-right: 1rem;
        font-size: 1.5rem;
      }

      .item-info {
        flex: 1;
      }

      .item-title {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.25rem;
      }

      .item-description {
        font-size: 0.875rem;
        color: #6b7280;
      }

      .item-value {
        font-size: 1.25rem;
        font-weight: 700;
      }

      .item-details {
        background: white;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
        border-bottom: 1px solid #f1f5f9;
      }

      .detail-row:last-child {
        border-bottom: none;
      }

      .detail-label {
        font-size: 0.875rem;
        color: #6b7280;
      }

      .detail-value {
        font-weight: 600;
        color: #1f2937;
      }

      .detail-percentage {
        font-size: 0.875rem;
        color: #059669;
      }

      .item-chart-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 2rem;
        background: white;
        border-radius: 8px;
        color: #6b7280;
        text-align: center;
      }

      .chart-icon {
        font-size: 3rem;
        opacity: 0.5;
      }

      .financial-summary {
        margin-bottom: 2rem;
      }

      .summary-card {
        padding: 1.5rem;
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        border-radius: 12px;
        border-left: 4px solid #0ea5e9;
      }

      .summary-header {
        display: flex;
        align-items: center;
        margin-bottom: 1rem;
      }

      .summary-icon {
        color: #0ea5e9;
        margin-right: 0.75rem;
        font-size: 1.5rem;
      }

      .summary-title {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #0c4a6e;
      }

      .summary-text {
        color: #0369a1;
        margin: 0 0 1rem 0;
        line-height: 1.6;
      }

      .summary-highlights {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .highlight-item {
        display: flex;
        align-items: center;
        font-size: 0.875rem;
        color: #0369a1;
      }

      .highlight-icon {
        color: #f59e0b;
        margin-right: 0.5rem;
        font-size: 1rem;
      }

      .financial-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .action-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      @media (max-width: 768px) {
        .financial-metrics {
          grid-template-columns: 1fr;
        }

        .metric-header {
          flex-direction: column;
          align-items: flex-start;
        }

        .metric-change {
          align-items: flex-start;
          margin-top: 1rem;
        }

        .financial-actions {
          flex-direction: column;
        }

        .action-btn {
          width: 100%;
          justify-content: center;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancialsSectionComponent {
  @Input() section!: CardSection;

  trackByField(index: number, field: any): any {
    return field.id || index;
  }

  trackByItem(index: number, item: any): any {
    return item.id || index;
  }

  getMetricIcon(label: string): string {
    const iconMap: { [key: string]: string } = {
      revenue: 'attach_money',
      profit: 'trending_up',
      expenses: 'trending_down',
      growth: 'show_chart',
      margin: 'donut_large',
      'cash flow': 'account_balance',
      assets: 'business_center',
      liabilities: 'credit_card',
      equity: 'pie_chart',
    };

    const key = label.toLowerCase();
    return iconMap[key] || 'analytics';
  }

  getMetricColor(label: string): string {
    const colorMap: { [key: string]: string } = {
      revenue: '#059669',
      profit: '#0ea5e9',
      expenses: '#dc2626',
      growth: '#7c3aed',
      margin: '#f59e0b',
      'cash flow': '#06b6d4',
      assets: '#10b981',
      liabilities: '#ef4444',
      equity: '#8b5cf6',
    };

    const key = label.toLowerCase();
    return colorMap[key] || '#6b7280';
  }

  getItemColor(title: string): string {
    const colors = ['#3b82f6', '#059669', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    const hash = title.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  }

  formatValue(value: any, format?: string): string {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(Number(value));
    }

    if (format === 'percentage') {
      return `${value}%`;
    }

    return value.toString();
  }
}
