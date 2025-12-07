import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren,
  ViewEncapsulation,
} from '@angular/core';
import { CardSection } from '../../models';
import { Breakpoint } from '../../types';
import {
  SectionRendererComponent,
  SectionRenderEvent,
} from '../section-renderer/section-renderer.component';

interface PositionedSection {
  section: CardSection;
  key: string;
  colSpan: number;
  left: string;
  top: number;
  width: string;
}

export interface MasonryLayoutInfo {
  breakpoint: Breakpoint;
  columns: number;
  containerWidth: number;
}

// Compatibility shim for tests - layoutLog output (never emits, compatibility only)
export interface LayoutLogEntry {
  event: string;
  timestamp: number;
  columns: number;
  containerWidth: number;
  sections: unknown[];
}

@Component({
  selector: 'app-masonry-grid',
  standalone: true,
  imports: [CommonModule, SectionRendererComponent],
  templateUrl: './masonry-grid.component.html',
  styleUrls: ['./masonry-grid.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MasonryGridComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() sections: CardSection[] = [];
  @Input() gap = 12;
  @Input() minColumnWidth = 260;
  @Input() maxColumns = 4;
  @Input() containerWidth?: number;
  @Input() isStreaming = false;
  @Input() debug = false;

  @Output() sectionEvent = new EventEmitter<SectionRenderEvent>();
  @Output() layoutChange = new EventEmitter<MasonryLayoutInfo>();
  // Compatibility shim - accepted but ignored in simplified implementation
  @Output() layoutLog = new EventEmitter<LayoutLogEntry>();

  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;
  @ViewChildren('itemRef') itemRefs!: QueryList<ElementRef<HTMLDivElement>>;

  private readonly cdr = inject(ChangeDetectorRef);

  positionedSections: PositionedSection[] = [];
  containerHeight = 0;
  currentColumns = 1;
  isLayoutReady = false;

  private resizeObserver?: ResizeObserver;
  private layoutTimeout?: number;
  private lastWidth = 0;

  ngAfterViewInit(): void {
    this.setupResizeObserver();
    this.calculateLayout();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.sections || changes.containerWidth) {
      this.scheduleLayout();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.layoutTimeout) {
      clearTimeout(this.layoutTimeout);
    }
  }

  /**
   * SINGLE layout calculation method - no incremental updates
   * Simple, predictable, fast enough
   */
  private calculateLayout(): void {
    const containerWidth = this.getContainerWidth();
    if (containerWidth <= 0 || !this.sections || this.sections.length === 0) {
      this.positionedSections = [];
      this.containerHeight = 0;
      this.isLayoutReady = true;
      this.cdr.markForCheck();
      return;
    }

    const columns = this.calculateColumns(containerWidth);
    this.currentColumns = columns;

    // Calculate column width
    const colWidth = (containerWidth - this.gap * (columns - 1)) / columns;

    // Initialize column heights
    const colHeights = new Array(columns).fill(0);

    // Position sections using simple "shortest column" algorithm
    this.positionedSections = this.sections.map((section, index) => {
      const key = section.id || `section-${index}`;
      const colSpan = this.getColSpan(section, columns);

      // Find shortest column that can fit this span
      let bestColumn = 0;
      let minHeight = Infinity;

      for (let col = 0; col <= columns - colSpan; col++) {
        let maxHeight = 0;
        for (let c = col; c < col + colSpan; c++) {
          maxHeight = Math.max(maxHeight, colHeights[c] || 0);
        }
        if (maxHeight < minHeight) {
          minHeight = maxHeight;
          bestColumn = col;
        }
      }

      const top = minHeight;
      const height = this.estimateHeight(section);

      // Update column heights
      for (let c = bestColumn; c < bestColumn + colSpan; c++) {
        colHeights[c] = top + height + this.gap;
      }

      // Generate CSS expressions
      const left = this.generateLeft(columns, bestColumn);
      const width = this.generateWidth(columns, colSpan);

      return {
        section,
        key,
        colSpan,
        left,
        top,
        width,
      };
    });

    this.containerHeight = Math.max(...colHeights, 0);
    this.isLayoutReady = true;

    // Apply to DOM
    this.applyLayout(containerWidth);

    // Emit layout info
    this.emitLayoutInfo(columns, containerWidth);

    this.cdr.markForCheck();
  }

  /**
   * Get container width with fallback
   */
  private getContainerWidth(): number {
    if (this.containerWidth && this.containerWidth > 0) {
      return this.containerWidth;
    }

    const container = this.containerRef?.nativeElement;
    if (!container) {
      return typeof window !== 'undefined' ? window.innerWidth - 80 : 1200;
    }

    const rect = container.getBoundingClientRect();
    return rect.width || container.clientWidth || container.offsetWidth || 1200;
  }

  /**
   * Calculate responsive columns
   */
  private calculateColumns(containerWidth: number): number {
    const possibleCols = Math.floor((containerWidth + this.gap) / (this.minColumnWidth + this.gap));
    return Math.max(1, Math.min(possibleCols, this.maxColumns));
  }

  /**
   * Get column span for section
   */
  private getColSpan(section: CardSection, maxColumns: number): number {
    if (section.colSpan && section.colSpan > 0) {
      return Math.min(section.colSpan, maxColumns);
    }

    const type = (section.type || '').toLowerCase();

    if (type === 'overview' || type === 'header') {
      return Math.min(4, maxColumns);
    }
    if (type === 'chart' || type === 'analytics' || type === 'gallery') {
      return Math.min(2, maxColumns);
    }

    return 1;
  }

  /**
   * Estimate section height
   */
  private estimateHeight(section: CardSection): number {
    const baseHeight = 200;
    const itemCount = (section.items?.length || 0) + (section.fields?.length || 0);
    const descriptionLines = section.description ? Math.ceil(section.description.length / 60) : 0;

    return baseHeight + itemCount * 40 + descriptionLines * 20;
  }

  /**
   * Generate left CSS expression
   */
  private generateLeft(columns: number, columnIndex: number): string {
    if (columnIndex === 0) {
      return '0px';
    }
    const colWidth = `calc((100% - ${this.gap * (columns - 1)}px) / ${columns})`;
    return `calc((${colWidth} + ${this.gap}px) * ${columnIndex})`;
  }

  /**
   * Generate width CSS expression
   */
  private generateWidth(columns: number, colSpan: number): string {
    const colWidth = `calc((100% - ${this.gap * (columns - 1)}px) / ${columns})`;
    if (colSpan === 1) {
      return colWidth;
    }
    return `calc((${colWidth} * ${colSpan}) + ${this.gap * (colSpan - 1)}px)`;
  }

  /**
   * Apply layout to DOM
   */
  private applyLayout(containerWidth: number): void {
    const container = this.containerRef?.nativeElement;
    if (!container) {
      return;
    }

    container.style.height = `${this.containerHeight}px`;
    container.style.position = 'relative';

    const colWidth = (containerWidth - this.gap * (this.currentColumns - 1)) / this.currentColumns;
    container.style.setProperty('--masonry-columns', this.currentColumns.toString());
    container.style.setProperty('--masonry-gap', `${this.gap}px`);
    container.style.setProperty('--masonry-column-width', `${colWidth}px`);
  }

  /**
   * Setup resize observer
   */
  private setupResizeObserver(): void {
    if (!this.containerRef || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      const newWidth = entry.contentRect.width;
      if (newWidth <= 0) {
        return;
      }

      const widthDiff = Math.abs(newWidth - this.lastWidth);
      if (widthDiff > 10) {
        this.lastWidth = newWidth;
        this.scheduleLayout();
      }
    });

    this.resizeObserver.observe(this.containerRef.nativeElement);
  }

  /**
   * Schedule layout with debouncing
   */
  private scheduleLayout(): void {
    if (this.layoutTimeout) {
      clearTimeout(this.layoutTimeout);
    }

    this.layoutTimeout = window.setTimeout(() => {
      this.layoutTimeout = undefined;
      this.calculateLayout();
    }, 150);
  }

  /**
   * Emit layout info
   */
  private emitLayoutInfo(columns: number, containerWidth: number): void {
    const breakpoint = this.getBreakpoint(containerWidth);
    this.layoutChange.emit({ columns, containerWidth, breakpoint });
  }

  /**
   * Get breakpoint from width
   */
  private getBreakpoint(width: number): Breakpoint {
    if (width < 576) {
      return 'xs';
    }
    if (width < 768) {
      return 'sm';
    }
    if (width < 992) {
      return 'md';
    }
    if (width < 1200) {
      return 'lg';
    }
    return 'xl';
  }

  /**
   * Track by function for ngFor
   */
  trackBySection = (index: number, item: PositionedSection): string => {
    return item.key;
  };

  /**
   * Handle section events
   */
  onSectionEvent(event: SectionRenderEvent): void {
    this.sectionEvent.emit(event);
  }

  /**
   * Get section ID for accessibility
   */
  getSectionId(section: CardSection): string {
    return `section-${section.id || section.title?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`;
  }
}
