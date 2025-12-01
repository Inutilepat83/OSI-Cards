import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardItem } from '../../../models';
import { LucideIconsModule } from '../../../icons';
import { BaseSectionComponent, SectionLayoutConfig } from '../base-section.component';

/**
 * Gallery item with image information
 */
export interface GalleryItem extends CardItem {
  /** Image URL */
  src?: string;
  /** Image URL (alias for src) */
  imageUrl?: string;
  /** Fallback URL */
  url?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Thumbnail URL for optimization */
  thumbnail?: string;
  /** Image caption */
  caption?: string;
  /** Image width */
  width?: number;
  /** Image height */
  height?: number;
  /** Aspect ratio */
  aspectRatio?: string;
}

/**
 * Gallery Section Component
 *
 * Displays images in a responsive grid with lightbox support.
 *
 * @example
 * ```html
 * <app-gallery-section [section]="gallerySection"></app-gallery-section>
 * ```
 */
@Component({
  selector: 'app-gallery-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './gallery-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GallerySectionComponent extends BaseSectionComponent<GalleryItem> {
  /** Gallery sections prefer wide layout */
  static readonly layoutConfig: SectionLayoutConfig = {
    preferredColumns: 2,
    minColumns: 1,
    maxColumns: 3,
    expandOnItemCount: 4,
    matchItemCount: true,
  };

  /** Currently selected image for lightbox */
  selectedImage = signal<GalleryItem | null>(null);
  selectedIndex = signal<number>(-1);

  get items(): GalleryItem[] {
    return super.getItems() as GalleryItem[];
  }

  /**
   * Get the image source URL
   */
  getImageSrc(item: GalleryItem): string {
    return item.src || item.imageUrl || item.url || '';
  }

  /**
   * Get the thumbnail URL (fallback to main image)
   */
  getThumbnail(item: GalleryItem): string {
    return item.thumbnail || this.getImageSrc(item);
  }

  /**
   * Get alt text for image
   */
  getAltText(item: GalleryItem): string {
    return item.alt || item.title || item.caption || 'Gallery image';
  }

  /**
   * Get aspect ratio style
   */
  getAspectRatio(item: GalleryItem): string {
    if (item.aspectRatio) return item.aspectRatio;
    if (item.width && item.height) {
      return `${item.width} / ${item.height}`;
    }
    return '4 / 3'; // Default aspect ratio
  }

  /**
   * Open lightbox for an image
   */
  openLightbox(item: GalleryItem, index: number): void {
    this.selectedImage.set(item);
    this.selectedIndex.set(index);

    this.emitItemInteraction(item, {
      sectionTitle: this.section.title,
      action: 'lightbox-open',
      index
    });
  }

  /**
   * Close lightbox
   */
  closeLightbox(): void {
    this.selectedImage.set(null);
    this.selectedIndex.set(-1);
  }

  /**
   * Navigate to previous image
   */
  previousImage(): void {
    const currentIndex = this.selectedIndex();
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      this.selectedIndex.set(newIndex);
      this.selectedImage.set(this.items[newIndex] ?? null);
    }
  }

  /**
   * Navigate to next image
   */
  nextImage(): void {
    const currentIndex = this.selectedIndex();
    if (currentIndex < this.items.length - 1) {
      const newIndex = currentIndex + 1;
      this.selectedIndex.set(newIndex);
      this.selectedImage.set(this.items[newIndex] ?? null);
    }
  }

  /**
   * Handle keyboard navigation in lightbox
   */
  handleLightboxKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        this.closeLightbox();
        break;
      case 'ArrowLeft':
        this.previousImage();
        break;
      case 'ArrowRight':
        this.nextImage();
        break;
    }
  }

  /**
   * Check if there's a previous image
   */
  get hasPrevious(): boolean {
    return this.selectedIndex() > 0;
  }

  /**
   * Check if there's a next image
   */
  get hasNext(): boolean {
    return this.selectedIndex() < this.items.length - 1;
  }

  override trackItem(index: number, item: GalleryItem): string {
    return item.id ?? `gallery-${index}-${item.src || item.title || ''}`;
  }
}

