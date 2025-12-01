import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField, CardItem } from '../../../models';
import { LucideIconsModule } from '../../../icons';
import { BaseSectionComponent, SectionLayoutConfig } from '../base-section.component';

type ListEntry = (CardItem & CardField) & {
  priority?: string;
  assignee?: string;
  date?: string;
};

@Component({
  selector: 'app-list-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './list-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListSectionComponent extends BaseSectionComponent<ListEntry> {
  /** Vertical list, compact by default */
  static readonly layoutConfig: SectionLayoutConfig = {
    preferredColumns: 1,
    minColumns: 1,
    maxColumns: 2,
    expandOnItemCount: 8,
  };

  get items(): ListEntry[] {
    return super.getItems() as ListEntry[];
  }


  onItemClick(item: ListEntry): void {
    this.emitItemInteraction(item);
  }

  /**
   * Get display description, hiding "Streaming…" placeholder text
   * Inline implementation to avoid TypeScript override conflicts
   */
  getDisplayDescription(item: ListEntry): string {
    const description = item.description;
    if (description === 'Streaming…' || description === 'Streaming...') {
      return '';
    }
    return description ?? '';
  }

  override trackItem(index: number, item: ListEntry): string {
    return item.id ?? `${item.title ?? item.label}-${index}`;
  }
}
