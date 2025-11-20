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
      sectionTitle: this.section.title
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
