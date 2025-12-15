import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { CardSection } from '../../../models';
import { SectionLayoutPreferenceService } from '../../../services/section-layout-preference.service';
import { BadgeComponent, EmptyStateComponent, SectionHeaderComponent } from '../../shared';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';

/**
 * List Section Component
 *
 * Displays structured lists with icons, status indicators, and priority badges.
 * Perfect for task lists, features, requirements, and inventory.
 */
@Component({
  selector: 'lib-list-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent, BadgeComponent],
  templateUrl: './list-section.component.html',
  styleUrl: './list-section.scss',
})
export class ListSectionComponent extends BaseSectionComponent implements OnInit {
  private readonly layoutService = inject(SectionLayoutPreferenceService);

  expandedIndex: number | null = null;

  ngOnInit(): void {
    // Register layout preference function for this section type
    this.layoutService.register('list', (section: CardSection, availableColumns: number) => {
      return this.calculateListLayoutPreferences(section, availableColumns);
    });
  }

  /**
   * Calculate layout preferences for list section based on content.
   */
  private calculateListLayoutPreferences(
    section: CardSection,
    availableColumns: number
  ): SectionLayoutPreferences {
    const items = section.items ?? [];
    const itemCount = items.length;

    // List sections: 1-2 cols default, can shrink to 1, expands based on item count
    let preferredColumns: 1 | 2 | 3 | 4 = 1;
    if (itemCount >= 5) {
      preferredColumns = 2;
    }
    if (itemCount >= 10) {
      preferredColumns = 3;
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
      shrinkPriority: 15, // Very high priority for shrinking (lists are very flexible, promotes consolidation)
      expandOnContent: {
        itemCount: 5, // Expand to 2 columns at 5+ items
      },
    };
  }

  /**
   * Get layout preferences for list section.
   */
  override getLayoutPreferences(availableColumns: number = 4): SectionLayoutPreferences {
    const servicePrefs = this.layoutService.getPreferences(this.section, availableColumns);
    if (servicePrefs) {
      return servicePrefs;
    }
    return this.calculateListLayoutPreferences(this.section, availableColumns);
  }

  /**
   * Get status class (deprecated - kept for backward compatibility)
   */
  getStatusClass(status?: string): string {
    if (!status) return '';
    return `item-status--${status}`;
  }

  /**
   * Get priority class (deprecated - kept for backward compatibility)
   */
  getPriorityClass(priority?: string): string {
    if (!priority) return '';
    return `item-priority--${priority}`;
  }

  /**
   * Map status to badge variant
   */
  getStatusVariant(status?: string): 'success' | 'warning' | 'error' | 'primary' | 'default' {
    if (!status) return 'default';
    const statusLower = status.toLowerCase();

    if (statusLower.includes('complete') || statusLower === 'done') return 'success';
    if (statusLower.includes('progress') || statusLower === 'active') return 'primary';
    if (statusLower === 'pending' || statusLower === 'waiting') return 'warning';
    if (statusLower.includes('cancel') || statusLower === 'blocked') return 'error';

    return 'default';
  }

  /**
   * Map priority to badge variant
   */
  getPriorityVariant(priority?: string): 'error' | 'warning' | 'success' | 'default' {
    if (!priority) return 'default';
    const priorityLower = priority.toLowerCase();

    if (priorityLower === 'high' || priorityLower === 'urgent') return 'error';
    if (priorityLower === 'medium' || priorityLower === 'normal') return 'warning';
    if (priorityLower === 'low') return 'success';

    return 'default';
  }

  toggleExpanded(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }

  onItemKeydown(event: KeyboardEvent, index: number): void {
    // Space/Enter toggles (keeps list compact but lets users reveal detail)
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleExpanded(index);
    }
  }

  /**
   * Check if a description is long enough to need expansion
   */
  shouldShowExpandButton(item: any): boolean {
    const description = item.description || '';
    // Show expand button if description is longer than ~100 characters
    return description && description.length > 100;
  }

  /**
   * Check if an item is expanded
   */
  isItemExpanded(index: number): boolean {
    return this.expandedIndex === index;
  }
}
