import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AICardConfig } from '../../models/card.model';

@Injectable({
  providedIn: 'root'
})
export class LocalCardConfigurationService {
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
      basic: 'basic-project-status.json',
      enhanced: 'project-management-dashboard.json',
      enterprise: 'project-analytics.json'
    },
    analytics: {
      basic: 'basic-analytics-dashboard.json',
      enhanced: 'enhanced-analytics-dashboard.json',
      enterprise: 'analytics-dashboard.json'
    },
    opportunity: {
      basic: 'basic-opportunity-profile.json',
      enhanced: 'enhanced-opportunity-profile.json',
      enterprise: 'enterprise-opportunity-dashboard.json'
    },
    event: {
      basic: 'basic-company-profile.json', // Fallback for event type
      enhanced: 'enhanced-company-profile.json',
      enterprise: 'enterprise-company-dashboard.json'
    }
  };

  constructor() { }

  getAllExampleCards(): Observable<AICardConfig[]> {
    // Get all example cards from the new categorized structure
    const allCardFiles: string[] = [];

    // Add files for each category
    const categories = ['company', 'contact', 'product', 'project', 'analytics', 'opportunity'];
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

  getTemplate(cardType: string, variant: number): Observable<AICardConfig> {
    // Validate and sanitize inputs
    const sanitizedCardType = this.sanitizeInput(cardType);
    const sanitizedVariant = Math.max(1, Math.min(3, Number(variant) || 1));

    console.log(`🔍 Loading template: ${sanitizedCardType}, variant: ${sanitizedVariant}`);

    // Map variant number to variant type
    const variantTypes = ['basic', 'enhanced', 'enterprise'] as const;
    const variantType = variantTypes[sanitizedVariant - 1];

    // Get the file path for the specific card type and variant
    const typeMapping = this.cardTypeMapping[sanitizedCardType];
    if (!typeMapping) {
      console.warn(`Unknown card type: ${sanitizedCardType}`);
      return of(this.getFallbackCard(sanitizedCardType));
    }

    const fileName = typeMapping[variantType];
    const filePath = `/assets/examples/categories/${sanitizedCardType}/${fileName}`;
    
    console.log(`📁 Attempting to load from: ${filePath}`);

    return this.http.get<AICardConfig>(filePath).pipe(
      catchError(error => {
        console.error(`❌ Failed to load template from ${filePath}:`, error);
        console.log(`🔄 Using fallback card for ${sanitizedCardType}`);
        return of(this.getFallbackCard(sanitizedCardType));
      })
    );
  }

  private sanitizeInput(input: string): string {
    // Remove potentially dangerous characters and limit length
    return input.replace(/[<>&"']/g, '').substring(0, 50).toLowerCase();
  }

  private validateCardStructure(card: AICardConfig): boolean {
    try {
      return !!(
        card &&
        typeof card.cardTitle === 'string' &&
        typeof card.cardType === 'string' &&
        Array.isArray(card.sections) &&
        card.cardTitle.length > 0 &&
        card.cardTitle.length <= 100 &&
        card.sections.length <= 20
      );
    } catch {
      return false;
    }
  }

  private getFallbackCard(cardType: string): AICardConfig {
    return {
      id: `fallback-${cardType}-${Date.now()}`,
      cardTitle: `${cardType.charAt(0).toUpperCase() + cardType.slice(1)} Card`,
      cardType: cardType as AICardConfig['cardType'],
      sections: [
        {
          id: 'overview',
          title: 'Overview',
          type: 'info',
          fields: [
            {
              id: 'title',
              label: 'Title',
              value: `Sample ${cardType.charAt(0).toUpperCase() + cardType.slice(1)}`
            },
            {
              id: 'description',
              label: 'Description',
              value: `This is a sample ${cardType} card`
            }
          ]
        }
      ],
      actions: [
        {
          id: 'view-details',
          label: 'View Details',
          icon: 'fas fa-eye'
        }
      ],
      meta: {
        category: cardType,
        variant: 'basic',
        complexity: 'basic'
      }
    };
  }

  saveCardConfiguration(_config: AICardConfig): Observable<boolean> {
    // Save logic would go here
    return of(true);
  }
}
