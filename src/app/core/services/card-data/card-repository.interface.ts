import { Observable } from 'rxjs';
import { AICardConfig, CardType } from '../../../models';

/**
 * Repository interface for card data access
 * Abstracts data access layer from business logic
 */
export interface ICardRepository {
  /**
   * Get all cards
   */
  findAll(): Observable<AICardConfig[]>;

  /**
   * Get card by ID
   */
  findById(id: string): Observable<AICardConfig | null>;

  /**
   * Get cards by type
   */
  findByType(type: CardType): Observable<AICardConfig[]>;

  /**
   * Get card by type and variant
   */
  findByTypeAndVariant(type: CardType, variant: number): Observable<AICardConfig | null>;

  /**
   * Search cards
   */
  search(query: string): Observable<AICardConfig[]>;

  /**
   * Get available card types
   */
  getAvailableTypes(): Observable<CardType[]>;

  /**
   * Save a card
   */
  save(card: AICardConfig): Observable<AICardConfig>;

  /**
   * Delete a card
   */
  delete(id: string): Observable<boolean>;
}


