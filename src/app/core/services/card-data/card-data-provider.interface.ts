import { Observable } from 'rxjs';
import { AICardConfig, CardType } from '../../../models';

/**
 * Card update event emitted by providers that support real-time updates
 */
export interface CardUpdateEvent {
  /** Type of update operation */
  type: 'created' | 'updated' | 'deleted';
  /** The card that was affected */
  card: AICardConfig;
  /** Optional timestamp of the update */
  timestamp?: number;
  /** Optional metadata about the update */
  metadata?: Record<string, unknown>;
}

/**
 * Provider status information
 */
export interface ProviderStatus {
  /** Whether the provider is currently connected/available */
  isConnected: boolean;
  /** Last error message, if any */
  lastError?: string;
  /** Timestamp of last successful operation */
  lastSuccess?: number;
  /** Number of cards currently available */
  cardCount?: number;
}

/**
 * Abstract interface for card data providers
 * Allows pluggable data sources (JSON, WebSocket, API, etc.)
 *
 * All card data providers must implement this interface to ensure
 * consistent behavior across different data sources.
 *
 * @example
 * ```typescript
 * export class MyCustomProvider extends CardDataProvider {
 *   getAllCards(): Observable<AICardConfig[]> {
 *     // Implementation
 *   }
 *
 *   getCardsByType(cardType: CardType): Observable<AICardConfig[]> {
 *     // Implementation
 *   }
 *
 *   getCardById(id: string): Observable<AICardConfig | null> {
 *     // Implementation
 *   }
 * }
 * ```
 */
export abstract class CardDataProvider {
  /**
   * Get all available cards
   * @returns Observable that emits an array of all available cards
   */
  abstract getAllCards(): Observable<AICardConfig[]>;

  /**
   * Get cards filtered by type
   * @param cardType - The type of cards to retrieve
   * @returns Observable that emits an array of cards matching the specified type
   */
  abstract getCardsByType(cardType: CardType): Observable<AICardConfig[]>;

  /**
   * Get a specific card by its unique identifier
   * @param id - The unique identifier of the card
   * @returns Observable that emits the card if found, or null if not found
   */
  abstract getCardById(id: string): Observable<AICardConfig | null>;

  /**
   * Initialize the provider (optional)
   * Called when the provider is first activated to set up connections, caches, etc.
   */
  initialize?(): void | Promise<void>;

  /**
   * Clean up resources (optional)
   * Called when the provider is being deactivated to close connections, clear caches, etc.
   */
  destroy?(): void | Promise<void>;

  /**
   * Check if provider supports real-time updates
   * If true, subscribeToUpdates() should be implemented
   */
  readonly supportsRealtime: boolean = false;

  /**
   * Subscribe to real-time card updates (if supported)
   * Only available if supportsRealtime is true
   * @returns Observable that emits card update events
   */
  subscribeToUpdates?(): Observable<CardUpdateEvent>;

  /**
   * Get provider status information (optional)
   * Useful for monitoring provider health and connection status
   * @returns Observable that emits current provider status
   */
  getStatus?(): Observable<ProviderStatus>;

  /**
   * Provider name for logging and debugging
   */
  readonly name?: string;
}
