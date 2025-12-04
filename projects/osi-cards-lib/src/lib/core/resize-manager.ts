/**
 * Resize Manager
 *
 * A smart, reusable resize observer that handles:
 * - Container resize detection
 * - Debouncing and throttling
 * - Width polling for initial layout
 * - Cross-browser compatibility
 *
 * @example
 * ```typescript
 * const resize = new ResizeManager(element);
 *
 * resize.width$.subscribe(width => {
 *   // React to width changes
 *   recalculateLayout(width);
 * });
 *
 * // Cleanup
 * resize.destroy();
 * ```
 */

import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, takeUntil } from 'rxjs/operators';

// ============================================================================
// TYPES
// ============================================================================

export interface ResizeEvent {
  width: number;
  height: number;
  timestamp: number;
}

export interface ResizeManagerConfig {
  /** Debounce delay in ms */
  debounce: number;
  /** Throttle delay in ms (0 to disable) */
  throttle: number;
  /** Enable width polling for initial layout */
  pollForInitialWidth: boolean;
  /** Polling duration in ms */
  pollDuration: number;
  /** Polling interval in ms */
  pollInterval: number;
  /** Minimum width to consider valid */
  minValidWidth: number;
}

const DEFAULT_CONFIG: ResizeManagerConfig = {
  debounce: 100,
  throttle: 16, // ~1 frame
  pollForInitialWidth: true,
  pollDuration: 2000,
  pollInterval: 50,
  minValidWidth: 100,
};

// ============================================================================
// RESIZE MANAGER
// ============================================================================

export class ResizeManager {
  private readonly config: ResizeManagerConfig;
  private readonly destroy$ = new Subject<void>();
  private readonly widthSubject = new BehaviorSubject<number>(0);
  private readonly heightSubject = new BehaviorSubject<number>(0);
  private readonly resizeSubject = new Subject<ResizeEvent>();

  private resizeObserver?: ResizeObserver;
  private element?: Element;
  private pollingInterval?: ReturnType<typeof setInterval>;
  private pollingTimeout?: ReturnType<typeof setTimeout>;
  private lastEmittedWidth = 0;
  private throttleTimeout?: ReturnType<typeof setTimeout>;

  /** Current width observable (debounced) */
  readonly width$: Observable<number>;

  /** Current height observable (debounced) */
  readonly height$: Observable<number>;

  /** Raw resize events */
  readonly resize$: Observable<ResizeEvent>;

  constructor(config: Partial<ResizeManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Setup observables with debouncing
    this.width$ = this.widthSubject.pipe(
      filter((w) => w >= this.config.minValidWidth),
      debounceTime(this.config.debounce),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    );

    this.height$ = this.heightSubject.pipe(
      debounceTime(this.config.debounce),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    );

    this.resize$ = this.resizeSubject.pipe(
      debounceTime(this.config.debounce),
      takeUntil(this.destroy$)
    );
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Start observing an element
   */
  observe(element: Element): void {
    this.element = element;
    this.setupResizeObserver();

    // Initial measurement
    this.measureElement();

    // Poll for initial width if enabled
    if (this.config.pollForInitialWidth) {
      this.startPolling();
    }
  }

  /**
   * Stop observing
   */
  unobserve(): void {
    this.resizeObserver?.disconnect();
    this.stopPolling();
    this.element = undefined;
  }

  /**
   * Get current width synchronously
   */
  getWidth(): number {
    return this.widthSubject.value;
  }

  /**
   * Get current height synchronously
   */
  getHeight(): number {
    return this.heightSubject.value;
  }

  /**
   * Force a measurement update
   */
  measure(): ResizeEvent {
    return this.measureElement();
  }

  /**
   * Cleanup all resources
   */
  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.unobserve();

    if (this.throttleTimeout) {
      clearTimeout(this.throttleTimeout);
    }
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  private setupResizeObserver(): void {
    if (!this.element) return;

    // Cleanup existing
    this.resizeObserver?.disconnect();

    // Create new observer
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.handleResize(entry);
      }
    });

    this.resizeObserver.observe(this.element);
  }

  private handleResize(entry: ResizeObserverEntry): void {
    const { width, height } = entry.contentRect;

    // Throttle if configured
    if (this.config.throttle > 0) {
      if (this.throttleTimeout) return;

      this.throttleTimeout = setTimeout(() => {
        this.throttleTimeout = undefined;
        this.emitResize(width, height);
      }, this.config.throttle);
    } else {
      this.emitResize(width, height);
    }
  }

  private emitResize(width: number, height: number): void {
    const event: ResizeEvent = {
      width,
      height,
      timestamp: Date.now(),
    };

    this.widthSubject.next(width);
    this.heightSubject.next(height);
    this.resizeSubject.next(event);
    this.lastEmittedWidth = width;
  }

  private measureElement(): ResizeEvent {
    const width = this.element?.clientWidth ?? 0;
    const height = this.element?.clientHeight ?? 0;

    const event: ResizeEvent = {
      width,
      height,
      timestamp: Date.now(),
    };

    if (width !== this.widthSubject.value) {
      this.widthSubject.next(width);
    }
    if (height !== this.heightSubject.value) {
      this.heightSubject.next(height);
    }

    return event;
  }

  private startPolling(): void {
    this.stopPolling();

    const startTime = Date.now();

    this.pollingInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;

      if (elapsed >= this.config.pollDuration) {
        this.stopPolling();
        return;
      }

      const measurement = this.measureElement();

      // Stop polling if we got a valid width
      if (measurement.width >= this.config.minValidWidth) {
        this.stopPolling();
      }
    }, this.config.pollInterval);

    // Safety timeout
    this.pollingTimeout = setTimeout(() => {
      this.stopPolling();
    }, this.config.pollDuration + 100);
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }
    if (this.pollingTimeout) {
      clearTimeout(this.pollingTimeout);
      this.pollingTimeout = undefined;
    }
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/** Create a ResizeManager and immediately observe an element */
export function observeResize(
  element: Element,
  config?: Partial<ResizeManagerConfig>
): ResizeManager {
  const manager = new ResizeManager(config);
  manager.observe(element);
  return manager;
}

/** Create a ResizeManager configured for grid layouts */
export function createGridResizeManager(element?: Element): ResizeManager {
  const manager = new ResizeManager({
    debounce: 100,
    throttle: 16,
    pollForInitialWidth: true,
    pollDuration: 2000,
    pollInterval: 50,
    minValidWidth: 200,
  });

  if (element) {
    manager.observe(element);
  }

  return manager;
}
