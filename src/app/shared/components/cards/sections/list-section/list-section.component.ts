import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField, CardItem } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';
import { BaseSectionComponent } from '../base-section.component';

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
