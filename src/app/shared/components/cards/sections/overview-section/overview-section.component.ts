import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField, CardSection } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';

interface OverviewFieldInteraction {
  field: CardField;
  metadata?: Record<string, unknown>;
}

@Component({
  selector: 'app-overview-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './overview-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OverviewSectionComponent {
  @Input({ required: true }) section!: CardSection;
  @Output() fieldInteraction = new EventEmitter<OverviewFieldInteraction>();

  get fields(): CardField[] {
    return (this.section.fields as CardField[]) ?? [];
  }

  get hasFields(): boolean {
    return this.fields.length > 0;
  }

  get gridClass(): string {
    const count = this.fields.length;
    if (count <= 2) {
      return 'grid grid-cols-1 gap-3';
    }
    if (count <= 4) {
      return 'grid grid-cols-1 sm:grid-cols-2 gap-3';
    }
    return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3';
  }

  onFieldClick(field: CardField): void {
    this.fieldInteraction.emit({
      field,
      metadata: {
        sectionId: this.section.id,
        sectionTitle: this.section.title
      }
    });
  }

  getStatusClasses(status?: string): string {
    switch ((status ?? '').toLowerCase()) {
      case 'active':
      case 'completed':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'pending':
      case 'warning':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'inactive':
      case 'error':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default:
        return 'bg-primary/15 text-primary border-primary/30';
    }
  }
}
