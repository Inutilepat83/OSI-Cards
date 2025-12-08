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
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { CardSection } from '../../models';
import { LoggerService } from '../../services';
import { Breakpoint } from '../../types';
import { calculateColumns } from '../../utils/grid-config.util';
import {
  SectionRendererComponent,
  SectionRenderEvent,
} from '../section-renderer/section-renderer.component';

interface SectionWithSpan {
  section: CardSection;
  key: string;
  colSpan: number;
}

export interface MasonryLayoutInfo {
  breakpoint: Breakpoint;
  columns: number;
  containerWidth: number;
}

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
  @Input() gap = 16;
  @Input() minColumnWidth = 260;
  @Input() maxColumns = 4;
  @Input() containerWidth?: number;
  @Input() isStreaming = false;
  @Input() debug = false;

  @Output() sectionEvent = new EventEmitter<SectionRenderEvent>();
  @Output() layoutChange = new EventEmitter<MasonryLayoutInfo>();
  @Output() layoutCompleted = new EventEmitter<{ version: number; height: number }>();
  @Output() layoutLog = new EventEmitter<LayoutLogEntry>();

  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly logger = inject(LoggerService);
  private readonly ngZone = inject(NgZone);

  sectionsWithSpan: SectionWithSpan[] = [];
  currentColumns = 1;
  isLayoutReady = false;

  private resizeObserver?: ResizeObserver;
  private resizeThrottleTimeout?: number;
  private lastWidth = 0;
  private layoutVersion = 0;

  ngAfterViewInit(): void {
    this.setupResizeObserver();
    this.updateLayout();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['sections'] ||
      changes['containerWidth'] ||
      changes['gap'] ||
      changes['minColumnWidth'] ||
      changes['maxColumns']
    ) {
      this.updateLayout();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.resizeThrottleTimeout) {
      clearTimeout(this.resizeThrottleTimeout);
    }
  }

  private calculateColumns(containerWidth: number): number {
    return calculateColumns(containerWidth, {
      minColumnWidth: this.minColumnWidth,
      maxColumns: this.maxColumns,
      gap: this.gap,
    });
  }

  private decideSpanForSection(section: CardSection, columns: number): number {
    if (columns === 1) return 1;

    const preferredSpan = section.preferredSpan;
    if (
      preferredSpan !== undefined &&
      preferredSpan !== null &&
      typeof preferredSpan === 'number' &&
      preferredSpan >= 1 &&
      preferredSpan <= 3
    ) {
      return Math.min(preferredSpan, columns);
    }

    if (section.preferredColumns) {
      const preferredSpan = Math.min(section.preferredColumns, 3);
      return Math.min(preferredSpan, columns);
    }

    if (section.colSpan && section.colSpan > 0) {
      const clamped = Math.min(section.colSpan, columns);
      if (clamped === 1 || clamped === 2 || clamped === columns) {
        return clamped;
      }
      return clamped > 2 ? 2 : 1;
    }

    return 1;
  }

  private getContainerWidth(): number {
    if (this.containerWidth && this.containerWidth > 0) {
      return this.containerWidth;
    }

    const el = this.containerRef?.nativeElement;
    if (!el) {
      if (typeof window !== 'undefined') {
        return Math.max(window.innerWidth - 80, 260);
      }
      return 1200;
    }

    const computedStyle = window.getComputedStyle(el);
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
    const contentWidth = el.clientWidth - paddingLeft - paddingRight;

    if (contentWidth < 200) {
      return 0;
    }

    return contentWidth;
  }

  private getBreakpoint(width: number): Breakpoint {
    if (width < 576) return 'xs';
    if (width < 768) return 'sm';
    if (width < 992) return 'md';
    if (width < 1200) return 'lg';
    return 'xl';
  }

  private updateLayout(): void {
    const containerWidth = this.getContainerWidth();

    if (containerWidth <= 0 || !this.sections || this.sections.length === 0) {
      this.sectionsWithSpan = [];
      this.currentColumns = 1;
      this.isLayoutReady = false;
      this.cdr.markForCheck();
      return;
    }

    const columns = this.calculateColumns(containerWidth);
    this.currentColumns = columns;

    this.sectionsWithSpan = this.sections.map((section, index) => {
      const key = section.id || `section-${index}`;
      const colSpan = this.decideSpanForSection(section, columns);
      return {
        section,
        key,
        colSpan,
      };
    });

    this.isLayoutReady = true;
    this.layoutVersion++;

    const breakpoint = this.getBreakpoint(containerWidth);
    this.layoutChange.emit({ columns, containerWidth, breakpoint });
    this.layoutCompleted.emit({ version: this.layoutVersion, height: 0 });

    this.applyLayout(containerWidth, columns);

    this.cdr.markForCheck();
  }

  private applyLayout(containerWidth: number, columns: number): void {
    const container = this.containerRef?.nativeElement;
    if (!container) return;

    const padding = this.getContainerPadding();
    const contentWidth = containerWidth - padding.total;
    const colWidth = (contentWidth - this.gap * (columns - 1)) / columns;

    container.style.setProperty('--masonry-columns', columns.toString());
    container.style.setProperty('--masonry-gap', `${this.gap}px`);
    container.style.setProperty('--masonry-column-width', `${colWidth}px`);
  }

  private getContainerPadding(): { left: number; right: number; total: number } {
    const el = this.containerRef?.nativeElement;
    if (!el) {
      return { left: 0, right: 0, total: 0 };
    }
    const computedStyle = window.getComputedStyle(el);
    const left = parseFloat(computedStyle.paddingLeft) || 0;
    const right = parseFloat(computedStyle.paddingRight) || 0;
    return { left, right, total: left + right };
  }

  private setupResizeObserver(): void {
    if (!this.containerRef || typeof ResizeObserver === 'undefined') {
      return;
    }

    let lastResizeTime = 0;
    const RESIZE_THROTTLE_MS = 100;

    this.ngZone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;

        const newWidth = entry.contentRect.width;
        if (newWidth <= 0) return;

        const widthDiff = Math.abs(newWidth - this.lastWidth);

        if (widthDiff > 10) {
          const now = Date.now();

          if (now - lastResizeTime < RESIZE_THROTTLE_MS) {
            if (this.resizeThrottleTimeout) {
              clearTimeout(this.resizeThrottleTimeout);
            }
            this.resizeThrottleTimeout = window.setTimeout(() => {
              this.lastWidth = newWidth;
              this.ngZone.run(() => this.updateLayout());
              this.resizeThrottleTimeout = undefined;
            }, RESIZE_THROTTLE_MS);
            return;
          }

          lastResizeTime = now;
          this.lastWidth = newWidth;
          this.ngZone.run(() => this.updateLayout());
        }
      });

      this.resizeObserver.observe(this.containerRef.nativeElement);
    });
  }

  trackBySection = (index: number, item: SectionWithSpan): string => {
    return item.key;
  };

  onSectionEvent(event: SectionRenderEvent): void {
    this.sectionEvent.emit(event);
  }

  getSectionId(section: CardSection): string {
    return `section-${section.id || section.title?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`;
  }
}
