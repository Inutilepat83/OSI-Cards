import {
  Component,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  AfterViewInit,
} from '@angular/core';
import { AICardConfig } from '../../models/card.model';
import { Subject, takeUntil, fromEvent } from 'rxjs';
import { MouseTrackingService } from '../../core/services/mouse-tracking.service';
import { MagneticTiltService } from '../../core/services/magnetic-tilt.service';

@Component({
  selector: 'app-ai-card-renderer',
  templateUrl: './ai-card-renderer.component.html',
  styleUrls: ['./ai-card-renderer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AICardRendererComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() cardConfig!: AICardConfig;
  @Input() isFullscreen: boolean = false;
  @Input() tiltEnabled: boolean = true;
  @Output() fieldInteraction = new EventEmitter<any>();
  @Output() cardInteraction = new EventEmitter<{ action: string; card: AICardConfig }>();
  @Output() fullscreenToggle = new EventEmitter<boolean>();

  @ViewChild('cardContainer') cardContainer!: ElementRef<HTMLElement>;

  isHovered = false;
  isTiltActive = true;

  private destroyed$ = new Subject<void>();

  constructor(
    private el: ElementRef,
    private mouseTrackingService: MouseTrackingService,
    private magneticTiltService: MagneticTiltService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isTiltActive = this.tiltEnabled;

    // Listen for hover state changes
    this.mouseTrackingService.isHovered$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((isHovered: boolean) => {
        this.isHovered = isHovered;
        this.cdr.markForCheck();
      });
  }

  ngAfterViewInit(): void {
    // Register the container element for mouse tracking
    if (this.cardContainer && this.cardContainer.nativeElement) {
      // Set up element position tracking on resize
      fromEvent(window, 'resize')
        .pipe(takeUntil(this.destroyed$))
        .subscribe(() => {
          // Trigger any necessary recalculations when container size changes
          this.cdr.markForCheck();
        });
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  onFieldClick(field: any): void {
    this.fieldInteraction.emit({
      field: field,
      action: 'click',
    });
  }

  onActionClick(action: string): void {
    this.cardInteraction.emit({
      action: action,
      card: this.cardConfig,
    });
  }

  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    this.fullscreenToggle.emit(this.isFullscreen);

    // Allow time for layout to adjust before recalculating tilt
    setTimeout(() => {
      this.cdr.markForCheck();
    }, 100);
  }

  trackByIndex(index: number): number {
    return index;
  }
}
