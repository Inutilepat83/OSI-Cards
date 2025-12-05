import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { EmptyStateComponent, SectionHeaderComponent } from '../../shared';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';
import { SectionLayoutPreferenceService } from '../../../services/section-layout-preference.service';
import { CardSection } from '../../../models';

/**
 * FAQ Section Component
 *
 * Displays frequently asked questions with expandable answers.
 * Features: collapsible Q&A, category grouping, search-friendly format.
 */
@Component({
  selector: 'lib-faq-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent],
  templateUrl: './faq-section.component.html',
  styleUrl: './faq-section.scss',
})
export class FaqSectionComponent extends BaseSectionComponent implements OnInit {
  private readonly layoutService = inject(SectionLayoutPreferenceService);

  ngOnInit(): void {
    // Register layout preference function for this section type
    this.layoutService.register('faq', (section: CardSection, availableColumns: number) => {
      return this.calculateFaqLayoutPreferences(section, availableColumns);
    });
  }

  /**
   * Calculate layout preferences for FAQ section based on content.
   * FAQ sections: 1 col default (compact), can expand to 2 for readability
   */
  private calculateFaqLayoutPreferences(
    section: CardSection,
    availableColumns: number
  ): SectionLayoutPreferences {
    const items = section.items ?? [];
    const itemCount = items.length;

    // FAQ sections: 1 col default (compact), can expand to 2 for readability
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
      shrinkPriority: 15, // High priority for shrinking (FAQ sections are very flexible)
      expandOnContent: {
        itemCount: 3, // Expand to 2 columns at 3+ FAQs
      },
    };
  }

  /**
   * Get layout preferences for FAQ section.
   */
  override getLayoutPreferences(availableColumns: number = 4): SectionLayoutPreferences {
    const servicePrefs = this.layoutService.getPreferences(this.section, availableColumns);
    if (servicePrefs) {
      return servicePrefs;
    }
    return this.calculateFaqLayoutPreferences(this.section, availableColumns);
  }
  expandedItems: Set<number> = new Set();

  /**
   * Toggle FAQ item expansion
   */
  toggle(index: number): void {
    if (this.expandedItems.has(index)) {
      this.expandedItems.delete(index);
    } else {
      this.expandedItems.add(index);
    }
  }

  /**
   * Check if item is expanded
   */
  isExpanded(index: number): boolean {
    return this.expandedItems.has(index);
  }

  /**
   * Get question text from item
   */
  getQuestion(item: any): string {
    return item.title || item.meta?.question || 'Question';
  }

  /**
   * Get answer text from item
   */
  getAnswer(item: any): string {
    return item.description || item.meta?.answer || '';
  }
}
