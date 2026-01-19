import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CardSection } from '@osi-cards/models';
import { SectionLayoutPreferenceService } from '@osi-cards/services';
import { BadgeComponent, EmptyStateComponent, SectionHeaderComponent } from '../../shared';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';

/**
 * Event Section Component
 *
 * Displays chronological events, schedules, and calendar information.
 * Features: dates, times, locations, status indicators.
 */
@Component({
  selector: 'lib-event-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent, BadgeComponent],
  templateUrl: './event-section.component.html',
  styleUrl: './event-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventSectionComponent extends BaseSectionComponent implements OnInit {
  private readonly layoutService = inject(SectionLayoutPreferenceService);

  ngOnInit(): void {
    // Register layout preference function for this section type
    this.layoutService.register('event', (section: CardSection, availableColumns: number) => {
      return this.calculateEventLayoutPreferences(section, availableColumns);
    });
  }

  /**
   * Calculate layout preferences for event section based on content.
   * Event sections: 2 cols default, can shrink to 1, expands based on item count
   */
  private calculateEventLayoutPreferences(
    section: CardSection,
    availableColumns: number
  ): SectionLayoutPreferences {
    const items = section.items ?? [];
    const itemCount = items.length;

    // Event sections: 2 cols default, can shrink to 1, expands based on item count
    let preferredColumns: 1 | 2 | 3 | 4 = 2;
    if (itemCount >= 5 && availableColumns >= 3) {
      preferredColumns = 3;
    }
    if (itemCount <= 2) {
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
        itemCount: 5, // Expand to 3 columns at 5+ events
      },
    };
  }

  /**
   * Get layout preferences for event section.
   */
  override getLayoutPreferences(availableColumns: number = 4): SectionLayoutPreferences {
    const servicePrefs = this.layoutService.getPreferences(this.section, availableColumns);
    if (servicePrefs) {
      return servicePrefs;
    }
    return this.calculateEventLayoutPreferences(this.section, availableColumns);
  }
  /**
   * Format date for display
   */
  formatDate(dateStr: string): { day: string; month: string } | null {
    if (!dateStr) return null;

    try {
      const date = new Date(dateStr);
      return {
        day: date.getDate().toString(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
      };
    } catch {
      return null;
    }
  }

  /**
   * Get status class (deprecated - kept for backward compatibility)
   */
  getStatusClass(status?: string): string {
    if (!status) return '';
    return `event-status--${status}`;
  }

  /**
   * Map status to badge variant
   */
  getStatusVariant(status?: string): 'success' | 'warning' | 'error' | 'primary' | 'default' {
    if (!status) return 'default';
    const statusLower = status.toLowerCase();

    if (statusLower === 'confirmed' || statusLower === 'completed') return 'success';
    if (statusLower === 'upcoming' || statusLower === 'scheduled' || statusLower === 'planned')
      return 'primary';
    if (statusLower === 'tentative' || statusLower === 'pending') return 'warning';
    if (statusLower === 'cancelled' || statusLower === 'postponed') return 'error';

    return 'default';
  }

  /**
   * Format status text for display (capitalize first letter)
   */
  formatStatus(status?: string): string {
    if (!status) return '';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }
}
