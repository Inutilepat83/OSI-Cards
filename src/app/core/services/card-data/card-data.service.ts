import { DestroyRef, inject, Injectable, InjectionToken, OnDestroy } from '@angular/core';
import { BehaviorSubject, combineLatest, EMPTY, Observable, Subject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
  startWith,
  switchMap,
  takeUntil,
} from 'rxjs/operators';
import { AICardConfig, CardType } from '../../../models';
import { CardDataProvider } from './card-data-provider.interface';
import { JsonFileCardProvider } from './json-file-card-provider.service';
import { RequestCanceller } from '../../../shared/utils/request-cancellation.util';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CardRepository } from './card-repository.service';

/**
 * Injection token for card data provider
 * Allows switching between different data sources
 */
export const CARD_DATA_PROVIDER = new InjectionToken<CardDataProvider>('CardDataProvider');

interface CardUpdate {
  type: 'created' | 'updated' | 'deleted';
  card: AICardConfig;
}

/**
 * @ngDoc CardDataService
 * @name CardDataService
 * @description
 * Main card data service that orchestrates different data providers.
 *
 * Provides a unified interface for card data operations, allowing seamless switching
 * between different data sources (JSON files, WebSocket, API, etc.). Uses the provider
 * pattern to abstract data access and enable pluggable data sources.
 *
 * ## Features
 * - Provider-based architecture for flexible data sources
 * - Cached observables with shareReplay for performance
 * - Real-time updates support (when provider supports it)
 * - Automatic provider initialization
 * - Repository pattern for data access
 *
 * @example
 * ```typescript
 * import { inject } from '@angular/core';
 * import { CardDataService } from './core/services/card-data/card-data.service';
 *
 * const cardData = inject(CardDataService);
 *
 * // Get all cards
 * cardData.getAllCards().subscribe(cards => {
 *   console.log('Cards:', cards);
 * });
 *
 * // Get cards by type
 * cardData.getCardsByType('company').subscribe(cards => {
 *   console.log('Company cards:', cards);
 * });
 *
 * // Switch to a different provider (e.g., WebSocket for real-time updates)
 * const wsProvider = inject(WebSocketCardProvider);
 * cardData.switchProvider(wsProvider);
 * ```
 *
 * @see {@link CardDataProvider} for provider interface
 * @see {@link JsonFileCardProvider} for JSON file provider
 * @see {@link WebSocketCardProvider} for WebSocket provider
 * @since 1.0.0
 */
@Injectable({
  providedIn: 'root',
})
export class CardDataService implements OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private provider = inject(CARD_DATA_PROVIDER, { optional: true }) || inject(JsonFileCardProvider);
  private activeProviderSubject = new BehaviorSubject<CardDataProvider>(this.provider);
  private requestCanceller = new RequestCanceller();
  private readonly repository = inject(CardRepository);

  // Cached observables for performance
  private allCards$ = this.activeProviderSubject.pipe(
    switchMap((provider) => provider.getAllCards().pipe(takeUntil(this.requestCanceller.cancel$))),
    shareReplay(1)
  );

  private cardUpdates$ = this.activeProviderSubject.pipe(
    switchMap((provider) =>
      provider.supportsRealtime && provider.subscribeToUpdates
        ? provider.subscribeToUpdates()
        : (EMPTY as Observable<CardUpdate>)
    ),
    startWith(null as CardUpdate | null)
  );

  constructor() {
    // Initialize the active provider in constructor to ensure it's ready immediately
    if (this.provider.initialize) {
      this.provider.initialize();
    }
  }

  /**
   * Get all available cards
   * Uses repository pattern for data access
   */
  getAllCards(): Observable<AICardConfig[]> {
    return this.repository.findAll();
  }

  /**
   * Get cards filtered by type
   * Uses repository pattern for data access
   */
  getCardsByType(cardType: CardType): Observable<AICardConfig[]> {
    return this.repository.findByType(cardType);
  }

  /**
   * Get a specific card by ID
   * Uses repository pattern for data access
   */
  getCardById(id: string): Observable<AICardConfig | null> {
    return this.repository.findById(id);
  }

  /**
   * Get card by type and variant index (1-based)
   * More efficient than loading all cards of a type
   * Uses repository pattern for data access
   */
  getCardByTypeAndVariant(cardType: CardType, variant: number): Observable<AICardConfig | null> {
    return this.repository.findByTypeAndVariant(cardType, variant);
  }

  /**
   * Get the first card from manifest (sorted by priority)
   * More efficient than loading all cards
   * Only works with JsonFileCardProvider
   */
  getFirstCard(): Observable<AICardConfig | null> {
    const provider = this.getCurrentProvider();
    if (provider && 'getFirstCard' in provider && typeof provider.getFirstCard === 'function') {
      return (provider as any).getFirstCard();
    }
    // Fallback to getAllCards if method not available
    return this.getAllCards().pipe(
      map((cards) => {
        if (!cards || cards.length === 0) {
          return null;
        }
        const firstCard = cards[0];
        return firstCard ?? null;
      }),
      map((card) => card ?? null) // Ensure we return null, not undefined
    );
  }

  /**
   * Get unique card types from all available cards
   * Uses repository pattern for data access
   */
  getAvailableCardTypes(): Observable<CardType[]> {
    return this.repository.getAvailableTypes();
  }

  private searchSubject = new Subject<string>();
  private searchResults$ = this.searchSubject.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((query) => {
      if (!query.trim()) {
        return this.repository.findAll();
      }
      return this.repository.search(query);
    }),
    shareReplay(1)
  );

  /**
   * Search cards by title or content
   *
   * Performs a case-insensitive search across:
   * - Card titles
   * - Section titles
   * - Field labels and values
   *
   * Uses repository pattern for data access with debouncing
   *
   * @param query - Search query string (case-insensitive)
   * @returns Observable of matching cards
   *
   * @example
   * ```typescript
   * cardData.searchCards('company').subscribe(cards => {
   *   console.log(`Found ${cards.length} matching cards`);
   * });
   * ```
   */
  searchCards(query: string): Observable<AICardConfig[]> {
    this.searchSubject.next(query);
    return this.searchResults$;
  }

  /**
   * Get cards with real-time updates (if supported)
   */
  getCardsWithUpdates(): Observable<{
    cards: AICardConfig[];
    lastUpdate: CardUpdate | null;
  }> {
    return combineLatest([this.allCards$, this.cardUpdates$]).pipe(
      map(([cards, lastUpdate]) => ({
        cards,
        lastUpdate,
      }))
    );
  }

  /**
   * Switch to a different data provider
   *
   * Automatically:
   * - Cleans up the current provider (calls destroy if available)
   * - Initializes the new provider (calls initialize if available)
   * - Cancels all in-flight requests from the previous provider
   *
   * @param newProvider - The new card data provider to use
   *
   * @example
   * ```typescript
   * const apiProvider = inject(ApiCardProvider);
   * cardData.switchProvider(apiProvider);
   * ```
   */
  switchProvider(newProvider: CardDataProvider): void {
    // Clean up current provider
    const currentProvider = this.activeProviderSubject.value;
    if (currentProvider.destroy) {
      currentProvider.destroy();
    }

    // Initialize new provider
    if (newProvider.initialize) {
      newProvider.initialize();
    }

    this.activeProviderSubject.next(newProvider);
  }

  /**
   * Get the current active provider
   */
  getCurrentProvider(): CardDataProvider {
    return this.activeProviderSubject.value;
  }

  /**
   * Check if the current provider supports real-time updates
   */
  supportsRealtime(): boolean {
    return this.activeProviderSubject.value.supportsRealtime;
  }

  /**
   * Subscribe to real-time card updates (if supported)
   */
  subscribeToUpdates(): Observable<CardUpdate> {
    return this.cardUpdates$.pipe(filter((update): update is CardUpdate => update !== null));
  }

  /**
   * Get provider statistics and info
   */
  getProviderInfo(): Observable<{
    type: string;
    supportsRealtime: boolean;
    totalCards: number;
    cardTypes: string[];
  }> {
    return combineLatest([this.allCards$, this.getAvailableCardTypes()]).pipe(
      map(([cards, types]) => ({
        type: this.getCurrentProvider().constructor.name,
        supportsRealtime: this.supportsRealtime(),
        totalCards: cards.length,
        cardTypes: types,
      }))
    );
  }

  /**
   * Cancel all in-flight requests
   *
   * Useful for cleanup or when switching contexts.
   * Automatically called on service destruction.
   *
   * @example
   * ```typescript
   * // Cancel all requests before switching providers
   * cardData.cancelRequests();
   * cardData.switchProvider(newProvider);
   * ```
   */
  cancelRequests(): void {
    this.requestCanceller.cancel();
  }

  /**
   * Clean up resources
   */
  ngOnDestroy(): void {
    this.cancelRequests();
    const provider = this.activeProviderSubject.value;
    if (provider.destroy) {
      provider.destroy();
    }
  }
}
