/**
 * Touch Gesture Utilities
 *
 * Utilities for detecting touch gestures like swipe, pinch, and tap.
 *
 * @example
 * ```typescript
 * import { detectSwipe, detectPinch } from '@osi-cards/utils';
 *
 * const cleanup = detectSwipe(element, {
 *   onSwipeLeft: () => console.log('Swiped left'),
 *   onSwipeRight: () => console.log('Swiped right')
 * });
 * ```
 */

export interface SwipeOptions {
  threshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export interface PinchOptions {
  onPinchIn?: (scale: number) => void;
  onPinchOut?: (scale: number) => void;
  onPinch?: (scale: number) => void;
}

export interface TapOptions {
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  longPressDelay?: number;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  startDistance?: number;
}

/**
 * Detect swipe gestures
 */
export function detectSwipe(element: HTMLElement, options: SwipeOptions = {}): () => void {
  const { threshold = 50 } = options;
  let touchState: TouchState | null = null;

  const handleTouchStart = (e: TouchEvent): void => {
    if (e.touches.length === 1) {
      touchState = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startTime: Date.now(),
      };
    }
  };

  const handleTouchEnd = (e: TouchEvent): void => {
    if (!touchState || e.changedTouches.length !== 1) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - touchState.startX;
    const deltaY = endY - touchState.startY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          options.onSwipeRight?.();
        } else {
          options.onSwipeLeft?.();
        }
      }
    } else {
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          options.onSwipeDown?.();
        } else {
          options.onSwipeUp?.();
        }
      }
    }

    touchState = null;
  };

  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });

  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchend', handleTouchEnd);
  };
}

/**
 * Detect pinch gestures
 */
export function detectPinch(element: HTMLElement, options: PinchOptions = {}): () => void {
  let touchState: TouchState | null = null;

  const getDistance = (touches: TouchList): number => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: TouchEvent): void => {
    if (e.touches.length === 2) {
      touchState = {
        startX: 0,
        startY: 0,
        startTime: Date.now(),
        startDistance: getDistance(e.touches),
      };
    }
  };

  const handleTouchMove = (e: TouchEvent): void => {
    if (!touchState || e.touches.length !== 2) return;

    const currentDistance = getDistance(e.touches);
    const scale = currentDistance / (touchState.startDistance || 1);

    options.onPinch?.(scale);

    if (scale > 1) {
      options.onPinchOut?.(scale);
    } else if (scale < 1) {
      options.onPinchIn?.(scale);
    }
  };

  const handleTouchEnd = (): void => {
    touchState = null;
  };

  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchmove', handleTouchMove, { passive: true });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });

  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
  };
}

/**
 * Detect tap gestures
 */
export function detectTap(element: HTMLElement, options: TapOptions = {}): () => void {
  const { longPressDelay = 500 } = options;
  let touchState: TouchState | null = null;
  let longPressTimer: ReturnType<typeof setTimeout> | null = null;
  let lastTapTime = 0;

  const handleTouchStart = (e: TouchEvent): void => {
    if (e.touches.length === 1) {
      touchState = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startTime: Date.now(),
      };

      longPressTimer = setTimeout(() => {
        options.onLongPress?.();
        touchState = null;
      }, longPressDelay);
    }
  };

  const handleTouchEnd = (e: TouchEvent): void => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }

    if (!touchState) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = Math.abs(endX - touchState.startX);
    const deltaY = Math.abs(endY - touchState.startY);

    if (deltaX < 10 && deltaY < 10) {
      const now = Date.now();
      if (now - lastTapTime < 300) {
        options.onDoubleTap?.();
        lastTapTime = 0;
      } else {
        options.onTap?.();
        lastTapTime = now;
      }
    }

    touchState = null;
  };

  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });

  return () => {
    if (longPressTimer) clearTimeout(longPressTimer);
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchend', handleTouchEnd);
  };
}

/**
 * Check if device supports touch
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Get touch position
 */
export function getTouchPosition(e: TouchEvent, index = 0): { x: number; y: number } | null {
  if (e.touches.length > index) {
    return {
      x: e.touches[index].clientX,
      y: e.touches[index].clientY,
    };
  }
  return null;
}

