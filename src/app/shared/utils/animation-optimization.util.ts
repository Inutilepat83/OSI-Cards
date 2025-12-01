/**
 * Animation optimization utilities
 * Uses CSS transforms and will-change property for better animation performance
 */

/**
 * Apply will-change property for animation optimization
 */
export function applyWillChange(element: HTMLElement, properties: string[]): void {
  element.style.willChange = properties.join(', ');
}

/**
 * Remove will-change property after animation
 */
export function removeWillChange(element: HTMLElement): void {
  element.style.willChange = 'auto';
}

/**
 * Create optimized transform string
 */
export function createTransform(
  translateX?: number,
  translateY?: number,
  scale?: number,
  rotate?: number
): string {
  const transforms: string[] = [];

  if (translateX !== undefined || translateY !== undefined) {
    const x = translateX ?? 0;
    const y = translateY ?? 0;
    transforms.push(`translate(${x}px, ${y}px)`);
  }

  if (scale !== undefined) {
    transforms.push(`scale(${scale})`);
  }

  if (rotate !== undefined) {
    transforms.push(`rotate(${rotate}deg)`);
  }

  return transforms.join(' ');
}

/**
 * Apply optimized transform
 */
export function applyTransform(element: HTMLElement, transform: string): void {
  element.style.transform = transform;
  element.style.willChange = 'transform';
}

/**
 * Reset transform
 */
export function resetTransform(element: HTMLElement): void {
  element.style.transform = '';
  element.style.willChange = 'auto';
}

/**
 * Check if element is animating
 */
export function isAnimating(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  const transition = computedStyle.transition;
  const animation = computedStyle.animation;
  return transition !== 'all 0s ease 0s' || animation !== 'none 0s ease 0s';
}
