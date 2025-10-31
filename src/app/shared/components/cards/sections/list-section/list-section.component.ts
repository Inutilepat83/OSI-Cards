import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField, CardItem, CardSection } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';
import { IconService } from '../../../../services/icon.service';

type ListEntry = (CardItem & CardField) & {
  priority?: string;
  assignee?: string;
  date?: string;
};

interface ListItemInteraction {
  item: ListEntry;
  metadata?: Record<string, unknown>;
}

@Component({
  selector: 'app-list-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './list-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListSectionComponent {
  @Input({ required: true }) section!: CardSection;
  @Output() itemInteraction = new EventEmitter<ListItemInteraction>();

  private readonly iconService = inject(IconService);

  get items(): ListEntry[] {
    if (Array.isArray(this.section.items) && this.section.items.length) {
      return this.section.items as ListEntry[];
    }

    if (Array.isArray(this.section.fields) && this.section.fields.length) {
      return (this.section.fields as ListEntry[]).map((field) => {
        const metaDescription = typeof field.meta?.['description'] === 'string'
          ? (field.meta['description'] as string)
          : undefined;

        return {
          ...field,
          title: field.title ?? field.label ?? field.id,
          description: field.description ?? metaDescription
        };
      });
    }

    return [];
  }

  getIconName(item: ListEntry): string {
    const source = item.icon ?? item.label ?? item.title ?? 'default';
    return this.iconService.getFieldIcon(source);
  }

  getStatusClasses(status?: string): string {
    switch ((status ?? '').toLowerCase()) {
      case 'completed':
        return 'list-card__tag--status-completed';
      case 'in-progress':
      case 'active':
        return 'list-card__tag--status-active';
      case 'pending':
        return 'list-card__tag--status-pending';
      case 'cancelled':
      case 'blocked':
        return 'list-card__tag--status-blocked';
      default:
        return 'list-card__tag--status-default';
    }
  }

  getPriorityClasses(priority?: string): string {
    switch ((priority ?? '').toLowerCase()) {
      case 'high':
        return 'list-card__tag--priority-high';
      case 'medium':
        return 'list-card__tag--priority-medium';
      case 'low':
        return 'list-card__tag--priority-low';
      default:
        return 'list-card__tag--priority-default';
    }
  }

  onItemClick(item: ListEntry): void {
    this.itemInteraction.emit({
      item,
      metadata: {
        sectionId: this.section.id
      }
    });
  }
}
