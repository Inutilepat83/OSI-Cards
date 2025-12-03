import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { EmptyStateComponent, SectionHeaderComponent } from '../../shared';
import { BaseSectionComponent } from '../base-section.component';

/**
 * Gallery Section Component
 *
 * Displays image galleries with responsive grid layout.
 * Features: lazy loading, captions, hover effects.
 */
@Component({
  selector: 'lib-gallery-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent],
  templateUrl: './gallery-section.component.html',
  styleUrl: './gallery-section.scss',
})
export class GallerySectionComponent extends BaseSectionComponent {
  /**
   * Get image URL from item
   */
  getImageUrl(item: any): string {
    return item.meta?.url || item.meta?.src || item.url || '';
  }

  /**
   * Get image caption
   */
  getCaption(item: any): string {
    return item.title || item.meta?.caption || '';
  }

  /**
   * Get image alt text
   */
  getAltText(item: any): string {
    return item.meta?.alt || item.title || 'Gallery image';
  }

  /**
   * Handle image click
   */
  onImageClick(item: any, index: number): void {
    // Optional: Can emit event for lightbox integration
    console.log('Image clicked:', index, item);
  }
}
