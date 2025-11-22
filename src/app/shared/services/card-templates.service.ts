import { Injectable } from '@angular/core';
import { AICardConfig, CardType } from '../../models';

/**
 * Card templates service
 * Provides pre-built card templates for common use cases
 */
@Injectable({
  providedIn: 'root'
})
export class CardTemplatesService {
  /**
   * Get template by type and variant
   */
  getTemplate(cardType: CardType, variant: number = 1): AICardConfig | null {
    const templates = this.getTemplatesByType(cardType);
    return templates[variant - 1] || templates[0] || null;
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
    return types.flatMap(type => this.getTemplatesByType(type));
  }

  /**
   * Company templates
   */
  private getCompanyTemplates(): AICardConfig[] {
    return [
      {
        cardTitle: 'Company Name',
        cardType: 'company',
        cardSubtitle: 'Company Tagline',
        sections: [
          {
            title: 'Company Overview',
            type: 'overview',
            fields: [
              { label: 'Industry', value: 'Technology' },
              { label: 'Employees', value: '1000+' },
              { label: 'Founded', value: '2020' },
              { label: 'Location', value: 'San Francisco, CA' }
            ]
          },
          {
            title: 'Key Metrics',
            type: 'analytics',
            fields: [
              { label: 'Revenue', value: '$10M', percentage: 100, trend: 'up' },
              { label: 'Growth', value: '25%', percentage: 25, trend: 'up' }
            ]
          }
        ]
      }
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
                  phone: '+1-555-0100'
                }
              }
            ]
          }
        ]
      }
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
              { label: 'Probability', value: '60%', percentage: 60 }
            ]
          }
        ]
      }
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
              { title: 'Feature 2', description: 'Description of feature 2' }
            ]
          }
        ]
      }
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
                status: 'active'
              }
            ]
          }
        ]
      }
    ];
  }
}


