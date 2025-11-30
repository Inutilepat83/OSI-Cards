import { Injectable, NgZone, inject, OnDestroy } from '@angular/core';
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

const MAX_LIFT_PX = 2.1; // Increased for more visible effect
const BASE_GLOW_BLUR = 10; // Increased for more visible glow
const MAX_GLOW_BLUR_OFFSET = 5; // Increased for more spread
const BASE_GLOW_OPACITY = 0.25; // Increased for more visible effect
const MAX_GLOW_OPACITY_OFFSET = 0.20; // Increased for more visible changes
const MAX_REFLECTION_OPACITY = 0.25; // Increased for more visible reflection
const SMOOTHING_FACTOR = 0.08; // Smooth interpolation that follows mouse cursor (lower = softer, less reactive)
const MAX_TILT_ANGLE = 15; // Maximum tilt angle in degrees

// Performance optimization: cache element dimensions
interface ElementCache {
  element: HTMLElement;
  rect: DOMRect;
  halfW: number;
  halfH: number;
  maxAngleY: number;
  lastUpdate: number;
}

@Injectable({
  providedIn: 'root'
})
export class MagneticTiltService implements OnDestroy {
  private tiltCalculationsSubject = new BehaviorSubject<TiltCalculations>({
    rotateY: 0,
    rotateX: 0,
    glowBlur: BASE_GLOW_BLUR,
    glowOpacity: BASE_GLOW_OPACITY,
    reflectionOpacity: 0
  });

  tiltCalculations$ = this.tiltCalculationsSubject.asObservable();

  // Performance: cache element dimensions to avoid repeated getBoundingClientRect calls
  private elementCache: Map<HTMLElement, ElementCache> = new Map<HTMLElement, ElementCache>();
  private rafId: number | null = null;
  private pendingUpdate: { mousePosition: MousePosition; element: HTMLElement | null } | null = null;
  private lastCalculations: TiltCalculations | null = null;
  // Current smoothed values for interpolation
  private currentRotateY = 0;
  private currentRotateX = 0;
  private currentGlowBlur: number = BASE_GLOW_BLUR;
  private currentGlowOpacity: number = BASE_GLOW_OPACITY;
  private currentReflectionOpacity = 0;
  // Latest target values for smoothing animation
  private targetRotateY = 0;
  private targetRotateX = 0;
  private targetGlowBlur: number = BASE_GLOW_BLUR;
  private targetGlowOpacity: number = BASE_GLOW_OPACITY;
  private targetReflectionOpacity = 0;
  private readonly CACHE_DURATION = 200; // Recalculate rect every 200ms max (reduces lag from getBoundingClientRect)
  private readonly ngZone = inject(NgZone);
  private resetRafId: number | null = null;
  private smoothingRafId: number | null = null;

  calculateTilt(mousePosition: MousePosition, element: HTMLElement | null): void {
    if (!element) {
      this.resetTilt();
      return;
    }

    // Cancel any ongoing reset animation when mouse re-enters
    if (this.resetRafId !== null) {
      cancelAnimationFrame(this.resetRafId);
      this.resetRafId = null;
    }

    // Don't cancel smoothing animation - let it continue for ultra-smooth updates
    // This prevents lag when passing over interactive elements

    // Store pending update for RAF batching (always use latest position)
    this.pendingUpdate = { mousePosition, element };

    // Schedule update via RAF for smooth 60fps (always process latest)
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        this.processTiltUpdate();
        this.rafId = null;
      });
    }
  }

  private processTiltUpdate(): void {
    if (!this.pendingUpdate) return;

    const { mousePosition, element } = this.pendingUpdate;
    this.pendingUpdate = null;

    if (!element) {
      this.resetTilt();
      return;
    }

    // Get or update cached element dimensions
    const cache = this.getElementCache(element);
    
    // Calculate normalized position (0-1) - optimized with cached inverse width/height
    // Use actual card dimensions, not screen dimensions, to handle tall cards
    const invWidth = 1.0 / cache.rect.width;
    const invHeight = 1.0 / cache.rect.height;
    const fx = (mousePosition.x - cache.rect.left) * invWidth;
    const fy = (mousePosition.y - cache.rect.top) * invHeight;
    // Fast clamp: use ternary for better branch prediction
    const clampedFx = fx < 0 ? 0 : fx > 1 ? 1 : fx;
    const clampedFy = fy < 0 ? 0 : fy > 1 ? 1 : fy;

    // Normalize to -1 to 1 range (center is 0) - used for glow effects
    const normalizedX = (clampedFx - 0.5) * 2;
    const normalizedY = (clampedFy - 0.5) * 2;

    // Calculate tilt multiplier based on position within card (0-1 range)
    // Use clamped position directly for more reliable calculation
    const cardPosX = clampedFx; // 0 = left edge, 1 = right edge
    const cardPosY = clampedFy; // 0 = top edge, 1 = bottom edge
    
    // Wave function: 0 at 0%, max at 25%, 0 at 50%, -max at 75%, 0 at 100%
    // Pattern: 0, 100, 0, 100, 0
    const getTiltMultiplier = (pos: number): number => {
      if (pos <= 0.25) {
        // 0% to 25%: increase from 0 to 1
        return pos * 4; // 0 -> 1
      } else if (pos <= 0.5) {
        // 25% to 50%: decrease from 1 to 0
        return 1 - (pos - 0.25) * 4; // 1 -> 0
      } else if (pos <= 0.75) {
        // 50% to 75%: decrease from 0 to -1
        return -(pos - 0.5) * 4; // 0 -> -1
      } else {
        // 75% to 100%: increase from -1 to 0
        return -1 + (pos - 0.75) * 4; // -1 -> 0
      }
    };
    
    const tiltMultiplierX = getTiltMultiplier(cardPosX);
    const tiltMultiplierY = getTiltMultiplier(cardPosY);
    
    // Tilt based on card position: entry: 0°, 25%: 0.5°, 50%: 0°, 75%: -0.5°, exit: 0°
    // Pattern: 0, 0.5, 0, -0.5, 0 degrees (softer, more subtle effect)
    // Only horizontal tilt (left to right), vertical tilt disabled
    const MAX_TILT_DEGREES = 0.5;
    const targetRotateY = tiltMultiplierX * MAX_TILT_DEGREES; // Horizontal tilt (left to right)
    const targetRotateX = 0; // Vertical tilt disabled

    // Calculate intensity based on distance from center for glow effects
    const distance = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
    const maxDistance = Math.sqrt(2); // Maximum distance from center (corner)
    const normalizedDistance = Math.min(distance / maxDistance, 1.0);
    const intensity = normalizedDistance;

    // Calculate target glow and reflection values
    const targetGlowBlur = BASE_GLOW_BLUR + intensity * MAX_GLOW_BLUR_OFFSET;
    const targetGlowOpacity = BASE_GLOW_OPACITY + intensity * MAX_GLOW_OPACITY_OFFSET;
    const targetReflectionOpacity = intensity * MAX_REFLECTION_OPACITY;

    // Update target values (these will be used by smoothing animation)
    this.targetRotateY = targetRotateY;
    this.targetRotateX = targetRotateX;
    this.targetGlowBlur = targetGlowBlur;
    this.targetGlowOpacity = targetGlowOpacity;
    this.targetReflectionOpacity = targetReflectionOpacity;

    // Apply smoothing interpolation (lerp) for smooth following
    this.currentRotateY = this.lerp(this.currentRotateY, targetRotateY, SMOOTHING_FACTOR);
    this.currentRotateX = this.lerp(this.currentRotateX, targetRotateX, SMOOTHING_FACTOR);
    this.currentGlowBlur = this.lerp(this.currentGlowBlur, targetGlowBlur, SMOOTHING_FACTOR);
    this.currentGlowOpacity = this.lerp(this.currentGlowOpacity, targetGlowOpacity, SMOOTHING_FACTOR);
    this.currentReflectionOpacity = this.lerp(this.currentReflectionOpacity, targetReflectionOpacity, SMOOTHING_FACTOR);

    const newCalculations: TiltCalculations = {
      rotateY: this.currentRotateY,
      rotateX: this.currentRotateX,
      glowBlur: this.currentGlowBlur,
      glowOpacity: this.currentGlowOpacity,
      reflectionOpacity: this.currentReflectionOpacity
    };

    // Always emit for smooth continuous updates
    this.lastCalculations = newCalculations;
    // Run outside Angular zone for better performance
    this.ngZone.runOutsideAngular(() => {
      this.tiltCalculationsSubject.next(newCalculations);
    });

    // Always continue smoothing animation for ultra-smooth updates (prevents lag)
    // This ensures smooth transitions even when mouse moves quickly over buttons/sections
    if (this.smoothingRafId === null) {
      this.smoothingRafId = requestAnimationFrame(() => {
        this.continueSmoothing();
      });
    }
  }

  /**
   * Linear interpolation (lerp) for smooth value transitions
   * @param start Current value
   * @param end Target value
   * @param factor Interpolation factor (0-1)
   */
  private lerp(start: number, end: number, factor: number): number {
    return start + (end - start) * factor;
  }

  /**
   * Continue smoothing animation until values are close to target
   * Uses the latest target values stored in the service
   * Optimized for smooth cursor following
   */
  private continueSmoothing(): void {
    const threshold = 0.01; // Threshold for smooth updates
    
    // Check if we need to continue smoothing using latest target values
    const rotateYDiff = Math.abs(this.currentRotateY - this.targetRotateY);
    const rotateXDiff = Math.abs(this.currentRotateX - this.targetRotateX);
    const glowBlurDiff = Math.abs(this.currentGlowBlur - this.targetGlowBlur);
    const glowOpacityDiff = Math.abs(this.currentGlowOpacity - this.targetGlowOpacity);
    const reflectionDiff = Math.abs(this.currentReflectionOpacity - this.targetReflectionOpacity);

    // Continue smoothing if there's any significant difference
    if (rotateYDiff > threshold || rotateXDiff > threshold || 
        glowBlurDiff > threshold || glowOpacityDiff > threshold || 
        reflectionDiff > threshold) {
      // Continue smoothing towards latest targets
      this.currentRotateY = this.lerp(this.currentRotateY, this.targetRotateY, SMOOTHING_FACTOR);
      this.currentRotateX = this.lerp(this.currentRotateX, this.targetRotateX, SMOOTHING_FACTOR);
      this.currentGlowBlur = this.lerp(this.currentGlowBlur, this.targetGlowBlur, SMOOTHING_FACTOR);
      this.currentGlowOpacity = this.lerp(this.currentGlowOpacity, this.targetGlowOpacity, SMOOTHING_FACTOR);
      this.currentReflectionOpacity = this.lerp(this.currentReflectionOpacity, this.targetReflectionOpacity, SMOOTHING_FACTOR);

      const newCalculations: TiltCalculations = {
        rotateY: this.currentRotateY,
        rotateX: this.currentRotateX,
        glowBlur: this.currentGlowBlur,
        glowOpacity: this.currentGlowOpacity,
        reflectionOpacity: this.currentReflectionOpacity
      };

      this.lastCalculations = newCalculations;
      this.ngZone.runOutsideAngular(() => {
        this.tiltCalculationsSubject.next(newCalculations);
      });

      // Continue animation for smooth updates
      this.smoothingRafId = requestAnimationFrame(() => {
        this.continueSmoothing();
      });
    } else {
      // Very close to target, stop animation
      this.smoothingRafId = null;
    }
  }


  private getElementCache(element: HTMLElement): ElementCache {
    const now = performance.now();
    const cached = this.elementCache.get(element);

    // Use cache if recent (within CACHE_DURATION ms)
    if (cached && (now - cached.lastUpdate) < this.CACHE_DURATION) {
      return cached;
    }

    // Recalculate and cache
    const rect = element.getBoundingClientRect();

    const cache: ElementCache = {
      element,
      rect,
      halfW: rect.width / 2,
      halfH: rect.height / 2,
      maxAngleY: MAX_TILT_ANGLE, // Use constant max angle for consistent behavior
      lastUpdate: now
    };

    this.elementCache.set(element, cache);
    return cache;
  }

  private hasCalculationsChanged(old: TiltCalculations, newCalc: TiltCalculations): boolean {
    // Optimized change detection with fast absolute value checks
    // Lower thresholds for smoother, more frequent updates
    const rotateYDiff = newCalc.rotateY - old.rotateY;
    const rotateXDiff = newCalc.rotateX - old.rotateX;
    const glowBlurDiff = newCalc.glowBlur - old.glowBlur;
    const glowOpacityDiff = newCalc.glowOpacity - old.glowOpacity;
    const reflectionDiff = newCalc.reflectionOpacity - old.reflectionOpacity;
    
    // Fast absolute value check: (x < 0 ? -x : x) is faster than Math.abs() for known values
    // Very low thresholds for ultra-smooth updates
    return (
      (rotateYDiff < 0 ? -rotateYDiff : rotateYDiff) > 0.0001 ||
      (rotateXDiff < 0 ? -rotateXDiff : rotateXDiff) > 0.0001 ||
      (glowBlurDiff < 0 ? -glowBlurDiff : glowBlurDiff) > 0.001 ||
      (glowOpacityDiff < 0 ? -glowOpacityDiff : glowOpacityDiff) > 0.0001 ||
      (reflectionDiff < 0 ? -reflectionDiff : reflectionDiff) > 0.0001
    );
  }

  private readonly RESET_TRANSITION_DURATION_MS = 800; // Even smoother exit transition

  resetTilt(smooth = true): void {
    // Cancel any pending tilt calculations
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pendingUpdate = null;
    
    // Cancel smoothing animation
    if (this.smoothingRafId !== null) {
      cancelAnimationFrame(this.smoothingRafId);
      this.smoothingRafId = null;
    }
    
    // Cancel any existing reset animation
    if (this.resetRafId !== null) {
      cancelAnimationFrame(this.resetRafId);
      this.resetRafId = null;
    }
    
    if (smooth) {
      // Smooth reset: gradually transition to zero over the transition duration
      // Use RAF for smooth 60fps animation
      const startTime = performance.now();
      const startRotateY = this.currentRotateY;
      const startRotateX = this.currentRotateX;
      const startGlowBlur = this.currentGlowBlur;
      const startGlowOpacity = this.currentGlowOpacity;
      const startReflectionOpacity = this.currentReflectionOpacity;
      
      const animateReset = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / this.RESET_TRANSITION_DURATION_MS, 1);
        
        // Optimized cubic ease-out - avoid Math.pow() for better performance
        const t = 1 - progress;
        const easeOut = 1 - (t * t * t); // t³ instead of Math.pow(t, 3)
        
        this.currentRotateY = startRotateY * (1 - easeOut);
        this.currentRotateX = startRotateX * (1 - easeOut);
        this.currentGlowBlur = BASE_GLOW_BLUR + (startGlowBlur - BASE_GLOW_BLUR) * (1 - easeOut);
        this.currentGlowOpacity = BASE_GLOW_OPACITY + (startGlowOpacity - BASE_GLOW_OPACITY) * (1 - easeOut);
        this.currentReflectionOpacity = startReflectionOpacity * (1 - easeOut);
        
        const currentCalculations: TiltCalculations = {
          rotateY: this.currentRotateY,
          rotateX: this.currentRotateX,
          glowBlur: this.currentGlowBlur,
          glowOpacity: this.currentGlowOpacity,
          reflectionOpacity: this.currentReflectionOpacity
        };
        
        this.lastCalculations = currentCalculations;
        this.ngZone.runOutsideAngular(() => {
          this.tiltCalculationsSubject.next(currentCalculations);
        });
        
        if (progress < 1) {
          // Continue animation using RAF for smooth 60fps
          this.resetRafId = requestAnimationFrame(animateReset);
        } else {
          // Animation complete - set final values
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
          this.lastCalculations = null;
          this.tiltCalculationsSubject.next({
            rotateY: 0,
            rotateX: 0,
            glowBlur: BASE_GLOW_BLUR,
            glowOpacity: BASE_GLOW_OPACITY,
            reflectionOpacity: 0
          });
          this.resetRafId = null;
        }
      };
      
      // Start smooth reset animation using RAF
      this.resetRafId = requestAnimationFrame(animateReset);
    } else {
      // Immediate reset (for cleanup)
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
      this.lastCalculations = null;
      this.tiltCalculationsSubject.next({
        rotateY: 0,
        rotateX: 0,
        glowBlur: BASE_GLOW_BLUR,
        glowOpacity: BASE_GLOW_OPACITY,
        reflectionOpacity: 0
      });
    }
  }

  // Cleanup cached elements when component is destroyed
  clearCache(element?: HTMLElement): void {
    if (element) {
      this.elementCache.delete(element);
    } else {
      this.elementCache.clear();
    }
  }

  // Cleanup method for service destruction
  ngOnDestroy(): void {
    if (this.resetRafId !== null) {
      cancelAnimationFrame(this.resetRafId);
      this.resetRafId = null;
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.smoothingRafId !== null) {
      cancelAnimationFrame(this.smoothingRafId);
      this.smoothingRafId = null;
    }
  }
}
