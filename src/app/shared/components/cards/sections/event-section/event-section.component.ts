import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardItem } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';
import { BaseSectionComponent } from '../base-section.component';

interface TimelineEvent extends CardItem {
  date?: string;
  time?: string;
  status?: string;
}

@Component({
  selector: 'app-event-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './event-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventSectionComponent extends BaseSectionComponent<TimelineEvent> {
  get events(): TimelineEvent[] {
    const timeline = (this.section as Record<string, unknown>)['timelineEvents'];
    if (Array.isArray(timeline)) {
      return timeline as TimelineEvent[];
    }
    return super.getItems() as TimelineEvent[];
  }

  override get hasItems(): boolean {
    return this.events.length > 0;
  }

  onEventClick(event: TimelineEvent): void {
    this.emitItemInteraction(event);
  }

  override trackItem(index: number, event: TimelineEvent): string {
    return event.id ?? `${event.title}-${index}`;
  }
}
