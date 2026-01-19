import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { EmptyStateComponent, SectionHeaderComponent } from '../../shared';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';
import { SectionLayoutPreferenceService } from '@osi-cards/services';
import { CardSection } from '@osi-cards/models';

/**
 * Network Card Section Component
 *
 * Displays network relationships, partnerships, and organizational structures.
 * Features: influence scores, connection counts, status indicators.
 */
@Component({
  selector: 'lib-network-card-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent],
  templateUrl: './network-card-section.component.html',
  styleUrl: './network-card-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NetworkCardSectionComponent extends BaseSectionComponent implements OnInit {
  private readonly layoutService = inject(SectionLayoutPreferenceService);

  ngOnInit(): void {
    // Register layout preference function for this section type
    this.layoutService.register(
      'network-card',
      (section: CardSection, availableColumns: number) => {
        return this.calculateNetworkCardLayoutPreferences(section, availableColumns);
      }
    );
  }

  /**
   * Calculate layout preferences for network card section based on content.
   * Network cards: 1-2 cols default, similar to contact cards
   */
  private calculateNetworkCardLayoutPreferences(
    section: CardSection,
    availableColumns: number
  ): SectionLayoutPreferences {
    const items = section.items ?? [];
    const fields = section.fields ?? [];
    const itemCount = items.length + fields.length;

    // Network cards: 1-2 cols default, similar to contact cards
    let preferredColumns: 1 | 2 | 3 | 4 = 1;
    if (itemCount >= 3 && availableColumns >= 2) {
      preferredColumns = 2;
    }

    // Respect explicit preferences
    if (section.preferredColumns) {
      preferredColumns = section.preferredColumns;
    }

    preferredColumns = Math.min(preferredColumns, availableColumns) as 1 | 2 | 3 | 4;

    return {
      preferredColumns,
      minColumns: (section.minColumns ?? 1) as 1 | 2 | 3 | 4,
      maxColumns: Math.min((section.maxColumns ?? 2) as 1 | 2 | 3 | 4, availableColumns) as
        | 1
        | 2
        | 3
        | 4,
      canShrinkToFill: true,
      shrinkPriority: 20, // High priority for shrinking (network cards are flexible)
      expandOnContent: {
        itemCount: 3, // Expand to 2 columns at 3+ items
      },
    };
  }

  /**
   * Get layout preferences for network card section.
   */
  override getLayoutPreferences(availableColumns: number = 4): SectionLayoutPreferences {
    const servicePrefs = this.layoutService.getPreferences(this.section, availableColumns);
    if (servicePrefs) {
      return servicePrefs;
    }
    return this.calculateNetworkCardLayoutPreferences(this.section, availableColumns);
  }

  /**
   * Get status class
   */
  getStatusClass(status?: unknown): string {
    if (!status || typeof status !== 'string') return '';
    return `network-status--${status}`;
  }

  /**
   * Track expanded state for descriptions
   */
  descriptionExpandedStates: boolean[] = [];

  /**
   * Toggle description expansion
   */
  toggleDescriptionExpanded(index: number): void {
    this.descriptionExpandedStates[index] = !this.descriptionExpandedStates[index];
  }

  /**
   * Check if description is expanded
   */
  isDescriptionExpanded(index: number): boolean {
    return !!this.descriptionExpandedStates[index];
  }

  /**
   * Check if description needs "Show more" button
   */
  shouldShowExpandButton(node: any): boolean {
    const description = node.description;
    return description && description.length > 120;
  }
}
