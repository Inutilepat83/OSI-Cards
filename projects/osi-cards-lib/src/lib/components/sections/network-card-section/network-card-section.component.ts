import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent } from '../base-section.component';

/**
 * Network Card Section Component
 *
 * Displays network relationships, partnerships, and organizational structures.
 * Features: influence scores, connection counts, status indicators.
 */
@Component({
  selector: 'lib-network-card-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './network-card-section.component.html',
  styleUrl: './network-card-section.scss'
})
export class NetworkCardSectionComponent extends BaseSectionComponent {

  /**
   * Get status class
   */
  getStatusClass(status?: unknown): string {
    if (!status || typeof status !== 'string') return '';
    return `network-status--${status}`;
  }
}
