import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';
import {
  SectionHeaderComponent,
  EmptyStateComponent,
  TrendIndicatorComponent,
  ProgressBarComponent,
  BadgeComponent,
  type ProgressBarVariant,
} from '../../shared';
import { TrendDirection } from '../../../types';
import { SectionLayoutPreferenceService } from '../../../services/section-layout-preference.service';
import { CardSection } from '../../../models';

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
export class AnalyticsSectionComponent extends BaseSectionComponent implements OnInit {
  private readonly layoutService = inject(SectionLayoutPreferenceService);

  ngOnInit(): void {
    // Register layout preference function for this section type
    this.layoutService.register('analytics', (section: CardSection, availableColumns: number) => {
      return this.calculateAnalyticsLayoutPreferences(section, availableColumns);
    });
  }

  /**
   * Calculate layout preferences for analytics section based on content.
   */
  private calculateAnalyticsLayoutPreferences(
    section: CardSection,
    availableColumns: number
  ): SectionLayoutPreferences {
    const fields = section.fields ?? [];
    const fieldCount = fields.length;

    // Analytics sections: 2 cols default, can shrink to 1, expands to 3 with many metrics
    let preferredColumns: 1 | 2 | 3 | 4 = 2;
    if (fieldCount >= 8) {
      preferredColumns = 3;
    } else if (fieldCount <= 2) {
      preferredColumns = 1;
    }

    // Respect explicit preferences
    if (section.preferredColumns) {
      preferredColumns = section.preferredColumns;
    }

    preferredColumns = Math.min(preferredColumns, availableColumns) as 1 | 2 | 3 | 4;

    return {
      preferredColumns,
      minColumns: (section.minColumns ?? 1) as 1 | 2 | 3 | 4,
      maxColumns: Math.min((section.maxColumns ?? 3) as 1 | 2 | 3 | 4, availableColumns) as
        | 1
        | 2
        | 3
        | 4,
      canShrinkToFill: true,
      shrinkPriority: 18, // Higher priority for shrinking (promotes side-by-side placement)
      expandOnContent: {
        fieldCount: 8, // Expand to 3 columns at 8+ metrics
      },
    };
  }

  /**
   * Get layout preferences for analytics section.
   */
  override getLayoutPreferences(availableColumns: number = 4): SectionLayoutPreferences {
    const servicePrefs = this.layoutService.getPreferences(this.section, availableColumns);
    if (servicePrefs) {
      return servicePrefs;
    }
    return this.calculateAnalyticsLayoutPreferences(this.section, availableColumns);
  }

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
