import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { CardDataService } from '../../core/services/card-data/card-data.service';
import { LoggingService } from '../../core/services/logging.service';
import { ValidationService } from '../../core/services/validation.service';
import { AICardConfig, CardType } from '../../models';
import { ensureCardIds, removeAllIds } from '../utils/card-utils';
import { ExportService } from './export.service';

/**
 * Card templates service
 *
 * Handles template loading, caching, and management for card templates.
 * Supports both file-based templates (from CardDataService) and built-in templates.
 *
 * Features:
 * - Template caching for performance
 * - Variant selection (1-3)
 * - Template validation and sanitization
 * - Fallback to built-in templates
 *
 * @example
 * ```typescript
 * const templateService = inject(CardTemplatesService);
 *
 * // Load template from files
 * templateService.loadTemplate('company', 1).subscribe(template => {
 *   console.log('Template loaded:', template);
 * });
 *
 * // Get cached template
 * const cached = templateService.getCachedTemplate('company', 1);
 * ```
 */

export interface TemplateMetadata {
  id: string;
  name: string;
  description?: string;
  cardType: CardType;
  variant: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CardTemplatesService {
  private readonly cardDataService = inject(CardDataService);
  private readonly logger = inject(LoggingService);
  private readonly exportService = inject(ExportService);
  private readonly validationService = inject(ValidationService);

  // Template cache: Map<`${cardType}-${variant}`, AICardConfig>
  private readonly templateCache = new Map<string, AICardConfig>();

  // Template metadata cache
  private readonly templateMetadata = new Map<string, TemplateMetadata>();

  // User-created templates (stored in localStorage)
  private readonly userTemplatesKey = 'osi-cards-user-templates';
  private readonly userTemplatesSubject = new BehaviorSubject<AICardConfig[]>([]);
  public readonly userTemplates$ = this.userTemplatesSubject.asObservable();

  // Observable cache for async loading
  private readonly templateObservables = new Map<string, Observable<AICardConfig | null>>();

  constructor() {
    this.loadUserTemplates();
  }
  /**
   * Load template by type and variant
   *
   * First tries to load from file-based templates (via CardDataService),
   * then falls back to built-in templates if no file templates are available.
   *
   * @param cardType - The card type to load
   * @param variant - The variant number (1-3)
   * @returns Observable of the template, or null if not found
   *
   * @example
   * ```typescript
   * templateService.loadTemplate('company', 1).subscribe(template => {
   *   if (template) {
   *     console.log('Template loaded:', template.cardTitle);
   *   }
   * });
   * ```
   */
  loadTemplate(cardType: CardType, variant = 1): Observable<AICardConfig | null> {
    const cacheKey = `${cardType}-${variant}`;

    // Check cache first
    const cached = this.templateCache.get(cacheKey);
    if (cached) {
      return of(cached);
    }

    // Check if we already have an observable for this template
    const existingObservable = this.templateObservables.get(cacheKey);
    if (existingObservable) {
      return existingObservable;
    }

    // Load from file-based templates
    const template$ = this.cardDataService.getCardsByType(cardType).pipe(
      map((cards) => {
        if (!cards || cards.length === 0) {
          // Fallback to built-in templates
          return this.getBuiltInTemplate(cardType, variant);
        }

        // Select variant (1-based index)
        const template = cards[Math.min(variant - 1, cards.length - 1)] ?? cards[0];

        // Sanitize template (remove IDs, ensure structure)
        const scrubbed = template ? removeAllIds(template) : template;
        if (!scrubbed) {
          // Fallback to built-in templates if scrubbing fails
          return this.getBuiltInTemplate(cardType, variant);
        }
        // Ensure cardTitle exists
        if (!scrubbed.cardTitle) {
          scrubbed.cardTitle = 'Untitled Card';
        }
        const sanitized = ensureCardIds({
          ...scrubbed,
          cardTitle: scrubbed.cardTitle,
        });

        // Cache the template
        this.templateCache.set(cacheKey, sanitized);

        return sanitized;
      }),
      catchError((error) => {
        this.logger.warn(
          `Failed to load template ${cardType}-${variant}`,
          'CardTemplatesService',
          error
        );
        // Fallback to built-in template
        return of(this.getBuiltInTemplate(cardType, variant));
      }),
      shareReplay(1)
    );

    // Cache the observable
    this.templateObservables.set(cacheKey, template$);

    return template$;
  }

  /**
   * Get cached template (synchronous)
   *
   * @param cardType - The card type
   * @param variant - The variant number (1-3)
   * @returns Cached template or null
   */
  getCachedTemplate(cardType: CardType, variant = 1): AICardConfig | null {
    const cacheKey = `${cardType}-${variant}`;
    return this.templateCache.get(cacheKey) || null;
  }

  /**
   * Clear template cache
   *
   * Useful when templates need to be reloaded (e.g., after file updates)
   */
  clearCache(): void {
    this.templateCache.clear();
    this.templateObservables.clear();
    this.logger.debug('Template cache cleared', 'CardTemplatesService');
  }

  /**
   * Clear cache for specific card type
   *
   * @param cardType - The card type to clear from cache
   */
  clearCacheForType(cardType: CardType): void {
    const keysToDelete: string[] = [];
    this.templateCache.forEach((_, key) => {
      if (key.startsWith(`${cardType}-`)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => {
      this.templateCache.delete(key);
      this.templateObservables.delete(key);
    });

    this.logger.debug(`Cache cleared for type: ${cardType}`, 'CardTemplatesService');
  }

  /**
   * Get built-in template (fallback)
   *
   * @param cardType - The card type
   * @param variant - The variant number
   * @returns Built-in template or null
   */
  private getBuiltInTemplate(cardType: CardType, variant: number): AICardConfig | null {
    const templates = this.getTemplatesByType(cardType);
    return templates[variant - 1] || templates[0] || null;
  }

  /**
   * Get template by type and variant (synchronous, built-in only)
   *
   * @deprecated Use loadTemplate() for file-based templates
   * @param cardType - The card type
   * @param variant - The variant number
   * @returns Built-in template or null
   */
  getTemplate(cardType: CardType, variant = 1): AICardConfig | null {
    return this.getBuiltInTemplate(cardType, variant);
  }

  /**
   * Get all templates for a card type
   */
  getTemplatesByType(cardType: CardType): AICardConfig[] {
    switch (cardType) {
      case 'company':
        return this.getCompanyTemplates();
      case 'contact':
        return this.getContactTemplates();
      case 'opportunity':
        return this.getOpportunityTemplates();
      case 'product':
        return this.getProductTemplates();
      case 'event':
        return this.getEventTemplates();
      default:
        return [];
    }
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): AICardConfig[] {
    const types: CardType[] = ['company', 'contact', 'opportunity', 'product', 'event'];
    return types.flatMap((type) => this.getTemplatesByType(type));
  }

  /**
   * Company templates
   */
  private getCompanyTemplates(): AICardConfig[] {
    return [
      {
        cardTitle: 'Company Name',
        cardType: 'company',
        sections: [
          {
            title: 'Company Overview',
            type: 'overview',
            fields: [
              { label: 'Industry', value: 'Technology' },
              { label: 'Employees', value: '1000+' },
              { label: 'Founded', value: '2020' },
              { label: 'Location', value: 'San Francisco, CA' },
            ],
          },
          {
            title: 'Key Metrics',
            type: 'analytics',
            fields: [
              { label: 'Revenue', value: '$10M', percentage: 100, trend: 'up' },
              { label: 'Growth', value: '25%', percentage: 25, trend: 'up' },
            ],
          },
        ],
      },
    ];
  }

  /**
   * Contact templates
   */
  private getContactTemplates(): AICardConfig[] {
    return [
      {
        cardTitle: 'Contact Name',
        cardType: 'contact',
        sections: [
          {
            title: 'Contact Information',
            type: 'contact-card',
            items: [
              {
                title: 'John Doe',
                description: 'CEO',
                meta: {
                  email: 'john@example.com',
                  phone: '+1-555-0100',
                },
              },
            ],
          },
        ],
      },
    ];
  }

  /**
   * Opportunity templates
   */
  private getOpportunityTemplates(): AICardConfig[] {
    return [
      {
        cardTitle: 'Opportunity Name',
        cardType: 'opportunity',
        sections: [
          {
            title: 'Opportunity Details',
            type: 'info',
            fields: [
              { label: 'Stage', value: 'Qualification', status: 'in-progress' },
              { label: 'Value', value: '$50,000', format: 'currency' },
              { label: 'Probability', value: '60%', percentage: 60 },
            ],
          },
        ],
      },
    ];
  }

  /**
   * Product templates
   */
  private getProductTemplates(): AICardConfig[] {
    return [
      {
        cardTitle: 'Product Name',
        cardType: 'product',
        sections: [
          {
            title: 'Product Features',
            type: 'product',
            items: [
              { title: 'Feature 1', description: 'Description of feature 1' },
              { title: 'Feature 2', description: 'Description of feature 2' },
            ],
          },
        ],
      },
    ];
  }

  /**
   * Event templates
   */
  private getEventTemplates(): AICardConfig[] {
    return [
      {
        cardTitle: 'Event Name',
        cardType: 'event',
        sections: [
          {
            title: 'Event Details',
            type: 'event',
            items: [
              {
                title: 'Opening Keynote',
                description: '9:00 AM - Main Hall',
                status: 'active',
              },
            ],
          },
        ],
      },
    ];
  }

  /**
   * Get available variants for a card type
   *
   * @param cardType - The card type
   * @returns Number of available variants
   */
  getAvailableVariants(cardType: CardType): Observable<number> {
    return this.cardDataService.getCardsByType(cardType).pipe(
      map((cards) => Math.max(cards.length, 3)), // At least 3 variants
      catchError(() => of(this.getTemplatesByType(cardType).length || 1))
    );
  }

  /**
   * Check if template exists for type and variant
   *
   * @param cardType - The card type
   * @param variant - The variant number
   * @returns Observable of boolean indicating if template exists
   */
  templateExists(cardType: CardType, variant: number): Observable<boolean> {
    return this.loadTemplate(cardType, variant).pipe(map((template) => template !== null));
  }

  /**
   * Create a new template from a card
   */
  createTemplate(
    card: AICardConfig,
    metadata: Omit<TemplateMetadata, 'id' | 'createdAt' | 'updatedAt'>
  ): string {
    // Validate card
    const validation = this.validationService.validateCard(card);
    if (!validation.success) {
      throw new Error(`Invalid card: ${validation.errorMessages?.join(', ')}`);
    }

    // Generate template ID
    const templateId = `template_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // Create template metadata
    const templateMeta: TemplateMetadata = {
      id: templateId,
      ...metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Remove IDs and sanitize
    const scrubbed = removeAllIds(card);
    const template: AICardConfig = {
      ...scrubbed,
      cardType: metadata.cardType,
      id: templateId,
    };

    // Store in user templates
    const userTemplates = this.getUserTemplates();
    userTemplates.push(template);
    this.saveUserTemplates(userTemplates);

    // Store metadata
    this.templateMetadata.set(templateId, templateMeta);
    this.saveTemplateMetadata();

    this.logger.info('Template created', 'CardTemplatesService', {
      templateId,
      name: metadata.name,
    });
    return templateId;
  }

  /**
   * Update an existing template
   */
  updateTemplate(
    templateId: string,
    card: AICardConfig,
    updates?: Partial<TemplateMetadata>
  ): void {
    const userTemplates = this.getUserTemplates();
    const index = userTemplates.findIndex((t) => t.id === templateId);

    if (index === -1) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Validate card
    const validation = this.validationService.validateCard(card);
    if (!validation.success) {
      throw new Error(`Invalid card: ${validation.errorMessages?.join(', ')}`);
    }

    // Update template
    const scrubbed = removeAllIds(card);
    userTemplates[index] = {
      ...scrubbed,
      id: templateId,
    };
    this.saveUserTemplates(userTemplates);

    // Update metadata
    const meta = this.templateMetadata.get(templateId);
    if (meta) {
      this.templateMetadata.set(templateId, {
        ...meta,
        ...updates,
        updatedAt: new Date(),
      });
      this.saveTemplateMetadata();
    }

    this.logger.info('Template updated', 'CardTemplatesService', { templateId });
  }

  /**
   * Delete a template
   */
  deleteTemplate(templateId: string): void {
    const userTemplates = this.getUserTemplates();
    const filtered = userTemplates.filter((t) => t.id !== templateId);
    this.saveUserTemplates(filtered);

    this.templateMetadata.delete(templateId);
    this.saveTemplateMetadata();

    this.logger.info('Template deleted', 'CardTemplatesService', { templateId });
  }

  /**
   * Export template
   */
  async exportTemplate(templateId: string, format: 'json' | 'pdf' = 'json'): Promise<void> {
    const userTemplates = this.getUserTemplates();
    const template = userTemplates.find((t) => t.id === templateId);

    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    await this.exportService.exportCard(template, {
      format,
      filename: `${this.sanitizeFilename(template.cardTitle || 'template')}.${format}`,
      includeMetadata: true,
      prettyPrint: true,
    });
  }

  /**
   * Import template from JSON
   */
  importTemplate(jsonString: string, metadata?: Partial<TemplateMetadata>): string {
    try {
      const parsed = JSON.parse(jsonString);
      const validation = this.validationService.validateCard(parsed);

      if (!validation.success || !validation.data) {
        throw new Error(`Invalid template: ${validation.errorMessages?.join(', ')}`);
      }

      const card = validation.data;
      const templateId = `template_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      const templateMeta: TemplateMetadata = {
        id: templateId,
        name: metadata?.name || card.cardTitle || 'Imported Template',
        cardType: metadata?.cardType || (card.cardType as CardType) || 'all',
        variant: metadata?.variant || 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...(metadata?.description !== undefined && { description: metadata.description }),
        ...(metadata?.tags !== undefined && { tags: metadata.tags }),
        ...(metadata?.createdBy !== undefined && { createdBy: metadata.createdBy }),
      };

      const userTemplates = this.getUserTemplates();
      userTemplates.push({ ...card, id: templateId });
      this.saveUserTemplates(userTemplates);

      this.templateMetadata.set(templateId, templateMeta);
      this.saveTemplateMetadata();

      this.logger.info('Template imported', 'CardTemplatesService', { templateId });
      return templateId;
    } catch (error) {
      this.logger.error('Failed to import template', 'CardTemplatesService', { error });
      throw new Error(
        `Failed to import template: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get all user-created templates
   */
  getUserTemplates(): AICardConfig[] {
    try {
      const stored = localStorage.getItem(this.userTemplatesKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      this.logger.error('Failed to load user templates', 'CardTemplatesService', { error });
    }
    return [];
  }

  /**
   * Get template metadata
   */
  getTemplateMetadata(templateId: string): TemplateMetadata | null {
    return this.templateMetadata.get(templateId) || null;
  }

  /**
   * Get all template metadata
   */
  getAllTemplateMetadata(): TemplateMetadata[] {
    return Array.from(this.templateMetadata.values());
  }

  /**
   * Search templates
   */
  searchTemplates(query: string): AICardConfig[] {
    const userTemplates = this.getUserTemplates();
    const lowerQuery = query.toLowerCase();

    return userTemplates.filter((template) => {
      const title = template.cardTitle?.toLowerCase() || '';
      const description = template.description?.toLowerCase() || '';
      const type = template.cardType?.toLowerCase() || '';

      return (
        title.includes(lowerQuery) || description.includes(lowerQuery) || type.includes(lowerQuery)
      );
    });
  }

  /**
   * Load user templates from localStorage
   */
  private loadUserTemplates(): void {
    const templates = this.getUserTemplates();
    this.userTemplatesSubject.next(templates);

    // Load metadata
    try {
      const stored = localStorage.getItem('osi-cards-template-metadata');
      if (stored) {
        const metadata = JSON.parse(stored) as TemplateMetadata[];
        metadata.forEach((meta) => {
          this.templateMetadata.set(meta.id, {
            ...meta,
            createdAt: new Date(meta.createdAt),
            updatedAt: new Date(meta.updatedAt),
          });
        });
      }
    } catch (error) {
      this.logger.error('Failed to load template metadata', 'CardTemplatesService', { error });
    }
  }

  /**
   * Save user templates to localStorage
   */
  private saveUserTemplates(templates: AICardConfig[]): void {
    try {
      localStorage.setItem(this.userTemplatesKey, JSON.stringify(templates));
      this.userTemplatesSubject.next(templates);
    } catch (error) {
      this.logger.error('Failed to save user templates', 'CardTemplatesService', { error });
    }
  }

  /**
   * Save template metadata to localStorage
   */
  private saveTemplateMetadata(): void {
    try {
      const metadata = Array.from(this.templateMetadata.values());
      localStorage.setItem('osi-cards-template-metadata', JSON.stringify(metadata));
    } catch (error) {
      this.logger.error('Failed to save template metadata', 'CardTemplatesService', { error });
    }
  }

  /**
   * Sanitize filename
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-z0-9]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
      .substring(0, 50);
  }
}
