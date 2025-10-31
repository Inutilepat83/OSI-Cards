import { Injectable } from '@angular/core';
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

@Injectable({
  providedIn: 'root'
})
export class MagneticTiltService {
  private readonly MAX_LIFT_PX = 5; // slightly reduced lift for gentler tilt
  private readonly BASE_GLOW_BLUR = 20;
  private readonly MAX_GLOW_BLUR_OFFSET = 10;
  private readonly BASE_GLOW_OPACITY = 0.2;
  private readonly MAX_GLOW_OPACITY_OFFSET = 0.3;
  private readonly MAX_REFLECTION_OPACITY = 0.3;

  private frameHandle: number | null = null;
  private lastPosition: MousePosition | null = null;
  private lastElement: HTMLElement | null = null;

  private tiltCalculationsSubject = new BehaviorSubject<TiltCalculations>({
    rotateX: 0,
    rotateY: 0,
    glowBlur: this.BASE_GLOW_BLUR,
    glowOpacity: this.BASE_GLOW_OPACITY,
    reflectionOpacity: 0
  });

  tiltCalculations$ = this.tiltCalculationsSubject.asObservable();

  calculateTilt(mousePosition: MousePosition, element: HTMLElement | null): void {
    if (!element) {
      this.resetTilt();
      return;
    }

    this.lastPosition = mousePosition;
    this.lastElement = element;

    if (this.frameHandle !== null) {
      return;
    }

    if (typeof window === 'undefined') {
      this.applyTilt(mousePosition, element);
      return;
    }

    this.frameHandle = window.requestAnimationFrame(() => {
      this.frameHandle = null;
      if (!this.lastElement || !this.lastPosition) {
        this.resetTilt();
        return;
      }
      this.applyTilt(this.lastPosition, this.lastElement);
    });
  }

  private applyTilt(mousePosition: MousePosition, element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const halfW = rect.width / 2;
    const halfH = rect.height / 2;
    const fx = (mousePosition.x - rect.left) / rect.width;
    const fy = (mousePosition.y - rect.top) / rect.height;
    const clampedFx = Math.max(0, Math.min(1, fx));
    const clampedFy = Math.max(0, Math.min(1, fy));

    // Sinusoidal tilt: 0@0%, +1@25%, 0@50%, -1@75%, 0@100%
    const sinX = Math.sin(clampedFx * 2 * Math.PI);
    const sinY = Math.sin(clampedFy * 2 * Math.PI);

    // Dynamic max angles so vertical lift is always MAX_LIFT_PX
    const maxAngleY = Math.asin(this.MAX_LIFT_PX / halfW) * (180 / Math.PI);
    const maxAngleX = Math.asin(this.MAX_LIFT_PX / halfH) * (180 / Math.PI);

    const rotateY = sinX * maxAngleY;
    const rotateX = -sinY * maxAngleX;

    const intensity = Math.max(Math.abs(sinX), Math.abs(sinY));

    const glowBlur = this.BASE_GLOW_BLUR + intensity * this.MAX_GLOW_BLUR_OFFSET;
    const glowOpacity = this.BASE_GLOW_OPACITY + intensity * this.MAX_GLOW_OPACITY_OFFSET;
    const reflectionOpacity = intensity * this.MAX_REFLECTION_OPACITY;

    this.tiltCalculationsSubject.next({
      rotateX,
      rotateY,
      glowBlur,
      glowOpacity,
      reflectionOpacity
    });
  }

  resetTilt(): void {
    if (this.frameHandle !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.frameHandle);
      this.frameHandle = null;
    }
    this.lastPosition = null;
    this.lastElement = null;

    this.tiltCalculationsSubject.next({
      rotateX: 0,
      rotateY: 0,
      glowBlur: this.BASE_GLOW_BLUR,
      glowOpacity: this.BASE_GLOW_OPACITY,
      reflectionOpacity: 0
    });
  }
}
