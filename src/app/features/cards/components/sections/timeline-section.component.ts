import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CardSection, TimelineEvent } from '../../../../models/card.model';

@Component({
  selector: 'app-timeline-section',
  templateUrl: './timeline-section.component.html',
  styleUrls: ['./timeline-section.component.css']
})
export class TimelineSectionComponent {
  @Input() section!: CardSection;
  @Output() eventInteraction = new EventEmitter<{ event: TimelineEvent; section: CardSection; action: string }>();

  get timelineEvents(): TimelineEvent[] {
    return this.section.timelineEvents || [];
  }

  trackByFn(index: number, item: TimelineEvent): string {
    return item.id || index.toString();
  }

  onEventClick(event: TimelineEvent): void {
    this.eventInteraction.emit({
      event: event,
      section: this.section,
      action: 'click'
    });
  }

  getStatusClass(status?: string): string {
    switch (status) {
      case 'completed':
        return 'timeline-event-completed';
      case 'current':
        return 'timeline-event-current';
      case 'upcoming':
        return 'timeline-event-upcoming';
      default:
        return 'timeline-event-default';
    }
  }

  formatDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
