/**
 * Intersection Observer Utility
 *
 * Provides easy-to-use utilities for observing element visibility
 * with the Intersection Observer API.
 *
 * Use cases:
 * - Lazy loading images and components
 * - Infinite scroll
 * - Visibility tracking
 * - Animation triggers
 * - Analytics tracking
 *
 * @example
 * ```typescript
 * import { observeIntersection } from '@osi-cards/utils';
 *
 * const cleanup = observeIntersection(element, {
 *   onEnter: (entry) => console.log('Element entered viewport'),
 *   onExit: (entry) => console.log('Element left viewport'),
 *   threshold: 0.5
 * });
 *
 * // Later: cleanup();
 * ```
 */

import { Observable, Subject } from 'rxjs';

/**
 * Intersection observer options
 */
export interface IntersectionOptions {
  /**
   * Threshold(s) at which to trigger callback
   * 0 = any visibility, 1 = fully visible
   * Can be array for multiple thresholds
   * Default: 0
   */
  threshold?: number | number[];

  /**
   * Root element for intersection
   * Default: viewport
   */
  root?: Element | null;

  /**
   * Root margin (like CSS margin)
   * Default: '0px'
   */
  rootMargin?: string;

  /**
   * Callback when element enters viewport
   */
  onEnter?: (entry: IntersectionObserverEntry) => void;

  /**
   * Callback when element exits viewport
   */
  onExit?: (entry: IntersectionObserverEntry) => void;

  /**
   * Callback on any intersection change
   */
  onChange?: (entry: IntersectionObserverEntry) => void;

  /**
   * Whether to observe once and disconnect
   * Default: false
   */
  once?: boolean;

  /**
   * Minimum visibility ratio to trigger onEnter (0-1)
   * Default: 0
   */
  minVisibility?: number;
}

/**
 * Intersection event
 */
export interface IntersectionEvent {
  entry: IntersectionObserverEntry;
  isIntersecting: boolean;
  ratio: number;
  element: Element;
}

/**
 * Observe element intersection with viewport
 *
 * @param element - Element to observe
 * @param options - Observer options
 * @returns Cleanup function
 *
 * @example
 * ```typescript
 * const cleanup = observeIntersection(imageElement, {
 *   onEnter: () => loadImage(),
 *   once: true, // Load only once
 *   threshold: 0.1
 * });
 * ```
 */
export function observeIntersection(
  element: Element,
  options: IntersectionOptions = {}
): () => void {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    onEnter,
    onExit,
    onChange,
    once = false,
    minVisibility = 0,
  } = options;

  let hasTriggered = false;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const isVisible = entry.isIntersecting && entry.intersectionRatio >= minVisibility;

        // Call onChange on any change
        if (onChange) {
          onChange(entry);
        }

        // Handle enter
        if (isVisible && onEnter && (!once || !hasTriggered)) {
          onEnter(entry);
          hasTriggered = true;

          if (once) {
            observer.disconnect();
          }
        }

        // Handle exit
        if (!isVisible && onExit && entry.intersectionRatio < minVisibility) {
          onExit(entry);
        }
      });
    },
    {
      threshold,
      root,
      rootMargin,
    }
  );

  observer.observe(element);

  // Return cleanup function
  return () => observer.disconnect();
}

/**
 * Observe multiple elements
 *
 * @param elements - Elements to observe
 * @param options - Observer options
 * @returns Cleanup function
 *
 * @example
 * ```typescript
 * const images = document.querySelectorAll('.lazy-image');
 * const cleanup = observeIntersectionBatch(images, {
 *   onEnter: (entry) => loadImage(entry.target),
 *   once: true
 * });
 * ```
 */
export function observeIntersectionBatch(
  elements: Element[] | NodeListOf<Element>,
  options: IntersectionOptions = {}
): () => void {
  const cleanupFns: Array<() => void> = [];

  const elementArray = Array.from(elements);
  elementArray.forEach((element) => {
    const cleanup = observeIntersection(element, options);
    cleanupFns.push(cleanup);
  });

  return () => {
    cleanupFns.forEach((cleanup) => cleanup());
  };
}

/**
 * Create an observable for intersection events
 *
 * @param element - Element to observe
 * @param options - Observer options (excluding callbacks)
 * @returns Observable of intersection events
 *
 * @example
 * ```typescript
 * const intersection$ = createIntersectionObservable(element, {
 *   threshold: [0, 0.5, 1]
 * });
 *
 * intersection$.subscribe(event => {
 *   console.log('Visibility:', event.ratio);
 * });
 * ```
 */
export function createIntersectionObservable(
  element: Element,
  options: Omit<IntersectionOptions, 'onEnter' | 'onExit' | 'onChange'> = {}
): Observable<IntersectionEvent> {
  const subject = new Subject<IntersectionEvent>();

  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    once = false,
    minVisibility = 0,
  } = options;

  let hasEmitted = false;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const event: IntersectionEvent = {
          entry,
          isIntersecting: entry.isIntersecting && entry.intersectionRatio >= minVisibility,
          ratio: entry.intersectionRatio,
          element: entry.target,
        };

        if (!once || !hasEmitted) {
          subject.next(event);

          if (once && event.isIntersecting) {
            hasEmitted = true;
            observer.disconnect();
            subject.complete();
          }
        }
      });
    },
    {
      threshold,
      root,
      rootMargin,
    }
  );

  observer.observe(element);

  // Cleanup on unsubscribe
  return new Observable<IntersectionEvent>((subscriber) => {
    const subscription = subject.subscribe(subscriber);
    return () => {
      subscription.unsubscribe();
      observer.disconnect();
    };
  });
}

/**
 * Check if element is in viewport (one-time check)
 *
 * @param element - Element to check
 * @param options - Check options
 * @returns Promise that resolves with boolean
 *
 * @example
 * ```typescript
 * const isVisible = await isElementVisible(element, {
 *   threshold: 0.5
 * });
 * ```
 */
export function isElementVisible(
  element: Element,
  options: Omit<IntersectionOptions, 'onEnter' | 'onExit' | 'onChange' | 'once'> = {}
): Promise<boolean> {
  return new Promise((resolve) => {
    const cleanup = observeIntersection(element, {
      ...options,
      once: true,
      onChange: (entry) => {
        const minVis = options.minVisibility ?? 0;
        const isVisible = entry.isIntersecting && entry.intersectionRatio >= minVis;
        resolve(isVisible);
        cleanup();
      },
    });
  });
}

/**
 * Wait for element to enter viewport
 *
 * @param element - Element to wait for
 * @param options - Observer options
 * @returns Promise that resolves when element enters
 *
 * @example
 * ```typescript
 * await waitForIntersection(element);
 * // Element is now visible
 * loadContent();
 * ```
 */
export function waitForIntersection(
  element: Element,
  options: Omit<IntersectionOptions, 'onEnter' | 'onExit' | 'onChange' | 'once'> = {}
): Promise<IntersectionObserverEntry> {
  return new Promise((resolve) => {
    const cleanup = observeIntersection(element, {
      ...options,
      once: true,
      onEnter: (entry) => {
        resolve(entry);
        cleanup();
      },
    });
  });
}

/**
 * Lazy load image when in viewport
 *
 * @param img - Image element
 * @param src - Image source URL
 * @param options - Observer options
 * @returns Cleanup function
 *
 * @example
 * ```typescript
 * const img = document.querySelector('img');
 * lazyLoadImage(img, '/images/large.jpg', {
 *   rootMargin: '50px' // Start loading 50px before visible
 * });
 * ```
 */
export function lazyLoadImage(
  img: HTMLImageElement,
  src: string,
  options: Omit<IntersectionOptions, 'onEnter' | 'onExit' | 'onChange' | 'once'> = {}
): () => void {
  return observeIntersection(img, {
    ...options,
    once: true,
    onEnter: () => {
      img.src = src;
      img.classList.add('loaded');
    },
  });
}

/**
 * Track element visibility for analytics
 *
 * @param element - Element to track
 * @param callback - Callback with visibility time
 * @param options - Observer options
 * @returns Cleanup function
 *
 * @example
 * ```typescript
 * trackVisibility(adElement, (timeVisible) => {
 *   analytics.track('ad_viewed', { duration: timeVisible });
 * });
 * ```
 */
export function trackVisibility(
  element: Element,
  callback: (timeVisible: number) => void,
  options: Omit<IntersectionOptions, 'onEnter' | 'onExit' | 'onChange'> = {}
): () => void {
  let enterTime: number | null = null;

  return observeIntersection(element, {
    ...options,
    onEnter: () => {
      enterTime = Date.now();
    },
    onExit: () => {
      if (enterTime !== null) {
        const timeVisible = Date.now() - enterTime;
        callback(timeVisible);
        enterTime = null;
      }
    },
  });
}

/**
 * Trigger animation when element enters viewport
 *
 * @param element - Element to animate
 * @param animationClass - CSS class to add
 * @param options - Observer options
 * @returns Cleanup function
 *
 * @example
 * ```typescript
 * animateOnIntersection(element, 'fade-in', {
 *   threshold: 0.3,
 *   once: true
 * });
 * ```
 */
export function animateOnIntersection(
  element: Element,
  animationClass: string,
  options: Omit<IntersectionOptions, 'onEnter' | 'onExit' | 'onChange'> = {}
): () => void {
  return observeIntersection(element, {
    ...options,
    onEnter: () => {
      element.classList.add(animationClass);
    },
  });
}

/**
 * Infinite scroll utility
 *
 * @param sentinel - Element that triggers load when visible
 * @param loadMore - Function to load more data
 * @param options - Observer options
 * @returns Cleanup function
 *
 * @example
 * ```typescript
 * const sentinel = document.querySelector('.load-more-trigger');
 * infiniteScroll(sentinel, async () => {
 *   const data = await fetchMoreData();
 *   renderData(data);
 * });
 * ```
 */
export function infiniteScroll(
  sentinel: Element,
  loadMore: () => void | Promise<void>,
  options: Omit<IntersectionOptions, 'onEnter' | 'onExit' | 'onChange' | 'once'> = {}
): () => void {
  let isLoading = false;

  return observeIntersection(sentinel, {
    ...options,
    threshold: 1.0, // Fully visible
    onEnter: async () => {
      if (!isLoading) {
        isLoading = true;
        try {
          await loadMore();
        } finally {
          isLoading = false;
        }
      }
    },
  });
}

