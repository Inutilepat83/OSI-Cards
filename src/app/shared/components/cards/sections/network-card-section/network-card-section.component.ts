import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';
import { BaseSectionComponent } from '../base-section.component';

type NetworkField = CardField;

@Component({
  selector: 'app-network-card-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './network-card-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NetworkCardSectionComponent extends BaseSectionComponent<NetworkField> {
  get fields(): NetworkField[] {
    return super.getFields();
  }

  override get hasFields(): boolean {
    return super.hasFields;
  }

  override trackField = (_index: number, field: NetworkField): string =>
    field.id ?? field.label ?? `network-${_index}`;

  onItemClick(field: NetworkField): void {
    // Emit as field interaction (network fields are treated as fields)
    this.emitFieldInteraction(field);
  }

  /**
   * Get display value, hiding "Streaming…" placeholder text
   * Inline implementation to avoid TypeScript override conflicts
   */
  getDisplayValue(field: NetworkField): string {
    const value = field.value;
    if (value === 'Streaming…' || value === 'Streaming...') {
      return '';
    }
    return value != null ? String(value) : '';
  }
}
