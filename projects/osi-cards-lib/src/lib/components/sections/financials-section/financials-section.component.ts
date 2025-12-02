import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent } from '../base-section.component';
import { SectionHeaderComponent, EmptyStateComponent, TrendIndicatorComponent, type TrendDirection } from '../../shared';

/**
 * Financials Section Component
 *
 * Displays financial metrics with currency formatting, trends, and period indicators.
 * Perfect for revenue, expenses, P&L statements, and investment summaries.
 */
@Component({
  selector: 'lib-financials-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent, TrendIndicatorComponent],
  templateUrl: './financials-section.component.html',
  styleUrl: './financials-section.scss'
})
export class FinancialsSectionComponent extends BaseSectionComponent {

  /**
   * Get trend class
   */
  getTrendClass(trend?: string): string {
    if (!trend) return '';
    return `metric-trend--${trend}`;
  }

  /**
   * Format change with sign
   */
  formatChange(change?: number): string {
    if (change === undefined || change === null) return '';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change}%`;
  }

  /**
   * Map trend to direction
   */
  getTrendDirection(trend?: string): TrendDirection {
    if (!trend) return 'neutral';
    const trendLower = trend.toLowerCase();
    if (trendLower === 'up' || trendLower === 'increase') return 'up';
    if (trendLower === 'down' || trendLower === 'decrease') return 'down';
    if (trendLower === 'stable' || trendLower === 'flat') return 'stable';
    return 'neutral';
  }
}
