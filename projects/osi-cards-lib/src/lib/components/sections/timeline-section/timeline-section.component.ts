import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardItem } from '../../../models';
import { LucideIconsModule } from '../../../icons';
import { BaseSectionComponent, SectionLayoutConfig } from '../base-section.component';

/**
 * Timeline item with date/time information
 */
export interface TimelineItem extends CardItem {
  /** Date of the event */
  date?: string;
  /** Time of the event */
  time?: string;
  /** ISO date string */
  datetime?: string;
  /** Status: completed, current, upcoming */
  status?: 'completed' | 'current' | 'upcoming' | 'cancelled';
  /** Icon name for the timeline marker */
  icon?: string;
  /** Color for the timeline marker */
  color?: string;
}

/**
 * Timeline Section Component
 *
 * Displays events in a vertical timeline format with
 * dates, descriptions, and status indicators.
 *
 * @example
 * ```html
 * <app-timeline-section [section]="timelineSection"></app-timeline-section>
 * ```
 */
@Component({
  selector: 'app-timeline-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './timeline-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimelineSectionComponent extends BaseSectionComponent<TimelineItem> {
  /** Timeline sections are typically full-width */
  static readonly layoutConfig: SectionLayoutConfig = {
    preferredColumns: 2,
    minColumns: 1,
    maxColumns: 3,
    expandOnItemCount: 5,
  };

  get items(): TimelineItem[] {
    return super.getItems() as TimelineItem[];
  }

  /**
   * Get the status class for a timeline item
   */
  getStatusClass(item: TimelineItem): string {
    const status = item.status || 'upcoming';
    return `timeline-item--${status}`;
  }

  /**
   * Get the icon for a timeline item based on status
   */
  getTimelineIcon(item: TimelineItem): string {
    if (item.icon) return item.icon;

    switch (item.status) {
      case 'completed':
        return 'check-circle';
      case 'current':
        return 'circle-dot';
      case 'cancelled':
        return 'x-circle';
      default:
        return 'circle';
    }
  }

  /**
   * Format the date for display
   */
  formatDate(item: TimelineItem): string {
    if (item.date) return item.date;
    if (item.datetime) {
      try {
        const date = new Date(item.datetime);
        return date.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      } catch {
        return item.datetime;
      }
    }
    return '';
  }

  /**
   * Format the time for display
   */
  formatTime(item: TimelineItem): string {
    if (item.time) return item.time;
    if (item.datetime) {
      try {
        const date = new Date(item.datetime);
        return date.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return '';
      }
    }
    return '';
  }

  onItemClick(item: TimelineItem): void {
    this.emitItemInteraction(item, {
      sectionTitle: this.section.title,
      status: item.status
    });
  }

  override trackItem(index: number, item: TimelineItem): string {
    return item.id ?? `timeline-${index}-${item.title || item.date || ''}`;
  }
}

