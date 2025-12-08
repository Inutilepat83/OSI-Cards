/**
 * Simple Grid Component
 *
 * Demonstrates how to use LayoutCalculationService and LayoutStateManager
 * for clean, maintainable grid layouts.
 *
 * This is a simplified example showing the pattern. For production use with
 * streaming, animations, and virtual scrolling, see MasonryGridComponent.
 *
 * @example
 * ```html
 * <lib-simple-grid [sections]="sections" [gap]="16"></lib-simple-grid>
 * ```
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CardSection } from '../../models/card.model';
import {
  LayoutCalculationService,
  LayoutConfig,
  LayoutResult,
  PositionedSection as ServicePositionedSection,
} from '../../services/layout-calculation.service';
import { LayoutState, LayoutStateManager } from '../../services/layout-state-manager.service';
import { SectionRendererComponent } from '../section-renderer/section-renderer.component';

/**
 * Layout information emitted on changes
 */
export interface SimpleGridLayoutInfo {
  columns: number;
  containerWidth: number;
  totalHeight: number;
  calculationTime?: number;
}

@Component({
  selector: 'lib-simple-grid',
  standalone: true,
  imports: [CommonModule, SectionRendererComponent],
  template: `
    <div class="simple-grid-container" [style.height.px]="containerHeight" [class.ready]="isReady">
      <div
        *ngFor="let positioned of positionedSections; trackBy: trackByKey"
        class="grid-item"
        [style.position]="'absolute'"
        [style.left]="positioned.left"
        [style.top.px]="positioned.top"
        [style.width]="positioned.width"
      >
        <app-section-renderer
          [section]="positioned.section"
          [cardId]="'simple-grid'"
          (sectionEvent)="onSectionEvent($event)"
        >
        </app-section-renderer>
      </div>
    </div>
  `,
  styles: [
    `
      .simple-grid-container {
        position: relative;
        width: 100%;
        opacity: 0;
        transition: opacity 0.2s ease-in-out;
      }

      .simple-grid-container.ready {
        opacity: 1;
      }

      .grid-item {
        transition: all 0.3s ease-in-out;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SimpleGridComponent implements OnInit, OnChanges, OnDestroy {
  // Inputs
  @Input() sections: CardSection[] = [];
  @Input() gap = 16;
  @Input() minColumnWidth = 260;
  @Input() maxColumns = 4;
  @Input() containerWidth?: number;

  // Outputs
  @Output() layoutChange = new EventEmitter<SimpleGridLayoutInfo>();
  @Output() sectionEvent = new EventEmitter<any>();

  // Services
  private readonly layoutService = inject(LayoutCalculationService);
  private readonly stateManager = new LayoutStateManager();
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  // State
  positionedSections: ServicePositionedSection[] = [];
  containerHeight = 0;
  isReady = false;

  ngOnInit(): void {
    // Subscribe to state changes
    this.stateManager.state$.pipe(takeUntil(this.destroy$)).subscribe((state) => {
      this.isReady = state === 'ready';
      this.cdr.markForCheck();
    });

    // Subscribe to position changes
    this.stateManager.positions$.pipe(takeUntil(this.destroy$)).subscribe((positions) => {
      this.positionedSections = Array.from(positions.values()).map((pos, index) => ({
        ...pos,
        section: this.sections[index],
        key: this.generateKey(this.sections[index], index),
        preferredColumns: 1 as any,
      }));
      this.cdr.markForCheck();
    });

    // Initial layout calculation
    this.calculateLayout();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sections'] || changes['containerWidth'] || changes['gap']) {
      this.calculateLayout();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Calculate layout using LayoutCalculationService
   */
  private calculateLayout(): void {
    if (!this.sections || this.sections.length === 0) {
      this.stateManager.reset();
      return;
    }

    // Set state to calculating
    this.stateManager.setState('calculating');

    try {
      // Get container width (use provided or default to 1200)
      const width = this.containerWidth || 1200;

      // Create layout configuration
      const config: LayoutConfig = {
        containerWidth: width,
        gap: this.gap,
        minColumnWidth: this.minColumnWidth,
        maxColumns: this.maxColumns,
        optimize: true,
      };

      // Calculate layout using service
      const result: LayoutResult = this.layoutService.calculateLayout(this.sections, config);

      // Update state manager
      this.stateManager.updatePositions(result.positions);
      this.stateManager.updateColumnHeights(result.columnHeights);
      this.stateManager.updateMetadata(result.columns, result.containerWidth);
      this.stateManager.setState('ready');

      // Update component state
      this.containerHeight = result.totalHeight;
      this.positionedSections = result.positions;

      // Emit layout change
      this.layoutChange.emit({
        columns: result.columns,
        containerWidth: result.containerWidth,
        totalHeight: result.totalHeight,
        calculationTime: result.calculationTime,
      });

      // Log performance
      if (result.calculationTime !== undefined) {
        console.log(
          `[SimpleGrid] Layout calculated in ${result.calculationTime.toFixed(2)}ms`,
          `(${this.sections.length} sections, ${result.columns} columns)`
        );
      }

      // Mark for change detection
      this.cdr.markForCheck();
    } catch (error) {
      console.error('[SimpleGrid] Layout calculation failed:', error);
      this.stateManager.setState('error');
    }
  }

  /**
   * Generate unique key for section
   */
  private generateKey(section: CardSection, index: number): string {
    return section.id || `section-${section.type}-${index}`;
  }

  /**
   * Track by function for ngFor
   */
  trackByKey(index: number, item: ServicePositionedSection): string {
    return item.key;
  }

  /**
   * Handle section events
   */
  onSectionEvent(event: any): void {
    this.sectionEvent.emit(event);
  }

  /**
   * Get current layout state
   */
  getLayoutState(): LayoutState {
    return this.stateManager.state;
  }

  /**
   * Get layout statistics
   */
  getLayoutStatistics() {
    const result: LayoutResult = {
      positions: this.positionedSections,
      columnHeights: this.stateManager.getColumnHeights(),
      totalHeight: this.containerHeight,
      columns: this.stateManager.getColumns(),
      containerWidth: this.stateManager.getContainerWidth(),
    };

    return this.layoutService.getLayoutStatistics(result);
  }

  /**
   * Recalculate layout (public API)
   */
  recalculate(): void {
    this.calculateLayout();
  }
}



