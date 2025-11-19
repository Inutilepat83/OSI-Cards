import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, QueryList, SimpleChanges, ViewChild, ViewChildren, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardSection } from '../../../../models';
import { SectionRendererComponent, SectionRenderEvent } from '../section-renderer/section-renderer.component';
import { Breakpoint, getBreakpointFromWidth } from '../../../utils/responsive.util';
import { CardChangeType } from '../../../utils/card-diff.util';

interface ColSpanThresholds {
  two: number;
  three?: number;
}

const SECTION_COL_SPAN_THRESHOLDS: Record<string, ColSpanThresholds> = {
  overview: { two: 2, three: 5 },
  map: { two: 3 },
  chart: { two: 3 },
  quotation: { two: 4 },
  'text-reference': { two: 4 },
  solutions: { two: 4 },
  info: { two: 4, three: 9 },
  analytics: { two: 4 },
  stats: { two: 4 },
  financials: { two: 4 },
  'contact-card': { two: 4 },
  'network-card': { two: 4 },
  list: { two: 5 },
  event: { two: 5 },
  product: { two: 4 },
  locations: { two: 3 }
};

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
  left: string;
  top: number;
  width: string;
}

@Component({
  selector: 'app-masonry-grid',
  standalone: true,
  imports: [CommonModule, SectionRendererComponent],
  templateUrl: './masonry-grid.component.html',
  styleUrls: ['./masonry-grid.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MasonryGridComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() sections: CardSection[] = [];
  @Input() gap = 12; // Harmonize with section grid tokens for consistent gutters
  @Input() minColumnWidth = 260; // Keep cards readable when columns increase
  @Input() maxColumns = 4; // Allow wider canvases to display four columns for better uniformity
  @Input() changeType: CardChangeType = 'structural';

  @Output() sectionEvent = new EventEmitter<SectionRenderEvent>();
  @Output() layoutChange = new EventEmitter<MasonryLayoutInfo>();

  /**
   * Public method to force masonry grid recalculation
   * Called when sections are completed during streaming
   */
  public recalculateLayout(): void {
    this.contentUpdateMode = false;
    this.reflowCount = 0;
    this.scheduleLayoutUpdate({ force: true });
  }

  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;
  @ViewChildren('itemRef') itemRefs!: QueryList<ElementRef<HTMLDivElement>>;

  private readonly cdr = inject(ChangeDetectorRef);

  positionedSections: PositionedSection[] = [];
  containerHeight = 0;
  isLayoutReady = false; // Prevent FOUC (Flash of Unstyled Content)

  private resizeObserver?: ResizeObserver;
  private itemObserver?: ResizeObserver;
  private pendingAnimationFrame?: number;
  private reflowCount = 0;
  private readonly MAX_REFLOWS = 5; // Increased for better reliability
  private resizeThrottleTimeout?: number;
  private readonly RESIZE_THROTTLE_MS = 150; // Optimized for performance
  private lastLayoutInfo?: MasonryLayoutInfo;
  private layoutRafId: number | null = null;
  private layoutUpdateQueue: (() => void)[] = [];
  private layoutUpdateScheduled = false;
  private lastStructureSignature = '';
  private readonly lastMeasuredHeights = new Map<string, number>();
  private readonly CONTENT_HEIGHT_TOLERANCE = 8;
  private contentUpdateMode = false;
  private pendingContentHeightCheck = false;
  
  // Section animation state tracking
  private readonly sectionAppearanceStates = new Map<string, 'entering' | 'entered' | 'none'>();
  private readonly sectionAppearanceTimes = new Map<string, number>();
  private readonly STAGGER_DELAY_MS = 80;
  private readonly ANIMATION_DURATION_MS = 400;
  
  // Performance: Batch change detection for animation state updates
  private pendingAnimationStateUpdates = new Set<string>();
  private animationStateUpdateRafId: number | null = null;
  
  // Debug logging for section positions
  private positionLogInterval: ReturnType<typeof setInterval> | null = null;
  private readonly ENABLE_POSITION_LOGGING = true; // Set to false to disable

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sections'] || changes['changeType']) {
      const incomingSections = this.sections ?? [];
      const nextSignature = this.getStructureSignature(incomingSections);
      const isContentUpdate = this.changeType === 'content';
      const structureChanged = nextSignature !== this.lastStructureSignature;

      // Debug logging
      if (this.ENABLE_POSITION_LOGGING) {
        console.log('🔄 [MasonryGrid] ngOnChanges', {
          timestamp: new Date().toISOString(),
          hasSectionsChange: !!changes['sections'],
          hasChangeTypeChange: !!changes['changeType'],
          incomingSectionCount: incomingSections.length,
          currentSectionCount: this.positionedSections.length,
          changeType: this.changeType,
          isContentUpdate,
          structureChanged,
          previousSignature: this.lastStructureSignature,
          nextSignature
        });
      }

      // Phase 4: Enhanced masonry grid - skip ALL layout calculations for content updates
      if (isContentUpdate && !structureChanged) {
        // Content-only update: skip ALL layout calculations
        // Sections will expand naturally via CSS, no repositioning needed
        this.contentUpdateMode = true;
        this.applyContentOnlyUpdate(incomingSections);
        
        if (this.ENABLE_POSITION_LOGGING) {
          console.log('✅ [MasonryGrid] Content-only update - skipping layout', {
            timestamp: new Date().toISOString(),
            sectionsUpdated: incomingSections.length
          });
        }
        
        // NO change detection - let Angular handle it naturally
        // NO height checks - sections expand via CSS only
        // NO layout recalculation - prevents bouncing and layout thrashing
        return; // Early return - no further processing
      } else {
        // Structural change: recalculate layout
        this.contentUpdateMode = false;
        // Reset animations when structure changes
        if (structureChanged) {
          this.resetSectionAnimations();
        }
        
        if (this.ENABLE_POSITION_LOGGING) {
          console.log('🏗️ [MasonryGrid] Structural change - recalculating layout', {
            timestamp: new Date().toISOString(),
            structureChanged,
            newSectionCount: incomingSections.length
          });
        }
        
        // Debounce layout calculation to batch multiple structural changes
        this.debouncedComputeLayout();
      }
    }
  }

  /**
   * Debounce layout computation to batch multiple structural changes
   */
  private layoutComputeTimer: ReturnType<typeof setTimeout> | null = null;
  private debouncedComputeLayout(): void {
    if (this.layoutComputeTimer) {
      clearTimeout(this.layoutComputeTimer);
    }
    this.layoutComputeTimer = setTimeout(() => {
      this.computeInitialLayout();
      this.layoutComputeTimer = null;
    }, 50); // 50ms debounce for structural changes
  }

  ngAfterViewInit(): void {
    this.computeInitialLayout();
    this.observeContainer();
    this.observeItems();
    
    // Start position logging if enabled
    if (this.ENABLE_POSITION_LOGGING) {
      this.startPositionLogging();
    }
    
    // Optimized reflow strategy: batch multiple reflows using requestIdleCallback
    // First reflow: immediate (for initial layout)
    requestAnimationFrame(() => {
      this.reflowWithActualHeights();
      
      // Schedule subsequent reflows during idle time to avoid blocking
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => {
          // Second reflow: for lazy-loaded content
          this.reflowWithActualHeights();
          
          requestIdleCallback(() => {
            // Third reflow: for images/heavy content
            this.reflowWithActualHeights();
            // Mark layout as ready after final reflow
            this.isLayoutReady = true;
            this.cdr.markForCheck();
          }, { timeout: 200 });
        }, { timeout: 100 });
      } else {
        // Fallback: use setTimeout if requestIdleCallback not available
        setTimeout(() => {
          this.reflowWithActualHeights();
          setTimeout(() => {
            this.reflowWithActualHeights();
            this.isLayoutReady = true;
            this.cdr.markForCheck();
          }, 150);
        }, 50);
      }
    });
  }
  
  /**
   * Start logging section positions every second for debugging
   */
  private startPositionLogging(): void {
    // Clear any existing interval
    if (this.positionLogInterval) {
      clearInterval(this.positionLogInterval);
    }
    
    // Log immediately
    this.logSectionPositions();
    
    // Then log every second
    this.positionLogInterval = setInterval(() => {
      this.logSectionPositions();
    }, 1000);
  }
  
  /**
   * Stop position logging
   */
  private stopPositionLogging(): void {
    if (this.positionLogInterval) {
      clearInterval(this.positionLogInterval);
      this.positionLogInterval = null;
    }
  }
  
  /**
   * Log current section positions and states
   */
  private logSectionPositions(): void {
    if (!this.ENABLE_POSITION_LOGGING) {
      return;
    }
    
    const timestamp = new Date().toISOString();
    const sections = this.positionedSections.map((item, index) => {
      const section = item.section;
      const element = this.itemRefs?.toArray()?.[index]?.nativeElement;
      const actualHeight = element?.offsetHeight ?? 0;
      const measuredHeight = this.lastMeasuredHeights.get(item.key) ?? 0;
      
      return {
        index,
        key: item.key,
        sectionId: section?.id || 'no-id',
        sectionTitle: section?.title || 'no-title',
        sectionType: section?.type || 'no-type',
        position: {
          top: item.top,
          left: item.left,
          width: item.width
        },
        heights: {
          actual: actualHeight,
          measured: measuredHeight,
          difference: Math.abs(actualHeight - measuredHeight)
        },
        colSpan: item.colSpan,
        fieldCount: section?.fields?.length ?? 0,
        itemCount: section?.items?.length ?? 0,
        animationState: this.sectionAppearanceStates.get(item.key) || 'none'
      };
    });
    
    const logData = {
      timestamp,
      containerHeight: this.containerHeight,
      isLayoutReady: this.isLayoutReady,
      contentUpdateMode: this.contentUpdateMode,
      reflowCount: this.reflowCount,
      totalSections: sections.length,
      sections,
      structureSignature: this.lastStructureSignature,
      changeType: this.changeType
    };
    
    console.group(`🔍 [MasonryGrid] Section Positions - ${timestamp}`);
    console.log('Container:', {
      height: this.containerHeight,
      layoutReady: this.isLayoutReady,
      contentUpdateMode: this.contentUpdateMode,
      reflowCount: this.reflowCount
    });
    console.log('Sections:', sections);
    console.table(sections.map(s => ({
      Index: s.index,
      ID: s.sectionId,
      Title: s.sectionTitle,
      Type: s.sectionType,
      Top: s.position.top,
      Left: s.position.left,
      Width: s.position.width,
      'Actual H': s.heights.actual,
      'Measured H': s.heights.measured,
      'H Diff': s.heights.difference,
      ColSpan: s.colSpan,
      Fields: s.fieldCount,
      Items: s.itemCount,
      Animation: s.animationState
    })));
    console.groupEnd();
  }

  ngOnDestroy(): void {
    // Stop position logging
    this.stopPositionLogging();
    
    this.resizeObserver?.disconnect();
    this.itemObserver?.disconnect();
    if (this.pendingAnimationFrame) {
      cancelAnimationFrame(this.pendingAnimationFrame);
    }
    if (this.resizeThrottleTimeout) {
      clearTimeout(this.resizeThrottleTimeout);
    }
    if (this.animationStateUpdateRafId) {
      cancelAnimationFrame(this.animationStateUpdateRafId);
    }
    if (this.layoutComputeTimer) {
      clearTimeout(this.layoutComputeTimer);
    }
    // Clear pending updates
    this.pendingAnimationStateUpdates.clear();
  }

  // Phase 5: Perfect trackBy function - uses stable section ID
  trackItem = (_: number, item: PositionedSection): string => {
    // Use section ID for stable tracking - prevents unnecessary re-renders
    return item.section?.id || item.key || `section-${_}`;
  };

  /**
   * Get animation class for a section based on its appearance state
   */
  getSectionAnimationClass(sectionKey: string, index: number): string {
    const state = this.sectionAppearanceStates.get(sectionKey);
    
    if (state === 'entering') {
      return 'section-streaming';
    }
    
    if (state === 'entered') {
      return 'section-entered';
    }
    
    // New section - mark as entering (but don't trigger here to avoid multiple calls)
    // The markSectionEntering is called in computeInitialLayout
    return '';
  }

  /**
   * Get stagger delay index for section animation
   */
  getSectionStaggerIndex(index: number): number {
    return Math.min(index, 10);
  }

  /**
   * Mark section as entering and schedule entered state
   * Optimized: Batches change detection for better performance
   */
  private markSectionEntering(sectionKey: string, index: number): void {
    this.sectionAppearanceStates.set(sectionKey, 'entering');
    const appearanceTime = Date.now();
    this.sectionAppearanceTimes.set(sectionKey, appearanceTime);
    
    // Calculate total delay (stagger + animation duration)
    const staggerDelay = index * this.STAGGER_DELAY_MS;
    const totalDelay = staggerDelay + this.ANIMATION_DURATION_MS;
    
    // Mark as entered after animation completes
    // Batch change detection for multiple sections
    setTimeout(() => {
      // Only update if this is still the latest appearance
      if (this.sectionAppearanceTimes.get(sectionKey) === appearanceTime) {
        this.sectionAppearanceStates.set(sectionKey, 'entered');
        // Batch change detection - add to pending updates
        this.pendingAnimationStateUpdates.add(sectionKey);
        this.scheduleBatchedChangeDetection();
      }
    }, totalDelay);
  }

  /**
   * Batch change detection for animation state updates
   * Reduces excessive change detection cycles
   */
  private scheduleBatchedChangeDetection(): void {
    if (this.animationStateUpdateRafId !== null) {
      return; // Already scheduled
    }
    
    this.animationStateUpdateRafId = requestAnimationFrame(() => {
      if (this.pendingAnimationStateUpdates.size > 0) {
        // Single change detection for all pending updates
        this.cdr.markForCheck();
        this.pendingAnimationStateUpdates.clear();
      }
      this.animationStateUpdateRafId = null;
    });
  }

  /**
   * Reset section animation states (called when sections change)
   */
  private resetSectionAnimations(): void {
    this.sectionAppearanceStates.clear();
    this.sectionAppearanceTimes.clear();
  }

  onSectionEvent(event: SectionRenderEvent): void {
    this.sectionEvent.emit(event);
  }

  /**
   * Gets a unique section ID for scrolling
   * Always returns a valid string to avoid setAttribute errors
   */
  getSectionId(section: CardSection | null | undefined): string {
    if (!section) {
      return 'section-unknown';
    }
    try {
      const titleOrId = section.title || section.id || 'unknown';
      const sanitized = this.sanitizeSectionId(String(titleOrId));
      return sanitized ? `section-${sanitized}` : 'section-unknown';
    } catch {
      return 'section-unknown';
    }
  }

  /**
   * Sanitizes section title for use as HTML ID
   */
  private sanitizeSectionId(title: string): string {
    if (!title || typeof title !== 'string') {
      return 'unknown';
    }
    return title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private observeContainer(): void {
    if (typeof ResizeObserver === 'undefined' || !this.containerRef) {
      return;
    }
    // Phase 4: Only observe container for structural changes, not content updates
    this.resizeObserver = new ResizeObserver(() => {
      // Skip layout updates during content-only mode
      if (!this.contentUpdateMode) {
        this.throttledScheduleLayoutUpdate();
      }
    });
    this.resizeObserver.observe(this.containerRef.nativeElement);
  }

  private observeItems(): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    // Phase 4: Only observe items for structural changes, not content updates
    this.itemObserver = new ResizeObserver(() => {
      // Skip layout updates during content-only mode
      if (!this.contentUpdateMode) {
        this.throttledScheduleLayoutUpdate();
      }
    });

    this.itemRefs.changes.subscribe((items: QueryList<ElementRef<HTMLDivElement>>) => {
      this.itemObserver?.disconnect();
      items.forEach((item) => this.itemObserver?.observe(item.nativeElement));
      // Only schedule layout update if not in content update mode
      if (!this.contentUpdateMode) {
        this.scheduleLayoutUpdate();
      }
    });

    this.itemRefs.forEach((item) => this.itemObserver?.observe(item.nativeElement));
  }

  private throttledScheduleLayoutUpdate(force = false): void {
    if (!force && this.contentUpdateMode) {
      return;
    }
    if (force) {
      this.scheduleLayoutUpdate({ force: true });
      return;
    }
    if (this.resizeThrottleTimeout) {
      return;
    }
    this.resizeThrottleTimeout = window.setTimeout(() => {
      this.resizeThrottleTimeout = undefined;
      this.scheduleLayoutUpdate();
    }, this.RESIZE_THROTTLE_MS);
  }

  private scheduleLayoutUpdate(options: { force?: boolean } = {}): void {
    const { force = false } = options;
    if (this.contentUpdateMode && !force) {
      return;
    }
    // Queue the layout update instead of scheduling immediately
    this.layoutUpdateQueue.push(() => {
      if (this.pendingAnimationFrame) {
        cancelAnimationFrame(this.pendingAnimationFrame);
      }
      // Reset the reflow counter so every new layout request can attempt
      // another full round of measurements. Without this the layout would
      // stop reflowing after the initial MAX_REFLOWS executions, causing
      // stale positions when sections resize or new data arrives.
      this.reflowCount = 0;
      this.pendingAnimationFrame = requestAnimationFrame(() => {
        this.pendingAnimationFrame = undefined;
        this.reflowWithActualHeights();
      });
    });

    // Schedule batched execution during idle time
    if (!this.layoutUpdateScheduled) {
      this.layoutUpdateScheduled = true;
      
      // Use requestIdleCallback if available, otherwise use setTimeout
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => {
          // Execute all queued updates
          this.layoutUpdateQueue.forEach(update => update());
          this.layoutUpdateQueue = [];
          this.layoutUpdateScheduled = false;
        }, { timeout: 100 });
      } else {
        // Fallback to RAF + setTimeout
        requestAnimationFrame(() => {
          setTimeout(() => {
            this.layoutUpdateQueue.forEach(update => update());
            this.layoutUpdateQueue = [];
            this.layoutUpdateScheduled = false;
          }, 0);
        });
      }
    }
  }

  private computeInitialLayout(): void {
    if (this.layoutRafId) {
      cancelAnimationFrame(this.layoutRafId);
      this.layoutRafId = null;
    }
    this.pendingContentHeightCheck = false;
    this.contentUpdateMode = false;
    const resolvedSections = this.sections ?? [];
    this.reflowCount = 0;
    this.containerHeight = 0;
    this.isLayoutReady = false; // Reset layout ready state
    this.lastStructureSignature = this.getStructureSignature(resolvedSections);
    this.lastMeasuredHeights.clear();
    
    // Stack sections vertically initially to prevent overlap
    let cumulativeTop = 0;
    this.positionedSections = resolvedSections.map((section, index) => {
      const sectionKey = this.getSectionKey(section, index);
      const item = {
        section,
        key: sectionKey,
        colSpan: this.getSectionColSpan(section),
        left: '0px',
        top: cumulativeTop,
        width: '100%'
      };
      // Add estimated spacing (will be recalculated with actual heights)
      cumulativeTop += 300 + this.gap;
      
      // Initialize animation state for new sections
      if (!this.sectionAppearanceStates.has(sectionKey)) {
        // Delay marking as entering until after layout is computed
        requestAnimationFrame(() => {
          this.markSectionEntering(sectionKey, index);
          // No need for markForCheck here - batched in markSectionEntering
        });
      }
      
      return item;
    });
    
    this.containerHeight = cumulativeTop;
    this.cdr.markForCheck();
  }

  private applyContentOnlyUpdate(sections: CardSection[]): void {
    if (!this.positionedSections.length) {
      this.computeInitialLayout();
      return;
    }
    const nextSectionsByKey = new Map<string, CardSection>();
    sections.forEach((section, index) => {
      nextSectionsByKey.set(this.getSectionKey(section, index), section);
    });
    // Update sections in place to maintain stable references
    // This prevents unnecessary change detection and blinking
    this.positionedSections.forEach((item, idx) => {
      const updatedSection = nextSectionsByKey.get(item.key) ?? sections[idx] ?? item.section;
      // Update section in place (mutate existing object)
      item.section = updatedSection;
    });
    // No need to recalculate positions - sections expand naturally via CSS
  }

  private scheduleContentHeightCheck(): void {
    if (!this.contentUpdateMode) {
      return;
    }
    if (this.pendingContentHeightCheck && this.layoutRafId) {
      cancelAnimationFrame(this.layoutRafId);
    }
    this.pendingContentHeightCheck = true;
    this.layoutRafId = requestAnimationFrame(() => {
      this.layoutRafId = null;
      const requiresReflow = this.didHeightChangeExceedTolerance();
      if (requiresReflow) {
        this.contentUpdateMode = false;
        this.scheduleLayoutUpdate({ force: true });
      } else {
        this.contentUpdateMode = false;
      }
      this.pendingContentHeightCheck = false;
    });
  }

  private didHeightChangeExceedTolerance(): boolean {
    const items = this.itemRefs?.toArray() ?? [];
    let requiresReflow = false;
    this.positionedSections.forEach((item, index) => {
      const element = items[index]?.nativeElement;
      if (!element) {
        return;
      }
      const newHeight = element.offsetHeight;
      const previousHeight = this.lastMeasuredHeights.get(item.key) ?? newHeight;
      this.lastMeasuredHeights.set(item.key, newHeight);
      if (Math.abs(newHeight - previousHeight) > this.CONTENT_HEIGHT_TOLERANCE) {
        requiresReflow = true;
      }
    });
    return requiresReflow;
  }

  private reflowWithActualHeights(): void {
    if (!this.containerRef?.nativeElement || this.reflowCount >= this.MAX_REFLOWS) {
      return;
    }

    this.contentUpdateMode = false;
    this.reflowCount++;

    const containerElement = this.containerRef.nativeElement;
    if (!containerElement || typeof containerElement.clientWidth === 'undefined') {
      return;
    }

    const containerWidth = containerElement.clientWidth;
    if (!containerWidth) {
      return;
    }

    // Smart responsive column calculation that adapts continuously
    const columns = Math.min(
      this.maxColumns,
      Math.max(1, Math.floor((containerWidth + this.gap) / (this.minColumnWidth + this.gap)))
    );
    
    // Expose column count as CSS custom property for section grids to consume
    if (containerElement.style && typeof containerElement.style.setProperty === 'function') {
      containerElement.style.setProperty('--masonry-columns', columns.toString());
    }
    
    this.emitLayoutInfo(columns, containerWidth);

    const colHeights = Array(columns).fill(0);
    let hasZeroHeights = false;

    const updated: PositionedSection[] = this.positionedSections.map((item, index) => {
      const colSpan = Math.min(item.colSpan, columns);
      let bestColumn = 0;
      let minHeight = Number.MAX_VALUE;

      for (let col = 0; col <= columns - colSpan; col += 1) {
        const height = Math.max(...colHeights.slice(col, col + colSpan));
        if (height < minHeight) {
          minHeight = height;
          bestColumn = col;
        }
      }

      const gapTotal = this.gap * (columns - 1);
      const columnWidthExpr = `calc((100% - ${gapTotal}px) / ${columns})`;
      const widthExpr = colSpan === 1
        ? columnWidthExpr
        : `calc(${columnWidthExpr} * ${colSpan} + ${this.gap * (colSpan - 1)}px)`;
      const leftExpr = `calc((${columnWidthExpr} + ${this.gap}px) * ${bestColumn})`;

      // Get actual rendered height from DOM element
      const itemRefArray = this.itemRefs?.toArray() ?? [];
      const itemElement = itemRefArray[index]?.nativeElement;
      let height = itemElement?.offsetHeight ?? 0;
      
      // If height is 0, try to get the first child's height (the section renderer content)
      if (height === 0 && itemElement?.firstElementChild) {
        height = (itemElement.firstElementChild as HTMLElement).offsetHeight ?? 0;
      }
      
      // Still 0? Use a reasonable minimum
      if (height === 0) {
        height = 200;
        hasZeroHeights = true;
      }

      for (let col = bestColumn; col < bestColumn + colSpan; col += 1) {
        colHeights[col] = minHeight + height + this.gap;
      }

      return {
        ...item,
        colSpan,
        left: leftExpr,
        top: minHeight,
        width: widthExpr
      };
    });

    this.positionedSections = updated;
    this.containerHeight = Math.max(...colHeights, 0);
    const measurementItems = this.itemRefs?.toArray() ?? [];
    updated.forEach((item, index) => {
      const element = measurementItems[index]?.nativeElement;
      const measuredHeight = element?.offsetHeight ?? 0;
      if (measuredHeight > 0) {
        this.lastMeasuredHeights.set(item.key, measuredHeight);
      }
    });
    
    // Mark layout as ready on first successful reflow without zero heights
    if (!hasZeroHeights) {
      this.isLayoutReady = true;
    }
    
    // Force immediate change detection
    this.cdr.markForCheck();
    
    // If we detected zero heights and haven't hit max reflows, try again
    if (hasZeroHeights && this.reflowCount < this.MAX_REFLOWS) {
      setTimeout(() => {
        this.reflowWithActualHeights();
      }, 80);
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

  private getSectionColSpan(section: CardSection): number {
    // Explicit colSpan always takes precedence
    if (section.colSpan) {
      return Math.min(section.colSpan, this.maxColumns);
    }

    const type = (section.type ?? '').toLowerCase();
    const title = (section.title ?? '').toLowerCase();

    if (title.includes('overview') || type === 'overview') {
      return Math.min(2, this.maxColumns);
    }

    if (type === 'project') {
      return 1;
    }

    const fieldCount = section.fields?.length ?? 0;
    const itemCount = section.items?.length ?? 0;
    const descriptionDensity = this.getDescriptionDensity(section.description);
    const baseScore = fieldCount + itemCount + descriptionDensity;

    const thresholds = this.getColSpanThreshold(type);
    if (thresholds.three && baseScore >= thresholds.three) {
      return Math.min(3, this.maxColumns);
    }

    if (baseScore >= thresholds.two) {
      return Math.min(2, this.maxColumns);
    }

    return 1;
  }

  private getColSpanThreshold(type: string): ColSpanThresholds {
    return SECTION_COL_SPAN_THRESHOLDS[type] ?? DEFAULT_COL_SPAN_THRESHOLD;
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

  private getStructureSignature(sections: CardSection[]): string {
    return sections
      .map((section, index) => {
        const fieldCount = section.fields?.length ?? 0;
        const itemCount = section.items?.length ?? 0;
        const colSpan = section.colSpan ?? 0;
        return `${this.getSectionKey(section, index)}:${section.type}:${fieldCount}:${itemCount}:${colSpan}`;
      })
      .join('|');
  }

  private getSectionKey(section: CardSection, index: number): string {
    if (section.id) {
      return section.id;
    }
    const label = section.title || section.type || 'section';
    return `${label}-${index}`;
  }
}
