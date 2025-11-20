import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField, CardSection } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';

type NetworkField = CardField;

interface NetworkInteraction {
  item: NetworkField;
  metadata?: Record<string, unknown>;
}

@Component({
  selector: 'app-network-card-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './network-card-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NetworkCardSectionComponent {
  @Input({ required: true }) section!: CardSection;
  @Output() itemInteraction = new EventEmitter<NetworkInteraction>();

  get fields(): NetworkField[] {
    return (this.section.fields as NetworkField[]) ?? [];
  }

  trackField = (_index: number, field: NetworkField): string => field.id ?? field.label ?? `network-${_index}`;

  onItemClick(field: NetworkField): void {
    this.itemInteraction.emit({
      item: field,
      metadata: {
        sectionId: this.section.id,
        sectionTitle: this.section.title
      }
    });
  }

  /**
   * Get display value, hiding "Streaming…" placeholder text
   */
  getDisplayValue(field: NetworkField): string {
    const value = field.value;
    if (value === 'Streaming…' || value === 'Streaming...') {
      return '';
    }
    return value != null ? String(value) : '';
  }

}
