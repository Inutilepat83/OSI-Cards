import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, QueryList, SimpleChanges, ViewChild, ViewChildren, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardSection } from '../../../../models';
import { SectionRendererComponent, SectionRenderEvent } from '../section-renderer/section-renderer.component';
import { Breakpoint, getBreakpointFromWidth } from '../../../utils/responsive.util';

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

  @Output() sectionEvent = new EventEmitter<SectionRenderEvent>();
  @Output() layoutChange = new EventEmitter<MasonryLayoutInfo>();

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
  private readonly RESIZE_THROTTLE_MS = 100; // Faster response
  private lastLayoutInfo?: MasonryLayoutInfo;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sections']) {
      this.computeInitialLayout();
      this.cdr.markForCheck();
    }
  }

  ngAfterViewInit(): void {
    this.computeInitialLayout();
    this.observeContainer();
    this.observeItems();
    
    // Multiple reflows to ensure proper layout
    // First reflow: immediate
    requestAnimationFrame(() => {
      this.reflowWithActualHeights();
      
      // Second reflow: after 50ms (for lazy-loaded content)
      setTimeout(() => {
        this.reflowWithActualHeights();
        
        // Third reflow: after 150ms (for images/heavy content)
        setTimeout(() => {
          this.reflowWithActualHeights();
          // Mark layout as ready after final reflow
          this.isLayoutReady = true;
          this.cdr.markForCheck();
        }, 150);
      }, 50);
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.itemObserver?.disconnect();
    if (this.pendingAnimationFrame) {
      cancelAnimationFrame(this.pendingAnimationFrame);
    }
    if (this.resizeThrottleTimeout) {
      clearTimeout(this.resizeThrottleTimeout);
    }
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
  }

  private computeInitialLayout(): void {
    const resolvedSections = this.sections ?? [];
    this.reflowCount = 0;
    this.containerHeight = 0;
    this.isLayoutReady = false; // Reset layout ready state
    
    // Stack sections vertically initially to prevent overlap
    let cumulativeTop = 0;
    this.positionedSections = resolvedSections.map((section, index) => {
      const item = {
        section,
        key: section.id ?? `${section.title}-${index}`,
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
    this.cdr.markForCheck();
  }

  private reflowWithActualHeights(): void {
    if (!this.containerRef || this.reflowCount >= this.MAX_REFLOWS) {
      return;
    }

    this.reflowCount++;

    const containerWidth = this.containerRef.nativeElement.clientWidth;
    if (!containerWidth) {
      return;
    }

    // Smart responsive column calculation that adapts continuously
    const columns = Math.min(
      this.maxColumns,
      Math.max(1, Math.floor((containerWidth + this.gap) / (this.minColumnWidth + this.gap)))
    );
    
    // Expose column count as CSS custom property for section grids to consume
    this.containerRef.nativeElement.style.setProperty('--masonry-columns', columns.toString());
    
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
}
