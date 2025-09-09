import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardSection, Metric } from '../../../../models/card.model';

@Component({
  selector: 'app-metrics-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metrics-section.component.html',
  styleUrls: ['./metrics-section.component.css']
})
export class MetricsSectionComponent {
  @Input() section!: CardSection;
  @Input() layout: 'grid' | 'list' = 'grid';
  @Output() metricInteraction = new EventEmitter<{ metric: Metric; section: CardSection; action: string }>();

  get metrics(): Metric[] {
    return this.section.metrics || [];
  }

  trackByFn(index: number, item: Metric): string {
    return item.id || index.toString();
  }

  onMetricClick(metric: Metric): void {
    this.metricInteraction.emit({
      metric: metric,
      section: this.section,
      action: 'click'
    });
  }

  formatValue(metric: Metric): string {
    const value = metric.value;
    
    switch (metric.format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(Number(value));
      
      case 'percentage':
        return `${value}%`;
      
      case 'number':
        return new Intl.NumberFormat('en-US').format(Number(value));
      
      default:
        return String(value);
    }
  }

  getTrendClass(trend?: string): string {
    switch (trend) {
      case 'up':
        return 'trend-up';
      case 'down':
        return 'trend-down';
      default:
        return 'trend-neutral';
    }
  }

  getTrendIcon(trend?: string): string {
    switch (trend) {
      case 'up':
        return 'fas fa-arrow-up';
      case 'down':
        return 'fas fa-arrow-down';
      default:
        return 'fas fa-minus';
    }
  }

  formatChange(change?: number): string {
    if (change === undefined || change === null) return '';
    const prefix = change > 0 ? '+' : '';
    return `${prefix}${change}`;
  }
}
