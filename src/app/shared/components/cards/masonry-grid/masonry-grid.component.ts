import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, QueryList, SimpleChanges, ViewChild, ViewChildren, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardSection } from '../../../../models';
import { SectionRendererComponent, SectionRenderEvent } from '../section-renderer/section-renderer.component';

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
  @Input() gap = 12;
  @Input() minColumnWidth = 200;

  @Output() sectionEvent = new EventEmitter<SectionRenderEvent>();

  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;
  @ViewChildren('itemRef') itemRefs!: QueryList<ElementRef<HTMLDivElement>>;

  private readonly cdr = inject(ChangeDetectorRef);

  positionedSections: PositionedSection[] = [];
  containerHeight = 0;

  private resizeObserver?: ResizeObserver;
  private itemObserver?: ResizeObserver;
  private pendingAnimationFrame?: number;
  private reflowCount = 0;
  private readonly MAX_REFLOWS = 3;
  private resizeThrottleTimeout?: number;
  private readonly RESIZE_THROTTLE_MS = 150;

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
    
    // Single delayed reflow to ensure content is fully rendered
    setTimeout(() => {
      this.reflowWithActualHeights();
    }, 150);
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
    this.positionedSections = resolvedSections.map((section, index) => ({
      section,
      key: section.id ?? `${section.title}-${index}`,
      colSpan: this.getSectionColSpan(section),
      left: '0px',
      top: 0,
      width: '100%'
    }));
    
    // Don't schedule update here - let ngAfterViewInit handle it
    this.cdr.markForCheck();
    this.scheduleLayoutUpdate();
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

    const columns = Math.max(
      1,
      Math.floor((containerWidth + this.gap) / (this.minColumnWidth + this.gap))
    );

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
    
    // Force immediate change detection
      this.cdr.markForCheck();
    
    // If we detected zero heights and haven't hit max reflows, try again
    if (hasZeroHeights && this.reflowCount < this.MAX_REFLOWS) {
      setTimeout(() => {
        this.reflowWithActualHeights();
      }, 100);
    }
  }

  private getSectionColSpan(section: CardSection): number {
    if (section.colSpan) {
      return section.colSpan;
    }

    if (section.preferredColumns) {
      return section.preferredColumns;
    }

    const type = (section.type ?? '').toLowerCase();
    const title = (section.title ?? '').toLowerCase();

    // Overview sections: full width
    if (title.includes('overview')) {
      return 2;
    }

    // Media-heavy sections: wider
    switch (type) {
      case 'map':
      case 'chart':
        return 2;
      case 'financials':
      case 'analytics':
      case 'network-card':
        return 1;
      default:
        return 1;
    }
  }
}
