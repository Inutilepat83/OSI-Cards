import { Observable } from 'rxjs';
import { AICardConfig, CardType, CardSection } from '../../../models';

/**
 * Interface for card data service
 * Enables better testability and abstraction
 */
export interface ICardDataService {
  /**
   * Get all available cards
   */
  getAllCards(): Observable<AICardConfig[]>;

  /**
   * Get cards filtered by type
   */
  getCardsByType(cardType: CardType): Observable<AICardConfig[]>;

  /**
   * Get all cards with streaming (progressive loading)
   */
  getAllCardsStreaming(): Observable<AICardConfig>;

  /**
   * Get cards by type with streaming (progressive loading)
   */
  getCardsByTypeStreaming(cardType: CardType): Observable<AICardConfig>;

  /**
   * Get card sections with streaming (progressive section loading)
   */
  getCardSectionsStreaming(cardId: string): Observable<CardSection>;

  /**
   * Get a specific card by ID
   */
  getCardById(id: string): Observable<AICardConfig | null>;

  /**
   * Search cards by query
   */
  searchCards(query: string): Observable<AICardConfig[]>;

  /**
   * Switch to a different data provider
   */
  switchProvider(provider: any): void;
}

