import { Component, ElementRef, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AICardConfig, CardField, CardItem, CardAction } from '../../../models';
import { Subject, takeUntil, fromEvent, interval, Subscription } from 'rxjs';
import { MouseTrackingService, MagneticTiltService, MousePosition } from '../../../core';
import { IconService } from '../../services/icon.service';

@Component({
  selector: 'app-ai-card-renderer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-card-renderer.component.html',
  styleUrls: ['./ai-card-renderer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AICardRendererComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() cardConfig?: AICardConfig;
  @Input() isFullscreen = false;
  @Input() tiltEnabled = true;
  @Output() fieldInteraction = new EventEmitter<any>();
  @Output() cardInteraction = new EventEmitter<{ action: string, card: AICardConfig }>();
  @Output() fullscreenToggle = new EventEmitter<boolean>();
  
  @ViewChild('cardContainer') cardContainer!: ElementRef<HTMLElement>;
  @ViewChild('tiltContainer') tiltContainerRef!: ElementRef<HTMLDivElement>;
  
  isHovered = false;
  isTiltActive = true;
  
  // CSS variables for the tilt effect
  tiltStyle: Record<string, string | number> = {};
  
  private destroyed$ = new Subject<void>();
  private updateInterval: Subscription | undefined;
  
  private mouseTrackingService = inject(MouseTrackingService);
  private magneticTiltService = inject(MagneticTiltService);
  private iconService = inject(IconService);

  // Fallback card configuration for testing
  private fallbackCard: AICardConfig = {
    id: 'fallback-test',
    cardTitle: 'Test Company',
    cardSubtitle: 'Fallback Card for Testing',
    cardType: 'company',
    sections: [
      {
        id: 'test-info',
        title: 'Company Information',
        type: 'info',
        fields: [
          {
            id: 'industry',
            label: 'Industry',
            value: 'Technology',
            type: 'text'
          },
          {
            id: 'employees',
            label: 'Employees',
            value: '250',
            type: 'text'
          }
        ]
      }
    ],
    actions: [
      {
        id: 'view-details',
        label: 'View Details',
        variant: 'primary'
      }
    ]
  };

  // Math utilities for template
  Math = Math;

  constructor(
    private el: ElementRef,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isTiltActive = this.tiltEnabled;
    
    // Debug logging
    console.log('AI Card Renderer - cardConfig:', this.cardConfig);
    
    // Use fallback if no card config provided
    if (!this.cardConfig) {
      console.log('No cardConfig provided, using fallback');
      this.cardConfig = this.fallbackCard;
    }

    // Initialize tilt functionality
    this.magneticTiltService.tiltCalculations$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((calculations: any) => {
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
      if (this.isTiltActive) {
        this.mouseTrackingService.updateElementPosition(this.el);
        this.updateTilt();
      } else {
        this.magneticTiltService.resetTilt();
      }
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

    // Track element for tilt functionality
    this.mouseTrackingService.trackElement(this.el);
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.mouseTrackingService.untrackElement(this.el);
    if (this.updateInterval) {
      this.updateInterval.unsubscribe();
    }
  }

  onMouseEnter(): void {
    this.isHovered = true;
    this.cdr.markForCheck();
  }

  onMouseLeave(): void {
    this.isHovered = false;
    this.cdr.markForCheck();
  }

  onFieldClick(field: CardField): void {
    this.fieldInteraction.emit({
      field: field,
      action: 'click'
    });
  }

  onActionClick(action: string): void {
    if (this.cardConfig) {
      this.cardInteraction.emit({
        action: action,
        card: this.cardConfig
      });
    }
  }

  toggleFullscreen(): void {
    // Emit the toggle event to parent component
    this.fullscreenToggle.emit(!this.isFullscreen);
    
    // Allow time for layout to adjust before recalculating tilt
    setTimeout(() => {
      this.cdr.markForCheck();
    }, 100);
  }

  trackByIndex(index: number, item: unknown): number {
    return index;
  }

  // Section expand/collapse state map
  sectionState: Record<number, { expanded: boolean }> = {};

  isSectionExpanded(index: number, section: unknown): boolean {
    if (this.sectionState[index] === undefined) {
      // default: if section has `collapsed: true` set, start collapsed, otherwise expanded
      this.sectionState[index] = { expanded: !(section && typeof section === 'object' && section !== null && 'collapsed' in section && (section as Record<string, unknown>)['collapsed'] === true) };
    }
    return this.sectionState[index].expanded;
  }

  toggleSection(index: number): void {
    if (!this.sectionState[index]) {
      this.sectionState[index] = { expanded: true };
    }
    this.sectionState[index].expanded = !this.sectionState[index].expanded;
    this.cdr.markForCheck();
  }

  getFieldIconClass(label: string): string {
    return this.iconService.getFieldIconClass(label);
  }

  getFieldIcon(label: string): string {
    return this.iconService.getFieldIcon(label);
  }

  getFieldIconPath(field: CardField): string {
    // First check if the field has an explicit icon property from JSON
    if (field.icon) {
      return this.iconService.getFieldIcon(field.icon) || this.iconService.getFieldIcon(field.label);
    }
    // Fall back to label-based icon
    return this.iconService.getFieldIcon(field.label);
  }

  getItemIconPath(item: CardItem): string {
    // Use the item's icon property
    return this.iconService.getFieldIcon(item.icon || item.title);
  }

  getActionIconPath(action: CardAction): string {
    // Use the action's icon property
    return this.iconService.getFieldIcon(action.icon || action.label);
  }

  private updateTilt(): void {
    const mousePosition = this.mouseTrackingService.mousePosition$;
    
    // Get the latest values
    let currentMousePos: MousePosition = { x: 0, y: 0 };
    mousePosition.pipe(takeUntil(this.destroyed$)).subscribe((pos: MousePosition) => {
      currentMousePos = pos;
    });
    
    if (this.isTiltActive && this.isHovered && this.tiltContainerRef?.nativeElement) {
      this.magneticTiltService.calculateTilt(currentMousePos, this.tiltContainerRef.nativeElement);
    } else {
      this.magneticTiltService.resetTilt();
    }
  }
}
