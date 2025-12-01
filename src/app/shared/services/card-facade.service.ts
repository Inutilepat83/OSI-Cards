import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AICardConfig, CardType } from '../../models';
import { CardDataService } from '../../core/services/card-data/card-data.service';
import { CardValidationService } from './card-validation.service';
import { CardTemplatesService } from './card-templates.service';
import { SectionNormalizationService } from './section-normalization.service';
import { ErrorHandlingService } from '../../core/services/error-handling.service';

/**
 * Card Facade Service
 *
 * Provides a simplified interface for complex card operations by coordinating
 * multiple services. This facade hides the complexity of interacting with
 * CardDataService, CardValidationService, CardTemplatesService, and others.
 *
 * Benefits:
 * - Simplifies component code by reducing service dependencies
 * - Centralizes complex operations
 * - Improves testability by providing a single point of interaction
 * - Makes it easier to change underlying implementations
 *
 * @example
 * ```typescript
 * const facade = inject(CardFacadeService);
 *
 * // Load and validate a card in one call
 * facade.loadAndValidateCard('card-id').subscribe({
 *   next: card => console.log('Valid card:', card),
 *   error: err => console.error('Invalid card:', err)
 * });
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class CardFacadeService {
  private readonly cardData = inject(CardDataService);
  private readonly validation = inject(CardValidationService);
  private readonly templates = inject(CardTemplatesService);
  private readonly normalization = inject(SectionNormalizationService);
  private readonly errorHandling = inject(ErrorHandlingService);

  /**
   * Load a card by ID and validate it
   * @param id - Card ID
   * @returns Observable of validated card or null if not found/invalid
   */
  loadAndValidateCard(id: string): Observable<AICardConfig | null> {
    return this.cardData.getCardById(id).pipe(
      map((card) => {
        if (!card) {
          return null;
        }
        if (!this.validation.validateCardStructure(card)) {
          this.errorHandling.handleError(
            new Error(`Card ${id} failed validation`),
            'CardFacadeService.loadAndValidateCard'
          );
          return null;
        }
        return card;
      })
    );
  }

  /**
   * Load a template card by type and variant
   * @param type - Card type
   * @param variant - Variant number (1-based)
   * @returns Observable of template card or null
   */
  loadTemplate(type: CardType, variant: number): Observable<AICardConfig | null> {
    return this.templates.loadTemplate(type, variant);
  }

  /**
   * Create a new card from template with validation
   * @param type - Card type
   * @param variant - Variant number
   * @returns Observable of created and validated card
   */
  createCardFromTemplate(type: CardType, variant: number): Observable<AICardConfig | null> {
    return this.loadTemplate(type, variant).pipe(
      map((template) => {
        if (!template) {
          this.errorHandling.handleError(
            new Error(`Template not found: ${type} variant ${variant}`),
            'CardFacadeService.createCardFromTemplate'
          );
          return null;
        }
        // Normalize sections
        if (template.sections) {
          template.sections = template.sections.map((section) =>
            this.normalization.normalizeSection(section)
          );
        }
        // Validate
        if (!this.validation.validateCardStructure(template)) {
          this.errorHandling.handleError(
            new Error(`Template validation failed: ${type} variant ${variant}`),
            'CardFacadeService.createCardFromTemplate'
          );
          return null;
        }
        return template;
      })
    );
  }

  /**
   * Get all cards with validation
   * @returns Observable of validated cards array
   */
  getAllValidCards(): Observable<AICardConfig[]> {
    return this.cardData
      .getAllCards()
      .pipe(map((cards) => cards.filter((card) => this.validation.validateCardStructure(card))));
  }

  /**
   * Search cards with validation
   * @param query - Search query
   * @returns Observable of matching validated cards
   */
  searchValidCards(query: string): Observable<AICardConfig[]> {
    // Use repository search if available, otherwise fallback to getAllCards
    return this.cardData.getAllCards().pipe(
      map((cards) => {
        if (!query.trim()) {
          return cards.filter((card) => this.validation.validateCardStructure(card));
        }
        const searchTerm = query.toLowerCase();
        return cards.filter((card) => {
          if (!this.validation.validateCardStructure(card)) {
            return false;
          }
          return (
            card.cardTitle.toLowerCase().includes(searchTerm) ||
            card.sections?.some(
              (section) =>
                section.title?.toLowerCase().includes(searchTerm) ||
                section.fields?.some(
                  (field) =>
                    field.label?.toLowerCase().includes(searchTerm) ||
                    String(field.value).toLowerCase().includes(searchTerm)
                )
            )
          );
        });
      })
    );
  }
}
