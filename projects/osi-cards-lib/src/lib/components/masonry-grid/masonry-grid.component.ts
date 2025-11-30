import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, QueryList, SimpleChanges, ViewChild, ViewChildren, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardSection } from '../../models';
import { SectionRendererComponent, SectionRenderEvent } from '../section-renderer/section-renderer.component';
import { Breakpoint, getBreakpointFromWidth } from '../../utils/responsive.util';
import { 
  MIN_COLUMN_WIDTH, 
  MAX_COLUMNS, 
  GRID_GAP,
  calculateColumns,
  generateWidthExpression,
  generateLeftExpression,
  getPreferredColumns,
  resolveColumnSpan,
  DEFAULT_SECTION_COLUMN_PREFERENCES,
  PreferredColumns,
  PackingAlgorithm,
  MasonryPackingConfig,
  DEFAULT_MASONRY_PACKING_CONFIG,
  RowPackingOptions,
  DEFAULT_ROW_PACKING_OPTIONS
} from '../../utils/grid-config.util';
import { 
  calculateOptimalColumns,
  estimateSectionHeight,
  calculatePriorityScore,
  gridLogger,
  enableGridDebug,
  binPack2D,
  SectionWithMetrics,
  findGaps,
  fillGapsWithSections
} from '../../utils/smart-grid.util';
import {
  packSectionsIntoRows,
  packingResultToPositions,
  RowPackerConfig
} from '../../utils/row-packer.util';

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
  isNew?: boolean;  // Whether this section should animate (newly added during streaming)
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
  previousColumns?: number;
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
  encapsulation: ViewEncapsulation.None // Inherits styles from parent's Shadow DOM
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
   * Enable tetris-style layout optimization.
   * When true, uses bin-packing algorithm to minimize gaps and maximize space utilization.
   * Disable for streaming mode if section repositioning is disruptive.
   */
  @Input() optimizeLayout = true;

  /**
   * Packing algorithm to use for section layout.
   * - 'legacy': Original masonry algorithm (FFDH-based) - default for backward compatibility
   * - 'row-first': New space-filling algorithm that prioritizes complete rows
   * - 'skyline': Skyline bin-packing algorithm
   */
  @Input() packingAlgorithm: PackingAlgorithm = 'legacy';

  /**
   * Options for the row-first packing algorithm.
   * Only used when packingAlgorithm is 'row-first'.
   */
  @Input() rowPackingOptions: RowPackingOptions = DEFAULT_ROW_PACKING_OPTIONS;

  /**
   * Whether to use the legacy algorithm as a fallback when the selected algorithm fails.
   */
  @Input() useLegacyFallback = true;

  /**
   * Enable debug logging for smart grid layout.
   * When true, logs detailed placement decisions to the console.
   */
  @Input() set debug(value: boolean) {
    this._debug = value;
    if (value) {
      enableGridDebug('debug');
      console.log('[MasonryGrid] Debug mode enabled - watch console for layout logs');
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
  
  /** Current layout state for debugging and parent components */
  layoutState: LayoutState = 'idle';
  
  /** Current column count (after calculation) */
  currentColumns = 1;

  private resizeObserver?: ResizeObserver;
  private itemObserver?: ResizeObserver;
  private pendingAnimationFrame?: number;
  private reflowCount = 0;
  private readonly MAX_REFLOWS = 5;
  private resizeThrottleTimeout?: number;
  private readonly RESIZE_THROTTLE_MS = 16; // ~1 frame at 60fps
  private readonly RESIZE_DEBOUNCE_MS = 100; // Debounce rapid resize events
  private lastLayoutInfo?: MasonryLayoutInfo;
  private rafId?: number;
  private initialLayoutRetries = 0;
  private readonly MAX_INITIAL_RETRIES = 5; // Reduced - rely more on ResizeObserver
  private initialLayoutTimeout?: number;
  
  // Track whether layout has been successfully calculated with valid width
  private hasValidLayout = false;
  private lastValidContainerWidth = 0;
  private layoutVerificationTimeout?: number;
  
  // Debounced resize handling
  private resizeDebounceTimeout?: number;
  private pendingResizeWidth = 0;
  
  // Simplified polling (reduced from 5s to 2s)
  private widthPollingInterval?: number;
  private widthPollingStartTime = 0;
  private readonly WIDTH_POLLING_DURATION_MS = 2000;
  private readonly WIDTH_POLLING_INTERVAL_MS = 50; // Faster polling
  
  // Track previous column count for logging column changes
  private previousColumnCount = 0;

  ngOnChanges(changes: SimpleChanges): void {
    // Track streaming state changes - but DON'T clear renderedSectionKeys on start
    // We only clear it when sections are completely replaced (new card)
    if (changes['isStreaming']) {
      const wasStreaming = this.previousStreamingState;
      const nowStreaming = this.isStreaming;
      
      // Streaming ended - DON'T clear the set yet, wait for new sections
      // This preserves animation state for sections that persist
      
      this.previousStreamingState = nowStreaming;
    }
    
    if (changes['sections']) {
      const previousSections = changes['sections'].previousValue as CardSection[] | undefined;
      const currentSections = changes['sections'].currentValue as CardSection[] | undefined;
      
      // Detect if this is a completely new card (different section IDs)
      const isNewCard = this.detectNewCard(previousSections, currentSections);
      
      if (isNewCard) {
        // New card - clear animation tracking to allow fresh animations
        this.renderedSectionKeys.clear();
        this.previousSectionIds.clear();
      }
      
      // Update previous section IDs for next comparison
      this.updatePreviousSectionIds(currentSections);
      
      this.computeInitialLayout();
      // Reset reflow count for section changes
      this.reflowCount = 0;
      // Schedule immediate layout update for section changes
      this.scheduleLayoutUpdate();
      // Also force initial layout if not ready
      if (!this.isLayoutReady && this.containerRef?.nativeElement) {
        this.forceInitialLayout();
      }
      this.cdr.markForCheck();
    }
    
    // Handle containerWidth changes - trigger immediate layout recalculation
    // IMPORTANT: Handle BOTH first change and subsequent changes
    if (changes['containerWidth']) {
      const newValue = changes['containerWidth'].currentValue;
      
      // Trigger recalculation if new width is valid
      if (newValue && newValue > 0) {
        this.reflowCount = 0;
        this.hasValidLayout = false; // Force recalculation
        // Use forceInitialLayout for comprehensive recalculation
        this.forceInitialLayout();
        this.cdr.markForCheck();
      }
    }
  }

  ngAfterViewInit(): void {
    this.computeInitialLayout();
    this.observeContainer();
    this.observeItems();
    
    // Force initial layout calculation with retry mechanism
    this.forceInitialLayout();
    
    // Schedule verification as a safety net for delayed width availability
    this.scheduleLayoutVerification();
  }

  /**
   * Forces initial layout calculation with retry mechanism.
   * This handles the case where container width is 0 on first render.
   */
  private forceInitialLayout(): void {
    this.initialLayoutRetries = 0;
    this.tryInitialLayout();
  }

  private tryInitialLayout(): void {
    if (this.initialLayoutRetries >= this.MAX_INITIAL_RETRIES) {
      // Give up after max retries, mark as visually ready for CSS but keep hasValidLayout false
      // This shows the content but allows ResizeObserver to trigger full layout later
      this.isLayoutReady = true;
      // hasValidLayout remains false - layout still needs recalculation when width becomes available
      this.cdr.markForCheck();
      // Schedule a verification check to catch delayed width availability
      this.scheduleLayoutVerification();
      return;
    }

    this.initialLayoutRetries++;

    // Check if container has a valid width
    const containerWidth = this.getContainerWidth();
    
    if (containerWidth > 0) {
      // Container has width, proceed with layout
      this.reflowCount = 0;
      requestAnimationFrame(() => {
        this.reflowWithActualHeights();
        requestAnimationFrame(() => {
          this.reflowWithActualHeights();
          // Additional reflow for safety
          requestAnimationFrame(() => {
            this.reflowWithActualHeights();
            this.isLayoutReady = true;
            // hasValidLayout is set in reflowWithActualHeights when successful
            this.cdr.markForCheck();
          });
        });
      });
    } else {
      // Container width is 0, retry after a short delay
      // Use increasing delays: 0, 16, 32, 48... ms
      const delay = Math.min(this.initialLayoutRetries * 16, 100);
      this.initialLayoutTimeout = window.setTimeout(() => {
        this.tryInitialLayout();
      }, delay);
    }
  }

  /**
   * Gets the container width using simplified fallback chain.
   * Priority: @Input containerWidth → ResizeObserver cached width → DOM measurement → parent fallback
   */
  private getContainerWidth(): number {
    // Priority 1: Use explicitly provided containerWidth from parent (most reliable)
    if (this.containerWidth && this.containerWidth > 0) {
      return this.containerWidth;
    }
    
    // Priority 2: Use cached resize width if available (from ResizeObserver)
    if (this.pendingResizeWidth > 0) {
      return this.pendingResizeWidth;
    }
    
    // Priority 3: Use last valid width (prevents flickering during resize)
    if (this.lastValidContainerWidth > 0) {
      return this.lastValidContainerWidth;
    }
    
    const container = this.containerRef?.nativeElement;
    if (!container) {
      // Priority 4: Window fallback when container not ready
      return this.getWindowFallbackWidth();
    }

    // Priority 5: Try getBoundingClientRect (most reliable DOM method)
    const rect = container.getBoundingClientRect();
    let width = rect.width;
    
    // If 0, try clientWidth as fallback
    if (width === 0) {
      width = container.clientWidth;
    }

    // If still too small, try parent (limited traversal)
    if (width < this.minColumnWidth) {
      const parent = container.parentElement;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        if (parentRect.width >= this.minColumnWidth) {
          width = parentRect.width;
        }
      }
    }
    
    // Priority 6: Window fallback when all else fails
    if (width < this.minColumnWidth) {
      width = this.getWindowFallbackWidth();
    }
    
    // Cache valid width for stability
    if (width >= this.minColumnWidth) {
      this.lastValidContainerWidth = width;
    }

    return width;
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
    this.resizeObserver?.disconnect();
    this.itemObserver?.disconnect();
    if (this.pendingAnimationFrame) {
      cancelAnimationFrame(this.pendingAnimationFrame);
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    if (this.resizeThrottleTimeout) {
      clearTimeout(this.resizeThrottleTimeout);
    }
    if (this.resizeDebounceTimeout) {
      clearTimeout(this.resizeDebounceTimeout);
    }
    if (this.initialLayoutTimeout) {
      clearTimeout(this.initialLayoutTimeout);
    }
    if (this.layoutVerificationTimeout) {
      clearTimeout(this.layoutVerificationTimeout);
    }
    this.stopWidthPolling();
  }

  trackItem = (_: number, item: PositionedSection) => item.key;

  onSectionEvent(event: SectionRenderEvent): void {
    this.sectionEvent.emit(event);
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

  /**
   * Sets up the ResizeObserver for the container.
   * Uses debouncing to prevent excessive layout calculations during resize.
   */
  private observeContainer(): void {
    if (typeof ResizeObserver === 'undefined' || !this.containerRef) {
      return;
    }
    
    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      
      const newWidth = entry.contentRect.width;
      
      // Skip if width is invalid
      if (newWidth <= 0) return;
      
      // Cache the width for immediate use
      this.pendingResizeWidth = newWidth;
      
      // Check if this is a significant width change (> 4px)
      const widthChange = Math.abs(newWidth - this.lastValidContainerWidth);
      
      if (!this.hasValidLayout) {
        // First valid width - force immediate layout
        this.forceInitialLayout();
      } else if (widthChange > 4) {
        // Significant width change - debounce the layout update
        this.debouncedLayoutUpdate(newWidth);
      }
    });
    
    this.resizeObserver.observe(this.containerRef.nativeElement);
  }

  /**
   * Debounces layout updates during rapid resize events.
   * Waits for resize to settle before recalculating layout.
   */
  private debouncedLayoutUpdate(newWidth: number): void {
    // Clear existing debounce timeout
    if (this.resizeDebounceTimeout) {
      clearTimeout(this.resizeDebounceTimeout);
    }
    
    // Schedule debounced update
    this.resizeDebounceTimeout = window.setTimeout(() => {
      this.resizeDebounceTimeout = undefined;
      this.pendingResizeWidth = newWidth;
      this.scheduleLayoutUpdate();
    }, this.RESIZE_DEBOUNCE_MS);
  }

  private observeItems(): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    this.itemObserver = new ResizeObserver(() => this.throttledScheduleLayoutUpdate());

    this.itemRefs.changes.subscribe((items: QueryList<ElementRef<HTMLDivElement>>) => {
      this.itemObserver?.disconnect();
      items.forEach((item) => this.itemObserver?.observe(item.nativeElement));
      this.scheduleLayoutUpdate();
    });

    this.itemRefs.forEach((item) => this.itemObserver?.observe(item.nativeElement));
  }

  private throttledScheduleLayoutUpdate(): void {
    if (this.resizeThrottleTimeout) {
      return;
    }
    this.resizeThrottleTimeout = window.setTimeout(() => {
      this.resizeThrottleTimeout = undefined;
      this.scheduleLayoutUpdate();
    }, this.RESIZE_THROTTLE_MS);
  }

  private scheduleLayoutUpdate(): void {
    // Cancel any pending RAF
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    if (this.pendingAnimationFrame) {
      cancelAnimationFrame(this.pendingAnimationFrame);
    }
    
    // Reset reflow counter for new layout calculation
    this.reflowCount = 0;
    
    // Use immediate RAF for fastest response
    this.rafId = requestAnimationFrame(() => {
      this.rafId = undefined;
      this.pendingAnimationFrame = requestAnimationFrame(() => {
        this.pendingAnimationFrame = undefined;
        this.reflowWithActualHeights();
      });
    });
  }

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
    const idx = index !== undefined ? `-${index}` : `-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    return `${title}-${type}${idx}`;
  }

  private computeInitialLayout(): void {
    const resolvedSections = this.sections ?? [];
    
    // STREAMING OPTIMIZATION: Use incremental layout when streaming with existing sections
    // This prevents blinking by avoiding isLayoutReady reset
    if (this.isStreaming && this.positionedSections.length > 0 && this.isLayoutReady) {
      this.addNewSectionsIncrementally(resolvedSections);
      return;
    }
    
    this.reflowCount = 0;
    this.containerHeight = 0;
    // IMPORTANT: During streaming, DON'T reset isLayoutReady to prevent opacity flash
    if (!this.isStreaming) {
      this.isLayoutReady = false;
      this.hasValidLayout = false;
    }
    this.layoutState = 'measuring';
    
    // Calculate container width and columns for IMMEDIATE multi-column layout
    const containerWidth = this.getContainerWidth();
    const columns = Math.min(this.maxColumns, Math.max(1, 
      Math.floor((containerWidth + this.gap) / (this.minColumnWidth + this.gap))
    ));
    
    // Use row-first packing algorithm when enabled
    if (this.packingAlgorithm === 'row-first' && resolvedSections.length > 0) {
      try {
        this.computeRowFirstLayout(resolvedSections, columns);
        return;
      } catch (error) {
        // Fall back to legacy algorithm if row-first fails and fallback is enabled
        if (this.useLegacyFallback) {
          console.warn('[MasonryGrid] Row-first packing failed, using legacy algorithm:', error);
        } else {
          throw error;
        }
      }
    }
    
    // Legacy layout algorithm
    this.computeLegacyLayout(resolvedSections, columns, containerWidth);
  }

  /**
   * Computes layout using the row-first space-filling algorithm.
   * This algorithm prioritizes filling rows completely (zero white space) over
   * strictly respecting section preferred widths.
   */
  private computeRowFirstLayout(sections: CardSection[], columns: number): void {
    // Configure the row packer
    const config: RowPackerConfig = {
      totalColumns: columns,
      gap: this.gap,
      prioritizeSpaceFilling: this.rowPackingOptions.prioritizeSpaceFilling,
      allowShrinking: this.rowPackingOptions.allowShrinking,
      allowGrowing: this.rowPackingOptions.allowGrowing,
      maxOptimizationPasses: this.rowPackingOptions.maxOptimizationPasses,
    };

    // Pack sections into rows
    const result = packSectionsIntoRows(sections, config);

    // Convert to positioned sections for rendering
    const rowPackerPositions = packingResultToPositions(result, {
      totalColumns: columns,
      gap: this.gap,
    });

    // Convert row packer positions to component's PositionedSection format
    this.positionedSections = rowPackerPositions.map((pos, index) => {
      const section = pos.section;
      const key = this.getStableSectionKey(section, index);
      const isNew = this.isStreaming && this.isTrulyNewSection(section, key);
      this.markSectionRendered(section, key);

      const item: PositionedSection = {
        section,
        key,
        colSpan: pos.colSpan,
        preferredColumns: pos.preferredColumns,
        left: pos.left,
        top: pos.top,
        width: pos.width,
        isNew,
      };

      return item;
    });

    this.containerHeight = result.totalHeight;

    // Log packing metrics in debug mode
    if (this._debug) {
      console.log('[MasonryGrid] Row-first packing result:', {
        rows: result.rows.length,
        utilization: `${result.utilizationPercent.toFixed(1)}%`,
        rowsWithGaps: result.rowsWithGaps,
        shrunkCount: result.shrunkCount,
        grownCount: result.grownCount,
      });
    }

    this.cdr.markForCheck();
  }

  /**
   * Computes layout using the legacy bin-packing algorithm.
   * This is the original masonry grid algorithm.
   */
  private computeLegacyLayout(
    resolvedSections: CardSection[],
    columns: number,
    containerWidth: number
  ): void {
    // Calculate column width for positioning
    const colWidth = columns > 1 
      ? (containerWidth - (this.gap * (columns - 1))) / columns
      : containerWidth;
    
    // Track column heights for proper multi-column placement
    const colHeights = Array(columns).fill(0);
    
    // Determine optimal section ordering using bin-packing algorithm
    let orderedSections = resolvedSections;
    
    if (this.optimizeLayout && resolvedSections.length > 1) {
      // Use bin-packing to determine optimal section ordering
      // This pre-sorts sections to minimize gaps during placement
      const packedSections = binPack2D(resolvedSections, columns, {
        respectPriority: true,
        fillGaps: true,
        balanceColumns: false  // Focus on gap minimization
      });
      
      // Extract the ordered sections from the packed result
      orderedSections = packedSections.map(s => s.section);
    }
    
    // Place sections in multi-column layout from the start
    this.positionedSections = orderedSections.map((section, index) => {
      const preferredCols = this.getPreferredColumns(section);
      // Use stable key with index to ensure uniqueness for sections without id
      const key = this.getStableSectionKey(section, index);
      // Check if this section is TRULY new (not yet rendered in ANY previous update)
      const isNew = this.isStreaming && this.isTrulyNewSection(section, key);
      // Mark as rendered immediately to prevent re-animation on subsequent updates
      this.markSectionRendered(section, key);
      
      // Find shortest column for placement (simple greedy algorithm)
      const shortestCol = colHeights.indexOf(Math.min(...colHeights));
      const left = shortestCol * (colWidth + this.gap);
      const top = colHeights[shortestCol];
      
      // Estimate section height (will be corrected in reflowWithActualHeights)
      const estimatedHeight = 300;
      colHeights[shortestCol] = top + estimatedHeight + this.gap;
      
      // Generate width expression using centralized helper (handles gaps correctly)
      const widthExpr = columns > 1 
        ? generateWidthExpression(columns, 1, this.gap)
        : '100%';
      
      const item: PositionedSection = {
        section,
        key,
        colSpan: this.getSectionColSpan(section),
        preferredColumns: preferredCols,
        left: columns > 1 ? `${left}px` : '0px',
        top,
        width: widthExpr,
        isNew
      };
      
      return item;
    });
    
    this.containerHeight = Math.max(...colHeights, 0);
    this.cdr.markForCheck();
  }
  
  /**
   * Incremental section addition for streaming mode
   * 
   * During streaming, we want to add new sections without:
   * 1. Resetting isLayoutReady (which causes opacity flash)
   * 2. Rebuilding the entire positionedSections array
   * 3. Losing existing section positions
   * 
   * This method:
   * - Identifies new sections not yet in positionedSections
   * - Updates existing sections' content in place
   * - Appends new sections with estimated positions
   * - Schedules a soft reflow that preserves layout state
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
    const columns = Math.min(this.maxColumns, Math.max(1, 
      Math.floor((containerWidth + this.gap) / (this.minColumnWidth + this.gap))
    ));
    const colWidth = columns > 1 
      ? (containerWidth - (this.gap * (columns - 1))) / columns
      : containerWidth;
    
    // Build column heights from existing sections
    const colHeights = Array(columns).fill(0);
    for (const ps of this.positionedSections) {
      // Parse left position to determine column
      const leftPx = parseFloat(ps.left) || 0;
      const colIndex = Math.min(columns - 1, Math.floor(leftPx / (colWidth + this.gap)));
      // Use estimated height since we don't have DOM measurements yet
      colHeights[colIndex] = Math.max(colHeights[colIndex], ps.top + 300 + this.gap);
    }
    
    // Width expression for new sections
    const widthExpr = columns > 1 
      ? generateWidthExpression(columns, 1, this.gap)
      : '100%';
    
    // Append new sections with multi-column positions
    const newPositionedSections = newSections.map(({ section, index }) => {
      const stableKey = this.getStableSectionKey(section, index);
      const preferredCols = this.getPreferredColumns(section);
      
      // Mark as new for entrance animation - use helper method for consistent checking
      const isNew = this.isTrulyNewSection(section, stableKey);
      this.markSectionRendered(section, stableKey);
      
      // Find shortest column for placement
      const shortestCol = colHeights.indexOf(Math.min(...colHeights));
      const left = shortestCol * (colWidth + this.gap);
      const top = colHeights[shortestCol];
      
      // Update column height
      colHeights[shortestCol] = top + 300 + this.gap;
      
      const item: PositionedSection = {
        section,
        key: stableKey,
        colSpan: this.getSectionColSpan(section),
        preferredColumns: preferredCols,
        left: columns > 1 ? `${left}px` : '0px',
        top,
        width: widthExpr,
        isNew
      };
      
      return item;
    });
    
    // Append new sections (preserves existing array references)
    this.positionedSections = [...this.positionedSections, ...newPositionedSections];
    this.containerHeight = Math.max(...colHeights, 0);
    
    // Schedule soft reflow (preserves isLayoutReady)
    this.scheduleLayoutUpdate();
    this.cdr.markForCheck();
  }

  /**
   * Gets the preferred column count for a section.
   * Checks: section.preferredColumns → meta.preferredColumns → type-based default
   */
  private getPreferredColumns(section: CardSection): PreferredColumns {
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
    return getPreferredColumns(section.type ?? 'info');
  }

  /**
   * Finds the optimal column assignment for a section.
   * This implements the column negotiation algorithm with gap prediction:
   * 1. Find the shortest column(s) that can fit the requested span
   * 2. If preferred span doesn't fit, try smaller spans (graceful degradation)
   * 3. Predict if placement would create unfillable gaps based on pending sections
   * 4. Expand to fill orphan space only if no pending section can fit there
   * 
   * @param colHeights - Array of current column heights
   * @param preferredSpan - The section's preferred column span
   * @param columns - Total available columns
   * @param containerWidth - Current container width
   * @param pendingSections - Optional array of sections still to be placed (for gap prediction)
   * @returns Column assignment with columnIndex, colSpan, and expansion flag
   */
  private findOptimalColumnAssignment(
    colHeights: number[],
    preferredSpan: number,
    columns: number,
    containerWidth: number,
    pendingSections?: PositionedSection[]
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
      const gapScore = this.calculateGapScore(colHeights, col, targetSpan, columns, pendingSections);
      
      // Prefer positions that minimize both height and gap creation
      // Use weighted scoring: height is primary, gap score is secondary
      const weightedScore = maxColHeight + (gapScore * 50);
      
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
    
    const gapTotal = this.gap * (columns - 1);
    const columnWidthPx = (containerWidth - gapTotal) / columns;
    const remainingWidthPx = remainingCols * columnWidthPx + 
      (remainingCols > 0 ? (remainingCols - 1) * this.gap : 0);
    
    // Expand if:
    // 1. Remaining space can't fit minimum width section, OR
    // 2. No pending section can fit in the remaining columns
    const shouldExpand = remainingCols > 0 && 
      (remainingWidthPx < this.minColumnWidth || !canPendingFit);
    const finalSpan = shouldExpand ? targetSpan + remainingCols : targetSpan;
    
    return {
      columnIndex: bestColumn,
      colSpan: finalSpan,
      expanded: shouldExpand
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
    const variance = simulatedHeights.reduce((acc, h) => acc + Math.pow(h - avgHeight, 2), 0) / columns;
    
    // Check if remaining columns on the row could fit any pending section
    const remainingAfter = columns - startCol - span;
    const remainingBefore = startCol;
    
    // Find minimum colSpan among pending sections
    const minPendingSpan = pendingSections.length > 0 
      ? Math.min(...pendingSections.map(s => s.colSpan))
      : 1;
    
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
  private canAnyPendingSectionFit(availableColumns: number, pendingSections?: PositionedSection[]): boolean {
    if (!pendingSections || pendingSections.length === 0 || availableColumns <= 0) {
      return false;
    }
    
    // Check if any pending section has colSpan <= available columns
    return pendingSections.some(s => s.colSpan <= availableColumns);
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
    const candidates = sections.filter(s => {
      const height = sectionHeights.get(s.key) ?? 200;
      return s.colSpan > 1 && 
             s.preferredColumns > 1 && 
             height > tallThreshold;
    });
    
    if (candidates.length === 0) {
      return sections;
    }
    
    // Clone sections for modification
    const optimized = sections.map(s => ({ ...s }));
    
    for (const candidate of candidates) {
      const idx = optimized.findIndex(s => s.key === candidate.key);
      if (idx < 0) continue;
      
      const section = optimized[idx];
      if (!section) continue;
      
      const currentSpan = section.colSpan;
      const height = sectionHeights.get(section.key) ?? 200;
      
      // Only try reducing by 1 (don't go from 3 to 1 directly)
      const narrowerSpan = Math.max(1, currentSpan - 1);
      
      if (narrowerSpan === currentSpan) continue;
      
      // Simulate both layouts and compare total heights
      const currentLayoutHeight = this.simulateLayoutHeight(
        optimized, sectionHeights, columns
      );
      
      // Temporarily modify span
      section.colSpan = narrowerSpan;
      
      const narrowerLayoutHeight = this.simulateLayoutHeight(
        optimized, sectionHeights, columns
      );
      
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
    containerWidth: number
  ): PositionedSection[] {
    if (placedSections.length < 2 || columns < 2) {
      return placedSections;
    }
    
    // Clone for modification
    let result = placedSections.map(s => ({ ...s }));
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
          const heightA = sectionHeights.get(sectionA.key) ?? 200;
          const heightB = sectionHeights.get(sectionB.key) ?? 200;
          
          // Try swapping their positions (and thus, effectively their placements)
          const swapped = this.trySwapSections(
            result,
            i,
            j,
            sectionHeights,
            columns
          );
          
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
    const swapped = sections.map(s => ({ ...s }));
    
    // Swap the sections in the array (which affects their placement order)
    const temp = swapped[indexA];
    swapped[indexA] = swapped[indexB]!;
    swapped[indexB] = temp!;
    
    // Re-calculate positions with swapped order
    return this.recalculatePositions(swapped, sectionHeights, columns);
  }

  /**
   * Recalculates section positions using the FFDH algorithm.
   */
  private recalculatePositions(
    sections: PositionedSection[],
    sectionHeights: Map<string, number>,
    columns: number
  ): PositionedSection[] {
    const colHeights = Array(columns).fill(0);
    
    // Sort by height descending
    const sorted = [...sections].sort((a, b) => {
      const heightA = sectionHeights.get(a.key) ?? 200;
      const heightB = sectionHeights.get(b.key) ?? 200;
      return heightB - heightA;
    });
    
    const result: PositionedSection[] = [];
    
    for (const section of sorted) {
      const height = sectionHeights.get(section.key) ?? 200;
      const span = Math.min(section.colSpan, columns);
      
      // Find best column
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
      
      // Calculate position
      const widthExpr = generateWidthExpression(columns, span, this.gap);
      const leftExpr = generateLeftExpression(columns, bestColumn, this.gap);
      
      // Update column heights
      const newHeight = minColHeight + height + this.gap;
      for (let c = bestColumn; c < bestColumn + span; c++) {
        colHeights[c] = newHeight;
      }
      
      result.push({
        ...section,
        left: leftExpr,
        top: minColHeight,
        width: widthExpr
      });
    }
    
    return result;
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
   * After initial placement, analyzes the layout for gaps and attempts to fill them
   * by repositioning flexible sections.
   * 
   * Algorithm:
   * 1. Build an occupancy grid from current section positions
   * 2. Identify significant gaps (empty spaces between sections)
   * 3. Find single-column sections that could fit in gaps
   * 4. Reposition sections to fill gaps without increasing total height
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
    
    // Build sections with height info for gap analysis
    const sectionsWithHeight = sections.map(s => ({
      ...s,
      height: sectionHeights.get(s.key) ?? 200
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
      .filter(({ section }) => 
        section.colSpan === 1 && 
        section.preferredColumns === 1
      )
      .sort((a, b) => b.section.top - a.section.top); // Start from bottom sections
    
    if (movableSections.length === 0) {
      return sections; // No movable sections
    }
    
    // Try to fill gaps with movable sections
    const result = [...sections];
    let madeChanges = false;
    
    for (const gap of gaps) {
      // Find a section that fits in this gap
      const candidate = movableSections.find(({ section, height }) => 
        section.colSpan <= gap.width && 
        height <= gap.height + 20 // Allow small tolerance
      );
      
      if (candidate) {
        // Move section to fill the gap
        const targetIndex = result.findIndex(s => s.key === candidate.section.key);
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
            width: generateWidthExpression(columns, candidate.section.colSpan, this.gap)
          };
          result[targetIndex] = movedSection;
          madeChanges = true;
          
          // Remove from movable list to avoid reusing
          const movableIdx = movableSections.findIndex(m => m.section.key === candidate.section.key);
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
    const containerHeight = Math.max(
      ...sections.map(s => s.top + s.height),
      0
    );
    
    if (containerHeight === 0) {
      return gaps;
    }
    
    // Build occupancy grid with 10px resolution
    const gridResolution = 10;
    const rows = Math.ceil(containerHeight / gridResolution);
    const grid: boolean[][] = Array.from({ length: rows }, () => 
      new Array(columns).fill(false)
    );
    
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
              width: 1 // Single column gap
            });
          }
          gapStart = null;
        }
      }
      
      // Don't count gaps at the bottom as they're not "internal" gaps
    }
    
    // Sort gaps by area (largest first) to prioritize filling bigger gaps
    gaps.sort((a, b) => (b.height * b.width) - (a.height * a.width));
    
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

  private reflowWithActualHeights(): void {
    if (!this.containerRef?.nativeElement || this.reflowCount >= this.MAX_REFLOWS) {
      return;
    }

    this.reflowCount++;

    const containerElement = this.containerRef.nativeElement;
    if (!containerElement) {
      return;
    }

    const containerWidth = this.getContainerWidth();
    
    // If width is still too small for even single column, schedule another attempt
    // With our fallbacks, this should rarely happen
    if (!containerWidth || containerWidth < this.minColumnWidth) {
      if (this.reflowCount < this.MAX_REFLOWS) {
        requestAnimationFrame(() => {
          this.reflowWithActualHeights();
        });
      }
      return;
    }
    
    // Cache valid width
    this.lastValidContainerWidth = containerWidth;

    // Use centralized column calculation from grid-config.util.ts
    const columns = calculateColumns(containerWidth, {
      minColumnWidth: this.minColumnWidth,
      maxColumns: this.maxColumns,
      gap: this.gap
    });
    
    // Expose column count as CSS custom property for section grids to consume
    if (containerElement.style && typeof containerElement.style.setProperty === 'function') {
      containerElement.style.setProperty('--masonry-columns', columns.toString());
      // Also expose the calculated column width for CSS consumption
      const colWidth = (containerWidth - (this.gap * (columns - 1))) / columns;
      containerElement.style.setProperty('--masonry-column-width', `${colWidth}px`);
    }
    
    this.emitLayoutInfo(columns, containerWidth);

    const colHeights = Array(columns).fill(0);
    let hasZeroHeights = false;
    const itemRefArray = this.itemRefs?.toArray() ?? [];

    this.layoutState = 'calculating';
    
    // ========================================================================
    // PHASE 1: MEASURE ALL HEIGHTS FIRST
    // Before making any placement decisions, collect actual DOM heights
    // ========================================================================
    const sectionHeightMap = new Map<string, number>();
    const sectionIndexMap = new Map<string, number>();
    
    this.positionedSections.forEach((item, index) => {
      const itemElement = itemRefArray[index]?.nativeElement;
      let height = itemElement?.offsetHeight ?? 0;
      
      // If height is 0, try to get the first child's height
      if (height === 0 && itemElement?.firstElementChild) {
        height = (itemElement.firstElementChild as HTMLElement).offsetHeight ?? 0;
      }
      
      // Still 0? Use reasonable minimum and flag for retry
      if (height === 0) {
        height = 200;
        hasZeroHeights = true;
      }
      
      sectionHeightMap.set(item.key, height);
      sectionIndexMap.set(item.key, index);
    });
    
    // ========================================================================
    // PHASE 2: COLUMN SPAN OPTIMIZATION
    // For tall multi-column sections, evaluate if narrower span would help
    // ========================================================================
    let optimizedSections = this.positionedSections;
    
    if (this.optimizeLayout && !hasZeroHeights && columns > 1) {
      optimizedSections = this.optimizeColumnSpans(
        this.positionedSections,
        sectionHeightMap,
        columns
      );
    }
    
    // ========================================================================
    // PHASE 3: HEIGHT-SORTED RE-LAYOUT (FFDH - First Fit Decreasing Height)
    // Sort sections by actual height (tallest first) then re-layout
    // This is the core tetris optimization: tall pieces go first so short
    // pieces can fill the gaps they create
    // ========================================================================
    let sectionsToPlace: PositionedSection[];
    
    if (this.optimizeLayout && !hasZeroHeights && columns > 1) {
      // Sort by height descending (FFDH principle with real data)
      sectionsToPlace = [...optimizedSections].sort((a, b) => {
        const heightA = sectionHeightMap.get(a.key) ?? 200;
        const heightB = sectionHeightMap.get(b.key) ?? 200;
        
        // Primary: taller sections first
        if (heightB !== heightA) {
          return heightB - heightA;
        }
        
        // Secondary: wider sections first (more column commitment)
        if (b.colSpan !== a.colSpan) {
          return b.colSpan - a.colSpan;
        }
        
        // Tertiary: preserve original order for stability
        const idxA = sectionIndexMap.get(a.key) ?? 0;
        const idxB = sectionIndexMap.get(b.key) ?? 0;
        return idxA - idxB;
      });
    } else {
      // No optimization - use original order
      sectionsToPlace = [...optimizedSections];
    }
    
    // Track pending sections for gap prediction
    const pendingSections = this.optimizeLayout ? [...sectionsToPlace] : undefined;
    
    // ========================================================================
    // PHASE 3: PLACE SECTIONS IN HEIGHT-SORTED ORDER
    // ========================================================================
    const placedSections: PositionedSection[] = [];
    
    for (const item of sectionsToPlace) {
      // Remove current item from pending list
      if (pendingSections) {
        const pendingIndex = pendingSections.findIndex(p => p.key === item.key);
        if (pendingIndex >= 0) {
          pendingSections.splice(pendingIndex, 1);
        }
      }
      
      const height = sectionHeightMap.get(item.key) ?? 200;
      
      // Use the column negotiation algorithm for optimal assignment
      const assignment = this.findOptimalColumnAssignment(
        colHeights,
        item.colSpan,
        columns,
        containerWidth,
        pendingSections
      );
      
      const { columnIndex: bestColumn, colSpan } = assignment;
      
      // Find the top position (max height of columns this span will occupy)
      let topPosition = 0;
      for (let c = bestColumn; c < bestColumn + colSpan; c++) {
        if (colHeights[c] > topPosition) {
          topPosition = colHeights[c];
        }
      }

      // Use centralized width/left expression generators
      const widthExpr = generateWidthExpression(columns, colSpan, this.gap);
      const leftExpr = generateLeftExpression(columns, bestColumn, this.gap);

      // Update column heights for all columns this span occupies
      const newHeight = topPosition + height + this.gap;
      for (let col = bestColumn; col < bestColumn + colSpan; col += 1) {
        colHeights[col] = newHeight;
      }

      placedSections.push({
        ...item,
        colSpan,
        left: leftExpr,
        top: topPosition,
        width: widthExpr
      });
    }
    
    // Restore original order for DOM stability (positions are already calculated)
    const updated = placedSections.sort((a, b) => {
      const idxA = sectionIndexMap.get(a.key) ?? 0;
      const idxB = sectionIndexMap.get(b.key) ?? 0;
      return idxA - idxB;
    });

    this.positionedSections = updated;
    this.containerHeight = Math.max(...colHeights, 0);
    this.currentColumns = columns;
    
    // ========================================================================
    // PHASE 4: LOCAL SWAP OPTIMIZATION
    // Try swapping pairs of sections to find improvements
    // ========================================================================
    let finalSections = updated;
    
    if (this.optimizeLayout && !hasZeroHeights && columns > 1) {
      const swapOptimized = this.localSwapOptimization(
        updated,
        sectionHeightMap,
        columns,
        containerWidth
      );
      
      if (swapOptimized !== updated) {
        finalSections = swapOptimized;
        this.positionedSections = swapOptimized;
        this.containerHeight = this.calculateTotalHeight(swapOptimized, sectionHeightMap);
      }
    }
    
    // ========================================================================
    // PHASE 5: GAP FILLING OPTIMIZATION
    // After initial placement, try to fill any remaining gaps
    // ========================================================================
    if (this.optimizeLayout && !hasZeroHeights && columns > 1) {
      const gapOptimized = this.optimizeLayoutGaps(
        finalSections, 
        columns, 
        containerWidth, 
        itemRefArray
      );
      
      if (gapOptimized !== finalSections) {
        this.positionedSections = gapOptimized;
        // Recalculate container height after optimization
        this.containerHeight = Math.max(
          ...gapOptimized.map(s => {
            const idx = updated.findIndex(u => u.key === s.key);
            const height = itemRefArray[idx]?.nativeElement?.offsetHeight ?? 200;
            return s.top + height;
          }),
          0
        );
      }
    }
    
    // Emit layout logs for debugging and monitoring
    // Check if columns changed since last layout
    const columnsChanged = columns !== this.previousColumnCount && this.previousColumnCount > 0;
    
    if (columnsChanged) {
      // Emit columns_changed event
      this.emitLayoutLog('columns_changed', columns, containerWidth, updated, this.previousColumnCount);
    }
    
    // Check for any expanded sections (colSpan > preferredColumns)
    const hasExpandedSections = updated.some(ps => ps.colSpan > ps.preferredColumns);
    
    if (hasExpandedSections && !columnsChanged) {
      // Emit section_expanded event only when sections expanded but columns didn't change
      this.emitLayoutLog('section_expanded', columns, containerWidth, updated);
    } else if (!columnsChanged) {
      // Emit sections_positioned for normal repositioning
      this.emitLayoutLog('sections_positioned', columns, containerWidth, updated);
    }
    
    // Update previous column count for next comparison
    this.previousColumnCount = columns;
    
    // Mark layout as ready on first successful reflow without zero heights
    if (!hasZeroHeights) {
      this.isLayoutReady = true;
      this.layoutState = 'ready';
      // Mark layout as valid only when we have proper width and no zero heights
      this.hasValidLayout = true;
      this.lastValidContainerWidth = containerWidth;
    }
    
    // Force change detection - transitions will be handled by CSS
    this.cdr.markForCheck();
    
    // If we detected zero heights and haven't hit max reflows, try again immediately
    if (hasZeroHeights && this.reflowCount < this.MAX_REFLOWS) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.reflowWithActualHeights();
        });
      });
    }
  }

  private emitLayoutInfo(columns: number, containerWidth: number): void {
    const layoutInfo: MasonryLayoutInfo = {
      columns,
      containerWidth,
      breakpoint: getBreakpointFromWidth(containerWidth)
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
      sections: positionedSections.map(ps => ({
        id: ps.section.id || ps.key,
        type: ps.section.type || 'unknown',
        title: ps.section.title || '',
        preferredColumns: ps.preferredColumns,
        actualColSpan: ps.colSpan,
        expanded: ps.colSpan > ps.preferredColumns,
        position: { left: ps.left, top: ps.top },
        width: ps.width
      }))
    };
    
    // Console logging only when debug mode is enabled
    if (this._debug) {
      const eventEmoji = event === 'columns_changed' ? '📊' : event === 'section_expanded' ? '📐' : '📍';
      console.group(`${eventEmoji} [MasonryGrid] ${event.toUpperCase()}`);
      console.log(`Container: ${containerWidth}px | Columns: ${columns}${previousColumns ? ` (was ${previousColumns})` : ''}`);
      console.table(entry.sections.map(s => ({
        title: s.title,
        type: s.type,
        preferred: s.preferredColumns,
        actual: s.actualColSpan,
        expanded: s.expanded ? '✓' : '',
        left: s.position.left,
        width: s.width
      })));
      console.groupEnd();
    }
    
    this.layoutLog.emit(entry);
  }

  /**
   * Determines the column span for a section.
   * Priority order:
   * 1. Explicit colSpan (hard override)
   * 2. preferredColumns (adaptive hint)
   * 3. Content-based calculation (threshold-based)
   */
  private getSectionColSpan(section: CardSection): number {
    // Priority 1: Explicit colSpan always takes precedence (hard override)
    if (section.colSpan && section.colSpan > 0) {
      return Math.min(section.colSpan, this.currentColumns || this.maxColumns);
    }

    const type = (section.type ?? '').toLowerCase();

    // Special case: project sections always span 1 column
    if (type === 'project') {
      return 1;
    }

    // Use the smart-grid algorithm for optimal column calculation
    // This considers content density, section type, and constraints
    const optimalColumns = calculateOptimalColumns(section, this.currentColumns || this.maxColumns);
    
    // Clamp to available columns
    return Math.min(optimalColumns, this.currentColumns || this.maxColumns);
  }

  /**
   * Get column span thresholds for a section
   * First checks section's meta (set during normalization), then falls back to default
   */
  private getColSpanThresholds(section: CardSection): ColSpanThresholds {
    const meta = section.meta as Record<string, unknown> | undefined;
    const thresholds = meta?.['colSpanThresholds'] as ColSpanThresholds | undefined;
    
    if (thresholds && typeof thresholds === 'object' && 'two' in thresholds) {
      return thresholds;
    }
    
    // Fallback to default if not found in meta
    return DEFAULT_COL_SPAN_THRESHOLD;
  }

  private getDescriptionDensity(description?: string): number {
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
   * Schedules a deferred layout verification check.
   * This catches cases where the initial layout failed but the container
   * has since become properly sized (e.g., after animations, lazy loading).
   */
  private scheduleLayoutVerification(): void {
    if (this.layoutVerificationTimeout) {
      clearTimeout(this.layoutVerificationTimeout);
    }
    
    // Check after 500ms - enough time for most animations/transitions to complete
    this.layoutVerificationTimeout = window.setTimeout(() => {
      this.layoutVerificationTimeout = undefined;
      
      // If we still don't have a valid layout, start aggressive polling
      if (!this.hasValidLayout) {
        const containerWidth = this.getContainerWidth();
        if (containerWidth > 0) {
          // Width is now available, force full layout calculation
          this.forceInitialLayout();
        } else {
          // Still no width, start aggressive polling
          this.startWidthPolling();
        }
      }
    }, 500);
  }

  /**
   * Starts aggressive width polling to detect when container dimensions become available.
   * This is a fallback for cases where ResizeObserver doesn't fire.
   */
  private startWidthPolling(): void {
    // Don't start if already polling or if we have a valid layout
    if (this.widthPollingInterval || this.hasValidLayout) {
      return;
    }
    
    this.widthPollingStartTime = Date.now();
    
    this.widthPollingInterval = window.setInterval(() => {
      // Check if we should stop polling
      const elapsed = Date.now() - this.widthPollingStartTime;
      if (elapsed >= this.WIDTH_POLLING_DURATION_MS) {
        this.stopWidthPolling();
        return;
      }
      
      // If we already have a valid layout, stop polling
      if (this.hasValidLayout) {
        this.stopWidthPolling();
        return;
      }
      
      // Check container width
      const containerWidth = this.getContainerWidth();
      
      if (containerWidth > 0) {
        this.stopWidthPolling();
        // Force layout calculation
        this.forceInitialLayout();
      }
    }, this.WIDTH_POLLING_INTERVAL_MS);
  }

  /**
   * Stops the width polling interval.
   */
  private stopWidthPolling(): void {
    if (this.widthPollingInterval) {
      clearInterval(this.widthPollingInterval);
      this.widthPollingInterval = undefined;
    }
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
      const previousTitles = new Set(previousSections.map(s => s.title || '').filter(t => t));
      const hasOverlap = currentSections.some(s => s.title && previousTitles.has(s.title));
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

  /**
   * Section type defaults for content orientation
   * Determines whether items within a section flow horizontally or vertically
   */
  private readonly SECTION_ORIENTATION_DEFAULTS: Record<string, 'vertical' | 'horizontal' | 'auto'> = {
    'contact-card': 'horizontal',  // Contact cards look good side-by-side
    'network-card': 'horizontal',  // Network cards similar to contacts
    'overview': 'vertical',        // Key-value pairs stack well
    'analytics': 'horizontal',     // Metrics often display horizontally
    'stats': 'horizontal',         // Stats similar to analytics
    'financials': 'horizontal',    // Financial metrics horizontally
    'list': 'vertical',            // Lists are naturally vertical
    'event': 'vertical',           // Timeline flows vertically
    'timeline': 'vertical',        // Timeline flows vertically
    'chart': 'auto',               // Depends on chart type and size
    'map': 'auto',                 // Maps can be either
    'product': 'auto',             // Products can be either based on count
    'solutions': 'vertical',       // Solutions usually list vertically
    'info': 'vertical',            // Info sections stack key-value pairs
    'quotation': 'vertical',       // Quotes stack naturally
    'text-reference': 'vertical',  // Text references vertical
    'project': 'vertical',         // Projects vertical
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
      const hasShortValues = section.fields?.every(f => {
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
