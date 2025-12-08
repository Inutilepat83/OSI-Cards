/**
 * FLIP Animation Engine
 *
 * First-Last-Invert-Play animation system for smooth layout transitions.
 * Automatically animates elements when their positions change in the DOM.
 *
 * FLIP Technique:
 * 1. First: Record initial position/size
 * 2. Last: Make DOM change, record final position/size
 * 3. Invert: Apply transform to make element appear at initial position
 * 4. Play: Remove transform with animation
 *
 * @example
 * ```typescript
 * import { FlipAnimator } from 'osi-cards-lib';
 *
 * const flip = new FlipAnimator(containerElement);
 *
 * // Before DOM change
 * flip.first();
 *
 * // Make DOM changes
 * reorderElements();
 *
 * // Animate the change
 * await flip.play();
 * ```
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Recorded position and dimensions of an element
 */
export interface ElementRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * FLIP state for an element
 */
export interface FlipState {
  id: string;
  element: HTMLElement;
  first: ElementRect | null;
  last: ElementRect | null;
}

/**
 * FLIP animation configuration
 */
export interface FlipConfig {
  /** Animation duration in ms */
  duration?: number;
  /** Easing function */
  easing?: string;
  /** Whether to animate size changes */
  animateSize?: boolean;
  /** Whether to animate opacity */
  animateOpacity?: boolean;
  /** Minimum distance to animate (px) */
  threshold?: number;
  /** Callback on animation start */
  onStart?: (elements: HTMLElement[]) => void;
  /** Callback on animation complete */
  onComplete?: (elements: HTMLElement[]) => void;
  /** Selector for elements to track */
  selector?: string;
  /** ID attribute to use for tracking */
  idAttribute?: string;
}

/**
 * Delta between first and last positions
 */
export interface FlipDelta {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  opacity?: number;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_FLIP_CONFIG: Required<FlipConfig> = {
  duration: 300,
  easing: 'cubic-bezier(0.2, 0, 0.2, 1)', // Material Design easing
  animateSize: true,
  animateOpacity: false,
  threshold: 1,
  onStart: () => {},
  onComplete: () => {},
  selector: '[data-flip-id]',
  idAttribute: 'data-flip-id',
};

// ============================================================================
// FLIP ANIMATOR CLASS
// ============================================================================

/**
 * FLIP animation manager for a container
 */
export class FlipAnimator {
  private container: HTMLElement;
  private states = new Map<string, FlipState>();
  private config: Required<FlipConfig>;
  private activeAnimations: Animation[] = [];

  constructor(container: HTMLElement, config?: FlipConfig) {
    this.container = container;
    this.config = { ...DEFAULT_FLIP_CONFIG, ...config };
  }

  /**
   * Records the "First" position of all tracked elements
   */
  first(): void {
    this.states.clear();
    const elements = this.getTrackedElements();

    for (const element of elements) {
      const id = this.getElementId(element);
      if (id) {
        this.states.set(id, {
          id,
          element,
          first: this.getRect(element),
          last: null,
        });
      }
    }
  }

  /**
   * Records the "Last" position of all tracked elements
   */
  last(): void {
    const elements = this.getTrackedElements();
    const currentElements = new Map<string, HTMLElement>();

    // Get current elements
    for (const element of elements) {
      const id = this.getElementId(element);
      if (id) {
        currentElements.set(id, element);
      }
    }

    // Update states with last positions
    for (const [id, state] of this.states) {
      const currentElement = currentElements.get(id);
      if (currentElement) {
        state.element = currentElement;
        state.last = this.getRect(currentElement);
      }
    }

    // Add new elements (appeared)
    for (const [id, element] of currentElements) {
      if (!this.states.has(id)) {
        this.states.set(id, {
          id,
          element,
          first: null,
          last: this.getRect(element),
        });
      }
    }
  }

  /**
   * Plays the FLIP animation
   */
  async play(): Promise<void> {
    // Record last positions
    this.last();

    // Cancel any active animations
    this.cancelAll();

    const animatingElements: HTMLElement[] = [];
    const animations: Animation[] = [];

    for (const state of this.states.values()) {
      const animation = this.animateElement(state);
      if (animation) {
        animations.push(animation);
        animatingElements.push(state.element);
      }
    }

    if (animatingElements.length === 0) {
      return;
    }

    this.activeAnimations = animations;
    this.config.onStart(animatingElements);

    // Wait for all animations to complete
    await Promise.all(animations.map((a) => a.finished.catch(() => {})));

    this.activeAnimations = [];
    this.config.onComplete(animatingElements);
    this.states.clear();
  }

  /**
   * Cancels all active animations
   */
  cancelAll(): void {
    for (const animation of this.activeAnimations) {
      animation.cancel();
    }
    this.activeAnimations = [];
  }

  /**
   * Convenience method: records first, executes function, then plays
   */
  async animate(updateFn: () => void | Promise<void>): Promise<void> {
    this.first();
    await updateFn();
    await this.play();
  }

  /**
   * Updates configuration
   */
  configure(config: Partial<FlipConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private getTrackedElements(): HTMLElement[] {
    return Array.from(this.container.querySelectorAll(this.config.selector));
  }

  private getElementId(element: HTMLElement): string | null {
    return element.getAttribute(this.config.idAttribute);
  }

  private getRect(element: HTMLElement): ElementRect {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }

  private calculateDelta(state: FlipState): FlipDelta | null {
    if (!state.first || !state.last) {
      return null;
    }

    const dx = state.first.left - state.last.left;
    const dy = state.first.top - state.last.top;
    const scaleX = state.first.width / state.last.width;
    const scaleY = state.first.height / state.last.height;

    // Check threshold
    if (
      Math.abs(dx) < this.config.threshold &&
      Math.abs(dy) < this.config.threshold &&
      Math.abs(scaleX - 1) < 0.01 &&
      Math.abs(scaleY - 1) < 0.01
    ) {
      return null;
    }

    return {
      x: dx,
      y: dy,
      scaleX: isFinite(scaleX) ? scaleX : 1,
      scaleY: isFinite(scaleY) ? scaleY : 1,
    };
  }

  private animateElement(state: FlipState): Animation | null {
    const delta = this.calculateDelta(state);

    // Element appeared (no first position)
    if (!state.first && state.last) {
      return this.animateEnter(state.element);
    }

    // Element disappeared (no last position)
    if (state.first && !state.last) {
      return this.animateExit(state.element);
    }

    // No significant change
    if (!delta) {
      return null;
    }

    // Build keyframes
    const keyframes: Keyframe[] = [];

    if (this.config.animateSize && (delta.scaleX !== 1 || delta.scaleY !== 1)) {
      // Animate with scale
      keyframes.push({
        transform: `translate(${delta.x}px, ${delta.y}px) scale(${delta.scaleX}, ${delta.scaleY})`,
        transformOrigin: 'top left',
      });
      keyframes.push({
        transform: 'translate(0, 0) scale(1, 1)',
        transformOrigin: 'top left',
      });
    } else {
      // Position-only animation
      keyframes.push({
        transform: `translate(${delta.x}px, ${delta.y}px)`,
      });
      keyframes.push({
        transform: 'translate(0, 0)',
      });
    }

    return state.element.animate(keyframes, {
      duration: this.config.duration,
      easing: this.config.easing,
      fill: 'backwards',
    });
  }

  private animateEnter(element: HTMLElement): Animation {
    const keyframes = this.config.animateOpacity
      ? [
          { opacity: 0, transform: 'scale(0.95)' },
          { opacity: 1, transform: 'scale(1)' },
        ]
      : [
          { transform: 'scale(0.95)', opacity: 0.5 },
          { transform: 'scale(1)', opacity: 1 },
        ];

    return element.animate(keyframes, {
      duration: this.config.duration,
      easing: this.config.easing,
      fill: 'backwards',
    });
  }

  private animateExit(element: HTMLElement): Animation {
    const keyframes = [
      { opacity: 1, transform: 'scale(1)' },
      { opacity: 0, transform: 'scale(0.95)' },
    ];

    return element.animate(keyframes, {
      duration: this.config.duration,
      easing: this.config.easing,
      fill: 'forwards',
    });
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a one-time FLIP animation
 */
export async function flipAnimate(
  container: HTMLElement,
  updateFn: () => void | Promise<void>,
  config?: FlipConfig
): Promise<void> {
  const animator = new FlipAnimator(container, config);
  await animator.animate(updateFn);
}

/**
 * Records positions of elements before a change
 */
export function recordPositions(elements: HTMLElement[]): Map<HTMLElement, ElementRect> {
  const positions = new Map<HTMLElement, ElementRect>();

  for (const element of elements) {
    const rect = element.getBoundingClientRect();
    positions.set(element, {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    });
  }

  return positions;
}

/**
 * Animates elements from recorded positions to current positions
 */
export async function animateFromPositions(
  positions: Map<HTMLElement, ElementRect>,
  config?: Partial<FlipConfig>
): Promise<Animation[]> {
  const finalConfig = { ...DEFAULT_FLIP_CONFIG, ...config };
  const animations: Animation[] = [];

  for (const [element, firstRect] of positions) {
    const lastRect = element.getBoundingClientRect();

    const dx = firstRect.left - lastRect.left;
    const dy = firstRect.top - lastRect.top;

    if (Math.abs(dx) < finalConfig.threshold && Math.abs(dy) < finalConfig.threshold) {
      continue;
    }

    const animation = element.animate(
      [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
      {
        duration: finalConfig.duration,
        easing: finalConfig.easing,
        fill: 'backwards',
      }
    );

    animations.push(animation);
  }

  await Promise.all(animations.map((a) => a.finished.catch(() => {})));
  return animations;
}

/**
 * Creates a FLIP-enabled wrapper for list reordering
 */
export function createFlipList(
  container: HTMLElement,
  config?: FlipConfig
): {
  beforeUpdate: () => void;
  afterUpdate: () => Promise<void>;
  animate: (updateFn: () => void | Promise<void>) => Promise<void>;
} {
  const animator = new FlipAnimator(container, config);

  return {
    beforeUpdate: () => animator.first(),
    afterUpdate: () => animator.play(),
    animate: (updateFn) => animator.animate(updateFn),
  };
}

/**
 * Applies a FLIP ID to an element
 */
export function setFlipId(element: HTMLElement, id: string): void {
  element.setAttribute('data-flip-id', id);
}

/**
 * Gets the FLIP ID of an element
 */
export function getFlipId(element: HTMLElement): string | null {
  return element.getAttribute('data-flip-id');
}

/**
 * Prepares elements for FLIP by ensuring they have IDs
 */
export function prepareForFlip(elements: HTMLElement[], idPrefix: string = 'flip'): void {
  elements.forEach((element, index) => {
    if (!element.hasAttribute('data-flip-id')) {
      element.setAttribute('data-flip-id', `${idPrefix}-${index}`);
    }
  });
}
