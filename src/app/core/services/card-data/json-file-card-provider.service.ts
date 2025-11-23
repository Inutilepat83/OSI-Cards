import { Injectable, inject, OnDestroy, DestroyRef } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap, shareReplay, takeUntil, filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AICardConfig } from '../../../models';
import { CardDataProvider } from './card-data-provider.interface';
import { CardManifest, CardManifestEntry } from './manifest.interface';
import { validateCardJson, sanitizeCardConfig } from '../../../shared/utils/card-utils';
import { LoggingService } from '../logging.service';
import { RequestCanceller } from '../../../shared/utils/request-cancellation.util';

const PRIORITY_ORDER = { high: 3, medium: 2, low: 1 };

/**
 * JSON file-based card data provider
 * Supports loading cards from JSON files
 * Uses manifest for discovery and streaming support
 */
@Injectable({
  providedIn: 'root'
})
export class JsonFileCardProvider extends CardDataProvider implements OnDestroy {
  private http = inject(HttpClient);
  private logger = inject(LoggingService);
  private destroyRef = inject(DestroyRef);
  private manifestCache$?: Observable<CardManifest>;
  private requestCanceller = new RequestCanceller();

  /**
   * Load manifest with caching
   */
  private getManifest(): Observable<CardManifest> {
    if (!this.manifestCache$) {
      this.manifestCache$ = this.http.get<CardManifest>('/assets/configs/manifest.json').pipe(
        takeUntil(this.requestCanceller.cancel$),
        catchError((error: unknown): Observable<CardManifest> => {
          if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
            this.logger.debug('Manifest request cancelled', 'JsonFileCardProvider');
            return of({
              version: '1.0.0',
              generatedAt: new Date().toISOString(),
              cards: [],
              types: {}
            } as CardManifest);
          }
          this.logger.warn('Failed to load manifest, returning empty catalog', 'JsonFileCardProvider', error);
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
    const request = new HttpRequest('GET', `/assets/configs/${jsonPath}`, {
      responseType: 'text'
    });
    
    return this.http.request(request).pipe(
      map((response) => {
        const text = response instanceof HttpResponse ? response.body : response;
        return this.decodeJsonToCard(text as string);
      }),
      takeUntil(this.requestCanceller.cancel$),
      catchError((error) => {
        if (error.name === 'AbortError') {
          this.logger.debug(`Request cancelled for ${jsonPath}`, 'JsonFileCardProvider');
          return of(null);
        }
        this.logger.debug(`JSON format not available for ${jsonPath}`, 'JsonFileCardProvider');
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
        this.logger.error('JSON validation failed for card', 'JsonFileCardProvider');
        return null;
      }

      // Sanitize and ensure IDs
      const sanitized = sanitizeCardConfig(cardConfig);
      return sanitized as AICardConfig;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to decode JSON card: ${msg}`, 'JsonFileCardProvider');
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
          this.logger.warn('Manifest is empty, returning no cards', 'JsonFileCardProvider');
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
            this.logger.error('Error loading cards', 'JsonFileCardProvider', error);
            return of([] as AICardConfig[]);
          })
        );
      }),
      catchError(error => {
        this.logger.error('Error in getAllCards', 'JsonFileCardProvider', error);
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
          this.logger.debug(`No cards found for type: ${cardType}`, 'JsonFileCardProvider');
          return of([] as AICardConfig[]);
        }

        // Sort by priority (high priority first)
        const sortedCards = [...typeCards].sort((a, b) => {
          return (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0);
        });

        // Load cards in parallel
        const requests = sortedCards.map(card => this.loadCardConfig(card));

        return forkJoin(requests).pipe(
          map(cards => cards.filter((card): card is AICardConfig => card !== null)),
          catchError(error => {
            this.logger.error(`Error loading cards for type ${cardType}`, 'JsonFileCardProvider', error);
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
          this.logger.warn(`Card not found in manifest: ${id}`, 'JsonFileCardProvider');
          return of(null);
        }

        return this.loadCardConfig(cardEntry);
      }),
      catchError(error => {
        this.logger.error(`Error getting card ${id}`, 'JsonFileCardProvider', error);
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
        this.logger.error('Error getting available card types', 'JsonFileCardProvider', error);
        return of([]);
      })
    );
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    this.requestCanceller.cancel();
  }
}
