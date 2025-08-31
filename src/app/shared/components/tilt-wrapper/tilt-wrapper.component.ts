import { Component, OnInit, OnDestroy, Input, ElementRef, ViewChild, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subject, takeUntil, interval } from 'rxjs';
import { MagneticTiltService, MousePosition } from '../../../core/services/magnetic-tilt.service';
import { MouseTrackingService } from '../../../core/services/mouse-tracking.service';

@Component({
  selector: 'app-tilt-wrapper',
  templateUrl: './tilt-wrapper.component.html',
  styleUrls: ['./tilt-wrapper.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TiltWrapperComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() isActive = true;
  @Input() className = '';
  
  @ViewChild('tiltContainer') tiltContainerRef!: ElementRef<HTMLDivElement>;
  
  // CSS variables for the tilt effect
  tiltStyle: any = {};
  
  private destroyed$ = new Subject<void>();
  private updateInterval: any;

  constructor(
    private elementRef: ElementRef,
    private magneticTiltService: MagneticTiltService,
    private mouseTrackingService: MouseTrackingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.magneticTiltService.tiltCalculations$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(calculations => {
        this.tiltStyle = {
          '--tilt-x': `${calculations.rotateX}deg`,
          '--tilt-y': `${calculations.rotateY}deg`,
          '--glow-blur': `${calculations.glowBlur}px`,
          '--glow-color': `rgba(255,121,0,${calculations.glowOpacity})`,
          '--reflection-opacity': calculations.reflectionOpacity
        };
        this.cdr.markForCheck();
      });
      
    // Setup update interval for performance optimization
    this.updateInterval = interval(16).pipe(takeUntil(this.destroyed$)).subscribe(() => {
      if (this.isActive) {
        this.mouseTrackingService.updateElementPosition(this.elementRef);
        this.updateTilt();
      } else {
        this.magneticTiltService.resetTilt();
      }
    });
  }

  ngAfterViewInit(): void {
    this.mouseTrackingService.trackElement(this.elementRef);
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.mouseTrackingService.untrackElement(this.elementRef);
    if (this.updateInterval) {
      this.updateInterval.unsubscribe();
    }
  }

  private updateTilt(): void {
    const mousePosition = this.mouseTrackingService.mousePosition$;
    const isHovered = this.mouseTrackingService.isHovered$;
    
    // Get the latest values
    let currentMousePos: MousePosition = { x: 0, y: 0 };
    mousePosition.pipe(takeUntil(this.destroyed$)).subscribe(pos => {
      currentMousePos = pos;
    });
    
    let hovered = false;
    isHovered.pipe(takeUntil(this.destroyed$)).subscribe(val => {
      hovered = val;
    });
    
    if (this.isActive && hovered && this.tiltContainerRef?.nativeElement) {
      this.magneticTiltService.calculateTilt(currentMousePos, this.tiltContainerRef.nativeElement);
    } else {
      this.magneticTiltService.resetTilt();
    }
  }
}
