import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField, CardSection } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';

interface SolutionField extends CardField {
  category?: 'consulting' | 'technology' | 'managed' | 'training' | 'support' | string;
  benefits?: string[];
  deliveryTime?: string;
  complexity?: 'low' | 'medium' | 'high';
  teamSize?: string;
  outcomes?: string[];
}

interface SolutionInteraction {
  item: SolutionField;
  metadata?: Record<string, unknown>;
}

@Component({
  selector: 'app-solutions-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './solutions-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolutionsSectionComponent {
  @Input({ required: true }) section!: CardSection;
  @Output() itemInteraction = new EventEmitter<SolutionInteraction>();


  get fields(): SolutionField[] {
    return (this.section.fields as SolutionField[]) ?? [];
  }

  get hasFields(): boolean {
    return this.fields.length > 0;
  }

  trackByField(index: number, field: SolutionField): string {
    return field.id || field.title || field.label || index.toString();
  }

  onSolutionClick(field: SolutionField): void {
    this.itemInteraction.emit({
      item: field,
      metadata: {
        sectionId: this.section.id,
        sectionTitle: this.section.title,
        category: field.category
      }
    });
  }

}
