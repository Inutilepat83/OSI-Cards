import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardItem } from '../../../models';
import { LucideIconsModule } from '../../../icons';
import { BaseSectionComponent, SectionLayoutConfig } from '../base-section.component';

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
  /** Compact card style */
  static readonly layoutConfig: SectionLayoutConfig = {
    preferredColumns: 1,
    minColumns: 1,
    maxColumns: 2,
  };
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
