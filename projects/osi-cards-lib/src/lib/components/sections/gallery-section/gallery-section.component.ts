import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { EmptyStateComponent, SectionHeaderComponent } from '../../shared';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';
import { SectionLayoutPreferenceService } from '../../../services/section-layout-preference.service';
import { CardSection } from '../../../models';

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
export class GallerySectionComponent extends BaseSectionComponent implements OnInit {
  private readonly layoutService = inject(SectionLayoutPreferenceService);
  private readonly failedImages = new Set<string>(); // Track failed image URLs
  private readonly loadingImages = new Map<string, boolean>(); // Track images currently loading

  ngOnInit(): void {
    // Register layout preference function for this section type
    this.layoutService.register('gallery', (section: CardSection, availableColumns: number) => {
      return this.calculateGalleryLayoutPreferences(section, availableColumns);
    });
  }

  /**
   * Calculate layout preferences for gallery section based on content.
   * Gallery sections: 2 cols default, can shrink to 1, expands to 3-4 for many images
   */
  private calculateGalleryLayoutPreferences(
    section: CardSection,
    availableColumns: number
  ): SectionLayoutPreferences {
    const items = section.items ?? [];
    const itemCount = items.length;

    // Gallery sections: 2 cols default, can shrink to 1, expands to 3-4 for many images
    let preferredColumns: 1 | 2 | 3 | 4 = 2;
    if (itemCount >= 6 && availableColumns >= 3) {
      preferredColumns = 3;
    }
    if (itemCount <= 2) {
      preferredColumns = 1;
    }

    // Respect explicit preferences
    if (section.preferredColumns) {
      preferredColumns = section.preferredColumns;
    }

    preferredColumns = Math.min(preferredColumns, availableColumns) as 1 | 2 | 3 | 4;

    return {
      preferredColumns,
      minColumns: (section.minColumns ?? 1) as 1 | 2 | 3 | 4,
      maxColumns: Math.min((section.maxColumns ?? 3) as 1 | 2 | 3 | 4, availableColumns) as
        | 1
        | 2
        | 3
        | 4,
      canShrinkToFill: true,
      shrinkPriority: 18, // Higher priority for shrinking (galleries are flexible, promotes side-by-side)
      expandOnContent: {
        itemCount: 6, // Expand to 3 columns at 6+ images
      },
    };
  }

  /**
   * Get layout preferences for gallery section.
   */
  override getLayoutPreferences(availableColumns: number = 4): SectionLayoutPreferences {
    const servicePrefs = this.layoutService.getPreferences(this.section, availableColumns);
    if (servicePrefs) {
      return servicePrefs;
    }
    return this.calculateGalleryLayoutPreferences(this.section, availableColumns);
  }
  /**
   * Get image URL from item
   * Prioritizes meta.url, then meta.src, then item.url
   */
  getImageUrl(item: any): string {
    // Try multiple possible locations for image URL
    const url = item.meta?.url || item.meta?.src || item.url || item.image || '';
    const imageUrl = url?.trim() || '';

    // If no URL provided, return placeholder immediately
    if (!imageUrl) {
      console.warn('GallerySection: No image URL found for item:', item.title || item);
      return this.generatePlaceholderUrl(item);
    }

    // If this image has failed before, return placeholder
    if (this.failedImages.has(imageUrl)) {
      console.debug('GallerySection: Using placeholder for previously failed image:', imageUrl);
      return this.generatePlaceholderUrl(item);
    }

    // Log successful URL extraction for debugging
    console.debug(
      'GallerySection: Loading image from URL:',
      imageUrl,
      'for item:',
      item.title || item
    );

    return imageUrl;
  }

  /**
   * Generate a placeholder image URL with alt text
   */
  private generatePlaceholderUrl(item: any): string {
    const altText = this.getAltText(item);
    const width = 400;
    const height = 300;

    // Truncate text if too long (max 50 chars for display)
    const displayText = altText.length > 50 ? altText.substring(0, 47) + '...' : altText;

    // Create SVG placeholder with alt text
    // Use URL encoding instead of base64 for better compatibility
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#e0e0e0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#666" font-family="system-ui, -apple-system, sans-serif" font-size="14" dominant-baseline="middle">${displayText}</text></svg>`;

    // Use URL encoding for SVG data URI (more reliable than base64 for SVGs)
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  /**
   * Handle image load error
   */
  onImageError(event: Event, item: any): void {
    const img = event.target as HTMLImageElement;
    // Prevent infinite error loop
    if (img.src.startsWith('data:image/svg+xml')) {
      return;
    }

    // Get the original URL before it was potentially replaced
    const originalUrl = item.meta?.url || item.meta?.src || item.url || item.image || '';

    // Log the error for debugging
    console.error(
      'GallerySection: Failed to load image:',
      originalUrl,
      'for item:',
      item.title || item
    );

    // Mark this image as failed if it was a real URL
    if (originalUrl && !originalUrl.startsWith('data:')) {
      this.failedImages.add(originalUrl);
    }

    // Always set placeholder on error
    const placeholderUrl = this.generatePlaceholderUrl(item);
    img.src = placeholderUrl;
    img.classList.add('image-error');
    img.alt = this.getAltText(item) + ' (Image unavailable)';
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
   * Handle successful image load
   */
  onImageLoad(event: Event, item: any): void {
    const img = event.target as HTMLImageElement;
    img.classList.remove('image-error');
    img.classList.add('image-loaded');

    // Mark as successfully loaded
    const url = item.meta?.url || item.meta?.src || item.url || item.image || '';
    if (url) {
      this.loadingImages.delete(url);
      console.debug(
        'GallerySection: Successfully loaded image:',
        url,
        'for item:',
        item.title || item
      );
    }
  }

  /**
   * Handle image click
   */
  onImageClick(item: any, index: number): void {
    // Optional: Can emit event for lightbox integration
    console.log('Image clicked:', index, item);
  }
}
