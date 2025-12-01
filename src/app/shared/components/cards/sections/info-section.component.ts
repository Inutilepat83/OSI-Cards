import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField } from '../../../../models';
import { LucideIconsModule } from '../../../../shared/icons/lucide-icons.module';
import { BaseSectionComponent } from './base-section.component';
import { SectionUtilsService } from '../../../services/section-utils.service';

type InfoField = CardField & {
  description?: string;
  change?: number;
  trend?: 'up' | 'down' | 'stable' | 'neutral';
};

/**
 * Event interface for info section field interactions
 */
export interface InfoSectionFieldInteraction {
  sectionTitle?: string;
  field: CardField;
}

/**
 * Info Section Component
 *
 * Displays key-value pairs in a clean, scannable format. Ideal for metadata,
 * contact information, and general data display. Supports trend indicators
 * and change values for dynamic data visualization.
 *
 * Features:
 * - Key-value pair display with labels and values
 * - Trend indicators (up, down, stable, neutral)
 * - Change percentage display
 * - Field interaction events
 * - Streaming placeholder handling
 *
 * @example
 * ```html
 * <app-info-section
 *   [section]="infoSection"
 *   (fieldInteraction)="onFieldClick($event)">
 * </app-info-section>
 * ```
 */
@Component({
  selector: 'app-info-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './info-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoSectionComponent extends BaseSectionComponent<InfoField> {
  private readonly utils = inject(SectionUtilsService);

  // Custom output for backward compatibility with InfoSectionFieldInteraction format
  @Output() infoFieldInteraction = new EventEmitter<InfoSectionFieldInteraction>();

  get fields(): InfoField[] {
    return super.getFields() as InfoField[];
  }

  override get hasFields(): boolean {
    return super.hasFields;
  }

  onFieldClick(field: InfoField): void {
    // Emit to base class for standard handling
    this.emitFieldInteraction(field, { sectionTitle: this.section.title });

    // Also emit in InfoSectionFieldInteraction format for backward compatibility
    this.infoFieldInteraction.emit({
      field,
      sectionTitle: this.section.title,
    });
  }

  getTrendIcon(field: InfoField): string | null {
    const icon = this.utils.getTrendIcon(field.trend ?? this.utils.calculateTrend(field.change));
    // Return null for neutral/default to hide icon
    return icon === 'bar-chart-3' ? null : icon;
  }

  getTrendClass(field: InfoField): string {
    return this.utils.getTrendClass(field.trend ?? field.change);
  }

  getTrendIconClass(field: InfoField): string {
    return this.getTrendClass(field);
  }

  formatChange(change?: number): string {
    return this.utils.formatChange(change);
  }

  /**
   * Get display value, hiding "Streaming…" placeholder text
   * Inline implementation to avoid TypeScript override conflicts
   */
  getDisplayValue(field: InfoField): string {
    const value = field.value;
    if (value === 'Streaming…' || value === 'Streaming...') {
      return '';
    }
    return value != null ? String(value) : '';
  }

  override trackField(index: number, field: InfoField): string {
    return field.id ?? `${field.label}-${index}`;
  }
}
