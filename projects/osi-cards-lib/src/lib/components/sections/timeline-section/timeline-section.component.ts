import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent } from '../base-section.component';

/**
 * Timeline Section Component
 *
 * Displays chronological sequences of events and milestones.
 * Features: vertical timeline, date markers, status indicators.
 */
@Component({
  selector: 'lib-timeline-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timeline-section.component.html',
  styleUrl: './timeline-section.scss'
})
export class TimelineSectionComponent extends BaseSectionComponent {

  /**
   * Get date display
   */
  getDateDisplay(item: any): string {
    return item.meta?.date || item.meta?.year || '';
  }

  /**
   * Get status class
   */
  getStatusClass(status?: unknown): string {
    if (!status || typeof status !== 'string') return '';
    return `timeline-status--${status}`;
  }
}
