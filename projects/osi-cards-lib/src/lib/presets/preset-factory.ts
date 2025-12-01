import { AICardConfig } from '../models';
import { createCompanyCard, CompanyCardOptions, createEnhancedCompanyCard } from './company-card.preset';
import { createContactCard, ContactCardOptions } from './contact-card.preset';
import { createAnalyticsDashboard, AnalyticsDashboardOptions } from './analytics-dashboard.preset';

/**
 * Preset Factory
 * 
 * Centralized factory for creating card presets with common configurations.
 * 
 * @example
 * ```typescript
 * import { PresetFactory } from 'osi-cards-lib';
 * 
 * // Create a company card
 * const companyCard = PresetFactory.createCompany({
 *   name: 'Acme Corp',
 *   industry: 'Technology'
 * });
 * 
 * // Create a contact card
 * const contactCard = PresetFactory.createContact({
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * });
 * ```
 */
export class PresetFactory {
  /**
   * Create a company card
   * 
   * @param options - Company card options
   * @returns Company card configuration
   */
  static createCompany(options: CompanyCardOptions): AICardConfig {
    return createCompanyCard(options);
  }

  /**
   * Create an enhanced company card with additional sections
   * 
   * @param options - Enhanced company card options
   * @returns Enhanced company card configuration
   */
  static createEnhancedCompany(options: CompanyCardOptions & {
    financials?: Array<{ label: string; value: string | number }>;
    products?: Array<{ name: string; description?: string }>;
  }): AICardConfig {
    return createEnhancedCompanyCard(options);
  }

  /**
   * Create a contact card
   * 
   * @param options - Contact card options
   * @returns Contact card configuration
   */
  static createContact(options: ContactCardOptions): AICardConfig {
    return createContactCard(options);
  }

  /**
   * Create an analytics dashboard card
   * 
   * @param options - Analytics dashboard options
   * @returns Analytics dashboard configuration
   */
  static createAnalytics(options: AnalyticsDashboardOptions): AICardConfig {
    return createAnalyticsDashboard(options);
  }

  /**
   * Create a custom card from a template
   * 
   * @param template - Template function that returns AICardConfig
   * @returns Card configuration
   */
  static createCustom<T extends AICardConfig>(
    template: (config: Partial<T>) => T,
    config: Partial<T>
  ): AICardConfig {
    return template(config as Partial<T>);
  }
}

/**
 * Convenience factory functions (alternative to PresetFactory class)
 */

/**
 * Create a company card (convenience function)
 */
export function createCompanyPreset(options: CompanyCardOptions): AICardConfig {
  return PresetFactory.createCompany(options);
}

/**
 * Create a contact card (convenience function)
 */
export function createContactPreset(options: ContactCardOptions): AICardConfig {
  return PresetFactory.createContact(options);
}

/**
 * Create an analytics dashboard (convenience function)
 */
export function createAnalyticsPreset(options: AnalyticsDashboardOptions): AICardConfig {
  return PresetFactory.createAnalytics(options);
}













