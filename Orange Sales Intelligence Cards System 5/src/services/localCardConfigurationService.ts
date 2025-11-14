import { AICardConfig, CardType, ValidationResult, TemplateService } from '../types';
import companyTemplateVariants from '../data/companyTemplateVariants';
import contactTemplateVariants from '../data/contactTemplateVariants';
import opportunityTemplateVariants from '../data/opportunityTemplateVariants';
import productTemplateVariants from '../data/productTemplateVariants';
import analyticsTemplateVariants from '../data/analyticsTemplateVariants';
import eventTemplateVariants from '../data/eventTemplateVariants';

class LocalCardConfigurationService implements TemplateService {
  private static instance: LocalCardConfigurationService;
  private templateCache = new Map<string, AICardConfig[]>();

  static getInstance(): LocalCardConfigurationService {
    if (!LocalCardConfigurationService.instance) {
      LocalCardConfigurationService.instance = new LocalCardConfigurationService();
    }
    return LocalCardConfigurationService.instance;
  }

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Load all template variants
    this.templateCache.set('Company', companyTemplateVariants);
    this.templateCache.set('Contact', contactTemplateVariants);
    this.templateCache.set('Opportunity', opportunityTemplateVariants);
    this.templateCache.set('Product', productTemplateVariants);
    this.templateCache.set('Analytics', analyticsTemplateVariants);
    this.templateCache.set('Event', eventTemplateVariants);

    console.log('📋 Template cache initialized with:', {
      Company: companyTemplateVariants.length,
      Contact: contactTemplateVariants.length,
      Opportunity: opportunityTemplateVariants.length,
      Product: productTemplateVariants.length,
      Analytics: analyticsTemplateVariants.length,
      Event: eventTemplateVariants.length
    });
  }

  private normalizeCardType(type: string | CardType): CardType {
    const cardTypeMap: Record<string, CardType> = {
      'company': 'Company',
      'contact': 'Contact', 
      'opportunity': 'Opportunity',
      'product': 'Product',
      'analytics': 'Analytics',
      'event': 'Event'
    };

    if (typeof type === 'string') {
      const normalizedType = cardTypeMap[type.toLowerCase()] || 
                            (type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() as CardType);
      return normalizedType;
    }
    
    return type;
  }

  async getTemplate(type: string | CardType, variant: number): Promise<AICardConfig | null> {
    try {
      const normalizedType = this.normalizeCardType(type);
      const templates = this.templateCache.get(normalizedType);
      
      if (!templates || variant < 1 || variant > templates.length) {
        console.warn(`Template not found: ${normalizedType} variant ${variant}`);
        return null;
      }
      
      // Deep clone to prevent mutations
      const template = JSON.parse(JSON.stringify(templates[variant - 1]));
      
      // Generate a unique ID for this instance
      template.id = this.generateCardId();
      
      console.log(`✅ Loaded template: ${normalizedType} variant ${variant} - ${template.cardTitle}`);
      return template;
    } catch (error) {
      console.error('Error loading template:', error);
      return null;
    }
  }

  async getAllTemplatesByType(type: CardType): Promise<AICardConfig[]> {
    try {
      const normalizedType = this.normalizeCardType(type);
      const templates = this.templateCache.get(normalizedType);
      
      if (!templates) {
        console.warn(`No templates found for type: ${normalizedType}`);
        return [];
      }
      
      // Deep clone to prevent mutations
      return JSON.parse(JSON.stringify(templates));
    } catch (error) {
      console.error('Error loading templates by type:', error);
      return [];
    }
  }

  validateCardConfig(config: AICardConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!config.cardTitle?.trim()) {
      errors.push('Card title is required');
    }

    if (!config.cardType) {
      errors.push('Card type is required');
    }

    const validCardTypes: CardType[] = ['Company', 'Contact', 'Opportunity', 'Product', 'Analytics', 'Event'];
    if (config.cardType && !validCardTypes.includes(config.cardType)) {
      errors.push(`Invalid card type: ${config.cardType}`);
    }

    // Sections validation
    if (config.sections) {
      config.sections.forEach((section, index) => {
        if (!section.id?.trim()) {
          errors.push(`Section ${index + 1}: ID is required`);
        }

        if (!section.title?.trim()) {
          errors.push(`Section ${index + 1}: Title is required`);
        }

        if (!section.type?.trim()) {
          errors.push(`Section ${index + 1}: Type is required`);
        }

        // Check for duplicate section IDs
        const duplicateIds = config.sections!.filter(s => s.id === section.id);
        if (duplicateIds.length > 1) {
          warnings.push(`Section ${index + 1}: Duplicate ID "${section.id}" found`);
        }
      });
    }

    // Actions validation
    if (config.actions) {
      config.actions.forEach((action, index) => {
        if (!action.id?.trim()) {
          warnings.push(`Action ${index + 1}: ID is recommended`);
        }

        if (!action.label?.trim()) {
          errors.push(`Action ${index + 1}: Label is required`);
        }

        if (!action.action?.trim()) {
          errors.push(`Action ${index + 1}: Action is required`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  generateCardId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `card-${timestamp}-${random}`;
  }

  // Additional utility methods
  getAvailableCardTypes(): CardType[] {
    return Array.from(this.templateCache.keys()) as CardType[];
  }

  getTemplateCount(type: CardType): number {
    const normalizedType = this.normalizeCardType(type);
    const templates = this.templateCache.get(normalizedType);
    return templates ? templates.length : 0;
  }

  async exportTemplate(config: AICardConfig): Promise<string> {
    try {
      return JSON.stringify(config, null, 2);
    } catch (error) {
      console.error('Error exporting template:', error);
      throw new Error('Failed to export template');
    }
  }

  async importTemplate(jsonString: string): Promise<AICardConfig> {
    try {
      const config = JSON.parse(jsonString);
      const validation = this.validateCardConfig(config);
      
      if (!validation.isValid) {
        throw new Error(`Invalid template: ${validation.errors.join(', ')}`);
      }

      // Assign ID if not present
      if (!config.id) {
        config.id = this.generateCardId();
      }

      return config;
    } catch (error) {
      console.error('Error importing template:', error);
      throw new Error('Failed to import template: Invalid JSON or format');
    }
  }
}

export const localCardConfigurationService = LocalCardConfigurationService.getInstance();
export default localCardConfigurationService;