/**
 * Smart Grid Component
 *
 * A simplified, maintainable grid component that uses the core primitives.
 * Demonstrates how to reduce 2600+ lines to ~200 lines of clean code.
 *
 * Key features:
 * - Uses GridLayoutEngine for calculations
 * - Uses ResizeManager for responsive updates
 * - Clean separation of concerns
 * - Easy to understand and maintain
 *
 * @example
 * ```html
 * <osi-smart-grid
 *   [sections]="sections"
 *   [maxColumns]="4"
 *   [gap]="16"
 *   (sectionClick)="onSectionClick($event)"
 * >
 *   <ng-template #sectionTemplate let-section let-position="position">
 *     <div class="custom-section">{{ section.title }}</div>
 *   </ng-template>
 * </osi-smart-grid>
 * ```
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ContentChild,
  TemplateRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  GridLayoutEngine,
  GridSection,
  PositionedGridSection,
  GridLayout,
  createGridLayoutEngine,
} from '../../core/grid-layout-engine';
import { ResizeManager, createGridResizeManager } from '../../core/resize-manager';

// ============================================================================
// TYPES
// ============================================================================

export interface SmartGridSection extends GridSection {
  [key: string]: unknown;
}

export interface SectionClickEvent {
  section: SmartGridSection;
  position: PositionedGridSection;
}

// ============================================================================
// COMPONENT
// ============================================================================

@Component({
  selector: 'osi-smart-grid',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #container class="smart-grid-container" [style.minHeight.px]="layout?.totalHeight || 200">
      @for (pos of layout?.sections || []; track pos.id) {
        <div
          class="smart-grid-item"
          [class.is-new]="isNew(pos.id)"
          [style.left]="pos.left"
          [style.width]="pos.width"
          [style.top.px]="pos.top"
          (click)="onItemClick(pos)"
        >
          @if (sectionTemplate) {
            <ng-container
              *ngTemplateOutlet="
                sectionTemplate;
                context: { $implicit: pos.section, position: pos }
              "
            ></ng-container>
          } @else {
            <div class="default-section">
              <h3>{{ pos.section.title || pos.id }}</h3>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        position: relative;
      }

      .smart-grid-container {
        position: relative;
        width: 100%;
      }

      .smart-grid-item {
        position: absolute;
        transition: all 0.3s ease-out;
      }

      .smart-grid-item.is-new {
        animation: fadeIn 0.3s ease-out;
      }

      .default-section {
        padding: 16px;
        background: var(--osi-section-bg, #f5f5f5);
        border-radius: 8px;
        height: 100%;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class SmartGridComponent implements OnInit, OnDestroy, OnChanges {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly elementRef = inject(ElementRef);
  private readonly destroy$ = new Subject<void>();

  private engine!: GridLayoutEngine;
  private resizeManager!: ResizeManager;
  private newSectionIds = new Set<string>();
  private previousIds = new Set<string>();

  // ==========================================================================
  // INPUTS
  // ==========================================================================

  @Input() sections: SmartGridSection[] = [];
  @Input() maxColumns = 4;
  @Input() gap = 16;
  @Input() minColumnWidth = 280;
  @Input() optimize = true;

  // ==========================================================================
  // OUTPUTS
  // ==========================================================================

  @Output() sectionClick = new EventEmitter<SectionClickEvent>();
  @Output() layoutChange = new EventEmitter<GridLayout>();

  // ==========================================================================
  // TEMPLATE REFS
  // ==========================================================================

  @ViewChild('container', { static: true }) container!: ElementRef<HTMLElement>;
  @ContentChild('sectionTemplate') sectionTemplate?: TemplateRef<unknown>;

  // ==========================================================================
  // STATE
  // ==========================================================================

  layout: GridLayout | null = null;

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  ngOnInit(): void {
    // Create engine with config
    this.engine = createGridLayoutEngine({
      maxColumns: this.maxColumns,
      gap: this.gap,
      minColumnWidth: this.minColumnWidth,
      optimize: this.optimize,
    });

    // Create resize manager
    this.resizeManager = createGridResizeManager(this.container.nativeElement);

    // Subscribe to width changes
    this.resizeManager.width$
      .pipe(takeUntil(this.destroy$))
      .subscribe((width) => this.recalculateLayout(width));

    // Subscribe to layout changes
    this.engine.layout$.pipe(takeUntil(this.destroy$)).subscribe((layout) => {
      this.layout = layout;
      if (layout) {
        this.layoutChange.emit(layout);
      }
      this.cdr.markForCheck();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sections']) {
      this.detectNewSections();
    }

    if (
      changes['maxColumns'] ||
      changes['gap'] ||
      changes['minColumnWidth'] ||
      changes['optimize']
    ) {
      this.engine?.configure({
        maxColumns: this.maxColumns,
        gap: this.gap,
        minColumnWidth: this.minColumnWidth,
        optimize: this.optimize,
      });
    }

    // Recalculate if we have a width
    const width = this.resizeManager?.getWidth();
    if (width && width > 0) {
      this.recalculateLayout(width);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.resizeManager?.destroy();
  }

  // ==========================================================================
  // PUBLIC METHODS
  // ==========================================================================

  /** Update height for a section */
  setHeight(sectionId: string, height: number): void {
    this.engine.setHeight(sectionId, height);
    const width = this.resizeManager.getWidth();
    if (width > 0) {
      this.recalculateLayout(width);
    }
  }

  /** Force recalculation */
  refresh(): void {
    this.engine.clearCache();
    const width = this.resizeManager.getWidth();
    if (width > 0) {
      this.recalculateLayout(width);
    }
  }

  /** Check if section is new */
  isNew(id: string): boolean {
    return this.newSectionIds.has(id);
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  private recalculateLayout(width: number): void {
    if (width <= 0 || !this.sections.length) return;
    this.engine.calculate(this.sections, width);
  }

  private detectNewSections(): void {
    const currentIds = new Set(this.sections.map((s) => s.id));

    this.newSectionIds.clear();
    for (const id of currentIds) {
      if (!this.previousIds.has(id)) {
        this.newSectionIds.add(id);
      }
    }

    // Clear "new" status after animation
    if (this.newSectionIds.size > 0) {
      setTimeout(() => {
        this.newSectionIds.clear();
        this.cdr.markForCheck();
      }, 500);
    }

    this.previousIds = currentIds;
  }

  protected onItemClick(position: PositionedGridSection): void {
    this.sectionClick.emit({
      section: position.section as SmartGridSection,
      position,
    });
  }
}
