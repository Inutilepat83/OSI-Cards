import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { CardSection } from '../../../models';
import { SectionLayoutPreferenceService } from '../../../services/section-layout-preference.service';
import { EmptyStateComponent, SectionHeaderComponent } from '../../shared';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';

/**
 * Quotation Section Component
 *
 * Displays quotes, testimonials, and citations with attribution.
 * Perfect for customer feedback, expert opinions, and highlighted content.
 */
@Component({
  selector: 'lib-quotation-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent],
  templateUrl: './quotation-section.component.html',
  styleUrl: './quotation-section.scss',
})
export class QuotationSectionComponent extends BaseSectionComponent implements OnInit {
  private readonly layoutService = inject(SectionLayoutPreferenceService);

  expandedIndex: number | null = null;

  ngOnInit(): void {
    // Register layout preference function for this section type
    this.layoutService.register('quotation', (section: CardSection, availableColumns: number) => {
      return this.calculateQuotationLayoutPreferences(section, availableColumns);
    });
  }

  /**
   * Calculate layout preferences for quotation section based on content.
   * Quotation sections: 2 cols default, can shrink to 1, expands to 3 for readability
   */
  private calculateQuotationLayoutPreferences(
    section: CardSection,
    availableColumns: number
  ): SectionLayoutPreferences {
    const fields = section.fields ?? [];
    const fieldCount = fields.length;
    const descriptionLength = section.description?.length ?? 0;

    // Quotation sections: 2 cols default, can shrink to 1, expands to 3 for readability
    let preferredColumns: 1 | 2 | 3 | 4 = 2;
    if (descriptionLength > 300 && availableColumns >= 3) {
      preferredColumns = 3;
    }
    if (fieldCount <= 1) {
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
        descriptionLength: 300, // Expand to 3 columns for long quotes
      },
    };
  }

  /**
   * Get layout preferences for quotation section.
   */
  override getLayoutPreferences(availableColumns: number = 4): SectionLayoutPreferences {
    const servicePrefs = this.layoutService.getPreferences(this.section, availableColumns);
    if (servicePrefs) {
      return servicePrefs;
    }
    return this.calculateQuotationLayoutPreferences(this.section, availableColumns);
  }

  /**
   * Get quote text
   */
  getQuoteText(field: any): string {
    return field.value || field.quote || field.description || '';
  }

  /**
   * Get author name
   */
  getAuthorName(field: any): string {
    return field.author || field.label || '';
  }

  toggleExpanded(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }

  onQuoteKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleExpanded(index);
    }
  }
}
