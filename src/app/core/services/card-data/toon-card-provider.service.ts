import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin, merge, EMPTY, from } from 'rxjs';
import { map, catchError, switchMap, concatMap, delay, shareReplay, filter } from 'rxjs/operators';
import { AICardConfig, CardSection, CardUtils } from '../../../models';
import { CardDataProvider } from './card-data-provider.interface';
import { CardManifest, CardManifestEntry } from './manifest.interface';
import { decode } from '@toon-format/toon';

const PRIORITY_ORDER = { high: 3, medium: 2, low: 1 };
const AVAILABLE_CARD_TYPES = [
  'company',
  'contact',
  'product',
  'project',
  'analytics',
  'opportunity',
  'event',
  'financials',
  'sko'
];

@Injectable({
  providedIn: 'root'
})
export class ToonCardProvider extends CardDataProvider {
  private http = inject(HttpClient);
  private manifestCache$?: Observable<CardManifest>;

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

  private loadCardConfig(card: CardManifestEntry): Observable<AICardConfig | null> {
    return this.loadToonCard(card);
  }

  private loadToonCard(card: CardManifestEntry): Observable<AICardConfig | null> {
    const toonPath = card.path.endsWith('.toon') ? card.path : `${card.path}.toon`;
    return this.http.get(`/assets/configs/${toonPath}`, { responseType: 'text' as const }).pipe(
      map((text) => this.decodeToCard(text as string)),
      catchError(error => {
        console.warn(`Failed to load TOON config ${toonPath}:`, error);
        return of(null);
      })
    );
  }

  private decodeToCard(text: string): AICardConfig | null {
    try {
      const decoded = decode(text, { expandPaths: 'safe' });
      return CardUtils.sanitizeCardConfig(decoded);
    } catch (error) {
      console.error('Failed to decode TOON config:', error);
      return null;
    }
  }

  getAllCards(): Observable<AICardConfig[]> {
    return this.getManifest().pipe(
      switchMap(manifest => {
        if (!manifest.cards || manifest.cards.length === 0) {
          console.warn('Manifest is empty, returning no cards');
          return of([] as AICardConfig[]);
        }

        const sortedCards = [...manifest.cards].sort((a, b) => {
          return (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0);
        });

        const requests = sortedCards.map(card => this.loadCardConfig(card));

        return forkJoin(requests).pipe(
          map(cards => cards.filter((card): card is AICardConfig => card !== null))
        );
      }),
      catchError(error => {
        console.error('Error loading cards from manifest:', error);
        return of([] as AICardConfig[]);
      })
    );
  }

  override getAllCardsStreaming(): Observable<AICardConfig> {
    return this.getManifest().pipe(
      switchMap(manifest => {
        if (!manifest.cards || manifest.cards.length === 0) {
          return EMPTY;
        }

        const sortedCards = [...manifest.cards].sort((a, b) => {
          return (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0);
        });

        return merge(...sortedCards.map(card =>
          this.loadCardConfig(card).pipe(
            filter((config): config is AICardConfig => config !== null),
            map(data => ({ ...data, _manifest: card }))
          )
        ));
      })
    );
  }

  getCardsByType(cardType: string): Observable<AICardConfig[]> {
    return this.getManifest().pipe(
      switchMap(manifest => {
        if (!manifest.cards || manifest.cards.length === 0) {
          return of([] as AICardConfig[]);
        }

        const typeCards = manifest.cards.filter(card => card.type === cardType);

        if (typeCards.length === 0) {
          return of([] as AICardConfig[]);
        }

        const sortedCards = [...typeCards].sort((a, b) => {
          return (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0);
        });

        const requests = sortedCards.map(card => this.loadCardConfig(card));
        return forkJoin(requests).pipe(
          map(cards => cards.filter((card): card is AICardConfig => card !== null))
        );
      })
    );
  }

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

        const sortedCards = [...typeCards].sort((a, b) => {
          return (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0);
        });

        return merge(...sortedCards.map(card =>
          this.loadCardConfig(card).pipe(
            filter((config): config is AICardConfig => config !== null),
            map(data => ({ ...data, _manifest: card }))
          )
        ));
      })
    );
  }

  getCardById(id: string): Observable<AICardConfig | null> {
    return this.getManifest().pipe(
      switchMap(manifest => {
        if (!manifest.cards || manifest.cards.length === 0) {
          console.warn(`Manifest empty, cannot resolve card ${id}`);
          return of(null);
        }

        const manifestEntry = manifest.cards.find(card => card.id === id);
        if (!manifestEntry) {
          return of(null);
        }

        return this.loadCardConfig(manifestEntry).pipe(
          catchError(error => {
            console.warn(`Failed to load card ${id} from ${manifestEntry.path}:`, error);
            return of(null);
          })
        );
      })
    );
  }

  override getCardSectionsStreaming(cardId: string): Observable<CardSection> {
    return this.getCardById(cardId).pipe(
      switchMap(card => {
        if (!card?.sections || card.sections.length === 0) {
          return EMPTY;
        }

        return from(card.sections).pipe(
          concatMap((section, index) =>
            of(section).pipe(delay(index * 80))
          )
        );
      })
    );
  }

  getCardByComplexity(cardType: string, complexity: 'basic' | 'enhanced' | 'enterprise'): Observable<AICardConfig | null> {
    return this.getCardsByType(cardType).pipe(
      map(cards => {
        if (cards.length === 0) return null;
        const complexityIndex = this.getComplexityIndex(complexity, cards.length);
        return cards[complexityIndex] ?? cards[0] ?? null;
      })
    );
  }

  private getComplexityIndex(level: 'basic' | 'enhanced' | 'enterprise', totalCards: number): number {
    if (totalCards <= 1) {
      return 0;
    }
    switch (level) {
      case 'enterprise':
        return totalCards - 1;
      case 'enhanced':
        return Math.min(totalCards - 1, Math.floor(totalCards / 2));
      case 'basic':
      default:
        return 0;
    }
  }

  getAvailableCardTypes(): string[] {
    return [...AVAILABLE_CARD_TYPES];
  }
}
