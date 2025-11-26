import { Injectable, NgZone, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface MousePosition {
  x: number;
  y: number;
}

export interface TiltCalculations {
  rotateX: number;
  rotateY: number;
  glowBlur: number;
  glowOpacity: number;
  reflectionOpacity: number;
}

const MAX_LIFT_PX = 1.0; // Doubled from 0.5 for stronger tilt effect
const BASE_GLOW_BLUR = 8; // Reduced from 12 - tighter glow
const MAX_GLOW_BLUR_OFFSET = 4; // Reduced from 6 - less spread
const BASE_GLOW_OPACITY = 0.225; // Intensified by 50% (0.15 * 1.5)
const MAX_GLOW_OPACITY_OFFSET = 0.18; // Intensified by 50% (0.12 * 1.5)
const MAX_REFLECTION_OPACITY = 0.22;

// Performance optimization: cache element dimensions
interface ElementCache {
  element: HTMLElement;
  rect: DOMRect;
  halfW: number;
  halfH: number;
  maxAngleY: number;
  maxAngleX: number;
  lastUpdate: number;
}

@Injectable({
  providedIn: 'root'
})
export class MagneticTiltService implements OnDestroy {
  private tiltCalculationsSubject = new BehaviorSubject<TiltCalculations>({
    rotateX: 0,
    rotateY: 0,
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
  private readonly CACHE_DURATION = 100; // Recalculate rect every 100ms max
  private readonly ngZone = inject(NgZone);

  calculateTilt(mousePosition: MousePosition, element: HTMLElement | null): void {
    if (!element) {
      this.resetTilt();
      return;
    }

    // Cancel any ongoing reset animation when mouse re-enters
    if (this.resetTimeoutId !== null) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    // Store pending update for RAF batching
    this.pendingUpdate = { mousePosition, element };

    // Schedule update via RAF for smooth 60fps
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
    
    const fx = (mousePosition.x - cache.rect.left) / cache.rect.width;
    const fy = (mousePosition.y - cache.rect.top) / cache.rect.height;
    const clampedFx = Math.max(0, Math.min(1, fx));
    const clampedFy = Math.max(0, Math.min(1, fy));

    // Optimized calculations
    const sinX = Math.sin(clampedFx * 2 * Math.PI);
    const sinY = Math.sin(clampedFy * 2 * Math.PI);

    const rotateY = sinX * cache.maxAngleY;
    const rotateX = -sinY * cache.maxAngleX;

    const intensity = Math.max(Math.abs(sinX), Math.abs(sinY));

    const glowBlur = BASE_GLOW_BLUR + intensity * MAX_GLOW_BLUR_OFFSET;
    const glowOpacity = BASE_GLOW_OPACITY + intensity * MAX_GLOW_OPACITY_OFFSET;
    const reflectionOpacity = intensity * MAX_REFLECTION_OPACITY;

    const newCalculations: TiltCalculations = {
      rotateX,
      rotateY,
      glowBlur,
      glowOpacity,
      reflectionOpacity
    };

    // Only emit if values actually changed (prevent unnecessary updates)
    if (!this.lastCalculations || this.hasCalculationsChanged(this.lastCalculations, newCalculations)) {
      this.lastCalculations = newCalculations;
      // Run outside Angular zone for better performance
      this.ngZone.runOutsideAngular(() => {
        this.tiltCalculationsSubject.next(newCalculations);
      });
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
    const halfW = rect.width / 2;
    const halfH = rect.height / 2;
    const maxAngleY = Math.asin(MAX_LIFT_PX / halfW) * (180 / Math.PI);
    const maxAngleX = Math.asin(MAX_LIFT_PX / halfH) * (180 / Math.PI);

    const cache: ElementCache = {
      element,
      rect,
      halfW,
      halfH,
      maxAngleY,
      maxAngleX,
      lastUpdate: now
    };

    this.elementCache.set(element, cache);
    return cache;
  }

  private hasCalculationsChanged(old: TiltCalculations, newCalc: TiltCalculations): boolean {
    // Reduced threshold for smoother glow transitions - allow more frequent updates
    const threshold = 0.005; // Reduced from 0.01 for smoother glow
    return (
      Math.abs(old.rotateX - newCalc.rotateX) > threshold ||
      Math.abs(old.rotateY - newCalc.rotateY) > threshold ||
      Math.abs(old.glowBlur - newCalc.glowBlur) > threshold ||
      Math.abs(old.glowOpacity - newCalc.glowOpacity) > threshold ||
      Math.abs(old.reflectionOpacity - newCalc.reflectionOpacity) > threshold
    );
  }

  private resetTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private readonly RESET_TRANSITION_DURATION_MS = 500; // Smooth exit transition duration

  resetTilt(smooth = true): void {
    // Cancel any pending tilt calculations
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pendingUpdate = null;
    
    // Clear any existing reset timeout
    if (this.resetTimeoutId !== null) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }
    
    if (smooth) {
      // Smooth reset: gradually transition to zero over the transition duration
      // This allows the CSS transition to complete smoothly even if mouse leaves quickly
      const startTime = performance.now();
      const startCalculations = this.lastCalculations || {
        rotateX: 0,
        rotateY: 0,
        glowBlur: BASE_GLOW_BLUR,
        glowOpacity: BASE_GLOW_OPACITY,
        reflectionOpacity: 0
      };
      
      const animateReset = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / this.RESET_TRANSITION_DURATION_MS, 1);
        
        // Ease-out function for smooth deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        const currentCalculations: TiltCalculations = {
          rotateX: startCalculations.rotateX * (1 - easeOut),
          rotateY: startCalculations.rotateY * (1 - easeOut),
          glowBlur: BASE_GLOW_BLUR + (startCalculations.glowBlur - BASE_GLOW_BLUR) * (1 - easeOut),
          glowOpacity: BASE_GLOW_OPACITY + (startCalculations.glowOpacity - BASE_GLOW_OPACITY) * (1 - easeOut),
          reflectionOpacity: startCalculations.reflectionOpacity * (1 - easeOut)
        };
        
        this.lastCalculations = currentCalculations;
        this.ngZone.runOutsideAngular(() => {
          this.tiltCalculationsSubject.next(currentCalculations);
        });
        
        if (progress < 1) {
          // Continue animation
          this.resetTimeoutId = window.setTimeout(animateReset, 16); // ~60fps
        } else {
          // Animation complete - set final values
          this.lastCalculations = null;
          this.tiltCalculationsSubject.next({
            rotateX: 0,
            rotateY: 0,
            glowBlur: BASE_GLOW_BLUR,
            glowOpacity: BASE_GLOW_OPACITY,
            reflectionOpacity: 0
          });
          this.resetTimeoutId = null;
        }
      };
      
      // Start smooth reset animation
      animateReset();
    } else {
      // Immediate reset (for cleanup)
      this.lastCalculations = null;
      this.tiltCalculationsSubject.next({
        rotateX: 0,
        rotateY: 0,
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
    if (this.resetTimeoutId !== null) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}







