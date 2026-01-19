import { DestroyRef, inject, Injectable, isDevMode, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of, throwError, timer } from 'rxjs';
import {
  catchError,
  filter,
  map,
  mergeMap,
  retryWhen,
  shareReplay,
  switchMap,
  takeUntil,
} from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AICardConfig } from '../../../models';
import { CardDataProvider } from './card-data-provider.interface';
import { CardManifest, CardManifestEntry } from './manifest.interface';
import { sanitizeCardConfig } from '../../../shared/utils/card-utils';
import { CardValidationService } from '../../../shared/services/card-validation.service';
import { ValidationService } from '../validation.service';
import { LoggingService } from '../logging.service';
import { RequestCanceller } from '../../../shared/utils/request-cancellation.util';
import { RequestQueueService } from '../request-queue.service';
import { IndexedDBCacheService } from '../indexeddb-cache.service';
import { environment } from '../../../../environments/environment';
import { VERSION } from '../../../../version';
import { isCachedVersionValid } from '../../utils/version-comparison.util';

const PRIORITY_ORDER = { high: 3, medium: 2, low: 1 };

/**
 * JSON file-based card data provider
 * Supports loading cards from JSON files
 * Uses manifest for discovery and streaming support
 */
@Injectable({
  providedIn: 'root',
})
export class JsonFileCardProvider extends CardDataProvider implements OnDestroy {
  private http = inject(HttpClient);
  private logger = inject(LoggingService);
  private destroyRef = inject(DestroyRef);
  private requestQueue = inject(RequestQueueService);
  private indexedDBCache: IndexedDBCacheService = inject(IndexedDBCacheService);
  private validationService = inject(CardValidationService);
  private zodValidationService = inject(ValidationService);
  private manifestCache$?: Observable<CardManifest>;
  private requestCanceller = new RequestCanceller();
  // In-memory cache for instant access (bypasses HTTP for cached items)
  private memoryCache = new Map<
    string,
    { data: AICardConfig | null; timestamp: number; version?: string }
  >();
  private readonly CACHE_TTL = environment.performance?.cacheTimeout || 60 * 60 * 1000;
  private readonly CURRENT_VERSION = VERSION;

  /**
   * Load manifest with caching
   */
  private getManifest(): Observable<CardManifest> {
    if (!this.manifestCache$) {
      this.manifestCache$ = this.http.get<CardManifest>('/assets/configs/manifest.json').pipe(
        takeUntil(this.requestCanceller.cancel$),
        catchError((error: unknown): Observable<CardManifest> => {
          if (
            error &&
            typeof error === 'object' &&
            'name' in error &&
            error.name === 'AbortError'
          ) {
            this.logger.debug('Manifest request cancelled', 'JsonFileCardProvider');
            return of({
              version: '1.0.0',
              generatedAt: new Date().toISOString(),
              cards: [],
              types: {},
            } as CardManifest);
          }
          this.logger.warn(
            'Failed to load manifest, returning empty catalog',
            'JsonFileCardProvider',
            error
          );
          return of({
            version: '1.0.0',
            generatedAt: new Date().toISOString(),
            cards: [],
            types: {},
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
    // Validate card.path before constructing fullUrl
    if (!card?.path || typeof card.path !== 'string' || card.path.trim().length === 0) {
      this.logger.warn('Invalid card path provided', 'JsonFileCardProvider', { card });
      return of(null);
    }

    const jsonPath = card.path.endsWith('.json') ? card.path : `${card.path}.json`;
    const fullUrl = `/assets/configs/${jsonPath}`;

    // Validate fullUrl is valid before using it
    if (!fullUrl || fullUrl.trim().length === 0 || fullUrl === '/assets/configs/') {
      this.logger.warn('Invalid fullUrl constructed', 'JsonFileCardProvider', {
        card,
        jsonPath,
        fullUrl,
      });
      return of(null);
    }

    // Check in-memory cache first (instant, synchronous, no async overhead)
    const cached = this.memoryCache.get(fullUrl);
    const now = Date.now();
    if (cached && now - cached.timestamp < this.CACHE_TTL) {
      // Check version before using cached data
      if (isCachedVersionValid(cached.version, this.CURRENT_VERSION)) {
        // Return immediately - no async operations, no queue, no HTTP
        return of(cached.data);
      } else {
        // Version mismatch - invalidate cache
        this.logger.debug(
          `Cache version mismatch for ${fullUrl}: cached=${cached.version}, current=${this.CURRENT_VERSION}. Invalidating cache.`,
          'JsonFileCardProvider'
        );
        this.memoryCache.delete(fullUrl);
        // Fall through to IndexedDB check or HTTP request
      }
    }

    // Not in memory cache - check IndexedDB and load in background
    // But don't block - return cached if available, otherwise make request
    return this.indexedDBCache.get(fullUrl).pipe(
      switchMap((indexedEntry: any) => {
        if (indexedEntry && now - indexedEntry.timestamp < this.CACHE_TTL) {
          // Check version before using cached data
          if (!isCachedVersionValid(indexedEntry.version, this.CURRENT_VERSION)) {
            // Version mismatch - invalidate cache
            this.logger.debug(
              `IndexedDB cache version mismatch for ${fullUrl}: cached=${indexedEntry.version}, current=${this.CURRENT_VERSION}. Invalidating cache.`,
              'JsonFileCardProvider'
            );
            this.indexedDBCache.delete(fullUrl).subscribe();
            // Fall through to HTTP request
          } else {
            try {
              // Ensure data is a string - handle both string and object cases
              let jsonText: string;
              if (typeof indexedEntry.data === 'string') {
                jsonText = indexedEntry.data;
              } else if (typeof indexedEntry.data === 'object') {
                // If it was stored as an object, stringify it
                jsonText = JSON.stringify(indexedEntry.data);
              } else {
                this.logger.warn(`Invalid cached data type for ${fullUrl}`, 'JsonFileCardProvider');
                throw new Error('Invalid cached data format');
              }

              // Decode and cache in memory for instant access next time
              const cardData = this.decodeJsonToCard(jsonText);
              if (cardData) {
                this.memoryCache.set(fullUrl, {
                  data: cardData,
                  timestamp: indexedEntry.timestamp,
                  version: indexedEntry.version,
                });
                return of(cardData);
              } else {
                // Cached data is invalid, clear it and fetch fresh
                this.indexedDBCache.delete(fullUrl).subscribe();
                throw new Error('Invalid cached data');
              }
            } catch (error) {
              // Cached data is corrupted, clear it and fetch fresh
              this.logger.warn(
                `Cached data invalid for ${fullUrl}, fetching fresh`,
                'JsonFileCardProvider',
                error
              );
              this.indexedDBCache.delete(fullUrl).subscribe();
              // Fall through to HTTP request
            }
          }
        }

        // Not in any cache - make HTTP request (bypass queue for templates to reduce latency)
        // Use HttpClient.get directly with responseType: 'text' for simpler handling
        const priority = PRIORITY_ORDER[card.priority] || 0;
        const isTemplate = card.priority === 'high'; // High priority cards are typically templates

        const makeHttpRequest = () => {
          return this.http.get(fullUrl, { responseType: 'text' }).pipe(
            map((text: string) => {
              if (!text || typeof text !== 'string') {
                throw new Error(`Invalid response type: expected string, got ${typeof text}`);
              }

              const cardData = this.decodeJsonToCard(text);

              if (!cardData) {
                throw new Error('Failed to decode JSON card');
              }

              // Cache immediately for next time with current version
              this.memoryCache.set(fullUrl, {
                data: cardData,
                timestamp: now,
                version: this.CURRENT_VERSION,
              });

              // Validate fullUrl before caching to IndexedDB
              if (fullUrl && fullUrl.trim().length > 0 && fullUrl !== '/assets/configs/') {
                this.indexedDBCache.set(fullUrl, text, now, this.CURRENT_VERSION).subscribe({
                  error: (err) => {
                    this.logger.debug(
                      'Failed to cache in IndexedDB (non-critical)',
                      'JsonFileCardProvider',
                      err
                    );
                  },
                });
              } else {
                this.logger.warn(
                  'Skipping IndexedDB cache due to invalid fullUrl',
                  'JsonFileCardProvider',
                  { fullUrl }
                );
              }

              return cardData;
            }),
            takeUntil(this.requestCanceller.cancel$),
            catchError((error: unknown) => {
              const errorMessage = error instanceof Error ? error.message : String(error);
              const errorName =
                error && typeof error === 'object' && 'name' in error ? error.name : '';

              if (errorName === 'AbortError') {
                this.logger.debug(`Request cancelled for ${fullUrl}`, 'JsonFileCardProvider');
                return of(null);
              }

              // Log detailed error information
              const statusCode =
                error && typeof error === 'object' && 'status' in error
                  ? (error as any).status
                  : 'unknown';
              this.logger.error(
                `Failed to load JSON card from ${fullUrl}: ${errorMessage} (status: ${statusCode})`,
                'JsonFileCardProvider',
                error
              );

              return of(null);
            })
          );
        };

        if (isTemplate) {
          // Direct HTTP request for templates (no queue delay)
          return makeHttpRequest();
        }

        // For non-templates, use queue
        return this.requestQueue.enqueue(() => {
          return makeHttpRequest().pipe(
            retryWhen((errors) =>
              errors.pipe(
                mergeMap((error, index) => {
                  const retryAttempt = index + 1;
                  const maxRetries = 3;

                  const errorName =
                    error && typeof error === 'object' && 'name' in error ? error.name : '';
                  const statusCode =
                    error && typeof error === 'object' && 'status' in error
                      ? (error as any).status
                      : null;

                  if (errorName === 'AbortError' || statusCode === 404) {
                    return throwError(() => error);
                  }

                  if (retryAttempt > maxRetries) {
                    this.logger.warn(
                      `Max retries reached for ${fullUrl} after ${retryAttempt} attempts`,
                      'JsonFileCardProvider'
                    );
                    return throwError(() => error);
                  }

                  const delay = Math.min(1000 * Math.pow(2, retryAttempt - 1), 4000);
                  this.logger.debug(
                    `Retrying ${fullUrl} (attempt ${retryAttempt}/${maxRetries}) after ${delay}ms`,
                    'JsonFileCardProvider'
                  );
                  return timer(delay);
                })
              )
            )
          );
        }, priority);
      }),
      catchError((error: unknown) => {
        // Fallback: direct HTTP request if IndexedDB fails
        this.logger.warn(
          `IndexedDB lookup failed for ${fullUrl}, using direct HTTP`,
          'JsonFileCardProvider',
          error
        );
        return this.http.get(fullUrl, { responseType: 'text' }).pipe(
          map((text: string) => {
            if (!text || typeof text !== 'string') {
              throw new Error(`Invalid response type: expected string, got ${typeof text}`);
            }
            const cardData = this.decodeJsonToCard(text);
            if (cardData) {
              this.memoryCache.set(fullUrl, {
                data: cardData,
                timestamp: Date.now(),
                version: this.CURRENT_VERSION,
              });
            }
            return cardData;
          }),
          takeUntil(this.requestCanceller.cancel$),
          catchError((httpError: unknown) => {
            const errorMessage = httpError instanceof Error ? httpError.message : String(httpError);
            this.logger.error(
              `Fallback HTTP request failed for ${fullUrl}: ${errorMessage}`,
              'JsonFileCardProvider',
              httpError
            );
            return of(null);
          })
        );
      })
    );
  }

  /**
   * Decode JSON text to AICardConfig
   */
  private decodeJsonToCard(text: string): AICardConfig | null {
    if (!text || typeof text !== 'string') {
      this.logger.error('Invalid input: expected string', 'JsonFileCardProvider', {
        type: typeof text,
      });
      return null;
    }

    const trimmed = text.trim();
    if (trimmed.length === 0) {
      this.logger.error('Empty JSON string provided', 'JsonFileCardProvider');
      return null;
    }

    try {
      // First, try to parse as JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(trimmed);
      } catch (parseError: unknown) {
        const parseMsg = parseError instanceof Error ? parseError.message : 'Unknown parse error';
        this.logger.error(`JSON parse failed: ${parseMsg}`, 'JsonFileCardProvider', {
          error: parseError,
          preview: trimmed.substring(0, 200),
        });
        return null;
      }

      // Validate that it's an object
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        this.logger.error('Parsed JSON is not an object', 'JsonFileCardProvider', {
          type: typeof parsed,
          isArray: Array.isArray(parsed),
        });
        return null;
      }

      // Validate JSON structure using CardValidationService
      const cardConfig = this.validationService.validateCardJson(trimmed);

      if (!cardConfig) {
        // Try to provide more helpful error message
        const hasTitle = 'cardTitle' in parsed || 'title' in parsed;
        const hasSections = 'sections' in parsed && Array.isArray((parsed as any).sections);

        this.logger.error('JSON validation failed for card', 'JsonFileCardProvider', {
          hasTitle,
          hasSections,
          keys: Object.keys(parsed),
          preview: JSON.stringify(parsed).substring(0, 500),
        });
        return null;
      }

      // Additional runtime type validation using Zod
      const zodResult = this.zodValidationService.validateCard(cardConfig);
      if (!zodResult.success) {
        // Validation failures are non-blocking and expected during schema evolution
        // Log as debug to avoid console noise (only if debug is enabled)
        // Continue with cardConfig even if Zod validation fails (non-blocking)
        // This allows cards to work while we refine the schema
        // Note: ValidationService already logs validation failures as debug, so we don't need to log here
      }

      // Sanitize and ensure IDs
      const sanitized = sanitizeCardConfig(cardConfig);

      // Ensure it has required fields after sanitization
      if (!sanitized.cardTitle || !Array.isArray(sanitized.sections)) {
        this.logger.error('Sanitized card missing required fields', 'JsonFileCardProvider', {
          hasTitle: !!sanitized.cardTitle,
          hasSections: Array.isArray(sanitized.sections),
        });
        return null;
      }

      return sanitized as AICardConfig;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to decode JSON card: ${msg}`, 'JsonFileCardProvider', {
        error,
        stack,
        preview: trimmed.substring(0, 200),
      });
      return null;
    }
  }

  /**
   * Get all available cards
   */
  override getAllCards(): Observable<AICardConfig[]> {
    return this.getManifest().pipe(
      switchMap((manifest) => {
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
        const requests = sortedCards.map((card) => this.loadCardConfig(card));

        return forkJoin(requests).pipe(
          map((cards) => cards.filter((card): card is AICardConfig => card !== null)),
          catchError((error) => {
            this.logger.error('Error loading cards', 'JsonFileCardProvider', error);
            return of([] as AICardConfig[]);
          })
        );
      }),
      catchError((error) => {
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
      switchMap((manifest) => {
        if (!manifest.cards || manifest.cards.length === 0) {
          return of([] as AICardConfig[]);
        }

        // Filter by type
        const typeCards = manifest.cards.filter((card) => card.type === cardType);

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
        const requests = sortedCards.map((card) => this.loadCardConfig(card));

        return forkJoin(requests).pipe(
          map((cards) => cards.filter((card): card is AICardConfig => card !== null)),
          catchError((error) => {
            this.logger.error(
              `Error loading cards for type ${cardType}`,
              'JsonFileCardProvider',
              error
            );
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
      switchMap((manifest) => {
        const cardEntry = manifest.cards?.find((c) => c.id === id);

        if (!cardEntry) {
          this.logger.warn(`Card not found in manifest: ${id}`, 'JsonFileCardProvider');
          return of(null);
        }

        return this.loadCardConfig(cardEntry);
      }),
      catchError((error) => {
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
      map((manifest) => {
        if (!manifest.types) {
          return [];
        }
        return Object.keys(manifest.types);
      }),
      catchError((error) => {
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
      switchMap((manifest) => {
        if (!manifest.cards || manifest.cards.length === 0) {
          this.logger.debug(`No cards found in manifest`, 'JsonFileCardProvider');
          return of(null);
        }

        // Filter by type and sort by priority
        // If cardType is 'all', return all cards; otherwise filter by type
        const typeCards = (
          cardType === 'all'
            ? manifest.cards
            : manifest.cards.filter((card) => card.type === cardType)
        ).sort((a, b) => {
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
          this.logger.warn(
            `Card not found for type ${cardType} variant ${variant}`,
            'JsonFileCardProvider'
          );
          return of(null);
        }

        return this.loadCardConfig(cardEntry);
      }),
      catchError((error) => {
        this.logger.error(
          `Error getting card by type ${cardType} variant ${variant}`,
          'JsonFileCardProvider',
          error
        );
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
      switchMap((manifest) => {
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
      catchError((error) => {
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
      map((manifest) => {
        if (!manifest.cards || manifest.cards.length === 0) {
          return [];
        }

        return manifest.cards
          .filter((card) => card.type === cardType)
          .sort((a, b) => {
            return (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0);
          });
      }),
      catchError((error) => {
        this.logger.error(
          `Error getting manifest entries for type ${cardType}`,
          'JsonFileCardProvider',
          error
        );
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
      switchMap((manifest) => {
        if (!manifest.cards || manifest.cards.length === 0) {
          return of(undefined);
        }

        // Pre-load high priority cards (templates) - these are the most commonly used
        const templates = manifest.cards.filter((card) => card.priority === 'high').slice(0, 9); // Pre-load first 9 templates (3 types × 3 variants)

        if (templates.length === 0) {
          return of(undefined);
        }

        // Load templates in parallel - they'll be cached for instant access
        const loadObservables = templates.map((card) =>
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
      },
    });
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    this.requestCanceller.cancel();
  }
}
