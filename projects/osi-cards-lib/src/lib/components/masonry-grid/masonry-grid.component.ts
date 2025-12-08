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
import { LoggerService } from '../../services';
import { Breakpoint } from '../../types';
import { generateLeftExpression, generateWidthExpression } from '../../utils/grid-config.util';
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
  @Input() gap = 16; // Increased from 12px for better spacing
  @Input() minColumnWidth = 260;
  @Input() maxColumns = 4; // Allow up to 4 columns for fullscreen and wide screens
  @Input() containerWidth?: number;
  @Input() isStreaming = false;
  @Input() debug = false;

  @Output() sectionEvent = new EventEmitter<SectionRenderEvent>();
  @Output() layoutChange = new EventEmitter<MasonryLayoutInfo>();
  @Output() layoutCompleted = new EventEmitter<{ version: number; height: number }>();
  // Compatibility shim - accepted but ignored in simplified implementation
  @Output() layoutLog = new EventEmitter<LayoutLogEntry>();

  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;
  @ViewChildren('itemRef') itemRefs!: QueryList<ElementRef<HTMLDivElement>>;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly logger = inject(LoggerService);

  positionedSections: PositionedSection[] = [];
  containerHeight = 0;
  currentColumns = 1;
  isLayoutReady = false;

  private resizeObserver?: ResizeObserver;
  private itemResizeObserver?: ResizeObserver;
  private layoutTimeout?: number;
  private resizeThrottleTimeout?: number;
  private itemResizeThrottleTimeout?: number;
  private lastWidth = 0;
  private imageLoadTimers = new Map<string, number>();
  private hasDoneFirstLayout = false;
  private lastMeasuredHeights: number[] = [];

  // State management and guards (Points 17, 45, 46)
  private isLayingOut = false;
  private layoutVersion = 0;
  private layoutCount = 0;
  private layoutWindowStart = Date.now();
  private itemResizeEnabled = false;
  private formatsAdjustedForWidth = false;
  private delayedLayoutScheduled = false;

  // Logging properties
  private logBuffer: Array<{
    timestamp: string;
    level: string;
    message: string;
    data?: unknown;
    source: string;
  }> = [];
  private readonly LOG_SERVER_URL = 'http://localhost:3001/api/logs/save';
  private readonly ENABLE_LOGGING = true; // Set to false to disable logging

  ngAfterViewInit(): void {
    this.setupResizeObserver();
    this.setupItemResizeObserver(); // Watch individual items for height changes
    // Defer first layout until after Angular + browser paint and width is stable
    requestAnimationFrame(() => {
      if (this.getContainerWidth() > 0) {
        this.scheduleLayout();
      } else if (this.sections && this.sections.length > 0) {
        // If container width is 0 but we have sections, still try to layout
        // This can happen if the container hasn't been measured yet
        setTimeout(() => {
          if (this.getContainerWidth() > 0) {
            this.scheduleLayout();
          } else {
            // Last resort: show sections even without proper width measurement
            this.logger.warn('Container width is 0, showing sections with fallback layout', {
              source: 'MasonryGridComponent',
              sectionsCount: this.sections.length,
            });
            this.createFallbackLayout();
          }
        }, 500);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Guard: Don't schedule layout if already laying out (prevents loops)
    if (this.isLayingOut) {
      return;
    }

    if (changes['sections']) {
      // Clear measured heights when sections change - forces re-measurement
      // Only schedule if sections reference actually changed (not just property modifications)
      const prevSections = changes['sections'].previousValue;
      const currSections = changes['sections'].currentValue;
      if (prevSections !== currSections) {
        // If we have sections but no positioned sections, create fallback immediately
        if (currSections && currSections.length > 0 && this.positionedSections.length === 0) {
          this.logger.debug('Sections changed, creating immediate fallback layout', {
            source: 'MasonryGridComponent',
            sectionsCount: currSections.length,
          });
          // Create fallback layout immediately so sections are visible
          this.createFallbackLayout();
          // Then schedule proper layout
          this.scheduleLayout();
        } else {
          this.scheduleLayout();
        }
      }
    }

    if (changes['containerWidth']) {
      const newWidth = changes['containerWidth'].currentValue;
      if (newWidth && newWidth > 0) {
        this.scheduleLayout();
      }
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.itemResizeObserver?.disconnect();
    if (this.layoutTimeout) {
      clearTimeout(this.layoutTimeout);
    }
    if (this.resizeThrottleTimeout) {
      clearTimeout(this.resizeThrottleTimeout);
    }
    if (this.itemResizeThrottleTimeout) {
      clearTimeout(this.itemResizeThrottleTimeout);
    }
    // Clean up image load timers
    this.imageLoadTimers.forEach((timer) => clearTimeout(timer));
    this.imageLoadTimers.clear();
    // Flush any remaining logs before component is destroyed
    if (this.logBuffer.length > 0) {
      this.flushLogs();
    }
  }

  /**
   * Log a message with structured data
   */
  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: unknown): void {
    if (!this.ENABLE_LOGGING) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      source: 'MasonryGridComponent',
    };

    this.logBuffer.push(logEntry);

    // Flush logs more frequently for better visibility
    // Flush immediately on errors, after 10 entries, or every 5 seconds
    if (this.logBuffer.length >= 10 || level === 'error') {
      this.flushLogs();
    } else if (this.logBuffer.length === 1) {
      // Schedule flush after 5 seconds if buffer has entries
      setTimeout(() => {
        if (this.logBuffer.length > 0) {
          this.flushLogs();
        }
      }, 5000);
    }
  }

  /**
   * Flush logs to log server with fallback to localStorage
   */
  private flushLogs(): void {
    if (this.logBuffer.length === 0) return;

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    // Log using LoggerService
    logsToSend.forEach((log) => {
      const context = { source: 'MasonryGridComponent', data: log.data };
      if (log.level === 'error') {
        this.logger.error(log.message, context);
      } else if (log.level === 'warn') {
        this.logger.warn(log.message, context);
      } else if (log.level === 'debug') {
        this.logger.debug(log.message, context);
      } else {
        this.logger.info(log.message, context);
      }
    });

    // Try to send to log server
    fetch(this.LOG_SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logs: logsToSend,
        timestamp: new Date().toISOString(),
        source: 'MasonryGridComponent',
      }),
    })
      .then((response) => {
        if (response.ok) {
          this.logger.info(`Logs saved to server (${logsToSend.length} entries)`, {
            source: 'MasonryGridComponent',
          });
        } else {
          this.logger.warn(
            `Log server returned ${response.status}. Logs are stored in localStorage via LoggerService.`,
            {
              source: 'MasonryGridComponent',
              status: response.status,
            }
          );
        }
      })
      .catch((error) => {
        // Log server not available - LoggerService already saves to localStorage automatically
        this.logger.warn(
          `Log server unavailable: ${error.message}. Logs are stored in localStorage via LoggerService.`,
          {
            source: 'MasonryGridComponent',
            error: error.message,
          }
        );
      });
  }

  /**
   * Calculate layout using ACTUAL measured heights (no estimation)
   * Pure function: reads section data + container width, writes positions + height once
   * Point 1: Never calls scheduleLayout from inside
   */
  private calculateLayout(): void {
    // Point 17: Hard guard - ignore if already laying out
    if (this.isLayingOut) {
      return;
    }

    this.isLayingOut = true;

    try {
      const containerWidth = this.getContainerWidth();
      if (containerWidth <= 0 || !this.sections || this.sections.length === 0) {
        this.positionedSections = [];
        this.containerHeight = 0;
        this.isLayoutReady = true;
        this.layoutVersion++;
        this.layoutCompleted.emit({ version: this.layoutVersion, height: 0 });
        this.cdr.markForCheck();
        return;
      }

      // Ensure positionedSections is populated even if layout hasn't completed
      // This prevents sections from being invisible
      if (this.positionedSections.length === 0 && this.sections.length > 0) {
        this.logger.debug('No positioned sections but sections exist, creating initial layout', {
          source: 'MasonryGridComponent',
          sectionsCount: this.sections.length,
        });
        // Create fallback layout immediately so sections are visible
        this.createFallbackLayout();
        // Reset isLayingOut since we've created the fallback
        this.isLayingOut = false;
        // Then schedule proper layout for better positioning
        this.scheduleLayout();
        return;
      }

      const columns = this.calculateColumns(containerWidth);
      this.currentColumns = columns;

      // Point 20, 48: Minimal logging - only START and complete
      if (this.debug) {
        this.log('info', 'calculateLayout START', {
          sectionsCount: this.sections.length,
          containerWidth,
          containerReady: this.isLayoutReady,
          columns,
          gap: this.gap,
        });
      }

      // Check if we have measured heights already
      const itemRefArray = this.itemRefs?.toArray() ?? [];
      const hasMeasuredHeights = itemRefArray.length === this.sections.length && this.isLayoutReady;

      if (!hasMeasuredHeights) {
        // FIRST PASS: Render sections to measure them
        this.renderSectionsForMeasurement(columns, containerWidth);
      } else {
        // SECOND PASS: Use actual measurements
        this.layoutWithActualHeights(columns, containerWidth);
      }

      // Point 45: Increment layout version after completion
      this.layoutVersion++;
      this.layoutCompleted.emit({ version: this.layoutVersion, height: this.containerHeight });
    } finally {
      this.isLayingOut = false;
    }
  }

  /**
   * FIRST PASS: Render sections off-screen for measurement
   * Point 18: Avoid nested requestAnimationFrame chains
   */
  private renderSectionsForMeasurement(columns: number, containerWidth: number): void {
    // Create positioned sections with temporary positions (will be corrected)
    // Create new array to ensure change detection triggers
    const tempPositionedSections: PositionedSection[] = this.sections.map((section, index) => {
      const key = section.id || `section-${index}`;
      const colSpan = this.getColSpan(section, columns);

      return {
        section,
        key,
        colSpan,
        left: '0px', // Temporary position
        top: index * 300, // Temporary stacked position (increased spacing)
        width: this.generateWidth(columns, colSpan),
      };
    });

    // Assign new array reference to trigger change detection
    this.positionedSections = tempPositionedSections;

    // Set temporary container height
    this.containerHeight = this.sections.length * 300;
    this.isLayoutReady = false; // Not ready yet - still measuring

    // Apply temporary layout
    this.applyLayout(containerWidth);
    // Force change detection to render items for measurement
    this.cdr.detectChanges();

    // Point 18: Single requestAnimationFrame or setTimeout, not nested chains
    requestAnimationFrame(() => {
      // Wait additional time for content to render
      setTimeout(() => {
        this.layoutWithActualHeights(columns, this.getContainerWidth());
      }, 100);
    });

    // Safety fallback: If layout doesn't complete within 2 seconds, show sections anyway
    setTimeout(() => {
      if (!this.isLayoutReady && this.positionedSections.length > 0) {
        this.logger.warn('Layout timeout - showing sections with fallback layout', {
          source: 'MasonryGridComponent',
          sectionsCount: this.positionedSections.length,
        });
        this.isLayoutReady = true;
        this.cdr.markForCheck();
      }
    }, 2000);
  }

  /**
   * SECOND PASS: Layout using actual measured heights from DOM
   * Points 1-10: Pure single-pass layout algorithm
   */
  private layoutWithActualHeights(columns: number, containerWidth: number): void {
    const itemRefArray = this.itemRefs?.toArray() ?? [];

    if (itemRefArray.length === 0) {
      if (this.debug) {
        this.logger.warn('No item refs available for measurement, scheduling layout retry', {
          source: 'MasonryGridComponent',
        });
      }
      // Use scheduleLayout() instead of recursive call to maintain debouncing and prevent infinite loops
      // This aligns with the principle that layout never schedules itself directly
      this.scheduleLayout();
      return;
    }

    // Points 21, 22: Read heights once per section in single pass
    const actualHeights = new Map<string, number>();

    // Point 29: Calculate spans before measuring heights (one-pass width/spans)
    const sectionSpans = new Map<string, number>();
    this.sections.forEach((section, index) => {
      const key = section.id || `section-${index}`;
      sectionSpans.set(key, this.decideSpanForSection(section, columns));
    });

    // Points 21, 22, 23: Single pass height measurement using offsetHeight
    this.positionedSections.forEach((positioned, index) => {
      const element = itemRefArray[index]?.nativeElement;

      if (!element) {
        actualHeights.set(positioned.key, 200);
        return;
      }

      // Point 23: Use offsetHeight, not getBoundingClientRect
      const height = element.offsetHeight;

      // Point 27: Cap minimum heights
      actualHeights.set(positioned.key, Math.max(height, 50));

      // Point 24: Handle slow content loading (but don't schedule from here - Point 1)
      const images = element.querySelectorAll('img');
      const hasUnloadedImages = Array.from(images).some(
        (img) => !(img as HTMLImageElement).complete
      );

      if (hasUnloadedImages && height < 100 && !this.delayedLayoutScheduled) {
        // Will be handled by delayed layout (Point 24)
        this.delayedLayoutScheduled = true;
      }

      if (this.debug) {
        this.logger.debug('Measured height', {
          source: 'MasonryGridComponent',
          section: positioned.section.title,
          height,
        });
      }
    });

    // Point 8: Flat array for colHeights
    const colHeights = new Array(columns).fill(0);

    // Points 5, 6, 7: Single loop over valid columns, calculate span height as max, choose minimal
    // Create new array to ensure change detection triggers
    const newPositionedSections: PositionedSection[] = this.sections.map((section, index) => {
      const key = section.id || `section-${index}`;
      const colSpan = sectionSpans.get(key) || 1;
      const actualHeight = actualHeights.get(key) || this.estimateHeight(section);

      // Point 5: Single loop over valid starting columns
      let bestColumn = 0;
      let bestSpanHeight = Number.POSITIVE_INFINITY;

      for (let col = 0; col <= columns - colSpan; col++) {
        // Point 6: Calculate span height as max of columns in span
        const spanHeight = Math.max(...colHeights.slice(col, col + colSpan));

        // Point 7: Choose column with minimal span height; for ties, pick highest index (rightmost)
        if (spanHeight < bestSpanHeight || (spanHeight === bestSpanHeight && col > bestColumn)) {
          bestSpanHeight = spanHeight;
          bestColumn = col;
        }
      }

      const top = bestSpanHeight;

      // Update column heights
      for (let c = bestColumn; c < bestColumn + colSpan; c++) {
        colHeights[c] = top + actualHeight + this.gap;
      }

      const positioned: PositionedSection = {
        section,
        key,
        colSpan,
        left: this.generateLeft(columns, bestColumn),
        top,
        width: this.generateWidth(columns, colSpan),
      };

      // Per-section logging with documented format
      if (this.debug) {
        this.log('info', 'Position calculated with actual height', {
          section: {
            id: section.id,
            title: section.title,
            type: section.type,
            key: positioned.key,
          },
          position: {
            col: bestColumn,
            colSpan: positioned.colSpan,
            top: positioned.top,
            left: positioned.left,
            width: positioned.width,
          },
          height: {
            actual: actualHeight,
            shortestColumnHeight: bestSpanHeight,
            targetColumn: bestColumn,
          },
          container: {
            width: containerWidth,
            columns,
            gap: this.gap,
          },
        });
      }

      return positioned;
    });

    // CRITICAL: Assign new array reference to trigger change detection
    this.positionedSections = newPositionedSections;

    // Point 9: Compute container height simply
    this.containerHeight = Math.max(...colHeights, 0) + this.gap * 2;
    this.isLayoutReady = true;
    this.hasDoneFirstLayout = true;

    // Point 32: Single format adjustment pass (if needed)
    // NOTE: Do format adaptation BEFORE markForCheck to batch all changes
    if (!this.formatsAdjustedForWidth) {
      this.adaptSectionFormats(actualHeights, containerWidth);
      this.formatsAdjustedForWidth = true;
    }

    // Apply final layout
    this.applyLayout(containerWidth);
    this.emitLayoutInfo(columns, containerWidth);

    // Point 48: Complete logging with full metrics
    // ALWAYS log layout completion (not just in debug mode) for troubleshooting
    const measuredHeights = this.positionedSections.map((pos) => {
      return actualHeights.get(pos.key) || this.estimateHeight(pos.section);
    });

    this.log('info', 'Layout complete with actual heights', {
      sections: this.positionedSections.length,
      sectionsExpected: this.sections.length,
      columns,
      isLayoutReady: this.isLayoutReady,
      container: {
        width: containerWidth,
        height: this.containerHeight,
      },
      columnHeights: [...colHeights],
      measuredHeights,
      positionedSectionsSample: this.positionedSections.slice(0, 3).map((p) => ({
        key: p.key,
        type: p.section.type,
        title: p.section.title,
        top: p.top,
        left: p.left,
        width: p.width,
        colSpan: p.colSpan,
      })),
    });

    // Point 24: Schedule single delayed layout for slow content (only once)
    if (!this.delayedLayoutScheduled) {
      this.delayedLayoutScheduled = true;
      setTimeout(() => {
        if (!this.isLayingOut) {
          this.scheduleLayout();
        }
      }, 500);
    }

    // CRITICAL: Force change detection to ensure DOM updates
    // Use detectChanges() instead of markForCheck() to immediately update the view
    this.cdr.detectChanges();
  }

  /**
   * Create a fallback layout when container width is unavailable
   * This ensures sections are visible even if measurement fails
   */
  private createFallbackLayout(): void {
    if (!this.sections || this.sections.length === 0) {
      this.positionedSections = [];
      this.isLayoutReady = true;
      this.cdr.markForCheck();
      return;
    }

    // Use a reasonable default width for fallback
    const fallbackWidth =
      this.containerWidth ||
      (typeof window !== 'undefined' ? Math.max(window.innerWidth - 80, 260) : 1200);
    const columns = this.calculateColumns(fallbackWidth);

    // Create simple stacked layout
    const rowHeights: number[] = new Array(columns).fill(0);

    this.positionedSections = this.sections.map((section, index) => {
      const key = section.id || `section-${index}`;
      const colSpan = this.getColSpan(section, columns);

      // Find the column with minimum height
      let bestColumn = 0;
      let minHeight: number = rowHeights[0] || 0;
      for (let col = 0; col <= columns - colSpan; col++) {
        const spanHeights = rowHeights.slice(col, col + colSpan);
        const spanHeight = spanHeights.length > 0 ? Math.max(...spanHeights) : 0;
        if (spanHeight < minHeight) {
          minHeight = spanHeight;
          bestColumn = col;
        }
      }

      // Estimate height (will be corrected by actual layout later)
      const estimatedHeight = this.estimateHeight(section);
      const top: number = minHeight; // Ensure top is always a number

      // Update row heights
      for (let c = bestColumn; c < bestColumn + colSpan; c++) {
        rowHeights[c] = top + estimatedHeight + this.gap;
      }

      return {
        section,
        key,
        colSpan,
        left: this.generateLeft(columns, bestColumn),
        top,
        width: this.generateWidth(columns, colSpan),
      };
    });

    this.containerHeight = Math.max(...rowHeights, 0) + this.gap * 2;
    this.currentColumns = columns;
    this.isLayoutReady = true;
    this.hasDoneFirstLayout = true;

    this.logger.info('Created fallback layout', {
      source: 'MasonryGridComponent',
      sectionsCount: this.positionedSections.length,
      columns,
      containerHeight: this.containerHeight,
      fallbackWidth,
    });

    this.applyLayout(fallbackWidth);
    this.cdr.markForCheck();
  }

  /**
   * Get container width with fallback
   * Point 15: No scheduleLayout calls from helper methods
   */
  private getContainerWidth(): number {
    // Explicit input takes priority
    if (this.containerWidth && this.containerWidth > 0) {
      return this.containerWidth;
    }

    const el = this.containerRef?.nativeElement;
    if (!el) {
      // Fallback if element not available yet
      if (typeof window !== 'undefined') {
        return Math.max(window.innerWidth - 80, 260);
      }
      return 1200; // SSR fallback
    }

    // Get content width (excluding padding)
    // With box-sizing: border-box, clientWidth includes padding, so subtract it
    const computedStyle = window.getComputedStyle(el);
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
    const contentWidth = el.clientWidth - paddingLeft - paddingRight;

    // If width is still tiny, return 0 (caller will handle)
    if (contentWidth < 200) {
      return 0;
    }

    return contentWidth;
  }

  /**
   * Point 2: Simple breakpoint function - columns based only on container width, not content
   * Fixed breakpoints: <640px → 1, 640-1023px → 2, ≥1024px → 3 (clamped by maxColumns)
   */
  private calculateColumns(containerWidth: number): number {
    let cols = 1;

    // Simple breakpoints based only on width
    if (containerWidth >= 640) cols = 2;
    if (containerWidth >= 1024) cols = 3;

    // Respect maxColumns limit (typically 3, but can be set higher)
    return Math.min(cols, this.maxColumns || 3);
  }

  /**
   * Points 3, 4: Restrict spans to [1, 2, columns] using preferredSpan
   * Priority: preferredSpan > preferredColumns > colSpan
   * Maps preferredColumns (1|2|3|4) to preferredSpan (1|2|3) by clamping to 3
   */
  private decideSpanForSection(section: CardSection, columns: number): number {
    if (columns === 1) return 1;

    // Priority 1: Check preferredSpan directly (per documentation)
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

    // Priority 2: Map preferredColumns to preferredSpan (clamp to 3) and then clamp to available columns
    // preferredColumns can be 1|2|3|4, but preferredSpan is 1|2|3, so clamp preferredColumns to 3
    if (section.preferredColumns) {
      const preferredSpan = Math.min(section.preferredColumns, 3);
      return Math.min(preferredSpan, columns);
    }

    // Priority 3: Fallback to colSpan if set, but clamp to valid range
    // Point 4: Only allow spans in [1, 2, columns]
    if (section.colSpan && section.colSpan > 0) {
      const clamped = Math.min(section.colSpan, columns);
      // Only allow 1, 2, or columns
      if (clamped === 1 || clamped === 2 || clamped === columns) {
        return clamped;
      }
      // If colSpan is > 2 but < columns, default to 2
      return clamped > 2 ? 2 : 1;
    }

    // Default to 1
    return 1;
  }

  /**
   * Get column span for section (backward compatibility wrapper)
   */
  private getColSpan(section: CardSection, maxColumns: number): number {
    return this.decideSpanForSection(section, maxColumns);
  }

  /**
   * Fallback height estimate using layout hints
   * Only used before real measurement is available
   */
  private estimateHeight(section: CardSection, width?: number | string): number {
    // Use estimatedHeight hint if available
    switch (section.estimatedHeight) {
      case 'short':
        return 300;
      case 'medium':
        return 600;
      case 'tall':
        return 1100;
      default:
        return 600;
    }
  }

  /**
   * Parse width string to number (e.g., "calc(...)" or "300px")
   */
  private parseWidth(width: string): number {
    // Try to extract pixel value
    const pxMatch = width.match(/(\d+)px/);
    if (pxMatch && pxMatch[1]) {
      return parseInt(pxMatch[1], 10);
    }
    // Fallback: try to extract from calc
    const calcMatch = width.match(/calc\(\(100% - \d+px\) \/ \d+/);
    if (calcMatch) {
      const containerWidth = this.getContainerWidth();
      const columns = this.currentColumns;
      return (containerWidth - this.gap * (columns - 1)) / columns;
    }
    return 0;
  }

  /**
   * Get container padding values
   */
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

  /**
   * Adjust left expression to account for container padding
   */
  private adjustLeftForPadding(leftExpr: string, columnIndex: number): string {
    const padding = this.getContainerPadding();
    if (padding.left === 0 && padding.right === 0) {
      return leftExpr; // No padding, return as-is
    }

    if (columnIndex === 0) {
      return `${padding.left}px`;
    }

    // If expression already includes padding, return as-is
    if (leftExpr.includes('padding') || leftExpr.includes(`${padding.left}px`)) {
      return leftExpr;
    }

    // Extract the calculation part and add padding
    // Format: calc(...) -> calc(paddingLeft + ...)
    if (leftExpr.startsWith('calc(')) {
      const inner = leftExpr.slice(5, -1); // Remove calc( and )
      return `calc(${padding.left}px + ${inner})`;
    }

    // If it's a pixel value, add padding
    const pxMatch = leftExpr.match(/(\d+)px/);
    if (pxMatch && pxMatch[1]) {
      const value = parseFloat(pxMatch[1]) + padding.left;
      return `${value}px`;
    }

    return leftExpr;
  }

  /**
   * Adjust width expression to account for container padding
   */
  private adjustWidthForPadding(widthExpr: string): string {
    const padding = this.getContainerPadding();
    if (padding.total === 0) {
      return widthExpr; // No padding, return as-is
    }

    // If expression already accounts for padding, return as-is
    if (widthExpr.includes('padding') || widthExpr.includes(`${padding.total}px`)) {
      return widthExpr;
    }

    // For 100% width, subtract padding
    if (widthExpr === '100%') {
      return `calc(100% - ${padding.total}px)`;
    }

    // For calc expressions, adjust the 100% part
    if (widthExpr.startsWith('calc(')) {
      const inner = widthExpr.slice(5, -1); // Remove calc( and )
      // Replace 100% with (100% - padding)
      const adjusted = inner.replace(/100%/g, `calc(100% - ${padding.total}px)`);
      return `calc(${adjusted})`;
    }

    return widthExpr;
  }

  /**
   * Generate left CSS expression
   * Accounts for container padding - uses content width (100% minus padding)
   */
  private generateLeft(columns: number, columnIndex: number): string {
    const padding = this.getContainerPadding();
    return generateLeftExpression(columns, columnIndex, this.gap, padding.left);
  }

  /**
   * Generate width CSS expression
   * Accounts for container padding - uses content width (100% minus padding)
   */
  private generateWidth(columns: number, colSpan: number): string {
    const padding = this.getContainerPadding();
    return generateWidthExpression(columns, colSpan, this.gap, padding.total);
  }

  /**
   * Apply layout to DOM
   */
  private applyLayout(containerWidth: number): void {
    const container = this.containerRef?.nativeElement;
    if (!container) return;

    container.style.height = `${this.containerHeight}px`;
    container.style.position = 'relative';

    const colWidth = (containerWidth - this.gap * (this.currentColumns - 1)) / this.currentColumns;
    container.style.setProperty('--masonry-columns', this.currentColumns.toString());
    container.style.setProperty('--masonry-gap', `${this.gap}px`);
    container.style.setProperty('--masonry-column-width', `${colWidth}px`);

    // Toggle a CSS class so the first layout has no transitions
    if (!this.hasDoneFirstLayout) {
      container.classList.remove('masonry-container--animated');
    } else {
      container.classList.add('masonry-container--animated');
    }
  }

  /**
   * Setup resize observer for container width changes
   */
  private setupResizeObserver(): void {
    if (!this.containerRef || typeof ResizeObserver === 'undefined') {
      return;
    }

    let lastResizeTime = 0;
    const RESIZE_THROTTLE_MS = 100; // Throttle resize events

    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const newWidth = entry.contentRect.width;
      if (newWidth <= 0) return;

      const widthDiff = Math.abs(newWidth - this.lastWidth);

      // Only trigger if width changed significantly (more than 10px)
      if (widthDiff > 10) {
        const now = Date.now();

        // Throttle rapid resize events
        if (now - lastResizeTime < RESIZE_THROTTLE_MS) {
          // Clear pending resize and schedule new one
          if (this.resizeThrottleTimeout) {
            clearTimeout(this.resizeThrottleTimeout);
          }
          this.resizeThrottleTimeout = window.setTimeout(() => {
            this.lastWidth = newWidth;
            this.scheduleLayout();
            this.resizeThrottleTimeout = undefined;
          }, RESIZE_THROTTLE_MS);
          return;
        }

        lastResizeTime = now;
        this.lastWidth = newWidth;
        this.scheduleLayout();
      }
    });

    this.resizeObserver.observe(this.containerRef.nativeElement);
  }

  /**
   * Setup resize observer for individual items (cards) to detect height changes
   * Point 16: Gate behind itemResizeEnabled flag and debounce calls
   */
  private setupItemResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    // Point 16: Gate behind flag - if disabled, don't set up observer at all
    if (!this.itemResizeEnabled) {
      return;
    }

    let lastItemResizeTime = 0;
    const ITEM_RESIZE_THROTTLE_MS = 200; // Throttle item resize events more aggressively

    this.itemResizeObserver = new ResizeObserver((entries) => {
      // Don't process if already laying out
      if (this.isLayingOut) {
        return;
      }

      let needsLayout = false;

      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        const prev = Number(el.dataset.prevHeight || '0');
        const next = entry.contentRect.height;

        // Only trigger on significant height changes (more than 24px)
        if (Math.abs(next - prev) > 24) {
          el.dataset.prevHeight = String(next);
          needsLayout = true;

          if (this.debug) {
            this.logger.debug('Item height changed, scheduling re-layout', {
              source: 'MasonryGridComponent',
              heightChange: next - prev,
              newHeight: next,
              oldHeight: prev,
            });
          }
        }
      }

      // Point 16: Throttle and debounce item resize calls
      if (needsLayout) {
        const now = Date.now();

        // Throttle rapid item resize events
        if (now - lastItemResizeTime < ITEM_RESIZE_THROTTLE_MS) {
          // Clear pending resize and schedule new one
          if (this.itemResizeThrottleTimeout) {
            clearTimeout(this.itemResizeThrottleTimeout);
          }
          this.itemResizeThrottleTimeout = window.setTimeout(() => {
            this.scheduleLayout();
            this.itemResizeThrottleTimeout = undefined;
          }, ITEM_RESIZE_THROTTLE_MS);
          return;
        }

        lastItemResizeTime = now;
        this.scheduleLayout();
      }
    });

    const observeAll = () => {
      // Double-check flag before observing
      if (!this.itemResizeEnabled) {
        return;
      }
      this.itemRefs.forEach((ref) => {
        const el = ref.nativeElement;
        if (el) {
          el.dataset.prevHeight = String(el.offsetHeight || 0);
          this.itemResizeObserver?.observe(el);
        }
      });
    };

    observeAll();
    this.itemRefs.changes.subscribe(() => observeAll());
  }

  /**
   * Schedule layout with debouncing
   * Point 13: Debounce with 150-300ms timeout
   * Point 14: Cancel pending timer before creating new one
   * Point 17: Hard guard - ignore if already laying out
   * Point 46: Debug guard for excessive layouts
   */
  private scheduleLayout(): void {
    // Point 17: Hard guard - ignore if already laying out
    if (this.isLayingOut) {
      return;
    }

    // Point 46: Debug guard - if more than 3 layouts in 500ms, log warning and ignore
    // More aggressive throttling to prevent excessive layout requests
    const now = Date.now();
    const windowDuration = now - this.layoutWindowStart;

    // Reset window if more than 500ms has passed (shorter window for faster recovery)
    if (windowDuration > 500) {
      this.layoutCount = 0;
      this.layoutWindowStart = now;
    }

    // Check BEFORE incrementing to prevent the threshold from being exceeded
    // Allow max 3 requests per 500ms window
    if (this.layoutCount >= 3) {
      // Only log warning if we're actually blocking (not just at threshold)
      if (this.layoutCount === 3) {
        this.logger.warn(
          `[MasonryGrid] Excessive layout requests detected (${this.layoutCount + 1} in ${windowDuration}ms). Ignoring further requests.`,
          {
            source: 'MasonryGridComponent',
            layoutCount: this.layoutCount + 1,
            windowDuration,
          }
        );
      }
      return;
    }

    // Increment after check
    this.layoutCount++;

    // Point 14: Cancel pending timer before creating new one
    if (this.layoutTimeout) {
      clearTimeout(this.layoutTimeout);
    }

    // Point 13: Debounce with 300ms (within 150-300ms range)
    // Increased debounce time to reduce frequency of actual layout calculations
    this.layoutTimeout = window.setTimeout(() => {
      this.layoutTimeout = undefined;
      this.calculateLayout();
    }, 300);
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
    if (width < 576) return 'xs';
    if (width < 768) return 'sm';
    if (width < 992) return 'md';
    if (width < 1200) return 'lg';
    return 'xl';
  }

  /**
   * Derive column index (0..columns-1) from left CSS value
   */
  private columnIndexFromLeft(left: string | undefined, columns: number): number {
    if (!left) return 0;

    // Handle "0px" case
    if (left === '0px') return 0;

    // Parse simplified calc format: calc(((100% - gap) / columns) * columnIndex + gapOffset)
    // Pattern: calc(((100% - Npx) / M) * K + Npx) where K is columnIndex
    const match = left.match(/\*\s*(\d+)\s*\+/);
    if (match && match[1]) {
      const colIndex = parseInt(match[1], 10);
      return Math.min(colIndex, columns - 1);
    }

    // Fallback: try to parse as pixel value
    const pxMatch = left.match(/(\d+)px/);
    if (pxMatch && pxMatch[1]) {
      const px = parseInt(pxMatch[1], 10);
      if (px === 0) return 0;
      const containerWidth = this.getContainerWidth();
      if (containerWidth <= 0) return 0;
      const totalGap = this.gap * (columns - 1);
      const colWidth = (containerWidth - totalGap) / columns;
      return Math.min(Math.floor(px / (colWidth + this.gap)), columns - 1);
    }

    return 0;
  }

  /**
   * Get height for a positioned section by key
   */
  private getHeightForKey(key: string | undefined): number {
    if (!key) return 200;
    const positioned = this.positionedSections.find((p) => p.key === key);
    if (!positioned) return 200;
    // Try to get from itemRefs
    const index = this.positionedSections.indexOf(positioned);
    const itemRefArray = this.itemRefs?.toArray() ?? [];
    const element = itemRefArray[index]?.nativeElement;
    if (element) {
      return element.offsetHeight || 200;
    }
    return 200;
  }

  /**
   * Points 30-36: Format adaptation - view-level flags only, simple thresholds, one-way
   */
  private adaptSectionFormats(actualHeights: Map<string, number>, containerWidth: number): void {
    // Point 32: Single cheap pass, only once per width
    this.positionedSections.forEach((p) => {
      const height = actualHeights.get(p.key);
      if (!height) return;

      // Point 33: Simple threshold rule
      // Point 34: One-way adaptation - once compact, stay compact
      if (
        height > 900 &&
        p.section.canCompact &&
        !p.section.compactMode &&
        !(p.section as any).compactModeLocked
      ) {
        p.section.compactMode = true;
        (p.section as any).compactModeLocked = true; // Lock it in

        if (this.debug) {
          this.logger.debug('Section switched to compact mode', {
            source: 'MasonryGridComponent',
            sectionTitle: p.section.title,
            height,
          });
        }
      }
    });
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
