import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent } from '../base-section.component';
import { SectionHeaderComponent, EmptyStateComponent, BadgeComponent } from '../../shared';

/**
 * Event Section Component
 *
 * Displays chronological events, schedules, and calendar information.
 * Features: dates, times, locations, status indicators.
 */
@Component({
  selector: 'lib-event-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent, BadgeComponent],
  templateUrl: './event-section.component.html',
  styleUrl: './event-section.scss'
})
export class EventSectionComponent extends BaseSectionComponent {

  /**
   * Format date for display
   */
  formatDate(dateStr: string): { day: string; month: string } | null {
    if (!dateStr) return null;

    try {
      const date = new Date(dateStr);
      return {
        day: date.getDate().toString(),
        month: date.toLocaleDateString('en-US', { month: 'short' })
      };
    } catch {
      return null;
    }
  }

  /**
   * Get status class (deprecated - kept for backward compatibility)
   */
  getStatusClass(status?: string): string {
    if (!status) return '';
    return `event-status--${status}`;
  }

  /**
   * Map status to badge variant
   */
  getStatusVariant(status?: string): 'success' | 'warning' | 'error' | 'primary' | 'default' {
    if (!status) return 'default';
    const statusLower = status.toLowerCase();

    if (statusLower === 'confirmed' || statusLower === 'completed') return 'success';
    if (statusLower === 'upcoming' || statusLower === 'scheduled') return 'primary';
    if (statusLower === 'tentative' || statusLower === 'pending') return 'warning';
    if (statusLower === 'cancelled' || statusLower === 'postponed') return 'error';

    return 'default';
  }
}
