import { Injectable, NgZone } from '@angular/core';
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

const MAX_LIFT_PX = 0.5;
const BASE_GLOW_BLUR = 8; // Reduced from 12 - tighter glow
const MAX_GLOW_BLUR_OFFSET = 4; // Reduced from 6 - less spread
const BASE_GLOW_OPACITY = 0.15; // Further reduced for subtler glow
const MAX_GLOW_OPACITY_OFFSET = 0.12; // Further reduced for subtler glow
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
export class MagneticTiltService {
  private tiltCalculationsSubject = new BehaviorSubject<TiltCalculations>({
    rotateX: 0,
    rotateY: 0,
    glowBlur: BASE_GLOW_BLUR,
    glowOpacity: BASE_GLOW_OPACITY,
    reflectionOpacity: 0
  });

  tiltCalculations$ = this.tiltCalculationsSubject.asObservable();

  // Performance: cache element dimensions to avoid repeated getBoundingClientRect calls
  private elementCache: Map<HTMLElement, ElementCache> = new Map();
  private rafId: number | null = null;
  private pendingUpdate: { mousePosition: MousePosition; element: HTMLElement | null } | null = null;
  private lastCalculations: TiltCalculations | null = null;
  private readonly CACHE_DURATION = 100; // Recalculate rect every 100ms max

  constructor(private ngZone: NgZone) {}

  calculateTilt(mousePosition: MousePosition, element: HTMLElement | null): void {
    if (!element) {
      this.resetTilt();
      return;
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

  resetTilt(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pendingUpdate = null;
    this.lastCalculations = null;
    
    this.tiltCalculationsSubject.next({
      rotateX: 0,
      rotateY: 0,
      glowBlur: BASE_GLOW_BLUR,
      glowOpacity: BASE_GLOW_OPACITY,
      reflectionOpacity: 0
    });
  }

  // Cleanup cached elements when component is destroyed
  clearCache(element?: HTMLElement): void {
    if (element) {
      this.elementCache.delete(element);
    } else {
      this.elementCache.clear();
    }
  }
}
