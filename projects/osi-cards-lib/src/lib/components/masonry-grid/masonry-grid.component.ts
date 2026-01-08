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
  @Input() gap = 8;
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
  private lastContainerWidth = 0;
  private layoutVersion = 0;
  private itemResizeObservers = new Map<HTMLElement, ResizeObserver>();
  private absolutePositionUpdateRafId: number | null = null;
  private lastColumnCount = 0;
  private lastSectionHash = '';
  private itemKeyMap = new Map<HTMLElement, string>(); // Map DOM element to section key
  private readonly HEIGHT_THRESHOLD = 5; // Ignore height changes below this (px)
  private initialLayoutPollingTimeout?: ReturnType<typeof setTimeout>;
  private itemElements = new Map<string, HTMLElement>(); // Cache element references by section key
  private cachedPadding: { left: number; right: number; total: number } | null = null;
  private isFirstCalculation = true;
  private isFirstPositioning = true;
  private animationMonitorInterval?: ReturnType<typeof setInterval>;
  private previousSectionKeys = new Set<string>(); // Track previous sections to detect new ones

  ngAfterViewInit(): void {
    this.detectGridMode();
    this.setupResizeObserver();

    // Force initial layout calculation with proper timing
    // Steps:
    // 1. Render items in natural flow first (not absolutely positioned)
    // 2. Wait for DOM to render and items to have heights
    // 3. Measure all item heights
    // 4. Only then switch to absolute positioning
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(() => {
              // Force layout calculation even if width is already known
              const containerWidth = this.getContainerWidth();
              if (containerWidth > 0 && this.sections?.length > 0) {
                // Clear cache to force recalculation
                this.cachedPadding = null;
                // Validate prerequisites before layout
                const prerequisites = this.validateLayoutPrerequisites();
                if (prerequisites.valid) {
                  this.ngZone.run(() => {
                    // Trigger layout calculation
                    this.updateLayout();

                    // For absolute polyfill mode, ensure items are measured before positioning
                    if (this.gridMode === 'absolute-polyfill') {
                      // Wait additional time for items to render and have heights
                      setTimeout(() => {
                        const container = this.containerRef?.nativeElement;
                        if (container) {
                          const items = Array.from(
                            container.querySelectorAll<HTMLElement>('.masonry-item')
                          );
                          // Check if all items have valid heights
                          const allItemsHaveHeights = items.every((item) => {
                            const offsetHeight = item.offsetHeight || 0;
                            const rectHeight = item.getBoundingClientRect().height || 0;
                            return Math.max(offsetHeight, rectHeight) > 0;
                          });

                          if (allItemsHaveHeights) {
                            // Items are ready, trigger positioning
                            this.updateAbsolutePositions();
                          } else {
                            // Items not ready yet, retry after longer delay
                            setTimeout(() => {
                              this.ngZone.run(() => this.updateAbsolutePositions());
                            }, 200);
                          }
                        }
                      }, 150);
                    }
                  });
                } else {
                  // If prerequisites invalid, retry after delay
                  setTimeout(() => {
                    this.cachedPadding = null;
                    this.ngZone.run(() => this.updateLayout());
                  }, 100);
                }
              } else {
                // If width not ready, use ensureInitialLayout as fallback
                this.ngZone.run(() => this.ensureInitialLayout());
              }
            }, 50);
          });
        });
      });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['sections'] ||
      changes['containerWidth'] ||
      changes['gap'] ||
      changes['minColumnWidth'] ||
      changes['maxColumns']
    ) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'masonry-grid.component.ts:189',
          message: 'ngOnChanges: sections changed',
          data: {
            sectionsChanged: !!changes['sections'],
            sectionsCount: this.sections?.length || 0,
            prevSectionsCount: changes['sections']?.previousValue?.length || 0,
            isStreaming: this.isStreaming,
            streamingChanged: !!changes['isStreaming'],
            prevStreaming: changes['isStreaming']?.previousValue,
            timestamp: Date.now(),
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'animation-debug',
          hypothesisId: 'A',
        }),
      }).catch(() => {});
      // #endregion

      // If streaming stopped, clean up any stuck animations
      if (changes['isStreaming'] && !this.isStreaming && changes['isStreaming'].previousValue) {
        this.cleanupStuckAnimations();
      }

      // Clear cached padding when container width or gap changes to force recalculation
      if (changes['containerWidth'] || changes['gap']) {
        this.cachedPadding = null;
        // Reset first calculation flags if gap changes
        if (changes['gap']) {
          this.isFirstCalculation = true;
          this.isFirstPositioning = true;
        }
      }
      this.updateLayout();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.resizeThrottleTimeout) {
      clearTimeout(this.resizeThrottleTimeout);
    }
    if (this.initialLayoutPollingTimeout) {
      clearTimeout(this.initialLayoutPollingTimeout);
    }
    if (this.animationMonitorInterval) {
      clearInterval(this.animationMonitorInterval);
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
        const isCritical = section.priority === 1 || section.layoutPriority === 1;
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
      // Don't use window fallback - return 0 to force retry mechanism
      return 0;
    }

    const computedStyle = window.getComputedStyle(el);
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
    const contentWidth = el.clientWidth - paddingLeft - paddingRight;

    // Only return 0 if truly invalid - don't use window fallback here
    // This forces the retry mechanism to wait for actual container width
    if (contentWidth < 200) {
      return 0; // Force retry mechanism
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

    // Validate layout prerequisites (padding and gap) before first layout
    const prerequisites = this.validateLayoutPrerequisites();

    // On first calculation, if padding or gap is invalid, force recalculation with longer delay
    if (this.isFirstCalculation && !prerequisites.valid) {
      this.isFirstCalculation = false; // Prevent infinite loop
      this.ngZone.runOutsideAngular(() => {
        // Use multiple RAF cycles + longer timeout for first calculation
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setTimeout(() => {
                // Clear cache to force recalculation
                this.cachedPadding = null;
                // Retry layout calculation
                this.ngZone.run(() => this.updateLayout());
              }, 200);
            });
          });
        });
      });
      return;
    }

    // Mark that first calculation is complete
    if (this.isFirstCalculation) {
      this.isFirstCalculation = false;
    }

    const columns = this.calculateColumns(containerWidth);
    const sectionHash = this.computeSectionHash();

    // Check if container width changed (even if columns didn't)
    const widthChanged = Math.abs(containerWidth - this.lastContainerWidth) > 1;

    // Early exit: nothing changed (including width)
    if (
      columns === this.lastColumnCount &&
      sectionHash === this.lastSectionHash &&
      this.sectionsWithSpan.length > 0 &&
      !widthChanged
    ) {
      // Only update positions if in polyfill mode (items may have resized)
      if (this.gridMode === 'absolute-polyfill') {
        this.scheduleAbsolutePositionUpdate();
      }
      return; // Already done, skip expensive calculations
    }

    // If sections changed significantly, reset first calculation flags to ensure padding/gap are recalculated
    if (sectionHash !== this.lastSectionHash) {
      this.isFirstCalculation = true;
      this.isFirstPositioning = true;
      this.cachedPadding = null; // Clear padding cache when sections change
    }

    this.currentColumns = columns;

    this.lastColumnCount = columns;
    this.lastSectionHash = sectionHash;
    this.lastContainerWidth = containerWidth;

    // Clear element cache when sections change
    this.clearItemElementCache();

    // Detect new sections for animation
    const currentSectionKeys = new Set(this.sections.map((s, idx) => this.getSectionKey(s, idx)));
    const newSectionKeys = new Set(
      Array.from(currentSectionKeys).filter((key) => !this.previousSectionKeys.has(key))
    );

    // #region agent log
    if (newSectionKeys.size > 0) {
      fetch('http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'masonry-grid.component.ts:updateLayout',
          message: 'New sections detected',
          data: {
            newSectionKeys: Array.from(newSectionKeys),
            previousCount: this.previousSectionKeys.size,
            currentCount: currentSectionKeys.size,
            isStreaming: this.isStreaming,
            timestamp: Date.now(),
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'animation-debug',
          hypothesisId: 'A',
        }),
      }).catch(() => {});
    }
    // #endregion

    // Update previous keys AFTER marking animations (so we can detect new ones)
    this.previousSectionKeys = currentSectionKeys;

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

    // Mark new sections for animation after layout and DOM update
    // Use multiple delays to ensure DOM is ready
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            this.markNewSectionsForAnimation();
          }, 100);
        });
      });
    });

    // #region agent log - Check animation class state after layout update
    if (typeof window !== 'undefined' && this.containerRef?.nativeElement) {
      setTimeout(() => {
        const container = this.containerRef.nativeElement;
        const items = container.querySelectorAll<HTMLElement>('.masonry-item');
        const animationStates = Array.from(items).map((item, idx) => ({
          index: idx,
          hasAnimating: item.classList.contains('masonry-item--animating'),
          hasAnimated: item.classList.contains('masonry-item--animated'),
          dataAnimated: item.getAttribute('data-animated'),
          computedAnimation: window.getComputedStyle(item).animation,
          computedAnimationName: window.getComputedStyle(item).animationName,
        }));

        fetch('http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'masonry-grid.component.ts:437',
            message: 'After applyLayout: animation class state',
            data: {
              itemsCount: items.length,
              isStreaming: this.isStreaming,
              animationStates,
              timestamp: Date.now(),
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'animation-debug',
            hypothesisId: 'B',
          }),
        }).catch(() => {});
      }, 100);
    }
    // #endregion

    // Schedule absolute positioning updates for polyfill mode
    if (this.gridMode === 'absolute-polyfill') {
      // Wait for DOM to update and content to render before measuring
      // Use longer delay for first calculation, shorter for subsequent
      const delay = this.isFirstPositioning ? 200 : 150;
      const rafCycles = this.isFirstPositioning ? 3 : 1;

      this.ngZone.runOutsideAngular(() => {
        let rafCount = 0;
        const runRaf = () => {
          requestAnimationFrame(() => {
            rafCount++;
            if (rafCount < rafCycles) {
              runRaf();
            } else {
              // Additional delay for images/async content
              setTimeout(() => {
                // Validate prerequisites before positioning
                const prerequisites = this.validateLayoutPrerequisites();
                if (!prerequisites.valid && this.isFirstPositioning) {
                  // Retry after longer delay if invalid on first positioning
                  setTimeout(() => {
                    this.cachedPadding = null;
                    this.ngZone.run(() => {
                      this.cacheItemElements();
                      this.updateAbsolutePositions();
                      this.observeItemResizes();
                    });
                  }, 100);
                  return;
                }

                // Cache elements after DOM is ready
                this.cacheItemElements();
                this.updateAbsolutePositions();
                this.observeItemResizes();

                // Mark that first positioning is complete
                if (this.isFirstPositioning) {
                  this.isFirstPositioning = false;
                }

                // #region agent log - Setup animation monitoring
                this.setupAnimationMonitoring();
                // #endregion

                // Add animation classes to new sections
                this.markNewSectionsForAnimation();
              }, delay);
            }
          });
        };
        runRaf();
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
   * Enhanced to better match section heights for gap filling
   */
  private applyHybridReordering(sections: CardSection[], columns: number): CardSection[] {
    // Group sections by priority
    const criticalSections: Array<{
      section: CardSection;
      originalIndex: number;
      estimatedHeight: number;
      colSpan: number;
    }> = [];
    const reorderableSections: Array<{
      section: CardSection;
      originalIndex: number;
      estimatedHeight: number;
      colSpan: number;
    }> = [];

    sections.forEach((section, index) => {
      const isCritical =
        section.priority === 1 ||
        section.priority === 2 ||
        section.layoutPriority === 1 ||
        section.layoutPriority === 2;

      const colSpan = this.decideSpanForSection(section, columns, false);
      const estimatedHeight = this.estimateSectionHeight(section, colSpan);

      if (isCritical) {
        criticalSections.push({ section, originalIndex: index, estimatedHeight, colSpan });
      } else {
        reorderableSections.push({
          section,
          originalIndex: index,
          estimatedHeight,
          colSpan,
        });
      }
    });

    // Enhanced reordering strategy for better gap filling:
    // 1. Group sections by similar heights (within 50px tolerance)
    // 2. Within height groups, sort by span for better distribution
    // 3. Alternate between height groups to create better packing opportunities

    // Sort by height first, then create height-based groups
    reorderableSections.sort((a, b) => {
      // Primary: height (desc) - taller sections first create structure
      if (Math.abs(b.estimatedHeight - a.estimatedHeight) > 50) {
        return (b.estimatedHeight || 0) - (a.estimatedHeight || 0);
      }
      // Secondary: within similar heights, sort by span (desc) for variety
      if (b.colSpan !== a.colSpan) {
        return b.colSpan - a.colSpan;
      }
      // Tertiary: original index (stability)
      return a.originalIndex - b.originalIndex;
    });

    // Interleave sections by height to create better packing opportunities
    // This helps shorter sections fill gaps left by taller ones
    const heightGroups: Array<Array<(typeof reorderableSections)[0]>> = [];
    const HEIGHT_TOLERANCE = 50; // Group sections within 50px of each other

    for (const item of reorderableSections) {
      let placed = false;
      for (const group of heightGroups) {
        if (group.length > 0) {
          const groupAvgHeight =
            group.reduce((sum, i) => sum + i.estimatedHeight, 0) / group.length;
          if (Math.abs(item.estimatedHeight - groupAvgHeight) <= HEIGHT_TOLERANCE) {
            group.push(item);
            placed = true;
            break;
          }
        }
      }
      if (!placed) {
        heightGroups.push([item]);
      }
    }

    // Interleave groups: take one from each group in round-robin fashion
    // This creates better opportunities for gap filling
    const interleaved: typeof reorderableSections = [];
    let maxGroupSize = Math.max(...heightGroups.map((g) => g.length), 0);

    for (let i = 0; i < maxGroupSize; i++) {
      for (const group of heightGroups) {
        const item = group[i];
        if (item) {
          interleaved.push(item);
        }
      }
    }

    // Combine: critical sections first (in original order), then interleaved reorderable sections
    const result: CardSection[] = [];
    criticalSections.forEach((item) => result.push(item.section));
    interleaved.forEach((item) => result.push(item.section));

    return result;
  }

  /**
   * Estimate section height for reordering (enhanced heuristic)
   * More accurate estimation based on section type and content structure
   */
  private estimateSectionHeight(section: CardSection, colSpan: number): number {
    const fieldCount = section.fields?.length || 0;
    const itemCount = section.items?.length || 0;
    const descriptionLength = section.description?.length || 0;
    const titleLength = section.title?.length || 0;

    // Base height varies by section type
    let baseHeight = 80; // Reduced base for more accurate estimation
    let height = baseHeight;

    // Section type-specific adjustments
    switch (section.type) {
      case 'gallery':
        // Gallery: images with captions
        baseHeight = 60;
        height = baseHeight;
        // Each gallery item: image (120px) + caption (36px) + gap
        height += itemCount * 160;
        break;
      case 'social-media':
        // Social media: compact cards
        baseHeight = 50;
        height = baseHeight;
        // Each social card: ~125px min-height
        height += fieldCount * 130;
        break;
      case 'overview':
      case 'financials':
        // Wide sections with more content
        baseHeight = 120;
        height = baseHeight;
        height += fieldCount * 50;
        height += itemCount * 70;
        break;
      case 'chart':
        // Charts have fixed aspect ratios
        baseHeight = 100;
        height = baseHeight;
        height += 300; // Chart area
        break;
      case 'map':
        // Maps have fixed heights
        baseHeight = 100;
        height = baseHeight;
        height += 250; // Map area
        break;
      case 'contact-card':
      case 'network-card':
        // Compact cards
        baseHeight = 40;
        height = baseHeight;
        height += fieldCount * 35;
        break;
      default:
        // Default: standard sections
        baseHeight = 80;
        height = baseHeight;
        height += fieldCount * 45;
        height += itemCount * 65;
    }

    // Add for header (title + description)
    height += 20; // Header padding
    if (titleLength > 0) {
      height += 24; // Title line
    }
    if (descriptionLength > 0) {
      // Description wraps, estimate based on length and width
      const estimatedLines = Math.ceil(descriptionLength / (colSpan * 50)); // ~50 chars per column
      height += Math.min(estimatedLines * 20, 120); // Max 6 lines
    }

    // Add for fields/items (if not already handled by type)
    if (section.type !== 'gallery' && section.type !== 'social-media') {
      height += fieldCount * 40;
      height += itemCount * 60;
    }

    // Wider sections tend to be shorter (more horizontal space)
    // More aggressive reduction for multi-column spans
    if (colSpan > 1) {
      const reductionFactor = 1 + (colSpan - 1) * 0.4; // Increased from 0.3 to 0.4
      height = Math.floor(height / reductionFactor);
    }

    // Ensure minimum height
    return Math.max(height, 60);
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

    // Use validated prerequisites
    const prerequisites = this.validateLayoutPrerequisites();
    const padding = prerequisites.padding;
    const gap = prerequisites.gap;

    const contentWidth = containerWidth - padding.total;
    const colWidth = (contentWidth - gap * (columns - 1)) / columns;

    container.style.setProperty('--masonry-columns', columns.toString());
    container.style.setProperty('--masonry-gap', `${gap}px`);
    container.style.setProperty('--masonry-column-width', `${colWidth}px`);

    // Apply grid mode class
    container.classList.remove('masonry-container--native', 'masonry-container--absolute-polyfill');
    container.classList.add(`masonry-container--${this.gridMode}`);
  }

  /**
   * Validate layout prerequisites (padding and gap) before calculations
   * Returns validation status and values
   */
  private validateLayoutPrerequisites(): {
    valid: boolean;
    padding: { left: number; right: number; total: number };
    gap: number;
  } {
    const padding = this.getContainerPadding();
    const gap = this.gap > 0 ? this.gap : 12; // Default gap if invalid

    const valid = padding.total > 0 && gap > 0;

    return {
      valid,
      padding,
      gap,
    };
  }

  /**
   * Get container padding with fallback to CSS variable if computed style returns 0
   * Reads padding from parent .ai-card-surface element (not from masonry container)
   * Caches padding value to avoid repeated calculations
   */
  private getContainerPadding(): { left: number; right: number; total: number } {
    const el = this.containerRef?.nativeElement;
    if (!el) {
      return { left: 0, right: 0, total: 0 };
    }

    // Return cached value if available and valid
    if (this.cachedPadding && this.cachedPadding.total > 0) {
      return this.cachedPadding;
    }

    // Try to read padding from parent .ai-card-surface element first
    // The masonry container itself has no padding, but its parent does
    const parentElement = el.closest('.ai-card-surface') as HTMLElement;
    const targetElement = parentElement || el;

    const computedStyle = window.getComputedStyle(targetElement);
    let left = parseFloat(computedStyle.paddingLeft) || 0;
    let right = parseFloat(computedStyle.paddingRight) || 0;

    // If computed style returns 0, try reading CSS variable as fallback
    if (left === 0 || right === 0) {
      const cssVarValue = this.getPaddingFromCSSVariable(targetElement);
      if (cssVarValue > 0) {
        // Use CSS variable value for both left and right if computed style is 0
        if (left === 0) {
          left = cssVarValue;
        }
        if (right === 0) {
          right = cssVarValue;
        }
      }
    }

    const padding = { left, right, total: left + right };

    // Cache padding value if it's valid
    if (padding.total > 0) {
      this.cachedPadding = padding;
    }

    return padding;
  }

  /**
   * Read padding value from CSS variable --osi-card-padding
   * Handles various formats: "16px", "var(--other-var)", etc.
   */
  private getPaddingFromCSSVariable(element: HTMLElement): number {
    try {
      // Try to get CSS variable value from computed styles
      const computedStyle = window.getComputedStyle(element);
      const cssVarValue = computedStyle.getPropertyValue('--osi-card-padding')?.trim();

      if (cssVarValue) {
        // Parse pixel values (e.g., "16px")
        const pixelMatch = cssVarValue.match(/^(\d+(?:\.\d+)?)px$/);
        if (pixelMatch && pixelMatch[1]) {
          return parseFloat(pixelMatch[1]) || 0;
        }

        // If it's a var() reference, try to resolve it
        if (cssVarValue.startsWith('var(')) {
          // Extract variable name and try to get its value
          const varMatch = cssVarValue.match(/var\(--([^)]+)\)/);
          if (varMatch) {
            const resolvedValue = computedStyle.getPropertyValue(`--${varMatch[1]}`)?.trim();
            if (resolvedValue) {
              const resolvedPixelMatch = resolvedValue.match(/^(\d+(?:\.\d+)?)px$/);
              if (resolvedPixelMatch && resolvedPixelMatch[1]) {
                return parseFloat(resolvedPixelMatch[1]) || 0;
              }
            }
          }
        }
      }

      // Fallback: try reading from document root or parent element
      const rootStyle = window.getComputedStyle(document.documentElement);
      const rootVarValue = rootStyle.getPropertyValue('--osi-card-padding')?.trim();
      if (rootVarValue) {
        const rootPixelMatch = rootVarValue.match(/^(\d+(?:\.\d+)?)px$/);
        if (rootPixelMatch && rootPixelMatch[1]) {
          return parseFloat(rootPixelMatch[1]) || 0;
        }
      }

      // Default fallback: 8px (standard card padding)
      return 8;
    } catch (error) {
      // If anything fails, return default
      return 12;
    }
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
              // Update containerWidth input to trigger change detection
              this.containerWidth = newWidth;
              this.ngZone.run(() => this.updateLayout());
              this.resizeThrottleTimeout = undefined;
            }, RESIZE_THROTTLE_MS);
            return;
          }

          lastResizeTime = now;
          this.lastWidth = newWidth;
          // Update containerWidth input to trigger change detection
          this.containerWidth = newWidth;
          this.ngZone.run(() => this.updateLayout());
        }
      });

      this.resizeObserver.observe(this.containerRef.nativeElement);

      // Force initial measurement after longer delay with validation
      this.ngZone.runOutsideAngular(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(() => {
              const el = this.containerRef?.nativeElement;
              // Validate container has real width before calculating
              if (el && el.clientWidth > 0) {
                const width = this.getContainerWidth();
                // Ensure width is valid and reasonable before updating layout
                if (width > 0 && width >= 200 && this.sections?.length > 0) {
                  // Force prerequisites validation before first layout
                  this.cachedPadding = null; // Clear cache to force recalculation
                  const prerequisites = this.validateLayoutPrerequisites();

                  // If prerequisites are invalid, wait a bit more for styles to be ready
                  if (!prerequisites.valid) {
                    setTimeout(() => {
                      this.cachedPadding = null;
                      this.ngZone.run(() => this.updateLayout());
                    }, 200);
                  } else {
                    this.ngZone.run(() => this.updateLayout());
                  }
                }
              }
            }, 200);
          });
        });
      });
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
   * Handle animation end event for masonry items
   * This transitions items from animating to animated state
   */
  onAnimationEnd(event: AnimationEvent, element: HTMLElement, index: number): void {
    // Only handle masonry item animations
    if (
      !event.animationName ||
      (!event.animationName.includes('section-magic-appear') &&
        !event.animationName.includes('masonry-gentle-enter'))
    ) {
      return;
    }

    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'masonry-grid.component.ts:onAnimationEnd',
        message: 'Animation end event fired',
        data: {
          index,
          animationName: event.animationName,
          elapsedTime: event.elapsedTime,
          targetClasses: Array.from(element.classList),
          hasAnimating: element.classList.contains('masonry-item--animating'),
          hasAnimated: element.classList.contains('masonry-item--animated'),
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'animation-debug',
        hypothesisId: 'C',
      }),
    }).catch(() => {});
    // #endregion

    // Transition from animating to animated
    if (element.classList.contains('masonry-item--animating')) {
      element.classList.remove('masonry-item--animating');
      element.classList.add('masonry-item--animated');
      element.setAttribute('data-animated', 'true');

      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'masonry-grid.component.ts:onAnimationEnd',
          message: 'Transitioned to animated state',
          data: {
            index,
            timestamp: Date.now(),
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'animation-debug',
          hypothesisId: 'B',
        }),
      }).catch(() => {});
      // #endregion
    }
  }

  /**
   * Mark new sections with animation class
   * This ensures new sections get the animating class when they first appear
   */
  private markNewSectionsForAnimation(): void {
    if (!this.containerRef?.nativeElement) return;

    const container = this.containerRef.nativeElement;
    const items = container.querySelectorAll<HTMLElement>('.masonry-item');

    // Track which sections we've already marked as animated (persist across renders)
    const animatedSectionKeys = new Set<string>();

    items.forEach((item, idx) => {
      const sectionWithSpan = this.sectionsWithSpan[idx];
      if (!sectionWithSpan) return;

      const sectionKey = sectionWithSpan.key;
      const hasAnimating = item.classList.contains('masonry-item--animating');
      const hasAnimated = item.classList.contains('masonry-item--animated');
      const dataAnimated = item.getAttribute('data-animated') === 'true';

      // Check if this section was previously animated (check data attribute for persistence)
      const wasAnimated = dataAnimated || animatedSectionKeys.has(sectionKey);

      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'masonry-grid.component.ts:markNewSectionsForAnimation',
          message: 'Checking section animation state',
          data: {
            index: idx,
            sectionKey,
            hasAnimating,
            hasAnimated,
            dataAnimated,
            wasAnimated,
            isStreaming: this.isStreaming,
            previousKeysCount: this.previousSectionKeys.size,
            timestamp: Date.now(),
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'animation-debug',
          hypothesisId: 'A',
        }),
      }).catch(() => {});
      // #endregion

      // If already animated, ensure it has the animated class and data attribute
      if (wasAnimated) {
        if (!hasAnimated) {
          item.classList.add('masonry-item--animated');
        }
        if (!dataAnimated) {
          item.setAttribute('data-animated', 'true');
        }
        if (hasAnimating) {
          item.classList.remove('masonry-item--animating');
        }
        animatedSectionKeys.add(sectionKey);
        return;
      }

      // For new sections during streaming: add animating class
      // For non-streaming: skip animation (immediate display)
      if (this.isStreaming && !hasAnimating && !hasAnimated) {
        // Check if this is truly a new section (not in previous keys)
        const isNew = !this.previousSectionKeys.has(sectionKey);

        if (isNew) {
          item.classList.add('masonry-item--animating');

          // Set timeout fallback in case animationend event doesn't fire
          // Animation duration is 0.7s (700ms) for section-magic-appear, add buffer
          setTimeout(() => {
            if (
              item.classList.contains('masonry-item--animating') &&
              !item.classList.contains('masonry-item--animated')
            ) {
              // #region agent log
              fetch('http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  location: 'masonry-grid.component.ts:markNewSectionsForAnimation',
                  message:
                    'Timeout fallback: transitioning to animated (animationend did not fire)',
                  data: {
                    index: idx,
                    sectionKey,
                    timestamp: Date.now(),
                  },
                  timestamp: Date.now(),
                  sessionId: 'debug-session',
                  runId: 'animation-debug',
                  hypothesisId: 'C',
                }),
              }).catch(() => {});
              // #endregion

              item.classList.remove('masonry-item--animating');
              item.classList.add('masonry-item--animated');
              item.setAttribute('data-animated', 'true');
            }
          }, 1000); // 1 second timeout (700ms animation + 300ms buffer)

          // #region agent log
          fetch('http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              location: 'masonry-grid.component.ts:markNewSectionsForAnimation',
              message: 'Added masonry-item--animating class to new section',
              data: {
                index: idx,
                sectionKey,
                timestamp: Date.now(),
              },
              timestamp: Date.now(),
              sessionId: 'debug-session',
              runId: 'animation-debug',
              hypothesisId: 'A',
            }),
          }).catch(() => {});
          // #endregion
        }
      } else if (!this.isStreaming && hasAnimating) {
        // If streaming stopped, clean up animating class
        item.classList.remove('masonry-item--animating');
        if (!hasAnimated) {
          item.classList.add('masonry-item--animated');
          item.setAttribute('data-animated', 'true');
        }
      }
    });
  }

  /**
   * Clean up any stuck animations (items with animating class but no active animation)
   */
  private cleanupStuckAnimations(): void {
    if (!this.containerRef?.nativeElement) return;

    const container = this.containerRef.nativeElement;
    const items = container.querySelectorAll<HTMLElement>('.masonry-item');

    items.forEach((item) => {
      const hasAnimating = item.classList.contains('masonry-item--animating');
      const hasAnimated = item.classList.contains('masonry-item--animated');
      const computedStyle = window.getComputedStyle(item);
      const animationName = computedStyle.animationName;
      const animationPlayState = computedStyle.animationPlayState;

      // If item has animating class but animation is not running or is paused
      if (
        hasAnimating &&
        !hasAnimated &&
        (animationPlayState === 'paused' || animationName === 'none' || !animationName)
      ) {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'masonry-grid.component.ts:cleanupStuckAnimations',
            message: 'Cleaning up stuck animation',
            data: {
              animationName,
              animationPlayState,
              timestamp: Date.now(),
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'animation-debug',
            hypothesisId: 'D',
          }),
        }).catch(() => {});
        // #endregion

        item.classList.remove('masonry-item--animating');
        item.classList.add('masonry-item--animated');
        item.setAttribute('data-animated', 'true');
      }
    });
  }

  /**
   * Monitor animation state periodically to detect stuck animations
   */
  private setupAnimationMonitoring(): void {
    if (this.animationMonitorInterval) {
      clearInterval(this.animationMonitorInterval);
    }

    this.animationMonitorInterval = setInterval(() => {
      if (!this.containerRef?.nativeElement) return;

      const container = this.containerRef.nativeElement;
      const items = container.querySelectorAll<HTMLElement>('.masonry-item');
      const surface = container.closest('.ai-card-surface');
      const hasStreamingActive = surface?.classList.contains('streaming-active');

      const stuckItems: Array<{
        index: number;
        hasAnimating: boolean;
        hasAnimated: boolean;
        animationName: string;
        animationPlayState: string;
        animationDuration: string;
      }> = [];

      items.forEach((item, idx) => {
        const hasAnimating = item.classList.contains('masonry-item--animating');
        const hasAnimated = item.classList.contains('masonry-item--animated');
        const computedStyle = window.getComputedStyle(item);
        const animationName = computedStyle.animationName;
        const animationPlayState = computedStyle.animationPlayState;
        const animationDuration = computedStyle.animationDuration;

        // #region agent log - Check each item's animation state
        fetch('http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'masonry-grid.component.ts:setupAnimationMonitoring',
            message: 'Animation state check',
            data: {
              itemIndex: idx,
              hasAnimating,
              hasAnimated,
              hasStreamingActive,
              animationName,
              animationPlayState,
              animationDuration,
              isStreaming: this.isStreaming,
              timestamp: Date.now(),
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'animation-debug',
            hypothesisId: 'C',
          }),
        }).catch(() => {});
        // #endregion

        // Detect stuck: has animating class but animation is not running or is paused
        if (
          hasAnimating &&
          !hasAnimated &&
          (animationPlayState === 'paused' || animationName === 'none' || !animationName)
        ) {
          stuckItems.push({
            index: idx,
            hasAnimating,
            hasAnimated,
            animationName,
            animationPlayState,
            animationDuration,
          });

          // Auto-fix: Clean up stuck animation
          item.classList.remove('masonry-item--animating');
          item.classList.add('masonry-item--animated');
          item.setAttribute('data-animated', 'true');
        }
      });

      if (stuckItems.length > 0) {
        // #region agent log - Stuck animations detected
        fetch('http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'masonry-grid.component.ts:setupAnimationMonitoring',
            message: 'STUCK ANIMATIONS DETECTED',
            data: {
              stuckCount: stuckItems.length,
              stuckItems,
              hasStreamingActive,
              isStreaming: this.isStreaming,
              timestamp: Date.now(),
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'animation-debug',
            hypothesisId: 'D',
          }),
        }).catch(() => {});
        // #endregion
      }
    }, 500); // Check every 500ms
  }

  /**
   * Cleanup absolute position polyfill observers
   */
  private cleanupAbsolutePositionPolyfill(): void {
    this.itemResizeObservers.forEach((observer) => observer.disconnect());
    this.itemResizeObservers.clear();
    this.itemKeyMap.clear();
    this.itemElements.clear(); // Also clear element cache
  }

  /**
   * Cache element references to avoid repeated querySelectorAll calls
   */
  private cacheItemElements(): void {
    const container = this.containerRef?.nativeElement;
    if (!container) return;

    const items = container.querySelectorAll<HTMLElement>('.masonry-item');
    items.forEach((item, index) => {
      const sectionWithSpan = this.sectionsWithSpan[index];
      if (sectionWithSpan) {
        this.itemElements.set(sectionWithSpan.key, item);
      }
    });
  }

  /**
   * Clear cached element references when sections change
   */
  private clearItemElementCache(): void {
    this.itemElements.clear();
  }

  /**
   * Observe item resizes for absolute position updates
   */
  private observeItemResizes(): void {
    if (this.gridMode !== 'absolute-polyfill') return;

    const container = this.containerRef?.nativeElement;
    if (!container) return;

    // Use cached elements if available, otherwise query DOM
    const items: HTMLElement[] = [];
    if (this.itemElements.size === this.sectionsWithSpan.length) {
      // All elements cached, use them
      this.sectionsWithSpan.forEach((sectionWithSpan) => {
        const element = this.itemElements.get(sectionWithSpan.key);
        if (element) {
          items.push(element);
        }
      });
    } else {
      // Cache not complete, query DOM and update cache
      const queriedItems = container.querySelectorAll<HTMLElement>('.masonry-item');
      items.push(...Array.from(queriedItems));
      this.cacheItemElements();
    }

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
      let lastWidth = item.offsetWidth;
      let resizeTimeout: number | null = null;

      const observer = new ResizeObserver(() => {
        const newHeight = item.offsetHeight;
        const newWidth = item.offsetWidth;
        const heightDiff = Math.abs(newHeight - lastHeight);
        const widthDiff = Math.abs(newWidth - lastWidth);

        // Only trigger update if height or width changed significantly
        if (heightDiff < this.HEIGHT_THRESHOLD && widthDiff < 10) {
          return;
        }

        lastHeight = newHeight;
        lastWidth = newWidth;

        // Throttle: wait 150ms before updating (reduced from 200ms for better responsiveness)
        if (resizeTimeout !== null) {
          clearTimeout(resizeTimeout);
        }

        resizeTimeout = window.setTimeout(() => {
          this.scheduleAbsolutePositionUpdate();
          resizeTimeout = null;
        }, 150);
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

    // Validate layout prerequisites (padding and gap) before positioning
    const prerequisites = this.validateLayoutPrerequisites();
    if (!prerequisites.valid) {
      // Clear cache and retry after delay
      this.cachedPadding = null;
      const delay = this.isFirstPositioning ? 200 : 50;
      const rafCycles = this.isFirstPositioning ? 3 : 1;

      this.ngZone.runOutsideAngular(() => {
        let rafCount = 0;
        const runRaf = () => {
          requestAnimationFrame(() => {
            rafCount++;
            if (rafCount < rafCycles) {
              runRaf();
            } else {
              setTimeout(() => {
                this.ngZone.run(() => {
                  // Force recalculation
                  this.validateLayoutPrerequisites();
                  // Retry position update
                  this.updateAbsolutePositions();
                });
              }, delay);
            }
          });
        };
        runRaf();
      });
      return;
    }

    // Use validated values
    const padding = prerequisites.padding;
    const gap = prerequisites.gap;

    // Use cached elements if available, otherwise query DOM and cache
    let items: HTMLElement[] = [];
    if (this.itemElements.size === this.sectionsWithSpan.length) {
      // All elements cached, use them
      this.sectionsWithSpan.forEach((sectionWithSpan) => {
        const element = this.itemElements.get(sectionWithSpan.key);
        if (element) {
          items.push(element);
        }
      });
    } else {
      // Cache not complete, query DOM and update cache
      items = Array.from(container.querySelectorAll<HTMLElement>('.masonry-item'));
      this.cacheItemElements();
    }

    if (items.length === 0) return;

    // Ensure items match sections (should already be in sync)
    if (items.length !== this.sectionsWithSpan.length) {
      this.logger.warn(
        `[MasonryGrid] Item count (${items.length}) doesn't match sections (${this.sectionsWithSpan.length})`
      );
      return;
    }

    // CRITICAL: Validate all items have valid heights before positioning
    // If items have height 0, they will all stack at top: 0
    const allItemsHaveHeights = items.every((item) => {
      const offsetHeight = item.offsetHeight || 0;
      const rectHeight = item.getBoundingClientRect().height || 0;
      const height = Math.max(offsetHeight, rectHeight);
      return height > 0;
    });

    if (!allItemsHaveHeights) {
      // Items aren't ready yet - wait and retry
      // Use longer delay for first positioning, shorter for subsequent
      const delay = this.isFirstPositioning ? 200 : 100;
      const rafCycles = this.isFirstPositioning ? 3 : 1;

      this.ngZone.runOutsideAngular(() => {
        let rafCount = 0;
        const runRaf = () => {
          requestAnimationFrame(() => {
            rafCount++;
            if (rafCount < rafCycles) {
              runRaf();
            } else {
              setTimeout(() => {
                this.ngZone.run(() => {
                  // Retry position update after items have rendered
                  this.updateAbsolutePositions();
                });
              }, delay);
            }
          });
        };
        runRaf();
      });
      return;
    }

    // Calculate transforms using MasonryTransformService with validated gap
    const transforms = this.masonryTransformService.calculateTransforms(
      this.sectionsWithSpan.map((s) => s.section),
      items,
      {
        columns: this.currentColumns,
        gap: gap, // Use validated gap
        containerWidth: this.getContainerWidth(),
      },
      (section, columns) => this.decideSpanForSection(section, columns, true)
    );

    // Apply transforms and positions to items, and calculate container height in same loop
    let maxContainerHeight = 0;
    items.forEach((item, index) => {
      const sectionWithSpan = this.sectionsWithSpan[index];
      if (!sectionWithSpan) return;

      const position = transforms.get(sectionWithSpan.key);
      if (!position) {
        // Fallback: position item normally if no transform calculated
        return;
      }

      // Calculate left position based on column index and span using validated values
      const leftExpr = generateLeftExpression(
        this.currentColumns,
        position.colIndex,
        gap, // Use validated gap
        padding.left
      );
      const widthExpr = generateWidthExpression(
        this.currentColumns,
        position.colSpan,
        gap,
        padding.total
      );

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

      // Calculate container height in same loop (todo #5)
      const itemHeight = item.offsetHeight || 0;
      const itemBottom = position.finalTop + itemHeight;
      if (itemBottom > maxContainerHeight) {
        maxContainerHeight = itemBottom;
      }
    });

    // Add gap at bottom for spacing using validated gap
    const finalContainerHeight = maxContainerHeight + gap;
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

  /**
   * Ensure initial layout is calculated with retry mechanism if width is invalid
   * Simplified: Single RAF + one timeout retry
   * Also validates padding before layout calculation
   */
  private ensureInitialLayout(): void {
    const containerWidth = this.getContainerWidth();

    // If we already have a valid width and sections, validate prerequisites
    if (containerWidth > 0 && containerWidth >= 200 && this.sections?.length > 0) {
      // Check prerequisites - if invalid, force recalculation
      const prerequisites = this.validateLayoutPrerequisites();
      if (!prerequisites.valid) {
        // Clear cache and retry after delay with multiple RAF cycles
        this.cachedPadding = null;
        this.ngZone.runOutsideAngular(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setTimeout(() => {
                  this.ngZone.run(() => this.updateLayout());
                }, 200);
              });
            });
          });
        });
      }
      return; // Already valid
    }

    // Retry with single RAF + timeout
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        const width = this.getContainerWidth();
        if (width > 0 && width >= 200 && this.sections?.length > 0) {
          // Force padding calculation before layout
          this.cachedPadding = null;
          this.ngZone.run(() => this.updateLayout());
        } else {
          // Single retry after 100ms
          this.initialLayoutPollingTimeout = setTimeout(() => {
            const retryWidth = this.getContainerWidth();
            if (retryWidth > 0 && retryWidth >= 200) {
              // Force padding calculation before layout
              this.cachedPadding = null;
              this.ngZone.run(() => this.updateLayout());
            }
          }, 100);
        }
      });
    });
  }
}
