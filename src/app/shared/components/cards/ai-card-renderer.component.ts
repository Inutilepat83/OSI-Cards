import { Component, ElementRef, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AICardConfig, CardSection, CardField, CardItem, CardAction } from '../../../models';
import { Subject, takeUntil, fromEvent, throttleTime, filter, delay } from 'rxjs';
import { MouseTrackingService, MagneticTiltService, MousePosition, TiltCalculations } from '../../../core';
import { IconService } from '../../services/icon.service';
import { SectionNormalizationService } from '../../services/section-normalization.service';
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
  mousePosition: MousePosition = { x: 0, y: 0 };
  
  // CSS variables for the tilt effect
  tiltStyle: Record<string, string | number> = {};
  
  private readonly destroyed$ = new Subject<void>();
  private readonly magneticTiltService = inject(MagneticTiltService);
  private readonly iconService = inject(IconService);
  private readonly sectionNormalizationService = inject(SectionNormalizationService);
  private readonly viewportScroller = inject(ViewportScroller);
  private readonly route = inject(ActivatedRoute);

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

    // Subscribe to tilt calculations
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
  }
  
  ngAfterViewInit(): void {
    // Handle URL fragment scrolling to sections
    this.route.fragment
      .pipe(
        filter(fragment => !!fragment),
        delay(100),
        takeUntil(this.destroyed$)
      )
      .subscribe(fragment => {
        this.scrollToSection(fragment as string);
      });

    // Also handle initial fragment on load
    const initialFragment = this.route.snapshot.fragment;
    if (initialFragment) {
      setTimeout(() => {
        this.scrollToSection(initialFragment);
      }, 300);
    }
  }

  /**
   * Scrolls to a section by ID or sanitized title
   */
  private scrollToSection(sectionId: string): void {
    if (typeof document === 'undefined') return;

    // Try direct ID match first
    let targetElement = document.getElementById(sectionId);

    // If not found, try to find by sanitized section title
    if (!targetElement) {
      const section = this.processedSections.find(s => this.sanitizeSectionId(s.title) === sectionId);
      if (section) {
        targetElement = document.getElementById(this.getSectionId(section));
      }
    }

    if (targetElement) {
      // Scroll with smooth behavior and offset for header
      const yOffset = -20; // Offset from top
      const y = targetElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      window.scrollTo({
        top: y,
        behavior: 'smooth'
      });

      // Add visual highlight effect
      targetElement.classList.add('section-highlight');
      setTimeout(() => {
        targetElement?.classList.remove('section-highlight');
      }, 2000);
    }
  }

  /**
   * Gets a unique section ID for scrolling
   */
  getSectionId(section: CardSection): string {
    return `section-${this.sanitizeSectionId(section.title || section.id || 'unknown')}`;
  }

  /**
   * Sanitizes section title for use as HTML ID
   */
  private sanitizeSectionId(title: string): string {
    return title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  onMouseEnter(event: MouseEvent): void {
    this.isHovered = true;
    this.mousePosition = { x: event.clientX, y: event.clientY };
    if (this.tiltContainerRef?.nativeElement) {
      this.magneticTiltService.calculateTilt(this.mousePosition, this.tiltContainerRef.nativeElement);
    }
    this.cdr.markForCheck();
  }

  onMouseLeave(): void {
    this.isHovered = false;
    this.magneticTiltService.resetTilt();
    this.cdr.markForCheck();
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isHovered || !this.tiltContainerRef?.nativeElement) {
      return;
    }
    
    this.mousePosition = { x: event.clientX, y: event.clientY };
    this.magneticTiltService.calculateTilt(this.mousePosition, this.tiltContainerRef.nativeElement);
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
    this.fullscreenToggle.emit(!this.isFullscreen);
    this.magneticTiltService.resetTilt();
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

    this.processedSections = this.sectionNormalizationService.normalizeAndSortSections(this.cardConfig.sections);
  }
}
