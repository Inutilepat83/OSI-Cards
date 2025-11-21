import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap, shareReplay } from 'rxjs/operators';
import { AICardConfig } from '../../../models';
import { CardDataProvider } from './card-data-provider.interface';
import { CardManifest, CardManifestEntry } from './manifest.interface';
import { validateCardJson, sanitizeCardConfig } from '../../../shared/utils/card-utils';

const PRIORITY_ORDER = { high: 3, medium: 2, low: 1 };
const COMPLEXITY_ORDER = { basic: 1, enhanced: 2, enterprise: 3 };

/**
 * JSON file-based card data provider
 * Supports loading cards from JSON files
 * Uses manifest for discovery and streaming support
 */
@Injectable({
  providedIn: 'root'
})
export class JsonFileCardProvider extends CardDataProvider {
  private http = inject(HttpClient);
  private manifestCache$?: Observable<CardManifest>;

  /**
   * Load manifest with caching
   */
  private getManifest(): Observable<CardManifest> {
    if (!this.manifestCache$) {
      this.manifestCache$ = this.http.get<CardManifest>('/assets/configs/manifest.json').pipe(
        catchError(error => {
          console.warn('Failed to load manifest, returning empty catalog:', error);
          return of({
            version: '1.0.0',
            generatedAt: new Date().toISOString(),
            cards: [],
            types: {}
          } as CardManifest);
        }),
        shareReplay(1)
      );
    }
    return this.manifestCache$;
  }

  /**
   * Load card configuration from file (JSON only)
   */
  private loadCardConfig(card: CardManifestEntry): Observable<AICardConfig | null> {
    return this.loadJsonCard(card);
  }

  /**
   * Load JSON-formatted card
   */
  private loadJsonCard(card: CardManifestEntry): Observable<AICardConfig | null> {
    const jsonPath = card.path.endsWith('.json') ? card.path : `${card.path}.json`;
    
    return this.http.get(`/assets/configs/${jsonPath}`, { responseType: 'text' as const }).pipe(
      map((text) => this.decodeJsonToCard(text as string)),
      catchError(() => {
        console.debug(`JSON format not available for ${jsonPath}`);
        return of(null);
      })
    );
  }


  /**
   * Decode JSON text to AICardConfig
   */
  private decodeJsonToCard(text: string): AICardConfig | null {
    try {
      // Validate JSON structure
      const cardConfig = validateCardJson(text);
      
      if (!cardConfig) {
        console.error('JSON validation failed for card');
        return null;
      }

      // Sanitize and ensure IDs
      const sanitized = sanitizeCardConfig(cardConfig);
      return sanitized as AICardConfig;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to decode JSON card: ${msg}`);
      return null;
    }
  }


  /**
   * Get all available cards
   */
  override getAllCards(): Observable<AICardConfig[]> {
    return this.getManifest().pipe(
      switchMap(manifest => {
        if (!manifest.cards || manifest.cards.length === 0) {
          console.warn('Manifest is empty, returning no cards');
          return of([] as AICardConfig[]);
        }

        // Sort by priority
        const sortedCards = [...manifest.cards].sort((a, b) => {
          return (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0);
        });

        // Load all cards in parallel
        const requests = sortedCards.map(card => this.loadCardConfig(card));

        return forkJoin(requests).pipe(
          map(cards => cards.filter((card): card is AICardConfig => card !== null)),
          catchError(error => {
            console.error('Error loading cards:', error);
            return of([] as AICardConfig[]);
          })
        );
      }),
      catchError(error => {
        console.error('Error in getAllCards:', error);
        return of([] as AICardConfig[]);
      })
    );
  }

  /**
   * Get cards by type
   */
  override getCardsByType(cardType: string): Observable<AICardConfig[]> {
    return this.getManifest().pipe(
      switchMap(manifest => {
        if (!manifest.cards || manifest.cards.length === 0) {
          return of([] as AICardConfig[]);
        }

        // Filter by type
        const typeCards = manifest.cards.filter(card => card.type === cardType);

        if (typeCards.length === 0) {
          console.debug(`No cards found for type: ${cardType}`);
          return of([] as AICardConfig[]);
        }

        // Sort by complexity first (basic=1, enhanced=2, enterprise=3) to match variant numbers
        // Then by priority as secondary sort
        const sortedCards = [...typeCards].sort((a, b) => {
          const complexityDiff = (COMPLEXITY_ORDER[a.complexity] || 0) - (COMPLEXITY_ORDER[b.complexity] || 0);
          if (complexityDiff !== 0) {
            return complexityDiff;
          }
          // Secondary sort by priority (high priority first)
          return (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0);
        });

        // Load cards in parallel
        const requests = sortedCards.map(card => this.loadCardConfig(card));

        return forkJoin(requests).pipe(
          map(cards => cards.filter((card): card is AICardConfig => card !== null)),
          catchError(error => {
            console.error(`Error loading cards for type ${cardType}:`, error);
            return of([] as AICardConfig[]);
          })
        );
      })
    );
  }

  /**
   * Get a specific card by ID
   */
  override getCardById(id: string): Observable<AICardConfig | null> {
    return this.getManifest().pipe(
      switchMap(manifest => {
        const cardEntry = manifest.cards?.find(c => c.id === id);
        
        if (!cardEntry) {
          console.warn(`Card not found in manifest: ${id}`);
          return of(null);
        }

        return this.loadCardConfig(cardEntry);
      }),
      catchError(error => {
        console.error(`Error getting card ${id}:`, error);
        return of(null);
      })
    );
  }



  /**
   * Get available card types
   */
  getAvailableCardTypes(): Observable<string[]> {
    return this.getManifest().pipe(
      map(manifest => {
        if (!manifest.types) {
          return [];
        }
        return Object.keys(manifest.types);
      }),
      catchError(error => {
        console.error('Error getting available card types:', error);
        return of([]);
      })
    );
  }
}
