import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AICardConfig, CardType } from '../../../models';
import { ICardRepository } from './card-repository.interface';
import { CardDataProvider } from './card-data-provider.interface';
import { CARD_DATA_PROVIDER } from './card-data.service';

/**
 * Card Repository Implementation
 * Provides data access layer abstraction
 * Separates data access concerns from business logic
 */
@Injectable({
  providedIn: 'root'
})
export class CardRepository implements ICardRepository {
  private readonly provider = inject<CardDataProvider>(CARD_DATA_PROVIDER);

  findAll(): Observable<AICardConfig[]> {
    return this.provider.getAllCards();
  }

  findById(id: string): Observable<AICardConfig | null> {
    return this.provider.getCardById(id);
  }

  findByType(type: CardType): Observable<AICardConfig[]> {
    // If type is 'all', return all cards; otherwise filter by type
    if (type === 'all') {
      return this.findAll();
    }
    return this.provider.getCardsByType(type);
  }

  findByTypeAndVariant(type: CardType, variant: number): Observable<AICardConfig | null> {
    if ('getCardByTypeAndVariant' in this.provider && 
        typeof this.provider.getCardByTypeAndVariant === 'function') {
      return (this.provider as any).getCardByTypeAndVariant(type, variant);
    }
    // Fallback implementation
    // If type is 'all', use findAll; otherwise use findByType
    const cards$ = type === 'all' ? this.findAll() : this.findByType(type);
    return cards$.pipe(
      map(cards => {
        if (!cards || cards.length === 0) {
          return null;
        }
        const index = Math.min(variant - 1, cards.length - 1);
        return cards[index] || null;
      })
    );
  }

  search(query: string): Observable<AICardConfig[]> {
    return this.findAll().pipe(
      map(cards => {
        if (!query.trim()) {
          return cards;
        }
        const searchTerm = query.toLowerCase();
        return cards.filter(card => 
          card.cardTitle.toLowerCase().includes(searchTerm) ||
          card.sections?.some(section => 
            section.title?.toLowerCase().includes(searchTerm) ||
            section.fields?.some(field => 
              field.label?.toLowerCase().includes(searchTerm) ||
              String(field.value).toLowerCase().includes(searchTerm)
            )
          )
        );
      })
    );
  }

  getAvailableTypes(): Observable<CardType[]> {
    return this.findAll().pipe(
      map(cards => {
        const types = new Set(cards.map(card => card.cardType));
        const sortedTypes = Array.from(types).sort() as CardType[];
        // Add 'all' at the beginning if it's not already there
        if (!sortedTypes.includes('all' as CardType)) {
          return ['all' as CardType, ...sortedTypes];
        }
        // Move 'all' to the beginning if it exists
        const allIndex = sortedTypes.indexOf('all' as CardType);
        if (allIndex > 0) {
          sortedTypes.splice(allIndex, 1);
          return ['all' as CardType, ...sortedTypes];
        }
        return sortedTypes;
      })
    );
  }

  save(card: AICardConfig): Observable<AICardConfig> {
    // Default implementation - providers can override
    if ('saveCard' in this.provider && typeof this.provider.saveCard === 'function') {
      return (this.provider as any).saveCard(card);
    }
    // For read-only providers, return the card as-is
    return new Observable(observer => {
      observer.next(card);
      observer.complete();
    });
  }

  delete(id: string): Observable<boolean> {
    // Default implementation - providers can override
    if ('deleteCard' in this.provider && typeof this.provider.deleteCard === 'function') {
      return (this.provider as any).deleteCard(id);
    }
    // For read-only providers, return false
    return new Observable(observer => {
      observer.next(false);
      observer.complete();
    });
  }
}



