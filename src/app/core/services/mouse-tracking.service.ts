import { Injectable, ElementRef, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MousePosition } from './magnetic-tilt.service';

@Injectable({
  providedIn: 'root'
})
export class MouseTrackingService {
  private mousePositionSubject = new BehaviorSubject<MousePosition>({ x: 0, y: 0 });
  private relativePositionSubject = new BehaviorSubject<MousePosition>({ x: 0, y: 0 });
  private isInMagneticFieldSubject = new BehaviorSubject<boolean>(false);
  private magneticIntensitySubject = new BehaviorSubject<number>(0);
  private isHoveredSubject = new BehaviorSubject<boolean>(false);

  mousePosition$ = this.mousePositionSubject.asObservable();
  relativePosition$ = this.relativePositionSubject.asObservable();
  isInMagneticField$ = this.isInMagneticFieldSubject.asObservable();
  magneticIntensity$ = this.magneticIntensitySubject.asObservable();
  isHovered$ = this.isHoveredSubject.asObservable();

  private lastUpdateTime = 0;
  private throttleMs = 16; // ~60fps
  private magneticRange = 300;

  constructor(private ngZone: NgZone) {
    this.setupGlobalMouseTracking();
  }

  private setupGlobalMouseTracking(): void {
    // Run outside Angular zone for better performance with frequent events
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('mousemove', this.handleGlobalMouseMove);
    });
  }

  cleanup(): void {
    window.removeEventListener('mousemove', this.handleGlobalMouseMove);
  }

  private handleGlobalMouseMove = (e: MouseEvent): void => {
    const now = Date.now();
    if (now - this.lastUpdateTime < this.throttleMs) return;
    this.lastUpdateTime = now;

    const newPosition = { x: e.clientX, y: e.clientY };
    
    // Run change detection only when needed
    this.ngZone.run(() => {
      this.mousePositionSubject.next(newPosition);
    });
  }

  trackElement(elementRef: ElementRef<HTMLElement>, magneticRange = 300, throttleMs = 16): void {
    this.magneticRange = magneticRange;
    this.throttleMs = throttleMs;

    const element = elementRef.nativeElement;
    
    this.ngZone.runOutsideAngular(() => {
      element.addEventListener('mouseenter', this.handleMouseEnter);
      element.addEventListener('mouseleave', this.handleMouseLeave);
    });
  }

  untrackElement(elementRef: ElementRef<HTMLElement>): void {
    const element = elementRef.nativeElement;
    element.removeEventListener('mouseenter', this.handleMouseEnter);
    element.removeEventListener('mouseleave', this.handleMouseLeave);
  }

  private handleMouseEnter = (): void => {
    this.ngZone.run(() => {
      this.isHoveredSubject.next(true);
    });
  }

  private handleMouseLeave = (): void => {
    this.ngZone.run(() => {
      this.isHoveredSubject.next(false);
      this.isInMagneticFieldSubject.next(false);
      this.magneticIntensitySubject.next(0);
      this.relativePositionSubject.next({ x: 0, y: 0 });
    });
  }

  updateElementPosition(elementRef: ElementRef<HTMLElement>): void {
    if (!elementRef?.nativeElement) return;
    
    const element = elementRef.nativeElement;
    const rect = element.getBoundingClientRect();
    const mousePos = this.mousePositionSubject.value;
    
    // Calculate relative position
    const relativePos = {
      x: mousePos.x - rect.left,
      y: mousePos.y - rect.top
    };
    
    // Calculate distance to center
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = mousePos.x - centerX;
    const dy = mousePos.y - centerY;
    const distance = Math.hypot(dx, dy);
    
    // Calculate magnetic intensity
    const intensity = this.calculateMagneticIntensity(distance);
    
    this.ngZone.run(() => {
      this.relativePositionSubject.next(relativePos);
      this.magneticIntensitySubject.next(intensity);
      this.isInMagneticFieldSubject.next(intensity > 0);
    });
  }

  private calculateMagneticIntensity(distance: number): number {
    if (distance >= this.magneticRange) return 0;
    const t = distance / this.magneticRange;
    return 1 - t * t;
  }
}
