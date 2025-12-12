import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardSection } from '../../models';
import { MasonryGridComponent, MasonryLayoutInfo } from '../masonry-grid/masonry-grid.component';
import { SectionRenderEvent } from '../section-renderer/section-renderer.component';

/**
 * Card Body Component
 *
 * Composable component for rendering card body with sections in a masonry grid layout.
 * Wraps MasonryGridComponent for easier composition.
 *
 * @example
 * ```html
 * <app-card-body
 *   [sections]="card.sections"
 *   [gap]="12"
 *   [minColumnWidth]="280"
 *   (sectionEvent)="onSectionEvent($event)"
 *   (layoutChange)="onLayoutChange($event)">
 * </app-card-body>
 * ```
 */
@Component({
  selector: 'app-card-body',
  standalone: true,
  imports: [CommonModule, MasonryGridComponent],
  template: `
    <app-masonry-grid
      *ngIf="sections && sections.length > 0"
      [sections]="sections"
      [gap]="gap"
      [minColumnWidth]="minColumnWidth"
      class="w-full"
      (sectionEvent)="onSectionEvent($event)"
      (layoutChange)="onLayoutChange($event)"
    >
    </app-masonry-grid>

    <ng-content></ng-content>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardBodyComponent {
  /** Sections to render */
  @Input() sections: CardSection[] = [];

  /** Gap between grid items in pixels */
  @Input() gap = 12;

  /** Minimum column width in pixels */
  @Input() minColumnWidth = 260;

  /** Emitted when a section event occurs */
  @Output() sectionEvent = new EventEmitter<SectionRenderEvent>();

  /** Emitted when layout changes */
  @Output() layoutChange = new EventEmitter<MasonryLayoutInfo>();

  onSectionEvent(event: SectionRenderEvent): void {
    this.sectionEvent.emit(event);
  }

  onLayoutChange(info: MasonryLayoutInfo): void {
    this.layoutChange.emit(info);
  }
}

