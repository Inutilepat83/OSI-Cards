import { inject, Injectable, isDevMode, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface MousePosition {
  x: number;
  y: number;
}

export interface TiltCalculations {
  rotateY: number;
  rotateX: number;
  glowBlur: number;
  glowOpacity: number;
  reflectionOpacity: number;
}

// Constants
const BASE_GLOW_BLUR = 10;
const MAX_GLOW_BLUR_OFFSET = 5;
const BASE_GLOW_OPACITY = 0.25;
const MAX_GLOW_OPACITY_OFFSET = 0.2;
const MAX_REFLECTION_OPACITY = 0.25;
const MAX_TILT_DEGREES = 0.5;
const SQRT_2 = Math.sqrt(2); // Pre-calculated constant

// Performance tuning - Point 8: Increased from 0.08 to 0.18 for faster response
const SMOOTHING_SPEED = 12; // Used with exponential smoothing (higher = faster)
const RESET_DURATION_MS = 300; // Point 4: Reduced from 800ms to 300ms
const MAX_ANIMATION_DURATION_MS = 2000; // Point 27: Safety timeout
const FRAME_BUDGET_MS = 8; // Point 30: Skip frames if calculation takes too long
const DEBOUNCE_MS = 16; // Point 3: One frame debounce for state transitions

// Point 1: Animation State Machine
type AnimationState = 'idle' | 'tilting' | 'resetting';

// Point 26: Use WeakMap for element cache
interface ElementCache {
  rect: DOMRect;
  invWidth: number; // Point 9: Pre-cached inverse dimensions
  invHeight: number;
  lastUpdate: number;
}

@Injectable({
  providedIn: 'root',
})
export class MagneticTiltService implements OnDestroy {
  private readonly ngZone = inject(NgZone);

  // Observable for tilt calculations
  private tiltCalculationsSubject = new BehaviorSubject<TiltCalculations>({
    rotateY: 0,
    rotateX: 0,
    glowBlur: BASE_GLOW_BLUR,
    glowOpacity: BASE_GLOW_OPACITY,
    reflectionOpacity: 0,
  });
  tiltCalculations$ = this.tiltCalculationsSubject.asObservable();

  // Point 1: Animation state machine
  private animationState: AnimationState = 'idle';

  // Point 2: Single unified RAF loop
  private animationFrameId: number | null = null;
  private animationStartTime = 0;

  // Current and target values for smooth interpolation
  private currentRotateY = 0;
  private currentRotateX = 0;
  private currentGlowBlur = BASE_GLOW_BLUR;
  private currentGlowOpacity = BASE_GLOW_OPACITY;
  private currentReflectionOpacity = 0;

  private targetRotateY = 0;
  private targetRotateX = 0;
  private targetGlowBlur = BASE_GLOW_BLUR;
  private targetGlowOpacity = BASE_GLOW_OPACITY;
  private targetReflectionOpacity = 0;

  // Reset animation start values (for smooth reset interpolation)
  private resetStartRotateY = 0;
  private resetStartRotateX = 0;
  private resetStartGlowBlur = BASE_GLOW_BLUR;
  private resetStartGlowOpacity = BASE_GLOW_OPACITY;
  private resetStartReflectionOpacity = 0;

  // Point 26: WeakMap for element cache (allows garbage collection)
  private elementCache = new WeakMap<HTMLElement, ElementCache>();
  private readonly CACHE_DURATION = 100; // Reduced from 200ms for faster refresh

  // Point 3: Debounce tracking
  private lastStateChangeTime = 0;

  // Pending mouse update
  private pendingMousePosition: MousePosition | null = null;
  private pendingElement: HTMLElement | null = null;

  // Last frame timestamp for delta time calculation
  private lastFrameTime = 0;

  // Track last emitted values for change detection (Point 10)
  private lastEmittedCalculations: TiltCalculations | null = null;

  /**
   * Calculate tilt based on mouse position
   * Point 7: Implements interrupt-and-continue pattern
   */
  calculateTilt(mousePosition: MousePosition, element: HTMLElement | null): void {
    if (!element) {
      this.resetTilt();
      return;
    }

    const now = performance.now();

    // Point 3: Debounce rapid state transitions
    if (this.animationState === 'resetting' && now - this.lastStateChangeTime < DEBOUNCE_MS) {
      // Queue the update but don't interrupt reset yet
      this.pendingMousePosition = mousePosition;
      this.pendingElement = element;
      return;
    }

    // Point 7: If we're resetting, seamlessly interrupt and continue from current position
    if (this.animationState === 'resetting') {
      // Don't reset current values - just change state and continue from where we are
      this.lastStateChangeTime = now;
    }

    // Store pending update
    this.pendingMousePosition = mousePosition;
    this.pendingElement = element;

    // Transition to tilting state
    this.animationState = 'tilting';

    // Start unified animation loop if not already running
    this.startAnimationLoop();
  }

  /**
   * Reset tilt to neutral position
   */
  resetTilt(smooth = true): void {
    const now = performance.now();

    // Point 3: Debounce rapid state transitions
    if (this.animationState === 'tilting' && now - this.lastStateChangeTime < DEBOUNCE_MS) {
      return;
    }

    this.lastStateChangeTime = now;
    this.pendingMousePosition = null;
    this.pendingElement = null;

    if (smooth && this.animationState !== 'idle') {
      // Point 7: Store current position as reset start point for smooth transition
      this.resetStartRotateY = this.currentRotateY;
      this.resetStartRotateX = this.currentRotateX;
      this.resetStartGlowBlur = this.currentGlowBlur;
      this.resetStartGlowOpacity = this.currentGlowOpacity;
      this.resetStartReflectionOpacity = this.currentReflectionOpacity;

      // Set targets to zero
      this.targetRotateY = 0;
      this.targetRotateX = 0;
      this.targetGlowBlur = BASE_GLOW_BLUR;
      this.targetGlowOpacity = BASE_GLOW_OPACITY;
      this.targetReflectionOpacity = 0;

      this.animationState = 'resetting';
      this.animationStartTime = now;
      this.startAnimationLoop();
    } else {
      // Immediate reset
      this.stopAnimationLoop();
      this.setToNeutral();
      this.emitCalculations();
    }
  }

  /**
   * Point 2: Single unified animation loop
   */
  private startAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      return; // Already running
    }

    this.lastFrameTime = performance.now();
    this.animationStartTime = this.lastFrameTime;

    const animate = () => {
      const frameStart = performance.now();

      // Point 27: Safety timeout to prevent runaway animations
      if (frameStart - this.animationStartTime > MAX_ANIMATION_DURATION_MS) {
        this.stopAnimationLoop();
        this.setToNeutral();
        this.emitCalculations();
        return;
      }

      // Calculate delta time for frame-rate independent animation
      const deltaTime = Math.min((frameStart - this.lastFrameTime) / 1000, 0.1); // Cap at 100ms
      this.lastFrameTime = frameStart;

      let shouldContinue = false;

      if (this.animationState === 'tilting') {
        shouldContinue = this.processTiltFrame(deltaTime);
      } else if (this.animationState === 'resetting') {
        shouldContinue = this.processResetFrame(frameStart);
      }

      // Point 30: Frame budget check
      const frameTime = performance.now() - frameStart;
      if (isDevMode() && frameTime > FRAME_BUDGET_MS) {
        console.warn(
          `[MagneticTilt] Frame took ${frameTime.toFixed(2)}ms (budget: ${FRAME_BUDGET_MS}ms)`
        );
      }

      if (shouldContinue) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.animationFrameId = null;
        if (this.animationState === 'resetting') {
          this.animationState = 'idle';
        }
      }
    };

    this.ngZone.runOutsideAngular(() => {
      this.animationFrameId = requestAnimationFrame(animate);
    });
  }

  private stopAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.animationState = 'idle';
  }

  /**
   * Process a single frame of tilt animation
   * Point 5: Uses exponential smoothing instead of linear lerp
   */
  private processTiltFrame(deltaTime: number): boolean {
    // Process pending mouse position
    if (this.pendingMousePosition && this.pendingElement) {
      this.calculateTargetValues(this.pendingMousePosition, this.pendingElement);
    }

    // Point 5: Exponential smoothing - naturally handles interruptions
    const smoothFactor = 1 - Math.exp(-deltaTime * SMOOTHING_SPEED);

    this.currentRotateY = this.exponentialSmooth(
      this.currentRotateY,
      this.targetRotateY,
      smoothFactor
    );
    this.currentRotateX = this.exponentialSmooth(
      this.currentRotateX,
      this.targetRotateX,
      smoothFactor
    );
    this.currentGlowBlur = this.exponentialSmooth(
      this.currentGlowBlur,
      this.targetGlowBlur,
      smoothFactor
    );
    this.currentGlowOpacity = this.exponentialSmooth(
      this.currentGlowOpacity,
      this.targetGlowOpacity,
      smoothFactor
    );
    this.currentReflectionOpacity = this.exponentialSmooth(
      this.currentReflectionOpacity,
      this.targetReflectionOpacity,
      smoothFactor
    );

    this.emitCalculations();

    // Point 6: Early bailout - check if close enough to target
    return !this.isCloseToTarget(0.001);
  }

  /**
   * Process a single frame of reset animation
   */
  private processResetFrame(now: number): boolean {
    // Check for pending tilt request (Point 7: interrupt pattern)
    if (this.pendingMousePosition && this.pendingElement) {
      // Seamlessly transition to tilting from current position
      this.animationState = 'tilting';
      this.animationStartTime = now;
      return true;
    }

    const elapsed = now - this.animationStartTime;
    const progress = Math.min(elapsed / RESET_DURATION_MS, 1);

    // Cubic ease-out for smooth deceleration
    const t = 1 - progress;
    const easeOut = 1 - t * t * t;

    // Interpolate from reset start to neutral
    this.currentRotateY = this.resetStartRotateY * (1 - easeOut);
    this.currentRotateX = this.resetStartRotateX * (1 - easeOut);
    this.currentGlowBlur =
      BASE_GLOW_BLUR + (this.resetStartGlowBlur - BASE_GLOW_BLUR) * (1 - easeOut);
    this.currentGlowOpacity =
      BASE_GLOW_OPACITY + (this.resetStartGlowOpacity - BASE_GLOW_OPACITY) * (1 - easeOut);
    this.currentReflectionOpacity = this.resetStartReflectionOpacity * (1 - easeOut);

    this.emitCalculations();

    if (progress >= 1) {
      this.setToNeutral();
      return false;
    }

    return true;
  }

  /**
   * Calculate target tilt values based on mouse position
   */
  private calculateTargetValues(mousePosition: MousePosition, element: HTMLElement): void {
    const cache = this.getElementCache(element);
    if (!cache) {
      return;
    }

    // Use pre-cached inverse dimensions (Point 9)
    const fx = (mousePosition.x - cache.rect.left) * cache.invWidth;
    const fy = (mousePosition.y - cache.rect.top) * cache.invHeight;

    // Fast clamp
    const clampedFx = fx < 0 ? 0 : fx > 1 ? 1 : fx;
    const clampedFy = fy < 0 ? 0 : fy > 1 ? 1 : fy;

    // Normalize to -1 to 1 range
    const normalizedX = (clampedFx - 0.5) * 2;
    const normalizedY = (clampedFy - 0.5) * 2;

    // Wave function for tilt
    const tiltMultiplierX = this.getTiltMultiplier(clampedFx);

    // Set target rotation
    this.targetRotateY = tiltMultiplierX * MAX_TILT_DEGREES;
    this.targetRotateX = 0; // Vertical tilt disabled

    // Calculate intensity for glow effects
    const distance = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
    const intensity = Math.min(distance / SQRT_2, 1.0);

    // Set target glow values
    this.targetGlowBlur = BASE_GLOW_BLUR + intensity * MAX_GLOW_BLUR_OFFSET;
    this.targetGlowOpacity = BASE_GLOW_OPACITY + intensity * MAX_GLOW_OPACITY_OFFSET;
    this.targetReflectionOpacity = intensity * MAX_REFLECTION_OPACITY;
  }

  /**
   * Wave function: creates smooth tilt effect across card
   */
  private getTiltMultiplier(pos: number): number {
    if (pos <= 0.25) {
      return pos * 4;
    } else if (pos <= 0.5) {
      return 1 - (pos - 0.25) * 4;
    } else if (pos <= 0.75) {
      return -(pos - 0.5) * 4;
    } else {
      return -1 + (pos - 0.75) * 4;
    }
  }

  /**
   * Point 5: Exponential smoothing for natural transitions
   */
  private exponentialSmooth(current: number, target: number, factor: number): number {
    return current + (target - current) * factor;
  }

  /**
   * Point 6: Check if current values are close to target
   */
  private isCloseToTarget(threshold: number): boolean {
    return (
      Math.abs(this.currentRotateY - this.targetRotateY) < threshold &&
      Math.abs(this.currentRotateX - this.targetRotateX) < threshold &&
      Math.abs(this.currentGlowBlur - this.targetGlowBlur) < threshold &&
      Math.abs(this.currentGlowOpacity - this.targetGlowOpacity) < threshold &&
      Math.abs(this.currentReflectionOpacity - this.targetReflectionOpacity) < threshold
    );
  }

  /**
   * Set all values to neutral position
   */
  private setToNeutral(): void {
    this.currentRotateY = 0;
    this.currentRotateX = 0;
    this.currentGlowBlur = BASE_GLOW_BLUR;
    this.currentGlowOpacity = BASE_GLOW_OPACITY;
    this.currentReflectionOpacity = 0;

    this.targetRotateY = 0;
    this.targetRotateX = 0;
    this.targetGlowBlur = BASE_GLOW_BLUR;
    this.targetGlowOpacity = BASE_GLOW_OPACITY;
    this.targetReflectionOpacity = 0;
  }

  /**
   * Emit current calculations
   * Point 10: Only emit if values have actually changed
   */
  private emitCalculations(): void {
    const newCalculations: TiltCalculations = {
      rotateY: this.currentRotateY,
      rotateX: this.currentRotateX,
      glowBlur: this.currentGlowBlur,
      glowOpacity: this.currentGlowOpacity,
      reflectionOpacity: this.currentReflectionOpacity,
    };

    // Point 10: Check if calculations have changed meaningfully
    if (
      this.lastEmittedCalculations &&
      !this.hasCalculationsChanged(this.lastEmittedCalculations, newCalculations)
    ) {
      return;
    }

    this.lastEmittedCalculations = newCalculations;
    this.tiltCalculationsSubject.next(newCalculations);
  }

  /**
   * Point 10: Check if calculations have changed by meaningful amount
   */
  private hasCalculationsChanged(old: TiltCalculations, next: TiltCalculations): boolean {
    const threshold = 0.001;
    return (
      Math.abs(next.rotateY - old.rotateY) > threshold ||
      Math.abs(next.rotateX - old.rotateX) > threshold ||
      Math.abs(next.glowBlur - old.glowBlur) > threshold ||
      Math.abs(next.glowOpacity - old.glowOpacity) > threshold ||
      Math.abs(next.reflectionOpacity - old.reflectionOpacity) > threshold
    );
  }

  /**
   * Get cached element dimensions with pre-calculated inverse values
   * Point 9 & Point 28: Cache with inverse dimensions, invalidate on reset
   */
  private getElementCache(element: HTMLElement): ElementCache | null {
    const now = performance.now();
    const cached = this.elementCache.get(element);

    if (cached && now - cached.lastUpdate < this.CACHE_DURATION) {
      return cached;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return null;
    }

    const cache: ElementCache = {
      rect,
      invWidth: 1 / rect.width, // Point 9: Pre-calculated
      invHeight: 1 / rect.height,
      lastUpdate: now,
    };

    this.elementCache.set(element, cache);
    return cache;
  }

  /**
   * Clear cache for element
   * Point 28: Invalidate cache on reset or cleanup
   */
  clearCache(element?: HTMLElement): void {
    if (element) {
      this.elementCache.delete(element);
    }
    // Note: WeakMap doesn't have clear(), but entries will be GC'd when elements are removed
  }

  /**
   * Cleanup on service destruction
   */
  ngOnDestroy(): void {
    this.stopAnimationLoop();
  }
}
