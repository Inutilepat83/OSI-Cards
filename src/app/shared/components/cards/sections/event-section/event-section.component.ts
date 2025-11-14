import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardItem, CardSection } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';

interface TimelineEvent extends CardItem {
  date?: string;
  time?: string;
  status?: string;
}

interface EventInteraction {
  item: TimelineEvent;
  metadata?: Record<string, unknown>;
}

@Component({
  selector: 'app-event-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './event-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventSectionComponent {
  @Input({ required: true }) section!: CardSection;
  @Output() itemInteraction = new EventEmitter<EventInteraction>();

  get events(): TimelineEvent[] {
    const timeline = (this.section as Record<string, unknown>)['timelineEvents'];
    if (Array.isArray(timeline)) {
      return timeline as TimelineEvent[];
    }
    return (this.section.items as TimelineEvent[]) ?? [];
  }


  onEventClick(event: TimelineEvent): void {
    this.itemInteraction.emit({
      item: event,
      metadata: {
        sectionTitle: this.section.title
      }
    });
  }

  trackEvent(index: number, event: TimelineEvent): string {
    return event.id ?? `${event.title}-${index}`;
  }
}
