import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';
import { SectionHeaderComponent, EmptyStateComponent } from '../../shared';
import { SectionLayoutPreferenceService } from '../../../services';
import { CardSection } from '../../../models';

/**
 * Text Reference Section Component
 *
 * Displays reference materials, citations, and documentation links.
 * Perfect for articles, research summaries, and resource libraries.
 */
@Component({
  selector: 'lib-text-reference-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent],
  templateUrl: './text-reference-section.component.html',
  styleUrl: './text-reference-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextReferenceSectionComponent extends BaseSectionComponent implements OnInit {
  private readonly layoutService = inject(SectionLayoutPreferenceService);

  ngOnInit(): void {
    // Register layout preference function for this section type
    this.layoutService.register(
      'text-reference',
      (section: CardSection, availableColumns: number) => {
        return this.calculateTextReferenceLayoutPreferences(section, availableColumns);
      }
    );
  }

  /**
   * Calculate layout preferences for text reference section based on content.
   * Text reference sections: 2 cols default, can shrink to 1, expands to 3 for readability
   */
  private calculateTextReferenceLayoutPreferences(
    section: CardSection,
    availableColumns: number
  ): SectionLayoutPreferences {
    const fields = section.fields ?? [];
    const fieldCount = fields.length;
    const descriptionLength = section.description?.length ?? 0;

    // Text reference sections: 2 cols default, can shrink to 1, expands to 3 for readability
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
        descriptionLength: 300, // Expand to 3 columns for long text
      },
    };
  }

  /**
   * Get layout preferences for text reference section.
   */
  override getLayoutPreferences(availableColumns: number = 4): SectionLayoutPreferences {
    const servicePrefs = this.layoutService.getPreferences(this.section, availableColumns);
    if (servicePrefs) {
      return servicePrefs;
    }
    return this.calculateTextReferenceLayoutPreferences(this.section, availableColumns);
  }

  /**
   * Get reference title
   */
  getReferenceTitle(field: any): string {
    return field.value || field.title || field.label || 'Reference';
  }

  /**
   * Get reference content
   */
  getReferenceContent(field: any): string {
    return field.text || field.description || '';
  }

  /**
   * Track expanded state for each reference item
   */
  expandedItems = new Set<number>();

  /**
   * Toggle expanded state for a reference item
   */
  toggleExpanded(index: number): void {
    if (this.expandedItems.has(index)) {
      this.expandedItems.delete(index);
    } else {
      this.expandedItems.add(index);
    }
  }

  /**
   * Check if a reference item is expanded
   */
  isExpanded(index: number): boolean {
    return this.expandedItems.has(index);
  }

  /**
   * Check if a reference content is long enough to need expansion
   */
  shouldShowExpandButton(field: any): boolean {
    const content = this.getReferenceContent(field);
    // Show expand button if content is longer than ~150 characters
    return !!(content && content.length > 150);
  }
}
