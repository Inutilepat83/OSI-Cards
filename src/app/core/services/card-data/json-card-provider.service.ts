import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AICardConfig } from '../../../models';
import { CardDataProvider } from './card-data-provider.interface';

/**
 * JSON file-based card data provider
 * Loads cards from static JSON files in assets folder
 */
@Injectable({
  providedIn: 'root'
})
export class JsonCardProvider extends CardDataProvider {
  private http = inject(HttpClient);

  // Define the mapping of card types to their config directories
  private cardTypeConfigMapping: Record<string, string> = {
    company: 'companies',
    contact: 'contacts',
    product: 'products',
    project: 'projects',
    analytics: 'analytics',
    opportunity: 'opportunities',
    event: 'events',
    financials: 'financials'
  };

  getAllCards(): Observable<AICardConfig[]> {
    // Load all JSON files from configs directories
    const allCardFiles: string[] = [];

    // Add files for each card type from configs
    Object.entries(this.cardTypeConfigMapping).forEach(([cardType, directory]) => {
      // For now, we'll need to know the files. In a real scenario, you might want to
      // maintain a manifest file or use a different approach
      // For company type, load from companies directory
      if (cardType === 'company') {
        allCardFiles.push(
          '/assets/configs/companies/dsm.json',
          '/assets/configs/companies/google.json',
          '/assets/configs/companies/pfizer.json'
        );
      }
      // Add other types as needed
    });

    const requests = allCardFiles.map(file => this.http.get<AICardConfig>(file).pipe(
      map(card => {
        // Normalize cardType to lowercase
        if (card && card.cardType) {
          card.cardType = card.cardType.toLowerCase() as any;
        }
        return card;
      }),
      catchError(error => {
        console.warn(`Failed to load card from ${file}:`, error);
        return of(null);
      })
    ));

    return forkJoin(requests).pipe(
      map(cards => cards.filter(card => card !== null) as AICardConfig[])
    );
  }

  getCardsByType(cardType: string): Observable<AICardConfig[]> {
    const directory = this.cardTypeConfigMapping[cardType];
    if (!directory) {
      console.warn(`Unknown card type: ${cardType}`);
      return of([]);
    }

    // Load all JSON files from the specific config directory
    // For company type, return the available company cards
    if (cardType === 'company') {
      const cardFiles = [
        '/assets/configs/companies/dsm.json',
        '/assets/configs/companies/google.json',
        '/assets/configs/companies/pfizer.json'
      ];

      const requests = cardFiles.map(file => this.http.get<AICardConfig>(file).pipe(
        map(card => {
          // Normalize cardType to lowercase
          if (card && card.cardType) {
            card.cardType = card.cardType.toLowerCase() as any;
          }
          return card;
        }),
        catchError(error => {
          console.warn(`Failed to load card from ${file}:`, error);
          return of(null);
        })
      ));

      return forkJoin(requests).pipe(
        map(cards => cards.filter(card => card !== null) as AICardConfig[])
      );
    }

    // For other types, return empty array for now
    return of([]);
  }

  getCardById(id: string): Observable<AICardConfig | null> {
    // For JSON provider, we need to search through all cards
    return this.getAllCards().pipe(
      map(cards => cards.find(card => card.id === id) || null)
    );
  }

  /**
   * Get card configuration by complexity level
   * Note: This method is kept for backward compatibility but may not work with the new config structure
   */
  getCardByComplexity(cardType: string, complexity: 'basic' | 'enhanced' | 'enterprise'): Observable<AICardConfig | null> {
    // For now, return the first card of the requested type
    // In the future, you might want to add complexity metadata to JSON files
    return this.getCardsByType(cardType).pipe(
      map(cards => {
        if (cards.length === 0) return null;
        // Return first card as default, or implement complexity-based selection
        return cards[0] || null;
      })
    );
  }

  /**
   * Get available card types
   */
  getAvailableCardTypes(): string[] {
    return Object.keys(this.cardTypeConfigMapping);
  }
}
