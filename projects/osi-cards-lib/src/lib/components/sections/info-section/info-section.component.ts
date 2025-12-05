import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { CardSection } from '../../../models';
import { SectionLayoutPreferenceService } from '../../../services/section-layout-preference.service';
import { TrendDirection } from '../../../types';
import { trackByField } from '../../../utils/track-by.util';
import { EmptyStateComponent, SectionHeaderComponent, TrendIndicatorComponent } from '../../shared';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';

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
  styleUrl: './info-section.scss',
})
export class InfoSectionComponent extends BaseSectionComponent implements OnInit {
  /**
   * TrackBy function for fields
   */
  readonly trackByField = trackByField;

  private readonly layoutService = inject(SectionLayoutPreferenceService);

  ngOnInit(): void {
    // Register layout preference function for this section type
    this.layoutService.register('info', (section: CardSection, availableColumns: number) => {
      return this.calculateInfoLayoutPreferences(section, availableColumns);
    });
  }

  /**
   * Calculate layout preferences for info section based on section data.
   * This method can be called statically via the service.
   */
  private calculateInfoLayoutPreferences(
    section: CardSection,
    availableColumns: number
  ): SectionLayoutPreferences {
    const fields = section.fields ?? [];
    const fieldCount = fields.length;
    const descriptionLength = section.description?.length ?? 0;

    // Calculate preferred columns based on content:
    // 1-3 fields = 1 column (compact)
    // 4-6 fields = 2 columns (comfortable)
    // 7+ fields = 3 columns (spacious)
    let preferredColumns: 1 | 2 | 3 | 4 = 1;
    if (fieldCount >= 4 && fieldCount <= 6) {
      preferredColumns = 2;
    } else if (fieldCount >= 7) {
      preferredColumns = 3;
    }

    // Adjust for description length
    if (descriptionLength > 200 && preferredColumns < 2) {
      preferredColumns = 2;
    }
    if (descriptionLength > 400 && preferredColumns < 3) {
      preferredColumns = 3;
    }

    // Respect explicit preferences from section data
    if (section.preferredColumns) {
      preferredColumns = section.preferredColumns;
    }

    // Constrain to available columns
    preferredColumns = Math.min(preferredColumns, availableColumns) as 1 | 2 | 3 | 4;

    return {
      preferredColumns,
      minColumns: (section.minColumns ?? 1) as 1 | 2 | 3 | 4,
      maxColumns: Math.min((section.maxColumns ?? 3) as 1 | 2 | 3 | 4, availableColumns) as
        | 1
        | 2
        | 3
        | 4,
      canShrinkToFill: true, // Info sections can shrink to 1 column to fill grid
      shrinkPriority: 20, // Higher priority for shrinking (promotes side-by-side placement)
      expandOnContent: {
        fieldCount: 7, // Expand to 3 columns at 7+ fields
        descriptionLength: 200, // Expand with long descriptions
      },
    };
  }

  /**
   * Get layout preferences for info section.
   * Uses the registered preference function via service, or calculates directly.
   */
  override getLayoutPreferences(availableColumns: number = 4): SectionLayoutPreferences {
    // Try to get from service first (if registered)
    const servicePrefs = this.layoutService.getPreferences(this.section, availableColumns);
    if (servicePrefs) {
      return servicePrefs;
    }

    // Fallback to direct calculation
    return this.calculateInfoLayoutPreferences(this.section, availableColumns);
  }

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
    if (trendLower === 'down' || trendLower === 'decrease' || trendLower === 'falling')
      return 'down';
    if (trendLower === 'stable' || trendLower === 'flat' || trendLower === 'unchanged')
      return 'stable';

    return 'neutral';
  }
}
