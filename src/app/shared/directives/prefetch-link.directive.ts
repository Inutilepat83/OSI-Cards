import { 
  Directive, 
  Input, 
  HostListener, 
  inject, 
  OnDestroy,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { Router } from '@angular/router';
import { DocsPreloadingStrategy } from '../../core/strategies/docs-preloading.strategy';

/**
 * Prefetch Link Directive
 * 
 * Prefetches route chunks when hovering over navigation links.
 * Uses multiple triggers for optimal prefetching:
 * - Mouse hover (desktop)
 * - Touch start (mobile)
 * - Focus (keyboard navigation)
 * - Intersection Observer (visible links)
 * 
 * @example
 * ```html
 * <a routerLink="/docs/getting-started" appPrefetchLink>Getting Started</a>
 * 
 * <!-- With custom route -->
 * <a [appPrefetchLink]="'/docs/custom-path'">Custom</a>
 * 
 * <!-- Disable prefetching -->
 * <a routerLink="/docs/page" [prefetchDisabled]="true" appPrefetchLink>No Prefetch</a>
 * ```
 */
@Directive({
  selector: '[appPrefetchLink]',
  standalone: true
})
export class PrefetchLinkDirective implements AfterViewInit, OnDestroy {
  /**
   * Override the route to prefetch (defaults to routerLink value)
   */
  @Input('appPrefetchLink') prefetchRoute?: string;
  
  /**
   * Disable prefetching for this link
   */
  @Input() prefetchDisabled = false;
  
  /**
   * Enable intersection-based prefetching (prefetch when visible)
   */
  @Input() prefetchOnVisible = false;
  
  /**
   * Delay before triggering prefetch (ms)
   */
  @Input() prefetchDelay = 50;

  private router = inject(Router);
  private preloadStrategy = inject(DocsPreloadingStrategy);
  private el = inject(ElementRef);
  
  private hoverTimeout: ReturnType<typeof setTimeout> | null = null;
  private observer: IntersectionObserver | null = null;
  private hasPrefetched = false;

  ngAfterViewInit(): void {
    if (this.prefetchOnVisible && !this.prefetchDisabled) {
      this.setupIntersectionObserver();
    }
  }

  ngOnDestroy(): void {
    this.clearTimeout();
    this.destroyObserver();
  }

  /**
   * Prefetch on mouse enter (desktop)
   */
  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.schedulePrefetch();
  }

  /**
   * Cancel prefetch on mouse leave
   */
  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.clearTimeout();
  }

  /**
   * Prefetch on touch start (mobile)
   */
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    // Only prefetch, don't prevent navigation
    this.triggerPrefetch();
  }

  /**
   * Prefetch on focus (keyboard navigation)
   */
  @HostListener('focus')
  onFocus(): void {
    this.schedulePrefetch();
  }

  /**
   * Cancel prefetch on blur
   */
  @HostListener('blur')
  onBlur(): void {
    this.clearTimeout();
  }

  private schedulePrefetch(): void {
    if (this.prefetchDisabled || this.hasPrefetched) {
      return;
    }

    this.clearTimeout();
    
    this.hoverTimeout = setTimeout(() => {
      this.triggerPrefetch();
    }, this.prefetchDelay);
  }

  private triggerPrefetch(): void {
    if (this.prefetchDisabled || this.hasPrefetched) {
      return;
    }

    const route = this.getRouteToPreload();
    if (!route) {
      return;
    }

    // Check if already preloaded
    if (this.preloadStrategy.isPreloaded(route)) {
      this.hasPrefetched = true;
      return;
    }

    // Trigger preload
    this.preloadStrategy.preloadRoute(route);
    this.hasPrefetched = true;

    // Also add prefetch link hint to head
    this.addPrefetchHint(route);
  }

  private getRouteToPreload(): string | null {
    // Use explicit prefetch route if provided
    if (this.prefetchRoute) {
      return this.normalizePath(this.prefetchRoute);
    }

    // Try to get routerLink value from element
    const element = this.el.nativeElement as HTMLElement;
    
    // Check for href attribute
    const href = element.getAttribute('href');
    if (href && href.startsWith('/')) {
      return this.normalizePath(href);
    }

    // Check for routerLink attribute
    const routerLink = element.getAttribute('routerLink');
    if (routerLink) {
      return this.normalizePath(routerLink);
    }

    return null;
  }

  private normalizePath(path: string): string {
    // Remove leading slash and hash
    let normalized = path.replace(/^\//, '').replace(/#.*$/, '');
    
    // Remove query parameters
    normalized = normalized.split('?')[0] || normalized;
    
    return normalized;
  }

  private addPrefetchHint(route: string): void {
    // Create prefetch link for the route's chunk
    // This helps browsers prefetch the JS chunk
    if (typeof document === 'undefined') return;

    const existing = document.querySelector(`link[data-prefetch="${route}"]`);
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'script';
    link.setAttribute('data-prefetch', route);
    
    // The actual chunk URL will be resolved by the browser
    // This is a hint that we want to prefetch this route's resources
    document.head.appendChild(link);
  }

  private setupIntersectionObserver(): void {
    if (typeof IntersectionObserver === 'undefined') return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.triggerPrefetch();
            this.destroyObserver();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0
      }
    );

    this.observer.observe(this.el.nativeElement);
  }

  private destroyObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  private clearTimeout(): void {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
  }
}

/**
 * Prefetch Container Directive
 * 
 * Automatically applies prefetching to all links within a container.
 * Useful for navigation menus with many links.
 * 
 * @example
 * ```html
 * <nav appPrefetchContainer>
 *   <a routerLink="/docs/page1">Page 1</a>
 *   <a routerLink="/docs/page2">Page 2</a>
 *   <a routerLink="/docs/page3">Page 3</a>
 * </nav>
 * ```
 */
@Directive({
  selector: '[appPrefetchContainer]',
  standalone: true
})
export class PrefetchContainerDirective implements AfterViewInit, OnDestroy {
  /**
   * CSS selector for links to prefetch (defaults to 'a[routerLink]')
   */
  @Input() prefetchSelector = 'a[routerLink]';
  
  /**
   * Disable prefetching for this container
   */
  @Input() prefetchContainerDisabled = false;

  private el = inject(ElementRef);
  private preloadStrategy = inject(DocsPreloadingStrategy);
  
  private observer: IntersectionObserver | null = null;
  private prefetchedLinks = new Set<string>();

  ngAfterViewInit(): void {
    if (this.prefetchContainerDisabled) return;
    
    this.setupObserver();
  }

  ngOnDestroy(): void {
    this.destroyObserver();
  }

  private setupObserver(): void {
    if (typeof IntersectionObserver === 'undefined') return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            this.prefetchLink(link);
          }
        });
      },
      {
        rootMargin: '100px',
        threshold: 0
      }
    );

    // Observe all matching links
    const links = this.el.nativeElement.querySelectorAll(this.prefetchSelector);
    links.forEach((link: Element) => {
      this.observer?.observe(link);
    });
  }

  private prefetchLink(link: HTMLAnchorElement): void {
    const href = link.getAttribute('href') || link.getAttribute('routerLink');
    if (!href || this.prefetchedLinks.has(href)) return;

    // Normalize path
    const path = href.replace(/^\//, '').replace(/#.*$/, '').split('?')[0] || '';
    
    // Only prefetch docs routes
    if (!path.startsWith('docs')) return;

    // Check if already preloaded
    if (this.preloadStrategy.isPreloaded(path)) {
      this.prefetchedLinks.add(href);
      return;
    }

    // Trigger preload
    this.preloadStrategy.preloadRoute(path);
    this.prefetchedLinks.add(href);
  }

  private destroyObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

