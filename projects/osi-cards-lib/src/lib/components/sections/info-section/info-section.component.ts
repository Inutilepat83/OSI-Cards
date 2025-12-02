import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent } from '../base-section.component';

/**
 * Info Section Component
 *
 * Displays key-value pairs in a clean, scannable format.
 * Perfect for structured data, metadata, and profile information.
 */
@Component({
  selector: 'lib-info-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './info-section.component.html',
  styleUrl: './info-section.scss'
})
export class InfoSectionComponent extends BaseSectionComponent {

  /**
   * Get trend class
   */
  getTrendClass(trend?: string): string {
    if (!trend) return '';
    return `info-trend--${trend}`;
  }

  /**
   * Format change value
   */
  formatChange(change?: number): string {
    if (change === undefined || change === null) return '';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change}%`;
  }
}
