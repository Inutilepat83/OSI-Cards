import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { EmptyStateComponent, SectionHeaderComponent } from '../../shared';
import { BaseSectionComponent } from '../base-section.component';

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
export class FaqSectionComponent extends BaseSectionComponent {
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
