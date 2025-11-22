import { AICardConfig, CardSection, CardField, CardItem, CardAction } from '../../models';

/**
 * Enhanced type guards with more comprehensive runtime type checking
 * Extends CardTypeGuards with additional validation
 */
export class EnhancedTypeGuards {
  /**
   * Check if value is a valid card type
   */
  static isCardType(value: unknown): value is 'company' | 'contact' | 'opportunity' | 'product' | 'analytics' | 'event' | 'project' | 'sko' {
    if (typeof value !== 'string') {
      return false;
    }
    const validTypes = ['company', 'contact', 'opportunity', 'product', 'analytics', 'event', 'project', 'sko'];
    return validTypes.includes(value);
  }

  /**
   * Check if value is a valid section type
   */
  static isSectionType(value: unknown): value is CardSection['type'] {
    if (typeof value !== 'string') {
      return false;
    }
    const validTypes: CardSection['type'][] = [
      'info', 'timeline', 'analytics', 'metrics', 'contact-card', 'network-card',
      'map', 'financials', 'locations', 'event', 'project', 'list', 'table',
      'chart', 'product', 'solutions', 'overview', 'stats', 'quotation',
      'reference', 'text-reference', 'text-ref', 'brand-colors'
    ];
    return validTypes.includes(value as CardSection['type']);
  }

  /**
   * Check if value is a valid field format
   */
  static isFieldFormat(value: unknown): value is 'currency' | 'percentage' | 'number' | 'text' {
    if (typeof value !== 'string') {
      return false;
    }
    const validFormats = ['currency', 'percentage', 'number', 'text'];
    return validFormats.includes(value);
  }

  /**
   * Check if value is a valid trend
   */
  static isTrend(value: unknown): value is 'up' | 'down' | 'stable' | 'neutral' {
    if (typeof value !== 'string') {
      return false;
    }
    const validTrends = ['up', 'down', 'stable', 'neutral'];
    return validTrends.includes(value);
  }

  /**
   * Check if value is a valid status
   */
  static isStatus(value: unknown): value is 'completed' | 'in-progress' | 'pending' | 'cancelled' | 'active' | 'inactive' | 'warning' {
    if (typeof value !== 'string') {
      return false;
    }
    const validStatuses = ['completed', 'in-progress', 'pending', 'cancelled', 'active', 'inactive', 'warning'];
    return validStatuses.includes(value);
  }

  /**
   * Check if value is a valid priority
   */
  static isPriority(value: unknown): value is 'high' | 'medium' | 'low' {
    if (typeof value !== 'string') {
      return false;
    }
    const validPriorities = ['high', 'medium', 'low'];
    return validPriorities.includes(value);
  }

  /**
   * Validate card action type
   */
  static isCardActionType(value: unknown): value is 'mail' | 'website' | 'agent' | 'question' | 'primary' | 'secondary' {
    if (typeof value !== 'string') {
      return false;
    }
    const validTypes = ['mail', 'website', 'agent', 'question', 'primary', 'secondary'];
    return validTypes.includes(value);
  }

  /**
   * Comprehensive card validation
   */
  static validateCardComprehensive(card: unknown): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!card || typeof card !== 'object') {
      return { isValid: false, errors: ['Card must be an object'] };
    }

    const cardObj = card as Record<string, unknown>;

    // Validate cardTitle
    if (!cardObj['cardTitle'] || typeof cardObj['cardTitle'] !== 'string') {
      errors.push('Card must have a cardTitle string');
    }

    // Validate sections
    if (!Array.isArray(cardObj['sections'])) {
      errors.push('Card must have a sections array');
    } else {
      (cardObj['sections'] as unknown[]).forEach((section, index) => {
        if (!this.isCardSection(section)) {
          errors.push(`Section ${index + 1} is invalid`);
        }
      });
    }

    // Validate cardType if present
    if (cardObj['cardType'] && !this.isCardType(cardObj['cardType'])) {
      errors.push('Invalid cardType');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Enhanced section validation
   */
  static isCardSection(obj: unknown): obj is CardSection {
    if (!obj || typeof obj !== 'object') {
      return false;
    }
    const section = obj as Record<string, unknown>;
    
    if (typeof section['title'] !== 'string') {
      return false;
    }

    if (section['type'] && !this.isSectionType(section['type'])) {
      return false;
    }

    return true;
  }

  /**
   * Enhanced field validation
   */
  static isCardField(obj: unknown): obj is CardField {
    if (!obj || typeof obj !== 'object') {
      return false;
    }
    const field = obj as Record<string, unknown>;

    // Field must have at least label or title
    if (!field['label'] && !field['title']) {
      return false;
    }

    // Validate format if present
    if (field['format'] && !this.isFieldFormat(field['format'])) {
      return false;
    }

    // Validate trend if present
    if (field['trend'] && !this.isTrend(field['trend'])) {
      return false;
    }

    // Validate status if present
    if (field['status'] && !this.isStatus(field['status'])) {
      return false;
    }

    // Validate priority if present
    if (field['priority'] && !this.isPriority(field['priority'])) {
      return false;
    }

    return true;
  }
}

