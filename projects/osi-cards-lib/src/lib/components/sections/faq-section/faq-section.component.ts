import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardItem } from '../../../models';
import { LucideIconsModule } from '../../../icons';
import { BaseSectionComponent, SectionLayoutConfig } from '../base-section.component';

/**
 * FAQ item with question and answer
 */
export interface FAQItem extends CardItem {
  /** The question text */
  question?: string;
  /** The answer text */
  answer?: string;
  /** Category for grouping */
  category?: string;
  /** Whether expanded by default */
  expanded?: boolean;
  /** Optional URL for learn more link */
  url?: string;
}

/**
 * FAQ Section Component
 *
 * Displays frequently asked questions in an accordion format
 * with expandable/collapsible answers.
 *
 * @example
 * ```html
 * <app-faq-section [section]="faqSection"></app-faq-section>
 * ```
 */
@Component({
  selector: 'app-faq-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './faq-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FAQSectionComponent extends BaseSectionComponent<FAQItem> {
  /** FAQ sections work well in 2 columns */
  static readonly layoutConfig: SectionLayoutConfig = {
    preferredColumns: 2,
    minColumns: 1,
    maxColumns: 2,
    expandOnItemCount: 6,
  };

  /** Track expanded state for each FAQ item */
  private expandedItems = signal<Set<string>>(new Set());

  get items(): FAQItem[] {
    return super.getItems() as FAQItem[];
  }

  /**
   * Get the question text from an item
   */
  getQuestion(item: FAQItem): string {
    return item.question || item.title || '';
  }

  /**
   * Get the answer text from an item
   */
  getAnswer(item: FAQItem): string {
    return item.answer || item.description || '';
  }

  /**
   * Check if an item is expanded
   */
  isExpanded(item: FAQItem, index: number): boolean {
    const itemId = this.getItemId(item, index);
    // Check signal state first, then default expanded property
    if (this.expandedItems().has(itemId)) {
      return true;
    }
    // Initial state from item.expanded
    if (item.expanded === true && !this.hasBeenToggled(itemId)) {
      return true;
    }
    return false;
  }

  /**
   * Check if item has been manually toggled
   */
  private toggledItems = new Set<string>();
  private hasBeenToggled(itemId: string): boolean {
    return this.toggledItems.has(itemId);
  }

  /**
   * Toggle the expanded state of an item
   */
  toggleItem(item: FAQItem, index: number): void {
    const itemId = this.getItemId(item, index);
    this.toggledItems.add(itemId);

    this.expandedItems.update(expanded => {
      const newSet = new Set(expanded);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });

    this.emitItemInteraction(item, {
      sectionTitle: this.section.title,
      expanded: this.isExpanded(item, index)
    });
  }

  /**
   * Expand all FAQ items
   */
  expandAll(): void {
    const allIds = this.items.map((item, i) => this.getItemId(item, i));
    allIds.forEach(id => this.toggledItems.add(id));
    this.expandedItems.set(new Set(allIds));
  }

  /**
   * Collapse all FAQ items
   */
  collapseAll(): void {
    this.items.forEach((item, i) => {
      this.toggledItems.add(this.getItemId(item, i));
    });
    this.expandedItems.set(new Set());
  }

  /**
   * Get categories from items
   */
  get categories(): string[] {
    const cats = new Set<string>();
    this.items.forEach(item => {
      if (item.category) {
        cats.add(item.category);
      }
    });
    return Array.from(cats);
  }

  /**
   * Get items by category
   */
  getItemsByCategory(category: string): FAQItem[] {
    return this.items.filter(item => item.category === category);
  }

  override trackItem(index: number, item: FAQItem): string {
    return item.id ?? `faq-${index}-${item.question || item.title || ''}`;
  }
}

