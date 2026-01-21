import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CardSection } from '../../../models';
import { SectionLayoutPreferenceService } from '../../../services';
import { BadgeComponent, EmptyStateComponent, SectionHeaderComponent } from '../../shared';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';

/**
 * Timeline Section Component
 *
 * Displays chronological sequences of events and milestones.
 * Features: vertical timeline, date markers, status indicators.
 */
@Component({
  selector: 'lib-timeline-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent, BadgeComponent],
  templateUrl: './timeline-section.component.html',
  styleUrl: './timeline-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineSectionComponent extends BaseSectionComponent implements OnInit {
  private readonly layoutService = inject(SectionLayoutPreferenceService);

  expandedIndex: number | null = null;

  ngOnInit(): void {
    // Register layout preference function for this section type
    this.layoutService.register('timeline', (section: CardSection, availableColumns: number) => {
      return this.calculateTimelineLayoutPreferences(section, availableColumns);
    });
  }

  /**
   * Calculate layout preferences for timeline section based on content.
   * Timeline sections: 3 cols default, can shrink to 1-2
   */
  private calculateTimelineLayoutPreferences(
    section: CardSection,
    availableColumns: number
  ): SectionLayoutPreferences {
    const items = section.items ?? [];
    const itemCount = items.length;

    // Timeline sections: 3 cols default, can shrink to 1-2
    let preferredColumns: 1 | 2 | 3 | 4 = 3;
    if (itemCount <= 3) {
      preferredColumns = 2;
    }
    if (itemCount <= 1) {
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
      shrinkPriority: 22, // Higher priority for shrinking (promotes side-by-side placement)
      expandOnContent: {
        itemCount: 4, // Expand to 3 columns at 4+ items
      },
    };
  }

  /**
   * Get layout preferences for timeline section.
   */
  override getLayoutPreferences(availableColumns: number = 4): SectionLayoutPreferences {
    const servicePrefs = this.layoutService.getPreferences(this.section, availableColumns);
    if (servicePrefs) {
      return servicePrefs;
    }
    return this.calculateTimelineLayoutPreferences(this.section, availableColumns);
  }
  /**
   * Get date display
   */
  getDateDisplay(item: any): string {
    return item.meta?.date || item.meta?.year || '';
  }

  /**
   * Get status class
   */
  getStatusClass(status?: unknown): string {
    if (!status || typeof status !== 'string') return '';
    return `timeline-status--${status}`;
  }

  toggleExpanded(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }

  onItemKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleExpanded(index);
    }
  }

  /**
   * Check if description needs "Show more" button
   */
  shouldShowExpandButton(event: any): boolean {
    const description = event.description;
    return description && description.length > 150;
  }
}
