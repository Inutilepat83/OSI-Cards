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

  getStatusChipClass(event: TimelineEvent): string {
    switch ((event.status ?? '').toLowerCase()) {
      case 'completed':
      case 'success':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40';
      case 'in-progress':
      case 'active':
        return 'bg-primary/15 text-primary border-primary/40';
      case 'pending':
      case 'upcoming':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/40';
      case 'current':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/40';
      case 'delayed':
      case 'blocked':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/40';
      default:
        return 'bg-muted/40 text-muted-foreground border-border/40';
    }
  }

  onEventClick(event: TimelineEvent): void {
    this.itemInteraction.emit({
      item: event,
      metadata: {
        sectionTitle: this.section.title
      }
    });
  }
}
