/**
 * Animation & Streaming Utility
 * 
 * Streaming and animation capabilities for masonry grid:
 * - Staggered entry animations
 * - Layout shift animations (smooth position transitions)
 * - Streaming section placement
 * - Progressive reveal strategy
 * - Exit animation coordination
 * - Skeleton placeholder generation
 * - Animation queuing
 * - Interruptible animations
 * - Reduced motion support
 * - Animation performance metrics
 * 
 * @example
 * ```typescript
 * import { 
 *   AnimationOrchestrator,
 *   StreamingPlacer,
 *   createStaggeredEntry 
 * } from './animation-streaming.util';
 * 
 * const orchestrator = new AnimationOrchestrator();
 * orchestrator.animateEntry(sections);
 * orchestrator.animateLayoutShift(oldPositions, newPositions);
 * ```
 */

import { CardSection } from '../models/card.model';
import { SectionPlacement } from './layout-performance.util';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Animation timing function
 */
export type EasingFunction = 
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'spring'
  | 'bounce';

/**
 * Animation state
 */
export type AnimationState = 'idle' | 'entering' | 'exiting' | 'moving' | 'resizing';

/**
 * Section animation config
 */
export interface SectionAnimation {
  key: string;
  state: AnimationState;
  delay: number;
  duration: number;
  easing: EasingFunction;
  from?: { x?: number; y?: number; opacity?: number; scale?: number };
  to?: { x?: number; y?: number; opacity?: number; scale?: number };
  onComplete?: () => void;
}

/**
 * Animation orchestrator configuration
 */
export interface AnimationOrchestratorConfig {
  /** Base duration for animations (ms) */
  baseDuration: number;
  /** Delay between staggered items (ms) */
  staggerDelay: number;
  /** Maximum concurrent animations */
  maxConcurrent: number;
  /** Default easing function */
  defaultEasing: EasingFunction;
  /** Respect prefers-reduced-motion */
  respectReducedMotion: boolean;
  /** Enable GPU acceleration hints */
  enableGPUAcceleration: boolean;
}

/**
 * Default animation configuration
 */
export const DEFAULT_ANIMATION_CONFIG: AnimationOrchestratorConfig = {
  baseDuration: 300,
  staggerDelay: 50,
  maxConcurrent: 10,
  defaultEasing: 'ease-out',
  respectReducedMotion: true,
  enableGPUAcceleration: true,
};

/**
 * Streaming placement options
 */
export interface StreamingPlacementOptions {
  /** Delay before placing (for animation staging) */
  placementDelay?: number;
  /** Whether to animate entry */
  animateEntry?: boolean;
  /** Whether to animate layout shifts */
  animateShifts?: boolean;
  /** Batch size for processing */
  batchSize?: number;
}

/**
 * Skeleton placeholder config
 */
export interface SkeletonConfig {
  /** Number of placeholder sections */
  count: number;
  /** Base height for placeholders */
  baseHeight: number;
  /** Height variance (for visual variety) */
  heightVariance: number;
  /** Show pulsing animation */
  animate: boolean;
}

/**
 * Animation metrics
 */
export interface AnimationMetrics {
  totalAnimations: number;
  completedAnimations: number;
  droppedFrames: number;
  averageDuration: number;
  longestAnimation: number;
}

// ============================================================================
// ANIMATION UTILITIES
// ============================================================================

/**
 * Checks if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Converts easing function name to CSS value
 */
export function easingToCss(easing: EasingFunction): string {
  const easings: Record<EasingFunction, string> = {
    'linear': 'linear',
    'ease': 'ease',
    'ease-in': 'ease-in',
    'ease-out': 'ease-out',
    'ease-in-out': 'ease-in-out',
    'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  };
  return easings[easing] ?? 'ease-out';
}

/**
 * Creates staggered delays for entry animations
 */
export function createStaggeredDelays(
  count: number,
  baseDelay: number = 0,
  staggerDelay: number = 50,
  pattern: 'linear' | 'cascade' | 'random' = 'linear'
): number[] {
  const delays: number[] = [];
  
  for (let i = 0; i < count; i++) {
    switch (pattern) {
      case 'linear':
        delays.push(baseDelay + i * staggerDelay);
        break;
      case 'cascade':
        // Faster at start, slower at end
        delays.push(baseDelay + Math.pow(i, 0.8) * staggerDelay);
        break;
      case 'random':
        delays.push(baseDelay + Math.random() * staggerDelay * count);
        break;
    }
  }
  
  return delays;
}

// ============================================================================
// ANIMATION ORCHESTRATOR (Items 61, 62, 65)
// ============================================================================

/**
 * Coordinates animations across multiple sections
 */
export class AnimationOrchestrator {
  private readonly config: AnimationOrchestratorConfig;
  private activeAnimations: Map<string, SectionAnimation> = new Map();
  private animationQueue: SectionAnimation[] = [];
  private metrics: AnimationMetrics;
  private frameCount = 0;
  private lastFrameTime = 0;
  private reducedMotion: boolean;

  constructor(config: Partial<AnimationOrchestratorConfig> = {}) {
    this.config = { ...DEFAULT_ANIMATION_CONFIG, ...config };
    this.reducedMotion = this.config.respectReducedMotion && prefersReducedMotion();
    this.metrics = this.createInitialMetrics();
  }

  private createInitialMetrics(): AnimationMetrics {
    return {
      totalAnimations: 0,
      completedAnimations: 0,
      droppedFrames: 0,
      averageDuration: 0,
      longestAnimation: 0,
    };
  }

  /**
   * Animates entry of multiple sections with staggered timing
   */
  animateEntry(
    sections: Array<{ key: string; x: number; y: number }>,
    options?: {
      staggerPattern?: 'linear' | 'cascade' | 'random';
      direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
    }
  ): void {
    if (this.reducedMotion) {
      // Skip animation, just mark as complete
      return;
    }

    const delays = createStaggeredDelays(
      sections.length,
      0,
      this.config.staggerDelay,
      options?.staggerPattern ?? 'linear'
    );

    const direction = options?.direction ?? 'up';
    const offsets = this.getDirectionOffsets(direction);

    sections.forEach((section, index) => {
      const animation: SectionAnimation = {
        key: section.key,
        state: 'entering',
        delay: delays[index] ?? 0,
        duration: this.config.baseDuration,
        easing: this.config.defaultEasing,
        from: {
          x: section.x + (offsets.x ?? 0),
          y: section.y + (offsets.y ?? 0),
          opacity: direction === 'fade' ? 0 : 1,
          scale: direction === 'fade' ? 0.95 : 1,
        },
        to: {
          x: section.x,
          y: section.y,
          opacity: 1,
          scale: 1,
        },
      };

      this.queueAnimation(animation);
    });

    this.processQueue();
  }

  /**
   * Gets offset values for animation direction
   */
  private getDirectionOffsets(direction: string): { x?: number; y?: number } {
    switch (direction) {
      case 'up': return { y: 20 };
      case 'down': return { y: -20 };
      case 'left': return { x: 20 };
      case 'right': return { x: -20 };
      default: return {};
    }
  }

  /**
   * Animates layout shift (sections moving to new positions)
   */
  animateLayoutShift(
    oldPositions: SectionPlacement[],
    newPositions: SectionPlacement[]
  ): void {
    if (this.reducedMotion) return;

    const oldMap = new Map(oldPositions.map(p => [p.key, p]));

    for (const newPos of newPositions) {
      const oldPos = oldMap.get(newPos.key);
      
      if (!oldPos) {
        // New section - animate entry
        this.queueAnimation({
          key: newPos.key,
          state: 'entering',
          delay: 0,
          duration: this.config.baseDuration,
          easing: this.config.defaultEasing,
          from: { opacity: 0, scale: 0.9 },
          to: { x: newPos.x, y: newPos.y, opacity: 1, scale: 1 },
        });
        continue;
      }

      // Check if position changed
      const hasMoved = oldPos.x !== newPos.x || oldPos.y !== newPos.y;
      const hasResized = oldPos.width !== newPos.width || oldPos.height !== newPos.height;

      if (hasMoved || hasResized) {
        this.queueAnimation({
          key: newPos.key,
          state: hasMoved ? 'moving' : 'resizing',
          delay: 0,
          duration: this.config.baseDuration,
          easing: 'ease-in-out',
          from: { x: oldPos.x, y: oldPos.y },
          to: { x: newPos.x, y: newPos.y },
        });
      }
    }

    // Handle removed sections
    const newKeys = new Set(newPositions.map(p => p.key));
    for (const oldPos of oldPositions) {
      if (!newKeys.has(oldPos.key)) {
        this.queueAnimation({
          key: oldPos.key,
          state: 'exiting',
          delay: 0,
          duration: this.config.baseDuration * 0.8,
          easing: 'ease-in',
          from: { x: oldPos.x, y: oldPos.y, opacity: 1, scale: 1 },
          to: { opacity: 0, scale: 0.9 },
        });
      }
    }

    this.processQueue();
  }

  /**
   * Animates exit of sections
   */
  animateExit(
    sections: Array<{ key: string; x: number; y: number }>,
    options?: {
      direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
      staggerDelay?: number;
    }
  ): Promise<void> {
    return new Promise(resolve => {
      if (this.reducedMotion || sections.length === 0) {
        resolve();
        return;
      }

      const direction = options?.direction ?? 'fade';
      const offsets = this.getDirectionOffsets(direction);
      let completed = 0;

      sections.forEach((section, index) => {
        this.queueAnimation({
          key: section.key,
          state: 'exiting',
          delay: index * (options?.staggerDelay ?? 30),
          duration: this.config.baseDuration * 0.8,
          easing: 'ease-in',
          from: { x: section.x, y: section.y, opacity: 1 },
          to: {
            x: section.x + (offsets.x ?? 0),
            y: section.y + (offsets.y ?? 0),
            opacity: 0,
          },
          onComplete: () => {
            completed++;
            if (completed === sections.length) {
              resolve();
            }
          },
        });
      });

      this.processQueue();
    });
  }

  /**
   * Queues an animation
   */
  private queueAnimation(animation: SectionAnimation): void {
    // Cancel any existing animation for this key
    if (this.activeAnimations.has(animation.key)) {
      this.cancelAnimation(animation.key);
    }
    this.animationQueue.push(animation);
    this.metrics.totalAnimations++;
  }

  /**
   * Processes the animation queue
   */
  private processQueue(): void {
    while (
      this.animationQueue.length > 0 &&
      this.activeAnimations.size < this.config.maxConcurrent
    ) {
      const animation = this.animationQueue.shift();
      if (animation) {
        this.startAnimation(animation);
      }
    }
  }

  /**
   * Starts an animation
   */
  private startAnimation(animation: SectionAnimation): void {
    this.activeAnimations.set(animation.key, animation);

    // Schedule with delay
    setTimeout(() => {
      // Animation would be applied via CSS or WAAPI
      // Here we just track timing
      setTimeout(() => {
        this.completeAnimation(animation.key);
      }, animation.duration);
    }, animation.delay);
  }

  /**
   * Completes an animation
   */
  private completeAnimation(key: string): void {
    const animation = this.activeAnimations.get(key);
    if (animation) {
      animation.onComplete?.();
      this.activeAnimations.delete(key);
      this.metrics.completedAnimations++;
      this.processQueue();
    }
  }

  /**
   * Cancels an animation
   */
  cancelAnimation(key: string): void {
    this.activeAnimations.delete(key);
    this.animationQueue = this.animationQueue.filter(a => a.key !== key);
  }

  /**
   * Cancels all animations
   */
  cancelAll(): void {
    this.activeAnimations.clear();
    this.animationQueue = [];
  }

  /**
   * Gets CSS for an animation
   */
  getAnimationCSS(animation: SectionAnimation): string {
    const { from, to, duration, delay, easing } = animation;
    const easingCss = easingToCss(easing);
    
    const transform: string[] = [];
    if (from?.x !== undefined && to?.x !== undefined) {
      transform.push(`translateX(${to.x - (from.x ?? to.x)}px)`);
    }
    if (from?.y !== undefined && to?.y !== undefined) {
      transform.push(`translateY(${to.y - (from.y ?? to.y)}px)`);
    }
    if (from?.scale !== undefined) {
      transform.push(`scale(${from.scale})`);
    }

    return `
      transform: ${transform.join(' ') || 'none'};
      opacity: ${from?.opacity ?? 1};
      transition: transform ${duration}ms ${easingCss} ${delay}ms,
                  opacity ${duration}ms ${easingCss} ${delay}ms;
      ${this.config.enableGPUAcceleration ? 'will-change: transform, opacity;' : ''}
    `;
  }

  /**
   * Gets animation metrics
   */
  getMetrics(): AnimationMetrics {
    return { ...this.metrics };
  }
}

// ============================================================================
// STREAMING PLACER (Item 63)
// ============================================================================

/**
 * Places sections as they stream in, with smooth integration
 */
export class StreamingPlacer {
  private sections: CardSection[] = [];
  private placements: SectionPlacement[] = [];
  private readonly columns: number;
  private readonly gap: number;
  private columnHeights: number[];
  private processingQueue: CardSection[] = [];
  private isProcessing = false;
  private onPlacement: ((placement: SectionPlacement) => void) | null = null;

  constructor(
    columns: number,
    gap: number = 12,
    options?: StreamingPlacementOptions
  ) {
    this.columns = columns;
    this.gap = gap;
    this.columnHeights = new Array(columns).fill(0);
  }

  /**
   * Adds a section to the stream
   */
  addSection(section: CardSection, height: number): SectionPlacement {
    this.sections.push(section);
    
    const span = Math.min(section.colSpan ?? 1, this.columns);
    
    // Find best column
    let bestCol = 0;
    let minHeight = Infinity;
    
    for (let col = 0; col <= this.columns - span; col++) {
      let maxH = 0;
      for (let c = col; c < col + span; c++) {
        maxH = Math.max(maxH, this.columnHeights[c] ?? 0);
      }
      if (maxH < minHeight) {
        minHeight = maxH;
        bestCol = col;
      }
    }
    
    const placement: SectionPlacement = {
      key: section.id ?? section.title ?? `section-${this.sections.length}`,
      x: bestCol,
      y: minHeight,
      width: span,
      height,
    };
    
    // Update column heights
    const newHeight = minHeight + height + this.gap;
    for (let c = bestCol; c < bestCol + span; c++) {
      this.columnHeights[c] = newHeight;
    }
    
    this.placements.push(placement);
    this.onPlacement?.(placement);
    
    return placement;
  }

  /**
   * Adds multiple sections in batch
   */
  async addSectionsBatch(
    sectionsWithHeights: Array<{ section: CardSection; height: number }>,
    delayBetween: number = 0
  ): Promise<SectionPlacement[]> {
    const placements: SectionPlacement[] = [];
    
    for (const { section, height } of sectionsWithHeights) {
      const placement = this.addSection(section, height);
      placements.push(placement);
      
      if (delayBetween > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetween));
      }
    }
    
    return placements;
  }

  /**
   * Sets callback for new placements
   */
  onNewPlacement(callback: (placement: SectionPlacement) => void): void {
    this.onPlacement = callback;
  }

  /**
   * Gets all placements
   */
  getPlacements(): SectionPlacement[] {
    return [...this.placements];
  }

  /**
   * Gets total height
   */
  getTotalHeight(): number {
    return Math.max(...this.columnHeights, 0);
  }

  /**
   * Resets the placer
   */
  reset(): void {
    this.sections = [];
    this.placements = [];
    this.columnHeights = new Array(this.columns).fill(0);
  }
}

// ============================================================================
// PROGRESSIVE REVEAL (Item 64)
// ============================================================================

/**
 * Progressive reveal strategy for gradual content display
 */
export class ProgressiveReveal {
  private revealed: Set<string> = new Set();
  private revealQueue: string[] = [];
  private isRevealing = false;
  private onReveal: ((key: string) => void) | null = null;

  /**
   * Queues sections for progressive reveal
   */
  queueForReveal(keys: string[]): void {
    this.revealQueue.push(...keys.filter(k => !this.revealed.has(k)));
  }

  /**
   * Starts progressive reveal
   */
  async startReveal(options?: {
    batchSize?: number;
    intervalMs?: number;
  }): Promise<void> {
    if (this.isRevealing) return;
    
    this.isRevealing = true;
    const batchSize = options?.batchSize ?? 3;
    const interval = options?.intervalMs ?? 100;

    while (this.revealQueue.length > 0) {
      const batch = this.revealQueue.splice(0, batchSize);
      
      for (const key of batch) {
        this.revealed.add(key);
        this.onReveal?.(key);
      }
      
      if (this.revealQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    this.isRevealing = false;
  }

  /**
   * Sets callback for reveals
   */
  onSectionReveal(callback: (key: string) => void): void {
    this.onReveal = callback;
  }

  /**
   * Checks if section is revealed
   */
  isRevealed(key: string): boolean {
    return this.revealed.has(key);
  }

  /**
   * Gets reveal progress (0-1)
   */
  getProgress(totalSections: number): number {
    return totalSections > 0 ? this.revealed.size / totalSections : 1;
  }

  /**
   * Resets reveal state
   */
  reset(): void {
    this.revealed.clear();
    this.revealQueue = [];
    this.isRevealing = false;
  }
}

// ============================================================================
// SKELETON PLACEHOLDERS (Item 66)
// ============================================================================

/**
 * Generates skeleton placeholder data
 */
export function generateSkeletonPlacements(
  config: SkeletonConfig,
  columns: number,
  gap: number = 12
): SectionPlacement[] {
  const placements: SectionPlacement[] = [];
  const columnHeights = new Array(columns).fill(0);
  
  for (let i = 0; i < config.count; i++) {
    // Randomize span and height for variety
    const span = Math.random() > 0.7 ? 2 : 1;
    const effectiveSpan = Math.min(span, columns);
    const height = config.baseHeight + 
      (Math.random() - 0.5) * 2 * config.heightVariance;
    
    // Find best column
    let bestCol = 0;
    let minHeight = Infinity;
    
    for (let col = 0; col <= columns - effectiveSpan; col++) {
      let maxH = 0;
      for (let c = col; c < col + effectiveSpan; c++) {
        maxH = Math.max(maxH, columnHeights[c] ?? 0);
      }
      if (maxH < minHeight) {
        minHeight = maxH;
        bestCol = col;
      }
    }
    
    placements.push({
      key: `skeleton-${i}`,
      x: bestCol,
      y: minHeight,
      width: effectiveSpan,
      height: Math.round(height),
    });
    
    const newHeight = minHeight + height + gap;
    for (let c = bestCol; c < bestCol + effectiveSpan; c++) {
      columnHeights[c] = newHeight;
    }
  }
  
  return placements;
}

/**
 * Generates CSS for skeleton animation
 */
export function generateSkeletonCSS(animate: boolean = true): string {
  if (!animate) {
    return `
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    `;
  }
  
  return `
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.5s infinite;
    
    @keyframes skeleton-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
}

// ============================================================================
// ANIMATION QUEUE (Item 67)
// ============================================================================

/**
 * Queue for coordinating sequential animations
 */
export class AnimationQueue {
  private queue: Array<() => Promise<void>> = [];
  private isRunning = false;
  private aborted = false;

  /**
   * Adds animation to queue
   */
  enqueue(animation: () => Promise<void>): void {
    this.queue.push(animation);
    this.run();
  }

  /**
   * Runs the queue
   */
  private async run(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    while (this.queue.length > 0 && !this.aborted) {
      const animation = this.queue.shift();
      if (animation) {
        await animation();
      }
    }
    
    this.isRunning = false;
  }

  /**
   * Aborts all pending animations
   */
  abort(): void {
    this.aborted = true;
    this.queue = [];
  }

  /**
   * Resets abort flag
   */
  reset(): void {
    this.aborted = false;
  }

  /**
   * Gets queue size
   */
  get size(): number {
    return this.queue.length;
  }
}

// ============================================================================
// INTERRUPTIBLE ANIMATIONS (Item 68)
// ============================================================================

/**
 * Manages interruptible animations using Web Animations API
 */
export class InterruptibleAnimation {
  private animations: Map<string, Animation> = new Map();

  /**
   * Starts an interruptible animation
   */
  start(
    key: string,
    element: HTMLElement,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions
  ): Animation {
    // Cancel existing animation
    this.cancel(key);
    
    const animation = element.animate(keyframes, options);
    this.animations.set(key, animation);
    
    animation.onfinish = () => {
      this.animations.delete(key);
    };
    
    return animation;
  }

  /**
   * Cancels an animation
   */
  cancel(key: string): void {
    const animation = this.animations.get(key);
    if (animation) {
      animation.cancel();
      this.animations.delete(key);
    }
  }

  /**
   * Pauses an animation
   */
  pause(key: string): void {
    this.animations.get(key)?.pause();
  }

  /**
   * Resumes an animation
   */
  resume(key: string): void {
    this.animations.get(key)?.play();
  }

  /**
   * Cancels all animations
   */
  cancelAll(): void {
    for (const animation of this.animations.values()) {
      animation.cancel();
    }
    this.animations.clear();
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Creates staggered entry animation CSS
 */
export function createStaggeredEntryCSS(
  index: number,
  staggerDelay: number = 50,
  duration: number = 300,
  direction: 'up' | 'down' | 'fade' = 'up'
): string {
  const delay = index * staggerDelay;
  const transform = direction === 'up' ? 'translateY(20px)' : 
                    direction === 'down' ? 'translateY(-20px)' : 'none';
  
  return `
    opacity: 0;
    transform: ${transform};
    animation: section-enter ${duration}ms ease-out ${delay}ms forwards;
    
    @keyframes section-enter {
      to {
        opacity: 1;
        transform: none;
      }
    }
  `;
}

/**
 * Creates a simple animation helper
 */
export function animateElement(
  element: HTMLElement,
  from: { x?: number; y?: number; opacity?: number; scale?: number },
  to: { x?: number; y?: number; opacity?: number; scale?: number },
  duration: number = 300,
  easing: EasingFunction = 'ease-out'
): Promise<void> {
  return new Promise(resolve => {
    const keyframes: Keyframe[] = [
      {
        transform: `translate(${from.x ?? 0}px, ${from.y ?? 0}px) scale(${from.scale ?? 1})`,
        opacity: from.opacity ?? 1,
      },
      {
        transform: `translate(${to.x ?? 0}px, ${to.y ?? 0}px) scale(${to.scale ?? 1})`,
        opacity: to.opacity ?? 1,
      },
    ];
    
    const animation = element.animate(keyframes, {
      duration,
      easing: easingToCss(easing),
      fill: 'forwards',
    });
    
    animation.onfinish = () => resolve();
  });
}

