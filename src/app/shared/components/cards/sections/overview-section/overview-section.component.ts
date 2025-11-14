import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';
import { BaseSectionComponent } from '../base-section.component';
import { SectionUtilsService } from '../../../../services/section-utils.service';

@Component({
  selector: 'app-overview-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './overview-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OverviewSectionComponent extends BaseSectionComponent<CardField> {
  protected readonly utils = inject(SectionUtilsService);

  get fields(): CardField[] {
    return super.getFields();
  }

  override get hasFields(): boolean {
    return super.hasFields;
  }

  onFieldClick(field: CardField): void {
    this.emitFieldInteraction(field);
  }

  trackField(index: number, field: CardField): string {
    return field.id ?? `${field.label}-${index}`;
  }

  getStatusClasses(status?: string): string {
    return this.utils.getStatusClasses(status);
  }
}
