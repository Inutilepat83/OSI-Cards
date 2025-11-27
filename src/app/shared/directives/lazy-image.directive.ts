import { Directive, ElementRef, Input, OnInit, OnDestroy, inject, Renderer2 } from '@angular/core';
import { LoggingService } from '../../core/services/logging.service';

/**
 * Lazy loading directive for images
 * 
 * Uses Intersection Observer API for efficient image loading with:
 * - Progressive loading support
 * - Enhanced error handling with retry logic
 * - Loading state management
 * - Fallback image support
 * 
 * @example
 * ```html
 * <img appLazyImage="image.jpg" fallback="placeholder.jpg" [threshold]="0.2" />
 * ```
 */
@Directive({
  selector: 'img[appLazyImage]',
  standalone: true
})
export class LazyImageDirective implements OnInit, OnDestroy {
  @Input() appLazyImage?: string;
  @Input() fallback?: string;
  @Input() threshold = 0.1;
  @Input() retryAttempts = 2;
  @Input() retryDelay = 1000;
  @Input() enableWebP = true;
  @Input() enableProgressive = true;

  private readonly el = inject(ElementRef<HTMLImageElement>);
  private readonly renderer = inject(Renderer2);
  private readonly logger = inject(LoggingService);
  private observer?: IntersectionObserver;
  private loaded = false;
  private loading = false;
  private retryCount = 0;

  ngOnInit(): void {
    // If browser doesn't support IntersectionObserver, load immediately
    if (typeof IntersectionObserver === 'undefined') {
      this.loadImage();
      return;
    }

    // If image is already in viewport, load immediately
    if (this.isInViewport()) {
      this.loadImage();
      return;
    }

    // Create intersection observer
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.loaded) {
            this.loadImage();
            this.observer?.unobserve(this.el.nativeElement);
          }
        });
      },
      {
        threshold: this.threshold,
        rootMargin: '50px' // Start loading 50px before entering viewport
      }
    );

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private isInViewport(): boolean {
    const rect = this.el.nativeElement.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  private loadImage(): void {
    if (this.loaded || this.loading) {
      return;
    }

    const img = this.el.nativeElement;
    let src = this.appLazyImage || img.src;

    if (!src) {
      this.logger.warn('LazyImageDirective: No image source provided', 'LazyImageDirective');
      return;
    }

    // Try WebP format if supported and enabled
    if (this.enableWebP && this.supportsWebP()) {
      const webpSrc = this.getWebPSource(src);
      if (webpSrc) {
        src = webpSrc;
      }
    }

    this.loading = true;

    // Set loading state
    this.renderer.addClass(img, 'lazy-loading');
    this.renderer.setAttribute(img, 'loading', 'lazy');

    // Progressive loading: load low-quality placeholder first if enabled
    if (this.enableProgressive) {
      const placeholderSrc = this.getPlaceholderSource(src);
      if (placeholderSrc) {
        this.renderer.setAttribute(img, 'src', placeholderSrc);
      }
    }

    // Create new image to preload
    const imageLoader = new Image();
    
    imageLoader.onload = () => {
      this.renderer.setAttribute(img, 'src', src);
      this.renderer.removeClass(img, 'lazy-loading');
      this.renderer.addClass(img, 'lazy-loaded');
      this.loaded = true;
      this.loading = false;
      this.retryCount = 0;
      this.logger.debug(`LazyImageDirective: Image loaded successfully: ${src}`, 'LazyImageDirective');
    };

    imageLoader.onerror = () => {
      this.loading = false;
      this.logger.warn(`LazyImageDirective: Failed to load image: ${src}`, 'LazyImageDirective');
      
      // Retry logic
      if (this.retryCount < this.retryAttempts) {
        this.retryCount++;
        this.logger.debug(`LazyImageDirective: Retrying image load (attempt ${this.retryCount}/${this.retryAttempts})`, 'LazyImageDirective');
        setTimeout(() => {
          this.loadImage();
        }, this.retryDelay);
        return;
      }

      // Use fallback if available
      if (this.fallback) {
        this.logger.debug(`LazyImageDirective: Using fallback image: ${this.fallback}`, 'LazyImageDirective');
        this.renderer.setAttribute(img, 'src', this.fallback);
        this.renderer.removeClass(img, 'lazy-loading');
        this.renderer.addClass(img, 'lazy-loaded');
        this.loaded = true;
      } else {
        this.renderer.removeClass(img, 'lazy-loading');
        this.renderer.addClass(img, 'lazy-error');
        this.renderer.setAttribute(img, 'alt', 'Image failed to load');
      }
    };

    // Set src to start loading
    imageLoader.src = src;
  }

  /**
   * Check if browser supports WebP format
   */
  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * Get WebP version of image source if available
   */
  private getWebPSource(src: string): string | null {
    // Check if source already has an extension
    const lastDot = src.lastIndexOf('.');
    if (lastDot === -1) {
      return null;
    }

    const extension = src.substring(lastDot + 1).toLowerCase();
    if (extension === 'webp') {
      return null; // Already WebP
    }

    // Try to find WebP version
    const basePath = src.substring(0, lastDot);
    return `${basePath}.webp`;
  }

  /**
   * Get placeholder source for progressive loading
   * Returns a low-quality version if available (e.g., image.jpg?w=20)
   */
  private getPlaceholderSource(src: string): string | null {
    // For progressive loading, we can use a query parameter approach
    // or a separate low-quality image
    // This is a simple implementation - can be enhanced with actual image processing
    if (src.includes('?')) {
      return null; // Already has query params
    }
    // Return null to skip placeholder for now
    // Can be enhanced to use actual low-quality images
    return null;
  }
}

