import { Injectable, inject, InjectionToken } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, switchMap, shareReplay, startWith } from 'rxjs/operators';
import { AICardConfig } from '../../../models';
import { CardDataProvider } from './card-data-provider.interface';
import { JsonCardProvider } from './json-card-provider.service';

/**
 * Injection token for card data provider
 * Allows switching between different data sources
 */
export const CARD_DATA_PROVIDER = new InjectionToken<CardDataProvider>('CardDataProvider');

/**
 * Main card data service that orchestrates different data providers
 * Provides a unified interface for card data operations
 */
@Injectable({
  providedIn: 'root'
})
export class CardDataService {
  private provider = inject(CARD_DATA_PROVIDER, { optional: true }) || inject(JsonCardProvider);
  private activeProviderSubject = new BehaviorSubject<CardDataProvider>(this.provider);

  // Cached observables for performance
  private allCards$ = this.activeProviderSubject.pipe(
    switchMap(provider => provider.getAllCards()),
    shareReplay(1)
  );

  private cardUpdates$ = this.activeProviderSubject.pipe(
    switchMap(provider => 
      provider.supportsRealtime && provider.subscribeToUpdates 
        ? provider.subscribeToUpdates() 
        : new Observable<{type: 'created' | 'updated' | 'deleted'; card: AICardConfig}>(observer => {}) // Empty observable for non-realtime providers
    ),
    startWith(null as {type: 'created' | 'updated' | 'deleted'; card: AICardConfig} | null)
  );

  constructor() {
    // Initialize the active provider
    if (this.provider.initialize) {
      this.provider.initialize();
    }
  }

  /**
   * Get all available cards
   */
  getAllCards(): Observable<AICardConfig[]> {
    return this.allCards$;
  }

  /**
   * Get cards filtered by type
   */
  getCardsByType(cardType: string): Observable<AICardConfig[]> {
    return this.activeProviderSubject.pipe(
      switchMap(provider => provider.getCardsByType(cardType))
    );
  }

  /**
   * Get a specific card by ID
   */
  getCardById(id: string): Observable<AICardConfig | null> {
    return this.activeProviderSubject.pipe(
      switchMap(provider => provider.getCardById(id))
    );
  }

  /**
   * Get unique card types from all available cards
   */
  getAvailableCardTypes(): Observable<string[]> {
    return this.allCards$.pipe(
      map(cards => {
        const types = new Set(cards.map(card => card.cardType));
        return Array.from(types).sort();
      })
    );
  }

  /**
   * Search cards by title or content
   */
  searchCards(query: string): Observable<AICardConfig[]> {
    if (!query.trim()) {
      return this.allCards$;
    }

    const searchTerm = query.toLowerCase();
    return this.allCards$.pipe(
      map(cards => cards.filter(card => 
        card.cardTitle.toLowerCase().includes(searchTerm) ||
        card.sections?.some(section => 
          section.title?.toLowerCase().includes(searchTerm) ||
          section.fields?.some(field => 
            field.label?.toLowerCase().includes(searchTerm) ||
            String(field.value).toLowerCase().includes(searchTerm)
          )
        )
      ))
    );
  }

  /**
   * Get cards with real-time updates (if supported)
   */
  getCardsWithUpdates(): Observable<{
    cards: AICardConfig[];
    lastUpdate: {
      type: 'created' | 'updated' | 'deleted';
      card: AICardConfig;
    } | null;
  }> {
    return combineLatest([
      this.allCards$,
      this.cardUpdates$
    ]).pipe(
      map(([cards, lastUpdate]) => ({
        cards,
        lastUpdate
      }))
    );
  }

  /**
   * Switch to a different data provider
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
  subscribeToUpdates(): Observable<{
    type: 'created' | 'updated' | 'deleted';
    card: AICardConfig;
  }> {
    return this.cardUpdates$.pipe(
      map(update => update!),
      // Filter out null values (initial startWith value)
      map(update => update as {type: 'created' | 'updated' | 'deleted'; card: AICardConfig})
    );
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
    return combineLatest([
      this.allCards$,
      this.getAvailableCardTypes()
    ]).pipe(
      map(([cards, types]) => ({
        type: this.getCurrentProvider().constructor.name,
        supportsRealtime: this.supportsRealtime(),
        totalCards: cards.length,
        cardTypes: types
      }))
    );
  }

  /**
   * Clean up resources
   */
  ngOnDestroy(): void {
    const provider = this.activeProviderSubject.value;
    if (provider.destroy) {
      provider.destroy();
    }
  }
}
