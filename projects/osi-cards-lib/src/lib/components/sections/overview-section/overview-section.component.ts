import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField } from '../../../models';
import { LucideIconsModule } from '../../../icons';
import { BaseSectionComponent, SectionLayoutConfig } from '../base-section.component';
import { SectionUtilsService } from '../../../services';

@Component({
  selector: 'app-overview-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './overview-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OverviewSectionComponent extends BaseSectionComponent<CardField> {
  /** Full-width hero section */
  static readonly layoutConfig: SectionLayoutConfig = {
    preferredColumns: 4,
    minColumns: 2,
    maxColumns: 4,
  };
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

  override trackField(index: number, field: CardField): string {
    return field.id ?? `${field.label}-${index}`;
  }

  getStatusClasses(status?: string): string {
    return this.utils.getStatusClasses(status);
  }

  /**
   * Get display value, hiding "Streaming…" placeholder text
   * Inline implementation to avoid TypeScript override conflicts
   */
  getDisplayValue(field: CardField): string {
    const value = field.value;
    if (value === 'Streaming…' || value === 'Streaming...') {
      return '';
    }
    return value != null ? String(value) : '';
  }
}
