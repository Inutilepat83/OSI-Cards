/**
 * Lazy Render Directive
 *
 * Uses IntersectionObserver to lazily render content only when visible.
 * Improves performance by deferring off-screen content rendering.
 *
 * @example
 * ```html
 * <!-- Basic usage -->
 * <div *appLazyRender>
 *   Heavy content here
 * </div>
 *
 * <!-- With placeholder -->
 * <div *appLazyRender="{ placeholder: loadingTemplate }">
 *   Heavy content here
 * </div>
 *
 * <!-- With options -->
 * <div *appLazyRender="{ rootMargin: '100px', threshold: 0.1 }">
 *   Heavy content here
 * </div>
 * ```
 *
 * @see WCAG 2.1 - Lazy loading should not break accessibility
 */

import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  OnInit,
  OnDestroy,
  inject,
  PLATFORM_ID,
  NgZone,
  EmbeddedViewRef,
  ChangeDetectorRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Configuration options for lazy rendering
 */
export interface LazyRenderOptions {
  /** CSS margin around the root element */
  rootMargin?: string;
  /** Visibility threshold (0-1) */
  threshold?: number | number[];
  /** Template to show while loading */
  placeholder?: TemplateRef<unknown>;
  /** Keep content rendered after first visibility */
  persistent?: boolean;
  /** Disable lazy rendering (render immediately) */
  disabled?: boolean;
  /** Callback when visibility changes */
  onVisibilityChange?: (isVisible: boolean) => void;
}

/**
 * Default options for lazy rendering
 */
const DEFAULT_OPTIONS: Required<Omit<LazyRenderOptions, 'placeholder' | 'onVisibilityChange'>> = {
  rootMargin: '50px',
  threshold: 0,
  persistent: true,
  disabled: false,
};

/**
 * Directive for lazy rendering content based on viewport visibility
 */
@Directive({
  selector: '[appLazyRender], [osiLazyRender]',
  standalone: true,
})
export class LazyRenderDirective implements OnInit, OnDestroy {
  private readonly templateRef = inject(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  private observer: IntersectionObserver | null = null;
  private sentinelElement: HTMLElement | null = null;
  private contentView: EmbeddedViewRef<unknown> | null = null;
  private placeholderView: EmbeddedViewRef<unknown> | null = null;
  private isVisible = false;
  private hasRendered = false;
  private options: LazyRenderOptions = {};

  /**
   * Lazy render options
   */
  @Input('appLazyRender')
  set appLazyRender(value: LazyRenderOptions | '' | null) {
    this.options = value && typeof value === 'object' ? value : {};
  }

  @Input('osiLazyRender')
  set osiLazyRender(value: LazyRenderOptions | '' | null) {
    this.options = value && typeof value === 'object' ? value : {};
  }

  /**
   * Root margin for intersection calculation
   */
  @Input() lazyRootMargin?: string;

  /**
   * Visibility threshold
   */
  @Input() lazyThreshold?: number | number[];

  /**
   * Placeholder template
   */
  @Input() lazyPlaceholder?: TemplateRef<unknown>;

  /**
   * Keep rendered after first visibility
   */
  @Input() lazyPersistent?: boolean;

  /**
   * Disable lazy rendering
   */
  @Input() lazyDisabled?: boolean;

  ngOnInit(): void {
    // Merge all input sources
    const mergedOptions = this.getMergedOptions();

    // If disabled or not in browser, render immediately
    if (mergedOptions.disabled || !isPlatformBrowser(this.platformId)) {
      this.renderContent();
      return;
    }

    // Check for IntersectionObserver support
    if (typeof IntersectionObserver === 'undefined') {
      this.renderContent();
      return;
    }

    // Show placeholder initially if provided
    this.showPlaceholder();

    // Create sentinel element and observer
    this.setupIntersectionObserver(mergedOptions);
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  /**
   * Get merged options from all input sources
   */
  private getMergedOptions(): {
    rootMargin: string;
    threshold: number | number[];
    persistent: boolean;
    disabled: boolean;
    placeholder: TemplateRef<unknown> | undefined;
    onVisibilityChange: ((isVisible: boolean) => void) | undefined;
  } {
    return {
      rootMargin: this.lazyRootMargin ?? this.options.rootMargin ?? DEFAULT_OPTIONS.rootMargin,
      threshold: this.lazyThreshold ?? this.options.threshold ?? DEFAULT_OPTIONS.threshold,
      persistent: this.lazyPersistent ?? this.options.persistent ?? DEFAULT_OPTIONS.persistent,
      disabled: this.lazyDisabled ?? this.options.disabled ?? DEFAULT_OPTIONS.disabled,
      placeholder: this.lazyPlaceholder ?? this.options.placeholder,
      onVisibilityChange: this.options.onVisibilityChange,
    };
  }

  /**
   * Set up the IntersectionObserver
   */
  private setupIntersectionObserver(options: {
    rootMargin?: string;
    threshold?: number | number[];
    persistent?: boolean;
    disabled?: boolean;
    placeholder?: TemplateRef<unknown> | undefined;
    onVisibilityChange?: ((isVisible: boolean) => void) | undefined;
  }): void {
    this.ngZone.runOutsideAngular(() => {
      // Create a sentinel element to observe
      this.sentinelElement = document.createElement('div');
      this.sentinelElement.style.cssText =
        'width: 1px; height: 1px; position: absolute; pointer-events: none;';
      this.sentinelElement.setAttribute('aria-hidden', 'true');
      this.sentinelElement.setAttribute('data-lazy-sentinel', 'true');

      // Insert sentinel at the view container location
      const hostElement = this.viewContainer.element.nativeElement as Comment;
      hostElement.parentNode?.insertBefore(this.sentinelElement, hostElement);

      // Create observer
      const observerOptions: IntersectionObserverInit = {};
      if (options.rootMargin) {
        observerOptions.rootMargin = options.rootMargin;
      }
      if (options.threshold !== undefined) {
        observerOptions.threshold = options.threshold;
      }
      this.observer = new IntersectionObserver(
        (entries) => this.handleIntersection(entries, options),
        observerOptions
      );

      this.observer.observe(this.sentinelElement);
    });
  }

  /**
   * Handle intersection changes
   */
  private handleIntersection(
    entries: IntersectionObserverEntry[],
    options: {
      rootMargin?: string;
      threshold?: number | number[];
      persistent?: boolean;
      disabled?: boolean;
      placeholder?: TemplateRef<unknown> | undefined;
      onVisibilityChange?: ((isVisible: boolean) => void) | undefined;
    }
  ): void {
    const entry = entries[0];
    if (!entry) return;

    const wasVisible = this.isVisible;
    this.isVisible = entry.isIntersecting;

    // Notify visibility change
    if (wasVisible !== this.isVisible && options.onVisibilityChange) {
      this.ngZone.run(() => {
        options.onVisibilityChange!(this.isVisible);
      });
    }

    // Handle visibility change
    if (this.isVisible && !this.hasRendered) {
      this.ngZone.run(() => {
        this.renderContent();
        this.hasRendered = true;

        // Stop observing if persistent
        if (options.persistent) {
          this.stopObserving();
        }
      });
    } else if (!this.isVisible && !options.persistent && this.hasRendered) {
      // Unrender if not persistent
      this.ngZone.run(() => {
        this.unrenderContent();
        this.showPlaceholder();
        this.hasRendered = false;
      });
    }
  }

  /**
   * Show placeholder content
   */
  private showPlaceholder(): void {
    const placeholder = this.lazyPlaceholder ?? this.options.placeholder;

    if (placeholder && !this.placeholderView) {
      this.placeholderView = this.viewContainer.createEmbeddedView(placeholder);
      this.cdr.markForCheck();
    }
  }

  /**
   * Hide placeholder content
   */
  private hidePlaceholder(): void {
    if (this.placeholderView) {
      const index = this.viewContainer.indexOf(this.placeholderView);
      if (index > -1) {
        this.viewContainer.remove(index);
      }
      this.placeholderView = null;
    }
  }

  /**
   * Render the actual content
   */
  private renderContent(): void {
    this.hidePlaceholder();

    if (!this.contentView) {
      this.contentView = this.viewContainer.createEmbeddedView(this.templateRef);
      this.cdr.markForCheck();
    }
  }

  /**
   * Unrender the content
   */
  private unrenderContent(): void {
    if (this.contentView) {
      const index = this.viewContainer.indexOf(this.contentView);
      if (index > -1) {
        this.viewContainer.remove(index);
      }
      this.contentView = null;
    }
  }

  /**
   * Stop observing the sentinel
   */
  private stopObserving(): void {
    if (this.observer && this.sentinelElement) {
      this.observer.unobserve(this.sentinelElement);
    }
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.sentinelElement) {
      this.sentinelElement.remove();
      this.sentinelElement = null;
    }

    this.contentView = null;
    this.placeholderView = null;
  }
}

/**
 * Service for managing shared IntersectionObserver instances
 *
 * Use this service when you have many lazy-rendered elements with
 * the same options to reduce overhead.
 */
import { Injectable } from '@angular/core';

export interface ObserverEntry {
  callback: (isVisible: boolean) => void;
  element: Element;
}

@Injectable({
  providedIn: 'root',
})
export class LazyRenderObserverService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  /** Map of observer configs to shared observers */
  private readonly observers = new Map<
    string,
    {
      observer: IntersectionObserver;
      entries: Map<Element, ObserverEntry>;
    }
  >();

  /**
   * Register an element for observation
   */
  observe(
    element: Element,
    callback: (isVisible: boolean) => void,
    options: { rootMargin?: string; threshold?: number | number[] } = {}
  ): () => void {
    if (!isPlatformBrowser(this.platformId) || typeof IntersectionObserver === 'undefined') {
      // Immediately call with visible if no observer support
      callback(true);
      return () => {};
    }

    const key = this.getObserverKey(options);
    let observerData = this.observers.get(key);

    if (!observerData) {
      observerData = this.createObserver(options);
      this.observers.set(key, observerData);
    }

    const entry: ObserverEntry = { callback, element };
    observerData.entries.set(element, entry);
    observerData.observer.observe(element);

    // Return unobserve function
    return () => this.unobserve(element, key);
  }

  /**
   * Stop observing an element
   */
  private unobserve(element: Element, key: string): void {
    const observerData = this.observers.get(key);
    if (!observerData) return;

    observerData.observer.unobserve(element);
    observerData.entries.delete(element);

    // Clean up observer if no more entries
    if (observerData.entries.size === 0) {
      observerData.observer.disconnect();
      this.observers.delete(key);
    }
  }

  /**
   * Create a new IntersectionObserver
   */
  private createObserver(options: { rootMargin?: string; threshold?: number | number[] }): {
    observer: IntersectionObserver;
    entries: Map<Element, ObserverEntry>;
  } {
    const entries = new Map<Element, ObserverEntry>();

    const observer = new IntersectionObserver(
      (intersectionEntries) => {
        this.ngZone.run(() => {
          for (const intersectionEntry of intersectionEntries) {
            const entry = entries.get(intersectionEntry.target);
            if (entry) {
              entry.callback(intersectionEntry.isIntersecting);
            }
          }
        });
      },
      {
        rootMargin: options.rootMargin ?? '50px',
        threshold: options.threshold ?? 0,
      }
    );

    return { observer, entries };
  }

  /**
   * Generate a unique key for observer options
   */
  private getObserverKey(options: { rootMargin?: string; threshold?: number | number[] }): string {
    const margin = options.rootMargin ?? 'default';
    const threshold = Array.isArray(options.threshold)
      ? options.threshold.join(',')
      : String(options.threshold ?? 0);
    return `${margin}|${threshold}`;
  }

  ngOnDestroy(): void {
    for (const { observer } of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
  }
}
