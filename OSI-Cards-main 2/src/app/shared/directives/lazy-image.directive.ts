import { Directive, ElementRef, Input, OnInit, OnDestroy, inject, Renderer2 } from '@angular/core';

/**
 * Lazy loading directive for images
 * Uses Intersection Observer API for efficient image loading
 */
@Directive({
  selector: 'img[appLazyImage]',
  standalone: true
})
export class LazyImageDirective implements OnInit, OnDestroy {
  @Input() appLazyImage?: string;
  @Input() fallback?: string;
  @Input() threshold = 0.1;

  private readonly el = inject(ElementRef<HTMLImageElement>);
  private readonly renderer = inject(Renderer2);
  private observer?: IntersectionObserver;
  private loaded = false;

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
    if (this.loaded) {
      return;
    }

    const img = this.el.nativeElement;
    const src = this.appLazyImage || img.src;

    if (!src) {
      return;
    }

    // Set loading state
    this.renderer.addClass(img, 'lazy-loading');

    // Create new image to preload
    const imageLoader = new Image();
    
    imageLoader.onload = () => {
      this.renderer.setAttribute(img, 'src', src);
      this.renderer.removeClass(img, 'lazy-loading');
      this.renderer.addClass(img, 'lazy-loaded');
      this.loaded = true;
    };

    imageLoader.onerror = () => {
      if (this.fallback) {
        this.renderer.setAttribute(img, 'src', this.fallback);
      }
      this.renderer.removeClass(img, 'lazy-loading');
      this.renderer.addClass(img, 'lazy-error');
    };

    imageLoader.src = src;
  }
}

