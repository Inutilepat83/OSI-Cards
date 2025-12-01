import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  AICardConfig,
  CardAction,
  CardField,
  CardItem,
  CardSection,
  MailCardAction,
} from '../../../models';
import { delay, distinctUntilChanged, filter, fromEvent, interval, Subject, takeUntil } from 'rxjs';
import { MagneticTiltService, MousePosition, TiltCalculations } from '../../../core';
import { SectionNormalizationService } from 'projects/osi-cards-lib/src/lib/services';
import { LucideIconsModule } from '../../icons/lucide-icons.module';
import { MasonryGridComponent } from 'projects/osi-cards-lib/src/lib/components/masonry-grid/masonry-grid.component';
import type { MasonryLayoutInfo } from 'projects/osi-cards-lib/src/lib/components/masonry-grid/masonry-grid.component';
import { SectionRenderEvent } from './section-renderer/section-renderer.component';
import { CardChangeType } from 'projects/osi-cards-lib/src/lib/utils/card-diff.util';
import { animate, style, transition, trigger } from '@angular/animations';
import { LoggingService } from '../../../core/services/logging.service';
import { DevelopmentWarningsService } from '../../../core/services/development-warnings.service';
// Import from library (consolidated)
import {
  CardActionsComponent,
  CardHeaderComponent,
  CardSectionListComponent,
  CardStreamingIndicatorComponent,
} from 'projects/osi-cards-lib/src/lib/components';
import { StreamingStage } from 'projects/osi-cards-lib/src/lib/types';

export interface CardFieldInteractionEvent {
  field?: CardField;
  item?: CardItem | CardField;
  action: 'click';
  sectionTitle?: string;
  metadata?: Record<string, unknown>;
}

/**
 * AI Card Renderer Component
 *
 * Main component for rendering OSI Cards with interactive features and animations.
 * Orchestrates the rendering of card sections through the masonry grid layout engine.
 *
 * Features:
 * - Card configuration rendering with section normalization
 * - Magnetic tilt effect for interactive cards
 * - Empty state with animated messages
 * - Section event handling and propagation
 * - Layout change detection and optimization
 * - Export functionality integration
 * - Fullscreen mode support
 *
 * The component processes card configurations, normalizes sections, and delegates
 * rendering to the MasonryGridComponent which handles responsive layout.
 *
 * @example
 * ```html
 * <app-ai-card-renderer
 *   [cardConfig]="myCard"
 *   [tiltEnabled]="true"
 *   [isFullscreen]="false"
 *   (sectionEvent)="onSectionEvent($event)"
 *   (layoutChange)="onLayoutChange($event)"
 *   (export)="onExport()">
 * </app-ai-card-renderer>
 * ```
 */
@Component({
  selector: 'app-ai-card-renderer',
  standalone: true,
  imports: [
    CommonModule,
    LucideIconsModule,
    CardHeaderComponent,
    CardActionsComponent,
    CardStreamingIndicatorComponent,
    CardSectionListComponent,
  ],
  templateUrl: './ai-card-renderer.component.html',
  styleUrls: ['./ai-card-renderer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('messageAnimation', [
      transition('* => *', [
        style({
          opacity: 0,
          transform: 'translateY(10px)',
          willChange: 'opacity, transform', // Optimize for GPU acceleration
        }),
        animate(
          '0.4s ease-out',
          style({
            opacity: 1,
            transform: 'translateY(0)',
            willChange: 'auto', // Remove will-change after animation
          })
        ),
      ]),
    ]),
  ],
})
export class AICardRendererComponent implements OnInit, AfterViewInit, OnDestroy {
  private _cardConfig?: AICardConfig;
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly logger = inject(LoggingService);
  private readonly devWarnings = inject(DevelopmentWarningsService);

  // Expose Math for template
  Math = Math;

  private previousSectionsHash = '';
  private normalizedSectionCache = new WeakMap<CardSection, CardSection>();
  private sectionHashCache = new WeakMap<CardSection[], string>();
  private sectionOrderKeys: string[] = [];
  private _changeType: CardChangeType = 'structural';

  // Empty state animations
  particles: { transform: string; opacity: number }[] = [];
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
    'Waiting for the right moment...',
  ];

  @Input()
  set cardConfig(value: AICardConfig | undefined) {
    if (value === undefined) {
      this._cardConfig = undefined as unknown as AICardConfig;
    } else {
      this._cardConfig = value;
    }

    // Validate card configuration in development mode
    this.devWarnings.validateCardConfig(this._cardConfig, 'AICardRendererComponent');

    if (!this._cardConfig?.sections?.length) {
      this.resetProcessedSections();
      this.cdr.markForCheck();
      return;
    }

    const sectionsHash = this.hashSections(this._cardConfig.sections);
    // Don't force structural rebuild for liveEdit - let hash determine if structure changed
    // This allows content-only updates to preserve references
    const shouldForceStructural = sectionsHash !== this.previousSectionsHash;
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
  @Input() streamingStage: StreamingStage | undefined;
  @Input() streamingProgress?: number; // Progress 0-1
  @Input() streamingProgressLabel?: string; // e.g., "STREAMING JSON (75%)"

  /**
   * Whether to show loading state by default when no sections are available.
   * Set to false if you want to handle loading states externally.
   * @default true
   */
  @Input() showLoadingByDefault = true;

  /**
   * Flag indicating active streaming mode
   * When true, disables CSS animations to prevent blinking during rapid updates
   */
  @Input() isStreaming = false;

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
  @Output() export = new EventEmitter<void>();
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

  /**
   * Computed effective streaming stage.
   * Returns 'thinking' when showLoadingByDefault is true and no sections are available.
   */
  get effectiveStreamingStage(): StreamingStage | undefined {
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

  /**
   * Returns the host element (the component itself) for PNG/image export.
   * This captures the entire Shadow DOM rendered content.
   */
  getExportElement(): HTMLElement | null {
    return this.el.nativeElement || null;
  }

  @ViewChild('cardContainer') cardContainer!: ElementRef<HTMLElement>;
  @ViewChild('tiltContainer') tiltContainerRef!: ElementRef<HTMLDivElement>;
  @ViewChild(MasonryGridComponent) masonryGrid!: MasonryGridComponent;
  @ViewChild('emptyStateContainer') emptyStateContainer!: ElementRef<HTMLDivElement>;

  processedSections: CardSection[] = [];
  isHovered = false;
  mousePosition: MousePosition = { x: 0, y: 0 };

  // CSS variables for the tilt effect - initialize with no transform to prevent lift
  tiltStyle: Record<string, string | number> = {
    '--tilt-x': '0deg',
    '--tilt-y': '0deg',
    '--glow-blur': '8px',
    '--glow-color': 'rgba(255,121,0,0.225)',
    '--reflection-opacity': 0,
  };

  // Performance: RAF batching for mouse moves
  private mouseMoveRafId: number | null = null;
  private pendingMouseMove: MouseEvent | null = null;

  // Point 16: Make tiltRafId a class property for proper cleanup
  private tiltRafId: number | null = null;

  // Point 17: isDestroyed flag to prevent post-destroy callbacks
  private isDestroyed = false;

  // Point 14: Visibility tracking
  private isVisible = true;
  private visibilityObserver?: IntersectionObserver;

  // Point 18: Last tilt values for threshold-based change detection
  private lastTiltValues = {
    rotateX: 0,
    rotateY: 0,
    glowBlur: 0,
    glowOpacity: 0,
    reflectionOpacity: 0,
  };

  // Point 7-8: Container width measurement for reliable multi-column layout
  measuredContainerWidth = 0;
  private containerResizeObserver?: ResizeObserver;
  private lastValidContainerWidth = 0;

  private readonly destroyed$ = new Subject<void>();
  private readonly magneticTiltService = inject(MagneticTiltService);
  private readonly sectionNormalizationService = inject(SectionNormalizationService);
  private readonly route = inject(ActivatedRoute);

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
    // Immediately set a reasonable width fallback for streaming
    // This ensures multi-column layout from the start
    if (typeof window !== 'undefined' && this.measuredContainerWidth === 0) {
      this.measuredContainerWidth = Math.max(window.innerWidth - 80, 500);
      this.lastValidContainerWidth = this.measuredContainerWidth;
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

    // Point 11 & 12: Subscribe to tilt calculations
    // Service already handles RAF batching and change detection, so no double-RAF needed
    this.magneticTiltService.tiltCalculations$
      .pipe(
        takeUntil(this.destroyed$),
        // Point 12: distinctUntilChanged with custom comparator
        distinctUntilChanged(
          (prev, curr) =>
            Math.abs(prev.rotateX - curr.rotateX) < 0.001 &&
            Math.abs(prev.rotateY - curr.rotateY) < 0.001 &&
            Math.abs(prev.glowBlur - curr.glowBlur) < 0.001 &&
            Math.abs(prev.glowOpacity - curr.glowOpacity) < 0.001 &&
            Math.abs(prev.reflectionOpacity - curr.reflectionOpacity) < 0.001
        )
      )
      .subscribe((calculations: TiltCalculations) => {
        // Point 17: Check if destroyed before processing
        if (this.isDestroyed) {
          return;
        }

        // Point 14: Skip if not visible
        if (!this.isVisible) {
          return;
        }

        // Point 13 & 18: Batch CSS updates with threshold check
        const threshold = 0.01;
        const hasChanged =
          Math.abs(calculations.rotateX - this.lastTiltValues.rotateX) > threshold ||
          Math.abs(calculations.rotateY - this.lastTiltValues.rotateY) > threshold ||
          Math.abs(calculations.glowBlur - this.lastTiltValues.glowBlur) > threshold ||
          Math.abs(calculations.glowOpacity - this.lastTiltValues.glowOpacity) > threshold ||
          Math.abs(calculations.reflectionOpacity - this.lastTiltValues.reflectionOpacity) >
            threshold;

        if (!hasChanged) {
          return;
        }

        // Update last values
        this.lastTiltValues = {
          rotateX: calculations.rotateX,
          rotateY: calculations.rotateY,
          glowBlur: calculations.glowBlur,
          glowOpacity: calculations.glowOpacity,
          reflectionOpacity: calculations.reflectionOpacity,
        };

        // Point 13: Mutate existing object instead of creating new one each frame
        this.tiltStyle['--tilt-x'] = `${calculations.rotateX}deg`;
        this.tiltStyle['--tilt-y'] = `${calculations.rotateY}deg`;
        this.tiltStyle['--glow-blur'] = `${calculations.glowBlur}px`;
        this.tiltStyle['--glow-color'] = `rgba(255,121,0,${calculations.glowOpacity})`;
        this.tiltStyle['--reflection-opacity'] = calculations.reflectionOpacity;

        this.cdr.markForCheck();
      });
  }

  ngAfterViewInit(): void {
    // Point 7: Setup container width measurement with ResizeObserver
    this.setupContainerWidthMeasurement();

    // Point 14: Setup visibility observer to skip tilt calculations when not visible
    this.setupVisibilityObserver();

    // Handle URL fragment scrolling to sections
    this.route.fragment
      .pipe(
        filter((fragment) => !!fragment),
        delay(100),
        takeUntil(this.destroyed$)
      )
      .subscribe((fragment) => {
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
   * Point 14: Setup IntersectionObserver to track component visibility
   * Skip tilt calculations when component is not visible
   */
  private setupVisibilityObserver(): void {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.visibilityObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          this.isVisible = entry.isIntersecting;
        }
      },
      { threshold: 0 }
    );

    if (this.cardContainer?.nativeElement) {
      this.visibilityObserver.observe(this.cardContainer.nativeElement);
    }
  }

  /**
   * Point 7: Setup ResizeObserver to measure actual container width
   * This ensures reliable multi-column layout even before first render
   */
  private setupContainerWidthMeasurement(): void {
    if (typeof ResizeObserver === 'undefined') {
      // Fallback for browsers without ResizeObserver
      this.measureContainerWidth();
      return;
    }

    this.containerResizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0) {
          this.measuredContainerWidth = width;
          this.lastValidContainerWidth = width;
          this.cdr.markForCheck();
        }
      }
    });

    // Observe the card container
    if (this.cardContainer?.nativeElement) {
      this.containerResizeObserver.observe(this.cardContainer.nativeElement);
    }

    // Also do immediate measurement
    this.measureContainerWidth();
  }

  /**
   * Point 8: Measure container width with fallback chain
   * Point 11: Fallback: inputWidth -> cachedWidth -> DOMWidth -> parentWidth -> windowWidth - 80px
   */
  private measureContainerWidth(): void {
    // Try card container first
    const cardEl = this.cardContainer?.nativeElement;
    if (cardEl) {
      const width = cardEl.clientWidth || cardEl.getBoundingClientRect().width;
      if (width > 0) {
        this.measuredContainerWidth = width;
        this.lastValidContainerWidth = width;
        return;
      }
    }

    // Try parent element
    const hostEl = this.el.nativeElement;
    if (hostEl?.parentElement) {
      const parentWidth = hostEl.parentElement.clientWidth;
      if (parentWidth > 0) {
        this.measuredContainerWidth = parentWidth;
        this.lastValidContainerWidth = parentWidth;
        return;
      }
    }

    // Fallback to window width - 80px for margins
    if (typeof window !== 'undefined') {
      this.measuredContainerWidth = Math.max(window.innerWidth - 80, 280);
      this.lastValidContainerWidth = this.measuredContainerWidth;
    }
  }

  /**
   * Point 8: Get effective container width with cache fallback
   */
  get effectiveContainerWidth(): number {
    // Return measured width if valid, otherwise cached, otherwise fallback
    if (this.measuredContainerWidth > 0) {
      return this.measuredContainerWidth;
    }
    if (this.lastValidContainerWidth > 0) {
      return this.lastValidContainerWidth;
    }
    // Window fallback
    if (typeof window !== 'undefined') {
      return Math.max(window.innerWidth - 80, 280);
    }
    return 600; // Reasonable default
  }

  /**
   * Scrolls to a section by ID or sanitized title
   */
  private scrollToSection(sectionId: string): void {
    if (typeof document === 'undefined') {
      return;
    }

    // Try direct ID match first
    let targetElement = document.getElementById(sectionId);

    // If not found, try to find by sanitized section title
    if (!targetElement) {
      const section = this.processedSections.find(
        (s) => this.sanitizeSectionId(s.title) === sectionId
      );
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
        behavior: 'smooth',
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
    const firstMessage = this.funnyMessages[0];
    this.currentMessage = firstMessage ?? 'Loading...';
    this.currentMessageIndex = 0;

    interval(2500) // Change message every 2.5 seconds
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.currentMessageIndex = (this.currentMessageIndex + 1) % this.funnyMessages.length;
        const message = this.funnyMessages[this.currentMessageIndex];
        this.currentMessage = message ?? 'Loading...';
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
    if (!this.emptyStateContainer) {
      return;
    }

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
    if (!this.emptyStateContainer) {
      return;
    }

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
      const delayFactor = typeof delay === 'number' ? delay : 0;
      const followStrength = 0.4 - delayFactor * 0.3; // Particles further back follow less
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
    this.particles = this.particles.map((_particle) => ({
      transform: 'translate(0, 0) scale(1)',
      opacity: 0.5,
    }));
    this.cdr.markForCheck();
  }

  private updateGradientTransform(): void {
    if (!this.emptyStateContainer) {
      return;
    }

    const rect = this.emptyStateContainer.nativeElement.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const deltaX = (this.mouseX - centerX) * 0.1;
    const deltaY = (this.mouseY - centerY) * 0.1;

    this.gradientTransform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
    this.cdr.markForCheck();
  }

  private updateContentTransform(): void {
    if (!this.emptyStateContainer) {
      return;
    }

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
    // Point 17: Set destroyed flag first
    this.isDestroyed = true;

    // Point 15 & 16: Cancel any pending RAFs
    if (this.mouseMoveRafId !== null) {
      cancelAnimationFrame(this.mouseMoveRafId);
      this.mouseMoveRafId = null;
    }
    if (this.tiltRafId !== null) {
      cancelAnimationFrame(this.tiltRafId);
      this.tiltRafId = null;
    }

    // Disconnect container width observer
    this.containerResizeObserver?.disconnect();

    // Point 14: Disconnect visibility observer
    this.visibilityObserver?.disconnect();

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

    // Always update mouse position immediately for responsive feel
    this.mousePosition = {
      x: event.clientX,
      y: event.clientY,
    };

    // Store latest mouse position for RAF batching
    this.pendingMouseMove = event;

    // Throttle with RAF for 60fps smooth updates (prevents lag over interactive elements)
    if (this.mouseMoveRafId === null) {
      this.mouseMoveRafId = requestAnimationFrame(() => {
        if (this.pendingMouseMove && this.tiltContainerRef?.nativeElement) {
          // Use latest position for ultra-smooth updates
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
    if (section?.title !== undefined) {
      event.sectionTitle = section.title;
    }
    this.fieldInteraction.emit(event);
  }

  /**
   * Type guard to check if action has email property
   */
  /**
   * Type guard to check if action has email property with proper structure
   */
  private hasEmailProperty(action: CardAction): action is MailCardAction {
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
            this.logger.error(
              'Mail action requires email configuration',
              'AICardRendererComponent'
            );
          }
          return;

        case 'website':
          // Use url property if available, otherwise fall back to action property
          const url = actionObj.url || actionObj.action;
          if (url && url !== '#' && (url.startsWith('http://') || url.startsWith('https://'))) {
            window.open(url, '_blank', 'noopener,noreferrer');
          } else {
            this.logger.warn(
              'No valid URL provided for website button type',
              'AICardRendererComponent'
            );
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
          if (actionObj.agentId !== undefined) {
            agentEvent.agentId = actionObj.agentId;
          }
          if (actionObj.agentContext || actionObj.meta) {
            agentEvent.context = (actionObj.agentContext || actionObj.meta) as Record<
              string,
              unknown
            >;
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

  /**
   * Handle email action with proper type safety
   */
  private handleEmailAction(action: MailCardAction): void {
    // Validate that email configuration exists
    if (!action.email) {
      this.logger.error('Email action requires email configuration', 'AICardRendererComponent');
      return;
    }

    const email = action.email;

    // Validate required fields for mail type
    if (action.type === 'mail') {
      if (!email.contact) {
        this.logger.error(
          'Mail action requires email.contact with name, email, and role',
          'AICardRendererComponent'
        );
        return;
      }
      if (!email.contact.name || !email.contact.email || !email.contact.role) {
        this.logger.error(
          'Mail action requires email.contact.name, email.contact.email, and email.contact.role',
          'AICardRendererComponent'
        );
        return;
      }
      if (!email.subject) {
        this.logger.error('Mail action requires email.subject', 'AICardRendererComponent');
        return;
      }
      if (!email.body) {
        this.logger.error('Mail action requires email.body', 'AICardRendererComponent');
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
      this.logger.warn('No email address provided for email action', 'AICardRendererComponent');
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
      this.logger.warn('Email subject is missing for mail action', 'AICardRendererComponent');
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
      this.logger.warn('Email body is missing for mail action', 'AICardRendererComponent');
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
  }

  onExport(): void {
    this.export.emit();
    this.magneticTiltService.resetTilt(false);
  }

  get isStreamingActive(): boolean {
    return this.streamingStage === 'streaming';
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

  onSectionEvent(event: SectionRenderEvent): void {
    switch (event.type) {
      case 'field':
        if (event.field) {
          const fieldEvent: CardFieldInteractionEvent = {
            field: event.field,
            action: 'click',
          };
          const fieldSectionTitle =
            (event.metadata?.sectionTitle as string | undefined) ?? event.section.title;
          if (fieldSectionTitle !== undefined) {
            fieldEvent.sectionTitle = fieldSectionTitle;
          }
          if (event.metadata !== undefined) {
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
          };
          const itemSectionTitle =
            (event.metadata?.sectionTitle as string | undefined) ?? event.section.title;
          if (itemSectionTitle !== undefined) {
            itemEvent.sectionTitle = itemSectionTitle;
          }
          if (event.metadata !== undefined) {
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

    // For content-only updates, we still need to normalize (in case type resolution is needed)
    // but we'll preserve references when possible

    // For structural changes, rebuild everything
    if (requiresStructuralRebuild) {
      this.normalizedSectionCache = new WeakMap<CardSection, CardSection>();
    }

    const normalizedSections = sections.map((section) =>
      this.getNormalizedSection(section, requiresStructuralRebuild)
    );
    const orderedSections = requiresStructuralRebuild
      ? this.sectionNormalizationService.sortSections(normalizedSections)
      : this.mergeWithPreviousOrderPreservingReferences(normalizedSections);

    this.processedSections = orderedSections;
    this.sectionOrderKeys = orderedSections.map((section) => this.getSectionKey(section));
    this.previousSectionsHash = nextHash;

    this.cdr.markForCheck();
  }

  /**
   * Merge with previous order while preserving section references when possible
   */
  private mergeWithPreviousOrderPreservingReferences(
    normalizedSections: CardSection[]
  ): CardSection[] {
    if (!this.sectionOrderKeys.length) {
      return normalizedSections;
    }

    const nextByKey = new Map<string, CardSection>();
    normalizedSections.forEach((section) => {
      nextByKey.set(this.getSectionKey(section), section);
    });

    // Try to preserve processedSections array reference and section references
    const ordered: CardSection[] = [];
    let allReferencesPreserved = true;

    this.sectionOrderKeys.forEach((key) => {
      const match = nextByKey.get(key);
      if (match) {
        // Try to find the same section in processedSections by reference
        const existingSection = this.processedSections.find((s) => this.getSectionKey(s) === key);
        if (existingSection && existingSection === match) {
          // Same reference, preserve it
          ordered.push(existingSection);
        } else {
          // Different reference, use new one
          ordered.push(match);
          allReferencesPreserved = false;
        }
        nextByKey.delete(key);
      }
    });

    // Add any new sections
    nextByKey.forEach((section) => ordered.push(section));

    // If all references are preserved and order is the same, return existing array
    if (
      allReferencesPreserved &&
      ordered.length === this.processedSections.length &&
      ordered.every((section, index) => section === this.processedSections[index])
    ) {
      return this.processedSections;
    }

    return ordered;
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

  /**
   * @internal Reserved for potential streaming optimization
   */
  protected mergeWithPreviousOrder(normalizedSections: CardSection[]): CardSection[] {
    // Use the new method that preserves references
    return this.mergeWithPreviousOrderPreservingReferences(normalizedSections);
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
