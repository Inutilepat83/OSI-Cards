import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnDestroy, Output, QueryList, SimpleChanges, ViewChild, ViewChildren, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardSection } from '../../../../models';
import { SectionRendererComponent, SectionRenderEvent } from '../section-renderer/section-renderer.component';
import { Breakpoint, getBreakpointFromWidth } from '../../../utils/responsive.util';
import { SectionTypeResolverService } from '../section-renderer/section-type-resolver.service';
import { AppConfigService } from '../../../../core/services/app-config.service';
import { ErrorBoundaryComponent } from '../../../../core/error-boundary/error-boundary.component';
import { LoggingService } from '../../../../core/services/logging.service';

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
  left: string;
  top: number;
  width: string;
}

/**
 * Masonry Grid Component
 * 
 * Intelligent layout engine that arranges card sections in a responsive masonry grid.
 * 
 * Features:
 * - Responsive column calculation (1-4 columns based on container width)
 * - Dynamic column span calculation based on content density
 * - Staggered animations for section appearance
 * - Real-time layout updates on resize
 * - Optimized performance with RAF batching and throttling
 * 
 * The component uses a sophisticated layout algorithm:
 * 1. Calculates optimal column count based on container width and minColumnWidth
 * 2. Determines column span for each section using density heuristics
 * 3. Positions sections using absolute positioning
 * 4. Reflows layout when sections change or container resizes
 * 
 * @example
 * ```html
 * <app-masonry-grid
 *   [sections]="cardSections"
 *   [gap]="12"
 *   [minColumnWidth]="280"
 *   (sectionEvent)="onSectionEvent($event)"
 *   (layoutChange)="onLayoutChange($event)">
 * </app-masonry-grid>
 * ```
 */
@Component({
  selector: 'app-masonry-grid',
  standalone: true,
  imports: [CommonModule, SectionRendererComponent, ErrorBoundaryComponent],
  templateUrl: './masonry-grid.component.html',
  styleUrls: ['./masonry-grid.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MasonryGridComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() 
  set sections(value: CardSection[]) {
    // Validate sections array
    if (!Array.isArray(value)) {
      this.logger.warn('Invalid sections input: expected array', 'MasonryGridComponent', { value });
      this._sections = [];
      return;
    }
    this._sections = value;
  }
  get sections(): CardSection[] {
    return this._sections;
  }
  private _sections: CardSection[] = [];

  @Input() 
  set gap(value: number) {
    // Validate gap is a positive number
    if (typeof value !== 'number' || value < 0 || !isFinite(value)) {
      this.logger.warn('Invalid gap input: expected positive number', 'MasonryGridComponent', { value });
      this._gap = 12;
      return;
    }
    this._gap = value;
  }
  get gap(): number {
    return this._gap;
  }
  private _gap = 12; // Harmonize with section grid tokens for consistent gutters

  @Input() 
  set minColumnWidth(value: number) {
    // Validate minColumnWidth is a positive number
    if (typeof value !== 'number' || value <= 0 || !isFinite(value)) {
      this.logger.warn('Invalid minColumnWidth input: expected positive number', 'MasonryGridComponent', { value });
      this._minColumnWidth = 260;
      return;
    }
    this._minColumnWidth = value;
  }
  get minColumnWidth(): number {
    return this._minColumnWidth;
  }
  private _minColumnWidth = 260; // Keep cards readable when columns increase

  @Input() 
  set maxColumns(value: number) {
    // Validate maxColumns is a positive integer
    if (typeof value !== 'number' || value <= 0 || !Number.isInteger(value) || !isFinite(value)) {
      this.logger.warn('Invalid maxColumns input: expected positive integer', 'MasonryGridComponent', { value });
      this._maxColumns = 4;
      return;
    }
    this._maxColumns = value;
  }
  get maxColumns(): number {
    return this._maxColumns;
  }
  private _maxColumns = 4; // Allow wider canvases to display four columns for better uniformity

  /**
   * Enable virtual scrolling for large lists
   * When enabled, only sections in or near the viewport are rendered
   */
  @Input() enableVirtualScrolling = false;

  /**
   * Viewport buffer for virtual scrolling (in pixels)
   * Sections within this distance from viewport are rendered
   */
  @Input() virtualScrollBuffer = 500;

  @Output() sectionEvent = new EventEmitter<SectionRenderEvent>();
  @Output() layoutChange = new EventEmitter<MasonryLayoutInfo>();

  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;
  @ViewChildren('itemRef') itemRefs!: QueryList<ElementRef<HTMLDivElement>>;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly typeResolver = inject(SectionTypeResolverService);
  private readonly appConfig = inject(AppConfigService);
  private readonly logger = inject(LoggingService);
  
  /**
   * Check if debug mode is enabled via environment configuration
   */
  private get isDebugMode(): boolean {
    return this.appConfig.LOGGING.ENABLE_DEBUG;
  }

  positionedSections: PositionedSection[] = [];
  visibleSections: PositionedSection[] = []; // Sections visible in viewport (for virtual scrolling)
  containerHeight = 0;
  isLayoutReady = false; // Prevent FOUC (Flash of Unstyled Content)

  private resizeObserver?: ResizeObserver;
  private itemObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private pendingAnimationFrame?: number;
  private reflowCount = 0;
  private readonly MAX_REFLOWS = 3; // Reduced for faster initial layout
  private resizeThrottleTimeout?: number;
  private readonly RESIZE_THROTTLE_MS = 16; // ~1 frame at 60fps for minimal throttling
  private lastLayoutInfo?: MasonryLayoutInfo;
  private rafId?: number;
  private visibleSectionIds = new Set<string>(); // Track visible section IDs
  private scrollListener?: () => void;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sections']) {
      // Ensure sections is always an array and filter out null/undefined
      if (!Array.isArray(this.sections)) {
        this.sections = [];
      }
      
      // Diagnostic logging
      if (this.isDebugMode) {
        this.logger.debug('Sections received', 'MasonryGridComponent', {
          count: this.sections.length,
          sections: this.sections
        });
      }
      
      // Check if structure changed (length change indicates structural change)
      const previousLength = changes['sections'].previousValue?.length ?? 0;
      const currentLength = this.sections.length;
      const structureChanged = previousLength !== currentLength;
      
      // Force recomputation of layout
      this.computeInitialLayout();
      // Schedule immediate layout update for section changes
      this.scheduleLayoutUpdate();
      
      // Only force change detection for structural changes (sections added/removed)
      // For content-only updates, use markForCheck to let Angular handle timing
      if (structureChanged) {
        this.cdr.detectChanges();
      }
      this.cdr.markForCheck();
    }
  }

  ngAfterViewInit(): void {
    this.computeInitialLayout();
    this.observeContainer();
    this.observeItems();
    this.setupIntersectionObserver();
    
    // Force change detection to ensure DOM elements are created
    this.cdr.detectChanges();
    
    // Wait for DOM to be fully ready before first reflow
    requestAnimationFrame(() => {
      // First frame: DOM should be created
      this.cdr.detectChanges();
      requestAnimationFrame(() => {
        // Second frame: DOM should be fully rendered
        this.reflowWithActualHeights();
        requestAnimationFrame(() => {
          // Third frame: Final reflow with actual heights
          this.reflowWithActualHeights();
          this.isLayoutReady = true;
          this.cdr.detectChanges();
          this.cdr.markForCheck();
        });
      });
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.itemObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
      if (this.containerRef?.nativeElement) {
        this.containerRef.nativeElement.removeEventListener('scroll', this.scrollListener);
      }
    }
    if (this.pendingAnimationFrame) {
      cancelAnimationFrame(this.pendingAnimationFrame);
    }
    // Clear memoization cache
    this.colSpanCache.clear();
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    if (this.resizeThrottleTimeout) {
      clearTimeout(this.resizeThrottleTimeout);
    }
  }

  trackItem = (_: number, item: PositionedSection | null | undefined): string => {
    if (!item) {
      return `null-item-${_}`; // Unique identifier for null items
    }
    return item.key ?? `item-${_}`; // Fallback to index if key is missing
  };

  onSectionEvent(event: SectionRenderEvent): void {
    this.sectionEvent.emit(event);
  }

  /**
   * Handle keyboard navigation for sections
   * Allows arrow key navigation between sections
   */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const sections = this.positionedSections;
    if (sections.length === 0) {
      return;
    }

    const currentElement = event.target as HTMLElement;
    const currentSectionElement = currentElement.closest('[id^="section-"]') as HTMLElement;
    
    if (!currentSectionElement) {
      return;
    }

    const currentSectionId = currentSectionElement.id;
    const currentIndex = sections.findIndex(s => this.getSectionId(s.section) === currentSectionId);

    if (currentIndex === -1) {
      return;
    }

    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = (currentIndex + 1) % sections.length;
        break;
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = currentIndex === 0 ? sections.length - 1 : currentIndex - 1;
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = sections.length - 1;
        break;
      default:
        return;
    }

    // Focus the next section
    const nextSectionId = this.getSectionId(sections[nextIndex]?.section);
    const nextSectionElement = document.getElementById(nextSectionId);
    if (nextSectionElement) {
      // Find first focusable element in the section
      const focusable = nextSectionElement.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable) {
        focusable.focus();
      } else {
        nextSectionElement.focus();
      }
    }
  }

  /**
   * Gets a unique section ID for scrolling
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
    return title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private observeContainer(): void {
    if (typeof ResizeObserver === 'undefined' || !this.containerRef) {
      return;
    }
    this.resizeObserver = new ResizeObserver(() => this.throttledScheduleLayoutUpdate());
    this.resizeObserver.observe(this.containerRef.nativeElement);
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

  /**
   * Setup Intersection Observer to defer rendering of sections until visible
   * Improves initial render performance by only rendering visible sections
   */
  private setupIntersectionObserver(): void {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const sectionId = entry.target.getAttribute('id');
          if (sectionId) {
            if (entry.isIntersecting) {
              this.visibleSectionIds.add(sectionId);
            } else {
              this.visibleSectionIds.delete(sectionId);
            }
          }
        });
        // Update visible sections array if virtual scrolling is enabled
        if (this.enableVirtualScrolling) {
          this.updateVisibleSections();
        } else {
          this.cdr.markForCheck();
        }
      },
      {
        rootMargin: '50px' // Start loading 50px before section enters viewport
      }
    );

    // Observe all section items with null checks
    if (this.itemRefs && this.itemRefs.length > 0) {
      this.itemRefs.forEach((item) => {
        if (item?.nativeElement) {
          this.intersectionObserver?.observe(item.nativeElement);
        }
      });
    }

    // Observe new items when they're added
    this.itemRefs.changes.subscribe((items: QueryList<ElementRef<HTMLDivElement>>) => {
      items.forEach((item) => {
        if (item?.nativeElement && !this.visibleSectionIds.has(item.nativeElement.id)) {
          this.intersectionObserver?.observe(item.nativeElement);
        }
      });
    });
  }

  /**
   * Check if a section is visible in viewport
   */
  isSectionVisible(sectionId: string): boolean {
    return this.visibleSectionIds.has(sectionId);
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
        // Update visible sections after reflow if virtual scrolling is enabled
        if (this.enableVirtualScrolling) {
          this.updateVisibleSections();
        }
      });
    });
  }

  /**
   * Compute initial layout for sections
   * 
   * Algorithm Overview:
   * 1. Filters and validates sections (removes null/undefined, ensures required properties)
   * 2. Resolves missing section types using type resolver or inference
   * 3. Creates initial vertical stack to prevent overlap (fast approximation)
   * 4. Uses estimated heights (300px + gap) for initial positioning
   * 5. Refined by reflowWithActualHeights() once actual DOM heights are available
   * 
   * Performance Notes:
   * - Creates shallow copies when adding types to avoid mutating input (important for live edits)
   * - Uses type resolver cache for efficient type resolution
   * - Initial layout is O(n) where n is number of sections
   * 
   * Edge Cases Handled:
   * - Sections without type: resolved via type resolver or inferred from title
   * - Sections without id/title: filtered out with warning
   * - Null/undefined sections: filtered out silently
   */
  private computeInitialLayout(): void {
    const resolvedSections = (this.sections ?? [])
      .filter(section => 
        section != null && 
        typeof section === 'object' && 
        (section.id || section.title || section.type)
      );
    
    // Diagnostic logging
    if (this.isDebugMode) {
      this.logger.debug('Resolved sections after initial filter', 'MasonryGridComponent', {
        count: resolvedSections.length,
        sections: resolvedSections
      });
    }
    
    // Additional validation: ensure section has required properties
    // Use type resolver to get fallback type if section.type is missing
    // IMPORTANT: Create copies of sections when adding missing types to avoid mutating input
    // This preserves live edit functionality and change detection
    const validSections = resolvedSections.map(section => {
      if (!section || typeof section !== 'object') {
        return null;
      }
      
      // Must have at least id, title, or type
      if (!section.id && !section.title && !section.type) {
        if (this.isDebugMode) {
          this.logger.warn('Section filtered out - missing id, title, and type', 'MasonryGridComponent', { section });
        }
        return null;
      }
      
      // If type is missing, create a copy with resolved type to avoid mutating input
      if (!section.type) {
        const resolvedType = this.typeResolver.resolve(section);
        let finalType: CardSection['type'];
        
        if (resolvedType && resolvedType !== 'unknown' && resolvedType !== 'fallback') {
          finalType = resolvedType as CardSection['type'];
          if (this.isDebugMode) {
            this.logger.debug('Resolved missing type for section', 'MasonryGridComponent', {
              sectionTitle: section.title,
              resolvedType
            });
          }
        } else {
          // Try to infer from title or use 'info' as default
          finalType = this.inferSectionType(section);
          if (this.isDebugMode) {
            this.logger.debug('Inferred type for section', 'MasonryGridComponent', {
              sectionTitle: section.title,
              inferredType: finalType
            });
          }
        }
        
        // Create a shallow copy with the resolved type to avoid mutating the original
        // This is important for live edit functionality
        return { ...section, type: finalType };
      }
      
      // Section already has type, return as-is
      return section;
    }).filter((section): section is CardSection => section !== null);
    
    // Diagnostic logging
    if (this.isDebugMode) {
      this.logger.debug('Valid sections after validation', 'MasonryGridComponent', {
        count: validSections.length,
        sections: validSections
      });
      const filteredCount = resolvedSections.length - validSections.length;
      if (filteredCount > 0) {
        this.logger.warn(`Filtered out ${filteredCount} invalid sections`, 'MasonryGridComponent', {
          filteredCount
        });
      }
    }
    
    this.reflowCount = 0;
    this.containerHeight = 0;
    this.isLayoutReady = false; // Reset layout ready state
    
    // Stack sections vertically initially to prevent overlap
    let cumulativeTop = 0;
    this.positionedSections = validSections.map((section, index) => {
      const item: PositionedSection = {
        section,
        key: section.id ?? `${section.title ?? section.type ?? 'section'}-${index}`,
        colSpan: this.getSectionColSpan(section),
        left: '0px',
        top: cumulativeTop,
        width: '100%'
      };
      // Add estimated spacing (will be recalculated with actual heights)
      cumulativeTop += 300 + this.gap;
      return item;
    });
    
    this.containerHeight = cumulativeTop;
    
    // Diagnostic logging
    if (this.isDebugMode) {
      this.logger.debug('Positioned sections', 'MasonryGridComponent', {
        count: this.positionedSections.length,
        containerHeight: this.containerHeight,
        sections: this.positionedSections.map(p => ({
          key: p.key,
          title: p.section.title,
          type: p.section.type
        }))
      });
    }
    
    // Always mark for check to ensure template updates
    this.cdr.markForCheck();
  }
  
  /**
   * Infer section type from section properties when type is missing
   */
  private inferSectionType(section: CardSection): CardSection['type'] {
    // Use type resolver first
    const resolved = this.typeResolver.resolve(section);
    if (resolved && resolved !== 'unknown' && resolved !== 'fallback') {
      return resolved as CardSection['type'];
    }
    
    // Fallback to 'info' as default - it's the most generic section type
    return 'info';
  }

  /**
   * Reflow layout using actual DOM element heights
   * 
   * Core Layout Algorithm (Masonry Grid):
   * 
   * Step 1: Calculate optimal column count
   *   - Formula: columns = min(maxColumns, max(1, floor((containerWidth + gap) / (minColumnWidth + gap))))
   *   - Ensures columns fit within container while respecting minColumnWidth constraint
   * 
   * Step 2: Initialize column heights array
   *   - Tracks current height of each column (starts at 0)
   *   - Used to find shortest column for next section placement
   * 
   * Step 3: For each section, find optimal position
   *   a) Calculate column span (how many columns section occupies)
   *   b) Find best starting column using "shortest column" heuristic:
   *      - For each possible starting position (0 to columns - colSpan)
   *      - Calculate max height across all columns section would occupy
   *      - Choose position with minimum max height (shortest column)
   *   c) Calculate position:
   *      - left: bestColumn * (columnWidth + gap)
   *      - top: max height of columns section occupies
   *      - width: colSpan * columnWidth + (colSpan - 1) * gap
   *   d) Update column heights for occupied columns
   * 
   * Step 4: Update container height
   *   - Set to maximum column height to accommodate all sections
   * 
   * Performance Optimizations:
   * - Pre-calculates gap and column width expressions once
   * - Uses memoized column span calculations
   * - Batches DOM reads/writes using RAF
   * - Retries automatically if heights are zero (DOM not ready)
   * 
   * Edge Cases:
   * - Zero heights: Retries up to MAX_REFLOWS times
   * - DOM mismatch: Waits for DOM to catch up with sections array
   * - Empty sections: Returns early
   * 
   * Time Complexity: O(n * c) where n = sections, c = columns
   * Space Complexity: O(n + c) for positioned sections and column heights
   */
  private reflowWithActualHeights(): void {
    if (!this.containerRef?.nativeElement || this.reflowCount >= this.MAX_REFLOWS) {
      return;
    }

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
    const itemRefArray = this.itemRefs?.toArray() ?? [];
    
    // Guard: If positionedSections exist but DOM elements don't, wait for next frame
    if (this.positionedSections.length > 0 && itemRefArray.length === 0) {
      // DOM hasn't rendered yet, schedule retry
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.reflowWithActualHeights();
        });
      });
      return;
    }
    
    // Ensure itemRefArray length matches positionedSections length
    if (itemRefArray.length !== this.positionedSections.length) {
      // Mismatch - wait for DOM to catch up
      requestAnimationFrame(() => {
        this.reflowWithActualHeights();
      });
      return;
    }
    
    // Pre-calculate gap and column width expressions once
    const gapTotal = this.gap * (columns - 1);
    const columnWidthExpr = `calc((100% - ${gapTotal}px) / ${columns})`;

    const updated: PositionedSection[] = this.positionedSections
      .filter(item => item != null && item.section != null)
      .map((item, index) => {
      const colSpan = Math.min(item.colSpan, columns);
      let bestColumn = 0;
      let minHeight = Number.MAX_VALUE;

      /**
       * Shortest Column Algorithm:
       * 
       * For each possible starting column position (0 to columns - colSpan):
       * 1. Calculate the maximum height across all columns the section would occupy
       * 2. Choose the position with the minimum maximum height
       * 
       * This ensures sections are placed in the shortest available space,
       * minimizing gaps and creating a balanced masonry layout.
       * 
       * Example: If colSpan=2 and columns=4, we check positions:
       * - Position 0: columns [0,1] -> max height
       * - Position 1: columns [1,2] -> max height
       * - Position 2: columns [2,3] -> max height
       * Choose position with minimum max height
       */
      for (let col = 0; col <= columns - colSpan; col += 1) {
        let maxColHeight = 0;
        // Find maximum height across all columns this section would occupy
        for (let c = col; c < col + colSpan; c++) {
          if (colHeights[c] > maxColHeight) {
            maxColHeight = colHeights[c];
          }
        }
        // Update best position if this is shorter
        if (maxColHeight < minHeight) {
          minHeight = maxColHeight;
          bestColumn = col;
        }
      }

      // Calculate width and left expressions
      const widthExpr = colSpan === 1
        ? columnWidthExpr
        : `calc(${columnWidthExpr} * ${colSpan} + ${this.gap * (colSpan - 1)}px)`;
      const leftExpr = `calc((${columnWidthExpr} + ${this.gap}px) * ${bestColumn})`;

      // Safe access with null check
      const itemElement = itemRefArray[index]?.nativeElement;
      let height = 0;
      
      if (!itemElement) {
        // Element doesn't exist, use estimated height
        height = 200;
        hasZeroHeights = true;
      } else {
        height = itemElement.offsetHeight ?? 0;
        
        // If height is 0, try to get the first child's height (the section renderer content)
        if (height === 0 && itemElement.firstElementChild) {
          height = (itemElement.firstElementChild as HTMLElement).offsetHeight ?? 0;
        }
        
        // Still 0? Use a reasonable minimum
        if (height === 0) {
          height = 200;
          hasZeroHeights = true;
        }
      }

      // Update column heights
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
    
    // Mark layout as ready on first successful reflow without zero heights
    if (!hasZeroHeights) {
      this.isLayoutReady = true;
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
   * Calculate column span for a section based on content density
   * 
   * Uses heuristics to determine how many columns a section should span:
   * - Field count + item count + description density = base score
   * - Compares score against thresholds for section type
   * - Returns 1, 2, or 3 columns (up to maxColumns)
   * 
   * Special cases:
   * - Project sections always span 1 column
   * - Explicit colSpan in section config takes precedence
   * 
   * @param section - The section to calculate colSpan for
   * @returns Column span (1-3, up to maxColumns)
   */
  // Memoized colSpan calculation
  private colSpanCache = new Map<string, number>();
  
  private getSectionColSpan(section: CardSection): number {
    // Create cache key from section properties
    const cacheKey = `${section.type}-${section.title}-${section.colSpan}-${this.maxColumns}`;
    
    if (this.colSpanCache.has(cacheKey)) {
      return this.colSpanCache.get(cacheKey)!;
    }
    // Explicit colSpan always takes precedence
    if (section.colSpan) {
      const result = Math.min(section.colSpan, this.maxColumns);
      this.colSpanCache.set(cacheKey, result);
      return result;
    }

    const type = (section.type ?? '').toLowerCase();
    const title = (section.title ?? '').toLowerCase();

    if (type === 'project') {
      return 1;
    }

    const fieldCount = section.fields?.length ?? 0;
    const itemCount = section.items?.length ?? 0;
    const descriptionDensity = this.getDescriptionDensity(section.description);
    const baseScore = fieldCount + itemCount + descriptionDensity;

    // Get thresholds from section's meta (set during normalization)
    // This allows each section to have its own column logic
    const thresholds = this.getColSpanThresholds(section);
    if (thresholds.three && baseScore >= thresholds.three) {
      return Math.min(3, this.maxColumns);
    }

    if (baseScore >= thresholds.two) {
      const result = Math.min(2, this.maxColumns);
      this.colSpanCache.set(cacheKey, result);
      return result;
    }

    const result = 1;
    this.colSpanCache.set(cacheKey, result);
    return result;
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
   * Update visible sections array based on visible section IDs
   * Filters positionedSections to only include sections that are in the viewport
   * Used for virtual scrolling to reduce DOM elements
   */
  private updateVisibleSections(): void {
    if (!this.enableVirtualScrolling) {
      return;
    }

    // Filter positioned sections to only include those with visible IDs
    this.visibleSections = this.positionedSections.filter(item => {
      const sectionId = this.getSectionId(item.section);
      return this.visibleSectionIds.has(sectionId);
    });

    this.cdr.markForCheck();
  }
}
