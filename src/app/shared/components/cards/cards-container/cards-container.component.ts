import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { AICardConfig } from '../../../../models';
import { CardDataService } from '../../../../core';
import { ErrorHandlingService } from '../../../../core/services/error-handling.service';
import { AICardRendererComponent } from '../ai-card-renderer.component';
import { AppState } from '../../../../store/app.state';
import * as CardsActions from '../../../../store/cards/cards.state';
import * as CardSelectors from '../../../../store/cards/cards.selectors';
import { ThemeService } from '../../../../../../projects/osi-cards-lib/src/lib/themes/theme.service';

/**
 * Cards Container Component
 *
 * Container component for displaying multiple cards with optional drag-and-drop reordering
 * or virtual scrolling for large lists.
 *
 * Features:
 * - Drag-and-drop reordering (when enabled)
 * - Virtual scrolling for efficient rendering of large card lists (when drag-drop is disabled)
 * - Automatic card loading from CardDataService
 * - Error handling integration
 * - Optimized trackBy function for change detection
 * - Configurable buffer sizes for virtual scrolling
 * - Persistent card order via NgRx store
 *
 * @example
 * ```html
 * <!-- With drag-and-drop enabled -->
 * <app-cards-container [enableDragDrop]="true"></app-cards-container>
 *
 * <!-- With virtual scrolling (default) -->
 * <app-cards-container></app-cards-container>
 * ```
 */
@Component({
  selector: 'app-cards-container',
  templateUrl: './cards-container.component.html',
  styleUrls: ['./cards-container.component.css'],
  standalone: true,
  imports: [CommonModule, AICardRendererComponent, ScrollingModule, DragDropModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardsContainerComponent implements OnInit, OnDestroy {
  @Input() enableDragDrop = false; // Enable drag-and-drop reordering

  cards: AICardConfig[] = [];
  readonly itemHeight = 400; // Estimated card height in pixels
  readonly minBufferPx = 200; // Minimum buffer before loading more items
  readonly maxBufferPx = 400; // Maximum buffer before unloading items

  private cardService = inject(CardDataService);
  private errorHandler = inject(ErrorHandlingService);
  private store = inject(Store<AppState>);
  private cdr = inject(ChangeDetectorRef);
  private themeService = inject(ThemeService);
  private destroyRef = inject(DestroyRef);

  /**
   * Get current theme normalized to 'day'/'night' format for component input
   */
  get cardTheme(): 'day' | 'night' {
    const theme = this.themeService.getResolvedTheme();
    // Normalize theme to 'day'/'night' format
    if (theme === 'light' || theme === 'day') {
      return 'day';
    }
    if (theme === 'dark' || theme === 'night') {
      return 'night';
    }
    // For custom themes, default to 'day'
    return 'day';
  }

  ngOnInit(): void {
    // Subscribe to theme changes to trigger change detection
    this.themeService.resolvedTheme$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.cdr.markForCheck();
    });

    if (this.enableDragDrop) {
      // Use store to get cards sorted by displayOrder when drag-drop is enabled
      this.store.select(CardSelectors.selectCardsByDisplayOrder).subscribe((cards) => {
        this.cards = cards;
        this.cdr.markForCheck();
      });
    } else {
      // Use service directly when virtual scrolling is enabled
      this.loadExampleCards();
    }
  }

  ngOnDestroy(): void {
    // DestroyRef handles cleanup automatically
  }

  loadExampleCards(): void {
    this.cardService.getAllCards().subscribe({
      next: (cards: AICardConfig[]) => {
        this.cards = cards;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.errorHandler.handleError(error, 'CardsContainerComponent.loadExampleCards');
      },
    });
  }

  trackByCardId(index: number, card: AICardConfig): string {
    return card.id || index.toString();
  }

  /**
   * Handles drag-and-drop reordering
   */
  onCardDrop(event: CdkDragDrop<AICardConfig[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return; // No change
    }

    // Dispatch reorder action to store
    this.store.dispatch(
      CardsActions.reorderCards({
        previousIndex: event.previousIndex,
        currentIndex: event.currentIndex,
      })
    );
  }
}
