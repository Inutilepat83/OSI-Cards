import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CardSection } from '@osi-cards/models';
import { SectionLayoutPreferenceService } from '@osi-cards/services';
import { TrendDirection } from '@osi-cards/types';
import { EmptyStateComponent, SectionHeaderComponent, TrendIndicatorComponent } from '../../shared';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';

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
  styleUrl: './financials-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancialsSectionComponent extends BaseSectionComponent implements OnInit {
  private readonly layoutService = inject(SectionLayoutPreferenceService);

  ngOnInit(): void {
    // Register layout preference function for this section type
    this.layoutService.register('financials', (section: CardSection, availableColumns: number) => {
      return this.calculateFinancialsLayoutPreferences(section, availableColumns);
    });
  }

  /**
   * Calculate layout preferences for financials section based on content.
   * Financials sections: 3 cols default, can shrink to 1-2
   */
  private calculateFinancialsLayoutPreferences(
    section: CardSection,
    availableColumns: number
  ): SectionLayoutPreferences {
    const fields = section.fields ?? [];
    const fieldCount = fields.length;

    // Financials sections: 3 cols default, can shrink to 1-2
    let preferredColumns: 1 | 2 | 3 | 4 = 3;
    if (fieldCount <= 4) {
      preferredColumns = 2;
    }
    if (fieldCount <= 2) {
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
      shrinkPriority: 25, // Higher priority for shrinking (promotes side-by-side placement)
      expandOnContent: {
        fieldCount: 6, // Expand to 3 columns at 6+ fields
      },
    };
  }

  /**
   * Get layout preferences for financials section.
   */
  override getLayoutPreferences(availableColumns: number = 4): SectionLayoutPreferences {
    const servicePrefs = this.layoutService.getPreferences(this.section, availableColumns);
    if (servicePrefs) {
      return servicePrefs;
    }
    return this.calculateFinancialsLayoutPreferences(this.section, availableColumns);
  }
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
