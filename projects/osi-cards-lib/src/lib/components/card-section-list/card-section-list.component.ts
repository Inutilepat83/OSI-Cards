import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CardSection } from '@osi-cards/models';
import { LoggerService } from '@osi-cards/services';
import { sendDebugLog } from '@osi-cards/lib/utils/debug-log.util';
import { LOG_TAGS } from '@osi-cards/utils';
// CRITICAL: Use direct imports to avoid circular dependency issues
// Importing from @osi-cards/components can cause circular dependencies
import { MasonryGridComponent } from '../masonry-grid/masonry-grid.component';
import type { MasonryLayoutInfo } from '../masonry-grid/masonry-grid.component';
import type { SectionRenderEvent } from '../section-renderer/section-renderer.component';

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
  constructor() {
    // #region agent log - component constructor
    sendDebugLog({
      location: 'card-section-list.component.ts:constructor',
      message: 'CardSectionListComponent instantiated',
      data: { timestamp: Date.now() },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'section-render-debug',
      hypothesisId: 'H5',
    });
    // #endregion
  }

  @Input()
  set sections(value: CardSection[]) {
    // #region agent log - sections setter
    sendDebugLog({
      location: 'card-section-list.component.ts:sections.setter',
      message: 'Sections setter called',
      data: {
        sectionsCount: value?.length || 0,
        hasSections: !!value,
        isArray: Array.isArray(value),
        sections: value?.slice(0, 3).map((s) => ({ id: s.id, type: s.type, title: s.title })) || [],
        previousCount: this._sections.length,
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'section-render-debug',
      hypothesisId: 'H5',
    });
    // #endregion
    this._sections = value || [];
    // CRITICAL: Mark for check when sections input changes in OnPush component
    this.cdr.markForCheck();
  }
  get sections(): CardSection[] {
    return this._sections;
  }
  private _sections: CardSection[] = [];

  private readonly logger = inject(LoggerService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Change detection batching: queue markForCheck calls to batch them in single RAF
  private changeDetectionRafId: number | null = null;
  private pendingChangeDetection = false;

  /**
   * Batched change detection - queues markForCheck() to batch multiple calls
   * Uses requestAnimationFrame to batch all pending change detection in single cycle
   */
  private batchedMarkForCheck(): void {
    if (this.pendingChangeDetection) {
      return; // Already queued
    }

    this.pendingChangeDetection = true;

    if (this.changeDetectionRafId === null) {
      this.changeDetectionRafId = requestAnimationFrame(() => {
        this.cdr.markForCheck();
        this.pendingChangeDetection = false;
        this.changeDetectionRafId = null;
      });
    }
  }

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

  // Static deduplication map for sendDebugLog calls
  private static readonly debugLogDedup = new Map<string, number>();
  private static readonly DEBUG_LOG_DEDUP_WINDOW_MS = 5000; // 5 seconds

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sections']) {
      // #region agent log - sections input received (with deduplication)
      const logKey = 'card-section-list.component.ts:ngOnChanges|Sections input changed';
      const now = Date.now();
      const lastLogTime = CardSectionListComponent.debugLogDedup.get(logKey) || 0;

      // Only log if enough time has passed since last log (deduplication)
      if (now - lastLogTime >= CardSectionListComponent.DEBUG_LOG_DEDUP_WINDOW_MS) {
        CardSectionListComponent.debugLogDedup.set(logKey, now);

        // Clean up old entries periodically
        if (CardSectionListComponent.debugLogDedup.size > 50) {
          for (const [key, time] of CardSectionListComponent.debugLogDedup.entries()) {
            if (now - time > CardSectionListComponent.DEBUG_LOG_DEDUP_WINDOW_MS * 2) {
              CardSectionListComponent.debugLogDedup.delete(key);
            }
          }
        }

        sendDebugLog({
          location: 'card-section-list.component.ts:ngOnChanges',
          message: 'Sections input changed',
          data: {
            sectionsCount: this.sections?.length || 0,
            hasSections: !!this.sections,
            isArray: Array.isArray(this.sections),
            sections: this.sections?.map((s) => ({ id: s.id, type: s.type, title: s.title })) || [],
            previousValue: changes['sections'].previousValue?.length || 0,
            currentValue: changes['sections'].currentValue?.length || 0,
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'section-render-debug',
          hypothesisId: 'H5',
        });
      }
      // #endregion
      if (this.sections) {
        this.logger.info(
          'CardSectionList: Sections received',
          {
            source: 'CardSectionListComponent',
            sectionsCount: this.sections.length,
            sectionTypes: this.sections.map((s) => ({
              id: s.id,
              type: s.type,
              title: s.title,
              hasFields: !!s.fields?.length,
              hasItems: !!s.items?.length,
            })),
          },
          [LOG_TAGS.CARD_SECTION_LIST]
        );
      }

      // CRITICAL: Force change detection for OnPush components when input changes
      this.batchedMarkForCheck();
    }
  }
}
