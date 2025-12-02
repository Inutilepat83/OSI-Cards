import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent } from '../base-section.component';

/**
 * Financials Section Component
 *
 * Displays financial metrics with currency formatting, trends, and period indicators.
 * Perfect for revenue, expenses, P&L statements, and investment summaries.
 */
@Component({
  selector: 'lib-financials-section',
  standalone: true,
  imports: [CommonModule],
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
}
