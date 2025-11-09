import { Injectable, ElementRef, NgZone, OnDestroy, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MousePosition } from './magnetic-tilt.service';

@Injectable({
  providedIn: 'root'
})
export class MouseTrackingService implements OnDestroy {
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

  private magneticRange = 300;
  private throttleMs = 16;
  private ngZone = inject(NgZone);
  private trackedElements = new Set<HTMLElement>();
  private pendingPosition: MousePosition | null = null;
  private rafHandle: number | null = null;
  private pointerMoveAttached = false;
  private lastPointerFrame = 0;

  constructor() {}

  ngOnDestroy(): void {
    this.detachGlobalPointerMove();
    this.cleanup();
  }

  cleanup(): void {
    this.detachGlobalPointerMove();
  }

  private handlePointerMove = (event: PointerEvent): void => {
    const now = performance.now ? performance.now() : Date.now();
    if (now - this.lastPointerFrame < this.throttleMs) {
      return;
    }

    this.pendingPosition = { x: event.clientX, y: event.clientY };

    if (this.rafHandle !== null) {
      return;
    }

    this.rafHandle = requestAnimationFrame((timestamp) => {
      const position = this.pendingPosition;
      this.pendingPosition = null;
      this.rafHandle = null;
      this.lastPointerFrame = timestamp;

      if (!position) {
        return;
      }

      this.ngZone.run(() => {
        this.mousePositionSubject.next(position);
      });
    });
  };

  trackElement(elementRef: ElementRef<HTMLElement>, magneticRange = 300, throttleMs = 16): void {
    this.magneticRange = magneticRange;
    this.throttleMs = throttleMs;

    const element = elementRef.nativeElement;
    this.trackedElements.add(element);
    this.ensureGlobalPointerMove();
    
    this.ngZone.runOutsideAngular(() => {
      element.addEventListener('mouseenter', this.handleMouseEnter);
      element.addEventListener('mouseleave', this.handleMouseLeave);
    });
  }

  untrackElement(elementRef: ElementRef<HTMLElement>): void {
    const element = elementRef.nativeElement;
    element.removeEventListener('mouseenter', this.handleMouseEnter);
    element.removeEventListener('mouseleave', this.handleMouseLeave);
    this.trackedElements.delete(element);
    if (this.trackedElements.size === 0) {
      this.detachGlobalPointerMove();
    }
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

  private ensureGlobalPointerMove(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.pointerMoveAttached) {
      return;
    }

    this.pointerMoveAttached = true;
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('pointermove', this.handlePointerMove, { passive: true });
    });
  }

  private detachGlobalPointerMove(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (!this.pointerMoveAttached) {
      return;
    }

    window.removeEventListener('pointermove', this.handlePointerMove);
    this.pointerMoveAttached = false;

    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
    this.pendingPosition = null;
  }
}
