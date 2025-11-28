import { Component, OnInit, Input, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Store } from '@ngrx/store';
import { AICardConfig } from '../../../../models';
import { CardDataService } from '../../../../core';
import { ErrorHandlingService } from '../../../../core/services/error-handling.service';
import { AICardRendererComponent } from '../ai-card-renderer.component';
import { AppState } from '../../../../store/app.state';
import * as CardsActions from '../../../../store/cards/cards.state';
import * as CardSelectors from '../../../../store/cards/cards.selectors';

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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardsContainerComponent implements OnInit {
  @Input() enableDragDrop = false; // Enable drag-and-drop reordering

  cards: AICardConfig[] = [];
  readonly itemHeight = 400; // Estimated card height in pixels
  readonly minBufferPx = 200; // Minimum buffer before loading more items
  readonly maxBufferPx = 400; // Maximum buffer before unloading items
  
  private cardService = inject(CardDataService);
  private errorHandler = inject(ErrorHandlingService);
  private store = inject(Store<AppState>);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    if (this.enableDragDrop) {
      // Use store to get cards sorted by displayOrder when drag-drop is enabled
      this.store.select(CardSelectors.selectCardsByDisplayOrder).subscribe(cards => {
        this.cards = cards;
        this.cdr.markForCheck();
      });
    } else {
      // Use service directly when virtual scrolling is enabled
      this.loadExampleCards();
    }
  }

  loadExampleCards(): void {
    this.cardService.getAllCards().subscribe({
      next: (cards: AICardConfig[]) => {
        this.cards = cards;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.errorHandler.handleError(error, 'CardsContainerComponent.loadExampleCards');
      }
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
        currentIndex: event.currentIndex
      })
    );
  }
}
