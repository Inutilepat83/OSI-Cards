import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent } from '../base-section.component';
import {
  SectionHeaderComponent,
  EmptyStateComponent,
  TrendIndicatorComponent,
  ProgressBarComponent,
  BadgeComponent,
  type TrendDirection,
  type ProgressBarVariant
} from '../../shared';

/**
 * Analytics Section Component
 *
 * Displays performance metrics and KPIs with visual indicators.
 * Features: trend indicators, performance ratings, progress visualization.
 */
@Component({
  selector: 'lib-analytics-section',
  standalone: true,
  imports: [
    CommonModule,
    SectionHeaderComponent,
    EmptyStateComponent,
    TrendIndicatorComponent,
    ProgressBarComponent,
    BadgeComponent
  ],
  templateUrl: './analytics-section.component.html',
  styleUrl: './analytics-section.scss'
})
export class AnalyticsSectionComponent extends BaseSectionComponent {

  /**
   * Get CSS class for trend indicator (deprecated - kept for backward compatibility)
   */
  getTrendClass(trend?: string): string {
    if (!trend) return '';
    return `metric-trend--${trend}`;
  }

  /**
   * Get CSS class for performance rating (deprecated - kept for backward compatibility)
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

  /**
   * Map trend string to TrendDirection type
   */
  getTrendDirection(trend?: string): TrendDirection {
    if (!trend) return 'neutral';
    const trendLower = trend.toLowerCase();

    if (trendLower === 'up' || trendLower === 'increase' || trendLower === 'rising') return 'up';
    if (trendLower === 'down' || trendLower === 'decrease' || trendLower === 'falling') return 'down';
    if (trendLower === 'stable' || trendLower === 'flat' || trendLower === 'unchanged') return 'stable';

    return 'neutral';
  }

  /**
   * Map performance rating to progress bar variant
   */
  getProgressVariant(performance?: string): ProgressBarVariant {
    if (!performance) return 'default';
    const perfLower = performance.toLowerCase();

    if (perfLower === 'excellent' || perfLower === 'great') return 'success';
    if (perfLower === 'good' || perfLower === 'satisfactory') return 'info';
    if (perfLower === 'average' || perfLower === 'fair') return 'warning';
    if (perfLower === 'poor' || perfLower === 'bad') return 'error';

    return 'default';
  }

  /**
   * Map performance rating to badge variant
   */
  getPerformanceBadgeVariant(performance?: string): 'success' | 'primary' | 'warning' | 'error' | 'default' {
    if (!performance) return 'default';
    const perfLower = performance.toLowerCase();

    if (perfLower === 'excellent' || perfLower === 'great') return 'success';
    if (perfLower === 'good' || perfLower === 'satisfactory') return 'primary';
    if (perfLower === 'average' || perfLower === 'fair') return 'warning';
    if (perfLower === 'poor' || perfLower === 'bad') return 'error';

    return 'default';
  }
}
