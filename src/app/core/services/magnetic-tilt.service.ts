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

const MAX_LIFT_PX = 0.5; // 50% reduced tilt - prevents blur
const BASE_GLOW_BLUR = 12; // Reduced glow blur
const MAX_GLOW_BLUR_OFFSET = 6; // Reduced glow blur range
const BASE_GLOW_OPACITY = 0.12; // More subtle opacity
const MAX_GLOW_OPACITY_OFFSET = 0.18; // More subtle opacity range
const MAX_REFLECTION_OPACITY = 0.22; // Slightly reduced reflection

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

  calculateTilt(mousePosition: MousePosition, element: HTMLElement | null): void {
    if (!element) {
      this.resetTilt();
      return;
    }

    const rect = element.getBoundingClientRect();
    const halfW = rect.width / 2;
    const halfH = rect.height / 2;
    const fx = (mousePosition.x - rect.left) / rect.width;
    const fy = (mousePosition.y - rect.top) / rect.height;
    const clampedFx = Math.max(0, Math.min(1, fx));
    const clampedFy = Math.max(0, Math.min(1, fy));

    // No tilt rotation - only glow effect
    const sinX = Math.sin(clampedFx * 2 * Math.PI);
    const sinY = Math.sin(clampedFy * 2 * Math.PI);

    // Dynamic max angles so vertical lift is always MAX_LIFT_PX
    const maxAngleY = Math.asin(MAX_LIFT_PX / halfW) * (180 / Math.PI);
    const maxAngleX = Math.asin(MAX_LIFT_PX / halfH) * (180 / Math.PI);

    const rotateY = sinX * maxAngleY;
    const rotateX = -sinY * maxAngleX;

    const intensity = Math.max(Math.abs(sinX), Math.abs(sinY));

    const glowBlur = BASE_GLOW_BLUR + intensity * MAX_GLOW_BLUR_OFFSET;
    const glowOpacity = BASE_GLOW_OPACITY + intensity * MAX_GLOW_OPACITY_OFFSET;
    const reflectionOpacity = intensity * MAX_REFLECTION_OPACITY;

    this.tiltCalculationsSubject.next({
      rotateX,
      rotateY,
      glowBlur,
      glowOpacity,
      reflectionOpacity
    });
  }

  resetTilt(): void {
      this.tiltCalculationsSubject.next({
      rotateX: 0,
      rotateY: 0,
      glowBlur: BASE_GLOW_BLUR,
      glowOpacity: BASE_GLOW_OPACITY,
      reflectionOpacity: 0
    });
  }
}
