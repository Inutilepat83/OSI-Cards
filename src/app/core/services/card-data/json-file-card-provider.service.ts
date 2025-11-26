import { Injectable, inject, OnDestroy, DestroyRef } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of, forkJoin, throwError, timer } from 'rxjs';
import { map, catchError, switchMap, shareReplay, takeUntil, filter, retryWhen, mergeMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AICardConfig } from '../../../models';
import { CardDataProvider } from './card-data-provider.interface';
import { CardManifest, CardManifestEntry } from './manifest.interface';
import { validateCardJson, sanitizeCardConfig } from '../../../shared/utils/card-utils';
import { LoggingService } from '../logging.service';
import { RequestCanceller } from '../../../shared/utils/request-cancellation.util';
import { RequestQueueService } from '../request-queue.service';
import { IndexedDBCacheService } from '../indexeddb-cache.service';
import { environment } from '../../../../environments/environment';

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
  private requestQueue = inject(RequestQueueService);
  private indexedDBCache = inject(IndexedDBCacheService);
  private manifestCache$?: Observable<CardManifest>;
  private requestCanceller = new RequestCanceller();
  // In-memory cache for instant access (bypasses HTTP for cached items)
  private memoryCache = new Map<string, { data: AICardConfig | null; timestamp: number }>();
  private readonly CACHE_TTL = (environment.performance?.cacheTimeout || 60 * 60 * 1000);

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
   * Load JSON-formatted card with instant cache-first loading
   * Bypasses all async operations if cached for truly instant loading
   */
  private loadJsonCard(card: CardManifestEntry): Observable<AICardConfig | null> {
    const jsonPath = card.path.endsWith('.json') ? card.path : `${card.path}.json`;
    const fullUrl = `/assets/configs/${jsonPath}`;
    
    // Check in-memory cache first (instant, synchronous, no async overhead)
    const cached = this.memoryCache.get(fullUrl);
    const now = Date.now();
    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
      // Return immediately - no async operations, no queue, no HTTP
      return of(cached.data);
    }
    
    // Not in memory cache - check IndexedDB and load in background
    // But don't block - return cached if available, otherwise make request
    return this.indexedDBCache.get(fullUrl).pipe(
      switchMap((indexedEntry: any) => {
        if (indexedEntry && (now - indexedEntry.timestamp) < this.CACHE_TTL) {
          // Decode and cache in memory for instant access next time
          const cardData = this.decodeJsonToCard(indexedEntry.data);
          this.memoryCache.set(fullUrl, { data: cardData, timestamp: indexedEntry.timestamp });
          return of(cardData);
        }
        
        // Not in any cache - make HTTP request (bypass queue for templates to reduce latency)
        const request = new HttpRequest('GET', fullUrl, {
          responseType: 'text'
        });
        
        // For template loading, use higher priority and bypass queue for faster response
        const priority = PRIORITY_ORDER[card.priority] || 0;
        const isTemplate = card.priority === 'high'; // High priority cards are typically templates
        
        if (isTemplate) {
          // Direct HTTP request for templates (no queue delay)
          return this.http.request(request).pipe(
            map((response) => {
              const text = response instanceof HttpResponse ? response.body : response;
              const cardData = this.decodeJsonToCard(text as string);
              
              // Cache immediately for next time
              this.memoryCache.set(fullUrl, { data: cardData, timestamp: now });
              this.indexedDBCache.set(fullUrl, text, now).subscribe({
                error: () => {} // Silent fail
              });
              
              return cardData;
            }),
            takeUntil(this.requestCanceller.cancel$),
            catchError((error) => {
              if (error.name === 'AbortError') {
                return of(null);
              }
              return of(null);
            })
          );
        }
        
        // For non-templates, use queue
        return this.requestQueue.enqueue(() => {
          return this.http.request(request).pipe(
            retryWhen(errors =>
              errors.pipe(
                mergeMap((error, index) => {
                  const retryAttempt = index + 1;
                  const maxRetries = 3;
                  
                  if (error.name === 'AbortError' || (error.status === 404)) {
                    return throwError(() => error);
                  }
                  
                  if (retryAttempt > maxRetries) {
                    return throwError(() => error);
                  }
                  
                  const delay = Math.min(1000 * Math.pow(2, retryAttempt - 1), 4000);
                  return timer(delay);
                })
              )
            ),
            map((response) => {
              const text = response instanceof HttpResponse ? response.body : response;
              const cardData = this.decodeJsonToCard(text as string);
              this.memoryCache.set(fullUrl, { data: cardData, timestamp: now });
              this.indexedDBCache.set(fullUrl, text, now).subscribe({ error: () => {} });
              return cardData;
            }),
            takeUntil(this.requestCanceller.cancel$),
            catchError(() => of(null))
          );
        }, priority);
      }),
      catchError(() => {
        // Fallback: direct HTTP request if IndexedDB fails
        const request = new HttpRequest('GET', fullUrl, { responseType: 'text' });
        return this.http.request(request).pipe(
          map((response) => {
            const text = response instanceof HttpResponse ? response.body : response;
            const cardData = this.decodeJsonToCard(text as string);
            this.memoryCache.set(fullUrl, { data: cardData, timestamp: Date.now() });
            return cardData;
          }),
          takeUntil(this.requestCanceller.cancel$),
          catchError(() => of(null))
        );
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

        // Load cards with request queuing (max 4 concurrent)
        // forkJoin will wait for all requests, but queue limits concurrency
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

        // Load cards with request queuing (max 4 concurrent)
        // forkJoin will wait for all requests, but queue limits concurrency
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
   * Get card by type and variant index (1-based)
   * More efficient than loading all cards of a type
   */
  getCardByTypeAndVariant(cardType: string, variant: number): Observable<AICardConfig | null> {
    return this.getManifest().pipe(
      switchMap(manifest => {
        if (!manifest.cards || manifest.cards.length === 0) {
          this.logger.debug(`No cards found in manifest`, 'JsonFileCardProvider');
          return of(null);
        }

        // Filter by type and sort by priority
        const typeCards = manifest.cards
          .filter(card => card.type === cardType)
          .sort((a, b) => {
            return (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0);
          });

        if (typeCards.length === 0) {
          this.logger.debug(`No cards found for type: ${cardType}`, 'JsonFileCardProvider');
          return of(null);
        }

        // Get the card at the variant index (1-based, so subtract 1)
        const cardIndex = Math.min(variant - 1, typeCards.length - 1);
        const cardEntry = typeCards[cardIndex];

        if (!cardEntry) {
          this.logger.warn(`Card not found for type ${cardType} variant ${variant}`, 'JsonFileCardProvider');
          return of(null);
        }

        return this.loadCardConfig(cardEntry);
      }),
      catchError(error => {
        this.logger.error(`Error getting card by type ${cardType} variant ${variant}`, 'JsonFileCardProvider', error);
        return of(null);
      })
    );
  }

  /**
   * Get the first card from manifest (sorted by priority)
   * More efficient than loading all cards
   */
  getFirstCard(): Observable<AICardConfig | null> {
    return this.getManifest().pipe(
      switchMap(manifest => {
        if (!manifest.cards || manifest.cards.length === 0) {
          this.logger.warn('No cards found in manifest', 'JsonFileCardProvider');
          return of(null);
        }

        // Get the first card (already sorted by priority in manifest)
        const firstCardEntry = manifest.cards[0];

        if (!firstCardEntry) {
          return of(null);
        }

        return this.loadCardConfig(firstCardEntry);
      }),
      catchError(error => {
        this.logger.error('Error getting first card', 'JsonFileCardProvider', error);
        return of(null);
      })
    );
  }

  /**
   * Get manifest entries for a specific type (metadata only, no card data)
   * Useful for finding card IDs without loading full card data
   */
  getManifestEntriesByType(cardType: string): Observable<CardManifestEntry[]> {
    return this.getManifest().pipe(
      map(manifest => {
        if (!manifest.cards || manifest.cards.length === 0) {
          return [];
        }

        return manifest.cards
          .filter(card => card.type === cardType)
          .sort((a, b) => {
            return (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0);
          });
      }),
      catchError(error => {
        this.logger.error(`Error getting manifest entries for type ${cardType}`, 'JsonFileCardProvider', error);
        return of([]);
      })
    );
  }

  /**
   * Pre-load templates into memory cache for instant access
   * Called on app initialization to warm up the cache
   */
  preloadTemplates(): Observable<void> {
    return this.getManifest().pipe(
      switchMap(manifest => {
        if (!manifest.cards || manifest.cards.length === 0) {
          return of(undefined);
        }
        
        // Pre-load high priority cards (templates) - these are the most commonly used
        const templates = manifest.cards
          .filter(card => card.priority === 'high')
          .slice(0, 9); // Pre-load first 9 templates (3 types × 3 variants)
        
        if (templates.length === 0) {
          return of(undefined);
        }
        
        // Load templates in parallel - they'll be cached for instant access
        const loadObservables = templates.map(card => 
          this.loadJsonCard(card).pipe(
            catchError(() => of(null)) // Don't fail individual loads
          )
        );
        
        return forkJoin(loadObservables).pipe(
          map(() => undefined),
          catchError(() => of(undefined)) // Don't fail if preload fails
        );
      }),
      catchError(() => of(undefined)) // Silent fail
    );
  }

  /**
   * Initialize provider - preload templates for instant access
   */
  override initialize?(): void {
    // Preload templates in background (non-blocking)
    this.preloadTemplates().subscribe({
      next: () => {
        this.logger.debug('Templates preloaded successfully', 'JsonFileCardProvider');
      },
      error: (err) => {
        this.logger.debug('Template preload failed (non-critical)', 'JsonFileCardProvider', err);
      }
    });
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    this.requestCanceller.cancel();
  }
}
