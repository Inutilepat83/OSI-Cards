import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';
import { BaseSectionComponent } from '../base-section.component';
import { SectionUtilsService } from '../../../../services/section-utils.service';

/**
 * Overview Section Component
 *
 * Displays high-level overview information with key metrics and status indicators.
 * Optimized for executive summaries and dashboard-style data presentation.
 *
 * Features:
 * - Key metrics display
 * - Status badge support
 * - Field interaction events
 * - Streaming placeholder handling
 *
 * @example
 * ```html
 * <app-overview-section
 *   [section]="overviewSection"
 *   (fieldInteraction)="onFieldClick($event)">
 * </app-overview-section>
 * ```
 */
@Component({
  selector: 'app-overview-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './overview-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
