import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';
import { SectionHeaderComponent, EmptyStateComponent } from '../../shared';
import { SectionLayoutPreferenceService } from '../../../services/section-layout-preference.service';
import { CardSection } from '../../../models';

/**
 * Overview Section Component
 *
 * Displays high-level summaries and executive dashboards.
 * Perfect for company profiles, key highlights, and quick insights.
 */
@Component({
  selector: 'lib-overview-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent],
  templateUrl: './overview-section.component.html',
  styleUrl: './overview-section.scss',
})
export class OverviewSectionComponent extends BaseSectionComponent implements OnInit {
  private readonly layoutService = inject(SectionLayoutPreferenceService);

  ngOnInit(): void {
    // Register layout preference function for this section type
    this.layoutService.register('overview', (section: CardSection, availableColumns: number) => {
      return this.calculateOverviewLayoutPreferences(section, availableColumns);
    });
  }

  /**
   * Calculate layout preferences for overview section based on content.
   */
  private calculateOverviewLayoutPreferences(
    section: CardSection,
    availableColumns: number
  ): SectionLayoutPreferences {
    const fields = section.fields ?? [];
    const fieldCount = fields.length;

    // Overview sections: 3 cols default, can shrink to 1-2, expands to 4 for many fields
    let preferredColumns: 1 | 2 | 3 | 4 = 3;
    if (fieldCount >= 12) {
      preferredColumns = 4;
    } else if (fieldCount <= 4) {
      preferredColumns = 2;
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
      maxColumns: Math.min((section.maxColumns ?? 4) as 1 | 2 | 3 | 4, availableColumns) as
        | 1
        | 2
        | 3
        | 4,
      canShrinkToFill: true,
      shrinkPriority: 40, // Lower priority (overview sections prefer to stay wide)
      expandOnContent: {
        fieldCount: 12, // Expand to 4 columns at 12+ fields
      },
    };
  }

  /**
   * Get layout preferences for overview section.
   */
  override getLayoutPreferences(availableColumns: number = 4): SectionLayoutPreferences {
    const servicePrefs = this.layoutService.getPreferences(this.section, availableColumns);
    if (servicePrefs) {
      return servicePrefs;
    }
    return this.calculateOverviewLayoutPreferences(this.section, availableColumns);
  }

  /**
   * Check if field should be highlighted
   */
  isHighlighted(field: any): boolean {
    return field.highlight === true;
  }

  /**
   * Track expanded state for each field
   */
  expandedFields = new Set<number>();

  /**
   * Toggle expanded state for a field
   */
  toggleExpanded(index: number): void {
    if (this.expandedFields.has(index)) {
      this.expandedFields.delete(index);
    } else {
      this.expandedFields.add(index);
    }
  }

  /**
   * Check if a field is expanded
   */
  isExpanded(index: number): boolean {
    return this.expandedFields.has(index);
  }

  /**
   * Check if a value is long enough to need expansion
   */
  shouldShowExpandButton(field: any): boolean {
    const value = field.value?.toString() || '';
    // Show expand button if value is longer than ~100 characters
    return value && value.length > 100;
  }
}
