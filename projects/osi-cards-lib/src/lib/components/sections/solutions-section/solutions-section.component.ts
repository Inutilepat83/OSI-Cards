import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  inject,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CardSection } from '@osi-cards/models';
import { SectionLayoutPreferenceService } from '@osi-cards/services';
import { EmptyStateComponent, SectionHeaderComponent } from '../../shared';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';
import { TooltipDirective } from '@osi-cards/lib/directives/tooltip.directive';

/**
 * Solutions Section Component
 *
 * Displays solution offerings, use cases, and service information.
 * Features: benefits, delivery timeframes, expresso links.
 */
@Component({
  selector: 'lib-solutions-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent, TooltipDirective],
  templateUrl: './solutions-section.component.html',
  styleUrl: './solutions-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolutionsSectionComponent
  extends BaseSectionComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  private readonly layoutService = inject(SectionLayoutPreferenceService);

  @ViewChild('solutionsGrid', { static: false }) solutionsGrid?: ElementRef<HTMLElement>;

  expandedIndex: number | null = null; // For benefits expansion
  descriptionExpandedStates: boolean[] = []; // For description expansion
  isSingleColumn = false; // Track if grid is single column
  private resizeObserver?: ResizeObserver;

  ngOnInit(): void {
    // Register layout preference function for this section type
    this.layoutService.register('solutions', (section: CardSection, availableColumns: number) => {
      return this.calculateSolutionsLayoutPreferences(section, availableColumns);
    });
  }

  ngAfterViewInit(): void {
    // Wait for next tick to ensure grid is fully rendered
    setTimeout(() => {
      this.checkGridColumns();

      // Observe grid container for size changes
      if (this.solutionsGrid?.nativeElement) {
        this.resizeObserver = new ResizeObserver(() => {
          this.checkGridColumns();
        });
        this.resizeObserver.observe(this.solutionsGrid.nativeElement);
      }
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  /**
   * Check if grid is rendering as single column
   */
  private checkGridColumns(): void {
    if (!this.solutionsGrid?.nativeElement) {
      return;
    }

    const grid = this.solutionsGrid.nativeElement;
    const children = Array.from(grid.children) as HTMLElement[];

    if (children.length === 0) {
      return;
    }

    // Get the first child's position
    const firstChild = children[0];
    if (!firstChild) {
      return;
    }
    const firstRect = firstChild.getBoundingClientRect();
    const gridRect = grid.getBoundingClientRect();

    // Count how many items fit in the first row by checking their left positions
    let columnCount = 0;
    const firstRowItems: HTMLElement[] = [];

    for (const child of children) {
      const childRect = child.getBoundingClientRect();
      // Items in the same row will have similar top positions (within a small threshold)
      if (Math.abs(childRect.top - firstRect.top) < 5) {
        firstRowItems.push(child);
      } else {
        break; // Stop when we hit the second row
      }
    }

    columnCount = firstRowItems.length;
    this.isSingleColumn = columnCount <= 1;
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
    // Always show all benefits
    return benefits;
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

  /**
   * Get meta label for solution - can be deliveryTime, label, or any string property
   * Returns formatted label with appropriate icon/prefix
   */
  getMetaLabel(solution: any): string | null {
    // Priority: label > deliveryTime > metaLabel > any other string property
    if (solution.label) {
      return solution.label;
    }
    if (solution.deliveryTime) {
      return `⏱️ ${solution.deliveryTime}`;
    }
    if (solution.metaLabel) {
      return solution.metaLabel;
    }
    // Check for other common label properties
    if (solution.duration) {
      return `⏱️ ${solution.duration}`;
    }
    if (solution.timeframe) {
      return `⏱️ ${solution.timeframe}`;
    }
    if (solution.period) {
      return `⏱️ ${solution.period}`;
    }
    return null;
  }

  /**
   * Get the count of remaining benefits (total - 2 visible)
   */
  getRemainingBenefitsCount(solution: any): number {
    if (!solution.benefits || solution.benefits.length <= 2) {
      return 0;
    }
    return solution.benefits.length - 2;
  }

  /**
   * Check if "+X more" button should be shown
   * Always return false - all benefits are always displayed
   */
  shouldShowMoreButton(solution: any, index: number): boolean {
    // Always return false - all benefits are always displayed
    return false;
  }

  /**
   * Get the score percentage for the progress bar
   * Safely converts score to a number and calculates percentage (0-100)
   */
  getScorePercentage(solution: any): number {
    if (solution.score === undefined || solution.score === null) {
      return 0;
    }
    const score = typeof solution.score === 'number' ? solution.score : Number(solution.score);
    if (isNaN(score)) {
      return 0;
    }
    // Clamp between 0 and 10, then convert to percentage
    const clampedScore = Math.max(0, Math.min(10, score));
    return (clampedScore / 10) * 100;
  }

  /**
   * Handle expresso logo click
   */
  onExpressoLogoClick(solution: any): void {
    if (solution?.expressoLink) {
      window.open(solution.expressoLink, '_blank', 'noopener,noreferrer');
    }
  }

  /**
   * Open expresso link in a new tab
   */
  openExpressoLink(link: string): void {
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  }

  /**
   * Get tooltip text for expresso link
   */
  getExpressoTooltip(solution: any): string {
    if (!solution?.expressoLink) {
      return '';
    }
    return 'See the Solution on Expresso';
  }
}
