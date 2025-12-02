import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent } from '../base-section.component';

/**
 * News Section Component
 *
 * Displays news articles, headlines, and press releases.
 * Features: publication dates, sources, categories, featured images.
 */
@Component({
  selector: 'lib-news-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './news-section.component.html',
  styleUrl: './news-section.scss'
})
export class NewsSectionComponent extends BaseSectionComponent {

  /**
   * Get article image URL
   */
  getImageUrl(item: any): string | null {
    return item.meta?.image || null;
  }

  /**
   * Format date for display
   */
  formatDate(dateStr: any): string {
    if (!dateStr || typeof dateStr !== 'string') return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return String(dateStr);
    }
  }
}
