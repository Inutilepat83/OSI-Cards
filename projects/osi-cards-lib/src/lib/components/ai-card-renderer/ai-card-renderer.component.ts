import { animate, AnimationBuilder, style, transition, trigger } from '@angular/animations';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  inject,
  Injector,
  Input,
  isDevMode,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { MasonryLayoutInfo } from '..';
import { LucideIconsModule } from '../../icons';
import { getShortVersion } from '../../version';
import {
  AICardConfig,
  CardAction,
  CardField,
  CardItem,
  CardSection,
  LegacyCardAction,
} from '../../models';
import {
  IconService,
  MagneticTiltService,
  MousePosition,
  SectionCompletenessService,
  SectionNormalizationService,
  TiltCalculations,
} from '../../services';
import { CardChangeType } from '../../types';
import {
  generateBriefSummary,
  generateCardSummary,
  sendDebugLog,
  sendDebugLogToFile,
} from '../../utils';
import { catchError, fromEvent, interval, of, Subject, takeUntil } from 'rxjs';
import { CardActionsComponent } from '../card-actions/card-actions.component';
import { CardHeaderComponent } from '../card-header/card-header.component';
import { CardSectionListComponent } from '../card-section-list/card-section-list.component';
import { SectionRenderEvent } from '../section-renderer/section-renderer.component';

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
export class AICardRendererComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  private _cardConfig: AICardConfig | undefined;
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * Host binding for data-theme attribute to ensure Shadow DOM theme scope
   * Resolves theme input to 'day' or 'night' for consistent cross-browser behavior
   */
  private readonly fallbackTheme: 'day' | 'night' = 'day';
  private inheritedTheme: string = this.fallbackTheme;
  private themeContextElement: HTMLElement | null = null;
  private themeContextObserver: MutationObserver | null = null;

  @HostBinding('attr.data-theme')
  get dataTheme(): string {
    if (this.theme) {
      // If explicit theme provided, resolve it
      if (this.theme === 'system') {
        // Detect system preference
        if (isPlatformBrowser(this.platformId)) {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day';
        }
        return 'day';
      }
      // Map 'light'/'dark' to 'day'/'night' for consistency
      if (this.theme === 'light') {
        return 'day';
      }
      if (this.theme === 'dark') {
        return 'night';
      }
      // Return as-is for custom themes or 'day'/'night'
      return this.theme;
    }

    // No explicit theme input: use the synced inherited theme (keeps Safari reliable by
    // ensuring the host itself always has the correct data-theme value).
    return this.inheritedTheme || this.fallbackTheme;
  }

  private normalizeThemeFromAttr(raw: string | null): string | null {
    const value = raw?.trim();
    if (!value) {
      return null;
    }

    // Normalize common app-level names to OSI card names
    if (value === 'light') return 'day';
    if (value === 'dark') return 'night';

    if (value === 'system') {
      if (isPlatformBrowser(this.platformId)) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day';
      }
      return this.fallbackTheme;
    }

    return value;
  }

  /**
   * Keeps inherited theme in sync with the nearest `data-theme` ancestor (or `<html>`),
   * so Shadow DOM styling can use `:host([data-theme])` instead of relying on `:host-context`
   * (which is known to be inconsistent in Safari).
   */
  private setupInheritedThemeSync(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // If theme input is provided, the component is explicitly themed and does not need syncing.
    if (this.theme) {
      return;
    }

    if (this.themeContextElement) {
      // Already initialized
      return;
    }

    const hostElement = this.el.nativeElement;

    // Prefer the nearest ancestor that defines data-theme, but ignore internal wrappers like `.osi-cards-root`
    // so global theming (ThemeService on <html>) can still drive the card.
    const contextEl =
      (hostElement.parentElement?.closest(
        '[data-theme]:not(.osi-cards-root)'
      ) as HTMLElement | null) ?? (this.document.documentElement as HTMLElement | null);

    this.themeContextElement = contextEl;

    // Initial sync
    const initialTheme = this.normalizeThemeFromAttr(
      contextEl ? contextEl.getAttribute('data-theme') : null
    );
    this.inheritedTheme = initialTheme ?? this.fallbackTheme;

    // Observe attribute changes to keep host binding updated (Safari-safe)
    if (typeof MutationObserver === 'undefined' || !contextEl) {
      return;
    }

    this.themeContextObserver = new MutationObserver(() => {
      const next =
        this.normalizeThemeFromAttr(contextEl.getAttribute('data-theme')) ?? this.fallbackTheme;
      if (next !== this.inheritedTheme) {
        this.inheritedTheme = next;
        this.batchedMarkForCheck();
      }
    });

    this.themeContextObserver.observe(contextEl, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
  }

  // Expose Math for template
  Math = Math;

  private previousSectionsHash = '';
  private lastSectionsReference: CardSection[] | null = null; // Track array reference to avoid unnecessary hash calculations
  private normalizedSectionCache = new WeakMap<CardSection, CardSection>();
  private sectionHashCache = new WeakMap<CardSection[], string>();
  // Cache completeness results to avoid repeated service calls during streaming
  // This significantly improves performance when same sections are checked multiple times
  private completenessCache = new WeakMap<CardSection, boolean>();
  private sectionOrderKeys: string[] = [];
  private _changeType: CardChangeType = 'structural';
  // Re-entrancy guard and rate limiting for refreshProcessedSections
  private isRefreshing = false;
  private lastRefreshTime = 0;
  private readonly MIN_REFRESH_INTERVAL_MS = 16; // 60fps max (16ms = ~60 calls/second)

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
    // Input validation: validate cardConfig structure
    if (value !== undefined && value !== null) {
      // Basic structure validation
      if (typeof value !== 'object' || Array.isArray(value)) {
        if (isDevMode()) {
          console.warn(
            '[AICardRenderer] Invalid cardConfig: must be an object, received:',
            typeof value
          );
        }
        this._cardConfig = undefined;
        return;
      }

      // Validate required fields
      const hasTitle =
        typeof (value as any).cardTitle === 'string' || typeof (value as any).title === 'string';
      const hasSections = Array.isArray((value as any).sections);

      if (!hasTitle && isDevMode()) {
        console.warn('[AICardRenderer] Invalid cardConfig: missing cardTitle or title');
      }

      if (!hasSections && (value as any).sections !== undefined && isDevMode()) {
        console.warn('[AICardRenderer] Invalid cardConfig: sections must be an array');
      }

      // Validate sections array structure if present
      if (hasSections && Array.isArray((value as any).sections)) {
        const sections = (value as any).sections as CardSection[];
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          if (!section || typeof section !== 'object') {
            if (isDevMode()) {
              console.warn(`[AICardRenderer] Invalid section at index ${i}: must be an object`);
            }
            continue;
          }

          // Validate section has type
          if (!section.type || typeof section.type !== 'string') {
            if (isDevMode()) {
              console.warn(
                `[AICardRenderer] Invalid section at index ${i}: missing or invalid type`
              );
            }
          }
        }
      }
    }

    // #region agent log - cardConfig setter entry
    sendDebugLog({
      location: 'ai-card-renderer.component.ts:cardConfig.setter:ENTRY',
      message: 'cardConfig setter entry',
      data: {
        hasValue: !!value,
        hasSections: !!value?.sections,
        sectionsCount: value?.sections?.length || 0,
        sections:
          value?.sections?.map((s) => ({
            id: s.id,
            type: s.type,
            title: s.title,
            hasFields: !!s.fields?.length,
            hasItems: !!s.items?.length,
          })) || [],
        cardTitle: value?.cardTitle,
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'section-render-debug',
      hypothesisId: 'H1',
    });
    // #endregion
    const startTime = performance.now();
    this._cardConfig = value as AICardConfig | undefined;

    if (!this._cardConfig?.sections?.length) {
      // #region agent log - no sections in cardConfig
      sendDebugLog({
        location: 'ai-card-renderer.component.ts:cardConfig.setter:NO_SECTIONS',
        message: 'No sections in cardConfig - resetting',
        data: {
          hasCardConfig: !!this._cardConfig,
          cardConfigKeys: this._cardConfig ? Object.keys(this._cardConfig) : [],
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'empty-card-debug',
        hypothesisId: 'A',
      });
      // #endregion
      this.resetProcessedSections();
      this.batchedMarkForCheck();
      return;
    }

    // #region agent log - write to file
    if (typeof window !== 'undefined') {
      const logThrottle = (window as any).__debugLogThrottle || {};
      const now = Date.now();
      if (!logThrottle.cardConfigSetter || now - logThrottle.cardConfigSetter > 100) {
        logThrottle.cardConfigSetter = now;
        (window as any).__debugLogThrottle = logThrottle;
        sendDebugLogToFile({
          location: 'ai-card-renderer.component.ts:cardConfig.setter',
          message: 'cardConfig setter entry',
          data: {
            sectionsCount: this._cardConfig?.sections?.length,
            updateSource: this._updateSource,
            hasPreviousHash: !!this.previousSectionsHash,
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'perf-debug',
          hypothesisId: 'B',
        });
      }
    }
    // #endregion

    // CRITICAL: Streaming updates must process immediately - no debounce
    // Debounce only for non-streaming updates to batch rapid changes
    if (this._updateSource === 'liveEdit') {
      // Live edits need immediate feedback
      const sectionsHash = this.hashSections(this._cardConfig.sections);
      const shouldForceStructural =
        sectionsHash !== this.previousSectionsHash || this._updateSource === 'liveEdit';
      this.refreshProcessedSections(shouldForceStructural);
      this.batchedMarkForCheck();
    } else {
      // Check if streaming is active - if so, process immediately
      const isStreaming = this.isStreamingActive;
      if (isStreaming) {
        // #region agent log - write to file
        sendDebugLogToFile({
          location: 'ai-card-renderer.component.ts:cardConfig.setter',
          message: 'Streaming path taken',
          data: { sectionsCount: this._cardConfig?.sections?.length },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'perf-debug',
          hypothesisId: 'C',
        });
        // #endregion
        // During streaming, process immediately for responsive section appearance
        // No debounce - sections must appear right away for smooth streaming experience
        // Optimize: Skip hash calculation if structure likely unchanged (array reference same)
        // This speeds up content-only updates during streaming
        const sections = this._cardConfig.sections;
        const sectionsReferenceChanged = sections !== this.lastSectionsReference;
        let shouldForceStructural = false;

        if (sectionsReferenceChanged) {
          // Reference changed - recalculate hash to check for structural changes
          this.lastSectionsReference = sections;
          const sectionsHash = this.hashSections(sections);
          shouldForceStructural = sectionsHash !== this.previousSectionsHash;
          this.previousSectionsHash = sectionsHash;
        } else {
          // Reference unchanged - likely content-only update, skip hash calculation
          // Assume structure unchanged unless explicitly forced
          shouldForceStructural = false;
        }

        const refreshStart = performance.now();
        this.refreshProcessedSections(shouldForceStructural);
        const refreshDuration = performance.now() - refreshStart;
        // #region agent log - write to file
        if (refreshDuration > 10) {
          sendDebugLogToFile({
            location: 'ai-card-renderer.component.ts:cardConfig.setter',
            message: 'refreshProcessedSections completed',
            data: { duration: refreshDuration, shouldForceStructural, sectionsReferenceChanged },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'perf-debug',
            hypothesisId: 'D',
          });
        }
        // #endregion
        this.batchedMarkForCheck();
      } else {
        // #region agent log - write to file, throttled
        if (typeof window !== 'undefined') {
          const logThrottle = (window as any).__debugLogThrottle || {};
          const now = Date.now();
          if (!logThrottle.nonStreamingPath || now - logThrottle.nonStreamingPath > 500) {
            logThrottle.nonStreamingPath = now;
            (window as any).__debugLogThrottle = logThrottle;
            sendDebugLogToFile({
              location: 'ai-card-renderer.component.ts:cardConfig.setter',
              message: 'Non-streaming path - debouncing',
              data: {
                sectionsCount: this._cardConfig?.sections?.length,
                hasTimeout: !!this.refreshTimeoutId,
              },
              timestamp: Date.now(),
              sessionId: 'debug-session',
              runId: 'perf-debug',
              hypothesisId: 'E',
            });
          }
        }
        // #endregion
        // Non-streaming updates: debounce to batch rapid changes
        // Fix race condition: store timeout ID and check it's still valid in callback
        const currentTimeoutId = this.refreshTimeoutId;
        if (currentTimeoutId !== null) {
          clearTimeout(currentTimeoutId);
        }
        this.refreshTimeoutId = setTimeout(() => {
          // Race condition fix: check if this timeout is still the current one
          // If refreshTimeoutId changed, this callback is stale and should be ignored
          if (this.refreshTimeoutId !== currentTimeoutId) {
            return; // Stale timeout, ignore
          }

          // Guard against undefined _cardConfig in case it changed during the timeout
          if (!this._cardConfig?.sections?.length) {
            this.refreshTimeoutId = null;
            return;
          }
          const sectionsHash = this.hashSections(this._cardConfig.sections);
          const shouldForceStructural =
            sectionsHash !== this.previousSectionsHash || this._updateSource === 'liveEdit';
          this.refreshProcessedSections(shouldForceStructural);
          this.batchedMarkForCheck();
          this.refreshTimeoutId = null;
        }, 50); // Debounce non-streaming updates to batch rapid changes
      }
    }
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
    // Input validation: ensure value is valid
    if (value !== 'stream' && value !== 'liveEdit') {
      if (isDevMode()) {
        console.warn(
          `[AICardRenderer] Invalid updateSource: expected 'stream' or 'liveEdit', received:`,
          value
        );
      }
      this._updateSource = 'stream'; // Default to stream
      return;
    }

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
   * Optimized to include more relevant fields to avoid false positives
   */
  private hashSections(sections: CardSection[]): string {
    const hashStart = performance.now();
    // Check cache first
    if (this.sectionHashCache.has(sections)) {
      const cached = this.sectionHashCache.get(sections)!;
      // #region agent log - write to file
      sendDebugLogToFile({
        location: 'ai-card-renderer.component.ts:hashSections',
        message: 'Hash cache hit',
        data: { sectionsCount: sections.length, duration: performance.now() - hashStart },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'perf-debug',
        hypothesisId: 'F',
      });
      // #endregion
      return cached;
    }

    // Create a lightweight hash based on section metadata
    // Include more fields to reduce false positives: id, type, title, field/item counts, and colSpan
    const hashParts: string[] = [];
    for (const section of sections) {
      const fieldCount = section.fields?.length ?? 0;
      const itemCount = section.items?.length ?? 0;
      const chartDataCount = section.chartData?.datasets?.length ?? 0;
      const colSpan = section.colSpan ?? 0;
      // Include first field/item values to detect content changes (not just count)
      const firstFieldValue = section.fields?.[0]?.value?.toString().substring(0, 20) || '';
      const firstItemTitle = section.items?.[0]?.title?.substring(0, 20) || '';

      hashParts.push(
        `${section.id || ''}|${section.type || ''}|${section.title || ''}|` +
          `f${fieldCount}|i${itemCount}|c${chartDataCount}|s${colSpan}|` +
          `fv${firstFieldValue}|it${firstItemTitle}`
      );
    }

    const hash = hashParts.join('||');

    // Optimized hash function: use djb2 algorithm (better distribution)
    let result = 5381; // djb2 initial value
    for (let i = 0; i < hash.length; i++) {
      result = (result << 5) + result + hash.charCodeAt(i);
      result = result & 0xffffffff; // Convert to 32-bit integer
    }

    const hashString = String(result);
    const hashDuration = performance.now() - hashStart;
    // #region agent log - write to file
    if (hashDuration > 1) {
      sendDebugLogToFile({
        location: 'ai-card-renderer.component.ts:hashSections',
        message: 'Hash calculated',
        data: { sectionsCount: sections.length, duration: hashDuration },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'perf-debug',
        hypothesisId: 'F',
      });
    }
    // #endregion
    // Cache the result
    this.sectionHashCache.set(sections, hashString);
    return hashString;
  }
  @Input() isFullscreen = false;
  @Input() tiltEnabled = true;
  @Input() streamingStage: StreamingStage = undefined;

  /**
   * Theme input - allows parent to explicitly set theme for Shadow DOM scope
   * Values: 'day' | 'night' | 'system' | string (custom theme name)
   * If not provided, component will attempt to detect from context or use default
   */
  @Input() theme?: 'day' | 'night' | 'system' | string;
  @Input()
  set streamingProgress(value: number | undefined) {
    // Input validation: ensure progress is between 0 and 1
    if (value !== undefined && (value < 0 || value > 1)) {
      if (isDevMode()) {
        console.warn(`[AICardRenderer] Invalid streamingProgress: expected 0-1, received:`, value);
      }
      this._streamingProgress = undefined;
      return;
    }
    this._streamingProgress = value;
  }
  get streamingProgress(): number | undefined {
    return this._streamingProgress;
  }
  private _streamingProgress?: number;
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
   * Cached streaming active state - updated only when inputs change
   * CRITICAL: This is a property, not a getter, to avoid excessive evaluations in template
   */
  isStreamingActive = false;

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
    // Input validation: ensure value is valid CardChangeType
    const validChangeTypes: CardChangeType[] = ['structural', 'content'];
    if (!validChangeTypes.includes(value)) {
      if (isDevMode()) {
        console.warn(
          `[AICardRenderer] Invalid changeType: expected 'structural' or 'content', received:`,
          value
        );
      }
      this._changeType = 'structural'; // Default to structural
      return;
    }

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

  get processedSectionsForTemplate(): CardSection[] {
    return this.processedSections;
  }

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
  private readonly sectionCompletenessService = inject(SectionCompletenessService);
  private readonly http = inject(HttpClient, { optional: true });
  // ViewportScroller available for future scroll functionality
  // private readonly viewportScroller = inject(ViewportScroller);

  // Debounce card config updates to avoid excessive processing
  private refreshTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // Change detection batching: queue markForCheck calls to batch them in single RAF
  private changeDetectionRafId: number | null = null;
  private pendingChangeDetection = false;

  /**
   * Batched change detection - queues markForCheck() to batch multiple calls
   * Uses requestAnimationFrame to batch all pending change detection in single cycle
   */
  private batchedMarkForCheck(): void {
    if (this.pendingChangeDetection) {
      return; // Already queued
    }

    this.pendingChangeDetection = true;

    if (this.changeDetectionRafId === null) {
      this.changeDetectionRafId = requestAnimationFrame(() => {
        this.cdr.markForCheck();
        this.pendingChangeDetection = false;
        this.changeDetectionRafId = null;
      });
    }
  }

  /**
   * Optional LLM API endpoint for fallback card generation.
   * If not provided, will attempt to use a default endpoint.
   */
  @Input() llmFallbackEndpoint?: string;

  /**
   * Optional context/prompt for LLM fallback generation.
   * If not provided, uses a default prompt.
   */
  @Input() llmFallbackPrompt?: string;

  ngOnInit(): void {
    // Initialize cached streaming state
    this.isStreamingActive = this.isStreaming || this.streamingStage === 'streaming';

    // Ensure the host gets the correct data-theme even in Safari (no :host-context reliance).
    this.setupInheritedThemeSync();

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
    // CRITICAL: Ensure processedSections is populated if cardConfig is already available
    // This handles cases where cardConfig is set before ngOnInit (common on page refresh)
    if (this.cardConfig && this.cardConfig.sections && this.cardConfig.sections.length > 0) {
      if (!this.processedSections || this.processedSections.length === 0) {
        // CRITICAL DEBUG: Log when forcing refresh in ngOnInit
        if (isDevMode() && isPlatformBrowser(this.platformId)) {
          console.log('[AICardRenderer] ngOnInit: Forcing refreshProcessedSections', {
            cardConfigSections: this.cardConfig.sections.length,
            processedSections: this.processedSections.length,
          });
        }
        this.refreshProcessedSections(true); // Force structural rebuild
        this.batchedMarkForCheck();
      }
    }

    // Use LLM fallback if no card config provided
    if (!this.cardConfig) {
      this.generateFallbackCard();
    }

    // CRITICAL: Double-check after fallback generation
    if (this.cardConfig && this.cardConfig.sections && this.cardConfig.sections.length > 0) {
      if (!this.processedSections || this.processedSections.length === 0) {
        // CRITICAL DEBUG: Log when forcing refresh after fallback check
        if (isDevMode() && isPlatformBrowser(this.platformId)) {
          console.log(
            '[AICardRenderer] ngOnInit: Forcing refreshProcessedSections after fallback check',
            {
              cardConfigSections: this.cardConfig.sections.length,
              processedSections: this.processedSections.length,
            }
          );
        }
        this.refreshProcessedSections(true);
        this.batchedMarkForCheck();
      }
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
              this.batchedMarkForCheck();
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

    // #region agent log
    sendDebugLog({
      location: 'ai-card-renderer.component.ts:568',
      message: 'Container width measurement setup completed',
      data: { timestamp: Date.now() },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'card-debug',
      hypothesisId: 'E',
    });
    // #endregion
  }

  /**
   * Inspect Shadow DOM styles for debugging (only in dev mode)
   * Removed excessive logging - only log errors
   */
  private inspectShadowDOMStyles(_timing: string): void {
    // Only inspect in dev mode and only log errors
    if (!isDevMode() || !isPlatformBrowser(this.platformId)) {
      return;
    }

    const hostEl = this.el.nativeElement;
    const shadowRoot = hostEl.shadowRoot;

    if (!shadowRoot) {
      if (isDevMode()) {
        console.warn('[AICardRenderer] Shadow DOM not found');
      }
      return;
    }

    // Only log if there's a real issue (no styles at all)
    const styleSheets = shadowRoot.adoptedStyleSheets || [];
    const styleElements = Array.from(shadowRoot.querySelectorAll('style'));
    const hasAnyStyles =
      styleSheets.length > 0 ||
      styleElements.some((el) => el.textContent && el.textContent.trim().length > 0);

    if (!hasAnyStyles && isDevMode()) {
      console.warn('[AICardRenderer] No styles found in Shadow DOM');
    }
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
            this.batchedMarkForCheck();
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
        this.batchedMarkForCheck();
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

    // Throttle change detection - batched with other mouse updates
    if (!this.mouseMoveRafId) {
      this.mouseMoveRafId = requestAnimationFrame(() => {
        this.batchedMarkForCheck();
        this.mouseMoveRafId = null;
      });
    }
  }

  private resetParticles(): void {
    this.particles = this.particles.map(() => ({
      transform: 'translate(0, 0) scale(1)',
      opacity: 0.5,
    }));
    this.batchedMarkForCheck();
  }

  private updateGradientTransform(): void {
    if (!this.emptyStateContainer) return;

    const rect = this.emptyStateContainer.nativeElement.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const deltaX = (this.mouseX - centerX) * 0.1;
    const deltaY = (this.mouseY - centerY) * 0.1;

    this.gradientTransform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
    // Throttle change detection - batched with other mouse updates
    this.batchedMarkForCheck();
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
    // Throttle change detection for scroll/mouse updates - they happen very frequently
    // Use batched change detection to batch updates
    this.batchedMarkForCheck();
  }

  ngOnDestroy(): void {
    // Clean up theme observer
    if (this.themeContextObserver) {
      this.themeContextObserver.disconnect();
      this.themeContextObserver = null;
    }
    this.themeContextElement = null;

    // Cancel any pending RAFs
    if (this.mouseMoveRafId !== null) {
      cancelAnimationFrame(this.mouseMoveRafId);
    }

    // Cancel pending change detection
    if (this.changeDetectionRafId !== null) {
      cancelAnimationFrame(this.changeDetectionRafId);
      this.changeDetectionRafId = null;
      this.pendingChangeDetection = false;
    }

    // Clear debounce timeout
    if (this.refreshTimeoutId !== null) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
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
    if (!this.tiltEnabled) {
      return;
    }
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
    if (!this.tiltEnabled || !this.isHovered || !this.tiltContainerRef?.nativeElement) {
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

        case 'website': {
          // Use url property if available, otherwise fall back to action property
          const url = actionObj.url || actionObj.action;
          if (url && url !== '#' && (url.startsWith('http://') || url.startsWith('https://'))) {
            window.open(url, '_blank', 'noopener,noreferrer');
          } else {
            if (isDevMode()) {
              console.warn('No valid URL provided for website button type');
            }
          }
          return;
        }

        case 'agent': {
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
        }

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
      if (isDevMode()) {
        console.warn('Email action can only be executed in a browser environment');
      }
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
      // Subject and body are required
      if (!email.subject) {
        console.error('Mail action requires email.subject');
        return;
      }
      if (!email.body) {
        console.error('Mail action requires email.body');
        return;
      }
      // Contact is optional - can generate email with just subject and body
    }

    // Determine recipient email address - prioritize to, then contact.email
    // Recipient is optional - can generate email with just subject and body
    let recipientEmail = '';
    if (email.to) {
      recipientEmail = Array.isArray(email.to) ? email.to.join(',') : email.to;
    } else if (email.contact?.email) {
      recipientEmail = email.contact.email;
    }

    // Note: recipientEmail can be empty - this will create a mailto:?subject=...&body=... URL
    // which opens the email client with a draft (no recipient)

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
    } else if (action.type === 'mail' && isDevMode()) {
      console.warn('Email subject is missing for mail action');
    }

    // Process body - replace placeholders with contact information and card summary
    let processedBody = email.body || '';

    // Replace card summary placeholders if card config is available
    if (this.cardConfig) {
      const cardSummary = generateCardSummary(this.cardConfig);
      const briefSummary = generateBriefSummary(this.cardConfig);

      // Replace {{summary}} placeholder with full card summary
      processedBody = processedBody.replace(/\{\{summary\}\}/g, cardSummary);
      // Replace {{briefSummary}} placeholder with brief summary
      processedBody = processedBody.replace(/\{\{briefSummary\}\}/g, briefSummary);
      // Replace {{cardTitle}} placeholder
      processedBody = processedBody.replace(/\{\{cardTitle\}\}/g, this.cardConfig.cardTitle || '');
    }

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
    } else if (action.type === 'mail' && isDevMode()) {
      console.warn('Email body is missing for mail action');
    }

    // Construct mailto link
    // If no recipient, use mailto:?subject=...&body=... format (opens email client with draft)
    const queryString = params.length > 0 ? '?' + params.join('&') : '';
    const recipient = recipientEmail ? encodeURIComponent(recipientEmail) : '';
    const mailtoLink = `mailto:${recipient}${queryString}`;

    // Convert to Outlook URL scheme (platform-specific)
    // Windows: Use mailto: (New Outlook doesn't support custom schemes)
    // Mac: Use ms-outlook: (forces Outlook desktop app)
    const outlookLink = mailtoLink;

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
            if (isDevMode()) {
              console.warn('Anchor click failed, using window.location fallback:', clickError);
            }
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
          if (!mailtoWindow && isDevMode()) {
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

  /**
   * Update cached streaming state when inputs change
   * This avoids excessive getter evaluations in template bindings
   */
  public ngOnChanges(changes: SimpleChanges): void {
    // #region agent log - ngOnChanges entry
    sendDebugLog({
      location: 'ai-card-renderer.component.ts:ngOnChanges:ENTRY',
      message: 'ngOnChanges called',
      data: {
        changedKeys: Object.keys(changes),
        hasCardConfigChange: !!changes['cardConfig'],
        cardConfigFirstChange: changes['cardConfig']?.firstChange,
        cardConfigPreviousValue: changes['cardConfig']?.previousValue?.sections?.length,
        cardConfigCurrentValue: changes['cardConfig']?.currentValue?.sections?.length,
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'section-render-debug',
      hypothesisId: 'H1',
    });
    // #endregion

    // CRITICAL FIX: Handle cardConfig changes in ngOnChanges
    // This ensures processing happens even when the object reference doesn't change
    // but the content (sections) does change
    if (changes['cardConfig']) {
      const cardConfigChange = changes['cardConfig'];
      // #region agent log - cardConfig change detected
      sendDebugLog({
        location: 'ai-card-renderer.component.ts:ngOnChanges:CARD_CONFIG_CHANGE',
        message: 'cardConfig change detected in ngOnChanges',
        data: {
          firstChange: cardConfigChange.firstChange,
          hasPreviousValue: !!cardConfigChange.previousValue,
          hasCurrentValue: !!cardConfigChange.currentValue,
          previousSectionsCount: cardConfigChange.previousValue?.sections?.length || 0,
          currentSectionsCount: cardConfigChange.currentValue?.sections?.length || 0,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'section-render-debug',
        hypothesisId: 'H1',
      });
      // #endregion

      // If cardConfig changed, trigger processing
      // This handles cases where the setter might not be called due to reference equality
      if (cardConfigChange.currentValue && cardConfigChange.currentValue.sections?.length) {
        // Update _cardConfig to ensure it's in sync
        this._cardConfig = cardConfigChange.currentValue;
        // #region agent log - ngOnChanges processing
        sendDebugLog({
          location: 'ai-card-renderer.component.ts:ngOnChanges:PROCESSING',
          message: 'ngOnChanges processing cardConfig with sections',
          data: {
            sectionsCount: cardConfigChange.currentValue.sections.length,
            currentProcessedCount: this.processedSections.length,
            firstChange: cardConfigChange.firstChange,
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'section-render-debug',
          hypothesisId: 'H1',
        });
        // #endregion
        // CRITICAL DEBUG: Log when processing in ngOnChanges
        if (isDevMode() && isPlatformBrowser(this.platformId)) {
          console.log('[AICardRenderer] ngOnChanges: Processing cardConfig with sections', {
            sectionsCount: cardConfigChange.currentValue.sections.length,
            currentProcessedCount: this.processedSections.length,
            firstChange: cardConfigChange.firstChange,
          });
        }
        // Force structural rebuild to ensure sections are processed
        this.refreshProcessedSections(true);
        // CRITICAL: Use both markForCheck() and detectChanges() for OnPush components
        // This ensures immediate update and future change detection cycles
        this.cdr.markForCheck();
        this.cdr.detectChanges();
        this.batchedMarkForCheck();
      } else if (
        !cardConfigChange.currentValue ||
        !cardConfigChange.currentValue.sections?.length
      ) {
        // Card config removed or has no sections
        this._cardConfig = cardConfigChange.currentValue;
        // #region agent log - ngOnChanges resetting
        sendDebugLog({
          location: 'ai-card-renderer.component.ts:ngOnChanges:RESETTING',
          message: 'ngOnChanges resetting processedSections',
          data: {
            hasCardConfig: !!cardConfigChange.currentValue,
            sectionsCount: cardConfigChange.currentValue?.sections?.length || 0,
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'section-render-debug',
          hypothesisId: 'H1',
        });
        // #endregion
        // CRITICAL DEBUG: Log when resetting
        if (isDevMode() && isPlatformBrowser(this.platformId)) {
          console.log('[AICardRenderer] ngOnChanges: Resetting processedSections', {
            hasCardConfig: !!cardConfigChange.currentValue,
            sectionsCount: cardConfigChange.currentValue?.sections?.length || 0,
          });
        }
        this.resetProcessedSections();
        this.cdr.detectChanges();
      }
    }

    if (changes['isStreaming'] || changes['streamingStage']) {
      this.isStreamingActive = this.isStreaming || this.streamingStage === 'streaming';
    }
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    // Re-entrancy guard: prevent concurrent execution
    if (this.isRefreshing) {
      return;
    }

    // Rate limiting: prevent excessive calls (max 60fps unless forceStructural)
    const now = performance.now();
    if (!forceStructural && now - this.lastRefreshTime < this.MIN_REFRESH_INTERVAL_MS) {
      return; // Skip if called too frequently
    }
    this.lastRefreshTime = now;

    // Set re-entrancy flag
    this.isRefreshing = true;

    try {
      const perfStart = performance.now();

      // #region agent log - entry
      sendDebugLog({
        location: 'ai-card-renderer.component.ts:refreshProcessedSections:ENTRY',
        message: 'refreshProcessedSections ENTRY',
        data: {
          forceStructural,
          hasCardConfig: !!this._cardConfig,
          sectionsCount: this._cardConfig?.sections?.length,
          currentProcessedCount: this.processedSections.length,
          cardConfigSections: this._cardConfig?.sections?.map((s) => ({
            id: s.id,
            type: s.type,
            title: s.title,
            hasFields: !!s.fields?.length,
            hasItems: !!s.items?.length,
          })),
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'section-render-debug',
        hypothesisId: 'H1',
      });
      // #endregion

      if (!this._cardConfig?.sections?.length) {
        // #region agent log - no sections
        sendDebugLog({
          location: 'ai-card-renderer.component.ts:refreshProcessedSections:NO_SECTIONS',
          message: 'No sections - resetting',
          data: {
            hasCardConfig: !!this._cardConfig,
            cardConfigKeys: this._cardConfig ? Object.keys(this._cardConfig) : [],
            cardTitle: this._cardConfig?.cardTitle,
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'section-render-debug',
          hypothesisId: 'H1',
        });
        // #endregion
        this.resetProcessedSections();
        return;
      }

      const sections = this._cardConfig.sections;

      // Early exit: Skip processing if nothing changed and not forcing rebuild
      // This is critical for performance - avoids expensive processing on every update
      const sectionsReferenceChanged = sections !== this.lastSectionsReference;
      if (!sectionsReferenceChanged && !forceStructural && this.processedSections.length > 0) {
        // Sections array reference unchanged and not forcing rebuild
        // If reference unchanged, content might have changed but structure likely same
        // For performance, we can skip processing if hash is also unchanged
        // Check cached hash first (fast path)
        let currentHash = this.previousSectionsHash;
        if (this.sectionHashCache.has(sections)) {
          currentHash = this.sectionHashCache.get(sections)!;
        } else if (this.previousSectionsHash) {
          // Hash not cached but we have previous hash
          // Since reference unchanged, assume hash also unchanged for early exit
          // This is safe optimization - if content actually changed, hash will differ and we'll process
          currentHash = this.previousSectionsHash;
        }

        if (currentHash === this.previousSectionsHash && currentHash !== '') {
          // Nothing changed at all - skip all processing
          return;
        }
      }

      // Optimize: Only recalculate hash if sections array reference actually changed
      // This avoids expensive hash calculation on every update when array reference is the same
      let nextHash = this.previousSectionsHash;

      if (sectionsReferenceChanged) {
        this.lastSectionsReference = sections;
        nextHash = this.hashSections(sections);
      }

      const structureChanged = nextHash !== this.previousSectionsHash;
      const requiresStructuralRebuild =
        forceStructural ||
        structureChanged ||
        this._changeType === 'structural' ||
        !this.processedSections.length;

      // Optimize cache invalidation: Only clear cache when structure truly changes
      // Preserve cache across content-only updates (streaming, field updates, etc.)
      // This significantly improves performance during streaming where structure is stable
      if (requiresStructuralRebuild && structureChanged) {
        // Structure changed - clear normalization cache
        // WeakMap will automatically handle garbage collection of old section objects
        this.normalizedSectionCache = new WeakMap<CardSection, CardSection>();
        // Also clear hash cache when structure changes
        this.sectionHashCache = new WeakMap<CardSection[], string>();
        // Clear completeness cache when structure changes (sections may have been replaced)
        this.completenessCache = new WeakMap<CardSection, boolean>();
      }
      // For content-only updates (structure unchanged), preserve all caches
      // This allows completeness cache to work across streaming updates for same section objects
      // For content-only updates (structure unchanged), preserve all caches
      // This allows normalization cache to work across streaming updates

      // Optimize: Normalize sections in single pass, combining with completeness check where possible
      // This reduces array iterations from 3 (normalize → filter → sort) to 2 (normalize+filter → sort)
      const normalizeStart = performance.now();
      const normalizedSections: CardSection[] = [];
      for (const section of sections) {
        const normalized = this.getNormalizedSection(section, requiresStructuralRebuild);
        normalizedSections.push(normalized);
      }
      const normalizeDuration = performance.now() - normalizeStart;
      // #region agent log - after normalization
      sendDebugLog({
        location: 'ai-card-renderer.component.ts:refreshProcessedSections:AFTER_NORMALIZATION',
        message: 'After normalization',
        data: {
          inputSections: sections.length,
          normalizedCount: normalizedSections.length,
          normalizedSections: normalizedSections.map((s) => ({
            id: s.id,
            type: s.type,
            title: s.title,
            hasFields: !!s.fields?.length,
            hasItems: !!s.items?.length,
          })),
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'section-render-debug',
        hypothesisId: 'H4',
      });
      // #endregion
      // #region agent log
      if (normalizeDuration > 10) {
        sendDebugLogToFile({
          location: 'ai-card-renderer.component.ts:refreshProcessedSections',
          message: 'Slow normalization',
          data: { sectionsCount: sections.length, normalizeDuration },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'perf-debug',
          hypothesisId: 'K',
        });
      }
      // #endregion

      // Filter out incomplete sections
      // CRITICAL: On page refresh, be lenient to avoid filtering out valid sections
      // that might fail completeness check due to timing issues (registry not loaded, etc.)
      // CRITICAL: NEVER defer completeness checks during streaming - sections must appear immediately
      const isStreaming = this.isStreamingActive;
      const useIdleCallback =
        typeof requestIdleCallback !== 'undefined' && !forceStructural && !isStreaming;
      const completenessStart = performance.now();
      let completenessChecks = 0;
      // #region agent log - before filtering
      sendDebugLog({
        location: 'ai-card-renderer.component.ts:refreshProcessedSections:BEFORE_FILTER',
        message: 'Before completeness filtering',
        data: {
          normalizedCount: normalizedSections.length,
          normalizedSections: normalizedSections.map((s) => ({
            id: s.id,
            type: s.type,
            title: s.title,
            hasFields: !!s.fields?.length,
            hasItems: !!s.items?.length,
            hasChartData: !!s.chartData,
          })),
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'section-render-debug',
        hypothesisId: 'H2',
      });
      // #endregion
      const completeSections = normalizedSections.filter((section) => {
        // Fast path: check minimal data first (no service call needed)
        // CRITICAL FIX: Be more lenient - only require type, title is optional
        // Some sections might not have title but have other data
        const hasMinimalData =
          section.type &&
          (section.title ||
            section.fields?.length ||
            section.items?.length ||
            section.chartData ||
            section.description); // Also accept description as minimal data

        // #region agent log - minimal data check
        sendDebugLog({
          location: 'ai-card-renderer.component.ts:refreshProcessedSections:MINIMAL_DATA',
          message: 'Minimal data check',
          data: {
            sectionId: section.id,
            sectionType: section.type,
            hasMinimalData,
            hasType: !!section.type,
            hasTitle: !!section.title,
            fieldCount: section.fields?.length || 0,
            itemCount: section.items?.length || 0,
            hasChartData: !!section.chartData,
            hasDescription: !!section.description,
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'section-render-debug',
          hypothesisId: 'H2',
        });
        // #endregion

        if (!hasMinimalData) {
          // #region agent log - section filtered no minimal data
          sendDebugLog({
            location: 'ai-card-renderer.component.ts:refreshProcessedSections:FILTERED_NO_MINIMAL',
            message: 'Section filtered - no minimal data',
            data: {
              sectionId: section.id,
              sectionType: section.type,
              hasType: !!section.type,
              hasTitle: !!section.title,
              fieldCount: section.fields?.length || 0,
              itemCount: section.items?.length || 0,
              hasChartData: !!section.chartData,
              hasDescription: !!section.description,
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'section-render-debug',
            hypothesisId: 'H2',
          });
          // #endregion
          // CRITICAL DEBUG: Log why section was filtered
          if (isDevMode() && isPlatformBrowser(this.platformId)) {
            console.warn('[AICardRenderer] Section filtered - no minimal data', {
              sectionId: section.id,
              sectionType: section.type,
              hasType: !!section.type,
              hasTitle: !!section.title,
              fieldCount: section.fields?.length || 0,
              itemCount: section.items?.length || 0,
              hasChartData: !!section.chartData,
              hasDescription: !!section.description,
            });
          }
          return false; // No data at all, skip
        }

        // During streaming, always check completeness immediately - sections must appear right away
        // Optimize: Use local cache to avoid repeated service calls for same sections
        if (isStreaming) {
          // Check local cache first to avoid service call
          const cachedComplete = this.completenessCache.get(section);
          if (cachedComplete !== undefined) {
            // Cache hit - use cached result
            return cachedComplete || hasMinimalData;
          }

          // Cache miss - call service and cache result
          const checkStart = performance.now();
          const isComplete = this.sectionCompletenessService.isSectionComplete(section);
          completenessChecks++;
          const checkDuration = performance.now() - checkStart;
          // #region agent log - write to file
          if (checkDuration > 5) {
            sendDebugLogToFile({
              location: 'ai-card-renderer.component.ts:refreshProcessedSections',
              message: 'Slow completeness check',
              data: { sectionType: section.type, duration: checkDuration },
              timestamp: Date.now(),
              sessionId: 'debug-session',
              runId: 'perf-debug',
              hypothesisId: 'G',
            });
          }
          // #endregion
          this.completenessCache.set(section, isComplete);
          if (!isComplete && hasMinimalData) {
            return true; // Include anyway if has minimal data
          }
          return isComplete;
        }

        // For structural rebuilds or critical sections, check completeness immediately
        if (requiresStructuralRebuild || section.priority === 1) {
          const checkStart = performance.now();
          const isComplete = this.sectionCompletenessService.isSectionComplete(section);
          completenessChecks++;
          const checkDuration = performance.now() - checkStart;
          // #region agent log - completeness check result
          sendDebugLog({
            location: 'ai-card-renderer.component.ts:refreshProcessedSections:COMPLETENESS_CHECK',
            message: 'Completeness check result',
            data: {
              sectionId: section.id,
              sectionType: section.type,
              isComplete,
              hasMinimalData,
              checkDuration,
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'empty-card-debug',
            hypothesisId: 'C',
          });
          // #endregion
          if (!isComplete && hasMinimalData) {
            return true; // Include anyway if has minimal data
          }
          return isComplete;
        }

        // For non-critical sections during non-streaming, can defer completeness check
        // This improves initial render performance by allowing sections to render first, then validate
        if (useIdleCallback) {
          // Defer completeness check - assume complete for now if has minimal data
          // The check will happen in idle time
          return true;
        }

        // Fallback: check completeness synchronously if requestIdleCallback not available
        const isComplete = this.sectionCompletenessService.isSectionComplete(section);
        // #region agent log - completeness check fallback
        sendDebugLog({
          location: 'ai-card-renderer.component.ts:refreshProcessedSections:COMPLETENESS_FALLBACK',
          message: 'Completeness check fallback result',
          data: {
            sectionId: section.id,
            sectionType: section.type,
            isComplete,
            hasMinimalData,
            willInclude: isComplete || hasMinimalData,
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'section-render-debug',
          hypothesisId: 'H2',
        });
        // #endregion
        // CRITICAL FIX: Always include sections with minimal data, even if completeness check fails
        // This prevents valid sections from being filtered out due to registry loading issues or strict rules
        if (!isComplete && hasMinimalData) {
          // #region agent log - including despite completeness failure
          sendDebugLog({
            location:
              'ai-card-renderer.component.ts:refreshProcessedSections:INCLUDING_DESPITE_FAILURE',
            message: 'Including section despite completeness failure',
            data: { sectionId: section.id, sectionType: section.type, isComplete, hasMinimalData },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'section-render-debug',
            hypothesisId: 'H2',
          });
          // #endregion
          // CRITICAL DEBUG: Log when section is included despite failing completeness
          if (isDevMode() && isPlatformBrowser(this.platformId)) {
            console.debug(
              '[AICardRenderer] Including section with minimal data despite completeness check failure',
              {
                sectionId: section.id,
                sectionType: section.type,
                isComplete,
                hasMinimalData,
              }
            );
          }
          return true; // Include anyway if has minimal data
        }
        // If completeness check passes, include it
        if (isComplete) {
          // #region agent log - section passed completeness
          sendDebugLog({
            location: 'ai-card-renderer.component.ts:refreshProcessedSections:PASSED_COMPLETENESS',
            message: 'Section passed completeness check',
            data: { sectionId: section.id, sectionType: section.type, isComplete },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'section-render-debug',
            hypothesisId: 'H2',
          });
          // #endregion
          return true;
        }
        // #region agent log - section filtered completeness failed
        sendDebugLog({
          location: 'ai-card-renderer.component.ts:refreshProcessedSections:FILTERED_COMPLETENESS',
          message: 'Section filtered - completeness failed and no minimal data',
          data: { sectionId: section.id, sectionType: section.type, isComplete, hasMinimalData },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'section-render-debug',
          hypothesisId: 'H2',
        });
        // #endregion
        // CRITICAL DEBUG: Log when section is filtered out
        if (isDevMode() && isPlatformBrowser(this.platformId)) {
          console.warn(
            '[AICardRenderer] Section filtered - completeness check failed and no minimal data',
            {
              sectionId: section.id,
              sectionType: section.type,
              isComplete,
              hasMinimalData,
            }
          );
        }
        // Only filter out if both completeness fails AND no minimal data
        return false;
      });

      // Optimize: Only sort when structure actually changed, otherwise preserve order
      // This avoids expensive sorting on every content update during streaming
      // Optimize: During streaming with content-only updates, preserve order to avoid expensive sorting
      // Only sort when structure actually changed
      // #region agent log - after filtering
      sendDebugLog({
        location: 'ai-card-renderer.component.ts:refreshProcessedSections:AFTER_FILTER',
        message: 'After completeness filtering',
        data: {
          normalizedCount: normalizedSections.length,
          completeCount: completeSections.length,
          filteredOut: normalizedSections.length - completeSections.length,
          completeSections: completeSections.map((s) => ({
            id: s.id,
            type: s.type,
            title: s.title,
          })),
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'section-render-debug',
        hypothesisId: 'H2',
      });
      // #endregion

      const sortStart = performance.now();
      const orderedSections = requiresStructuralRebuild
        ? this.sectionNormalizationService.sortSections(completeSections)
        : this.mergeWithPreviousOrder(completeSections);
      const sortDuration = performance.now() - sortStart;

      // #region agent log - critical: check if we're losing sections
      if (orderedSections.length === 0 && normalizedSections.length > 0) {
        sendDebugLogToFile({
          location: 'ai-card-renderer.component.ts:refreshProcessedSections',
          message: 'CRITICAL: All sections filtered out!',
          data: {
            inputSections: sections.length,
            normalizedSections: normalizedSections.length,
            completeSections: completeSections.length,
            orderedSections: orderedSections.length,
            forceStructural,
            requiresStructuralRebuild,
            isStreaming,
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'perf-debug',
          hypothesisId: 'L',
        });
      } else if (orderedSections.length < normalizedSections.length) {
        sendDebugLogToFile({
          location: 'ai-card-renderer.component.ts:refreshProcessedSections',
          message: 'Sections filtered out',
          data: {
            inputSections: sections.length,
            normalizedSections: normalizedSections.length,
            completeSections: completeSections.length,
            orderedSections: orderedSections.length,
            filteredCount: normalizedSections.length - completeSections.length,
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'perf-debug',
          hypothesisId: 'L',
        });
      }
      if (sortDuration > 10) {
        sendDebugLogToFile({
          location: 'ai-card-renderer.component.ts:refreshProcessedSections',
          message: 'Slow sorting',
          data: { sectionsCount: completeSections.length, sortDuration },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'perf-debug',
          hypothesisId: 'K',
        });
      }
      // #endregion

      // #region agent log - final processed sections
      sendDebugLog({
        location: 'ai-card-renderer.component.ts:refreshProcessedSections:FINAL',
        message: 'Setting processedSections',
        data: {
          inputSections: sections.length,
          normalizedCount: normalizedSections.length,
          completeCount: completeSections.length,
          orderedCount: orderedSections.length,
          orderedSections: orderedSections.map((s) => ({ id: s.id, type: s.type, title: s.title })),
          beforeAssignment: this.processedSections.length,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'section-render-debug',
        hypothesisId: 'H4',
      });
      // #endregion

      // CRITICAL DEBUG: Log to console if sections are being lost
      if (isDevMode() && isPlatformBrowser(this.platformId)) {
        if (orderedSections.length === 0 && normalizedSections.length > 0) {
          console.error('[AICardRenderer] CRITICAL: All sections filtered out!', {
            inputSections: sections.length,
            normalizedSections: normalizedSections.length,
            completeSections: completeSections.length,
            orderedSections: orderedSections.length,
            normalizedSectionsDetails: normalizedSections.map((s) => ({
              id: s.id,
              type: s.type,
              title: s.title,
              hasFields: !!s.fields?.length,
              hasItems: !!s.items?.length,
              hasChartData: !!s.chartData,
              fieldsCount: s.fields?.length || 0,
              itemsCount: s.items?.length || 0,
            })),
            forceStructural,
            requiresStructuralRebuild,
            isStreaming,
          });
        } else if (orderedSections.length < normalizedSections.length && isDevMode()) {
          console.warn('[AICardRenderer] Sections filtered out', {
            inputSections: sections.length,
            normalizedSections: normalizedSections.length,
            completeSections: completeSections.length,
            orderedSections: orderedSections.length,
            filteredCount: normalizedSections.length - completeSections.length,
          });
        }
      }

      // #region agent log - BEFORE assignment
      const oldArrayRef = this.processedSections;
      const newArrayRef = orderedSections;
      const arrayRefChanged = oldArrayRef !== newArrayRef;
      sendDebugLog({
        location: 'ai-card-renderer.component.ts:refreshProcessedSections:BEFORE_ASSIGNMENT',
        message: 'BEFORE processedSections assignment',
        data: {
          orderedSectionsLength: orderedSections.length,
          currentProcessedLength: this.processedSections.length,
          willChange: orderedSections.length !== this.processedSections.length,
          arrayRefChanged,
          oldArrayLength: oldArrayRef.length,
          newArrayLength: newArrayRef.length,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'section-render-debug',
        hypothesisId: 'H3',
      });
      // #endregion

      // CRITICAL: Always assign a new array reference to ensure Angular's change detection
      // recognizes the change. Even if orderedSections is already a new array, this ensures
      // the reference is definitely different from the previous one.
      this.processedSections = [...orderedSections];

      // #region agent log - AFTER assignment
      const afterArrayRef = this.processedSections;
      const refActuallyChanged = oldArrayRef !== afterArrayRef;
      sendDebugLog({
        location: 'ai-card-renderer.component.ts:refreshProcessedSections:AFTER_ASSIGNMENT',
        message: 'AFTER processedSections assignment',
        data: {
          processedSectionsLength: this.processedSections.length,
          orderedSectionsLength: orderedSections.length,
          matches: this.processedSections.length === orderedSections.length,
          refActuallyChanged,
          oldRefLength: oldArrayRef.length,
          newRefLength: afterArrayRef.length,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'section-render-debug',
        hypothesisId: 'H3',
      });
      // #endregion
      // Optimize: Generate section keys in single pass
      this.sectionOrderKeys = orderedSections.map((section) => this.getSectionKey(section));
      this.previousSectionsHash = nextHash;

      const completenessDuration = performance.now() - completenessStart;
      // #region agent log - write to file, throttled
      if (typeof window !== 'undefined') {
        const logThrottle = (window as any).__debugLogThrottle || {};
        const now = Date.now();
        if (!logThrottle.refreshCompleted || now - logThrottle.refreshCompleted > 200) {
          logThrottle.refreshCompleted = now;
          (window as any).__debugLogThrottle = logThrottle;
          sendDebugLogToFile({
            location: 'ai-card-renderer.component.ts:refreshProcessedSections',
            message: 'refreshProcessedSections completed',
            data: {
              inputSections: normalizedSections.length,
              outputSections: orderedSections.length,
              completenessChecks,
              completenessDuration,
              forceStructural,
              requiresStructuralRebuild,
              isStreaming,
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'perf-debug',
            hypothesisId: 'H',
          });
        }
      }
      // #endregion

      // CRITICAL: Force change detection to ensure template updates
      // OnPush requires explicit change detection triggers
      // IMPORTANT: Use detectChanges() to immediately run change detection synchronously
      // This ensures *ngIf conditions are re-evaluated with the new processedSections value
      // markForCheck() only marks for check but doesn't run detection immediately
      // CRITICAL: Mark for change detection (do NOT call detectChanges() here)
      // Calling it here creates an infinite loop: ngOnChanges → refreshProcessedSections → detectChanges → triggers parent → ngOnChanges again
      // Use only markForCheck() to mark for change detection without triggering it immediately
      try {
        this.cdr.markForCheck();
        // Also queue batched change detection for any subsequent updates
        this.batchedMarkForCheck();
      } catch (error) {
        // Handle NG0203 or other change detection errors gracefully
        // NG0203 errors can occur when injection context is not available in child components
        // These are expected in some contexts and should not be treated as critical errors
        // Silently continue - change detection will happen naturally through Angular's lifecycle
      }

      // #region agent log
      const totalDuration = performance.now() - perfStart;
      // Only log if slow (>50ms) to reduce logging overhead
      if (totalDuration > 50) {
        const logDataEnd = {
          location: 'ai-card-renderer.component.ts:refreshProcessedSections',
          message: 'SLOW: refreshProcessedSections',
          data: {
            totalDuration,
            sectionsCount: sections.length,
            completeCount: completeSections.length,
            requiresStructuralRebuild,
            forceStructural,
            timestamp: Date.now(),
            perfTime: performance.now(),
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'freeze-investigation',
          hypothesisId: 'J',
        };
        if (isDevMode()) {
          console.warn(`[DEBUG] SLOW refreshProcessedSections: ${totalDuration.toFixed(2)}ms`);
        }
        // Defer expensive logging to idle time
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(
            () => {
              sendDebugLog(
                logDataEnd,
                'http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc'
              );
            },
            { timeout: 1000 }
          );
        }
      }
      // #endregion
    } finally {
      // Always reset re-entrancy flag, even if an error occurred
      this.isRefreshing = false;
    }
  }

  private getNormalizedSection(section: CardSection, forceRebuild: boolean): CardSection {
    // Improved cache: only skip cache if forceRebuild is true
    // Cache is cleared at higher level when structure truly changes
    // This improves cache hit rate significantly during streaming (content-only updates)
    if (!forceRebuild) {
      const cached = this.normalizedSectionCache.get(section);
      if (cached) {
        return cached;
      }
    }

    const normalized = this.sectionNormalizationService.normalizeSection(section);
    // Always cache normalized section to improve hit rate
    // WeakMap automatically handles garbage collection when section objects are no longer referenced
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
    const typeKey = section.type ?? 'list';
    return `${titleKey}-${typeKey}`;
  }

  private resetProcessedSections(): void {
    // #region agent log - resetting processed sections
    sendDebugLog({
      location: 'ai-card-renderer.component.ts:resetProcessedSections',
      message: 'Resetting processedSections',
      data: { beforeLength: this.processedSections.length },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'section-render-debug',
      hypothesisId: 'H1',
    });
    // #endregion
    this.processedSections = [];
    this.sectionOrderKeys = [];
    this.previousSectionsHash = '';
    this.lastSectionsReference = null;
    // Only clear cache when truly resetting (no sections)
    // WeakMap will handle garbage collection automatically
    this.normalizedSectionCache = new WeakMap<CardSection, CardSection>();
    this.sectionHashCache = new WeakMap<CardSection[], string>();
    this.completenessCache = new WeakMap<CardSection, boolean>();
    this.batchedMarkForCheck();
  }

  /**
   * TrackBy function for particle animations
   */
  trackByParticle(index: number): number {
    return index;
  }

  /**
   * Generates a fallback card using LLM API call.
   * Similar to Orange Sales Assistance implementation pattern.
   * Makes an HTTP POST request to the LLM endpoint with a prompt to generate card data.
   */
  private generateFallbackCard(): void {
    // Check if HttpClient is available
    if (!this.http) {
      if (isDevMode()) {
        console.warn(
          'HttpClient not available. Cannot generate fallback card via LLM. Make sure HttpClient is provided in your app configuration.'
        );
      }
      return;
    }

    // Only make API calls in browser environment
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Determine the API endpoint (default or custom)
    // Following Orange Sales Assistance pattern: 'osa/invoke' or similar
    const endpoint = this.llmFallbackEndpoint || '/api/llm/generate-card';

    // Create the prompt for LLM based on documentation guidelines
    // This prompt follows the LLM_PROMPT.md documentation structure
    const prompt =
      this.llmFallbackPrompt ||
      `Generate a complete OSI card configuration JSON following these guidelines:

1. Use valid section types: analytics, brand-colors, chart, contact-card, event, faq, financials, gallery, list, map, network-card, news, product, quotation, social-media, solutions, text-reference, timeline, or video.

2. Match data structure - use 'fields' for sections like analytics, or 'items' for sections like list, gallery, timeline.

3. Include required properties: 'title' and 'type' are always required for each section.

4. Create a card with:
   - cardTitle: A descriptive title for the card
   - cardType: company|contact|event|product|analytics (optional)
   - sections: Array of 2-4 sections with diverse types
   - actions: Optional array of action buttons

5. Example structure:
   - Analytics section (type: analytics) with key company information and metrics
   - Contact section (type: contact-card) with contact information

6. Ensure all JSON is valid and properly formatted.

Generate a default company card with comprehensive information including key details, metrics, and contact information.`;

    // Prepare the payload similar to Orange Sales Assistance pattern
    // Matches the structure used in Orange Sales Assistance chatbot component
    // See: chatbot.component.ts line 201-216
    const payload = {
      question: prompt,
      knowledge_base: 'default',
      session_id: 'fallback',
      chat_id: 'fallback-card',
      sources: [],
      prompt: prompt,
      model_name: 'gpt-4o', // Default model, matching Orange Sales Assistance default
      prompt_status: 'Default',
      source_weights: [],
    };

    // Make LLM API call (following Orange Sales Assistance pattern)
    // Response structure matches Orange Sales Assistance: { result: string, ... }
    // See: chatbot.component.ts line 225-229
    this.http
      .post<{ result?: string; card?: AICardConfig; data?: AICardConfig; response?: string }>(
        endpoint,
        payload
      )
      .pipe(
        takeUntil(this.destroyed$),
        catchError((error: HttpErrorResponse) => {
          // Log error but don't throw - allow empty state to show
          // Following Orange Sales Assistance error handling pattern
          if (isDevMode()) {
            console.error('LLM fallback API call failed:', error);
            console.warn(
              'Falling back to empty state. Ensure LLM endpoint is configured correctly.'
            );
          }
          // Return null to allow empty state to display
          return of(null);
        })
      )
      .subscribe((response) => {
        if (response) {
          // Handle different response formats (flexible like Orange Sales Assistance)
          // Orange Sales Assistance returns: { result: string } where result may be JSON
          let cardConfig: AICardConfig | null = null;

          // Try different response property names (matching Orange Sales Assistance pattern)
          if (response.result) {
            // Orange Sales Assistance pattern: result contains the response
            try {
              const parsed = JSON.parse(response.result);
              if (parsed && typeof parsed === 'object') {
                cardConfig = parsed as AICardConfig;
              }
            } catch {
              // If result is not JSON, try to extract JSON from the string
              try {
                // Look for JSON object in the response string
                const jsonMatch = response.result.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const parsed = JSON.parse(jsonMatch[0]);
                  if (parsed && typeof parsed === 'object') {
                    cardConfig = parsed as AICardConfig;
                  }
                }
              } catch (extractError) {
                if (isDevMode()) {
                  console.error('Failed to parse LLM result as JSON:', extractError);
                }
              }
            }
          } else if (response.card) {
            cardConfig = response.card;
          } else if (response.data) {
            cardConfig = response.data;
          } else if (response.response) {
            // If response is a JSON string, parse it
            try {
              const parsed = JSON.parse(response.response);
              if (parsed && typeof parsed === 'object') {
                cardConfig = parsed as AICardConfig;
              }
            } catch (parseError) {
              if (isDevMode()) {
                console.error('Failed to parse LLM response as JSON:', parseError);
              }
            }
          }

          // Update card config if we got valid data
          if (cardConfig) {
            this.cardConfig = cardConfig;
            this.batchedMarkForCheck();

            // Refresh sections if needed
            if (!this.processedSections.length) {
              this.refreshProcessedSections(true);
            }
          }
        }
      });
  }

  /**
   * Get the version string for display in tooltip
   */
  get versionString(): string {
    return getShortVersion();
  }

  /**
   * Handle click on the signature to open OSI Cards website
   */
  onSignatureClick(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.open('https://osi-card.web.app/', '_blank', 'noopener,noreferrer');
    }
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
            "  import { provideOSICards } from '../../../public-api';\n" +
            '  export const appConfig: ApplicationConfig = {\n' +
            '    providers: [provideOSICards(), ...]\n' +
            '  };\n\n' +
            'See https://github.com/Inutilepat83/OSI-Cards for more information.'
        );
      }
    } catch {
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
