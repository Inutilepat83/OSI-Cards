/**
 * Discriminated Unions for Section Types
 *
 * Provides type-safe discriminated unions for different section types.
 * This ensures type safety when working with different section types
 * and their specific properties.
 *
 * @example
 * ```typescript
 * function processSection(section: DiscriminatedSection): void {
 *   switch (section.type) {
 *     case 'info':
 *       // TypeScript knows section has 'fields' property
 *       console.log(section.fields);
 *       break;
 *     case 'analytics':
 *       // TypeScript knows section has analytics-specific properties
 *       console.log(section.fields[0].trend);
 *       break;
 *   }
 * }
 * ```
 */

import { CardField, CardItem, CardSection } from './card.model';

/**
 * Base section properties shared by all section types
 */
interface BaseSection {
  id?: string;
  title: string;
  description?: string;
  subtitle?: string;
  columns?: number;
  colSpan?: number;
  width?: number;
  collapsed?: boolean;
  emoji?: string;
  meta?: Record<string, unknown>;
}

/**
 * Info section - displays key-value pairs
 */
export interface InfoSection extends BaseSection {
  type: 'info';
  fields: CardField[];
  items?: never;
  chartType?: never;
  chartData?: never;
}

/**
 * Analytics section - displays metrics with trends
 */
export interface AnalyticsSection extends BaseSection {
  type: 'analytics' | 'metrics' | 'stats';
  fields: CardField[];
  items?: never;
  chartType?: never;
  chartData?: never;
}

/**
 * List section - displays a list of items
 */
export interface ListSection extends BaseSection {
  type: 'list' | 'table';
  items: CardItem[];
  fields?: never;
  chartType?: never;
  chartData?: never;
}

/**
 * Chart section - displays a chart
 */
export interface ChartSection extends BaseSection {
  type: 'chart';
  chartType: 'bar' | 'line' | 'pie' | 'doughnut';
  chartData: {
    labels?: string[];
    datasets?: {
      label?: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
    }[];
  };
  fields?: never;
  items?: never;
}

/**
 * Event/Timeline section - displays events in chronological order
 */
export interface EventSection extends BaseSection {
  type: 'event' | 'timeline';
  items: CardItem[];
  fields?: never;
  chartType?: never;
  chartData?: never;
}

/**
 * Product section - displays product information
 */
export interface ProductSection extends BaseSection {
  type: 'product';
  items: CardItem[];
  fields?: never;
  chartType?: never;
  chartData?: never;
}

/**
 * Contact card section - displays contact information
 */
export interface ContactCardSection extends BaseSection {
  type: 'contact-card';
  items: CardItem[];
  fields?: never;
  chartType?: never;
  chartData?: never;
}

/**
 * Network card section - displays network/relationship information
 */
export interface NetworkCardSection extends BaseSection {
  type: 'network-card';
  items: CardItem[];
  fields?: never;
  chartType?: never;
  chartData?: never;
}

/**
 * Map section - displays map/location information
 */
export interface MapSection extends BaseSection {
  type: 'map' | 'locations';
  items?: CardItem[];
  fields?: CardField[];
  chartType?: never;
  chartData?: never;
}

/**
 * Overview section - displays overview information
 */
export interface OverviewSection extends BaseSection {
  type: 'overview';
  fields: CardField[];
  items?: never;
  chartType?: never;
  chartData?: never;
}

/**
 * Solutions section - displays solutions/services
 */
export interface SolutionsSection extends BaseSection {
  type: 'solutions';
  items: CardItem[];
  fields?: never;
  chartType?: never;
  chartData?: never;
}

/**
 * Financials section - displays financial information
 */
export interface FinancialsSection extends BaseSection {
  type: 'financials';
  fields: CardField[];
  items?: never;
  chartType?: never;
  chartData?: never;
}

/**
 * News section - displays news items
 */
export interface NewsSection extends BaseSection {
  type: 'news';
  items: CardItem[];
  fields?: never;
  chartType?: never;
  chartData?: never;
}

/**
 * Social media section - displays social media information
 */
export interface SocialMediaSection extends BaseSection {
  type: 'social-media';
  items: CardItem[];
  fields?: never;
  chartType?: never;
  chartData?: never;
}

/**
 * Quotation section - displays quotes
 */
export interface QuotationSection extends BaseSection {
  type: 'quotation' | 'quote';
  items: CardItem[];
  fields?: never;
  chartType?: never;
  chartData?: never;
}

/**
 * Text reference section - displays text references
 */
export interface TextReferenceSection extends BaseSection {
  type: 'text-reference' | 'reference' | 'text-ref';
  items?: CardItem[];
  fields?: CardField[];
  chartType?: never;
  chartData?: never;
}

/**
 * Brand colors section - displays brand colors
 */
export interface BrandColorsSection extends BaseSection {
  type: 'brand-colors' | 'brands' | 'colors';
  items?: CardItem[];
  fields?: CardField[];
  chartType?: never;
  chartData?: never;
}

/**
 * Fallback section - used when section type is unknown
 */
export interface FallbackSection extends BaseSection {
  type: 'fallback';
  fields?: CardField[];
  items?: CardItem[];
  chartType?: never;
  chartData?: never;
}

/**
 * Discriminated union of all section types
 *
 * This union type ensures type safety when working with sections.
 * TypeScript will narrow the type based on the 'type' property.
 */
export type DiscriminatedSection =
  | InfoSection
  | AnalyticsSection
  | ListSection
  | ChartSection
  | EventSection
  | ProductSection
  | ContactCardSection
  | NetworkCardSection
  | MapSection
  | OverviewSection
  | SolutionsSection
  | FinancialsSection
  | NewsSection
  | SocialMediaSection
  | QuotationSection
  | TextReferenceSection
  | BrandColorsSection
  | FallbackSection;

/**
 * Type guard to check if a section is an InfoSection
 * Note: Returns CardSection with narrowed type for practical use
 */
export function isInfoSection(section: CardSection): section is CardSection & { type: 'info' } {
  return section.type === 'info';
}

/**
 * Type guard to check if a section is an AnalyticsSection
 * Note: Returns CardSection with narrowed type for practical use
 */
export function isAnalyticsSection(
  section: CardSection
): section is CardSection & { type: 'analytics' | 'metrics' | 'stats' } {
  return section.type === 'analytics' || section.type === 'metrics' || section.type === 'stats';
}

/**
 * Type guard to check if a section is a ListSection
 * Note: Returns CardSection with narrowed type for practical use
 */
export function isListSection(
  section: CardSection
): section is CardSection & { type: 'list' | 'table' } {
  return section.type === 'list' || section.type === 'table';
}

/**
 * Type guard to check if a section is a ChartSection
 * Note: Returns CardSection with narrowed type for practical use
 */
export function isChartSection(section: CardSection): section is CardSection & { type: 'chart' } {
  return section.type === 'chart';
}

/**
 * Type guard to check if a section has fields
 */
export function hasFields(section: CardSection): section is CardSection & { fields: CardField[] } {
  return 'fields' in section && Array.isArray(section.fields) && section.fields.length > 0;
}

/**
 * Type guard to check if a section has items
 */
export function hasItems(section: CardSection): section is CardSection & { items: CardItem[] } {
  return 'items' in section && Array.isArray(section.items) && section.items.length > 0;
}

/**
 * Helper to narrow section type based on type property
 * Note: Returns CardSection with narrowed type for practical use
 */
export function narrowSectionType<T extends DiscriminatedSection['type']>(
  section: CardSection,
  type: T
): section is CardSection & { type: T } {
  return section.type === type;
}
