import { Component, Input, OnInit, OnDestroy, ElementRef, NgZone, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { fromEvent, Subject, takeUntil } from 'rxjs';

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

@Component({
  selector: 'app-particle-system',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './particle-system.component.html',
  styleUrls: ['./particle-system.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParticleSystemComponent implements OnInit, OnDestroy {
  @Input() particleCount = 30;
  @Input() particleColor = 'rgba(255, 121, 0, 0.5)';
  @Input() particleMinSize = 2;
  @Input() particleMaxSize = 6;
  @Input() particleLifespan = 3000; // milliseconds
  
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationFrameId = 0;
  private lastTimestamp = 0;
  private destroyed$ = new Subject<void>();
  private isAnimating = false; // guard to prevent multiple loops
  private elementRef = inject(ElementRef);
  private ngZone = inject(NgZone);
  
  ngOnInit(): void {
    this.canvas = this.elementRef.nativeElement.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    
    this.initializeCanvas();
    this.createParticles();
    
    // Listen for window resize and restart canvas safely
    this.ngZone.runOutsideAngular(() => {
      fromEvent(window, 'resize')
        .pipe(takeUntil(this.destroyed$))
        .subscribe(() => {
          this.initializeCanvas();
        });
      
      // Start animation loop only once
      if (!this.isAnimating) {
        this.isAnimating = true;
        this.animate(0);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    cancelAnimationFrame(this.animationFrameId);
    this.isAnimating = false;
  }

  private initializeCanvas(): void {
    const parentElement = this.canvas.parentElement!;
    this.canvas.width = parentElement.clientWidth;
    this.canvas.height = parentElement.clientHeight;
  }

  private createParticles(): void {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push(this.createParticle());
    }
  }

  private createParticle(): Particle {
    const size = this.particleMinSize + Math.random() * (this.particleMaxSize - this.particleMinSize);
    const maxLife = this.particleLifespan + Math.random() * 1000;
    
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      size,
      color: this.particleColor,
      vx: (Math.random() - 0.5) * 0.5, // velocity x
      vy: (Math.random() - 0.5) * 0.5, // velocity y
      life: Math.random() * maxLife, // current life
      maxLife // max lifespan
    };
  }

  private animate(timestamp: number): void {
    // Cancel any previous frame before scheduling a new one (prevents duplicate loops)
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    
    if (!this.lastTimestamp) {
      this.lastTimestamp = timestamp;
      return;
    }
    
    const delta = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      
      // Update particle
      p.x += p.vx;
      p.y += p.vy;
      p.life += delta;
      
      // Particle fading
      const opacity = 1 - (p.life / p.maxLife);
      
      // Draw particle
      this.ctx.beginPath();
      this.ctx.fillStyle = this.adjustOpacity(p.color, opacity);
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Reset particle if it's dead or out of bounds
      if (p.life >= p.maxLife || 
          p.x < -p.size || p.x > this.canvas.width + p.size || 
          p.y < -p.size || p.y > this.canvas.height + p.size) {
        this.particles[i] = this.createParticle();
      }
    }
  }
  
  private adjustOpacity(color: string, opacity: number): string {
    if (color.startsWith('rgba')) {
      // Replace the last parameter in rgba()
      return color.replace(/[\d.]+$/, `${opacity})`);
    } else if (color.startsWith('rgb')) {
      // Convert rgb to rgba
      return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
    } else {
      // For hex or named colors, default to rgba with the color name
      return `rgba(255, 121, 0, ${opacity})`;
    }
  }
}
