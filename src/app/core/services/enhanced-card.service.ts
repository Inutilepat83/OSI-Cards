import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AICardConfig } from '../../models/card.model';
import { CardService } from '../interfaces/services.interface';
import { LoggingService } from '../interfaces/services.interface';

@Injectable({
  providedIn: 'root',
})
export class EnhancedCardService implements CardService {
  private readonly STORAGE_KEY = 'osi-cards';
  private readonly TEMPLATES_KEY = 'osi-card-templates';

  constructor(private logger: LoggingService) {}

  getAllCards(): Observable<AICardConfig[]> {
    return this.getFromStorage<AICardConfig[]>(this.STORAGE_KEY).pipe(
      map(cards => cards || []),
      catchError(error => {
        this.logger.error('Failed to get all cards', error);
        return of([]);
      })
    );
  }

  getCardById(id: string): Observable<AICardConfig | null> {
    return this.getAllCards().pipe(
      map(cards => cards.find(card => card.id === id) || null),
      catchError(error => {
        this.logger.error(`Failed to get card by id: ${id}`, error);
        return of(null);
      })
    );
  }

  getCardsByType(type: string): Observable<AICardConfig[]> {
    return this.getAllCards().pipe(
      map(cards => cards.filter(card => card.cardType === type)),
      catchError(error => {
        this.logger.error(`Failed to get cards by type: ${type}`, error);
        return of([]);
      })
    );
  }

  createCard(card: AICardConfig): Observable<AICardConfig> {
    return this.getAllCards().pipe(
      map(cards => {
        const newCard: AICardConfig = {
          ...card,
          id: card.id || this.generateId(),
          meta: {
            ...card.meta,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        };

        const updatedCards = [...cards, newCard];
        this.saveToStorage(this.STORAGE_KEY, updatedCards);
        this.logger.info(`Card created: ${newCard.id}`);
        return newCard;
      }),
      catchError(error => {
        this.logger.error('Failed to create card', error);
        return throwError(() => error);
      })
    );
  }

  updateCard(card: AICardConfig): Observable<AICardConfig> {
    return this.getAllCards().pipe(
      map(cards => {
        const index = cards.findIndex(c => c.id === card.id);
        if (index === -1) {
          throw new Error(`Card not found: ${card.id}`);
        }

        const updatedCard: AICardConfig = {
          ...card,
          meta: {
            ...card.meta,
            updatedAt: new Date().toISOString(),
          },
        };

        cards[index] = updatedCard;
        this.saveToStorage(this.STORAGE_KEY, cards);
        this.logger.info(`Card updated: ${updatedCard.id}`);
        return updatedCard;
      }),
      catchError(error => {
        this.logger.error('Failed to update card', error);
        return throwError(() => error);
      })
    );
  }

  deleteCard(id: string): Observable<boolean> {
    return this.getAllCards().pipe(
      map(cards => {
        const filteredCards = cards.filter(card => card.id !== id);
        if (filteredCards.length === cards.length) {
          throw new Error(`Card not found: ${id}`);
        }

        this.saveToStorage(this.STORAGE_KEY, filteredCards);
        this.logger.info(`Card deleted: ${id}`);
        return true;
      }),
      catchError(error => {
        this.logger.error(`Failed to delete card: ${id}`, error);
        return of(false);
      })
    );
  }

  getTemplate(cardType: string, variant: number = 1): Observable<AICardConfig> {
    return this.getFromStorage<Record<string, AICardConfig[]>>(this.TEMPLATES_KEY).pipe(
      map(templates => {
        const typeTemplates = templates?.[cardType];
        if (!typeTemplates || typeTemplates.length === 0) {
          return this.getDefaultTemplate(cardType);
        }

        const template = typeTemplates[variant - 1] || typeTemplates[0];
        return { ...template, id: undefined }; // Remove ID for new cards
      }),
      catchError(error => {
        this.logger.error(`Failed to get template: ${cardType}`, error);
        return of(this.getDefaultTemplate(cardType));
      })
    );
  }

  saveCardConfiguration(config: AICardConfig): Observable<boolean> {
    return this.updateCard(config).pipe(
      map(() => true),
      catchError(error => {
        this.logger.error('Failed to save card configuration', error);
        return of(false);
      })
    );
  }

  exportCard(cardId: string, format: 'pdf' | 'png' | 'json'): Observable<Blob | string> {
    return this.getCardById(cardId).pipe(
      map(card => {
        if (!card) {
          throw new Error(`Card not found: ${cardId}`);
        }

        switch (format) {
          case 'json':
            return JSON.stringify(card, null, 2);
          case 'pdf':
          case 'png':
            // This would integrate with html2canvas or similar
            throw new Error(`Export format ${format} not yet implemented`);
          default:
            throw new Error(`Unsupported export format: ${format}`);
        }
      }),
      catchError(error => {
        this.logger.error(`Failed to export card: ${cardId}`, error);
        return throwError(() => error);
      })
    );
  }

  private getFromStorage<T>(key: string): Observable<T | null> {
    try {
      const data = localStorage.getItem(key);
      return of(data ? JSON.parse(data) : null);
    } catch (error) {
      this.logger.error(`Failed to get from storage: ${key}`, error as Error);
      return of(null);
    }
  }

  private saveToStorage<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      this.logger.error(`Failed to save to storage: ${key}`, error as Error);
      throw error;
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private getDefaultTemplate(cardType: string): AICardConfig {
    return {
      cardTitle: `${cardType.charAt(0).toUpperCase() + cardType.slice(1)} Card`,
      cardType: cardType as any,
      sections: [
        {
          title: 'Overview',
          type: 'overview',
          fields: [
            {
              label: 'Status',
              value: 'Active',
              valueColor: '#10b981',
            },
          ],
        },
      ],
    };
  }
}
