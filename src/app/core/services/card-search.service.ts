import { Injectable, inject } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { AICardConfig, CardType, CardSection } from '../../models';
import { CardDataService } from './card-data/card-data.service';
import { LoggingService } from './logging.service';

export interface SearchOptions {
  query: string;
  cardTypes?: CardType[];
  sectionTypes?: string[];
  tags?: string[];
  minSections?: number;
  maxSections?: number;
}

export interface SearchResult {
  card: AICardConfig;
  score: number;
  matches: {
    field: string;
    value: string;
  }[];
}

/**
 * Card Search Service
 * 
 * Provides advanced search and filtering capabilities for cards.
 * Supports full-text search, type filtering, and tag-based filtering.
 * 
 * @example
 * ```typescript
 * const searchService = inject(CardSearchService);
 * 
 * // Search cards
 * searchService.search('company', {
 *   cardTypes: ['company'],
 *   minSections: 2
 * }).subscribe(results => {
 *   console.log(`Found ${results.length} cards`);
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class CardSearchService {
  private readonly cardDataService = inject(CardDataService);
  private readonly logger = inject(LoggingService);
  
  private readonly searchSubject = new BehaviorSubject<string>('');
  public readonly searchQuery$ = this.searchSubject.asObservable();

  /**
   * Search cards with advanced filtering
   */
  search(query: string, options?: Partial<SearchOptions>): Observable<SearchResult[]> {
    this.searchSubject.next(query);
    
    return this.cardDataService.getAllCards().pipe(
      map(cards => {
        const results: SearchResult[] = [];
        const lowerQuery = query.toLowerCase().trim();
        
        for (const card of cards) {
          // Apply filters
          if (options?.cardTypes && !options.cardTypes.includes(card.cardType as CardType)) {
            continue;
          }
          
          if (options?.minSections && (card.sections?.length || 0) < options.minSections) {
            continue;
          }
          
          if (options?.maxSections && (card.sections?.length || 0) > options.maxSections) {
            continue;
          }
          
          if (options?.sectionTypes) {
            const hasMatchingSection = card.sections?.some(s => 
              options.sectionTypes!.includes(s.type)
            );
            if (!hasMatchingSection) {
              continue;
            }
          }
          
          // Search in card
          const matches: { field: string; value: string }[] = [];
          let score = 0;
          
          // Search in title (highest weight)
          if (card.cardTitle?.toLowerCase().includes(lowerQuery)) {
            matches.push({ field: 'title', value: card.cardTitle });
            score += 10;
          }
          
          // Search in subtitle
          if (card.cardSubtitle?.toLowerCase().includes(lowerQuery)) {
            matches.push({ field: 'subtitle', value: card.cardSubtitle });
            score += 5;
          }
          
          // Search in description
          if (card.description?.toLowerCase().includes(lowerQuery)) {
            matches.push({ field: 'description', value: card.description });
            score += 3;
          }
          
          // Search in sections
          card.sections?.forEach(section => {
            // Section title
            if (section.title?.toLowerCase().includes(lowerQuery)) {
              matches.push({ field: 'section.title', value: section.title });
              score += 4;
            }
            
            // Section description
            if (section.description?.toLowerCase().includes(lowerQuery)) {
              matches.push({ field: 'section.description', value: section.description });
              score += 2;
            }
            
            // Fields
            section.fields?.forEach(field => {
              if (field.label?.toLowerCase().includes(lowerQuery)) {
                matches.push({ field: 'field.label', value: field.label });
                score += 2;
              }
              if (String(field.value || '').toLowerCase().includes(lowerQuery)) {
                matches.push({ field: 'field.value', value: String(field.value) });
                score += 1;
              }
            });
            
            // Items
            section.items?.forEach(item => {
              if (item.title?.toLowerCase().includes(lowerQuery)) {
                matches.push({ field: 'item.title', value: item.title });
                score += 2;
              }
              if (item.description?.toLowerCase().includes(lowerQuery)) {
                matches.push({ field: 'item.description', value: item.description });
                score += 1;
              }
            });
          });
          
          // Only include cards with matches
          if (matches.length > 0) {
            results.push({ card, score, matches });
          }
        }
        
        // Sort by score (highest first)
        results.sort((a, b) => b.score - a.score);
        
        this.logger.debug('Search completed', 'CardSearchService', {
          query,
          resultsCount: results.length
        });
        
        return results;
      })
    );
  }

  /**
   * Search with debouncing (for real-time search)
   */
  searchDebounced(query: string, options?: Partial<SearchOptions>, debounceMs: number = 300): Observable<SearchResult[]> {
    return of(query).pipe(
      debounceTime(debounceMs),
      distinctUntilChanged(),
      switchMap(q => this.search(q, options))
    );
  }

  /**
   * Filter cards by type
   */
  filterByType(cards: AICardConfig[], cardTypes: CardType[]): AICardConfig[] {
    return cards.filter(card => cardTypes.includes(card.cardType as CardType));
  }

  /**
   * Filter cards by section type
   */
  filterBySectionType(cards: AICardConfig[], sectionTypes: string[]): AICardConfig[] {
    return cards.filter(card =>
      card.sections?.some(section => sectionTypes.includes(section.type))
    );
  }

  /**
   * Filter cards by tags (if tags are implemented in metadata)
   */
  filterByTags(cards: AICardConfig[], tags: string[]): AICardConfig[] {
    return cards.filter(card => {
      const cardTags = (card.meta?.['tags'] as string[]) || [];
      return tags.some(tag => cardTags.includes(tag));
    });
  }

  /**
   * Get search suggestions based on query
   */
  getSuggestions(query: string, limit: number = 5): Observable<string[]> {
    return this.cardDataService.getAllCards().pipe(
      map(cards => {
        const lowerQuery = query.toLowerCase();
        const suggestions = new Set<string>();
        
        cards.forEach(card => {
          if (card.cardTitle?.toLowerCase().startsWith(lowerQuery)) {
            suggestions.add(card.cardTitle);
          }
          if (card.cardSubtitle?.toLowerCase().startsWith(lowerQuery)) {
            suggestions.add(card.cardSubtitle);
          }
          card.sections?.forEach(section => {
            if (section.title?.toLowerCase().startsWith(lowerQuery)) {
              suggestions.add(section.title);
            }
          });
        });
        
        return Array.from(suggestions).slice(0, limit);
      })
    );
  }
}

