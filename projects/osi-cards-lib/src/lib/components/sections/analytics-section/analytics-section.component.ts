import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent } from '../base-section.component';

/**
 * Analytics Section Component
 *
 * Displays performance metrics and KPIs with visual indicators.
 * Features: trend indicators, performance ratings, progress visualization.
 */
@Component({
  selector: 'lib-analytics-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics-section.component.html',
  styleUrl: './analytics-section.scss'
})
export class AnalyticsSectionComponent extends BaseSectionComponent {

  /**
   * Get CSS class for trend indicator
   */
  getTrendClass(trend?: string): string {
    if (!trend) return '';
    return `metric-trend--${trend}`;
  }

  /**
   * Get CSS class for performance rating
   */
  getPerformanceClass(performance?: string): string {
    if (!performance) return '';
    return `metric-performance--${performance}`;
  }

  /**
   * Format percentage for display
   */
  formatPercentage(percentage?: number): string {
    if (percentage === undefined || percentage === null) return '';
    return `${percentage}%`;
  }

  /**
   * Format change value with sign
   */
  formatChange(change?: number): string {
    if (change === undefined || change === null) return '';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change}%`;
  }
}
