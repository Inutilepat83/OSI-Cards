import { Component, OnInit, inject, HostListener, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';
import { SectionHeaderComponent, EmptyStateComponent } from '../../shared';
import { SectionLayoutPreferenceService } from '../../../services/section-layout-preference.service';
import { CardSection } from '../../../models';

/**
 * Overview Section Component
 *
 * Displays high-level summaries and executive dashboards.
 * Perfect for company profiles, key highlights, and quick insights.
 */
@Component({
  selector: 'lib-overview-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent],
  templateUrl: './overview-section.component.html',
  styleUrl: './overview-section.scss',
})
export class OverviewSectionComponent extends BaseSectionComponent implements OnInit {
  private readonly layoutService = inject(SectionLayoutPreferenceService);
  private readonly sanitizer = inject(DomSanitizer);

  ngOnInit(): void {
    // Register layout preference function for this section type
    this.layoutService.register('overview', (section: CardSection, availableColumns: number) => {
      return this.calculateOverviewLayoutPreferences(section, availableColumns);
    });
  }

  /**
   * Calculate layout preferences for overview section based on content.
   */
  private calculateOverviewLayoutPreferences(
    section: CardSection,
    availableColumns: number
  ): SectionLayoutPreferences {
    const fields = section.fields ?? [];
    const fieldCount = fields.length;

    // Overview sections: 3 cols default, can shrink to 1-2, expands to 4 for many fields
    let preferredColumns: 1 | 2 | 3 | 4 = 3;
    if (fieldCount >= 12) {
      preferredColumns = 4;
    } else if (fieldCount <= 4) {
      preferredColumns = 2;
    } else if (fieldCount <= 2) {
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
      maxColumns: Math.min((section.maxColumns ?? 4) as 1 | 2 | 3 | 4, availableColumns) as
        | 1
        | 2
        | 3
        | 4,
      canShrinkToFill: true,
      shrinkPriority: 40, // Lower priority (overview sections prefer to stay wide)
      expandOnContent: {
        fieldCount: 12, // Expand to 4 columns at 12+ fields
      },
    };
  }

  /**
   * Get layout preferences for overview section.
   */
  override getLayoutPreferences(availableColumns: number = 4): SectionLayoutPreferences {
    const servicePrefs = this.layoutService.getPreferences(this.section, availableColumns);
    if (servicePrefs) {
      return servicePrefs;
    }
    return this.calculateOverviewLayoutPreferences(this.section, availableColumns);
  }

  /**
   * Check if field should be highlighted
   */
  isHighlighted(field: any): boolean {
    return field.highlight === true;
  }

  /**
   * Track expanded state for each field
   */
  expandedFields = new Set<number>();

  /**
   * Track animation state for smooth transitions
   */
  animatingFields = new Set<number>();

  /**
   * Toggle expanded state for a field with smooth animation
   */
  toggleExpanded(index: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const isCurrentlyExpanded = this.expandedFields.has(index);

    // Add to animating set for transition
    this.animatingFields.add(index);

    if (isCurrentlyExpanded) {
      this.expandedFields.delete(index);
    } else {
      this.expandedFields.add(index);
    }

    // Remove from animating set after animation completes
    setTimeout(() => {
      this.animatingFields.delete(index);
    }, 300); // Match CSS transition duration
  }

  /**
   * Check if a field is expanded
   */
  isExpanded(index: number): boolean {
    return this.expandedFields.has(index);
  }

  /**
   * Check if a field is currently animating
   */
  isAnimating(index: number): boolean {
    return this.animatingFields.has(index);
  }

  /**
   * Check if a value is long enough to need expansion
   */
  shouldShowExpandButton(field: any): boolean {
    const value = field.value?.toString() || '';
    // Show expand button if value is longer than ~100 characters
    return value && value.length > 100;
  }

  /**
   * Handle keyboard navigation for expand/collapse
   */
  @HostListener('keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    // Handle Enter or Space on expand buttons
    if (event.key === 'Enter' || event.key === ' ') {
      const target = event.target as HTMLElement;
      if (target.classList.contains('value-expand-btn')) {
        event.preventDefault();
        // Check if it's the continuous text button (no data-index) or individual field button
        const button = target as HTMLButtonElement;
        const index = button.getAttribute('data-index');
        if (index !== null) {
          // Individual field expand
          this.toggleExpanded(parseInt(index, 10), event);
        } else {
          // Continuous text expand
          this.toggleTextExpanded(event);
        }
      }
    }
  }

  /**
   * Get accessible label for expand button
   */
  getExpandButtonLabel(field: any, index: number): string {
    const isExpanded = this.isExpanded(index);
    return isExpanded ? `Collapse ${field.label} content` : `Expand ${field.label} content`;
  }

  /**
   * Get truncated value for aria-label
   * Safely converts value to string and truncates if needed
   */
  getTruncatedValue(field: any, maxLength: number = 100): string {
    const value = field.value?.toString() || '';
    if (value.length <= maxLength) {
      return value;
    }
    return value.substring(0, maxLength) + '...';
  }

  /**
   * Get full value as string for aria-label
   */
  getFullValue(field: any): string {
    return field.value?.toString() || '';
  }

  /**
   * Combine all field values into a single continuous markdown text
   */
  getCombinedText(): string {
    if (!this.section.fields || this.section.fields.length === 0) {
      return '';
    }

    return this.section.fields
      .map((field) => {
        const label = field.label || '';
        const value = field.value?.toString() || '';
        const trimmedValue = value.trim();

        if (!trimmedValue) {
          return '';
        }

        // Format as markdown with label as bold and value as paragraph
        if (label) {
          return `**${label}**\n\n${trimmedValue}\n\n`;
        }
        return `${trimmedValue}\n\n`;
      })
      .filter((text) => text.length > 0)
      .join('');
  }

  /**
   * Render markdown content to HTML
   */
  getRenderedMarkdown(): SafeHtml {
    const markdown = this.getCombinedText();
    if (!markdown) {
      return '';
    }

    try {
      // Configure marked options for v17 API
      marked.use({
        breaks: true, // Convert line breaks to <br>
        gfm: true, // GitHub Flavored Markdown
      });

      const html = marked.parse(markdown) as string;
      const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, html);
      return sanitized ? this.sanitizer.bypassSecurityTrustHtml(sanitized) : '';
    } catch (error) {
      console.error('Error rendering markdown:', error);
      // Fallback to plain text
      const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, markdown);
      return sanitized ? this.sanitizer.bypassSecurityTrustHtml(sanitized) : '';
    }
  }

  /**
   * Check if the combined text is long enough to need expansion
   */
  shouldShowExpandButtonForText(): boolean {
    const text = this.getCombinedText();
    return text ? text.length > 200 : false; // Show expand button for longer text
  }

  /**
   * Track expanded state for the entire text
   */
  isTextExpanded = false;

  /**
   * Toggle expanded state for the entire text
   */
  toggleTextExpanded(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isTextExpanded = !this.isTextExpanded;
  }
}
