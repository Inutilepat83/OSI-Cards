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

  // Define the mapping of card types to their file names
  private cardTypeMapping: Record<string, { basic: string; enhanced: string; enterprise: string }> = {
    company: {
      basic: 'basic-company-profile.json',
      enhanced: 'enhanced-company-profile.json',
      enterprise: 'enterprise-company-dashboard.json'
    },
    contact: {
      basic: 'basic-contact-info.json',
      enhanced: 'professional-contact.json',
      enterprise: 'executive-contact.json'
    },
    product: {
      basic: 'basic-product-info.json',
      enhanced: 'enhanced-product-catalog.json',
      enterprise: 'product-analytics-dashboard.json'
    },
    project: {
      basic: 'basic-project-overview.json',
      enhanced: 'enhanced-project-dashboard.json',
      enterprise: 'enterprise-project-analytics.json'
    },
    analytics: {
      basic: 'basic-analytics-report.json',
      enhanced: 'enhanced-analytics-dashboard.json',
      enterprise: 'enterprise-analytics-suite.json'
    },
    opportunity: {
      basic: 'basic-opportunity-tracker.json',
      enhanced: 'enhanced-opportunity-pipeline.json',
      enterprise: 'enterprise-opportunity-analytics.json'
    }
  };

  getAllCards(): Observable<AICardConfig[]> {
    // Get all example cards from the categorized structure
    const allCardFiles: string[] = [];

    // Add files for each category
    const categories = Object.keys(this.cardTypeMapping);
    categories.forEach(category => {
      const typeMapping = this.cardTypeMapping[category];
      if (typeMapping) {
        allCardFiles.push(
          `/assets/examples/categories/${category}/${typeMapping.basic}`,
          `/assets/examples/categories/${category}/${typeMapping.enhanced}`,
          `/assets/examples/categories/${category}/${typeMapping.enterprise}`
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
    const typeMapping = this.cardTypeMapping[cardType];
    if (!typeMapping) {
      console.warn(`Unknown card type: ${cardType}`);
      return of([]);
    }

    const cardFiles = [
      `/assets/examples/categories/${cardType}/${typeMapping.basic}`,
      `/assets/examples/categories/${cardType}/${typeMapping.enhanced}`,
      `/assets/examples/categories/${cardType}/${typeMapping.enterprise}`
    ];

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
    // For JSON provider, we need to search through all cards
    return this.getAllCards().pipe(
      map(cards => cards.find(card => card.id === id) || null)
    );
  }

  /**
   * Get card configuration by complexity level
   */
  getCardByComplexity(cardType: string, complexity: 'basic' | 'enhanced' | 'enterprise'): Observable<AICardConfig | null> {
    const typeMapping = this.cardTypeMapping[cardType];
    if (!typeMapping) {
      return of(null);
    }

    const fileName = typeMapping[complexity];
    const filePath = `/assets/examples/categories/${cardType}/${fileName}`;

    return this.http.get<AICardConfig>(filePath).pipe(
      catchError(error => {
        console.warn(`Failed to load ${complexity} card for ${cardType}:`, error);
        return of(null);
      })
    );
  }

  /**
   * Get available card types
   */
  getAvailableCardTypes(): string[] {
    return Object.keys(this.cardTypeMapping);
  }
}
