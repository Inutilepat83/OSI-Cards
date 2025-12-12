/**
 * Passive Event Listeners Utility
 *
 * Provides utilities for adding passive event listeners for better scroll performance.
 * Passive listeners tell the browser the listener will never call preventDefault(),
 * allowing the browser to optimize scrolling performance.
 *
 * @example
 * ```typescript
 * import { addPassiveListener, removePassiveListener } from './passive-listeners.util';
 *
 * const handler = () => console.log('scrolled');
 * addPassiveListener(element, 'scroll', handler);
 *
 * // Later...
 * removePassiveListener(element, 'scroll', handler);
 * ```
 */

/**
 * Check if browser supports passive event listeners
 */
export function supportsPassiveListeners(): boolean {
  let supportsPassive = false;
  try {
    const opts = Object.defineProperty({}, 'passive', {
      get() {
        supportsPassive = true;
        return false;
      },
    });
    window.addEventListener('test', () => undefined, opts);
    window.removeEventListener('test', () => undefined, opts);
  } catch {
    // Passive listeners not supported
  }
  return supportsPassive;
}

/**
 * Options for passive event listeners
 */
const passiveOptions = supportsPassiveListeners() ? { passive: true, capture: false } : false;

/**
 * Add a passive event listener
 */
export function addPassiveListener(
  element: Element | Window | Document,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions
): void {
  element.addEventListener(
    event,
    handler,
    options ? { ...passiveOptions, ...options } : passiveOptions
  );
}

/**
 * Remove a passive event listener
 */
export function removePassiveListener(
  element: Element | Window | Document,
  event: string,
  handler: EventListener,
  options?: EventListenerOptions
): void {
  element.removeEventListener(event, handler, options || passiveOptions);
}

/**
 * Add passive scroll listener
 */
export function addPassiveScrollListener(
  element: Element | Window,
  handler: (event: Event) => void
): () => void {
  addPassiveListener(element, 'scroll', handler);
  return () => removePassiveListener(element, 'scroll', handler);
}

/**
 * Add passive touch listener
 */
export function addPassiveTouchListener(
  element: Element,
  handler: (event: TouchEvent) => void
): () => void {
  const listener: EventListener = (event) => handler(event as TouchEvent);
  addPassiveListener(element, 'touchstart', listener);
  addPassiveListener(element, 'touchmove', listener);
  return () => {
    removePassiveListener(element, 'touchstart', listener);
    removePassiveListener(element, 'touchmove', listener);
  };
}

/**
 * Add passive wheel listener
 */
export function addPassiveWheelListener(
  element: Element | Window,
  handler: (event: WheelEvent) => void
): () => void {
  const listener: EventListener = (event) => handler(event as WheelEvent);
  addPassiveListener(element, 'wheel', listener);
  return () => removePassiveListener(element, 'wheel', listener);
}

