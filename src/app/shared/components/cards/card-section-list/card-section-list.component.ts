import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardSection } from '../../../../models';
import { MasonryGridComponent, MasonryLayoutInfo } from '../masonry-grid/masonry-grid.component';
import { SectionRenderEvent } from '../section-renderer/section-renderer.component';
import { ErrorBoundaryComponent } from '../../../../core/error-boundary/error-boundary.component';

/**
 * Card Section List Component
 * 
 * Manages the rendering of card sections through the masonry grid.
 * Extracted from AICardRendererComponent for better separation of concerns.
 */
@Component({
  selector: 'app-card-section-list',
  standalone: true,
  imports: [CommonModule, MasonryGridComponent, ErrorBoundaryComponent],
  templateUrl: './card-section-list.component.html',
  styleUrls: ['./card-section-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardSectionListComponent {
  @Input() sections: CardSection[] = [];
  @Input() isStreaming = false;
  @Input() changeType: 'structural' | 'content' = 'structural';
  /** Container width passed from parent for reliable multi-column layout */
  @Input() containerWidth?: number;
  @Output() sectionEvent = new EventEmitter<SectionRenderEvent>();
  @Output() layoutChange = new EventEmitter<MasonryLayoutInfo>();

  onSectionEvent(event: SectionRenderEvent): void {
    this.sectionEvent.emit(event);
  }

  onLayoutChange(layout: MasonryLayoutInfo): void {
    this.layoutChange.emit(layout);
  }

  trackSection = (_index: number, section: CardSection): string =>
    section.id ?? `${section.title}-${_index}`;
}







