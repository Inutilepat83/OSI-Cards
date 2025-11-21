import { Component, ElementRef, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AICardConfig, CardSection, CardField, CardItem, CardAction } from '../../../models';
import { Subject, takeUntil, fromEvent, filter, delay, interval } from 'rxjs';
import { MagneticTiltService, MousePosition, TiltCalculations } from '../../../core';
import { IconService } from '../../services/icon.service';
import { SectionNormalizationService } from '../../services/section-normalization.service';
import { LucideIconsModule } from '../../icons/lucide-icons.module';
import { MasonryGridComponent, MasonryLayoutInfo } from './masonry-grid/masonry-grid.component';
import { SectionRenderEvent } from './section-renderer/section-renderer.component';
import { CardChangeType } from '../../utils/card-diff.util';
import { trigger, transition, style, animate } from '@angular/animations';

export interface CardFieldInteractionEvent {
  field?: CardField;
  item?: CardItem | CardField;
  action: 'click';
  sectionTitle?: string;
  metadata?: Record<string, unknown>;
}

export type StreamingStage = 'idle' | 'thinking' | 'streaming' | 'complete' | 'aborted' | 'error' | undefined;

@Component({
  selector: 'app-ai-card-renderer',
  standalone: true,
  imports: [CommonModule, LucideIconsModule, MasonryGridComponent],
  templateUrl: './ai-card-renderer.component.html',
  styleUrls: ['./ai-card-renderer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('messageAnimation', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('0.4s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class AICardRendererComponent implements OnInit, AfterViewInit, OnDestroy {
  private _cardConfig?: AICardConfig;
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly cdr = inject(ChangeDetectorRef);
  
  // Expose Math for template
  Math = Math;
  
  private previousSectionsHash = '';
  private normalizedSectionCache = new WeakMap<CardSection, CardSection>();
  private sectionHashCache = new WeakMap<CardSection[], string>();
  private sectionOrderKeys: string[] = [];
  private _changeType: CardChangeType = 'structural';
  
  // Empty state animations
  particles: Array<{ transform: string; opacity: number }> = [];
  gradientTransform = 'translate(-50%, -50%)';
  contentTransform = 'translate(0, 0)';
  currentMessageIndex = 0;
  currentMessage = '';
  private mouseX = 0;
  private mouseY = 0;
  private isMouseOverEmptyState = false;
  private scrollY = 0;
  
  private readonly funnyMessages = [
    'Deepening into archives...',
    'Asking all 40,000 employees...',
    'Re-reading manifesto...',
    'Consulting the oracle...',
    'Checking under the couch...',
    'Asking ChatGPT for help...',
    'Brewing coffee first...',
    'Counting to infinity...',
    'Summoning the data spirits...',
    'Teaching AI to read minds...',
    'Searching parallel universes...',
    'Waiting for inspiration...',
    'Polishing crystal ball...',
    'Decoding ancient scrolls...',
    'Training neural networks...',
    'Consulting the stars...',
    'Asking Siri nicely...',
    'Reading tea leaves...',
    'Channeling inner wisdom...',
    'Waiting for the right moment...'
  ];
  
  @Input()
  set cardConfig(value: AICardConfig | undefined) {
    this._cardConfig = value ?? undefined;
    
    if (!this._cardConfig?.sections?.length) {
      this.resetProcessedSections();
      this.cdr.markForCheck();
      return;
    }

    const sectionsHash = this.hashSections(this._cardConfig.sections);
    const shouldForceStructural = sectionsHash !== this.previousSectionsHash || this._updateSource === 'liveEdit';
    this.refreshProcessedSections(shouldForceStructural);
    this.cdr.markForCheck();
  }

  get cardConfig(): AICardConfig | undefined {
    return this._cardConfig;
  }

  /**
   * Input to track update source - used to bypass hash caching for live edits
   * When 'liveEdit', always forces reprocessing even if sections haven't changed structurally
   */
  @Input()
  set updateSource(value: 'stream' | 'liveEdit') {
    if (value === 'liveEdit' && this._updateSource !== value) {
      // Live edit detected - force section reprocessing by invalidating hash
      this.previousSectionsHash = '';
      if (this._cardConfig?.sections?.length) {
        this.refreshProcessedSections(true);
      }
    }
    this._updateSource = value;
  }
  get updateSource(): 'stream' | 'liveEdit' {
    return this._updateSource;
  }
  private _updateSource: 'stream' | 'liveEdit' = 'stream';

  /**
   * Fast hash function for sections (replaces JSON.stringify)
   * Uses WeakMap cache to avoid recomputation
   */
  private hashSections(sections: CardSection[]): string {
    // Check cache first
    if (this.sectionHashCache.has(sections)) {
      return this.sectionHashCache.get(sections)!;
    }
    
    // Create a lightweight hash based on section metadata
    const hash = sections
      .map(section => {
        const fieldCount = section.fields?.length ?? 0;
        const itemCount = section.items?.length ?? 0;
        return `${section.id || ''}|${section.title || ''}|${section.type || ''}|f${fieldCount}|i${itemCount}`;
      })
      .join('||');
    
    // Simple hash of the string
    let result = 0;
    for (let i = 0; i < hash.length; i++) {
      const char = hash.charCodeAt(i);
      result = ((result << 5) - result) + char;
      result = result & result; // Convert to 32-bit integer
    }
    
    const hashString = String(result);
    // Cache the result
    this.sectionHashCache.set(sections, hashString);
    return hashString;
  }
  @Input() isFullscreen = false;
  @Input() tiltEnabled = true;
  @Input() streamingStage: StreamingStage = undefined;
  @Input() streamingProgress?: number; // Progress 0-1
  @Input() streamingProgressLabel?: string; // e.g., "STREAMING JSON (75%)"

  @Input()
  set changeType(value: CardChangeType) {
    if (this._changeType === value) {
      return;
    }
    this._changeType = value;
    if (this._cardConfig?.sections?.length) {
      this.refreshProcessedSections(value === 'structural');
    }
  }
  get changeType(): CardChangeType {
    return this._changeType;
  }
  @Output() fieldInteraction = new EventEmitter<CardFieldInteractionEvent>();
  @Output() cardInteraction = new EventEmitter<{ action: string, card: AICardConfig }>();
  @Output() fullscreenToggle = new EventEmitter<boolean>();
  
  @ViewChild('cardContainer') cardContainer!: ElementRef<HTMLElement>;
  @ViewChild('tiltContainer') tiltContainerRef!: ElementRef<HTMLDivElement>;
  @ViewChild(MasonryGridComponent) masonryGrid!: MasonryGridComponent;
  @ViewChild('emptyStateContainer') emptyStateContainer!: ElementRef<HTMLDivElement>;
  
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
    // Initialize particles
    this.initializeParticles();
    
    // Start message rotation
    this.startMessageRotation();
    
    // Track scroll for parallax effect
    this.setupScrollTracking();
    // Use fallback if no card config provided
    if (!this.cardConfig) {
      this.cardConfig = this.fallbackCard;
    }

    if (!this.processedSections.length) {
      this.refreshProcessedSections(true);
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

  private initializeParticles(): void {
    // Create 20 smaller particles for smoother mouse following trail
    this.particles = Array.from({ length: 20 }, () => ({
      transform: 'translate(0, 0) scale(1)',
      opacity: 0.5
    }));
  }

  private startMessageRotation(): void {
    this.currentMessage = this.funnyMessages[0];
    this.currentMessageIndex = 0;
    
    interval(2500) // Change message every 2.5 seconds
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.currentMessageIndex = (this.currentMessageIndex + 1) % this.funnyMessages.length;
        this.currentMessage = this.funnyMessages[this.currentMessageIndex];
        this.cdr.markForCheck();
      });
  }

  private setupScrollTracking(): void {
    fromEvent(window, 'scroll')
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.scrollY = window.scrollY;
        this.updateContentTransform();
      });
  }

  onEmptyStateMouseMove(event: MouseEvent): void {
    if (!this.emptyStateContainer) return;
    
    const rect = this.emptyStateContainer.nativeElement.getBoundingClientRect();
    this.mouseX = event.clientX - rect.left;
    this.mouseY = event.clientY - rect.top;
    this.isMouseOverEmptyState = true;
    
    this.updateParticlePositions();
    this.updateGradientTransform();
    this.updateContentTransform();
  }

  onEmptyStateMouseLeave(): void {
    this.isMouseOverEmptyState = false;
    // Reset particles to center with smooth animation
    this.resetParticles();
  }

  private updateParticlePositions(): void {
    if (!this.emptyStateContainer) return;
    
    const rect = this.emptyStateContainer.nativeElement.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const deltaX = this.mouseX - centerX;
    const deltaY = this.mouseY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = Math.sqrt(rect.width * rect.width + rect.height * rect.height) / 2;
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    
    this.particles = this.particles.map((particle, index) => {
      // Create a trailing effect with exponential easing
      const delay = index * 0.08;
      const followStrength = 0.4 - (delay * 0.3); // Particles further back follow less
      const spiralRadius = 15 + (index % 4) * 8;
      const angle = (index * 137.5) % 360; // Golden angle for spiral distribution
      const angleRad = angle * Math.PI / 180;
      
      // Calculate spiral offset
      const spiralX = Math.cos(angleRad) * spiralRadius;
      const spiralY = Math.sin(angleRad) * spiralRadius;
      
      // Smooth following with easing
      const targetX = deltaX * followStrength + spiralX;
      const targetY = deltaY * followStrength + spiralY;
      
      // Opacity based on distance and position
      const baseOpacity = 0.5;
      const distanceOpacity = normalizedDistance * 0.3;
      const positionOpacity = (1 - Math.abs(index - this.particles.length / 2) / this.particles.length) * 0.2;
      const finalOpacity = Math.min(1, baseOpacity + distanceOpacity + positionOpacity);
      
      return {
        transform: `translate(${targetX}px, ${targetY}px) scale(${0.8 + normalizedDistance * 0.4})`,
        opacity: finalOpacity
      };
    });
    
    this.cdr.markForCheck();
  }

  private resetParticles(): void {
    this.particles = this.particles.map(particle => ({
      transform: 'translate(0, 0) scale(1)',
      opacity: 0.5
    }));
    this.cdr.markForCheck();
  }

  private updateGradientTransform(): void {
    if (!this.emptyStateContainer) return;
    
    const rect = this.emptyStateContainer.nativeElement.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const deltaX = (this.mouseX - centerX) * 0.1;
    const deltaY = (this.mouseY - centerY) * 0.1;
    
    this.gradientTransform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
    this.cdr.markForCheck();
  }

  private updateContentTransform(): void {
    if (!this.emptyStateContainer) return;
    
    const rect = this.emptyStateContainer.nativeElement.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Parallax effect based on mouse position and scroll
    const mouseParallaxX = this.isMouseOverEmptyState ? (this.mouseX - centerX) * 0.02 : 0;
    const mouseParallaxY = this.isMouseOverEmptyState ? (this.mouseY - centerY) * 0.02 : 0;
    const scrollParallaxY = this.scrollY * 0.05;
    
    this.contentTransform = `translate(${mouseParallaxX}px, calc(${mouseParallaxY}px + ${scrollParallaxY}px))`;
    this.cdr.markForCheck();
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
      // Smooth enter: calculate tilt immediately for responsive feel
      this.magneticTiltService.calculateTilt(this.mousePosition, this.tiltContainerRef.nativeElement);
    }
    // No need for markForCheck - tilt updates are handled via RAF in subscription
  }

  onMouseLeave(): void {
    this.isHovered = false;
    
    // Cancel pending RAF for mouse moves
    if (this.mouseMoveRafId !== null) {
      cancelAnimationFrame(this.mouseMoveRafId);
      this.mouseMoveRafId = null;
    }
    this.pendingMouseMove = null;
    
    // Smooth exit: reset with smooth transition that completes even if cursor leaves quickly
    this.magneticTiltService.resetTilt(true);
    // No need for markForCheck - tilt reset is handled via smooth animation
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

    // Handle URL actions (action property contains a URL)
    if (actionObj.action && actionObj.action !== '#' && actionObj.action.startsWith('http')) {
      window.open(actionObj.action, '_blank', 'noopener,noreferrer');
      return;
    }

    // Handle regular actions (emit event for custom handling)
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
    
    // Determine recipient email address - prioritize to, then contact.email
    let recipientEmail = '';
    if (email.to) {
      recipientEmail = Array.isArray(email.to) ? email.to.join(',') : email.to;
    } else if (email.contact?.email) {
      recipientEmail = email.contact.email;
    }
    
    if (!recipientEmail) {
      console.warn('No email address provided for email action');
      return;
    }

    // Build mailto URL parameters manually for better control over encoding
    const params: string[] = [];
    
    // Add CC if provided
    if (email.cc) {
      const cc = Array.isArray(email.cc) ? email.cc.join(',') : email.cc;
      params.push(`cc=${encodeURIComponent(cc)}`);
    }

    // Add BCC if provided
    if (email.bcc) {
      const bcc = Array.isArray(email.bcc) ? email.bcc.join(',') : email.bcc;
      params.push(`bcc=${encodeURIComponent(bcc)}`);
    }

    // Add subject if provided
    if (email.subject) {
      params.push(`subject=${encodeURIComponent(email.subject)}`);
    }

    // Process body - replace placeholders with contact information if available
    let processedBody = email.body || '';
    if (email.contact) {
      // Replace {name} placeholder if contact name is available
      if (email.contact.name) {
        processedBody = processedBody.replace(/\{name\}/g, email.contact.name);
        // Also replace common placeholders like {contact} or {recipient}
        processedBody = processedBody.replace(/\{contact\}/g, email.contact.name);
        processedBody = processedBody.replace(/\{recipient\}/g, email.contact.name);
      }
      // Replace {role} placeholder if contact role is available
      if (email.contact.role) {
        processedBody = processedBody.replace(/\{role\}/g, email.contact.role);
      }
      // Replace {email} placeholder
      if (email.contact.email) {
        processedBody = processedBody.replace(/\{email\}/g, email.contact.email);
      }
    }

    // Add body if provided - encode properly with newlines as %0D%0A
    if (processedBody) {
      // Replace newlines with %0D%0A (CRLF) for proper email formatting
      // Then encode the rest of the content
      const bodyWithLineBreaks = processedBody.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
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
    // Immediate reset when toggling fullscreen (no smooth transition needed)
    this.magneticTiltService.resetTilt(false);
  }

  get isStreamingActive(): boolean {
    return this.streamingStage === 'streaming';
  }

  get hasLoadingOverlay(): boolean {
    const isStreamingOrThinking = this.streamingStage === 'streaming' || this.streamingStage === 'thinking';
    const hasNoProcessedSections = !this.processedSections || this.processedSections.length === 0;
    const hasNoConfigSections = !this.cardConfig?.sections || this.cardConfig.sections.length === 0;
    return isStreamingOrThinking && hasNoProcessedSections && hasNoConfigSections;
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
    const primaryClasses = 'bg-[var(--color-brand)] text-white font-semibold border-0 hover:bg-[var(--color-brand)]/90 hover:shadow-lg hover:shadow-[var(--color-brand)]/40 active:scale-95';
    const outlineClasses = 'text-[var(--color-brand)] border border-[var(--color-brand)] bg-transparent font-semibold hover:bg-[var(--color-brand)]/10 active:scale-95';
    const ghostClasses = 'text-[var(--color-brand)] bg-transparent border-0 font-semibold hover:bg-[var(--color-brand)]/10 active:scale-95';

    switch (action.variant) {
      case 'secondary':
      case 'outline':
        return outlineClasses;
      case 'ghost':
        return ghostClasses;
      default:
        return primaryClasses;
    }
  }

  private refreshProcessedSections(forceStructural = false): void {
    if (!this._cardConfig?.sections?.length) {
      this.resetProcessedSections();
      return;
    }

    const sections = this._cardConfig.sections;
    const nextHash = this.hashSections(sections);
    const structureChanged = nextHash !== this.previousSectionsHash;
    const requiresStructuralRebuild =
      forceStructural ||
      structureChanged ||
      this._changeType === 'structural' ||
      !this.processedSections.length;

    // Removed excessive logging for performance

    if (requiresStructuralRebuild) {
      this.normalizedSectionCache = new WeakMap<CardSection, CardSection>();
    }

    const normalizedSections = sections.map(section => this.getNormalizedSection(section, requiresStructuralRebuild));
    const orderedSections = requiresStructuralRebuild
      ? this.sectionNormalizationService.sortSections(normalizedSections)
      : this.mergeWithPreviousOrder(normalizedSections);

    this.processedSections = orderedSections;
    this.sectionOrderKeys = orderedSections.map(section => this.getSectionKey(section));
    this.previousSectionsHash = nextHash;
    
    // Removed excessive logging for performance
    
    this.cdr.markForCheck();
  }

  private getNormalizedSection(section: CardSection, forceRebuild: boolean): CardSection {
    if (!forceRebuild) {
      const cached = this.normalizedSectionCache.get(section);
      if (cached) {
        return cached;
      }
    }

    const normalized = this.sectionNormalizationService.normalizeSection(section);
    this.normalizedSectionCache.set(section, normalized);
    return normalized;
  }

  private mergeWithPreviousOrder(normalizedSections: CardSection[]): CardSection[] {
    if (!this.sectionOrderKeys.length) {
      return normalizedSections;
    }

    const nextByKey = new Map<string, CardSection>();
    normalizedSections.forEach(section => {
      nextByKey.set(this.getSectionKey(section), section);
    });

    const ordered: CardSection[] = [];
    this.sectionOrderKeys.forEach(key => {
      const match = nextByKey.get(key);
      if (match) {
        ordered.push(match);
        nextByKey.delete(key);
      }
    });

    nextByKey.forEach(section => ordered.push(section));
    return ordered;
  }

  private getSectionKey(section: CardSection): string {
    if (section.id) {
      return section.id;
    }

    const titleKey = section.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') ?? 'section';
    const typeKey = section.type ?? 'info';
    return `${titleKey}-${typeKey}`;
  }

  private resetProcessedSections(): void {
    this.processedSections = [];
    this.sectionOrderKeys = [];
    this.previousSectionsHash = '';
    this.normalizedSectionCache = new WeakMap<CardSection, CardSection>();
    this.cdr.markForCheck();
  }
}
