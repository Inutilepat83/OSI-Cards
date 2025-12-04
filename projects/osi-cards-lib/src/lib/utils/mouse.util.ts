/**
 * Mouse Utilities
 *
 * Utilities for mouse tracking and gestures.
 *
 * @example
 * ```typescript
 * import { trackMouse, onDoubleClick } from '@osi-cards/utils';
 *
 * trackMouse(element, (pos) => console.log(pos));
 * onDoubleClick(element, () => console.log('Double clicked!'));
 * ```
 */

export interface MousePosition {
  x: number;
  y: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
}

export interface MouseVelocity {
  vx: number;
  vy: number;
  speed: number;
}

/**
 * Track mouse position
 */
export function trackMouse(
  element: HTMLElement,
  callback: (position: MousePosition) => void
): () => void {
  const handler = (e: MouseEvent): void => {
    const rect = element.getBoundingClientRect();
    callback({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      clientX: e.clientX,
      clientY: e.clientY,
      pageX: e.pageX,
      pageY: e.pageY,
    });
  };

  element.addEventListener('mousemove', handler);
  return () => element.removeEventListener('mousemove', handler);
}

/**
 * Track mouse velocity
 */
export function trackMouseVelocity(
  element: HTMLElement,
  callback: (velocity: MouseVelocity) => void
): () => void {
  let lastX = 0;
  let lastY = 0;
  let lastTime = 0;

  const handler = (e: MouseEvent): void => {
    const now = Date.now();
    const dt = (now - lastTime) / 1000;

    if (dt > 0 && lastTime > 0) {
      const vx = (e.clientX - lastX) / dt;
      const vy = (e.clientY - lastY) / dt;
      const speed = Math.sqrt(vx * vx + vy * vy);

      callback({ vx, vy, speed });
    }

    lastX = e.clientX;
    lastY = e.clientY;
    lastTime = now;
  };

  element.addEventListener('mousemove', handler);
  return () => element.removeEventListener('mousemove', handler);
}

/**
 * On double click
 */
export function onDoubleClick(element: HTMLElement, callback: () => void): () => void {
  element.addEventListener('dblclick', callback);
  return () => element.removeEventListener('dblclick', callback);
}

/**
 * On right click
 */
export function onRightClick(element: HTMLElement, callback: (e: MouseEvent) => void): () => void {
  const handler = (e: MouseEvent): void => {
    e.preventDefault();
    callback(e);
  };

  element.addEventListener('contextmenu', handler);
  return () => element.removeEventListener('contextmenu', handler);
}

/**
 * On hover
 */
export function onHover(
  element: HTMLElement,
  onEnter: () => void,
  onLeave: () => void
): () => void {
  element.addEventListener('mouseenter', onEnter);
  element.addEventListener('mouseleave', onLeave);

  return () => {
    element.removeEventListener('mouseenter', onEnter);
    element.removeEventListener('mouseleave', onLeave);
  };
}

/**
 * Get mouse button
 */
export function getMouseButton(e: MouseEvent): 'left' | 'middle' | 'right' | 'unknown' {
  switch (e.button) {
    case 0:
      return 'left';
    case 1:
      return 'middle';
    case 2:
      return 'right';
    default:
      return 'unknown';
  }
}

/**
 * Is left click
 */
export function isLeftClick(e: MouseEvent): boolean {
  return e.button === 0;
}

/**
 * Is right click
 */
export function isRightClick(e: MouseEvent): boolean {
  return e.button === 2;
}

/**
 * Is middle click
 */
export function isMiddleClick(e: MouseEvent): boolean {
  return e.button === 1;
}

/**
 * Get relative position
 */
export function getRelativePosition(e: MouseEvent, element: HTMLElement): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

/**
 * Get normalized position (0-1)
 */
export function getNormalizedPosition(
  e: MouseEvent,
  element: HTMLElement
): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) / rect.width,
    y: (e.clientY - rect.top) / rect.height,
  };
}
