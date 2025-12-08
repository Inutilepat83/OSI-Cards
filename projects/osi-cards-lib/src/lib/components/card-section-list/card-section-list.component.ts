import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CardSection } from '../../models/card.model';
import { LoggerService } from '../../services/logger.service';
import { MasonryGridComponent, MasonryLayoutInfo } from '../masonry-grid/masonry-grid.component';
import { SectionRenderEvent } from '../section-renderer/section-renderer.component';

/**
 * Card Section List Component
 *
 * Manages the rendering of card sections through the masonry grid.
 * Extracted from AICardRendererComponent for better separation of concerns.
 */
@Component({
  selector: 'app-card-section-list',
  standalone: true,
  imports: [CommonModule, MasonryGridComponent],
  templateUrl: './card-section-list.component.html',
  styleUrls: ['./card-section-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardSectionListComponent implements OnChanges {
  @Input() sections: CardSection[] = [];

  private readonly logger = inject(LoggerService);

  /**
   * Optional explicit container width for reliable masonry layout.
   * When provided, this is passed to the masonry grid.
   */
  @Input() containerWidth?: number;

  /**
   * Whether streaming mode is active.
   * When true, enables smooth incremental updates and entrance animations.
   */
  @Input() isStreaming = false;

  /**
   * Enable debug mode for detailed logging of layout calculations and gap elimination.
   * When true, enables comprehensive logging in MasonryGridComponent.
   */
  @Input() debugMode = false;

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sections'] && this.sections) {
      this.logger.info('CardSectionList: Sections received', {
        source: 'CardSectionListComponent',
        sectionsCount: this.sections.length,
        sectionTypes: this.sections.map((s) => ({
          id: s.id,
          type: s.type,
          title: s.title,
          hasFields: !!s.fields?.length,
          hasItems: !!s.items?.length,
        })),
      });
    }
  }
}
