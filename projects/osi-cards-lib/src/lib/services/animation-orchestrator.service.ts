/**
 * Animation Orchestrator Service
 *
 * Centralized service to coordinate animation sequences.
 * Manages section entrance animations, field reveals, chart animations,
 * and streaming layout transitions.
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class MyComponent {
 *   private orchestrator = inject(AnimationOrchestratorService);
 *
 *   async animateCardEntrance(card: CardElement) {
 *     await this.orchestrator.orchestrate('card-entrance', card);
 *   }
 * }
 * ```
 */

import { Injectable, OnDestroy, inject } from '@angular/core';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { takeUntil, filter, first } from 'rxjs/operators';
import {
  AnimationController,
  AnimationDefinition,
  fadeIn,
  slideUp,
  scaleIn,
  staggerAnimate,
  StaggerConfig,
} from '../utils/web-animations.util';
import { FlipAnimator } from '../utils/flip-animation.util';
import { onReducedMotionChange } from '../utils/masonry-detection.util';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Animation sequence names
 */
export type AnimationSequence =
  | 'card-entrance'
  | 'section-reveal'
  | 'fields-populate'
  | 'items-stagger'
  | 'chart-animate'
  | 'streaming-update'
  | 'layout-transition'
  | 'section-complete'
  | 'card-exit';

/**
 * Animation sequence step
 */
export interface AnimationStep {
  name: string;
  target: HTMLElement | HTMLElement[];
  animation: AnimationDefinition | ((el: HTMLElement) => AnimationDefinition);
  stagger?: StaggerConfig;
  delay?: number;
  parallel?: boolean;
  skipIf?: () => boolean;
}

/**
 * Animation sequence definition
 */
export interface AnimationSequenceDefinition {
  name: AnimationSequence;
  steps: AnimationStep[];
  onStart?: () => void;
  onComplete?: () => void;
  onStepComplete?: (stepName: string) => void;
}

/**
 * Orchestrator state
 */
export interface OrchestratorState {
  isAnimating: boolean;
  currentSequence: AnimationSequence | null;
  currentStep: string | null;
  queueLength: number;
  reducedMotion: boolean;
  globalSpeed: number;
}

/**
 * Animation orchestrator preset definition
 * (Different from the top-level AnimationPreset type in providers)
 */
export interface OrchestratorAnimationPreset {
  name: string;
  sequence: Omit<AnimationSequenceDefinition, 'name'>;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: 'root',
})
export class AnimationOrchestratorService implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  // State management
  private readonly _state = new BehaviorSubject<OrchestratorState>({
    isAnimating: false,
    currentSequence: null,
    currentStep: null,
    queueLength: 0,
    reducedMotion: false,
    globalSpeed: 1,
  });
  readonly state$ = this._state.asObservable();

  // Animation queue
  private animationQueue: Array<{
    sequence: AnimationSequenceDefinition;
    resolve: () => void;
    reject: (error: Error) => void;
  }> = [];

  private isProcessing = false;
  private activeAnimations: Animation[] = [];
  private flipAnimators = new Map<HTMLElement, FlipAnimator>();

  // Registered presets
  private presets = new Map<string, AnimationSequenceDefinition>();

  // Reduced motion cleanup
  private reducedMotionCleanup: (() => void) | null = null;

  constructor() {
    this.setupReducedMotionListener();
    this.registerDefaultPresets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cancelAll();
    this.reducedMotionCleanup?.();
    this.flipAnimators.forEach((f) => f.cancelAll());
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Orchestrates an animation sequence
   */
  async orchestrate(
    sequenceName: AnimationSequence | string,
    target: HTMLElement,
    options?: {
      delay?: number;
      speed?: number;
      skipSteps?: string[];
    }
  ): Promise<void> {
    // Check for reduced motion
    if (this._state.value.reducedMotion) {
      return this.runReducedMotionFallback(sequenceName, target);
    }

    const preset = this.presets.get(sequenceName);
    if (!preset) {
      console.warn(`Animation sequence "${sequenceName}" not found`);
      return;
    }

    const sequence: AnimationSequenceDefinition = {
      ...preset,
      name: sequenceName as AnimationSequence,
    };

    // Apply options
    if (options?.skipSteps) {
      sequence.steps = sequence.steps.filter((s) => !options.skipSteps?.includes(s.name));
    }

    return this.queueSequence(sequence, target, options);
  }

  /**
   * Plays a custom animation sequence
   */
  async playSequence(sequence: AnimationSequenceDefinition): Promise<void> {
    if (this._state.value.reducedMotion) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.animationQueue.push({ sequence, resolve, reject });
      this.updateQueueLength();
      this.processQueue();
    });
  }

  /**
   * Animates layout transitions using FLIP
   */
  async animateLayoutChange(
    container: HTMLElement,
    updateFn: () => void | Promise<void>
  ): Promise<void> {
    if (this._state.value.reducedMotion) {
      await updateFn();
      return;
    }

    let animator = this.flipAnimators.get(container);
    if (!animator) {
      animator = new FlipAnimator(container, {
        duration: this.adjustDuration(300),
        selector: '[data-flip-id], .masonry-section',
        idAttribute: 'data-flip-id',
      });
      this.flipAnimators.set(container, animator);
    }

    await animator.animate(updateFn);
  }

  /**
   * Registers a custom animation preset
   */
  registerPreset(preset: OrchestratorAnimationPreset): void {
    this.presets.set(preset.name, {
      name: preset.name as AnimationSequence,
      ...preset.sequence,
    });
  }

  /**
   * Sets global animation speed multiplier
   */
  setGlobalSpeed(speed: number): void {
    this.updateState({ globalSpeed: Math.max(0.1, Math.min(3, speed)) });
  }

  /**
   * Gets current animation state
   */
  getState(): OrchestratorState {
    return this._state.value;
  }

  /**
   * Waits for all animations to complete
   */
  async waitForCompletion(): Promise<void> {
    if (!this._state.value.isAnimating) return;

    return new Promise((resolve) => {
      this.state$
        .pipe(
          filter((state) => !state.isAnimating),
          first(),
          takeUntil(this.destroy$)
        )
        .subscribe(() => resolve());
    });
  }

  /**
   * Cancels all animations
   */
  cancelAll(): void {
    for (const animation of this.activeAnimations) {
      animation.cancel();
    }
    this.activeAnimations = [];

    // Reject queued sequences
    for (const queued of this.animationQueue) {
      queued.reject(new Error('Animation cancelled'));
    }
    this.animationQueue = [];

    this.isProcessing = false;
    this.updateState({
      isAnimating: false,
      currentSequence: null,
      currentStep: null,
      queueLength: 0,
    });
  }

  /**
   * Pauses all active animations
   */
  pauseAll(): void {
    for (const animation of this.activeAnimations) {
      if (animation.playState === 'running') {
        animation.pause();
      }
    }
  }

  /**
   * Resumes all paused animations
   */
  resumeAll(): void {
    for (const animation of this.activeAnimations) {
      if (animation.playState === 'paused') {
        animation.play();
      }
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private setupReducedMotionListener(): void {
    this.reducedMotionCleanup = onReducedMotionChange((prefersReduced) => {
      this.updateState({ reducedMotion: prefersReduced });
      if (prefersReduced) {
        this.cancelAll();
      }
    });
  }

  private registerDefaultPresets(): void {
    // Card entrance animation
    this.presets.set('card-entrance', {
      name: 'card-entrance',
      steps: [
        {
          name: 'card-fade',
          target: [] as HTMLElement[], // Will be set dynamically
          animation: fadeIn({ duration: 200 }),
        },
        {
          name: 'sections-stagger',
          target: [] as HTMLElement[],
          animation: slideUp(15, { duration: 250 }),
          stagger: { delay: 50, curve: 'ease-out' },
          delay: 100,
        },
      ],
    });

    // Section reveal animation
    this.presets.set('section-reveal', {
      name: 'section-reveal',
      steps: [
        {
          name: 'section-enter',
          target: [] as HTMLElement[],
          animation: scaleIn(0.98, { duration: 200 }),
        },
        {
          name: 'fields-populate',
          target: [] as HTMLElement[],
          animation: fadeIn({ duration: 150 }),
          stagger: { delay: 30 },
          delay: 50,
        },
      ],
    });

    // Streaming update animation
    this.presets.set('streaming-update', {
      name: 'streaming-update',
      steps: [
        {
          name: 'content-fade',
          target: [] as HTMLElement[],
          animation: fadeIn({ duration: 100 }),
        },
      ],
    });

    // Section complete animation
    this.presets.set('section-complete', {
      name: 'section-complete',
      steps: [
        {
          name: 'highlight',
          target: [] as HTMLElement[],
          animation: {
            keyframes: [
              { backgroundColor: 'transparent' },
              { backgroundColor: 'rgba(var(--accent-rgb, 99, 102, 241), 0.1)' },
              { backgroundColor: 'transparent' },
            ],
            timing: { duration: 400, easing: 'ease-out' },
          },
        },
      ],
    });

    // Items stagger animation
    this.presets.set('items-stagger', {
      name: 'items-stagger',
      steps: [
        {
          name: 'items-enter',
          target: [] as HTMLElement[],
          animation: slideUp(10, { duration: 200 }),
          stagger: { delay: 40, curve: 'ease-out' },
        },
      ],
    });

    // Layout transition (placeholder - uses FLIP)
    this.presets.set('layout-transition', {
      name: 'layout-transition',
      steps: [],
    });
  }

  private async queueSequence(
    sequence: AnimationSequenceDefinition,
    target: HTMLElement,
    options?: { delay?: number; speed?: number }
  ): Promise<void> {
    // Prepare sequence with actual targets
    const preparedSequence = this.prepareSequence(sequence, target);

    if (options?.delay) {
      await new Promise((resolve) => setTimeout(resolve, options.delay));
    }

    return new Promise((resolve, reject) => {
      this.animationQueue.push({ sequence: preparedSequence, resolve, reject });
      this.updateQueueLength();
      this.processQueue();
    });
  }

  private prepareSequence(
    sequence: AnimationSequenceDefinition,
    target: HTMLElement
  ): AnimationSequenceDefinition {
    const preparedSteps = sequence.steps.map((step) => {
      // If target is empty array, find elements in the provided target
      if (Array.isArray(step.target) && step.target.length === 0) {
        const selector = this.getDefaultSelector(step.name);
        const elements = target.querySelectorAll(selector);
        return {
          ...step,
          target: elements.length > 0 ? (Array.from(elements) as HTMLElement[]) : [target],
        };
      }
      return step;
    });

    return { ...sequence, steps: preparedSteps };
  }

  private getDefaultSelector(stepName: string): string {
    const selectors: Record<string, string> = {
      'card-fade': '.ai-card, .masonry-section',
      'sections-stagger': '.masonry-section',
      'section-enter': '.masonry-section',
      'fields-populate': '.field-row, .card-field',
      'items-enter': '.card-item, .item-row',
      'content-fade': '.section-content',
      highlight: '.masonry-section',
    };
    return selectors[stepName] ?? '*';
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.animationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.animationQueue.length > 0) {
      const { sequence, resolve, reject } = this.animationQueue.shift()!;

      try {
        await this.executeSequence(sequence);
        resolve();
      } catch (error) {
        reject(error as Error);
      }

      this.updateQueueLength();
    }

    this.isProcessing = false;
    this.updateState({
      isAnimating: false,
      currentSequence: null,
      currentStep: null,
    });
  }

  private async executeSequence(sequence: AnimationSequenceDefinition): Promise<void> {
    this.updateState({
      isAnimating: true,
      currentSequence: sequence.name,
    });

    sequence.onStart?.();

    let parallelGroup: Promise<void>[] = [];

    for (const step of sequence.steps) {
      // Check skip condition
      if (step.skipIf?.()) {
        continue;
      }

      this.updateState({ currentStep: step.name });

      // Apply delay
      if (step.delay && !step.parallel) {
        await new Promise((resolve) => setTimeout(resolve, this.adjustDuration(step.delay!)));
      }

      const stepPromise = this.executeStep(step);

      if (step.parallel) {
        parallelGroup.push(stepPromise);
      } else {
        // Wait for parallel group to complete
        if (parallelGroup.length > 0) {
          await Promise.all(parallelGroup);
          parallelGroup = [];
        }
        await stepPromise;
      }

      sequence.onStepComplete?.(step.name);
    }

    // Wait for any remaining parallel animations
    if (parallelGroup.length > 0) {
      await Promise.all(parallelGroup);
    }

    sequence.onComplete?.();
  }

  private async executeStep(step: AnimationStep): Promise<void> {
    const targets = Array.isArray(step.target) ? step.target : [step.target];

    if (targets.length === 0) {
      return;
    }

    const getAnimation = (el: HTMLElement): AnimationDefinition => {
      if (typeof step.animation === 'function') {
        return step.animation(el);
      }
      return step.animation;
    };

    // Adjust timing based on global speed
    const adjustedAnimation = (el: HTMLElement): AnimationDefinition => {
      const anim = getAnimation(el);
      return {
        ...anim,
        timing: {
          ...anim.timing,
          duration: this.adjustDuration((anim.timing.duration as number) ?? 300),
        },
      };
    };

    if (step.stagger && targets.length > 1) {
      const animations = await staggerAnimate(targets, adjustedAnimation(targets[0]!), {
        ...step.stagger,
        delay: this.adjustDuration(step.stagger.delay),
      });
      this.activeAnimations.push(...animations);
    } else {
      const animations = targets.map((target) => {
        const anim = target.animate(
          adjustedAnimation(target).keyframes,
          adjustedAnimation(target).timing
        );
        this.activeAnimations.push(anim);
        return anim.finished;
      });
      await Promise.all(animations.map((p) => p.catch(() => {})));
    }
  }

  private adjustDuration(duration: number): number {
    return duration / this._state.value.globalSpeed;
  }

  private async runReducedMotionFallback(sequenceName: string, target: HTMLElement): Promise<void> {
    // For reduced motion, just make elements visible instantly
    const elements = target.querySelectorAll('.masonry-section, .card-field, .card-item');
    elements.forEach((el) => {
      (el as HTMLElement).style.opacity = '1';
      (el as HTMLElement).style.transform = 'none';
    });
  }

  private updateState(partial: Partial<OrchestratorState>): void {
    this._state.next({ ...this._state.value, ...partial });
  }

  private updateQueueLength(): void {
    this.updateState({ queueLength: this.animationQueue.length });
  }
}
