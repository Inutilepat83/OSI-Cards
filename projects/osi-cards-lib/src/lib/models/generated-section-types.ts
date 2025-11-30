/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 * Generated from section-registry.json
 * Run: npm run generate:from-registry
 */

/**
 * All valid section type identifiers
 */
export type SectionType =
  | 'info'
  | 'analytics'
  | 'contact-card'
  | 'network-card'
  | 'map'
  | 'financials'
  | 'event'
  | 'list'
  | 'chart'
  | 'product'
  | 'solutions'
  | 'overview'
  | 'quotation'
  | 'text-reference'
  | 'brand-colors'
  | 'news'
  | 'social-media'
  | 'fallback';

/**
 * Section type aliases (alternative names that resolve to canonical types)
 */
export type SectionTypeAlias =
  | 'metrics'
  | 'stats'
  | 'timeline'
  | 'table'
  | 'locations'
  | 'quote'
  | 'reference'
  | 'text-ref'
  | 'brands'
  | 'colors'
  | 'project';

/**
 * All accepted section type values (canonical + aliases)
 */
export type SectionTypeInput = SectionType | SectionTypeAlias;

/**
 * Section metadata for runtime use
 */
export interface SectionMetadata {
  name: string;
  usesFields: boolean;
  usesItems: boolean;
  usesChartData: boolean;
  defaultColumns: number;
  supportsCollapse: boolean;
  supportsEmoji: boolean;
  requiresExternalLib: string | undefined;
  selector: string;
}

/**
 * Metadata map for all section types
 */
export const SECTION_METADATA: Record<SectionType, SectionMetadata> = {
  'info': {
    name: 'Info Section',
    usesFields: true,
    usesItems: false,
    usesChartData: false,
    defaultColumns: 1,
    supportsCollapse: true,
    supportsEmoji: true,
    requiresExternalLib: undefined,
    selector: 'app-info-section',
  },
  'analytics': {
    name: 'Analytics Section',
    usesFields: true,
    usesItems: false,
    usesChartData: false,
    defaultColumns: 2,
    supportsCollapse: true,
    supportsEmoji: true,
    requiresExternalLib: undefined,
    selector: 'app-analytics-section',
  },
  'contact-card': {
    name: 'Contact Card Section',
    usesFields: true,
    usesItems: false,
    usesChartData: false,
    defaultColumns: 2,
    supportsCollapse: true,
    supportsEmoji: false,
    requiresExternalLib: undefined,
    selector: 'app-contact-card-section',
  },
  'network-card': {
    name: 'Network Card Section',
    usesFields: false,
    usesItems: true,
    usesChartData: false,
    defaultColumns: 1,
    supportsCollapse: true,
    supportsEmoji: false,
    requiresExternalLib: undefined,
    selector: 'app-network-card-section',
  },
  'map': {
    name: 'Map Section',
    usesFields: true,
    usesItems: false,
    usesChartData: false,
    defaultColumns: 1,
    supportsCollapse: false,
    supportsEmoji: false,
    requiresExternalLib: 'leaflet',
    selector: 'app-map-section',
  },
  'financials': {
    name: 'Financials Section',
    usesFields: true,
    usesItems: false,
    usesChartData: false,
    defaultColumns: 2,
    supportsCollapse: true,
    supportsEmoji: false,
    requiresExternalLib: undefined,
    selector: 'app-financials-section',
  },
  'event': {
    name: 'Event Section',
    usesFields: true,
    usesItems: true,
    usesChartData: false,
    defaultColumns: 1,
    supportsCollapse: true,
    supportsEmoji: true,
    requiresExternalLib: undefined,
    selector: 'app-event-section',
  },
  'list': {
    name: 'List Section',
    usesFields: false,
    usesItems: true,
    usesChartData: false,
    defaultColumns: 1,
    supportsCollapse: true,
    supportsEmoji: true,
    requiresExternalLib: undefined,
    selector: 'app-list-section',
  },
  'chart': {
    name: 'Chart Section',
    usesFields: false,
    usesItems: false,
    usesChartData: true,
    defaultColumns: 2,
    supportsCollapse: false,
    supportsEmoji: false,
    requiresExternalLib: 'chart.js',
    selector: 'app-chart-section',
  },
  'product': {
    name: 'Product Section',
    usesFields: true,
    usesItems: false,
    usesChartData: false,
    defaultColumns: 1,
    supportsCollapse: true,
    supportsEmoji: true,
    requiresExternalLib: undefined,
    selector: 'app-product-section',
  },
  'solutions': {
    name: 'Solutions Section',
    usesFields: true,
    usesItems: true,
    usesChartData: false,
    defaultColumns: 1,
    supportsCollapse: true,
    supportsEmoji: false,
    requiresExternalLib: undefined,
    selector: 'app-solutions-section',
  },
  'overview': {
    name: 'Overview Section',
    usesFields: true,
    usesItems: false,
    usesChartData: false,
    defaultColumns: 1,
    supportsCollapse: false,
    supportsEmoji: true,
    requiresExternalLib: undefined,
    selector: 'app-overview-section',
  },
  'quotation': {
    name: 'Quotation Section',
    usesFields: true,
    usesItems: false,
    usesChartData: false,
    defaultColumns: 1,
    supportsCollapse: true,
    supportsEmoji: false,
    requiresExternalLib: undefined,
    selector: 'app-quotation-section',
  },
  'text-reference': {
    name: 'Text Reference Section',
    usesFields: true,
    usesItems: false,
    usesChartData: false,
    defaultColumns: 1,
    supportsCollapse: true,
    supportsEmoji: false,
    requiresExternalLib: undefined,
    selector: 'app-text-reference-section',
  },
  'brand-colors': {
    name: 'Brand Colors Section',
    usesFields: true,
    usesItems: false,
    usesChartData: false,
    defaultColumns: 2,
    supportsCollapse: true,
    supportsEmoji: false,
    requiresExternalLib: undefined,
    selector: 'app-brand-colors-section',
  },
  'news': {
    name: 'News Section',
    usesFields: false,
    usesItems: true,
    usesChartData: false,
    defaultColumns: 1,
    supportsCollapse: true,
    supportsEmoji: false,
    requiresExternalLib: undefined,
    selector: 'app-news-section',
  },
  'social-media': {
    name: 'Social Media Section',
    usesFields: true,
    usesItems: true,
    usesChartData: false,
    defaultColumns: 1,
    supportsCollapse: true,
    supportsEmoji: true,
    requiresExternalLib: undefined,
    selector: 'app-social-media-section',
  },
  'fallback': {
    name: 'Fallback Section',
    usesFields: true,
    usesItems: true,
    usesChartData: false,
    defaultColumns: 1,
    supportsCollapse: true,
    supportsEmoji: true,
    requiresExternalLib: undefined,
    selector: 'app-fallback-section',
  }
};

/**
 * Map of type aliases to canonical types
 */
export const SECTION_TYPE_ALIASES: Record<SectionTypeAlias, SectionType> = {
  'metrics': 'analytics',
  'stats': 'analytics',
  'timeline': 'event',
  'table': 'list',
  'locations': 'map',
  'quote': 'quotation',
  'reference': 'text-reference',
  'text-ref': 'text-reference',
  'brands': 'brand-colors',
  'colors': 'brand-colors',
  'project': 'info'
};

/**
 * Resolve a section type input to its canonical type
 */
export function resolveSectionType(type: SectionTypeInput): SectionType {
  if (type in SECTION_TYPE_ALIASES) {
    return SECTION_TYPE_ALIASES[type as SectionTypeAlias];
  }
  return type as SectionType;
}

/**
 * Check if a string is a valid section type
 */
export function isValidSectionType(type: string): type is SectionTypeInput {
  return type in SECTION_METADATA || type in SECTION_TYPE_ALIASES;
}

/**
 * Get metadata for a section type
 */
export function getSectionMetadata(type: SectionTypeInput): SectionMetadata | undefined {
  const resolved = resolveSectionType(type);
  return SECTION_METADATA[resolved];
}

/**
 * All public section types (excluding internal ones)
 */
export const PUBLIC_SECTION_TYPES: SectionType[] = [
  'info',
  'analytics',
  'contact-card',
  'network-card',
  'map',
  'financials',
  'event',
  'list',
  'chart',
  'product',
  'solutions',
  'overview',
  'quotation',
  'text-reference',
  'brand-colors',
  'news',
  'social-media'
];

/**
 * All section types (including internal)
 */
export const ALL_SECTION_TYPES: SectionType[] = [
  'info',
  'analytics',
  'contact-card',
  'network-card',
  'map',
  'financials',
  'event',
  'list',
  'chart',
  'product',
  'solutions',
  'overview',
  'quotation',
  'text-reference',
  'brand-colors',
  'news',
  'social-media',
  'fallback'
];
