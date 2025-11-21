import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';
import { BaseSectionComponent } from '../base-section.component';

interface SolutionField extends CardField {
  category?: 'consulting' | 'technology' | 'managed' | 'training' | 'support' | string;
  benefits?: string[];
  deliveryTime?: string;
  complexity?: 'low' | 'medium' | 'high';
  teamSize?: string;
  outcomes?: string[];
}

@Component({
  selector: 'app-solutions-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './solutions-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolutionsSectionComponent extends BaseSectionComponent<SolutionField> {
  get fields(): SolutionField[] {
    return super.getFields() as SolutionField[];
  }

  override get hasFields(): boolean {
    return super.hasFields;
  }

  override trackField(index: number, field: SolutionField): string {
    return field.id || field.title || field.label || index.toString();
  }

  onSolutionClick(field: SolutionField): void {
    // Solutions are treated as items in the template
    this.emitItemInteraction(field, { category: field.category });
  }
}
