/**
 * Type Guards Utility (Point 17)
 * 
 * Provides type guard functions for all section types and card structures.
 * These guards enable safe type narrowing in TypeScript.
 * 
 * @example
 * ```typescript
 * import { isInfoSection, isAnalyticsSection, isCardSection } from 'osi-cards-lib';
 * 
 * if (isInfoSection(section)) {
 *   // section is typed as InfoSection
 *   console.log(section.fields);
 * }
 * 
 * // Use in filter
 * const infoSections = sections.filter(isInfoSection);
 * ```
 */

import type { 
  CardSection, 
  CardField, 
  CardItem, 
  AICardConfig, 
  CardAction 
} from '../models/card.model';
import { SectionType, SectionTypeInput, isValidSectionType } from '../models/generated-section-types';

// ============================================================================
// Section Type Guards
// ============================================================================

/**
 * Check if section is of type 'info'
 */
export function isInfoSection(section: CardSection): boolean {
  return section.type === 'info';
}

/**
 * Check if section is of type 'analytics'
 */
export function isAnalyticsSection(section: CardSection): boolean {
  return section.type === 'analytics';
}

/**
 * Check if section is of type 'contact-card'
 */
export function isContactCardSection(section: CardSection): boolean {
  return section.type === 'contact-card';
}

/**
 * Check if section is of type 'network-card'
 */
export function isNetworkCardSection(section: CardSection): boolean {
  return section.type === 'network-card';
}

/**
 * Check if section is of type 'map'
 */
export function isMapSection(section: CardSection): boolean {
  return section.type === 'map';
}

/**
 * Check if section is of type 'financials'
 */
export function isFinancialsSection(section: CardSection): boolean {
  return section.type === 'financials';
}

/**
 * Check if section is of type 'event'
 */
export function isEventSection(section: CardSection): boolean {
  return section.type === 'event';
}

/**
 * Check if section is of type 'list'
 */
export function isListSection(section: CardSection): boolean {
  return section.type === 'list';
}

/**
 * Check if section is of type 'chart'
 */
export function isChartSection(section: CardSection): boolean {
  return section.type === 'chart';
}

/**
 * Check if section is of type 'product'
 */
export function isProductSection(section: CardSection): boolean {
  return section.type === 'product';
}

/**
 * Check if section is of type 'solutions'
 */
export function isSolutionsSection(section: CardSection): boolean {
  return section.type === 'solutions';
}

/**
 * Check if section is of type 'overview'
 */
export function isOverviewSection(section: CardSection): boolean {
  return section.type === 'overview';
}

/**
 * Check if section is of type 'quotation'
 */
export function isQuotationSection(section: CardSection): boolean {
  return section.type === 'quotation';
}

/**
 * Check if section is of type 'text-reference'
 */
export function isTextReferenceSection(section: CardSection): boolean {
  return section.type === 'text-reference';
}

/**
 * Check if section is of type 'brand-colors'
 */
export function isBrandColorsSection(section: CardSection): boolean {
  return section.type === 'brand-colors';
}

/**
 * Check if section is of type 'news'
 */
export function isNewsSection(section: CardSection): boolean {
  return section.type === 'news';
}

/**
 * Check if section is of type 'social-media'
 */
export function isSocialMediaSection(section: CardSection): boolean {
  return section.type === 'social-media';
}

/**
 * Check if section is of type 'fallback'
 */
export function isFallbackSection(section: CardSection): boolean {
  return section.type === 'fallback';
}

/**
 * Generic section type guard
 */
export function isSectionOfType(
  section: CardSection, 
  type: SectionTypeInput
): boolean {
  return section.type === type;
}

/**
 * Check if value is a valid section type
 */
export function isSectionType(value: unknown): value is SectionType {
  return typeof value === 'string' && isValidSectionType(value);
}

// ============================================================================
// Card Structure Guards
// ============================================================================

/**
 * Check if value is a valid CardSection
 */
export function isCardSection(value: unknown): value is CardSection {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  
  // Must have type property
  if (typeof obj['type'] !== 'string') return false;
  
  // Should have title or id
  if (!obj['title'] && !obj['id']) return false;
  
  return true;
}

/**
 * Check if value is a valid CardField
 */
export function isCardField(value: unknown): value is CardField {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  
  // Should have label
  if (typeof obj['label'] !== 'string' && typeof obj['title'] !== 'string') {
    return false;
  }
  
  return true;
}

/**
 * Check if value is a valid CardItem
 */
export function isCardItem(value: unknown): value is CardItem {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  
  // Should have title
  if (typeof obj['title'] !== 'string') return false;
  
  return true;
}

/**
 * Check if value is a valid AICardConfig
 */
export function isAICardConfig(value: unknown): value is AICardConfig {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  
  // Must have cardTitle
  if (typeof obj['cardTitle'] !== 'string') return false;
  
  // Must have sections array
  if (!Array.isArray(obj['sections'])) return false;
  
  // All sections must be valid
  if (!obj['sections'].every(isCardSection)) return false;
  
  return true;
}

/**
 * Check if value is a valid CardAction
 */
export function isCardAction(value: unknown): value is CardAction {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  
  // Should have label
  if (typeof obj['label'] !== 'string') return false;
  
  return true;
}

// ============================================================================
// Section Feature Guards
// ============================================================================

/**
 * Check if section uses fields array
 */
export function sectionHasFields(section: CardSection): boolean {
  return Array.isArray(section.fields) && section.fields.length > 0;
}

/**
 * Check if section uses items array
 */
export function sectionHasItems(section: CardSection): boolean {
  return Array.isArray(section.items) && section.items.length > 0;
}

/**
 * Check if section has chart data
 */
export function sectionHasChartData(section: CardSection): boolean {
  return section.chartData !== undefined && section.chartData !== null;
}

/**
 * Check if section has description
 */
export function sectionHasDescription(section: CardSection): boolean {
  return typeof section.description === 'string' && section.description.length > 0;
}

/**
 * Check if section has emoji
 */
export function sectionHasEmoji(section: CardSection): boolean {
  return typeof section.emoji === 'string' && section.emoji.length > 0;
}

/**
 * Check if section is collapsed
 */
export function sectionIsCollapsed(section: CardSection): boolean {
  return section.collapsed === true;
}

// ============================================================================
// Field Feature Guards
// ============================================================================

/**
 * Check if field has trend indicator
 */
export function fieldHasTrend(field: CardField): boolean {
  return field.trend !== undefined && 
    ['up', 'down', 'stable', 'neutral'].includes(field.trend);
}

/**
 * Check if field has percentage
 */
export function fieldHasPercentage(field: CardField): boolean {
  return typeof field.percentage === 'number';
}

/**
 * Check if field has performance rating
 */
export function fieldHasPerformance(field: CardField): boolean {
  return field.performance !== undefined &&
    ['excellent', 'good', 'average', 'poor'].includes(field.performance);
}

/**
 * Check if field is clickable
 */
export function fieldIsClickable(field: CardField): boolean {
  return field.clickable === true || typeof field.link === 'string';
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert that value is a CardSection
 * @throws Error if not a valid section
 */
export function assertCardSection(value: unknown): asserts value is CardSection {
  if (!isCardSection(value)) {
    throw new Error(`Invalid CardSection: ${JSON.stringify(value)}`);
  }
}

/**
 * Assert that value is an AICardConfig
 * @throws Error if not a valid config
 */
export function assertAICardConfig(value: unknown): asserts value is AICardConfig {
  if (!isAICardConfig(value)) {
    throw new Error(`Invalid AICardConfig: ${JSON.stringify(value)}`);
  }
}

/**
 * Assert that value is a valid section type
 * @throws Error if not a valid type
 */
export function assertSectionType(value: unknown): asserts value is SectionType {
  if (!isSectionType(value)) {
    throw new Error(`Invalid SectionType: ${value}`);
  }
}

// ============================================================================
// Type Guard Map
// ============================================================================

/**
 * Map of section type to type guard function
 */
export const SECTION_TYPE_GUARDS: Record<string, (section: CardSection) => boolean> = {
  'info': isInfoSection,
  'analytics': isAnalyticsSection,
  'contact-card': isContactCardSection,
  'network-card': isNetworkCardSection,
  'map': isMapSection,
  'financials': isFinancialsSection,
  'event': isEventSection,
  'list': isListSection,
  'chart': isChartSection,
  'product': isProductSection,
  'solutions': isSolutionsSection,
  'overview': isOverviewSection,
  'quotation': isQuotationSection,
  'text-reference': isTextReferenceSection,
  'brand-colors': isBrandColorsSection,
  'news': isNewsSection,
  'social-media': isSocialMediaSection,
  'fallback': isFallbackSection,
};

/**
 * Get type guard for a section type
 */
export function getTypeGuard(type: string): ((section: CardSection) => boolean) | undefined {
  return SECTION_TYPE_GUARDS[type];
}

