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

  getIconName(field: NetworkField): string {
    const id = (field.id ?? '').toLowerCase();

    if (id.includes('report') || id.includes('partner')) {
      return 'users';
    }
    if (id.includes('board') || id.includes('award')) {
      return 'award';
    }
    if (id.includes('advisor') || id.includes('mentor')) {
      return 'message-circle';
    }
    if (id.includes('event') || id.includes('speaking')) {
      return 'calendar';
    }
    return 'share-2';
  }

  getAnimationDelay(index: number, baseDelay = 60): string {
    return `${index * baseDelay}ms`;
  }

  getAnimationDuration(duration = 0.6): string {
    return `fadeInUp ${duration}s ease-out forwards`;
  }

  getIconTone(field: NetworkField): string {
    const id = (field.id ?? '').toLowerCase();

    if (id.includes('report') || id.includes('partner')) {
      return 'network-card__icon--collab';
    }
    if (id.includes('board') || id.includes('award')) {
      return 'network-card__icon--recognition';
    }
    if (id.includes('advisor') || id.includes('mentor')) {
      return 'network-card__icon--advisory';
    }
    if (id.includes('event') || id.includes('speaking')) {
      return 'network-card__icon--events';
    }
    return 'network-card__icon--default';
  }
}
