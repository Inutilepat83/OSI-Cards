import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, QueryList, SimpleChanges, ViewChild, ViewChildren, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardSection } from '../../../../models';
import { SectionRendererComponent, SectionRenderEvent } from '../section-renderer/section-renderer.component';
import { Breakpoint, getBreakpointFromWidth } from '../../../utils/responsive.util';

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
  private readonly MAX_REFLOWS = 3; // Reduced for faster initial layout
  private resizeThrottleTimeout?: number;
  private readonly RESIZE_THROTTLE_MS = 16; // ~1 frame at 60fps for minimal throttling
  private lastLayoutInfo?: MasonryLayoutInfo;
  private rafId?: number;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sections']) {
      this.computeInitialLayout();
      // Schedule immediate layout update for section changes
      this.scheduleLayoutUpdate();
      this.cdr.markForCheck();
    }
  }

  ngAfterViewInit(): void {
    this.computeInitialLayout();
    this.observeContainer();
    this.observeItems();
    
    // Immediate reflow using RAF chain for fastest layout
    requestAnimationFrame(() => {
      this.reflowWithActualHeights();
      requestAnimationFrame(() => {
        this.reflowWithActualHeights();
        // Mark layout as ready after second reflow
        this.isLayoutReady = true;
        this.cdr.markForCheck();
      });
    });
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
    
    // Pre-calculate gap and column width expressions once
    const gapTotal = this.gap * (columns - 1);
    const columnWidthExpr = `calc((100% - ${gapTotal}px) / ${columns})`;

    const updated: PositionedSection[] = this.positionedSections.map((item, index) => {
      const colSpan = Math.min(item.colSpan, columns);
      let bestColumn = 0;
      let minHeight = Number.MAX_VALUE;

      // Optimized: Find best column more efficiently
      for (let col = 0; col <= columns - colSpan; col += 1) {
        let maxColHeight = 0;
        for (let c = col; c < col + colSpan; c++) {
          if (colHeights[c] > maxColHeight) {
            maxColHeight = colHeights[c];
          }
        }
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

      // Get actual rendered height from DOM element
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

  private getSectionColSpan(section: CardSection): number {
    // Explicit colSpan always takes precedence
    if (section.colSpan) {
      return Math.min(section.colSpan, this.maxColumns);
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
      return Math.min(2, this.maxColumns);
    }

    return 1;
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
}
