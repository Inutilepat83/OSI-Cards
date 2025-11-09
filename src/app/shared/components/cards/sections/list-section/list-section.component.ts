import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField, CardItem } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';
import { IconService } from '../../../../services/icon.service';
import { BaseSectionComponent } from '../base-section.component';
import { SectionUtilsService } from '../../../../services/section-utils.service';

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
  private readonly iconService = inject(IconService);
  protected readonly utils = inject(SectionUtilsService);

  get items(): ListEntry[] {
    return super.getItems() as ListEntry[];
  }

  getIconName(item: ListEntry): string {
    const source = item.icon ?? item.label ?? item.title ?? 'default';
    return this.iconService.getFieldIcon(source);
  }

  getStatusClasses(status?: string): string {
    const baseClass = this.utils.getStatusClasses(status);
    return baseClass.replace('status--', 'section-card__tag--status-');
  }

  getPriorityClasses(priority?: string): string {
    const baseClass = this.utils.getPriorityClasses(priority);
    return baseClass.replace('priority--', 'section-card__tag--priority-');
  }

  onItemClick(item: ListEntry): void {
    this.emitItemInteraction(item);
  }

  trackItem(index: number, item: ListEntry): string {
    return item.id ?? `${item.title ?? item.label}-${index}`;
  }
}
