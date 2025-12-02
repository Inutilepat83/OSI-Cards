/**
 * Discriminated Union Types for Card Sections
 *
 * These types enable exhaustive type checking when handling different section types.
 * The 'type' property acts as the discriminant, allowing TypeScript to narrow
 * the type automatically in switch statements and conditional checks.
 *
 * @example
 * ```typescript
 * function handleSection(section: DiscriminatedSection): void {
 *   switch (section.type) {
 *     case 'info':
 *       // TypeScript knows section is InfoSection here
 *       console.log(section.fields);
 *       break;
 *     case 'chart':
 *       // TypeScript knows section is ChartSection here
 *       console.log(section.chartData);
 *       break;
 *     // ... handle all cases for exhaustive checking
 *   }
 * }
 * ```
 *
 * @module models/discriminated-sections
 */

import type { CardField, CardItem, CardAction } from './card.model';
import type { SectionType } from './generated-section-types';

// ============================================================================
// BASE SECTION PROPERTIES (shared by all sections)
// ============================================================================

/**
 * Common properties shared by all section types
 */
export interface BaseSectionProps {
  /** Unique identifier for the section */
  id?: string;
  /** Section title */
  title: string;
  /** Optional description */
  description?: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Column configuration */
  columns?: number;
  /** Explicit column span override */
  colSpan?: number;
  /** Preferred column count */
  preferredColumns?: 1 | 2 | 3 | 4;
  /** Minimum columns */
  minColumns?: 1 | 2 | 3 | 4;
  /** Maximum columns */
  maxColumns?: 1 | 2 | 3 | 4;
  /** Content orientation */
  orientation?: 'vertical' | 'horizontal' | 'auto';
  /** Whether section can grow */
  flexGrow?: boolean;
  /** Whether section can shrink */
  canShrink?: boolean;
  /** Whether section can grow */
  canGrow?: boolean;
  /** Layout priority (1=highest, 3=lowest) */
  layoutPriority?: 1 | 2 | 3;
  /** Priority band */
  priority?: 'critical' | 'important' | 'standard' | 'optional';
  /** Keep visible during scroll */
  sticky?: boolean;
  /** Group ID for related sections */
  groupId?: string;
  /** Preferred column position */
  columnAffinity?: number;
  /** Section width */
  width?: number;
  /** Collapsed state */
  collapsed?: boolean;
  /** Optional emoji */
  emoji?: string;
  /** Additional metadata */
  meta?: Record<string, unknown>;
}

// ============================================================================
// FIELD-BASED SECTIONS
// ============================================================================

/**
 * Info Section - displays key-value pairs
 */
export interface InfoSection extends BaseSectionProps {
  type: 'info';
  fields: CardField[];
  items?: never;
  chartData?: never;
  chartType?: never;
}

/**
 * Analytics Section - displays metrics with trends
 */
export interface AnalyticsSection extends BaseSectionProps {
  type: 'analytics';
  fields: CardField[];
  items?: never;
  chartData?: never;
  chartType?: never;
}

/**
 * Contact Card Section - displays contact information
 */
export interface ContactCardSection extends BaseSectionProps {
  type: 'contact-card';
  fields: CardField[];
  items?: never;
  chartData?: never;
  chartType?: never;
  /** Contact's image URL */
  imageUrl?: string;
  /** Contact's role/title */
  role?: string;
  /** Contact's company */
  company?: string;
}

/**
 * Map Section - displays geographic locations
 */
export interface MapSection extends BaseSectionProps {
  type: 'map';
  fields: CardField[];
  items?: never;
  chartData?: never;
  chartType?: never;
  /** Map center coordinates */
  center?: { lat: number; lng: number };
  /** Map zoom level */
  zoom?: number;
  /** Location markers */
  markers?: Array<{
    lat: number;
    lng: number;
    label?: string;
    popup?: string;
  }>;
}

/**
 * Financials Section - displays financial data
 */
export interface FinancialsSection extends BaseSectionProps {
  type: 'financials';
  fields: CardField[];
  items?: never;
  chartData?: never;
  chartType?: never;
  /** Currency code */
  currency?: string;
  /** Fiscal year */
  fiscalYear?: string;
}

/**
 * Product Section - displays product information
 */
export interface ProductSection extends BaseSectionProps {
  type: 'product';
  fields: CardField[];
  items?: never;
  chartData?: never;
  chartType?: never;
  /** Product image URL */
  imageUrl?: string;
  /** Product price */
  price?: string | number;
  /** Product SKU */
  sku?: string;
}

/**
 * Overview Section - displays summary information
 */
export interface OverviewSection extends BaseSectionProps {
  type: 'overview';
  fields: CardField[];
  items?: never;
  chartData?: never;
  chartType?: never;
  /** Overview text content */
  content?: string;
}

/**
 * Quotation Section - displays quotes
 */
export interface QuotationSection extends BaseSectionProps {
  type: 'quotation';
  fields: CardField[];
  items?: never;
  chartData?: never;
  chartType?: never;
  /** Quote text */
  quote?: string;
  /** Quote author */
  author?: string;
  /** Author title/role */
  authorTitle?: string;
}

/**
 * Text Reference Section - displays reference text
 */
export interface TextReferenceSection extends BaseSectionProps {
  type: 'text-reference';
  fields: CardField[];
  items?: never;
  chartData?: never;
  chartType?: never;
  /** Reference URL */
  url?: string;
  /** Source name */
  source?: string;
}

/**
 * Brand Colors Section - displays brand color palette
 */
export interface BrandColorsSection extends BaseSectionProps {
  type: 'brand-colors';
  fields: CardField[];
  items?: never;
  chartData?: never;
  chartType?: never;
  /** Color palette */
  colors?: Array<{
    name: string;
    hex: string;
    rgb?: string;
  }>;
}

// ============================================================================
// ITEM-BASED SECTIONS
// ============================================================================

/**
 * List Section - displays list of items
 */
export interface ListSection extends BaseSectionProps {
  type: 'list';
  items: CardItem[];
  fields?: never;
  chartData?: never;
  chartType?: never;
  /** List style */
  listStyle?: 'bullet' | 'numbered' | 'none';
}

/**
 * Network Card Section - displays network connections
 */
export interface NetworkCardSection extends BaseSectionProps {
  type: 'network-card';
  items: CardItem[];
  fields?: never;
  chartData?: never;
  chartType?: never;
  /** Network layout type */
  networkLayout?: 'radial' | 'hierarchical' | 'force';
}

/**
 * News Section - displays news articles
 */
export interface NewsSection extends BaseSectionProps {
  type: 'news';
  items: CardItem[];
  fields?: never;
  chartData?: never;
  chartType?: never;
  /** News source filter */
  sourceFilter?: string[];
  /** Date range */
  dateRange?: { start: string; end: string };
}

/**
 * Timeline Section - displays chronological events
 */
export interface TimelineSection extends BaseSectionProps {
  type: 'timeline';
  items: CardItem[];
  fields?: never;
  chartData?: never;
  chartType?: never;
}

/**
 * Gallery Section - displays image galleries
 */
export interface GallerySection extends BaseSectionProps {
  type: 'gallery';
  items: CardItem[];
  fields?: never;
  chartData?: never;
  chartType?: never;
  /** Gallery layout */
  galleryLayout?: 'grid' | 'masonry' | 'carousel';
}

/**
 * FAQ Section - displays frequently asked questions
 */
export interface FaqSection extends BaseSectionProps {
  type: 'faq';
  items: CardItem[];
  fields?: never;
  chartData?: never;
  chartType?: never;
}

/**
 * Video Section - displays video content
 */
export interface VideoSection extends BaseSectionProps {
  type: 'video';
  items: CardItem[];
  fields?: never;
  chartData?: never;
  chartType?: never;
}

// ============================================================================
// MIXED (FIELDS + ITEMS) SECTIONS
// ============================================================================

/**
 * Event Section - displays events/timeline
 */
export interface EventSection extends BaseSectionProps {
  type: 'event';
  fields?: CardField[];
  items?: CardItem[];
  chartData?: never;
  chartType?: never;
  /** Event date */
  date?: string;
  /** Event time */
  time?: string;
  /** Event location */
  location?: string;
  /** Timeline orientation */
  timelineOrientation?: 'vertical' | 'horizontal';
}

/**
 * Solutions Section - displays solutions/features
 */
export interface SolutionsSection extends BaseSectionProps {
  type: 'solutions';
  fields?: CardField[];
  items?: CardItem[];
  chartData?: never;
  chartType?: never;
  /** Solution category */
  category?: string;
}

/**
 * Social Media Section - displays social media content
 */
export interface SocialMediaSection extends BaseSectionProps {
  type: 'social-media';
  fields?: CardField[];
  items?: CardItem[];
  chartData?: never;
  chartType?: never;
  /** Platform filter */
  platforms?: Array<'twitter' | 'linkedin' | 'facebook' | 'instagram'>;
  /** Show engagement metrics */
  showEngagement?: boolean;
}

// ============================================================================
// CHART SECTION
// ============================================================================

/**
 * Chart data structure
 */
export interface ChartData {
  labels?: string[];
  datasets?: Array<{
    label?: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

/**
 * Chart Section - displays data visualizations
 */
export interface ChartSection extends BaseSectionProps {
  type: 'chart';
  chartType: 'bar' | 'line' | 'pie' | 'doughnut';
  chartData: ChartData;
  fields?: never;
  items?: never;
  /** Chart title */
  chartTitle?: string;
  /** Show legend */
  showLegend?: boolean;
  /** Chart height */
  chartHeight?: number;
}

// ============================================================================
// FALLBACK SECTION
// ============================================================================

/**
 * Fallback Section - handles unknown section types
 */
export interface FallbackSection extends BaseSectionProps {
  type: 'fallback';
  fields?: CardField[];
  items?: CardItem[];
  chartData?: ChartData;
  chartType?: 'bar' | 'line' | 'pie' | 'doughnut';
  /** Original type that was not recognized */
  originalType?: string;
}

// ============================================================================
// DISCRIMINATED UNION
// ============================================================================

/**
 * Discriminated union of all section types
 *
 * Use this type when you need exhaustive type checking for section handling.
 * TypeScript will ensure all section types are handled in switch statements.
 */
export type DiscriminatedSection =
  | InfoSection
  | AnalyticsSection
  | ContactCardSection
  | NetworkCardSection
  | MapSection
  | FinancialsSection
  | EventSection
  | ListSection
  | ChartSection
  | ProductSection
  | SolutionsSection
  | OverviewSection
  | QuotationSection
  | TextReferenceSection
  | BrandColorsSection
  | NewsSection
  | SocialMediaSection
  | TimelineSection
  | GallerySection
  | FaqSection
  | VideoSection
  | FallbackSection;

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for Info Section
 */
export function isInfoSection(section: DiscriminatedSection): section is InfoSection {
  return section.type === 'info';
}

/**
 * Type guard for Analytics Section
 */
export function isAnalyticsSection(section: DiscriminatedSection): section is AnalyticsSection {
  return section.type === 'analytics';
}

/**
 * Type guard for Contact Card Section
 */
export function isContactCardSection(section: DiscriminatedSection): section is ContactCardSection {
  return section.type === 'contact-card';
}

/**
 * Type guard for Network Card Section
 */
export function isNetworkCardSection(section: DiscriminatedSection): section is NetworkCardSection {
  return section.type === 'network-card';
}

/**
 * Type guard for Map Section
 */
export function isMapSection(section: DiscriminatedSection): section is MapSection {
  return section.type === 'map';
}

/**
 * Type guard for Financials Section
 */
export function isFinancialsSection(section: DiscriminatedSection): section is FinancialsSection {
  return section.type === 'financials';
}

/**
 * Type guard for Event Section
 */
export function isEventSection(section: DiscriminatedSection): section is EventSection {
  return section.type === 'event';
}

/**
 * Type guard for List Section
 */
export function isListSection(section: DiscriminatedSection): section is ListSection {
  return section.type === 'list';
}

/**
 * Type guard for Chart Section
 */
export function isChartSection(section: DiscriminatedSection): section is ChartSection {
  return section.type === 'chart';
}

/**
 * Type guard for Product Section
 */
export function isProductSection(section: DiscriminatedSection): section is ProductSection {
  return section.type === 'product';
}

/**
 * Type guard for Solutions Section
 */
export function isSolutionsSection(section: DiscriminatedSection): section is SolutionsSection {
  return section.type === 'solutions';
}

/**
 * Type guard for Overview Section
 */
export function isOverviewSection(section: DiscriminatedSection): section is OverviewSection {
  return section.type === 'overview';
}

/**
 * Type guard for Quotation Section
 */
export function isQuotationSection(section: DiscriminatedSection): section is QuotationSection {
  return section.type === 'quotation';
}

/**
 * Type guard for Text Reference Section
 */
export function isTextReferenceSection(section: DiscriminatedSection): section is TextReferenceSection {
  return section.type === 'text-reference';
}

/**
 * Type guard for Brand Colors Section
 */
export function isBrandColorsSection(section: DiscriminatedSection): section is BrandColorsSection {
  return section.type === 'brand-colors';
}

/**
 * Type guard for News Section
 */
export function isNewsSection(section: DiscriminatedSection): section is NewsSection {
  return section.type === 'news';
}

/**
 * Type guard for Social Media Section
 */
export function isSocialMediaSection(section: DiscriminatedSection): section is SocialMediaSection {
  return section.type === 'social-media';
}

/**
 * Type guard for Fallback Section
 */
export function isFallbackSection(section: DiscriminatedSection): section is FallbackSection {
  return section.type === 'fallback';
}

/**
 * Type guard for field-based sections
 */
export function hasFields(section: DiscriminatedSection): section is
  | InfoSection
  | AnalyticsSection
  | ContactCardSection
  | MapSection
  | FinancialsSection
  | ProductSection
  | OverviewSection
  | QuotationSection
  | TextReferenceSection
  | BrandColorsSection {
  return 'fields' in section && Array.isArray(section.fields);
}

/**
 * Type guard for item-based sections
 */
export function hasItems(section: DiscriminatedSection): section is
  | ListSection
  | NetworkCardSection
  | NewsSection {
  return 'items' in section && Array.isArray(section.items);
}

/**
 * Type guard for chart sections
 */
export function hasChartData(section: DiscriminatedSection): section is ChartSection {
  return 'chartData' in section && section.chartData !== undefined;
}

// ============================================================================
// EXHAUSTIVE CHECK HELPER
// ============================================================================

/**
 * Helper for exhaustive switch statements.
 * If TypeScript complains about this function being called,
 * it means you're missing a case in your switch statement.
 *
 * @example
 * ```typescript
 * function handleSection(section: DiscriminatedSection): string {
 *   switch (section.type) {
 *     case 'info': return 'Info';
 *     case 'analytics': return 'Analytics';
 *     // ... all other cases
 *     default:
 *       return assertNever(section);
 *   }
 * }
 * ```
 */
export function assertNever(x: never): never {
  throw new Error(`Unexpected section type: ${(x as any).type}`);
}

/**
 * Map from SectionType to its discriminated section interface.
 * Useful for creating type-safe section handlers.
 */
export type SectionTypeMap = {
  'info': InfoSection;
  'analytics': AnalyticsSection;
  'contact-card': ContactCardSection;
  'network-card': NetworkCardSection;
  'map': MapSection;
  'financials': FinancialsSection;
  'event': EventSection;
  'list': ListSection;
  'chart': ChartSection;
  'product': ProductSection;
  'solutions': SolutionsSection;
  'overview': OverviewSection;
  'quotation': QuotationSection;
  'text-reference': TextReferenceSection;
  'brand-colors': BrandColorsSection;
  'news': NewsSection;
  'social-media': SocialMediaSection;
  'timeline': TimelineSection;
  'gallery': GallerySection;
  'faq': FaqSection;
  'video': VideoSection;
  'fallback': FallbackSection;
};

/**
 * Extract section type from discriminated section
 */
export type ExtractSectionType<T extends DiscriminatedSection> = T['type'];

/**
 * Get discriminated section type from section type string
 */
export type GetDiscriminatedSection<T extends SectionType> = SectionTypeMap[T];



