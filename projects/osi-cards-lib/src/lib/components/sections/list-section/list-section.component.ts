import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent } from '../base-section.component';

/**
 * List Section Component
 *
 * Displays structured lists with icons, status indicators, and priority badges.
 * Perfect for task lists, features, requirements, and inventory.
 */
@Component({
  selector: 'lib-list-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './list-section.component.html',
  styleUrl: './list-section.scss'
})
export class ListSectionComponent extends BaseSectionComponent {

  /**
   * Get status class
   */
  getStatusClass(status?: string): string {
    if (!status) return '';
    return `item-status--${status}`;
  }

  /**
   * Get priority class
   */
  getPriorityClass(priority?: string): string {
    if (!priority) return '';
    return `item-priority--${priority}`;
  }
}
