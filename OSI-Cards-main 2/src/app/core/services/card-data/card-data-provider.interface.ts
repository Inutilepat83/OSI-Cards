import { Observable } from 'rxjs';
import { AICardConfig, CardType, CardSection } from '../../../models';

/**
 * Abstract interface for card data providers
 * Allows pluggable data sources (JSON, WebSocket, API, etc.)
 */
export abstract class CardDataProvider {
  /**
   * Get all available cards
   */
  abstract getAllCards(): Observable<AICardConfig[]>;

  /**
   * Get cards by type
   */
  abstract getCardsByType(cardType: CardType): Observable<AICardConfig[]>;

  /**
   * Get a specific card by ID
   */
  abstract getCardById(id: string): Observable<AICardConfig | null>;

  /**
   * Get all cards with streaming (progressive loading)
   * Optional - defaults to blocking getAllCards() if not implemented
   */
  getAllCardsStreaming?(): Observable<AICardConfig>;

  /**
   * Get cards by type with streaming (progressive loading)
   * Optional - defaults to blocking getCardsByType() if not implemented
   */
  getCardsByTypeStreaming?(cardType: CardType): Observable<AICardConfig>;

  /**
   * Get card sections with streaming (progressive section loading)
   * Optional - for section-level streaming support
   */
  getCardSectionsStreaming?(cardId: string): Observable<CardSection>;

  /**
   * Initialize the provider (optional)
   */
  initialize?(): void;

  /**
   * Clean up resources (optional)
   */
  destroy?(): void;

  /**
   * Check if provider supports real-time updates
   */
  readonly supportsRealtime: boolean = false;

  /**
   * Subscribe to real-time card updates (if supported)
   */
  subscribeToUpdates?(): Observable<{
    type: 'created' | 'updated' | 'deleted';
    card: AICardConfig;
  }>;
}
