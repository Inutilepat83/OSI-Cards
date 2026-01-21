import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CardSection } from '../../../models';
import { SectionLayoutPreferenceService } from '../../../services';
import { EmptyStateComponent, SectionHeaderComponent } from '../../shared';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';

/**
 * News Section Component
 *
 * Displays news articles, headlines, and press releases.
 * Features: publication dates, sources, categories, featured images.
 */
@Component({
  selector: 'lib-news-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent],
  templateUrl: './news-section.component.html',
  styleUrl: './news-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsSectionComponent extends BaseSectionComponent implements OnInit {
  private readonly layoutService = inject(SectionLayoutPreferenceService);

  ngOnInit(): void {
    // Register layout preference function for this section type
    this.layoutService.register('news', (section: CardSection, availableColumns: number) => {
      return this.calculateNewsLayoutPreferences(section, availableColumns);
    });
  }

  /**
   * Calculate layout preferences for news section based on content.
   * News sections: 2 cols default, can shrink to 1, expands based on item count
   */
  private calculateNewsLayoutPreferences(
    section: CardSection,
    availableColumns: number
  ): SectionLayoutPreferences {
    const items = section.items ?? [];
    const itemCount = items.length;

    // News sections: 2 cols default, can shrink to 1, expands based on item count
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
        itemCount: 5, // Expand to 3 columns at 5+ articles
      },
    };
  }

  /**
   * Get layout preferences for news section.
   */
  override getLayoutPreferences(availableColumns: number = 4): SectionLayoutPreferences {
    const servicePrefs = this.layoutService.getPreferences(this.section, availableColumns);
    if (servicePrefs) {
      return servicePrefs;
    }
    return this.calculateNewsLayoutPreferences(this.section, availableColumns);
  }
  /**
   * Get article image URL
   */
  getImageUrl(item: any): string | null {
    return item.meta?.image || null;
  }

  /**
   * Format date for display
   */
  formatDate(dateStr: any): string {
    if (!dateStr || typeof dateStr !== 'string') return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return String(dateStr);
    }
  }

  /**
   * Track expanded state for each article
   */
  expandedArticles = new Set<number>();

  /**
   * Toggle expanded state for an article
   */
  toggleExpanded(index: number): void {
    if (this.expandedArticles.has(index)) {
      this.expandedArticles.delete(index);
    } else {
      this.expandedArticles.add(index);
    }
  }

  /**
   * Check if an article is expanded
   */
  isExpanded(index: number): boolean {
    return this.expandedArticles.has(index);
  }

  /**
   * Check if an excerpt is long enough to need expansion
   */
  shouldShowExpandButton(item: any): boolean {
    const description = item.description || '';
    // Show expand button if description is longer than ~100 characters
    return description && description.length > 100;
  }
}
