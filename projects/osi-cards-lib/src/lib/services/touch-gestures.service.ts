import { Injectable, inject, NgZone, OnDestroy } from '@angular/core';
import { Subject, Observable, fromEvent, merge } from 'rxjs';
import { map, filter, takeUntil, switchMap, take } from 'rxjs/operators';

/**
 * Touch gesture types
 */
export type GestureType = 'tap' | 'doubletap' | 'swipe' | 'swipeleft' | 'swiperight' | 'swipeup' | 'swipedown' | 'pinch' | 'pan' | 'press';

/**
 * Touch gesture event
 */
export interface GestureEvent {
  type: GestureType;
  element: HTMLElement;
  /** Start position */
  startX: number;
  startY: number;
  /** Current/end position */
  endX: number;
  endY: number;
  /** Delta from start */
  deltaX: number;
  deltaY: number;
  /** Velocity (pixels per ms) */
  velocityX: number;
  velocityY: number;
  /** Direction for swipes */
  direction?: 'left' | 'right' | 'up' | 'down';
  /** Scale for pinch */
  scale?: number;
  /** Duration in ms */
  duration: number;
  /** Original touch event */
  originalEvent: TouchEvent;
}

/**
 * Gesture handler configuration
 */
export interface GestureConfig {
  /** Element to attach gestures to */
  element: HTMLElement;
  /** Gestures to listen for */
  gestures?: GestureType[];
  /** Minimum swipe distance in pixels */
  swipeThreshold?: number;
  /** Minimum swipe velocity in px/ms */
  swipeVelocity?: number;
  /** Maximum tap duration in ms */
  tapDuration?: number;
  /** Double tap timeout in ms */
  doubleTapTimeout?: number;
  /** Long press duration in ms */
  pressDuration?: number;
}

/**
 * Touch Gestures Service
 *
 * Provides touch gesture recognition for mobile interactions.
 * Supports swipe, tap, double tap, pinch, pan, and long press.
 *
 * @example
 * ```typescript
 * const gestures = inject(TouchGesturesService);
 *
 * gestures.attach({
 *   element: cardElement,
 *   gestures: ['swipeleft', 'swiperight']
 * }).subscribe(event => {
 *   if (event.type === 'swipeleft') {
 *     this.nextCard();
 *   }
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class TouchGesturesService implements OnDestroy {
  private readonly ngZone = inject(NgZone);
  private readonly destroy$ = new Subject<void>();
  private readonly gestureHandlers = new Map<HTMLElement, Subject<void>>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.gestureHandlers.forEach(subject => subject.complete());
    this.gestureHandlers.clear();
  }

  /**
   * Attach gesture recognition to an element
   */
  attach(config: GestureConfig): Observable<GestureEvent> {
    const {
      element,
      gestures = ['tap', 'swipe'],
      swipeThreshold = 50,
      swipeVelocity = 0.3,
      tapDuration = 250,
      doubleTapTimeout = 300,
      pressDuration = 500
    } = config;

    // Create destroy subject for this element
    const elementDestroy$ = new Subject<void>();
    this.gestureHandlers.set(element, elementDestroy$);

    const events$ = new Subject<GestureEvent>();

    this.ngZone.runOutsideAngular(() => {
      let touchStartTime = 0;
      let touchStartX = 0;
      let touchStartY = 0;
      let lastTapTime = 0;
      let pressTimeout: ReturnType<typeof setTimeout> | null = null;

      const touchStart$ = fromEvent<TouchEvent>(element, 'touchstart', { passive: true });
      const touchMove$ = fromEvent<TouchEvent>(element, 'touchmove', { passive: true });
      const touchEnd$ = fromEvent<TouchEvent>(element, 'touchend', { passive: true });

      touchStart$.pipe(
        takeUntil(merge(this.destroy$, elementDestroy$))
      ).subscribe(event => {
        const touch = event.touches[0];
        if (!touch) return;
        touchStartTime = Date.now();
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;

        // Start press timer
        if (gestures.includes('press')) {
          pressTimeout = setTimeout(() => {
            this.ngZone.run(() => {
              events$.next(this.createGestureEvent('press', element, {
                startX: touchStartX,
                startY: touchStartY,
                endX: touchStartX,
                endY: touchStartY,
                duration: pressDuration,
                originalEvent: event
              }));
            });
          }, pressDuration);
        }
      });

      touchMove$.pipe(
        takeUntil(merge(this.destroy$, elementDestroy$))
      ).subscribe(() => {
        // Cancel press on move
        if (pressTimeout) {
          clearTimeout(pressTimeout);
          pressTimeout = null;
        }
      });

      touchEnd$.pipe(
        takeUntil(merge(this.destroy$, elementDestroy$))
      ).subscribe(event => {
        // Cancel press timer
        if (pressTimeout) {
          clearTimeout(pressTimeout);
          pressTimeout = null;
        }

        const touch = event.changedTouches[0];
        if (!touch) return;
        const endX = touch.clientX;
        const endY = touch.clientY;
        const duration = Date.now() - touchStartTime;
        const deltaX = endX - touchStartX;
        const deltaY = endY - touchStartY;
        const velocityX = Math.abs(deltaX) / duration;
        const velocityY = Math.abs(deltaY) / duration;

        const gestureBase = {
          startX: touchStartX,
          startY: touchStartY,
          endX,
          endY,
          deltaX,
          deltaY,
          velocityX,
          velocityY,
          duration,
          originalEvent: event
        };

        this.ngZone.run(() => {
          // Detect swipe
          if (Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold) {
            const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

            if (isHorizontal && velocityX > swipeVelocity) {
              const direction = deltaX > 0 ? 'right' : 'left';
              const type = `swipe${direction}` as GestureType;

              if (gestures.includes('swipe') || gestures.includes(type)) {
                events$.next(this.createGestureEvent(type, element, {
                  ...gestureBase,
                  direction
                }));
              }
            } else if (!isHorizontal && velocityY > swipeVelocity) {
              const direction = deltaY > 0 ? 'down' : 'up';
              const type = `swipe${direction}` as GestureType;

              if (gestures.includes('swipe') || gestures.includes(type)) {
                events$.next(this.createGestureEvent(type, element, {
                  ...gestureBase,
                  direction
                }));
              }
            }
          }
          // Detect tap
          else if (duration < tapDuration && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
            const now = Date.now();

            // Check for double tap
            if (gestures.includes('doubletap') && now - lastTapTime < doubleTapTimeout) {
              events$.next(this.createGestureEvent('doubletap', element, gestureBase));
              lastTapTime = 0;
            } else if (gestures.includes('tap')) {
              events$.next(this.createGestureEvent('tap', element, gestureBase));
              lastTapTime = now;
            }
          }
        });
      });
    });

    return events$.asObservable().pipe(
      takeUntil(merge(this.destroy$, elementDestroy$))
    );
  }

  /**
   * Detach gesture recognition from an element
   */
  detach(element: HTMLElement): void {
    const subject = this.gestureHandlers.get(element);
    if (subject) {
      subject.next();
      subject.complete();
      this.gestureHandlers.delete(element);
    }
  }

  /**
   * Create gesture event object
   */
  private createGestureEvent(
    type: GestureType,
    element: HTMLElement,
    data: Partial<GestureEvent>
  ): GestureEvent {
    return {
      type,
      element,
      startX: data.startX ?? 0,
      startY: data.startY ?? 0,
      endX: data.endX ?? 0,
      endY: data.endY ?? 0,
      deltaX: data.deltaX ?? 0,
      deltaY: data.deltaY ?? 0,
      velocityX: data.velocityX ?? 0,
      velocityY: data.velocityY ?? 0,
      direction: data.direction,
      scale: data.scale,
      duration: data.duration ?? 0,
      originalEvent: data.originalEvent!
    };
  }
}

