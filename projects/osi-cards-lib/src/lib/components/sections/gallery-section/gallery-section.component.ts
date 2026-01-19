import { CommonModule, DOCUMENT } from '@angular/common';
import {
  Component,
  OnInit,
  inject,
  signal,
  HostListener,
  OnDestroy,
  ChangeDetectionStrategy,
  Renderer2,
  ElementRef,
} from '@angular/core';
import { EmptyStateComponent, SectionHeaderComponent } from '../../shared';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';
import { SectionLayoutPreferenceService, LoggerService } from '@osi-cards/services';
import { CardSection } from '@osi-cards/models';

/**
 * Gallery Section Component
 *
 * Displays image galleries with responsive grid layout.
 * Features: lazy loading, captions, hover effects, full-screen overlay.
 */
@Component({
  selector: 'lib-gallery-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent],
  templateUrl: './gallery-section.component.html',
  styleUrl: './gallery-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GallerySectionComponent extends BaseSectionComponent implements OnInit, OnDestroy {
  private readonly layoutService = inject(SectionLayoutPreferenceService);
  private readonly document = inject(DOCUMENT);
  private readonly renderer = inject(Renderer2);
  private readonly elementRef = inject(ElementRef);
  private readonly logger = inject(LoggerService, { optional: true });
  private readonly failedImages = new Set<string>(); // Track failed image URLs
  private readonly loadingImages = new Map<string, boolean>(); // Track images currently loading

  // Overlay state
  selectedImageIndex = signal<number | null>(null);
  selectedImage = signal<any | null>(null);

  // Scroll position preservation
  private scrollPosition = 0;
  private overlayElement: HTMLElement | null = null;
  private overlayStylesElement: HTMLStyleElement | null = null;

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
      if (this.logger) {
        this.logger.warn('GallerySection: No image URL found for item', {
          item: item.title || item,
        });
      } else {
        console.warn('GallerySection: No image URL found for item:', item.title || item);
      }
      return this.generatePlaceholderUrl(item);
    }

    // If this image has failed before, return placeholder
    if (this.failedImages.has(imageUrl)) {
      if (this.logger) {
        this.logger.debug('GallerySection: Using placeholder for previously failed image', {
          imageUrl,
          item: item.title || item,
        });
      } else {
        console.debug('GallerySection: Using placeholder for previously failed image:', imageUrl);
      }
      return this.generatePlaceholderUrl(item);
    }

    // Log successful URL extraction for debugging (with deduplication via LoggerService)
    if (this.logger) {
      this.logger.debug('GallerySection: Loading image from URL', {
        imageUrl,
        item: item.title || item,
      });
    } else {
      console.debug(
        'GallerySection: Loading image from URL:',
        imageUrl,
        'for item:',
        item.title || item
      );
    }

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

    // Log the error for debugging (errors are not deduplicated, but use LoggerService for consistency)
    if (this.logger) {
      this.logger.error('GallerySection: Failed to load image', {
        originalUrl,
        item: item.title || item,
      });
    } else {
      console.error(
        'GallerySection: Failed to load image:',
        originalUrl,
        'for item:',
        item.title || item
      );
    }

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
      // Log with deduplication via LoggerService
      if (this.logger) {
        this.logger.debug('GallerySection: Successfully loaded image', {
          url,
          item: item.title || item,
        });
      } else {
        console.debug(
          'GallerySection: Successfully loaded image:',
          url,
          'for item:',
          item.title || item
        );
      }
    }
  }

  /**
   * Handle image click - opens overlay modal
   */
  onImageClick(item: any, index: number, event?: Event): void {
    // Prevent default behavior that might cause scrolling
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Lock body scroll while preserving position
    this.lockBodyScroll();

    // Open overlay
    this.selectedImageIndex.set(index);
    this.selectedImage.set(item);

    // Create overlay at document body level to break out of Shadow DOM
    this.createOverlayAtBodyLevel();
  }

  /**
   * Close the overlay
   */
  closeOverlay(): void {
    this.selectedImageIndex.set(null);
    this.selectedImage.set(null);

    // Remove overlay from document body
    this.removeOverlayFromBody();

    // Unlock body scroll and restore position
    this.unlockBodyScroll();
  }

  /**
   * Create overlay at document body level to ensure it's on top
   */
  private createOverlayAtBodyLevel(): void {
    // Wait for next tick to ensure signals are updated
    setTimeout(() => {
      if (this.selectedImageIndex() === null || !this.selectedImage()) {
        return;
      }

      // Remove existing overlay if any
      this.removeOverlayFromBody();

      // Inject styles for overlay if not already present
      this.injectOverlayStyles();

      // Create overlay element
      const overlay = this.renderer.createElement('div');
      this.renderer.addClass(overlay, 'gallery-overlay');
      this.renderer.setStyle(overlay, 'position', 'fixed');
      this.renderer.setStyle(overlay, 'top', '0');
      this.renderer.setStyle(overlay, 'left', '0');
      this.renderer.setStyle(overlay, 'right', '0');
      this.renderer.setStyle(overlay, 'bottom', '0');
      this.renderer.setStyle(overlay, 'background', 'rgba(0, 0, 0, 0.95)');
      this.renderer.setStyle(overlay, 'z-index', '999999');
      this.renderer.setStyle(overlay, 'display', 'flex');
      this.renderer.setStyle(overlay, 'align-items', 'center');
      this.renderer.setStyle(overlay, 'justify-content', 'center');
      this.renderer.setStyle(overlay, 'padding', '2rem');
      this.renderer.setStyle(overlay, 'cursor', 'zoom-out');
      this.renderer.setStyle(overlay, 'backdrop-filter', 'blur(4px)');
      this.renderer.setAttribute(overlay, 'role', 'dialog');
      this.renderer.setAttribute(overlay, 'aria-modal', 'true');
      this.renderer.setAttribute(
        overlay,
        'aria-label',
        this.getCaption(this.selectedImage()!) || 'Image viewer'
      );

      // Close button
      const closeBtn = this.renderer.createElement('button');
      this.renderer.addClass(closeBtn, 'gallery-overlay-close');
      this.renderer.setStyle(closeBtn, 'position', 'absolute');
      this.renderer.setStyle(closeBtn, 'top', '1.5rem');
      this.renderer.setStyle(closeBtn, 'right', '1.5rem');
      this.renderer.setStyle(closeBtn, 'padding', '0.75rem');
      this.renderer.setStyle(closeBtn, 'color', 'white');
      this.renderer.setStyle(closeBtn, 'background', 'rgba(255, 255, 255, 0.1)');
      this.renderer.setStyle(closeBtn, 'border', 'none');
      this.renderer.setStyle(closeBtn, 'border-radius', '50%');
      this.renderer.setStyle(closeBtn, 'cursor', 'pointer');
      this.renderer.setStyle(closeBtn, 'z-index', '1000000');
      this.renderer.setStyle(closeBtn, 'width', '44px');
      this.renderer.setStyle(closeBtn, 'height', '44px');
      this.renderer.setStyle(closeBtn, 'display', 'flex');
      this.renderer.setStyle(closeBtn, 'align-items', 'center');
      this.renderer.setStyle(closeBtn, 'justify-content', 'center');
      this.renderer.setAttribute(closeBtn, 'aria-label', 'Close image viewer');
      this.renderer.listen(closeBtn, 'click', (e: Event) => {
        e.stopPropagation();
        this.closeOverlay();
      });

      // Close button SVG
      const closeSvg = this.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.renderer.setAttribute(closeSvg, 'width', '24');
      this.renderer.setAttribute(closeSvg, 'height', '24');
      this.renderer.setAttribute(closeSvg, 'viewBox', '0 0 24 24');
      this.renderer.setAttribute(closeSvg, 'fill', 'none');
      this.renderer.setAttribute(closeSvg, 'stroke', 'currentColor');
      this.renderer.setAttribute(closeSvg, 'stroke-width', '2');
      const line1 = this.document.createElementNS('http://www.w3.org/2000/svg', 'line');
      this.renderer.setAttribute(line1, 'x1', '18');
      this.renderer.setAttribute(line1, 'y1', '6');
      this.renderer.setAttribute(line1, 'x2', '6');
      this.renderer.setAttribute(line1, 'y2', '18');
      const line2 = this.document.createElementNS('http://www.w3.org/2000/svg', 'line');
      this.renderer.setAttribute(line2, 'x1', '6');
      this.renderer.setAttribute(line2, 'y1', '6');
      this.renderer.setAttribute(line2, 'x2', '18');
      this.renderer.setAttribute(line2, 'y2', '18');
      this.renderer.appendChild(closeSvg, line1);
      this.renderer.appendChild(closeSvg, line2);
      this.renderer.appendChild(closeBtn, closeSvg);
      this.renderer.appendChild(overlay, closeBtn);

      // Navigation buttons
      if (this.hasPreviousImage()) {
        const prevBtn = this.renderer.createElement('button');
        this.renderer.addClass(prevBtn, 'gallery-overlay-nav');
        this.renderer.setStyle(prevBtn, 'position', 'absolute');
        this.renderer.setStyle(prevBtn, 'top', '50%');
        this.renderer.setStyle(prevBtn, 'left', '1.5rem');
        this.renderer.setStyle(prevBtn, 'transform', 'translateY(-50%)');
        this.renderer.setStyle(prevBtn, 'padding', '1rem');
        this.renderer.setStyle(prevBtn, 'color', 'white');
        this.renderer.setStyle(prevBtn, 'background', 'rgba(255, 255, 255, 0.1)');
        this.renderer.setStyle(prevBtn, 'border', 'none');
        this.renderer.setStyle(prevBtn, 'border-radius', '50%');
        this.renderer.setStyle(prevBtn, 'cursor', 'pointer');
        this.renderer.setStyle(prevBtn, 'z-index', '1000000');
        this.renderer.setStyle(prevBtn, 'width', '48px');
        this.renderer.setStyle(prevBtn, 'height', '48px');
        this.renderer.setStyle(prevBtn, 'display', 'flex');
        this.renderer.setStyle(prevBtn, 'align-items', 'center');
        this.renderer.setStyle(prevBtn, 'justify-content', 'center');
        this.renderer.setAttribute(prevBtn, 'aria-label', 'Previous image');
        this.renderer.listen(prevBtn, 'click', (e: Event) => {
          e.stopPropagation();
          this.previousImage();
          this.createOverlayAtBodyLevel(); // Recreate with new image
        });

        const prevSvg = this.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.renderer.setAttribute(prevSvg, 'width', '24');
        this.renderer.setAttribute(prevSvg, 'height', '24');
        this.renderer.setAttribute(prevSvg, 'viewBox', '0 0 24 24');
        this.renderer.setAttribute(prevSvg, 'fill', 'none');
        this.renderer.setAttribute(prevSvg, 'stroke', 'currentColor');
        this.renderer.setAttribute(prevSvg, 'stroke-width', '2');
        const prevPolyline = this.document.createElementNS(
          'http://www.w3.org/2000/svg',
          'polyline'
        );
        this.renderer.setAttribute(prevPolyline, 'points', '15 18 9 12 15 6');
        this.renderer.appendChild(prevSvg, prevPolyline);
        this.renderer.appendChild(prevBtn, prevSvg);
        this.renderer.appendChild(overlay, prevBtn);
      }

      if (this.hasNextImage()) {
        const nextBtn = this.renderer.createElement('button');
        this.renderer.addClass(nextBtn, 'gallery-overlay-nav');
        this.renderer.setStyle(nextBtn, 'position', 'absolute');
        this.renderer.setStyle(nextBtn, 'top', '50%');
        this.renderer.setStyle(nextBtn, 'right', '1.5rem');
        this.renderer.setStyle(nextBtn, 'transform', 'translateY(-50%)');
        this.renderer.setStyle(nextBtn, 'padding', '1rem');
        this.renderer.setStyle(nextBtn, 'color', 'white');
        this.renderer.setStyle(nextBtn, 'background', 'rgba(255, 255, 255, 0.1)');
        this.renderer.setStyle(nextBtn, 'border', 'none');
        this.renderer.setStyle(nextBtn, 'border-radius', '50%');
        this.renderer.setStyle(nextBtn, 'cursor', 'pointer');
        this.renderer.setStyle(nextBtn, 'z-index', '1000000');
        this.renderer.setStyle(nextBtn, 'width', '48px');
        this.renderer.setStyle(nextBtn, 'height', '48px');
        this.renderer.setStyle(nextBtn, 'display', 'flex');
        this.renderer.setStyle(nextBtn, 'align-items', 'center');
        this.renderer.setStyle(nextBtn, 'justify-content', 'center');
        this.renderer.setAttribute(nextBtn, 'aria-label', 'Next image');
        this.renderer.listen(nextBtn, 'click', (e: Event) => {
          e.stopPropagation();
          this.nextImage();
          this.createOverlayAtBodyLevel(); // Recreate with new image
        });

        const nextSvg = this.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.renderer.setAttribute(nextSvg, 'width', '24');
        this.renderer.setAttribute(nextSvg, 'height', '24');
        this.renderer.setAttribute(nextSvg, 'viewBox', '0 0 24 24');
        this.renderer.setAttribute(nextSvg, 'fill', 'none');
        this.renderer.setAttribute(nextSvg, 'stroke', 'currentColor');
        this.renderer.setAttribute(nextSvg, 'stroke-width', '2');
        const nextPolyline = this.document.createElementNS(
          'http://www.w3.org/2000/svg',
          'polyline'
        );
        this.renderer.setAttribute(nextPolyline, 'points', '9 18 15 12 9 6');
        this.renderer.appendChild(nextSvg, nextPolyline);
        this.renderer.appendChild(nextBtn, nextSvg);
        this.renderer.appendChild(overlay, nextBtn);
      }

      // Content container
      const content = this.renderer.createElement('div');
      this.renderer.addClass(content, 'gallery-overlay-content');
      this.renderer.setStyle(content, 'position', 'relative');
      this.renderer.setStyle(content, 'display', 'flex');
      this.renderer.setStyle(content, 'flex-direction', 'column');
      this.renderer.setStyle(content, 'align-items', 'center');
      this.renderer.setStyle(content, 'justify-content', 'center');
      this.renderer.setStyle(content, 'width', '100%');
      this.renderer.setStyle(content, 'max-width', '90vw');
      this.renderer.setStyle(content, 'max-height', '90vh');
      this.renderer.setStyle(content, 'box-sizing', 'border-box');
      this.renderer.listen(content, 'click', (e: Event) => {
        e.stopPropagation();
      });

      // Image
      const img = this.renderer.createElement('img');
      this.renderer.setAttribute(img, 'src', this.getImageUrl(this.selectedImage()!));
      this.renderer.setAttribute(img, 'alt', this.getAltText(this.selectedImage()!));
      this.renderer.addClass(img, 'gallery-overlay-image');
      this.renderer.setStyle(img, 'max-width', '100%');
      this.renderer.setStyle(img, 'max-height', 'calc(90vh - 120px)');
      this.renderer.setStyle(img, 'width', 'auto');
      this.renderer.setStyle(img, 'height', 'auto');
      this.renderer.setStyle(img, 'object-fit', 'contain');
      this.renderer.setStyle(img, 'border-radius', '8px');
      this.renderer.setStyle(img, 'box-shadow', '0 8px 32px rgba(0, 0, 0, 0.5)');
      this.renderer.setStyle(img, 'display', 'block');
      this.renderer.appendChild(content, img);

      // Caption
      if (this.getCaption(this.selectedImage()!)) {
        const caption = this.renderer.createElement('div');
        this.renderer.addClass(caption, 'gallery-overlay-caption');
        this.renderer.setStyle(caption, 'position', 'relative');
        this.renderer.setStyle(caption, 'margin-top', '1rem');
        this.renderer.setStyle(caption, 'padding', '1rem 1.5rem');
        this.renderer.setStyle(caption, 'background', 'rgba(0, 0, 0, 0.7)');
        this.renderer.setStyle(caption, 'border-radius', '8px');
        this.renderer.setStyle(caption, 'display', 'flex');
        this.renderer.setStyle(caption, 'align-items', 'center');
        this.renderer.setStyle(caption, 'justify-content', 'space-between');
        this.renderer.setStyle(caption, 'gap', '1rem');
        this.renderer.setStyle(caption, 'width', '100%');
        this.renderer.setStyle(caption, 'box-sizing', 'border-box');
        this.renderer.setStyle(caption, 'backdrop-filter', 'blur(8px)');

        const captionText = this.renderer.createElement('span');
        this.renderer.addClass(captionText, 'gallery-overlay-caption-text');
        this.renderer.setStyle(captionText, 'color', '#ffffff');
        this.renderer.setStyle(captionText, 'font-weight', '500');
        this.renderer.setStyle(captionText, 'text-shadow', '0 1px 3px rgba(0, 0, 0, 0.5)');
        this.renderer.setStyle(captionText, 'flex', '1');
        this.renderer.setProperty(
          captionText,
          'textContent',
          this.getCaption(this.selectedImage()!)
        );
        this.renderer.appendChild(caption, captionText);

        if (this.section.items && this.section.items.length > 1) {
          const counter = this.renderer.createElement('span');
          this.renderer.addClass(counter, 'gallery-overlay-caption-counter');
          this.renderer.setStyle(counter, 'color', 'rgba(255, 255, 255, 0.8)');
          this.renderer.setStyle(counter, 'font-weight', '400');
          this.renderer.setStyle(counter, 'text-shadow', '0 1px 2px rgba(0, 0, 0, 0.5)');
          this.renderer.setStyle(counter, 'white-space', 'nowrap');
          this.renderer.setProperty(
            counter,
            'textContent',
            `${this.selectedImageIndex()! + 1} / ${this.section.items.length}`
          );
          this.renderer.appendChild(caption, counter);
        }

        this.renderer.appendChild(content, caption);
      }

      this.renderer.appendChild(overlay, content);
      this.renderer.listen(overlay, 'click', () => this.closeOverlay());
      this.renderer.appendChild(this.document.body, overlay);
      this.overlayElement = overlay;
    }, 0);
  }

  /**
   * Inject styles for the body-level overlay
   */
  private injectOverlayStyles(): void {
    if (this.overlayStylesElement) {
      return; // Styles already injected
    }

    const style = this.renderer.createElement('style');
    this.renderer.setAttribute(style, 'type', 'text/css');
    this.renderer.setProperty(
      style,
      'textContent',
      `
      .gallery-overlay-close:hover {
        background: rgba(255, 255, 255, 0.2) !important;
      }
      .gallery-overlay-close:active {
        background: rgba(255, 255, 255, 0.15) !important;
      }
      .gallery-overlay-nav:hover {
        background: rgba(255, 255, 255, 0.2) !important;
      }
      .gallery-overlay-nav:active {
        background: rgba(255, 255, 255, 0.15) !important;
      }
      @media (max-width: 640px) {
        .gallery-overlay {
          padding: 1rem !important;
        }
        .gallery-overlay-close {
          top: 1rem !important;
          right: 1rem !important;
          width: 40px !important;
          height: 40px !important;
          padding: 0.5rem !important;
        }
        .gallery-overlay-nav {
          width: 40px !important;
          height: 40px !important;
          padding: 0.75rem !important;
        }
        .gallery-overlay-nav--prev {
          left: 0.5rem !important;
        }
        .gallery-overlay-nav--next {
          right: 0.5rem !important;
        }
        .gallery-overlay-content {
          max-width: 95vw !important;
        }
        .gallery-overlay-image {
          max-height: calc(90vh - 100px) !important;
        }
        .gallery-overlay-caption {
          padding: 0.875rem 1rem !important;
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 0.5rem !important;
        }
      }
    `
    );
    this.renderer.appendChild(this.document.head, style);
    this.overlayStylesElement = style;
  }

  /**
   * Remove overlay from document body
   */
  private removeOverlayFromBody(): void {
    if (this.overlayElement && this.overlayElement.parentNode) {
      this.renderer.removeChild(this.document.body, this.overlayElement);
      this.overlayElement = null;
    }

    // Remove styles if overlay is closed and no other instances exist
    // (In a real app, you might want to check for other instances)
    if (this.overlayStylesElement && this.overlayStylesElement.parentNode) {
      // Keep styles for potential future use, or remove if desired
      // this.renderer.removeChild(this.document.head, this.overlayStylesElement);
      // this.overlayStylesElement = null;
    }
  }

  /**
   * Lock body scroll while preserving current scroll position
   */
  private lockBodyScroll(): void {
    const body = this.document.body;
    const html = this.document.documentElement;

    // Get current scroll position
    this.scrollPosition = window.pageYOffset || html.scrollTop || body.scrollTop || 0;

    // Get scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - html.clientWidth;

    // Lock scroll by fixing body position
    body.style.position = 'fixed';
    body.style.top = `-${this.scrollPosition}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.overflow = 'hidden';

    // Compensate for scrollbar to prevent layout shift
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  /**
   * Unlock body scroll and restore scroll position
   */
  private unlockBodyScroll(): void {
    const body = this.document.body;

    // Remove scroll lock styles
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.overflow = '';
    body.style.paddingRight = '';

    // Restore scroll position
    window.scrollTo(0, this.scrollPosition);
  }

  /**
   * Navigate to previous image
   */
  previousImage(): void {
    const currentIndex = this.selectedImageIndex();
    if (currentIndex !== null && currentIndex > 0 && this.section.items) {
      const newIndex = currentIndex - 1;
      this.selectedImageIndex.set(newIndex);
      this.selectedImage.set(this.section.items[newIndex]);
    }
  }

  /**
   * Navigate to next image
   */
  nextImage(): void {
    const currentIndex = this.selectedImageIndex();
    if (
      currentIndex !== null &&
      this.section.items &&
      currentIndex < this.section.items.length - 1
    ) {
      const newIndex = currentIndex + 1;
      this.selectedImageIndex.set(newIndex);
      this.selectedImage.set(this.section.items[newIndex]);
    }
  }

  /**
   * Handle keyboard navigation
   */
  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (this.selectedImageIndex() === null) {
      return; // Overlay is not open, ignore keys
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.closeOverlay();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.previousImage();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.nextImage();
        break;
    }
  }

  /**
   * Check if previous image is available
   */
  hasPreviousImage(): boolean {
    const currentIndex = this.selectedImageIndex();
    return currentIndex !== null && currentIndex > 0;
  }

  /**
   * Check if next image is available
   */
  hasNextImage(): boolean {
    const currentIndex = this.selectedImageIndex();
    return (
      currentIndex !== null &&
      this.section.items !== undefined &&
      currentIndex < this.section.items.length - 1
    );
  }

  ngOnDestroy(): void {
    // Remove overlay if still open
    this.removeOverlayFromBody();

    // Remove styles
    if (this.overlayStylesElement && this.overlayStylesElement.parentNode) {
      this.renderer.removeChild(this.document.head, this.overlayStylesElement);
      this.overlayStylesElement = null;
    }

    // Ensure body scroll is restored when component is destroyed
    if (this.selectedImageIndex() !== null) {
      this.unlockBodyScroll();
    }
  }
}
