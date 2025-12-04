import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent } from '../base-section.component';
import {
  SectionHeaderComponent,
  EmptyStateComponent,
  TrendIndicatorComponent,
  ProgressBarComponent,
  BadgeComponent,
  type ProgressBarVariant,
} from '../../shared';
import { TrendDirection } from '../../../types';

/**
 * Analytics Section Component - Compact & Minimalist
 *
 * Ultra-compact display of performance metrics and KPIs.
 * Minimal padding, clean typography, maximum information density.
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
    BadgeComponent,
  ],
  templateUrl: './analytics-section.component.html',
  styleUrl: './analytics-section.scss',
})
export class AnalyticsSectionComponent extends BaseSectionComponent {
  /**
   * Map trend string to TrendDirection type
   */
  getTrend(trend?: string): TrendDirection {
    if (!trend) return 'neutral';
    const t = trend.toLowerCase();
    if (t.includes('up') || t.includes('increas') || t.includes('ris')) return 'up';
    if (t.includes('down') || t.includes('decreas') || t.includes('fall')) return 'down';
    if (t.includes('stable') || t.includes('flat')) return 'stable';
    return 'neutral';
  }

  /**
   * Map performance rating to progress bar variant
   */
  getVariant(performance?: string): ProgressBarVariant {
    if (!performance) return 'default';
    const p = performance.toLowerCase();
    if (p.includes('excell') || p.includes('great')) return 'success';
    if (p.includes('good')) return 'info';
    if (p.includes('aver') || p.includes('fair')) return 'warning';
    if (p.includes('poor') || p.includes('bad')) return 'error';
    return 'default';
  }

  /**
   * Map performance to badge variant
   */
  getBadgeVariant(performance?: string): 'success' | 'primary' | 'warning' | 'error' | 'default' {
    if (!performance) return 'default';
    const p = performance.toLowerCase();
    if (p.includes('excell') || p.includes('great')) return 'success';
    if (p.includes('good')) return 'primary';
    if (p.includes('aver') || p.includes('fair')) return 'warning';
    if (p.includes('poor') || p.includes('bad')) return 'error';
    return 'default';
  }
}
