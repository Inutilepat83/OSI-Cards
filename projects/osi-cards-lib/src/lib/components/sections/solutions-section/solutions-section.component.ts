import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField } from '../../../models';
import { LucideIconsModule } from '../../../icons';
import { BaseSectionComponent, SectionLayoutConfig } from '../base-section.component';

interface SolutionField extends CardField {
  category?: 'consulting' | 'technology' | 'managed' | 'training' | 'support' | string;
  benefits?: string[];
  deliveryTime?: string;
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
  /** Multi-item showcase needs width */
  static readonly layoutConfig: SectionLayoutConfig = {
    preferredColumns: 3,
    minColumns: 2,
    maxColumns: 4,
    expandOnItemCount: 4,
  };
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
