import { Directive, ElementRef, HostListener, OnDestroy, Renderer2, inject } from '@angular/core';

interface TiltCalculations {
  rotateX: number;
  rotateY: number;
  glowBlur: number;
  glowOpacity: number;
  reflectionOpacity: number;
}

const MAX_LIFT_PX = 5;
const BASE_GLOW_BLUR = 20;
const MAX_GLOW_BLUR_OFFSET = 10;
const BASE_GLOW_OPACITY = 0.2;
const MAX_GLOW_OPACITY_OFFSET = 0.3;
const MAX_REFLECTION_OPACITY = 0.3;

@Directive({
  selector: '[appTilt]',
  standalone: true
})
export class TiltDirective implements OnDestroy {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private isActive = false;
  private rafId?: number;

  constructor() {
    this.renderer.addClass(this.el.nativeElement, 'tilt-container');
    this.renderer.addClass(this.el.nativeElement, 'glow-container');
    this.resetTilt();
  }

  @HostListener('mouseenter', ['$event'])
  onMouseEnter(event: MouseEvent): void {
    this.isActive = true;
    this.calculateTilt(event);
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isActive) {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
      }
      this.rafId = requestAnimationFrame(() => this.calculateTilt(event));
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.isActive = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }
    this.resetTilt();
  }

  ngOnDestroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }

  private calculateTilt(event: MouseEvent): void {
    const element = this.el.nativeElement;
    const rect = element.getBoundingClientRect();
    
    const halfW = rect.width / 2;
    const halfH = rect.height / 2;
    
    const fx = (event.clientX - rect.left) / rect.width;
    const fy = (event.clientY - rect.top) / rect.height;
    
    const clampedFx = Math.max(0, Math.min(1, fx));
    const clampedFy = Math.max(0, Math.min(1, fy));

    // Sinusoidal tilt: 0@0%, +1@25%, 0@50%, -1@75%, 0@100%
    const sinX = Math.sin(clampedFx * 2 * Math.PI);
    const sinY = Math.sin(clampedFy * 2 * Math.PI);

    // Dynamic max angles so vertical lift is always MAX_LIFT_PX
    const maxAngleY = Math.asin(MAX_LIFT_PX / halfW) * (180 / Math.PI);
    const maxAngleX = Math.asin(MAX_LIFT_PX / halfH) * (180 / Math.PI);

    const rotateY = sinX * maxAngleY;
    const rotateX = -sinY * maxAngleX;

    const intensity = Math.max(Math.abs(sinX), Math.abs(sinY));

    const calculations: TiltCalculations = {
      rotateX,
      rotateY,
      glowBlur: BASE_GLOW_BLUR + intensity * MAX_GLOW_BLUR_OFFSET,
      glowOpacity: BASE_GLOW_OPACITY + intensity * MAX_GLOW_OPACITY_OFFSET,
      reflectionOpacity: intensity * MAX_REFLECTION_OPACITY
    };

    this.applyTilt(calculations);
  }

  private applyTilt(calculations: TiltCalculations): void {
    const element = this.el.nativeElement;
    this.renderer.setStyle(element, '--tilt-x', `${calculations.rotateX}deg`);
    this.renderer.setStyle(element, '--tilt-y', `${calculations.rotateY}deg`);
    this.renderer.setStyle(element, '--glow-blur', `${calculations.glowBlur}px`);
    this.renderer.setStyle(element, '--glow-color', `rgba(255,121,0,${calculations.glowOpacity})`);
    this.renderer.setStyle(element, '--reflection-opacity', calculations.reflectionOpacity.toString());
  }

  private resetTilt(): void {
    const element = this.el.nativeElement;
    this.renderer.setStyle(element, '--tilt-x', '0deg');
    this.renderer.setStyle(element, '--tilt-y', '0deg');
    this.renderer.setStyle(element, '--glow-blur', `${BASE_GLOW_BLUR}px`);
    this.renderer.setStyle(element, '--glow-color', `rgba(255,121,0,${BASE_GLOW_OPACITY})`);
    this.renderer.setStyle(element, '--reflection-opacity', '0');
  }
}
