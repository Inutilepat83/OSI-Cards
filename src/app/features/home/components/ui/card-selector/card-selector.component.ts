import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subject, debounceTime, takeUntil } from 'rxjs';

// Utility functions
import {
  isValidCard,
  getSelectedCards,
  getSelectedCountText,
  shouldShowClearButton,
  getTabIndex,
  getAriaLabel,
  getAriaLabelledBy,
  validateCardData,
  getNextFocusableIndex
} from './card-selector.utils';

// Pipes
import { SelectedCountPipe } from './selected-count.pipe';

// Services
import { CardSelectionService } from './card-selection.service';

/**
 * Interface representing a card item
 */
export interface Card {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * A presentational component that displays a list of selectable cards
 * and emits events when cards are selected/deselected.
 * 
 * @example
 * <app-card-selector
 *   [cards]="cards"
 *   [allowMultipleSelection]="true"
 *   (selectionChange)="onSelectionChange($event)">
 * </app-card-selector>
 */
@Component({
  selector: 'app-card-selector',
  standalone: true,
  imports: [CommonModule, SelectedCountPipe],
  template: `
    <div class="card-selector-container" role="region" [attr.aria-label]="getAriaLabel(displayTitle())">
      <div class="card-selector-header" *ngIf="displayTitle()">
        <h3 id="card-selector-title">{{ displayTitle() }}</h3>
      </div>
      
      <div class="cards-list" role="listbox" 
           [attr.aria-multiselectable]="allowMultipleSelection"
           [attr.aria-labelledby]="getAriaLabelledBy(displayTitle())">
        <div 
          *ngFor="let card of cards; trackBy: trackByCardId; let i = index" 
          class="card-item"
          role="option"
          [attr.aria-selected]="isCardSelected(card.id)"
          [attr.tabindex]="getTabIndex(i)"
          [attr.data-card-id]="card.id"
          [class.selected]="isCardSelected(card.id)"
          (click)="toggleCardSelection(card)"
          (keydown)="handleKeyDown($event, card)"
          [@selectionState]="isCardSelected(card.id) ? 'selected' : 'unselected'">
          
          <div class="card-image" *ngIf="card.imageUrl">
            <img [src]="card.imageUrl" [alt]="card.title" loading="lazy">
          </div>
          
          <div class="card-content">
            <h4 class="card-title">{{ card.title }}</h4>
            <p class="card-description" *ngIf="card.description">{{ card.description }}</p>
          </div>
        </div>
      </div>
      
      <div class="card-selector-footer" *ngIf="selectedCount() > 0">
        <p>{{ selectedCount() | selectedCount }}</p>
        <button 
          *ngIf="shouldShowClearButton(selectedCount(), showClearSelectionButton)" 
          (click)="clearSelection()"
          class="clear-selection-btn"
          aria-label="Clear selection">
          Clear Selection
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./card-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('selectionState', [
      transition('unselected => selected', [
        animate('200ms ease-in', style({ 
          boxShadow: '0 0 0 2px var(--primary-color, #3f51b5)', 
          transform: 'scale(1.02)' 
        }))
      ]),
      transition('selected => unselected', [
        animate('150ms ease-out')
      ])
    ])
  ]
})
export class CardSelectorComponent implements OnInit, OnDestroy {
  /** The list of cards to display */
  @Input() cards: Card[] = [];
  
  /** Optional title for the card selector */
  @Input() set title(value: string) {
    this.titleSignal.set(value);
  }
  
  /** Whether to allow multiple cards to be selected */
  @Input() allowMultipleSelection = false;
  
  /** Whether to show a button to clear the selection */
  @Input() showClearSelectionButton = true;
  
  /** Whether to automatically select the first card */
  @Input() set autoSelectFirst(value: boolean) {
    this._autoSelectFirst = value;
    // When this input changes, handle the auto-selection logic
    if (value && this.cards.length > 0 && this.selectedCardIds().length === 0) {
      this.selectedCardIds.update(ids => [...ids, this.cards[0].id]);
    }
  }
  
  /** Emits when the selection changes */
  @Output() selectionChange = new EventEmitter<Card[]>();
  
  // Private signals for state management
  private titleSignal = signal<string>('');
  private selectedCardIds = signal<string[]>([]);
  private _autoSelectFirst = false;
  
  // RxJS subjects for cleanup
  private destroy$ = new Subject<void>();
  private selectionSubject$ = new Subject<Card[]>();
  
  // Computed signals for derived state
  protected displayTitle = computed(() => this.titleSignal());
  protected selectedCount = computed(() => this.selectedCardIds().length);
  
  // Services
  private cardSelectionService = inject(CardSelectionService);

  constructor() {
    // Debounce selection changes to improve performance
    this.selectionSubject$
      .pipe(
        debounceTime(100),
        takeUntil(this.destroy$)
      )
      .subscribe((cards: Card[]) => {
        this.selectionChange.emit(cards);
        this.cardSelectionService.updateSelectedCards(cards);
      });
  }
  
  /**
   * Track function for ngFor to improve performance
   */
  trackByCardId(index: number, card: Card): string {
    return card.id;
  }
  
  /**
   * Checks if a card is selected by ID
   */
  isCardSelected(cardId: string): boolean {
    return this.selectedCardIds().includes(cardId);
  }
  
  /**
   * Gets the appropriate tabindex for keyboard navigation
   */
  getTabIndex(index: number): number {
    return getTabIndex(index);
  }
  
  /**
   * Gets the appropriate ARIA label
   */
  getAriaLabel(title: string | undefined): string {
    return getAriaLabel(title);
  }
  
  /**
   * Gets the appropriate ARIA labelledby attribute
   */
  getAriaLabelledBy(title: string | undefined): string | null {
    return getAriaLabelledBy(title);
  }
  
  /**
   * Determines if the clear selection button should be shown
   */
  shouldShowClearButton(count: number, showButton: boolean): boolean {
    return shouldShowClearButton(count, showButton);
  }
  
  /**
   * Toggles the selection state of a card
   */
  toggleCardSelection(card: Card): void {
    if (!isValidCard(card)) {
      console.warn('Attempted to toggle selection on invalid card', card);
      return;
    }

    if (this.isCardSelected(card.id)) {
      // Deselect the card
      this.selectedCardIds.update(ids => ids.filter(id => id !== card.id));
    } else {
      // Select the card
      if (this.allowMultipleSelection) {
        this.selectedCardIds.update(ids => [...ids, card.id]);
      } else {
        this.selectedCardIds.set([card.id]);
      }
    }
    
    // Emit the selected cards
    this.emitSelectedCards();
  }
  
  /**
   * Clears all selected cards
   */
  clearSelection(): void {
    this.selectedCardIds.set([]);
    this.emitSelectedCards();
  }
  
  /**
   * Emits the currently selected cards (debounced)
   */
  private emitSelectedCards(): void {
    const selectedIds = this.selectedCardIds();
    const selectedCards = getSelectedCards(this.cards, selectedIds);
    this.selectionSubject$.next(selectedCards);
  }

  /**
   * Handles keyboard navigation and selection
   */
  handleKeyDown(event: KeyboardEvent, card: Card): void {
    const cardElements = Array.from(
      document.querySelectorAll('.card-item[data-card-id]')
    );
    const currentIndex = cardElements.findIndex(
      el => el.getAttribute('data-card-id') === card.id
    );

    let nextIndex = currentIndex;

    switch (event.key) {
      case 'Enter':
      case ' ':
        // Toggle selection on Enter or Space
        event.preventDefault();
        this.toggleCardSelection(card);
        break;
      
      case 'ArrowRight':
      case 'ArrowDown':
        // Move focus to next card
        event.preventDefault();
        nextIndex = getNextFocusableIndex(currentIndex, 'down', cardElements.length);
        break;
      
      case 'ArrowLeft':
      case 'ArrowUp':
        // Move focus to previous card
        event.preventDefault();
        nextIndex = getNextFocusableIndex(currentIndex, 'up', cardElements.length);
        break;
      
      case 'Home':
        // Move focus to first card
        event.preventDefault();
        nextIndex = getNextFocusableIndex(currentIndex, 'home', cardElements.length);
        break;
      
      case 'End':
        // Move focus to last card
        event.preventDefault();
        nextIndex = getNextFocusableIndex(currentIndex, 'end', cardElements.length);
        break;
    }

    // Focus the next element if index changed
    if (nextIndex !== currentIndex && cardElements[nextIndex]) {
      (cardElements[nextIndex] as HTMLElement).focus();
    }
  }
  
  /**
   * Lifecycle hook that runs when the component initializes
   */
  ngOnInit(): void {
    // Validate card data using service
    const validation = this.cardSelectionService.validateCards(this.cards);
    if (!validation.isValid) {
      validation.errors.forEach(error => console.warn(error));
    }

    // Handle auto-selection of first card if enabled
    if (this._autoSelectFirst && this.cards.length > 0 && this.selectedCardIds().length === 0) {
      this.selectedCardIds.update(ids => [...ids, this.cards[0].id]);
      this.emitSelectedCards();
    }
  }

  /**
   * Lifecycle hook that runs when the component is destroyed
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Testing utilities - exposed for unit testing
  /** @internal */
  getSelectedCardIds(): string[] {
    return this.selectedCardIds();
  }

  /** @internal */
  setSelectedCardIds(ids: string[]): void {
    this.selectedCardIds.set(ids);
  }
}
