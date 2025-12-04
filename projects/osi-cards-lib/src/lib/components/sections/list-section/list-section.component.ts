import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent } from '../base-section.component';
import { SectionHeaderComponent, EmptyStateComponent, BadgeComponent } from '../../shared';

/**
 * List Section Component
 *
 * Displays structured lists with icons, status indicators, and priority badges.
 * Perfect for task lists, features, requirements, and inventory.
 */
@Component({
  selector: 'lib-list-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent, BadgeComponent],
  templateUrl: './list-section.component.html',
  styleUrl: './list-section.scss',
})
export class ListSectionComponent extends BaseSectionComponent {
  /**
   * Get status class (deprecated - kept for backward compatibility)
   */
  getStatusClass(status?: string): string {
    if (!status) return '';
    return `item-status--${status}`;
  }

  /**
   * Get priority class (deprecated - kept for backward compatibility)
   */
  getPriorityClass(priority?: string): string {
    if (!priority) return '';
    return `item-priority--${priority}`;
  }

  /**
   * Map status to badge variant
   */
  getStatusVariant(status?: string): 'success' | 'warning' | 'error' | 'primary' | 'default' {
    if (!status) return 'default';
    const statusLower = status.toLowerCase();

    if (statusLower.includes('complete') || statusLower === 'done') return 'success';
    if (statusLower.includes('progress') || statusLower === 'active') return 'primary';
    if (statusLower === 'pending' || statusLower === 'waiting') return 'warning';
    if (statusLower.includes('cancel') || statusLower === 'blocked') return 'error';

    return 'default';
  }

  /**
   * Map priority to badge variant
   */
  getPriorityVariant(priority?: string): 'error' | 'warning' | 'success' | 'default' {
    if (!priority) return 'default';
    const priorityLower = priority.toLowerCase();

    if (priorityLower === 'high' || priorityLower === 'urgent') return 'error';
    if (priorityLower === 'medium' || priorityLower === 'normal') return 'warning';
    if (priorityLower === 'low') return 'success';

    return 'default';
  }
}
