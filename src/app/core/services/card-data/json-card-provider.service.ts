import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin, merge, EMPTY, from } from 'rxjs';
import { map, catchError, switchMap, concatMap, delay, shareReplay } from 'rxjs/operators';
import { AICardConfig, CardSection } from '../../../models';
import { CardDataProvider } from './card-data-provider.interface';
import { CardManifest, CardManifestEntry } from './manifest.interface';

/**
 * JSON file-based card data provider
 * Loads cards from static JSON files using manifest for discovery and streaming support
 */
@Injectable({
  providedIn: 'root'
})
export class JsonCardProvider extends CardDataProvider {
  private http = inject(HttpClient);
  private manifestCache$?: Observable<CardManifest>;

  // Define the mapping of card types to their config directories (fallback if manifest fails)
  private cardTypeConfigMapping: Record<string, string> = {
    company: 'companies',
    contact: 'contacts',
    product: 'products',
    project: 'projects',
    analytics: 'analytics',
    opportunity: 'opportunities',
    event: 'events',
    financials: 'financials',
    sko: 'sko'
  };

  /**
   * Load manifest with caching
   */
  private getManifest(): Observable<CardManifest> {
    if (!this.manifestCache$) {
      this.manifestCache$ = this.http.get<CardManifest>('/assets/configs/manifest.json').pipe(
        catchError(error => {
          console.warn('Failed to load manifest, falling back to hardcoded paths:', error);
          // Return empty manifest to trigger fallback - this ensures legacy behavior works
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
   * Get all cards (blocking - uses forkJoin for backward compatibility)
   */
  getAllCards(): Observable<AICardConfig[]> {
    return this.getManifest().pipe(
      switchMap(manifest => {
        // If manifest is empty or has no cards, use legacy fallback
        if (!manifest || !manifest.cards || manifest.cards.length === 0) {
          console.log('Using legacy card loading (manifest empty or unavailable)');
          return this.getAllCardsLegacy();
        }

        try {
          // Sort by priority (high first)
          const sortedCards = [...manifest.cards].sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
          });

          console.log(`Loading ${sortedCards.length} cards from manifest`);

          const requests = sortedCards.map(card => 
            this.http.get<AICardConfig>(`/assets/configs/${card.path}`).pipe(
              catchError(error => {
                console.warn(`Failed to load card from ${card.path}:`, error);
                return of(null);
              })
            )
          );

          return forkJoin(requests).pipe(
            map(cards => cards.filter(card => card !== null) as AICardConfig[]),
            switchMap(validCards => {
              console.log(`Successfully loaded ${validCards.length} cards from manifest`);
              if (validCards.length === 0) {
                console.warn('No cards loaded from manifest, falling back to legacy');
                // If all cards failed to load, fall back to legacy
                return this.getAllCardsLegacy();
              }
              return of(validCards);
            })
          );
        } catch (error) {
          console.error('Error processing manifest, falling back to legacy:', error);
          return this.getAllCardsLegacy();
        }
      }),
      catchError(error => {
        console.error('Error in getAllCards, falling back to legacy:', error);
        return this.getAllCardsLegacy();
      })
    );
  }

  /**
   * Get all cards with streaming (progressive loading)
   * Cards are emitted as they load, sorted by priority
   */
  override getAllCardsStreaming(): Observable<AICardConfig> {
    return this.getManifest().pipe(
      switchMap(manifest => {
        if (!manifest.cards || manifest.cards.length === 0) {
          return EMPTY;
        }

        // Sort by priority (high first)
        const sortedCards = [...manifest.cards].sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        });

        // Emit cards as they load
        return merge(...sortedCards.map(card => 
          this.http.get<AICardConfig>(`/assets/configs/${card.path}`).pipe(
            map(data => ({ ...data, _manifest: card })),
            catchError(error => {
              console.warn(`Failed to load card from ${card.path}:`, error);
              return EMPTY;
            })
          )
        ));
      })
    );
  }

  /**
   * Legacy method for backward compatibility (fallback if manifest fails)
   */
  private getAllCardsLegacy(): Observable<AICardConfig[]> {
    const allCardFiles: string[] = [];

    Object.entries(this.cardTypeConfigMapping).forEach(([cardType, directory]) => {
      if (cardType === 'company') {
        allCardFiles.push(
          '/assets/configs/companies/dsm.json',
          '/assets/configs/companies/google.json',
          '/assets/configs/companies/pfizer.json'
        );
      }
    });

    const requests = allCardFiles.map(file => this.http.get<AICardConfig>(file).pipe(
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
    return this.getManifest().pipe(
      switchMap(manifest => {
        if (!manifest.cards || manifest.cards.length === 0) {
          // Fallback to legacy method
          return this.getCardsByTypeLegacy(cardType);
        }

        // Get cards of the requested type from manifest
        const typeCards = manifest.cards.filter(card => card.type === cardType);
        
        if (typeCards.length === 0) {
          console.warn(`No cards found for type: ${cardType}`);
          return of([]);
        }

        // Sort by priority
        const sortedCards = [...typeCards].sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        });

        const requests = sortedCards.map(card => 
          this.http.get<AICardConfig>(`/assets/configs/${card.path}`).pipe(
            catchError(error => {
              console.warn(`Failed to load card from ${card.path}:`, error);
              return of(null);
            })
          )
        );

        return forkJoin(requests).pipe(
          map(cards => cards.filter(card => card !== null) as AICardConfig[])
        );
      })
    );
  }

  /**
   * Get cards by type with streaming (progressive loading)
   */
  override getCardsByTypeStreaming(cardType: string): Observable<AICardConfig> {
    return this.getManifest().pipe(
      switchMap(manifest => {
        if (!manifest.cards || manifest.cards.length === 0) {
          return EMPTY;
        }

        const typeCards = manifest.cards.filter(card => card.type === cardType);
        
        if (typeCards.length === 0) {
          return EMPTY;
        }

        // Sort by priority
        const sortedCards = [...typeCards].sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        });

        return merge(...sortedCards.map(card => 
          this.http.get<AICardConfig>(`/assets/configs/${card.path}`).pipe(
            map(data => ({ ...data, _manifest: card })),
            catchError(error => {
              console.warn(`Failed to load card from ${card.path}:`, error);
              return EMPTY;
            })
          )
        ));
      })
    );
  }

  /**
   * Legacy method for backward compatibility
   */
  private getCardsByTypeLegacy(cardType: string): Observable<AICardConfig[]> {
    const directory = this.cardTypeConfigMapping[cardType];
    if (!directory) {
      console.warn(`Unknown card type: ${cardType}`);
      return of([]);
    }

    const cardFilesMap: Record<string, string[]> = {
      company: [
        '/assets/configs/companies/dsm.json',
        '/assets/configs/companies/microsoft.json',
        '/assets/configs/companies/amazon.json'
      ],
      contact: [
        '/assets/configs/contacts/emma-thompson.json',
        '/assets/configs/contacts/john-smith.json',
        '/assets/configs/contacts/sophie-martin.json'
      ],
      opportunity: [
        '/assets/configs/opportunities/ai-customer-service.json',
        '/assets/configs/opportunities/cloud-migration-enterprise.json',
        '/assets/configs/opportunities/security-transformation.json'
      ],
      product: [
        '/assets/configs/products/ai-insights-platform.json',
        '/assets/configs/products/enterprise-security-suite.json',
        '/assets/configs/products/data-analytics-platform.json'
      ],
      event: [
        '/assets/configs/events/tech-summit-2025.json',
        '/assets/configs/events/digital-transformation-forum.json',
        '/assets/configs/events/cloud-innovation-summit.json'
      ],
      analytics: [
        '/assets/configs/analytics/sales-performance-dashboard.json',
        '/assets/configs/analytics/customer-insights-report.json',
        '/assets/configs/analytics/operational-efficiency.json'
      ],
      sko: [
        '/assets/configs/sko/enterprise-client-solutions.json',
        '/assets/configs/sko/manufacturing-client-solutions.json',
        '/assets/configs/sko/financial-services-solutions.json'
      ]
    };

    const cardFiles = cardFilesMap[cardType] || [];
    if (cardFiles.length === 0) {
      return of([]);
    }

    const requests = cardFiles.map(file => this.http.get<AICardConfig>(file).pipe(
      catchError(error => {
        console.warn(`Failed to load card from ${file}:`, error);
        return of(null);
      })
    ));

    return forkJoin(requests).pipe(
      map(cards => cards.filter(card => card !== null) as AICardConfig[])
    );
  }

  getCardById(id: string): Observable<AICardConfig | null> {
    return this.getManifest().pipe(
      switchMap(manifest => {
        if (!manifest.cards || manifest.cards.length === 0) {
          // Fallback to searching all cards
          return this.getAllCards().pipe(
            map(cards => cards.find(card => card.id === id) || null)
          );
        }

        // Find card in manifest
        const manifestEntry = manifest.cards.find(card => card.id === id);
        if (!manifestEntry) {
          return of(null);
        }

        // Load specific card
        return this.http.get<AICardConfig>(`/assets/configs/${manifestEntry.path}`).pipe(
          catchError(error => {
            console.warn(`Failed to load card ${id} from ${manifestEntry.path}:`, error);
            return of(null);
          })
        );
      })
    );
  }

  /**
   * Get card sections with streaming (progressive section loading)
   */
  override getCardSectionsStreaming(cardId: string): Observable<CardSection> {
    return this.getCardById(cardId).pipe(
      switchMap(card => {
        if (!card?.sections || card.sections.length === 0) {
          return EMPTY;
        }

        // Stream sections with delay for visual effect
        return from(card.sections).pipe(
          concatMap((section, index) => 
            of(section).pipe(delay(index * 80)) // 80ms between sections
          )
        );
      })
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
