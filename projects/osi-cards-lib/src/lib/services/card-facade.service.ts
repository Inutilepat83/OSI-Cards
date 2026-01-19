/**
 * Card Facade Service
 *
 * Provides a unified, simplified API for all card operations.
 * Acts as a single entry point for creating, managing, and streaming cards.
 *
 * This facade pattern:
 * - Simplifies complex subsystem interactions
 * - Provides a clean API for consumers
 * - Manages internal service coordination
 * - Handles state synchronization
 *
 * @dependencies
 * - OSICardsStreamingService: For streaming card generation and updates
 * - ThemeService: For theme configuration and management
 * - DestroyRef: For automatic cleanup of subscriptions
 *
 * @example
 * ```typescript
 * import { CardFacade } from 'osi-cards-lib';
 *
 * @Component({...})
 * export class MyComponent {
 *   private facade = inject(CardFacade);
 *
 *   async createCard() {
 *     const card = await this.facade.createCard({
 *       title: 'My Card',
 *       sections: [...]
 *     });
 *   }
 *
 *   streamCard(json: string) {
 *     this.facade.stream(json).subscribe(update => {
 *       console.log('Card update:', update);
 *     });
 *   }
 * }
 * ```
 */

import { Injectable, inject, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, BehaviorSubject, merge, EMPTY } from 'rxjs';
import { map, filter, tap, catchError, shareReplay } from 'rxjs/operators';

import type { AICardConfig, CardSection, CardField, CardItem, CardAction } from '@osi-cards/models';
import { CardUtils, CardTypeGuards } from '@osi-cards/models';
import {
  OSICardsStreamingService,
  CardUpdate,
  StreamingState,
  StreamingConfig,
} from '@osi-cards/services';
import { ThemeService } from '@osi-cards/themes';
import { CardFactory, SectionFactory } from '@osi-cards/lib/factories';
import { ValidationError } from '@osi-cards/lib/errors';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Card creation options
 */
export interface CreateCardOptions {
  /** Card title (required) */
  title: string;
  /** Card sections */
  sections?: CardSection[];
  /** Card actions */
  actions?: CardAction[];
  /** Card description */
  description?: string;
  /** Auto-generate IDs for sections/fields */
  generateIds?: boolean;
  /** Validate card configuration */
  validate?: boolean;
}

/**
 * Card streaming options
 */
export interface StreamCardOptions {
  /** Target JSON to stream */
  json: string;
  /** Stream instantly (no animation) */
  instant?: boolean;
  /** Custom streaming config */
  config?: Partial<StreamingConfig>;
  /** Callback for card updates */
  onUpdate?: (card: AICardConfig) => void;
  /** Callback for completion */
  onComplete?: (card: AICardConfig) => void;
  /** Callback for errors */
  onError?: (error: Error) => void;
}

/**
 * Card collection state
 */
export interface CardCollectionState {
  cards: Map<string, AICardConfig>;
  activeCardId: string | null;
  loadingCardIds: Set<string>;
  streamingCardIds: Set<string>;
}

/**
 * Card event types
 */
export type CardEventType =
  | 'card:created'
  | 'card:updated'
  | 'card:deleted'
  | 'card:stream:start'
  | 'card:stream:update'
  | 'card:stream:complete'
  | 'card:stream:error';

/**
 * Card event payload
 */
export interface CardEvent {
  type: CardEventType;
  cardId: string;
  card?: AICardConfig;
  error?: Error;
  timestamp: number;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: 'root',
})
export class CardFacade {
  private readonly destroyRef = inject(DestroyRef);
  private readonly streamingService = inject(OSICardsStreamingService);
  private readonly themeService = inject(ThemeService);

  // State signals
  private readonly _cards = signal<Map<string, AICardConfig>>(new Map());
  private readonly _activeCardId = signal<string | null>(null);
  private readonly _loadingCardIds = signal<Set<string>>(new Set());
  private readonly _streamingCardIds = signal<Set<string>>(new Set());

  // Computed values
  public readonly cards = computed(() => Array.from(this._cards().values()));
  public readonly activeCard = computed(() => {
    const id = this._activeCardId();
    return id ? (this._cards().get(id) ?? null) : null;
  });
  public readonly cardCount = computed(() => this._cards().size);
  public readonly hasCards = computed(() => this._cards().size > 0);
  public readonly isLoading = computed(() => this._loadingCardIds().size > 0);
  public readonly isStreaming = computed(() => this._streamingCardIds().size > 0);

  // Event streams
  private readonly _events$ = new Subject<CardEvent>();
  public readonly events$ = this._events$.asObservable();

  // Streaming state
  public readonly streamingState$: Observable<StreamingState> = this.streamingService.state$;
  public readonly cardUpdates$: Observable<CardUpdate> = this.streamingService.cardUpdates$;

  constructor() {
    // Subscribe to streaming updates
    this.streamingService.cardUpdates$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((update) => {
        if (update.card) {
          this.updateCardInternal(update.card);
          this.emitEvent('card:stream:update', update.card.id ?? 'unknown', update.card);
        }
      });

    // Subscribe to streaming state changes
    this.streamingService.state$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((state) => {
      if (state.stage === 'complete') {
        // Clear all streaming card IDs when streaming completes
        this._streamingCardIds.set(new Set());
      }
    });
  }

  // ============================================================================
  // CARD CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new card
   *
   * @example
   * ```typescript
   * const card = facade.createCard({
   *   title: 'Company Profile',
   *   sections: [
   *     { title: 'Overview', type: 'info', fields: [] }
   *   ],
   *   actions: [
   *     { type: 'website', label: 'Visit Website', url: 'https://example.com' }
   *   ]
   * });
   * ```
   */
  public createCard(options: CreateCardOptions): AICardConfig {
    const {
      title,
      sections = [],
      actions,
      description,
      generateIds = true,
      validate = true,
    } = options;

    let card: AICardConfig;

    try {
      card = CardFactory.create().withTitle(title).withSections(sections).build();

      if (description) {
        card.description = description;
      }

      if (actions) {
        card.actions = actions;
      }

      // Ensure all elements have IDs
      if (generateIds) {
        card = this.ensureIds(card);
      }

      // Validate if requested
      if (validate) {
        this.validateCard(card);
      }

      // Store the card
      this.addCard(card);
      this.emitEvent('card:created', card.id!, card);

      return card;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to create card');
    }
  }

  /**
   * Add an existing card to the collection
   */
  public addCard(card: AICardConfig): void {
    const cardWithId = this.ensureIds(card);

    this._cards.update((cards) => {
      const newCards = new Map(cards);
      newCards.set(cardWithId.id!, cardWithId);
      return newCards;
    });
  }

  /**
   * Update a card
   */
  public updateCard(cardId: string, updates: Partial<AICardConfig>): AICardConfig | null {
    const existingCard = this._cards().get(cardId);

    if (!existingCard) {
      console.warn(`Card ${cardId} not found`);
      return null;
    }

    const updatedCard: AICardConfig = {
      ...existingCard,
      ...updates,
      id: cardId, // Preserve ID
    };

    this._cards.update((cards) => {
      const newCards = new Map(cards);
      newCards.set(cardId, updatedCard);
      return newCards;
    });

    this.emitEvent('card:updated', cardId, updatedCard);
    return updatedCard;
  }

  /**
   * Delete a card
   */
  public deleteCard(cardId: string): boolean {
    const existed = this._cards().has(cardId);

    if (existed) {
      this._cards.update((cards) => {
        const newCards = new Map(cards);
        newCards.delete(cardId);
        return newCards;
      });

      // Clear active if it was this card
      if (this._activeCardId() === cardId) {
        this._activeCardId.set(null);
      }

      this.emitEvent('card:deleted', cardId);
    }

    return existed;
  }

  /**
   * Get a card by ID
   */
  public getCard(cardId: string): AICardConfig | null {
    return this._cards().get(cardId) ?? null;
  }

  /**
   * Clear all cards
   */
  public clearCards(): void {
    this._cards.set(new Map());
    this._activeCardId.set(null);
    this._loadingCardIds.set(new Set());
    this._streamingCardIds.set(new Set());
  }

  // ============================================================================
  // STREAMING OPERATIONS
  // ============================================================================

  /**
   * Stream a card from JSON
   */
  public stream(options: StreamCardOptions): Observable<CardUpdate> {
    const { json, instant = false, config, onUpdate, onComplete, onError } = options;

    // Parse to get card ID for tracking
    let cardId: string | undefined;
    try {
      const parsed = JSON.parse(json) as AICardConfig;
      cardId = parsed.id ?? CardUtils.generateId('card');
    } catch {
      cardId = CardUtils.generateId('card');
    }

    // Mark as streaming
    this._streamingCardIds.update((ids) => {
      const newIds = new Set(ids);
      newIds.add(cardId!);
      return newIds;
    });

    this.emitEvent('card:stream:start', cardId);

    // Configure and start streaming
    if (config) {
      this.streamingService.configure(config);
    }

    this.streamingService.start(json, { instant });

    // Return observable with callbacks
    return this.streamingService.cardUpdates$.pipe(
      tap((update) => {
        if (update.card && onUpdate) {
          onUpdate(update.card);
        }
      }),
      filter((update) => update.changeType === 'content' || update.changeType === 'structural'),
      tap((update) => {
        if (this.streamingService.getState().stage === 'complete' && update.card) {
          this._streamingCardIds.update((ids) => {
            const newIds = new Set(ids);
            newIds.delete(cardId!);
            return newIds;
          });
          this.emitEvent('card:stream:complete', cardId!, update.card);
          if (onComplete) {
            onComplete(update.card);
          }
        }
      }),
      catchError((error) => {
        this._streamingCardIds.update((ids) => {
          const newIds = new Set(ids);
          newIds.delete(cardId!);
          return newIds;
        });
        this.emitEvent('card:stream:error', cardId!, undefined, error);
        if (onError) {
          onError(error);
        }
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef),
      shareReplay(1)
    );
  }

  /**
   * Stop streaming
   */
  public stopStreaming(): void {
    this.streamingService.stop();
    this._streamingCardIds.set(new Set());
  }

  /**
   * Reset streaming state
   */
  public resetStreaming(): void {
    this.streamingService.stop();
    this._streamingCardIds.set(new Set());
  }

  /**
   * Check if currently streaming
   */
  public isCurrentlyStreaming(): boolean {
    return this._streamingCardIds().size > 0;
  }

  // ============================================================================
  // CARD SELECTION
  // ============================================================================

  /**
   * Set the active card
   */
  public setActiveCard(cardId: string | null): void {
    if (cardId === null || this._cards().has(cardId)) {
      this._activeCardId.set(cardId);
    }
  }

  /**
   * Get the active card ID
   */
  public getActiveCardId(): string | null {
    return this._activeCardId();
  }

  // ============================================================================
  // SECTION OPERATIONS
  // ============================================================================

  /**
   * Add a section to a card
   *
   * @example
   * ```typescript
   * const added = facade.addSection('card-123', {
   *   title: 'Analytics',
   *   type: 'analytics',
   *   fields: [
   *     { label: 'Revenue', value: '$1M', trend: 'up' }
   *   ]
   * });
   * ```
   */
  public addSection(cardId: string, section: CardSection): boolean {
    const card = this._cards().get(cardId);
    if (!card) return false;

    const sectionWithId = section.id
      ? section
      : {
          ...section,
          id: CardUtils.generateId('section'),
        };

    const updatedCard: AICardConfig = {
      ...card,
      sections: [...card.sections, sectionWithId],
    };

    this._cards.update((cards) => {
      const newCards = new Map(cards);
      newCards.set(cardId, updatedCard);
      return newCards;
    });

    this.emitEvent('card:updated', cardId, updatedCard);
    return true;
  }

  /**
   * Remove a section from a card
   */
  public removeSection(cardId: string, sectionId: string): boolean {
    const card = this._cards().get(cardId);
    if (!card) return false;

    const updatedCard: AICardConfig = {
      ...card,
      sections: card.sections.filter((s) => s.id !== sectionId),
    };

    this._cards.update((cards) => {
      const newCards = new Map(cards);
      newCards.set(cardId, updatedCard);
      return newCards;
    });

    this.emitEvent('card:updated', cardId, updatedCard);
    return true;
  }

  /**
   * Update a section in a card
   */
  public updateSection(cardId: string, sectionId: string, updates: Partial<CardSection>): boolean {
    const card = this._cards().get(cardId);
    if (!card) return false;

    const sectionIndex = card.sections.findIndex((s) => s.id === sectionId);
    if (sectionIndex === -1) return false;

    const updatedSections = [...card.sections];
    const existingSection = updatedSections[sectionIndex];
    if (!existingSection) return false;

    updatedSections[sectionIndex] = {
      ...existingSection,
      ...updates,
      id: sectionId,
      title: updates.title ?? existingSection.title,
    };

    const updatedCard: AICardConfig = {
      ...card,
      sections: updatedSections,
    };

    this._cards.update((cards) => {
      const newCards = new Map(cards);
      newCards.set(cardId, updatedCard);
      return newCards;
    });

    this.emitEvent('card:updated', cardId, updatedCard);
    return true;
  }

  /**
   * Reorder sections in a card
   */
  public reorderSections(cardId: string, sectionIds: string[]): boolean {
    const card = this._cards().get(cardId);
    if (!card) return false;

    const sectionMap = new Map(card.sections.map((s) => [s.id, s]));
    const reorderedSections: CardSection[] = [];

    for (const id of sectionIds) {
      const section = sectionMap.get(id);
      if (section) {
        reorderedSections.push(section);
      }
    }

    // Add any sections that weren't in the ID list
    for (const section of card.sections) {
      if (!sectionIds.includes(section.id ?? '')) {
        reorderedSections.push(section);
      }
    }

    const updatedCard: AICardConfig = {
      ...card,
      sections: reorderedSections,
    };

    this._cards.update((cards) => {
      const newCards = new Map(cards);
      newCards.set(cardId, updatedCard);
      return newCards;
    });

    this.emitEvent('card:updated', cardId, updatedCard);
    return true;
  }

  // ============================================================================
  // THEME OPERATIONS
  // ============================================================================

  /**
   * Set the current theme
   */
  public setTheme(theme: string): void {
    this.themeService.setTheme(theme as Parameters<typeof this.themeService.setTheme>[0]);
  }

  /**
   * Toggle dark mode
   */
  public toggleDarkMode(): void {
    // Theme toggling not directly available - managed via theme service
  }

  /**
   * Get current theme
   */
  public getCurrentTheme(): string {
    return 'light'; // Default theme
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  /**
   * Validate a card configuration
   */
  public validateCard(card: AICardConfig): void {
    const errors: string[] = [];

    if (!card.cardTitle) {
      errors.push('Card title is required');
    }

    if (!card.sections || !Array.isArray(card.sections)) {
      errors.push('Card sections must be an array');
    }

    const sections = card.sections ?? [];
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (!section?.title) {
        errors.push(`Section ${i} is missing a title`);
      }
      if (!section?.type) {
        errors.push(`Section ${i} is missing a type`);
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
  }

  /**
   * Check if a card is valid
   */
  public isValidCard(card: unknown): card is AICardConfig {
    return CardTypeGuards.isAICardConfig(card);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Ensure card and all nested elements have IDs
   */
  private ensureIds(card: AICardConfig): AICardConfig {
    return {
      ...card,
      id: card.id ?? CardUtils.generateId('card'),
      sections: CardUtils.ensureSectionIds(card.sections),
      actions: card.actions?.map((action, i) => ({
        ...action,
        id: action.id ?? CardUtils.generateId(`action_${i}`),
      })),
    };
  }

  /**
   * Update card internally (from streaming)
   */
  private updateCardInternal(card: AICardConfig): void {
    if (!card.id) return;

    this._cards.update((cards) => {
      const newCards = new Map(cards);
      newCards.set(card.id!, card);
      return newCards;
    });
  }

  /**
   * Emit a card event
   */
  private emitEvent(type: CardEventType, cardId: string, card?: AICardConfig, error?: Error): void {
    this._events$.next({
      type,
      cardId,
      card,
      error,
      timestamp: Date.now(),
    });
  }
}

/**
 * Alias for backward compatibility
 */
export const CardFacadeService = CardFacade;
