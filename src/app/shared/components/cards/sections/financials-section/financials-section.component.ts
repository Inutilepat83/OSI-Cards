import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';
import { BaseSectionComponent } from '../base-section.component';
import { SectionUtilsService } from '../../../../services/section-utils.service';

type FinancialField = CardField & {
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  format?: string;
};

@Component({
  selector: 'app-financials-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './financials-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinancialsSectionComponent extends BaseSectionComponent<FinancialField> {
  protected readonly utils = inject(SectionUtilsService);

  get fields(): FinancialField[] {
    return super.getFields() as FinancialField[];
  }

  override get hasFields(): boolean {
    return super.hasFields;
  }

  onFieldClick(field: FinancialField): void {
    this.emitFieldInteraction(field);
  }

  getTrendIcon(field: FinancialField): string | null {
    return this.utils.getTrendIcon(field.trend ?? this.utils.calculateTrend(field.change));
  }

  getChangeClass(field: FinancialField): string {
    return this.utils.getTrendClass(field.trend ?? field.change);
  }

  formatChange(change?: number): string {
    return this.utils.formatChange(change);
  }

  /**
   * Get display value, hiding "Streaming…" placeholder text
   * Inline implementation to avoid TypeScript override conflicts
   */
  getDisplayValue(field: FinancialField): string {
    const value = field.value;
    if (value === 'Streaming…' || value === 'Streaming...') {
      return '';
    }
    return value != null ? String(value) : '';
  }

  override trackField(index: number, field: FinancialField): string {
    return field.id ?? `${field.label}-${index}`;
  }
}
