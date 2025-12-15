import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { CardSection } from '../../../models';
import { SectionLayoutPreferenceService } from '../../../services/section-layout-preference.service';
import { BadgeComponent, EmptyStateComponent, SectionHeaderComponent } from '../../shared';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';

/**
 * Solutions Section Component
 *
 * Displays solution offerings, use cases, and service information.
 * Features: benefits, complexity indicators, delivery timeframes.
 */
@Component({
  selector: 'lib-solutions-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent, BadgeComponent],
  templateUrl: './solutions-section.component.html',
  styleUrl: './solutions-section.scss',
})
export class SolutionsSectionComponent extends BaseSectionComponent implements OnInit {
  private readonly layoutService = inject(SectionLayoutPreferenceService);

  expandedIndex: number | null = null; // For benefits expansion
  descriptionExpandedStates: boolean[] = []; // For description expansion

  ngOnInit(): void {
    // Register layout preference function for this section type
    this.layoutService.register('solutions', (section: CardSection, availableColumns: number) => {
      return this.calculateSolutionsLayoutPreferences(section, availableColumns);
    });
  }

  /**
   * Calculate layout preferences for solutions section based on content.
   * Solutions sections: 2 cols default, can shrink to 1, expands based on item count
   */
  private calculateSolutionsLayoutPreferences(
    section: CardSection,
    availableColumns: number
  ): SectionLayoutPreferences {
    const solutions = section.fields ?? section.items ?? [];
    const itemCount = solutions.length;

    // Solutions sections: 2 cols default, can shrink to 1, expands based on item count
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
        itemCount: 5, // Expand to 3 columns at 5+ solutions
      },
    };
  }

  /**
   * Get layout preferences for solutions section.
   */
  override getLayoutPreferences(availableColumns: number = 4): SectionLayoutPreferences {
    const servicePrefs = this.layoutService.getPreferences(this.section, availableColumns);
    if (servicePrefs) {
      return servicePrefs;
    }
    return this.calculateSolutionsLayoutPreferences(this.section, availableColumns);
  }
  /**
   * Get complexity class (deprecated)
   */
  getComplexityClass(complexity?: string): string {
    if (!complexity) return '';
    return `complexity--${complexity}`;
  }

  /**
   * Map complexity to badge variant
   */
  getComplexityVariant(complexity?: string): 'success' | 'warning' | 'error' | 'default' {
    if (!complexity) return 'default';
    const complexityLower = complexity.toLowerCase();
    if (complexityLower === 'low' || complexityLower === 'simple') return 'success';
    if (complexityLower === 'medium' || complexityLower === 'moderate') return 'warning';
    if (complexityLower === 'high' || complexityLower === 'complex') return 'error';
    return 'default';
  }

  toggleExpanded(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }

  isExpanded(index: number): boolean {
    return this.expandedIndex === index;
  }

  getVisibleBenefits(benefits: string[] | undefined, index: number): string[] {
    if (!benefits || benefits.length === 0) return [];
    if (this.isExpanded(index)) return benefits;
    return benefits.slice(0, 2);
  }

  /**
   * Check if description needs "Show more" button
   */
  shouldShowExpandButton(solution: any): boolean {
    const description = solution.description;
    return description && description.length > 150;
  }

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
}
