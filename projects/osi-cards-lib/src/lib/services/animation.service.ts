/**
 * Consolidated Animation Service
 *
 * Merges functionality from:
 * - animation-orchestrator.service.ts (sequence orchestration)
 * - section-animation.service.ts (section-level animation tracking)
 *
 * Provides comprehensive animation management including:
 * - Animation sequence orchestration
 * - Section entrance animation tracking
 * - Streaming animation effects
 * - FLIP layout transitions
 * - Reduced motion support
 *
 * @example
 * ```typescript
 * import { AnimationService } from 'osi-cards-lib';
 *
 * const animation = inject(AnimationService);
 *
 * // Orchestrate a sequence
 * await animation.orchestrate('card-entrance', cardElement);
 *
 * // Track section animations
 * animation.markSectionEntering('section-1', 0);
 * if (animation.shouldAnimateSection('section-1')) {
 *   // Apply animation
 * }
 * ```
 */

import { Injectable, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
import { AnimationState } from '../types';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

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

export interface AnimationStep {
  name: string;
  target: HTMLElement | HTMLElement[];
  animation: AnimationDefinition | ((el: HTMLElement) => AnimationDefinition);
  stagger?: StaggerConfig;
  delay?: number;
  parallel?: boolean;
  skipIf?: () => boolean;
}

export interface AnimationSequenceDefinition {
  name: AnimationSequence;
  steps: AnimationStep[];
  onStart?: () => void;
  onComplete?: () => void;
  onStepComplete?: (stepName: string) => void;
}

export interface OrchestratorState {
  isAnimating: boolean;
  currentSequence: AnimationSequence | null;
  currentStep: string | null;
  queueLength: number;
  reducedMotion: boolean;
  globalSpeed: number;
}

export interface AnimationConfig {
  staggerDelayMs: number;
  entranceDurationMs: number;
  exitDurationMs: number;
  respectReducedMotion: boolean;
}

interface SectionAnimationState {
  state: AnimationState;
  timestamp: number;
  staggerIndex: number;
}

export interface OrchestratorAnimationPreset {
  name: string;
  sequence: Omit<AnimationSequenceDefinition, 'name'>;
}

export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  staggerDelayMs: 40,
  entranceDurationMs: 300,
  exitDurationMs: 200,
  respectReducedMotion: true,
};

// ============================================================================
// CONSOLIDATED SERVICE
// ============================================================================

@Injectable({
  providedIn: 'root'
})
export class AnimationService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroy$ = new Subject<void>();

  // ========== Orchestrator State ==========
  private readonly _state = new BehaviorSubject<OrchestratorState>({
    isAnimating: false,
    currentSequence: null,
    currentStep: null,
    queueLength: 0,
    reducedMotion: false,
    globalSpeed: 1,
  });
  readonly state$ = this._state.asObservable();

  private animationQueue: Array<{
    sequence: AnimationSequenceDefinition;
    resolve: () => void;
    reject: (error: Error) => void;
  }> = [];

  private isProcessing = false;
  private activeAnimations: Animation[] = [];
  private flipAnimators = new Map<HTMLElement, FlipAnimator>();
  private presets = new Map<string, AnimationSequenceDefinition>();

  // ========== Section Animation State ==========
  private config: AnimationConfig = { ...DEFAULT_ANIMATION_CONFIG };
  private readonly sectionStates = new Map<string, SectionAnimationState>();
  private readonly animatedSections = new Set<string>();
  private readonly pendingAnimations = new Set<string>();
  private readonly pendingTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  // ========== Reduced Motion ==========
  private prefersReducedMotion = false;
  private mediaQueryList?: MediaQueryList;
  private mediaQueryHandler?: (e: MediaQueryListEvent) => void;
  private reducedMotionCleanup: (() => void) | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.setupReducedMotionDetection();
    }
    this.registerDefaultPresets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cancelAll();
    this.cleanup();
    this.reducedMotionCleanup?.();
    this.flipAnimators.forEach(f => f.cancelAll());
  }

  // ============================================================================
  // ORCHESTRATION API
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

    if (options?.skipSteps) {
      sequence.steps = sequence.steps.filter(
        s => !options.skipSteps?.includes(s.name)
      );
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

    return new Promise(resolve => {
      this.state$.pipe(
        filter(state => !state.isAnimating),
        first(),
        takeUntil(this.destroy$)
      ).subscribe(() => resolve());
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
  // SECTION ANIMATION API
  // ============================================================================

  /**
   * Configure animation behavior
   */
  configure(config: Partial<AnimationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Mark a section as entering (starting animation)
   */
  markSectionEntering(key: string, staggerIndex: number): void {
    if (this.animatedSections.has(key)) {
      return;
    }

    const state: SectionAnimationState = {
      state: 'entering',
      timestamp: Date.now(),
      staggerIndex: Math.min(staggerIndex, 15),
    };

    this.sectionStates.set(key, state);
    this.pendingAnimations.add(key);
    this.scheduleAnimationComplete(key, staggerIndex);
  }

  /**
   * Mark a section's animation as complete
   */
  markSectionAnimated(key: string): void {
    this.animatedSections.add(key);
    this.pendingAnimations.delete(key);

    const current = this.sectionStates.get(key);
    if (current) {
      current.state = 'entered';
    }

    const timeout = this.pendingTimeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.pendingTimeouts.delete(key);
    }
  }

  /**
   * Check if a section should animate
   */
  shouldAnimateSection(key: string): boolean {
    if (this.config.respectReducedMotion && this.prefersReducedMotion) {
      return false;
    }

    if (this.animatedSections.has(key)) {
      return false;
    }

    const state = this.sectionStates.get(key);
    return state?.state === 'entering';
  }

  /**
   * Check if a section has completed its animation
   */
  hasSectionAnimated(key: string): boolean {
    return this.animatedSections.has(key);
  }

  /**
   * Get the animation state of a section
   */
  getSectionAnimationState(key: string): AnimationState {
    return this.sectionStates.get(key)?.state ?? 'none';
  }

  /**
   * Get CSS class for section animation
   */
  getSectionAnimationClass(key: string): string {
    const state = this.sectionStates.get(key);

    if (!state) return '';
    if (this.animatedSections.has(key)) return 'section-entered';

    switch (state.state) {
      case 'entering':
        return 'section-streaming';
      case 'entered':
        return 'section-entered';
      default:
        return '';
    }
  }

  /**
   * Get stagger delay for a section
   */
  getSectionStaggerDelay(key: string): number {
    const state = this.sectionStates.get(key);
    if (!state) return 0;
    return state.staggerIndex * this.config.staggerDelayMs;
  }

  /**
   * Reset all section animation states
   */
  resetAllSections(): void {
    for (const timeout of this.pendingTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.pendingTimeouts.clear();
    this.sectionStates.clear();
    this.animatedSections.clear();
    this.pendingAnimations.clear();
  }

  /**
   * Finalize all pending section animations
   */
  finalizeSectionAnimations(): void {
    for (const key of this.pendingAnimations) {
      this.markSectionAnimated(key);
    }
  }

  /**
   * Check if any section animations are pending
   */
  hasPendingSectionAnimations(): boolean {
    return this.pendingAnimations.size > 0;
  }

  /**
   * Get count of pending section animations
   */
  getPendingSectionCount(): number {
    return this.pendingAnimations.size;
  }

  /**
   * Calculate total section animation duration including stagger
   */
  calculateSectionDuration(staggerIndex: number): number {
    const staggerDelay = Math.min(staggerIndex, 15) * this.config.staggerDelayMs;
    return staggerDelay + this.config.entranceDurationMs;
  }

  // ============================================================================
  // REDUCED MOTION
  // ============================================================================

  /**
   * Check if reduced motion is preferred
   */
  get isPrefersReducedMotion(): boolean {
    return this.prefersReducedMotion || this._state.value.reducedMotion;
  }

  // ============================================================================
  // PRIVATE METHODS - ORCHESTRATOR
  // ============================================================================

  private registerDefaultPresets(): void {
    this.presets.set('card-entrance', {
      name: 'card-entrance',
      steps: [
        {
          name: 'card-fade',
          target: [] as HTMLElement[],
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
    const preparedSequence = this.prepareSequence(sequence, target);

    if (options?.delay) {
      await new Promise(resolve => setTimeout(resolve, options.delay));
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
    const preparedSteps = sequence.steps.map(step => {
      if (Array.isArray(step.target) && step.target.length === 0) {
        const selector = this.getDefaultSelector(step.name);
        const elements = target.querySelectorAll(selector);
        return {
          ...step,
          target: elements.length > 0 ? Array.from(elements) as HTMLElement[] : [target],
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
      'highlight': '.masonry-section',
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
      if (step.skipIf?.()) {
        continue;
      }

      this.updateState({ currentStep: step.name });

      if (step.delay && !step.parallel) {
        await new Promise(resolve => setTimeout(resolve, this.adjustDuration(step.delay!)));
      }

      const stepPromise = this.executeStep(step);

      if (step.parallel) {
        parallelGroup.push(stepPromise);
      } else {
        if (parallelGroup.length > 0) {
          await Promise.all(parallelGroup);
          parallelGroup = [];
        }
        await stepPromise;
      }

      sequence.onStepComplete?.(step.name);
    }

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

    const adjustedAnimation = (el: HTMLElement): AnimationDefinition => {
      const anim = getAnimation(el);
      return {
        ...anim,
        timing: {
          ...anim.timing,
          duration: this.adjustDuration(anim.timing.duration as number ?? 300),
        },
      };
    };

    if (step.stagger && targets.length > 1) {
      const animations = await staggerAnimate(
        targets,
        adjustedAnimation(targets[0]!),
        {
          ...step.stagger,
          delay: this.adjustDuration(step.stagger.delay),
        }
      );
      this.activeAnimations.push(...animations);
    } else {
      const animations = targets.map(target => {
        const anim = target.animate(
          adjustedAnimation(target).keyframes,
          adjustedAnimation(target).timing
        );
        this.activeAnimations.push(anim);
        return anim.finished;
      });
      await Promise.all(animations.map(p => p.catch(() => {})));
    }
  }

  private adjustDuration(duration: number): number {
    return duration / this._state.value.globalSpeed;
  }

  private async runReducedMotionFallback(
    sequenceName: string,
    target: HTMLElement
  ): Promise<void> {
    const elements = target.querySelectorAll('.masonry-section, .card-field, .card-item');
    elements.forEach(el => {
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

  // ============================================================================
  // PRIVATE METHODS - SECTION ANIMATION
  // ============================================================================

  private scheduleAnimationComplete(key: string, staggerIndex: number): void {
    const existing = this.pendingTimeouts.get(key);
    if (existing) {
      clearTimeout(existing);
    }

    const totalDelay = this.calculateSectionDuration(staggerIndex);

    const timeout = setTimeout(() => {
      this.markSectionAnimated(key);
      this.pendingTimeouts.delete(key);
    }, totalDelay);

    this.pendingTimeouts.set(key, timeout);
  }

  private setupReducedMotionDetection(): void {
    if (typeof window === 'undefined') return;

    // Setup orchestrator listener
    this.reducedMotionCleanup = onReducedMotionChange(prefersReduced => {
      this.updateState({ reducedMotion: prefersReduced });
      if (prefersReduced) {
        this.cancelAll();
      }
    });

    // Setup section animation listener
    this.mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.prefersReducedMotion = this.mediaQueryList.matches;

    this.mediaQueryHandler = (e: MediaQueryListEvent) => {
      this.prefersReducedMotion = e.matches;
      this.updateState({ reducedMotion: e.matches });
    };

    this.mediaQueryList.addEventListener('change', this.mediaQueryHandler);
  }

  private cleanup(): void {
    for (const timeout of this.pendingTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.pendingTimeouts.clear();

    if (this.mediaQueryList && this.mediaQueryHandler) {
      this.mediaQueryList.removeEventListener('change', this.mediaQueryHandler);
    }

    this.sectionStates.clear();
    this.animatedSections.clear();
    this.pendingAnimations.clear();
  }
}

