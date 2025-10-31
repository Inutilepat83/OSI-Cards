import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField, CardSection } from '../../../../models';
import { LucideIconsModule } from '../../../../shared/icons/lucide-icons.module';

type InfoField = CardField & {
  description?: string;
  change?: number;
};

export interface InfoSectionFieldInteraction {
  sectionTitle?: string;
  field: CardField;
}

@Component({
  selector: 'app-info-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './info-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InfoSectionComponent {
  @Input({ required: true }) section!: CardSection;
  @Output() fieldInteraction = new EventEmitter<InfoSectionFieldInteraction>();

  get fields(): InfoField[] {
    return (this.section.fields as InfoField[]) ?? [];
  }

  get hasFields(): boolean {
    return this.fields.length > 0;
  }

  onFieldClick(field: InfoField): void {
    this.fieldInteraction.emit({
      sectionTitle: this.section.title,
      field
    });
  }

  getTrendIcon(field: InfoField): string | null {
    switch (field.trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      case 'neutral':
        return 'minus';
      default:
        return null;
    }
  }

  getTrendClass(field: InfoField): string {
    if (field.change === undefined) {
      return 'trend--neutral';
    }

    if (field.change > 0) {
      return 'trend--up';
    }

    if (field.change < 0) {
      return 'trend--down';
    }

    return 'trend--stable';
  }

  getTrendIconClass(field: InfoField): string {
    switch (field.trend) {
      case 'up':
        return 'trend--up';
      case 'down':
        return 'trend--down';
      case 'neutral':
        return 'trend--stable';
      default:
        return 'trend--neutral';
    }
  }
}
