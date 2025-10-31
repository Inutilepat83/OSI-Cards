import { Component, ElementRef, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AICardConfig, CardSection, CardField, CardItem, CardAction } from '../../../models';
import { Subject, takeUntil, fromEvent, interval, Subscription } from 'rxjs';
import { MouseTrackingService, MagneticTiltService, MousePosition, TiltCalculations } from '../../../core';
import { IconService } from '../../services/icon.service';
import { LucideIconsModule } from '../../icons/lucide-icons.module';
import { MasonryGridComponent } from './masonry-grid/masonry-grid.component';
import { SectionRenderEvent } from './section-renderer/section-renderer.component';

export interface CardFieldInteractionEvent {
  field?: CardField;
  item?: CardItem | CardField;
  action: 'click';
  sectionTitle?: string;
  metadata?: Record<string, unknown>;
}

@Component({
  selector: 'app-ai-card-renderer',
  standalone: true,
  imports: [CommonModule, LucideIconsModule, MasonryGridComponent],
  templateUrl: './ai-card-renderer.component.html',
  styleUrls: ['./ai-card-renderer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AICardRendererComponent implements OnInit, AfterViewInit, OnDestroy {
  private _cardConfig?: AICardConfig;
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly cdr = inject(ChangeDetectorRef);
  
  // Expose Math for template
  Math = Math;
  
  @Input()
  set cardConfig(value: AICardConfig | undefined) {
    this._cardConfig = value ?? undefined;
    this.computeProcessedSections();
    this.cdr.markForCheck();
  }
  get cardConfig(): AICardConfig | undefined {
    return this._cardConfig;
  }
  @Input() isFullscreen = false;
  @Input() tiltEnabled = true;
  @Output() fieldInteraction = new EventEmitter<CardFieldInteractionEvent>();
  @Output() cardInteraction = new EventEmitter<{ action: string, card: AICardConfig }>();
  @Output() fullscreenToggle = new EventEmitter<boolean>();
  
  @ViewChild('cardContainer') cardContainer!: ElementRef<HTMLElement>;
  @ViewChild('tiltContainer') tiltContainerRef!: ElementRef<HTMLDivElement>;
  
  processedSections: CardSection[] = [];
  isHovered = false;
  isTiltActive = true;
  
  // CSS variables for the tilt effect
  tiltStyle: Record<string, string | number> = {};
  
  private readonly destroyed$ = new Subject<void>();
  private updateInterval: Subscription | undefined;
  private lastMousePosition: MousePosition = { x: 0, y: 0 };
  
  private readonly mouseTrackingService = inject(MouseTrackingService);
  private readonly magneticTiltService = inject(MagneticTiltService);
  private readonly iconService = inject(IconService);

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

  ngOnInit(): void {
    this.isTiltActive = this.tiltEnabled;
    
    // Use fallback if no card config provided
    if (!this.cardConfig) {
      this.cardConfig = this.fallbackCard;
    }

    if (!this.processedSections.length) {
      this.computeProcessedSections();
    }

    // Handle Escape key for fullscreen exit
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(takeUntil(this.destroyed$))
      .subscribe((event) => {
        if (event.key === 'Escape' && this.isFullscreen) {
          this.toggleFullscreen();
        }
      });

    this.mouseTrackingService.mousePosition$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((pos: MousePosition) => {
        this.lastMousePosition = pos;
      });

    // Initialize tilt functionality
    this.magneticTiltService.tiltCalculations$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((calculations: TiltCalculations) => {
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
    this.magneticTiltService.resetTilt();
    this.cdr.markForCheck();
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isHovered && this.tiltContainerRef) {
      this.lastMousePosition = { x: event.clientX, y: event.clientY };
      this.magneticTiltService.calculateTilt(this.lastMousePosition, this.tiltContainerRef.nativeElement);
    }
  }

  onFieldClick(field: CardField, section?: CardSection): void {
    this.fieldInteraction.emit({
      field,
      action: 'click',
      sectionTitle: section?.title
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

  trackSection = (_index: number, section: CardSection): string =>
    section.id ?? `${section.title}-${_index}`;

  trackField = (_index: number, field: CardField): string =>
    field.id ?? `${field.label}-${_index}`;

  trackItem = (_index: number, item: CardItem): string =>
    item.id ?? `${item.title}-${_index}`;

  trackAction = (_index: number, action: CardAction): string =>
    action.id ?? `${action.label}-${_index}`;

  onSectionEvent(event: SectionRenderEvent): void {
    switch (event.type) {
      case 'field':
        if (event.field) {
          this.fieldInteraction.emit({
            field: event.field,
            action: 'click',
            sectionTitle: (event.metadata?.['sectionTitle'] as string | undefined) ?? event.section.title,
            metadata: event.metadata
          });
        }
        break;
      case 'item':
        if (event.item) {
          this.fieldInteraction.emit({
            item: event.item,
            action: 'click',
            sectionTitle: (event.metadata?.['sectionTitle'] as string | undefined) ?? event.section.title,
            metadata: event.metadata
          });
        }
        break;
      case 'action':
        if (event.action && this.cardConfig) {
          const identifier = event.action.action ?? event.action.id ?? event.action.label ?? 'section-action';
          this.cardInteraction.emit({
            action: identifier,
            card: this.cardConfig
          });
        }
        break;
      default:
        break;
    }
  }

  getActionIconName(action: CardAction): string {
    if (action.icon) {
      return this.iconService.getFieldIcon(action.icon);
    }
    return this.iconService.getFieldIcon(action.label);
  }

  getActionButtonClasses(action: CardAction): string[] {
    const variant = (action.variant ?? action.type ?? 'primary').toLowerCase();
    if (variant === 'secondary' || variant === 'outline' || variant === 'ghost') {
      return ['ai-card-action', 'ai-card-action--secondary'];
    }

    return ['ai-card-action', 'ai-card-action--primary'];
  }

  private computeProcessedSections(): void {
    if (!this.cardConfig?.sections?.length) {
      this.processedSections = [];
      return;
    }

    const normalizedSections = this.cardConfig.sections
      .map((section) => this.normalizeSection(section))
      .sort((a, b) => this.getSectionPriority(a) - this.getSectionPriority(b));

    this.processedSections = normalizedSections;
  }

  private normalizeSection(section: CardSection): CardSection {
    const rawType = (section.type ?? '').toLowerCase();
    const title = (section.title ?? '').toLowerCase();

    const supportedTypes: CardSection['type'][] = [
      'info',
      'analytics',
      'contact-card',
      'network-card',
      'map',
      'financials',
      'locations',
      'event',
      'project',
      'list',
      'chart',
      'product',
      'solutions',
      'overview',
      'stats'
    ];

    let resolvedType: CardSection['type'];

    switch (rawType) {
      case 'timeline':
        resolvedType = 'event';
        break;
      case 'metrics':
      case 'stats':
        resolvedType = 'analytics';
        break;
      case 'table':
        resolvedType = 'list';
        break;
      case 'locations':
        resolvedType = 'map';
        break;
      case 'project':
        resolvedType = 'info';
        break;
      case 'contact':
        resolvedType = 'contact-card';
        break;
      case 'network':
        resolvedType = 'network-card';
        break;
      case '':
        resolvedType = title.includes('overview') ? 'overview' : 'info';
        break;
      default:
        resolvedType = supportedTypes.includes(rawType as CardSection['type'])
          ? (rawType as CardSection['type'])
          : 'info';
        break;
    }

    if (!rawType && title.includes('overview')) {
      resolvedType = 'overview';
    }

    const normalized: CardSection = {
      ...section,
      type: resolvedType
    };

    if (resolvedType === 'analytics' && (!normalized.fields || !normalized.fields.length)) {
      const metrics = (section as Record<string, unknown>)['metrics'];
      if (Array.isArray(metrics)) {
        normalized.fields = metrics as CardField[];
      }
    }

    if (!normalized.description && section.subtitle) {
      normalized.description = section.subtitle;
    }

    return normalized;
  }

  private getSectionPriority(section: CardSection): number {
    const type = section.type?.toLowerCase() ?? '';
    const title = section.title?.toLowerCase() ?? '';

    if (type === 'contact-card' || type === 'contact') return 1;
    if (type === 'overview' || title.includes('overview')) return 2;
    if (type === 'analytics') return 3;
    if (type === 'product') return 4;
    if (type === 'solutions') return 5;
    if (type === 'map') return 6;
    if (type === 'financials') return 7;
    if (type === 'chart') return 8;
    if (type === 'list') return 9;
    if (type === 'event') return 10;
    if (type === 'info') return 11;
    return 12;
  }

  private updateTilt(): void {
    if (this.isTiltActive && this.isHovered && this.tiltContainerRef?.nativeElement) {
      this.magneticTiltService.calculateTilt(this.lastMousePosition, this.tiltContainerRef.nativeElement);
    } else {
      this.magneticTiltService.resetTilt();
    }
  }
}
