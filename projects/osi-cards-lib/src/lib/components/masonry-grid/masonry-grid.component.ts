import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardSection } from '../../models';
import {
  SectionRendererComponent,
  SectionRenderEvent,
} from '../section-renderer/section-renderer.component';
import { MasonryGridLayoutService, LayoutConfig } from './masonry-grid-layout.service';
import { Breakpoint } from '../../types';

// Stub function - responsive.util was removed
function getBreakpointFromWidth(width: number): Breakpoint {
  if (width < 576) return 'xs';
  if (width < 768) return 'sm';
  if (width < 992) return 'md';
  if (width < 1200) return 'lg';
  return 'xl';
}
import {
  MIN_COLUMN_WIDTH,
  MAX_COLUMNS,
  GRID_GAP,
  calculateColumns,
  generateWidthExpression,
  generateLeftExpression,
  getPreferredColumns,
  PreferredColumns,
  shouldExpandSection,
  SectionExpansionInfo,
  calculateBasicDensity,
} from '../../utils/grid-config.util';
import { estimateSectionHeight } from '../../utils/smart-grid.util';
import {
  HeightEstimator,
  recordHeightMeasurement,
  HeightEstimationContext,
} from '../../utils/height-estimation.util';
import { VirtualScrollManager, ViewportState } from '../../utils/virtual-scroll.util';
import {
  MasterGridLayoutEngine,
  MasterLayoutResult,
} from '../../utils/master-grid-layout-engine.util';
import { SectionLayoutPreferenceService } from '../../services/section-layout-preference.service';

interface ColSpanThresholds {
  two: number;
  three?: number;
}

const DEFAULT_COL_SPAN_THRESHOLD: ColSpanThresholds = { two: 6 };

export interface MasonryLayoutInfo {
  breakpoint: Breakpoint;
  columns: number;
  containerWidth: number;
}

interface PositionedSection {
  section: CardSection;
  key: string;
  colSpan: number;
  preferredColumns: PreferredColumns;
  left: string;
  top: number;
  width: string;
  isNew?: boolean | undefined; // Whether this section should animate (newly added during streaming)
  hasAnimated?: boolean | undefined; // Whether this section has completed its entrance animation
}

/**
 * Layout state for tracking layout progress
 */
type LayoutState = 'idle' | 'measuring' | 'calculating' | 'ready';

/**
 * Column assignment result
 */
interface ColumnAssignment {
  columnIndex: number;
  colSpan: number;
  expanded: boolean;
  expansionReason?: string;
}

/**
 * Detailed layout log entry for debugging and monitoring
 * Emitted via layoutLog output when columns change or sections are repositioned
 */
export interface LayoutLogEntry {
  /** Unix timestamp when the log was generated */
  timestamp: number;
  /** Type of layout event that triggered this log */
  event: 'columns_changed' | 'sections_positioned' | 'section_expanded';
  /** Current container width in pixels */
  containerWidth: number;
  /** Current number of columns */
  columns: number;
  /** Previous number of columns (only for columns_changed event) */
  previousColumns?: number | undefined;
  /** Detailed information for each section */
  sections: SectionLayoutLog[];
}

/**
 * Layout information for a single section
 */
export interface SectionLayoutLog {
  /** Section ID or generated key */
  id: string;
  /** Section type (e.g., 'info', 'analytics', 'chart') */
  type: string;
  /** Section title */
  title: string;
  /** Preferred number of columns for this section type */
  preferredColumns: 1 | 2 | 3 | 4;
  /** Actual column span after constraint negotiation */
  actualColSpan: number;
  /** True if section was auto-expanded to fill available space */
  expanded: boolean;
  /** CSS position values */
  position: { left: string; top: number };
  /** CSS width expression */
  width: string;
}

@Component({
  selector: 'app-masonry-grid',
  standalone: true,
  imports: [CommonModule, SectionRendererComponent],
  templateUrl: './masonry-grid.component.html',
  styleUrls: ['./masonry-grid.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None, // Inherits styles from parent's Shadow DOM
})
export class MasonryGridComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() sections: CardSection[] = [];
  @Input() gap = GRID_GAP; // Standardized 12px gap from grid-config
  @Input() minColumnWidth = MIN_COLUMN_WIDTH; // Standardized 260px min column width
  @Input() maxColumns = MAX_COLUMNS; // Standardized max 4 columns

  /**
   * Optional explicit container width from parent.
   * When provided, this takes priority over DOM measurement for reliable initial layout.
   */
  @Input() containerWidth?: number;

  /**
   * Flag indicating active streaming mode.
   * When true, uses incremental layout updates to prevent blinking.
   */
  @Input() isStreaming = false;

  /**
   * Enable ultra-compact layout optimization.
   * When true, uses 5-pass compaction algorithm to minimize gaps and maximize space utilization.
   * Uses the master grid layout engine for intelligent, content-aware placement.
   */
  @Input() optimizeLayout = true;

  /**
   * Enable virtual scrolling for large section lists.
   * When true and section count exceeds virtualThreshold, only renders visible sections.
   * Significantly improves performance for cards with 50+ sections.
   */
  @Input() enableVirtualScroll = false;

  /**
   * Minimum number of sections before virtual scrolling is enabled.
   * Only applies when enableVirtualScroll is true.
   * @default 50
   */
  @Input() virtualThreshold = 50;

  /**
   * Number of sections to render above/below the visible area as a buffer.
   * Higher values provide smoother scrolling but use more memory.
   * @default 5
   */
  @Input() virtualBuffer = 5;

  /**
   * Enable debug logging for smart grid layout.
   * When true, logs detailed placement decisions to the console.
   */
  @Input() set debug(value: boolean) {
    this._debug = value;
    if (value) {
      console.log('[MasonryGrid] Debug mode enabled - watch console for layout logs');
    }
    // Update master engine debug setting
    if (this.masterEngine) {
      this.masterEngine = new MasterGridLayoutEngine({
        ...this.masterEngine['config'],
        debug: value,
      });
    }
  }
  get debug(): boolean {
    return this._debug;
  }
  private _debug = false;

  @Output() sectionEvent = new EventEmitter<SectionRenderEvent>();
  @Output() layoutChange = new EventEmitter<MasonryLayoutInfo>();
  /** Detailed layout log for debugging - emits on column changes and section repositioning */
  @Output() layoutLog = new EventEmitter<LayoutLogEntry>();

  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;
  @ViewChildren('itemRef') itemRefs!: QueryList<ElementRef<HTMLDivElement>>;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly layoutService = inject(MasonryGridLayoutService);
  private readonly layoutPreferenceService = inject(SectionLayoutPreferenceService);

  positionedSections: PositionedSection[] = [];
  containerHeight = 0;
  isLayoutReady = false; // Prevent FOUC (Flash of Unstyled Content)

  /**
   * Track sections that have already been animated.
   * Prevents re-animating existing sections when new ones are added during streaming.
   * IMPORTANT: This set is PERSISTENT across streaming sessions - only cleared when
   * sections are completely replaced (not when streaming starts/stops).
   */
  private renderedSectionKeys = new Set<string>();
  private previousStreamingState = false;

  /**
   * Track section IDs from previous update to detect truly new sections.
   * Used to determine which sections should animate on entrance.
   */
  private previousSectionIds = new Set<string>();

  /**
   * Track section keys that have completed their entrance animation.
   * This prevents sections from re-animating when the component re-renders.
   * CRITICAL: This set prevents the "first section blinking" issue by ensuring
   * animations only play once per section.
   */
  private animatedSectionKeys = new Set<string>();

  /** Current layout state for debugging and parent components */
  layoutState: LayoutState = 'idle';

  /** Current column count (after calculation) */
  currentColumns = 1;

  // ========================================================================
  // SIMPLE LAYOUT SYSTEM
  // ========================================================================

  private resizeObserver?: ResizeObserver;
  private layoutTimeout?: number;
  private reflowTimeout?: number;
  private lastWidth = 0;
  private reflowCount = 0;
  private lastLayoutInfo?: MasonryLayoutInfo;
  private isReflowing = false; // Prevent concurrent reflows
  private readonly MAX_REFLOWS = 3;

  private readonly DEBOUNCE_MS = 150;

  // Virtual scroll manager for large section lists
  private virtualScrollManager: VirtualScrollManager<PositionedSection> | null = null;
  private scrollUnsubscribe: (() => void) | null = null;

  // NEW: Advanced grid layout systems
  private masterEngine!: MasterGridLayoutEngine;

  /** Sections currently rendered (may be subset when virtual scrolling is active) */
  renderedSections: PositionedSection[] = [];

  /** Virtual scroll viewport state */
  virtualViewport: ViewportState | null = null;

  /** Whether virtual scrolling is currently active */
  get isVirtualScrollActive(): boolean {
    return this.enableVirtualScroll && (this.sections?.length || 0) >= this.virtualThreshold;
  }

  constructor() {
    // Initialize master grid engine (handles all layout intelligence)
    this.masterEngine = new MasterGridLayoutEngine({
      gap: this.gap,
      minColumnWidth: this.minColumnWidth,
      maxColumns: this.maxColumns,
      enableWeightedSelection: true,
      enableIntelligence: true,
      enableCompaction: true,
      enableCaching: true,
      debug: this._debug,
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Only update if sections actually changed
    if (changes['sections']) {
      const prevSections = changes['sections'].previousValue as CardSection[] | undefined;
      const currSections = changes['sections'].currentValue as CardSection[] | undefined;

      // Check if sections actually changed (length or content)
      const sectionsChanged =
        !prevSections ||
        !currSections ||
        prevSections.length !== currSections.length ||
        prevSections.some(
          (s, i) => s?.id !== currSections[i]?.id || s?.title !== currSections[i]?.title
        );

      if (sectionsChanged) {
        this.reflowCount = 0; // Reset reflow count on section changes
        this.updateLayout();
      }
    }

    // Handle containerWidth changes
    if (changes['containerWidth']) {
      const newWidth = changes['containerWidth'].currentValue;
      if (newWidth && newWidth > 0 && newWidth !== this.lastWidth) {
        this.reflowCount = 0; // Reset reflow count on width changes
        this.updateLayout();
      }
    }
  }

  ngAfterViewInit(): void {
    this.setupResizeObserver();
    this.setupFullscreenListener();
    this.updateLayout();
  }

  /**
   * Initialize virtual scroll manager if conditions are met
   */
  private initializeVirtualScroll(): void {
    if (!this.enableVirtualScroll || !this.containerRef?.nativeElement) {
      return;
    }

    // Create virtual scroll manager with masonry-specific configuration
    this.virtualScrollManager = new VirtualScrollManager<PositionedSection>(
      this.containerRef.nativeElement,
      {
        bufferSize: this.virtualBuffer,
        estimatedItemHeight: 200,
        virtualThreshold: this.virtualThreshold,
        smoothScroll: true,
        overscanCount: 2,
      },
      // Custom height estimator for positioned sections
      (item: PositionedSection) => {
        // Use actual DOM height if available, otherwise estimate
        const itemIndex = this.positionedSections.findIndex((s) => s.key === item.key);
        const itemRef = this.itemRefs?.toArray()[itemIndex];
        if (itemRef?.nativeElement?.offsetHeight) {
          return itemRef.nativeElement.offsetHeight;
        }
        return estimateSectionHeight(item.section);
      }
    );

    // Listen for scroll events
    this.scrollUnsubscribe = this.virtualScrollManager.onScroll((event) => {
      this.virtualScrollManager?.setScrollTop(event.scrollTop);
      this.updateVirtualViewport();
    });

    // Setup container scroll listener
    if (this.containerRef?.nativeElement) {
      this.containerRef.nativeElement.addEventListener('scroll', this.handleScroll.bind(this), {
        passive: true,
      });
    }
  }

  /**
   * Handle scroll events for virtual scrolling
   */
  private handleScroll(event: Event): void {
    if (!this.virtualScrollManager || !this.isVirtualScrollActive) {
      return;
    }

    const target = event.target as HTMLElement;
    this.virtualScrollManager.setScrollTop(target.scrollTop);
    this.updateVirtualViewport();
  }

  /**
   * Update virtual scroll viewport and rendered sections
   */
  private updateVirtualViewport(): void {
    if (!this.virtualScrollManager || !this.isVirtualScrollActive) {
      this.renderedSections = this.positionedSections;
      this.virtualViewport = null;
      return;
    }

    // Update items in virtual scroll manager
    this.virtualScrollManager.setItems(this.positionedSections);

    // Get visible items
    const visibleItems = this.virtualScrollManager.getVisibleItems();
    this.renderedSections = visibleItems.map((vi) => vi.item);
    this.virtualViewport = this.virtualScrollManager.getViewportState();

    // Log in debug mode
    if (this._debug && this.virtualViewport) {
      console.log('[MasonryGrid] Virtual scroll:', {
        totalSections: this.positionedSections.length,
        renderedSections: this.renderedSections.length,
        startIndex: this.virtualViewport.startIndex,
        endIndex: this.virtualViewport.endIndex,
      });
    }

    this.cdr.markForCheck();
  }

  /**
   * Forces initial layout calculation with retry mechanism.
   * This handles the case where container width is 0 on first render.
   */

  /**
   * Gets the container width using simplified fallback chain.
   * Priority: @Input containerWidth → DOM measurement → parent fallback
   * Improved to handle fullscreen and ensure accurate measurements
   */
  private getContainerWidth(): number {
    // Use explicit input width if provided
    if (this.containerWidth && this.containerWidth > 0) {
      return this.containerWidth;
    }

    const container = this.containerRef?.nativeElement;
    if (!container) {
      // Fallback to window width minus padding
      return typeof window !== 'undefined' ? window.innerWidth - 80 : 1200;
    }

    // Use getBoundingClientRect for accurate measurement (includes padding/borders)
    const rect = container.getBoundingClientRect();
    const measuredWidth = rect.width || container.clientWidth || container.offsetWidth;

    // Ensure we have a valid width
    if (measuredWidth > 0) {
      return measuredWidth;
    }

    // Final fallback
    return typeof window !== 'undefined' ? window.innerWidth - 80 : 1200;
  }

  /**
   * Gets a fallback width based on window dimensions.
   * This ensures multi-column layout even when container isn't measured yet.
   */
  private getWindowFallbackWidth(): number {
    if (typeof window === 'undefined') {
      // SSR fallback - assume mobile width
      return 375;
    }
    // Use window width minus typical padding (40px each side = 80px total)
    // This gives a reasonable approximation for most card layouts
    return Math.max(window.innerWidth - 80, this.minColumnWidth);
  }

  ngOnDestroy(): void {
    // Clean up observers
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;

    // Clean up fullscreen listener
    if (typeof document !== 'undefined') {
      document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', this.handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', this.handleFullscreenChange);
    }

    // Clean up timeouts
    if (this.layoutTimeout) {
      clearTimeout(this.layoutTimeout);
      this.layoutTimeout = undefined;
    }
    if (this.reflowTimeout) {
      clearTimeout(this.reflowTimeout);
      this.reflowTimeout = undefined;
    }

    // Clean up virtual scroll
    this.virtualScrollManager?.destroy();
    this.virtualScrollManager = null;
    this.scrollUnsubscribe?.();
    this.scrollUnsubscribe = null;

    // Remove event listeners
    if (this.containerRef?.nativeElement) {
      this.containerRef.nativeElement.removeEventListener('scroll', this.handleScroll.bind(this));
    }

    // Clear animation state tracking sets
    this.renderedSectionKeys.clear();
    this.previousSectionIds.clear();
    this.animatedSectionKeys.clear();
  }

  trackItem = (index: number, item: CardSection | null | undefined): string => {
    if (!item) {
      return `null-item-${index}`;
    }
    // Use section ID or generate stable key
    return item.id || this.getStableSectionKey(item, index);
  };

  onSectionEvent(event: SectionRenderEvent): void {
    this.sectionEvent.emit(event);
  }

  /**
   * Check if a section should animate its entrance.
   * Returns true only for NEW sections that haven't animated yet.
   * This prevents the "first section keeps blinking" issue.
   *
   * @param key - The section's unique key
   * @returns true if the section should animate, false otherwise
   */
  shouldAnimate(key: string): boolean {
    // Only animate during streaming and only if not already animated
    return this.isStreaming && !this.animatedSectionKeys.has(key);
  }

  /**
   * Mark a section as having completed its animation.
   * Called from template on animationend event.
   * This ensures the section won't re-animate on subsequent renders.
   *
   * IMPORTANT: This method clears the `isNew` flag to prevent continuous animation
   * and adds the key to `animatedSectionKeys` for persistent tracking.
   *
   * @param key - The section's unique key
   */
  onSectionAnimationEnd(key: string): void {
    if (key) {
      this.animatedSectionKeys.add(key);
      // Also mark in the positionedSections array for state tracking
      const section = this.positionedSections.find((s) => s.key === key);
      if (section) {
        section.hasAnimated = true;
        // CRITICAL: Clear isNew flag to stop animation from re-triggering
        // This fixes the "first section keeps blinking" issue
        section.isNew = false;
      }
      // Log in debug mode
      if (this._debug) {
        console.log(`[MasonryGrid] Animation completed for section: ${key}`);
      }
      // Trigger change detection to update template bindings
      this.cdr.markForCheck();
    }
  }

  /**
   * Check if a section has completed its entrance animation.
   * Used in template to apply post-animation styles.
   *
   * @param key - The section's unique key
   * @returns true if animation has completed, false otherwise
   */
  hasAnimated(key: string): boolean {
    return this.animatedSectionKeys.has(key);
  }

  /**
   * Finalizes all section animations when streaming ends.
   * This ensures any sections that haven't completed their animation yet
   * are properly marked as complete to prevent lingering animation states.
   *
   * Called when `isStreaming` changes from true to false.
   */
  private finalizeStreamingAnimations(): void {
    let hasChanges = false;

    // Mark all sections as animated and clear isNew flags
    for (const section of this.positionedSections) {
      if (section.isNew) {
        section.isNew = false;
        section.hasAnimated = true;
        this.animatedSectionKeys.add(section.key);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      if (this._debug) {
        console.log('[MasonryGrid] Finalized streaming animations for all sections');
      }
      this.cdr.markForCheck();
    }
  }

  /**
   * Gets a unique section ID for scrolling
   * @param section - The section to get an ID for (can be null/undefined)
   * @returns A sanitized section ID string
   */
  getSectionId(section: CardSection | null | undefined): string {
    if (!section) {
      return 'section-unknown';
    }
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

  /**
   * Sets up the ResizeObserver for the container.
   * Uses debouncing to prevent excessive layout calculations during resize.
   */

  /**
   * Simple layout update with debouncing
   * Prevents rapid recalculations during resize or rapid changes
   */
  private updateLayout(): void {
    // Cancel any pending layout update
    if (this.layoutTimeout) {
      clearTimeout(this.layoutTimeout);
      this.layoutTimeout = undefined;
    }

    // Debounce layout calculation to prevent excessive recalculations
    this.layoutTimeout = window.setTimeout(() => {
      this.layoutTimeout = undefined;
      this.calculateLayout();
    }, this.DEBOUNCE_MS);
  }

  /**
   * Setup resize observer - only triggers on significant width changes
   * Improved to handle fullscreen transitions and ensure proper recalculation
   */
  private setupResizeObserver(): void {
    if (!this.containerRef || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const newWidth = entry.contentRect.width;

      // Skip if width is invalid
      if (newWidth <= 0) return;

      // Calculate new column count
      const newColumns = this.calculateResponsiveColumns(newWidth);
      const columnsChanged = newColumns !== this.currentColumns;

      // Calculate width difference
      const widthDiff = Math.abs(newWidth - this.lastWidth);

      // Only update if:
      // 1. Column count changed (breakpoint change) - always update
      // 2. Width changed significantly (> 10px) - increased threshold to reduce blinking
      // 3. Width changed by more than 2% (handles fullscreen transitions)
      const significantChange =
        widthDiff > 10 || (this.lastWidth > 0 && widthDiff / this.lastWidth > 0.02);

      if (columnsChanged || significantChange) {
        // Update cached width before triggering layout
        this.lastWidth = newWidth;
        this.updateLayout();
      } else {
        // Update cached width even if not recalculating (for next comparison)
        this.lastWidth = newWidth;
      }
    });

    this.resizeObserver.observe(this.containerRef.nativeElement);
  }

  /**
   * Setup fullscreen change listener to recalculate layout when entering/exiting fullscreen
   * This ensures proper layout when the container size changes due to fullscreen transitions
   */
  private setupFullscreenListener(): void {
    if (typeof document === 'undefined') {
      return;
    }

    // Bind handler to preserve 'this' context
    this.handleFullscreenChange = this.handleFullscreenChange.bind(this);

    // Listen for fullscreen changes (cross-browser support)
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', this.handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', this.handleFullscreenChange);
  }

  /**
   * Handle fullscreen change events
   * Recalculates layout after a short delay to allow DOM to settle
   */
  private handleFullscreenChange = (): void => {
    // Wait a bit for the DOM to settle after fullscreen change
    setTimeout(() => {
      // Force layout recalculation
      this.lastWidth = 0; // Reset to force recalculation
      this.updateLayout();
    }, 100);
  };

  /**
   * Generate a stable key for a section.
   * Uses id if available, otherwise uses title + type + index for uniqueness.
   *
   * @param section - The section to generate a key for
   * @param index - Optional index to ensure uniqueness when id is missing
   */
  private getStableSectionKey(section: CardSection, index?: number): string {
    if (section.id) {
      return section.id;
    }
    // Use title, type, AND index for unique identification
    // This prevents duplicate keys when sections have same title+type but no id
    const title = section.title ?? '';
    const type = section.type ?? 'section';
    const idx =
      index !== undefined
        ? `-${index}`
        : `-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    return `${title}-${type}${idx}`;
  }

  /**
   * Simple layout calculation - CSS Grid handles positioning
   * Just calculate columns and let CSS do the rest
   */
  private calculateLayout(): void {
    // Early return if container not ready
    if (!this.containerRef?.nativeElement) {
      return;
    }

    const containerWidth = this.getContainerWidth();
    if (containerWidth <= 0) {
      return;
    }

    const sections = this.sections ?? [];
    if (sections.length === 0) {
      this.currentColumns = 1;
      this.isLayoutReady = true;
      this.layoutState = 'ready';
      this.cdr.markForCheck();
      return;
    }

    // Calculate columns - CSS Grid handles the rest
    this.currentColumns = this.calculateResponsiveColumns(containerWidth);
    this.lastWidth = containerWidth;

    // Apply CSS variables - CSS Grid handles positioning
    this.applyLayoutToDOM(containerWidth);

    // Mark as ready - CSS Grid handles heights automatically
    this.isLayoutReady = true;
    this.layoutState = 'ready';

    // Emit layout change event
    this.emitLayoutInfo(this.currentColumns, containerWidth);

    this.cdr.markForCheck();
  }

  /**
   * Create fallback layout when calculation fails
   */
  private createFallbackLayout(sections: CardSection[], containerWidth: number): void {
    this.currentColumns = this.calculateResponsiveColumns(containerWidth);
    this.positionedSections = sections.map((section, index) => {
      const key = this.getStableSectionKey(section, index);
      const colSpan = Math.min(section.colSpan || this.getColSpan(section), this.currentColumns);
      return {
        section,
        key,
        colSpan,
        preferredColumns: getPreferredColumns(section.type ?? 'default'),
        left: generateLeftExpression(this.currentColumns, 0, this.gap),
        top: 0,
        width: generateWidthExpression(this.currentColumns, colSpan, this.gap),
        isNew: this.isTrulyNewSection(section, key),
      };
    });
    this.containerHeight = Math.max(...this.positionedSections.map((s) => s.top), 0) + 200;
  }

  /**
   * Apply layout to DOM - CSS Grid handles everything
   * Just set CSS variables, CSS does the positioning
   */
  private applyLayoutToDOM(containerWidth: number): void {
    const containerElement = this.containerRef?.nativeElement;
    if (!containerElement) return;

    // Calculate column width for CSS variable
    const colWidth = (containerWidth - this.gap * (this.currentColumns - 1)) / this.currentColumns;

    // Set CSS variables - CSS Grid handles the rest
    containerElement.style.setProperty('--masonry-columns', this.currentColumns.toString());
    containerElement.style.setProperty('--masonry-gap', `${this.gap}px`);
    containerElement.style.setProperty('--masonry-column-width', `${colWidth}px`);

    // CSS Grid handles height automatically - no need to set it
  }

  /**
   * Calculate responsive columns based on container width
   */
  private calculateResponsiveColumns(containerWidth: number): number {
    // Updated breakpoints for 220px min column width
    // 2 cols: 2*220 + 1*12 = 452px, 3 cols: 3*220 + 2*12 = 684px, 4 cols: 4*220 + 3*12 = 916px
    if (containerWidth < 464) return 1; // Mobile (< 2 columns)
    if (containerWidth < 684) return 2; // Tablet (2 columns)
    if (containerWidth < 904) return 3; // Desktop (3 columns)
    return Math.min(4, this.maxColumns); // Wide (4 columns)
  }

  /**
   * Get column span for a section - simple and respects preferred columns (1-4)
   * Priority: explicit colSpan → dynamic layout preferences → preferredColumns → type-based default
   */
  getColSpan(section: CardSection): number {
    // Priority 1: Explicit colSpan always takes precedence
    if (section.colSpan && section.colSpan > 0) {
      return Math.min(section.colSpan, this.currentColumns);
    }

    // Priority 2: Use dynamic layout preferences (NEW)
    const layoutPrefs = this.getSectionLayoutPreferences(section);
    if (layoutPrefs.preferredColumns && layoutPrefs.preferredColumns > 0) {
      // Respect min/max constraints
      const result = Math.max(
        layoutPrefs.minColumns,
        Math.min(layoutPrefs.preferredColumns, layoutPrefs.maxColumns, this.currentColumns)
      );
      return result;
    }

    // Priority 3: Use preferredColumns from section data
    if (section.preferredColumns && section.preferredColumns > 0) {
      return Math.min(section.preferredColumns, this.currentColumns);
    }

    // Priority 4: Type-based defaults (keep simple)
    const type = (section.type || '').toLowerCase();

    // Full-width types
    if (type === 'overview' || type === 'header' || type === 'hero') {
      return Math.min(4, this.currentColumns);
    }

    // Wide types
    if (type === 'chart' || type === 'analytics' || type === 'gallery' || type === 'map') {
      return Math.min(2, this.currentColumns);
    }

    if (type === 'timeline' || type === 'financials') {
      return Math.min(3, this.currentColumns);
    }

    // Default: 1 column
    return 1;
  }

  /**
   * Get breakpoint name from container width
   */
  private getBreakpoint(containerWidth: number): Breakpoint {
    if (containerWidth < 640) return 'xs' as Breakpoint;
    if (containerWidth < 768) return 'sm' as Breakpoint;
    if (containerWidth < 1024) return 'md' as Breakpoint;
    if (containerWidth < 1280) return 'lg' as Breakpoint;
    if (containerWidth < 1536) return 'xl' as Breakpoint;
    return '2xl' as Breakpoint;
  }

  /**
   * Fallback layout method if master engine fails
   * Simplified version for safety
   */
  private computeLegacyLayoutFallback(sections: CardSection[], containerWidth: number): void {
    const columns = Math.max(
      1,
      Math.min(
        this.maxColumns,
        Math.floor((containerWidth + this.gap) / (this.minColumnWidth + this.gap))
      )
    );

    const colHeights = Array(columns).fill(0);

    this.positionedSections = sections.map((section, index) => {
      const key = this.getStableSectionKey(section, index);
      const colSpan = Math.min(section.colSpan || 1, columns);
      const isNew = this.isStreaming && this.isTrulyNewSection(section, key);
      this.markSectionRendered(section, key);

      // Find shortest column
      let bestCol = 0;
      let minHeight = Infinity;
      for (let col = 0; col <= columns - colSpan; col++) {
        let maxHeight = 0;
        for (let c = col; c < col + colSpan; c++) {
          maxHeight = Math.max(maxHeight, colHeights[c] || 0);
        }
        if (maxHeight < minHeight) {
          minHeight = maxHeight;
          bestCol = col;
        }
      }

      const top = minHeight;
      const height = 200; // Estimate

      // Update column heights
      for (let c = bestCol; c < bestCol + colSpan; c++) {
        colHeights[c] = top + height + this.gap;
      }

      return {
        section,
        key,
        colSpan,
        preferredColumns: colSpan as PreferredColumns,
        left: generateLeftExpression(columns, bestCol, this.gap),
        top,
        width: generateWidthExpression(columns, colSpan, this.gap),
        isNew,
        hasAnimated: this.animatedSectionKeys.has(key),
      };
    });

    this.containerHeight = Math.max(...colHeights);
    this.currentColumns = columns;
    this.isLayoutReady = true;
    this.layoutState = 'ready';
  }

  /**
   * Incremental section addition for streaming mode
   *
   * During streaming, we want to add new sections without:
   * 1. Resetting isLayoutReady (which causes opacity flash)
   * 2. Rebuilding the entire positionedSections array
   * 3. Losing existing section positions
   *
   * This method uses a SIMPLIFIED STREAMING ALGORITHM:
   * - Always appends to the shortest column for stability
   * - Uses single-column placement to avoid layout shifts
   * - Defers complex multi-column optimization to post-streaming reflow
   *
   * This approach:
   * - Identifies new sections not yet in positionedSections
   * - Updates existing sections' content in place
   * - Appends new sections to shortest column (simple, stable placement)
   * - Schedules a full reflow after streaming ends for optimal layout
   */
  private addNewSectionsIncrementally(validSections: CardSection[]): void {
    // Create maps for fast lookup by ID and by existing key
    const existingById = new Map<string, PositionedSection>();
    const existingByKey = new Map<string, PositionedSection>();

    for (const ps of this.positionedSections) {
      // Index by section id if available
      if (ps.section.id) {
        existingById.set(ps.section.id, ps);
      }
      // Also index by the already-assigned key
      existingByKey.set(ps.key, ps);
    }

    // Identify new sections and update existing ones
    const newSections: Array<{ section: CardSection; index: number }> = [];

    for (let i = 0; i < validSections.length; i++) {
      const section = validSections[i];
      if (!section) continue;

      // Try to find existing section by id first (most reliable)
      let existing: PositionedSection | undefined;
      if (section.id) {
        existing = existingById.get(section.id);
      }

      if (existing) {
        // Update existing section's content in place (preserves object references)
        Object.assign(existing.section, section);
      } else {
        // This is a new section - track with its index for unique key generation
        newSections.push({ section, index: this.positionedSections.length + newSections.length });
      }
    }

    // If no new sections, just mark for check
    if (newSections.length === 0) {
      this.cdr.markForCheck();
      return;
    }

    // Calculate columns for proper multi-column placement
    const containerWidth = this.getContainerWidth();
    const columns = Math.min(
      this.maxColumns,
      Math.max(1, Math.floor((containerWidth + this.gap) / (this.minColumnWidth + this.gap)))
    );
    const colWidth =
      columns > 1 ? (containerWidth - this.gap * (columns - 1)) / columns : containerWidth;

    // Build column heights from existing sections with better height estimation
    const colHeights = Array(columns).fill(0);
    for (const ps of this.positionedSections) {
      // Parse column index from left position - handle calc() expressions properly
      let colIndex = 0;
      if (ps.left === '0px' || ps.left === '0') {
        colIndex = 0;
      } else if (ps.left.includes('calc')) {
        // Extract column index from calc expression pattern: calc(...) * INDEX)
        const indexMatch = ps.left.match(/\*\s*(\d+)\s*\)/);
        if (indexMatch && indexMatch[1]) {
          colIndex = parseInt(indexMatch[1], 10);
        }
      } else {
        // Simple px value
        const leftPx = parseFloat(ps.left) || 0;
        colIndex = Math.round(leftPx / (colWidth + this.gap));
      }
      colIndex = Math.min(columns - 1, Math.max(0, colIndex));

      // Use estimated section height based on content for better positioning
      const estimatedHeight = estimateSectionHeight(ps.section);

      // Update column heights for all columns this section spans
      const sectionSpan = Math.min(ps.colSpan || 1, columns - colIndex);
      const newHeight = ps.top + estimatedHeight + this.gap;
      for (let c = colIndex; c < colIndex + sectionSpan; c++) {
        colHeights[c] = Math.max(colHeights[c], newHeight);
      }
    }

    // STREAMING OPTIMIZATION: Use simplified placement for stability
    // Always place in shortest column with single-column width during streaming
    // This prevents jarring layout shifts as new sections arrive
    const newPositionedSections = newSections.map(({ section, index }) => {
      const stableKey = this.getStableSectionKey(section, index);
      const preferredCols = this.getPreferredColumns(section);

      // Mark as new for entrance animation
      const isNew = this.isTrulyNewSection(section, stableKey);
      this.markSectionRendered(section, stableKey);

      // STREAMING: Use simplified shortest-column placement
      // Find the shortest column (always start from column 0 for left-alignment)
      let shortestCol = 0;
      let shortestHeight = colHeights[0] ?? 0;

      for (let c = 0; c < columns; c++) {
        const height = colHeights[c] ?? 0;
        if (height < shortestHeight) {
          shortestHeight = height;
          shortestCol = c;
        }
      }

      // For streaming, use single column width (will be optimized in post-streaming reflow)
      // Exception: charts and maps benefit from 2 columns even during streaming
      const type = section.type?.toLowerCase() ?? '';
      const streamingColSpan =
        type === 'chart' || type === 'map' || type === 'overview'
          ? Math.min(2, columns - shortestCol)
          : 1;

      // Ensure column fits
      const actualColSpan = Math.min(streamingColSpan, columns - shortestCol);
      const topPosition = shortestHeight;

      // Generate width and left expressions
      const widthExpr = generateWidthExpression(columns, actualColSpan, this.gap);
      const leftExpr = generateLeftExpression(columns, shortestCol, this.gap);

      // Update column heights for all columns this section spans
      const estimatedHeight = estimateSectionHeight(section);
      const newHeight = topPosition + estimatedHeight + this.gap;
      for (let c = shortestCol; c < shortestCol + actualColSpan; c++) {
        colHeights[c] = newHeight;
      }

      const item: PositionedSection = {
        section,
        key: stableKey,
        colSpan: actualColSpan,
        preferredColumns: preferredCols,
        left: leftExpr,
        top: topPosition,
        width: widthExpr,
        isNew,
      };

      return item;
    });

    // Append new sections (preserves existing array references)
    this.positionedSections = [...this.positionedSections, ...newPositionedSections];
    this.containerHeight = Math.max(...colHeights, 0);

    // Update container CSS directly without triggering full recalculation
    const containerElement = this.containerRef?.nativeElement;
    if (containerElement) {
      containerElement.style.setProperty('--masonry-columns', columns.toString());
      containerElement.style.setProperty('--masonry-gap', `${this.gap}px`);
      const colWidth =
        columns > 1 ? (containerWidth - this.gap * (columns - 1)) / columns : containerWidth;
      containerElement.style.setProperty('--masonry-column-width', `${colWidth}px`);

      // Ensure container height is set correctly
      const finalHeight = Math.max(this.containerHeight, 0);
      containerElement.style.height = `${finalHeight}px`;
      containerElement.style.position = 'relative';
      containerElement.style.minHeight = '0';
      containerElement.style.maxHeight = 'none';
    }

    // Mark for check without triggering full layout recalculation
    // This prevents blinking by avoiding isLayoutReady reset
    this.cdr.markForCheck();
  }

  /**
   * Gets the preferred column count for a section.
   * Checks: section layout preferences (dynamic) → section.preferredColumns → meta.preferredColumns → type-based default
   */
  private getPreferredColumns(section: CardSection): PreferredColumns {
    // NEW: Try to get dynamic layout preferences from service first
    const layoutPrefs = this.layoutPreferenceService.getPreferences(section, this.currentColumns);
    if (layoutPrefs) {
      return layoutPrefs.preferredColumns;
    }

    // Direct property takes precedence
    if (section.preferredColumns) {
      return section.preferredColumns;
    }

    // Check meta
    const meta = section.meta as Record<string, unknown> | undefined;
    const metaPref = meta?.['preferredColumns'] as PreferredColumns | undefined;
    if (metaPref) {
      return metaPref;
    }

    // Fall back to type-based default
    return getPreferredColumns(section.type ?? 'info', undefined, undefined, this.currentColumns);
  }

  /**
   * Get layout preferences for a section (including canShrinkToFill flag)
   */
  private getSectionLayoutPreferences(section: CardSection): {
    preferredColumns: PreferredColumns;
    minColumns: number;
    maxColumns: number;
    canShrinkToFill: boolean;
    shrinkPriority: number;
  } {
    // Try to get from service first
    const layoutPrefs = this.layoutPreferenceService.getPreferences(section, this.currentColumns);
    if (layoutPrefs) {
      return {
        preferredColumns: layoutPrefs.preferredColumns,
        minColumns: layoutPrefs.minColumns,
        maxColumns: layoutPrefs.maxColumns,
        canShrinkToFill: layoutPrefs.canShrinkToFill,
        shrinkPriority: layoutPrefs.shrinkPriority ?? 50,
      };
    }

    // Fallback to static preferences
    const preferredColumns = this.getPreferredColumns(section);
    return {
      preferredColumns,
      minColumns: section.minColumns ?? 1,
      maxColumns: section.maxColumns ?? 4,
      canShrinkToFill: false, // Default: don't shrink unless explicitly enabled
      shrinkPriority: 50,
    };
  }

  /**
   * Finds the optimal column assignment for a section.
   * This implements the column negotiation algorithm with gap prediction:
   * 1. Find the shortest column(s) that can fit the requested span
   * 2. If preferred span doesn't fit, try smaller spans (graceful degradation)
   * 3. Predict if placement would create unfillable gaps based on pending sections
   * 4. Expand to fill orphan space only if type-aware limits allow and content density is sufficient
   *
   * @param colHeights - Array of current column heights
   * @param preferredSpan - The section's preferred column span
   * @param columns - Total available columns
   * @param containerWidth - Current container width
   * @param pendingSections - Optional array of sections still to be placed (for gap prediction)
   * @param sectionInfo - Optional section information for type-aware expansion
   * @returns Column assignment with columnIndex, colSpan, expansion flag, and reason
   */
  private findOptimalColumnAssignment(
    colHeights: number[],
    preferredSpan: number,
    columns: number,
    containerWidth: number,
    pendingSections?: PositionedSection[],
    sectionInfo?: SectionExpansionInfo
  ): ColumnAssignment {
    // Ensure span doesn't exceed available columns
    let targetSpan = Math.min(preferredSpan, columns);

    // Graceful degradation: if preferred span doesn't fit anywhere,
    // try smaller spans until we find one that works
    while (targetSpan > 1) {
      const canFit = this.canFitSpan(colHeights, targetSpan, columns);
      if (canFit >= 0) {
        break;
      }
      targetSpan--;
    }

    // Find the best column position for the target span
    // Now considers gap prediction to avoid creating unfillable gaps
    let bestColumn = 0;
    let minHeight = Number.MAX_VALUE;
    let bestGapScore = Number.MAX_VALUE;

    for (let col = 0; col <= columns - targetSpan; col++) {
      // Find the maximum height across the columns this span would occupy
      let maxColHeight = 0;
      for (let c = col; c < col + targetSpan; c++) {
        const colHeight = colHeights[c] ?? 0;
        if (colHeight > maxColHeight) {
          maxColHeight = colHeight;
        }
      }

      // Calculate gap score: how much unfillable space would this placement create?
      const gapScore = this.calculateGapScore(
        colHeights,
        col,
        targetSpan,
        columns,
        pendingSections
      );

      // Prefer positions that minimize both height and gap creation
      // Use weighted scoring: height is primary, gap score is secondary
      // Increased gap penalty from 50 to 150 for more aggressive gap avoidance
      const _weightedScore = maxColHeight + gapScore * 150; // Reserved for future use

      if (maxColHeight < minHeight || (maxColHeight === minHeight && gapScore < bestGapScore)) {
        minHeight = maxColHeight;
        bestColumn = col;
        bestGapScore = gapScore;
      }
    }

    // Check if we should expand to fill orphan space
    const remainingCols = columns - bestColumn - targetSpan;

    // Determine if any pending section can fit in the remaining space
    const canPendingFit = this.canAnyPendingSectionFit(remainingCols, pendingSections);

    // Use the new type-aware expansion decision function
    const expansionResult = shouldExpandSection(sectionInfo ?? { type: 'default' }, {
      currentSpan: targetSpan,
      remainingColumns: remainingCols,
      totalColumns: columns,
      containerWidth,
      minColumnWidth: this.minColumnWidth,
      gap: this.gap,
      canPendingFit,
    });

    return {
      columnIndex: bestColumn,
      colSpan: expansionResult.finalSpan,
      expanded: expansionResult.shouldExpand,
      expansionReason: expansionResult.reason,
    };
  }

  /**
   * Calculates a gap score for a potential placement.
   * Higher score = more unfillable gaps would be created.
   *
   * @param colHeights - Current column heights
   * @param startCol - Starting column for placement
   * @param span - Column span of the section
   * @param columns - Total columns
   * @param pendingSections - Sections still to be placed
   * @returns Gap score (0 = no gaps, higher = worse)
   */
  private calculateGapScore(
    colHeights: number[],
    startCol: number,
    span: number,
    columns: number,
    pendingSections?: PositionedSection[]
  ): number {
    if (!pendingSections || pendingSections.length === 0) {
      return 0;
    }

    // Simulate placing the section and calculate resulting column heights
    const simulatedHeights = [...colHeights];
    const placementHeight = Math.max(...colHeights.slice(startCol, startCol + span));
    const estimatedSectionHeight = 200; // Conservative estimate

    for (let c = startCol; c < startCol + span; c++) {
      simulatedHeights[c] = placementHeight + estimatedSectionHeight + this.gap;
    }

    // Calculate height variance - lower variance = better balanced = fewer gaps
    const avgHeight = simulatedHeights.reduce((a, b) => a + b, 0) / columns;
    const variance =
      simulatedHeights.reduce((acc, h) => acc + Math.pow(h - avgHeight, 2), 0) / columns;

    // Check if remaining columns on the row could fit any pending section
    const remainingAfter = columns - startCol - span;
    const remainingBefore = startCol;

    // Find minimum colSpan among pending sections
    const minPendingSpan =
      pendingSections.length > 0 ? Math.min(...pendingSections.map((s) => s.colSpan)) : 1;

    // Penalty for creating orphan columns that can't fit any pending section
    let orphanPenalty = 0;
    if (remainingAfter > 0 && remainingAfter < minPendingSpan) {
      orphanPenalty += remainingAfter; // Each orphan column adds to penalty
    }
    if (remainingBefore > 0 && remainingBefore < minPendingSpan) {
      orphanPenalty += remainingBefore;
    }

    return Math.sqrt(variance) / 100 + orphanPenalty;
  }

  /**
   * Checks if any pending section can fit in the given number of columns.
   */
  private canAnyPendingSectionFit(
    availableColumns: number,
    pendingSections?: PositionedSection[]
  ): boolean {
    if (!pendingSections || pendingSections.length === 0 || availableColumns <= 0) {
      return false;
    }

    // Check if any pending section has colSpan <= available columns
    return pendingSections.some((s) => s.colSpan <= availableColumns);
  }

  /**
   * Column Span Optimization (Phase 2)
   *
   * For tall multi-column sections, evaluates if narrowing the span would
   * reduce total container height. A 2-column section that's 400px tall
   * commits 800px of "area". If it were 1 column, the other column could
   * be used more efficiently.
   *
   * Algorithm:
   * 1. Identify tall multi-column sections (height > average * threshold)
   * 2. For each candidate, simulate layout with current span vs narrower span
   * 3. If narrower span results in lower total height, adjust the span
   *
   * @param sections - Sections with height information
   * @param sectionHeights - Map of section keys to actual heights
   * @param columns - Number of columns
   * @returns Sections with optimized column spans
   */
  private optimizeColumnSpans(
    sections: PositionedSection[],
    sectionHeights: Map<string, number>,
    columns: number
  ): PositionedSection[] {
    if (sections.length < 2 || columns < 2) {
      return sections;
    }

    // Calculate average height
    let totalHeight = 0;
    let count = 0;
    for (const height of sectionHeights.values()) {
      totalHeight += height;
      count++;
    }
    const avgHeight = count > 0 ? totalHeight / count : 200;

    // Threshold: sections 50% taller than average are candidates for span reduction
    const tallThreshold = avgHeight * 1.5;

    // Find multi-column sections that are tall candidates
    const candidates = sections.filter((s) => {
      const height = sectionHeights.get(s.key) ?? 200;
      return s.colSpan > 1 && s.preferredColumns > 1 && height > tallThreshold;
    });

    if (candidates.length === 0) {
      return sections;
    }

    // Clone sections for modification
    const optimized = sections.map((s) => ({ ...s }));

    for (const candidate of candidates) {
      const idx = optimized.findIndex((s) => s.key === candidate.key);
      if (idx < 0) continue;

      const section = optimized[idx];
      if (!section) continue;

      const currentSpan = section.colSpan;
      const _height = sectionHeights.get(section.key) ?? 200; // Reserved for future use

      // Only try reducing by 1 (don't go from 3 to 1 directly)
      const narrowerSpan = Math.max(1, currentSpan - 1);

      if (narrowerSpan === currentSpan) continue;

      // Simulate both layouts and compare total heights
      const currentLayoutHeight = this.simulateLayoutHeight(optimized, sectionHeights, columns);

      // Temporarily modify span
      section.colSpan = narrowerSpan;

      const narrowerLayoutHeight = this.simulateLayoutHeight(optimized, sectionHeights, columns);

      // Keep narrower span only if it reduces total height
      if (narrowerLayoutHeight < currentLayoutHeight) {
        // Keep the narrower span
        // Also update preferred columns to prevent re-expansion
        section.preferredColumns = narrowerSpan as PreferredColumns;
      } else {
        // Revert to original span
        section.colSpan = currentSpan;
      }
    }

    return optimized;
  }

  /**
   * Simulates layout and returns the total container height.
   * Used for comparing different layout configurations.
   */
  private simulateLayoutHeight(
    sections: PositionedSection[],
    sectionHeights: Map<string, number>,
    columns: number
  ): number {
    const colHeights = Array(columns).fill(0);

    // Sort by height descending (same as real layout)
    const sorted = [...sections].sort((a, b) => {
      const heightA = sectionHeights.get(a.key) ?? 200;
      const heightB = sectionHeights.get(b.key) ?? 200;
      return heightB - heightA;
    });

    for (const section of sorted) {
      const height = sectionHeights.get(section.key) ?? 200;
      const span = Math.min(section.colSpan, columns);

      // Find shortest position for this span
      let bestColumn = 0;
      let minColHeight = Number.MAX_VALUE;

      for (let col = 0; col <= columns - span; col++) {
        let maxHeight = 0;
        for (let c = col; c < col + span; c++) {
          if ((colHeights[c] ?? 0) > maxHeight) {
            maxHeight = colHeights[c] ?? 0;
          }
        }
        if (maxHeight < minColHeight) {
          minColHeight = maxHeight;
          bestColumn = col;
        }
      }

      // Update column heights
      const newHeight = minColHeight + height + this.gap;
      for (let c = bestColumn; c < bestColumn + span; c++) {
        colHeights[c] = newHeight;
      }
    }

    return Math.max(...colHeights, 0);
  }

  /**
   * Local Swap Optimization (Phase 4)
   *
   * After initial placement, tries swapping pairs of sections to find
   * improvements in total container height. Uses a limited search to
   * avoid O(n²) complexity on large layouts.
   *
   * Algorithm:
   * 1. Group sections by their "row band" (similar top positions)
   * 2. For each pair of sections in the same band with different spans
   * 3. Simulate swapping their column spans
   * 4. Keep the swap if it reduces total height
   *
   * @param placedSections - Already positioned sections
   * @param sectionHeights - Map of section keys to actual heights
   * @param columns - Number of columns
   * @param containerWidth - Container width
   * @returns Sections with potentially swapped positions
   */
  private localSwapOptimization(
    placedSections: PositionedSection[],
    sectionHeights: Map<string, number>,
    columns: number,
    _containerWidth: number
  ): PositionedSection[] {
    if (placedSections.length < 2 || columns < 2) {
      return placedSections;
    }

    // Clone for modification
    let result = placedSections.map((s) => ({ ...s }));
    const currentHeight = this.calculateTotalHeight(result, sectionHeights);

    // Limit iterations to avoid performance issues
    const maxIterations = Math.min(placedSections.length * 2, 20);
    let iterations = 0;
    let improved = true;

    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;

      // Try swapping pairs of sections with different colSpans
      for (let i = 0; i < result.length - 1 && !improved; i++) {
        for (let j = i + 1; j < result.length && !improved; j++) {
          const sectionA = result[i];
          const sectionB = result[j];

          if (!sectionA || !sectionB) continue;

          // Only consider swapping sections with different spans
          // that are in a similar "row band" (within 100px of each other)
          const topDiff = Math.abs(sectionA.top - sectionB.top);
          if (topDiff > 150) continue; // Not in same band

          // Skip if same span - no benefit
          if (sectionA.colSpan === sectionB.colSpan) continue;

          // Skip if swap would violate preferred columns constraints
          const _heightA = sectionHeights.get(sectionA.key) ?? 200; // Reserved for future constraint checking
          const _heightB = sectionHeights.get(sectionB.key) ?? 200; // Reserved for future constraint checking

          // Try swapping their positions (and thus, effectively their placements)
          const swapped = this.trySwapSections(result, i, j, sectionHeights, columns);

          const swappedHeight = this.calculateTotalHeight(swapped, sectionHeights);

          // Keep swap if it improves height by at least a small margin
          if (swappedHeight < currentHeight - 5) {
            result = swapped;
            improved = true;
          }
        }
      }
    }

    return result;
  }

  /**
   * Tries swapping two sections and re-calculates positions.
   */
  private trySwapSections(
    sections: PositionedSection[],
    indexA: number,
    indexB: number,
    sectionHeights: Map<string, number>,
    columns: number
  ): PositionedSection[] {
    const swapped = sections.map((s) => ({ ...s }));

    // Swap the sections in the array (which affects their placement order)
    const temp = swapped[indexA];
    swapped[indexA] = swapped[indexB]!;
    swapped[indexB] = temp!;

    // Re-calculate positions with swapped order
    return this.recalculatePositions(swapped, sectionHeights, columns);
  }

  /**
   * Recalculates section positions using weighted column selection + section intelligence.
   * NEW: Uses advanced algorithms for better space utilization and gap elimination.
   */
  /**
   * Recalculates section positions using actual measured heights.
   * Uses the master engine for intelligent placement.
   */
  private recalculatePositions(
    sections: PositionedSection[],
    sectionHeights: Map<string, number>,
    columns: number
  ): PositionedSection[] {
    // Use master engine to recalculate with actual heights
    const containerWidth = this.getContainerWidth();
    const cardSections = sections.map((s) => s.section);

    try {
      const layout = this.masterEngine.calculateLayout(cardSections, containerWidth, columns);

      // Convert back to PositionedSection format, preserving animation state
      return layout.sections.map((placed) => {
        const original = sections.find((s) => s.key === placed.key);
        return {
          section: placed.section,
          key: placed.key,
          colSpan: placed.colSpan,
          preferredColumns: placed.colSpan as PreferredColumns,
          left: placed.left,
          top: placed.top,
          width: placed.width,
          isNew: original?.isNew,
          hasAnimated: original?.hasAnimated,
        };
      });
    } catch (error) {
      console.warn('[MasonryGrid] Recalculation failed, keeping current positions:', error);
      return sections;
    }
  }

  /**
   * Calculates total container height from placed sections.
   */
  private calculateTotalHeight(
    sections: PositionedSection[],
    sectionHeights: Map<string, number>
  ): number {
    let maxBottom = 0;
    for (const section of sections) {
      const height = sectionHeights.get(section.key) ?? 200;
      const bottom = section.top + height;
      if (bottom > maxBottom) {
        maxBottom = bottom;
      }
    }
    return maxBottom;
  }

  /**
   * Post-layout gap optimization.
   * Uses master engine for intelligent gap elimination.
   *
   * @param sections - Currently positioned sections
   * @param columns - Number of columns
   * @param containerWidth - Container width in pixels
   * @param itemRefs - DOM element references for actual heights
   * @returns Optimized section array (same reference if no changes made)
   */
  private optimizeLayoutGaps(
    sections: PositionedSection[],
    columns: number,
    containerWidth: number,
    itemRefs: ElementRef<HTMLDivElement>[]
  ): PositionedSection[] {
    if (sections.length < 2 || columns < 2) {
      return sections; // No optimization possible
    }

    // Get actual heights for all sections
    const sectionHeights = new Map<string, number>();
    sections.forEach((section, index) => {
      const height = itemRefs[index]?.nativeElement?.offsetHeight ?? 200;
      sectionHeights.set(section.key, height);
    });

    try {
      // Use master engine for gap optimization
      const layout = this.masterEngine.calculateLayout(
        sections.map((s) => s.section),
        containerWidth,
        columns
      );

      if (this._debug) {
        console.log('[MasonryGrid] Gap Optimization Results:', {
          totalHeight: layout.totalHeight,
          gapCount: layout.gapCount,
          utilization: `${layout.utilization.toFixed(1)}%`,
          optimizations: layout.optimizations,
        });
      }

      // Convert back to PositionedSection format, preserving animation state
      const optimized = layout.sections.map((placed) => {
        const original = sections.find((s) => s.key === placed.key);
        return {
          section: placed.section,
          key: placed.key,
          colSpan: placed.colSpan,
          preferredColumns: placed.colSpan as PreferredColumns,
          left: placed.left,
          top: placed.top,
          width: placed.width,
          isNew: original?.isNew,
          hasAnimated: original?.hasAnimated,
        };
      });

      return optimized;
    } catch (error) {
      console.warn('[MasonryGrid] Gap optimization failed, using fallback:', error);
      // Fallback to original sections if optimization fails
    }

    // FALLBACK: Original gap optimization
    // Build sections with height info for gap analysis
    const sectionsWithHeight = sections.map((s) => ({
      ...s,
      height: sectionHeights.get(s.key) ?? 200,
    }));

    // Find gaps in current layout
    const gaps = this.findLayoutGaps(sectionsWithHeight, columns);

    if (gaps.length === 0) {
      return sections; // No gaps to fill
    }

    // Find candidate sections that could fill gaps
    // Prefer single-column, low-priority sections for repositioning
    const movableSections = sections
      .map((s, idx) => ({ section: s, index: idx, height: sectionHeights.get(s.key) ?? 200 }))
      .filter(({ section }) => section.colSpan === 1 && section.preferredColumns === 1)
      .sort((a, b) => b.section.top - a.section.top); // Start from bottom sections

    if (movableSections.length === 0) {
      return sections; // No movable sections
    }

    // Try to fill gaps with movable sections
    const result = [...sections];
    let madeChanges = false;

    for (const gap of gaps) {
      // Find a section that fits in this gap
      const candidate = movableSections.find(
        ({ section, height }) => section.colSpan <= gap.width && height <= gap.height + 20 // Allow small tolerance
      );

      if (candidate) {
        // Move section to fill the gap
        const targetIndex = result.findIndex((s) => s.key === candidate.section.key);
        const targetSection = result[targetIndex];
        if (targetIndex >= 0 && targetSection) {
          const movedSection: PositionedSection = {
            section: targetSection.section,
            key: targetSection.key,
            colSpan: targetSection.colSpan,
            preferredColumns: targetSection.preferredColumns,
            isNew: targetSection.isNew,
            left: generateLeftExpression(columns, gap.column, this.gap),
            top: gap.top,
            width: generateWidthExpression(columns, candidate.section.colSpan, this.gap),
          };
          result[targetIndex] = movedSection;
          madeChanges = true;

          // Remove from movable list to avoid reusing
          const movableIdx = movableSections.findIndex(
            (m) => m.section.key === candidate.section.key
          );
          if (movableIdx >= 0) {
            movableSections.splice(movableIdx, 1);
          }
        }
      }
    }

    return madeChanges ? result : sections;
  }

  /**
   * Finds gaps in the current layout where sections could be placed.
   * Uses a grid-based approach to identify empty spaces.
   *
   * @param sections - Sections with height information
   * @param columns - Number of columns
   * @returns Array of gaps with position and size
   */
  private findLayoutGaps(
    sections: Array<PositionedSection & { height: number }>,
    columns: number
  ): Array<{ column: number; top: number; height: number; width: number }> {
    const gaps: Array<{ column: number; top: number; height: number; width: number }> = [];

    if (sections.length === 0) {
      return gaps;
    }

    // Calculate container height from sections
    const containerHeight = Math.max(...sections.map((s) => s.top + s.height), 0);

    if (containerHeight === 0) {
      return gaps;
    }

    // Build occupancy grid with 10px resolution
    const gridResolution = 10;
    const rows = Math.ceil(containerHeight / gridResolution);
    const grid: boolean[][] = Array.from({ length: rows }, () => new Array(columns).fill(false));

    // Parse column index from CSS calc expression
    const parseColumnIndex = (left: string): number => {
      // Handle "0px" case
      if (left === '0px') return 0;

      // Try to extract column index from calc expression pattern
      // Pattern: calc((calc((100% - Xpx) / N) + Ypx) * INDEX)
      const indexMatch = left.match(/\*\s*(\d+)\s*\)/);
      if (indexMatch && indexMatch[1]) {
        return parseInt(indexMatch[1], 10);
      }

      return 0;
    };

    // Mark occupied cells
    for (const section of sections) {
      const startRow = Math.floor(section.top / gridResolution);
      const endRow = Math.min(Math.ceil((section.top + section.height) / gridResolution), rows);
      const startCol = parseColumnIndex(section.left);
      const endCol = Math.min(startCol + section.colSpan, columns);

      for (let r = startRow; r < endRow; r++) {
        const row = grid[r];
        if (row) {
          for (let c = startCol; c < endCol; c++) {
            row[c] = true;
          }
        }
      }
    }

    // Find contiguous unoccupied regions (gaps)
    const minGapHeight = 100; // Only consider gaps that can fit small sections

    for (let c = 0; c < columns; c++) {
      let gapStart: number | null = null;

      for (let r = 0; r < rows; r++) {
        const isOccupied = grid[r]?.[c] ?? false;

        if (!isOccupied && gapStart === null) {
          gapStart = r;
        } else if (isOccupied && gapStart !== null) {
          const gapHeight = (r - gapStart) * gridResolution;
          if (gapHeight >= minGapHeight) {
            gaps.push({
              column: c,
              top: gapStart * gridResolution,
              height: gapHeight,
              width: 1, // Single column gap
            });
          }
          gapStart = null;
        }
      }

      // Don't count gaps at the bottom as they're not "internal" gaps
    }

    // Sort gaps by area (largest first) to prioritize filling bigger gaps
    gaps.sort((a, b) => b.height * b.width - a.height * a.width);

    return gaps;
  }

  /**
   * Checks if a span can fit starting at any column.
   * Returns the first column index where it can fit, or -1 if it can't.
   */
  private canFitSpan(colHeights: number[], span: number, columns: number): number {
    for (let col = 0; col <= columns - span; col++) {
      // A span fits if all columns in the range exist
      let canFit = true;
      for (let c = col; c < col + span; c++) {
        if (c >= colHeights.length) {
          canFit = false;
          break;
        }
      }
      if (canFit) {
        return col;
      }
    }
    return -1;
  }

  /**
   * Reflow is no longer needed - CSS Grid handles heights automatically
   * This method is kept for backwards compatibility but does nothing
   */
  private reflowWithActualHeights(): void {
    // CSS Grid handles heights automatically - no JavaScript needed
    // This method is a no-op to prevent breaking existing code
  }

  private emitLayoutInfo(columns: number, containerWidth: number): void {
    const layoutInfo: MasonryLayoutInfo = {
      columns,
      containerWidth,
      breakpoint: getBreakpointFromWidth(containerWidth),
    };
    if (this.isSameLayoutInfo(layoutInfo, this.lastLayoutInfo)) {
      return;
    }
    this.lastLayoutInfo = layoutInfo;
    this.layoutChange.emit(layoutInfo);
  }

  private isSameLayoutInfo(a: MasonryLayoutInfo, b?: MasonryLayoutInfo): boolean {
    if (!b) {
      return false;
    }
    return (
      a.breakpoint === b.breakpoint &&
      a.columns === b.columns &&
      Math.abs(a.containerWidth - b.containerWidth) < 4
    );
  }

  /**
   * Emits detailed layout log entry for debugging and monitoring
   * @param event - Type of layout event
   * @param columns - Current column count
   * @param containerWidth - Current container width
   * @param positionedSections - Array of positioned sections
   * @param previousColumns - Previous column count (for columns_changed event)
   */
  private emitLayoutLog(
    event: LayoutLogEntry['event'],
    columns: number,
    containerWidth: number,
    positionedSections: PositionedSection[],
    previousColumns?: number
  ): void {
    const entry: LayoutLogEntry = {
      timestamp: Date.now(),
      event,
      containerWidth,
      columns,
      previousColumns,
      sections: positionedSections.map((ps) => ({
        id: ps.section.id || ps.key,
        type: ps.section.type || 'unknown',
        title: ps.section.title || '',
        preferredColumns: ps.preferredColumns,
        actualColSpan: ps.colSpan,
        expanded: ps.colSpan > ps.preferredColumns,
        position: { left: ps.left, top: ps.top },
        width: ps.width,
      })),
    };

    // Console logging only when debug mode is enabled
    if (this._debug) {
      const eventEmoji =
        event === 'columns_changed' ? '📊' : event === 'section_expanded' ? '📐' : '📍';
      console.group(`${eventEmoji} [MasonryGrid] ${event.toUpperCase()}`);
      console.log(
        `Container: ${containerWidth}px | Columns: ${columns}${previousColumns ? ` (was ${previousColumns})` : ''}`
      );
      console.table(
        entry.sections.map((s) => ({
          title: s.title,
          type: s.type,
          preferred: s.preferredColumns,
          actual: s.actualColSpan,
          expanded: s.expanded ? '✓' : '',
          left: s.position.left,
          width: s.width,
        }))
      );
      console.groupEnd();
    }

    this.layoutLog.emit(entry);
  }

  /**
   * Determines the column span for a section.
   * Priority order:
   * 1. Explicit colSpan (hard override)
   * 2. preferredColumns (adaptive hint)
   * 3. Type-based defaults
   */
  private getSectionColSpan(section: CardSection): number {
    // Priority 1: Explicit colSpan always takes precedence (hard override)
    if (section.colSpan && section.colSpan > 0) {
      return Math.min(section.colSpan, this.currentColumns || this.maxColumns);
    }

    // Priority 2: Use preferredColumns if available
    const preferredCols = this.getPreferredColumns(section);
    if (preferredCols > 0) {
      return Math.min(preferredCols, this.currentColumns || this.maxColumns);
    }

    // Priority 3: Default to 1 column
    return 1;
  }

  /**
   * Get column span thresholds for a section
   * First checks section's meta (set during normalization), then falls back to default
   */
  /** @internal Reserved for future use */
  private _getColSpanThresholds(section: CardSection): ColSpanThresholds {
    const meta = section.meta as Record<string, unknown> | undefined;
    const thresholds = meta?.['colSpanThresholds'] as ColSpanThresholds | undefined;

    if (thresholds && typeof thresholds === 'object' && 'two' in thresholds) {
      return thresholds;
    }

    // Fallback to default if not found in meta
    return DEFAULT_COL_SPAN_THRESHOLD;
  }

  /** @internal Reserved for future use */
  private _getDescriptionDensity(description?: string): number {
    if (!description) {
      return 0;
    }

    const trimmedLength = description.trim().length;
    if (trimmedLength < 120) {
      return 0;
    }

    return Math.ceil(trimmedLength / 120);
  }

  /**
   * Detects if we're receiving a completely new card (not an update to existing card).
   * A new card is detected when:
   * 1. Previous sections were empty/undefined
   * 2. Section IDs are completely different (no overlap)
   * 3. Card title changed significantly (handled at parent level)
   */
  private detectNewCard(
    previousSections: CardSection[] | undefined,
    currentSections: CardSection[] | undefined
  ): boolean {
    // CRITICAL: During active streaming, NEVER treat as new card
    // This prevents clearing renderedSectionKeys which causes all sections to re-animate
    if (this.isStreaming && previousSections && previousSections.length > 0) {
      return false;
    }

    // No previous sections = new card
    if (!previousSections || previousSections.length === 0) {
      return true;
    }

    // No current sections = clearing card
    if (!currentSections || currentSections.length === 0) {
      return true;
    }

    // Check if any current section ID exists in previous sections
    const previousIds = new Set<string>();
    for (const section of previousSections) {
      if (section.id) {
        previousIds.add(section.id);
      }
    }

    // If no previous IDs, use title-based comparison
    if (previousIds.size === 0) {
      // Use title comparison as fallback
      const previousTitles = new Set(previousSections.map((s) => s.title || '').filter((t) => t));
      const hasOverlap = currentSections.some((s) => s.title && previousTitles.has(s.title));
      return !hasOverlap;
    }

    // Check for ID overlap - if ANY current section has an ID from previous, it's the same card
    for (const section of currentSections) {
      if (section.id && previousIds.has(section.id)) {
        return false; // Same card - found overlap
      }
    }

    return true; // No overlap = new card
  }

  /**
   * Updates the previousSectionIds set with current section IDs.
   */
  private updatePreviousSectionIds(sections: CardSection[] | undefined): void {
    this.previousSectionIds.clear();
    if (!sections) return;

    for (const section of sections) {
      if (section.id) {
        this.previousSectionIds.add(section.id);
      }
    }
  }

  /**
   * Checks if a section is truly new (not seen before in this streaming session).
   * Uses section.id as primary identifier, falls back to generated key.
   */
  private isTrulyNewSection(section: CardSection, generatedKey: string): boolean {
    // Check by section.id first (most stable)
    if (section.id && this.renderedSectionKeys.has(section.id)) {
      return false;
    }

    // Check by generated key as fallback
    if (this.renderedSectionKeys.has(generatedKey)) {
      return false;
    }

    return true;
  }

  /**
   * Marks a section as rendered (won't animate again).
   */
  private markSectionRendered(section: CardSection, generatedKey: string): void {
    // Add both section.id and generated key to ensure no re-animation
    if (section.id) {
      this.renderedSectionKeys.add(section.id);
    }
    this.renderedSectionKeys.add(generatedKey);
  }

  // ==========================================================================
  // ADAPTIVE HEIGHT LEARNING (Points 6-10)
  // ==========================================================================

  /**
   * Records measured heights to the HeightEstimator for adaptive learning.
   * This creates a feedback loop where the estimator learns from actual
   * measurements to improve future estimates.
   *
   * @param containerWidth - Current container width for context
   * @param columns - Current column count
   */
  private recordHeightsForLearning(containerWidth: number, columns: number): void {
    const itemRefArray = this.itemRefs?.toArray() ?? [];
    if (itemRefArray.length === 0) {
      return;
    }

    // Build estimation context for accurate learning
    const context: HeightEstimationContext = {
      containerWidth,
      totalColumns: columns,
    };

    // Record each section's actual vs estimated height
    for (let i = 0; i < this.positionedSections.length; i++) {
      const item = this.positionedSections[i];
      if (!item) continue;

      const itemElement = itemRefArray[i]?.nativeElement;
      let actualHeight = itemElement?.offsetHeight ?? 0;

      // Skip if we couldn't measure
      if (actualHeight <= 0) {
        continue;
      }

      // Get first child height if element has wrapper
      if (actualHeight === 0 && itemElement?.firstElementChild) {
        actualHeight = (itemElement.firstElementChild as HTMLElement).offsetHeight ?? 0;
      }

      if (actualHeight <= 0) {
        continue;
      }

      // Calculate what was estimated for this section
      const sectionContext = {
        ...context,
        colSpan: item.colSpan,
      };
      const estimated = estimateSectionHeight(item.section, sectionContext);

      // Generate content hash for deduplication
      const contentHash = HeightEstimator.generateContentHash(item.section);

      // Record the measurement for learning
      recordHeightMeasurement(item.section.type ?? 'default', estimated, actualHeight, contentHash);
    }
  }

  /**
   * Section type defaults for content orientation
   * Determines whether items within a section flow horizontally or vertically
   */
  private readonly SECTION_ORIENTATION_DEFAULTS: Record<
    string,
    'vertical' | 'horizontal' | 'auto'
  > = {
    'contact-card': 'horizontal', // Contact cards look good side-by-side
    'network-card': 'horizontal', // Network cards similar to contacts
    overview: 'vertical', // Key-value pairs stack well
    analytics: 'horizontal', // Metrics often display horizontally
    stats: 'horizontal', // Stats similar to analytics
    financials: 'horizontal', // Financial metrics horizontally
    list: 'vertical', // Lists are naturally vertical
    event: 'vertical', // Timeline flows vertically
    timeline: 'vertical', // Timeline flows vertically
    chart: 'auto', // Depends on chart type and size
    map: 'auto', // Maps can be either
    product: 'auto', // Products can be either based on count
    solutions: 'vertical', // Solutions usually list vertically
    info: 'vertical', // Info sections stack key-value pairs
    quotation: 'vertical', // Quotes stack naturally
    'text-reference': 'vertical', // Text references vertical
    project: 'vertical', // Projects vertical
  };

  /**
   * Get the effective orientation for a section
   * Uses section's explicit orientation, falls back to type defaults, then 'auto'
   *
   * @param section - The section to get orientation for
   * @returns The orientation to apply: 'vertical', 'horizontal', or 'auto'
   */
  getOrientation(section: CardSection | null | undefined): 'vertical' | 'horizontal' | 'auto' {
    if (!section) {
      return 'vertical';
    }

    // 1. Use explicit orientation if set
    if (section.orientation) {
      return section.orientation;
    }

    // 2. Use type-based default
    const type = section.type?.toLowerCase() ?? '';
    const defaultOrientation = this.SECTION_ORIENTATION_DEFAULTS[type];
    if (defaultOrientation) {
      return defaultOrientation;
    }

    // 3. Auto-detect based on content shape
    return this.detectOptimalOrientation(section);
  }

  /**
   * Auto-detect optimal orientation based on section content
   * Uses heuristics to determine if horizontal or vertical layout is better
   */
  private detectOptimalOrientation(section: CardSection): 'vertical' | 'horizontal' | 'auto' {
    const itemCount = section.items?.length ?? 0;
    const fieldCount = section.fields?.length ?? 0;
    const totalItems = itemCount + fieldCount;

    // Few items with wide content -> horizontal
    if (totalItems <= 4 && totalItems > 0) {
      // Check if items have short values (metrics-like)
      const hasShortValues =
        section.fields?.every((f) => {
          const valueLength = String(f.value ?? '').length;
          return valueLength < 20;
        }) ?? true;

      if (hasShortValues && fieldCount > 0) {
        return 'horizontal';
      }
    }

    // Many items or long content -> vertical
    if (totalItems > 6) {
      return 'vertical';
    }

    // Default to auto for container query handling
    return 'auto';
  }
}
