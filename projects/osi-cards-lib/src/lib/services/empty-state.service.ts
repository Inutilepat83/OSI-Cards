/**
 * Empty State Service
 *
 * Manages the empty/loading state animations and messages for cards.
 * Extracted from AICardRendererComponent for better separation of concerns.
 *
 * @example
 * ```typescript
 * import { EmptyStateService } from 'osi-cards-lib';
 *
 * const emptyState = inject(EmptyStateService);
 *
 * // Set custom messages
 * emptyState.setMessages(['Loading...', 'Please wait...']);
 *
 * // Start message rotation
 * emptyState.startMessageRotation();
 *
 * // Get current message
 * emptyState.currentMessage$.subscribe(message => console.log(message));
 * ```
 */

import { Injectable, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Subject, interval, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Particle animation state
 */
export interface ParticleState {
  transform: string;
  opacity: number;
}

/**
 * Empty state configuration
 */
export interface EmptyStateConfig {
  /** Custom loading messages */
  messages?: string[];
  /** Message rotation interval in ms */
  rotationInterval?: number;
  /** Number of particles to generate */
  particleCount?: number;
  /** Enable parallax effect */
  enableParallax?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_LOADING_MESSAGES = [
  'Deepening into archives...',
  'Asking all 40,000 employees...',
  'Re-reading manifesto...',
  'Consulting the oracle...',
  'Checking under the couch...',
  'Asking ChatGPT for help...',
  'Brewing coffee first...',
  'Counting to infinity...',
  'Summoning the data spirits...',
  'Teaching AI to read minds...',
  'Searching parallel universes...',
  'Waiting for inspiration...',
  'Polishing crystal ball...',
  'Decoding ancient scrolls...',
  'Training neural networks...',
  'Consulting the stars...',
  'Asking Siri nicely...',
  'Reading tea leaves...',
  'Channeling inner wisdom...',
  'Waiting for the right moment...',
];

const DEFAULT_ROTATION_INTERVAL = 2500;
const DEFAULT_PARTICLE_COUNT = 8;

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: 'root',
})
export class EmptyStateService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroy$ = new Subject<void>();

  // Message state
  private messages: string[] = [...DEFAULT_LOADING_MESSAGES];
  private rotationInterval = DEFAULT_ROTATION_INTERVAL;
  private currentMessageIndex = 0;
  private readonly _currentMessage = new BehaviorSubject<string>(this.messages[0] ?? '');
  private readonly _messageIndex = new BehaviorSubject<number>(0);
  private isRotating = false;

  // Particle state
  private readonly _particles = new BehaviorSubject<ParticleState[]>([]);
  private particleCount = DEFAULT_PARTICLE_COUNT;

  // Parallax state
  private readonly _gradientTransform = new BehaviorSubject<string>('translate(-50%, -50%)');
  private readonly _contentTransform = new BehaviorSubject<string>('translate(0, 0)');

  /** Observable of current loading message */
  readonly currentMessage$ = this._currentMessage.asObservable();

  /** Observable of current message index (for animations) */
  readonly messageIndex$ = this._messageIndex.asObservable();

  /** Observable of particle states */
  readonly particles$ = this._particles.asObservable();

  /** Observable of gradient transform */
  readonly gradientTransform$ = this._gradientTransform.asObservable();

  /** Observable of content transform */
  readonly contentTransform$ = this._contentTransform.asObservable();

  constructor() {
    this.initializeParticles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  /**
   * Configure the empty state service
   */
  configure(config: EmptyStateConfig): void {
    if (config.messages?.length) {
      this.messages = [...config.messages];
      this._currentMessage.next(this.messages[0] ?? '');
    }

    if (config.rotationInterval) {
      this.rotationInterval = config.rotationInterval;
    }

    if (config.particleCount) {
      this.particleCount = config.particleCount;
      this.initializeParticles();
    }
  }

  /**
   * Set custom loading messages
   */
  setMessages(messages: string[]): void {
    if (messages.length === 0) return;
    this.messages = [...messages];
    this.currentMessageIndex = 0;
    this._currentMessage.next(this.messages[0] ?? '');
    this._messageIndex.next(0);
  }

  /**
   * Reset to default messages
   */
  resetMessages(): void {
    this.messages = [...DEFAULT_LOADING_MESSAGES];
    this.currentMessageIndex = 0;
    this._currentMessage.next(this.messages[0] ?? '');
    this._messageIndex.next(0);
  }

  // ============================================================================
  // MESSAGE ROTATION
  // ============================================================================

  /**
   * Start rotating loading messages
   */
  startMessageRotation(): void {
    if (this.isRotating) return;
    if (!isPlatformBrowser(this.platformId)) return;

    this.isRotating = true;

    // Shuffle messages for variety
    this.shuffleMessages();

    interval(this.rotationInterval)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.isRotating) {
          this.nextMessage();
        }
      });
  }

  /**
   * Stop rotating messages
   */
  stopMessageRotation(): void {
    this.isRotating = false;
  }

  /**
   * Get current message
   */
  getCurrentMessage(): string {
    return this._currentMessage.value;
  }

  /**
   * Get current message index
   */
  getMessageIndex(): number {
    return this._messageIndex.value;
  }

  /**
   * Move to next message
   */
  nextMessage(): void {
    this.currentMessageIndex = (this.currentMessageIndex + 1) % this.messages.length;
    this._currentMessage.next(this.messages[this.currentMessageIndex] ?? '');
    this._messageIndex.next(this.currentMessageIndex);
  }

  // ============================================================================
  // PARTICLE ANIMATIONS
  // ============================================================================

  /**
   * Get current particles
   */
  getParticles(): ParticleState[] {
    return this._particles.value;
  }

  /**
   * Update particle positions based on mouse movement
   */
  updateParticlePositions(
    mouseX: number,
    mouseY: number,
    containerWidth: number,
    containerHeight: number
  ): void {
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    const normalizedX = (mouseX - centerX) / centerX;
    const normalizedY = (mouseY - centerY) / centerY;

    const updatedParticles = this._particles.value.map((particle, index) => {
      const depth = 1 + (index % 3) * 0.5;
      const offsetX = normalizedX * 20 * depth;
      const offsetY = normalizedY * 20 * depth;

      return {
        transform: `translate(${offsetX}px, ${offsetY}px)`,
        opacity: 0.3 + Math.abs(normalizedX * normalizedY) * 0.3,
      };
    });

    this._particles.next(updatedParticles);
  }

  /**
   * Reset particle positions
   */
  resetParticlePositions(): void {
    const resetParticles = this._particles.value.map(() => ({
      transform: 'translate(0, 0)',
      opacity: 0.3,
    }));
    this._particles.next(resetParticles);
  }

  // ============================================================================
  // PARALLAX EFFECTS
  // ============================================================================

  /**
   * Update parallax transforms based on mouse position
   */
  updateParallax(
    mouseX: number,
    mouseY: number,
    containerWidth: number,
    containerHeight: number
  ): void {
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    const normalizedX = (mouseX - centerX) / centerX;
    const normalizedY = (mouseY - centerY) / centerY;

    // Gradient follows mouse
    const gradientX = normalizedX * 30;
    const gradientY = normalizedY * 30;
    this._gradientTransform.next(
      `translate(calc(-50% + ${gradientX}px), calc(-50% + ${gradientY}px))`
    );

    // Content has subtle inverse movement
    const contentX = -normalizedX * 5;
    const contentY = -normalizedY * 5;
    this._contentTransform.next(`translate(${contentX}px, ${contentY}px)`);
  }

  /**
   * Reset parallax transforms
   */
  resetParallax(): void {
    this._gradientTransform.next('translate(-50%, -50%)');
    this._contentTransform.next('translate(0, 0)');
  }

  // ============================================================================
  // SCROLL EFFECTS
  // ============================================================================

  /**
   * Update transforms based on scroll position
   */
  updateScrollEffect(scrollY: number): void {
    const scrollNormalized = Math.min(scrollY / 500, 1);
    const scale = 1 + scrollNormalized * 0.1;
    const opacity = 1 - scrollNormalized * 0.5;

    // Could emit scroll-based transforms if needed
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private initializeParticles(): void {
    const particles: ParticleState[] = [];

    for (let i = 0; i < this.particleCount; i++) {
      particles.push({
        transform: 'translate(0, 0)',
        opacity: 0.3,
      });
    }

    this._particles.next(particles);
  }

  private shuffleMessages(): void {
    // Fisher-Yates shuffle
    const array = [...this.messages];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i]!;
      array[i] = array[j]!;
      array[j] = temp;
    }
    this.messages = array;
  }
}
