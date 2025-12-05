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
  inject,
  Injector,
  isDevMode,
  PLATFORM_ID,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AICardConfig,
  CardSection,
  CardField,
  CardItem,
  CardAction,
  LegacyCardAction,
} from '../../models';
import { Subject, takeUntil, fromEvent, interval } from 'rxjs';
import { MagneticTiltService, MousePosition, TiltCalculations } from '../../services';
import { IconService, SectionNormalizationService } from '../../services';
import { LucideIconsModule } from '../../icons';
import { MasonryLayoutInfo } from '../masonry-grid/masonry-grid.component';
import { SectionRenderEvent } from '../section-renderer/section-renderer.component';
import { CardHeaderComponent } from '../card-header/card-header.component';
import { CardSectionListComponent } from '../card-section-list/card-section-list.component';
import { CardActionsComponent } from '../card-actions/card-actions.component';
import { CardChangeType } from '../../utils';
import { trigger, transition, style, animate, AnimationBuilder } from '@angular/animations';
import { isPlatformBrowser } from '@angular/common';

export interface CardFieldInteractionEvent {
  field?: CardField;
  item?: CardItem | CardField;
  action: 'click';
  sectionTitle?: string;
  metadata?: Record<string, unknown>;
}

export type StreamingStage =
  | 'idle'
  | 'thinking'
  | 'streaming'
  | 'complete'
  | 'aborted'
  | 'error'
  | undefined;

@Component({
  selector: 'app-ai-card-renderer',
  standalone: true,
  imports: [
    CommonModule,
    LucideIconsModule,
    CardHeaderComponent,
    CardSectionListComponent,
    CardActionsComponent,
  ],
  templateUrl: './ai-card-renderer.component.html',
  styleUrls: ['../../styles/bundles/_ai-card.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  animations: [
    trigger('messageAnimation', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('0.4s ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class AICardRendererComponent implements OnInit, AfterViewInit, OnDestroy {
  private _cardConfig: AICardConfig | undefined;
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly injector = inject(Injector);
  private readonly platformId = inject(PLATFORM_ID);

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

  private readonly defaultLoadingMessages = [
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
    'Waiting for the right moment...',
  ];

  /**
   * Custom loading messages to display in the empty state.
   * When not provided, uses default funny messages.
   * Messages rotate every 2.5 seconds.
   */
  @Input() loadingMessages?: string[];

  /**
   * Custom title for the empty/loading state.
   * @default 'Creating OSI Card'
   */
  @Input() loadingTitle = 'Creating OSI Card';

  /**
   * Get active loading messages (custom or default)
   */
  private get activeLoadingMessages(): string[] {
    return this.loadingMessages?.length ? this.loadingMessages : this.defaultLoadingMessages;
  }

  @Input()
  set cardConfig(value: AICardConfig | undefined) {
    this._cardConfig = value;

    if (!this._cardConfig?.sections?.length) {
      this.resetProcessedSections();
      this.cdr.markForCheck();
      return;
    }

    const sectionsHash = this.hashSections(this._cardConfig.sections);
    const shouldForceStructural =
      sectionsHash !== this.previousSectionsHash || this._updateSource === 'liveEdit';
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
      .map((section) => {
        const fieldCount = section.fields?.length ?? 0;
        const itemCount = section.items?.length ?? 0;
        return `${section.id || ''}|${section.title || ''}|${section.type || ''}|f${fieldCount}|i${itemCount}`;
      })
      .join('||');

    // Simple hash of the string
    let result = 0;
    for (let i = 0; i < hash.length; i++) {
      const char = hash.charCodeAt(i);
      result = (result << 5) - result + char;
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

  /**
   * Boolean flag to directly control streaming animation state.
   * When true, applies 'streaming-active' class to card surface for animations.
   * Alternative to using streamingStage for simpler use cases.
   */
  @Input() isStreaming = false;

  /**
   * When true, shows a loading/generating state by default when no card data is available.
   * Set to false if you want to handle loading states externally.
   * @default true
   */
  @Input() showLoadingByDefault = true;

  /**
   * Optional explicit container width from parent for reliable masonry layout.
   * When provided, this is passed to the masonry grid to avoid DOM measurement issues.
   */
  @Input() containerWidth?: number;

  /**
   * Computed effective streaming stage.
   * Returns 'thinking' when showLoadingByDefault is true and no sections are available.
   */
  get effectiveStreamingStage(): StreamingStage {
    // If an explicit stage is provided, use it
    if (this.streamingStage) {
      return this.streamingStage;
    }
    // Show loading state by default when no data is available
    if (
      this.showLoadingByDefault &&
      (!this.processedSections || this.processedSections.length === 0)
    ) {
      return 'thinking';
    }
    return undefined;
  }

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
  @Output() cardInteraction = new EventEmitter<{ action: string; card: AICardConfig }>();
  @Output() fullscreenToggle = new EventEmitter<boolean>();
  @Output() agentAction = new EventEmitter<{
    action: CardAction;
    card: AICardConfig;
    agentId?: string;
    context?: Record<string, unknown>;
  }>();
  @Output() questionAction = new EventEmitter<{
    action: CardAction;
    card: AICardConfig;
    question?: string;
  }>();
  @Output() export = new EventEmitter<void>();

  @ViewChild('cardContainer') cardContainer!: ElementRef<HTMLElement>;
  @ViewChild('tiltContainer') tiltContainerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('emptyStateContainer') emptyStateContainer!: ElementRef<HTMLDivElement>;

  processedSections: CardSection[] = [];

  /**
   * Measured container width for reliable masonry layout in Shadow DOM.
   * When containerWidth input is not provided, this is auto-measured.
   */
  private measuredContainerWidth = 0;
  private containerResizeObserver: ResizeObserver | undefined;

  /**
   * Effective container width to pass to masonry grid.
   * Uses explicit input if provided, otherwise uses measured width.
   * Falls back to window-based estimation to ensure multi-column layout works.
   */
  get effectiveContainerWidth(): number {
    // Explicit input takes priority
    if (this.containerWidth && this.containerWidth > 0) {
      return this.containerWidth;
    }
    // Use measured width if available
    if (this.measuredContainerWidth > 0) {
      return this.measuredContainerWidth;
    }
    // Window fallback - ensures multi-column layout even if measurement fails
    if (isPlatformBrowser(this.platformId) && typeof window !== 'undefined') {
      // Assume standard card width (window minus typical margins)
      return Math.max(window.innerWidth - 80, 260);
    }
    // SSR fallback
    return 600;
  }
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
  // ViewportScroller available for future scroll functionality
  // private readonly viewportScroller = inject(ViewportScroller);

  // Fallback card configuration for testing
  private fallbackCard: AICardConfig = {
    id: 'fallback-test',
    cardTitle: 'Test Company',
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
            type: 'text',
          },
          {
            id: 'employees',
            label: 'Employees',
            value: '250',
            type: 'text',
          },
        ],
      },
    ],
    actions: [
      {
        id: 'view-details',
        label: 'View Details',
        variant: 'primary',
      },
    ],
  };

  ngOnInit(): void {
    // Validate animations provider in development mode
    if (isDevMode() && isPlatformBrowser(this.platformId)) {
      this.validateAnimationsProvider();
    }

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
                '--reflection-opacity': pendingCalculations.reflectionOpacity,
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
    // Fragment handling removed for standalone library
    // Consumers can implement their own fragment handling if needed

    // Set up container width measurement for Shadow DOM compatibility
    this.setupContainerWidthMeasurement();
  }

  /**
   * Sets up width measurement for the card container.
   * This ensures reliable masonry layout in Shadow DOM environments.
   */
  private setupContainerWidthMeasurement(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Initial measurement
    this.measureContainerWidth();

    // Set up ResizeObserver for dynamic width changes
    if (typeof ResizeObserver !== 'undefined' && this.cardContainer?.nativeElement) {
      this.containerResizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          const newWidth = entry.contentRect.width;
          if (newWidth > 0 && Math.abs(newWidth - this.measuredContainerWidth) > 4) {
            this.measuredContainerWidth = newWidth;
            this.cdr.markForCheck();
          }
        }
      });
      this.containerResizeObserver.observe(this.cardContainer.nativeElement);
    }
  }

  /**
   * Measures the container width using multiple fallback methods.
   * Works reliably in both regular DOM and Shadow DOM contexts.
   */
  private measureContainerWidth(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Try cardContainer first
    if (this.cardContainer?.nativeElement) {
      const rect = this.cardContainer.nativeElement.getBoundingClientRect();
      if (rect.width > 0) {
        this.measuredContainerWidth = rect.width;
        return;
      }
    }

    // Try host element
    const hostEl = this.el.nativeElement;
    if (hostEl) {
      const hostRect = hostEl.getBoundingClientRect();
      if (hostRect.width > 0) {
        this.measuredContainerWidth = hostRect.width;
        return;
      }

      // Try parent element
      const parent = hostEl.parentElement;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        if (parentRect.width > 0) {
          this.measuredContainerWidth = parentRect.width;
          return;
        }
      }
    }

    // Schedule retry if no width found
    if (this.measuredContainerWidth === 0) {
      requestAnimationFrame(() => {
        this.measureContainerWidth();
      });
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
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private initializeParticles(): void {
    // Create 20 smaller particles for smoother mouse following trail
    this.particles = Array.from({ length: 20 }, () => ({
      transform: 'translate(0, 0) scale(1)',
      opacity: 0.5,
    }));
  }

  private startMessageRotation(): void {
    const messages = this.activeLoadingMessages;
    if (messages.length === 0) {
      this.currentMessage = 'Loading...';
      return;
    }
    this.currentMessage = messages[0] || 'Loading...';
    this.currentMessageIndex = 0;

    interval(2500) // Change message every 2.5 seconds
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        const activeMessages = this.activeLoadingMessages;
        this.currentMessageIndex = (this.currentMessageIndex + 1) % activeMessages.length;
        this.currentMessage = activeMessages[this.currentMessageIndex] || 'Loading...';
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

    this.particles = this.particles.map((_particle, index) => {
      // Create a trailing effect with exponential easing
      const delay = index * 0.08;
      const followStrength = 0.4 - delay * 0.3; // Particles further back follow less
      const spiralRadius = 15 + (index % 4) * 8;
      const angle = (index * 137.5) % 360; // Golden angle for spiral distribution
      const angleRad = (angle * Math.PI) / 180;

      // Calculate spiral offset
      const spiralX = Math.cos(angleRad) * spiralRadius;
      const spiralY = Math.sin(angleRad) * spiralRadius;

      // Smooth following with easing
      const targetX = deltaX * followStrength + spiralX;
      const targetY = deltaY * followStrength + spiralY;

      // Opacity based on distance and position
      const baseOpacity = 0.5;
      const distanceOpacity = normalizedDistance * 0.3;
      const positionOpacity =
        (1 - Math.abs(index - this.particles.length / 2) / this.particles.length) * 0.2;
      const finalOpacity = Math.min(1, baseOpacity + distanceOpacity + positionOpacity);

      return {
        transform: `translate(${targetX}px, ${targetY}px) scale(${0.8 + normalizedDistance * 0.4})`,
        opacity: finalOpacity,
      };
    });

    this.cdr.markForCheck();
  }

  private resetParticles(): void {
    this.particles = this.particles.map(() => ({
      transform: 'translate(0, 0) scale(1)',
      opacity: 0.5,
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

    // Clean up ResizeObserver
    if (this.containerResizeObserver) {
      this.containerResizeObserver.disconnect();
      this.containerResizeObserver = undefined;
    }

    this.destroyed$.next();
    this.destroyed$.complete();
  }

  onMouseEnter(event: MouseEvent): void {
    this.isHovered = true;
    this.mousePosition = { x: event.clientX, y: event.clientY };
    if (this.tiltContainerRef?.nativeElement) {
      // Smooth enter: calculate tilt immediately for responsive feel
      this.magneticTiltService.calculateTilt(
        this.mousePosition,
        this.tiltContainerRef.nativeElement
      );
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
            y: this.pendingMouseMove.clientY,
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
    const event: CardFieldInteractionEvent = {
      field,
      action: 'click',
    };
    if (section?.title) {
      event.sectionTitle = section.title;
    }
    this.fieldInteraction.emit(event);
  }

  /**
   * Type guard to check if action has email property
   */
  private hasEmailProperty(
    action: CardAction
  ): action is CardAction & { email: NonNullable<LegacyCardAction['email']> } {
    return 'email' in action && action.email !== undefined;
  }

  onActionClick(actionObj: CardAction): void {
    if (!this.cardConfig) {
      return;
    }

    // Handle button types based on 'type' field from JSON
    // Check if type is a button behavior type (not legacy styling value)
    if (actionObj.type && ['mail', 'website', 'agent', 'question'].includes(actionObj.type)) {
      switch (actionObj.type) {
        case 'mail':
          if (this.hasEmailProperty(actionObj)) {
            this.handleEmailAction(actionObj);
          } else {
            console.error('Mail action requires email configuration');
          }
          return;

        case 'website':
          // Use url property if available, otherwise fall back to action property
          const url = actionObj.url || actionObj.action;
          if (url && url !== '#' && (url.startsWith('http://') || url.startsWith('https://'))) {
            window.open(url, '_blank', 'noopener,noreferrer');
          } else {
            console.warn('No valid URL provided for website button type');
          }
          return;

        case 'agent':
          const agentEvent: {
            action: CardAction;
            card: AICardConfig;
            agentId?: string;
            context?: Record<string, unknown>;
          } = {
            action: actionObj,
            card: this.cardConfig,
          };
          if (actionObj.agentId) {
            agentEvent.agentId = actionObj.agentId;
          }
          const agentContext = actionObj.agentContext || actionObj.meta;
          if (agentContext) {
            agentEvent.context = agentContext as Record<string, unknown>;
          }
          this.agentAction.emit(agentEvent);
          return;

        case 'question':
          this.questionAction.emit({
            action: actionObj,
            card: this.cardConfig,
            question: actionObj.question || actionObj.label,
          });
          return;

        default:
          // Should not reach here, but fall through to legacy handling
          break;
      }
    }

    // Legacy handling for backwards compatibility
    // If type is 'primary' or 'secondary' (legacy styling), treat as regular action
    // Handle email actions (email property present)
    if (this.hasEmailProperty(actionObj)) {
      this.handleEmailAction(actionObj);
      return;
    }

    // Handle URL actions (action property contains a URL)
    if (actionObj.action && actionObj.action !== '#' && actionObj.action.startsWith('http')) {
      window.open(actionObj.action, '_blank', 'noopener,noreferrer');
      return;
    }

    // Handle regular actions (emit event for custom handling)
    const action = actionObj.action || actionObj.label;
    this.cardInteraction.emit({
      action: action,
      card: this.cardConfig,
    });
  }

  private handleEmailAction(
    action: CardAction & { email: NonNullable<LegacyCardAction['email']> }
  ): void {
    // Check if we're in a browser environment
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('Email action can only be executed in a browser environment');
      return;
    }

    // Validate that email configuration exists
    if (!action.email) {
      console.error('Email action requires email configuration');
      return;
    }

    const email = action.email;

    // Validate required fields for mail type
    if (action.type === 'mail') {
      if (!email.contact) {
        console.error('Mail action requires email.contact with name, email, and role');
        return;
      }
      if (!email.contact.name || !email.contact.email || !email.contact.role) {
        console.error(
          'Mail action requires email.contact.name, email.contact.email, and email.contact.role'
        );
        return;
      }
      if (!email.subject) {
        console.error('Mail action requires email.subject');
        return;
      }
      if (!email.body) {
        console.error('Mail action requires email.body');
        return;
      }
    }

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

    // Add subject - required for mail type, optional for legacy
    if (email.subject) {
      params.push(`subject=${encodeURIComponent(email.subject)}`);
    } else if (action.type === 'mail') {
      console.warn('Email subject is missing for mail action');
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

    // Add body - required for mail type, optional for legacy
    if (processedBody) {
      // Replace newlines with %0D%0A (CRLF) for proper email formatting
      // Then encode the rest of the content
      const bodyWithLineBreaks = processedBody.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const encodedBody = encodeURIComponent(bodyWithLineBreaks).replace(/%0A/g, '%0D%0A');
      params.push(`body=${encodedBody}`);
    } else if (action.type === 'mail') {
      console.warn('Email body is missing for mail action');
    }

    // Construct mailto link
    const queryString = params.length > 0 ? '?' + params.join('&') : '';
    const mailtoLink = `mailto:${recipientEmail}${queryString}`;

    // Convert to Outlook URL scheme (platform-specific)
    // Windows: Use mailto: (New Outlook doesn't support custom schemes)
    // Mac: Use ms-outlook: (forces Outlook desktop app)
    const isWindows = typeof navigator !== 'undefined' &&
      (/Win/i.test(navigator.platform) || /Windows/i.test(navigator.userAgent));
    const outlookLink = isWindows ? mailtoLink : `ms-outlook:${mailtoLink}`;

    // Detect Edge browser for specific handling
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isEdgeChromium = /Edg/i.test(userAgent) && !/OPR/i.test(userAgent);

    try {
      // Edge-specific handling: Edge Chromium sometimes blocks programmatic clicks
      // Use window.location.href as primary method for Edge, anchor click for others
      if (isEdgeChromium) {
        // For Edge, use window.location.href directly (most reliable)
        window.location.href = outlookLink;
      } else if (typeof document !== 'undefined' && document.body) {
        // For other browsers, try anchor click method first
        const anchor = document.createElement('a');
        anchor.href = outlookLink;
        // Edge may require the element to be in the DOM and visible (even briefly)
        // Use a more Edge-compatible approach: minimal visibility
        anchor.style.position = 'absolute';
        anchor.style.left = '-9999px';
        anchor.style.opacity = '0';
        anchor.style.pointerEvents = 'none';
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('rel', 'noopener noreferrer');

        document.body.appendChild(anchor);

        // Use requestAnimationFrame to ensure DOM is ready (Edge compatibility)
        requestAnimationFrame(() => {
          try {
            anchor.click();
          } catch (clickError) {
            // If click fails, fall back to window.location
            console.warn('Anchor click failed, using window.location fallback:', clickError);
            window.location.href = outlookLink;
          }

          // Remove anchor after a short delay
          setTimeout(() => {
            if (document.body.contains(anchor)) {
              document.body.removeChild(anchor);
            }
          }, 200);
        });
      } else {
        // Fallback: use window.location if document.body is not available
        window.location.href = outlookLink;
      }
    } catch (error) {
      console.error('Failed to open email client:', error);
      // Final fallback: try direct window.location
      try {
        window.location.href = outlookLink;
      } catch (fallbackError) {
        console.error('Failed to open email client with fallback method:', fallbackError);
        // Last resort: try window.open (may be blocked by popup blockers)
        try {
          const mailtoWindow = window.open(outlookLink, '_blank');
          if (!mailtoWindow) {
            console.warn(
              'Popup blocked. Please allow popups for this site to use email functionality.'
            );
          }
        } catch (openError) {
          console.error('All email client opening methods failed:', openError);
        }
      }
    }
  }

  toggleFullscreen(): void {
    this.fullscreenToggle.emit(!this.isFullscreen);
    // Immediate reset when toggling fullscreen (no smooth transition needed)
    this.magneticTiltService.resetTilt(false);
  }

  /**
   * Emit export event for parent components to handle card export/download
   */
  onExport(): void {
    this.export.emit();
  }

  /**
   * Get the card element for export purposes.
   * Returns the host element (the component itself) for PNG/image export.
   * This captures the entire Shadow DOM rendered content.
   */
  getExportElement(): HTMLElement | null {
    return this.el.nativeElement || null;
  }

  get isStreamingActive(): boolean {
    return this.isStreaming || this.streamingStage === 'streaming';
  }

  get hasLoadingOverlay(): boolean {
    const isStreamingOrThinking =
      this.streamingStage === 'streaming' || this.streamingStage === 'thinking';
    const hasNoProcessedSections = !this.processedSections || this.processedSections.length === 0;
    const hasNoConfigSections = !this.cardConfig?.sections || this.cardConfig.sections.length === 0;
    return isStreamingOrThinking && hasNoProcessedSections && hasNoConfigSections;
  }

  trackSection = (_index: number, section: CardSection): string =>
    section.id ?? `${section.title}-${_index}`;

  trackField = (_index: number, field: CardField): string => field.id ?? `${field.label}-${_index}`;

  trackItem = (_index: number, item: CardItem): string => item.id ?? `${item.title}-${_index}`;

  trackAction = (_index: number, action: CardAction): string =>
    action.id ?? `${action.label}-${_index}`;

  onSectionEvent(event: SectionRenderEvent): void {
    switch (event.type) {
      case 'field':
        if (event.field) {
          const fieldEvent: CardFieldInteractionEvent = {
            field: event.field,
            action: 'click',
            sectionTitle:
              (event.metadata?.['sectionTitle'] as string | undefined) ?? event.section.title,
          };
          if (event.metadata) {
            fieldEvent.metadata = event.metadata;
          }
          this.fieldInteraction.emit(fieldEvent);
        }
        break;
      case 'item':
        if (event.item) {
          const itemEvent: CardFieldInteractionEvent = {
            item: event.item,
            action: 'click',
            sectionTitle:
              (event.metadata?.['sectionTitle'] as string | undefined) ?? event.section.title,
          };
          if (event.metadata) {
            itemEvent.metadata = event.metadata;
          }
          this.fieldInteraction.emit(itemEvent);
        }
        break;
      case 'action':
        if (event.action && this.cardConfig) {
          const identifier =
            event.action.action ?? event.action.id ?? event.action.label ?? 'section-action';
          this.cardInteraction.emit({
            action: identifier,
            card: this.cardConfig,
          });
        }
        break;
      default:
        break;
    }
  }

  onLayoutChange(_layout: MasonryLayoutInfo): void {
    // Layout change handler - kept for potential future use
  }

  getActionIconName(action: CardAction): string {
    // If icon is explicitly provided, use it
    if (action.icon) {
      return this.iconService.getFieldIcon(action.icon);
    }

    // If type is specified and it's a button behavior type (not legacy styling), use default icons
    if (action.type && ['mail', 'website', 'agent', 'question'].includes(action.type)) {
      switch (action.type) {
        case 'mail':
          return 'mail';
        case 'website':
          return 'external-link';
        case 'agent':
          return 'user';
        case 'question':
          return 'message-circle';
        default:
          break;
      }
    }

    // Fallback to deriving icon from label
    return this.iconService.getFieldIcon(action.label);
  }

  /**
   * Get the default icon name for a button type (returns lucide icon name)
   * Uses 'type' field from JSON for button behavior
   */
  getDefaultIconForButtonType(buttonType?: string): string | null {
    if (!buttonType || !['mail', 'website', 'agent', 'question'].includes(buttonType)) {
      return null;
    }

    switch (buttonType) {
      case 'mail':
        return 'mail';
      case 'website':
        return 'external-link';
      case 'agent':
        return 'user';
      case 'question':
        return 'message-circle';
      default:
        return null;
    }
  }

  /**
   * Get the icon name to display for an action button
   * Returns the icon name (lucide icon name) or null if no icon should be shown
   */
  getActionIconNameForDisplay(action: CardAction): string | null {
    // If explicit icon is provided and it's a URL, return null (will be handled as image)
    if (action.icon && action.icon.startsWith('http')) {
      return null;
    }

    // If explicit icon is provided and it's a lucide icon name, use it
    if (action.icon && !action.icon.startsWith('http')) {
      // Check if it's a lucide icon name (simple string like 'mail', 'user', etc.)
      if (/^[a-z-]+$/i.test(action.icon)) {
        return this.getActionIconName(action);
      }
      // Otherwise it's a text icon, return null (will be handled as text)
      return null;
    }

    // If no explicit icon, check if type is a button behavior type with default icon
    if (action.type && ['mail', 'website', 'agent', 'question'].includes(action.type)) {
      return this.getDefaultIconForButtonType(action.type);
    }

    // Fallback: try to derive icon from label
    const derivedIcon = this.getActionIconName(action);
    // Only use if it's a valid lucide icon name (simple string)
    if (derivedIcon && /^[a-z-]+$/i.test(derivedIcon)) {
      return derivedIcon;
    }

    return null;
  }

  /**
   * Check if action has a text icon (non-lucide, non-URL)
   */
  hasTextIcon(action: CardAction): boolean {
    return !!(action.icon && !action.icon.startsWith('http') && !/^[a-z-]+$/i.test(action.icon));
  }

  /**
   * Check if action has an image icon (URL)
   */
  hasImageIcon(action: CardAction): boolean {
    return !!(action.icon && action.icon.startsWith('http'));
  }

  getActionButtonClasses(action: CardAction): string {
    const primaryClasses =
      'bg-[var(--color-brand)] text-white font-semibold border-0 hover:bg-[var(--color-brand)]/90 hover:shadow-lg hover:shadow-[var(--color-brand)]/40 active:scale-95';
    const outlineClasses =
      'text-[var(--color-brand)] border border-[var(--color-brand)] bg-transparent font-semibold hover:bg-[var(--color-brand)]/10 active:scale-95';
    const ghostClasses =
      'text-[var(--color-brand)] bg-transparent border-0 font-semibold hover:bg-[var(--color-brand)]/10 active:scale-95';

    // Use variant field if present, otherwise check legacy type field for styling
    const styleVariant =
      action.variant ||
      (action.type === 'primary' || action.type === 'secondary' ? action.type : 'primary');

    switch (styleVariant) {
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

    const normalizedSections = sections.map((section) =>
      this.getNormalizedSection(section, requiresStructuralRebuild)
    );
    const orderedSections = requiresStructuralRebuild
      ? this.sectionNormalizationService.sortSections(normalizedSections)
      : this.mergeWithPreviousOrder(normalizedSections);

    this.processedSections = orderedSections;
    this.sectionOrderKeys = orderedSections.map((section) => this.getSectionKey(section));
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
    normalizedSections.forEach((section) => {
      nextByKey.set(this.getSectionKey(section), section);
    });

    const ordered: CardSection[] = [];
    this.sectionOrderKeys.forEach((key) => {
      const match = nextByKey.get(key);
      if (match) {
        ordered.push(match);
        nextByKey.delete(key);
      }
    });

    nextByKey.forEach((section) => ordered.push(section));
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

  /**
   * TrackBy function for particle animations
   */
  trackByParticle(index: number): number {
    return index;
  }

  /**
   * Validates that animation providers are configured.
   * Warns in development mode if animations are not available.
   */
  private validateAnimationsProvider(): void {
    try {
      // Try to inject AnimationBuilder - if animations are not provided, this will throw
      const animationBuilder = this.injector.get(AnimationBuilder, null, { optional: true });

      if (!animationBuilder) {
        console.warn(
          '⚠️ OSI Cards Library: Animation providers may not be configured.\n' +
            'The library requires animation providers to function correctly.\n' +
            'Please add provideOSICards() to your app.config.ts providers array:\n\n' +
            "  import { provideOSICards } from 'osi-cards-lib';\n" +
            '  export const appConfig: ApplicationConfig = {\n' +
            '    providers: [provideOSICards(), ...]\n' +
            '  };\n\n' +
            'See https://github.com/Inutilepat83/OSI-Cards for more information.'
        );
      }
    } catch (error) {
      // AnimationBuilder injection failed - likely no animations provider
      console.warn(
        '⚠️ OSI Cards Library: Animation providers are not configured.\n' +
          'The library requires animation providers for proper functionality.\n' +
          'Please add provideOSICards() to your app.config.ts providers array.\n' +
          'See documentation for setup instructions.'
      );
    }
  }
}
