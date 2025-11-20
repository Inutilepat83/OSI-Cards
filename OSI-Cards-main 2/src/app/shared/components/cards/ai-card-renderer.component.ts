import { Component, ElementRef, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AICardConfig, CardSection, CardField, CardItem, CardAction } from '../../../models';
import { Subject, takeUntil, fromEvent, throttleTime, filter, delay } from 'rxjs';
import { MouseTrackingService, MagneticTiltService, MousePosition, TiltCalculations } from '../../../core';
import { IconService } from '../../services/icon.service';
import { SectionNormalizationService } from '../../services/section-normalization.service';
import { LucideIconsModule } from '../../icons/lucide-icons.module';
import { MasonryGridComponent, MasonryLayoutInfo } from './masonry-grid/masonry-grid.component';
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
  
  private previousSectionsHash = '';
  
  @Input()
  set cardConfig(value: AICardConfig | undefined) {
    const previousConfig = this._cardConfig;
    this._cardConfig = value ?? undefined;
    
    // Only recompute if sections actually changed (using fast hash instead of JSON.stringify)
    const sectionsHash = value?.sections ? this.hashSections(value.sections) : '';
    if (sectionsHash !== this.previousSectionsHash || !previousConfig) {
      this.previousSectionsHash = sectionsHash;
      this.computeProcessedSections();
    }
    this.cdr.markForCheck();
  }

  /**
   * Fast hash function for sections (replaces JSON.stringify)
   */
  private hashSections(sections: CardSection[]): string {
    // Create a lightweight hash based on section metadata
    const hash = sections.map(s => `${s.id || ''}|${s.title || ''}|${s.type || ''}`).join('||');
    // Simple hash of the string
    let result = 0;
    for (let i = 0; i < hash.length; i++) {
      const char = hash.charCodeAt(i);
      result = ((result << 5) - result) + char;
      result = result & result; // Convert to 32-bit integer
    }
    return String(result);
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
  
  // Performance: RAF batching for mouse moves
  private mouseMoveRafId: number | null = null;
  private pendingMouseMove: MouseEvent | null = null;
  
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

    // Subscribe to tilt calculations with RAF batching for performance
    let tiltRafId: number | null = null;
    let pendingCalculations: TiltCalculations | null = null;
    
    this.magneticTiltService.tiltCalculations$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((calculations: TiltCalculations) => {
        pendingCalculations = calculations;
        
        // Batch updates via RAF to avoid excessive change detection
        // Always update to ensure smooth transitions
        if (tiltRafId === null) {
          tiltRafId = requestAnimationFrame(() => {
            if (pendingCalculations) {
              // Always update glow values for smooth transitions
              this.tiltStyle = {
                '--tilt-x': `${pendingCalculations.rotateX}deg`,
                '--tilt-y': `${pendingCalculations.rotateY}deg`,
                '--glow-blur': `${pendingCalculations.glowBlur}px`,
                '--glow-color': `rgba(255,121,0,${pendingCalculations.glowOpacity})`,
                '--reflection-opacity': pendingCalculations.reflectionOpacity
              };
              this.cdr.markForCheck();
            }
            pendingCalculations = null;
            tiltRafId = null;
          });
        }
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
    // Cancel any pending RAFs
    if (this.mouseMoveRafId !== null) {
      cancelAnimationFrame(this.mouseMoveRafId);
    }
    
    // Clear tilt service cache for this element
    if (this.tiltContainerRef?.nativeElement) {
      this.magneticTiltService.clearCache(this.tiltContainerRef.nativeElement);
    }
    
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
    
    // Cancel pending RAF
    if (this.mouseMoveRafId !== null) {
      cancelAnimationFrame(this.mouseMoveRafId);
      this.mouseMoveRafId = null;
    }
    this.pendingMouseMove = null;
    
    this.magneticTiltService.resetTilt();
    this.cdr.markForCheck();
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isHovered || !this.tiltContainerRef?.nativeElement) {
      return;
    }
    
    // Store latest mouse position
    this.pendingMouseMove = event;
    
    // Throttle with RAF for 60fps smooth updates
    if (this.mouseMoveRafId === null) {
      this.mouseMoveRafId = requestAnimationFrame(() => {
        if (this.pendingMouseMove && this.tiltContainerRef?.nativeElement) {
          this.mousePosition = { 
            x: this.pendingMouseMove.clientX, 
            y: this.pendingMouseMove.clientY 
          };
          this.magneticTiltService.calculateTilt(
            this.mousePosition, 
            this.tiltContainerRef.nativeElement
          );
        }
        this.pendingMouseMove = null;
        this.mouseMoveRafId = null;
      });
    }
  }

  onFieldClick(field: CardField, section?: CardSection): void {
    this.fieldInteraction.emit({
      field,
      action: 'click',
      sectionTitle: section?.title
    });
  }

  onActionClick(actionObj: CardAction): void {
    // Handle email actions
    if (actionObj.email) {
      this.handleEmailAction(actionObj);
      return;
    }

    // Handle regular actions
    if (this.cardConfig) {
      const action = actionObj.action || actionObj.label;
      this.cardInteraction.emit({
        action: action,
        card: this.cardConfig
      });
    }
  }

  private handleEmailAction(action: CardAction): void {
    if (!action.email) return;

    const email = action.email;
    const to = Array.isArray(email.to) ? email.to.join(',') : email.to;
    const cc = Array.isArray(email.cc) ? email.cc.join(',') : email.cc;
    const bcc = Array.isArray(email.bcc) ? email.bcc.join(',') : email.bcc;

    // Determine recipient email address
    const recipientEmail = to || email.contact?.email || '';
    if (!recipientEmail) {
      console.warn('No email address provided for email action');
      return;
    }

    // Build mailto URL parameters manually for better control over encoding
    const params: string[] = [];
    
    // Add CC if provided
    if (cc) {
      params.push(`cc=${encodeURIComponent(cc)}`);
    }

    // Add BCC if provided
    if (bcc) {
      params.push(`bcc=${encodeURIComponent(bcc)}`);
    }

    // Add subject if provided
    if (email.subject) {
      params.push(`subject=${encodeURIComponent(email.subject)}`);
    }

    // Add body if provided - encode properly with newlines as %0D%0A
    if (email.body) {
      // Replace newlines with %0D%0A (CRLF) for proper email formatting
      // Then encode the rest of the content
      const bodyWithLineBreaks = email.body.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const encodedBody = encodeURIComponent(bodyWithLineBreaks).replace(/%0A/g, '%0D%0A');
      params.push(`body=${encodedBody}`);
    }

    // Construct mailto link
    const queryString = params.length > 0 ? '?' + params.join('&') : '';
    const mailtoLink = `mailto:${recipientEmail}${queryString}`;
    
    // Open email client using a temporary anchor element (most reliable method)
    // This ensures the email client opens without navigating away from the page
    const anchor = document.createElement('a');
    anchor.href = mailtoLink;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
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

  onLayoutChange(layout: MasonryLayoutInfo): void {
    // Layout change handler - kept for potential future use
  }

  getActionIconName(action: CardAction): string {
    if (action.icon) {
      return this.iconService.getFieldIcon(action.icon);
    }
    return this.iconService.getFieldIcon(action.label);
  }

  getActionButtonClasses(action: CardAction): string {
    return 'bg-[var(--color-brand)] text-white font-semibold border-0 hover:bg-[var(--color-brand)]/90 hover:shadow-lg hover:shadow-[var(--color-brand)]/40 active:scale-95';
  }

  private computeProcessedSections(): void {
    if (!this.cardConfig?.sections?.length) {
      this.processedSections = [];
      return;
    }

    this.processedSections = this.sectionNormalizationService.normalizeAndSortSections(this.cardConfig.sections);
  }
}
