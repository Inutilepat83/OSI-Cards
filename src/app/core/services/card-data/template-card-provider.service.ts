import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AICardConfig } from '../../../models';
import { CardDataProvider } from './card-data-provider.interface';
import { allTemplateVariants } from '../../../shared/data';

/**
 * Template-based card data provider
 * Loads cards from in-app template data (matching React reference)
 */
@Injectable({
  providedIn: 'root'
})
export class TemplateCardProvider extends CardDataProvider {
  private templates: AICardConfig[] = allTemplateVariants;

  getAllCards(): Observable<AICardConfig[]> {
    return of([...this.templates]);
  }

  getCardsByType(cardType: string): Observable<AICardConfig[]> {
    const filtered = this.templates.filter(
      card => card.cardType.toLowerCase() === cardType.toLowerCase()
    );
    return of(filtered);
  }

  getCardById(id: string): Observable<AICardConfig | null> {
    const card = this.templates.find(card => card.id === id);
    return of(card || null);
  }

  /**
   * Get available card types from templates
   */
  getAvailableCardTypes(): string[] {
    const types = new Set(this.templates.map(card => card.cardType));
    return Array.from(types).sort();
  }

  /**
   * Get all templates (read-only)
   */
  getTemplates(): AICardConfig[] {
    return [...this.templates];
  }
}
