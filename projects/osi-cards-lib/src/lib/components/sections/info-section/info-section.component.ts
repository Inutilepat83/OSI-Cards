import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent } from '../base-section.component';
import {
  SectionHeaderComponent,
  EmptyStateComponent,
  TrendIndicatorComponent
} from '../../shared';
import { TrendDirection } from '../../../types';

/**
 * Info Section Component
 *
 * Displays key-value pairs in a clean, scannable format.
 * Perfect for structured data, metadata, and profile information.
 */
@Component({
  selector: 'lib-info-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent, TrendIndicatorComponent],
  templateUrl: './info-section.component.html',
  styleUrl: './info-section.scss'
})
export class InfoSectionComponent extends BaseSectionComponent {

  /**
   * Get trend class (deprecated - kept for backward compatibility)
   */
  getTrendClass(trend?: string): string {
    if (!trend) return '';
    return `info-trend--${trend}`;
  }

  /**
   * Format change value
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
}
