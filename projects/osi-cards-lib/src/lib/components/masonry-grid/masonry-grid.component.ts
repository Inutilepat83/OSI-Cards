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
import { MasonryTransformService } from '../../services/masonry-transform.service';
import { SectionLayoutPreferenceService } from '../../services/section-layout-preference.service';
import { Breakpoint } from '../../types';
import {
  calculateColumns,
  generateLeftExpression,
  generateWidthExpression,
} from '../../utils/grid-config.util';
import {
  SectionRendererComponent,
  SectionRenderEvent,
} from '../section-renderer/section-renderer.component';

interface SectionWithSpan {
  section: CardSection;
  key: string;
  colSpan: number;
  layoutVariant?: string;
  displayOrder: number;
  estimatedHeight?: number;
  // Absolute positioning for polyfill mode
  left?: string;
  top?: number;
  transform?: string;
  width?: string;
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
  @Input() gap = 12;
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
  private readonly layoutPreferenceService = inject(SectionLayoutPreferenceService);
  private readonly masonryTransformService = inject(MasonryTransformService);

  sectionsWithSpan: SectionWithSpan[] = [];
  currentColumns = 1;
  isLayoutReady = false;
  gridMode: 'native' | 'absolute-polyfill' = 'native';

  private resizeObserver?: ResizeObserver;
  private resizeThrottleTimeout?: number;
  private lastWidth = 0;
  private layoutVersion = 0;
  private itemResizeObservers = new Map<HTMLElement, ResizeObserver>();
  private absolutePositionUpdateRafId: number | null = null;
  private lastColumnCount = 0;
  private lastSectionHash = '';
  private itemKeyMap = new Map<HTMLElement, string>(); // Map DOM element to section key
  private readonly HEIGHT_THRESHOLD = 5; // Ignore height changes below this (px)

  ngAfterViewInit(): void {
    this.detectGridMode();
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
    this.cleanupAbsolutePositionPolyfill();
    if (this.absolutePositionUpdateRafId !== null) {
      cancelAnimationFrame(this.absolutePositionUpdateRafId);
    }
  }

  private calculateColumns(containerWidth: number): number {
    return calculateColumns(containerWidth, {
      minColumnWidth: this.minColumnWidth,
      maxColumns: this.maxColumns,
      gap: this.gap,
    });
  }

  /**
   * Detect grid mode: native masonry or absolute positioning polyfill
   */
  private detectGridMode(): void {
    if (typeof CSS !== 'undefined' && CSS.supports('grid-template-rows', 'masonry')) {
      this.gridMode = 'native';
    } else {
      this.gridMode = 'absolute-polyfill';
    }
  }

  /**
   * Smart span decision using SectionLayoutPreferenceService
   * Integrates min/max columns, preferredColumns, and canShrinkToFill
   */
  private decideSpanForSection(
    section: CardSection,
    columns: number,
    isHybridReorder: boolean = false
  ): number {
    if (columns === 1) return 1;

    // 1. Check explicit overrides first
    if (section.colSpan && section.colSpan > 0) {
      const clamped = Math.min(section.colSpan, columns);
      if (clamped === 1 || clamped === 2 || clamped === columns) {
        return clamped;
      }
      return clamped > 2 ? 2 : 1;
    }

    // 2. Check section's preferredColumns
    if (section.preferredColumns) {
      const preferredSpan = Math.min(section.preferredColumns, 3);
      return Math.min(preferredSpan, columns);
    }

    // 3. Query SectionLayoutPreferenceService for richer preferences
    const preferences = this.layoutPreferenceService.getPreferences(section, columns);
    if (preferences) {
      let span: number = preferences.preferredColumns;

      // Apply min/max constraints
      if (preferences.minColumns !== undefined) {
        span = Math.max(span, preferences.minColumns);
      }
      if (preferences.maxColumns !== undefined) {
        span = Math.min(span, preferences.maxColumns);
      }
      span = Math.min(span, columns);

      // In hybrid mode, allow controlled shrink-to-fill for non-critical sections
      if (isHybridReorder && preferences.canShrinkToFill) {
        const isCritical = section.priority === 'critical' || section.layoutPriority === 1;
        if (!isCritical && preferences.shrinkPriority && preferences.shrinkPriority > 30) {
          // Allow shrinking below preferred for better packing
          span = Math.max(1, Math.min(span, columns));
        }
      }

      // Clamp to valid range (1-4)
      return Math.max(1, Math.min(span, 4));
    }

    // 4. Fallback to default
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

    // Check if we need to recompute (columns changed or sections changed meaningfully)
    const sectionHash = this.computeSectionHash();
    const needsRecompute = columns !== this.lastColumnCount || sectionHash !== this.lastSectionHash;

    if (!needsRecompute && this.sectionsWithSpan.length > 0) {
      // Only update positions if in polyfill mode
      if (this.gridMode === 'absolute-polyfill') {
        this.scheduleAbsolutePositionUpdate();
      }
      return;
    }

    this.lastColumnCount = columns;
    this.lastSectionHash = sectionHash;

    // Apply hybrid reordering
    const orderedSections = this.applyHybridReordering(this.sections, columns);

    // Compute spans and layout variants
    this.sectionsWithSpan = orderedSections.map((section, index) => {
      // Generate key matching MasonryTransformService.getSectionKey() logic
      const key = this.getSectionKey(section, index);
      const colSpan = this.decideSpanForSection(section, columns, true);
      const layoutVariant = this.determineLayoutVariant(section, colSpan, columns);
      const estimatedHeight = this.estimateSectionHeight(section, colSpan);

      return {
        section,
        key,
        colSpan,
        layoutVariant,
        displayOrder: index,
        estimatedHeight,
      };
    });

    this.isLayoutReady = true;
    this.layoutVersion++;

    const breakpoint = this.getBreakpoint(containerWidth);
    this.layoutChange.emit({ columns, containerWidth, breakpoint });
    this.layoutCompleted.emit({ version: this.layoutVersion, height: 0 });

    this.applyLayout(containerWidth, columns);

    // Schedule absolute positioning updates for polyfill mode
    if (this.gridMode === 'absolute-polyfill') {
      // Wait for DOM to update and content to render before measuring
      // Multiple RAF + delay to ensure images/content are loaded
      this.ngZone.runOutsideAngular(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // Additional delay for images/async content
            setTimeout(() => {
              this.updateAbsolutePositions();
              this.observeItemResizes();
            }, 150);
          });
        });
      });
    }

    this.cdr.markForCheck();
  }

  /**
   * Compute a hash of section characteristics to detect meaningful changes
   */
  private computeSectionHash(): string {
    return this.sections
      .map(
        (s) =>
          `${s.id || ''}|${s.type}|${s.fields?.length || 0}|${s.items?.length || 0}|${s.description?.length || 0}`
      )
      .join(';');
  }

  /**
   * Hybrid reordering: keep critical/important sections in order, reorder the rest
   */
  private applyHybridReordering(sections: CardSection[], columns: number): CardSection[] {
    // Group sections by priority
    const criticalSections: Array<{ section: CardSection; originalIndex: number }> = [];
    const reorderableSections: Array<{
      section: CardSection;
      originalIndex: number;
      estimatedHeight: number;
      colSpan: number;
    }> = [];

    sections.forEach((section, index) => {
      const isCritical =
        section.priority === 'critical' ||
        section.priority === 'important' ||
        section.layoutPriority === 1 ||
        section.layoutPriority === 2;

      if (isCritical) {
        criticalSections.push({ section, originalIndex: index });
      } else {
        const colSpan = this.decideSpanForSection(section, columns, false);
        const estimatedHeight = this.estimateSectionHeight(section, colSpan);
        reorderableSections.push({
          section,
          originalIndex: index,
          estimatedHeight,
          colSpan,
        });
      }
    });

    // Reorder non-critical sections: stable sort by height desc, span desc, then original index
    reorderableSections.sort((a, b) => {
      // First by estimated height (desc)
      if (b.estimatedHeight !== a.estimatedHeight) {
        return (b.estimatedHeight || 0) - (a.estimatedHeight || 0);
      }
      // Then by span (desc)
      if (b.colSpan !== a.colSpan) {
        return b.colSpan - a.colSpan;
      }
      // Finally by original index (stability)
      return a.originalIndex - b.originalIndex;
    });

    // Combine: critical sections first (in original order), then reordered sections
    const result: CardSection[] = [];
    criticalSections.forEach((item) => result.push(item.section));
    reorderableSections.forEach((item) => result.push(item.section));

    return result;
  }

  /**
   * Estimate section height for reordering (simple heuristic)
   */
  private estimateSectionHeight(section: CardSection, colSpan: number): number {
    const fieldCount = section.fields?.length || 0;
    const itemCount = section.items?.length || 0;
    const descriptionLength = section.description?.length || 0;

    // Base height
    let height = 100;

    // Add for fields/items
    height += fieldCount * 40;
    height += itemCount * 60;

    // Add for description
    height += Math.min(descriptionLength / 3, 200);

    // Wider sections tend to be shorter (more horizontal space)
    if (colSpan > 1) {
      height = Math.floor(height / (1 + (colSpan - 1) * 0.3));
    }

    return height;
  }

  /**
   * Determine layout variant (compact | default | wide) based on grid context
   */
  private determineLayoutVariant(section: CardSection, colSpan: number, columns: number): string {
    const density = columns / colSpan;
    const isWide = colSpan >= columns * 0.75;
    const isCompact = density > 3 || colSpan === 1;

    if (isWide) {
      return 'wide';
    }
    if (isCompact) {
      return 'compact';
    }
    return 'default';
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

    // Apply grid mode class
    container.classList.remove('masonry-container--native', 'masonry-container--absolute-polyfill');
    container.classList.add(`masonry-container--${this.gridMode}`);
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

  /**
   * Cleanup absolute position polyfill observers
   */
  private cleanupAbsolutePositionPolyfill(): void {
    this.itemResizeObservers.forEach((observer) => observer.disconnect());
    this.itemResizeObservers.clear();
    this.itemKeyMap.clear();
  }

  /**
   * Observe item resizes for absolute position updates
   */
  private observeItemResizes(): void {
    if (this.gridMode !== 'absolute-polyfill') return;

    const container = this.containerRef?.nativeElement;
    if (!container) return;

    const items = container.querySelectorAll<HTMLElement>('.masonry-item');
    items.forEach((item, index) => {
      if (this.itemResizeObservers.has(item)) {
        return; // Already observing
      }

      // Map item to section key
      const sectionWithSpan = this.sectionsWithSpan[index];
      if (sectionWithSpan) {
        this.itemKeyMap.set(item, sectionWithSpan.key);
      }

      // Throttle resize updates to avoid excessive recalculations
      let lastHeight = item.offsetHeight;
      let resizeTimeout: number | null = null;

      const observer = new ResizeObserver(() => {
        const newHeight = item.offsetHeight;
        const heightDiff = Math.abs(newHeight - lastHeight);

        // Only trigger update if height changed significantly
        if (heightDiff < this.HEIGHT_THRESHOLD) {
          return;
        }

        lastHeight = newHeight;

        // Throttle: wait 200ms before updating
        if (resizeTimeout !== null) {
          clearTimeout(resizeTimeout);
        }

        resizeTimeout = window.setTimeout(() => {
          this.scheduleAbsolutePositionUpdate();
          resizeTimeout = null;
        }, 200);
      });

      observer.observe(item);
      this.itemResizeObservers.set(item, observer);
    });
  }

  /**
   * Schedule absolute position update in next RAF (batched)
   */
  private scheduleAbsolutePositionUpdate(): void {
    if (this.absolutePositionUpdateRafId !== null) {
      return; // Already scheduled
    }

    this.ngZone.runOutsideAngular(() => {
      this.absolutePositionUpdateRafId = requestAnimationFrame(() => {
        this.updateAbsolutePositions();
        this.absolutePositionUpdateRafId = null;
      });
    });
  }

  /**
   * Update absolute positions for all items using MasonryTransformService (polyfill mode)
   */
  private updateAbsolutePositions(): void {
    if (this.gridMode !== 'absolute-polyfill') return;

    const container = this.containerRef?.nativeElement;
    if (!container) return;

    const items = Array.from(container.querySelectorAll<HTMLElement>('.masonry-item'));
    if (items.length === 0) return;

    // Ensure items match sections (should already be in sync)
    if (items.length !== this.sectionsWithSpan.length) {
      this.logger.warn(
        `[MasonryGrid] Item count (${items.length}) doesn't match sections (${this.sectionsWithSpan.length})`
      );
      return;
    }

    // Calculate transforms using MasonryTransformService
    const transforms = this.masonryTransformService.calculateTransforms(
      this.sectionsWithSpan.map((s) => s.section),
      items,
      {
        columns: this.currentColumns,
        gap: this.gap,
        containerWidth: this.getContainerWidth(),
      },
      (section, columns) => this.decideSpanForSection(section, columns, true)
    );

    // Apply transforms and positions to items
    items.forEach((item, index) => {
      const sectionWithSpan = this.sectionsWithSpan[index];
      if (!sectionWithSpan) return;

      const position = transforms.get(sectionWithSpan.key);
      if (!position) {
        // Fallback: position item normally if no transform calculated
        return;
      }

      // Calculate left position based on column index and span
      const padding = this.getContainerPadding();
      const leftExpr = generateLeftExpression(
        this.currentColumns,
        position.colIndex,
        this.gap,
        padding.left
      );
      const widthExpr = generateWidthExpression(this.currentColumns, position.colSpan, this.gap, 0);

      // Apply absolute positioning
      // Position items directly at finalTop (service calculates optimal position)
      item.style.position = 'absolute';
      item.style.left = leftExpr;
      item.style.top = `${position.finalTop}px`;
      item.style.width = widthExpr;
      // Use transform only if it's meaningful (for smooth repositioning on resize)
      // For initial positioning, transform should be 'none' or minimal
      item.style.transform = position.transform || 'none';

      // Ensure visibility
      item.style.visibility = 'visible';

      // Update section data structure
      sectionWithSpan.left = leftExpr;
      sectionWithSpan.top = position.finalTop;
      sectionWithSpan.transform = position.transform;
      sectionWithSpan.width = widthExpr;
      sectionWithSpan.colSpan = position.colSpan;
    });

    // Update container height based on max column height
    // Calculate max bottom position (finalTop + item height) for each column
    let maxContainerHeight = 0;
    items.forEach((item, index) => {
      const sectionWithSpan = this.sectionsWithSpan[index];
      if (!sectionWithSpan) return;

      const position = transforms.get(sectionWithSpan.key);
      if (!position) return;

      const itemHeight = item.offsetHeight || 0;
      const itemBottom = position.finalTop + itemHeight;
      if (itemBottom > maxContainerHeight) {
        maxContainerHeight = itemBottom;
      }
    });

    // Add gap at bottom for spacing
    const finalContainerHeight = maxContainerHeight + this.gap;
    container.style.height = `${finalContainerHeight}px`;

    // Trigger change detection so template bindings update
    this.cdr.markForCheck();

    // Debug diagnostics
    if (this.debug) {
      const columnHeights = this.calculateColumnHeights(transforms, items);
      this.logger.debug('Masonry Grid Diagnostics', {
        mode: this.gridMode,
        columns: this.currentColumns,
        items: items.length,
        containerHeight: Math.round(finalContainerHeight),
        columnHeights: columnHeights.map((h) => Math.round(h)),
        gapVariance: Math.max(...columnHeights) - Math.min(...columnHeights),
      });
    }
  }

  /**
   * Generate section key matching MasonryTransformService.getSectionKey() logic
   */
  private getSectionKey(section: CardSection, index: number): string {
    if (section.id) {
      return section.id;
    }
    return `${section.title || 'section'}-${section.type || 'default'}-${index}`;
  }

  /**
   * Calculate actual column heights from transforms and item heights for diagnostics
   */
  private calculateColumnHeights(
    transforms: Map<string, import('../../services/masonry-transform.service').TransformPosition>,
    items: HTMLElement[]
  ): number[] {
    const colHeights = new Array(this.currentColumns).fill(0);

    // Find max height for each column by checking all transforms with actual item heights
    items.forEach((item, index) => {
      const sectionWithSpan = this.sectionsWithSpan[index];
      if (!sectionWithSpan) return;

      const position = transforms.get(sectionWithSpan.key);
      if (!position) return;

      const itemHeight = item.offsetHeight || 0;
      const itemBottom = position.finalTop + itemHeight;
      const endCol = position.colIndex + position.colSpan;

      for (let col = position.colIndex; col < endCol; col++) {
        if (itemBottom > colHeights[col]) {
          colHeights[col] = itemBottom;
        }
      }
    });

    return colHeights;
  }
}
