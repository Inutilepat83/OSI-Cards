import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
  Renderer2,
  HostBinding,
} from '@angular/core';
import {
  ImageOptimizationService,
  ImageConfig,
  OptimizedImage,
} from '../../core/services/image-optimization.service';
import { Subscription } from 'rxjs';
import { LoggingService } from '../../core/services/logging.service';

@Directive({
  selector: 'img[appLazyImage]',
})
export class LazyImageDirective implements OnInit, OnDestroy {
  @Input() appLazyImage!: ImageConfig;
  @Input() rootMargin: string = '50px';
  @Input() threshold: number = 0.1;

  @HostBinding('class.loading') isLoading = true;
  @HostBinding('class.loaded') isLoaded = false;

  private observer?: IntersectionObserver;
  private subscription?: Subscription;
  private imgElement: HTMLImageElement;

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private renderer: Renderer2,
    private imageService: ImageOptimizationService,
    private logger: LoggingService
  ) {
    this.imgElement = this.el.nativeElement;
  }

  ngOnInit(): void {
    if (!this.appLazyImage) {
      this.logger.warn('LazyImageDirective', 'No image configuration provided');
      return;
    }

    // Set placeholder initially
    this.setPlaceholder();

    // Create intersection observer for lazy loading
    this.createIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.subscription?.unsubscribe();
  }

  private createIntersectionObserver(): void {
    this.observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage();
            this.observer?.disconnect();
          }
        });
      },
      {
        rootMargin: this.rootMargin,
        threshold: this.threshold,
      }
    );

    this.observer.observe(this.imgElement);
  }

  private loadImage(): void {
    this.subscription = this.imageService
      .optimizeImage(this.appLazyImage)
      .subscribe((optimized: OptimizedImage) => {
        this.setOptimizedImage(optimized);
      });
  }

  private setPlaceholder(): void {
    const placeholder = this.imageService.generatePlaceholder();
    this.renderer.setAttribute(this.imgElement, 'src', placeholder);
    this.renderer.setAttribute(this.imgElement, 'alt', this.appLazyImage.alt || '');
  }

  private setOptimizedImage(optimized: OptimizedImage): void {
    // Set srcSet for responsive images
    if (optimized.srcSet) {
      this.renderer.setAttribute(this.imgElement, 'srcset', optimized.srcSet);
    }

    // Set main src
    this.renderer.setAttribute(this.imgElement, 'src', optimized.src);

    // Set alt text
    this.renderer.setAttribute(this.imgElement, 'alt', this.appLazyImage.alt);

    // Handle loading states
    this.imgElement.onload = () => {
      this.isLoading = false;
      this.isLoaded = true;
    };

    this.imgElement.onerror = () => {
      this.logger.error('LazyImageDirective', 'Failed to load image', optimized.src);
      this.isLoading = false;
    };
  }
}
